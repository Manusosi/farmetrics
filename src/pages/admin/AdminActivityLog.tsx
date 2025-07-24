import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Download, 
  Activity,
  User,
  FileEdit,
  FilePlus,
  AlertTriangle,
  UserCheck,
  ArrowRightLeft,
  Settings,
  LogIn,
  Shield,
  Loader2,
  Filter,
  Clock,
  Check,
  List,
  Eye,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

interface ActivityEntry {
  id: string;
  type: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
  metadata?: any;
}

const activityTypeConfig = {
  'profile_update': { label: 'Profile Update', icon: User, color: 'bg-blue-500' },
  'farm_approval': { label: 'Farm Approval', icon: Check, color: 'bg-green-500' },
  'visit_submission': { label: 'Visit Report', icon: FilePlus, color: 'bg-purple-500' },
  'issue_creation': { label: 'Issue Report', icon: AlertTriangle, color: 'bg-red-500' },
  'transfer_request': { label: 'Transfer Request', icon: ArrowRightLeft, color: 'bg-orange-500' },
  'user_approval': { label: 'User Approval', icon: UserCheck, color: 'bg-green-500' },
  'system_access': { label: 'System Access', icon: LogIn, color: 'bg-gray-500' },
  'data_export': { label: 'Data Export', icon: Download, color: 'bg-indigo-500' },
  'apk_management': { label: 'APK Management', icon: Settings, color: 'bg-teal-500' },
  'notification_sent': { label: 'Notification', icon: Eye, color: 'bg-cyan-500' }
};

export function AdminActivityLog() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Generate activity log from database changes
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const activities: ActivityEntry[] = [];

      // Get recent farm approvals
      const { data: farms } = await supabase
        .from('farms')
        .select(`
          id, farm_name, is_approved, created_at, updated_at,
          farmers(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      farms?.forEach(farm => {
        if (farm.is_approved) {
          activities.push({
            id: `farm_${farm.id}`,
            type: 'farm_approval',
            action: 'approved',
            entity: 'farm',
            entityId: farm.id,
            userId: 'system',
            userName: 'System Admin',
            userRole: 'admin',
            details: `Farm "${farm.farm_name}" by ${farm.farmers?.name} was approved`,
            timestamp: farm.updated_at || farm.created_at,
            metadata: { farmName: farm.farm_name, farmerName: farm.farmers?.name }
          });
        }
      });

      // Get recent visits
      const { data: visits } = await supabase
        .from('visits')
        .select(`
          id, visit_date, visit_number, created_at,
          farms(farm_name, farmers(name)),
          profiles(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      visits?.forEach(visit => {
        activities.push({
          id: `visit_${visit.id}`,
          type: 'visit_submission',
          action: 'submitted',
          entity: 'visit',
          entityId: visit.id,
          userId: visit.profiles?.full_name || 'Unknown',
          userName: visit.profiles?.full_name || 'Unknown Officer',
          userRole: visit.profiles?.role || 'field_officer',
          details: `Visit #${visit.visit_number} submitted for farm "${visit.farms?.farm_name}"`,
          timestamp: visit.created_at,
          metadata: { 
            visitNumber: visit.visit_number, 
            farmName: visit.farms?.farm_name,
            farmerName: visit.farms?.farmers?.name
          }
        });
      });

      // Get recent issues
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          id, title, priority, status, created_at,
          farms(farm_name),
          reported_by_profile:profiles!issues_reported_by_fkey(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      issues?.forEach(issue => {
        activities.push({
          id: `issue_${issue.id}`,
          type: 'issue_creation',
          action: 'reported',
          entity: 'issue',
          entityId: issue.id,
          userId: issue.reported_by_profile?.full_name || 'Unknown',
          userName: issue.reported_by_profile?.full_name || 'Unknown User',
          userRole: issue.reported_by_profile?.role || 'supervisor',
          details: `Issue "${issue.title}" reported for farm "${issue.farms?.farm_name}" (Priority: ${issue.priority})`,
          timestamp: issue.created_at,
          metadata: { 
            issueTitle: issue.title, 
            priority: issue.priority,
            farmName: issue.farms?.farm_name
          }
        });
      });

      // Get recent user approvals
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, account_status, approved_at, created_at')
        .not('approved_at', 'is', null)
        .order('approved_at', { ascending: false })
        .limit(30);

      profiles?.forEach(profile => {
        activities.push({
          id: `approval_${profile.id}`,
          type: 'user_approval',
          action: 'approved',
          entity: 'user',
          entityId: profile.id,
          userId: 'admin',
          userName: 'Admin',
          userRole: 'admin',
          details: `${profile.role} "${profile.full_name}" was approved`,
          timestamp: profile.approved_at!,
          metadata: { 
            userName: profile.full_name, 
            userRole: profile.role,
            status: profile.account_status
          }
        });
      });

      // Get recent transfers
      const { data: transfers } = await supabase
        .from('transfers')
        .select('id, status, reason, created_at, processed_at')
        .order('created_at', { ascending: false })
        .limit(20);

      transfers?.forEach(transfer => {
        activities.push({
          id: `transfer_${transfer.id}`,
          type: 'transfer_request',
          action: transfer.status || 'requested',
          entity: 'transfer',
          entityId: transfer.id,
          userId: 'supervisor',
          userName: 'Supervisor',
          userRole: 'supervisor',
          details: `Transfer request ${transfer.status || 'submitted'}: ${transfer.reason?.substring(0, 50)}...`,
          timestamp: transfer.processed_at || transfer.created_at,
          metadata: { 
            status: transfer.status,
            reason: transfer.reason
          }
        });
      });

      // Get recent notifications (if available)
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, title, type, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      notifications?.forEach(notification => {
        activities.push({
          id: `notification_${notification.id}`,
          type: 'notification_sent',
          action: 'sent',
          entity: 'notification',
          entityId: notification.id,
          userId: 'system',
          userName: 'System',
          userRole: 'system',
          details: `Notification sent: ${notification.title}`,
          timestamp: notification.created_at!,
          metadata: { 
            title: notification.title,
            notificationType: notification.type
          }
        });
      });

      // Sort all activities by timestamp
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100); // Limit to 100 most recent

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity log');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.entity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !typeFilter || typeFilter === 'all' || activity.type === typeFilter;
    const matchesUser = !userFilter || userFilter === 'all' || activity.userName.toLowerCase().includes(userFilter.toLowerCase());
    
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return activityDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return activityDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return activityDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesType && matchesUser && matchesDate;
  });

  // Get unique users and types for filters
  const uniqueUsers = [...new Set(activities.map(a => a.userName))];
  const uniqueTypes = [...new Set(activities.map(a => a.type))];

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  const exportActivities = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Action', 'Entity', 'User', 'Role', 'Details'].join(','),
      ...filteredActivities.map(activity => [
        activity.timestamp,
        activity.type,
        activity.action,
        activity.entity,
        activity.userName,
        activity.userRole,
        `"${activity.details.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Activity log exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Monitor all system activities and user actions
          </p>
        </div>
        <Button onClick={exportActivities} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => 
                new Date(a.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => 
                new Date(a.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {activityTypeConfig[type as keyof typeof activityTypeConfig]?.label || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No activities found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayActivities]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {dayActivities.length} activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dayActivities.map((activity) => {
                      const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig];
                      const IconComponent = config?.icon || Activity;
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className={`p-2 rounded-full ${config?.color || 'bg-gray-500'}`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {config?.label || activity.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {activity.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(activity.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            
                            <p className="text-sm mb-2">{activity.details}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.userName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {activity.userRole}
                              </span>
                              <span>{activity.entity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
} 