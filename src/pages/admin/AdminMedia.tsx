import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { StatsGridSkeleton, MediaGridSkeleton } from '@/components/ui/skeleton-loaders';
import { 
  Search, 
  Download, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  MapPin,
  Filter,
  Grid,
  List,
  ExternalLink,
  Camera,
  Info,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuCheckboxItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from 'date-fns';

interface VisitImage extends Tables<'visit_images'> {
  visit?: {
    visit_date: string;
    visit_number: number;
    farm: {
      farm_name: string;
      farmer: {
        name: string;
      };
    };
    officer: {
      full_name: string;
    };
  };
}

interface ExifData {
  camera?: string;
  timestamp?: string;
  gps?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  device?: string;
  software?: string;
  [key: string]: any;
}

export function AdminMedia() {
  const [images, setImages] = useState<VisitImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<VisitImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [filterOfficer, setFilterOfficer] = useState<string>('');
  const [filterFarm, setFilterFarm] = useState<string>('');
  const [officers, setOfficers] = useState<Array<{id: string, name: string}>>([]);
  const [farms, setFarms] = useState<Array<{id: string, name: string}>>([]);

  // Fetch visit images with related data
  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visit_images')
        .select(`
          *,
          visit:visits(
            visit_date,
            visit_number,
            farm:farms(
              farm_name,
              farmer:farmers(name)
            ),
            officer:profiles!visits_officer_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      // Don't show toast - users expect no images initially
    }
    setLoading(false);
  };

  // Fetch officers and farms for filters
  const fetchFilters = async () => {
    try {
      // Get officers
      const { data: officersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'field_officer')
        .order('full_name');

      // Get farms
      const { data: farmsData } = await supabase
        .from('farms')
        .select('id, farm_name')
        .order('farm_name');

      setOfficers(officersData?.map(o => ({id: o.id, name: o.full_name})) || []);
      setFarms(farmsData?.map(f => ({id: f.id, name: f.farm_name})) || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchFilters();
  }, []);

  // Filter images based on search and filters
  const filteredImages = images.filter(image => {
    const matchesSearch = 
      image.visit?.farm?.farm_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.visit?.farm?.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.visit?.officer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOfficer = !filterOfficer || image.visit?.officer?.full_name === filterOfficer;
    const matchesFarm = !filterFarm || image.visit?.farm?.farm_name === filterFarm;

    return matchesSearch && matchesOfficer && matchesFarm;
  });

  // Parse EXIF data
  const parseExifData = (exifData: any): ExifData => {
    if (!exifData) return {};
    
    try {
      if (typeof exifData === 'string') {
        return JSON.parse(exifData);
      }
      return exifData as ExifData;
    } catch {
      return {};
    }
  };

  // Download image
  const downloadImage = async (image: VisitImage) => {
    try {
      const { data } = await supabase.storage
        .from('visit-images')
        .download(image.image_url);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visit_image_${image.visit?.visit_number || 'unknown'}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('visit-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            View and manage visit images with EXIF metadata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
            <Input
                placeholder="Search by farm, farmer, or officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
            />
          </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Officer {filterOfficer && `(${filterOfficer})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Officer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterOfficer('')}>
                  All Officers
                </DropdownMenuItem>
                {officers.map((officer) => (
                  <DropdownMenuCheckboxItem
                    key={officer.id}
                    checked={filterOfficer === officer.name}
                    onCheckedChange={(checked) => {
                      setFilterOfficer(checked ? officer.name : '');
                    }}
                  >
                    {officer.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Farm {filterFarm && `(${filterFarm})`}
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Farm</DropdownMenuLabel>
              <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterFarm('')}>
                All Farms
                </DropdownMenuItem>
                {farms.map((farm) => (
                <DropdownMenuCheckboxItem
                    key={farm.id}
                    checked={filterFarm === farm.name}
                    onCheckedChange={(checked) => {
                      setFilterFarm(checked ? farm.name : '');
                    }}
                  >
                    {farm.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {loading ? (
        <StatsGridSkeleton count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{images.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With EXIF Data</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {images.filter(img => img.exif_data).length}
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With GPS</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {images.filter(img => img.coordinates).length}
                </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Images Display */}
          {loading ? (
        <MediaGridSkeleton count={8} />
      ) : filteredImages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No images found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
                </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image) => {
            const exifData = parseExifData(image.exif_data);
            return (
              <Card key={image.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <div 
                  className="aspect-video relative overflow-hidden"
                  onClick={() => {
                    setSelectedImage(image);
                    setShowImageModal(true);
                  }}
                >
                  <img
                    src={getImageUrl(image.image_url)}
                    alt="Visit"
                    className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  {image.exif_data && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                          EXIF
                        </Badge>
                  )}
                  {image.coordinates && (
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      GPS
                    </Badge>
                  )}
                      </div>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">
                      {image.visit?.farm?.farm_name || 'Farm name not available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Visit #{image.visit?.visit_number || 'N/A'}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <User className="h-3 w-3 mr-1" />
                      {image.visit?.officer?.full_name || 'Officer name not available'}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {image.visit?.visit_date 
                        ? format(new Date(image.visit.visit_date), 'MMM d, yyyy')
                        : 'Date not available'
                      }
                    </div>
                  </div>
                </CardContent>
                </Card>
            );
          })}
            </div>
          ) : (
        <Card>
          <CardContent className="p-0">
              <div className="space-y-4 p-4">
              {filteredImages.map((image) => {
                const exifData = parseExifData(image.exif_data);
                return (
                  <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(image.image_url)}
                        alt="Visit"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {image.visit?.farm?.farm_name || 'Farm name not available'}
                        </h3>
                        {image.exif_data && <Badge variant="secondary" className="text-xs">EXIF</Badge>}
                        {image.coordinates && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            GPS
                            </Badge>
                          )}
                        </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Visit #{image.visit?.visit_number || 'N/A'}</div>
                        <div>{image.visit?.officer?.full_name || 'Officer name not available'}</div>
                        <div>
                          {image.visit?.visit_date 
                            ? format(new Date(image.visit.visit_date), 'MMM d, yyyy')
                            : 'Date not available'
                          }
                        </div>
                        <div>Farmer: {image.visit?.farm?.farmer?.name || 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedImage(image);
                          setShowImageModal(true);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(image)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              </div>
          </CardContent>
        </Card>
      )}
      
      {/* Image Details Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
            <DialogDescription>
              Visit image with metadata and EXIF information
            </DialogDescription>
          </DialogHeader>
          
          {selectedImage && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Image */}
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(selectedImage.image_url)}
                    alt="Visit"
                    className="w-full h-full object-cover"
                  />
                </div>
                          <Button 
                  onClick={() => downloadImage(selectedImage)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                          </Button>
                  </div>
                  
              {/* Metadata */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Visit Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Farm:</span>
                      <span>{selectedImage.visit?.farm?.farm_name || 'Farm name not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Farmer:</span>
                      <span>{selectedImage.visit?.farm?.farmer?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Officer:</span>
                      <span>{selectedImage.visit?.officer?.full_name || 'Officer name not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visit #:</span>
                      <span>{selectedImage.visit?.visit_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>
                        {selectedImage.visit?.visit_date 
                          ? format(new Date(selectedImage.visit.visit_date), 'PPP')
                          : 'Date not available'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedImage.coordinates && (
                  <div>
                    <h3 className="font-medium mb-2">GPS Coordinates</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latitude:</span>
                        <span>{(selectedImage.coordinates as any)?.latitude || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitude:</span>
                        <span>{(selectedImage.coordinates as any)?.longitude || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
                  
                {selectedImage.exif_data && (
                  <div>
                    <h3 className="font-medium mb-2">EXIF Data</h3>
                    <ScrollArea className="h-48">
                      <div className="space-y-2 text-sm">
                        {Object.entries(parseExifData(selectedImage.exif_data)).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-right max-w-32 truncate">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 