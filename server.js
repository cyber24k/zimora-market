require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const port = Number(process.env.PORT) || 3000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  throw new Error('JWT_SECRET must be set to a random value of at least 24 characters.');
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https://images.unsplash.com', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${port}` }));
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use(express.static('public'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

app.use((req, res) => res.status(404).json({ message: 'The requested resource was not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource identifier.' });
  if (error.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zimora_market')
  .then(() => app.listen(port, () => console.log(`Zimora Market running at http://localhost:${port}`)))
  .catch(error => {
    console.error('Unable to connect to MongoDB:', error.message);
    process.exit(1);
  });
