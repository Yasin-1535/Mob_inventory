import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/inventory/overview
router.get('/overview', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: Request, res: Response) => {
  try {
    const products = await Product.find();

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    return res.json({
      success: true,
      data: {
        totalProducts,
        totalUnits,
        totalInventoryValue,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStockAlert'] },
    }).sort({ stock: 1 });

    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventory/adjust - Stock in/out/adjustment
router.post('/adjust', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, type, quantityChanged, reason } = req.body;

    if (!productId || !type || quantityChanged === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'productId, type, quantityChanged, and reason are required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // If role is VENDOR, verify the product belongs to the authenticated vendor
    if (req.user?.role === 'VENDOR') {
      const isVendorProduct =
        product.vendorId?.toString() === req.user.id ||
        (req.user.vendorId && product.vendorId?.toString() === req.user.vendorId) ||
        product.vendor === req.user.name ||
        (req.user.companyName && product.vendor === req.user.companyName);
      if (!isVendorProduct) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only adjust inventory for your own supplied products',
        });
      }
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'IN' || type === 'RETURN') {
      newStock = previousStock + Math.abs(Number(quantityChanged));
    } else if (type === 'OUT' || type === 'DAMAGE') {
      newStock = Math.max(0, previousStock - Math.abs(Number(quantityChanged)));
    } else if (type === 'ADJUSTMENT') {
      newStock = Math.max(0, Number(quantityChanged));
    }

    product.stock = newStock;
    // Auto-update status
    const threshold = product.lowStockThreshold || product.minStockAlert || 10;
    if (newStock <= 0) {
      product.status = 'Out of Stock';
    } else if (newStock <= threshold) {
      product.status = 'Low Stock';
    } else {
      product.status = 'In Stock';
    }
    await product.save();

    const log = new InventoryLog({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      vendor: req.user?.vendorId || req.user?.id,
      vendorName: req.user?.companyName || req.user?.name || product.vendor,
      type,
      quantityChanged: Number(quantityChanged),
      previousStock,
      newStock,
      reason,
      performedBy: req.user?.name || 'Administrator',
    });
    await log.save();

    return res.json({
      success: true,
      message: 'Stock adjusted successfully',
      product,
      log,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/logs - Transaction audit trail
router.get('/logs', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.user?.role === 'VENDOR') {
      const logConditions: any[] = [
        { vendor: req.user.id },
        { vendorName: req.user.name },
      ];
      if (req.user.vendorId) {
        logConditions.push({ vendor: req.user.vendorId });
      }
      if (req.user.companyName) {
        logConditions.push({ vendorName: req.user.companyName });
      }
      filter.$or = logConditions;
    }
    const logs = await InventoryLog.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
