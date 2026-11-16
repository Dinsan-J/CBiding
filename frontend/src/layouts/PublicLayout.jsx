import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Users, Shield, BarChart3, Trophy, Search, UserPlus } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { DownloadAuctionPdfButton } from '../components/layout/DownloadAuctionPdfButton';

export const PublicLayout = ({ children, tournament }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { tournaments, activeTournament, loadPublicTournament } = useAuction();
  const { toast } = useToast();
  const [publicTournaments, setPublicTournaments] = useState([]);
  const shouldLoadTournament = slug ? activeTournament?.slug !== slug : !activeTournament?.id;

  useEffect(() => {
    let isMounted = true;
    api.getPublicAuctions().then(result => {
      if (isMounted && result?.success && Array.isArray(result.data)) setPublicTournaments(result.data);
    }).catch(error => {
      if (isMounted) toast.error(error.message || 'Tournament history could not be loaded.');
    });
    return () => { isMounted = false; };
  }, [toast]);

  useEffect(() => {
    if (shouldLoadTournament) {
      loadPublicTournament(slug || null).catch(error => {
        if (slug) toast.error(error.message || 'Could not load this tournament.');
      });
    }
  }, [slug, shouldLoadTournament, loadPublicTournament, toast]);

  const currentTournament = tournament || (
    slug
      ? (publicTournaments.find(t => t.slug === slug) || tournaments.find(t => t.slug === slug) || (activeTournament?.slug === slug ? activeTournament : null))
      : activeTournament
  );
  const currentTitle = currentTournament?.title || 'BidX Tournament';
  const currentStatus = currentTournament?.status || 'LIVE';
  const statusClasses = currentStatus === 'LIVE'
    ? 'bg-red-500/10 text-red-400 border-red-500/30'
    : currentStatus === 'COMPLETED'
      ? 'bg-slate-700/50 text-slate-300 border-slate-500/40'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/30';

  const isCustomSlug = Boolean(slug);
  const homePath = isCustomSlug ? `/live/${slug}` : '/';
  const registerPath = isCustomSlug ? `/register/${slug}` : '/register';

  const navLinks = [
    { label: currentStatus === 'COMPLETED' ? 'Tournament Overview' : 'Live Auction', path: homePath, icon: Radio, highlight: true, exact: true },
    { label: 'All Players', path: isCustomSlug ? `/live/${slug}/players` : '/players', icon: Search },
    { label: 'Teams & Squads', path: isCustomSlug ? `/live/${slug}/teams` : '/teams', icon: Shield },
    { label: 'Auction Stats', path: isCustomSlug ? `/live/${slug}/stats` : '/stats', icon: BarChart3 },
  ];

  const changePublicTournament = (nextSlug) => {
    if (!nextSlug || nextSlug === (slug || activeTournament?.slug)) return;
    const page = location.pathname.match(/\/(players|teams|stats)$/)?.[1];
    navigate(`/live/${nextSlug}${page ? `/${page}` : ''}`);
    toast.info('Loading the selected tournament.');
  };

  const publicTournamentSelector = (className = '') => (
    <label className={`flex min-w-0 items-center gap-2 ${className}`}>
      <Trophy className="h-4 w-4 shrink-0 text-brand-cyan" />
      <span className="sr-only">Choose tournament</span>
      <select
        aria-label="Choose tournament"
        value={slug || activeTournament?.slug || ''}
        onChange={event => changePublicTournament(event.target.value)}
        className="min-w-0 max-w-full rounded-lg border border-border-subtle bg-surface-accent px-2.5 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-brand-cyan sm:text-sm"
      >
        {!publicTournaments.length && <option value="">Tournament history</option>}
        {publicTournaments.map(item => (
          <option key={item._id || item.slug} value={item.slug}>
            {item.title} · {item.status}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
      {/* Broadcast Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle">
        <div className="w-full max-w-none mx-auto px-3 sm:px-5 xl:px-6 2xl:px-8">
          <div className="flex h-16 min-w-0 items-center gap-2 sm:gap-4">
            {/* Branding / Logo */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 min-w-0">
              <Link to={homePath} className="flex items-center gap-2 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-sm tracking-tight shadow-glow-cyan shrink-0">
                  BX
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-brand-cyan transition-colors truncate max-w-[80px] sm:max-w-xs">
                      {currentTitle}
                    </span>
                    <span className={`flex items-center gap-1 border text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusClasses}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'LIVE' ? 'bg-brand-crimson animate-ping' : currentStatus === 'COMPLETED' ? 'bg-slate-400' : 'bg-amber-300'}`} />
                      {currentStatus}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block -mt-0.5 max-w-[120px] truncate sm:max-w-none">
                    Official Public Auction Tracker
                  </span>
                </div>
              </Link>
            </div>

            {/* Keep navigation and tournament controls on this row; overflow scrolls on narrow screens. */}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none xl:gap-4">
              <nav className="flex min-w-max flex-1 items-center justify-center gap-1 xl:gap-1.5">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact || item.path === homePath}
                    className={({ isActive }) => cn(
                      'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm',
                      isActive
                        ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                        : 'text-slate-300 hover:text-white hover:bg-surface-accent'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {publicTournaments.length > 0 && publicTournamentSelector('shrink-0 max-w-64')}
                <DownloadAuctionPdfButton compact />
                {currentStatus !== 'COMPLETED' && (
                  <Link
                    to={registerPath}
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-cyan px-2.5 py-2 text-xs font-bold text-slate-950 shadow-glow-cyan transition-colors hover:bg-cyan-300 sm:px-3"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Register Player</span>
                    <span className="sm:hidden">Register</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Main Public Content Area with Robust, Non-Blocking Smooth Entrance */}
      <main className="flex-1 w-full max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
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
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BidX — Cricket Auction Platform. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentStatus === 'COMPLETED' ? 'bg-slate-500' : 'bg-brand-emerald animate-pulse'}`} />
              {currentStatus === 'COMPLETED' ? 'Tournament History' : 'Real-time Sync Active'}
            </span>
            <span>•</span>
            <Link to="/admin" className="hover:text-brand-cyan transition-colors">Organiser Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
