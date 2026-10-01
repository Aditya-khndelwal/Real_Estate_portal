const Property = require('../models/Property');
const Investment = require('../models/Investment');

/**
 * GET /api/v1/admin/properties
 * Admin view to list all properties with filters and pagination
 * Access: ADMIN only
 */
const listAllProperties = async (req, res) => {
  try {
    const { status, brokerId, city, search, sort, page, limit } = req.query;

    // Build filter query
    const filter = {};

    if (status) {
      // Allow comma-separated statuses for multi-status filtering
      const statuses = status.split(',').map((s) => s.trim());
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }

    if (brokerId) {
      filter.brokerId = brokerId;
    }

    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { city: { $regex: new RegExp(search, 'i') } },
        { address: { $regex: new RegExp(search, 'i') } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortField = sort || '-createdAt';

    // Execute query
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .populate('brokerId', 'name email phone brokerApproved')
        .populate('approvedBy', 'name email')
        .lean(),
      Property.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Admin list properties failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch properties' });
  }
};

/**
 * PATCH /api/v1/admin/properties/:id/approve
 * Approve a property (PENDING_APPROVAL -> LIVE)
 * Access: ADMIN only
 */
const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).populate('brokerId', 'name email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Can only approve properties in PENDING_APPROVAL status
    if (property.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        message: `Cannot approve property with status ${property.status}. Only PENDING_APPROVAL properties can be approved.`
      });
    }

    // Update property to LIVE
    property.status = 'LIVE';
    property.approvedBy = req.user._id;
    property.approvedAt = new Date();
    property.listedAt = new Date();
    property.rejectionReason = undefined; // Clear any previous rejection reason

    await property.save();

    return res.json({
      message: 'Property approved and listed successfully',
      property
    });
  } catch (error) {
    console.error('Approve property failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    return res.status(500).json({ message: 'Unable to approve property' });
  }
};

/**
 * PATCH /api/v1/admin/properties/:id/reject
 * Reject a property (PENDING_APPROVAL -> REJECTED)
 * Access: ADMIN only
 */
const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    // Validate rejection reason
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        message: 'Rejection reason is required and must be a non-empty string'
      });
    }

    if (rejectionReason.trim().length < 10) {
      return res.status(400).json({
        message: 'Rejection reason must be at least 10 characters long'
      });
    }

    const property = await Property.findById(id).populate('brokerId', 'name email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Can only reject properties in PENDING_APPROVAL status
    if (property.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        message: `Cannot reject property with status ${property.status}. Only PENDING_APPROVAL properties can be rejected.`
      });
    }

    // Update property to REJECTED
    property.status = 'REJECTED';
    property.rejectionReason = rejectionReason.trim();

    await property.save();

    return res.json({
      message: 'Property rejected',
      property
    });
  } catch (error) {
    console.error('Reject property failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    return res.status(500).json({ message: 'Unable to reject property' });
  }
};

/**
 * PATCH /api/v1/admin/properties/:id/status
 * Change property status according to business rules
 * Access: ADMIN only
 */
const changePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate new status
    const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'LIVE', 'FUNDED', 'HOLDING', 'SOLD', 'REJECTED', 'CANCELLED'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const property = await Property.findById(id).populate('brokerId', 'name email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const currentStatus = property.status;

    // Can't change if already in the requested status
    if (currentStatus === status) {
      return res.status(400).json({
        message: `Property is already in ${status} status`
      });
    }

    // Define valid state transitions
    const validTransitions = {
      DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
      PENDING_APPROVAL: ['LIVE', 'REJECTED', 'CANCELLED'],
      LIVE: ['FUNDED', 'CANCELLED'],
      FUNDED: ['HOLDING', 'CANCELLED'],
      HOLDING: ['SOLD', 'CANCELLED'],
      REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
      SOLD: [], // Terminal state
      CANCELLED: [] // Terminal state
    };

    // Check if transition is allowed
    const allowedNextStates = validTransitions[currentStatus] || [];
    
    if (!allowedNextStates.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedNextStates.join(', ') || 'none (terminal state)'}`,
        currentStatus,
        requestedStatus: status,
        allowedTransitions: allowedNextStates
      });
    }

    // Business rule validations for specific transitions
    if (status === 'FUNDED') {
      // Check if all units are sold
      if (property.unitsSold < property.totalUnits) {
        return res.status(400).json({
          message: `Cannot mark as FUNDED. Only ${property.unitsSold} of ${property.totalUnits} units are sold.`,
          unitsSold: property.unitsSold,
          totalUnits: property.totalUnits,
          unitsRemaining: property.totalUnits - property.unitsSold
        });
      }
      property.fundedAt = new Date();
    }

    if (status === 'SOLD') {
      // Verify property was in holding period
      if (currentStatus !== 'HOLDING') {
        return res.status(400).json({
          message: 'Property must be in HOLDING status before marking as SOLD'
        });
      }
      property.soldAt = new Date();
    }

    if (status === 'CANCELLED') {
      // Check if there are active investments
      const activeInvestments = await Investment.countDocuments({
        propertyId: id,
        status: 'ACTIVE'
      });

      if (activeInvestments > 0) {
        return res.status(400).json({
          message: `Cannot cancel property with ${activeInvestments} active investments. Refund investors first.`,
          activeInvestments
        });
      }
    }

    if (status === 'LIVE') {
      property.listedAt = new Date();
      if (!property.approvedBy) {
        property.approvedBy = req.user._id;
        property.approvedAt = new Date();
      }
    }

    // Update status
    const previousStatus = property.status;
    property.status = status;

    // Add notes if provided
    if (notes) {
      // You could add a statusHistory array to the Property model for audit trail
      // For now, we'll just log it
      console.log(`Status change for property ${id}: ${previousStatus} -> ${status}. Notes: ${notes}`);
    }

    await property.save();

    return res.json({
      message: `Property status changed from ${previousStatus} to ${status}`,
      property,
      previousStatus,
      newStatus: status
    });
  } catch (error) {
    console.error('Change property status failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    return res.status(500).json({ message: 'Unable to change property status' });
  }
};

/**
 * GET /api/v1/admin/properties/stats
 * Get property statistics for admin dashboard
 * Access: ADMIN only
 */
const getPropertyStats = async (req, res) => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValuation: { $sum: '$valuation' }
        }
      }
    ]);

    const totalProperties = await Property.countDocuments();
    
    const statusCounts = {};
    let totalValuation = 0;

    stats.forEach((stat) => {
      statusCounts[stat._id] = {
        count: stat.count,
        totalValuation: stat.totalValuation
      };
      totalValuation += stat.totalValuation;
    });

    // Count pending approvals
    const pendingApprovals = statusCounts.PENDING_APPROVAL?.count || 0;

    // Get recent properties
    const recentProperties = await Property.find()
      .sort('-createdAt')
      .limit(5)
      .select('title status createdAt brokerId')
      .populate('brokerId', 'name email')
      .lean();

    return res.json({
      totalProperties,
      pendingApprovals,
      totalValuation,
      statusBreakdown: statusCounts,
      recentProperties
    });
  } catch (error) {
    console.error('Get property stats failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch statistics' });
  }
};

module.exports = {
  listAllProperties,
  approveProperty,
  rejectProperty,
  changePropertyStatus,
  getPropertyStats
};
