const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'amount must be a positive integer number of paise' }
    },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    bankDetails: {
      accountHolderName: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, trim: true, uppercase: true },
      bankName: { type: String, trim: true }
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
