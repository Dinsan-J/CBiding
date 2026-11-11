import React, { useState } from 'react';
import { Trophy, Plus, Settings, Play, Pause, CheckCircle2, Trash2, Calendar, Radio } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/formatters';

export const TournamentsManager = () => {
  const { tournaments, createTournament } = useAuction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');

  // New Tournament Form State
  const [form, setForm] = useState({
    title: '',
    type: 'MONEY',
    currency: 'LKR',
    startingPurse: 50000000,
    minSquadSize: 15,
    maxSquadSize: 18,
    maxOverseas: 5,
    minBasePrice: 50000,
    timerSeconds: 30
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createTournament(form);
    setIsModalOpen(false);
    setForm({
      title: '',
      type: 'MONEY',
      currency: 'LKR',
      startingPurse: 50000000,
      minSquadSize: 15,
      maxSquadSize: 18,
      maxOverseas: 5,
      minBasePrice: 50000,
      timerSeconds: 30
    });
  };

  const filteredTournaments = tournaments.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tournaments & Auctions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure financial purses, squad quotas, bidding ladders, and tournament state machines.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Create Tournament
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {['ALL', 'LIVE', 'SCHEDULED', 'DRAFT', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
              filter === st
                ? 'bg-brand-cyan text-slate-950 border-brand-cyan font-bold shadow-glow-cyan'
                : 'bg-surface-card hover:bg-surface-accent text-slate-300 border-border-subtle'
            }`}
          >
            {st} ({tournaments.filter(t => st === 'ALL' || t.status === st).length})
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTournaments.map((tourn) => (
          <Card key={tourn.id} className="p-5 flex flex-col justify-between bg-surface-card border-border-subtle hover:border-slate-500 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={tourn.status === 'LIVE' ? 'emerald' : 'cyan'} dot={tourn.status === 'LIVE'}>
                  {tourn.status}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {tourn.type} ({tourn.currency})
                </span>
              </div>

              <h3 className="text-lg font-bold text-white leading-tight">
                {tourn.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Slug: /{tourn.slug}
              </p>

              <div className="grid grid-cols-2 gap-2 bg-surface-accent/60 p-3 rounded-xl border border-border-subtle mt-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Base Purse</span>
                  <strong className="text-brand-emerald">{formatCurrency(tourn.startingPurse, tourn.currency)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Squad Limits</span>
                  <strong className="text-white">{tourn.minSquadSize} - {tourn.maxSquadSize} Players</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Overseas Cap</span>
                  <strong className="text-brand-purple">{tourn.maxOverseas} Max</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Timer Setting</span>
                  <strong className="text-brand-cyan">{tourn.timerSeconds}s per Bid</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Ladders: {tourn.bidIncrements ? tourn.bidIncrements.length : 5} tiers
              </span>

              <div className="flex items-center gap-2">
                <Button size="xs" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Tournament Auction"
        subtitle="Set up rules, budgets, and operational timers."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Tournament Title *"
            placeholder="e.g. Lanka Premier Trophy 2026"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Auction Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                <option value="MONEY">Financial (Currency)</option>
                <option value="POINTS">Points-based</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Currency Code *
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="INR">INR (Indian Rupee)</option>
                <option value="POINTS">POINTS (Token Pool)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Starting Purse"
              type="number"
              required
              value={form.startingPurse}
              onChange={(e) => setForm({ ...form, startingPurse: Number(e.target.value) })}
            />
            <Input
              label="Min Squad"
              type="number"
              required
              value={form.minSquadSize}
              onChange={(e) => setForm({ ...form, minSquadSize: Number(e.target.value) })}
            />
            <Input
              label="Max Squad"
              type="number"
              required
              value={form.maxSquadSize}
              onChange={(e) => setForm({ ...form, maxSquadSize: Number(e.target.value) })}
            />
            <Input
              label="Overseas Cap"
              type="number"
              required
              value={form.maxOverseas}
              onChange={(e) => setForm({ ...form, maxOverseas: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Base Price (LKR)"
              type="number"
              required
              value={form.minBasePrice}
              onChange={(e) => setForm({ ...form, minBasePrice: Number(e.target.value) })}
              helperText="Enforces squad reserve protection"
            />
            <Input
              label="Timer Seconds"
              type="number"
              required
              value={form.timerSeconds}
              onChange={(e) => setForm({ ...form, timerSeconds: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Tournament
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
