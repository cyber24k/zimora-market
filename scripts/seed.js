require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { name: 'Nova X Pro 5G', slug: 'nova-x-pro-5g', category: 'Phones', description: 'A vivid 6.7-inch AMOLED display, all-day battery and versatile triple-camera system in a refined, pocket-ready design.', price: 749, compareAtPrice: 829, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=85', badge: 'Bestseller', rating: 4.9, stock: 18 },
  { name: 'Pixelwave 9', slug: 'pixelwave-9', category: 'Phones', description: 'Capture everyday moments in crisp detail with intelligent photography, smooth performance and a bright edge-to-edge screen.', price: 629, compareAtPrice: 699, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', badge: 'New arrival', rating: 4.8, stock: 14 },
  { name: 'Orbit Lite 5G', slug: 'orbit-lite-5g', category: 'Phones', description: 'Reliable 5G speed, a generous display and dependable battery life, built for the everyday essentials.', price: 349, compareAtPrice: 399, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85', badge: '', rating: 4.6, stock: 22 },
  { name: 'StudioBook Air 14', slug: 'studiobook-air-14', category: 'Laptops', description: 'A lightweight 14-inch work companion with a sharp display, fast solid-state storage and a full day of productivity.', price: 1099, compareAtPrice: 1199, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85', badge: 'Staff pick', rating: 4.9, stock: 9 },
  { name: 'ThinkPad Pro 15', slug: 'thinkpad-pro-15', category: 'Laptops', description: 'A powerful 15-inch laptop designed for demanding work, comfortable typing and smooth multitasking.', price: 1399, compareAtPrice: 1499, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85', badge: '', rating: 4.8, stock: 7 },
  { name: 'Everyday Chromebook 13', slug: 'everyday-chromebook-13', category: 'Laptops', description: 'A simple, fast-starting notebook for browsing, study and video calls, with a durable compact build.', price: 459, compareAtPrice: 499, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=85', badge: 'Great value', rating: 4.5, stock: 16 },
  { name: 'Pulse ANC Headphones', slug: 'pulse-anc-headphones', category: 'Audio', description: 'Settle into your playlist with rich, balanced sound, comfortable over-ear cushions and adaptive noise reduction.', price: 189, compareAtPrice: 229, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', badge: 'Bestseller', rating: 4.8, stock: 25 },
  { name: 'EchoPods Wireless', slug: 'echopods-wireless', category: 'Audio', description: 'Pocket-friendly wireless earbuds with a clear call microphone, tactile controls and a compact charging case.', price: 89, compareAtPrice: 109, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85', badge: '', rating: 4.6, stock: 31 },
  { name: 'Soundbar Mini', slug: 'soundbar-mini', category: 'Audio', description: 'Give films and music a fuller sound with this clean, compact speaker that fits neatly into smaller spaces.', price: 149, compareAtPrice: 179, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=85', badge: 'New arrival', rating: 4.5, stock: 12 },
  { name: 'MagSafe Duo Charger', slug: 'magsafe-duo-charger', category: 'Accessories', description: 'A tidy, travel-ready wireless charging stand for compatible phones and earbuds. USB-C power adapter sold separately.', price: 59, compareAtPrice: 69, image: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=900&q=85', badge: '', rating: 4.4, stock: 40 },
  { name: 'Powerbank 20K', slug: 'powerbank-20k', category: 'Accessories', description: 'Keep your devices going on the move with a high-capacity power bank, fast USB-C output and clear charge indicators.', price: 49, compareAtPrice: 59, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=85', badge: 'Great value', rating: 4.7, stock: 36 },
  { name: 'FlexFit Smartwatch', slug: 'flexfit-smartwatch', category: 'Accessories', description: 'Track daily activity and receive useful notifications on a bright, easy-to-read display with a comfortable sport band.', price: 129, compareAtPrice: 159, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', badge: '', rating: 4.6, stock: 19 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zimora_market');
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products across 4 categories.`);
  } catch (error) {
    console.error('Product seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
