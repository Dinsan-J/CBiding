const getTeamId = (team) => {
  if (!team) return null;
  if (typeof team !== 'object') return team;
  return team._id || team.id || null;
};

export const getPlayerWinningTeamId = (player) =>
  getTeamId(player?.winningTeamId ?? player?.winningTeam);

export const getPlayerWinningTeam = (player, teams = []) => {
  const winningTeam = player?.winningTeamId ?? player?.winningTeam;

  if (winningTeam && typeof winningTeam === 'object' && (winningTeam.name || winningTeam.shortName)) {
    return winningTeam;
  }

  const winningTeamId = getTeamId(winningTeam);
  if (winningTeamId == null) return null;

  return teams.find(team => String(getTeamId(team)) === String(winningTeamId)) || null;
};

export const playerBelongsToTeam = (player, team) => {
  const playerTeamId = getPlayerWinningTeamId(player);
  const teamId = getTeamId(team);
  return playerTeamId != null && teamId != null && String(playerTeamId) === String(teamId);
};
