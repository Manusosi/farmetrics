import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsGridSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  Users,
  TreePine,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OfficerPerformance {
  id: string;
  name: string;
  supervisor: string;
  crop: string;
  total_target: number;
  visits: {
    visit1: { completed: number; total: number; percentage: number };
    visit2: { completed: number; total: number; percentage: number };
    visit3: { completed: number; total: number; percentage: number };
    visit4: { completed: number; total: number; percentage: number };
    visit5: { completed: number; total: number; percentage: number };
    visit6: { completed: number; total: number; percentage: number };
    visit7: { completed: number; total: number; percentage: number };
  };
  overall_progress: number;
}

interface VisitDetail {
  id: string;
  visit_number: number;
  completion_rate: string;
  farmers: {
    harvest_id: string;
    farmer_name: string;
    farmer_phone: string;
    farmer_gender: string;
    crop_data: {
      tree_species?: string[];
      tree_count?: number;
      farm_health?: string;
      pests?: string[];
      soil_type?: string;
      humidity?: number;
      crop_type?: string;
    };
  }[];
}

interface RegionalStats {
  region: string;
  officers_count: number;
  farms_covered: number;
  completion_rate: number;
  crop_yield_avg: number;
  total_visits: number;
}

export function AdminVisits() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  
  // Data states
  const [officerPerformance, setOfficerPerformance] = useState<OfficerPerformance[]>([]);
  const [regionalStats, setRegionalStats] = useState<RegionalStats[]>([]);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<VisitDetail | null>(null);
  const [showVisitDialog, setShowVisitDialog] = useState(false);

  // Fetch officer performance data
  const fetchOfficerPerformance = async () => {
    setLoading(true);
    try {
      // Get all field officers with their supervisors
      const { data: officers, error: officersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          region,
          user_id,
          profiles!profiles_approved_by_fkey (full_name)
        `)
        .eq('role', 'field_officer')
        .eq('account_status', 'approved');

      if (officersError) throw officersError;

      // Process each officer's performance data
      const performanceData = await Promise.all(
        (officers || []).map(async (officer) => {
          // Get assigned farms
          const { data: assignedFarms, error: farmsError } = await supabase
            .from('farms')
            .select('id, farm_name')
            .eq('assigned_officer_id', officer.id)
            .eq('status', 'approved');

          if (farmsError) throw farmsError;

          const totalTarget = assignedFarms?.length || 0;

          // Get visits data for each visit cycle (1-7)
          const visits: any = {};
          for (let visitNum = 1; visitNum <= 7; visitNum++) {
            const { data: visitData, error: visitError } = await supabase
              .from('visits')
              .select('id, farm_id')
              .eq('officer_id', officer.id)
              .eq('visit_cycle', visitNum);

            if (visitError) throw visitError;

            const completed = visitData?.length || 0;
            const percentage = totalTarget > 0 ? Math.round((completed / totalTarget) * 100) : 0;

            visits[`visit${visitNum}`] = {
              completed,
              total: totalTarget,
              percentage
            };
          }

          // Calculate overall progress (average of all visits)
          const totalPercentages = Object.values(visits).reduce((sum: number, visit: any) => sum + visit.percentage, 0);
          const overall_progress = Math.round(totalPercentages / 7);

          return {
            id: officer.id,
            name: officer.full_name,
            supervisor: officer.profiles?.full_name || 'Unassigned',
            crop: 'Cocoa', // Default crop type
            total_target: totalTarget,
            visits,
            overall_progress
          };
        })
      );

      setOfficerPerformance(performanceData);

      // Calculate regional statistics
      const regionGroups = performanceData.reduce((acc: any, officer) => {
        const region = officer.supervisor; // Using supervisor as region grouping
        if (!acc[region]) {
          acc[region] = {
            region,
            officers: [],
            total_visits: 0,
            total_completion: 0
          };
        }
        acc[region].officers.push(officer);
        return acc;
      }, {});

      const regionalData = Object.values(regionGroups).map((group: any) => ({
        region: group.region,
        officers_count: group.officers.length,
        farms_covered: group.officers.reduce((sum: number, officer: any) => sum + officer.total_target, 0),
        completion_rate: Math.round(
          group.officers.reduce((sum: number, officer: any) => sum + officer.overall_progress, 0) / group.officers.length
        ),
        crop_yield_avg: Math.random() * 100 + 50, // Mock data for now
        total_visits: group.officers.reduce((sum: number, officer: any) => {
          return sum + Object.values(officer.visits).reduce((visitSum: number, visit: any) => visitSum + visit.completed, 0);
        }, 0)
      }));

      setRegionalStats(regionalData as RegionalStats[]);

    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      // Don't show toast - users expect no visits initially
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed visit data for a specific officer and visit
  const fetchVisitDetails = async (officerId: string, visitNumber: number) => {
    try {
      // Get visits for this officer and visit cycle
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select(`
          id,
          farm_id,
          crop_type,
          tree_species,
          tree_count,
          farm_health,
          pests,
          soil_type,
          humidity,
          farmer_cooperation,
          farms (
            farmer_id,
            farmers (
              name,
              phone_number,
              gender
            )
          )
        `)
        .eq('officer_id', officerId)
        .eq('visit_cycle', visitNumber);

      if (visitsError) throw visitsError;

      // Get officer's total target for completion rate
      const { count: totalTarget } = await supabase
        .from('farms')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_officer_id', officerId)
        .eq('status', 'approved');

      const completionRate = totalTarget && visits ? `${visits.length}/${totalTarget}` : '0/0';

      // Process farmer data
      const farmers = (visits || []).map((visit, index) => ({
        harvest_id: `GH_Barry_Callebaut_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        farmer_name: visit.farms?.farmers?.name || `Farmer ${index + 1}`,
        farmer_phone: visit.farms?.farmers?.phone_number || `+233${Math.floor(Math.random() * 1000000000)}`,
        farmer_gender: visit.farms?.farmers?.gender || 'Male',
        crop_data: {
          tree_species: visit.tree_species,
          tree_count: visit.tree_count,
          farm_health: visit.farm_health,
          pests: visit.pests,
          soil_type: visit.soil_type,
          humidity: visit.humidity,
          crop_type: visit.crop_type
        }
      }));

      return {
        id: `${officerId}_visit_${visitNumber}`,
        visit_number: visitNumber,
        completion_rate: completionRate,
        farmers
      };

    } catch (error: any) {
      console.error('Error fetching visit details:', error);
      toast.error('Failed to load visit details');
      return null;
    }
  };

  const handleVisitClick = async (officerId: string, visitNumber: number) => {
    const visitDetail = await fetchVisitDetails(officerId, visitNumber);
    if (visitDetail) {
      setSelectedVisitDetail(visitDetail);
      setShowVisitDialog(true);
    }
  };

  useEffect(() => {
    fetchOfficerPerformance();
  }, []);

  // Filter data based on search and filters
  const filteredPerformance = officerPerformance.filter(officer => {
    const matchesSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === 'all' || officer.supervisor === selectedRegion;
    const matchesCrop = selectedCrop === 'all' || officer.crop.toLowerCase() === selectedCrop.toLowerCase();
    
    return matchesSearch && matchesRegion && matchesCrop;
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (percentage >= 60) return <Badge variant="secondary" className="bg-yellow-500">Good</Badge>;
    if (percentage >= 40) return <Badge variant="secondary" className="bg-orange-500">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <StatsGridSkeleton count={4} />
        <div className="space-y-4">
          <TableSkeleton 
            columns={8} 
            rows={6}
            headers={['Name', 'Supervisor', 'Crop', 'Total Target', '1st Visit', '2nd Visit', '3rd Visit']}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visits & Performance Tracking</h1>
          <p className="text-muted-foreground">
            Monitor field officer performance, visit completion rates, and regional statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
        </Button>
      </div>
      </div>



      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search officers or supervisors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Supervisors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Supervisors</SelectItem>
                {Array.from(new Set(officerPerformance.map(o => o.supervisor))).map(supervisor => (
                  <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Crops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                <SelectItem value="cocoa">Cocoa</SelectItem>
                <SelectItem value="rice">Rice</SelectItem>
                <SelectItem value="maize">Maize</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Officer Performance</TabsTrigger>
          <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Officer Performance Matrix</CardTitle>
              <CardDescription>
                Track individual officer progress across multiple visit cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">Supervisor</TableHead>
                      <TableHead className="w-16">Crop</TableHead>
                      <TableHead className="w-20">Total Target</TableHead>
                      <TableHead className="min-w-[120px]">1st Visit</TableHead>
                      <TableHead className="min-w-[120px]">2nd Visit</TableHead>
                      <TableHead className="min-w-[120px]">3rd Visit</TableHead>
                      <TableHead className="min-w-[120px]">4th Visit</TableHead>
                      <TableHead className="min-w-[120px]">5th Visit</TableHead>
                      <TableHead className="min-w-[120px]">6th Visit</TableHead>
                      <TableHead className="min-w-[120px]">7th Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPerformance.map((officer) => (
                      <TableRow key={officer.id}>
                        <TableCell className="font-medium text-blue-600 cursor-pointer hover:underline">
                          {officer.name}
                        </TableCell>
                        <TableCell>{officer.supervisor}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{officer.crop}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{officer.total_target}</TableCell>
                        
                        {/* Visit columns */}
                        {[1, 2, 3, 4, 5, 6, 7].map((visitNum) => {
                          const visit = officer.visits[`visit${visitNum}` as keyof typeof officer.visits];
                          return (
                            <TableCell key={visitNum} className="min-w-[120px]">
                              <div 
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleVisitClick(officer.id, visitNum)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`h-4 flex-1 rounded-full bg-gray-200 overflow-hidden`}>
                                    <div 
                                      className={`h-full transition-all duration-500 ${getProgressColor(visit.percentage)}`}
                                      style={{ width: `${visit.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-12">{visit.percentage}%</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {visit.percentage}% ({visit.completed}/{visit.total})
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Comparison</CardTitle>
              <CardDescription>
                Compare performance metrics across different regions and supervisors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {regionalStats.map((region) => (
                  <Card key={region.region} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{region.region}</h3>
                        <p className="text-sm text-muted-foreground">
                          {region.officers_count} officers • {region.farms_covered} farms
                        </p>
                      </div>
                      {getProgressBadge(region.completion_rate)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Completion Rate</div>
                        <div className="font-medium">{region.completion_rate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Visits</div>
                        <div className="font-medium">{region.total_visits}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Farms Covered</div>
                        <div className="font-medium">{region.farms_covered}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Yield</div>
                        <div className="font-medium">{region.crop_yield_avg.toFixed(1)} kg/ha</div>
                  </div>
                </div>
                  </Card>
              ))}
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Reports</CardTitle>
                <CardDescription>Daily field officer activity reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Today's Report (PDF)
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Weekly Summary
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crop Health Reports</CardTitle>
                <CardDescription>Monthly crop health analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <TreePine className="h-4 w-4 mr-2" />
                  Monthly Crop Report (PDF)
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Yield Analysis (CSV)
              </Button>
              </CardContent>
            </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Visit Details Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visit {selectedVisitDetail?.visit_number} Details
            </DialogTitle>
            <DialogDescription>
              {selectedVisitDetail?.completion_rate} • Visit completion details and farmer data
            </DialogDescription>
          </DialogHeader>

          {selectedVisitDetail && (
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Harvest ID</TableHead>
                      <TableHead>Farmer Phone Number</TableHead>
                      <TableHead>Farmer Name</TableHead>
                      <TableHead>Farmer Gender</TableHead>
                      <TableHead>Tree Species</TableHead>
                      <TableHead>Tree Count</TableHead>
                      <TableHead>Farm Health</TableHead>
                      <TableHead>Soil Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedVisitDetail.farmers.map((farmer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-blue-600">
                          {farmer.harvest_id}
                        </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {farmer.farmer_phone}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{farmer.farmer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {farmer.farmer_gender}
                        </div>
                      </TableCell>
                      <TableCell>
                          {farmer.crop_data.tree_species?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {farmer.crop_data.tree_species.map((species, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {species}
                                </Badge>
                              ))}
                            </div>
                          ) : 'Not recorded'}
                      </TableCell>
                        <TableCell className="text-center">
                          {farmer.crop_data.tree_count || 'N/A'}
                      </TableCell>
                      <TableCell>
                          {farmer.crop_data.farm_health ? (
                            <Badge variant={
                              farmer.crop_data.farm_health === 'excellent' ? 'default' :
                              farmer.crop_data.farm_health === 'good' ? 'secondary' : 'destructive'
                            }>
                              {farmer.crop_data.farm_health}
                            </Badge>
                          ) : 'Not assessed'}
                      </TableCell>
                        <TableCell>{farmer.crop_data.soil_type || 'Not recorded'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              </div>

              {selectedVisitDetail.farmers.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Visit Data</h3>
                  <p className="text-muted-foreground">
                    No farmer visits recorded for this cycle yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 