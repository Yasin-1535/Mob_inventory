import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' }); // loads backend/.env

const MONGODB_URI = process.env.MONGODB_URI || '';

export const connectDB = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set – skipping MongoDB connection.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
