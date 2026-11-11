import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';

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
    <AuctionProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />

          {/* Public Player Self-Registration Route */}
          <Route path="/register/:slug" element={<PublicPlayerRegistration />} />

          {/* Organiser Dashboard Workspace */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<OrganiserOverview />} />
            <Route path="tournaments" element={<TournamentsManager />} />
            <Route path="teams" element={<TeamsManager />} />
            <Route path="players" element={<PlayersManager />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="showcase" element={<DesignSystemShowcase />} />
          </Route>

          {/* Public Spectator Live Experience (Cricbuzz Inspired) */}
          <Route path="/live/:slug" element={<PublicLayout />}>
            <Route index element={<PublicLiveTracker />} />
            <Route path="players" element={<PublicPlayersDirectory />} />
            <Route path="teams" element={<PublicTeamsExplorer />} />
            <Route path="stats" element={<PublicAuctionStats />} />
          </Route>

          {/* Auctioneer Live Operator Cockpit */}
          <Route path="/auctioneer/live" element={<AuctioneerLayout />}>
            <Route index element={<LiveAuctionCockpit />} />
          </Route>

          {/* Root Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuctionProvider>
  );
}

export default App;
