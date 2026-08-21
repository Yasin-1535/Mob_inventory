import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '../models/User';

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  vendorId?: string;
  customerId?: string;
  companyName?: string;
  status?: UserStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

import { getJwtSecret } from '../config/jwt';

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as AuthPayload;
      if (decoded.status === 'SUSPENDED' || decoded.status === 'BLOCKED' || decoded.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Account is suspended or deactivated. Access denied.',
        });
        return;
      }
      req.user = decoded;
      return next();
    } catch (err: any) {
      if (err.message && err.message.includes('JWT_SECRET')) {
        res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing' });
        return;
      }
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
  }

  res.status(401).json({ success: false, message: 'Authorization header required' });
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
