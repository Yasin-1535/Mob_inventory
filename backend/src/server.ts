import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { seedDatabase } from './config/seed';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import vendorRoutes from './routes/vendor.routes';
import orderRoutes from './routes/order.routes';
import reportRoutes from './routes/report.routes';
import saleRoutes from './routes/sale.routes';
import purchaseRoutes from './routes/purchase.routes';
import returnRoutes from './routes/return.routes';
import expenseRoutes from './routes/expense.routes';
import paymentRoutes from './routes/payment.routes';

import { env, validateEnv } from './config/env';

// Validate critical environment configurations without leaking secrets
validateEnv();

const app = express();
const PORT = env.PORT;
const configuredOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim());


// Configure CORS for both local development and Vercel deployments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin Vercel Services rewrites)
      if (!origin) return callback(null, true);

      // Check against explicit allowed origins or wildcard
      if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel production and preview deployment URLs
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow local development origins
      if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// Ensure database connection in serverless / cloud environments
app.use(async (req, res, next) => {
  if ((process.env.MONGODB_URI || env.MONGODB_URI) && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection middleware error:', err);
    }
  }
  next();
});

// Base API info & Health check routes
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Smart Inventory API', status: 'active' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Inventory API is running' });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// For local standalone development, connect to MongoDB, seed sample data, and start server
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(async () => {
      await seedDatabase();
      app.listen(PORT, () => {
        console.log('-------------------------------------------');
        console.log('🚀 Smart Inventory API Server Active');
        console.log(`📡 Listening on: http://localhost:${PORT}/api`);
        console.log('-------------------------------------------');
      });
    })
    .catch((err) => {
      console.error('Server startup error:', err);
    });
}

// Export the Express application for Vercel Functions / Services
export default app;
export { app };

