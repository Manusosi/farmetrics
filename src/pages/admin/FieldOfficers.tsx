import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  Shield,
  Users,
  UserCheck,
  Sprout,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';

interface FieldOfficer {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  gender?: string;
  region?: string;
  district?: string;
  location?: string;
  account_status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  is_active: boolean;
  email?: string;
  assignedFarms?: number;
  lastActive?: string;
  submissionsToday?: number;
}

export function FieldOfficers() {
  const { profile } = useAuth();
  const [officers, setOfficers] = useState<FieldOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState<FieldOfficer | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showFarmAssignDialog, setShowFarmAssignDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState('');
  const [assignedRegion, setAssignedRegion] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [availableFarms, setAvailableFarms] = useState<any[]>([]);
  const [selectedFarms, setSelectedFarms] = useState<string[]>([]);

  // Fetch field officers
  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone_number,
          gender,
          region,
          district,
          location,
          account_status,
          created_at,
          approved_at,
          approved_by,
          is_active
        `)
        .eq('role', 'field_officer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional stats for each officer
      const officersWithDetails = await Promise.all(
        (data || []).map(async (officer) => {
          // Get assigned farms count
          const { count: assignedFarms } = await supabase
            .from('farms')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_officer_id', officer.id);

          // Get recent visits count
          const { count: submissionsToday } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('officer_id', officer.id)
            .gte('created_at', new Date().toISOString().split('T')[0]);

          return {
            ...officer,
            assignedFarms: assignedFarms || 0,
            submissionsToday: submissionsToday || 0,
            lastActive: officer.is_active ? 'Online' : 'Offline'
          };
        })
      );

      setOfficers(officersWithDetails);
    } catch (error: any) {
      console.error('Error fetching officers:', error);
      // Don't show toast error for empty data scenarios - users expect empty tables initially
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  // Filter officers based on tab and search
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.region?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && officer.account_status === 'pending') ||
      (activeTab === 'approved' && officer.account_status === 'approved') ||
      (activeTab === 'active' && officer.is_active);

    return matchesSearch && matchesTab;
  });

  // Handle approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedOfficer || !profile) return;

    setProcessing(true);
    try {
      const updates: any = {
        account_status: approvalAction === 'approve' ? 'approved' : 'rejected',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      };

      if (approvalAction === 'approve' && assignedRegion) {
        updates.region = assignedRegion;
        updates.is_active = true;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedOfficer.id);

      if (error) throw error;

      toast.success(
        `Field officer ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`
      );

      // Send notification when approving new field officers
      if (approvalAction === 'approve') {
        try {
          await notificationService.notifyFieldOfficerSignup(
            selectedOfficer.full_name,
            selectedOfficer.email || 'No email'
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      await fetchOfficers();
      setShowApprovalDialog(false);
      setSelectedOfficer(null);
      setAdminComment('');
      setAssignedRegion('');
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error(`Failed to ${approvalAction} field officer`);
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (officer: FieldOfficer, action: 'approve' | 'reject') => {
    setSelectedOfficer(officer);
    setApprovalAction(action);
    setAssignedRegion(officer.region || '');
    setShowApprovalDialog(true);
  };

  // Fetch available farms for assignment
  const fetchAvailableFarms = async (officerRegion?: string) => {
    try {
      let query = supabase
        .from('farms')
        .select(`
          id,
          farm_name,
          region,
          district,
          farmer_id,
          farmers(name),
          assigned_officer_id,
          is_approved
        `)
        .eq('is_approved', true);

      if (officerRegion) {
        query = query.eq('region', officerRegion);
      }

      const { data, error } = await query.order('farm_name');

      if (error) throw error;
      setAvailableFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
      toast.error('Failed to load available farms');
    }
  };

  // Handle farm assignment
  const handleFarmAssignment = async () => {
    if (!selectedOfficer || selectedFarms.length === 0) return;

    setProcessing(true);
    try {
      // Update selected farms to assign them to the officer
      const { error } = await supabase
        .from('farms')
        .update({ 
          assigned_officer_id: selectedOfficer.id,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedFarms);

      if (error) throw error;

      toast.success(`${selectedFarms.length} farm(s) assigned successfully`);
      setShowFarmAssignDialog(false);
      setSelectedOfficer(null);
      setSelectedFarms([]);
      await fetchOfficers();
    } catch (error: any) {
      console.error('Error assigning farms:', error);
      toast.error(`Failed to assign farms: ${error.message}`);
    }
    setProcessing(false);
  };

  // Open farm assignment dialog
  const openFarmAssignDialog = async (officer: FieldOfficer) => {
    setSelectedOfficer(officer);
    setSelectedFarms([]);
    await fetchAvailableFarms(officer.region);
    setShowFarmAssignDialog(true);
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    if (status === 'approved') {
      return isActive ? 
        <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge> :
        <Badge variant="outline"><UserCheck className="w-3 h-3 mr-1" />Approved</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const regions = [
    'Greater Accra', 'Ashanti', 'Northern', 'Eastern', 'Western', 'Central',
    'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Western North',
    'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
  ];

  const pendingCount = officers.filter(o => o.account_status === 'pending').length;
  const approvedCount = officers.filter(o => o.account_status === 'approved').length;
  const activeCount = officers.filter(o => o.is_active).length;
  const totalSubmissions = officers.reduce((acc, o) => acc + (o.submissionsToday || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Officers</h1>
        <p className="text-muted-foreground">
            Manage field officer accounts, approvals, and performance monitoring
        </p>
      </div>
      </div>



      {/* Tabs and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Field Officer Management</CardTitle>
          <CardDescription>
            Review applications, approve new officers, and monitor performance
          </CardDescription>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search by name, email, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Officers ({officers.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-yellow-600">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-green-600">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-blue-600">
                Active ({activeCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <TableSkeleton />
              ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                        <TableHead>Officer Details</TableHead>
                        <TableHead>Contact & Location</TableHead>
                        <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                      {filteredOfficers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <User className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No field officers found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOfficers.map((officer) => (
                  <TableRow key={officer.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{officer.full_name}</span>
                                {officer.gender && (
                                  <span className="text-sm text-muted-foreground capitalize">
                                    {officer.gender}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {officer.email || 'Email not available'}
                                </div>
                                {officer.phone_number && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3" />
                                    {officer.phone_number}
                                  </div>
                                )}
                                {officer.region && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3" />
                                    {officer.region}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <span>Farms: {officer.assignedFarms}</span>
                                <span>Today: {officer.submissionsToday} submissions</span>
                                <span className={officer.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                                  {officer.lastActive}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(officer.account_status, officer.is_active)}
                            </TableCell>
                    <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(officer.created_at), 'MMM dd, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {officer.account_status === 'pending' ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openApprovalDialog(officer, 'approve')}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openApprovalDialog(officer, 'reject')}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : officer.account_status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openFarmAssignDialog(officer)}
                                >
                                  <Sprout className="h-3 w-3 mr-1" />
                                  Assign Farms
                                </Button>
                              )}
                    </TableCell>
                  </TableRow>
                        ))
                      )}
              </TableBody>
            </Table>
          </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Field Officer
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Approve this field officer application and assign them to a region.'
                : 'Reject this field officer application. They will be notified of the decision.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedOfficer && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Officer Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedOfficer.full_name}</div>
                  <div><strong>Email:</strong> {selectedOfficer.email}</div>
                  <div><strong>Phone:</strong> {selectedOfficer.phone_number}</div>
                  <div><strong>Region:</strong> {selectedOfficer.region}</div>
                  <div><strong>District:</strong> {selectedOfficer.district}</div>
                </div>
              </div>

              {approvalAction === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="assigned-region">Assign Region</Label>
                  <Select value={assignedRegion} onValueChange={setAssignedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-comment">
                  Admin Notes {approvalAction === 'reject' && '(Required)'}
                </Label>
                <Textarea
                  id="admin-comment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={
                    approvalAction === 'approve' 
                      ? 'Optional notes about the approval...'
                      : 'Reason for rejection (required)...'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprovalAction}
              disabled={
                processing || 
                (approvalAction === 'approve' && !assignedRegion) ||
                (approvalAction === 'reject' && !adminComment.trim())
              }
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {approvalAction === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {approvalAction === 'approve' ? 'Approve Officer' : 'Reject Application'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Farm Assignment Dialog */}
      <Dialog open={showFarmAssignDialog} onOpenChange={setShowFarmAssignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              Assign Farms to {selectedOfficer?.full_name}
            </DialogTitle>
            <DialogDescription>
              Select farms in {selectedOfficer?.region} region to assign to this field officer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {availableFarms.length === 0 ? (
              <div className="text-center py-8">
                <Sprout className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No available farms in this region</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">
                    Available Farms ({availableFarms.filter(farm => !farm.assigned_officer_id).length})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const unassignedFarms = availableFarms.filter(farm => !farm.assigned_officer_id).map(farm => farm.id);
                      setSelectedFarms(selectedFarms.length === unassignedFarms.length ? [] : unassignedFarms);
                    }}
                  >
                    {selectedFarms.length === availableFarms.filter(farm => !farm.assigned_officer_id).length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                
                {availableFarms.map((farm) => (
                  <div 
                    key={farm.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      farm.assigned_officer_id ? 'bg-muted/50 opacity-60' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedFarms.includes(farm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFarms([...selectedFarms, farm.id]);
                          } else {
                            setSelectedFarms(selectedFarms.filter(id => id !== farm.id));
                          }
                        }}
                        disabled={!!farm.assigned_officer_id}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{farm.farm_name}</span>
                          {farm.assigned_officer_id && (
                            <Badge variant="secondary" className="text-xs">
                              Already Assigned
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Farmer: {farm.farmers?.name || 'Farmer name not available'}</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {farm.district}, {farm.region}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFarmAssignDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFarmAssignment}
              disabled={processing || selectedFarms.length === 0}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign {selectedFarms.length} Farm{selectedFarms.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
