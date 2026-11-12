import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Shield, 
  Gavel, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Radio,
  LogOut
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', to: '/admin', icon: LayoutDashboard },
    { name: 'Tournaments', to: '/admin/tournaments', icon: Trophy },
    { name: 'Teams & Squads', to: '/admin/teams', icon: Shield },
    { name: 'Player Roster', to: '/admin/players', icon: Users },
    { name: 'Live Auction Cockpit', to: '/admin/live', icon: Gavel, highlight: true },
    { name: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

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
          <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
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
              end={item.to === '/admin'}
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

        {/* User Workspace Profile Footer with Logout */}
        <div className="p-3 border-t border-border-subtle bg-canvas-subtle/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-card border border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-surface-accent flex items-center justify-center font-bold text-xs text-brand-cyan shrink-0">
              AD
            </div>
            {!isCollapsed && (
              <>
                <div className="overflow-hidden leading-tight flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Admin Organiser'}</p>
                  <p className="text-[10px] text-brand-cyan font-mono truncate">{user?.role || 'Admin'} Session</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative w-72 max-w-[85vw] bg-surface-card border-r border-border-subtle flex flex-col h-full z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-base shadow-glow-cyan">
                    C
                  </div>
                  <span className="font-extrabold text-base text-white">CBid Engine</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.to === '/admin'}
                    onClick={handleNavClick}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-brand-cyan text-slate-950 font-bold shadow-glow-cyan'
                        : 'text-slate-300 hover:text-white hover:bg-surface-accent'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}

                <div className="pt-4 mt-4 border-t border-border-subtle space-y-2">
                  <Link
                    to="/"
                    onClick={handleNavClick}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Public Live Tracker</span>
                  </Link>

                  <Link
                    to="/register"
                    onClick={handleNavClick}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Player Registration Form</span>
                  </Link>
                </div>
              </nav>

              {/* Mobile Drawer Footer with Sign Out */}
              <div className="p-4 border-t border-border-subtle bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Admin Organiser'}</p>
                    <p className="text-[10px] text-brand-cyan font-mono">Authenticated Admin</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-accent cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
              Tournament Workspace
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-300 hover:text-white border border-border-subtle transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-cyan" />
              Public Tracker
            </Link>

            <Button
              variant="success"
              size="sm"
              leftIcon={Gavel}
              onClick={() => navigate('/admin/live')}
              className="text-xs px-2.5 sm:px-3 py-1.5 font-bold shadow-glow-emerald"
            >
              <span className="hidden xs:inline sm:inline">Launch Live Floor</span>
              <span className="xs:hidden sm:hidden">Live Floor</span>
            </Button>

            <button
              onClick={handleLogout}
              title="Sign Out of Admin"
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-border-subtle transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Routed View Space with Guaranteed, Non-Blocking Smooth Entrance */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
