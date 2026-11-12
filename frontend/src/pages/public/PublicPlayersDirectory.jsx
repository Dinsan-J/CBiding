import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Users, Trophy, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TabGroup } from '../../components/ui/TabGroup';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { staggerContainer, staggerItem } from '../../utils/motion';

export const PublicPlayersDirectory = () => {
  const { players, teams, activeTournament } = useAuction();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State & Filters
  const activeStatus = searchParams.get('status') || 'ALL'; // ALL, SOLD, UNSOLD, QUEUED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const statusTabs = [
    { id: 'ALL', label: 'All Players', count: players.length },
    { id: 'SOLD', label: 'Sold', count: players.filter(p => p.status === 'SOLD').length },
    { id: 'UNSOLD', label: 'Unsold', count: players.filter(p => p.status === 'UNSOLD').length },
    { id: 'QUEUED', label: 'Upcoming', count: players.filter(p => ['QUEUED', 'LIVE'].includes(p.status)).length }
  ];

  const roleFilters = [
    { id: 'ALL', label: 'All Roles' },
    { id: 'TOP_ORDER_BATTER', label: 'Top-order' },
    { id: 'MIDDLE_ORDER_BATTER', label: 'Middle-order' },
    { id: 'WICKETKEEPER_BATTER', label: 'Wicketkeeper' },
    { id: 'PACE_ALL_ROUNDER', label: 'Pace All-rounder' },
    { id: 'SPIN_ALL_ROUNDER', label: 'Spin All-rounder' },
    { id: 'FAST_BOWLER', label: 'Fast Bowler' },
    { id: 'SPIN_BOWLER', label: 'Spin Bowler' },
  ];

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Status Filter
      if (activeStatus !== 'ALL') {
        if (activeStatus === 'QUEUED') {
          if (!['QUEUED', 'LIVE'].includes(player.status)) return false;
        } else if (player.status !== activeStatus) {
          return false;
        }
      }

      // Role Filter
      if (selectedRole !== 'ALL' && player.role !== selectedRole) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = player.fullName.toLowerCase().includes(query);
        const matchesCountry = player.country.toLowerCase().includes(query);
        if (!matchesName && !matchesCountry) return false;
      }

      return true;
    });
  }, [players, activeStatus, selectedRole, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <TabGroup
          tabs={statusTabs}
          activeTab={activeStatus}
          onChange={(tabId) => setSearchParams({ status: tabId })}
          className="w-full md:w-auto"
        />

        <div className="w-full md:w-72">
          <Input
            placeholder="Search players by name..."
            leftIcon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {roleFilters.map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
              selectedRole === role.id
                ? 'bg-brand-cyan text-slate-950 border-brand-cyan font-bold shadow-glow-cyan'
                : 'bg-surface-card hover:bg-surface-accent text-slate-300 border-border-subtle'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* PLAYER DIRECTORY CARDS GRID WITH STAGGERED ENTRANCES */}
      {filteredPlayers.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-white">No players found matching your filters</p>
          <p className="text-xs text-slate-500 mt-1">Try switching tabs or clearing your search query.</p>
        </Card>
      ) : (
        <motion.div
          key={`${activeStatus}-${selectedRole}`}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredPlayers.map((player) => {
            const team = teams.find(t => t.id === player.winningTeamId);
            const isSold = player.status === 'SOLD';
            const isUnsold = player.status === 'UNSOLD';
            const isLive = player.status === 'LIVE';

            return (
              <motion.div
                key={player.id}
                variants={staggerItem}
                layout
              >
                <Card
                  isInteractive
                  onClick={() => setSelectedPlayer(player)}
                  className="flex flex-col justify-between p-4 group border-border-subtle hover:border-brand-cyan/50 transition-all h-full"
                >
                  <div>
                    {/* Card Header: Lot Number & Status Pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        LOT #{player.lotNumber}
                      </span>
                      {isSold ? (
                        <Badge variant="emerald" dot>SOLD</Badge>
                      ) : isUnsold ? (
                        <Badge variant="crimson" dot>UNSOLD</Badge>
                      ) : isLive ? (
                        <Badge variant="cyan" dot className="animate-pulse">LIVE LOT</Badge>
                      ) : (
                        <Badge variant="outline">QUEUED</Badge>
                      )}
                    </div>

                    {/* Player Basic Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-border-subtle shrink-0 relative flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-600" />
                        <img
                          src={player.photoUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&auto=format&fit=crop&q=80"}
                          alt={player.fullName}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="truncate">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeClass(player.role)}`}>
                          {getRoleLabel(player.role)}
                        </span>
                        <h4 className="text-base font-bold text-white truncate group-hover:text-brand-cyan transition-colors mt-1">
                          {player.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {player.country} • Age: {player.age}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Financial & Franchise Result */}
                  <div className="pt-3 border-t border-border-subtle mt-2">
                    {isSold && team ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span 
                            className="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: team.primaryColor || '#06B6D4' }}
                          >
                            {team.shortName}
                          </span>
                          <span className="font-semibold text-white truncate">
                            {team.name} {player.isFixedPlayer && <span className="text-amber-400 font-bold text-[10px] ml-1">(Fixed)</span>}
                          </span>
                        </div>
                        <span className="font-mono font-black text-brand-emerald text-sm shrink-0">
                          {formatCurrency(player.finalPrice, activeTournament.currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Base Price:</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatCurrency(player.basePrice, activeTournament.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* PLAYER STATS DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
        title={selectedPlayer?.fullName}
        subtitle={`${selectedPlayer?.country} • ${getRoleLabel(selectedPlayer?.role)} • Lot #${selectedPlayer?.lotNumber}`}
        maxWidth="max-w-xl"
      >
        {selectedPlayer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-accent rounded-xl border border-border-subtle">
              <div>
                <span className="text-xs text-slate-400 block">Auction Status</span>
                <span className="text-base font-bold text-white">
                  {selectedPlayer.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Base Price</span>
                <span className="text-base font-mono font-bold text-brand-emerald">
                  {formatExactCurrency(selectedPlayer.basePrice, activeTournament.currency)}
                </span>
              </div>
            </div>

            {/* Career Stats Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Career Cricket Statistics
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Matches</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.matches || 0}</span>
                </div>
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Runs</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.runs || 0}</span>
                </div>
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wickets</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.wickets || 0}</span>
                </div>
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bat Avg</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.battingAverage || '-'}</span>
                </div>
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Strike Rate</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.strikeRate || '-'}</span>
                </div>
                <div className="bg-canvas p-2.5 rounded-xl border border-border-subtle text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Economy</span>
                  <span className="font-mono text-sm font-bold text-white">{selectedPlayer.stats?.economy || '-'}</span>
                </div>
              </div>
            </div>

            {/* Playing Technique & Styles */}
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Batting Technique:</span>
                <span className="font-semibold text-white">{selectedPlayer.battingStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bowling Style:</span>
                <span className="font-semibold text-white">{selectedPlayer.bowlingStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Overseas Player:</span>
                <span className="font-semibold text-white">{selectedPlayer.isOverseas ? 'Yes' : 'No (Local Player)'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
