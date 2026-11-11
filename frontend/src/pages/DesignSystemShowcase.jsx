import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Gavel, 
  Trophy, 
  Users, 
  Shield, 
  Sparkles, 
  Search, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { TabGroup } from '../components/ui/TabGroup';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { NumberTicker } from '../components/ui/NumberTicker';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { SoldCelebration } from '../components/ui/SoldCelebration';
import { formatCurrency, getRoleBadgeClass, getRoleLabel } from '../utils/formatters';

export const DesignSystemShowcase = () => {
  // Demo State
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'components';
  const setActiveTab = (tabId) => setSearchParams({ tab: tabId });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  
  // Interactive Ticker & Timer Demo State
  const [currentBid, setCurrentBid] = useState(1500000);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Sample Mock Lot for Sold Celebration
  const samplePlayer = {
    fullName: "Wanindu Hasaranga",
    role: "SPIN_ALL_ROUNDER",
    basePrice: 5000000,
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80"
  };

  const sampleTeam = {
    name: "Colombo Strikers",
    shortName: "CLS",
    primaryColor: "#06B6D4"
  };

  // Timer Tick Simulation
  React.useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const tabs = [
    { id: 'components', label: 'Atomic UI Kit', icon: Sparkles },
    { id: 'motion', label: 'Motion & Real-Time Engine', icon: Clock },
    { id: 'sports', label: 'Cricket Domain Elements', icon: Trophy },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-card via-surface-accent to-surface-card border border-border-subtle p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <Badge variant="cyan" dot className="mb-4">
            PHASE 2 FOUNDATIONS READY
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            CBid Design System & Motion Specification
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Minimalistic, sports-tech visual identity built with dark obsidian surfaces, electric cyan & emerald accents, and high-precision Framer Motion animations.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              variant="primary"
              size="md"
              leftIcon={Trophy}
              onClick={() => setIsSoldOpen(true)}
            >
              Test SOLD Celebration Modal
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={Gavel}
              onClick={() => setIsModalOpen(true)}
            >
              Open Sample Dialog
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="max-w-md"
      />

      {/* TAB 1: ATOMIC UI KIT */}
      {activeTab === 'components' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {/* Buttons Section */}
          <Card>
            <h3 className="text-lg font-bold text-white mb-4">Button Variants & Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary (Cyan)</Button>
              <Button variant="success">Success (Emerald)</Button>
              <Button variant="gold">Gold (Marquee)</Button>
              <Button variant="danger">Danger (Crimson)</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" isLoading>Loading State</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border-subtle">
              <Button size="xs" variant="primary">XS Size</Button>
              <Button size="sm" variant="primary">SM Size</Button>
              <Button size="md" variant="primary">MD Size</Button>
              <Button size="lg" variant="primary">LG Size</Button>
              <Button size="xl" variant="gold" leftIcon={Gavel}>XL Hammer Button</Button>
            </div>
          </Card>

          {/* Form Inputs & Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-white">Form Inputs</h3>
              <Input
                label="Player Full Name"
                placeholder="e.g. Wanindu Hasaranga"
                leftIcon={Users}
              />
              <Input
                label="Base Price (LKR)"
                placeholder="5,000,000"
                leftIcon={TrendingUp}
                helperText="Minimum starting price for the player lot"
              />
              <Input
                label="With Validation Error"
                defaultValue="invalid_email"
                error="Please enter a valid official email address"
              />
            </Card>

            <Card className="space-y-5">
              <h3 className="text-lg font-bold text-white">Status Badges</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="cyan" dot>LIVE AUCTION</Badge>
                <Badge variant="emerald" dot>SOLD LOT</Badge>
                <Badge variant="gold" dot>MARQUEE</Badge>
                <Badge variant="crimson" dot>UNSOLD</Badge>
                <Badge variant="purple" dot>OVERSEAS</Badge>
                <Badge variant="default">CATEGORY A</Badge>
                <Badge variant="outline">SCHEDULED</Badge>
              </div>

              <h4 className="text-sm font-semibold text-slate-300 pt-2">Loading Skeleton States</h4>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* TAB 2: MOTION & REAL-TIME ENGINE */}
      {activeTab === 'motion' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Authoritative Countdown Timer Simulator */}
          <Card className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Authoritative Countdown Timer</h3>
              <p className="text-xs text-slate-400 mt-1">
                Smooth SVG radial progress with color shift: Cyan → Amber (10s) → Crimson Heartbeat Pulse (&lt; 5s).
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-canvas-subtle rounded-2xl border border-border-subtle">
              <CountdownTimer
                secondsRemaining={timerSeconds}
                totalSeconds={30}
                size={140}
                strokeWidth={9}
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isTimerRunning ? 'danger' : 'success'}
                size="sm"
                leftIcon={Play}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? 'Pause Timer' : 'Start Countdown'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={RotateCcw}
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(30);
                }}
              >
                Reset (30s)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimerSeconds(5)}
              >
                Trigger Urgency (&lt;5s)
              </Button>
            </div>
          </Card>

          {/* Animated Bid Number Ticker Simulator */}
          <Card className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Animated Bid Number Ticker</h3>
              <p className="text-xs text-slate-400 mt-1">
                Framer Motion spring physics for tabular number interpolation without layout shift.
              </p>
            </div>

            <div className="p-6 bg-canvas-subtle rounded-2xl border border-border-subtle text-center">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Active Highest Bid
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-brand-emerald text-glow-emerald">
                <NumberTicker value={currentBid} prefix="LKR " />
              </div>
              <span className="text-xs text-slate-500 mt-2 block">
                Formatted: {formatCurrency(currentBid, 'LKR', 'SOUTH_ASIAN')}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Plus}
                onClick={() => setCurrentBid(prev => prev + 50000)}
              >
                +50,000
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Plus}
                onClick={() => setCurrentBid(prev => prev + 250000)}
              >
                +250,000
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Plus}
                onClick={() => setCurrentBid(prev => prev + 1000000)}
              >
                +1,000,000
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={RotateCcw}
                onClick={() => setCurrentBid(500000)}
              >
                Reset Base
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 3: CRICKET DOMAIN ELEMENTS */}
      {activeTab === 'sports' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Cricket Role Badges */}
          <Card>
            <h3 className="text-lg font-bold text-white mb-3">Cricket Playing Roles</h3>
            <div className="flex flex-wrap items-center gap-2">
              {['TOP_ORDER_BATTER', 'MIDDLE_ORDER_BATTER', 'WICKETKEEPER_BATTER', 'PACE_ALL_ROUNDER', 'SPIN_ALL_ROUNDER', 'FAST_BOWLER', 'SPIN_BOWLER'].map(role => (
                <span
                  key={role}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getRoleBadgeClass(role)}`}
                >
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>
          </Card>

          {/* Interactive Player Lot Card Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card isInteractive className="md:col-span-1 border-brand-cyan/40 shadow-glow-cyan/20">
              <div className="relative mb-4 overflow-hidden rounded-xl bg-slate-800 h-48 flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Users className="w-16 h-16 text-slate-600 mb-2" />
                  <span className="text-xs font-mono tracking-widest text-slate-400 font-bold">CRICKET ATHLETE</span>
                </div>
                <img
                  src={samplePlayer.photoUrl}
                  alt={samplePlayer.fullName}
                  className="relative z-10 w-full h-48 object-cover rounded-xl"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute top-2.5 left-2.5 z-20">
                  <Badge variant="gold" dot>MARQUEE</Badge>
                </div>
                <div className="absolute bottom-2.5 right-2.5 z-20">
                  <Badge variant="cyan">LOT #12</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded border ${getRoleBadgeClass(samplePlayer.role)}`}>
                  {getRoleLabel(samplePlayer.role)}
                </span>
                <h4 className="text-lg font-bold text-white pt-1">{samplePlayer.fullName}</h4>
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                  <span className="text-slate-400">Base Price:</span>
                  <span className="font-mono font-bold text-brand-emerald">
                    {formatCurrency(samplePlayer.basePrice, 'LKR')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Franchise Card Preview */}
            <Card className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-cyan flex items-center justify-center font-bold text-slate-950 text-xl shadow-glow-cyan">
                    CLS
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Colombo Strikers</h4>
                    <p className="text-xs text-slate-400">Remaining Purse & Squad Tracker</p>
                  </div>
                </div>
                <Badge variant="emerald" dot>SQUAD: 14/18</Badge>
              </div>

              {/* Purse Depletion Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Spent: LKR 32.5M (65%)</span>
                  <span className="text-brand-emerald font-bold">Remaining: LKR 17.5M</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-border-subtle">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Mandatory Reserve Locked: LKR 200,000 for 4 squad slots
                </p>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* SAMPLE CONFIRMATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Auction Action"
        subtitle="This action will be immutably recorded in the tournament audit log."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to mark Lot #12 (<strong className="text-white">Wanindu Hasaranga</strong>) as SOLD to <strong className="text-brand-cyan">Colombo Strikers</strong> for <strong className="text-brand-emerald font-mono">LKR 12,500,000</strong>?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              leftIcon={CheckCircle2}
              onClick={() => {
                setIsModalOpen(false);
                setIsSoldOpen(true);
              }}
            >
              Confirm Hammer SOLD
            </Button>
          </div>
        </div>
      </Modal>

      {/* SOLD CELEBRATION MODAL */}
      <SoldCelebration
        isOpen={isSoldOpen}
        player={samplePlayer}
        team={sampleTeam}
        finalBid={12500000}
        currency="LKR"
        onClose={() => setIsSoldOpen(false)}
      />
    </div>
  );
};
