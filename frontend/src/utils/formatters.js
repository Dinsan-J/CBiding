// Formatting utilities for Cricket Auction Platform

/**
 * Format currency amount based on selected notation (South Asian Lakhs/Crores or Standard Millions)
 * @param {number} amount
 * @param {string} currency - 'LKR', 'USD', 'INR', 'POINTS'
 * @param {'SOUTH_ASIAN' | 'STANDARD'} notation
 */
export function formatCurrency(amount, currency = 'LKR', notation = 'SOUTH_ASIAN') {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  
  if (currency === 'POINTS') {
    return `${amount.toLocaleString()} Pts`;
  }

  const prefix = currency === 'LKR' ? 'LKR ' : `${currency} `;

  if (notation === 'SOUTH_ASIAN') {
    if (amount >= 10000000) {
      const crores = (amount / 10000000).toFixed(2);
      return `${prefix}${crores.endsWith('.00') ? crores.slice(0, -3) : crores} Cr`;
    }
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(2);
      return `${prefix}${lakhs.endsWith('.00') ? lakhs.slice(0, -3) : lakhs} Lakh`;
    }
  } else {
    if (amount >= 1000000) {
      const millions = (amount / 1000000).toFixed(2);
      return `${prefix}${millions.endsWith('.00') ? millions.slice(0, -3) : millions} M`;
    }
    if (amount >= 1000) {
      const thousands = (amount / 1000).toFixed(1);
      return `${prefix}${thousands.endsWith('.0') ? thousands.slice(0, -2) : thousands} K`;
    }
  }

  return `${prefix}${amount.toLocaleString()}`;
}

/**
 * Format full exact number with thousands commas (e.g., LKR 12,500,000)
 */
export function formatExactCurrency(amount, currency = 'LKR') {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  if (currency === 'POINTS') return `${amount.toLocaleString()} Pts`;
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Map cricket roles to human readable strings
 */
export const CRICKET_ROLES = {
  TOP_ORDER_BATTER: 'Top-order Batter',
  MIDDLE_ORDER_BATTER: 'Middle-order Batter',
  WICKETKEEPER_BATTER: 'Wicketkeeper Batter',
  PACE_ALL_ROUNDER: 'Pace All-rounder',
  SPIN_ALL_ROUNDER: 'Spin All-rounder',
  FAST_BOWLER: 'Fast Bowler',
  SPIN_BOWLER: 'Spin Bowler'
};

export function getRoleLabel(roleKey) {
  return CRICKET_ROLES[roleKey] || roleKey || 'Player';
}

/**
 * Color classes for cricket roles
 */
export function getRoleBadgeClass(roleKey) {
  switch (roleKey) {
    case 'TOP_ORDER_BATTER':
    case 'MIDDLE_ORDER_BATTER':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'WICKETKEEPER_BATTER':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'PACE_ALL_ROUNDER':
    case 'SPIN_ALL_ROUNDER':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'FAST_BOWLER':
    case 'SPIN_BOWLER':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
