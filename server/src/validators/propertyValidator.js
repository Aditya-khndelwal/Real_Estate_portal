const { z } = require('zod');

const propertyTypes = ['APARTMENT', 'VILLA', 'COMMERCIAL', 'PLOT', 'WAREHOUSE'];

// Helper to validate integer paise
const paiseSchema = z
  .number()
  .int('Must be an integer number of paise')
  .min(0, 'Must be non-negative');

// Image schema
const imageSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
  publicId: z.string().trim().optional(),
  name: z.string().trim().optional()
});

// Document schema
const documentSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
  publicId: z.string().trim().optional(),
  name: z.string().trim().optional()
});

// Main property creation schema
const createPropertySchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
    type: z.enum(propertyTypes, {
      errorMap: () => ({ message: `Type must be one of: ${propertyTypes.join(', ')}` })
    }),
    address: z.string().trim().min(10, 'Address must be at least 10 characters').max(500),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State is required').max(100),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    areaSqft: z.number().int('Area must be an integer').min(1, 'Area must be at least 1 sq ft'),
    valuation: paiseSchema.min(1, 'Valuation must be positive'),
    totalUnits: z.number().int('Total units must be an integer').min(1, 'Must have at least 1 unit'),
    minUnits: z.number().int('Minimum units must be an integer').min(1, 'Minimum units must be at least 1'),
    expectedAppreciationPct: z.number().min(0, 'Expected appreciation must be non-negative').optional(),
    rentalYieldPct: z.number().min(0, 'Rental yield must be non-negative').optional(),
    holdingPeriodMonths: z
      .number()
      .int('Holding period must be an integer')
      .min(1, 'Holding period must be at least 1 month')
      .optional(),
    images: z.array(imageSchema).optional().default([]),
    documents: z.array(documentSchema).optional().default([])
  })
  .refine(
    (data) => {
      // Validate that valuation divides cleanly by totalUnits (no fractional paise)
      return data.valuation % data.totalUnits === 0;
    },
    {
      message: 'Valuation must divide evenly by total units (no fractional paise per unit)',
      path: ['valuation']
    }
  )
  .refine(
    (data) => {
      // Validate that minUnits doesn't exceed totalUnits
      return data.minUnits <= data.totalUnits;
    },
    {
      message: 'Minimum units cannot exceed total units',
      path: ['minUnits']
    }
  );

// Update property schema (similar but more flexible)
const updatePropertySchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200).optional(),
    description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000).optional(),
    type: z.enum(propertyTypes).optional(),
    address: z.string().trim().min(10, 'Address must be at least 10 characters').max(500).optional(),
    city: z.string().trim().min(2, 'City is required').max(100).optional(),
    state: z.string().trim().min(2, 'State is required').max(100).optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
    areaSqft: z.number().int('Area must be an integer').min(1, 'Area must be at least 1 sq ft').optional(),
    valuation: paiseSchema.min(1, 'Valuation must be positive').optional(),
    totalUnits: z.number().int('Total units must be an integer').min(1, 'Must have at least 1 unit').optional(),
    minUnits: z.number().int('Minimum units must be an integer').min(1, 'Minimum units must be at least 1').optional(),
    expectedAppreciationPct: z.number().min(0, 'Expected appreciation must be non-negative').optional(),
    rentalYieldPct: z.number().min(0, 'Rental yield must be non-negative').optional(),
    holdingPeriodMonths: z.number().int('Holding period must be an integer').min(1, 'Holding period must be at least 1 month').optional(),
    images: z.array(imageSchema).optional(),
    documents: z.array(documentSchema).optional()
  })
  .refine(
    (data) => {
      // If both valuation and totalUnits are provided, validate divisibility
      if (data.valuation !== undefined && data.totalUnits !== undefined) {
        return data.valuation % data.totalUnits === 0;
      }
      return true;
    },
    {
      message: 'Valuation must divide evenly by total units (no fractional paise per unit)',
      path: ['valuation']
    }
  )
  .refine(
    (data) => {
      // If both minUnits and totalUnits are provided, validate relationship
      if (data.minUnits !== undefined && data.totalUnits !== undefined) {
        return data.minUnits <= data.totalUnits;
      }
      return true;
    },
    {
      message: 'Minimum units cannot exceed total units',
      path: ['minUnits']
    }
  );

// Query parameters schema for listing
const listPropertiesQuerySchema = z.object({
  city: z.string().trim().optional(),
  type: z.enum(propertyTypes).optional(),
  minPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(['createdAt', '-createdAt', 'valuation', '-valuation', 'unitPrice', '-unitPrice']).optional().default('-createdAt'),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20')
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    });
  }

  req.body = result.data;
  return next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid query parameters',
      errors: result.error.flatten().fieldErrors
    });
  }

  req.query = result.data;
  return next();
};

module.exports = {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
  validateBody,
  validateQuery
};
