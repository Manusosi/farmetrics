import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Sprout,
  Eye,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface FieldOfficer {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  region?: string;
  district?: string;
  location?: string;
  account_status: string;
  created_at: string;
  is_active: boolean;
  assignedFarms?: number;
  submissionsToday?: number;
  lastActive?: string;
}

export function SupervisorOfficers() {
  const { profile } = useAuth();
  const [officers, setOfficers] = useState<FieldOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<FieldOfficer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch field officers in supervisor's region
  const fetchOfficers = async () => {
    if (!profile?.region) {
      setLoading(false);
      return;
    }

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
          is_active
        `)
        .eq('role', 'field_officer')
        .eq('region', profile.region) // Filter by supervisor's region
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
            lastActive: officer.is_active ? 'Active today' : 'Inactive'
          };
        })
      );

      setOfficers(officersWithDetails);
    } catch (error: any) {
      console.error('Error fetching officers:', error);
      // Only show error toast for connection issues, not empty data
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchOfficers);

  // Filter officers
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = 
      officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.phone_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'active' && officer.is_active) ||
      (activeTab === 'approved' && officer.account_status === 'approved') ||
      (activeTab === 'pending' && officer.account_status === 'pending');

    return matchesSearch && matchesTab;
  });

  // Calculate counts for tabs
  const totalCount = officers.length;
  const activeCount = officers.filter(o => o.is_active).length;
  const approvedCount = officers.filter(o => o.account_status === 'approved').length;
  const pendingCount = officers.filter(o => o.account_status === 'pending').length;

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return <Badge variant="secondary">Pending Approval</Badge>;
    } else if (status === 'approved') {
      return isActive ? 
        <Badge variant="default">Active</Badge> : 
        <Badge variant="outline">Approved</Badge>;
    } else {
      return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const openViewDialog = (officer: FieldOfficer) => {
    setSelectedOfficer(officer);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Field Officers</h1>
          <p className="text-muted-foreground">
            Monitor field officers in {profile?.region} region
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              In {profile?.region} region
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}% active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search officers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Officers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Officers in {profile?.region}</CardTitle>
          <CardDescription>
            Monitor and view field officer performance in your region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
              <TabsTrigger value="active" className="text-green-600">
                Active ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-blue-600">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-orange-600">
                Pending ({pendingCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <TableSkeleton />
              ) : (
                <div className="rounded-md border overflow-x-auto">
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
                              <p className="text-muted-foreground">
                                No field officers found in {profile?.region}
                              </p>
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
                                {officer.district && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3" />
                                    {officer.district}
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openViewDialog(officer)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
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

      {/* View Officer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Field Officer Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedOfficer?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOfficer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedOfficer.full_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedOfficer.email || 'Not available'}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedOfficer.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="font-medium">Gender</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedOfficer.gender || 'Not specified'}</p>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <Label className="font-medium mb-2 block">Location</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Region</Label>
                    <p className="text-sm text-muted-foreground">{selectedOfficer.region}</p>
                  </div>
                  <div>
                    <Label className="text-sm">District</Label>
                    <p className="text-sm text-muted-foreground">{selectedOfficer.district}</p>
                  </div>
                  {selectedOfficer.location && (
                    <div className="col-span-2">
                      <Label className="text-sm">Specific Location</Label>
                      <p className="text-sm text-muted-foreground">{selectedOfficer.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Information */}
              <div>
                <Label className="font-medium mb-2 block">Performance</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Assigned Farms</Label>
                    <p className="text-sm text-muted-foreground">{selectedOfficer.assignedFarms}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Today's Submissions</Label>
                    <p className="text-sm text-muted-foreground">{selectedOfficer.submissionsToday}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedOfficer.account_status, selectedOfficer.is_active)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Activity</Label>
                    <p className="text-sm text-muted-foreground">{selectedOfficer.lastActive}</p>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div>
                <Label className="font-medium mb-2 block">Registration Details</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Registered</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedOfficer.created_at), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Officer ID</Label>
                      <p className="text-sm text-muted-foreground font-mono">{selectedOfficer.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 