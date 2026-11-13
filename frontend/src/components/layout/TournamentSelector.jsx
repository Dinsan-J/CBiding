import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';

export const TournamentSelector = ({ compact = false }) => {
  const {
    tournaments,
    activeTournamentId,
    setActiveTournamentId,
    isLiveLoading
  } = useAuction();
  const [error, setError] = useState('');

  const handleChange = async (event) => {
    const id = event.target.value;
    if (!id) return;
    setError('');
    try {
      await setActiveTournamentId(id);
    } catch (loadError) {
      setError(loadError.message || 'Could not load this tournament.');
    }
  };

  return (
    <div className="relative min-w-0">
      <label className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-brand-cyan shrink-0" />
        {!compact && <span className="hidden xl:inline text-[10px] font-bold uppercase tracking-wider text-slate-400">Tournament</span>}
        <select
          value={activeTournamentId || ''}
          onChange={handleChange}
          disabled={!tournaments.length}
          aria-label="Select active tournament"
          className="min-w-0 max-w-[170px] sm:max-w-[230px] bg-surface-accent border border-border-subtle rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-100 outline-none focus:border-brand-cyan disabled:opacity-60"
        >
          <option value="" disabled>Select tournament</option>
          {tournaments.map(tournament => {
            const id = String(tournament._id || tournament.id);
            return <option key={id} value={id}>{tournament.title}</option>;
          })}
        </select>
        {isLiveLoading && activeTournamentId && (
          <span className="hidden sm:inline text-[10px] text-slate-400 whitespace-nowrap">Loading…</span>
        )}
      </label>
      {error && <p className="absolute mt-1 max-w-56 rounded bg-red-950 px-2 py-1 text-[10px] text-red-300">{error}</p>}
    </div>
  );
};
