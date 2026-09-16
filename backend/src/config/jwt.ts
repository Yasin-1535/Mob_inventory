import { env } from './env';

/**
 * JWT Configuration Helper
 * Safely resolves the JWT_SECRET from environment variables without hardcoded fallbacks.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL ERROR: JWT_SECRET environment variable is missing. Please configure JWT_SECRET in your backend/.env file.'
    );
  }
  return secret;
};

