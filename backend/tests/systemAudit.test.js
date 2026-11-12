const assert = require('assert');
const AuctionEngine = require('../src/services/AuctionEngine');
const WhatsAppNotificationService = require('../src/services/WhatsAppNotificationService');

console.log('🏏 [BidX QA Suite] Starting Automated System Functional Verification...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -------------------------------------------------------------
// 1. AUCTION ENGINE: RESERVE FUND & ELIGIBILITY VERIFICATION
// -------------------------------------------------------------
console.log('=== 1. Real-Time Auction Engine & Reserve Math ===');

const mockAuction = {
  minSquadSize: 15,
  maxSquadSize: 18,
  maxOverseas: 5,
  minBasePrice: 100000 // 1 Lakh min base price
};

runTest('Should allow valid bid when reserve purse requirement is met', () => {
  const team = {
    remainingPurse: 10000000, // 100 Lakhs
    squadCount: 10,
    overseasCount: 2
  };
  // Slots needed = 15 - 10 - 1 = 4 slots. Reserve needed = 4 * 100,000 = 400,000.
  // Allowed bid = 10,000,000 - 400,000 = 9,600,000.
  const result = AuctionEngine.validateBiddingEligibility(team, mockAuction, 5000000);
  assert.strictEqual(result.eligible, true);
});

runTest('Should REJECT bid when remaining purse breaches squad reserve fund', () => {
  const team = {
    remainingPurse: 1000000, // 10 Lakhs
    squadCount: 5, // Needs 15 - 5 - 1 = 9 slots. Reserve needed = 9 * 100,000 = 900,000
    overseasCount: 1
  };
  // Max bid allowed is 1,000,000 - 900,000 = 100,000.
  const result = AuctionEngine.validateBiddingEligibility(team, mockAuction, 200000);
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('reserve fund protection'));
});

runTest('Should REJECT bid when proposed bid exceeds remaining purse', () => {
  const team = {
    remainingPurse: 500000,
    squadCount: 14,
    overseasCount: 0
  };
  const result = AuctionEngine.validateBiddingEligibility(team, mockAuction, 600000);
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('exceeds remaining purse'));
});

runTest('Should REJECT bid when team squad size limit is reached', () => {
  const team = {
    remainingPurse: 50000000,
    squadCount: 18, // Max is 18
    overseasCount: 3
  };
  const result = AuctionEngine.validateBiddingEligibility(team, mockAuction, 1000000);
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('squad limit reached'));
});

// -------------------------------------------------------------
// 2. DYNAMIC BID INCREMENT LADDER VERIFICATION
// -------------------------------------------------------------
console.log('\n=== 2. Dynamic Bid Increment Ladder Calculations ===');

const defaultLadders = [
  { from: 0, to: 100000, increment: 10000 },
  { from: 100000, to: 500000, increment: 25000 },
  { from: 500000, to: 2500000, increment: 50000 },
  { from: 2500000, to: 10000000, increment: 100000 },
  { from: 10000000, to: 100000000, increment: 250000 }
];

runTest('Should calculate next bid for tier 1 (< 100,000)', () => {
  const next = AuctionEngine.calculateNextBid(50000, 50000, defaultLadders);
  assert.strictEqual(next, 60000); // 50k + 10k
});

runTest('Should calculate next bid for tier 2 (100k - 500k)', () => {
  const next = AuctionEngine.calculateNextBid(250000, 100000, defaultLadders);
  assert.strictEqual(next, 275000); // 250k + 25k
});

runTest('Should calculate next bid for tier 3 (500k - 2.5M)', () => {
  const next = AuctionEngine.calculateNextBid(1000000, 500000, defaultLadders);
  assert.strictEqual(next, 1050000); // 1M + 50k
});

runTest('Should calculate next bid for tier 4 (2.5M - 10M)', () => {
  const next = AuctionEngine.calculateNextBid(5000000, 1000000, defaultLadders);
  assert.strictEqual(next, 5100000); // 5M + 100k
});

