import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { Sale } from '../models/Sale';
import { User } from '../models/User';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/sales - List sales with search and filters
router.get('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, brand, product, vendor, status, startDate, endDate } = req.query;
    const filter: any = {};

    // For VENDOR role, strictly enforce vendor scoping to authenticated user
    if (req.user?.role === 'VENDOR') {
      const vendorConditions: any[] = [
        { vendorId: req.user.id },
        { vendor: req.user.id },
        { vendorName: req.user.name },
      ];
      if (req.user.vendorId) {
        vendorConditions.push({ vendorId: req.user.vendorId }, { vendor: req.user.vendorId });
      }
      if (req.user.companyName) {
        vendorConditions.push({ vendorName: req.user.companyName });
      }
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: vendorConditions });
    } else if (vendor && vendor !== 'All') {
      filter.vendorName = { $regex: vendor as string, $options: 'i' };
    }

    if (status && status !== 'All') {
      filter.saleStatus = status;
    }
    if (brand && brand !== 'All') {
      filter.brand = { $regex: brand as string, $options: 'i' };
    }
    if (product && product !== 'All') {
      filter.productName = { $regex: product as string, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    if (search) {
      const searchOr = [
        { saleId: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { soldBy: { $regex: search, $options: 'i' } },
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: sales.length, sales });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sales/:id - Get single sale details
router.get('/:id', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale record not found' });
    }
    // If VENDOR, verify ownership
    if (req.user?.role === 'VENDOR') {
      const isOwner =
        sale.vendorId?.toString() === req.user.id ||
        (req.user.vendorId && sale.vendorId?.toString() === req.user.vendorId) ||
        sale.vendorName === req.user.name ||
        (req.user.companyName && sale.vendorName === req.user.companyName);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized: access to this sale is forbidden' });
      }
    }
    return res.json({ success: true, sale });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sales - Direct Sell Product & Atomic Stock Deduction with Vendor
router.post('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity = 1, paymentMethod = 'Cash', vendorId, vendorName, notes } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const quantityToSell = Math.floor(Number(quantity));
    if (isNaN(quantityToSell) || quantityToSell < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1 unit' });
    }

    // 1. Vendor Validation & Enforcement
    let resolvedVendorId: any = undefined;
    let resolvedVendorName = vendorName || 'N/A';

    // If request is from an authenticated VENDOR, enforce their identity directly
    if (req.user?.role === 'VENDOR') {
      resolvedVendorId = req.user.vendorId || req.user.id;
      resolvedVendorName = req.user.companyName || req.user.name;
    } else {
      if (!vendorId && !vendorName) {
        return res.status(400).json({ success: false, message: 'Please select a vendor.' });
      }

      if (vendorId) {
        let vendorUser: any = null;
        if (/^[0-9a-fA-F]{24}$/.test(vendorId)) {
          vendorUser = await User.findById(vendorId);
        }
        if (!vendorUser) {
          vendorUser = await User.findOne({
            $or: [{ name: vendorId }, { companyName: vendorId }, { name: vendorName }],
          });
        }

        if (vendorUser) {
          if (vendorUser.status === 'INACTIVE') {
            return res.status(400).json({ success: false, message: 'Selected vendor is currently inactive.' });
          }
          resolvedVendorId = vendorUser._id;
          resolvedVendorName = vendorUser.name;
        } else {
          resolvedVendorName = vendorName || vendorId;
        }
      }
    }

    // 2. Atomic Stock Deduction to prevent race conditions:
    // Only decrement if current stock is greater than or equal to quantityToSell
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantityToSell } },
      { $inc: { stock: -quantityToSell } },
      { new: true }
    );

    if (!updatedProduct) {
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Current stock: ${existingProduct.stock}, requested: ${quantityToSell}`,
      });
    }

    // Auto-update status on Product
    const threshold = updatedProduct.lowStockThreshold || updatedProduct.minStockAlert || 10;
    if (updatedProduct.stock <= 0) {
      updatedProduct.status = 'Out of Stock';
    } else if (updatedProduct.stock <= threshold) {
      updatedProduct.status = 'Low Stock';
    } else {
      updatedProduct.status = 'In Stock';
    }
    await updatedProduct.save();

    const previousStock = updatedProduct.stock + quantityToSell;
    const newStock = updatedProduct.stock;
    const unitPrice = updatedProduct.price;
    const totalAmount = unitPrice * quantityToSell;
    const soldByName = req.user?.name || 'Administrator';

    // 3. Create Inventory Log for audit trail (Operation: OUT, Reason: SALE, with Vendor)
    const log = new InventoryLog({
      productId: updatedProduct._id,
      productName: updatedProduct.name,
      sku: updatedProduct.sku,
      vendor: resolvedVendorId,
      vendorName: resolvedVendorName,
      type: 'OUT',
      quantityChanged: quantityToSell,
      previousStock,
      newStock,
      reason: 'SALE',
      performedBy: soldByName,
    });
    await log.save();

    // 4. Create Sale Record with Vendor info
    const saleId = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const sale = new Sale({
      saleId,
      productId: updatedProduct._id,
      productName: updatedProduct.name,
      brand: updatedProduct.brand || 'N/A',
      sku: updatedProduct.sku,
      category: updatedProduct.category,
      mobileType: updatedProduct.mobileType || undefined,
      vendor: resolvedVendorId,
      vendorId: resolvedVendorId || vendorId,
      vendorName: resolvedVendorName,
      quantity: quantityToSell,
      unitPrice,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: 'PAID',
      saleStatus: 'COMPLETED',
      soldBy: soldByName,
      soldById: req.user?.id,
      remainingStock: newStock,
      notes: notes || `Direct sale of ${quantityToSell} unit(s) via ${resolvedVendorName}`,
    });
    await sale.save();

    return res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        saleId: sale.saleId,
        sale,
        product: updatedProduct,
        vendor: resolvedVendorName,
        remainingStock: newStock,
        unitPrice,
        totalAmount,
        quantity: quantityToSell,
        log,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
