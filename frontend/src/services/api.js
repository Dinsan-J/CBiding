// BidX API Client Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bidx-backend-gepi.onrender.com/api';

const getAuthToken = () => {
  try {
    const session = localStorage.getItem('bidx_admin_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token;
    }
  } catch {
    return null;
  }
  return null;
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server request failed');
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
};

export const api = {
  // Auth
  login: (identifier, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),

  getMe: () => request('/auth/me'),

  // Auctions
  getAuctions: () => request('/auctions'),
  getAuctionBySlug: (slug) => request(`/auctions/${slug}`),
  getPublicBroadcast: (slug) => request(`/auctions/public/${slug}`),
  createAuction: (data) => 
    request('/auctions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAuction: (id, data) => 
    request(`/auctions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateAuctionStatus: (id, status) => 
    request(`/auctions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // Teams
  getTeams: (auctionId) => request(`/teams/auction/${auctionId}`),
  createTeam: (data) => 
    request('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTeam: (id, data) => 
    request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Players
  getPlayers: (auctionId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/players/auction/${auctionId}${query ? `?${query}` : ''}`);
  },
  createPlayer: (data) => 
    request('/players', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  registerSelf: (slug, data) => 
    request(`/players/register/${slug}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getRegistrations: (auctionId) => request(`/players/registrations/${auctionId}`),
  reviewRegistration: (id, data) => 
    request(`/players/registrations/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Live Auction Cockpit
  getLiveState: (auctionId) => request(`/live/${auctionId}/state`),
  selectLot: (auctionId, playerId) => 
    request(`/live/${auctionId}/select-lot`, {
      method: 'POST',
      body: JSON.stringify({ playerId })
    }),
  placeBid: (auctionId, data) => 
    request(`/live/${auctionId}/bid`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  hammerSold: (auctionId) => 
    request(`/live/${auctionId}/sold`, {
      method: 'POST'
    }),
  hammerUnsold: (auctionId) => 
    request(`/live/${auctionId}/unsold`, {
      method: 'POST'
    })
};
