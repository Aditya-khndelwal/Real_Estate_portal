const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const PASSWORD_HASH_ROUNDS = 11;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return process.env.JWT_SECRET;
};

const createAccessToken = (user) => jwt.sign(
  { userId: user._id.toString() },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
);

const serializeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      role,
      brokerApproved: false
    });

    return res.status(201).json({
      accessToken: createAccessToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    console.error('Signup failed:', error.message);
    return res.status(500).json({ message: 'Unable to create account' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      accessToken: createAccessToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Unable to log in' });
  }
};

const me = (req, res) => res.json({ user: serializeUser(req.user) });

module.exports = { signup, login, me };
