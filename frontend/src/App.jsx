import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getUser } from './lib/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TradesPage from './pages/TradesPage';
import TradeEntryPage from './pages/TradeEntryPage';
import TradeDetailPage from './pages/TradeDetailPage';
import PipPage from './pages/PipPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import Nav from './components/Nav';
import './App.css';

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function OnboardingGuard({ children }) {
  const user = getUser();
  if (!getToken()) return <Navigate to="/login" replace />;
  if (!user?.trading_style) return <Navigate to="/onboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app">
      <Nav />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboard" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <OnboardingGuard>
            <AppLayout><DashboardPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/trades" element={
          <OnboardingGuard>
            <AppLayout><TradesPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/trades/new" element={
          <OnboardingGuard>
            <AppLayout><TradeEntryPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/trades/:id" element={
          <OnboardingGuard>
            <AppLayout><TradeDetailPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/trades/:id/edit" element={
          <OnboardingGuard>
            <AppLayout><TradeEntryPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/pip" element={
          <OnboardingGuard>
            <AppLayout><PipPage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="/profile" element={
          <OnboardingGuard>
            <AppLayout><ProfilePage /></AppLayout>
          </OnboardingGuard>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
