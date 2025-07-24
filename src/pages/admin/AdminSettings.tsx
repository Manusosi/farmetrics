import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { Tables } from '@/integrations/supabase/types';
import { 
  Settings, 
  Bell, 
  Mail, 
  User, 
  Shield,
  Database,
  Smartphone,
  Save,
  Loader2,
  Edit
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ghanaRegions } from '@/data/ghanaRegions';

interface NotificationPreferences {
  field_officer_signup: { email: boolean; dashboard: boolean };
  supervisor_signup: { email: boolean; dashboard: boolean };
  farm_approval: { email: boolean; dashboard: boolean };
  visit_submitted: { email: boolean; dashboard: boolean };
  issue_reported: { email: boolean; dashboard: boolean };
  transfer_request: { email: boolean; dashboard: boolean };
  system_update: { email: boolean; dashboard: boolean };
  apk_upload: { email: boolean; dashboard: boolean };
}

const notificationTypes = [
  {
    key: 'field_officer_signup' as keyof NotificationPreferences,
    title: 'Field Officer Signups',
    description: 'When new field officers register and need approval'
  },
  {
    key: 'supervisor_signup' as keyof NotificationPreferences,
    title: 'Supervisor Signups', 
    description: 'When new supervisors register and need approval'
  },
  {
    key: 'farm_approval' as keyof NotificationPreferences,
    title: 'Farm Submissions',
    description: 'When new farms are submitted for approval'
  },
  {
    key: 'visit_submitted' as keyof NotificationPreferences,
    title: 'Visit Reports',
    description: 'When field officers submit visit reports'
  },
  {
    key: 'issue_reported' as keyof NotificationPreferences,
    title: 'Issue Reports',
    description: 'When issues are reported by supervisors'
  },
  {
    key: 'transfer_request' as keyof NotificationPreferences,
    title: 'Transfer Requests',
    description: 'When transfer requests are submitted'
  },
  {
    key: 'system_update' as keyof NotificationPreferences,
    title: 'System Updates',
    description: 'Important system updates and maintenance notices'
  },
  {
    key: 'apk_upload' as keyof NotificationPreferences,
    title: 'APK Uploads',
    description: 'When new mobile app versions are uploaded'
  }
];

export function AdminSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Tables<'notification_preferences'> | null>(null);
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>({
    field_officer_signup: { email: true, dashboard: true },
    supervisor_signup: { email: true, dashboard: true },
    farm_approval: { email: true, dashboard: true },
    visit_submitted: { email: false, dashboard: true },
    issue_reported: { email: true, dashboard: true },
    transfer_request: { email: true, dashboard: true },
    system_update: { email: true, dashboard: true },
    apk_upload: { email: false, dashboard: true }
  });
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('immediate');
  const [dashboardEnabled, setDashboardEnabled] = useState(true);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
    region: '',
    district: '',
    location: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const userPrefs = await notificationService.getUserPreferences(user.id);
        
        if (userPrefs) {
          setPreferences(userPrefs);
          setEmailEnabled(userPrefs.email_enabled || true);
          setEmailFrequency(userPrefs.email_frequency || 'immediate');
          setDashboardEnabled(userPrefs.dashboard_enabled || true);
          
          if (userPrefs.preferences) {
            setLocalPreferences(userPrefs.preferences as unknown as NotificationPreferences);
          }
      } else {
          // Initialize default preferences for new user
          await notificationService.initializeUserPreferences(user.id);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast.error('Failed to load notification preferences');
      }
      setLoading(false);
    };

    loadPreferences();
  }, [user?.id]);

  // Load profile data
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

  // Update profile
  const updateProfile = async () => {
    if (!user?.id || !profile?.id) {
      toast.error('User not authenticated');
      return;
    }
    
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
      // Refresh auth data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
    setProfileLoading(false);
  };

  // Save preferences
  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      await notificationService.updateUserPreferences(user.id, {
        email_enabled: emailEnabled,
        email_frequency: emailFrequency,
        dashboard_enabled: dashboardEnabled,
        preferences: localPreferences
      });

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    }
    setSaving(false);
  };

  // Update specific notification preference
  const updateNotificationPreference = (
    type: keyof NotificationPreferences,
    channel: 'email' | 'dashboard',
    enabled: boolean
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: enabled
      }
    }));
  };

  // Test notification
  const sendTestNotification = async () => {
    if (!user?.id) return;

    try {
      await notificationService.createNotification(user.id, {
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings are working correctly.',
        type: 'system_update',
        priority: 'low'
      });
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
            Manage your account settings and notification preferences
        </p>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* General Settings */}
              <Card>
            <CardHeader>
                  <CardTitle>General Notification Settings</CardTitle>
              <CardDescription>
                    Configure how you receive notifications
              </CardDescription>
            </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailEnabled}
                      onCheckedChange={setEmailEnabled}
                  />
                </div>

                  {emailEnabled && (
                    <div>
                      <Label>Email Frequency</Label>
                      <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dashboard Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the dashboard
                      </p>
                    </div>
                    <Switch
                      checked={dashboardEnabled}
                      onCheckedChange={setDashboardEnabled}
                  />
                </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>
                    Choose which types of notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {notificationTypes.map((type, index) => (
                      <div key={type.key}>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">{type.title}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>

                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={localPreferences[type.key]?.email || false}
                                onCheckedChange={(checked) => 
                                  updateNotificationPreference(type.key, 'email', checked)
                                }
                                disabled={!emailEnabled}
                              />
                              <Label className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                              </Label>
              </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={localPreferences[type.key]?.dashboard || false}
                                onCheckedChange={(checked) => 
                                  updateNotificationPreference(type.key, 'dashboard', checked)
                                }
                                disabled={!dashboardEnabled}
                              />
                              <Label className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Dashboard
                              </Label>
                            </div>
                          </div>
                </div>

                        {index < notificationTypes.length - 1 && <Separator className="mt-6" />}
                </div>
                    ))}
              </div>
            </CardContent>
          </Card>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={sendTestNotification}>
                  Send Test Notification
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details and personal information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditingProfile ? "outline" : "default"}
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
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
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm capitalize">{profile?.role || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Region</Label>
                    <p className="text-sm mt-1">{profile?.region || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>District</Label>
                    <p className="text-sm mt-1">{profile?.district || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm mt-1">{profile?.location || 'Not set'}</p>
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
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={profileData.region}
                        onValueChange={(value) => setProfileData({...profileData, region: value, district: ''})}
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
                          {profileData.region && ghanaRegions[profileData.region]?.map((district) => (
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
                      placeholder="Enter specific location details"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={updateProfile} 
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
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
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
              <CardTitle>System Information</CardTitle>
                <CardDescription>
                System status and configuration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Database Connected</span>
                  </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Notifications Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Mobile App Sync Ready</span>
                  </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Security Enabled</span>
                </div>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage system data and exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Data export and management features will be available here. This includes:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Export all data to Excel/CSV formats</li>
                  <li>Generate comprehensive PDF reports</li>
                  <li>Data backup and restore options</li>
                  <li>System performance monitoring</li>
                </ul>
        </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 