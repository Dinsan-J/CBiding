import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getSocket, joinAuctionRoom, leaveAuctionRoom } from '../services/socket';
import { 
  INITIAL_TOURNAMENTS, 
  INITIAL_TEAMS, 
  INITIAL_PLAYERS, 
  INITIAL_REGISTRATIONS 
} from '../data/mockData';

const AuctionContext = createContext(null);

export const AuctionProvider = ({ children }) => {
  // Tournaments State
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
  const [activeTournamentId, setActiveTournamentId] = useState("tourn-cpl-2026");
  const [auctionDbId, setAuctionDbId] = useState("6af553972c9ef2619668f184");

  // Teams & Players State
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);

  // Active Live Lot Engine State
  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];
  const livePlayer = players.find(p => p.status === 'LIVE') || players.find(p => p.status === 'QUEUED') || players[0];

  const [activeLot, setActiveLot] = useState({
    playerId: livePlayer?.id,
    currentBid: livePlayer?.basePrice || 3500000,
    highestBidderTeamId: "team-cls",
    bidCount: 2,
    timerSeconds: 15,
    isTimerRunning: true,
    bidHistory: [
      { id: 1, teamId: "team-kfl", amount: 3500000, timestamp: "11:24:02" },
      { id: 2, teamId: "team-cls", amount: 3750000, timestamp: "11:24:18" }
    ]
  });

  // Sold Celebration Trigger State
  const [soldEvent, setSoldEvent] = useState({
    isOpen: false,
    player: null,
    team: null,
    finalBid: 0
  });

  // Active Lot Player Object
  const currentLotPlayer = players.find(p => p.id === activeLot.playerId) || livePlayer;
  const currentHighestTeam = teams.find(t => t.id === activeLot.highestBidderTeamId);

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
    const id = targetAuctionId || auctionDbId;
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
  }, [auctionDbId]);

  // Live Backend Data Synchronization
  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const res = await api.getPublicBroadcast('cpl-2026');
        if (isMounted && res?.success && res.data) {
          const { auction, teams: liveTeams, players: livePlayers } = res.data;
          if (auction?._id) {
            setAuctionDbId(auction._id);
          }
          if (liveTeams?.length > 0) {
            setTeams(liveTeams.map(t => ({
              ...t,
              id: t._id,
              shortName: t.shortName,
              ownerName: t.ownerName
            })));
          }
          if (livePlayers?.length > 0) {
            setPlayers(livePlayers.map(p => ({
              ...p,
              id: p._id,
              fullName: p.fullName
            })));
          }
          if (auction?.currentLot?.playerId) {
            setActiveLot(prev => ({
              ...prev,
              playerId: auction.currentLot.playerId._id || auction.currentLot.playerId,
              currentBid: auction.currentLot.currentBid,
              highestBidderTeamId: auction.currentLot.highestBidderTeamId?._id || auction.currentLot.highestBidderTeamId,
              bidCount: auction.currentLot.bidCount,
              isTimerRunning: auction.currentLot.isTimerRunning
            }));
          }

          // Also fetch backend registrations
          if (auction?._id) {
            fetchRegistrations(auction._id);
          }
        }
      } catch (err) {
        console.warn('[BidX Context] Running in offline fallback mode:', err.message);
      }
    };
    fetchLiveData();
    return () => { isMounted = false; };
  }, [fetchRegistrations]);

  // Dynamic Socket.IO Room Management
  useEffect(() => {
    const socket = getSocket();
    const auctionRoomId = auctionDbId || '6af553972c9ef2619668f184';
    joinAuctionRoom(auctionRoomId);

    // 1. Live Bid Placed
    socket.on('bid_placed', ({ bid, team, player }) => {
      setActiveLot(prev => ({
        ...prev,
        currentBid: bid.amount,
        highestBidderTeamId: team._id || team.id,
        bidCount: bid.bidSequence || prev.bidCount + 1,
        timerSeconds: 30,
        isTimerRunning: true,
        bidHistory: [
          {
            id: bid._id || Date.now(),
            teamId: team._id || team.id,
            amount: bid.amount,
            timestamp: new Date(bid.timestamp || Date.now()).toLocaleTimeString()
          },
          ...prev.bidHistory
        ]
      }));
    });

    // 2. Lot Hammer SOLD
    socket.on('lot_sold', ({ player, team, acquisition }) => {
      const winningPrice = acquisition?.finalBidAmount || activeLot.currentBid;
      const teamId = team._id || team.id;
      const playerId = player._id || player.id;

      setSoldEvent({
        isOpen: true,
        player,
        team,
        finalBid: winningPrice
      });

      setPlayers(prev => prev.map(p => 
        (p.id === playerId || p._id === playerId) 
          ? { ...p, status: 'SOLD', winningTeamId: teamId, finalPrice: winningPrice } 
          : p
      ));

      setTeams(prev => prev.map(t => 
        (t.id === teamId || t._id === teamId)
          ? {
              ...t,
              remainingPurse: t.remainingPurse - winningPrice,
              totalSpent: t.totalSpent + winningPrice,
              squadCount: t.squadCount + 1
            }
          : t
      ));
    });

    // 3. Lot Hammer UNSOLD
    socket.on('lot_unsold', ({ player }) => {
      const playerId = player._id || player.id;
      setPlayers(prev => prev.map(p => 
        (p.id === playerId || p._id === playerId) ? { ...p, status: 'UNSOLD' } : p
      ));
    });

    // 4. Next Lot Selected
    socket.on('lot_selected', ({ player }) => {
      const playerId = player._id || player.id;
      setActiveLot({
        playerId,
        currentBid: player.basePrice || 0,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: 30,
        isTimerRunning: false,
        bidHistory: []
      });
      setPlayers(prev => prev.map(p => 
        (p.id === playerId || p._id === playerId)
          ? { ...p, status: 'LIVE' }
          : (p.status === 'LIVE' ? { ...p, status: 'QUEUED' } : p)
      ));
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

    return () => {
      leaveAuctionRoom(auctionRoomId);
      socket.off('bid_placed');
      socket.off('lot_sold');
      socket.off('lot_unsold');
      socket.off('lot_selected');
      socket.off('bid_undone');
    };
  }, [auctionDbId]);

  // Action: Place Bid (Authoritative Backend Execution)
  const placeBid = useCallback(async (teamId, amount) => {
    const team = teams.find(t => t.id === teamId || t._id === teamId);
    if (!team) return { success: false, reason: "Team not found" };

    const targetPlayerId = activeLot.playerId || currentLotPlayer?.id || currentLotPlayer?._id;
    if (!targetPlayerId) return { success: false, reason: "No active player lot on stage." };

    try {
      const res = await api.placeBid(auctionDbId, {
        playerId: targetPlayerId,
        teamId: team._id || team.id,
        amount
      });

      if (res?.success && res.data) {
        const timeStr = new Date().toLocaleTimeString();
        setActiveLot(prev => ({
          ...prev,
          currentBid: amount,
          highestBidderTeamId: team._id || team.id,
          bidCount: prev.bidCount + 1,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: true,
          bidHistory: [
            { id: Date.now(), teamId: team._id || team.id, amount, timestamp: timeStr },
            ...prev.bidHistory
          ]
        }));
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      console.warn('[BidX Engine] Backend rejected bid:', err.message);
      return { success: false, reason: err.message };
    }
  }, [teams, activeLot.playerId, currentLotPlayer, auctionDbId, activeTournament.timerSeconds]);

  // Action: Hammer SOLD (Authoritative Backend Execution)
  const hammerSold = useCallback(async () => {
    if (!currentLotPlayer || !currentHighestTeam) return;

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

      // Advance to next queued player if available
      const nextQueued = players.find(p => p.status === 'QUEUED' && p.id !== currentLotPlayer.id && p._id !== currentLotPlayer.id);
      if (nextQueued) {
        setPlayers(prev => prev.map(p => (p.id === nextQueued.id || p._id === nextQueued.id) ? { ...p, status: 'LIVE' } : p));
        setActiveLot({
          playerId: nextQueued.id || nextQueued._id,
          currentBid: nextQueued.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: true,
          bidHistory: []
        });
      } else {
        setActiveLot(prev => ({ ...prev, isTimerRunning: false, currentBid: 0, highestBidderTeamId: null }));
      }
    } catch (err) {
      console.error('[BidX Engine] Failed to hammer sold:', err.message);
      alert(`Hammer Sold failed: ${err.message}`);
    }
  }, [currentLotPlayer, currentHighestTeam, activeLot.currentBid, players, auctionDbId, activeTournament.timerSeconds]);

  // Action: Hammer UNSOLD (Authoritative Backend Execution)
  const hammerUnsold = useCallback(async () => {
    if (!currentLotPlayer) return;

    try {
      await api.hammerUnsold(auctionDbId);
      setPlayers(prev => prev.map(p => 
        (p.id === currentLotPlayer.id || p._id === currentLotPlayer.id) ? { ...p, status: 'UNSOLD' } : p
      ));

      // Advance queue
      const nextQueued = players.find(p => p.status === 'QUEUED' && p.id !== currentLotPlayer.id && p._id !== currentLotPlayer.id);
      if (nextQueued) {
        setPlayers(prev => prev.map(p => (p.id === nextQueued.id || p._id === nextQueued.id) ? { ...p, status: 'LIVE' } : p));
        setActiveLot({
          playerId: nextQueued.id || nextQueued._id,
          currentBid: nextQueued.basePrice || 0,
          highestBidderTeamId: null,
          bidCount: 0,
          timerSeconds: activeTournament.timerSeconds || 30,
          isTimerRunning: true,
          bidHistory: []
        });
      } else {
        setActiveLot(prev => ({ ...prev, isTimerRunning: false, currentBid: 0, highestBidderTeamId: null }));
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
        (p.id === playerId || p._id === playerId) ? { ...p, status: 'LIVE' } : (p.status === 'LIVE' ? { ...p, status: 'QUEUED' } : p)
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
      // Fallback local update
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
      console.warn('[BidX Context] Review registration API failed, applying local fallback:', err.message);
      // Fallback local update
      const reg = registrations.find(r => r.id === regId || r._id === regId);
      if (reg) {
        const fallbackPlayer = {
          id: `ply-${Date.now()}`,
          auctionId: reg.auctionId || auctionDbId,
          lotNumber: players.length + 1,
          fullName: reg.fullName,
          role: reg.role,
          battingStyle: reg.battingStyle,
          bowlingStyle: reg.bowlingStyle,
          isOverseas: false,
          country: "Sri Lanka",
          age: reg.age,
          category,
          basePrice: Number(basePrice),
          status: 'QUEUED',
          stats: {
            matches: reg.matches || 0,
            runs: reg.runs || 0,
            wickets: reg.wickets || 0
          }
        };
        setPlayers(prev => [...prev, fallbackPlayer]);
        setRegistrations(prev => prev.filter(r => r.id !== regId && r._id !== regId));
      }
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
      console.warn('[BidX Context] Create player API failed, falling back to local state:', err.message);
      const fallbackP = {
        ...playerData,
        id: `ply-${Date.now()}`,
        lotNumber: players.length + 1,
        status: 'QUEUED'
      };
      setPlayers(prev => [...prev, fallbackP]);
      return { success: true, player: fallbackP };
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
      console.warn('[BidX Context] Create auction API failed, falling back to local:', err.message);
      const fallbackTourn = {
        ...data,
        id: `tourn-${Date.now()}`,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: 'DRAFT',
        currencyNotation: data.currency === 'POINTS' ? 'STANDARD' : 'SOUTH_ASIAN'
      };
      setTournaments(prev => [fallbackTourn, ...prev]);
      return { success: true, tournament: fallbackTourn };
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
      console.warn('[BidX Context] Update tournament status failed, updating local:', err.message);
      setTournaments(prev => prev.map(t => (t.id === auctionId || t._id === auctionId) ? { ...t, status } : t));
      return { success: true };
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
      console.warn('[BidX Context] Delete tournament failed, updating local:', err.message);
      setTournaments(prev => prev.filter(t => t.id !== auctionId && t._id !== auctionId));
      return { success: true };
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
      console.warn('[BidX Context] Create team API failed, falling back to local:', err.message);
      const fallbackTeam = {
        ...data,
        id: `team-${Date.now()}`,
        remainingPurse: Number(data.startingPurse),
        totalSpent: 0,
        squadCount: 0,
        overseasCount: 0
      };
      setTeams(prev => [...prev, fallbackTeam]);
      return { success: true, team: fallbackTeam };
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
  const importPlayers = useCallback(async (importedRows) => {
    const createdList = [];
    for (let i = 0; i < importedRows.length; i++) {
      const row = importedRows[i];
      try {
        const res = await api.createPlayer({
          auctionId: auctionDbId,
          lotNumber: players.length + i + 1,
          fullName: row.fullName || 'Imported Player',
          role: row.role || 'TOP_ORDER_BATTER',
          battingStyle: row.battingStyle || 'RIGHT_HAND',
          bowlingStyle: row.bowlingStyle || 'Right-arm medium',
          isOverseas: Boolean(row.isOverseas),
          country: row.country || 'Sri Lanka',
          age: Number(row.age) || 24,
          category: row.category || 'CATEGORY_A',
          basePrice: Number(row.basePrice) || 1000000,
          stats: {
            matches: Number(row.matches) || 20,
            runs: Number(row.runs) || 350,
            wickets: Number(row.wickets) || 10
          }
        });
        if (res?.success && res.data) {
          createdList.push({ ...res.data, id: res.data._id });
        }
      } catch (err) {
        console.warn('[BidX Context] Bulk row import failed:', err.message);
        createdList.push({
          id: `ply-imp-${Date.now()}-${i}`,
          auctionId: auctionDbId,
          lotNumber: players.length + i + 1,
          fullName: row.fullName || 'Imported Player',
          role: row.role || 'TOP_ORDER_BATTER',
          battingStyle: row.battingStyle || 'RIGHT_HAND',
          bowlingStyle: row.bowlingStyle || 'Right-arm medium',
          isOverseas: Boolean(row.isOverseas),
          country: row.country || 'Sri Lanka',
          age: Number(row.age) || 24,
          category: row.category || 'CATEGORY_A',
          basePrice: Number(row.basePrice) || 1000000,
          status: 'QUEUED'
        });
      }
    }
    setPlayers(prev => [...prev, ...createdList]);
  }, [auctionDbId, players.length]);

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
      players,
      createPlayer,
      deletePlayer,
      importPlayers,
      registrations,
      fetchRegistrations,
      registerPlayer,
      approveRegistration,
      rejectRegistration,
      activeLot,
      currentLotPlayer,
      currentHighestTeam,
      placeBid,
      hammerSold,
      hammerUnsold,
      selectPlayerLot,
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
