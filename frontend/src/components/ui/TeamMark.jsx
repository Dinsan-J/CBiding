import React from 'react';

export const TeamMark = ({ team, className = '' }) => {
  if (team?.logoUrl) {
    return <img src={team.logoUrl} alt={`${team.name || team.shortName || 'Team'} logo`} className={`${className} object-cover`} />;
  }
  return (
    <span className={className} style={{ backgroundColor: team?.primaryColor || '#06B6D4' }}>
      {team?.shortName || 'TM'}
    </span>
  );
};
