import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Search, 
  Plus, 
  Trash2,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TabGroup } from '../../components/ui/TabGroup';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatExactCurrency, getRoleBadgeClass, getRoleLabel } from '../../utils/formatters';
import { tabContentVariants } from '../../utils/motion';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getPlayerWinningTeam } from '../../utils/playerTeams';

export const PlayersManager = () => {
  const { 
    players, 
    teams, 
    registrations, 
    fetchRegistrations,
    createPlayer,
    approveRegistration, 
    rejectRegistration, 
    importPlayers, 
    activeTournament 
  } = useAuction();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'roster'; // 'roster', 'approvals', 'import'
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Loading state & fetch registrations on mount and tab change
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const loadRegistrations = useCallback(async () => {
    if (typeof fetchRegistrations === 'function') {
      setIsLoadingRegs(true);
      try {
        await fetchRegistrations();
      } finally {
        setIsLoadingRegs(false);
      }
    }
  }, [fetchRegistrations]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  // Search & Filter in Roster
  const [searchQuery, setSearchQuery] = useState('');

  // Add Player Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [addPlayerForm, setAddPlayerForm] = useState({
    fullName: '',
    role: 'TOP_ORDER_BATTER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'Right-arm medium',
    age: 24,
    basePrice: 1500000,
    photoUrl: '',
    isOverseas: false,
    country: 'Sri Lanka'
  });
  const [addPlayerPhotoFile, setAddPlayerPhotoFile] = useState(null);
  const [addPlayerPhotoPreview, setAddPlayerPhotoPreview] = useState('');

  // Approval Modal State
  const [selectedReg, setSelectedReg] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalForm, setApprovalForm] = useState({ basePrice: 2000000 });

  // Bulk Import Simulation State
  const [importedData, setImportedData] = useState([]);
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filter pending registrations from MongoDB
  const pendingRegistrations = registrations.filter(r => r.status === 'PENDING' || !r.status);

  const tabs = [
    { id: 'roster', label: 'Approved Roster', icon: Users, count: players.length },
    { id: 'approvals', label: 'Pending Approvals', icon: CheckCircle2, count: pendingRegistrations.length },
    { id: 'import', label: 'Bulk Excel Import', icon: FileSpreadsheet },
  ];

  const handleCreatePlayerSubmit = async (e) => {
    e.preventDefault();
    if (!addPlayerForm.fullName.trim()) return;
    setIsCreatingPlayer(true);
    try {
      const photoUrl = addPlayerPhotoFile ? (await api.uploadImage(addPlayerPhotoFile)).data.url : '';
      const result = await createPlayer({
        ...addPlayerForm,
        photoUrl,
        basePrice: Number(addPlayerForm.basePrice),
        age: Number(addPlayerForm.age)
      });
      if (!result?.success) throw new Error(result?.error || 'Could not save player.');
      setIsAddModalOpen(false);
      setAddPlayerForm({
        fullName: '',
        role: 'TOP_ORDER_BATTER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm medium',
        age: 24,
        basePrice: 1500000,
        photoUrl: '',
        isOverseas: false,
        country: 'Sri Lanka'
      });
      setAddPlayerPhotoFile(null);
      setAddPlayerPhotoPreview('');
      setActiveTab('roster');
      toast.success('Player added to the tournament roster.');
    } catch (err) {
      toast.error(err.message || 'Failed to create player.');
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setIsApproving(true);
    try {
      const result = await approveRegistration(selectedReg.id || selectedReg._id, approvalForm.basePrice);
      if (!result?.success) throw new Error(result?.error || 'Could not approve player.');
      setSelectedReg(null);
      toast.success('Player approved and added to the roster.');
    } catch (err) {
      console.error('Failed to approve registration:', err);
      toast.error(err.message || 'Could not approve player.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    try {
      const result = await rejectRegistration(registrationId);
      if (!result?.success) throw new Error(result?.error || 'Could not reject registration.');
      toast.success('Registration rejected.');
    } catch (error) {
      toast.error(error.message || 'Could not reject registration.');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportedData([]);
    setImportStatus({ filename: file.name, message: 'Uploading and validating rows…' });
    try {
      const result = await importPlayers(file);
      if (!result?.success) throw new Error(result?.error || 'Import failed.');
      setImportedData(result.data?.players || []);
      setImportStatus({
        filename: file.name,
        count: result.data?.imported || 0,
        errors: result.data?.errors || [],
        message: result.message
      });
      toast.success(result.message || 'Player spreadsheet imported.');
    } catch (error) {
      setImportStatus({ filename: file.name, error: error.message });
      toast.error(error.message || 'Could not import the player spreadsheet.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = "Lot Number,Player Name,Role,Base Price,Status,Winning Team,Final Price\n";
    const rows = players.map(p => {
      const team = getPlayerWinningTeam(p, teams);
      return `${p.lotNumber},"${p.fullName}","${getRoleLabel(p.role)}",${p.basePrice},${p.status},"${team ? team.name : ''}",${p.finalPrice || ''}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BidX_${activeTournament.slug}_roster.csv`;
    a.click();
    toast.success('Roster CSV downloaded.');
  };

  const filteredPlayers = players.filter(p => 
    !searchQuery.trim() || p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Player Operations & Roster Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage official auction lots, review incoming registrations, and bulk import Excel sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Player
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="max-w-xl"
      />

      {/* Tab Panels with Smooth Transitions */}
      <AnimatePresence mode="wait">
        {/* TAB 1: APPROVED ROSTER TABLE */}
        {activeTab === 'roster' && (
          <motion.div
            key="roster"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Search roster players..."
                  leftIcon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Showing {filteredPlayers.length} of {players.length} players
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-accent border-b border-border-subtle text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-4">Lot #</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Cricket Role</th>
                    <th className="py-3 px-4 text-right">Base Price</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Franchise</th>
                    <th className="py-3 px-4 text-right">Acquisition Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-slate-200">
                  {filteredPlayers.map((player) => {
                    const team = getPlayerWinningTeam(player, teams);
                    return (
                      <tr key={player.id || player._id} className="hover:bg-surface-accent/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          #{player.lotNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{player.fullName}</span>
                            {player.isOverseas && <Badge variant="purple" size="sm">OS</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getRoleBadgeClass(player.role)}`}>
                            {getRoleLabel(player.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-right font-semibold">
                          {formatCurrency(player.basePrice, activeTournament.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {player.isFixedPlayer ? (
                            <Badge variant="gold" dot>FIXED / RETAINED</Badge>
                          ) : (
                            <Badge
                              variant={player.status === 'SOLD' ? 'emerald' : player.status === 'UNSOLD' ? 'crimson' : player.status === 'LIVE' ? 'cyan' : 'default'}
                              dot={player.status === 'SOLD' || player.status === 'LIVE'}
                            >
                              {player.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {team ? (
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                                style={{ backgroundColor: team.primaryColor || '#06B6D4' }}
                              >
                                {team.shortName}
                              </span>
                              <span className="truncate max-w-[120px]">{team.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-right font-bold text-brand-emerald">
                          {player.finalPrice ? formatCurrency(player.finalPrice, activeTournament.currency) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PENDING APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <motion.div
            key="approvals"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pending Committee Review</span>
                  <Badge variant="gold">{pendingRegistrations.length}</Badge>
                </h3>
                <p className="text-xs text-slate-400">Applications submitted from public self-registration</p>
              </div>

              <Button
                size="xs"
                variant="outline"
                leftIcon={RefreshCw}
                isLoading={isLoadingRegs}
                onClick={loadRegistrations}
              >
                Refresh Applications
              </Button>
            </div>

            {pendingRegistrations.length === 0 ? (
              <Card className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-brand-emerald mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Zero Pending Applications</h4>
                <p className="text-xs text-slate-500 mt-1">All player submissions have been reviewed or no new submissions exist.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRegistrations.map((reg) => (
                  <Card key={reg.id || reg._id} className="p-5 flex flex-col justify-between bg-surface-card border-border-subtle hover:border-brand-gold/40 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold" dot>NEW REGISTRATION</Badge>
                        <span className="text-[11px] text-slate-400 font-mono">Age: {reg.age}</span>
                      </div>

                      <h4 className="text-lg font-bold text-white leading-tight">{reg.fullName}</h4>
                      <p className="text-xs text-slate-400">
                        {reg.role} • {reg.experienceLevel}
                      </p>

                      <div className="p-3 bg-surface-accent rounded-xl border border-border-subtle text-xs space-y-1 font-mono">
                        <p><span className="text-slate-400">Contact:</span> <strong className="text-white">{reg.contactNumber}</strong></p>
                        {reg.email && <p><span className="text-slate-400">Email:</span> <span className="text-slate-300">{reg.email}</span></p>}
                        <p><span className="text-slate-400">Stats:</span> <span className="text-brand-cyan">{reg.matches || 0} Matches • {reg.runs || 0} Runs • {reg.wickets || 0} Wkts</span></p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between gap-2">
                      <Button
                        size="xs"
                        variant="danger"
                        leftIcon={XCircle}
                        onClick={() => handleRejectRegistration(reg.id || reg._id)}
                      >
                        Reject
                      </Button>

                      <Button
                        size="xs"
                        variant="success"
                        leftIcon={CheckCircle2}
                        onClick={() => {
                          setSelectedReg(reg);
                          setApprovalForm({ basePrice: 2000000 });
                        }}
                      >
                        Approve Player
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: BULK EXCEL IMPORT */}
        {activeTab === 'import' && (
          <motion.div
            key="import"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <Card className="p-8 text-center border-dashed border-2 border-slate-700 bg-surface-card">
              <FileSpreadsheet className="w-14 h-14 text-brand-emerald mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Import Player Roster from Excel / CSV</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Upload spreadsheets with columns: Full Name, Role, Batting Style, Bowling Style, Age, Base Price, Country, Overseas.
              </p>

              <label className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 bg-brand-cyan hover:bg-cyan-400 cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing…' : 'Choose Excel / CSV File'}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="sr-only" disabled={isImporting} />
              </label>
            </Card>

            {importStatus && (
              <Card className={`p-4 ${importStatus.error ? 'border-red-500/50' : 'border-brand-cyan/40'}`}>
                <p className={importStatus.error ? 'text-sm text-red-300' : 'text-sm text-emerald-300'}>
                  {importStatus.error || importStatus.message}
                </p>
                {importStatus.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-300">
                    {importStatus.errors.map((item) => <li key={`${item.row}-${item.error}`}>Row {item.row}: {item.error}</li>)}
                  </ul>
                )}
              </Card>
            )}

            {/* Parsed Preview Table */}
            {importedData.length > 0 && (
              <Card className="p-5 space-y-4 border-brand-cyan/40">
                  <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Imported Players ({importedData.length})
                    </h4>
                    <p className="text-xs text-slate-400">Source: {importStatus?.filename}</p>
                  </div>

                </div>

                <div className="overflow-x-auto rounded-xl border border-border-subtle">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-accent text-slate-400 font-mono uppercase">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Age</th>
                        <th className="py-2.5 px-3 text-right">Base Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-slate-200">
                      {importedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-accent/40">
                          <td className="py-2.5 px-3 font-bold text-white">{row.fullName}</td>
                          <td className="py-2.5 px-3">{getRoleLabel(row.role)}</td>
                          <td className="py-2.5 px-3 font-mono">{row.age}</td>
                          <td className="py-2.5 px-3 font-mono text-right font-bold text-brand-emerald">
                            {formatCurrency(row.basePrice, activeTournament.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYER APPROVAL MODAL */}
      <Modal
        isOpen={Boolean(selectedReg)}
        onClose={() => setSelectedReg(null)}
        title="Approve Player Registration"
        subtitle={`Set the base price for ${selectedReg?.fullName}`}
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          <Input
            label={activeTournament.type === 'POINTS' ? 'Base Points *' : `Base Price (${activeTournament.currency}) *`}
            type="number"
            required
            value={approvalForm.basePrice}
            onChange={(e) => setApprovalForm({ ...approvalForm, basePrice: Number(e.target.value) })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setSelectedReg(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={isApproving}>
              Approve & Sequence Lot
            </Button>
          </div>
        </form>
      </Modal>

      {/* DIRECT ADD PLAYER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Player Directly to Roster"
        subtitle="Create an official auction lot directly into MongoDB"
      >
        <form onSubmit={handleCreatePlayerSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Wanindu Hasaranga"
            required
            value={addPlayerForm.fullName}
            onChange={(e) => setAddPlayerForm({ ...addPlayerForm, fullName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Playing Role *
              </label>
              <select
                value={addPlayerForm.role}
                onChange={(e) => setAddPlayerForm({ ...addPlayerForm, role: e.target.value })}
                className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-xs text-slate-100"
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={activeTournament.type === 'POINTS' ? 'Base Points *' : `Base Price (${activeTournament.currency}) *`}
              type="number"
              required
              value={addPlayerForm.basePrice}
              onChange={(e) => setAddPlayerForm({ ...addPlayerForm, basePrice: Number(e.target.value) })}
            />

            <Input
              label="Age"
              type="number"
              value={addPlayerForm.age}
              onChange={(e) => setAddPlayerForm({ ...addPlayerForm, age: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Batting Style
              </label>
              <select
                value={addPlayerForm.battingStyle}
                onChange={(e) => setAddPlayerForm({ ...addPlayerForm, battingStyle: e.target.value })}
                className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                <option value="RIGHT_HAND">Right-hand bat</option>
                <option value="LEFT_HAND">Left-hand bat</option>
              </select>
            </div>

            <Input
              label="Bowling Style"
              placeholder="e.g. Right-arm leg break"
              value={addPlayerForm.bowlingStyle}
              onChange={(e) => setAddPlayerForm({ ...addPlayerForm, bowlingStyle: e.target.value })}
            />
          </div>

          <Input
            label="Player Photo (from your device)"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setAddPlayerPhotoFile(file);
              setAddPlayerPhotoPreview(URL.createObjectURL(file));
            }}
          />
          {addPlayerPhotoPreview && <img src={addPlayerPhotoPreview} alt="Selected player photo" className="h-16 w-16 rounded-lg object-cover" />}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingPlayer}>
              Add Player to Roster
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
