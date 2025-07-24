import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { Tables } from '@/integrations/supabase/types';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  MessageSquare,
  MapPin,
  Loader2,
  MoreVertical,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface Issue extends Tables<'issues'> {
  farm: {
    farm_name: string;
    region: string;
    district: string;
    farmer: {
      name: string;
    };
  };
  reported_by_profile: {
    full_name: string;
    role: string;
  };
  assigned_to_profile?: {
    full_name: string;
  };
}

const statusConfig = {
  open: { label: 'Open', color: 'destructive' as const },
  'in-progress': { label: 'In Progress', color: 'secondary' as const },
  resolved: { label: 'Resolved', color: 'default' as const },
  closed: { label: 'Closed', color: 'outline' as const }
};

const priorityConfig = {
  low: { label: 'Low', color: 'outline' as const },
  medium: { label: 'Medium', color: 'secondary' as const },
  high: { label: 'High', color: 'destructive' as const },
  critical: { label: 'Critical', color: 'destructive' as const }
};

export function AdminIssues() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    assigned_to: '',
    admin_comment: ''
  });
  const [supervisors, setSupervisors] = useState<Array<{id: string, name: string}>>([]);

  // Fetch issues with simple query
  const fetchIssues = async () => {
    setLoading(true);
    try {
      // First try to get basic issues
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching issues:', error);
        setIssues([]); // Set empty array instead of showing error
        setLoading(false);
        return;
      }

      // Transform data with default values for missing relationships
      const transformedIssues = (data || []).map(issue => ({
        ...issue,
        farm: {
          farm_name: 'Farm ID: ' + (issue.farm_id || 'Unknown'),
          region: 'Unknown Region',
          district: 'Unknown District',
          farmer: {
            name: 'Unknown Farmer'
          }
        },
        reported_by_profile: {
          full_name: 'User ID: ' + (issue.reported_by || 'Unknown'),
          role: 'unknown'
        },
        assigned_to_profile: issue.assigned_to ? {
          full_name: 'User ID: ' + issue.assigned_to
        } : null
      }));

      setIssues(transformedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]); // Set empty array for any error
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
    fetchIssues();
    fetchSupervisors();
  }, []);

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.farm.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.reported_by_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === 'all' || issue.status === statusFilter;
    const matchesPriority = !priorityFilter || priorityFilter === 'all' || issue.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Update issue
  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    setUpdating(true);
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.status) {
        updates.status = updateData.status;
        if (updateData.status === 'resolved' || updateData.status === 'closed') {
          updates.resolved_at = new Date().toISOString();
        }
      }

      if (updateData.assigned_to) {
        updates.assigned_to = updateData.assigned_to;
      }

      const { error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', selectedIssue.id);

      if (error) throw error;

      toast.success('Issue updated successfully');
      setShowUpdateModal(false);
      setSelectedIssue(null);
      await fetchIssues();

      // Send notification if issue was resolved
      if (updateData.status === 'resolved') {
        try {
          await notificationService.createNotification(
            selectedIssue.reported_by,
            {
              title: 'Issue Resolved',
              message: `Your issue "${selectedIssue.title}" has been resolved.`,
              type: 'issue_reported',
              priority: 'medium',
              actionUrl: `/supervisor-dashboard/issues/${selectedIssue.id}`
            }
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
    } catch (error: any) {
      console.error('Error updating issue:', error);
      toast.error(`Failed to update issue: ${error.message}`);
    }
    setUpdating(false);
  };

  // Calculate stats
  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.priority === 'critical' || i.priority === 'high').length
  };

  const openUpdateModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setUpdateData({
      status: issue.status,
      assigned_to: issue.assigned_to || '',
      admin_comment: ''
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issue Management</h1>
          <p className="text-muted-foreground">
            Track and resolve field issues reported by supervisors
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsGridSkeleton count={5} />
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
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
                placeholder="Search issues, farms, or reporters..."
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

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton 
              columns={7} 
              rows={5}
              headers={['Issue', 'Farm', 'Priority', 'Status', 'Reported By', 'Created', 'Actions']}
            />
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No issues found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {issue.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{issue.farm.farm_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.farm.farmer.name}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {issue.farm.region}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{issue.reported_by_profile.full_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {issue.reported_by_profile.role}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig[issue.priority as keyof typeof priorityConfig].color}>
                          {priorityConfig[issue.priority as keyof typeof priorityConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[issue.status as keyof typeof statusConfig].color}>
                          {statusConfig[issue.status as keyof typeof statusConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(issue.created_at), 'MMM d, yyyy')}
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
                                setSelectedIssue(issue);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openUpdateModal(issue)}
                            >
                              Update Status
                            </DropdownMenuItem>
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

      {/* Issue Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedIssue.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={priorityConfig[selectedIssue.priority as keyof typeof priorityConfig].color}>
                    {priorityConfig[selectedIssue.priority as keyof typeof priorityConfig].label}
                  </Badge>
                  <Badge variant={statusConfig[selectedIssue.status as keyof typeof statusConfig].color}>
                    {statusConfig[selectedIssue.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Farm</Label>
                  <p className="text-sm mt-1">{selectedIssue.farm.farm_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Farmer: {selectedIssue.farm.farmer.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm mt-1">{selectedIssue.farm.region}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedIssue.farm.district}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reported By</Label>
                  <p className="text-sm mt-1">{selectedIssue.reported_by_profile.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedIssue.reported_by_profile.role}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedIssue.created_at), 'PPP')}
                  </p>
                </div>
              </div>

              {selectedIssue.assigned_to_profile && (
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <p className="text-sm mt-1">{selectedIssue.assigned_to_profile.full_name}</p>
                </div>
              )}

              {selectedIssue.resolved_at && (
                <div>
                  <Label className="text-sm font-medium">Resolved</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedIssue.resolved_at), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Issue Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Issue</DialogTitle>
            <DialogDescription>
              Update the status and assignment of this issue
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={updateData.status} onValueChange={(value) => 
                setUpdateData(prev => ({...prev, status: value}))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select value={updateData.assigned_to} onValueChange={(value) => 
                setUpdateData(prev => ({...prev, assigned_to: value}))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="admin_comment">Admin Comment (Optional)</Label>
              <Textarea
                id="admin_comment"
                value={updateData.admin_comment}
                onChange={(e) => setUpdateData(prev => ({...prev, admin_comment: e.target.value}))}
                placeholder="Add any comments about this update..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIssue} disabled={updating}>
              {updating ? 'Updating...' : 'Update Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 