const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return process.env.JWT_SECRET;
};

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const userId = typeof payload === 'object' && payload ? payload.userId : null;
    const user = userId ? await User.findOne({ _id: userId, isActive: true }) : null;

    if (!user) {
      return res.status(401).json({ message: 'User is not authenticated or is inactive' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = { authenticate, authorize };
