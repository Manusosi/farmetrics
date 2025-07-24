import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsGridSkeleton, CardSkeleton } from '@/components/ui/skeleton-loaders';
import { FarmMap } from '@/components/maps/FarmMap';
import { 
  Activity,
  AlertTriangle,
  BarChart2,
  Clock,
  MapIcon,
  RefreshCw,
  Sprout,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupervisorStats {
  totalOfficers: number;
  activeOfficers: number;
  totalFarms: number;
  approvedFarms: number;
  pendingFarms: number;
  totalVisits: number;
  todayVisits: number;
  thisWeekVisits: number;
  openIssues: number;
  resolvedIssues: number;
  assignedRegions: string[];
}

interface RecentActivity {
  id: string;
  type: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
}

interface FarmWithPolygon {
  id: string;
  farm_name: string;
  region: string;
  district: string;
  polygon_coordinates?: any;
  is_approved: boolean;
}

export function SupervisorOverview() {
  const { user, profile, loading: authLoading } = useAuth();
  
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [farmPolygons, setFarmPolygons] = useState<FarmWithPolygon[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get supervisor's assigned regions (support multiple regions)
  const getAssignedRegions = () => {
    // For now, use the single region from profile, but this can be expanded
    // to support multiple regions assigned by admin
    const regions = profile?.region ? [profile.region] : [];
    
    // TODO: In future, fetch additional assigned regions from a separate table
    // const { data: additionalRegions } = await supabase
    //   .from('supervisor_regions')
    //   .select('region')
    //   .eq('supervisor_id', profile.id);
    
    return regions;
  };

  // Fetch supervisor-specific dashboard data
  useEffect(() => {
    if (authLoading || !user || !profile) return;

    if (profile.role !== 'supervisor') {
      setError("Supervisor access required.");
      setLoading(false);
      return;
    }

    const fetchSupervisorData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const assignedRegions = getAssignedRegions();
        
        if (assignedRegions.length === 0) {
          setError("No regions assigned. Please contact administrator.");
          setLoading(false);
          return;
        }

        // Fetch field officers in supervisor's assigned regions
        const { data: officers } = await supabase
          .from('profiles')
          .select('id, is_active, region')
          .eq('role', 'field_officer')
          .in('region', assignedRegions);

        // Fetch farms in supervisor's assigned regions
        const { data: farms } = await supabase
          .from('farms')
          .select('id, is_approved, region, farm_name, district, polygon_coordinates')
          .in('region', assignedRegions);

        // Fetch visits from officers in assigned regions
        const officerIds = officers?.map(o => o.id) || [];
        const { data: visits } = await supabase
          .from('visits')
          .select('id, created_at, officer_id')
          .in('officer_id', officerIds);

        // Fetch issues in assigned regions
        const farmIds = farms?.map(f => f.id) || [];
        const { data: issues } = await supabase
          .from('issues')
          .select('id, status, farm_id')
          .in('farm_id', farmIds);

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const supervisorStats: SupervisorStats = {
          totalOfficers: officers?.length || 0,
          activeOfficers: officers?.filter(o => o.is_active).length || 0,
          totalFarms: farms?.length || 0,
          approvedFarms: farms?.filter(f => f.is_approved).length || 0,
          pendingFarms: farms?.filter(f => !f.is_approved).length || 0,
          totalVisits: visits?.length || 0,
          todayVisits: visits?.filter(v => v.created_at?.startsWith(today)).length || 0,
          thisWeekVisits: visits?.filter(v => v.created_at && v.created_at >= weekAgo).length || 0,
          openIssues: issues?.filter(i => i.status !== 'resolved').length || 0,
          resolvedIssues: issues?.filter(i => i.status === 'resolved').length || 0,
          assignedRegions: assignedRegions,
        };

        setStats(supervisorStats);

        // Set farm polygons for map (limit to 20 for performance)
        const farmsWithPolygons = (farms || [])
          .filter(f => f.polygon_coordinates)
          .slice(0, 20)
          .map(farm => ({
            id: farm.id,
            farm_name: farm.farm_name,
            region: farm.region,
            district: farm.district,
            polygon_coordinates: farm.polygon_coordinates,
            is_approved: farm.is_approved
          }));
        
        setFarmPolygons(farmsWithPolygons);

        // Generate recent activity
        const activities: RecentActivity[] = [];
        
        // Add recent visits
        visits?.slice(0, 5).forEach(visit => {
          activities.push({
            id: `visit_${visit.id}`,
            type: 'visit_submission',
            action: 'submitted',
            entity: 'visit',
            entityId: visit.id,
            userId: visit.officer_id,
            userName: 'Field Officer',
            userRole: 'field_officer',
            details: 'Visit report submitted',
            timestamp: visit.created_at || new Date().toISOString()
          });
        });

        setRecentActivity(activities.slice(0, 10));

      } catch (error: any) {
        console.error('Error fetching supervisor data:', error);
        setError("Failed to load dashboard data. Please try again.");
        toast.error('Failed to load dashboard data');
      }
      
      setLoading(false);
    };

    fetchSupervisorData();
  }, [user, profile, authLoading]);

  const handleRetry = () => {
    if (profile) {
      setLoading(true);
      setError(null);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}
        </p>
        <p className="text-sm text-muted-foreground">
          Managing {stats?.assignedRegions.join(', ')} • {stats?.totalOfficers || 0} Officers • {stats?.totalFarms || 0} Farms
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Field Officers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOfficers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeOfficers || 0} active today
              </p>
              <p className="text-xs text-muted-foreground">
                In {stats?.assignedRegions.length} region(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regional Farms</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalFarms || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.approvedFarms || 0} approved
              </p>
              <p className="text-xs text-green-600">
                {stats?.pendingFarms || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visit Activity</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Visits today
              </p>
              <p className="text-xs text-muted-foreground">
                {stats?.thisWeekVisits || 0} total this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues & Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openIssues || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pending issues
              </p>
              <p className="text-xs text-green-600">
                {stats?.resolvedIssues || 0} resolved
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overview Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.openIssues ? (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Resolve pending issues</span>
                  </div>
                  <Badge variant="destructive">{stats.openIssues}</Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm">All caught up!</span>
                  </div>
                  <Badge variant="secondary">Good</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Regional Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Officer Utilization</span>
                <span className="text-sm font-medium">
                  {stats?.totalOfficers ? Math.round((stats.activeOfficers / stats.totalOfficers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Farm Approval Rate</span>
                <span className="text-sm font-medium">
                  {stats?.totalFarms ? Math.round((stats.approvedFarms / stats.totalFarms) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Issue Resolution</span>
                <span className="text-sm font-medium">
                  {(stats?.openIssues || 0) + (stats?.resolvedIssues || 0) ? 
                    Math.round((stats?.resolvedIssues || 0) / ((stats?.openIssues || 0) + (stats?.resolvedIssues || 0)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Regions Managed</span>
                <span className="text-sm font-medium">{stats?.assignedRegions.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Regional Farm Map
          </CardTitle>
          <CardDescription>
            View farm locations and polygons in {stats?.assignedRegions.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="h-[500px] rounded-lg border flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Unable to load map</p>
              </div>
            </div>
          ) : loading ? (
            <div className="h-[500px] rounded-lg border flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="h-[500px] rounded-lg border">
              <FarmMap 
                farms={farmPolygons || []}
                selectedFarm={null}
                onFarmSelect={() => {}}
                focusRegions={stats?.assignedRegions || []}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Showing {farmPolygons?.length || 0} farms with polygon data in your assigned regions
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 