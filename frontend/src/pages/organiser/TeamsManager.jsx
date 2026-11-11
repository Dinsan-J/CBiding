import React, { useState } from 'react';
import { Shield, Plus, Users, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatExactCurrency } from '../../utils/formatters';

export const TeamsManager = () => {
  const { teams, createTeam, activeTournament } = useAuction();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Team Form
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    primaryColor: '#06B6D4',
    startingPurse: activeTournament.startingPurse || 50000000,
    ownerName: '',
    ownerContact: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createTeam({
      ...form,
      auctionId: activeTournament.id
    });
    setIsModalOpen(false);
    setForm({
      name: '',
      shortName: '',
      primaryColor: '#06B6D4',
      startingPurse: activeTournament.startingPurse || 50000000,
      ownerName: '',
      ownerContact: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Franchises & Team Budgets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage participating cricket teams, assign initial purses, and track owner information.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Add New Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => (
          <Card key={team.id} className="p-5 flex flex-col justify-between bg-surface-card border-border-subtle hover:border-slate-500 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md"
                    style={{ backgroundColor: team.primaryColor || '#06B6D4' }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{team.name}</h3>
                    <p className="text-xs text-slate-400">Owner: {team.ownerName}</p>
                  </div>
                </div>
                <Badge variant="cyan">{team.squadCount} PLAYERS</Badge>
              </div>

              {/* Financial Metrics */}
              <div className="space-y-2 bg-surface-accent/60 p-3 rounded-xl border border-border-subtle text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Starting Purse:</span>
                  <span className="text-slate-200">{formatCurrency(team.startingPurse, activeTournament.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="text-slate-200">{formatCurrency(team.totalSpent, activeTournament.currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border-subtle font-bold">
                  <span className="text-slate-400">Remaining:</span>
                  <span className="text-brand-emerald">{formatCurrency(team.remainingPurse, activeTournament.currency)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Contact: <strong className="text-slate-300">{team.ownerContact || 'N/A'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button size="xs" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE TEAM MODAL */}
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
                Primary Brand Color *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-surface-card border border-border-subtle p-0.5"
                />
                <span className="text-xs font-mono text-slate-300">{form.primaryColor}</span>
              </div>
            </div>
          </div>

          <Input
            label="Initial Salary Cap / Purse *"
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
