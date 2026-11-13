import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, TrendingUp, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { TeamMark } from '../../components/ui/TeamMark';
import { accordionVariants } from '../../utils/motion';
import { playerBelongsToTeam } from '../../utils/playerTeams';

export const PublicTeamsExplorer = () => {
  const { teams, players, activeTournament } = useAuction();
  const [expandedTeamId, setExpandedTeamId] = useState(teams[0]?.id || teams[0]?._id || null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Franchises & Squad Rosters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time salary cap utilization, squad composition, and acquired player lists.
          </p>
        </div>
        <Badge variant="cyan" dot>
          {teams.length} PARTICIPATING FRANCHISES
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {teams.map((team) => {
          const teamId = team.id || team._id;
          const acquiredPlayers = players.filter(p => 
            playerBelongsToTeam(p, team) &&
            p.status === 'SOLD'
          );
          const isExpanded = expandedTeamId === teamId;
          const spentPercentage = Math.round((team.totalSpent / team.startingPurse) * 100);

          return (
            <Card
              key={teamId}
              className="p-5 sm:p-6 bg-surface-card border-border-subtle hover:border-slate-600 transition-all"
            >
              {/* Franchise Summary Top Bar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Team Identity */}
                <div className="flex items-center gap-4">
                  <TeamMark team={team} className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Owner: {team.ownerName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="emerald" dot size="sm">
                        SQUAD: {team.squadCount}/{activeTournament.maxSquadSize}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        OVERSEAS: {team.overseasCount}/{activeTournament.maxOverseas}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger & Progress Meter */}
                <div className="w-full lg:w-96 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Spent: {formatCurrency(team.totalSpent, activeTournament.currency)} ({spentPercentage}%)</span>
                    <span className="font-bold text-brand-emerald text-sm">
                      Rem: {formatCurrency(team.remainingPurse, activeTournament.currency)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-border-subtle">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-emerald transition-all duration-500"
                      style={{ width: `${Math.min(100, spentPercentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Starting: {formatCurrency(team.startingPurse, activeTournament.currency)}</span>
                    <span>Min Squad Reserve: Protected</span>
                  </div>
                </div>

                {/* Toggle Squad Accordion */}
                <button
                  onClick={() => setExpandedTeamId(isExpanded ? null : teamId)}
                  className="w-full lg:w-auto justify-center px-4 py-2.5 rounded-xl bg-surface-accent hover:bg-surface-hover text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer border border-border-subtle shrink-0"
                >
                  <Users className="w-4 h-4 text-brand-cyan" />
                  <span>{isExpanded ? 'Hide Squad' : `View Squad (${acquiredPlayers.length})`}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* EXPANDED SQUAD ROSTER ACCORDION WITH SMOOTH EXPANSION */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    variants={accordionVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-5 border-t border-border-subtle">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-brand-cyan" />
                        Acquired Players ({acquiredPlayers.length})
                      </h4>

                      {acquiredPlayers.length === 0 ? (
                        <div className="p-6 bg-canvas rounded-xl text-center text-xs text-slate-500 border border-border-subtle">
                          This franchise has not acquired any players yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {acquiredPlayers.map((player) => (
                            <div
                              key={player.id || player._id}
                              className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border-subtle hover:border-slate-600 transition-colors"
                            >
                              <div className="truncate pr-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeClass(player.role)}`}>
                                    {getRoleLabel(player.role)}
                                  </span>
                                  {player.isFixedPlayer && (
                                    <Badge variant="gold" size="sm" dot>FIXED</Badge>
                                  )}
                                  {player.isOverseas && (
                                    <Badge variant="purple" size="sm">OS</Badge>
                                  )}
                                </div>
                                <h5 className="text-sm font-bold text-white truncate mt-1">
                                  {player.fullName}
                                </h5>
                                <span className="text-[10px] text-slate-400">
                                  Lot #{player.lotNumber} {player.isOverseas && '• Overseas'}
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-brand-emerald text-sm block">
                                  {formatCurrency(player.finalPrice, activeTournament.currency)}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {player.isFixedPlayer ? 'Fixed Fee' : 'Auction Bid'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
