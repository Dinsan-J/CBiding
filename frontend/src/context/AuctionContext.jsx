import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket, joinAuctionRoom, leaveAuctionRoom } from '../services/socket';

const AuctionContext = createContext(null);
const normalizeAuction = auction => ({
  ...auction,
  id: auction._id || auction.id,
  currency: auction.type === 'POINTS' ? 'POINTS' : (auction.currency || 'LKR')
});

export const AuctionProvider = ({ children }) => {
  // Tournaments State
  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentIdState] = useState(null);
  const [auctionDbId, setAuctionDbId] = useState(null);

  // Loading state for live backend data (prevents flashing mock data on refresh)
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  // Teams & Players State
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const auctionIdRef = useRef(auctionDbId);
  useEffect(() => { auctionIdRef.current = auctionDbId; }, [auctionDbId]);

  // Active Live Lot Engine State
  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || {};

  // Available un-auctioned players — UNSOLD excluded until explicitly re-queued
  const availablePlayers = players.filter(p => 
    p.status !== 'SOLD' && 
    p.status !== 'RETAINED' && 
    p.status !== 'UNSOLD' &&
    !p.winningTeamId && 
    !p.isFixedPlayer
  );

  const initialLivePlayer = players.find(p => p.status === 'LIVE' && p.status !== 'SOLD' && !p.winningTeamId) 
    || availablePlayers[0] 
    || null;

  const [activeLot, setActiveLot] = useState({
    playerId: initialLivePlayer?.id || initialLivePlayer?._id || null,
    currentBid: initialLivePlayer?.basePrice || 0,
    highestBidderTeamId: null,
    bidCount: 0,
    timerSeconds: 30,
    isTimerRunning: false,
    bidHistory: []
  });

  // Sold Celebration Trigger State
  const [soldEvent, setSoldEvent] = useState({
    isOpen: false,
    player: null,
    team: null,
    finalBid: 0
  });

  // Active Lot Player Object - strictly resolve active lot or live player, NEVER a sold or retained player
  // Use String() conversion everywhere to prevent ObjectId vs string mismatches
  const currentLotPlayer = activeLot.playerId
    ? (players.find(p =>
        (String(p.id) === String(activeLot.playerId) || String(p._id) === String(activeLot.playerId)) &&
        p.status !== 'SOLD' && p.status !== 'RETAINED' && !p.winningTeamId
      ) || null)
    : (players.find(p => p.status === 'LIVE' && p.status !== 'SOLD' && !p.winningTeamId) || null);

  const currentHighestTeam = teams.find(t => String(t.id) === String(activeLot.highestBidderTeamId) || String(t._id) === String(activeLot.highestBidderTeamId));

  // Timer Tick Engine
  useEffect(() => {
    let ticker = null;
    if (activeLot.isTimerRunning && activeLot.timerSeconds > 0) {
      ticker = setInterval(() => {
        setActiveLot(prev => ({
          ...prev,
          timerSeconds: Math.max(0, prev.timerSeconds - 1)
        }));
      }, 1000);
    } else if (activeLot.timerSeconds === 0 && activeLot.isTimerRunning) {
      setActiveLot(prev => ({ ...prev, isTimerRunning: false }));
    }
    return () => clearInterval(ticker);
  }, [activeLot.isTimerRunning, activeLot.timerSeconds]);

  // Fetch Registrations from Backend
  const fetchRegistrations = useCallback(async (targetAuctionId) => {
    const id = targetAuctionId || auctionIdRef.current;
    if (!id) return;
    try {
      const res = await api.getRegistrations(id);
      if (res?.success && Array.isArray(res.data)) {
        setRegistrations(res.data.map(r => ({
          ...r,
          id: r._id,
          matches: r.stats?.matches || 0,
          runs: r.stats?.runs || 0,
          wickets: r.stats?.wickets || 0
        })));
      }
    } catch (err) {
      console.warn('[BidX Context] Could not fetch registrations from server:', err.message);
    }
  }, []);

  const setActiveTournamentId = useCallback(async (id) => {
    if (!id) return;
    setActiveTournamentIdState(id);
    setAuctionDbId(id);
    setTeams([]);
    setPlayers([]);
    setRegistrations([]);
    setActiveLot({ playerId: null, currentBid: 0, highestBidderTeamId: null, bidCount: 0, timerSeconds: 30, isTimerRunning: false, bidHistory: [] });
    setIsLiveLoading(true);
    try {
      const result = await api.getLiveState(id);
      if (!result?.success || !result.data?.auction) throw new Error(result?.error || 'Could not load the selected auction.');
      const { auction, teams: loadedTeams = [], queuedPlayers = [], soldPlayers = [], unsoldPlayers = [] } = result.data;
      setTournaments(prev => prev.map(t => String(t._id || t.id) === String(id) ? { ...t, ...normalizeAuction(auction) } : t));
      setTeams(loadedTeams.map(team => ({ ...team, id: team._id })));
      const uniquePlayers = new Map();
      [...queuedPlayers, ...soldPlayers, ...unsoldPlayers].forEach(player => uniquePlayers.set(String(player._id), { ...player, id: player._id }));
      const activePlayer = auction.currentLot?.playerId;
      if (activePlayer?._id) uniquePlayers.set(String(activePlayer._id), { ...activePlayer, id: activePlayer._id });
      setPlayers([...uniquePlayers.values()]);
      const highestTeam = auction.currentLot?.highestBidderTeamId;
      setActiveLot({
        playerId: activePlayer?._id || activePlayer || null,
        currentBid: auction.currentLot?.currentBid || activePlayer?.basePrice || 0,
        highestBidderTeamId: highestTeam?._id || highestTeam || null,
        bidCount: auction.currentLot?.bidCount || 0,
        timerSeconds: auction.timerSeconds || 30,
        isTimerRunning: Boolean(auction.currentLot?.isTimerRunning),
        bidHistory: []
      });
      await fetchRegistrations(id);
    } catch (error) {
      console.error('[BidX Context] Could not activate tournament:', error.message);
      throw error;
    } finally {
      setIsLiveLoading(false);
    }
  }, [fetchRegistrations]);

  // Live Backend Data Synchronization
  useEffect(() => {
    let isMounted = true;

    // MAX skeleton wait = 2.5s — after that show the page regardless of backend speed.
    // The API response will still update state live when it eventually arrives (Render cold start).
    const skeletonTimeout = setTimeout(() => {
      if (isMounted) setIsLiveLoading(false);
    }, 2500);

    const fetchLiveData = async () => {
      try {
        let res;
        try {
          const privateAuctions = await api.getAuctions();
          if (privateAuctions?.data?.length) {
            const list = privateAuctions.data.map(normalizeAuction);
            setTournaments(list);
            await setActiveTournamentId(list[0]._id);
            return;
          }
        } catch {
          // Public viewers have no organiser session; load the configured public auction below.
        }
        const publicSlug = import.meta.env.VITE_PUBLIC_AUCTION_SLUG || 'cpl-2026';
        res = await api.getPublicBroadcast(publicSlug);
        if (isMounted && res?.success && res.data) {
          const { auction, teams: liveTeams, players: livePlayers } = res.data;
          if (auction?._id) {
            setAuctionDbId(auction._id);
          }
          if (auction) {
            const tournament = normalizeAuction(auction);
            setTournaments([tournament]);
            setActiveTournamentIdState(auction._id);
          }
          if (Array.isArray(liveTeams)) {
            setTeams(liveTeams.map(t => ({
              ...t,
              id: t._id,
              shortName: t.shortName,
              ownerName: t.ownerName
            })));
          }
          if (Array.isArray(livePlayers)) {
            setPlayers(livePlayers.map(p => ({
              ...p,
              id: p._id,
              fullName: p.fullName
            })));
          }
          if (auction?.currentLot?.playerId) {
            // Always use String() to avoid Mongoose ObjectId vs plain string mismatch
            const rawPId = auction.currentLot.playerId?._id || auction.currentLot.playerId;
            const curPId = String(rawPId);
            const pObj = livePlayers?.find(p => String(p._id) === curPId || String(p.id) === curPId);
            if (pObj && (pObj.status === 'SOLD' || pObj.status === 'RETAINED' || pObj.winningTeamId)) {
              // Player is already sold/retained — clear the active lot
              setActiveLot(prev => ({
                ...prev,
                playerId: null,
                currentBid: 0,
                highestBidderTeamId: null,
                bidCount: 0,
                isTimerRunning: false,
                bidHistory: []
              }));
            } else {
              // Active player is legitimately on stage — set the lot with string IDs
              const hBidTeamRaw = auction.currentLot.highestBidderTeamId?._id || auction.currentLot.highestBidderTeamId;
              setActiveLot(prev => ({
                ...prev,
                playerId: curPId,
                currentBid: auction.currentLot.currentBid || (pObj?.basePrice || 0),
                highestBidderTeamId: hBidTeamRaw ? String(hBidTeamRaw) : null,
                bidCount: auction.currentLot.bidCount || 0,
                isTimerRunning: auction.currentLot.isTimerRunning || false
              }));
              // Also ensure the LIVE player appears in players list (handles newly added players)
              if (pObj) {
                const updatedPObj = { ...pObj, id: curPId, status: pObj.status === 'QUEUED' ? 'LIVE' : pObj.status };
                setPlayers(prev => {
                  const exists = prev.some(p => String(p._id) === curPId || String(p.id) === curPId);
                  if (exists) return prev.map(p => (String(p._id) === curPId || String(p.id) === curPId) ? { ...p, ...updatedPObj } : p);
                  return [updatedPObj, ...prev];
                });
              }
            }
          } else if (!auction?.currentLot?.playerId && auction?.status === 'LIVE') {
            // Auction is LIVE but no current lot — clear stale lot state
            setActiveLot(prev => ({
              ...prev,
              playerId: null,
              currentBid: 0,
              highestBidderTeamId: null,
              bidCount: 0,
              isTimerRunning: false,
              bidHistory: []
            }));
          }

          // Also fetch backend registrations
          if (auction?._id) {
            fetchRegistrations(auction._id);
          }
        }
      } catch (err) {
        console.warn('[BidX Context] Could not load auction data:', err.message);
      } finally {
        // Clear loading regardless — skeletonTimeout may have already done this
        if (isMounted) setIsLiveLoading(false);
      }
    };
    fetchLiveData();
    window.addEventListener('bidx:auth-changed', fetchLiveData);
    return () => {
      isMounted = false;
      clearTimeout(skeletonTimeout);
      window.removeEventListener('bidx:auth-changed', fetchLiveData);
    };
  }, [fetchRegistrations, setActiveTournamentId]);

  // Dynamic Socket.IO Room Management
  useEffect(() => {
    const socket = getSocket();
    const auctionRoomId = auctionDbId;
    if (!auctionRoomId) return;
    joinAuctionRoom(auctionRoomId);

    // 1. Live Bid Placed
    socket.on('bid_placed', ({ bid, team, player }) => {
      const teamId = String(team._id || team.id);
      setActiveLot(prev => ({
        ...prev,
        currentBid: bid.amount,
        highestBidderTeamId: teamId,
        bidCount: bid.bidSequence || prev.bidCount + 1,
        timerSeconds: 30,
        isTimerRunning: true,
        bidHistory: [
          {
            id: bid._id || Date.now(),
            teamId,
            amount: bid.amount,
            timestamp: new Date(bid.timestamp || Date.now()).toLocaleTimeString()
          },
          ...prev.bidHistory
        ]
      }));
    });

    // 2. Lot Hammer SOLD
    socket.on('lot_sold', ({ player, team, acquisition, nextPlayer }) => {
      const winningPrice = acquisition?.finalBidAmount || activeLot.currentBid;
      const teamId = String(team?._id || team?.id || '');
      const playerId = String(player?._id || player?.id || '');

      setSoldEvent({
        isOpen: true,
        player,
        team,
        finalBid: winningPrice
      });

      setPlayers(prev => prev.map(p =>
        (String(p.id) === playerId || String(p._id) === playerId)
          ? { ...p, status: 'SOLD', winningTeamId: teamId, finalPrice: winningPrice }
          : p
      ));

      if (teamId) {
        setTeams(prev => prev.map(t =>
          (String(t.id) === teamId || String(t._id) === teamId)
            ? {
                ...t,
                remainingPurse: t.remainingPurse - winningPrice,
                totalSpent: t.totalSpent + winningPrice,
                squadCount: t.squadCount + 1
              }
            : t
        ));
      }

      if (nextPlayer) {
        const nextId = String(nextPlayer._id || nextPlayer.id);
        setActiveLot({
          playerId: nextId,
          currentBid: nextPlayer.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: 30,
          isTimerRunning: false,
          bidHistory: []
        });
        setPlayers(prev => {
          const exists = prev.some(p => String(p._id) === nextId || String(p.id) === nextId);
          const updated = prev.map(p => {
            const pId = String(p._id || p.id);
            if (pId === nextId) return { ...p, ...nextPlayer, id: nextId, status: 'LIVE' };
            if (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED') return { ...p, status: 'QUEUED' };
            return p;
          });
          if (!exists) return [{ ...nextPlayer, id: nextId, status: 'LIVE' }, ...updated];
          return updated;
        });
      } else {
        setActiveLot(prev => ({
          ...prev,
          playerId: null,
          currentBid: 0,
          highestBidderTeamId: null,
          bidCount: 0,
          isTimerRunning: false,
          bidHistory: []
        }));
      }
    });

    // 3. Lot Hammer UNSOLD
    socket.on('lot_unsold', ({ player, nextPlayer }) => {
      const playerId = String(player?._id || player?.id || '');
      if (playerId) {
        setPlayers(prev => prev.map(p =>
          (String(p.id) === playerId || String(p._id) === playerId) ? { ...p, status: 'UNSOLD' } : p
        ));
      }

      if (nextPlayer) {
        const nextId = String(nextPlayer._id || nextPlayer.id);
        setActiveLot({
          playerId: nextId,
          currentBid: nextPlayer.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: 30,
          isTimerRunning: false,
          bidHistory: []
        });
        setPlayers(prev => {
          const exists = prev.some(p => String(p._id) === nextId || String(p.id) === nextId);
          const updated = prev.map(p => {
            const pId = String(p._id || p.id);
            if (pId === nextId) return { ...p, ...nextPlayer, id: nextId, status: 'LIVE' };
            if (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED') return { ...p, status: 'QUEUED' };
            return p;
          });
          if (!exists) return [{ ...nextPlayer, id: nextId, status: 'LIVE' }, ...updated];
          return updated;
        });
      } else {
        setActiveLot(prev => ({
          ...prev,
          playerId: null,
          currentBid: 0,
          highestBidderTeamId: null,
          bidCount: 0,
          isTimerRunning: false,
          bidHistory: []
        }));
      }
    });

    // 4. Next Lot Selected
    socket.on('lot_selected', ({ player }) => {
      if (!player) return;
      const playerId = String(player._id || player.id);
      setActiveLot({
        playerId,
        currentBid: player.basePrice || 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: 30,
        isTimerRunning: false,
        bidHistory: []
      });
      setPlayers(prev => {
        const exists = prev.some(p => String(p._id) === playerId || String(p.id) === playerId);
        const updated = prev.map(p => {
          const pId = String(p._id || p.id);
          if (pId === playerId) return { ...p, ...player, id: playerId, status: 'LIVE' };
          if (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED') return { ...p, status: 'QUEUED' };
          return p;
        });
        // If this is a brand-new player not yet in the local list, add it
        if (!exists) return [{ ...player, id: playerId, status: 'LIVE' }, ...updated];
        return updated;
      });
    });

    // 5. Bid Undone
    socket.on('bid_undone', ({ auction }) => {
      if (auction?.currentLot) {
        setActiveLot(prev => ({
          ...prev,
          currentBid: auction.currentLot.currentBid,
          highestBidderTeamId: auction.currentLot.highestBidderTeamId?._id || auction.currentLot.highestBidderTeamId,
          bidCount: auction.currentLot.bidCount,
          bidHistory: prev.bidHistory.slice(1)
        }));
      }
    });

    // 6. Fixed / Retained Player Assigned
    socket.on('fixed_player_assigned', ({ player, team }) => {
      const tId = team._id || team.id;
      const pId = player._id || player.id;
      setTeams(prev => prev.map(t => (t.id === tId || t._id === tId) ? { ...t, ...team, id: tId } : t));
      setPlayers(prev => {
        const exists = prev.some(p => p.id === pId || p._id === pId);
        if (exists) {
          return prev.map(p => (p.id === pId || p._id === pId) ? { ...p, ...player, id: pId } : p);
        } else {
          return [{ ...player, id: pId }, ...prev];
        }
      });
    });

    // 7. Fixed / Retained Player Removed
    socket.on('fixed_player_removed', ({ player, team }) => {
      const tId = team._id || team.id;
      const pId = player._id || player.id;
      setTeams(prev => prev.map(t => (t.id === tId || t._id === tId) ? { ...t, ...team, id: tId } : t));
      setPlayers(prev => prev.map(p => (p.id === pId || p._id === pId) ? { ...p, ...player, id: pId } : p));
    });

    return () => {
      leaveAuctionRoom(auctionRoomId);
      socket.off('bid_placed');
      socket.off('lot_sold');
      socket.off('lot_unsold');
      socket.off('lot_selected');
      socket.off('bid_undone');
      socket.off('fixed_player_assigned');
      socket.off('fixed_player_removed');
    };
  }, [auctionDbId]);

  // Action: Place Bid (Instant Optimistic UI Update + Authoritative Backend Execution)
  const placeBid = useCallback(async (teamId, amount) => {
    const team = teams.find(t => t.id === teamId || t._id === teamId);
    if (!team) return { success: false, reason: "Team not found" };

    const targetPlayerId = activeLot.playerId || currentLotPlayer?.id || currentLotPlayer?._id;
    if (!targetPlayerId) return { success: false, reason: "No active player lot on stage." };

    const teamKey = team._id || team.id;
    const timeStr = new Date().toLocaleTimeString();
    const tempBidId = `opt-${Date.now()}`;

    // 1. Snapshot previous state for instant rollback if server rejects
    let rollbackSnapshot = null;

    // 2. INSTANT OPTIMISTIC UI UPDATE (0ms LATENCY)
    setActiveLot(prev => {
      rollbackSnapshot = prev;
      return {
        ...prev,
        currentBid: amount,
        highestBidderTeamId: teamKey,
        bidCount: prev.bidCount + 1,
        timerSeconds: activeTournament.timerSeconds || 30,
        isTimerRunning: true,
        bidHistory: [
          { id: tempBidId, teamId: teamKey, amount, timestamp: timeStr },
          ...prev.bidHistory
        ]
      };
    });

    // 3. Dispatch to backend authoritative auction engine
    try {
      const res = await api.placeBid(auctionDbId, {
        playerId: targetPlayerId,
        teamId: teamKey,
        amount
      });

      if (res?.success && res.data) {
        const serverBid = res.data.bid;
        setActiveLot(prev => ({
          ...prev,
          bidCount: serverBid?.bidSequence || prev.bidCount,
          bidHistory: prev.bidHistory.map(b => 
            b.id === tempBidId 
              ? { ...b, id: serverBid?._id || b.id } 
              : b
          )
        }));
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      console.warn('[BidX Engine] Backend rejected bid:', err.message);
      if (rollbackSnapshot) {
        setActiveLot(rollbackSnapshot);
      }
      return { success: false, reason: err.message };
    }
  }, [teams, activeLot.playerId, currentLotPlayer, auctionDbId, activeTournament.timerSeconds]);

  // Action: Hammer SOLD (Authoritative Backend Execution)
  const hammerSold = useCallback(async () => {
    if (!currentLotPlayer) return;

    if (!currentHighestTeam || !activeLot.highestBidderTeamId || activeLot.currentBid <= 0) {
      // If no bids placed, hammer as UNSOLD instead of failing
      return await hammerUnsold();
    }

    try {
      const res = await api.hammerSold(auctionDbId);
      const winningPrice = activeLot.currentBid;
      const winningTeamId = currentHighestTeam.id || currentHighestTeam._id;

      // Update Player Status to SOLD
      setPlayers(prev => prev.map(p => 
        (p.id === currentLotPlayer.id || p._id === currentLotPlayer.id)
          ? { ...p, status: 'SOLD', winningTeamId, finalPrice: winningPrice, soldAt: new Date().toISOString() }
          : p
      ));

      // Update Team Purse & Squad Count
      setTeams(prev => prev.map(t => 
        (t.id === winningTeamId || t._id === winningTeamId)
          ? {
              ...t,
              remainingPurse: t.remainingPurse - winningPrice,
              totalSpent: t.totalSpent + winningPrice,
              squadCount: t.squadCount + 1,
              overseasCount: currentLotPlayer.isOverseas ? t.overseasCount + 1 : t.overseasCount
            }
          : t
      ));

      // Open SOLD Celebration overlay
      setSoldEvent({
        isOpen: true,
        player: currentLotPlayer,
        team: currentHighestTeam,
        finalBid: winningPrice
      });

      // IMMEDIATELY ADVANCE TO NEXT RANDOM AVAILABLE LOT
      const nextPlayer = res?.data?.nextPlayer;
      if (nextPlayer) {
        const nextId = nextPlayer._id || nextPlayer.id;
        setPlayers(prev => prev.map(p => 
          (p.id === nextId || p._id === nextId) 
            ? { ...p, status: 'LIVE' } 
            : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
        ));
        setActiveLot({
          playerId: nextId,
          currentBid: nextPlayer.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: false,
          bidHistory: []
        });
      } else {
        const remaining = players.filter(p => 
          p.status !== 'SOLD' && 
          p.status !== 'RETAINED' && 
          !p.winningTeamId && 
          !p.isFixedPlayer && 
          p.id !== currentLotPlayer.id && 
          p._id !== currentLotPlayer.id
        );
        if (remaining.length > 0) {
          const randomIndex = Math.floor(Math.random() * remaining.length);
          const nextRnd = remaining[randomIndex];
          const nextId = nextRnd._id || nextRnd.id;
          setPlayers(prev => prev.map(p => 
            (p.id === nextId || p._id === nextId) 
              ? { ...p, status: 'LIVE' } 
              : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
          ));
          setActiveLot({
            playerId: nextId,
            currentBid: nextRnd.basePrice || 0,
            highestBidderTeamId: null,
            bidCount: 0,
            timerSeconds: activeTournament.timerSeconds || 30,
            isTimerRunning: false,
            bidHistory: []
          });
        } else {
          setActiveLot(prev => ({
            ...prev,
            playerId: null,
            isTimerRunning: false,
            currentBid: 0,
            highestBidderTeamId: null,
            bidCount: 0,
            bidHistory: []
          }));
        }
      }
    } catch (err) {
      console.error('[BidX Engine] Failed to hammer sold:', err.message);
      alert(`Hammer Sold failed: ${err.message}`);
    }
  }, [currentLotPlayer, currentHighestTeam, activeLot.currentBid, activeLot.highestBidderTeamId, players, auctionDbId, activeTournament.timerSeconds]);

  // Action: Hammer UNSOLD (Authoritative Backend Execution)
  const hammerUnsold = useCallback(async () => {
    if (!currentLotPlayer) return;

    try {
      const res = await api.hammerUnsold(auctionDbId);
      setPlayers(prev => prev.map(p => 
        (p.id === currentLotPlayer.id || p._id === currentLotPlayer.id) ? { ...p, status: 'UNSOLD' } : p
      ));

      // IMMEDIATELY ADVANCE TO NEXT RANDOM AVAILABLE LOT
      const nextPlayer = res?.data?.nextPlayer;
      if (nextPlayer) {
        const nextId = nextPlayer._id || nextPlayer.id;
        setPlayers(prev => prev.map(p => 
          (p.id === nextId || p._id === nextId) 
            ? { ...p, status: 'LIVE' } 
            : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
        ));
        setActiveLot({
          playerId: nextId,
          currentBid: nextPlayer.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: false,
          bidHistory: []
        });
      } else {
        const remaining = players.filter(p => 
          p.status !== 'SOLD' && 
          p.status !== 'RETAINED' && 
          !p.winningTeamId && 
          !p.isFixedPlayer && 
          p.id !== currentLotPlayer.id && 
          p._id !== currentLotPlayer.id
        );
        if (remaining.length > 0) {
          const randomIndex = Math.floor(Math.random() * remaining.length);
          const nextRnd = remaining[randomIndex];
          const nextId = nextRnd._id || nextRnd.id;
          setPlayers(prev => prev.map(p => 
            (p.id === nextId || p._id === nextId) 
              ? { ...p, status: 'LIVE' } 
              : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
          ));
          setActiveLot({
            playerId: nextId,
            currentBid: nextRnd.basePrice || 0,
            highestBidderTeamId: null,
            bidCount: 0,
            timerSeconds: activeTournament.timerSeconds || 30,
            isTimerRunning: false,
            bidHistory: []
          });
        } else {
          setActiveLot(prev => ({
            ...prev,
            playerId: null,
            isTimerRunning: false,
            currentBid: 0,
            highestBidderTeamId: null,
            bidCount: 0,
            bidHistory: []
          }));
        }
      }
    } catch (err) {
      console.error('[BidX Engine] Failed to hammer unsold:', err.message);
      alert(`Hammer Unsold failed: ${err.message}`);
    }
  }, [currentLotPlayer, players, auctionDbId, activeTournament.timerSeconds]);

  // Action: Select Specific Player onto live block (Authoritative Backend Execution)
  const selectPlayerLot = useCallback(async (playerId) => {
    const targetPlayer = players.find(p => p.id === playerId || p._id === playerId);
    if (!targetPlayer) return;

    try {
      await api.selectLot(auctionDbId, targetPlayer._id || targetPlayer.id);

      setPlayers(prev => prev.map(p => 
        (p.id === playerId || p._id === playerId) 
          ? { ...p, status: 'LIVE' } 
          : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
      ));

      setActiveLot({
        playerId: targetPlayer.id || targetPlayer._id,
        currentBid: targetPlayer.basePrice || 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: activeTournament.timerSeconds || 30,
        isTimerRunning: false,
        bidHistory: []
      });
    } catch (err) {
      console.warn('[BidX Engine] Live select lot error:', err.message);
      setActiveLot({
        playerId: targetPlayer.id || targetPlayer._id,
        currentBid: targetPlayer.basePrice || 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: activeTournament.timerSeconds || 30,
        isTimerRunning: false,
        bidHistory: []
      });
    }
  }, [players, auctionDbId, activeTournament.timerSeconds]);

  // Action: Select Next Random Lot onto live block
  const selectRandomLot = useCallback(async () => {
    try {
      const res = await api.selectRandomLot(auctionDbId);
      if (res?.success && res.data?.player) {
        const nextPlayer = res.data.player;
        const nextId = nextPlayer._id || nextPlayer.id;
        setPlayers(prev => prev.map(p => 
          (p.id === nextId || p._id === nextId) 
            ? { ...p, status: 'LIVE' } 
            : (p.status === 'LIVE' && p.status !== 'SOLD' && p.status !== 'RETAINED' ? { ...p, status: 'QUEUED' } : p)
        ));
        setActiveLot({
          playerId: nextId,
          currentBid: nextPlayer.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: false,
          bidHistory: []
        });
        return { success: true, player: nextPlayer };
      } else {
        const remaining = players.filter(p => 
          p.status !== 'SOLD' && 
          p.status !== 'RETAINED' && 
          !p.winningTeamId && 
          !p.isFixedPlayer && 
          p.id !== currentLotPlayer?.id && 
          p._id !== currentLotPlayer?.id
        );
        if (remaining.length > 0) {
          const randomIndex = Math.floor(Math.random() * remaining.length);
          const nextRnd = remaining[randomIndex];
          const nextId = nextRnd._id || nextRnd.id;
          return await selectPlayerLot(nextId);
        }
        return { success: false, reason: "No more un-auctioned players available." };
      }
    } catch (err) {
      console.error('[BidX Engine] Failed to select random lot:', err.message);
      return { success: false, reason: err.message };
    }
  }, [auctionDbId, players, currentLotPlayer, selectPlayerLot, activeTournament.timerSeconds]);

  // Action: Undo Last Bid (Authoritative Backend Execution)
  const undoLastBid = useCallback(async () => {
    try {
      await api.undoBid(auctionDbId);
    } catch (err) {
      console.warn('[BidX Engine] Undo bid API warning:', err.message);
    }

    if (activeLot.bidHistory.length === 0) return;
    const history = [...activeLot.bidHistory];
    history.shift();
    const previous = history[0];

    setActiveLot(prev => ({
      ...prev,
      currentBid: previous ? previous.amount : currentLotPlayer?.basePrice || 0,
      highestBidderTeamId: previous ? previous.teamId : null,
      bidCount: Math.max(0, prev.bidCount - 1),
      bidHistory: history
    }));
  }, [auctionDbId, activeLot.bidHistory, currentLotPlayer]);

  // Action: Re-queue Unsold player
  const reQueueUnsold = useCallback(async (playerId) => {
    try {
      await api.updatePlayer(playerId, { status: 'QUEUED' });
    } catch (err) {
      console.warn('[BidX Engine] Requeue API warning:', err.message);
    }
    setPlayers(prev => prev.map(p => 
      (p.id === playerId || p._id === playerId) ? { ...p, status: 'QUEUED' } : p
    ));
  }, []);

  // Action: Submit Public Player Registration
  const registerPlayer = useCallback(async (registrationData, slug = 'cpl-2026') => {
    try {
      const res = await api.registerSelf(slug, registrationData);
      if (res?.success && res.data) {
        const newReg = {
          ...res.data,
          id: res.data._id,
          matches: res.data.stats?.matches || 0,
          runs: res.data.stats?.runs || 0,
          wickets: res.data.stats?.wickets || 0
        };
        setRegistrations(prev => [newReg, ...prev.filter(r => r.contactNumber !== newReg.contactNumber)]);
      }
      return res;
    } catch (err) {
      console.error('[BidX Context] Registration error:', err);
      throw err;
    }
  }, []);

  // Action: Review & Approve Registration
  const approveRegistration = useCallback(async (regId, basePrice, category) => {
    try {
      const res = await api.reviewRegistration(regId, {
        status: 'APPROVED',
        assignedBasePrice: Number(basePrice),
        assignedCategory: category
      });

      if (res?.success && res.data?.player) {
        const createdPlayer = {
          ...res.data.player,
          id: res.data.player._id
        };
        setPlayers(prev => [...prev, createdPlayer]);
      }

      setRegistrations(prev => prev.filter(r => r.id !== regId && r._id !== regId));
      return { success: true };
    } catch (err) {
      console.warn('[BidX Context] Registration review failed:', err.message);
      return { success: false, error: err.message };
    }
  }, [registrations, players.length, auctionDbId]);

  // Action: Reject Registration
  const rejectRegistration = useCallback(async (regId, reason = 'Application rejected by committee.') => {
    try {
      await api.reviewRegistration(regId, {
        status: 'REJECTED',
        rejectionReason: reason
      });
    } catch (err) {
      console.warn('[BidX Context] Reject registration API failed:', err.message);
    }
    setRegistrations(prev => prev.filter(r => r.id !== regId && r._id !== regId));
  }, []);

  // Action: Create Player directly into Auction Roster
  const createPlayer = useCallback(async (playerData) => {
    try {
      const res = await api.createPlayer({
        ...playerData,
        auctionId: auctionDbId
      });
      if (res?.success && res.data) {
        const newP = {
          ...res.data,
          id: res.data._id
        };
        setPlayers(prev => [...prev, newP]);
        return { success: true, player: newP };
      }
    } catch (err) {
      console.warn('[BidX Context] Create player API failed:', err.message);
      return { success: false, error: err.message };
    }
  }, [auctionDbId, players.length]);

  // Action: Add Tournament (Authoritative Backend Execution)
  const createTournament = useCallback(async (data) => {
    try {
      const res = await api.createAuction(data);
      if (res?.success && res.data) {
        const newTourn = {
          ...res.data,
          id: res.data._id
        };
        setTournaments(prev => [newTourn, ...prev]);
        return { success: true, tournament: newTourn };
      }
    } catch (err) {
      console.warn('[BidX Context] Create auction API failed:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Action: Update Tournament Status (Authoritative Backend Execution)
  const updateTournamentStatus = useCallback(async (auctionId, status) => {
    try {
      const res = await api.updateAuctionStatus(auctionId, status);
      if (res?.success) {
        setTournaments(prev => prev.map(t => (t.id === auctionId || t._id === auctionId) ? { ...t, status } : t));
        return { success: true };
      }
      return { success: false, error: res?.error || 'Failed to update status' };
    } catch (err) {
      console.warn('[BidX Context] Update tournament status failed:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Action: Delete Tournament (Authoritative Backend Execution)
  const deleteTournament = useCallback(async (auctionId) => {
    try {
      const res = await api.deleteAuction(auctionId);
      if (res?.success) {
        setTournaments(prev => prev.filter(t => t.id !== auctionId && t._id !== auctionId));
        return { success: true };
      }
      return { success: false, error: res?.error || 'Failed to delete auction' };
    } catch (err) {
      console.warn('[BidX Context] Delete tournament failed:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Action: Add Team (Authoritative Backend Execution)
  const createTeam = useCallback(async (data) => {
    try {
      const res = await api.createTeam({
        ...data,
        auctionId: auctionDbId
      });
      if (res?.success && res.data) {
        const newTeam = {
          ...res.data,
          id: res.data._id
        };
        setTeams(prev => [...prev, newTeam]);
        return { success: true, team: newTeam };
      }
    } catch (err) {
      console.warn('[BidX Context] Create team API failed:', err.message);
      return { success: false, error: err.message };
    }
  }, [auctionDbId]);

  // Action: Delete Team
  const deleteTeam = useCallback(async (teamId) => {
    try {
      await api.deleteTeam(teamId);
    } catch (err) {
      console.warn('[BidX Context] Delete team API error:', err.message);
    }
    setTeams(prev => prev.filter(t => t.id !== teamId && t._id !== teamId));
  }, []);

  // Action: Assign Fixed / Retained Player to Team
  const assignFixedPlayer = useCallback(async (teamId, payload) => {
    try {
      const res = await api.addFixedPlayer(teamId, payload);
      if (res?.success && res.data) {
        const { team: updatedTeam, player: updatedPlayer } = res.data;
        const tId = updatedTeam._id || updatedTeam.id;
        const pId = updatedPlayer._id || updatedPlayer.id;

        setTeams(prev => prev.map(t => (t.id === tId || t._id === tId) ? { ...t, ...updatedTeam, id: tId } : t));
        setPlayers(prev => {
          const exists = prev.some(p => p.id === pId || p._id === pId);
          if (exists) {
            return prev.map(p => (p.id === pId || p._id === pId) ? { ...p, ...updatedPlayer, id: pId } : p);
          } else {
            return [{ ...updatedPlayer, id: pId }, ...prev];
          }
        });

        return { success: true, team: updatedTeam, player: updatedPlayer, message: res.message };
      }
      return { success: false, error: res?.error || 'Failed to assign fixed player' };
    } catch (err) {
      console.error('[AuctionContext] assignFixedPlayer error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Action: Remove Fixed / Retained Player from Team
  const unassignFixedPlayer = useCallback(async (teamId, playerId) => {
    try {
      const res = await api.removeFixedPlayer(teamId, playerId);
      if (res?.success && res.data) {
        const { team: updatedTeam, player: updatedPlayer } = res.data;
        const tId = updatedTeam._id || updatedTeam.id;
        const pId = updatedPlayer._id || updatedPlayer.id;

        setTeams(prev => prev.map(t => (t.id === tId || t._id === tId) ? { ...t, ...updatedTeam, id: tId } : t));
        setPlayers(prev => prev.map(p => (p.id === pId || p._id === pId) ? { ...p, ...updatedPlayer, id: pId } : p));

        return { success: true, team: updatedTeam, player: updatedPlayer, message: res.message };
      }
      return { success: false, error: res?.error || 'Failed to remove fixed player' };
    } catch (err) {
      console.error('[AuctionContext] unassignFixedPlayer error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Action: Delete Player
  const deletePlayer = useCallback(async (playerId) => {
    try {
      await api.deletePlayer(playerId);
    } catch (err) {
      console.warn('[BidX Context] Delete player API error:', err.message);
    }
    setPlayers(prev => prev.filter(p => p.id !== playerId && p._id !== playerId));
  }, []);

  // Action: Bulk Import Players (Authoritative Backend Execution)
  const importPlayers = useCallback(async (file) => {
    if (!auctionDbId) return { success: false, error: 'Select an auction before importing players.' };
    try {
      const result = await api.importPlayers(file, auctionDbId);
      if (result?.success && result.data?.players) {
        const imported = result.data.players.map(player => ({ ...player, id: player._id }));
        setPlayers(prev => [...prev, ...imported]);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [auctionDbId]);

  return (
    <AuctionContext.Provider value={{
      tournaments,
      activeTournament,
      setActiveTournamentId,
      createTournament,
      updateTournamentStatus,
      deleteTournament,
      teams,
      createTeam,
      deleteTeam,
      assignFixedPlayer,
      unassignFixedPlayer,
      players,
      createPlayer,
      deletePlayer,
      importPlayers,
      registrations,
      fetchRegistrations,
      registerPlayer,
      approveRegistration,
      rejectRegistration,
      isLiveLoading,
      activeLot,
      currentLotPlayer,
      currentHighestTeam,
      placeBid,
      hammerSold,
      hammerUnsold,
      selectPlayerLot,
      selectRandomLot,
      undoLastBid,
      reQueueUnsold,
      toggleTimer: () => setActiveLot(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning })),
      resetTimer: (s = 30) => setActiveLot(prev => ({ ...prev, timerSeconds: s })),
      soldEvent,
      closeSoldModal: () => setSoldEvent(prev => ({ ...prev, isOpen: false }))
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error("useAuction must be used within an AuctionProvider");
  return context;
};
