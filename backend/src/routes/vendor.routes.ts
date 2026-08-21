import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { VendorRequest } from '../models/VendorRequest';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { inMemoryUsers } from './auth.routes';

const router = Router();

// POST /api/vendors - Admin Creates Vendor & Provisions Auth Account
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      businessName,
      contactPerson,
      email,
      phone,
      address,
      vendorType,
      gstin,
      loginEmail,
      password,
      status = 'ACTIVE',
    } = req.body;

    if (!businessName || !contactPerson || !email || !phone || !loginEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Business name, contact person, email, phone, login email, and temporary password are required',
      });
    }

    const trimmedLogin = loginEmail.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let existing: any = null;
    if (isMongoConnected) {
      existing = await User.findOne({ email: trimmedLogin });
    } else {
      existing = inMemoryUsers.find((u) => u.email === trimmedLogin);
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An account with login email ${loginEmail} already exists`,
      });
    }

    const vendorId = `VEN-${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    let vendorUser: any;
    if (isMongoConnected) {
      vendorUser = new User({
        name: businessName,
        email: trimmedLogin,
        passwordHash,
        role: 'VENDOR',
        vendorId,
        companyName: businessName,
        phone,
        address,
        vendorType: vendorType || 'Authorized Supplier',
        gstin,
        status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      });
      await vendorUser.save();
    } else {
      vendorUser = {
        _id: `ven-user-${Date.now().toString().slice(-4)}`,
        name: businessName,
        email: trimmedLogin,
        passwordHash,
        role: 'VENDOR',
        vendorId,
        companyName: businessName,
        phone,
        address,
        vendorType: vendorType || 'Authorized Supplier',
        gstin,
        status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      };
      inMemoryUsers.push(vendorUser);
    }

    return res.status(201).json({
      success: true,
      message: 'Vendor created and authentication account provisioned successfully',
      vendor: {
        id: vendorUser._id,
        vendorId,
        name: vendorUser.name,
        contactPerson,
        email: email.toLowerCase(),
        loginEmail: trimmedLogin,
        phone,
        address,
        vendorType: vendorUser.vendorType,
        gstin,
        status: vendorUser.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/vendors/:id/status - Admin Updates Vendor Status (Active/Suspended)
router.put('/:id/status', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required (ACTIVE, SUSPENDED)' });
    }

    const isMongoConnected = mongoose.connection.readyState === 1;
    let user: any = null;

    if (isMongoConnected) {
      user = await User.findById(req.params.id);
      if (!user || user.role !== 'VENDOR') {
        return res.status(404).json({ success: false, message: 'Vendor account not found' });
      }
      user.status = status;
      await user.save();
    } else {
      user = inMemoryUsers.find(
        (u) => (u._id === req.params.id || u.vendorId === req.params.id) && u.role === 'VENDOR'
      );
      if (!user) {
        return res.status(404).json({ success: false, message: 'Vendor account not found' });
      }
      user.status = status;
    }

    return res.json({
      success: true,
      message: `Vendor status updated to ${status}`,
      vendor: {
        id: user._id,
        name: user.name,
        vendorId: user.vendorId,
        status: user.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendors - List all registered vendors (Admin only)
router.get('/', authenticateJWT, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let vendors: any[] = [];
    if (isMongoConnected) {
      vendors = await User.find({ role: 'VENDOR' }).select('-passwordHash');
    } else {
      vendors = inMemoryUsers
        .filter((u) => u.role === 'VENDOR')
        .map(({ passwordHash, ...rest }) => rest);
    }
    return res.json({ success: true, count: vendors.length, vendors });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendors/requests - Get purchase requests
router.get('/requests', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.user?.role === 'VENDOR') {
      filter.vendorName = req.user.name;
    }

    const requests = await VendorRequest.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: requests.length, requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vendors/requests - Create purchase request (Admin only)
router.post('/requests', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vendorName, productName, sku, quantityRequested, unitCost, notes, expectedDeliveryDate } = req.body;

    const requestNumber = `PO-${Date.now().toString().slice(-6)}`;
    const totalCost = Number(quantityRequested) * Number(unitCost);

    const request = new VendorRequest({
      requestNumber,
      vendorName,
      productName,
      sku: sku.toUpperCase(),
      quantityRequested: Number(quantityRequested),
      unitCost: Number(unitCost),
      totalCost,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      status: 'PENDING',
      notes,
      settlementStatus: 'PENDING',
    });

    await request.save();
    return res.status(201).json({ success: true, request });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/vendors/requests/:id/status - Update purchase request status
router.put('/requests/:id/status', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: Request, res: Response) => {
  try {
    const { status, settlementStatus, actualDeliveryDate } = req.body;

    const request = await VendorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    if (status) request.status = status;
    if (settlementStatus) request.settlementStatus = settlementStatus;
    if (actualDeliveryDate) request.actualDeliveryDate = new Date(actualDeliveryDate);

    await request.save();
    return res.json({ success: true, request });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendors/settlements - Settlement balances & totals
router.get('/settlements', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.user?.role === 'VENDOR') {
      filter.vendorName = req.user.name;
    }

    const requests = await VendorRequest.find(filter);
    const totalEarnings = requests.reduce((sum, r) => sum + r.totalCost, 0);
    const settledAmount = requests
      .filter((r) => r.settlementStatus === 'SETTLED')
      .reduce((sum, r) => sum + r.totalCost, 0);
    const pendingAmount = totalEarnings - settledAmount;

    return res.json({
      success: true,
      data: {
        totalEarnings,
        settledAmount,
        pendingAmount,
        requests,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
