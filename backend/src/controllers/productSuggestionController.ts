import { Request, Response } from 'express';
import { getSmartphoneSuggestions } from '../services/smartphoneSuggestionService';

// Simple Rate Limiting Guard
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 120;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || now > entry.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + rateLimitWindowMs });
    return true;
  }
  if (entry.count >= maxRequestsPerWindow) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * GET /api/products/suggestions
 * Query parameters:
 *  - q: search term (min 2 chars)
 *  - brand: optional brand filter
 *  - mobileType: optional mobile classification
 */
export async function getProductSuggestions(req: Request, res: Response): Promise<Response> {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many suggestion requests. Please try again shortly.',
        suggestions: [],
      });
    }

    const q = (req.query.q as string) || '';
    const brand = (req.query.brand as string) || '';
    const mobileType = (req.query.mobileType as string) || '';

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const suggestions = await getSmartphoneSuggestions({
      query: q,
      brand,
      mobileType,
      limit: Number.isFinite(limitParam) ? limitParam : undefined,
    });

    return res.json({
      success: true,
      suggestions,
    });
  } catch (err: any) {
    console.error('Error fetching product suggestions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate smartphone product suggestions.',
      suggestions: [],
    });
  }
}
