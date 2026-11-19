# Zimora Market

A responsive demonstration storefront for a Zimbabwe-focused electronics retailer. The UI uses HTML, CSS and vanilla JavaScript; the API uses Node.js, Express and MongoDB. Checkout is a **simulation only** and does not connect to a payment provider or charge a card/mobile wallet.

## Project structure

```text
zimora-market/
├── middleware/
│   └── auth.js
├── models/
│   ├── Cart.js
│   ├── Order.js
│   ├── Product.js
│   └── User.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── routes/
│   ├── auth.js
│   ├── cart.js
│   ├── orders.js
│   └── products.js
├── scripts/
│   └── seed.js
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```

## Requirements

- Node.js 18 or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Install and run

1. Open a terminal in the project directory.
2. Install packages:

   ```powershell
   npm install
   ```

3. Create a local environment file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edit `.env` and set `JWT_SECRET` to a random secret of at least 24 characters. Set `MONGODB_URI` if your MongoDB server is not at the default local address.
5. Start MongoDB, then load the demo catalogue:

   ```powershell
   npm run seed
   ```

   This seeds 12 products across Phones, Laptops, Audio and Accessories. Re-running the seed script replaces the product catalogue.

6. Start the website:

   ```powershell
   npm start
   ```

7. Visit [http://localhost:3000](http://localhost:3000). For automatic server restarts during development, use `npm run dev` (Node.js 18.11+).

## Features

- Responsive product browsing with category filters, text search and sorting
- Product details, guest shopping bag, quantity controls and a running subtotal
- Registration and sign-in; passwords are stored as bcrypt hashes (8–72 UTF-8 bytes)
- Authenticated user carts and order history API
- Simulated card and EcoCash checkout with input validation and confirmation codes
- A card number ending in `0000` or EcoCash number ending in `00` produces a simulated decline. Other valid-looking details simulate success. Do not enter real payment details.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/products` | List/search/filter products |
| GET | `/api/products/:id` | Product detail |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current account (Bearer token) |
| GET | `/api/cart` | Read account cart (Bearer token) |
| POST | `/api/cart/sync` | Merge guest cart after sign-in |
| POST | `/api/cart/items` | Add item (Bearer token) |
| PATCH | `/api/cart/items/:productId` | Change item quantity (Bearer token) |
| DELETE | `/api/cart/items/:productId` | Remove item (Bearer token) |
| GET | `/api/orders` | List account orders (Bearer token) |
| POST | `/api/orders` | Create a simulated checkout (Bearer token) |

This project is a coursework prototype, not a production commerce system. Before deployment, configure HTTPS, secrets, email verification, stronger input controls and operational monitoring, and integrate a payment provider only through its official secure flow.

The storefront uses hosted Unsplash product photography and Google Fonts, so those visual assets require an internet connection. The app itself and API run locally.
