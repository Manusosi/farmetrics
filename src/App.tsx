import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
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
