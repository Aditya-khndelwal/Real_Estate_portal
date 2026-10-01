const express = require('express');
const { createInvestment, getMyInvestments } = require('../controllers/investmentController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All investment routes require authentication
router.use(authenticate);

// POST /api/v1/investments - Create new investment
router.post('/', authorize('INVESTOR'), createInvestment);

// GET /api/v1/investments/me - Get current user's investments
router.get('/me', authorize('INVESTOR'), getMyInvestments);

module.exports = router;
