import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../utils/motion';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Shield, 
  Gavel, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';

export const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments', to: '/dashboard/tournaments', icon: Trophy },
    { name: 'Teams & Squads', to: '/dashboard/teams', icon: Shield },
    { name: 'Player Roster', to: '/dashboard/players', icon: Users },
    { name: 'Live Auction Cockpit', to: '/auctioneer/live', icon: Gavel, highlight: true },
    { name: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex font-sans">
      {/* Desktop Animated Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="hidden md:flex flex-col bg-surface-card border-r border-border-subtle shrink-0 sticky top-0 h-screen z-30 select-none"
      >
        {/* Brand & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-glow-cyan">
              C
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="leading-none whitespace-nowrap"
              >
                <span className="font-extrabold text-base tracking-tight text-white block">
                  CBid Engine
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Organiser Suite
                </span>
              </motion.div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-accent transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative',
                isActive
                  ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-glow-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-accent',
                item.highlight && !isActive && 'text-brand-emerald hover:text-emerald-300'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                item.highlight && 'text-brand-emerald'
              )} />
              
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}

              {item.highlight && !isCollapsed && (
                <span className="ml-auto w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Workspace Profile Footer */}
        <div className="p-3 border-t border-border-subtle bg-canvas-subtle/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-card border border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-surface-accent flex items-center justify-center font-bold text-xs text-brand-cyan shrink-0">
              SL
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden leading-tight flex-1">
                <p className="text-xs font-bold text-white truncate">SLC Tournament Org</p>
                <p className="text-[10px] text-slate-400 truncate">Pro SaaS Plan</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface-card/80 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-accent"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Tournament Workspace
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/live/cpl-2026"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-300 hover:text-white border border-border-subtle transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-cyan" />
              View Public Tracker
            </Link>

            <Button
              variant="success"
              size="sm"
              leftIcon={Gavel}
              onClick={() => navigate('/auctioneer/live')}
            >
              Launch Live Floor
            </Button>
          </div>
        </header>

        {/* Routed View Space with Smooth Transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
      </div>
    </div>
  );
};
