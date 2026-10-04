import { Router, Response } from 'express';
import { Expense } from '../models/Expense';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/expenses - List all expenses
router.get('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, startDate, endDate, search } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    if (search) {
      filter.$or = [
        { expenseNumber: safeRegex(search as string) },
        { title: safeRegex(search as string) },
        { recipient: safeRegex(search as string) },
      ];
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({ success: true, count: expenses.length, totalAmount, expenses });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses - Create new expense
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, title, amount, date, paymentMethod, recipient, notes } = req.body;

    if (!category || !title || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Category, title, and amount are required' });
    }

    const expenseNumber = `EXP-${Math.floor(10000 + Math.random() * 90000)}`;

    const expense = new Expense({
      expenseNumber,
      category,
      title,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'CASH',
      recipient: recipient || '',
      notes: notes || '',
      createdBy: req.user?.name || 'Administrator',
    });

    await expense.save();
    return res.status(201).json({ success: true, message: 'Expense recorded successfully', expense });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
