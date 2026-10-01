const mongoose = require('mongoose');
const {
  postTransaction,
  getWalletBalance,
  getTransactionHistory
} = require('../services/ledgerService');

/**
 * POST /api/v1/wallet/topup
 * Add funds to user's wallet
 * Access: INVESTOR
 *
 * In a production system, this would integrate with a payment gateway
 * (Razorpay, Stripe, etc.) to verify the payment before crediting.
 * For now, we implement a mock flow.
 */
const topupWallet = async (req, res) => {
  try {
    const { amount, gatewayPaymentId } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        message: 'amount must be a positive number (in INR)'
      });
    }

    // Convert INR to paise (integer)
    const amountInPaise = Math.round(amount * 100);

    if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({
        message: 'Minimum topup amount is ₹1.00'
      });
    }

    // Maximum topup limit (e.g., ₹10,00,000)
    const MAX_TOPUP = 10_00_00_000; // 1 crore paise = 10 lakh INR
    if (amountInPaise > MAX_TOPUP) {
      return res.status(400).json({
        message: `Maximum topup amount is ₹${(MAX_TOPUP / 100).toLocaleString('en-IN')}`
      });
    }

    // Mock payment verification
    // In production: verify payment with gateway using gatewayPaymentId
    // For now, we accept all topups as successful

    // Start a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create CREDIT transaction
      const transaction = await postTransaction({
        userId,
        type: 'TOPUP',
        direction: 'CREDIT',
        amount: amountInPaise,
        gatewayPaymentId: gatewayPaymentId || `MOCK_${Date.now()}`,
        session
      });

      await session.commitTransaction();

      return res.status(201).json({
        message: 'Wallet topped up successfully',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          amountInr: (transaction.amount / 100).toFixed(2),
          balanceAfter: transaction.balanceAfter,
          balanceAfterInr: (transaction.balanceAfter / 100).toFixed(2),
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Wallet topup failed:', error.message);

    if (error.message && error.message.includes('Insufficient balance')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Unable to process topup' });
  }
};

/**
 * GET /api/v1/wallet
 * Get current wallet balance
 * Access: INVESTOR
 */
const getBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    const balanceInPaise = await getWalletBalance(userId);

    return res.json({
      balance: balanceInPaise,
      balanceInr: (balanceInPaise / 100).toFixed(2),
      currency: 'INR'
    });
  } catch (error) {
    console.error('Get wallet balance failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch wallet balance' });
  }
};

/**
 * GET /api/v1/wallet/transactions
 * Get transaction history with filters and pagination
 * Access: INVESTOR
 */
const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, startDate, endDate, page, limit } = req.query;

    // Parse pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Validate pagination
    if (pageNum < 1) {
      return res.status(400).json({ message: 'page must be >= 1' });
    }

    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'limit must be between 1 and 100' });
    }

    // Validate type if provided
    const validTypes = ['TOPUP', 'INVESTMENT', 'PAYOUT', 'REFUND', 'COMMISSION', 'WITHDRAWAL', 'FEE'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ message: 'Invalid startDate format' });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: 'Invalid endDate format' });
    }

    const result = await getTransactionHistory({
      userId,
      type,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });

    // Enrich transactions with INR values
    const enrichedTransactions = result.transactions.map((txn) => ({
      ...txn,
      amountInr: (txn.amount / 100).toFixed(2),
      balanceAfterInr: (txn.balanceAfter / 100).toFixed(2)
    }));

    return res.json({
      transactions: enrichedTransactions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get transactions failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch transactions' });
  }
};

module.exports = {
  topupWallet,
  getBalance,
  getTransactions
};
