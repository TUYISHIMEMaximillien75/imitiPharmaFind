import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/router/PrivateRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Patient pages
import LandingPage from './pages/patient/LandingPage';
import MyReservationsPage from './pages/patient/MyReservationsPage';
import VerificationPage from './pages/patient/VerificationPage';
import SearchResultsPage from './pages/patient/SearchResultsPage';
import ProfilePage from './pages/patient/ProfilePage';
import PharmacyDetailPage from './pages/patient/PharmacyDetailPage';

// Pharmacist pages
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import PendingApprovalPage from './pages/pharmacist/PendingApprovalPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Misc
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

/** Smart redirect for root "/" based on user role */
function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'PHARMACIST') return <Navigate to="/pharmacist" replace />;
  return <LandingPage />;
}

/** Pharmacist gate: redirect to pending if pharmacy not yet approved */
function PharmacistGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.pharmacy && user.pharmacy.status !== 'ACTIVE') {
    return <PendingApprovalPage />;
  }
  return <>{children}</>;
}


function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-gray-100 font-sans selection:bg-sky-200 dark:selection:bg-sky-800">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes (no shell) ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── All routes with Header/Footer shell ── */}
        <Route
          path="/*"
          element={
            <AppLayout>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Patient — search flow (public) */}
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/verify" element={<VerificationPage />} />
                <Route path="/pharmacy/:id" element={<PharmacyDetailPage />} />

                {/* Patient */}
                <Route
                  path="/my-reservations"
                  element={
                    <PrivateRoute allowedRoles={['PATIENT']}>
                      <MyReservationsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute allowedRoles={['PATIENT', 'PHARMACIST', 'ADMIN']}>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />

                {/* Pharmacist */}
                <Route
                  path="/pharmacist"
                  element={
                    <PrivateRoute allowedRoles={['PHARMACIST']}>
                      <PharmacistGate>
                        <PharmacistDashboard />
                      </PharmacistGate>
                    </PrivateRoute>
                  }
                />

                {/* Admin */}
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Fallback 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
