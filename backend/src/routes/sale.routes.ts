import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { Sale, ISaleItem } from '../models/Sale';
import { User } from '../models/User';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/sales - List sales with search and filters
router.get('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, brand, product, vendor, status, startDate, endDate } = req.query;
    const filter: any = {};
    const andConditions: any[] = [];

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
      andConditions.push({ $or: vendorConditions });
    } else if (vendor && vendor !== 'All') {
      filter.vendorName = safeRegex(vendor as string);
    }

    if (status && status !== 'All') {
      filter.saleStatus = status;
    }
    if (brand && brand !== 'All') {
      andConditions.push({
        $or: [
          { brand: safeRegex(brand as string) },
          { 'items.brand': safeRegex(brand as string) },
        ],
      });
    }
    if (product && product !== 'All') {
      andConditions.push({
        $or: [
          { productName: safeRegex(product as string) },
          { 'items.productName': safeRegex(product as string) },
        ],
      });
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    if (search) {
      const safeS = safeRegex(search as string);
      const searchOr = [
        { saleId: safeS },
        { productName: safeS },
        { sku: safeS },
        { 'items.productName': safeS },
        { 'items.sku': safeS },
        { brand: safeS },
        { vendorName: safeS },
        { customerName: safeS },
        { soldBy: safeS },
      ];
      andConditions.push({ $or: searchOr });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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

// POST /api/sales - Multi-Product Sale & Atomic Inventory Deduction (Tasks 1B, 1C, 1D, 1E)
router.post('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      buyerType = 'VENDOR',
      vendorId,
      vendorName,
      customerName,
      customerPhone,
      items, // Multi-item format: [{ productId, quantity, unitPrice, imeis, discount, tax }]
      productId, // Legacy single-item format
      quantity = 1,
      unitPrice: legacyUnitPrice,
      imeis: legacyImeis,
      paymentMethod = 'Cash',
      paymentStatus = 'PAID',
      discountAmount = 0,
      taxAmount = 0,
      notes,
    } = req.body;

    // 1. Normalize items array
    let rawItems: any[] = [];
    if (Array.isArray(items) && items.length > 0) {
      rawItems = items;
    } else if (productId) {
      rawItems = [
        {
          productId,
          quantity,
          unitPrice: legacyUnitPrice,
          imeis: legacyImeis,
        },
      ];
    } else {
      return res.status(400).json({ success: false, message: 'Sale items or Product ID is required' });
    }

    // 2. Vendor / Buyer Validation & Resolution
    let resolvedVendorId: any = undefined;
    let resolvedVendorName = vendorName || customerName || 'N/A';

    if (req.user?.role === 'VENDOR') {
      resolvedVendorId = req.user.vendorId || req.user.id;
      resolvedVendorName = req.user.companyName || req.user.name;
    } else {
      if (buyerType === 'VENDOR') {
        if (!vendorId && !vendorName && !customerName) {
          return res.status(400).json({ success: false, message: 'Please select a vendor for this B2B sale.' });
        }

        const targetIdOrName = vendorId || vendorName || customerName;
        let vendorUser: any = null;
        if (targetIdOrName && mongoose.Types.ObjectId.isValid(targetIdOrName)) {
          vendorUser = await User.findById(targetIdOrName);
        }
        if (!vendorUser && targetIdOrName) {
          vendorUser = await User.findOne({
            $or: [{ name: targetIdOrName }, { companyName: targetIdOrName }, { name: vendorName }],
          });
        }

        if (vendorUser) {
          if (vendorUser.status === 'INACTIVE' || vendorUser.status === 'SUSPENDED') {
            return res.status(400).json({ success: false, message: 'Selected vendor account is currently inactive.' });
          }
          resolvedVendorId = vendorUser._id;
          resolvedVendorName = vendorUser.name;
        } else {
          resolvedVendorName = vendorName || customerName || 'B2B Vendor';
          resolvedVendorId = vendorId;
        }
      } else {
        resolvedVendorName = customerName || 'Walk-in Customer';
      }
    }

    // 3. Pre-validate ALL items before modifying any database state (Atomic validation)
    interface ValidatedItemData {
      product: any;
      quantity: number;
      unitPrice: number;
      discount: number;
      tax: number;
      lineTotal: number;
      imeis: string[];
    }
    const validatedLines: ValidatedItemData[] = [];
    const allSaleImeisSet = new Set<string>();

    for (let idx = 0; idx < rawItems.length; idx++) {
      const it = rawItems[idx];
      const pId = it.productId;
      if (!pId) {
        return res.status(400).json({ success: false, message: `Item #${idx + 1} is missing a valid product ID` });
      }

      const requestedQty = Math.floor(Number(it.quantity));
      if (isNaN(requestedQty) || requestedQty < 1) {
        return res.status(400).json({ success: false, message: `Quantity for item #${idx + 1} must be at least 1 unit` });
      }

      const product = await Product.findById(pId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for item #${idx + 1}` });
      }

      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${requestedQty}`,
        });
      }

      // Validate Serial / IMEIs (Task 1E)
      const imeis: string[] = Array.isArray(it.imeis)
        ? it.imeis.map((s: string) => String(s).trim()).filter(Boolean)
        : [];

      if (imeis.length > 0) {
        if (imeis.length !== requestedQty) {
          return res.status(400).json({
            success: false,
            message: `Serial / IMEI count mismatch for "${product.name}": Expected ${requestedQty} IMEI(s), but got ${imeis.length}`,
          });
        }

        // Check for duplicates in current sale
        for (const im of imeis) {
          if (allSaleImeisSet.has(im)) {
            return res.status(400).json({
              success: false,
              message: `Duplicate IMEI detected within this sale: "${im}"`,
            });
          }
          allSaleImeisSet.add(im);
        }

        // Check if any IMEI is already currently sold in another active sale
        const existingSaleWithImei = await Sale.findOne({
          saleStatus: 'COMPLETED',
          $or: [{ imeis: { $in: imeis } }, { 'items.imeis': { $in: imeis } }],
        });
        if (existingSaleWithImei) {
          // If the item was not returned, reject duplicate sale of same IMEI
          return res.status(400).json({
            success: false,
            message: `One or more selected IMEIs are already registered to an existing sale (${existingSaleWithImei.saleId})`,
          });
        }
      }

      const finalUnitPrice = Number(it.unitPrice !== undefined ? it.unitPrice : product.price) || product.price;
      const discount = Math.max(0, Number(it.discount) || 0);
      const tax = Math.max(0, Number(it.tax) || 0);
      const lineTotal = Math.max(0, finalUnitPrice * requestedQty - discount + tax);

      validatedLines.push({
        product,
        quantity: requestedQty,
        unitPrice: finalUnitPrice,
        discount,
        tax,
        lineTotal,
        imeis,
      });
    }

    // 4. Construct Single Sale Record and pre-validate before mutating database (Task 1D)
    const saleId = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const soldByName = req.user?.name || 'Administrator';
    const saleItemsDoc: ISaleItem[] = [];
    let subtotal = 0;

    for (const line of validatedLines) {
      const { product, quantity: qty, unitPrice, discount, tax, lineTotal, imeis } = line;
      subtotal += lineTotal;

      saleItemsDoc.push({
        productId: product._id,
        productName: product.name,
        brand: product.brand || 'N/A',
        sku: product.sku,
        category: product.category || 'General',
        mobileType: product.mobileType || undefined,
        quantity: qty,
        unitPrice,
        discount,
        tax,
        lineTotal,
        returnedQuantity: 0,
        imeis,
        returnedImeis: [],
      });
    }

    const finalDiscount = Number(discountAmount) || 0;
    const finalTax = Number(taxAmount) || 0;
    const totalAmount = Math.max(0, subtotal - finalDiscount + finalTax);

    // Populate legacy summary fields from the primary item for 100% backward compatibility
    const primaryItem = saleItemsDoc[0];
    const totalQuantity = saleItemsDoc.reduce((sum, it) => sum + it.quantity, 0);
    const combinedImeis: string[] = [];
    saleItemsDoc.forEach((it) => {
      if (it.imeis) combinedImeis.push(...it.imeis);
    });

    const allowedMethods = ['Cash', 'UPI', 'Card', 'Other'];
    const safePaymentMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'Other';
    const allowedStatuses = ['PAID', 'PENDING', 'CANCELLED', 'PARTIAL'];
    const safePaymentStatus = allowedStatuses.includes(paymentStatus) ? paymentStatus : 'PAID';

    const sale = new Sale({
      saleId,
      buyerType,
      vendor: resolvedVendorId,
      vendorId: resolvedVendorId,
      vendorName: resolvedVendorName,
      customerName: customerName || resolvedVendorName,
      customerPhone: customerPhone || '',
      items: saleItemsDoc,
      subtotal,
      discountAmount: finalDiscount,
      taxAmount: finalTax,
      totalAmount,
      paymentMethod: safePaymentMethod,
      paymentStatus: safePaymentStatus,
      saleStatus: 'COMPLETED',
      soldBy: soldByName,
      soldById: req.user?.id,
      notes: notes || `Multi-product sale (${saleItemsDoc.length} items) via ${resolvedVendorName}`,

      // Backward compatibility summary fields
      productId: primaryItem.productId,
      productName: primaryItem.productName,
      brand: primaryItem.brand,
      sku: primaryItem.sku,
      category: primaryItem.category,
      mobileType: primaryItem.mobileType,
      quantity: totalQuantity,
      returnedQuantity: 0,
      imeis: combinedImeis,
      returnedImeis: [],
      unitPrice: primaryItem.unitPrice,
      remainingStock: primaryItem.productId ? 0 : 0,
    });

    const validationErr = sale.validateSync();
    if (validationErr) {
      return res.status(400).json({ success: false, message: `Sale validation failed: ${validationErr.message}` });
    }

    // 5. Atomic Execution: Deduct Stock & Create Inventory Logs for EACH line item (Task 1D)
    const generatedLogs: any[] = [];
    for (const line of validatedLines) {
      const { product, quantity: qty } = line;

      const previousStock = product.stock;
      product.stock -= qty;

      // Update product status
      const threshold = product.lowStockThreshold || product.minStockAlert || 10;
      if (product.stock <= 0) {
        product.status = 'Out of Stock';
      } else if (product.stock <= threshold) {
        product.status = 'Low Stock';
      } else {
        product.status = 'In Stock';
      }
      await product.save();

      // Create item-level inventory audit log
      const log = new InventoryLog({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        vendor: resolvedVendorId,
        vendorName: resolvedVendorName,
        type: 'OUT',
        quantityChanged: qty,
        previousStock,
        newStock: product.stock,
        reason: `SALE (${saleId} to ${resolvedVendorName})`,
        reference: saleId,
        performedBy: soldByName,
      });
      await log.save();
      generatedLogs.push(log);
    }

    await sale.save();

    return res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        saleId: sale.saleId,
        sale,
        items: sale.items,
        subtotal,
        totalAmount,
        quantity: totalQuantity,
        vendor: resolvedVendorName,
        logs: generatedLogs,
      },
      sale,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
