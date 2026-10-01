const express = require('express');
const { topupWallet, getBalance, getTransactions } = require('../controllers/walletController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

// POST /api/v1/wallet/topup - Add funds to wallet
router.post('/topup', authorize('INVESTOR'), topupWallet);

// GET /api/v1/wallet - Get current balance
router.get('/', authorize('INVESTOR'), getBalance);

// GET /api/v1/wallet/transactions - Get transaction history
router.get('/transactions', authorize('INVESTOR'), getTransactions);

module.exports = router;
