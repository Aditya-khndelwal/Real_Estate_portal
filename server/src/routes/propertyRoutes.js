const express = require('express');
const {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  submitPropertyForApproval
} = require('../controllers/propertyController');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesQuerySchema,
  validateBody,
  validateQuery
} = require('../validators/propertyValidator');

const router = express.Router();

// Public routes
router.get(
  '/',
  validateQuery(listPropertiesQuerySchema),
  listProperties
);

router.get('/:id', getPropertyById);

// Protected routes - Create property (BROKER or ADMIN)
router.post(
  '/',
  authenticate,
  authorize('BROKER', 'ADMIN'),
  validateBody(createPropertySchema),
  createProperty
);

// Protected routes - Update property (Owner broker or ADMIN)
router.put(
  '/:id',
  authenticate,
  authorize('BROKER', 'ADMIN'),
  validateBody(updatePropertySchema),
  updateProperty
);

// Protected routes - Submit for approval (Owner broker only)
router.post(
  '/:id/submit',
  authenticate,
  authorize('BROKER'),
  submitPropertyForApproval
);

module.exports = router;
