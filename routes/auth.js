const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, phone: user.phone });
const createToken = user => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone = '' } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    if (normalizedName.length < 2 || normalizedName.length > 80 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        normalizedPassword.length < 8 || Buffer.byteLength(normalizedPassword, 'utf8') > 72) {
      return res.status(400).json({ message: 'Enter a name, a valid email and a password between 8 and 72 bytes.' });
    }
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(normalizedPassword, 12);
    const user = await User.create({ name: normalizedName, email: normalizedEmail, passwordHash, phone: String(phone).trim() });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

module.exports = router;
