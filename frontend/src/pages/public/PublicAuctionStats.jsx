import React from 'react';
import { Trophy, BarChart3, Users } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Card } from '../../components/ui/Card';
import { formatCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { getPlayerWinningTeam } from '../../utils/playerTeams';

export const PublicAuctionStats = () => {
  const { teams, players, activeTournament } = useAuction();

  // Top Most Expensive Players
  const soldPlayers = players.filter(p => p.status === 'SOLD');
  const topBuys = [...soldPlayers].sort((a, b) => b.finalPrice - a.finalPrice).slice(0, 5);

  // Franchise Spending Leaderboard
  const sortedTeamsBySpend = [...teams].sort((a, b) => b.totalSpent - a.totalSpent);

  // Role Count Breakdown
  const roleCounts = soldPlayers.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  const totalSpentAll = teams.reduce((acc, t) => acc + t.totalSpent, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-border-subtle pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Official Tournament Auction Statistics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review player purchases, role totals, and franchise spending for this tournament.
        </p>
      </div>

      {/* TOP 5 MOST EXPENSIVE BUYS LEADERBOARD */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-gold" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Most Expensive Acquisitions Leaderboard
          </h3>
        </div>

        {topBuys.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No players have been sold yet in this tournament.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {topBuys.map((player, index) => {
              const team = getPlayerWinningTeam(player, teams);
              const rankMedals = ['#F59E0B', '#94A3B8', '#B45309']; // Gold, Silver, Bronze

              return (
                <Card
                  key={player.id}
                  className={`p-4 relative overflow-hidden flex flex-col justify-between border ${
                    index === 0 ? 'border-brand-gold/60 shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)]' : 'border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-slate-950 font-mono shadow-md"
                      style={{ backgroundColor: rankMedals[index] || '#64748B' }}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  <div className="my-2 text-center">
                    <h4 className="text-sm font-extrabold text-white truncate">
                      {player.fullName}
                    </h4>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border mt-1 ${getRoleBadgeClass(player.role)}`}>
                      {getRoleLabel(player.role)}
                    </span>
                    <div className="text-lg font-mono font-black text-brand-emerald text-glow-emerald mt-2">
                      {formatCurrency(player.finalPrice, activeTournament.currency)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-center gap-1.5 text-xs text-slate-300">
                    <span 
                      className="w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: team?.primaryColor || '#06B6D4' }}
                    >
                      {team?.shortName || 'TM'}
                    </span>
                    <span className="truncate">{team?.name}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* TEAM SPENDING & PLAYER ROLE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Franchise Spending Utilization */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-cyan" />
              Franchise Spending Comparison
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Spent: {formatCurrency(totalSpentAll, activeTournament.currency)}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedTeamsBySpend.map(team => {
              const percentage = Math.round((team.totalSpent / team.startingPurse) * 100);

              return (
                <div key={team.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded text-[8px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                      >
                        {team.shortName}
                      </span>
                      {team.name}
                    </span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(team.totalSpent, activeTournament.currency)} ({percentage}%)
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                        backgroundColor: team.primaryColor || '#06B6D4'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Role Breakdown */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-emerald" />
              Player Roles
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {soldPlayers.length} Lots Sold
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getRoleBadgeClass(role)}`}
              >
                {getRoleLabel(role)}: <strong className="font-mono text-white ml-1">{count}</strong>
              </span>
            ))}
            {!Object.keys(roleCounts).length && <p className="text-xs text-slate-500">Role totals will appear after players are sold.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
