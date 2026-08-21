import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { seedDatabase } from './config/seed';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import vendorRoutes from './routes/vendor.routes';
import orderRoutes from './routes/order.routes';
import reportRoutes from './routes/report.routes';
import saleRoutes from './routes/sale.routes';

dotenv.config();
dotenv.config({ path: __dirname + '/../.env' });
dotenv.config({ path: __dirname + '/../../.env' });

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Validate critical environment configurations
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET environment variable is not defined.');
  console.warn('⚠️ Please configure JWT_SECRET in your backend/.env file.');
}
if (!process.env.MONGODB_URI) {
  console.info('ℹ️ MONGODB_URI not configured. Operating in development mode with fallback store.');
}

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health check route
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
app.use('/api/reports', reportRoutes);

// Connect to MongoDB, seed sample data if needed, and start server
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log('-------------------------------------------');
    console.log('🚀 Smart Inventory API Server Active');
    console.log(`📡 Listening on: http://localhost:${PORT}/api`);
    console.log('-------------------------------------------');
  });
});
