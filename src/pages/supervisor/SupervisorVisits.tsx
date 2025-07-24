import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { StatsGridSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Search, 
  Calendar,
  MapPin,
  User,
  FileText,
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Visit {
  id: string;
  visit_number: string;
  visit_date: string;
  farm: {
    farm_name: string;
    region: string;
    district: string;
    farmer: {
      name: string;
    } | null;
  } | null;
  officer: {
    full_name: string;
  } | null;
  notes?: string;
  created_at: string;
}

export function SupervisorVisits() {
  const { profile } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch visits data for supervisor's region only
  const fetchVisits = async () => {
    if (!profile?.region) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get visits from farms in supervisor's region
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          notes,
          created_at,
          farm:farms(
            farm_name,
            region,
            district,
            farmer:farmers(name)
          ),
          officer:profiles!visits_officer_id_fkey(full_name)
        `)
        .eq('farm.region', profile.region)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setVisits(data || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      // Don't show toast for empty data
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchVisits);

  // Filter visits
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.farm?.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.farm?.farmer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.officer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.visit_number.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const visitDate = new Date(visit.visit_date);
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = visitDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = visitDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = visitDate >= monthAgo;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const todayVisits = visits.filter(v => v.visit_date === today).length;
  const weekVisits = visits.filter(v => v.visit_date >= weekAgo).length;
  const totalVisits = visits.length;
  const uniqueFarms = new Set(visits.map(v => v.farm?.farm_name)).size;

  const openViewDialog = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visit Reports</h1>
          <p className="text-muted-foreground">
            Monitor field visit reports in {profile?.region} region
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayVisits}</div>
              <p className="text-xs text-muted-foreground">
                Visits submitted today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekVisits}</div>
              <p className="text-xs text-muted-foreground">
                Weekly submissions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisits}</div>
              <p className="text-xs text-muted-foreground">
                All time visits
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Farms Visited</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueFarms}</div>
              <p className="text-xs text-muted-foreground">
                Unique farm locations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search visits, farms, or officers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits in {profile?.region}</CardTitle>
          <CardDescription>
            View and monitor all field visit reports in your region
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit Details</TableHead>
                    <TableHead>Farm & Farmer</TableHead>
                    <TableHead>Field Officer</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No visits found in {profile?.region}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">#{visit.visit_number}</span>
                            <span className="text-sm text-muted-foreground">
                              {visit.notes ? 'With notes' : 'Standard visit'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{visit.farm?.farm_name || 'Unknown Farm'}</span>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {visit.farm?.farmer?.name || 'Unknown Farmer'}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {visit.farm?.district}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{visit.officer?.full_name || 'Unknown Officer'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-sm">
                              {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(visit.created_at), 'MMM dd, HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(visit)}
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
        </CardContent>
      </Card>

      {/* View Visit Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visit Report Details</DialogTitle>
            <DialogDescription>
              Complete information for visit #{selectedVisit?.visit_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Visit Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Visit Number</div>
                  <p className="text-sm text-muted-foreground">#{selectedVisit.visit_number}</p>
                </div>
                <div>
                  <div className="font-medium">Visit Date</div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedVisit.visit_date), 'PPP')}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Submitted</div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedVisit.created_at), 'PPP p')}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Field Officer</div>
                  <p className="text-sm text-muted-foreground">
                    {selectedVisit.officer?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Farm Information */}
              <div>
                <div className="font-medium mb-2">Farm Details</div>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <div className="text-sm font-medium">Farm Name</div>
                    <p className="text-sm text-muted-foreground">{selectedVisit.farm?.farm_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Farmer</div>
                    <p className="text-sm text-muted-foreground">{selectedVisit.farm?.farmer?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Region</div>
                    <p className="text-sm text-muted-foreground">{selectedVisit.farm?.region}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">District</div>
                    <p className="text-sm text-muted-foreground">{selectedVisit.farm?.district}</p>
                  </div>
                </div>
              </div>

              {/* Visit Notes */}
              {selectedVisit.notes && (
                <div>
                  <div className="font-medium mb-2">Visit Notes</div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm">{selectedVisit.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 