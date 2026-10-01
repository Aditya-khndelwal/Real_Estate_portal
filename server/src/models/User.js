const mongoose = require('mongoose');

const userRoles = ['ADMIN', 'BROKER', 'INVESTOR'];
const kycStatuses = ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, default: 'INVESTOR', index: true },
    isActive: { type: Boolean, default: true, index: true },
    brokerApproved: { type: Boolean, default: false },
    kyc: {
      status: { type: String, enum: kycStatuses, default: 'NOT_SUBMITTED' },
      docs: [{ type: String, trim: true }],
      reason: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
