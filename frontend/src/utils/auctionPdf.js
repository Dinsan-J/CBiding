import { formatExactCurrency, getRoleLabel } from './formatters';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getPlayerTeam = (player, teams) => {
  const winningTeam = player.winningTeamId;
  if (winningTeam && typeof winningTeam === 'object') return winningTeam;
  return teams.find(team => String(team._id || team.id) === String(winningTeam)) || null;
};

export const openAuctionPdf = ({ tournament, teams, players }) => {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return false;

  const soldPlayers = players.filter(player => player.status === 'SOLD');
  const unsoldPlayers = players.filter(player => player.status === 'UNSOLD');
  const totalSpent = teams.reduce((total, team) => total + (Number(team.totalSpent) || 0), 0);
  const generatedAt = new Date().toLocaleString();
  const teamRows = teams.map(team => `
    <tr>
      <td>${escapeHtml(team.name)}</td>
      <td>${escapeHtml(team.shortName || '')}</td>
      <td class="number">${escapeHtml(formatExactCurrency(team.startingPurse, tournament.currency))}</td>
      <td class="number">${escapeHtml(formatExactCurrency(team.totalSpent, tournament.currency))}</td>
      <td class="number">${escapeHtml(formatExactCurrency(team.remainingPurse, tournament.currency))}</td>
      <td class="number">${escapeHtml(team.squadCount || 0)}/${escapeHtml(tournament.maxSquadSize || '-')}</td>
    </tr>`).join('');
  const playerRows = [...players]
    .sort((left, right) => (Number(left.lotNumber) || 0) - (Number(right.lotNumber) || 0))
    .map(player => {
      const team = getPlayerTeam(player, teams);
      return `
        <tr>
          <td class="number">${escapeHtml(player.lotNumber || '-')}</td>
          <td>${escapeHtml(player.fullName)}</td>
          <td>${escapeHtml(getRoleLabel(player.role))}</td>
          <td>${escapeHtml(player.isOverseas ? 'Overseas' : (player.country || 'Local'))}</td>
          <td>${escapeHtml(player.status || 'QUEUED')}${player.isFixedPlayer ? ' · Fixed' : ''}</td>
          <td>${escapeHtml(team?.name || '—')}</td>
          <td class="number">${escapeHtml(formatExactCurrency(player.basePrice, tournament.currency))}</td>
          <td class="number">${player.finalPrice != null ? escapeHtml(formatExactCurrency(player.finalPrice, tournament.currency)) : '—'}</td>
        </tr>`;
    }).join('');

  const title = escapeHtml(tournament.title || 'Tournament Auction');
  const suggestedFilename = `${String(tournament.slug || 'auction-details').replace(/[^a-z0-9-]/gi, '-')}-auction-details`;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(suggestedFilename)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172033; font: 10px/1.45 Arial, Helvetica, sans-serif; }
          h1 { margin: 0 0 3px; font-size: 24px; }
          h2 { margin: 22px 0 8px; font-size: 15px; }
          p { margin: 0; color: #526078; }
          .topline { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0e7490; padding-bottom: 12px; }
          .generated { text-align: right; font-size: 9px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
          .metric { border: 1px solid #d7deea; border-radius: 6px; padding: 9px; }
          .metric span { display: block; color: #526078; font-size: 8px; text-transform: uppercase; }
          .metric strong { display: block; margin-top: 3px; font-size: 13px; }
          .details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 16px; margin-top: 12px; }
          .detail { border-bottom: 1px solid #e5e9f0; padding: 5px 0; }
          .detail span { display: block; color: #64748b; font-size: 8px; text-transform: uppercase; }
          .detail strong { font-size: 10px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead { display: table-header-group; }
          th { background: #eaf0f6; color: #34445c; text-align: left; font-size: 8px; text-transform: uppercase; }
          th, td { border: 1px solid #dbe2eb; padding: 5px 6px; overflow-wrap: anywhere; }
          tr { break-inside: avoid; }
          .number { text-align: right; font-variant-numeric: tabular-nums; }
          .players th:nth-child(1) { width: 5%; }
          .players th:nth-child(2) { width: 19%; }
          .players th:nth-child(3) { width: 16%; }
          .players th:nth-child(4) { width: 10%; }
          .players th:nth-child(5) { width: 12%; }
          .players th:nth-child(6) { width: 14%; }
          .players th:nth-child(7), .players th:nth-child(8) { width: 12%; }
          .empty { padding: 14px; color: #64748b; border: 1px dashed #cbd5e1; }
          .footer { margin-top: 18px; border-top: 1px solid #dbe2eb; padding-top: 6px; color: #64748b; font-size: 8px; }
          @media screen { body { max-width: 1100px; margin: 24px auto; padding: 0 24px; } }
        </style>
      </head>
      <body>
        <header class="topline">
          <div><h1>${title}</h1><p>Tournament auction details</p></div>
          <div class="generated">Generated ${escapeHtml(generatedAt)}</div>
        </header>
        <section class="metrics">
          <div class="metric"><span>Players in roster</span><strong>${players.length}</strong></div>
          <div class="metric"><span>Players sold</span><strong>${soldPlayers.length}</strong></div>
          <div class="metric"><span>Players unsold</span><strong>${unsoldPlayers.length}</strong></div>
          <div class="metric"><span>Total spent</span><strong>${escapeHtml(formatExactCurrency(totalSpent, tournament.currency))}</strong></div>
        </section>
        <section class="details">
          <div class="detail"><span>Status</span><strong>${escapeHtml(tournament.status || '—')}</strong></div>
          <div class="detail"><span>Auction format</span><strong>${tournament.type === 'POINTS' ? 'Points' : 'Financial'}</strong></div>
          <div class="detail"><span>Starting purse per team</span><strong>${escapeHtml(formatExactCurrency(tournament.startingPurse, tournament.currency))}</strong></div>
          <div class="detail"><span>Minimum base price</span><strong>${escapeHtml(formatExactCurrency(tournament.minBasePrice, tournament.currency))}</strong></div>
          <div class="detail"><span>Squad size</span><strong>${escapeHtml(tournament.minSquadSize || '—')}–${escapeHtml(tournament.maxSquadSize || '—')}</strong></div>
          <div class="detail"><span>Overseas player limit</span><strong>${escapeHtml(tournament.maxOverseasPlayers ?? tournament.maxOverseas ?? '—')}</strong></div>
          <div class="detail"><span>Bid timer</span><strong>${escapeHtml(tournament.timerSeconds || '—')} seconds</strong></div>
          <div class="detail"><span>Teams</span><strong>${teams.length}</strong></div>
        </section>
        <h2>Team budgets and squads</h2>
        ${teams.length ? `<table><thead><tr><th>Team</th><th>Code</th><th class="number">Starting purse</th><th class="number">Spent</th><th class="number">Remaining</th><th class="number">Squad</th></tr></thead><tbody>${teamRows}</tbody></table>` : '<div class="empty">No teams have been added.</div>'}
        <h2>Player auction roster</h2>
        ${players.length ? `<table class="players"><thead><tr><th>Lot</th><th>Player</th><th>Role</th><th>Player type</th><th>Status</th><th>Team</th><th class="number">Base price</th><th class="number">Acquisition</th></tr></thead><tbody>${playerRows}</tbody></table>` : '<div class="empty">No players have been added.</div>'}
        <footer class="footer">${title} · Auction report</footer>
      </body>
    </html>`);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
  return true;
};
