import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Shield, 
  Gavel, 
  DollarSign, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight, 
  Radio, 
  ExternalLink,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';

export const OrganiserOverview = () => {
  const { tournaments, teams, players, registrations, activeTournament } = useAuction();
  const navigate = useNavigate();

  const totalSpent = teams.reduce((acc, t) => acc + t.totalSpent, 0);

  const kpis = [
    { title: 'Total Tournaments', value: tournaments.length, icon: Trophy, color: 'text-brand-gold', bg: 'bg-amber-500/10' },
    { title: 'Registered Players', value: players.length, icon: Users, color: 'text-brand-cyan', bg: 'bg-cyan-500/10' },
    { title: 'Active Franchises', value: teams.length, icon: Shield, color: 'text-brand-emerald', bg: 'bg-emerald-500/10' },
    { title: 'Pending Registrations', value: registrations.length, icon: PlusCircle, color: 'text-brand-crimson', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-card via-surface-accent to-surface-card border border-border-subtle p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <Badge variant="cyan" dot className="mb-2">
              ORGANISER WORKSPACE ACTIVE
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cricket Tournament Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Control your live auctions, review incoming player applications, and monitor franchise spending limits in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={ExternalLink}
              onClick={() => window.open(`/live/${activeTournament.slug}`, '_blank')}
            >
              Public Broadcast
            </Button>
            <Button
              variant="success"
              size="lg"
              leftIcon={Gavel}
              onClick={() => navigate('/auctioneer/live')}
              className="font-bold shadow-glow-emerald"
            >
              Launch Live Cockpit
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="p-5 flex items-center justify-between bg-surface-card border-border-subtle">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
                {kpi.title}
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">
                {kpi.value}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color} shrink-0`}>
              <kpi.icon className="w-6 h-6" />
            </div>
          </Card>
        ))}
      </div>

      {/* ACTIVE TOURNAMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-brand-gold" />
            Managed Tournaments
          </h3>
          <Link to="/dashboard/tournaments" className="text-xs text-brand-cyan hover:underline font-semibold flex items-center gap-1">
            View All Tournaments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tournaments.map((tourn) => {
            const isLive = tourn.status === 'LIVE';
            return (
              <Card
                key={tourn.id}
                className="p-5 bg-surface-card border-border-subtle flex flex-col justify-between hover:border-slate-500 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      {tourn.type} AUCTION ({tourn.currency})
                    </span>
                    {isLive ? (
                      <Badge variant="emerald" dot className="animate-pulse">LIVE NOW</Badge>
                    ) : (
                      <Badge variant="outline">{tourn.status}</Badge>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-white leading-tight">
                    {tourn.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Purse: {formatCurrency(tourn.startingPurse, tourn.currency)} • Max Squad: {tourn.maxSquadSize}
                  </p>
                </div>

                <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between">
                  <Link
                    to={`/register/${tourn.slug}`}
                    target="_blank"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    Registration Portal <ExternalLink className="w-3 h-3" />
                  </Link>

                  {isLive && (
                    <Button
                      size="xs"
                      variant="primary"
                      leftIcon={Gavel}
                      onClick={() => navigate('/auctioneer/live')}
                    >
                      Operate Live
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* QUICK ACTIONS & PENDING REGISTRATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Management Shortcuts */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-border-subtle pb-3">
            Quick Operational Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/dashboard/players?tab=import"
              className="p-4 rounded-xl bg-surface-accent hover:bg-surface-hover border border-border-subtle transition-colors flex flex-col justify-between"
            >
              <FileSpreadsheet className="w-6 h-6 text-brand-emerald mb-2" />
              <div>
                <h4 className="text-sm font-bold text-white">Import Players</h4>
                <p className="text-xs text-slate-400 mt-0.5">Bulk upload Excel / CSV</p>
              </div>
            </Link>

            <Link
              to="/dashboard/teams"
              className="p-4 rounded-xl bg-surface-accent hover:bg-surface-hover border border-border-subtle transition-colors flex flex-col justify-between"
            >
              <Shield className="w-6 h-6 text-brand-cyan mb-2" />
              <div>
                <h4 className="text-sm font-bold text-white">Manage Teams</h4>
                <p className="text-xs text-slate-400 mt-0.5">Adjust purses & logos</p>
              </div>
            </Link>

            <Link
              to="/dashboard/tournaments"
              className="p-4 rounded-xl bg-surface-accent hover:bg-surface-hover border border-border-subtle transition-colors flex flex-col justify-between"
            >
              <PlusCircle className="w-6 h-6 text-brand-gold mb-2" />
              <div>
                <h4 className="text-sm font-bold text-white">New Tournament</h4>
                <p className="text-xs text-slate-400 mt-0.5">Setup rules & ladders</p>
              </div>
            </Link>

            <Link
              to="/dashboard/settings"
              className="p-4 rounded-xl bg-surface-accent hover:bg-surface-hover border border-border-subtle transition-colors flex flex-col justify-between"
            >
              <CheckCircle2 className="w-6 h-6 text-brand-purple mb-2" />
              <div>
                <h4 className="text-sm font-bold text-white">WhatsApp Config</h4>
                <p className="text-xs text-slate-400 mt-0.5">Player sold alert triggers</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Pending Registrations Queue */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" />
              Pending Registrations ({registrations.length})
            </h3>
            <Link to="/dashboard/players?tab=approvals" className="text-xs text-brand-cyan hover:underline font-semibold">
              Review All
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No pending registrations to review.
            </div>
          ) : (
            <div className="space-y-2.5">
              {registrations.slice(0, 3).map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 bg-surface-accent rounded-xl border border-border-subtle flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{reg.fullName}</h5>
                    <span className="text-[11px] text-slate-400">
                      {reg.role} • {reg.experienceLevel}
                    </span>
                  </div>

                  <Link to="/dashboard/players?tab=approvals">
                    <Button size="xs" variant="primary">
                      Review & Approve
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
