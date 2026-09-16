import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

// Ensure SRV records can resolve properly on Windows local development
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Retain default system DNS if override fails
  }
}

let cachedPromise: Promise<typeof mongoose> | null = null;
let lastAttemptTimestamp = 0;
const RETRY_COOLDOWN_MS = 15000;

export const connectDB = async (): Promise<typeof mongoose | null> => {
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set – skipping MongoDB connection.');
    return null;
  }

  // If already connected, return mongoose instance directly
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const now = Date.now();
  if (now - lastAttemptTimestamp < RETRY_COOLDOWN_MS) {
    return null;
  }
  lastAttemptTimestamp = now;

  // Reuse existing pending connection promise to prevent duplicate connections
  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then((m) => {
      console.log('MongoDB connected successfully');
      return m;
    })
    .catch((err) => {
      cachedPromise = null;
      console.error('MongoDB connection error:', err?.message || 'Connection failed');
      throw err;
    });

  return cachedPromise;
};


