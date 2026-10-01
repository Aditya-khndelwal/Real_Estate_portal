const Property = require('../models/Property');
const Investment = require('../models/Investment');

/**
 * POST /api/v1/properties
 * Create a new property draft
 * Access: BROKER, ADMIN
 */
const createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      brokerId: req.user._id,
      status: 'DRAFT',
      unitsSold: 0
    };

    // Calculate unitPrice server-side (validation already ensures clean division)
    if (propertyData.valuation && propertyData.totalUnits) {
      propertyData.unitPrice = propertyData.valuation / propertyData.totalUnits;
    }

    const property = await Property.create(propertyData);

    return res.status(201).json({
      message: 'Property draft created successfully',
      property
    });
  } catch (error) {
    console.error('Create property failed:', error.message);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    return res.status(500).json({ message: 'Unable to create property' });
  }
};

/**
 * GET /api/v1/properties
 * List properties with filters and pagination
 * Access: Public
 */
const listProperties = async (req, res) => {
  try {
    const { city, type, minPrice, maxPrice, status, search, sort, page, limit } = req.query;

    // Build filter query
    const filter = {};

    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }

    if (type) {
      filter.type = type;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.unitPrice = {};
      if (minPrice !== undefined) {
        filter.unitPrice.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter.unitPrice.$lte = maxPrice;
      }
    }

    if (status) {
      filter.status = status;
    } else {
      // By default, show only LIVE and FUNDED properties for public view
      filter.status = { $in: ['LIVE', 'FUNDED'] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { city: { $regex: new RegExp(search, 'i') } },
        { address: { $regex: new RegExp(search, 'i') } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('brokerId', 'name email')
        .lean(),
      Property.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.json({
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('List properties failed:', error.message);
    return res.status(500).json({ message: 'Unable to fetch properties' });
  }
};

/**
 * GET /api/v1/properties/:id
 * Get property details with calculated fields
 * Access: Public
 */
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id)
      .populate('brokerId', 'name email phone')
      .populate('approvedBy', 'name email')
      .lean();

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Calculate additional fields
    const fundingPct = property.totalUnits > 0 
      ? Math.round((property.unitsSold / property.totalUnits) * 10000) / 100 
      : 0;

    // Get unique investor count
    const investorCount = await Investment.distinct('investorId', {
      propertyId: id,
      status: 'ACTIVE'
    }).then((investors) => investors.length);

    const enrichedProperty = {
      ...property,
      fundingPct,
      investorCount,
      unitsAvailable: property.totalUnits - property.unitsSold
    };

    return res.json({ property: enrichedProperty });
  } catch (error) {
    console.error('Get property failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    return res.status(500).json({ message: 'Unable to fetch property' });
  }
};

/**
 * PUT /api/v1/properties/:id
 * Update property draft
 * Access: Owner broker or ADMIN
 */
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the property
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check ownership: must be owner broker or admin
    const isOwner = property.brokerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to update this property' });
    }

    // Business rule: once LIVE or higher, valuation/totalUnits/unitPrice cannot be modified
    const immutableStatuses = ['LIVE', 'FUNDED', 'HOLDING', 'SOLD'];
    if (immutableStatuses.includes(property.status)) {
      const restrictedFields = ['valuation', 'totalUnits', 'unitPrice'];
      const attemptedRestricted = restrictedFields.some((field) => updates[field] !== undefined);

      if (attemptedRestricted) {
        return res.status(403).json({
          message: 'Cannot modify valuation, totalUnits, or unitPrice once property is LIVE or beyond'
        });
      }
    }

    // If valuation or totalUnits is being updated, recalculate unitPrice
    const newValuation = updates.valuation ?? property.valuation;
    const newTotalUnits = updates.totalUnits ?? property.totalUnits;

    if (newValuation && newTotalUnits) {
      // Validation already checked divisibility, but double-check
      if (newValuation % newTotalUnits !== 0) {
        return res.status(400).json({
          message: 'Valuation must divide evenly by total units'
        });
      }
      updates.unitPrice = newValuation / newTotalUnits;
    }

    // Perform update
    Object.assign(property, updates);
    await property.save();

    return res.json({
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    console.error('Update property failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    return res.status(500).json({ message: 'Unable to update property' });
  }
};

/**
 * POST /api/v1/properties/:id/submit
 * Submit property for approval
 * Access: Owner broker only
 */
const submitPropertyForApproval = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the property
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check ownership: must be owner broker
    const isOwner = property.brokerId.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ message: 'Only the property owner can submit for approval' });
    }

    // Only DRAFT or REJECTED properties can be submitted
    if (!['DRAFT', 'REJECTED'].includes(property.status)) {
      return res.status(400).json({
        message: `Cannot submit property with status ${property.status}. Only DRAFT or REJECTED properties can be submitted.`
      });
    }

    // Validation: Check minimum required fields
    const requiredFields = [
      'title',
      'description',
      'type',
      'address',
      'city',
      'state',
      'pincode',
      'areaSqft',
      'valuation',
      'totalUnits',
      'minUnits',
      'unitPrice'
    ];

    const missingFields = requiredFields.filter((field) => !property[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validation: At least 3 images required
    if (!property.images || property.images.length < 3) {
      return res.status(400).json({
        message: 'At least 3 property images are required for submission'
      });
    }

    // Update status to PENDING_APPROVAL
    property.status = 'PENDING_APPROVAL';
    property.rejectionReason = undefined; // Clear any previous rejection reason
    await property.save();

    return res.json({
      message: 'Property submitted for approval successfully',
      property
    });
  } catch (error) {
    console.error('Submit property failed:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    return res.status(500).json({ message: 'Unable to submit property' });
  }
};

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  submitPropertyForApproval
};
