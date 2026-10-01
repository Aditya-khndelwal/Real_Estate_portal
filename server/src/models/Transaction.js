const mongoose = require('mongoose');

const transactionTypes = ['TOPUP', 'INVESTMENT', 'PAYOUT', 'REFUND', 'COMMISSION', 'WITHDRAWAL', 'FEE'];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: transactionTypes, required: true },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'amount must be a positive integer number of paise' }
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'balanceAfter must be an integer number of paise' }
    },
    refType: { type: String, trim: true },
    refId: { type: mongoose.Schema.Types.ObjectId },
    gatewayPaymentId: { type: String, trim: true, index: true }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ refType: 1, refId: 1 });

const appendOnlyError = function appendOnlyError() {
  throw new Error('Transactions are append-only and cannot be modified or deleted');
};

['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'].forEach((method) => {
  transactionSchema.pre(method, appendOnlyError);
});

module.exports = mongoose.model('Transaction', transactionSchema);
