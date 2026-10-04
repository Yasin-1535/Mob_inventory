import { Router, Response } from 'express';
import { Payment } from '../models/Payment';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/payments - List payments with filters
router.get('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, partyType, method, search } = req.query;
    const filter: any = {};

    if (type && type !== 'All') {
      filter.paymentType = type;
    }
    if (partyType && partyType !== 'All') {
      filter.partyType = partyType;
    }
    if (method && method !== 'All') {
      filter.paymentMethod = method;
    }
    if (search) {
      filter.$or = [
        { paymentNumber: safeRegex(search as string) },
        { partyName: safeRegex(search as string) },
        { referenceNumber: safeRegex(search as string) },
      ];
    }

    const payments = await Payment.find(filter).sort({ paymentDate: -1 });

    const totalReceipts = payments
      .filter((p) => p.paymentType === 'RECEIPT')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDisbursements = payments
      .filter((p) => p.paymentType === 'DISBURSEMENT')
      .reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      count: payments.length,
      totalReceipts,
      totalDisbursements,
      payments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments - Record new payment
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      paymentType,
      partyId,
      partyName,
      partyType,
      amount,
      paymentMethod = 'CASH',
      referenceTransactionId,
      referenceNumber,
      paymentDate,
      notes,
    } = req.body;

    if (!paymentType || !partyName || !partyType || amount === undefined) {
      return res.status(400).json({ success: false, message: 'paymentType, partyName, partyType, and amount are required' });
    }

    const paymentNumber = `PAY-${Math.floor(10000 + Math.random() * 90000)}`;

    const payment = new Payment({
      paymentNumber,
      paymentType,
      partyId,
      partyName,
      partyType,
      amount: Number(amount),
      paymentMethod,
      referenceTransactionId,
      referenceNumber: referenceNumber || '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: notes || '',
      recordedBy: req.user?.name || 'Administrator',
    });

    await payment.save();
    return res.status(201).json({ success: true, message: 'Payment recorded successfully', payment });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
