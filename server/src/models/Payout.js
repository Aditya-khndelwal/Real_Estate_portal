const mongoose = require('mongoose');

const paiseField = {
  type: Number,
  required: true,
  min: 0,
  validate: { validator: Number.isInteger, message: '{PATH} must be an integer number of paise' }
};

const payoutSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    salePrice: paiseField,
    platformFee: paiseField,
    distributable: paiseField,
    items: [
      {
        investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        units: { type: Number, required: true, min: 1, validate: Number.isInteger },
        amount: paiseField
      }
    ],
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    executedAt: { type: Date, default: Date.now, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
