import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { getJwtSecret } from '../config/jwt';

const router = Router();

import mongoose from 'mongoose';

// Fallback in-memory user registry for development mode when MongoDB is not connected
export const inMemoryUsers: any[] = [];

// Pre-populate default accounts in in-memory store
(async () => {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const vendorHash = await bcrypt.hash('Vendor@123', 10);
  const customerHash = await bcrypt.hash('Customer@123', 10);

  inMemoryUsers.push(
    {
      _id: 'admin-001',
      name: 'System Administrator',
      email: 'admin@smartinventory.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      _id: 'vendor-001',
      name: 'ABC Electronics',
      email: 'vendor@smartinventory.com',
      passwordHash: vendorHash,
      role: 'VENDOR',
      vendorId: 'VEN-001',
      status: 'ACTIVE',
    },
    {
      _id: 'customer-001',
      name: 'Rahul Sharma',
      email: 'customer@smartinventory.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      customerId: 'CUST-001',
      status: 'ACTIVE',
    }
  );
})();

// POST /api/auth/register - Public Customer Self-Registration ONLY
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let existing: any = null;
    if (isMongoConnected) {
      existing = await User.findOne({ email: trimmedEmail });
    } else {
      existing = inMemoryUsers.find((u) => u.email === trimmedEmail);
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

    let user: any;
    if (isMongoConnected) {
      user = new User({
        name,
        email: trimmedEmail,
        passwordHash,
        role: 'CUSTOMER',
        customerId,
        phone,
        address,
        status: 'ACTIVE',
      });
      await user.save();
    } else {
      user = {
        _id: `cust-${Date.now().toString().slice(-4)}`,
        name,
        email: trimmedEmail,
        passwordHash,
        role: 'CUSTOMER',
        customerId,
        phone,
        address,
        status: 'ACTIVE',
      };
      inMemoryUsers.push(user);
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        customerId: user.customerId,
        status: user.status,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        phone: user.phone,
        address: user.address,
        status: user.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login - Unified Authentication with Role Verification
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let user: any = null;
    if (isMongoConnected) {
      user = await User.findOne({ email: trimmedEmail });
    } else {
      user = inMemoryUsers.find((u) => u.email === trimmedEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role Verification: User selected role must match actual account role
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Incorrect account type selected.',
      });
    }

    // Status Verification: Suspended or blocked accounts cannot log in
    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED' || user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status.toLowerCase()}. Please contact the administrator.`,
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        vendorId: user.vendorId,
        customerId: user.customerId,
        companyName: user.companyName,
        status: user.status,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: user.vendorId,
        customerId: user.customerId,
        companyName: user.companyName,
        phone: user.phone,
        address: user.address,
        status: user.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
