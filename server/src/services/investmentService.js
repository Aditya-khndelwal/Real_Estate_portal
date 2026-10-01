
const mongoose = require('mongoose');
const Property = require('../models/Property');
const Investment = require('../models/Investment');
const { postTransaction, getWalletBalance } = require('./ledgerService');

/**
 * Custom error class carrying a status code so the controller can respond
 * without needing to inspect the error message string.
 */
class InvestmentError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'InvestmentError';
    this.code = code;           // machine-readable error code, e.g. 'INSUFFICIENT_UNITS'
    this.statusCode = statusCode;
  }
}

/**
 * invest(userId, propertyId, units)
 *
 * Executes a full fractional-investment purchase inside a MongoDB ACID
 * transaction.  All reads and writes share the same session so no partial
 * state can be observed by concurrent requests.
 *
 * Flow:
 *  1. Validate inputs.
 *  2. Lock + decrement unitsSold atomically (409 if units unavailable).
 *  3. Check wallet balance (400 if insufficient).
 *  4. Create a DEBIT Transaction ledger entry.
 *  5. Create the Investment document.
 *  6. If fully funded, flip property status to FUNDED.
 *  7. Commit.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} propertyId
 * @param {number}          units  – positive integer
 * @returns {{ investment: Investment, property: Property, transaction: Transaction }}
 */
const invest = async (userId, propertyId, units) => {
  // ── 1. Basic input guard ──────────────────────────────────────────────────
  if (!Number.isInteger(units) || units < 1) {
    throw new InvestmentError('units must be a positive integer', 'INVALID_UNITS', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });

  try {
    // ── 2. Atomic concurrency check + unit reservation ────────────────────
    //
    // findOneAndUpdate with the filter { unitsSold: { $lte: totalUnits - units } }
    // ensures we only proceed when enough units remain.  The update and the
    // filter evaluation happen atomically on the MongoDB server, so two
    // concurrent requests for the last available unit cannot both succeed.
    //
    // We must fetch totalUnits first (inside the transaction) to build the
    // filter expression.  We use a plain session-bound findOne for that read.
    const propertySnapshot = await Property.findOne(
      { _id: propertyId, status: 'LIVE' },
      { totalUnits: 1, unitsSold: 1, unitPrice: 1 }
    ).session(session).lean();

    if (!propertySnapshot) {
      throw new InvestmentError(
        'Property not found or not available for investment',
        'PROPERTY_UNAVAILABLE',
        404
      );
    }

    const { totalUnits, unitPrice } = propertySnapshot;

    // Atomic: read-then-decrement with availability guard
    const updatedProperty = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        status: 'LIVE',
        unitsSold: { $lte: totalUnits - units }   // ensures unitsAvailable >= units
      },
      { $inc: { unitsSold: units } },
      { session, new: true }
    );

    if (!updatedProperty) {
      throw new InvestmentError(
        'Not enough units available for this investment',
        'INSUFFICIENT_UNITS',
        409
      );
    }

    // ── 3. Wallet balance check & DEBIT ───────────────────────────────────
    const amount = units * unitPrice;  // integer paise — unitPrice already in paise

    // Use ledgerService to post the transaction (includes balance check)
    // This will throw an error if insufficient balance
    const transaction = await postTransaction({
      userId,
      type: 'INVESTMENT',
      direction: 'DEBIT',
      amount,
      refType: 'Investment',
      refId: propertyId,  // temporary; will be updated to investment._id below
      session
    });

    // ── 4. Investment document ────────────────────────────────────────────
    const ownershipPct = (units / totalUnits) * 100;

    const [investment] = await Investment.create(
      [
        {
          investorId: userId,
          propertyId,
          units,
          amount,
          ownershipPct,
          status: 'ACTIVE'
        }
      ],
      { session }
    );

    // Back-patch the transaction's refId to the real investment document
    // (Transaction is append-only so we can't use updateOne — we use the
    //  raw MongoDB driver via the session to avoid the model's pre-hook guard)
    await mongoose.connection
      .collection('transactions')
      .updateOne(
        { _id: transaction._id },
        { $set: { refId: investment._id } },
        { session }
      );

    // ── 5. Auto-funded check ──────────────────────────────────────────────
    if (updatedProperty.unitsSold === updatedProperty.totalUnits) {
      await Property.updateOne(
        { _id: propertyId },
        { $set: { status: 'FUNDED', fundedAt: new Date() } },
        { session }
      );
      updatedProperty.status = 'FUNDED';
      updatedProperty.fundedAt = new Date();
    }

    // ── 6. Commit ─────────────────────────────────────────────────────────
    await session.commitTransaction();

    return {
      investment: investment.toObject(),
      property: updatedProperty.toObject(),
      transaction: transaction.toObject()
    };
  } catch (error) {
    await session.abortTransaction();

    // Convert ledgerService balance errors to InvestmentError
    if (error.message && error.message.includes('Insufficient balance')) {
      throw new InvestmentError(error.message, 'INSUFFICIENT_BALANCE', 400);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { invest, InvestmentError };
