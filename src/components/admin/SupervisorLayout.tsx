import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Bell,
  FileText,
  LogOut,
  Map as MapIcon,
  Menu,
  Settings,
  Sprout,
  User,
  Users,
  X,
  UserCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Navigation items for supervisors (limited compared to admin)
const supervisorNavigation = [
  {
    title: 'Overview',
    icon: BarChart3,
    href: '/supervisor-dashboard'
  },
  {
    title: 'Management',
    items: [
      { title: 'Farms', icon: Sprout, href: '/supervisor-dashboard/farms' },
      { title: 'Farmers', icon: Users, href: '/supervisor-dashboard/farmers' },
      { title: 'Field Officers', icon: UserCheck, href: '/supervisor-dashboard/officers' }
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Visit Reports', icon: FileText, href: '/supervisor-dashboard/visits' },
      { title: 'Farm Polygons', icon: MapIcon, href: '/supervisor-dashboard/polygons' },
      { title: 'Issues', icon: AlertTriangle, href: '/supervisor-dashboard/issues' },
      { title: 'Transfers', icon: ArrowRightLeft, href: '/supervisor-dashboard/transfers' }
    ]
  },
  {
    title: 'System',
    items: [
      { title: 'Settings', icon: Settings, href: '/supervisor-dashboard/settings' }
    ]
  }
];

export function SupervisorLayout() {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/supervisor-signin');
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    setNotificationOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'farm_approval':
        return '🌱';
      case 'visit_report':
        return '📋';
      case 'issue_alert':
        return '⚠️';
      case 'transfer_request':
        return '🔄';
      default:
        return '📢';
    }
  };

  // Get current page path for highlighting
  const currentPath = location.pathname.split('/').pop() || '';

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 bg-card border-r border-border
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Farmetrics</span>
              <span className="text-xs text-muted-foreground">Supervisor Portal</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-3 space-y-6">
            {supervisorNavigation.map((section) => (
              <div key={section.title}>
                {section.title !== 'Overview' && (
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.href ? (
                    // Single item (Overview)
                    (() => {
                      const isActive = currentPath === section.href;
                      const Icon = section.icon;
                      return (
                        <Link
                          to={section.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                          <div className="font-medium">{section.title}</div>
                        </Link>
                      );
                    })()
                  ) : (
                    // Multiple items (grouped)
                    section.items?.map((item) => {
                      const isActive = currentPath === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                          <div className="font-medium">{item.title}</div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-sm truncate">
                    {profile?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {profile?.region || 'No region'} Supervisor
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/supervisor-dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Supervisor Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.region || 'Regional'} Operations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Notifications */}
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 ${
                            !notification.read ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                    <AvatarFallback>
                      {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Regional Supervisor
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/supervisor-dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 