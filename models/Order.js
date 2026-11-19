const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['card', 'ecocash'], required: true },
  paymentStatus: { type: String, enum: ['paid', 'declined'], required: true },
  confirmationCode: { type: String, required: true, unique: true },
  deliveryAddress: { type: String, required: true }
}, { timestamps: true });

orderSchema.index({ user:  1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
