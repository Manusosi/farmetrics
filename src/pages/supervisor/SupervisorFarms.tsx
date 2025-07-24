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
  Sprout,
  FileText,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Farm {
  id: string;
  farm_name: string;
  crop_type: string;
  region: string;
  district: string;
  location: string;
  total_area: number;
  visit_count: number;
  last_visit_date: string | null;
  is_approved: boolean;
  updated_at: string;
  farmer: {
    name: string;
    phone_number: string;
  } | null;
  assigned_officer: {
    full_name: string;
  } | null;
}

export function SupervisorFarms() {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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

  // Fetch farms data for supervisor's assigned regions
  const fetchFarms = async () => {
    const assignedRegions = getAssignedRegions();
    
    if (assignedRegions.length === 0) {
      setLoading(false);
      return;
    }

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
          total_area,
          is_approved,
          updated_at,
          farmer:farmers(name, phone_number),
          assigned_officer:profiles!farms_assigned_officer_id_fkey(full_name)
        `)
        .in('region', assignedRegions) // Filter by assigned regions
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get visit statistics for each farm
      const farmsWithStats = await Promise.all(
        (data || []).map(async (farm) => {
          // Get visit count
          const { count: visit_count } = await supabase
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
            visit_count: visit_count || 0,
            last_visit_date: lastVisit?.[0]?.visit_date || null
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
      farm.farmer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.assigned_officer?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'approved' && farm.is_approved) ||
      (activeTab === 'pending' && !farm.is_approved);

    return matchesSearch && matchesTab;
  });

  // Calculate counts for tabs
  const approvedCount = farms.filter(f => f.is_approved).length;
  const pendingCount = farms.filter(f => !f.is_approved).length;

  const openViewDialog = (farm: Farm) => {
    setSelectedFarm(farm);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regional Farms</h1>
          <p className="text-muted-foreground">
            Monitor and view farms in {getAssignedRegions().length} region{getAssignedRegions().length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search farms, farmers, or officers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farms.length}</div>
            <p className="text-xs text-muted-foreground">
              In {getAssignedRegions().length} region{getAssignedRegions().length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Farms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              {farms.length ? Math.round((approvedCount / farms.length) * 100) : 0}% approval rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Farms in {getAssignedRegions().join(', ')}</CardTitle>
          <CardDescription>
            View and monitor all farms in your assigned region{getAssignedRegions().length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({farms.length})</TabsTrigger>
              <TabsTrigger value="approved" className="text-green-600">
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
                        <TableHead>Farm Details</TableHead>
                        <TableHead>Location & Size</TableHead>
                        <TableHead>Farmer & Officer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFarms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Sprout className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                No farms found in {getAssignedRegions().join(', ')}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFarms.map((farm) => (
                          <TableRow key={farm.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{farm.farm_name}</span>
                                <span className="text-sm text-muted-foreground capitalize">
                                  {farm.crop_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {farm.district}, {farm.region}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {farm.total_area} hectares
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3" />
                                  {farm.farmer?.name || 'Unknown Farmer'}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  Officer: {farm.assigned_officer?.full_name || 'Unassigned'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={farm.is_approved ? "default" : "secondary"}
                              >
                                {farm.is_approved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <span>{farm.visit_count} visits</span>
                                {farm.last_visit_date && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(farm.last_visit_date), 'MMM dd')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openViewDialog(farm)}
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

      {/* View Farm Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Farm Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedFarm?.farm_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFarm && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Farm Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedFarm.farm_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Crop Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedFarm.crop_type}</p>
                </div>
                <div>
                  <Label className="font-medium">Total Area</Label>
                  <p className="text-sm text-muted-foreground">{selectedFarm.total_area} hectares</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedFarm.is_approved ? "default" : "secondary"}>
                      {selectedFarm.is_approved ? "Approved" : "Pending Approval"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <Label className="font-medium mb-2 block">Location</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Region</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.region}</p>
                  </div>
                  <div>
                    <Label className="text-sm">District</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.district}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Location</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.location}</p>
                  </div>
                </div>
              </div>

              {/* Farmer Information */}
              <div>
                <Label className="font-medium mb-2 block">Farmer Information</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.farmer?.name || 'Not available'}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.farmer?.phone_number || 'Not available'}</p>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div>
                <Label className="font-medium mb-2 block">Visit Statistics</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Total Visits</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarm.visit_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Last Visit</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedFarm.last_visit_date 
                        ? format(new Date(selectedFarm.last_visit_date), 'PPP')
                        : 'No visits yet'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Assigned Officer</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedFarm.assigned_officer?.full_name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedFarm.updated_at), 'PPP')}
                    </p>
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