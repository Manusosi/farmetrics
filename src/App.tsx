import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/supervisors" element={<Supervisors />} />
          <Route path="/field-officers" element={<FieldOfficers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/data-protection" element={<DataProtection />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-signin" element={<AdminSignin />} />
          <Route path="/supervisor-signup" element={<SupervisorSignup />} />
          <Route path="/supervisor-signin" element={<SupervisorSignin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
