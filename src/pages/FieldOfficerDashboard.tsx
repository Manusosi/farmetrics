import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Sprout, 
  Camera, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Navigation,
  Upload
} from 'lucide-react';

export function FieldOfficerDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const statsCards = [
    {
      title: 'Assigned Farms',
      value: '15',
      description: 'Farms under monitoring',
      icon: Sprout,
      trend: '+2 this month'
    },
    {
      title: 'Visits Today',
      value: '4',
      description: 'Scheduled visits',
      icon: Calendar,
      trend: '2 completed'
    },
    {
      title: 'Photos Captured',
      value: '127',
      description: 'This month',
      icon: Camera,
      trend: '+23 this week'
    },
    {
      title: 'Reports Submitted',
      value: '8',
      description: 'Pending approval',
      icon: FileText,
      trend: '3 approved today'
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
                <h1 className="text-3xl font-bold text-foreground">Field Officer Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {profile?.full_name || 'Field Officer'}
                </p>
                {profile?.district && (
                  <p className="text-sm text-muted-foreground">
                    Operating in {profile.district}, {profile.region}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="text-sm">
                  Field Officer
                </Badge>
                {profile?.district && (
                  <Badge variant="outline" className="text-xs">
                    {profile.district}
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
                  <p className="text-xs text-green-600 mt-1">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">My Visits</TabsTrigger>
              <TabsTrigger value="farms">My Farms</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Navigation className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Visit Akwasi's Cocoa Farm</p>
                          <p className="text-xs text-muted-foreground">9:00 AM - 10:30 AM</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Maize Farm Inspection</p>
                          <p className="text-xs text-muted-foreground">11:00 AM - 12:00 PM</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Completed</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <Camera className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Rice Field Documentation</p>
                          <p className="text-xs text-muted-foreground">2:00 PM - 3:30 PM</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Next</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button className="h-16 flex-col gap-2" variant="outline">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">Start Visit</span>
                      </Button>
                      <Button className="h-16 flex-col gap-2" variant="outline">
                        <Camera className="h-4 w-4" />
                        <span className="text-xs">Take Photo</span>
                      </Button>
                      <Button className="h-16 flex-col gap-2" variant="outline">
                        <Upload className="h-4 w-4" />
                        <span className="text-xs">Upload Report</span>
                      </Button>
                      <Button className="h-16 flex-col gap-2" variant="outline">
                        <Navigation className="h-4 w-4" />
                        <span className="text-xs">Navigate</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Submitted visit report for Farm #1247</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Camera className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Uploaded 12 photos from field visit</p>
                        <p className="text-xs text-muted-foreground">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Navigation className="h-4 w-4 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed visit to Kwame's Rice Field</p>
                        <p className="text-xs text-muted-foreground">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Farm Visits</CardTitle>
                  <CardDescription>
                    Track and manage your assigned farm visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Visit Management Interface</h3>
                    <p className="text-muted-foreground">
                      Visit tracking and management features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="farms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Farms</CardTitle>
                  <CardDescription>
                    View and manage farms assigned to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Farm Management Interface</h3>
                    <p className="text-muted-foreground">
                      Farm management features will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Reports</CardTitle>
                  <CardDescription>
                    View and manage your submitted reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Reports Interface</h3>
                    <p className="text-muted-foreground">
                      Report management features will be implemented here
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