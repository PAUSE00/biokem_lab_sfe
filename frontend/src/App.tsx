import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider, useAuth } from './services/AuthContext';
import type { UserRole } from './services/AuthContext';

// Lazy loading pages for performance optimization
const Dashboard  = React.lazy(() => import('./pages/Dashboard'));
const Login      = React.lazy(() => import('./pages/Login'));
const Samples    = React.lazy(() => import('./pages/Samples'));
const Analyses   = React.lazy(() => import('./pages/Analyses'));
const Reports    = React.lazy(() => import('./pages/Reports'));
const Users      = React.lazy(() => import('./pages/Users'));
const Planning   = React.lazy(() => import('./pages/Planning'));
const Stock      = React.lazy(() => import('./pages/Stock'));
const Audit      = React.lazy(() => import('./pages/Audit'));
const Tracking   = React.lazy(() => import('./pages/Tracking'));

// Global Loading Fallback
const GlobalLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Chargement de l'interface...</p>
    </div>
  </div>
);

/* ─── Guards ──────────────────────────────────────────────────────────────── */

/** Redirects to /login if there is no valid token */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

/** Redirects to /dashboard if the current user's role is not in the allowed list */
const RequireRole = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) => {
  const { hasRole } = useAuth();
  return hasRole(...roles) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

/* ─── App ─────────────────────────────────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"                element={<Login />} />
            <Route path="/tracking/:code"       element={<Tracking />} />

            {/* Protected routes — all require a token */}
            <Route
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              {/* Everyone who is logged in */}
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/samples"   element={<Samples />} />
              <Route path="/analyses"  element={<Analyses />} />
              <Route path="/reports"   element={<Reports />} />
              <Route path="/planning"  element={<Planning />} />

              {/* Admin + Responsable only */}
              <Route
                path="/stock"
                element={
                  <RequireRole roles={['Admin', 'Responsable']}>
                    <Stock />
                  </RequireRole>
                }
              />
              <Route
                path="/audit"
                element={
                  <RequireRole roles={['Admin', 'Responsable']}>
                    <Audit />
                  </RequireRole>
                }
              />

              {/* Admin only */}
              <Route
                path="/users"
                element={
                  <RequireRole roles={['Admin']}>
                    <Users />
                  </RequireRole>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
