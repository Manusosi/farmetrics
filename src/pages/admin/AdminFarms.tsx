import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search, 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Trees,
  BarChart3,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Farm {
  id: string;
  farm_name: string;
  crop_type: string;
  region: string;
  district: string;
  location?: string;
  farm_size_approx?: number;
  soil_type?: string;
  humidity?: number;
  total_area?: number;
  visit_count?: number;
  last_visit_date?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  polygon_coordinates?: any;
  farmer_id?: string;
  assigned_officer_id?: string;
  farmer?: {
    name: string;
    phone_number?: string;
  };
  officer?: {
    full_name: string;
  };
  visits_count?: number;
  last_visit?: string;
}

interface FarmDetailsModalProps {
  farm: Farm | null;
  isOpen: boolean;
  onClose: () => void;
}

function FarmDetailsModal({ farm, isOpen, onClose }: FarmDetailsModalProps) {
  if (!farm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trees className="h-5 w-5 text-green-600" />
            {farm.farm_name}
          </DialogTitle>
          <DialogDescription>
            Complete farm details and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Farm ID</Label>
              <p className="text-sm text-muted-foreground">{farm.id}</p>
            </div>
            <div>
              <Label className="font-medium">Status</Label>
              <div className="mt-1">
                <Badge variant={
                  farm.status === 'approved' ? 'default' : 
                  farm.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {farm.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="font-medium">Location</Label>
              <p className="text-sm text-muted-foreground">{farm.farm_location || 'Not specified'}</p>
            </div>
            <div>
              <Label className="font-medium">Size</Label>
              <p className="text-sm text-muted-foreground">
                {farm.farm_size || farm.farm_size_approx || 'Not specified'} hectares
              </p>
            </div>
          </div>

          {/* Environmental Data */}
          <div>
            <Label className="font-medium mb-2 block">Environmental Conditions</Label>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm">Soil Type</Label>
                <p className="text-sm text-muted-foreground">{farm.soil_type || 'Not recorded'}</p>
              </div>
              <div>
                <Label className="text-sm">Humidity</Label>
                <p className="text-sm text-muted-foreground">
                  {farm.humidity ? `${farm.humidity}%` : 'Not recorded'}
                </p>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div>
            <Label className="font-medium mb-2 block">Assignments</Label>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm">Farmer</Label>
                <p className="text-sm text-muted-foreground">{farm.farmer?.name || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-sm">Field Officer</Label>
                <p className="text-sm text-muted-foreground">{farm.officer?.full_name || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Visit Statistics */}
          <div>
            <Label className="font-medium mb-2 block">Visit History</Label>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm">Total Visits</Label>
                <p className="text-sm text-muted-foreground">{farm.visits_count || 0}</p>
              </div>
              <div>
                <Label className="text-sm">Last Visit</Label>
                <p className="text-sm text-muted-foreground">
                  {farm.last_visit ? format(new Date(farm.last_visit), 'MMM dd, yyyy') : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Polygon Data */}
          {farm.polygon_coordinates && (
            <div>
              <Label className="font-medium mb-2 block">GPS Polygon Data</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Polygon coordinates available ({farm.polygon_coordinates.length || 0} points)
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <Label className="font-medium mb-2 block">Timeline</Label>
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>Created:</span>
                <span>{format(new Date(farm.created_at), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              {farm.approved_at && (
                <div className="flex justify-between text-sm">
                  <span>Approved:</span>
                  <span>{format(new Date(farm.approved_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminFarms() {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch farms with related data
  const fetchFarms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          id,
          farm_name,
          crop_type,
          region,
          district,
          location,
          farm_size_approx,
          soil_type,
          humidity,
          total_area,
          visit_count,
          last_visit_date,
          is_approved,
          created_at,
          updated_at,
          polygon_coordinates,
          farmer_id,
          assigned_officer_id,
          farmers (
            name,
            phone_number
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get visit counts for each farm
      const farmsWithStats = await Promise.all(
        (data || []).map(async (farm) => {
          const { count: visits_count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', farm.id);

          // Get last visit date
          const { data: lastVisit } = await supabase
            .from('visits')
            .select('visit_date')
            .eq('farm_id', farm.id)
            .order('visit_date', { ascending: false })
            .limit(1);

          return {
            ...farm,
            farmer: farm.farmers,
            officer: farm.profiles,
            visits_count: visits_count || 0,
            last_visit: lastVisit?.[0]?.visit_date || null
          };
        })
      );

      setFarms(farmsWithStats);
    } catch (error: any) {
      console.error('Error fetching farms:', error);
      // Don't show toast for empty data - UI already shows appropriate message
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook to refetch data when navigating to this page
  useNavigationRefresh(fetchFarms);

  // Filter farms based on tab and search
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farm_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && farm.status === 'pending') ||
      (activeTab === 'approved' && farm.status === 'approved') ||
      (activeTab === 'rejected' && farm.status === 'rejected');

    return matchesSearch && matchesTab;
  });

  // Handle approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedFarm || !profile) return;

    setProcessing(true);
    try {
      const updates: any = {
        status: approvalAction === 'approve' ? 'approved' : 'rejected',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('farms')
        .update(updates)
        .eq('id', selectedFarm.id);

      if (error) throw error;

      toast.success(
        `Farm ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`
      );

      await fetchFarms();
      setShowApprovalDialog(false);
      setSelectedFarm(null);
      setAdminComment('');
      // refreshNavigation(); // Refresh navigation to update tab counts
    } catch (error: any) {
      console.error('Error processing farm approval:', error);
      toast.error(`Failed to ${approvalAction} farm`);
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (farm: Farm, action: 'approve' | 'reject') => {
    setSelectedFarm(farm);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const openDetailsModal = (farm: Farm) => {
    setSelectedFarm(farm);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = farms.filter(f => f.status === 'pending').length;
  const approvedCount = farms.filter(f => f.status === 'approved').length;
  const rejectedCount = farms.filter(f => f.status === 'rejected').length;
  const totalArea = farms
    .filter(f => f.status === 'approved')
    .reduce((acc, f) => acc + (f.farm_size || f.farm_size_approx || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farm Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all registered farms, review new submissions, and approve farm data
          </p>
        </div>
      </div>



      {/* Tabs and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Database</CardTitle>
          <CardDescription>
            Review farm registrations, approve new submissions, and manage farm data
          </CardDescription>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search by farm name, location, or farmer..."
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
              <TabsTrigger value="all">All Farms ({farms.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-yellow-600">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-green-600">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-red-600">
                Rejected ({rejectedCount})
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
                  <TableHead>Farm Details</TableHead>
                        <TableHead>Location & Size</TableHead>
                        <TableHead>Farmer & Officer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visits</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                      {filteredFarms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Trees className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No farms found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFarms.map((farm) => (
                  <TableRow key={farm.id}>
                    <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{farm.farm_name}</span>
                                <span className="text-sm text-muted-foreground">
                                  ID: {farm.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {farm.farm_location && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3" />
                                    {farm.farm_location}
                        </div>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {farm.farm_size || farm.farm_size_approx || 'Unknown'} hectares
                                </span>
                      </div>
                    </TableCell>
                    <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {farm.farmer?.name || 'Unassigned'}
                        </div>
                                <span className="text-muted-foreground">
                                  Officer: {farm.officer?.full_name || 'Unassigned'}
                                </span>
                      </div>
                    </TableCell>
                    <TableCell>
                              {getStatusBadge(farm.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <span>{farm.visits_count || 0} visits</span>
                                <span className="text-muted-foreground">
                                  {farm.last_visit ? 
                                    `Last: ${format(new Date(farm.last_visit), 'MMM dd')}` : 
                                    'Never visited'
                                  }
                                </span>
                              </div>
                    </TableCell>
                    <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                                {format(new Date(farm.created_at), 'MMM dd, yyyy')}
                        </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetailsModal(farm)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {farm.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openApprovalDialog(farm, 'approve')}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openApprovalDialog(farm, 'reject')}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                      </div>
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

      {/* Farm Details Modal */}
      <FarmDetailsModal 
        farm={selectedFarm}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

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
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Farm
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Approve this farm registration and add it to the active farm database.'
                : 'Reject this farm registration. Please provide a reason for rejection.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedFarm && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Farm Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedFarm.farm_name}</div>
                  <div><strong>Location:</strong> {selectedFarm.farm_location || 'Not specified'}</div>
                  <div><strong>Size:</strong> {selectedFarm.farm_size || selectedFarm.farm_size_approx || 'Not specified'} hectares</div>
                  <div><strong>Farmer:</strong> {selectedFarm.farmer?.name || 'Unassigned'}</div>
                </div>
              </div>

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
                  {approvalAction === 'approve' ? 'Approve Farm' : 'Reject Registration'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 