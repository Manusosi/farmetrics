import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  Plus, 
  MapPin, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Activity,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ghanaRegions } from '@/data/ghanaRegions';
import { notificationService } from '@/services/notificationService';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';

interface Supervisor {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
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
}

export function AdminSupervisors() {
  const { profile } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRegionDialog, setShowRegionDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Fetch supervisors data - will refetch when navigating to this page
  const fetchSupervisors = async () => {
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
          region,
          district,
          location,
          account_status,
          created_at,
          approved_at,
          approved_by,
          is_active
        `)
        .eq('role', 'supervisor')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching supervisors:', error);
        toast.error('Failed to load supervisors');
        return;
      }

      setSupervisors(data || []);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      toast.error('Failed to load supervisors');
    }
    setLoading(false);
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchSupervisors);

  // Handle supervisor approval/rejection
  const handleApproval = async () => {
    if (!selectedSupervisor) return;

    setProcessing(true);
    try {
      const updates: any = {
        account_status: approvalAction === 'approve' ? 'approved' : 'rejected',
        approved_by: profile?.id,
        approved_at: new Date().toISOString()
      };

      if (approvalAction === 'approve' && selectedRegion) {
        updates.region = selectedRegion;
        updates.district = selectedDistrict;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedSupervisor.id);

      if (error) throw error;

      toast.success(`Supervisor ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Send notification when approving new supervisors
      if (approvalAction === 'approve') {
        try {
          await notificationService.notifySupervisorSignup(
            selectedSupervisor.full_name,
            selectedSupervisor.email || 'No email'
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
      
      setShowApprovalDialog(false);
      setSelectedSupervisor(null);
      await fetchSupervisors();
    } catch (error: any) {
      console.error('Error updating supervisor:', error);
      toast.error(`Failed to ${approvalAction} supervisor: ${error.message}`);
    }
    setProcessing(false);
  };

  // Handle region assignment
  const handleRegionAssignment = async () => {
    if (!selectedSupervisor || !selectedRegion) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          region: selectedRegion,
          district: selectedDistrict,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSupervisor.id);

      if (error) throw error;

      toast.success('Region assignment updated successfully');
      setShowRegionDialog(false);
      setSelectedSupervisor(null);
      await fetchSupervisors();
    } catch (error: any) {
      console.error('Error updating region assignment:', error);
      toast.error(`Failed to update assignment: ${error.message}`);
    }
    setProcessing(false);
  };

  // Filter supervisors
  const filteredSupervisors = supervisors.filter(supervisor => {
    const matchesSearch = 
      supervisor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.region?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'pending' && supervisor.account_status === 'pending') ||
      (activeTab === 'approved' && supervisor.account_status === 'approved') ||
      (activeTab === 'active' && supervisor.is_active);

    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const pendingCount = supervisors.filter(s => s.account_status === 'pending').length;
  const approvedCount = supervisors.filter(s => s.account_status === 'approved').length;
  const activeCount = supervisors.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervisor Management</h1>
          <p className="text-muted-foreground">
            Manage supervisor accounts, approvals, and regional assignments
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Supervisors</CardTitle>
          <CardDescription>
            Review applications, approve supervisors, and manage regional assignments
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
            <TabsList>
              <TabsTrigger value="all">All ({supervisors.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <TableSkeleton />
              ) : filteredSupervisors.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No supervisors found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Region/District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSupervisors.map((supervisor) => (
                      <TableRow key={supervisor.id}>
                        <TableCell className="font-medium">{supervisor.full_name}</TableCell>
                        <TableCell>{supervisor.email || 'Email not available'}</TableCell>
                        <TableCell>{supervisor.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          {supervisor.region ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{supervisor.region}</span>
                              {supervisor.district && (
                                <span className="text-xs text-muted-foreground">
                                  , {supervisor.district}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              supervisor.account_status === 'approved' ? 'default' :
                              supervisor.account_status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {supervisor.account_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(supervisor.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {supervisor.account_status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSupervisor(supervisor);
                                      setApprovalAction('approve');
                                      setShowApprovalDialog(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSupervisor(supervisor);
                                      setApprovalAction('reject');
                                      setShowApprovalDialog(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSupervisor(supervisor);
                                  setSelectedRegion(supervisor.region || '');
                                  setSelectedDistrict(supervisor.district || '');
                                  setShowRegionDialog(true);
                                }}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Assign Region
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Supervisor
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? `Approve ${selectedSupervisor?.full_name} as a supervisor?`
                : `Reject ${selectedSupervisor?.full_name}'s supervisor application?`
              }
            </DialogDescription>
          </DialogHeader>
          
          {approvalAction === 'approve' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="region">Assign Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ghanaRegions).map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRegion && (
                <div className="grid gap-2">
                  <Label htmlFor="district">Assign District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {ghanaRegions[selectedRegion as keyof typeof ghanaRegions]?.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              onClick={handleApproval}
              disabled={processing || (approvalAction === 'approve' && !selectedRegion)}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Region Assignment Dialog */}
      <Dialog open={showRegionDialog} onOpenChange={setShowRegionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Region</DialogTitle>
            <DialogDescription>
              Update regional assignment for {selectedSupervisor?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="region">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ghanaRegions).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRegion && (
              <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {ghanaRegions[selectedRegion as keyof typeof ghanaRegions]?.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegionDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegionAssignment}
              disabled={processing || !selectedRegion}
            >
              {processing ? 'Updating...' : 'Update Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 