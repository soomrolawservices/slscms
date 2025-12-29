import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Cases from "./pages/Cases";
import Documents from "./pages/Documents";
import Payments from "./pages/Payments";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Appointments from "./pages/Appointments";
import Credentials from "./pages/Credentials";
import Users from "./pages/Users";
import Permissions from "./pages/Permissions";
import Settings from "./pages/Settings";
import Assignments from "./pages/Assignments";
import ClientPortal from "./pages/ClientPortal";
import ClientProfile from "./pages/ClientProfile";
import ClientLogin from "./pages/ClientLogin";
import ClientSignup from "./pages/ClientSignup";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

// ITR Portal
import ITRLayout from "./pages/itr/ITRLayout";
import ITRDashboard from "./pages/itr/ITRDashboard";
import ITRClients from "./pages/itr/ITRClients";
import ITRExtensions from "./pages/itr/ITRExtensions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Client Portal Auth */}
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/client-signup" element={<ClientSignup />} />
            
            {/* Client Portal - Separate Layout */}
            <Route element={<ClientPortalLayout />}>
              <Route path="/portal" element={<ClientPortal />} />
              <Route path="/portal/profile" element={<ClientProfile />} />
            </Route>
            
            {/* Protected Routes - Admin/Team Only */}
            <Route element={<AppLayout />}>
              {/* Pages accessible by both Admin and Team Members */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Clients />
                </ProtectedRoute>
              } />
              <Route path="/cases" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Cases />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Appointments />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <Notifications />
                </ProtectedRoute>
              } />
              
              {/* Admin-Only Pages */}
              <Route path="/invoices" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Invoices />
                </ProtectedRoute>
              } />
              <Route path="/credentials" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Credentials />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="/permissions" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Permissions />
                </ProtectedRoute>
              } />
              <Route path="/assignments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Assignments />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } />

              {/* ITR Portal Routes */}
              <Route path="/itr" element={
                <ProtectedRoute allowedRoles={['admin', 'team_member']}>
                  <ITRLayout />
                </ProtectedRoute>
              }>
                <Route index element={<ITRDashboard />} />
                <Route path="clients" element={<ITRClients />} />
                <Route path="extensions" element={<ITRExtensions />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
