import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  TrendingUp, 
  Users, 
  Shield, 
  Trophy, 
  Clock, 
  Sparkles,
  ArrowRight,
  Flame
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { SoldCelebration } from '../../components/ui/SoldCelebration';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export const PublicLiveTracker = () => {
  const {
    activeTournament,
    teams,
    players,
    activeLot,
    currentLotPlayer,
    currentHighestTeam,
    soldEvent,
    closeSoldModal
  } = useAuction();

  // Aggregate Metrics for Spectators
  const totalPurse = teams.reduce((acc, t) => acc + t.startingPurse, 0);
  const totalSpent = teams.reduce((acc, t) => acc + t.totalSpent, 0);
  const soldCount = players.filter(p => p.status === 'SOLD').length;
  const unsoldCount = players.filter(p => p.status === 'UNSOLD').length;
  const remainingCount = players.filter(p => ['QUEUED', 'LIVE'].includes(p.status)).length;
  const recentSold = players.filter(p => p.status === 'SOLD').slice(-4).reverse();

  return (
    <div className="space-y-6">
      {/* TOURNAMENT BROADCAST KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-surface-card to-surface-accent/60">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Spend</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-brand-emerald text-glow-emerald mt-1">
            {formatCurrency(totalSpent, activeTournament.currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {Math.round((totalSpent / totalPurse) * 100)}% of total salary cap
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface-card to-surface-accent/60">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">Players Sold</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-white mt-1">
            {soldCount} <span className="text-sm font-normal text-slate-400">/ {players.length}</span>
          </div>
          <span className="text-[10px] text-brand-cyan mt-1 block">Active Rosters Filling</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface-card to-surface-accent/60">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">Unsold Lots</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-brand-crimson mt-1">
            {unsoldCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Eligible for Round 2</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface-card to-surface-accent/60">
          <span className="text-[11px] font-mono uppercase text-slate-400 block">Remaining Lots</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-brand-gold mt-1">
            {remainingCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">In Auction Queue</span>
        </Card>
      </div>

      {/* CENTERSTAGE: LIVE LOT CARD (Cricbuzz Hero Experience) */}
      {!currentLotPlayer ? (
        <div className="relative rounded-3xl bg-gradient-to-b from-surface-card via-slate-900 to-canvas border border-border-subtle p-8 text-center shadow-2xl">
          <Clock className="w-16 h-16 text-brand-gold mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Awaiting Next Lot Draw</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            The previous lot has concluded. The live auctioneer desk is preparing the next athlete for the auction stage.
          </p>
        </div>
      ) : (
      <div className="relative rounded-3xl bg-gradient-to-b from-surface-card via-slate-900 to-canvas border border-brand-cyan/40 p-6 sm:p-8 shadow-[0_0_50px_-15px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Subtle Live Broadcast Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-red-500/10 text-brand-crimson border border-red-500/30 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-brand-crimson animate-ping" />
              LIVE LOT ON STAGE
            </span>
            <Badge variant="gold" dot className="font-bold">
              LOT #{currentLotPlayer?.lotNumber || 1}
            </Badge>
          </div>

          <div className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <span>BROADCAST DELAY: &lt; 80ms</span>
          </div>
        </div>

        {/* Hero Content: Player & Real-time Bid Duel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Col 1: Player Portrait & Role Badge */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="relative">
              <div className="w-48 h-60 sm:w-56 sm:h-68 rounded-2xl overflow-hidden border-2 border-border-subtle bg-slate-900 shadow-2xl flex items-center justify-center relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                  <Users className="w-20 h-20 mb-2" />
                  <span className="text-xs font-mono tracking-widest text-slate-400">CRICKET ATHLETE</span>
                </div>
                <img
                  src={currentLotPlayer?.photoUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80"}
                  alt={currentLotPlayer?.fullName}
                  className="relative z-10 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 z-20">
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-lg ${getRoleBadgeClass(currentLotPlayer?.role)}`}>
                  {getRoleLabel(currentLotPlayer?.role)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentLotPlayer?.fullName}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {currentLotPlayer?.country} • {currentLotPlayer?.battingStyle} • {currentLotPlayer?.bowlingStyle}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Base Price: <strong className="font-mono text-slate-200">{formatExactCurrency(currentLotPlayer?.basePrice, activeTournament.currency)}</strong>
              </p>
            </div>
          </div>

          {/* Col 2: The Bidding Board (Current Bid, Leading Team, Live Timer) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current High Bid Card */}
              <div className="p-6 rounded-2xl bg-surface-accent/70 border border-border-subtle flex flex-col justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Current Highest Bid
                </span>

                <div className="my-2">
                  <div className="text-4xl sm:text-5xl font-mono font-black text-brand-emerald text-glow-emerald">
                    <NumberTicker value={activeLot.currentBid} prefix={`${activeTournament.currency} `} />
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {formatCurrency(activeLot.currentBid, activeTournament.currency, 'SOUTH_ASIAN')}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Total Lot Bids: <span className="text-brand-cyan font-bold">{activeLot.bidCount}</span>
                </div>
              </div>

              {/* Leading Franchise Card */}
              <div className="p-6 rounded-2xl bg-surface-accent/70 border border-border-subtle flex flex-col justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Leading Bidder
                </span>

                {currentHighestTeam ? (
                  <div className="flex items-center gap-3.5 my-2">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl shrink-0"
                      style={{ backgroundColor: currentHighestTeam.primaryColor || '#06B6D4' }}
                    >
                      {currentHighestTeam.shortName}
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-white leading-tight">
                        {currentHighestTeam.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Remaining Purse: <span className="text-brand-cyan font-mono font-bold">{formatCurrency(currentHighestTeam.remainingPurse, activeTournament.currency)}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto py-4 text-sm text-slate-500">
                    Awaiting opening bid from franchises...
                  </div>
                )}

                <div className="text-xs text-slate-400 font-mono">
                  Status: Holding Lot Gavel
                </div>
              </div>
            </div>

            {/* Countdown Bar & Telemetry */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-cyan animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Countdown Timer
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Server authoritative timer. Reset on each new bid.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-2xl font-extrabold text-brand-cyan">
                  {String(activeLot.timerSeconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* RECENT AUCTION MILESTONES / SOLD PLAYERS TICKER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-gold" />
            Recent Hammer Milestones
          </h3>
          <Link 
            to={`/live/${activeTournament.slug}/players?status=SOLD`}
            className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
          >
            View All Sold Lots <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentSold.map((player) => {
            const team = teams.find(t => t.id === player.winningTeamId);
            return (
              <Card key={player.id} className="p-4 bg-surface-card border-border-subtle hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="emerald" dot>SOLD</Badge>
                  <span className="font-mono text-xs font-extrabold text-brand-emerald">
                    {formatCurrency(player.finalPrice, activeTournament.currency)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white truncate leading-tight">
                  {player.fullName}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {getRoleLabel(player.role)}
                </p>

                <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs">
                  <span className="text-slate-400">Franchise:</span>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span 
                      className="w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: team?.primaryColor || '#06B6D4' }}
                    >
                      {team?.shortName || 'TM'}
                    </span>
                    {team?.name || 'Franchise'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SOLD CELEBRATION MODAL OVERLAY */}
      <SoldCelebration
        isOpen={soldEvent.isOpen}
        player={soldEvent.player}
        team={soldEvent.team}
        finalBid={soldEvent.finalBid}
        currency={activeTournament.currency}
        onClose={closeSoldModal}
      />
    </div>
  );
};
