const { invest, InvestmentError } = require('../services/investmentService');
const Investment = require('../models/Investment');

/**
 * POST /api/v1/investments
 * Create a new investment (buy property units)
 * Access: INVESTOR
 */
const createInvestment = async (req, res) => {
  try {
    const { propertyId, units } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required' });
    }

    if (!units) {
      return res.status(400).json({ message: 'units is required' });
    }

    // Call the investment service (handles ACID transaction)
    const result = await invest(userId, propertyId, units);

    return res.status(201).json({
      message: 'Investment created successfully',
      investment: result.investment,
      property: {
        id: result.property._id,
        title: result.property.title,
        status: result.property.status,
        unitsSold: result.property.unitsSold,
        totalUnits: result.property.totalUnits,
        fundingPct: Math.round((result.property.unitsSold / result.property.totalUnits) * 10000) / 100,
        isFunded: result.property.status === 'FUNDED'
      },
      transaction: {
        id: result.transaction._id,
        amount: result.transaction.amount,
        balanceAfter: result.transaction.balanceAfter
      }
    });
  } catch (error) {
    console.error('Create investment failed:', error.message);

    // Handle custom InvestmentError with specific status codes
    if (error instanceof InvestmentError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID format' });
    }

    return res.status(500).json({ message: 'Unable to process investment' });
  }
};

/**
 * GET /api/v1/investments/me
 * Get all investments for the current authenticated user
 * Access: INVESTOR
 */
const getMyInvestments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, sort } = req.query;

    // Build filter
    const filter = { investorId: userId };

    if (status) {
      filter.status = status;
    }

    // Sorting: default to most recent first
    const sortField = sort || '-createdAt';

    // Fetch investments with property details
    const investments = await Investment.find(filter)
      .sort(sortField)
      .populate('propertyId', 'title type city state address images unitPrice totalUnits unitsSold status')
      .lean();

    // Enrich with calculated fields
    const enrichedInvestments = investments.map((inv) => {
      const property = inv.propertyId;

      return {
        ...inv,
        ownershipPct: property ? (inv.units / property.totalUnits) * 100 : 0,
        currentValue: inv.amount, // Placeholder: could be enhanced with appreciation logic
        property: property
          ? {
              ...property,
              fundingPct: Math.round((property.unitsSold / property.totalUnits) * 10000) / 100
            }
          : null
      };
    });

    // Calculate portfolio summary
    const summary = {
      totalInvestments: investments.length,
      totalAmountInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
      activeInvestments: investments.filter((inv) => inv.status === 'ACTIVE').length,
      totalUnitsOwned: investments.reduce((sum, inv) => sum + inv.units, 0)
    };

    return res.json({
      investments: enrichedInvestments,
      summary
    });
  } catch (error) {
    console.error('Get my investments failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch investments' });
  }
};

module.exports = {
  createInvestment,
  getMyInvestments
};
