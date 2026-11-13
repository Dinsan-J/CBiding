import React, { useEffect } from 'react';
import { Outlet, NavLink, Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Users, Shield, BarChart3, Trophy, Search, UserPlus } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { cn } from '../utils/cn';

export const PublicLayout = ({ children, tournament }) => {
  const location = useLocation();
  const { slug } = useParams();
  const { tournaments, activeTournament, loadPublicTournament } = useAuction();
  const shouldLoadTournament = slug ? activeTournament?.slug !== slug : !activeTournament?.id;
  useEffect(() => {
    if (shouldLoadTournament) loadPublicTournament(slug || null).catch(() => {});
  }, [slug, shouldLoadTournament, loadPublicTournament]);

  const currentTournament = tournament || (
    slug
      ? (tournaments.find(t => t.slug === slug) || (activeTournament?.slug === slug ? activeTournament : null))
      : activeTournament
  );
  const currentSlug = currentTournament?.slug || slug || 'cpl-2026';
  const currentTitle = currentTournament?.title || 'BidX Tournament';

  const isCustomSlug = Boolean(slug);
  const homePath = isCustomSlug ? `/live/${slug}` : '/';
  const registerPath = isCustomSlug ? `/register/${slug}` : '/register';

  const navLinks = [
    { label: 'Live Auction', path: homePath, icon: Radio, highlight: true, exact: true },
    { label: 'All Players', path: isCustomSlug ? `/live/${slug}/players` : '/players', icon: Search },
    { label: 'Teams & Squads', path: isCustomSlug ? `/live/${slug}/teams` : '/teams', icon: Shield },
    { label: 'Auction Stats', path: isCustomSlug ? `/live/${slug}/stats` : '/stats', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
      {/* Broadcast Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Branding / Logo */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 min-w-0">
              <Link to={homePath} className="flex items-center gap-2 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-sm tracking-tight shadow-glow-cyan shrink-0">
                  BX
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-brand-cyan transition-colors truncate max-w-[150px] sm:max-w-xs">
                      {currentTitle}
                    </span>
                    <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-crimson animate-ping" />
                      Live
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block -mt-0.5 truncate">
                    Official Public Auction Tracker
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact || item.path === homePath}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors',
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

            {/* Header Right Actions (Single CTA Button) */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={registerPath}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan text-slate-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-300 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register Player</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Subnav - Scrollable with 4 Core Sections */}
        <div className="md:hidden border-t border-border-subtle bg-slate-950/80 backdrop-blur-md overflow-x-auto scrollbar-none px-3 py-2 flex items-center gap-2">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact || item.path === homePath}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                isActive 
                  ? 'bg-brand-cyan text-slate-950 font-bold shadow-glow-cyan' 
                  : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-border-subtle'
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Public Content Area with Robust, Non-Blocking Smooth Entrance */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {children || <Outlet />}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-card py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BidX — Cricket Auction Platform. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              Real-time Sync Active
            </span>
            <span>•</span>
            <Link to="/admin" className="hover:text-brand-cyan transition-colors">Organiser Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
