import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Sale } from '../models/Sale';
import { Purchase } from '../models/Purchase';
import { Expense } from '../models/Expense';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/analytics & aliases - Admin dashboard & complete business metrics
const getAnalyticsHandler = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    const orders = await Order.find();
    const sales = await Sale.find();
    const purchases = await Purchase.find();
    const expenses = await Expense.find();
    const customers = await User.find({ role: 'CUSTOMER' });
    const suppliers = await User.find({ role: 'VENDOR' });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Sales Metrics
    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todaySalesRevenue = sales
      .filter((s) => new Date(s.createdAt) >= todayStart)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    // 2. Purchases Metrics
    const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const todayPurchasesCost = purchases
      .filter((p) => new Date(p.createdAt) >= todayStart)
      .reduce((sum, p) => sum + p.grandTotal, 0);

    // 3. Expenses Metrics
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = expenses
      .filter((e) => new Date(e.date) >= todayStart)
      .reduce((sum, e) => sum + e.amount, 0);

    // 4. Receivables & Payables
    const customerReceivables = sales
      .filter((s) => s.paymentStatus === 'PENDING')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const supplierPayables = purchases
      .filter((p) => p.paymentStatus === 'UNPAID' || p.paymentStatus === 'PARTIAL')
      .reduce((sum, p) => sum + p.balanceAmount, 0);

    // 5. Inventory Valuation
    const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // 6. Net Business Position (Profit/Loss Indicator)
    // Estimated Cost of Goods Sold from completed sales
    const estimatedCOGS = sales.reduce((sum, s) => sum + (s.totalAmount * 0.7), 0);
    const grossProfit = Math.max(0, totalSalesRevenue - estimatedCOGS);
    const netProfit = totalSalesRevenue - (estimatedCOGS + totalExpenses);

    // 7. Category distribution
    const categoryMap: { [key: string]: { count: number; value: number } } = {};
    products.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { count: 0, value: 0 };
      }
      categoryMap[p.category].count += 1;
      categoryMap[p.category].value += p.stock * p.price;
    });

    const categoryStats = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat].count,
      value: categoryMap[cat].value,
    }));

    // 8. Order Status Breakdown
    const orderStatusCounts = {
      PENDING: orders.filter((o) => o.orderStatus === 'PENDING').length,
      PROCESSING: orders.filter((o) => o.orderStatus === 'PROCESSING').length,
      SHIPPED: orders.filter((o) => o.orderStatus === 'SHIPPED').length,
      DELIVERED: orders.filter((o) => o.orderStatus === 'DELIVERED').length,
      CANCELLED: orders.filter((o) => o.orderStatus === 'CANCELLED').length,
    };

    return res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalSalesRevenue * 100) / 100,
        todaySales: Math.round(todaySalesRevenue * 100) / 100,
        totalPurchases: Math.round(totalPurchasesCost * 100) / 100,
        todayPurchases: Math.round(todayPurchasesCost * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        todayExpenses: Math.round(todayExpenses * 100) / 100,
        customerReceivables: Math.round(customerReceivables * 100) / 100,
        supplierPayables: Math.round(supplierPayables * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalVendors: suppliers.length,
        totalProducts: products.length,
        totalUnitsInStock,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        categoryStats,
        orderStatusCounts,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/analytics', authenticateJWT, requireRole(['ADMIN']), getAnalyticsHandler);
router.get('/dashboard', authenticateJWT, requireRole(['ADMIN']), getAnalyticsHandler);
router.get('/business-summary', authenticateJWT, requireRole(['ADMIN']), getAnalyticsHandler);

export default router;
