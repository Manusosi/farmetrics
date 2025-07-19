import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MapPin, 
  Sprout, 
  AlertCircle, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Map
} from 'lucide-react';

export function SupervisorDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const statsCards = [
    {
      title: 'My Field Officers',
      value: '12',
      description: 'Officers in my region',
      icon: Users,
      trend: '+2 this month'
    },
    {
      title: 'Farms in Region',
      value: '89',
      description: 'Registered farms',
      icon: Sprout,
      trend: '+7 this month'
    },
    {
      title: 'Pending Visits',
      value: '15',
      description: 'Scheduled visits',
      icon: Calendar,
      trend: '5 due today'
    },
    {
      title: 'Open Issues',
      value: '8',
      description: 'Requiring action',
      icon: AlertCircle,
      trend: '3 high priority'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Supervisor Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {profile?.full_name || 'Supervisor'}
                </p>
                {profile?.region && (
                  <p className="text-sm text-muted-foreground">
                    Managing {profile.region} Region
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="text-sm">
                  Regional Supervisor
                </Badge>
                {profile?.region && (
                  <Badge variant="outline" className="text-xs">
                    {profile.region}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="officers">Officers</TabsTrigger>
              <TabsTrigger value="farms">Farms</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today's Priorities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Urgent: Pest issue in Kumasi</p>
                          <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">High</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">5 farm visits scheduled</p>
                          <p className="text-xs text-muted-foreground">3 officers assigned</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Today</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Weekly report ready</p>
                          <p className="text-xs text-muted-foreground">Submit to admin</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Ready</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Regional Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Farm Visits Completed</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Issue Resolution Rate</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Officer Utilization</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Assign Officer</span>
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm">Schedule Visit</span>
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">Report Issue</span>
                    </Button>
                    <Button className="h-20 flex-col gap-2" variant="outline">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">Generate Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="officers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Field Officers Management</CardTitle>
                  <CardDescription>
                    Manage field officers in your region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Officer Management Interface</h3>
                    <p className="text-muted-foreground">
                      Field officer management features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="farms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Farms</CardTitle>
                  <CardDescription>
                    Monitor farms in your region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Farm Monitoring Interface</h3>
                    <p className="text-muted-foreground">
                      Regional farm management features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visit Management</CardTitle>
                  <CardDescription>
                    Track and manage farm visits in your region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Visit Tracking Interface</h3>
                    <p className="text-muted-foreground">
                      Visit management features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Reports</CardTitle>
                  <CardDescription>
                    Generate and manage regional reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Regional Reports Interface</h3>
                    <p className="text-muted-foreground">
                      Regional reporting features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}