import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Users, 
  DollarSign, 
  Trash2, 
  UserPlus, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Sparkles,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { playerBelongsToTeam } from '../../utils/playerTeams';

export const TeamsManager = () => {
  const { 
    teams, 
    players, 
    createTeam, 
    deleteTeam, 
    assignFixedPlayer, 
    unassignFixedPlayer, 
    activeTournament 
  } = useAuction();
  const { toast } = useToast();

  // Create Team Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamLogoFile, setTeamLogoFile] = useState(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState('');
  const [directPlayerPhotoFile, setDirectPlayerPhotoFile] = useState(null);
  const [directPlayerPhotoPreview, setDirectPlayerPhotoPreview] = useState('');

  // Expanded Team Squad Accordions (set of teamIds)
  const [expandedTeams, setExpandedTeams] = useState({});

  // Fixed Player Assignment Modal State
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [fixedTab, setFixedTab] = useState('ROSTER'); // 'ROSTER' | 'DIRECT'
  const [isAssigning, setIsAssigning] = useState(false);

  // Mode 1: Select from Roster
  const [selectedRosterPlayerId, setSelectedRosterPlayerId] = useState('');
  const [isFreeBasePlayer, setIsFreeBasePlayer] = useState(true); // Default: Base player has NO base price
  const [rosterRetentionFee, setRosterRetentionFee] = useState(0);

  // Mode 2: Direct Registration
  const [isDirectFreeBasePlayer, setIsDirectFreeBasePlayer] = useState(true);
  const [directForm, setDirectForm] = useState({
    fullName: '',
    role: 'TOP_ORDER_BATTER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'Right-arm medium',
    isOverseas: false,
    country: 'Sri Lanka',
    basePrice: 0,
    retentionPrice: 0,
    photoUrl: ''
  });

  // New Team Form
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    logoUrl: '',
    startingPurse: activeTournament?.startingPurse || 50000000,
    ownerName: '',
    ownerContact: ''
  });
  useEffect(() => {
    if (activeTournament?.startingPurse != null) {
      setForm(current => ({ ...current, startingPurse: activeTournament.startingPurse }));
    }
  }, [activeTournament?._id, activeTournament?.id, activeTournament?.startingPurse]);

  const toggleSquadExpand = (teamKey) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamKey]: !prev[teamKey]
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.shortName.trim()) return;
    setIsSubmitting(true);
    try {
      const logoUrl = teamLogoFile ? (await api.uploadImage(teamLogoFile)).data.url : '';
      const result = await createTeam({
        ...form,
        logoUrl,
        auctionId: activeTournament?.id || activeTournament?._id
      });
      if (!result?.success) throw new Error(result?.error || 'Could not save the team.');
      setIsModalOpen(false);
      setTeamLogoFile(null);
      setTeamLogoPreview('');
      setForm({
        name: '',
        shortName: '',
        logoUrl: '',
        startingPurse: activeTournament?.startingPurse || 50000000,
        ownerName: '',
        ownerContact: ''
      });
      toast.success('Team added to the tournament.');
    } catch (error) {
      toast.error(error.message || 'Could not create team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teamId, teamName, squadCount) => {
    if (squadCount > 0) {
      toast.error(`Cannot delete ${teamName} because it already has ${squadCount} acquired or fixed players.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${teamName}?`)) {
      const result = await deleteTeam(teamId);
      if (!result?.success) toast.error(result?.error || 'Could not delete team.');
      else toast.success(`${teamName} deleted.`);
    }
  };

  // Open Fixed Player Modal for a specific franchise
  const openFixedModal = (team) => {
    setSelectedTeam(team);
    setFixedTab('ROSTER');
    setSelectedRosterPlayerId('');
    setIsFreeBasePlayer(true); // Default: Base player has no base price / 0 cost
    setRosterRetentionFee(0);
    setIsDirectFreeBasePlayer(true);
    setDirectForm({
      fullName: '',
      role: 'TOP_ORDER_BATTER',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'Right-arm medium',
      isOverseas: false,
      country: 'Sri Lanka',
      basePrice: 0,
      retentionPrice: 0,
      photoUrl: ''
    });
    setDirectPlayerPhotoFile(null);
    setDirectPlayerPhotoPreview('');
    setIsFixedModalOpen(true);
  };

  // Available players who are unassigned / not sold
  const availableRosterPlayers = useMemo(() => {
    return players.filter(p => {
      const isSold = p.status === 'SOLD' || p.status === 'RETAINED';
      const hasTeam = Boolean(p.winningTeamId);
      return !isSold && !hasTeam;
    });
  }, [players]);

  const selectedRosterPlayer = useMemo(() => {
    return players.find(p => p.id === selectedRosterPlayerId || p._id === selectedRosterPlayerId);
  }, [players, selectedRosterPlayerId]);

  // Handle Fixed Player Submission
  const handleAssignFixed = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    const teamId = selectedTeam.id || selectedTeam._id;
    setIsAssigning(true);

    try {
      let res;
      if (fixedTab === 'ROSTER') {
        if (!selectedRosterPlayerId) {
          toast.error('Please select a player from the roster.');
          return;
        }
        res = await assignFixedPlayer(teamId, {
          playerId: selectedRosterPlayerId,
          retentionPrice: isFreeBasePlayer ? 0 : Number(rosterRetentionFee || 0)
        });
      } else {
        if (!directForm.fullName.trim()) {
          toast.error('Player full name is required.');
          return;
        }
        const photoUrl = directPlayerPhotoFile ? (await api.uploadImage(directPlayerPhotoFile)).data.url : '';
        res = await assignFixedPlayer(teamId, {
          ...directForm,
          photoUrl,
          basePrice: isDirectFreeBasePlayer ? 0 : Number(directForm.basePrice || 0),
          retentionPrice: isDirectFreeBasePlayer ? 0 : Number(directForm.retentionPrice || 0)
        });
      }

      if (res && res.success) {
        setIsFixedModalOpen(false);
        // Automatically expand this team's squad to show the newly added player
        setExpandedTeams(prev => ({ ...prev, [teamId]: true }));
        toast.success(res.message || 'Fixed player assigned to the team.');
      } else {
        toast.error(res?.error || 'Failed to assign fixed player');
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred while assigning fixed player');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Remove Fixed Player
  const handleRemoveFixed = async (teamKey, playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to remove fixed player ${playerName}? Their contract fee will be credited back to the team's purse.`)) {
      return;
    }
    const res = await unassignFixedPlayer(teamKey, playerId);
    if (!res.success) {
      toast.error(res.error || 'Failed to remove fixed player');
    } else toast.success(res.message || 'Fixed player removed from the team.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Franchises & Fixed Player Allocations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage participating cricket teams, configure pre-auction retained/fixed base players, and track salary caps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Add New Team
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => {
          const teamKey = team.id || team._id;
          const acquiredPlayers = players.filter(p => 
            playerBelongsToTeam(p, team) &&
            (p.status === 'SOLD' || p.status === 'RETAINED')
          );
          const fixedPlayers = acquiredPlayers.filter(p => p.isFixedPlayer || p.retentionType === 'FIXED_RETENTION');
          const isExpanded = Boolean(expandedTeams[teamKey]);

          return (
            <Card 
              key={teamKey} 
              className="p-5 flex flex-col justify-between bg-surface-card border-border-subtle hover:border-slate-500 transition-colors"
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? <img src={team.logoUrl} alt={`${team.name} logo`} className="w-12 h-12 rounded-xl object-cover shrink-0" /> : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shrink-0 bg-brand-cyan">
                        {team.shortName}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white leading-tight truncate">{team.name}</h3>
                      <p className="text-xs text-slate-400 truncate">Owner: {team.ownerName || 'Franchise Board'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="cyan" size="sm">{team.squadCount || acquiredPlayers.length} SQUAD</Badge>
                    {fixedPlayers.length > 0 && (
                      <Badge variant="gold" size="sm" dot>{fixedPlayers.length} FIXED</Badge>
                    )}
                  </div>
                </div>

                {/* Financial Ledger */}
                <div className="space-y-2 bg-surface-accent/60 p-3 rounded-xl border border-border-subtle text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Starting Purse:</span>
                    <span className="text-slate-200">{formatCurrency(team.startingPurse, activeTournament?.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Spent:</span>
                    <span className="text-slate-200">{formatCurrency(team.totalSpent, activeTournament?.currency)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border-subtle font-bold">
                    <span className="text-slate-400">Remaining Purse:</span>
                    <span className="text-brand-emerald">{formatCurrency(team.remainingPurse, activeTournament?.currency)}</span>
                  </div>
                </div>

                {/* Quick Action Button: Add Fixed Player */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => openFixedModal(team)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Fixed Player</span>
                  </button>
                </div>

                {/* Acquired / Fixed Squad Accordion */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Roster ({acquiredPlayers.length})</span>
                      <span className="text-amber-400 font-mono">{fixedPlayers.length} Fixed</span>
                    </div>

                    {acquiredPlayers.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">No players on squad yet.</p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {acquiredPlayers.map(p => {
                          const pId = p.id || p._id;
                          const isNoPrice = p.isFixedPlayer && (!p.finalPrice || p.finalPrice === 0);
                          return (
                            <div 
                              key={pId} 
                              className="flex items-center justify-between p-2 rounded-lg bg-surface-accent/70 border border-border-subtle text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-white truncate">{p.fullName}</span>
                                  {p.isFixedPlayer && (
                                    <Badge variant="gold" size="sm">FIXED</Badge>
                                  )}
                                  {p.isOverseas && (
                                    <Badge variant="purple" size="sm">OS</Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {getRoleLabel(p.role)} • {
                                    isNoPrice ? (
                                      <strong className="text-amber-400 font-mono">No Base Price (Fixed)</strong>
                                    ) : (
                                      <strong className="text-brand-emerald font-mono">{formatCurrency(p.finalPrice || p.basePrice, activeTournament?.currency)}</strong>
                                    )
                                  }
                                </div>
                              </div>
                              {p.isFixedPlayer && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFixed(teamKey, pId, p.fullName)}
                                  className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                                  title="Unassign fixed player and refund purse"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleSquadExpand(teamKey)}
                  className="flex items-center gap-1 text-slate-400 hover:text-brand-cyan transition-colors font-semibold cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isExpanded ? 'Hide Squad' : `View Squad (${acquiredPlayers.length})`}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <Button 
                    size="xs" 
                    variant="outline"
                    className="text-red-400 hover:text-red-300 hover:border-red-500/50"
                    disabled={acquiredPlayers.length > 0}
                    onClick={() => handleDelete(teamKey, team.name, acquiredPlayers.length)}
                    title={acquiredPlayers.length > 0 ? "Cannot delete team with players" : "Delete team"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* CREATE NEW FRANCHISE TEAM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Franchise Team"
        subtitle="Add team branding, owner details, and purse allowance."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Official Team Name *"
            placeholder="e.g. Colombo Strikers"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Short Code (Acronym) *"
              placeholder="CLS"
              required
              maxLength={4}
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Team Logo (from your device)
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setTeamLogoFile(file);
                  setTeamLogoPreview(URL.createObjectURL(file));
                }}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-surface-accent file:px-3 file:py-2 file:text-slate-100"
              />
              {teamLogoPreview && <img src={teamLogoPreview} alt="Selected team logo" className="mt-2 h-14 w-14 rounded-lg object-cover" />}
            </div>
          </div>

          <Input
            label={activeTournament?.type === 'POINTS' ? 'Starting Points *' : 'Initial Salary Cap / Purse *'}
            type="number"
            required
            value={form.startingPurse}
            onChange={(e) => setForm({ ...form, startingPurse: Number(e.target.value) })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Franchise Owner Name"
              placeholder="e.g. Rohan Silva"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
            <Input
              label="Owner Contact Phone"
              placeholder="+94 77 123 4567"
              value={form.ownerContact}
              onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN FIXED PLAYER MODAL */}
      <Modal
        isOpen={isFixedModalOpen}
        onClose={() => setIsFixedModalOpen(false)}
        title={selectedTeam ? `Add Fixed Player to ${selectedTeam.name}` : 'Assign Fixed Player'}
        subtitle="Retained or direct-signing player contract allocation."
        maxWidth="max-w-xl"
      >
        {selectedTeam && (
          <form onSubmit={handleAssignFixed} className="space-y-4">
            {/* Team Snapshot Banner */}
            <div className="p-3 bg-surface-accent rounded-xl border border-border-subtle flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shrink-0"
                  style={{ backgroundColor: selectedTeam.primaryColor || '#06B6D4' }}
                >
                  {selectedTeam.shortName}
                </span>
                <div>
                  <h4 className="font-bold text-white">{selectedTeam.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Current Squad: {selectedTeam.squadCount || 0} / {activeTournament?.maxSquadSize || 18}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase block">Remaining Purse</span>
                <span className="font-bold text-brand-emerald text-sm">
                  {formatCurrency(selectedTeam.remainingPurse, activeTournament?.currency)}
                </span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-card rounded-xl border border-border-subtle text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFixedTab('ROSTER')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  fixedTab === 'ROSTER'
                    ? 'bg-brand-cyan text-slate-950 font-bold shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Select from Roster ({availableRosterPlayers.length})
              </button>
              <button
                type="button"
                onClick={() => setFixedTab('DIRECT')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  fixedTab === 'DIRECT'
                    ? 'bg-brand-cyan text-slate-950 font-bold shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Direct New Player
              </button>
            </div>

            {/* TAB 1: SELECT FROM UNASSIGNED ROSTER */}
            {fixedTab === 'ROSTER' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Select Athlete from Available Roster *
                  </label>
                  {availableRosterPlayers.length === 0 ? (
                    <div className="p-4 bg-slate-900 rounded-xl border border-border-subtle text-center text-xs text-slate-400">
                      No unassigned players available in this auction. Switch to "Direct New Player" tab to register a new fixed athlete.
                    </div>
                  ) : (
                    <select
                      value={selectedRosterPlayerId}
                      onChange={(e) => {
                        const pId = e.target.value;
                        setSelectedRosterPlayerId(pId);
                      }}
                      className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-slate-100 cursor-pointer"
                      required
                    >
                      <option value="">-- Choose a player to fix to {selectedTeam.shortName} --</option>
                      {availableRosterPlayers.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.fullName} ({getRoleLabel(p.role)}{p.isOverseas ? ' • Overseas' : ''})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedRosterPlayer && (
                  <div className="p-3 bg-surface-accent/70 rounded-xl border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{selectedRosterPlayer.fullName}</span>
                      <span className="text-[10px] text-slate-400">
                        {getRoleLabel(selectedRosterPlayer.role)} • {selectedRosterPlayer.country}
                      </span>
                    </div>
                    <Badge variant={selectedRosterPlayer.isOverseas ? 'purple' : 'cyan'}>
                      {selectedRosterPlayer.isOverseas ? 'OVERSEAS' : 'LOCAL'}
                    </Badge>
                  </div>
                )}

                {/* Base Player Pricing Selector */}
                <div className="p-3.5 bg-surface-card rounded-xl border border-border-subtle space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Base Player Pricing Option
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label 
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                        isFreeBasePlayer 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' 
                          : 'bg-surface-accent border-border-subtle'
                      }`}
                      onClick={() => setIsFreeBasePlayer(true)}
                    >
                      <input 
                        type="radio" 
                        name="feeOption" 
                        checked={isFreeBasePlayer} 
                        onChange={() => setIsFreeBasePlayer(true)}
                        className="mt-0.5 text-amber-500 cursor-pointer" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">No Base Price (Free)</span>
                        <span className="text-[10px] text-slate-400">{activeTournament?.type === 'POINTS' ? '0 points' : '0 LKR'} — Fixed player without base price</span>
                      </div>
                    </label>

                    <label 
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                        !isFreeBasePlayer 
                          ? 'bg-brand-cyan/10 border-brand-cyan shadow-sm' 
                          : 'bg-surface-accent border-border-subtle'
                      }`}
                      onClick={() => setIsFreeBasePlayer(false)}
                    >
                      <input 
                        type="radio" 
                        name="feeOption" 
                        checked={!isFreeBasePlayer} 
                        onChange={() => setIsFreeBasePlayer(false)}
                        className="mt-0.5 text-brand-cyan cursor-pointer" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Custom Retention Fee</span>
                        <span className="text-[10px] text-slate-400">Optional contract fee from purse</span>
                      </div>
                    </label>
                  </div>

                  {!isFreeBasePlayer && (
                    <Input
                      label={activeTournament?.type === 'POINTS' ? 'Contract Fee (points)' : `Custom Contract Fee (${activeTournament?.currency || 'LKR'})`}
                      type="number"
                      min={0}
                      value={rosterRetentionFee}
                      onChange={(e) => setRosterRetentionFee(Number(e.target.value))}
                      helperText="Deducted directly from franchise purse"
                    />
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT REGISTRATION */}
            {fixedTab === 'DIRECT' && (
              <div className="space-y-3">
                <Input
                  label="Athlete Full Name *"
                  placeholder="e.g. Lasith Malinga"
                  required
                  value={directForm.fullName}
                  onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Playing Role *
                    </label>
                    <select
                      value={directForm.role}
                      onChange={(e) => setDirectForm({ ...directForm, role: e.target.value })}
                      className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="TOP_ORDER_BATTER">Top-order Batter</option>
                      <option value="MIDDLE_ORDER_BATTER">Middle-order Batter</option>
                      <option value="WICKETKEEPER_BATTER">Wicketkeeper Batter</option>
                      <option value="PACE_ALL_ROUNDER">Pace All-rounder</option>
                      <option value="SPIN_ALL_ROUNDER">Spin All-rounder</option>
                      <option value="FAST_BOWLER">Fast Bowler</option>
                      <option value="SPIN_BOWLER">Spin Bowler</option>
                    </select>
                  </div>

                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="directOverseas"
                    checked={directForm.isOverseas}
                    onChange={(e) => setDirectForm({ ...directForm, isOverseas: e.target.checked })}
                    className="w-4 h-4 rounded bg-surface-card border-border-subtle text-brand-cyan cursor-pointer"
                  />
                  <label htmlFor="directOverseas" className="text-xs text-slate-300 cursor-pointer">
                    Player is Overseas (Counts toward overseas quota limit)
                  </label>
                </div>

                {/* Direct Base Player Pricing Option */}
                <div className="p-3.5 bg-surface-card rounded-xl border border-border-subtle space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Base Player Pricing Option
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label 
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                        isDirectFreeBasePlayer 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' 
                          : 'bg-surface-accent border-border-subtle'
                      }`}
                      onClick={() => setIsDirectFreeBasePlayer(true)}
                    >
                      <input 
                        type="radio" 
                        name="directFeeOption" 
                        checked={isDirectFreeBasePlayer} 
                        onChange={() => setIsDirectFreeBasePlayer(true)}
                        className="mt-0.5 text-amber-500 cursor-pointer" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">No Base Price (Free)</span>
                        <span className="text-[10px] text-slate-400">{activeTournament?.type === 'POINTS' ? '0 points' : '0 LKR'} — Fixed player without base price</span>
                      </div>
                    </label>

                    <label 
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                        !isDirectFreeBasePlayer 
                          ? 'bg-brand-cyan/10 border-brand-cyan shadow-sm' 
                          : 'bg-surface-accent border-border-subtle'
                      }`}
                      onClick={() => setIsDirectFreeBasePlayer(false)}
                    >
                      <input 
                        type="radio" 
                        name="directFeeOption" 
                        checked={!isDirectFreeBasePlayer} 
                        onChange={() => setIsDirectFreeBasePlayer(false)}
                        className="mt-0.5 text-brand-cyan cursor-pointer" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Custom Contract Price</span>
                        <span className="text-[10px] text-slate-400">Optional contract fee from purse</span>
                      </div>
                    </label>
                  </div>

                  {!isDirectFreeBasePlayer && (
                    <Input
                      label={activeTournament?.type === 'POINTS' ? 'Contract Fee (points)' : `Custom Contract Fee (${activeTournament?.currency || 'LKR'})`}
                      type="number"
                      min={0}
                      value={directForm.retentionPrice}
                      onChange={(e) => setDirectForm({ 
                        ...directForm, 
                        retentionPrice: Number(e.target.value),
                        basePrice: Number(e.target.value) 
                      })}
                    />
                  )}
                </div>

                <Input
                  label="Player Image (from your device)"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setDirectPlayerPhotoFile(file);
                    setDirectPlayerPhotoPreview(URL.createObjectURL(file));
                  }}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-surface-accent file:px-3 file:py-2 file:text-slate-100"
                />
                {directPlayerPhotoPreview && <img src={directPlayerPhotoPreview} alt="Selected player" className="h-14 w-14 rounded-lg object-cover" />}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <Button variant="outline" type="button" onClick={() => setIsFixedModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isAssigning}>
                {isAssigning ? 'Allocating...' : `Assign Fixed to ${selectedTeam.shortName}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
