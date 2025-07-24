import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { PageTransition } from "@/components/common/PageTransition";
import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isSessionValid, refreshSession } from "@/integrations/supabase/client";
import { initializeMediaService } from "@/services/mediaService";
import { Loader2 } from "lucide-react";

// Public pages
import { LandingPage } from './pages/LandingPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { DataProtection } from './pages/DataProtection';
import NotFound from './pages/NotFound';

// Auth pages
import { AdminSignin } from './pages/AdminSignin';
import { AdminSignup } from './pages/AdminSignup';
import { SupervisorSignin } from './pages/SupervisorSignin';
import { SupervisorSignup } from './pages/SupervisorSignup';

// Dashboard pages
import { AdminDashboard } from './pages/AdminDashboard';
import { SupervisorDashboard } from './pages/SupervisorDashboard';

// Admin pages
import { AdminSupervisors } from './pages/admin/AdminSupervisors';
import { AdminFarms } from './pages/admin/AdminFarms';
import { AdminVisits } from './pages/admin/AdminVisits';
import { AdminIssues } from './pages/admin/AdminIssues';
import { AdminExports } from './pages/admin/AdminExports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminFarmers } from './pages/admin/AdminFarmers';
import { AdminPolygons } from './pages/admin/AdminPolygons';
import { AdminMedia } from './pages/admin/AdminMedia';
import { AdminActivityLog } from './pages/admin/AdminActivityLog';
import { AdminTransfers } from './pages/admin/AdminTransfers';

// Protected components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { SupervisorLayout } from './components/admin/SupervisorLayout';
import { SupervisorOverview } from './pages/supervisor/SupervisorOverview';
import { SupervisorFarms } from './pages/supervisor/SupervisorFarms';
import { SupervisorFarmers } from './pages/supervisor/SupervisorFarmers';
import { SupervisorOfficers } from './pages/supervisor/SupervisorOfficers';
import { SupervisorVisits } from './pages/supervisor/SupervisorVisits';
import { SupervisorSettings } from './pages/supervisor/SupervisorSettings';
import { SupervisorPolygons } from './pages/supervisor/SupervisorPolygons';
import { SupervisorIssues } from './pages/supervisor/SupervisorIssues';
import { SupervisorTransfers } from './pages/supervisor/SupervisorTransfers';
import { FieldOfficers } from './pages/admin/FieldOfficers';
import { AdminAPKManager } from './pages/admin/AdminAPKManager';
import { FarmsManagement } from './pages/FarmsManagement';

// Public pages
import { Supervisors } from './pages/Supervisors';
import { FieldOfficers as PublicFieldOfficers } from './pages/FieldOfficers';

// Create a MobileAppRequired component
const MobileAppRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
    <h1 className="text-2xl font-bold mb-4">Mobile App Required</h1>
    <p className="mb-6">
      Field Officers need to use the mobile app to collect data in the field.
      This web portal is for Administrators and Supervisors only.
    </p>
    <div className="mb-6 p-4 border border-primary/20 rounded-lg bg-primary/5 max-w-md">
      <h2 className="font-semibold mb-2">Download the Mobile App</h2>
      <p className="text-sm mb-4">
        Scan the QR code below or use the direct download link to install the Farmetrics mobile app:
      </p>
      <div className="flex flex-col items-center gap-4">
        <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
          {/* Placeholder for QR code - replace with actual QR code */}
          <span className="text-xs text-gray-500">QR Code Placeholder</span>
        </div>
        <a 
          href="#" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            alert('Mobile app download link will be available soon.');
          }}
        >
          Download APK
        </a>
      </div>
    </div>
    <p className="text-sm text-muted-foreground">
      Please contact your supervisor for instructions on how to use the mobile app.
    </p>
    <a href="/" className="mt-6 text-primary hover:underline">
      Return to Home
    </a>
  </div>
);

// Create a loader component
const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground text-lg">Loading Farmetrics...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries to handle network issues
      retry: 2,
      // Keep data fresh with refetchOnWindowFocus
      refetchOnWindowFocus: true,
      // Cache data for better performance
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check for existing auth session and initialize services
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Initialize media service (storage buckets)
        // await initializeMediaService(); // Disabled temporarily due to RLS policy issues
        
        // Check if there's an existing session
        const { isValid, session } = await isSessionValid();
        
        if (isValid && session) {
          const user = session.user;
          
          // Extract role from user metadata
          const role = (user.app_metadata?.role || user.user_metadata?.role) as string;
          
          setAuthenticated(true);
          setUserRole(role);
          
          // Set up session refresh interval
          const refreshInterval = setInterval(async () => {
            await refreshSession();
          }, 1000 * 60 * 10); // Refresh session every 10 minutes
          
          return () => clearInterval(refreshInterval);
        } else {
          setAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthenticated(false);
        setUserRole(null);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();
  }, []);

  // Show loading screen while initializing
  if (initializing) {
    return <AppLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="farmetrics-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
              <Route path="/supervisors" element={<PageTransition><Supervisors /></PageTransition>} />
              <Route path="/field-officers" element={<PageTransition><PublicFieldOfficers /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
              <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
              <Route path="/data-protection" element={<PageTransition><DataProtection /></PageTransition>} />

              {/* Auth Routes */}
              <Route path="/admin-signin" element={
                authenticated && userRole === 'admin' ? 
                  <Navigate to="/admin-dashboard" replace /> : 
                  <PageTransition><AdminSignin /></PageTransition>
              } />
              <Route path="/admin-signup" element={<PageTransition><AdminSignup /></PageTransition>} />
              <Route path="/supervisor-signin" element={
                authenticated && userRole === 'supervisor' ? 
                  <Navigate to="/supervisor-dashboard" replace /> : 
                  <PageTransition><SupervisorSignin /></PageTransition>
              } />
              <Route path="/supervisor-signup" element={<PageTransition><SupervisorSignup /></PageTransition>} />

              {/* Mobile App Required Page */}
              <Route path="/mobile-app-required" element={<PageTransition><MobileAppRequired /></PageTransition>} />

              {/* Admin Routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="supervisors" element={<AdminSupervisors />} />
                <Route path="farms" element={<AdminFarms />} />
                <Route path="farmers" element={<AdminFarmers />} />
                <Route path="visits" element={<AdminVisits />} />
                <Route path="issues" element={<AdminIssues />} />
                <Route path="reports" element={<AdminExports />} />
                <Route path="officers" element={<FieldOfficers />} />
                <Route path="polygons" element={<AdminPolygons />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="activity" element={<AdminActivityLog />} />
                <Route path="apk" element={<AdminAPKManager />} />
                <Route path="transfers" element={<AdminTransfers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<AdminSettings />} />
              </Route>

              {/* Supervisor Routes */}
              <Route 
                path="/supervisor-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SupervisorOverview />} />
                <Route path="farms" element={<SupervisorFarms />} />
                <Route path="farmers" element={<SupervisorFarmers />} />
                <Route path="officers" element={<SupervisorOfficers />} />
                <Route path="visits" element={<SupervisorVisits />} />
                <Route path="polygons" element={<SupervisorPolygons />} />
                <Route path="issues" element={<SupervisorIssues />} />
                <Route path="transfers" element={<SupervisorTransfers />} />
                <Route path="settings" element={<SupervisorSettings />} />
              </Route>

              {/* Farms Management */}
              <Route 
                path="/farms-management" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <PageTransition><FarmsManagement /></PageTransition>
                  </ProtectedRoute>
                } 
              />

              {/* 404 */}
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
