import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Gavel, Volume2, ShieldAlert, ArrowLeft, Radio } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const AuctioneerLayout = ({ children, tournamentTitle = "Colombo Premier League 2026" }) => {
  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Cockpit Operational Bar */}
      <header className="h-14 bg-surface-card border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-surface-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Cockpit</span>
          </Link>

          <div className="h-4 w-px bg-border-subtle hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                {tournamentTitle}
              </h1>
              <p className="text-[11px] text-slate-400 leading-none">
                Live Auctioneer Desk
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center gap-3">
          <Badge variant="emerald" dot className="animate-pulse">
            <Radio className="w-3 h-3 mr-1" />
            LIVE BROADCASTING
          </Badge>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 bg-surface-accent px-2.5 py-1 rounded-md border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
            <span>SYNC: 24ms</span>
          </div>

          <button 
            title="Mute / Unmute Audio Cues"
            className="p-1.5 rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-300 hover:text-white border border-border-subtle transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Cockpit Space */}
      <main className="flex-1 overflow-hidden relative">
        {children || <Outlet />}
      </main>
    </div>
  );
};
