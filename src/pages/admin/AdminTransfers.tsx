import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { Tables } from '@/integrations/supabase/types';
import { 
  Search, 
  User, 
  ArrowRightLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from 'date-fns';
import { StatsGridSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';

const statusConfig = {
  pending: { label: 'Pending', color: 'secondary' as const },
  approved: { label: 'Approved', color: 'default' as const },
  rejected: { label: 'Rejected', color: 'destructive' as const }
};

export function AdminTransfers() {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<Tables<'transfers'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTransfer, setSelectedTransfer] = useState<Tables<'transfers'> | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState('');
  const [selectedToSupervisor, setSelectedToSupervisor] = useState('');
  const [supervisors, setSupervisors] = useState<Array<{id: string, name: string}>>([]);

  // Fetch transfers with basic data first
  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Unable to connect to database');
    }
    setLoading(false);
  };

  // Fetch supervisors for assignment
  const fetchSupervisors = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'supervisor')
        .eq('account_status', 'approved')
        .order('full_name');

      setSupervisors(data?.map(s => ({id: s.id, name: s.full_name})) || []);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchSupervisors();
  }, []);
  
  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Process transfer request
  const handleProcessTransfer = async () => {
    if (!selectedTransfer) return;

    setProcessing(true);
    try {
      const updates: any = {
        status: processAction,
        processed_by: profile?.id,
        processed_at: new Date().toISOString(),
        admin_comment: adminComment
      };

      if (processAction === 'approve' && selectedToSupervisor) {
        updates.to_supervisor = selectedToSupervisor;
      }

      const { error } = await supabase
        .from('transfers')
        .update(updates)
        .eq('id', selectedTransfer.id);

      if (error) throw error;

      toast.success(`Transfer request ${processAction}d successfully`);
      
      setShowProcessModal(false);
      setSelectedTransfer(null);
      setAdminComment('');
      setSelectedToSupervisor('');
      await fetchTransfers();
    } catch (error: any) {
      console.error('Error processing transfer:', error);
      toast.error(`Failed to ${processAction} transfer request: ${error.message}`);
    }
    setProcessing(false);
  };

  // Calculate stats
  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    rejected: transfers.filter(t => t.status === 'rejected').length
  };

  const openProcessModal = (transfer: Tables<'transfers'>, action: 'approve' | 'reject') => {
    setSelectedTransfer(transfer);
    setProcessAction(action);
    setAdminComment('');
    setSelectedToSupervisor('');
    setShowProcessModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Management</h1>
          <p className="text-muted-foreground">
            Manage field officer transfer requests between supervisors
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      {loading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
          <Input
                placeholder="Search by reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
          />
        </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
      </div>
        </CardContent>
      </Card>
      
      {/* Transfers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton 
              columns={8} 
              rows={5}
              headers={['Request ID', 'Officer ID', 'From Supervisor', 'To Supervisor', 'Reason', 'Status', 'Requested', 'Actions']}
            />
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No transfer requests found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Officer ID</TableHead>
                    <TableHead>From Supervisor</TableHead>
                    <TableHead>To Supervisor</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                        <div className="font-medium text-sm">
                          {transfer.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium text-sm">
                          {transfer.officer_id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium text-sm">
                          {transfer.from_supervisor.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {transfer.to_supervisor ? (
                          <div className="font-medium text-sm">
                            {transfer.to_supervisor.slice(0, 8)}...
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">To be assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                        <p className="text-sm max-w-48 truncate" title={transfer.reason}>
                          {transfer.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[transfer.status as keyof typeof statusConfig].color}>
                          {statusConfig[transfer.status as keyof typeof statusConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(transfer.created_at), 'MMM d, yyyy')}
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
                          <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransfer(transfer);
                                setShowDetailsModal(true);
                              }}
                          >
                              View Details
                          </DropdownMenuItem>
                          {transfer.status === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                  onClick={() => openProcessModal(transfer, 'approve')}
                              >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                  onClick={() => openProcessModal(transfer, 'reject')}
                              >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transfer Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Officer ID</Label>
                  <p className="text-sm mt-1">{selectedTransfer.officer_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedTransfer.status as keyof typeof statusConfig].color}>
                      {statusConfig[selectedTransfer.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Reason for Transfer</Label>
                <p className="text-sm mt-1">{selectedTransfer.reason}</p>
                </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">From Supervisor</Label>
                  <p className="text-sm mt-1">{selectedTransfer.from_supervisor}</p>
                    </div>
                    <div>
                  <Label className="text-sm font-medium">To Supervisor</Label>
                  <p className="text-sm mt-1">
                    {selectedTransfer.to_supervisor || 'To be assigned'}
                  </p>
                      </div>
                      </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Requested</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedTransfer.created_at), 'PPP')}
                  </p>
                        </div>
                {selectedTransfer.processed_at && (
                  <div>
                    <Label className="text-sm font-medium">Processed</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedTransfer.processed_at), 'PPP')}
                    </p>
                  </div>
                )}
              </div>

              {selectedTransfer.admin_comment && (
                <div>
                  <Label className="text-sm font-medium">Admin Comment</Label>
                  <p className="text-sm mt-1">{selectedTransfer.admin_comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Transfer Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'approve' ? 'Approve' : 'Reject'} Transfer Request
            </DialogTitle>
            <DialogDescription>
              {processAction === 'approve' 
                ? 'Approve this transfer request and assign a new supervisor'
                : 'Reject this transfer request with a reason'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {processAction === 'approve' && (
              <div>
                <Label htmlFor="to_supervisor">Assign to Supervisor</Label>
                <Select value={selectedToSupervisor} onValueChange={setSelectedToSupervisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="admin_comment">
                Admin Comment {processAction === 'reject' && '(Required)'}
              </Label>
              <Textarea
                id="admin_comment"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder={
                  processAction === 'approve' 
                    ? 'Optional notes about the approval...'
                    : 'Reason for rejection (required)...'
                }
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessTransfer} 
              disabled={
                processing || 
                (processAction === 'approve' && !selectedToSupervisor) ||
                (processAction === 'reject' && !adminComment.trim())
              }
              variant={processAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? 'Processing...' : processAction === 'approve' ? 'Approve Transfer' : 'Reject Request'}
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 