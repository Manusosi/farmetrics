import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type NotificationType = 
  | 'field_officer_signup'
  | 'supervisor_signup' 
  | 'farm_approval'
  | 'visit_submitted'
  | 'issue_reported'
  | 'transfer_request'
  | 'system_update'
  | 'apk_upload';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface NotificationPreferences {
  field_officer_signup: { email: boolean; dashboard: boolean };
  supervisor_signup: { email: boolean; dashboard: boolean };
  farm_approval: { email: boolean; dashboard: boolean };
  visit_submitted: { email: boolean; dashboard: boolean };
  issue_reported: { email: boolean; dashboard: boolean };
  transfer_request: { email: boolean; dashboard: boolean };
  system_update: { email: boolean; dashboard: boolean };
  apk_upload: { email: boolean; dashboard: boolean };
}

class NotificationService {
  // Create a notification for specific user(s)
  async createNotification(
    userIds: string | string[],
    notificationData: NotificationData
  ): Promise<void> {
    try {
      const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
      
      const notifications: TablesInsert<'notifications'>[] = userIdArray.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || 'medium',
        action_url: notificationData.actionUrl,
        metadata: notificationData.metadata || {},
        expires_at: notificationData.expiresAt
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Check user preferences and send emails if enabled
      for (const userId of userIdArray) {
        await this.checkAndSendEmail(userId, notificationData);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for all admins
  async createAdminNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Get all admin user IDs
      const { data: adminProfiles, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      if (error) throw error;

      const adminUserIds = adminProfiles?.map(profile => profile.user_id) || [];
      
      if (adminUserIds.length > 0) {
        await this.createNotification(adminUserIds, notificationData);
      }
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Tables<'notifications'>[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<Tables<'notification_preferences'> | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  // Update user notification preferences
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<Tables<'notification_preferences'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Initialize default preferences for new user
  async initializeUserPreferences(userId: string): Promise<void> {
    try {
      const defaultPreferences = {
        field_officer_signup: { email: true, dashboard: true },
        supervisor_signup: { email: true, dashboard: true },
        farm_approval: { email: true, dashboard: true },
        visit_submitted: { email: false, dashboard: true },
        issue_reported: { email: true, dashboard: true },
        transfer_request: { email: true, dashboard: true },
        system_update: { email: true, dashboard: true },
        apk_upload: { email: false, dashboard: true }
      };

      await this.updateUserPreferences(userId, {
        email_enabled: true,
        email_frequency: 'immediate',
        dashboard_enabled: true,
        preferences: defaultPreferences
      });
    } catch (error) {
      console.error('Error initializing user preferences:', error);
      throw error;
    }
  }

  // Check preferences and send email if enabled
  private async checkAndSendEmail(
    userId: string, 
    notificationData: NotificationData
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences?.email_enabled) return;

      const typePreferences = preferences.preferences as unknown as NotificationPreferences;
      const shouldSendEmail = typePreferences?.[notificationData.type]?.email;

      if (shouldSendEmail) {
        // TODO: Implement email sending logic here
        // For now, we'll just create the notification in the database
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
    }
  }

  // Helper methods for common notification types
  async notifyFieldOfficerSignup(officerName: string, officerEmail: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New Field Officer Registration',
      message: `${officerName} (${officerEmail}) has registered and is awaiting approval.`,
      type: 'field_officer_signup',
      priority: 'medium',
      actionUrl: '/admin-dashboard/field-officers'
    });
  }

  async notifySupervisorSignup(supervisorName: string, supervisorEmail: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New Supervisor Registration',
      message: `${supervisorName} (${supervisorEmail}) has registered and is awaiting approval.`,
      type: 'supervisor_signup',
      priority: 'medium',
      actionUrl: '/admin-dashboard/supervisors'
    });
  }

  async notifyFarmSubmission(farmName: string, farmerName: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New Farm Submission',
      message: `New farm "${farmName}" by ${farmerName} is awaiting approval.`,
      type: 'farm_approval',
      priority: 'medium',
      actionUrl: '/admin-dashboard/farms'
    });
  }

  async notifyVisitSubmitted(officerName: string, farmName: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New Visit Submitted',
      message: `${officerName} submitted a visit report for ${farmName}.`,
      type: 'visit_submitted',
      priority: 'low',
      actionUrl: '/admin-dashboard/visits'
    });
  }

  async notifyIssueReported(issueTitle: string, reporterName: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New Issue Reported',
      message: `"${issueTitle}" was reported by ${reporterName}.`,
      type: 'issue_reported',
      priority: 'high',
      actionUrl: '/admin-dashboard/issues'
    });
  }

  async notifyTransferRequest(officerName: string, fromSupervisor: string): Promise<void> {
    await this.createAdminNotification({
      title: 'Transfer Request Submitted',
      message: `Transfer request for ${officerName} submitted by ${fromSupervisor}.`,
      type: 'transfer_request',
      priority: 'medium',
      actionUrl: '/admin-dashboard/transfers'
    });
  }

  async notifyAPKUpload(version: string, uploaderName: string): Promise<void> {
    await this.createAdminNotification({
      title: 'New APK Uploaded',
      message: `APK version ${version} uploaded by ${uploaderName}.`,
      type: 'apk_upload',
      priority: 'low',
      actionUrl: '/admin-dashboard/apk'
    });
  }
}

export const notificationService = new NotificationService(); 