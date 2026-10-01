const express = require('express');
const {
  listAllProperties,
  approveProperty,
  rejectProperty,
  changePropertyStatus,
  getPropertyStats
} = require('../controllers/adminPropertyController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();


router.use(authenticate);
router.use(authorize('ADMIN'));

// Admin property management routes
router.get('/properties', listAllProperties);
router.get('/properties/stats', getPropertyStats);

router.patch('/properties/:id/approve', approveProperty);
router.patch('/properties/:id/reject', rejectProperty);
router.patch('/properties/:id/status', changePropertyStatus);

module.exports = router;
