import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Gifts from "./pages/Gifts";
import Users from "./pages/Users";
import Community from "./pages/Community"; // adjust path if needed


import Analytics from "./pages/Analytics";
import Feedback from "./pages/Feedback";

import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/gifts" element={<ProtectedRoute><Gifts /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
       
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      <Route path="/community" element={
  <ProtectedRoute>
    <Community />
  </ProtectedRoute>
} />


          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
