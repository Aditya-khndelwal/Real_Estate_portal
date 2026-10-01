#!/usr/bin/env node
// ---------------------------------------------------------------------------
//  server/scripts/seed.js
//  Clears the database and inserts realistic test data for all collections.
//
//  Usage:
//    MONGODB_URI=mongodb://localhost:27017/real_estate_portal node scripts/seed.js
//
//  Or if you have a .env in server/:
//    npx dotenv -e .env -- node scripts/seed.js
// ---------------------------------------------------------------------------

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Investment = require('../src/models/Investment');
const Transaction = require('../src/models/Transaction');
const Payout = require('../src/models/Payout');
const Withdrawal = require('../src/models/Withdrawal');

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Convert INR to integer paise (e.g. 1_00_00_000 INR → 1_00_00_000_00 paise) */
const inr = (rupees) => rupees * 100;

/** Hash a plaintext password with bcrypt cost 11 (matches authController) */
const hash = (plain) => bcrypt.hashSync(plain, 11);

const DUMMY_IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`;
const dummyImages = (ids) => ids.map((id, i) => ({
  url: DUMMY_IMG(id),
  publicId: `img_${i}`,
  name: `property-image-${i + 1}.jpg`
}));
const dummyDocs = (names) => names.map((name, i) => ({
  url: `https://storage.example.com/docs/${name.toLowerCase().replace(/\s+/g, '-')}`,
  publicId: `doc_${i}`,
  name
}));

// ── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set. Pass it as an env variable.');
    process.exit(1);
  }

  console.log('⏳ Connecting to MongoDB …');
  await mongoose.connect(uri);
  console.log('✓ Connected\n');

  // ── 1. Clear all collections ──────────────────────────────────────────
  //    Transaction has append-only pre-hooks that block Mongoose .deleteMany().
  //    Use the raw driver's deleteMany to bypass Mongoose middleware.
  console.log('🗑  Clearing existing data …');

  await User.deleteMany({});
  await Property.deleteMany({});
  await Investment.deleteMany({});
  await Payout.deleteMany({});
  await Withdrawal.deleteMany({});

  // Bypass Mongoose append-only guard
  const txCollection = mongoose.connection.collection('transactions');
  try {
    await txCollection.deleteMany({});
  } catch {
    // Collection may not exist on a fresh DB – that's fine
  }

  console.log('✓ All collections cleared\n');

  // ── 2. Create Users ───────────────────────────────────────────────────
  console.log('👤 Creating users …');

  const PASSWORD = 'Demo@1234';

  const admin = await User.create({
    name: 'Priya Sharma',
    email: 'admin@demo.com',
    phone: '9100000001',
    passwordHash: hash(PASSWORD),
    role: 'ADMIN',
    isActive: true,
    kyc: { status: 'APPROVED', docs: ['aadhaar.pdf'], reason: '' }
  });

  const broker1 = await User.create({
    name: 'Rajesh Malhotra',
    email: 'broker1@demo.com',
    phone: '9200000001',
    passwordHash: hash(PASSWORD),
    role: 'BROKER',
    isActive: true,
    brokerApproved: true,
    kyc: { status: 'APPROVED', docs: ['pan.pdf', 'rera-cert.pdf'], reason: '' }
  });

  const broker2 = await User.create({
    name: 'Sneha Kapoor',
    email: 'broker2@demo.com',
    phone: '9200000002',
    passwordHash: hash(PASSWORD),
    role: 'BROKER',
    isActive: true,
    brokerApproved: true,
    kyc: { status: 'APPROVED', docs: ['pan.pdf', 'gst-cert.pdf'], reason: '' }
  });

  const investorData = [
    { name: 'Arjun Mehta', email: 'investor1@demo.com', phone: '9300000001' },
    { name: 'Kavya Nair', email: 'investor2@demo.com', phone: '9300000002' },
    { name: 'Rohit Deshmukh', email: 'investor3@demo.com', phone: '9300000003' },
    { name: 'Ananya Rao', email: 'investor4@demo.com', phone: '9300000004' },
    { name: 'Vikram Singh', email: 'investor5@demo.com', phone: '9300000005' }
  ];

  const investors = [];
  for (const data of investorData) {
    const user = await User.create({
      ...data,
      passwordHash: hash(PASSWORD),
      role: 'INVESTOR',
      isActive: true,
      kyc: { status: 'APPROVED', docs: ['aadhaar.pdf', 'pan.pdf'], reason: '' }
    });
    investors.push(user);
  }

  console.log(`  ✓ Admin:     ${admin.email}`);
  console.log(`  ✓ Broker 1:  ${broker1.email}`);
  console.log(`  ✓ Broker 2:  ${broker2.email}`);
  investors.forEach((inv, i) => console.log(`  ✓ Investor ${i + 1}: ${inv.email}`));
  console.log();

  // ── 3. Create Properties ──────────────────────────────────────────────
  console.log('🏢 Creating properties …');

  //  All financial values are strict integer paise.
  //  valuation = totalUnits * unitPrice   (enforced by pre-validate hook)

  // --- P1: DRAFT (Broker 1) ---
  const p1 = await Property.create({
    title: 'Whitefield Tech Park',
    description: 'A modern co-working campus near ITPL, Whitefield. Ideal for long-term corporate leasing.',
    type: 'COMMERCIAL',
    address: 'Survey No 42, ITPL Main Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    areaSqft: 18500,
    images: dummyImages(['1497366811353-6870744d04b2']),
    documents: dummyDocs(['Draft floor plan.pdf']),
    valuation: inr(5_00_00_000),  // ₹5 Cr = 50,00,00,000 paise
    totalUnits: 100,
    unitPrice: inr(5_00_000),     // ₹5 L each
    minUnits: 1,
    unitsSold: 0,
    expectedAppreciationPct: 14.0,
    rentalYieldPct: 7.5,
    holdingPeriodMonths: 36,
    status: 'DRAFT',
    brokerId: broker1._id
  });

  // --- P2: PENDING_APPROVAL (Broker 1) ---
  const p2 = await Property.create({
    title: 'Indiranagar Boutique Residences',
    description: 'Premium 2 & 3 BHK residences in the heart of Indiranagar, one of Bengaluru\'s most sought-after neighborhoods.',
    type: 'APARTMENT',
    address: '100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    areaSqft: 8400,
    images: dummyImages([
      '1545324418-cc1a3fa10c00',
      '1600607687920-4e2a09cf159d',
      '1600566753190-17f0baa2a6c3'
    ]),
    documents: dummyDocs(['Title deed.pdf', 'Valuation report.pdf', 'RERA certificate.pdf']),
    valuation: inr(8_00_00_000),  // ₹8 Cr
    totalUnits: 80,
    unitPrice: inr(10_00_000),    // ₹10 L each
    minUnits: 1,
    unitsSold: 0,
    expectedAppreciationPct: 16.5,
    rentalYieldPct: 4.2,
    holdingPeriodMonths: 42,
    status: 'PENDING_APPROVAL',
    brokerId: broker1._id
  });

  // --- P3: LIVE, partially funded ~40% (Broker 1) ---
  const p3 = await Property.create({
    title: 'The Skyline Residences',
    description: 'A limited collection of premium residences in the heart of Bandra West, designed for long-term value.',
    type: 'APARTMENT',
    address: 'Hill Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    areaSqft: 12000,
    images: dummyImages([
      '1545324418-cc1a3fa10c00',
      '1600607687920-4e2a09cf159d',
      '1600566753190-17f0baa2a6c3'
    ]),
    documents: dummyDocs(['Title deed.pdf', 'Valuation report.pdf', 'Due diligence brief.pdf']),
    valuation: inr(10_00_00_000),  // ₹10 Cr
    totalUnits: 100,
    unitPrice: inr(10_00_000),     // ₹10 L each
    minUnits: 1,
    unitsSold: 40,                 // 40% sold
    expectedAppreciationPct: 15.5,
    rentalYieldPct: 3.8,
    holdingPeriodMonths: 36,
    status: 'LIVE',
    brokerId: broker1._id,
    approvedBy: admin._id,
    approvedAt: new Date('2026-07-15'),
    listedAt: new Date('2026-07-15')
  });

  // --- P4: LIVE, lightly funded ~12% (Broker 2) ---
  const p4 = await Property.create({
    title: 'Alibaug Coastal Villas',
    description: 'A private collection of resort-style villas minutes from the coast, with an operator-led rental program.',
    type: 'VILLA',
    address: 'Kihim Beach Road',
    city: 'Alibaug',
    state: 'Maharashtra',
    pincode: '402201',
    areaSqft: 44400,
    images: dummyImages([
      '1600607687939-ce8a6c25118c',
      '1600566753190-17f0baa2a6c3',
      '1545324418-cc1a3fa10c00'
    ]),
    documents: dummyDocs(['Land title search.pdf', 'Rental operator agreement.pdf', 'Soil test report.pdf']),
    valuation: inr(4_20_00_000),   // ₹4.2 Cr
    totalUnits: 24,
    unitPrice: inr(17_50_000),     // ₹17.5 L each
    minUnits: 1,
    unitsSold: 3,
    expectedAppreciationPct: 12.25,
    rentalYieldPct: 5.1,
    holdingPeriodMonths: 30,
    status: 'LIVE',
    brokerId: broker2._id,
    approvedBy: admin._id,
    approvedAt: new Date('2026-08-01'),
    listedAt: new Date('2026-08-01')
  });

  // --- P5: FUNDED (Broker 2) ---
  const p5 = await Property.create({
    title: 'Koramangala WorkLofts',
    description: 'A high-demand flexible office asset positioned in Bengaluru\'s most established startup corridor.',
    type: 'COMMERCIAL',
    address: '80 Feet Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    areaSqft: 9200,
    images: dummyImages([
      '1497366811353-6870744d04b2',
      '1600607687920-4e2a09cf159d',
      '1600566753190-17f0baa2a6c3'
    ]),
    documents: dummyDocs(['Lease summary.pdf', 'Valuation report.pdf']),
    valuation: inr(6_80_00_000),   // ₹6.8 Cr
    totalUnits: 80,
    unitPrice: inr(8_50_000),      // ₹8.5 L each
    minUnits: 2,
    unitsSold: 80,                 // fully funded
    expectedAppreciationPct: 18.0,
    rentalYieldPct: 6.2,
    holdingPeriodMonths: 42,
    status: 'FUNDED',
    brokerId: broker2._id,
    approvedBy: admin._id,
    approvedAt: new Date('2026-04-10'),
    listedAt: new Date('2026-04-10'),
    fundedAt: new Date('2026-06-28')
  });

  // --- P6: HOLDING (Broker 1) ---
  const p6 = await Property.create({
    title: 'Jubilee Hills Premium Plots',
    description: 'Gated residential plotted development in Hyderabad\'s most prestigious neighborhood.',
    type: 'PLOT',
    address: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    areaSqft: 32000,
    images: dummyImages([
      '1600607687939-ce8a6c25118c',
      '1497366811353-6870744d04b2',
      '1545324418-cc1a3fa10c00'
    ]),
    documents: dummyDocs(['Land title.pdf', 'Layout approval.pdf', 'Soil test.pdf']),
    valuation: inr(12_50_00_000),  // ₹12.5 Cr
    totalUnits: 125,
    unitPrice: inr(10_00_000),     // ₹10 L each
    minUnits: 1,
    unitsSold: 125,
    expectedAppreciationPct: 16.75,
    rentalYieldPct: 0,
    holdingPeriodMonths: 48,
    status: 'HOLDING',
    brokerId: broker1._id,
    approvedBy: admin._id,
    approvedAt: new Date('2025-11-20'),
    listedAt: new Date('2025-11-20'),
    fundedAt: new Date('2026-02-14')
  });

  // --- P7: SOLD (Broker 2) ---
  const p7 = await Property.create({
    title: 'Marine Drive Heritage Suite',
    description: 'A rare heritage-style apartment overlooking Marine Drive, renovated for modern luxury living.',
    type: 'APARTMENT',
    address: 'Netaji Subhash Road, Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020',
    areaSqft: 2800,
    images: dummyImages([
      '1545324418-cc1a3fa10c00',
      '1600607687920-4e2a09cf159d',
      '1600566753190-17f0baa2a6c3'
    ]),
    documents: dummyDocs(['Sale deed.pdf', 'Valuation report.pdf', 'Completion certificate.pdf']),
    valuation: inr(3_50_00_000),   // ₹3.5 Cr
    totalUnits: 50,
    unitPrice: inr(7_00_000),      // ₹7 L each
    minUnits: 1,
    unitsSold: 50,
    expectedAppreciationPct: 20.0,
    rentalYieldPct: 3.5,
    holdingPeriodMonths: 24,
    status: 'SOLD',
    salePrice: inr(4_20_00_000),   // sold for ₹4.2 Cr (20% appreciation)
    brokerId: broker2._id,
    approvedBy: admin._id,
    approvedAt: new Date('2025-06-01'),
    listedAt: new Date('2025-06-01'),
    fundedAt: new Date('2025-08-15'),
    soldAt: new Date('2026-08-20')
  });

  // --- P8: REJECTED (Broker 2) ---
  const p8 = await Property.create({
    title: 'Sector 62 Warehouse Complex',
    description: 'Large-format warehouse space near NH-48 suitable for e-commerce and logistics operations.',
    type: 'WAREHOUSE',
    address: 'Plot 14-B, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    areaSqft: 75000,
    images: dummyImages([
      '1555529669-e69e7aa0ba9a',
      '1497366811353-6870744d04b2',
      '1600607687939-ce8a6c25118c'
    ]),
    documents: dummyDocs(['Title deed.pdf', 'Structural audit.pdf']),
    valuation: inr(15_00_00_000),  // ₹15 Cr
    totalUnits: 150,
    unitPrice: inr(10_00_000),     // ₹10 L each
    minUnits: 2,
    unitsSold: 0,
    expectedAppreciationPct: 10.0,
    rentalYieldPct: 8.5,
    holdingPeriodMonths: 60,
    status: 'REJECTED',
    rejectionReason: 'Incomplete structural audit. The submitted report covers only Block A. Please provide the full structural assessment for all blocks and resubmit.',
    brokerId: broker2._id
  });

  const allProperties = [p1, p2, p3, p4, p5, p6, p7, p8];
  allProperties.forEach((p) => console.log(`  ✓ [${p.status.padEnd(18)}] ${p.title}`));
  console.log();

  // ── 4. Create Investments & Ledger Transactions ───────────────────────
  //    For P3 (LIVE, 40 units sold) — create investments for 2 investors.
  //    Investor 1 (Arjun):  25 units   →  ₹2,50,00,000 paise
  //    Investor 2 (Kavya):  15 units   →  ₹1,50,00,000 paise
  //    Total unitsSold = 40  ✓
  //
  //    Wallet flow per investor:
  //      1. TOPUP  (CREDIT)     — large top-up
  //      2. INVESTMENT (DEBIT)  — purchase amount
  //      balanceAfter must be exact: topup - investment
  console.log('💰 Creating investments & ledger entries …');

  const investor1 = investors[0]; // Arjun Mehta
  const investor2 = investors[1]; // Kavya Nair

  // --- Investor 1: Arjun — 25 units of P3 ---
  const arjunUnits = 25;
  const arjunAmount = arjunUnits * p3.unitPrice;        // 25 × 10,00,000 paise = 2,50,00,000 paise (₹25 L)
  const arjunTopup = inr(50_00_000);                    // ₹50 L top-up
  const arjunBalanceAfterTopup = arjunTopup;             // 50,00,00,000 paise
  const arjunBalanceAfterInvest = arjunTopup - arjunAmount; // 50,00,00,000 - 25,00,00,000 = 25,00,00,000

  const inv1 = await Investment.create({
    investorId: investor1._id,
    propertyId: p3._id,
    units: arjunUnits,
    amount: arjunAmount,
    ownershipPct: (arjunUnits / p3.totalUnits) * 100,   // 25.0%
    status: 'ACTIVE'
  });

  // Ledger: Arjun top-up (use raw insert to bypass potential timing issues)
  const arjunTx1 = await Transaction.collection.insertOne({
    userId: investor1._id,
    type: 'TOPUP',
    direction: 'CREDIT',
    amount: arjunTopup,
    balanceAfter: arjunBalanceAfterTopup,
    gatewayPaymentId: 'pay_demo_arjun_001',
    createdAt: new Date('2026-08-20T10:00:00Z'),
    updatedAt: new Date('2026-08-20T10:00:00Z')
  });

  // Ledger: Arjun investment debit
  const arjunTx2 = await Transaction.collection.insertOne({
    userId: investor1._id,
    type: 'INVESTMENT',
    direction: 'DEBIT',
    amount: arjunAmount,
    balanceAfter: arjunBalanceAfterInvest,
    refType: 'Investment',
    refId: inv1._id,
    createdAt: new Date('2026-08-20T10:05:00Z'),
    updatedAt: new Date('2026-08-20T10:05:00Z')
  });

  console.log(`  ✓ ${investor1.name}: ${arjunUnits} units of "${p3.title}"`);
  console.log(`    Top-up ₹${arjunTopup / 100}  →  Invested ₹${arjunAmount / 100}  →  Balance ₹${arjunBalanceAfterInvest / 100}`);

  // --- Investor 2: Kavya — 15 units of P3 ---
  const kavyaUnits = 15;
  const kavyaAmount = kavyaUnits * p3.unitPrice;          // 15 × 10,00,000 = 1,50,00,000 paise (₹15 L)
  const kavyaTopup = inr(30_00_000);                      // ₹30 L top-up
  const kavyaBalanceAfterTopup = kavyaTopup;
  const kavyaBalanceAfterInvest = kavyaTopup - kavyaAmount; // 30,00,00,000 - 15,00,00,000 = 15,00,00,000

  const inv2 = await Investment.create({
    investorId: investor2._id,
    propertyId: p3._id,
    units: kavyaUnits,
    amount: kavyaAmount,
    ownershipPct: (kavyaUnits / p3.totalUnits) * 100,     // 15.0%
    status: 'ACTIVE'
  });

  await Transaction.collection.insertOne({
    userId: investor2._id,
    type: 'TOPUP',
    direction: 'CREDIT',
    amount: kavyaTopup,
    balanceAfter: kavyaBalanceAfterTopup,
    gatewayPaymentId: 'pay_demo_kavya_001',
    createdAt: new Date('2026-08-22T14:00:00Z'),
    updatedAt: new Date('2026-08-22T14:00:00Z')
  });

  await Transaction.collection.insertOne({
    userId: investor2._id,
    type: 'INVESTMENT',
    direction: 'DEBIT',
    amount: kavyaAmount,
    balanceAfter: kavyaBalanceAfterInvest,
    refType: 'Investment',
    refId: inv2._id,
    createdAt: new Date('2026-08-22T14:10:00Z'),
    updatedAt: new Date('2026-08-22T14:10:00Z')
  });

  console.log(`  ✓ ${investor2.name}: ${kavyaUnits} units of "${p3.title}"`);
  console.log(`    Top-up ₹${kavyaTopup / 100}  →  Invested ₹${kavyaAmount / 100}  →  Balance ₹${kavyaBalanceAfterInvest / 100}`);

  // --- Give remaining investors a small wallet balance (top-up only) ---
  for (let i = 2; i < investors.length; i++) {
    const inv = investors[i];
    const topupAmount = inr(10_00_000 + i * 5_00_000);  // ₹10–25 L range
    await Transaction.collection.insertOne({
      userId: inv._id,
      type: 'TOPUP',
      direction: 'CREDIT',
      amount: topupAmount,
      balanceAfter: topupAmount,
      gatewayPaymentId: `pay_demo_${inv.name.split(' ')[0].toLowerCase()}_001`,
      createdAt: new Date(`2026-09-0${i}T09:00:00Z`),
      updatedAt: new Date(`2026-09-0${i}T09:00:00Z`)
    });
    console.log(`  ✓ ${inv.name}: wallet balance ₹${topupAmount / 100} (top-up only)`);
  }

  console.log();

  // ── 5. Summary ────────────────────────────────────────────────────────
  const userCount = await User.countDocuments();
  const propCount = await Property.countDocuments();
  const invCount = await Investment.countDocuments();
  const txCount = await Transaction.collection.countDocuments();

  console.log('━'.repeat(55));
  console.log('  SEED COMPLETE');
  console.log('━'.repeat(55));
  console.log(`  Users:         ${userCount}`);
  console.log(`  Properties:    ${propCount}`);
  console.log(`  Investments:   ${invCount}`);
  console.log(`  Transactions:  ${txCount}`);
  console.log('━'.repeat(55));
  console.log(`  All passwords: ${PASSWORD}`);
  console.log('━'.repeat(55));
  console.log();
}

// ── Run ─────────────────────────────────────────────────────────────────────
seed()
  .then(() => {
    console.log('✓ Done — exiting.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Seed failed:', err);
    process.exit(1);
  });
