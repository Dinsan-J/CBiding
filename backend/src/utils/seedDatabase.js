const mongoose = require('mongoose');
require('dotenv').config();

const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Bid = require('../models/Bid');

const seedData = async () => {
  try {
    console.log('[BidX Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[BidX Seeder] Connected to MongoDB Atlas.');

    // Clean existing data for fresh seed
    console.log('[BidX Seeder] Purging old demo records...');
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Auction.deleteMany({}),
      Team.deleteMany({}),
      Player.deleteMany({}),
      Bid.deleteMany({})
    ]);

    // 1. Create Default Tenant
    console.log('[BidX Seeder] Creating default Tenant...');
    const tenant = await Tenant.create({
      name: 'Sri Lanka Cricket Organisers',
      slug: 'slc-cricket',
      contactEmail: 'admin@bidx.com',
      contactPhone: '+94 11 268 1601',
      subscriptionPlan: 'PRO_TOURNAMENT',
      branding: {
        logoUrl: '',
        primaryColor: '#06B6D4',
        accentColor: '#10B981'
      }
    });

    // 2. Create Admin & Organiser Users
    console.log('[BidX Seeder] Creating Admin accounts...');
    const adminUser = await User.create({
      tenantId: tenant._id,
      fullName: 'Chief Auction Organiser',
      email: 'admin@bidx.com',
      username: 'admin',
      passwordHash: 'admin', // Will be hashed by User pre-save hook
      role: 'SUPER_ADMIN'
    });

    const auctioneerUser = await User.create({
      tenantId: tenant._id,
      fullName: 'Live Floor Auctioneer',
      email: 'auctioneer@bidx.com',
      username: 'auctioneer',
      passwordHash: 'admin',
      role: 'AUCTIONEER'
    });

    // 3. Create Premier Auction (CPL 2026)
    console.log('[BidX Seeder] Creating Colombo Premier League 2026 Auction...');
    const auction = await Auction.create({
      tenantId: tenant._id,
      title: 'Colombo Premier League 2026',
      slug: 'cpl-2026',
      description: 'The pinnacle franchise cricket tournament featuring top international and domestic cricket superstars.',
      type: 'MONEY',
      currency: 'LKR',
      currencyNotation: 'SOUTH_ASIAN',
      startingPurse: 50000000,
      minSquadSize: 15,
      maxSquadSize: 20,
      maxOverseasPlayers: 6,
      minBasePrice: 50000,
      timerSeconds: 30,
      bidIncrements: [
        { from: 0, to: 1000000, increment: 100000 },
        { from: 1000000, to: 5000000, increment: 250000 },
        { from: 5000000, to: 20000000, increment: 500000 },
        { from: 20000000, to: 100000000, increment: 1000000 }
      ],
      status: 'LIVE'
    });

    // 4. Create Franchises (Teams)
    console.log('[BidX Seeder] Creating 6 Franchises...');
    const teamsData = [
      { name: 'Colombo Strikers', shortName: 'CLS', primaryColor: '#06B6D4', secondaryColor: '#0891B2', ownerName: 'Sagar Technology Group', startingPurse: 50000000 },
      { name: 'Dambulla Aura', shortName: 'DBA', primaryColor: '#EAB308', secondaryColor: '#CA8A04', ownerName: 'Aura Lanka Enterprises', startingPurse: 50000000 },
      { name: 'Galle Titans', shortName: 'GLT', primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', ownerName: 'Cricket Management Holdings', startingPurse: 50000000 },
      { name: 'Jaffna Kings', shortName: 'JFK', primaryColor: '#A855F7', secondaryColor: '#7E22CE', ownerName: 'Lyca Sports Group', startingPurse: 50000000 },
      { name: 'Kandy Falcons', shortName: 'KDF', primaryColor: '#10B981', secondaryColor: '#047857', ownerName: 'B-Love Network', startingPurse: 50000000 },
      { name: 'B-Love Tigers', shortName: 'BLT', primaryColor: '#F97316', secondaryColor: '#C2410C', ownerName: 'Apex Sports Ventures', startingPurse: 50000000 }
    ];

    const createdTeams = [];
    for (const t of teamsData) {
      const team = await Team.create({
        tenantId: tenant._id,
        auctionId: auction._id,
        ...t,
        totalSpent: 0,
        remainingPurse: t.startingPurse,
        reservedPurse: auction.minSquadSize * auction.minBasePrice,
        squadCount: 0,
        overseasCount: 0
      });
      createdTeams.push(team);
    }

    // 5. Create Players Roster
    console.log('[BidX Seeder] Creating Players...');
    const playersData = [
      {
        fullName: 'Wanindu Hasaranga',
        photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80',
        role: 'SPIN_ALL_ROUNDER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm legbreak',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 27,
        category: 'MARQUEE',
        basePrice: 5000000,
        stats: { matches: 168, runs: 1890, wickets: 242, battingAverage: 18.5, strikeRate: 136.4, economy: 6.88, highestScore: '71*', bestBowling: '5/18' },
        status: 'SOLD',
        finalPrice: 14500000,
        winningTeamId: createdTeams[0]._id, // Colombo Strikers
        lotNumber: 1
      },
      {
        fullName: 'Kusal Mendis',
        photoUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=500&auto=format&fit=crop&q=80',
        role: 'WICKETKEEPER_BATTER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm offbreak',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 29,
        category: 'MARQUEE',
        basePrice: 4000000,
        stats: { matches: 142, runs: 3820, wickets: 0, battingAverage: 32.4, strikeRate: 134.8, economy: 0, highestScore: '92', bestBowling: '-' },
        status: 'SOLD',
        finalPrice: 9250000,
        winningTeamId: createdTeams[1]._id, // Dambulla Aura
        lotNumber: 2
      },
      {
        fullName: 'Matheesha Pathirana',
        photoUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=500&auto=format&fit=crop&q=80',
        role: 'FAST_BOWLER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm fast slinger',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 22,
        category: 'MARQUEE',
        basePrice: 3500000,
        stats: { matches: 64, runs: 28, wickets: 88, battingAverage: 4.2, strikeRate: 68.0, economy: 7.45, highestScore: '11', bestBowling: '4/15' },
        status: 'SOLD',
        finalPrice: 12000000,
        winningTeamId: createdTeams[2]._id, // Galle Titans
        lotNumber: 3
      },
      {
        fullName: 'Dasun Shanaka',
        photoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500&auto=format&fit=crop&q=80',
        role: 'PACE_ALL_ROUNDER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm medium',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 33,
        category: 'CATEGORY_A',
        basePrice: 3000000,
        stats: { matches: 195, runs: 4120, wickets: 78, battingAverage: 28.1, strikeRate: 142.0, economy: 8.65, highestScore: '86*', bestBowling: '3/16' },
        status: 'UNSOLD',
        lotNumber: 4
      },
      {
        fullName: 'Maheesh Theekshana',
        photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80',
        role: 'SPIN_BOWLER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm mystery spin',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 24,
        category: 'MARQUEE',
        basePrice: 3500000,
        stats: { matches: 128, runs: 140, wickets: 145, battingAverage: 7.5, strikeRate: 85.0, economy: 6.42, highestScore: '21*', bestBowling: '4/25' },
        status: 'LIVE', // Currently on stage!
        lotNumber: 5
      },
      {
        fullName: 'Pathum Nissanka',
        photoUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=500&auto=format&fit=crop&q=80',
        role: 'TOP_ORDER_BATTER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'None',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 26,
        category: 'CATEGORY_A',
        basePrice: 3000000,
        stats: { matches: 98, runs: 3120, wickets: 0, battingAverage: 36.8, strikeRate: 138.5, economy: 0, highestScore: '110*', bestBowling: '-' },
        status: 'QUEUED',
        lotNumber: 6
      },
      {
        fullName: 'Charith Asalanka',
        photoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500&auto=format&fit=crop&q=80',
        role: 'MIDDLE_ORDER_BATTER',
        battingStyle: 'LEFT_HAND',
        bowlingStyle: 'Right-arm offbreak',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 27,
        category: 'CATEGORY_A',
        basePrice: 2500000,
        stats: { matches: 112, runs: 2890, wickets: 32, battingAverage: 31.5, strikeRate: 132.2, economy: 7.8, highestScore: '80*', bestBowling: '4/18' },
        status: 'QUEUED',
        lotNumber: 7
      },
      {
        fullName: 'Dushmantha Chameera',
        photoUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=500&auto=format&fit=crop&q=80',
        role: 'FAST_BOWLER',
        battingStyle: 'RIGHT_HAND',
        bowlingStyle: 'Right-arm express fast',
        isOverseas: false,
        country: 'Sri Lanka',
        age: 32,
        category: 'CATEGORY_B',
        basePrice: 2000000,
        stats: { matches: 115, runs: 120, wickets: 128, battingAverage: 5.4, strikeRate: 72.0, economy: 7.95, highestScore: '14', bestBowling: '4/17' },
        status: 'QUEUED',
        lotNumber: 8
      }
    ];

    const createdPlayers = [];
    for (const p of playersData) {
      const player = await Player.create({
        tenantId: tenant._id,
        auctionId: auction._id,
        ...p
      });
      createdPlayers.push(player);
    }

    // Update Team spending from sold players
    const soldWanindu = createdPlayers[0];
    const team1 = createdTeams[0];
    team1.totalSpent += soldWanindu.finalPrice;
    team1.remainingPurse -= soldWanindu.finalPrice;
    team1.squadCount += 1;
    await team1.save();

    const soldKusal = createdPlayers[1];
    const team2 = createdTeams[1];
    team2.totalSpent += soldKusal.finalPrice;
    team2.remainingPurse -= soldKusal.finalPrice;
    team2.squadCount += 1;
    await team2.save();

    const soldMatheesha = createdPlayers[2];
    const team3 = createdTeams[2];
    team3.totalSpent += soldMatheesha.finalPrice;
    team3.remainingPurse -= soldMatheesha.finalPrice;
    team3.squadCount += 1;
    await team3.save();

    // Set Live lot in Auction
    const livePlayer = createdPlayers[4]; // Maheesh Theekshana
    auction.currentLot = {
      playerId: livePlayer._id,
      lotNumber: livePlayer.lotNumber,
      currentBid: 3500000,
      highestBidderTeamId: createdTeams[0]._id, // Colombo Strikers
      bidCount: 2,
      timerExpiresAt: new Date(Date.now() + 30 * 1000),
      isTimerRunning: true
    };
    await auction.save();

    // Create Initial Bids on Lot 5
    await Bid.create({
      tenantId: tenant._id,
      auctionId: auction._id,
      playerId: livePlayer._id,
      teamId: createdTeams[1]._id,
      amount: 3250000,
      bidSequence: 1,
      placedByUserId: adminUser._id
    });

    await Bid.create({
      tenantId: tenant._id,
      auctionId: auction._id,
      playerId: livePlayer._id,
      teamId: createdTeams[0]._id,
      amount: 3500000,
      bidSequence: 2,
      placedByUserId: adminUser._id
    });

    console.log('--------------------------------------------------');
    console.log('[BidX Seeder] Database seeded successfully!');
    console.log(`- Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`- Admin User: ${adminUser.email} / admin`);
    console.log(`- Auction: ${auction.title} (${auction.slug})`);
    console.log(`- Franchises: ${createdTeams.length}`);
    console.log(`- Players: ${createdPlayers.length}`);
    console.log(`- Active Lot on Stage: ${livePlayer.fullName} (${auction.currentLot.currentBid.toLocaleString()} LKR)`);
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[BidX Seeder] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