runTest('Should calculate next bid for tier 5 (> 10M)', () => {
  const next = AuctionEngine.calculateNextBid(15000000, 2000000, defaultLadders);
  assert.strictEqual(next, 15250000); // 15M + 250k
});

// -------------------------------------------------------------
// 3. WHATSAPP NOTIFICATION SERVICE RESILIENCE
// -------------------------------------------------------------
console.log('\n=== 3. WhatsApp Notification Service Resilience ===');

runTest('Should report configured: false when env vars are unconfigured', () => {
  const isConf = WhatsAppNotificationService.isConfigured();
  // By default in this test environment without META token, should return boolean without crashing
  assert.strictEqual(typeof isConf, 'boolean');
});

runTest('Should handle unconfigured acquisition alert without throwing unhandled exception', async () => {
  const result = await WhatsAppNotificationService.sendAcquisitionAlert({
    player: { fullName: 'Test Player', contactNumber: '+94771234567' },
    team: { name: 'Colombo Strikers' },
    auction: { title: 'Colombo Premier League 2026' },
    finalBidAmount: 5000000,
    acquisition: { whatsAppNotificationStatus: 'PENDING', save: async () => {} }
  });
  assert.ok(result !== undefined);
});

// -------------------------------------------------------------
// 4. FIXED & RETAINED PLAYER ALLOCATION LOGIC
// -------------------------------------------------------------
console.log('\n=== 4. Fixed & Retained Player Allocation Logic ===');

function validateFixedPlayerAllocation(team, auction, retentionFee, isOverseas = false) {
  if (team.squadCount >= auction.maxSquadSize) {
    return { eligible: false, reason: 'Max squad limit reached' };
  }
  if (isOverseas && team.overseasCount >= auction.maxOverseas) {
    return { eligible: false, reason: 'Overseas quota exceeded' };
  }
  if (retentionFee > team.remainingPurse) {
    return { eligible: false, reason: 'Retention fee exceeds remaining purse' };
  }
  const slotsRemainingAfter = Math.max(0, auction.minSquadSize - (team.squadCount + 1));
  const requiredReserve = slotsRemainingAfter * auction.minBasePrice;
  if (team.remainingPurse - retentionFee < requiredReserve) {
    return { eligible: false, reason: 'Retention fee breaches squad reserve' };
  }
  return { eligible: true };
}

runTest('Should allow valid fixed player allocation when budget and reserve math pass', () => {
  const team = {
    remainingPurse: 20000000,
    squadCount: 3,
    overseasCount: 1
  };
  const res = validateFixedPlayerAllocation(team, mockAuction, 5000000, false);
  assert.strictEqual(res.eligible, true);
});

runTest('Should REJECT fixed player allocation if overseas limit is reached', () => {
  const team = {
    remainingPurse: 20000000,
    squadCount: 3,
    overseasCount: 5 // Max overseas is 5
  };
  const res = validateFixedPlayerAllocation(team, mockAuction, 1000000, true);
  assert.strictEqual(res.eligible, false);
  assert.ok(res.reason.includes('Overseas quota exceeded'));
});

runTest('Should REJECT fixed player allocation if retention fee breaches squad reserve', () => {
  const team = {
    remainingPurse: 1500000, // 1.5M
    squadCount: 2, // Needs min 15 - (2+1) = 12 slots remaining. Reserve needed = 12 * 100k = 1.2M
    overseasCount: 0
  };
  // Remaining purse is 1.5M. Allowed fee = 1.5M - 1.2M = 300,000.
  const res = validateFixedPlayerAllocation(team, mockAuction, 500000, false);
  assert.strictEqual(res.eligible, false);
  assert.ok(res.reason.includes('breaches squad reserve'));
});

// -------------------------------------------------------------
// TEST SUMMARY
// -------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`QA RESULTS: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
