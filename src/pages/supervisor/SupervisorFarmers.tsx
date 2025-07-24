import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { TableRowSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search, 
  User, 
  Phone, 
  MapPin, 
  Sprout,
  Calendar,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Farmer {
  id: string;
  name: string;
  phone_number?: string;
  gender?: string;
  region: string;
  district: string;
  location?: string;
  created_at: string;
  farmCount: number;
}

export function SupervisorFarmers() {
  const { profile } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');

  // Fetch farmers data for supervisor's region only
  const fetchFarmers = async () => {
    if (!profile?.region) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get farmers in supervisor's region
      const { data: farmersData, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('region', profile.region)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get farm count for each farmer
      const { data: farmCounts } = await supabase
        .from('farms')
        .select('farmer_id')
        .eq('region', profile.region);

      const farmCountMap = (farmCounts || []).reduce((acc: Record<string, number>, farm) => {
        acc[farm.farmer_id] = (acc[farm.farmer_id] || 0) + 1;
        return acc;
      }, {});

      const formattedFarmers: Farmer[] = (farmersData || []).map(farmer => ({
        id: farmer.id,
        name: farmer.name,
        phone_number: farmer.phone_number,
        gender: farmer.gender,
        region: farmer.region,
        district: farmer.district,
        location: farmer.location,
        farmCount: farmCountMap[farmer.id] || 0,
        created_at: farmer.created_at
      }));

      setFarmers(formattedFarmers);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      // Don't show toast for empty data - UI already shows appropriate message
    }
    setLoading(false);
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchFarmers);

  // Filter farmers
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGender = genderFilter === 'all' || farmer.gender === genderFilter;

    return matchesSearch && matchesGender;
  });

  // Sort farmers by creation date (newest first)
  const sortedFarmers = filteredFarmers.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate statistics
  const totalFarmers = farmers.length;
  const maleFarmers = farmers.filter(f => f.gender === 'male').length;
  const femaleFarmers = farmers.filter(f => f.gender === 'female').length;
  const totalFarms = farmers.reduce((sum, farmer) => sum + farmer.farmCount, 0);

  const openViewDialog = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regional Farmers</h1>
          <p className="text-muted-foreground">
            View and monitor farmers in {profile?.region} region
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarmers}</div>
            <p className="text-xs text-muted-foreground">
              In {profile?.region} region
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male Farmers</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maleFarmers}</div>
            <p className="text-xs text-muted-foreground">
              {totalFarmers ? Math.round((maleFarmers / totalFarmers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female Farmers</CardTitle>
            <User className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{femaleFarmers}</div>
            <p className="text-xs text-muted-foreground">
              {totalFarmers ? Math.round((femaleFarmers / totalFarmers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Sprout className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarms}</div>
            <p className="text-xs text-muted-foreground">
              {totalFarmers ? (totalFarms / totalFarmers).toFixed(1) : 0} farms per farmer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="gender-filter" className="text-sm">Gender:</Label>
          <select
            id="gender-filter"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Farmers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Farmers in {profile?.region}</CardTitle>
          <CardDescription>
            View all registered farmers in your region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Farms</TableHead>
                  <TableHead>Registered</TableHead>
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
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {farmer.phone_number || 'Not provided'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {farmer.district}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={farmer.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}
                        >
                          {farmer.gender ? farmer.gender.charAt(0).toUpperCase() + farmer.gender.slice(1) : 'Not specified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Sprout className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{farmer.farmCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(farmer.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewDialog(farmer)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No farmers found in {profile?.region}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Farmer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Farmer Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedFarmer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFarmer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedFarmer.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone Number</Label>
                  <p className="text-sm text-muted-foreground">{selectedFarmer.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="font-medium">Gender</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedFarmer.gender || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="font-medium">Farms Count</Label>
                  <p className="text-sm text-muted-foreground">{selectedFarmer.farmCount} farms</p>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <Label className="font-medium mb-2 block">Location</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Region</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarmer.region}</p>
                  </div>
                  <div>
                    <Label className="text-sm">District</Label>
                    <p className="text-sm text-muted-foreground">{selectedFarmer.district}</p>
                  </div>
                  {selectedFarmer.location && (
                    <div className="col-span-2">
                      <Label className="text-sm">Specific Location</Label>
                      <p className="text-sm text-muted-foreground">{selectedFarmer.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Information */}
              <div>
                <Label className="font-medium mb-2 block">Registration Details</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Registered</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedFarmer.created_at), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Farmer ID</Label>
                      <p className="text-sm text-muted-foreground font-mono">{selectedFarmer.id.slice(0, 8)}</p>
                    </div>
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