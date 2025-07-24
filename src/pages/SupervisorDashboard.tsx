import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { 
  Users, 
  MapPin, 
  Sprout, 
  AlertCircle, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Plus,
  Search,
  UserCheck,
  Trees,
  BarChart3,
  Loader2,
  Phone,
  Mail,
  Filter,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SupervisorStats {
  totalOfficers: number;
  activeOfficers: number;
  totalFarms: number;
  approvedFarms: number;
  totalVisits: number;
  todayVisits: number;
  pendingIssues: number;
  resolvedIssues: number;
}

interface FieldOfficer {
  id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  assignedFarms?: number;
  todaySubmissions?: number;
  lastActive?: string;
}

interface Farm {
  id: string;
  farm_name: string;
  farm_location?: string;
  farm_size?: number;
  status: string;
  farmer_name?: string;
  officer_name?: string;
  last_visit?: string;
  visits_count?: number;
}

interface Visit {
  id: string;
  farm_name: string;
  officer_name: string;
  visit_date: string;
  visit_type: string;
  status: string;
  notes?: string;
}

interface Issue {
  id: string;
  issue_type: string;
  priority: string;
  status: string;
  description: string;
  farm_name?: string;
  reported_by?: string;
  created_at: string;
}

export function SupervisorDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupervisorStats>({
    totalOfficers: 0,
    activeOfficers: 0,
    totalFarms: 0,
    approvedFarms: 0,
    totalVisits: 0,
    todayVisits: 0,
    pendingIssues: 0,
    resolvedIssues: 0
  });

  // State for different data sets
  const [officers, setOfficers] = useState<FieldOfficer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  // UI state
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [newIssue, setNewIssue] = useState({
    issue_type: '',
    priority: '',
    description: '',
    farm_id: ''
  });

  // Fetch supervisor dashboard data
  const fetchDashboardData = async () => {
    if (!profile?.region) return;

    setLoading(true);
    try {
      // Fetch field officers in the supervisor's region
      const { data: officersData, error: officersError } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, is_active, user_id')
        .eq('role', 'field_officer')
        .eq('region', profile.region)
        .eq('account_status', 'approved');

      if (officersError) throw officersError;

      // Get officers with email and farm assignments
      const officersWithDetails = await Promise.all(
        (officersData || []).map(async (officer) => {
          let email = '';
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(officer.user_id);
            email = authUser.user?.email || '';
          } catch (e) {
            // Skip if can't fetch
          }

          const { count: assignedFarms } = await supabase
            .from('farms')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_officer_id', officer.id);

          const { count: todaySubmissions } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('officer_id', officer.id)
            .gte('created_at', new Date().toISOString().split('T')[0]);

          return {
            ...officer,
            email,
            assignedFarms: assignedFarms || 0,
            todaySubmissions: todaySubmissions || 0,
            lastActive: officer.is_active ? 'Online' : 'Offline'
          };
        })
      );

      setOfficers(officersWithDetails);

      // Fetch farms in the supervisor's region with related data
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select(`
          id,
          farm_name,
          farm_location,
          farm_size,
          status,
          farmers (name),
          profiles (full_name)
        `)
        .ilike('farm_location', `%${profile.region}%`)
        .order('created_at', { ascending: false });

      if (farmsError) throw farmsError;

      // Get farms with visit statistics
      const farmsWithStats = await Promise.all(
        (farmsData || []).map(async (farm) => {
          const { count: visits_count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', farm.id);

          const { data: lastVisit } = await supabase
            .from('visits')
            .select('visit_date')
            .eq('farm_id', farm.id)
            .order('visit_date', { ascending: false })
            .limit(1);

          return {
            ...farm,
            farmer_name: farm.farmers?.name,
            officer_name: farm.profiles?.full_name,
            visits_count: visits_count || 0,
            last_visit: lastVisit?.[0]?.visit_date || null
          };
        })
      );

      setFarms(farmsWithStats);

      // Fetch recent visits in the region
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          id,
          visit_date,
          visit_type,
          status,
          notes,
          farms (farm_name, farm_location),
          profiles (full_name)
        `)
        .order('visit_date', { ascending: false })
        .limit(10);

      if (visitsError) throw visitsError;

      const regionalVisits = (visitsData || [])
        .filter(visit => visit.farms?.farm_location?.includes(profile.region))
        .map(visit => ({
          id: visit.id,
          farm_name: visit.farms?.farm_name || 'Unknown',
          officer_name: visit.profiles?.full_name || 'Unknown',
          visit_date: visit.visit_date,
          visit_type: visit.visit_type,
          status: visit.status,
          notes: visit.notes
        }));

      setRecentVisits(regionalVisits);

      // Fetch issues in the region
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          id,
          issue_type,
          priority,
          status,
          description,
          created_at,
          farms (farm_name, farm_location),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;

      const regionalIssues = (issuesData || [])
        .filter(issue => issue.farms?.farm_location?.includes(profile.region))
        .map(issue => ({
          id: issue.id,
          issue_type: issue.issue_type,
          priority: issue.priority,
          status: issue.status,
          description: issue.description,
          farm_name: issue.farms?.farm_name,
          reported_by: issue.profiles?.full_name,
          created_at: issue.created_at
        }));

      setIssues(regionalIssues);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = regionalVisits.filter(v => v.visit_date.startsWith(today)).length;
      
      setStats({
        totalOfficers: officersWithDetails.length,
        activeOfficers: officersWithDetails.filter(o => o.is_active).length,
        totalFarms: farmsWithStats.length,
        approvedFarms: farmsWithStats.filter(f => f.status === 'approved').length,
        totalVisits: regionalVisits.length,
        todayVisits,
        pendingIssues: regionalIssues.filter(i => i.status === 'open').length,
        resolvedIssues: regionalIssues.filter(i => i.status === 'resolved').length
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.region) {
      fetchDashboardData();
    }
  }, [profile]);

  // Handle issue creation
  const handleCreateIssue = async () => {
    if (!profile || !newIssue.issue_type || !newIssue.priority || !newIssue.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('issues')
        .insert({
          issue_type: newIssue.issue_type,
          priority: newIssue.priority,
          description: newIssue.description,
          farm_id: newIssue.farm_id || null,
          reported_by: profile.id,
          status: 'open'
        });

      if (error) throw error;

      toast.success('Issue reported successfully');
      setShowIssueDialog(false);
      setNewIssue({ issue_type: '', priority: '', description: '', farm_id: '' });
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating issue:', error);
      toast.error('Failed to report issue');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'approved':
      case 'completed':
      case 'resolved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Supervisor Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {profile?.full_name || 'Supervisor'}
                </p>
                {profile?.region && (
                  <p className="text-sm text-muted-foreground">
                    Managing {profile.region} Region • {stats.totalOfficers} Officers • {stats.totalFarms} Farms
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="text-sm">
                  Regional Supervisor
                </Badge>
                {profile?.region && (
                  <Badge variant="outline" className="text-xs">
                    {profile.region}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Field Officers
                  </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalOfficers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeOfficers} active today
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                  In {profile?.region} region
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Regional Farms
                </CardTitle>
                <Trees className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFarms}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.approvedFarms} approved
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.totalFarms - stats.approvedFarms} pending review
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Visit Activity
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayVisits}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Visits today
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {stats.totalVisits} total this week
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Issues & Alerts
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingIssues}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending issues
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.resolvedIssues} resolved
                  </p>
                </CardContent>
              </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="officers">Officers ({stats.totalOfficers})</TabsTrigger>
              <TabsTrigger value="farms">Farms ({stats.totalFarms})</TabsTrigger>
              <TabsTrigger value="visits">Visits ({stats.totalVisits})</TabsTrigger>
              <TabsTrigger value="issues">Issues ({stats.pendingIssues})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Priorities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today's Priorities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {issues.filter(i => i.priority === 'high' && i.status === 'open').slice(0, 3).map((issue) => (
                        <div key={issue.id} className={`flex items-center gap-3 p-3 rounded-lg border ${getPriorityColor(issue.priority)}`}>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{issue.issue_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.farm_name ? `${issue.farm_name} • ` : ''}{issue.description.slice(0, 50)}...
                            </p>
                          </div>
                          {getStatusBadge(issue.priority)}
                        </div>
                      ))}

                      {stats.todayVisits > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{stats.todayVisits} farm visits today</p>
                            <p className="text-xs text-muted-foreground">{stats.activeOfficers} officers active</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Today</Badge>
                      </div>
                      )}

                      {stats.pendingIssues === 0 && stats.todayVisits === 0 && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs text-muted-foreground">No urgent issues or pending tasks</p>
                          </div>
                          <Badge variant="outline" className="text-xs">Good</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Regional Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Regional Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Officer Utilization</span>
                        <span className="font-medium">
                          {stats.totalOfficers > 0 ? Math.round((stats.activeOfficers / stats.totalOfficers) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.totalOfficers > 0 ? (stats.activeOfficers / stats.totalOfficers) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Farm Approval Rate</span>
                        <span className="font-medium">
                          {stats.totalFarms > 0 ? Math.round((stats.approvedFarms / stats.totalFarms) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stats.totalFarms > 0 ? (stats.approvedFarms / stats.totalFarms) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Issue Resolution</span>
                        <span className="font-medium">
                          {(stats.pendingIssues + stats.resolvedIssues) > 0 ? 
                            Math.round((stats.resolvedIssues / (stats.pendingIssues + stats.resolvedIssues)) * 100) : 0
                          }%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(stats.pendingIssues + stats.resolvedIssues) > 0 ? 
                              (stats.resolvedIssues / (stats.pendingIssues + stats.resolvedIssues)) * 100 : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      className="h-20 flex-col gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab('officers')}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Manage Officers</span>
                    </Button>
                    <Button 
                      className="h-20 flex-col gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab('visits')}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm">View Visits</span>
                    </Button>
                    <Button 
                      className="h-20 flex-col gap-2" 
                      variant="outline"
                      onClick={() => setShowIssueDialog(true)}
                    >
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">Report Issue</span>
                    </Button>
                    <Button 
                      className="h-20 flex-col gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab('farms')}
                    >
                      <Trees className="h-5 w-5" />
                      <span className="text-sm">View Farms</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="officers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Field Officers in {profile?.region}</CardTitle>
                  <CardDescription>
                    Manage and monitor field officers in your region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Officer Details</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {officers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No field officers in your region yet</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          officers.map((officer) => (
                            <TableRow key={officer.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{officer.full_name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ID: {officer.id.slice(0, 8)}...
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {officer.email && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Mail className="h-3 w-3" />
                                      {officer.email}
                                    </div>
                                  )}
                                  {officer.phone_number && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="h-3 w-3" />
                                      {officer.phone_number}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                  <span>Farms: {officer.assignedFarms}</span>
                                  <span>Today: {officer.todaySubmissions} submissions</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={officer.is_active ? 'default' : 'secondary'}>
                                    {officer.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {officer.lastActive}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="farms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Farms</CardTitle>
                  <CardDescription>
                    Monitor and manage farms in {profile?.region} region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Farm Details</TableHead>
                          <TableHead>Location & Size</TableHead>
                          <TableHead>Farmer & Officer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Visits</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {farms.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Trees className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No farms found in your region</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          farms.map((farm) => (
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
                                    {farm.farm_size || 'Unknown'} hectares
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                  <span>Farmer: {farm.farmer_name || 'Unassigned'}</span>
                                  <span className="text-muted-foreground">
                                    Officer: {farm.officer_name || 'Unassigned'}
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
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Farm Visits</CardTitle>
                  <CardDescription>
                    Track farm visits in your region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Farm</TableHead>
                          <TableHead>Officer</TableHead>
                          <TableHead>Visit Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentVisits.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No recent visits in your region</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentVisits.map((visit) => (
                            <TableRow key={visit.id}>
                              <TableCell className="font-medium">{visit.farm_name}</TableCell>
                              <TableCell>{visit.officer_name}</TableCell>
                              <TableCell>
                                {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{visit.visit_type}</Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(visit.status)}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {visit.notes ? visit.notes.slice(0, 50) + '...' : 'No notes'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Regional Issues</h3>
                  <p className="text-sm text-muted-foreground">Track and manage issues in your region</p>
                </div>
                <Button onClick={() => setShowIssueDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {issues.length === 0 ? (
                  <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No Issues Reported</h3>
                    <p className="text-muted-foreground">
                          Great! No issues have been reported in your region.
                        </p>
                      </div>
                    ) : (
                      issues.map((issue) => (
                        <div key={issue.id} className={`p-4 rounded-lg border ${getPriorityColor(issue.priority)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{issue.issue_type}</h4>
                                {getStatusBadge(issue.priority)}
                                {getStatusBadge(issue.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {issue.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {issue.farm_name && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {issue.farm_name}
                                  </span>
                                )}
                                {issue.reported_by && (
                                  <span>Reported by {issue.reported_by}</span>
                                )}
                                <span>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Issue Report Dialog */}
          <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Report New Issue
                </DialogTitle>
                <DialogDescription>
                  Report a new issue in your region that requires attention.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue-type">Issue Type</Label>
                    <Select value={newIssue.issue_type} onValueChange={(value) => setNewIssue(prev => ({ ...prev, issue_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pest_disease">Pest/Disease</SelectItem>
                        <SelectItem value="crop_damage">Crop Damage</SelectItem>
                        <SelectItem value="weather_impact">Weather Impact</SelectItem>
                        <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                        <SelectItem value="access_road">Access Road Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newIssue.priority} onValueChange={(value) => setNewIssue(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farm">Related Farm (Optional)</Label>
                  <Select value={newIssue.farm_id} onValueChange={(value) => setNewIssue(prev => ({ ...prev, farm_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm if applicable" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.farm_name} - {farm.farm_location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newIssue.description}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed description of the issue..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateIssue}
                  disabled={!newIssue.issue_type || !newIssue.priority || !newIssue.description}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}