import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider, useAuth } from './services/AuthContext';
import type { UserRole } from './services/AuthContext';

// Lazy loading pages for performance optimization
const Dashboard     = React.lazy(() => import('./pages/Dashboard'));
const Login         = React.lazy(() => import('./pages/Login'));
const Demandes      = React.lazy(() => import('./pages/Demandes'));
const Clients       = React.lazy(() => import('./pages/Clients'));
const Samples       = React.lazy(() => import('./pages/Samples'));
const Preparation   = React.lazy(() => import('./pages/Preparation'));
const AnalysesSol   = React.lazy(() => import('./pages/AnalysesSol'));
const AnalysesEau   = React.lazy(() => import('./pages/AnalysesEau'));
const Validation    = React.lazy(() => import('./pages/Validation'));
const Analyses      = React.lazy(() => import('./pages/Analyses'));
const Reports       = React.lazy(() => import('./pages/Reports'));
const Planning      = React.lazy(() => import('./pages/Planning'));
const Equipements   = React.lazy(() => import('./pages/Equipements'));
const Calibration   = React.lazy(() => import('./pages/Calibration'));
const Stock         = React.lazy(() => import('./pages/Stock'));
const Qualite       = React.lazy(() => import('./pages/Qualite'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Users         = React.lazy(() => import('./pages/Users'));
const Tracking      = React.lazy(() => import('./pages/Tracking'));

// Global Loading Fallback
const GlobalLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#070b11]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin" />
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
              <Route path="/demandes"  element={<Demandes />} />
              <Route path="/clients"   element={<Clients />} />
              <Route path="/samples"   element={<Samples />} />
              <Route path="/preparation" element={<Preparation />} />
              <Route path="/analyses-sol" element={<AnalysesSol />} />
              <Route path="/analyses-eau" element={<AnalysesEau />} />
              <Route path="/validation" element={<Validation />} />
              
              {/* Backward compatibility for legacy analyses console if needed */}
              <Route path="/analyses"  element={<Analyses />} />
              
              <Route path="/reports"   element={<Reports />} />
              <Route path="/planning"  element={<Planning />} />
              <Route path="/equipements" element={<Equipements />} />
              <Route path="/calibration" element={<Calibration />} />
              <Route path="/notifications" element={<Notifications />} />

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
                path="/qualite"
                element={
                  <RequireRole roles={['Admin', 'Responsable']}>
                    <Qualite />
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
