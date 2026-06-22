import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Films from './pages/Films';
import FilmUpload from './pages/FilmUpload';
import FilmDetail from './pages/FilmDetail';
import Venues from './pages/Venues';
import VenueForm from './pages/VenueForm';
import Contracts from './pages/Contracts';
import ContractForm from './pages/ContractForm';
import ScreeningKeys from './pages/ScreeningKeys';
import Analytics from './pages/Analytics';
import Player from './pages/Player';
import FilmDownloadPage from './pages/FilmDownloadPage';
import FilmScreenPage from './pages/FilmScreenPage';
import PremierePage from './pages/PremierePage';
import Inquiries from './pages/Inquiries';
import FilmManage from './pages/FilmManage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#94a3b8', padding: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public landing page — always visible, no auth check */}
      <Route path="/" element={<Landing />} />

      {/* Auth pages — redirect to /dashboard if already logged in */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      {/* Public screening player — no login required, key is the auth */}
      <Route path="/screen" element={<Player />} />
      <Route path="/screen/:keyToken" element={<Player />} />

      {/* Legal pages */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Public film detail + enquiry */}
      <Route path="/film/:slug" element={<FilmDetail />} />

      {/* New two-key model pages — public, no auth */}
      <Route path="/film/:slug/download" element={<FilmDownloadPage />} />
      <Route path="/film/:slug/screen" element={<FilmScreenPage />} />
      <Route path="/premiere/:slug" element={<PremierePage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/films" element={<Films />} />
        <Route path="/films/upload" element={<FilmUpload />} />
        <Route path="/films/:filmId" element={<FilmManage />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/new" element={<VenueForm />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/contracts/new" element={<ContractForm />} />
        <Route path="/keys" element={<ScreeningKeys />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/player" element={<Player />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
