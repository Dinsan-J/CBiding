import React, { useState } from 'react';
import { Settings, MessageSquare, Shield, DollarSign, Save, CheckCircle2, History } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const SettingsView = () => {
  const { activeTournament } = useAuction();
  const [notation, setNotation] = useState('SOUTH_ASIAN');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Tournament & Workspace Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure notification integrations, currency notation, and tenant preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: WORKSPACE PROFILE */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-border-subtle pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-cyan" />
            Tenant Workspace Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organiser Workspace Name"
              defaultValue="Sri Lanka Cricket Premier Auctions"
            />
            <Input
              label="Tenant Slug"
              defaultValue="slc-premier"
              disabled
              helperText="Unique permanent workspace identifier"
            />
            <Input
              label="Contact Email"
              defaultValue="organisers@slc.lk"
              type="email"
            />
            <Input
              label="Support Phone"
              defaultValue="+94 11 234 5678"
            />
          </div>
        </Card>

        {/* SECTION 2: CURRENCY & NOTATION PREFERENCES */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-border-subtle pb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-emerald" />
            Currency & Number Notation
          </h3>

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Display Notation for Sri Lankan Rupee (LKR)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start justify-between ${
                  notation === 'SOUTH_ASIAN' 
                    ? 'bg-brand-cyan/10 border-brand-cyan shadow-glow-cyan/20' 
                    : 'bg-surface-accent border-border-subtle'
                }`}
                onClick={() => setNotation('SOUTH_ASIAN')}
              >
                <div>
                  <h4 className="text-sm font-bold text-white">South Asian Notation</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatted as Lakhs and Crores (e.g., <strong className="text-brand-emerald">LKR 15 Lakh</strong>, <strong className="text-brand-emerald">LKR 2.50 Cr</strong>).
                  </p>
                </div>
                <input type="radio" name="notation" checked={notation === 'SOUTH_ASIAN'} readOnly className="mt-1" />
              </label>

              <label 
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start justify-between ${
                  notation === 'STANDARD' 
                    ? 'bg-brand-cyan/10 border-brand-cyan shadow-glow-cyan/20' 
                    : 'bg-surface-accent border-border-subtle'
                }`}
                onClick={() => setNotation('STANDARD')}
              >
                <div>
                  <h4 className="text-sm font-bold text-white">International Standard</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatted as Thousands and Millions (e.g., <strong className="text-brand-emerald">LKR 1.50 M</strong>, <strong className="text-brand-emerald">LKR 25.00 M</strong>).
                  </p>
                </div>
                <input type="radio" name="notation" checked={notation === 'STANDARD'} readOnly className="mt-1" />
              </label>
            </div>
          </div>
        </Card>

        {/* SECTION 3: WHATSAPP NOTIFICATION INTEGRATION */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-emerald" />
              WhatsApp Business Platform Alerts
            </h3>
            <Badge variant="emerald" dot>
              GATEWAY CONNECTED
            </Badge>
          </div>

          <p className="text-xs text-slate-400">
            Automated WhatsApp notifications are sent to players immediately upon being hammered SOLD to a franchise.
          </p>

          <div className="p-4 bg-canvas rounded-xl border border-border-subtle text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Pre-Approved Message Template Preview:
            </span>
            <div className="p-3 bg-slate-900 rounded-lg font-sans text-slate-200 border border-slate-800 leading-relaxed">
              🏏 <strong>Congratulations Wanindu Hasaranga!</strong><br />
              You have been acquired by <strong>Colombo Strikers</strong> for <strong>LKR 14,500,000</strong> in the <strong>Colombo Premier League 2026</strong> auction.<br /><br />
              View official squad: <em>https://cbid.lk/live/cpl-2026/teams</em>
            </div>
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-semibold text-brand-emerald flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
            </span>
          )}
          <Button type="submit" variant="primary" leftIcon={Save}>
            Save Workspace Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
