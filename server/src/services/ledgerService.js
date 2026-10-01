const Transaction = require('../models/Transaction');

/**
 * postTransaction
 *
 * Creates an append-only ledger entry in the Transaction collection.
 * Calculates the new balanceAfter by fetching the most recent transaction
 * for the user and applying the credit/debit.
 *
 * Must be called within a MongoDB session/transaction context to ensure
 * consistency when multiple transactions are posted concurrently.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.userId - The user this transaction belongs to
 * @param {string} params.type - Transaction type (TOPUP, INVESTMENT, PAYOUT, etc.)
 * @param {string} params.direction - CREDIT or DEBIT
 * @param {number} params.amount - Amount in integer paise (positive)
 * @param {string} [params.refType] - Reference model name (optional)
 * @param {ObjectId} [params.refId] - Reference document ID (optional)
 * @param {string} [params.gatewayPaymentId] - Payment gateway transaction ID (optional)
 * @param {ClientSession} [params.session] - MongoDB session for ACID transactions
 * @returns {Promise<Transaction>} The created transaction document
 */
const postTransaction = async ({
  userId,
  type,
  direction,
  amount,
  refType,
  refId,
  gatewayPaymentId,
  session
}) => {
  // Validate inputs
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!type) {
    throw new Error('type is required');
  }

  if (!['CREDIT', 'DEBIT'].includes(direction)) {
    throw new Error('direction must be CREDIT or DEBIT');
  }

  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error('amount must be a positive integer (paise)');
  }

  // Fetch the most recent transaction to get current balance
  // If a session is provided, use it to ensure read consistency
  const query = Transaction.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('balanceAfter')
    .lean();

  if (session) {
    query.session(session);
  }

  const latestTransaction = await query;
  const currentBalance = latestTransaction ? latestTransaction.balanceAfter : 0;

  // Calculate new balance
  let balanceAfter;
  if (direction === 'CREDIT') {
    balanceAfter = currentBalance + amount;
  } else {
    balanceAfter = currentBalance - amount;
  }

  // Prevent negative balance
  if (balanceAfter < 0) {
    throw new Error(
      `Insufficient balance. Current: ₹${(currentBalance / 100).toFixed(2)}, Required: ₹${(amount / 100).toFixed(2)}`
    );
  }

  // Create transaction entry
  const transactionData = {
    userId,
    type,
    direction,
    amount,
    balanceAfter,
    refType,
    refId,
    gatewayPaymentId
  };

  // If session is provided, use it for the create operation
  const transactions = await Transaction.create(
    session ? [transactionData] : transactionData,
    session ? { session } : undefined
  );

  // Transaction.create returns an array when using session, single doc otherwise
  return Array.isArray(transactions) ? transactions[0] : transactions;
};

/**
 * getWalletBalance
 *
 * Fetches the current wallet balance for a user by finding their most
 * recent transaction's balanceAfter field.
 *
 * Alternative implementation: aggregate all CREDITs and DEBITs, but this
 * is slower and the balanceAfter approach is more efficient.
 *
 * @param {string|ObjectId} userId
 * @param {ClientSession} [session] - Optional MongoDB session for transactional reads
 * @returns {Promise<number>} Balance in integer paise
 */
const getWalletBalance = async (userId, session) => {
  const query = Transaction.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('balanceAfter')
    .lean();

  if (session) {
    query.session(session);
  }

  const latestTransaction = await query;

  return latestTransaction ? latestTransaction.balanceAfter : 0;
};

/**
 * getTransactionHistory
 *
 * Fetches paginated transaction history for a user with optional filters.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.userId
 * @param {string} [params.type] - Filter by transaction type
 * @param {Date} [params.startDate] - Filter transactions from this date
 * @param {Date} [params.endDate] - Filter transactions until this date
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Results per page
 * @returns {Promise<{ transactions: Array, pagination: Object }>}
 */
const getTransactionHistory = async ({
  userId,
  type,
  startDate,
  endDate,
  page = 1,
  limit = 20
}) => {
  // Build filter
  const filter = { userId };

  if (type) {
    filter.type = type;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  postTransaction,
  getWalletBalance,
  getTransactionHistory
};
