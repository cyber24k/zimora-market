const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true, enum: ['Phones', 'Laptops', 'Audio', 'Accessories'] },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  image: { type: String, required: true },
  badge: { type: String, default: '' },
  rating: { type: Number, default: 4.7, min: 0, max: 5 },
  stock: { type: Number, default: 20, min: 0 }
}, { timestamps: true });

productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
