import React from 'react';
import { Outlet, NavLink, Link, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, Shield, BarChart3, Trophy, Search } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { cn } from '../utils/cn';
import { pageVariants } from '../utils/motion';

export const PublicLayout = ({ children, tournament }) => {
  const location = useLocation();
  const { slug } = useParams();
  const { tournaments, activeTournament } = useAuction();
  const currentTournament = tournament || tournaments.find(t => t.slug === slug) || activeTournament;
  const currentSlug = currentTournament?.slug || slug || 'cpl-2026';
  const currentTitle = currentTournament?.title || 'Colombo Premier League 2026';

  const navLinks = [
    { label: 'Live Auction', path: `/live/${currentSlug}`, icon: Radio, highlight: true },
    { label: 'All Players', path: `/live/${currentSlug}/players`, icon: Search },
    { label: 'Teams & Squads', path: `/live/${currentSlug}/teams`, icon: Shield },
    { label: 'Auction Stats', path: `/live/${currentSlug}/stats`, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
      {/* Broadcast Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding / Logo */}
            <div className="flex items-center gap-4">
              <Link to={`/live/${currentSlug}`} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-lg shadow-glow-cyan">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-cyan transition-colors">
                      {currentTitle}
                    </span>
                    <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-ping" />
                      Live
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block -mt-0.5">
                    Official Public Auction Tracker
                  </span>
                </div>
              </Link>
            </div>

            {/* Cricbuzz-style Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive 
                      ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30' 
                      : 'text-slate-300 hover:text-white hover:bg-surface-accent'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Quick Actions / Portal Link */}
            <div className="flex items-center gap-3">
              <Link
                to={`/register/${currentSlug}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-200 border border-border-subtle transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-brand-cyan" />
                Player Registration
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Subnav */}
        <div className="md:hidden border-t border-border-subtle bg-slate-950/60 overflow-x-auto scrollbar-none px-4 py-2 flex items-center gap-2">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                isActive 
                  ? 'bg-brand-cyan text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-border-subtle'
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Public Content Area with Smooth Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-card py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CBid — SportsTech Auction Management Platform. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Real-time WebSocket Sync</span>
            <span>•</span>
            <Link to="/login" className="hover:text-brand-cyan transition-colors">Organiser Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
