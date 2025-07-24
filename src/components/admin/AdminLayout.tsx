import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart2,
  BarChart3,
  Bell,
  FileText,
  Image,
  LogOut,
  Map as MapIcon,
  Menu,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sprout,
  User,
  Users
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

// Navigation items grouped by section
const navigationGroups = {
  main: [
    { 
      href: '', 
      label: 'Overview', 
      icon: BarChart3,
      description: 'Dashboard overview and statistics'
    }
  ],
  management: [
    { 
      href: 'farms', 
      label: 'Farms', 
      icon: Sprout,
      description: 'Manage farms and polygons'
    },
    { 
      href: 'farmers', 
      label: 'Farmers', 
      icon: User,
      description: 'Manage farmer profiles'
    },
    { 
      href: 'officers', 
      label: 'Field Officers', 
      icon: Users,
      description: 'Manage field officer accounts and approvals'
    },
    { 
      href: 'supervisors', 
      label: 'Supervisors', 
      icon: Shield,
      description: 'Manage regional supervisors'
    }
  ],
  monitoring: [
    { 
      href: 'visits', 
      label: 'Visit Reports', 
      icon: FileText,
      description: 'View and manage field visits'
    },
    { 
      href: 'media', 
      label: 'Media Library', 
      icon: Image,
      description: 'View photos and EXIF data'
    },
    { 
      href: 'polygons', 
      label: 'Polygon Management', 
      icon: MapIcon,
      description: 'View and edit farm polygons'
    },
    { 
      href: 'issues', 
      label: 'Issues', 
      icon: AlertTriangle,
      description: 'Track and resolve field issues'
    },
    { 
      href: 'activity', 
      label: 'Activity Log', 
      icon: Activity,
      description: 'Monitor system activities'
    }
  ],
  system: [
    { 
      href: 'apk', 
      label: 'APK Management', 
      icon: Smartphone,
      description: 'Manage mobile app files'
    },
    { 
      href: 'transfers', 
      label: 'Transfer Requests', 
      icon: ArrowRightLeft,
      description: 'Manage supervisor transfers'
    },
    { 
      href: 'reports', 
      label: 'Reports & Analytics', 
      icon: BarChart2,
      description: 'Generate reports and data exports'
    },
    {
      href: 'settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'System configuration'
    }
  ]
};

// Function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname === '/admin-dashboard' ? '' : location.pathname.replace('/admin-dashboard/', '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`w-64 border-r border-border bg-card ${isMobileMenuOpen ? 'block absolute inset-y-0 z-50' : 'hidden'} md:flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Farmetrics</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-6 px-2">
            {/* Main Section */}
            <div>
              {navigationGroups.main.map((item) => (
                <Link
                  key={item.href}
                  to={`/admin-dashboard${item.href ? `/${item.href}` : ''}`}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPath === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Management Section */}
            <div>
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Management
              </h3>
              <div className="mt-2 space-y-1">
                {navigationGroups.management.map((item) => (
                  <Link
                    key={item.href}
                    to={`/admin-dashboard/${item.href}`}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPath === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Monitoring Section */}
            <div>
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Monitoring
              </h3>
              <div className="mt-2 space-y-1">
                {navigationGroups.monitoring.map((item) => (
                  <Link
                    key={item.href}
                    to={`/admin-dashboard/${item.href}`}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPath === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* System Section */}
            <div>
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                System
              </h3>
              <div className="mt-2 space-y-1">
                {navigationGroups.system.map((item) => (
                  <Link
                    key={item.href}
                    to={`/admin-dashboard/${item.href}`}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPath === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={profile?.full_name || 'Admin'} />
              <AvatarFallback>
                {profile?.full_name ? getInitials(profile.full_name) : 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center h-9 w-64 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4 mr-2" />
            <span>Search...</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <ThemeToggle />
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <div className="p-2">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                    <div className="mt-1 text-xs bg-primary/10 text-primary rounded-sm px-1 inline-block">
                      Administrator
                    </div>
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/admin-dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin-dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
