import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, 
  RotateCcw, 
  Pause, 
  Play, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  SkipForward,
  Plus,
  Shield,
  Layers,
  History,
  CheckCircle2
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { SoldCelebration } from '../../components/ui/SoldCelebration';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { lotEntranceVariants, tabContentVariants } from '../../utils/motion';

export const LiveAuctionCockpit = () => {
  const {
    activeTournament,
    isLiveLoading,
    teams,
    players,
    activeLot,
    currentLotPlayer,
    currentHighestTeam,
    placeBid,
    hammerSold,
    hammerUnsold,
    selectPlayerLot,
    selectRandomLot,
    undoLastBid,
    reQueueUnsold,
    toggleTimer,
    resetTimer,
    soldEvent,
    closeSoldModal
  } = useAuction();

  // Active increment step selection (Default 500 as requested: 500, 1000, 1500, 2000, 2500)
  const [selectedIncrement, setSelectedIncrement] = useState(500);
  const [isConfirmSoldOpen, setIsConfirmSoldOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'bids', 'unsold'

  // Dynamic Increment Options
  const incrementOptions = [500, 1000, 1500, 2000, 2500];

  // Next queued un-auctioned players — UNSOLD players stay in Unsold tab only until explicitly re-queued
  const queuedPlayers = players.filter(p => 
    p.status !== 'SOLD' && 
    p.status !== 'RETAINED' && 
    p.status !== 'UNSOLD' &&
    !p.isFixedPlayer && 
    !p.winningTeamId && 
    p.id !== currentLotPlayer?.id && 
    p._id !== currentLotPlayer?.id && 
    p.id !== currentLotPlayer?._id && 
    p._id !== currentLotPlayer?._id
  );
  const unsoldPlayers = players.filter(p => p.status === 'UNSOLD');

  // Handle Team Tap to Bid
  const handleTeamBid = async (teamId) => {
    const nextAmount = (activeLot.currentBid || currentLotPlayer?.basePrice || 0) + selectedIncrement;
    const res = await placeBid(teamId, nextAmount);
    if (res && !res.success) {
      alert(res.reason || res.error || 'Bid rejected by auction engine');
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid shortcuts when typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (currentHighestTeam) setIsConfirmSoldOpen(true);
      } else if (e.key === 'u' || e.key === 'U') {
        hammerUnsold();
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        undoLastBid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, currentHighestTeam, hammerUnsold, undoLastBid]);

  // ── SKELETON LOADING STATE (shows while backend data is syncing on page refresh) ──
  if (isLiveLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col xl:flex-row gap-4 p-3 sm:p-4 overflow-hidden bg-canvas">
        {/* Left: Main Cockpit Skeleton */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Player Spotlight Card Skeleton */}
          <div className="relative rounded-2xl bg-surface-card border border-border-subtle p-5 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
            <Skeleton className="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-72 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Bid Engine & Leading Franchise Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface-card border border-border-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-14 w-56 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="flex gap-2 pt-2 border-t border-border-subtle">
                <Skeleton className="h-4 w-10 rounded-lg" />
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-7 w-14 rounded-lg" />)}
              </div>
            </div>
            <div className="rounded-2xl bg-surface-card border border-border-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-40 rounded-lg" />
              <div className="flex items-center gap-4 py-4">
                <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-4 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Team Bidding Grid Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          </div>

          {/* Controls Bar Skeleton */}
          <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-full xl:w-96 flex flex-col bg-surface-card border border-border-subtle rounded-2xl p-4 gap-3 shrink-0">
          <div className="flex gap-1 p-1 bg-canvas rounded-xl border border-border-subtle">
            <Skeleton className="flex-1 h-8 rounded-lg" />
            <Skeleton className="flex-1 h-8 rounded-lg" />
            <Skeleton className="flex-1 h-8 rounded-lg" />
          </div>
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!currentLotPlayer) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-canvas">
        <Gavel className="w-16 h-16 text-brand-gold mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white">All Lots Concluded / Floor Empty</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          There is currently no active player on stage. You can draw a random available player or pick one from the roster queue.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={RotateCcw}
            onClick={() => selectRandomLot()}
          >
            Draw Next Random Player
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col xl:flex-row gap-4 p-3 sm:p-4 overflow-hidden bg-canvas">
      {/* LEFT/CENTER: MAIN OPERATIONAL COCKPIT (70% width on 2xl) */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-none pr-1">
        {/* TOP ROW: CURRENT LOT SPOTLIGHT CARD WITH SMOOTH LOT TRANSITIONS */}
        <motion.div
          key={currentLotPlayer.id}
          variants={lotEntranceVariants}
          initial="initial"
          animate="animate"
          className="relative rounded-2xl bg-gradient-to-r from-surface-card via-surface-accent/70 to-surface-card border border-border-subtle p-5 shadow-2xl flex flex-col md:flex-row gap-6 items-center shrink-0"
        >
          {/* Player Picture & Badges */}
          <div className="relative shrink-0">
            <div className="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-border-subtle bg-slate-900 shadow-xl flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                <Users className="w-16 h-16 mb-2" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400">ATHLETE</span>
              </div>
              <img
                src={currentLotPlayer.photoUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80"}
                alt={currentLotPlayer.fullName}
                className="relative z-10 w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="absolute top-2 left-2 z-20">
              <Badge variant="gold" dot className="font-bold shadow-md">
                LOT #{currentLotPlayer.lotNumber || 1}
              </Badge>
            </div>
            {currentLotPlayer.isOverseas && (
              <div className="absolute bottom-2 right-2 z-20">
                <Badge variant="purple" dot>OVERSEAS</Badge>
              </div>
            )}
          </div>

          {/* Player Details & Cricket Stats */}
          <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${getRoleBadgeClass(currentLotPlayer.role)}`}>
                {getRoleLabel(currentLotPlayer.role)}
              </span>
              <Badge variant="cyan">{currentLotPlayer.category || 'CATEGORY A'}</Badge>
              <span className="text-xs text-slate-400">
                {currentLotPlayer.country} • Age: {currentLotPlayer.age}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight truncate">
                {currentLotPlayer.fullName}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Batting: <strong className="text-white">{currentLotPlayer.battingStyle}</strong> | Bowling: <strong className="text-white">{currentLotPlayer.bowlingStyle}</strong>
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 bg-canvas/70 rounded-xl p-2.5 border border-border-subtle/80 max-w-lg">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Matches</span>
                <span className="font-mono text-sm font-bold text-white">{currentLotPlayer.stats?.matches || 0}</span>
              </div>
              <div className="text-center border-l border-border-subtle">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Runs</span>
                <span className="font-mono text-sm font-bold text-white">{currentLotPlayer.stats?.runs || 0}</span>
              </div>
              <div className="text-center border-l border-border-subtle">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wickets</span>
                <span className="font-mono text-sm font-bold text-white">{currentLotPlayer.stats?.wickets || 0}</span>
              </div>
              <div className="text-center border-l border-border-subtle">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Economy</span>
                <span className="font-mono text-sm font-bold text-white">{currentLotPlayer.stats?.economy || '-'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 text-xs">
              <span className="text-slate-400">
                Base Price: <strong className="font-mono text-slate-200">{formatExactCurrency(currentLotPlayer.basePrice, activeTournament.currency)}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Total Bids: <strong className="font-mono text-brand-cyan">{activeLot.bidCount}</strong>
              </span>
            </div>
          </div>

          {/* Right: Authoritative Live Countdown Timer */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-canvas/80 border border-border-subtle shrink-0">
            <CountdownTimer
              secondsRemaining={activeLot.timerSeconds}
              totalSeconds={activeTournament.timerSeconds || 30}
              size={128}
              strokeWidth={8}
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={toggleTimer}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
              >
                {activeLot.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {activeLot.isTimerRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => resetTimer(activeTournament.timerSeconds)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-accent hover:bg-surface-hover text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE ROW: LIVE BIDDING BOARD & LEADING TEAM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          {/* Active Highest Bid */}
          <Card className="flex flex-col justify-between bg-gradient-to-br from-surface-card to-slate-900 border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Current Highest Bid
              </span>
              <Badge variant="emerald" dot className="animate-pulse font-bold">
                ACTIVE BID
              </Badge>
            </div>

            <div className="my-3">
              <div className="text-4xl sm:text-5xl font-mono font-black text-brand-emerald text-glow-emerald leading-tight">
                <NumberTicker value={activeLot.currentBid} prefix={`${activeTournament.currency} `} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                South Asian: <span className="text-slate-200 font-semibold">{formatCurrency(activeLot.currentBid, activeTournament.currency, 'SOUTH_ASIAN')}</span>
              </p>
            </div>

            {/* Quick Increment Ladder Selector */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-semibold">Step:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {incrementOptions.map(inc => (
                  <button
                    key={inc}
                    onClick={() => setSelectedIncrement(inc)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                      selectedIncrement === inc
                        ? 'bg-brand-cyan text-slate-950 shadow-glow-cyan'
                        : 'bg-surface-accent text-slate-300 hover:text-white border border-border-subtle'
                    }`}
                  >
                    +{inc >= 100000 ? `${inc/100000}L` : inc >= 1000 ? `${inc/1000}k` : `${inc}`}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Current Leading Franchise Card */}
          <Card className="flex flex-col justify-between bg-gradient-to-br from-surface-card to-slate-900 border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Leading Franchise
              </span>
              <span className="text-xs text-slate-400">
                Holding Hammer
              </span>
            </div>

            {currentHighestTeam ? (
              <div className="flex items-center gap-4 my-3">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl shrink-0"
                  style={{ backgroundColor: currentHighestTeam.primaryColor || '#06B6D4' }}
                >
                  {currentHighestTeam.shortName}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {currentHighestTeam.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owner: {currentHighestTeam.ownerName}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                    <span className="text-brand-cyan">Purse: {formatCurrency(currentHighestTeam.remainingPurse, activeTournament.currency)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">Squad: {currentHighestTeam.squadCount}/{activeTournament.maxSquadSize}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto py-6 text-center text-slate-500 text-sm">
                Awaiting opening bid from participating teams...
              </div>
            )}

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <Button
                variant="ghost"
                size="xs"
                leftIcon={RotateCcw}
                onClick={undoLastBid}
                disabled={activeLot.bidHistory.length === 0}
                className="text-slate-400 hover:text-white"
              >
                Undo Last Bid (Ctrl+Z)
              </Button>
              <span className="text-[11px] text-slate-500 font-mono">
                Seq #{activeLot.bidCount}
              </span>
            </div>
          </Card>
        </div>

        {/* BOTTOM ROW: RAPID TEAM BIDDING SELECTOR GRID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-brand-cyan" />
              1-Click Franchise Bidding Desk (Next Bid: {formatExactCurrency(activeLot.currentBid + selectedIncrement, activeTournament.currency)})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Press team tile to advance bid
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {teams.map((team) => {
              const teamKey = team.id || team._id;
              const isLeading = (currentHighestTeam?.id === teamKey) || (currentHighestTeam?._id === teamKey);
              const nextBidAmount = activeLot.currentBid + selectedIncrement;
              const canAfford = team.remainingPurse >= nextBidAmount;

              return (
                <motion.button
                  key={teamKey}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.97 } : {}}
                  disabled={!canAfford}
                  onClick={() => handleTeamBid(teamKey)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isLeading 
                      ? 'bg-brand-cyan/15 border-brand-cyan shadow-glow-cyan/30' 
                      : canAfford 
                        ? 'bg-surface-card hover:bg-surface-accent border-border-subtle hover:border-slate-500' 
                        : 'bg-surface-card/40 border-border-subtle/40 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span 
                      className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                    >
                      {team.shortName}
                    </span>
                    {isLeading && (
                      <span className="text-[9px] font-bold uppercase bg-brand-cyan text-slate-950 px-1.5 py-0.5 rounded-full">
                        Leader
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-white truncate leading-tight">
                      {team.name}
                    </h4>
                    <p className="text-[11px] font-mono font-semibold text-brand-emerald mt-1 truncate">
                      {formatCurrency(team.remainingPurse, activeTournament.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Squad: {team.squadCount}/{activeTournament.maxSquadSize}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* GAVEL HAMMER CONTROLS BAR (RESPONSIVE) */}
        <div className="sticky bottom-0 bg-surface-card/95 backdrop-blur-md border border-border-subtle rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto z-20">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RotateCcw}
              onClick={() => selectRandomLot()}
              className="flex-1 sm:flex-initial"
              title="Draw a random available player onto the stage"
            >
              Random Lot
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={SkipForward}
              onClick={hammerUnsold}
              className="flex-1 sm:flex-initial"
            >
              Skip
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={AlertTriangle}
              onClick={hammerUnsold}
              className="flex-1 sm:flex-initial"
            >
              UNSOLD (U)
            </Button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400 hidden xl:inline">
              Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> = Sold, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">U</kbd> = Unsold
            </span>
            <Button
              variant="gold"
              size="lg"
              leftIcon={Gavel}
              disabled={!currentHighestTeam}
              onClick={() => setIsConfirmSoldOpen(true)}
              className="w-full sm:w-auto text-sm sm:text-base font-black shadow-glow-gold py-2.5 sm:py-3.5"
            >
              HAMMER SOLD (Enter)
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: QUEUE PREVIEW & BID TELEMETRY (30% width) */}
      <div className="w-full xl:w-96 flex flex-col bg-surface-card border border-border-subtle rounded-2xl p-4 overflow-hidden shrink-0">
        {/* Sidebar Nav Tabs */}
        <div className="flex items-center gap-1 p-1 bg-canvas rounded-xl border border-border-subtle mb-4">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-brand-cyan text-slate-950 shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Queue ({queuedPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'bids' ? 'bg-brand-cyan text-slate-950 shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Bids ({activeLot.bidHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('unsold')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'unsold' ? 'bg-brand-cyan text-slate-950 shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Unsold ({unsoldPlayers.length})
          </button>
        </div>

        {/* Tab Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {/* TAB 1: UPCOMING QUEUE */}
          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 overflow-y-auto space-y-2.5 pr-1"
            >
              {queuedPlayers.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                  No more queued players.
                </div>
              ) : (
                queuedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-accent/60 hover:bg-surface-hover border border-border-subtle transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-slate-300 shrink-0">
                        #{player.lotNumber}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-brand-cyan transition-colors">
                          {player.fullName}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {getRoleLabel(player.role)} • {formatCurrency(player.basePrice, activeTournament.currency)}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => selectPlayerLot(player.id || player._id)}
                      className="shrink-0 font-bold"
                    >
                      Call Lot
                    </Button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* TAB 2: LIVE LOT BID HISTORY */}
          {activeTab === 'bids' && (
            <motion.div
              key="bids"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 overflow-y-auto space-y-2 pr-1"
            >
              {activeLot.bidHistory.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                  No bids placed yet on this lot.
                </div>
              ) : (
                activeLot.bidHistory.map((bid, index) => {
                  const team = teams.find(t => t.id === bid.teamId);
                  return (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-accent/60 border border-border-subtle text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-6 h-6 rounded-md text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                          style={{ backgroundColor: team?.primaryColor || '#3B82F6' }}
                        >
                          {team?.shortName || 'TM'}
                        </span>
                        <span className="font-semibold text-white truncate max-w-[120px]">
                          {team?.name || 'Franchise'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-brand-emerald block">
                          {formatCurrency(bid.amount, activeTournament.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {bid.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* TAB 3: UNSOLD POOL (RE-AUCTION ACCELERATED ROUND) */}
          {activeTab === 'unsold' && (
            <motion.div
              key="unsold"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 overflow-y-auto space-y-2 pr-1"
            >
              {unsoldPlayers.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                  No unsold players recorded yet.
                </div>
              ) : (
                unsoldPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-accent/60 border border-red-500/20 text-xs"
                  >
                    <div className="truncate">
                      <h4 className="font-bold text-white truncate leading-tight">
                        {player.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Base: {formatCurrency(player.basePrice, activeTournament.currency)}
                      </p>
                    </div>

                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={RotateCcw}
                      onClick={() => reQueueUnsold(player.id || player._id)}
                      className="shrink-0 text-[11px]"
                    >
                      Re-Queue
                    </Button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONFIRM SOLD MODAL */}
      <Modal
        isOpen={isConfirmSoldOpen}
        onClose={() => setIsConfirmSoldOpen(false)}
        title="Confirm Hammer SOLD"
        subtitle="Finalize sale contract and award player to franchise."
      >
        <div className="space-y-4">
          <div className="bg-surface-accent p-4 rounded-xl border border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Player</p>
              <h4 className="text-lg font-bold text-white">{currentLotPlayer.fullName}</h4>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Winning Franchise</p>
              <h4 className="text-lg font-bold text-brand-cyan">{currentHighestTeam?.name}</h4>
            </div>
          </div>

          <div className="text-center py-2">
            <span className="text-xs text-slate-400 uppercase font-mono">Final Contract Value</span>
            <div className="text-3xl font-mono font-black text-brand-emerald text-glow-emerald">
              {formatExactCurrency(activeLot.currentBid, activeTournament.currency)}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsConfirmSoldOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              leftIcon={Gavel}
              onClick={() => {
                setIsConfirmSoldOpen(false);
                hammerSold();
              }}
              className="font-bold shadow-glow-gold"
            >
              Strike Gavel SOLD
            </Button>
          </div>
        </div>
      </Modal>

      {/* CELEBRATION MODAL */}
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
