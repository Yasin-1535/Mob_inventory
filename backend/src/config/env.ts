import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for local development (Vercel automatically injects into process.env)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface EnvConfig {
  PORT: number;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  MONGODB_URI: string;
  SMARTPHONE_SUGGESTION_API_KEY?: string;
  SMARTPHONE_SUGGESTION_PROVIDER: string;
  IS_PRODUCTION: boolean;
  IS_VERCEL: boolean;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  SMARTPHONE_SUGGESTION_API_KEY: process.env.SMARTPHONE_SUGGESTION_API_KEY,
  SMARTPHONE_SUGGESTION_PROVIDER: process.env.SMARTPHONE_SUGGESTION_PROVIDER || 'catalog_provider',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_VERCEL: process.env.VERCEL === '1',
};

/**
 * Validates critical environment configuration without exposing secret values.
 */
export const validateEnv = (): void => {
  const isCloudOrProd = env.IS_PRODUCTION || env.IS_VERCEL;

  if (!env.JWT_SECRET) {
    if (isCloudOrProd) {
      console.error('❌ ERROR: JWT_SECRET environment variable is missing.');
    } else {
      console.warn('⚠️ WARNING: JWT_SECRET is not configured in backend/.env.');
    }
  }

  if (!env.MONGODB_URI) {
    if (isCloudOrProd) {
      console.error('❌ ERROR: MONGODB_URI environment variable is missing.');
    } else {
      console.info('ℹ️ MONGODB_URI not configured. Operating in development mode with fallback store.');
    }
  }
};
