import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AuctioneerLayout } from './layouts/AuctioneerLayout';

// Organiser Dashboard Pages
import { OrganiserOverview } from './pages/organiser/OrganiserOverview';
import { TournamentsManager } from './pages/organiser/TournamentsManager';
import { TeamsManager } from './pages/organiser/TeamsManager';
import { PlayersManager } from './pages/organiser/PlayersManager';
import { SettingsView } from './pages/organiser/SettingsView';

// Public Fan Broadcast Pages
import { PublicLiveTracker } from './pages/public/PublicLiveTracker';
import { PublicPlayersDirectory } from './pages/public/PublicPlayersDirectory';
import { PublicTeamsExplorer } from './pages/public/PublicTeamsExplorer';
import { PublicAuctionStats } from './pages/public/PublicAuctionStats';

// Auctioneer Live Cockpit Page
import { LiveAuctionCockpit } from './pages/auctioneer/LiveAuctionCockpit';

// Player Registration & Auth
import { PublicPlayerRegistration } from './pages/registration/PublicPlayerRegistration';
import { Login } from './pages/auth/Login';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuctionProvider>
          <BrowserRouter>
          <Routes>
            {/* Public Spectator Live Experience at Root (bidxnew.vercel.app) */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<PublicLiveTracker />} />
              <Route path="players" element={<PublicPlayersDirectory />} />
              <Route path="teams" element={<PublicTeamsExplorer />} />
              <Route path="stats" element={<PublicAuctionStats />} />
            </Route>

            {/* Tournament-Specific Public Experience (e.g. /live/cpl-2026) */}
            <Route path="/live/:slug" element={<PublicLayout />}>
              <Route index element={<PublicLiveTracker />} />
              <Route path="players" element={<PublicPlayersDirectory />} />
              <Route path="teams" element={<PublicTeamsExplorer />} />
              <Route path="stats" element={<PublicAuctionStats />} />
            </Route>

            {/* Public Player Self-Registration */}
            <Route path="/register" element={<PublicPlayerRegistration />} />
            <Route path="/register/:slug" element={<PublicPlayerRegistration />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />

            {/* Organiser / Admin Dashboard Workspace (/admin) - Protected */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OrganiserOverview />} />
              <Route path="tournaments" element={<TournamentsManager />} />
              <Route path="teams" element={<TeamsManager />} />
              <Route path="players" element={<PlayersManager />} />
              <Route path="settings" element={<SettingsView />} />
              <Route path="showcase" element={<DesignSystemShowcase />} />
            </Route>

            {/* Live Auctioneer Operator Cockpit - Protected */}
            <Route 
              path="/admin/live" 
              element={
                <ProtectedRoute>
                  <AuctioneerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LiveAuctionCockpit />} />
            </Route>
            <Route 
              path="/auctioneer/live" 
              element={
                <ProtectedRoute>
                  <AuctioneerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LiveAuctionCockpit />} />
            </Route>

            {/* Backward Compatibility Aliases for /dashboard */}
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />

            {/* Fallback to Public Live Floor */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuctionProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
