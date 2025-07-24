import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'farm_approval' | 'visit_report' | 'issue_alert' | 'system_update' | 'transfer_request';
  read: boolean;
  created_at: string;
  region?: string;
  farm_id?: string;
  visit_id?: string;
  issue_id?: string;
}

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get supervisor's assigned regions
  const getAssignedRegions = () => {
    const regions = profile?.region ? [profile.region] : [];
    return regions;
  };

  // Fetch notifications for supervisor's regions
  const fetchNotifications = async () => {
    if (!profile || profile.role !== 'supervisor') {
      setLoading(false);
      return;
    }

    const assignedRegions = getAssignedRegions();
    if (assignedRegions.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Create mock notifications since the actual notification system may vary
      // In production, this would fetch from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Farm Approved',
          message: 'Kofi Farm in your region has been approved by admin',
          type: 'farm_approval' as const,
          read: false,
          created_at: new Date().toISOString(),
          region: profile.region,
          farm_id: 'farm1'
        },
        {
          id: '2',
          title: 'Visit Report Submitted',
          message: 'Field Officer John submitted a visit report for Ama Farm',
          type: 'visit_report' as const,
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          region: profile.region,
          visit_id: 'visit1'
        },
        {
          id: '3',
          title: 'Issue Alert',
          message: 'High priority pest infestation reported at Kwame Farm',
          type: 'issue_alert' as const,
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          region: profile.region,
          issue_id: 'issue1'
        },
        {
          id: '4',
          title: 'Transfer Request',
          message: 'Farm ownership transfer request pending your review',
          type: 'transfer_request' as const,
          read: false,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          region: profile.region
        }
      ].filter(notification => assignedRegions.includes(notification.region || ''));

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // In production, update the database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // In production, update the database
      // await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .in('id', notifications.map(n => n.id));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
} 