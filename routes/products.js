const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, q, sort } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (q) filter.$text = { $search: String(q).slice(0, 100) };
    const sortOptions = {
      featured: { createdAt: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      rating: { rating: -1 }
    };
    const products = await Product.find(filter).sort(sortOptions[sort] || sortOptions.featured).limit(60);
    res.json({ products });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (error) { next(error); }
});

module.exports = router;
