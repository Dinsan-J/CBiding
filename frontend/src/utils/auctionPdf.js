import { formatExactCurrency, getRoleLabel } from './formatters';
import { getPlayerWinningTeam, playerBelongsToTeam } from './playerTeams';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const openAuctionPdf = ({ tournament, teams, players }) => {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return false;

  const isFixedPlayer = player => Boolean(
    player.isFixedPlayer || player.retentionType === 'FIXED_RETENTION' || player.status === 'RETAINED'
  );
  const soldPlayers = players.filter(player => player.status === 'SOLD' && !isFixedPlayer(player));
  const unsoldPlayers = players.filter(player => player.status === 'UNSOLD');
  const totalSpent = teams.reduce((total, team) => total + (Number(team.totalSpent) || 0), 0);
  const generatedAt = new Date().toLocaleString();
  const renderSquadPlayer = player => `
    <li class="squad-player">
      <span class="lot-number">#${escapeHtml(player.lotNumber || '—')}</span>
      <span class="player-meta">
        <strong>${escapeHtml(player.fullName)}</strong>
        <small>${escapeHtml(getRoleLabel(player.role))}${player.isOverseas ? ' · Overseas' : ''}</small>
      </span>
      <strong class="player-price">${escapeHtml(formatExactCurrency(player.finalPrice ?? player.basePrice, tournament.currency))}</strong>
    </li>`;
  const teamCards = teams.map(team => {
    const squad = players.filter(player =>
      playerBelongsToTeam(player, team) && (player.status === 'SOLD' || player.status === 'RETAINED')
    );
    const fixedPlayers = squad.filter(isFixedPlayer);
    const boughtPlayers = squad.filter(player => player.status === 'SOLD' && !isFixedPlayer(player));
    const teamMark = team.logoUrl
      ? `<img class="team-mark" src="${escapeHtml(team.logoUrl)}" alt="${escapeHtml(team.name)} logo" />`
      : `<span class="team-mark team-monogram">${escapeHtml(team.shortName || team.name?.slice(0, 2) || 'TM')}</span>`;
    const renderPlayerGroup = (label, list, emptyLabel) => `
      <section class="player-group">
        <div class="group-heading"><h4>${label}</h4><span>${list.length}</span></div>
        ${list.length
          ? `<ul class="squad-list">${list.map(renderSquadPlayer).join('')}</ul>`
          : `<p class="group-empty">${emptyLabel}</p>`}
      </section>`;

    return `
      <article class="team-card">
        <header class="team-head">
          <div class="team-identity">
            ${teamMark}
            <div class="team-title"><h3>${escapeHtml(team.name)}</h3><p>${escapeHtml(team.ownerName || team.shortName || 'Tournament team')}</p></div>
          </div>
          <span class="squad-badge">${squad.length} / ${escapeHtml(tournament.maxSquadSize || '—')} players</span>
        </header>
        <div class="team-budget">
          <div><span>Starting purse</span><strong>${escapeHtml(formatExactCurrency(team.startingPurse, tournament.currency))}</strong></div>
          <div><span>Total spent</span><strong>${escapeHtml(formatExactCurrency(team.totalSpent, tournament.currency))}</strong></div>
          <div><span>Remaining</span><strong>${escapeHtml(formatExactCurrency(team.remainingPurse, tournament.currency))}</strong></div>
        </div>
        <div class="player-groups">
          ${renderPlayerGroup('Bought players', boughtPlayers, 'No auction buys recorded.')}
          ${renderPlayerGroup('Fixed players', fixedPlayers, 'No fixed players assigned.')}
        </div>
      </article>`;
  }).join('');
  const playerRows = [...players]
    .sort((left, right) => (Number(left.lotNumber) || 0) - (Number(right.lotNumber) || 0))
    .map(player => {
      const team = getPlayerWinningTeam(player, teams);
      const isFixed = isFixedPlayer(player);
      return `
        <tr>
          <td class="number">${escapeHtml(player.lotNumber || '-')}</td>
          <td>${escapeHtml(player.fullName)}</td>
          <td>${escapeHtml(getRoleLabel(player.role))}</td>
          <td>${escapeHtml(player.isOverseas ? 'Overseas' : (player.country || 'Local'))}</td>
          <td>${escapeHtml(player.status || 'QUEUED')}${isFixed ? ' · Fixed' : ''}</td>
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
          body { margin: 0; color: #172033; font: 10px/1.45 Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          h1 { margin: 0 0 3px; font-size: 25px; letter-spacing: -.4px; }
          h2 { margin: 20px 0 9px; font-size: 15px; color: #123047; }
          p { margin: 0; color: #526078; }
          .topline { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0e7490; padding-bottom: 12px; }
          .topline p { font-size: 10px; }
          .generated { text-align: right; font-size: 9px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-top: 14px; }
          .metric { border: 1px solid #d7deea; border-radius: 8px; padding: 9px 11px; background: #f8fafc; }
          .metric span { display: block; color: #526078; font-size: 8px; text-transform: uppercase; letter-spacing: .5px; }
          .metric strong { display: block; margin-top: 3px; font-size: 14px; color: #102a43; }
          .details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px 16px; margin-top: 12px; }
          .detail { border-bottom: 1px solid #e5e9f0; padding: 5px 0; }
          .detail span { display: block; color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: .35px; }
          .detail strong { font-size: 10px; color: #26364b; }
          .team-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .team-card { border: 1px solid #d5dee9; border-radius: 9px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; background: #fff; }
          .team-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 11px; background: #f0f6fa; border-bottom: 1px solid #dce5ed; }
          .team-identity { display: flex; align-items: center; gap: 8px; min-width: 0; }
          .team-mark { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; flex: none; }
          .team-monogram { display: flex; align-items: center; justify-content: center; background: #0e7490; color: #fff; font-weight: 700; font-size: 10px; }
          .team-title { min-width: 0; }
          .team-title h3 { margin: 0; color: #102a43; font-size: 12px; line-height: 1.2; }
          .team-title p { margin-top: 2px; font-size: 8px; }
          .squad-badge { flex: none; padding: 4px 7px; border: 1px solid #b8dce3; border-radius: 999px; color: #0e6477; background: #e8f7f8; font-size: 9px; font-weight: 700; }
          .team-budget { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; padding: 8px 10px; border-bottom: 1px solid #e6ebf1; }
          .team-budget div { min-width: 0; }
          .team-budget span { display: block; color: #65748a; font-size: 8px; text-transform: uppercase; letter-spacing: .35px; }
          .team-budget strong { display: block; margin-top: 2px; color: #24364b; font-size: 10px; overflow-wrap: anywhere; }
          .team-budget div:last-child strong { color: #087e68; }
          .player-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 8px 10px 10px; }
          .player-group { min-width: 0; }
          .group-heading { display: flex; align-items: center; justify-content: space-between; gap: 5px; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #e5eaf0; }
          .group-heading h4 { margin: 0; color: #354a60; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; }
          .group-heading span { color: #0e7490; font-size: 9px; font-weight: 700; }
          .squad-list { list-style: none; margin: 0; padding: 0; }
          .squad-player { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 4px; align-items: center; padding: 3px 0; border-bottom: 1px solid #eef1f5; break-inside: avoid; }
          .squad-player:last-child { border-bottom: 0; }
          .lot-number { color: #8190a4; font-size: 8px; font-variant-numeric: tabular-nums; }
          .player-meta { min-width: 0; }
          .player-meta strong { display: block; color: #25364b; font-size: 9px; line-height: 1.15; overflow-wrap: anywhere; }
          .player-meta small { display: block; color: #718096; font-size: 8px; }
          .player-price { color: #087e68; font-size: 8px; text-align: right; white-space: nowrap; }
          .group-empty { padding: 5px 0; color: #8995a6; font-size: 8px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead { display: table-header-group; }
          th { background: #eaf0f6; color: #34445c; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: .3px; }
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
          .empty { padding: 14px; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 7px; }
          .footer { margin-top: 18px; border-top: 1px solid #dbe2eb; padding-top: 6px; color: #64748b; font-size: 8px; }
          @media print { .team-card, .metric, .detail { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
        <h2>Team squads and budgets</h2>
        ${teams.length ? `<section class="team-grid">${teamCards}</section>` : '<div class="empty">No teams have been added.</div>'}
        <h2>Full player auction ledger</h2>
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
