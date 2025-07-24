import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  Settings,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications({ limit: 10, autoRefresh: true });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'field_officer_signup':
      case 'supervisor_signup':
        return '👤';
      case 'farm_approval':
        return '🌱';
      case 'visit_submitted':
        return '📋';
      case 'issue_reported':
        return '⚠️';
      case 'transfer_request':
        return '🔄';
      case 'system_update':
        return '⚙️';
      case 'apk_upload':
        return '📱';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[500px] overflow-y-auto"
        side="bottom"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Link to="/admin-dashboard/settings?tab=notifications">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 cursor-pointer",
                  !notification.is_read && "bg-muted/50"
                )}
                onClick={() => handleNotificationClick(notification)}
                asChild={!!notification.action_url}
              >
                {notification.action_url ? (
                  <Link 
                    to={notification.action_url} 
                    className="w-full text-left no-underline text-current"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-tight">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={cn(
                            "text-xs font-medium capitalize",
                            getPriorityColor(notification.priority)
                          )}>
                            {notification.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 text-lg mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-auto p-1"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-auto p-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={cn(
                          "text-xs font-medium capitalize",
                          getPriorityColor(notification.priority)
                        )}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            
            {notifications.length >= 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    to="/admin-dashboard/notifications" 
                    className="text-center text-sm font-medium"
                    onClick={() => setOpen(false)}
                  >
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 