import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreHorizontal, 
  User,
  Phone,
  MapPin,
  Edit,
  Trash2,
  FileEdit,
  Download,
  FileDown,
  CheckCircle,
  X,
  ChevronDown,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableRowSkeleton } from '@/components/ui/skeleton-loaders';

// Import Ghana data
import { ghanaRegions, getDistricts, searchLocations, locationExists, addLocation } from '@/data/ghanaRegions';

interface Farmer {
  id: string;
  name: string;
  phone?: string;
  region?: string;
  district?: string;
  location?: string;
  farmCount: number;
  createdAt: string;
}

// Get array of regions from Ghana data
const regions = Object.keys(ghanaRegions);

// Sort function for farmers
type SortField = 'name' | 'region' | 'district' | 'createdAt' | 'farmCount';
type SortDirection = 'asc' | 'desc';

export function AdminFarmers() {
  const location = useLocation();
  
  // State for farmers data
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Export format
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewFarmsDialogOpen, setIsViewFarmsDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  
  // Location search and suggestions
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // Edit dialog location suggestions
  const [editLocationInput, setEditLocationInput] = useState('');
  const [editLocationSuggestions, setEditLocationSuggestions] = useState<string[]>([]);
  const [showEditLocationSuggestions, setShowEditLocationSuggestions] = useState(false);
  
  // Refs for click outside detection
  const locationPopoverRef = useRef<HTMLDivElement>(null);
  const editLocationPopoverRef = useRef<HTMLDivElement>(null);
  
  // New farmer state
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    phone: '',
    region: '',
    district: '',
    location: '',
  });
  
  // Available districts based on selected region
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [editAvailableDistricts, setEditAvailableDistricts] = useState<string[]>([]);

  // Fetch farmers data from Supabase
  const fetchFarmers = async () => {
    setLoading(true);
    try {
      // Get farmers with farm count
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select(`
          id,
          name,
          phone_number,
          region,
          district,
          location,
          created_at
        `)
        .order('name');

      if (farmersError) throw farmersError;

      // Get farm counts for each farmer
      const { data: farmCounts, error: countError } = await supabase
        .from('farms')
        .select('farmer_id');

      if (countError) throw countError;

      // Count farms per farmer
      const farmCountMap = farmCounts.reduce((acc: Record<string, number>, farm) => {
        acc[farm.farmer_id] = (acc[farm.farmer_id] || 0) + 1;
        return acc;
      }, {});

      // Transform data to match our interface
      const formattedFarmers: Farmer[] = farmersData.map(farmer => ({
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone_number || undefined,
        region: farmer.region || undefined,
        district: farmer.district || undefined,
        location: farmer.location || undefined,
        farmCount: farmCountMap[farmer.id] || 0,
        createdAt: farmer.created_at
      }));

      setFarmers(formattedFarmers);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      // Don't show toast for empty data - UI already shows appropriate message
    }
    setLoading(false);
  };

  // Fetch farmers data
  useEffect(() => {
    fetchFarmers();
  }, [location.pathname]); // Refetch when navigating to this page

  // Update districts when region changes for new farmer
  useEffect(() => {
    if (newFarmer.region) {
      setAvailableDistricts(getDistricts(newFarmer.region));
      setNewFarmer(prev => ({ ...prev, district: '' })); // Reset district when region changes
    } else {
      setAvailableDistricts([]);
    }
  }, [newFarmer.region]);
  
  // Update districts when region changes for edit dialog
  useEffect(() => {
    if (selectedFarmer?.region) {
      setEditAvailableDistricts(getDistricts(selectedFarmer.region));
      setEditLocationInput(selectedFarmer.location || '');
    }
  }, [selectedFarmer?.region]);
  
  // Update districts when region filter changes
  useEffect(() => {
    if (regionFilter) {
      setDistrictFilter(null);
    }
  }, [regionFilter]);
  
  // Update location suggestions based on input
  useEffect(() => {
    if (newFarmer.district && locationInput) {
      const suggestions = searchLocations(newFarmer.district, locationInput);
      setLocationSuggestions(suggestions);
    } else {
      setLocationSuggestions([]);
    }
  }, [locationInput, newFarmer.district]);
  
  // Update edit location suggestions
  useEffect(() => {
    if (selectedFarmer?.district && editLocationInput) {
      const suggestions = searchLocations(selectedFarmer.district, editLocationInput);
      setEditLocationSuggestions(suggestions);
    } else {
      setEditLocationSuggestions([]);
    }
  }, [editLocationInput, selectedFarmer?.district]);
  
  // Click outside handlers for location suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationPopoverRef.current && !locationPopoverRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
      
      if (editLocationPopoverRef.current && !editLocationPopoverRef.current.contains(event.target as Node)) {
        setShowEditLocationSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter farmers based on search query, region filter, and district filter
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farmer.phone.includes(searchQuery) ||
                         farmer.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = !regionFilter || farmer.region === regionFilter;
    const matchesDistrict = !districtFilter || farmer.district === districtFilter;
    
    return matchesSearch && matchesRegion && matchesDistrict;
  });
  
  // Sort farmers based on sort field and direction
  const sortedFarmers = [...filteredFarmers].sort((a, b) => {
    let comparison = 0;
    
    // Handle different field types
    if (sortField === 'name' || sortField === 'region' || sortField === 'district') {
      comparison = a[sortField].localeCompare(b[sortField]);
    } else if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'farmCount') {
      comparison = a.farmCount - b.farmCount;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFarmer(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle adding a new farmer
  const handleAddFarmer = async () => {
    if (!newFarmer.name || !newFarmer.region || !newFarmer.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsAdding(true);
      const { data, error } = await supabase
        .from('farmers')
        .insert(newFarmer)
        .select('*')
        .single();

      if (error) throw error;

      setFarmers(prev => [...prev, data]);
      setShowAddForm(false);
      setNewFarmer({ name: '', phone_number: '', region: '', district: '', location: '' });
      toast.success('Farmer added successfully');
    } catch (error: any) {
      toast.error('Failed to add farmer: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditFarmer = async () => {
    if (!selectedFarmer || !selectedFarmer.name || !selectedFarmer.region || !selectedFarmer.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsUpdating(true);
      const { data, error } = await supabase
        .from('farmers')
        .update({
          name: selectedFarmer.name,
          phone_number: selectedFarmer.phone_number,
          region: selectedFarmer.region,
          district: selectedFarmer.district,
          location: selectedFarmer.location,
        })
        .eq('id', selectedFarmer.id)
        .select('*')
        .single();

      if (error) throw error;

      setFarmers(prev => prev.map(f => f.id === selectedFarmer.id ? data : f));
      setShowEditForm(false);
      setSelectedFarmer(null);
      toast.success('Farmer updated successfully');
    } catch (error: any) {
      toast.error('Failed to update farmer: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFarmer = async () => {
    if (!selectedFarmer) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', selectedFarmer.id);

      if (error) throw error;

      setFarmers(prev => prev.filter(f => f.id !== selectedFarmer.id));
      setShowDeleteDialog(false);
      setSelectedFarmer(null);
      toast.success('Farmer deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete farmer: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Open edit dialog and set the selected farmer
  const openEditDialog = (farmer: any) => {
    setSelectedFarmer(farmer);
    setEditAvailableDistricts(getDistricts(farmer.region));
    setEditLocationInput(farmer.location);
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog and set the selected farmer
  const openDeleteDialog = (farmer: any) => {
    setSelectedFarmer(farmer);
    setIsDeleteDialogOpen(true);
  };
  
  // Open view farms dialog and set the selected farmer
  const openViewFarmsDialog = (farmer: any) => {
    setSelectedFarmer(farmer);
    setIsViewFarmsDialogOpen(true);
  };

  // Handle region change in edit dialog
  const handleEditRegionChange = (region: string) => {
    const districts = getDistricts(region);
    setEditAvailableDistricts(districts);
    setSelectedFarmer(prev => ({ 
      ...prev, 
      region, 
      district: districts.includes(prev.district) ? prev.district : '' 
    }));
  };
  
  // Handle selecting a location suggestion
  const handleSelectLocationSuggestion = (location: string) => {
    setNewFarmer(prev => ({ ...prev, location }));
    setLocationInput(location);
    setShowLocationSuggestions(false);
  };
  
  // Handle selecting an edit location suggestion
  const handleSelectEditLocationSuggestion = (location: string) => {
    setSelectedFarmer(prev => ({ ...prev, location }));
    setEditLocationInput(location);
    setShowEditLocationSuggestions(false);
  };
  
  // Handle export functionality
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    setExportFormat(format);
    console.log(`Exporting farmers data as ${format}...`);
    
    // In a real app, you'd trigger an API call to generate the export file
    // For now, we'll just log the data we'd export
    console.log('Data to export:', filteredFarmers);
    
    // You would typically trigger a download here
    setTimeout(() => {
      alert(`Export as ${format.toUpperCase()} completed!`);
    }, 1000);
  };
  
  // Toggle sort direction when clicking on a column header
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header with title and Add Farmer button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Farmers Management</h2>
          <p className="text-muted-foreground">
            Manage farmer records and their farm associations
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex gap-2 whitespace-nowrap">
              <PlusCircle className="h-5 w-5" />
              <span>Add Farmer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
              <DialogDescription>
                Enter the farmer's details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={newFarmer.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+233 12 345 6789"
                    value={newFarmer.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              {/* Region Selection */}
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={newFarmer.region} 
                  onValueChange={(value) => setNewFarmer(prev => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* District and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="district">District</Label>
                  <Select 
                    value={newFarmer.district} 
                    onValueChange={(value) => {
                      setNewFarmer(prev => ({ ...prev, district: value, location: '' }));
                      setLocationInput('');
                    }}
                    disabled={!newFarmer.region}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!newFarmer.region ? "Select region first" : "Select district"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {availableDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 relative" ref={locationPopoverRef}>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      placeholder="Specific location"
                      disabled={!newFarmer.district}
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value);
                        setNewFarmer(prev => ({ ...prev, location: e.target.value }));
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                    />
                    
                    {/* Location suggestions dropdown */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute w-full z-10 mt-1 bg-popover rounded-md border shadow-md overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {locationSuggestions.map((suggestion, index) => (
                            <div 
                              key={index}
                              className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
                              onClick={() => handleSelectLocationSuggestion(suggestion)}
                            >
                              <span>{suggestion}</span>
                              {locationInput === suggestion && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {newFarmer.district && newFarmer.location && !locationExists(newFarmer.district, newFarmer.location) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      New location will be added to database
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleAddFarmer}
                disabled={!newFarmer.name || !newFarmer.phone || !newFarmer.region || !newFarmer.district || !newFarmer.location}
              >
                Save Farmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search farmers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  {(regionFilter || districtFilter) && (
                    <Badge variant="secondary" className="ml-1 px-1 rounded-full">
                      {regionFilter && districtFilter ? 2 : 1}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Filter by Region</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-48 overflow-y-auto">
                  <DropdownMenuCheckboxItem
                    checked={!regionFilter}
                    onCheckedChange={() => {
                      setRegionFilter(null);
                      setDistrictFilter(null);
                    }}
                  >
                    All Regions
                  </DropdownMenuCheckboxItem>
                  {regions.map(region => (
                    <DropdownMenuCheckboxItem
                      key={region}
                      checked={regionFilter === region}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRegionFilter(region);
                          setDistrictFilter(null);
                        } else {
                          setRegionFilter(null);
                        }
                      }}
                    >
                      {region}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>

                {regionFilter && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by District</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-48 overflow-y-auto">
                      <DropdownMenuCheckboxItem
                        checked={!districtFilter}
                        onCheckedChange={() => setDistrictFilter(null)}
                      >
                        All Districts
                      </DropdownMenuCheckboxItem>
                      {getDistricts(regionFilter).map(district => (
                        <DropdownMenuCheckboxItem
                          key={district}
                          checked={districtFilter === district}
                          onCheckedChange={(checked) => checked ? setDistrictFilter(district) : setDistrictFilter(null)}
                        >
                          {district}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'excel' | 'pdf')}>
              <DropdownMenuRadioItem value="csv" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>CSV File</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="excel" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>Excel File</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pdf" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>PDF Report</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between items-center" onClick={() => handleExport(exportFormat)}>
              <span>Download Now</span>
              <Download className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Results count and active filters */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Showing {sortedFarmers.length} of {farmers.length} farmers</span>
        {(regionFilter || districtFilter || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2">
            {searchQuery && (
              <Badge variant="outline" className="px-2 py-0.5 flex items-center gap-1 bg-muted/30">
                <Search className="h-3 w-3" />
                <span className="truncate max-w-28">{searchQuery}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setSearchQuery('');
                  }} 
                />
              </Badge>
            )}
            {regionFilter && (
              <Badge variant="outline" className="px-2 py-0.5 flex items-center gap-1 bg-muted/30">
                <span>{regionFilter}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setRegionFilter(null);
                    setDistrictFilter(null);
                  }} 
                />
              </Badge>
            )}
            {districtFilter && (
              <Badge variant="outline" className="px-2 py-0.5 flex items-center gap-1 bg-muted/30">
                <span>{districtFilter}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setDistrictFilter(null);
                  }} 
                />
              </Badge>
            )}
            {(regionFilter || districtFilter || searchQuery) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter(null);
                  setDistrictFilter(null);
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Farmers Table */}
      <Card>
        <CardHeader className="px-6 pb-4">
          <CardTitle>Farmers Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      {sortField === 'name' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortChange('region')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Region/District</span>
                      {sortField === 'region' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortChange('farmCount')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Farms</span>
                      {sortField === 'farmCount' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Registered</span>
                      {sortField === 'createdAt' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <TableRowSkeleton columns={7} />
                    <TableRowSkeleton columns={7} />
                    <TableRowSkeleton columns={7} />
                    <TableRowSkeleton columns={7} />
                    <TableRowSkeleton columns={7} />
                  </>
                ) : sortedFarmers.length > 0 ? (
                  sortedFarmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{farmer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{farmer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{farmer.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="outline" className="max-w-fit">{farmer.region}</Badge>
                          <span className="text-xs text-muted-foreground mt-1 truncate">{farmer.district}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={farmer.farmCount > 0 ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/90 transition-colors"
                          onClick={() => openViewFarmsDialog(farmer)}
                        >
                          {farmer.farmCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(farmer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              <DropdownMenuItem 
                                onClick={() => openEditDialog(farmer)}
                                className="flex gap-2 items-center"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openViewFarmsDialog(farmer)}
                                className="flex gap-2 items-center"
                              >
                                <FileEdit className="h-4 w-4" />
                                <span>View farms</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(farmer)}
                              className="flex gap-2 items-center text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>No farmers found matching your filters</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => {
                            setSearchQuery('');
                            setRegionFilter(null);
                            setDistrictFilter(null);
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Farmer</DialogTitle>
            <DialogDescription>
              Update the farmer's details below.
            </DialogDescription>
          </DialogHeader>
          {selectedFarmer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedFarmer.name}
                    onChange={(e) => setSelectedFarmer({...selectedFarmer, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={selectedFarmer.phone}
                    onChange={(e) => setSelectedFarmer({...selectedFarmer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-region">Region</Label>
                <Select 
                  value={selectedFarmer.region} 
                  onValueChange={handleEditRegionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-district">District</Label>
                  <Select 
                    value={selectedFarmer.district} 
                    onValueChange={(value) => {
                      setSelectedFarmer({...selectedFarmer, district: value, location: ''});
                      setEditLocationInput('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {editAvailableDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 relative" ref={editLocationPopoverRef}>
                  <Label htmlFor="edit-location">Location</Label>
                  <div className="relative">
                    <Input
                      id="edit-location"
                      placeholder="Specific location"
                      disabled={!selectedFarmer.district}
                      value={editLocationInput}
                      onChange={(e) => {
                        setEditLocationInput(e.target.value);
                        setSelectedFarmer({...selectedFarmer, location: e.target.value});
                        setShowEditLocationSuggestions(true);
                      }}
                      onFocus={() => setShowEditLocationSuggestions(true)}
                    />
                    
                    {/* Location suggestions dropdown */}
                    {showEditLocationSuggestions && editLocationSuggestions.length > 0 && (
                      <div className="absolute w-full z-10 mt-1 bg-popover rounded-md border shadow-md overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {editLocationSuggestions.map((suggestion, index) => (
                            <div 
                              key={index}
                              className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
                              onClick={() => handleSelectEditLocationSuggestion(suggestion)}
                            >
                              <span>{suggestion}</span>
                              {editLocationInput === suggestion && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedFarmer.district && selectedFarmer.location && !locationExists(selectedFarmer.district, selectedFarmer.location) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      New location will be added to database
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleEditFarmer}
              disabled={!selectedFarmer?.name || !selectedFarmer?.phone || !selectedFarmer?.region || !selectedFarmer?.district || !selectedFarmer?.location}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this farmer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedFarmer && (
            <div className="py-4">
              <p>
                You are about to delete:
              </p>
              <p className="font-bold mt-2">
                {selectedFarmer.name}
              </p>
              <p className="text-muted-foreground mt-1">
                {selectedFarmer.phone} • {selectedFarmer.region}, {selectedFarmer.district}
              </p>
              <div className="mt-4 flex items-center gap-2 p-3 border rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  This will also delete all associated farm records, visits, and other data related to this farmer.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={handleDeleteFarmer}>
              Delete Farmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Farms Dialog */}
      <Dialog open={isViewFarmsDialogOpen} onOpenChange={setIsViewFarmsDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Farms for {selectedFarmer?.name}</DialogTitle>
            <DialogDescription>
              View all farms associated with this farmer
            </DialogDescription>
          </DialogHeader>
          {selectedFarmer && (
            <div className="py-2">
              {/* Farm info summary */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="px-2 py-1 text-sm">
                  {selectedFarmer.farmCount} {selectedFarmer.farmCount === 1 ? 'Farm' : 'Farms'}
                </Badge>
                <Badge variant="outline" className="px-2 py-1 text-sm">
                  {selectedFarmer.region}
                </Badge>
              </div>
              
              {/* Placeholder farms list */}
              {selectedFarmer.farmCount > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Farm Name</TableHead>
                        <TableHead>Crop Type</TableHead>
                        <TableHead>Area (ha)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* We'll show placeholder farm data based on the farmCount */}
                      {Array.from({ length: selectedFarmer.farmCount }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>{selectedFarmer.name}'s Farm {index + 1}</TableCell>
                          <TableCell>Cocoa</TableCell>
                          <TableCell>{(3 + index * 1.5).toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant={index % 2 === 0 ? "outline" : "default"}>
                              {index % 2 === 0 ? 'Pending' : 'Approved'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <p>No farms registered for this farmer</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setIsViewFarmsDialogOpen(false);
                      // In a real app, this would navigate to the add farm form
                      console.log('Add farm for farmer:', selectedFarmer.id);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Farm
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewFarmsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 