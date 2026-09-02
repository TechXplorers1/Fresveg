import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/carts.js';
import orderRoutes from './routes/orders.js';
import notificationRoutes from './routes/notifications.js';
import farmRoutes from './routes/farms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/farms', farmRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Initialize Database & Start Express Server
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 FresVeg PostgreSQL Backend Server running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

startServer();
