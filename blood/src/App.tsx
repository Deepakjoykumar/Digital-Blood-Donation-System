import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DonorAuth from "./pages/auth/DonorAuth";
import HospitalAuth from "./pages/auth/HospitalAuth";
import DonorDashboard from "./pages/donor/DonorDashboard";
import DonorProfile from "./pages/donor/DonorProfile";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/donor" element={<DonorAuth />} />
            <Route path="/auth/hospital" element={<HospitalAuth />} />
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/donor/profile" element={<DonorProfile />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
