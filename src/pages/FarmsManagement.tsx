import { useState } from 'react';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FarmMap } from '@/components/maps/FarmMap';
import {
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Sprout,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Mock data for farms
const mockFarms = [
  {
    id: 'F001',
    name: 'John Doe\'s Farm',
    farmer: 'John Doe',
    region: 'Ashanti',
    district: 'Kumasi',
    size: 5.2,
    cropType: 'Cocoa',
    status: 'approved',
    lastVisit: '2024-03-15',
    coordinates: [
      [6.6885, -1.6244] as [number, number],
      [6.6900, -1.6244] as [number, number],
      [6.6900, -1.6200] as [number, number],
      [6.6885, -1.6200] as [number, number]
    ],
    photos: 12,
    visitCount: 8
  },
  {
    id: 'F002',
    name: 'Mary\'s Cocoa Farm',
    farmer: 'Mary Smith',
    region: 'Eastern',
    district: 'Koforidua',
    size: 3.8,
    cropType: 'Cocoa',
    status: 'pending',
    lastVisit: '2024-03-14',
    coordinates: [
      [6.7000, -1.6300] as [number, number],
      [6.7020, -1.6300] as [number, number],
      [6.7020, -1.6280] as [number, number],
      [6.7000, -1.6280] as [number, number]
    ],
    photos: 8,
    visitCount: 5
  }
];

export function FarmsManagement() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);

  // Transform farm data for the map
  const farmPolygons = mockFarms.map(farm => ({
    coordinates: farm.coordinates,
    title: farm.name,
    status: farm.status as 'approved' | 'pending' | 'issue',
    description: `${farm.size} hectares - ${farm.cropType}`
  }));

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Farms Management</h2>
          <div className="flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Farm
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <CardTitle>Farm Registry</CardTitle>
                  <CardDescription>
                    Manage and monitor registered farms across regions
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      placeholder="Search farms..."
                      className="h-9"
                    />
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="map">Map View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-muted rounded-lg h-[600px] overflow-hidden">
                      <FarmMap
                        polygons={farmPolygons}
                        className="rounded-lg"
                        onPolygonClick={(polygon) => {
                          const farm = mockFarms.find(f => f.name === polygon.title);
                          if (farm) setSelectedFarm(farm.id);
                        }}
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium">Registered Farms</h3>
                      <div className="space-y-2">
                        {mockFarms.map((farm) => (
                          <Card
                            key={farm.id}
                            className={`cursor-pointer transition-colors ${
                              selectedFarm === farm.id ? 'border-primary' : ''
                            }`}
                            onClick={() => setSelectedFarm(farm.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{farm.name}</h4>
                                <Badge variant={farm.status === 'approved' ? 'default' : 'secondary'}>
                                  {farm.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Sprout className="h-4 w-4" />
                                  <span>{farm.cropType} - {farm.size} ha</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{farm.region}, {farm.district}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Last visit: {farm.lastVisit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span>{farm.visitCount} visits, {farm.photos} photos</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="list" className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-8 gap-4 p-4 bg-muted text-sm font-medium">
                      <div className="col-span-2">Farm Details</div>
                      <div>Region</div>
                      <div>Size</div>
                      <div>Crop Type</div>
                      <div>Last Visit</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {mockFarms.map((farm) => (
                        <div key={farm.id} className="grid grid-cols-8 gap-4 p-4 items-center text-sm">
                          <div className="col-span-2">
                            <div className="font-medium">{farm.name}</div>
                            <div className="text-muted-foreground">{farm.farmer}</div>
                          </div>
                          <div>{farm.region}</div>
                          <div>{farm.size} ha</div>
                          <div>{farm.cropType}</div>
                          <div>{farm.lastVisit}</div>
                          <div>
                            <Badge variant={farm.status === 'approved' ? 'default' : 'secondary'}>
                              {farm.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            {farm.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 