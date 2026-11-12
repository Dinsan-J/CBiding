import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Gavel, ShieldCheck, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const Login = () => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const targetPath = location.state?.from?.pathname || '/admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(identifier, password);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (userVal, passVal) => {
    setIdentifier(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-brand-cyan selection:text-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-emerald flex items-center justify-center text-slate-950 font-black text-sm tracking-tight shadow-glow-cyan">
              BX
            </div>
          </Link>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="cyan" dot size="sm">
              RESTRICTED AREA
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to BidX Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Professional Cricket Auction Management Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-surface-card/95 backdrop-blur-xl border-border-subtle shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Admin Username or Email"
              type="text"
              required
              leftIcon={Mail}
              placeholder="e.g. admin or admin@bidx.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
              }}
            />

            <Input
              label="Admin Password"
              type="password"
              required
              leftIcon={Lock}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-surface-accent border-border-subtle" />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-brand-emerald font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full font-bold shadow-glow-cyan cursor-pointer"
            >
              Sign In to BidX Admin
            </Button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="pt-4 border-t border-border-subtle bg-slate-950/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-5 rounded-b-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                Admin Credentials
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Development Mode</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-surface-card p-2.5 rounded-xl border border-border-subtle">
              <div>
                <span className="text-[10px] text-slate-400 block">Username:</span>
                <span className="text-brand-cyan font-bold">admin</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Password:</span>
                <span className="text-brand-emerald font-bold">admin</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFillCredentials('admin', 'admin')}
              className="w-full py-1.5 px-3 rounded-lg bg-surface-accent hover:bg-surface-hover text-xs font-semibold text-slate-300 hover:text-white border border-border-subtle transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Fill Admin Credentials</span>
            </button>
          </div>
        </Card>

        {/* Public Visitor Link */}
        <p className="text-center text-xs text-slate-400">
          Looking for the public auction stream?{' '}
          <Link to="/" className="text-brand-cyan font-semibold hover:underline">
            Watch Live Broadcast
          </Link>
        </p>
      </div>
    </div>
  );
};
