const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    units: { type: Number, required: true, min: 1, validate: Number.isInteger },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'amount must be an integer number of paise' }
    },
    status: { type: String, enum: ['ACTIVE', 'EXITED', 'REFUNDED'], default: 'ACTIVE', index: true },
    payoutAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'payoutAmount must be an integer number of paise' }
    }
  },
  { timestamps: true }
);

investmentSchema.index({ investorId: 1, propertyId: 1 });
investmentSchema.index({ propertyId: 1, status: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
