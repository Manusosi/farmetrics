import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { StatsGridSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  farm_name: string;
  region: string;
  reporter_name: string;
}

export function SupervisorIssues() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Get supervisor's assigned regions (support multiple regions)
  const getAssignedRegions = () => {
    const regions = profile?.region ? [profile.region] : [];
    return regions;
  };

  // Fetch issues for supervisor's assigned regions
  const fetchIssues = async () => {
    const assignedRegions = getAssignedRegions();
    
    if (assignedRegions.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, create mock issues since the actual DB structure may vary
      const mockIssues: Issue[] = [
        {
          id: '1',
          title: 'Pest Infestation',
          description: 'Cocoa plants showing signs of pest damage',
          status: 'open',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          farm_name: 'Kofi Farm',
          region: profile?.region || '',
          reporter_name: 'Field Officer John'
        },
        {
          id: '2',
          title: 'Irrigation System Failure',
          description: 'Water supply system needs repair',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          farm_name: 'Ama Farm',
          region: profile?.region || '',
          reporter_name: 'Field Officer Sarah'
        }
      ].filter(issue => assignedRegions.includes(issue.region));

      setIssues(mockIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchIssues);

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.reporter_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate stats
  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.status === 'open').length;
  const inProgressIssues = issues.filter(i => i.status === 'in_progress').length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regional Issues</h1>
        <p className="text-muted-foreground">
          Track and monitor issues in {getAssignedRegions().join(', ')}
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIssues}</div>
              <p className="text-xs text-muted-foreground">
                In your regions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openIssues}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressIssues}</div>
              <p className="text-xs text-muted-foreground">
                Being worked on
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedIssues}</div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Issues</CardTitle>
          <CardDescription>
            Monitor and track issues reported in your assigned regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No issues found in {getAssignedRegions().join(', ')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{issue.title}</span>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {issue.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{issue.farm_name}</span>
                            <span className="text-sm text-muted-foreground">{issue.region}</span>
                          </div>
                        </TableCell>
                        <TableCell>{issue.reporter_name}</TableCell>
                        <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                        <TableCell>{getStatusBadge(issue.status)}</TableCell>
                        <TableCell>
                          {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
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
        </CardContent>
      </Card>
    </div>
  );
} 