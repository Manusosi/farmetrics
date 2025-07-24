import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { StatsGridSkeleton, FarmCardSkeleton } from '@/components/ui/skeleton-loaders';
import { FarmMap } from '@/components/maps/FarmMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Map as MapIcon,
  Eye,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ghanaRegions } from '@/data/ghanaRegions';

interface FarmWithPolygon {
  id: string;
  farm_name: string;
  region: string;
  district: string;
  location: string;
  polygon_coordinates?: any;
  total_area: number;
  is_approved: boolean;
  created_at: string;
  farmer?: {
    name: string;
    phone_number: string;
  };
  assigned_officer?: {
    full_name: string;
  };
  visit_images: any[];
}

export function SupervisorPolygons() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<FarmWithPolygon[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmWithPolygon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

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

  // Fetch farms with polygon data for supervisor's assigned regions
  const fetchFarms = async () => {
    if (!profile?.region) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const assignedRegions = getAssignedRegions();
      
      if (assignedRegions.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('farms')
        .select(`
          id,
          farm_name,
          region,
          district,
          location,
          polygon_coordinates,
          total_area,
          is_approved,
          created_at,
          farmer:farmers(name, phone_number),
          assigned_officer:profiles!farms_assigned_officer_id_fkey(full_name)
        `)
        .in('region', assignedRegions)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add empty visit_images array as placeholder
      const farmsWithData = (data || []).map(farm => ({
        ...farm,
        visit_images: [] // Placeholder for visit images
      }));

      setFarms(farmsWithData);
    } catch (error) {
      console.error('Error fetching farms:', error);
      // Don't show toast for empty data
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchFarms);

  // Filter farms
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = 
      farm.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farmer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && farm.is_approved) ||
      (statusFilter === 'pending' && !farm.is_approved);

    const matchesRegion = regionFilter === 'all' || farm.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Get unique regions from assigned regions
  const uniqueRegions = getAssignedRegions();

  // Handle farm selection and map centering
  const handleFarmSelect = (farm: FarmWithPolygon) => {
    setSelectedFarm(farm);
  };

  // Calculate stats
  const totalFarms = farms.length;
  const approvedFarms = farms.filter(f => f.is_approved).length;
  const pendingFarms = farms.filter(f => !f.is_approved).length;
  const farmsWithPolygons = farms.filter(f => f.polygon_coordinates).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Farm Polygons</h1>
        <p className="text-muted-foreground">
          View and monitor farm boundaries in {uniqueRegions.join(', ')}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFarms}</div>
              <p className="text-xs text-muted-foreground">
                In your assigned regions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Polygons</CardTitle>
              <MapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farmsWithPolygons}</div>
              <p className="text-xs text-muted-foreground">
                {totalFarms ? Math.round((farmsWithPolygons / totalFarms) * 100) : 0}% mapped
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedFarms}</div>
              <p className="text-xs text-muted-foreground">
                Active farms
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Eye className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFarms}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[350px,1fr] xl:grid-cols-[400px,1fr]">
        {/* Farm List */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Farms</CardTitle>
            <CardDescription>
              Farms with boundary data in your regions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search farms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Farm List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  <FarmCardSkeleton />
                  <FarmCardSkeleton />
                  <FarmCardSkeleton />
                </div>
              ) : filteredFarms.length === 0 ? (
                <div className="text-center py-8">
                  <Sprout className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No farms found</p>
                </div>
              ) : (
                filteredFarms.map((farm) => (
                  <Card 
                    key={farm.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedFarm?.id === farm.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleFarmSelect(farm)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm truncate">{farm.farm_name}</h4>
                          <Badge 
                            variant={farm.is_approved ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {farm.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{farm.farmer?.name || 'Unknown Farmer'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{farm.district}, {farm.region}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(farm.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                          {farm.total_area && (
                            <div className="flex items-center gap-1">
                              <Sprout className="h-3 w-3" />
                              <span>{farm.total_area} hectares</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div className="text-xs text-muted-foreground text-center pt-2">
              Showing {filteredFarms.length} of {farms.length} farms
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Regional Farm Map
            </CardTitle>
            <CardDescription>
              Interactive map showing farm boundaries in {uniqueRegions.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[70vh] min-h-[500px] rounded-lg overflow-hidden">
              <FarmMap 
                farms={filteredFarms}
                selectedFarm={selectedFarm}
                onFarmSelect={handleFarmSelect}
                focusRegions={uniqueRegions}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Farm Details */}
      {selectedFarm && (
        <Card>
          <CardHeader>
            <CardTitle>Farm Details: {selectedFarm.farm_name}</CardTitle>
            <CardDescription>
              Complete information for the selected farm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium">Farm Name</div>
                <p className="text-sm text-muted-foreground">{selectedFarm.farm_name}</p>
              </div>
              <div>
                <div className="text-sm font-medium">Farmer</div>
                <p className="text-sm text-muted-foreground">{selectedFarm.farmer?.name || 'Unknown'}</p>
              </div>
              <div>
                <div className="text-sm font-medium">Location</div>
                <p className="text-sm text-muted-foreground">{selectedFarm.district}, {selectedFarm.region}</p>
              </div>
              <div>
                <div className="text-sm font-medium">Area</div>
                <p className="text-sm text-muted-foreground">{selectedFarm.total_area} hectares</p>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <Badge variant={selectedFarm.is_approved ? "default" : "secondary"}>
                  {selectedFarm.is_approved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Officer</div>
                <p className="text-sm text-muted-foreground">{selectedFarm.assigned_officer?.full_name || 'Unassigned'}</p>
              </div>
              <div>
                <div className="text-sm font-medium">Created</div>
                <p className="text-sm text-muted-foreground">{format(new Date(selectedFarm.created_at), 'PPP')}</p>
              </div>
              <div>
                <div className="text-sm font-medium">Polygon</div>
                <p className="text-sm text-muted-foreground">
                  {selectedFarm.polygon_coordinates ? 'Available' : 'Not mapped'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 