const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

async function getPopulatedCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart.populate('items.product');
}

router.get('/', async (req, res, next) => {
  try { res.json({ cart: await getPopulatedCart(req.userId) }); }
  catch (error) { next(error); }
});

router.post('/sync', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await Cart.findOneAndUpdate({ user: req.userId }, { $setOnInsert: { items: [] } }, { upsert: true, new: true });
    for (const item of items.slice(0, 30)) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < 1) continue;
      const quantity = Math.min(20, product.stock, Math.max(1, Number(item.quantity) || 1));
      const existing = cart.items.find(line => line.product.toString() === product._id.toString());
      if (existing) existing.quantity = Math.min(20, product.stock, existing.quantity + quantity);
      else cart.items.push({ product: product._id, quantity });
    }
    await cart.save();
    res.json({ cart: await cart.populate('items.product') });
  } catch (error) { next(error); }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.stock < 1) return res.status(409).json({ message: 'This item is currently out of stock.' });
    const cart = await Cart.findOneAndUpdate({ user: req.userId }, { $setOnInsert: { items: [] } }, { upsert: true, new: true });
    const existing = cart.items.find(line => line.product.toString() === productId);
    const nextQuantity = Math.min(20, Math.max(1, Number(quantity) || 1));
    if (existing && existing.quantity + nextQuantity > product.stock) {
      return res.status(409).json({ message: `Only ${product.stock} ${product.stock === 1 ? 'unit is' : 'units are'} available.` });
    }
    if (!existing && nextQuantity > product.stock) {
      return res.status(409).json({ message: `Only ${product.stock} ${product.stock === 1 ? 'unit is' : 'units are'} available.` });
    }
    if (existing) existing.quantity += nextQuantity;
    else cart.items.push({ product: product._id, quantity: nextQuantity });
    await cart.save();
    res.json({ cart: await cart.populate('items.product') });
  } catch (error) { next(error); }
});

router.patch('/items/:productId', async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ message: 'Quantity must be between 1 and 20.' });
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    const item = cart.items.find(line => line.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart.' });
    const product = await Product.findById(req.params.productId);
    if (!product || quantity > product.stock) return res.status(409).json({ message: `Only ${product ? product.stock : 0} ${product && product.stock === 1 ? 'unit is' : 'units are'} available.` });
    item.quantity = quantity;
    await cart.save();
    res.json({ cart: await cart.populate('items.product') });
  } catch (error) { next(error); }
});

router.delete('/items/:productId', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.json({ cart: { items: [] } });
    cart.items = cart.items.filter(line => line.product.toString() !== req.params.productId);
    await cart.save();
    res.json({ cart: await cart.populate('items.product') });
  } catch (error) { next(error); }
});

module.exports = router;
