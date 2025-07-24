import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Bell, 
  Shield, 
  Save, 
  Edit,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ghanaRegions } from '@/data/ghanaRegions';

interface NotificationPreferences {
  farmApprovals: boolean;
  visitReports: boolean;
  issueAlerts: boolean;
  systemUpdates: boolean;
}

export function SupervisorSettings() {
  const { user, profile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
    region: '',
    district: '',
    location: ''
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    farmApprovals: true,
    visitReports: true,
    issueAlerts: true,
    systemUpdates: false,
  });

  // Load initial profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        region: profile.region || '',
        district: profile.district || '',
        location: profile.location || ''
      });
    }
  }, [profile]);

  // Update profile information
  const updateProfile = async () => {
    if (!profile?.id) return;

    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          region: profileData.region,
          district: profileData.district,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
    setProfileLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Approval</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDistrictsForRegion = (region: string) => {
    return ghanaRegions[region as keyof typeof ghanaRegions] || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your personal information and contact details
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditingProfile ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm mt-1">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm mt-1">{user?.email || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <p className="text-sm mt-1">{profile?.phone_number || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm capitalize">Regional Supervisor</span>
                    </div>
                  </div>
                  <div>
                    <Label>Region</Label>
                    <p className="text-sm mt-1">{profile?.region || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label>District</Label>
                    <p className="text-sm mt-1">{profile?.district || 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Location</Label>
                    <p className="text-sm mt-1">{profile?.location || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Account Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(profile?.account_status || 'unknown')}
                    </div>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm mt-1">
                      {profile?.updated_at 
                        ? format(new Date(profile.updated_at), 'PPP')
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Select 
                        value={profileData.region} 
                        onValueChange={(value) => {
                          setProfileData({...profileData, region: value, district: ''});
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(ghanaRegions).map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Select 
                        value={profileData.district} 
                        onValueChange={(value) => setProfileData({...profileData, district: value})}
                        disabled={!profileData.region}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDistrictsForRegion(profileData.region).map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Specific Location</Label>
                    <Textarea
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="Enter your specific location"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={updateProfile} disabled={profileLoading}>
                      {profileLoading ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
              <CardDescription>
                Current status of your supervisor account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Approval Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile?.account_status === 'approved' 
                        ? 'Your account has been approved and is active'
                        : profile?.account_status === 'pending'
                        ? 'Your account is pending admin approval'
                        : 'Your account status needs review'
                      }
                    </p>
                  </div>
                  {getStatusBadge(profile?.account_status || 'unknown')}
                </div>

                {profile?.account_status === 'pending' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800">Waiting for Approval</h4>
                    <p className="text-sm text-orange-600 mt-1">
                      Your supervisor account is under review. You'll be notified once an admin approves your account.
                    </p>
                  </div>
                )}

                {profile?.approved_at && (
                  <div className="text-sm text-muted-foreground">
                    Approved on: {format(new Date(profile.approved_at), 'PPP')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Farm Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when farms in your region are approved
                    </p>
                  </div>
                  <Switch
                    checked={notifications.farmApprovals}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, farmApprovals: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Visit Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when field officers submit visit reports
                    </p>
                  </div>
                  <Switch
                    checked={notifications.visitReports}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, visitReports: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Issue Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about critical issues in your region
                    </p>
                  </div>
                  <Switch
                    checked={notifications.issueAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, issueAlerts: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about system maintenance and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, systemUpdates: checked})
                    }
                  />
                </div>
              </div>

              <Button className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                System details and regional assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{profile?.id?.slice(0, 8)}...</p>
                </div>
                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.created_at 
                      ? format(new Date(profile.created_at), 'PPP')
                      : 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <Label>Assigned Region</Label>
                  <p className="text-sm text-muted-foreground">{profile?.region || 'None'}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <p className="text-sm text-muted-foreground">Regional Supervisor</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Regional Responsibilities</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    As a regional supervisor, you have oversight of field officers, farms, and farmers 
                    in your assigned region(s). You can monitor activities, review reports, and 
                    coordinate regional operations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 