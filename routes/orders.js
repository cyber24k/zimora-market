const express = require('express');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).limit(25);
    res.json({ orders });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { paymentMethod, paymentDetails, deliveryAddress } = req.body;
    const address = String(deliveryAddress || '').trim();
    if (!['card', 'ecocash'].includes(paymentMethod)) return res.status(400).json({ message: 'Choose a supported payment method.' });
    if (address.length < 8 || address.length > 300) return res.status(400).json({ message: 'Enter a complete delivery address.' });
    const details = paymentDetails || {};
    if (paymentMethod === 'card') {
      const digits = String(details.cardNumber || '').replace(/\D/g, '');
      if (!/^\d{13,19}$/.test(digits) || !/^\d{3,4}$/.test(String(details.cvv || '')) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(details.expiry || ''))) {
        return res.status(400).json({ message: 'Check the card number, expiry date and security code.' });
      }
    } else if (!/^(\+263|0)7\d{8}$/.test(String(details.phone || '').replace(/[\s-]/g, ''))) {
      return res.status(400).json({ message: 'Enter a valid Zimbabwe mobile money number.' });
    }

    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Your cart is empty.' });
    const lines = [];
    for (const line of cart.items) {
      if (!line.product || line.product.stock < line.quantity) {
        return res.status(409).json({ message: `Not enough stock for ${line.product ? line.product.name : 'an item'}; please update your cart.` });
      }
      lines.push({ product: line.product._id, name: line.product.name, image: line.product.image, unitPrice: line.product.price, quantity: line.quantity });
    }
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const testReference = paymentMethod === 'card'
      ? String(details.cardNumber).replace(/\D/g, '').slice(-4)
      : String(details.phone).replace(/\D/g, '').slice(-2);
    const approved = paymentMethod === 'card' ? testReference !== '0000' : testReference !== '00';
    const confirmationCode = `ZM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const order = await Order.create({
      user: req.userId, items: lines, total, paymentMethod,
      paymentStatus: approved ? 'paid' : 'declined',
      confirmationCode, deliveryAddress: address
    });
    if (approved) {
      for (const line of cart.items) {
        await Product.updateOne({ _id: line.product._id }, { $inc: { stock: -line.quantity } });
      }
      cart.items = [];
      await cart.save();
    }
    res.status(201).json({
      order,
      result: approved ? 'success' : 'failure',
      message: approved
        ? 'Payment approved in simulation. Your order is confirmed.'
        : 'Payment was declined in this simulation. No money was charged; you can try again.'
    });
  } catch (error) { next(error); }
});

module.exports = router;
