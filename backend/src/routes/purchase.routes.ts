import { Router, Response } from 'express';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/purchases - List all purchases
router.get('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplier, status, paymentStatus, search } = req.query;
    const filter: any = {};

    if (supplier && supplier !== 'All') {
      filter.supplierName = safeRegex(supplier as string);
    }
    if (status && status !== 'All') {
      filter.purchaseStatus = status;
    }
    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }
    if (search) {
      filter.$or = [
        { purchaseNumber: safeRegex(search as string) },
        { supplierName: safeRegex(search as string) },
      ];
    }

    const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: purchases.length, purchases });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/purchases/:id - Single purchase
router.get('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    return res.json({ success: true, purchase });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/purchases - Create new purchase
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      supplierId,
      supplierName,
      items,
      taxAmount = 0,
      discountAmount = 0,
      paidAmount = 0,
      paymentMethod,
      purchaseStatus = 'ORDERED',
      expectedDeliveryDate,
      notes,
    } = req.body;

    if (!supplierName || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Supplier name and at least one item are required' });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.totalCost) || Number(item.unitCost) * Number(item.quantity)), 0);
    const grandTotal = Math.max(0, subtotal + Number(taxAmount) - Number(discountAmount));
    const paid = Number(paidAmount) || 0;
    const balanceAmount = Math.max(0, grandTotal - paid);

    let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (paid >= grandTotal && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paid > 0) {
      paymentStatus = 'PARTIAL';
    }

    const purchaseNumber = `PUR-${Math.floor(10000 + Math.random() * 90000)}`;

    const purchase = new Purchase({
      purchaseNumber,
      supplierId,
      supplierName,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
      paidAmount: paid,
      balanceAmount,
      paymentStatus,
      paymentMethod,
      purchaseStatus,
      expectedDeliveryDate,
      receivedDate: purchaseStatus === 'RECEIVED' ? new Date() : undefined,
      notes,
    });

    await purchase.save();

    // If marked as RECEIVED immediately on creation, update product stock
    if (purchaseStatus === 'RECEIVED') {
      for (const item of items) {
        if (item.productId || item.sku) {
          const product = item.productId
            ? await Product.findById(item.productId)
            : await Product.findOne({ sku: item.sku });

          if (product) {
            const previousStock = product.stock;
            product.stock += Number(item.quantity);
            if (product.stock > (product.lowStockThreshold || product.minStockAlert || 10)) {
              product.status = 'In Stock';
            }
            await product.save();

            const log = new InventoryLog({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              vendor: supplierName,
              vendorName: supplierName,
              type: 'IN',
              quantityChanged: Number(item.quantity),
              previousStock,
              newStock: product.stock,
              reason: `Purchase Received (${purchaseNumber})`,
              performedBy: req.user?.name || 'Administrator',
            });
            await log.save();
          }
        }
      }
    }

    return res.status(201).json({ success: true, message: 'Purchase created successfully', purchase });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/purchases/:id/status - Update purchase status (e.g. mark RECEIVED)
router.put('/:id/status', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const previousStatus = purchase.purchaseStatus;
    purchase.purchaseStatus = status;

    if (status === 'RECEIVED' && previousStatus !== 'RECEIVED') {
      purchase.receivedDate = new Date();

      // Automatically increase inventory stock for items
      for (const item of purchase.items) {
        const product = item.productId
          ? await Product.findById(item.productId)
          : await Product.findOne({ sku: item.sku });

        if (product) {
          const previousStock = product.stock;
          product.stock += Number(item.quantity);
          if (product.stock > (product.lowStockThreshold || product.minStockAlert || 10)) {
            product.status = 'In Stock';
          }
          await product.save();

          const log = new InventoryLog({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            vendor: purchase.supplierName,
            vendorName: purchase.supplierName,
            type: 'IN',
            quantityChanged: Number(item.quantity),
            previousStock,
            newStock: product.stock,
            reason: `Purchase Stock Received (${purchase.purchaseNumber})`,
            performedBy: req.user?.name || 'Administrator',
          });
          await log.save();
        }
      }
    }

    await purchase.save();
    return res.json({ success: true, message: `Purchase status updated to ${status}`, purchase });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
