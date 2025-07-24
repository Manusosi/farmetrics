import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // If we have a user but no profile, try to get the role from metadata
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && !profile && !loading) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && (authUser.app_metadata?.role || authUser.user_metadata?.role)) {
          const role = authUser.app_metadata?.role || authUser.user_metadata?.role;
          
          // Redirect based on role from metadata
          if (role === 'admin') {
            window.location.href = '/admin-dashboard';
          } else if (role === 'supervisor') {
            window.location.href = '/supervisor-dashboard';
          }
        }
      }
    };
    
    checkUserRole();
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // If we have a user but no profile, show loading
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  // If roles are specified and user's role is not included
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect based on role
    switch (profile.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'supervisor':
        return <Navigate to="/supervisor-dashboard" replace />;
      default:
        // Handle any other roles (including field_officer if it exists)
        return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}