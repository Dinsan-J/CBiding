import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Gavel, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const Login = () => {
  const [email, setEmail] = useState('organiser@cbid.lk');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/admin');
  };

  const handleQuickDemo = (role) => {
    if (role === 'auctioneer') {
      navigate('/admin/live');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-brand-cyan selection:text-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-2xl shadow-glow-cyan">
              C
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to CBid Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Professional Multi-Tenant Cricket Auction Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-surface-card/90 backdrop-blur-xl border-border-subtle shadow-2xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              leftIcon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              leftIcon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-surface-accent border-border-subtle" />
                <span>Remember session</span>
              </label>
              <a href="#" className="text-brand-cyan hover:underline">Forgot password?</a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-glow-cyan"
            >
              Sign In to Organiser Desk
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block text-center">
              Quick One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleQuickDemo('organiser')}
              >
                Organiser Admin
              </Button>
              <Button
                variant="outline"
                size="xs"
                leftIcon={Gavel}
                onClick={() => handleQuickDemo('auctioneer')}
              >
                Live Auctioneer
              </Button>
            </div>
          </div>
        </Card>

        {/* Public Visitor Link */}
        <p className="text-center text-xs text-slate-400">
          Looking for the public auction stream?{' '}
          <Link to="/live/cpl-2026" className="text-brand-cyan font-semibold hover:underline">
            Watch Live Broadcast
          </Link>
        </p>
      </div>
    </div>
  );
};
