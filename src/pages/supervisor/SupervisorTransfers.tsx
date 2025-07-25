import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh';
import { supabase } from '@/integrations/supabase/client';
import { StatsGridSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Transfer {
  id: string;
  from_officer_name: string;
  to_officer_name: string;
  farm_name: string;
  region: string;
  district: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  updated_at: string;
  requested_by: string;
}

export function SupervisorTransfers() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get supervisor's assigned regions (support multiple regions)
  const getAssignedRegions = () => {
    const regions = profile?.region ? [profile.region] : [];
    return regions;
  };

  // Fetch transfer requests for supervisor's assigned regions
  const fetchTransfers = async () => {
    const assignedRegions = getAssignedRegions();
    
    if (assignedRegions.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, create mock transfers since the actual DB structure may vary
      const mockTransfers: Transfer[] = [
        {
          id: '1',
          from_officer_name: 'John Doe',
          to_officer_name: 'Jane Smith',
          farm_name: 'Kofi Cocoa Farm',
          region: profile?.region || '',
          district: 'Kumasi',
          reason: 'Officer relocation',
          status: 'pending' as const,
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          requested_by: 'Field Supervisor'
        },
        {
          id: '2',
          from_officer_name: 'Sarah Wilson',
          to_officer_name: 'Mike Johnson',
          farm_name: 'Ama Farm',
          region: profile?.region || '',
          district: 'Takoradi',
          reason: 'Workload balancing',
          status: 'approved' as const,
          requested_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          requested_by: 'Admin'
        }
      ].filter(transfer => assignedRegions.includes(transfer.region));

      setTransfers(mockTransfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use navigation refresh hook
  useNavigationRefresh(fetchTransfers);

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.from_officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.to_officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalTransfers = transfers.length;
  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
  const approvedTransfers = transfers.filter(t => t.status === 'approved').length;
  const rejectedTransfers = transfers.filter(t => t.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transfer Requests</h1>
        <p className="text-muted-foreground">
          Monitor farm transfer requests in {getAssignedRegions().join(', ')}
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransfers}</div>
              <p className="text-xs text-muted-foreground">
                In your regions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Declined
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
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Transfer Requests</CardTitle>
          <CardDescription>
            Monitor farm assignment transfers in your assigned regions
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
                    <TableHead>Farm</TableHead>
                    <TableHead>From Officer</TableHead>
                    <TableHead>To Officer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No transfer requests found in {getAssignedRegions().join(', ')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{transfer.farm_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {transfer.district}, {transfer.region}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{transfer.from_officer_name}</TableCell>
                        <TableCell>{transfer.to_officer_name}</TableCell>
                        <TableCell>
                          <span className="text-sm truncate max-w-[200px] block">
                            {transfer.reason}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(transfer.requested_at), 'MMM dd, yyyy')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              by {transfer.requested_by}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
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
    </div>
  );
} 