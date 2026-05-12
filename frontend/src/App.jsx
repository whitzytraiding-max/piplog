import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './lib/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TradesPage from './pages/TradesPage';
import TradeEntryPage from './pages/TradeEntryPage';
import TradeDetailPage from './pages/TradeDetailPage';
import PipPage from './pages/PipPage';
import ProfilePage from './pages/ProfilePage';
import Nav from './components/Nav';
import './App.css';

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
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
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/trades" element={
          <ProtectedRoute>
            <AppLayout><TradesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/trades/new" element={
          <ProtectedRoute>
            <AppLayout><TradeEntryPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/trades/:id" element={
          <ProtectedRoute>
            <AppLayout><TradeDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/trades/:id/edit" element={
          <ProtectedRoute>
            <AppLayout><TradeEntryPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pip" element={
          <ProtectedRoute>
            <AppLayout><PipPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
