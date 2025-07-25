import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FarmMap } from '@/components/maps/FarmMap';
import { StatsGridSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/skeleton-loaders';
import { 
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Clock,
  Filter,
  Image,
  MapIcon,
  Maximize2,
  RefreshCw,
  Search,
  Shield,
  Sprout,
  Users
} from 'lucide-react';

// Import dashboard service
import { 
  getDashboardSummary, 
  getRecentActivity, 
  getFarmPolygons, 
  getSyncStatus, 
  getWeeklyData,
  DashboardSummary,
  RecentActivity,
  FarmPolygon as ServiceFarmPolygon,
  SyncStatus,
  WeeklyData
} from '@/services/dashboardService';

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [farmPolygons, setFarmPolygons] = useState<ServiceFarmPolygon[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Add timeout reference for loading state
  const loadingTimeoutRef = useRef<number | null>(null);
  
  // Fetch dashboard data
  useEffect(() => {
    // Don't start loading until auth has finished loading
    if (authLoading) {
      return;
    }

    // Must have a user to proceed
    if (!user) {
      setLoading(false);
      setError("Authentication required. Please sign in.");
      return;
    }

    // Check if user has admin role (from metadata or profile)
    const userRole = profile?.role || user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin') {
      setLoading(false);
      setError("Admin access required. Please contact your administrator.");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasAttemptedLoad(true);
        
        // Clear any existing timeout
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
        }
        
        // Set a timeout to handle cases where loading gets stuck
        loadingTimeoutRef.current = window.setTimeout(() => {
            setLoading(false);
          setError("Request timed out. Please check your connection and try again.");
        }, 15000); // Increased to 15 seconds
        
        // Fetch data with independent error handling
        const [summaryResult, activityResult, polygonsResult, syncResult, weeklyResult] = await Promise.allSettled([
          getDashboardSummary(),
          getRecentActivity(10),
          getFarmPolygons(5),
          getSyncStatus(4),
          getWeeklyData()
        ]);

        // Process results
        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value);
        } else {
          console.error('Failed to fetch summary:', summaryResult.reason);
        }
        
        if (activityResult.status === 'fulfilled') {
          setRecentActivity(activityResult.value);
        } else {
          console.error('Failed to fetch activity:', activityResult.reason);
        }
        
        if (polygonsResult.status === 'fulfilled') {
          setFarmPolygons(polygonsResult.value);
        } else {
          console.error('Failed to fetch polygons:', polygonsResult.reason);
        }
        
        if (syncResult.status === 'fulfilled') {
          setSyncStatus(syncResult.value);
        } else {
          console.error('Failed to fetch sync status:', syncResult.reason);
        }
        
        if (weeklyResult.status === 'fulfilled') {
          setWeeklyData(weeklyResult.value);
        } else {
          console.error('Failed to fetch weekly data:', weeklyResult.reason);
        }

        // Clear timeout
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        
        // Only show error if all critical requests failed
        const criticalFailed = summaryResult.status === 'rejected';
        if (criticalFailed) {
          setError("Could not load essential dashboard data. Please try again.");
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Unexpected error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        setLoading(false);
        
        // Clear timeout
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };
    
    fetchDashboardData();
    
    // Clean up timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, profile, authLoading, retryCount]);

  // Function to handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Function to render trend indicator
  const renderTrend = (trend: string, trendUp: boolean) => (
    <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
      {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {trend}
    </div>
  );
  
  // Convert farm polygons to the format expected by FarmMap component
  const mapPolygons = farmPolygons.map(farm => ({
    coordinates: farm.coordinates,
    title: farm.farmName,
    status: farm.status,
    description: `${farm.region} - ${farm.totalArea ? farm.totalArea + ' hectares' : 'Area unknown'}`,
    photos: farm.photos
  }));

  // Show skeleton loading if auth is loading
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <StatsGridSkeleton count={4} />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Show error state only if we have an error and have attempted to load
  if (error && hasAttemptedLoad) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="max-w-md p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800/30 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Loading Data</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={handleRetry}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show dashboard even if some data is missing (graceful degradation)
  const summaryData = summary || {
    farmCount: 0,
    visitCount: 0,
    pendingApprovals: 0,
    issueCount: 0,
    mediaCount: 0,
    activeOfficerCount: 0,
    dataQualityScore: 0,
    syncSuccessRate: 0
  };

  // Main dashboard content
  return (
    <div className="space-y-6">
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Farm Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Farm Submissions
            </CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.farmCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total farms registered
            </p>
            {summaryData.farmCount > 0 && renderTrend('+18%', true)}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Farms awaiting approval
            </p>
            {summaryData.pendingApprovals > 0 && renderTrend('-8%', false)}
          </CardContent>
        </Card>

        {/* Photos Collected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Photos Collected
            </CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.mediaCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total photos with EXIF data
            </p>
            {summaryData.mediaCount > 0 && renderTrend('+23%', true)}
          </CardContent>
        </Card>

        {/* Active Field Officers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Field Officers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.activeOfficerCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently submitting data
            </p>
            {summaryData.activeOfficerCount > 0 && renderTrend('+2', true)}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Issues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.issueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Issues requiring attention
            </p>
            {summaryData.issueCount > 0 && renderTrend('+15%', true)}
          </CardContent>
        </Card>

        {/* Visit Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visit Reports
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.visitCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total field visits recorded
            </p>
            {summaryData.visitCount > 0 && renderTrend('+15%', true)}
          </CardContent>
        </Card>

        {/* Data Quality Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Data Quality Score
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.dataQualityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              GPS accuracy & completeness
            </p>
            {summaryData.dataQualityScore > 0 && renderTrend('+2%', true)}
          </CardContent>
        </Card>

        {/* Sync Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sync Success Rate
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.syncSuccessRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mobile app data transfers
            </p>
            {summaryData.syncSuccessRate > 0 && renderTrend('+0.3%', true)}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Data Collection & Sync Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Data Collection Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Data Collection Trends</CardTitle>
            <CardDescription>
              Field data submissions received from mobile officers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="day"
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="font-medium">{label}</div>
                              {payload.map((item: any) => (
                                <div
                                  key={item.name}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>{item.name}:</span>
                                  <span className="font-medium">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="photos" fill="#22c55e" name="Photos" />
                    <Bar dataKey="polygons" fill="#3b82f6" name="Polygons" />
                    <Bar dataKey="reports" fill="#f59e0b" name="Reports" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>No weekly data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sync Status Overview</CardTitle>
              <CardDescription>
                Real-time synchronization status of field officers
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncStatus.length > 0 ? (
                syncStatus.map((officer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        officer.status === 'success' ? 'bg-green-500' :
                        officer.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{officer.userName}</p>
                        <p className="text-xs text-muted-foreground">Last sync: {
                          typeof officer.lastSync === 'string' && officer.lastSync.includes('T') 
                            ? new Date(officer.lastSync).toLocaleString() 
                            : officer.lastSync
                        }</p>
                      </div>
                    </div>
                    {officer.status === 'success' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        success
                      </Badge>
                    ) : officer.status === 'pending' ? (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        {officer.pendingCount ? `${officer.pendingCount} pending` : 'pending'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500">
                        {officer.pendingCount ? `${officer.pendingCount} pending` : 'error'}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No active field officers found
                </div>
              )}
              {syncStatus.length > 0 && (
                <Button className="w-full" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Sync All Officers
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Data Geographic Overview */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Field Data Geographic Overview</CardTitle>
              <CardDescription>
                Real-time view of geolocated submissions from field officers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter Data
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="mr-2 h-4 w-4" />
                Full Map View
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map */}
              <div className="lg:col-span-2 bg-muted rounded-lg h-[400px] overflow-hidden">
                {farmPolygons.length > 0 ? (
                  <FarmMap
                    polygons={mapPolygons}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No farm polygons available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Submissions */}
              <div className="space-y-4">
                <h3 className="font-medium">Recent Activity</h3>
                <div className="space-y-2 h-[350px] overflow-y-auto pr-2">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <Card
                        key={activity.id}
                        className="cursor-pointer transition-colors hover:border-primary"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{activity.entityName}</h4>
                            <Badge variant="secondary">
                              {activity.type === 'visit_completed' ? 'Visit' : 
                               activity.type === 'farm_submitted' ? 'Farm' : 
                               activity.type === 'issue_reported' ? 'Issue' : 'Transfer'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>By {activity.userName}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(activity.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}