import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soldBadgeVariant } from '../../utils/motion';
import { formatCurrency, getRoleLabel } from '../../utils/formatters';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export const SoldCelebration = ({
  isOpen,
  player,
  team,
  finalBid,
  currency = 'LKR',
  onClose
}) => {
  // Auto-dismiss after 6 seconds so it doesn't block the auctioneer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Fire confetti cannon burst
      const count = 200;
      const defaults = {
        origin: { y: 0.65 }
      };

      const fire = (particleRatio, opts) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#06B6D4', '#10B981', '#F59E0B']
      });
      fire(0.2, {
        spread: 60,
        colors: ['#F59E0B', '#EAB308', '#FFFFFF']
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        colors: ['#10B981', '#06B6D4']
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen]);

  if (!isOpen || !player || !team) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Darkened golden shimmer backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Celebration Stage Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-surface-card via-slate-900 to-canvas border-2 border-brand-gold/60 rounded-3xl p-8 shadow-[0_0_60px_-10px_rgba(245,158,11,0.4)] text-center overflow-hidden z-10"
        >
          {/* Animated Gold Aura Background */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />

          {/* Embossed SOLD Stamp */}
          <motion.div
            variants={soldBadgeVariant}
            initial="hidden"
            animate="visible"
            className="inline-block border-4 border-brand-emerald bg-emerald-500/10 px-8 py-2 rounded-xl text-brand-emerald font-extrabold text-3xl tracking-widest shadow-glow-emerald mb-6 select-none"
          >
            SOLD
          </motion.div>

          {/* Player Picture & Details */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            <div className="relative">
              <img
                src={player.photoUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&auto=format&fit=crop&q=80"}
                alt={player.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-brand-cyan text-slate-950 p-1.5 rounded-lg shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
                {getRoleLabel(player.role)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                {player.fullName}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Base: {formatCurrency(player.basePrice, currency)}
              </p>
            </div>
          </div>

          {/* Acquisition Banner: Winning Team & Price */}
          <div className="bg-surface-accent/70 border border-border-subtle rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md"
                style={{ backgroundColor: team.primaryColor || '#2563EB' }}
              >
                {team.shortName || 'TM'}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Acquired by</p>
                <h4 className="text-lg font-bold text-white leading-tight">{team.name}</h4>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-xs text-slate-400 uppercase font-semibold">Winning Bid</p>
              <p className="text-2xl sm:text-3xl font-mono font-extrabold text-brand-emerald text-glow-emerald">
                {formatCurrency(finalBid, currency)}
              </p>
            </div>
          </div>

          {/* Dismiss Button */}
          <Button
            variant="gold"
            size="lg"
            className="w-full font-bold text-base"
            onClick={onClose}
            leftIcon={Trophy}
          >
            Acknowledge & Next Lot
          </Button>

          {/* Auto-dismiss progress bar — shrinks over 6 seconds */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-brand-gold/60 rounded-b-3xl"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
