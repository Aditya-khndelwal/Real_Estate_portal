const mongoose = require('mongoose');

const integerPaise = {
  type: Number,
  min: 0,
  validate: {
    validator: Number.isInteger,
    message: '{PATH} must be an integer number of paise'
  }
};

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ['APARTMENT', 'VILLA', 'COMMERCIAL', 'PLOT', 'WAREHOUSE'], required: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    areaSqft: { type: Number, required: true, min: 1, validate: Number.isInteger },
    images: [{ url: { type: String, required: true, trim: true }, publicId: String, name: String }],
    documents: [{ url: { type: String, required: true, trim: true }, publicId: String, name: String }],
    valuation: { ...integerPaise, required: true },
    totalUnits: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPrice: { ...integerPaise, required: true },
    minUnits: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitsSold: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    expectedAppreciationPct: { type: Number, min: 0 },
    rentalYieldPct: { type: Number, min: 0 },
    holdingPeriodMonths: { type: Number, min: 1, validate: Number.isInteger },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'LIVE', 'FUNDED', 'HOLDING', 'SOLD', 'REJECTED', 'CANCELLED'],
      default: 'DRAFT',
      index: true
    },
    rejectionReason: { type: String, trim: true },
    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salePrice: integerPaise,
    approvedAt: Date,
    listedAt: Date,
    fundedAt: Date,
    soldAt: Date
  },
  { timestamps: true }
);

propertySchema.index({ city: 1, status: 1 });
propertySchema.index({ brokerId: 1, status: 1 });

propertySchema.pre('validate', function setUnitPrice(next) {
  if (this.valuation != null && this.totalUnits != null) {
    if (this.valuation % this.totalUnits !== 0) {
      this.invalidate('valuation', 'valuation must divide evenly into whole paise per unit');
    } else if (this.unitPrice == null) {
      this.unitPrice = this.valuation / this.totalUnits;
    }
  }

  if (this.minUnits != null && this.totalUnits != null && this.minUnits > this.totalUnits) {
    this.invalidate('minUnits', 'minUnits cannot exceed totalUnits');
  }

  if (this.unitsSold != null && this.totalUnits != null && this.unitsSold > this.totalUnits) {
    this.invalidate('unitsSold', 'unitsSold cannot exceed totalUnits');
  }

  next();
});

module.exports = mongoose.model('Property', propertySchema);
