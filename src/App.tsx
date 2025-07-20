import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { PageTransition } from "@/components/common/PageTransition";
import { LandingPage } from "./pages/LandingPage";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Supervisors } from "./pages/Supervisors";
import { FieldOfficers } from "./pages/FieldOfficers";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { DataProtection } from "./pages/DataProtection";
import { AdminSignup } from "./pages/AdminSignup";
import { AdminSignin } from "./pages/AdminSignin";
import { SupervisorSignup } from "./pages/SupervisorSignup";
import { SupervisorSignin } from "./pages/SupervisorSignin";
import { FieldOfficerSignup } from "./pages/FieldOfficerSignup";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";
import { FieldOfficerDashboard } from "./pages/FieldOfficerDashboard";
import { Signin } from "./pages/Signin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="farmetrics-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/supervisors" element={<PageTransition><Supervisors /></PageTransition>} />
            <Route path="/field-officers" element={<PageTransition><FieldOfficers /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
            <Route path="/data-protection" element={<PageTransition><DataProtection /></PageTransition>} />
            <Route path="/admin-signup" element={<PageTransition><AdminSignup /></PageTransition>} />
            <Route path="/admin-signin" element={<PageTransition><AdminSignin /></PageTransition>} />
            <Route path="/supervisor-signup" element={<PageTransition><SupervisorSignup /></PageTransition>} />
            <Route path="/supervisor-signin" element={<PageTransition><SupervisorSignin /></PageTransition>} />
            <Route path="/field-officer-signup" element={<PageTransition><FieldOfficerSignup /></PageTransition>} />
            <Route path="/signin" element={<PageTransition><Signin /></PageTransition>} />
            <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
            <Route path="/supervisor/dashboard" element={<PageTransition><SupervisorDashboard /></PageTransition>} />
            <Route path="/field-officer/dashboard" element={<PageTransition><FieldOfficerDashboard /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
