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

  // Live Backend Data Synchronization
  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const res = await api.getPublicBroadcast('cpl-2026');
        if (isMounted && res?.success && res.data) {
          const { auction, teams: liveTeams, players: livePlayers } = res.data;
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
        }
      } catch (err) {
        console.warn('[BidX Context] Running in offline fallback mode:', err.message);
      }
    };
    fetchLiveData();
    return () => { isMounted = false; };
  }, []);

  // Real-time WebSocket Listeners (Socket.IO)
  useEffect(() => {
    const socket = getSocket();
    const auctionRoomId = '6af553972c9ef2619668f184'; // CPL 2026 Room ID
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
        currentBid: player.basePrice,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: 30,
        isTimerRunning: true,
        bidHistory: []
      });
    });

    return () => {
      leaveAuctionRoom(auctionRoomId);
      socket.off('bid_placed');
      socket.off('lot_sold');
      socket.off('lot_unsold');
      socket.off('lot_selected');
    };
  }, [activeLot.currentBid]);

  // Action: Place Bid
  const placeBid = useCallback((teamId, amount) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, reason: "Team not found" };

    // Reserve math check: remainingPurse - bid >= (minSquad - currentSquad - 1) * minBasePrice
    const slotsNeeded = Math.max(0, activeTournament.minSquadSize - team.squadCount - 1);
    const reserveNeeded = slotsNeeded * activeTournament.minBasePrice;
    if (team.remainingPurse - amount < reserveNeeded) {
      return { success: false, reason: "Bid exceeds allowed reserve limit for minimum squad slots" };
    }

    const timeStr = new Date().toLocaleTimeString();
    setActiveLot(prev => ({
      ...prev,
      currentBid: amount,
      highestBidderTeamId: teamId,
      bidCount: prev.bidCount + 1,
      timerSeconds: activeTournament.timerSeconds, // reset timer on bid
      isTimerRunning: true,
      bidHistory: [
        { id: Date.now(), teamId, amount, timestamp: timeStr },
        ...prev.bidHistory
      ]
    }));

    return { success: true };
  }, [teams, activeTournament]);

  // Action: Hammer SOLD
  const hammerSold = useCallback(() => {
    if (!currentLotPlayer || !currentHighestTeam) return;

    const winningPrice = activeLot.currentBid;
    const winningTeamId = currentHighestTeam.id;

    // Update Player Status to SOLD
    setPlayers(prev => prev.map(p => 
      p.id === currentLotPlayer.id
        ? { ...p, status: 'SOLD', winningTeamId, finalPrice: winningPrice, soldAt: new Date().toISOString() }
        : p
    ));

    // Update Team Purse & Squad Count
    setTeams(prev => prev.map(t => 
      t.id === winningTeamId
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
    const nextQueued = players.find(p => p.status === 'QUEUED' && p.id !== currentLotPlayer.id);
    if (nextQueued) {
      setPlayers(prev => prev.map(p => p.id === nextQueued.id ? { ...p, status: 'LIVE' } : p));
      setActiveLot({
        playerId: nextQueued.id,
        currentBid: nextQueued.basePrice,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: activeTournament.timerSeconds,
        isTimerRunning: true,
        bidHistory: []
      });
    } else {
      setActiveLot(prev => ({ ...prev, isTimerRunning: false }));
    }
  }, [currentLotPlayer, currentHighestTeam, activeLot.currentBid, players, activeTournament.timerSeconds]);

  // Action: Hammer UNSOLD
  const hammerUnsold = useCallback(() => {
    if (!currentLotPlayer) return;

    setPlayers(prev => prev.map(p => 
      p.id === currentLotPlayer.id ? { ...p, status: 'UNSOLD' } : p
    ));

    // Advance queue
    const nextQueued = players.find(p => p.status === 'QUEUED' && p.id !== currentLotPlayer.id);
    if (nextQueued) {
      setPlayers(prev => prev.map(p => p.id === nextQueued.id ? { ...p, status: 'LIVE' } : p));
      setActiveLot({
        playerId: nextQueued.id,
        currentBid: nextQueued.basePrice,
        highestBidderTeamId: null,
        bidCount: 0,
        timerSeconds: activeTournament.timerSeconds,
        isTimerRunning: true,
        bidHistory: []
      });
    } else {
      setActiveLot(prev => ({ ...prev, isTimerRunning: false }));
    }
  }, [currentLotPlayer, players, activeTournament.timerSeconds]);

  // Action: Select Specific Player onto live block
  const selectPlayerLot = useCallback((playerId) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    // Set other live players to queued if applicable
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status: 'LIVE' } : (p.status === 'LIVE' ? { ...p, status: 'QUEUED' } : p)
    ));

    setActiveLot({
      playerId: targetPlayer.id,
      currentBid: targetPlayer.basePrice,
      highestBidderTeamId: null,
      bidCount: 0,
      timerSeconds: activeTournament.timerSeconds,
      isTimerRunning: false,
      bidHistory: []
    });
  }, [players, activeTournament.timerSeconds]);

  // Action: Undo Last Bid
  const undoLastBid = useCallback(() => {
    if (activeLot.bidHistory.length === 0) return;
    const history = [...activeLot.bidHistory];
    history.shift(); // remove latest
    const previous = history[0];

    setActiveLot(prev => ({
      ...prev,
      currentBid: previous ? previous.amount : currentLotPlayer?.basePrice || 0,
      highestBidderTeamId: previous ? previous.teamId : null,
      bidCount: Math.max(0, prev.bidCount - 1),
      bidHistory: history
    }));
  }, [activeLot.bidHistory, currentLotPlayer]);

  // Action: Re-queue Unsold player
  const reQueueUnsold = useCallback((playerId) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status: 'QUEUED' } : p
    ));
  }, []);

  // Action: Review & Approve Registration
  const approveRegistration = useCallback((regId, basePrice, category) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    const newPlayer = {
      id: `ply-${Date.now()}`,
      auctionId: reg.auctionId,
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
        wickets: reg.wickets || 0,
        battingAverage: 24.5,
        strikeRate: 130.0,
        economy: 7.5,
        highestScore: "65*",
        bestBowling: "3/20"
      }
    };

    setPlayers(prev => [...prev, newPlayer]);
    setRegistrations(prev => prev.filter(r => r.id !== regId));
  }, [registrations, players.length]);

  // Action: Reject Registration
  const rejectRegistration = useCallback((regId) => {
    setRegistrations(prev => prev.filter(r => r.id !== regId));
  }, []);

  // Action: Add Tournament
  const createTournament = useCallback((data) => {
    const newTourn = {
      ...data,
      id: `tourn-${Date.now()}`,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'DRAFT',
      currencyNotation: data.currency === 'POINTS' ? 'STANDARD' : 'SOUTH_ASIAN'
    };
    setTournaments(prev => [newTourn, ...prev]);
  }, []);

  // Action: Add Team
  const createTeam = useCallback((data) => {
    const newTeam = {
      ...data,
      id: `team-${Date.now()}`,
      remainingPurse: Number(data.startingPurse),
      totalSpent: 0,
      squadCount: 0,
      overseasCount: 0
    };
    setTeams(prev => [...prev, newTeam]);
  }, []);

  // Action: Bulk Import Players
  const importPlayers = useCallback((importedRows) => {
    const mapped = importedRows.map((row, idx) => ({
      id: `ply-imp-${Date.now()}-${idx}`,
      auctionId: activeTournamentId,
      lotNumber: players.length + idx + 1,
      fullName: row.fullName || "Imported Player",
      role: row.role || "TOP_ORDER_BATTER",
      battingStyle: row.battingStyle || "RIGHT_HAND",
      bowlingStyle: row.bowlingStyle || "Right-arm medium",
      isOverseas: Boolean(row.isOverseas),
      country: row.country || "Sri Lanka",
      age: Number(row.age) || 24,
      category: row.category || "CATEGORY_A",
      basePrice: Number(row.basePrice) || 1000000,
      status: 'QUEUED',
      stats: {
        matches: Number(row.matches) || 20,
        runs: Number(row.runs) || 350,
        wickets: Number(row.wickets) || 10,
        battingAverage: 22.0,
        strikeRate: 125.0,
        economy: 7.8,
        highestScore: "54",
        bestBowling: "2/25"
      }
    }));

    setPlayers(prev => [...prev, ...mapped]);
  }, [activeTournamentId, players.length]);

  return (
    <AuctionContext.Provider value={{
      tournaments,
      activeTournament,
      setActiveTournamentId,
      createTournament,
      teams,
      createTeam,
      players,
      importPlayers,
      registrations,
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
