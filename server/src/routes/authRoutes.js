const express = require('express');
const { signup, login, me } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { signupSchema, loginSchema, validateBody } = require('../validators/authValidator');

const router = express.Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, me);

module.exports = router;
