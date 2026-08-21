import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/analytics - Admin dashboard & reports metrics
router.get('/analytics', authenticateJWT, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    const orders = await Order.find();
    const customers = await User.find({ role: 'CUSTOMER' });
    const vendors = await User.find({ role: 'VENDOR' });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.grandTotal : 0), 0);
    const totalOrders = orders.length;
    const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Category distribution
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

    // Status breakdown
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
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalCustomers: customers.length,
        totalVendors: vendors.length,
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
});

// GET /api/reports/vendor-analytics - Vendor scoped analytics & performance metrics
router.get('/vendor-analytics', authenticateJWT, requireRole(['VENDOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorConditions: any[] = [];
    if (req.user?.name) vendorConditions.push({ vendor: req.user.name });
    if (req.user?.id) vendorConditions.push({ vendorId: req.user.id });
    if (req.user?.vendorId) vendorConditions.push({ vendorId: req.user.vendorId });
    if (req.user?.companyName) vendorConditions.push({ vendor: req.user.companyName });

    const vendorFilter = vendorConditions.length ? { $or: vendorConditions } : {};

    const saleConditions: any[] = [];
    if (req.user?.name) saleConditions.push({ vendorName: req.user.name });
    if (req.user?.id) saleConditions.push({ vendorId: req.user.id }, { vendor: req.user.id });
    if (req.user?.vendorId) saleConditions.push({ vendorId: req.user.vendorId }, { vendor: req.user.vendorId });
    if (req.user?.companyName) saleConditions.push({ vendorName: req.user.companyName });

    const saleFilter = saleConditions.length ? { $or: saleConditions } : {};

    const vendorProducts = await Product.find(vendorFilter);
    const vendorSales = await (await import('../models/Sale')).Sale.find(saleFilter);

    const totalSuppliedHolding = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalSupplyValuation = vendorProducts.reduce((sum, p) => sum + p.stock * p.price, 0);
    const lowStockCount = vendorProducts.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
    const outOfStockCount = vendorProducts.filter((p) => p.stock === 0).length;

    const totalRevenue = vendorSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalUnitsSold = vendorSales.reduce((sum, s) => sum + s.quantity, 0);

    return res.json({
      success: true,
      data: {
        totalSuppliedProducts: vendorProducts.length,
        totalSuppliedHolding,
        totalSupplyValuation,
        lowStockCount,
        outOfStockCount,
        totalRevenue,
        totalUnitsSold,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
