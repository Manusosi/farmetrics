import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { 
  Search, 
  MapPin, 
  User,
  Sprout,
  Eye,
  Edit,
  Save,
  Loader2,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  ZoomIn,
  Plus,
  FileImage
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FarmMap } from '@/components/maps/FarmMap';
import { format } from 'date-fns';
import { StatsGridSkeleton, FarmCardSkeleton } from '@/components/ui/skeleton-loaders';

interface FarmWithPolygon extends Tables<'farms'> {
  farmer: {
    name: string;
    phone_number?: string;
  };
  assigned_officer?: {
    full_name: string;
  };
  visit_images?: Array<{
    id: string;
    image_url: string;
    coordinates?: any;
    created_at: string;
  }>;
  visits_count?: number;
}

interface PolygonData {
  coordinates: [number, number][];
  status: 'approved' | 'pending' | 'issue';
  title: string;
  description?: string;
  photos?: { url: string; coordinates: [number, number] }[];
}

export function AdminPolygons() {
  const [farms, setFarms] = useState<FarmWithPolygon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<FarmWithPolygon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState<[number, number][]>([]);
  const [polygonNote, setPolygonNote] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapPolygons, setMapPolygons] = useState<PolygonData[]>([]);

  // Fetch farms with polygon data
  const fetchFarms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          *,
          farmer:farmers(name, phone_number),
          assigned_officer:profiles(full_name)
        `)
        .not('polygon_coordinates', 'is', null)
        .order('farm_name');

      if (error) throw error;

      // Get visit counts for each farm
      const farmsWithCounts = await Promise.all(
        (data || []).map(async (farm) => {
          const { count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('farm_id', farm.id);

          return {
            ...farm,
            visits_count: count || 0,
            visit_images: [] // Placeholder for now
          };
        })
      );

      setFarms(farmsWithCounts);

      // Convert farms to polygon data for map
      const polygons: PolygonData[] = farmsWithCounts
        .filter(farm => farm.polygon_coordinates)
        .map(farm => {
          let coordinates: [number, number][] = [];
          
          try {
            const coords = farm.polygon_coordinates as any;
            if (Array.isArray(coords) && coords.length > 0) {
              coordinates = coords.map((coord: any) => 
                Array.isArray(coord) && coord.length >= 2 
                  ? [coord[0], coord[1]] as [number, number]
                  : [0, 0] as [number, number]
              );
            }
          } catch (e) {
            console.warn('Invalid polygon coordinates for farm:', farm.farm_name);
          }

          return {
            coordinates,
            status: (farm.is_approved ? 'approved' : 'pending') as 'approved' | 'pending' | 'issue',
            title: farm.farm_name,
            description: `${farm.farmer?.name} - ${farm.crop_type} (${farm.region})`,
            photos: [] // No photos for now
          };
        })
        .filter(polygon => polygon.coordinates.length > 0);

      setMapPolygons(polygons);

    } catch (error) {
      console.error('Error fetching farms:', error);
      toast.error('Failed to load farm polygons');
    }
    setLoading(false);
  };

  // Get image URL from Supabase storage (disabled for now)
  // const getImageUrl = (imagePath: string) => {
  //   const { data } = supabase.storage
  //     .from('visit-images')
  //     .getPublicUrl(imagePath);
  //   return data.publicUrl;
  // };

  useEffect(() => {
    fetchFarms();
  }, []);

  // Filter farms
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = 
      farm.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farmer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === 'all' || 
      (statusFilter === 'approved' && farm.is_approved) ||
      (statusFilter === 'pending' && !farm.is_approved);

    const matchesRegion = !regionFilter || regionFilter === 'all' || farm.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Get unique regions
  const uniqueRegions = [...new Set(farms.map(f => f.region))];

  // Handle farm selection and map centering
  const handleFarmSelect = (farm: FarmWithPolygon) => {
    setSelectedFarm(farm);
    
    // Update map to show only this farm's polygon
    if (farm.polygon_coordinates) {
      try {
        const coords = farm.polygon_coordinates as any;
        let coordinates: [number, number][] = [];
        
        if (Array.isArray(coords) && coords.length > 0) {
          coordinates = coords.map((coord: any) => 
            Array.isArray(coord) && coord.length >= 2 
              ? [coord[0], coord[1]] as [number, number]
              : [0, 0] as [number, number]
          );
        }

        // Disabled photos for now
        const photos: any[] = [];

        setMapPolygons([{
          coordinates,
          status: (farm.is_approved ? 'approved' : 'pending') as 'approved' | 'pending' | 'issue',
          title: farm.farm_name,
          description: `${farm.farmer?.name} - ${farm.crop_type}`,
          photos: []
        }]);
      } catch (e) {
        console.warn('Error processing polygon coordinates:', e);
      }
    }
  };

  // Reset map to show all polygons
  const showAllPolygons = () => {
    setSelectedFarm(null);
    const polygons: PolygonData[] = farms
      .filter(farm => farm.polygon_coordinates)
      .map(farm => {
        let coordinates: [number, number][] = [];
        
        try {
          const coords = farm.polygon_coordinates as any;
          if (Array.isArray(coords) && coords.length > 0) {
            coordinates = coords.map((coord: any) => 
              Array.isArray(coord) && coord.length >= 2 
                ? [coord[0], coord[1]] as [number, number]
                : [0, 0] as [number, number]
            );
          }
        } catch (e) {
          console.warn('Invalid polygon coordinates for farm:', farm.farm_name);
        }

        return {
          coordinates,
          status: (farm.is_approved ? 'approved' : 'pending') as 'approved' | 'pending' | 'issue',
          title: farm.farm_name,
          description: `${farm.farmer?.name} - ${farm.crop_type}`,
          photos: []
        };
      })
      .filter(polygon => polygon.coordinates.length > 0);

    setMapPolygons(polygons);
  };

  // Edit polygon
  const startEditingPolygon = (farm: FarmWithPolygon) => {
    setSelectedFarm(farm);
    setShowEditDialog(true);
    setIsDrawingMode(true);
    
    try {
      const coords = farm.polygon_coordinates as any;
      if (Array.isArray(coords) && coords.length > 0) {
        const coordinates = coords.map((coord: any) => 
          Array.isArray(coord) && coord.length >= 2 
            ? [coord[0], coord[1]] as [number, number]
            : [0, 0] as [number, number]
        );
        setEditingPolygon(coordinates);
      } else {
        setEditingPolygon([]);
      }
    } catch (e) {
      setEditingPolygon([]);
    }
    
    setPolygonNote('');
  };

  // Save polygon changes
  const savePolygonChanges = async () => {
    if (!selectedFarm || editingPolygon.length < 3) {
      toast.error('Polygon must have at least 3 points');
      return;
    }

    try {
      const { error } = await supabase
        .from('farms')
        .update({
          polygon_coordinates: editingPolygon,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedFarm.id);

      if (error) throw error;

      toast.success('Polygon updated successfully');
      setShowEditDialog(false);
      setIsDrawingMode(false);
      setEditingPolygon([]);
      await fetchFarms();
    } catch (error) {
      console.error('Error updating polygon:', error);
      toast.error('Failed to update polygon');
    }
  };

  // Calculate polygon area (rough approximation)
  const calculatePolygonArea = (coordinates: [number, number][]) => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    return Math.abs(area / 2) * 111320 * 111320; // Rough conversion to square meters
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Polygon Management</h1>
          <p className="text-muted-foreground">
            Manage farm boundaries and geographic data across Ghana
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={showAllPolygons}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Show All
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      {loading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polygons</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farms.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {farms.filter(f => f.is_approved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {farms.filter(f => !f.is_approved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Area</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(farms.reduce((total, f) => total + (f.total_area || 0), 0) / 10000).toFixed(1)}ha
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[350px,1fr] xl:grid-cols-[400px,1fr]">
        {/* Farm List */}
        <div className="space-y-4 lg:order-1">
      {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
            <Input
                  placeholder="Search farms, farmers, or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
              </div>
              
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Farm List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farms ({filteredFarms.length})</CardTitle>
              <CardDescription>
                Showing {Math.min(6, filteredFarms.length)} of {filteredFarms.length} farms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <FarmCardSkeleton key={index} />
                    ))}
                    </div>
                ) : filteredFarms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No farms found</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredFarms.map((farm) => {
                      const polygonArea = farm.polygon_coordinates 
                        ? calculatePolygonArea(farm.polygon_coordinates as [number, number][])
                        : 0;
                      
                      return (
                        <div
                          key={farm.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedFarm?.id === farm.id ? 'bg-primary/10 border-primary shadow-md' : 'hover:bg-muted/30'
                          }`}
                          onClick={() => handleFarmSelect(farm)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm truncate">
                                  {farm.farm_name}
                                </h3>
                                <Badge 
                                  variant={farm.is_approved ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {farm.is_approved ? 'Approved' : 'Pending'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-blue-500" />
                                  <span className="font-medium">{farm.farmer?.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-green-500" />
                                  <span>{farm.region}, {farm.district}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Sprout className="h-3 w-3 text-orange-500" />
                                  <span>{farm.crop_type}</span>
                  </div>
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                                  <span className="text-xs font-medium">{farm.visits_count || 0} visits</span>
                                  {polygonArea > 0 ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                      ~{(polygonArea / 10000).toFixed(2)}ha
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      No area
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                      <Button 
                              variant="ghost"
                        size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingPolygon(farm);
                              }}
                              className="ml-2 opacity-60 hover:opacity-100"
                              title="Edit polygon"
                            >
                              <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Map */}
        <div className="flex flex-col lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedFarm ? `${selectedFarm.farm_name} - ${selectedFarm.farmer?.name}` : 'Ghana Farm Polygons'}
              </CardTitle>
              {selectedFarm && (
              <CardDescription>
                  {selectedFarm.region}, {selectedFarm.district} - {selectedFarm.crop_type}
                  {selectedFarm.assigned_officer && (
                    <span> • Officer: {selectedFarm.assigned_officer.full_name}</span>
                  )}
              </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[70vh] min-h-[500px] w-full border-0 rounded-lg overflow-hidden">
                <FarmMap
                  polygons={mapPolygons}
                  className="h-full w-full"
                  centerOnPolygons={true}
                  drawingMode={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Farm Details */}
          {selectedFarm && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Farm Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Farm ID</Label>
                    <p className="text-sm mt-1">{selectedFarm.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Size (Approx)</Label>
                    <p className="text-sm mt-1">{selectedFarm.farm_size_approx || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Farmer Phone</Label>
                    <p className="text-sm mt-1">{selectedFarm.farmer?.phone_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedFarm.created_at), 'MMM d, yyyy')}
                    </p>
              </div>
            </div>

                {/* Image display disabled until visit_images relation is fixed */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Edit Polygon Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Farm Polygon</DialogTitle>
            <DialogDescription>
              Click on the map to add points to the farm boundary. At least 3 points are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="h-[50vh] min-h-[400px] border rounded-lg overflow-hidden">
              <FarmMap
                polygons={[]}
                className="h-full w-full"
                drawingMode={isDrawingMode}
                drawnPolygon={editingPolygon}
                onDrawingComplete={setEditingPolygon}
                  />
                </div>
            
                <div>
              <Label htmlFor="polygon_note">Notes (Optional)</Label>
              <Textarea
                id="polygon_note"
                value={polygonNote}
                onChange={(e) => setPolygonNote(e.target.value)}
                placeholder="Add any notes about this polygon..."
                rows={3}
                />
              </div>
              
            <div className="text-sm text-muted-foreground">
              Points added: {editingPolygon.length}
              {editingPolygon.length >= 3 && (
                <span className="text-green-600 ml-2">
                  ✓ Ready to save
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setIsDrawingMode(false);
                setEditingPolygon([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setEditingPolygon([])}
              variant="outline"
              disabled={editingPolygon.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Points
            </Button>
            <Button 
              onClick={savePolygonChanges}
              disabled={editingPolygon.length < 3}
            >
                  <Save className="h-4 w-4 mr-2" />
              Save Polygon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 