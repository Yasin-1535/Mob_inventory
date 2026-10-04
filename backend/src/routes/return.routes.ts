import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Return, IReturnItemLine, ReturnItemCondition } from '../models/Return';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { Order } from '../models/Order';
import { Purchase } from '../models/Purchase';
import { User } from '../models/User';
import { InventoryLog } from '../models/InventoryLog';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/returns - List returns with filtering
router.get('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, status, search, vendor, reason, condition, month } = req.query;
    const filter: any = {};

    if (type && type !== 'All' && type !== 'ALL') {
      filter.returnType = type;
    }
    if (status && status !== 'All' && status !== 'ALL') {
      filter.status = status;
    }
    if (vendor && vendor !== 'All' && vendor !== 'ALL') {
      filter.partyName = safeRegex(vendor as string);
    }
    if (reason && reason !== 'All' && reason !== 'ALL') {
      filter.$or = [
        { reason: safeRegex(reason as string) },
        { reasonCategory: reason },
      ];
    }
    if (condition && condition !== 'All' && condition !== 'ALL') {
      filter.itemCondition = condition;
    }

    if (search) {
      const searchRegex = safeRegex(search as string);
      const searchOr = [
        { returnNumber: searchRegex },
        { partyName: searchRegex },
        { productName: searchRegex },
        { sku: searchRegex },
        { sourceReferenceNumber: searchRegex },
        { 'items.productName': searchRegex },
        { 'items.sku': searchRegex },
        { 'items.imeis': searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const returns = await Return.find(filter).sort({ createdAt: -1 });

    // Filter by month in memory if requested (format: "September 2026" or "2026-09")
    let result = returns;
    if (month && month !== 'ALL' && month !== 'All') {
      result = returns.filter((r) => {
        try {
          const d = new Date(r.createdAt);
          const fullMonthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          const isoMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return fullMonthYear.toLowerCase() === (month as string).toLowerCase() || isoMonth === month;
        } catch {
          return true;
        }
      });
    }

    return res.json({ success: true, count: result.length, returns: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Central returnable quantity calculation interfaces & helper (Task 3A)
export interface ISaleReturnableProductInfo {
  productId?: string;
  productName: string;
  sku: string;
  unitPrice: number;
  soldQuantity: number;
  activeReturnedQuantity: number;
  returnableQuantity: number;
  soldImeis: string[];
  activeReturnedImeis: string[];
  availableImeis: string[];
}

export interface ISaleReturnableSummary {
  saleId: string;
  saleMongoId: string;
  vendorName: string;
  vendorId?: string;
  createdAt: Date;
  items: ISaleReturnableProductInfo[];
  totalSoldQuantity: number;
  totalActiveReturnedQuantity: number;
  totalReturnableQuantity: number;
  saleDoc?: any;
}

export async function calculateSaleReturnableInfo(saleLookupKey: any): Promise<ISaleReturnableSummary | null> {
  let sale: any = null;
  if (typeof saleLookupKey === 'object' && saleLookupKey._id) {
    sale = saleLookupKey;
  } else if (saleLookupKey) {
    if (mongoose.Types.ObjectId.isValid(saleLookupKey)) {
      sale = await Sale.findById(saleLookupKey);
    }
    if (!sale) {
      sale = await Sale.findOne({ saleId: saleLookupKey });
    }
  }

  if (!sale) return null;

  // Extract items from sale (backward compatible with single-item historical records)
  let saleItems: Array<{
    productId?: any;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    imeis?: string[];
  }> = [];

  if (Array.isArray(sale.items) && sale.items.length > 0) {
    saleItems = sale.items.map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      unitPrice: it.unitPrice || 0,
      quantity: it.quantity || 0,
      imeis: it.imeis || [],
    }));
  } else if (sale.productName || sale.sku) {
    saleItems = [
      {
        productId: sale.productId,
        productName: sale.productName || 'Unnamed Product',
        sku: sale.sku || '',
        unitPrice: sale.unitPrice || 0,
        quantity: sale.quantity || 0,
        imeis: sale.imeis || [],
      },
    ];
  }

  // Find all active returns against this source sale
  // Exclude REJECTED and CANCELLED returns (they do not reserve stock)
  const activeReturns = await Return.find({
    $or: [
      { sourceSaleId: sale.saleId },
      { sourceReferenceNumber: sale.saleId },
      ...(sale._id ? [{ sourceTransactionId: sale._id }] : []),
    ],
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });

  // Aggregate active returned quantities and IMEIs per product (by SKU or productId)
  const productActiveReturns: Record<string, { returnedQty: number; returnedImeis: Set<string> }> = {};

  for (const ret of activeReturns) {
    if (Array.isArray(ret.items) && ret.items.length > 0) {
      for (const line of ret.items) {
        const skuKey = (line.sku || '').toUpperCase();
        const idKey = line.productId ? line.productId.toString() : '';
        const key = skuKey || idKey;
        if (!key) continue;

        if (!productActiveReturns[key]) {
          productActiveReturns[key] = { returnedQty: 0, returnedImeis: new Set() };
        }
        productActiveReturns[key].returnedQty += (line.quantity || 0);
        if (Array.isArray(line.imeis)) {
          line.imeis.forEach((im: string) => productActiveReturns[key].returnedImeis.add(im.trim()));
        }
      }
    } else if (ret.sku || ret.productId) {
      const skuKey = (ret.sku || '').toUpperCase();
      const idKey = ret.productId ? ret.productId.toString() : '';
      const key = skuKey || idKey;
      if (key) {
        if (!productActiveReturns[key]) {
          productActiveReturns[key] = { returnedQty: 0, returnedImeis: new Set() };
        }
        productActiveReturns[key].returnedQty += (ret.quantity || 0);
        if (Array.isArray((ret as any).imeis)) {
          (ret as any).imeis.forEach((im: string) => productActiveReturns[key].returnedImeis.add(im.trim()));
        }
      }
    }
  }

  // Compute breakdown for each sale item
  const itemsBreakdown: ISaleReturnableProductInfo[] = saleItems.map((sItem) => {
    const skuKey = (sItem.sku || '').toUpperCase();
    const idKey = sItem.productId ? sItem.productId.toString() : '';
    const activeData = productActiveReturns[skuKey] || productActiveReturns[idKey] || { returnedQty: 0, returnedImeis: new Set() };

    const soldQty = sItem.quantity || 0;
    const activeReturnedQty = activeData.returnedQty;
    const returnableQty = Math.max(0, soldQty - activeReturnedQty);

    const soldImeis: string[] = Array.isArray(sItem.imeis) ? sItem.imeis : [];
    const activeReturnedImeis = Array.from(activeData.returnedImeis);
    const availableImeis = soldImeis.filter((im) => !activeData.returnedImeis.has(im));

    return {
      productId: sItem.productId ? sItem.productId.toString() : undefined,
      productName: sItem.productName,
      sku: sItem.sku,
      unitPrice: sItem.unitPrice,
      soldQuantity: soldQty,
      activeReturnedQuantity: activeReturnedQty,
      returnableQuantity: returnableQty,
      soldImeis,
      activeReturnedImeis,
      availableImeis,
    };
  });

  const totalSold = itemsBreakdown.reduce((sum, it) => sum + it.soldQuantity, 0);
  const totalActive = itemsBreakdown.reduce((sum, it) => sum + it.activeReturnedQuantity, 0);
  const totalReturnable = itemsBreakdown.reduce((sum, it) => sum + it.returnableQuantity, 0);

  return {
    saleId: sale.saleId,
    saleMongoId: sale._id.toString(),
    vendorName: sale.vendorName || sale.customerName || '',
    vendorId: sale.vendorId ? sale.vendorId.toString() : undefined,
    createdAt: sale.createdAt,
    items: itemsBreakdown,
    totalSoldQuantity: totalSold,
    totalActiveReturnedQuantity: totalActive,
    totalReturnableQuantity: totalReturnable,
    saleDoc: sale,
  };
}

// Central returnable quantity calculation for Customer Orders (Step 8, 9, 15)
export interface IOrderReturnableProductInfo {
  productId?: string;
  productName: string;
  sku: string;
  unitPrice: number;
  soldQuantity: number;
  activeReturnedQuantity: number;
  returnableQuantity: number;
  soldImeis: string[];
  activeReturnedImeis: string[];
  availableImeis: string[];
}

export interface IOrderReturnableSummary {
  orderNumber: string;
  orderMongoId: string;
  customerName: string;
  customerId?: string;
  createdAt: Date;
  orderStatus: string;
  saleId?: string;
  items: IOrderReturnableProductInfo[];
  totalSoldQuantity: number;
  totalActiveReturnedQuantity: number;
  totalReturnableQuantity: number;
  orderDoc?: any;
}

export async function calculateOrderReturnableInfo(orderLookupKey: any): Promise<IOrderReturnableSummary | null> {
  let order: any = null;
  if (typeof orderLookupKey === 'object' && orderLookupKey._id) {
    order = orderLookupKey;
  } else if (orderLookupKey) {
    if (mongoose.Types.ObjectId.isValid(orderLookupKey)) {
      order = await Order.findById(orderLookupKey);
    }
    if (!order) {
      order = await Order.findOne({
        $or: [
          { orderNumber: orderLookupKey },
          { orderNumber: `#${orderLookupKey}` },
          { orderNumber: orderLookupKey.replace(/^#/, '') },
          { _id: mongoose.Types.ObjectId.isValid(orderLookupKey) ? orderLookupKey : undefined },
        ].filter(Boolean),
      });
    }
  }

  if (!order) return null;

  // Extract items from order
  let orderItems: Array<{
    productId?: any;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    imeis?: string[];
  }> = [];

  if (Array.isArray(order.items) && order.items.length > 0) {
    orderItems = order.items.map((it: any) => ({
      productId: it.productId,
      productName: it.name || it.productName || 'Unnamed Product',
      sku: it.sku || '',
      unitPrice: it.unitPrice || it.price || 0,
      quantity: it.quantity || 0,
      imeis: it.imeis || [],
    }));
  }

  // Find all active returns against this order (exclude REJECTED and CANCELLED)
  const activeReturns = await Return.find({
    $or: [
      { sourceOrderId: order._id },
      { sourceOrderNumber: order.orderNumber },
      { sourceReferenceNumber: order.orderNumber },
      ...(order.saleId ? [{ sourceSaleId: order.saleId }, { sourceReferenceNumber: order.saleId }] : []),
    ],
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });

  const productActiveReturns: Record<string, { returnedQty: number; returnedImeis: Set<string> }> = {};

  for (const ret of activeReturns) {
    if (Array.isArray(ret.items) && ret.items.length > 0) {
      for (const line of ret.items) {
        const skuKey = (line.sku || '').toUpperCase();
        const idKey = line.productId ? line.productId.toString() : '';
        const nameKey = (line.productName || '').toUpperCase();
        const key = skuKey || idKey || nameKey;
        if (!key) continue;

        if (!productActiveReturns[key]) {
          productActiveReturns[key] = { returnedQty: 0, returnedImeis: new Set() };
        }
        productActiveReturns[key].returnedQty += (line.quantity || 0);
        if (Array.isArray(line.imeis)) {
          line.imeis.forEach((im: string) => productActiveReturns[key].returnedImeis.add(im.trim()));
        }
      }
    } else if (ret.sku || ret.productId || ret.productName) {
      const skuKey = (ret.sku || '').toUpperCase();
      const idKey = ret.productId ? ret.productId.toString() : '';
      const nameKey = (ret.productName || '').toUpperCase();
      const key = skuKey || idKey || nameKey;
      if (key) {
        if (!productActiveReturns[key]) {
          productActiveReturns[key] = { returnedQty: 0, returnedImeis: new Set() };
        }
        productActiveReturns[key].returnedQty += (ret.quantity || 0);
        if (Array.isArray((ret as any).imeis)) {
          (ret as any).imeis.forEach((im: string) => productActiveReturns[key].returnedImeis.add(im.trim()));
        }
      }
    }
  }

  const itemsBreakdown: IOrderReturnableProductInfo[] = orderItems.map((oItem) => {
    const skuKey = (oItem.sku || '').toUpperCase();
    const idKey = oItem.productId ? oItem.productId.toString() : '';
    const nameKey = (oItem.productName || '').toUpperCase();
    const activeData = productActiveReturns[skuKey] || productActiveReturns[idKey] || productActiveReturns[nameKey] || { returnedQty: 0, returnedImeis: new Set() };

    const soldQty = oItem.quantity || 0;
    const activeReturnedQty = activeData.returnedQty;
    const returnableQty = Math.max(0, soldQty - activeReturnedQty);

    const soldImeis: string[] = Array.isArray(oItem.imeis) ? oItem.imeis : [];
    const activeReturnedImeis = Array.from(activeData.returnedImeis);
    const availableImeis = soldImeis.filter((im) => !activeData.returnedImeis.has(im));

    return {
      productId: oItem.productId ? oItem.productId.toString() : undefined,
      productName: oItem.productName,
      sku: oItem.sku,
      unitPrice: oItem.unitPrice,
      soldQuantity: soldQty,
      activeReturnedQuantity: activeReturnedQty,
      returnableQuantity: returnableQty,
      soldImeis,
      activeReturnedImeis,
      availableImeis,
    };
  });

  const totalSold = itemsBreakdown.reduce((sum, it) => sum + it.soldQuantity, 0);
  const totalActive = itemsBreakdown.reduce((sum, it) => sum + it.activeReturnedQuantity, 0);
  const totalReturnable = itemsBreakdown.reduce((sum, it) => sum + it.returnableQuantity, 0);

  return {
    orderNumber: order.orderNumber,
    orderMongoId: order._id.toString(),
    customerName: order.customerName || 'Customer',
    customerId: order.customerId ? order.customerId.toString() : undefined,
    createdAt: order.createdAt,
    orderStatus: order.orderStatus,
    saleId: order.saleId,
    items: itemsBreakdown,
    totalSoldQuantity: totalSold,
    totalActiveReturnedQuantity: totalActive,
    totalReturnableQuantity: totalReturnable,
    orderDoc: order,
  };
}

// Central returnable quantity calculation for Supplier Purchases (Step 10, 23)
export interface IPurchaseReturnableProductInfo {
  productId?: string;
  productName: string;
  sku: string;
  unitPrice: number;
  purchasedQuantity: number;
  activeReturnedQuantity: number;
  returnableQuantity: number;
}

export interface IPurchaseReturnableSummary {
  purchaseNumber: string;
  purchaseMongoId: string;
  vendorName: string;
  vendorId?: string;
  createdAt: Date;
  status: string;
  items: IPurchaseReturnableProductInfo[];
  totalPurchasedQuantity: number;
  totalActiveReturnedQuantity: number;
  totalReturnableQuantity: number;
  purchaseDoc?: any;
}

export async function calculatePurchaseReturnableInfo(purchaseLookupKey: any): Promise<IPurchaseReturnableSummary | null> {
  let purchase: any = null;
  if (typeof purchaseLookupKey === 'object' && purchaseLookupKey._id) {
    purchase = purchaseLookupKey;
  } else if (purchaseLookupKey) {
    if (mongoose.Types.ObjectId.isValid(purchaseLookupKey)) {
      purchase = await Purchase.findById(purchaseLookupKey);
    }
    if (!purchase) {
      purchase = await Purchase.findOne({
        $or: [
          { purchaseNumber: purchaseLookupKey },
          { orderNumber: purchaseLookupKey },
          { purchaseId: purchaseLookupKey },
          { requestNumber: purchaseLookupKey },
        ],
      });
    }
  }

  if (!purchase) return null;

  let purchaseItems: Array<{
    productId?: any;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }> = [];

  if (Array.isArray(purchase.items) && purchase.items.length > 0) {
    purchaseItems = purchase.items.map((it: any) => ({
      productId: it.productId,
      productName: it.productName || it.name || 'Unnamed Product',
      sku: it.sku || '',
      unitPrice: it.unitCost || it.unitPrice || 0,
      quantity: it.quantity || 0,
    }));
  } else if (purchase.productName || purchase.sku) {
    purchaseItems = [
      {
        productId: purchase.productId,
        productName: purchase.productName,
        sku: purchase.sku || '',
        unitPrice: purchase.unitCost || purchase.unitPrice || 0,
        quantity: purchase.quantityRequested || purchase.quantity || 0,
      },
    ];
  }

  const activeReturns = await Return.find({
    $or: [
      { sourcePurchaseId: purchase._id },
      { sourcePurchaseNumber: purchase.purchaseNumber || purchase.orderNumber || purchase.requestNumber },
      { sourceReferenceNumber: purchase.purchaseNumber || purchase.orderNumber || purchase.requestNumber },
    ],
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });

  const productActiveReturns: Record<string, number> = {};

  for (const ret of activeReturns) {
    if (Array.isArray(ret.items) && ret.items.length > 0) {
      for (const line of ret.items) {
        const skuKey = (line.sku || '').toUpperCase();
        const idKey = line.productId ? line.productId.toString() : '';
        const nameKey = (line.productName || '').toUpperCase();
        const key = skuKey || idKey || nameKey;
        if (!key) continue;
        productActiveReturns[key] = (productActiveReturns[key] || 0) + (line.quantity || 0);
      }
    } else if (ret.sku || ret.productId || ret.productName) {
      const skuKey = (ret.sku || '').toUpperCase();
      const idKey = ret.productId ? ret.productId.toString() : '';
      const nameKey = (ret.productName || '').toUpperCase();
      const key = skuKey || idKey || nameKey;
      if (key) {
        productActiveReturns[key] = (productActiveReturns[key] || 0) + (ret.quantity || 0);
      }
    }
  }

  const itemsBreakdown: IPurchaseReturnableProductInfo[] = purchaseItems.map((pItem) => {
    const skuKey = (pItem.sku || '').toUpperCase();
    const idKey = pItem.productId ? pItem.productId.toString() : '';
    const nameKey = (pItem.productName || '').toUpperCase();
    const activeReturnedQty = productActiveReturns[skuKey] || productActiveReturns[idKey] || productActiveReturns[nameKey] || 0;

    const purchasedQty = pItem.quantity || 0;
    const returnableQty = Math.max(0, purchasedQty - activeReturnedQty);

    return {
      productId: pItem.productId ? pItem.productId.toString() : undefined,
      productName: pItem.productName,
      sku: pItem.sku,
      unitPrice: pItem.unitPrice,
      purchasedQuantity: purchasedQty,
      activeReturnedQuantity: activeReturnedQty,
      returnableQuantity: returnableQty,
    };
  });

  const totalPurchased = itemsBreakdown.reduce((sum, it) => sum + it.purchasedQuantity, 0);
  const totalActive = itemsBreakdown.reduce((sum, it) => sum + it.activeReturnedQuantity, 0);
  const totalReturnable = itemsBreakdown.reduce((sum, it) => sum + it.returnableQuantity, 0);

  return {
    purchaseNumber: purchase.purchaseNumber || purchase.orderNumber || purchase.requestNumber || purchase._id.toString(),
    purchaseMongoId: purchase._id.toString(),
    vendorName: purchase.vendorName || purchase.vendor || 'Vendor',
    vendorId: purchase.vendorId ? purchase.vendorId.toString() : undefined,
    createdAt: purchase.createdAt,
    status: purchase.status,
    items: itemsBreakdown,
    totalPurchasedQuantity: totalPurchased,
    totalActiveReturnedQuantity: totalActive,
    totalReturnableQuantity: totalReturnable,
    purchaseDoc: purchase,
  };
}

// GET /api/returns/sale-returnable/:saleId - Returnable breakdown for a sale (Task 3A & 3E)
router.get('/sale-returnable/:saleId', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await calculateSaleReturnableInfo(req.params.saleId);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Sale record not found' });
    }
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/order-returnable/:orderId - Returnable breakdown for an Order (Step 8, 9, 15)
router.get('/order-returnable/:orderId', authenticateJWT, requireRole(['ADMIN', 'CUSTOMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await calculateOrderReturnableInfo(req.params.orderId);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Order record not found' });
    }
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/purchase-returnable/:purchaseId - Returnable breakdown for a Purchase (Step 10, 23)
router.get('/purchase-returnable/:purchaseId', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await calculatePurchaseReturnableInfo(req.params.purchaseId);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/:id - Get single return voucher details
router.get('/:id', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return record not found' });
    }
    return res.json({ success: true, return: returnDoc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns - Record Return Request (Supports Customer Return, Vendor Sales Return, Purchase Return, Multi-Item, IMEI Validation)
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      returnType = 'VENDOR_SALES_RETURN',
      partyType: rawPartyType,
      sourceTransactionId,
      sourceSaleId,
      sourceReferenceNumber,
      sourceOrderId,
      sourceOrderNumber,
      sourcePurchaseId,
      sourcePurchaseNumber,
      partyId,
      partyName,
      items, // array of { productId, productName, sku, quantity, unitPrice, reason, reasonCategory, itemCondition, imeis }
      // legacy single-item fields
      productId,
      productName,
      sku,
      quantity,
      unitPrice,
      totalAmount,
      reason,
      reasonCategory,
      itemCondition = 'GOOD',
      settlementType = 'REFUND',
      status = 'RETURN_REQUESTED',
      notes,
    } = req.body;

    const partyType = returnType === 'SALES_RETURN' ? 'CUSTOMER' : (rawPartyType || 'VENDOR');

    if (!partyName && returnType !== 'SALES_RETURN' && returnType !== 'PURCHASE_RETURN') {
      return res.status(400).json({ success: false, message: 'Party/Vendor name is required' });
    }

    // Build normalized items array
    let normalizedItems: IReturnItemLine[] = [];

    if (Array.isArray(items) && items.length > 0) {
      normalizedItems = items.map((it: any) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitPrice: Number(it.unitPrice) || 0,
        totalAmount: (Number(it.unitPrice) || 0) * (Math.max(1, Number(it.quantity) || 1)),
        reason: it.reason || reason || 'Return item',
        reasonCategory: it.reasonCategory || reasonCategory || 'OTHER',
        itemCondition: it.itemCondition || itemCondition || 'GOOD',
        imeis: Array.isArray(it.imeis) ? it.imeis.map((s: string) => String(s).trim()) : [],
        inspectionNotes: it.inspectionNotes || '',
        status: it.status || 'RETURN_REQUESTED',
      }));
    } else {
      if (!productName || !sku || !quantity) {
        return res.status(400).json({ success: false, message: 'Missing required product and quantity details' });
      }
      const qty = Math.max(1, Number(quantity));
      const up = Number(unitPrice) || 0;
      normalizedItems = [
        {
          productId,
          productName,
          sku,
          quantity: qty,
          unitPrice: up,
          totalAmount: Number(totalAmount) || up * qty,
          reason: reason || 'Return item',
          reasonCategory: reasonCategory || 'OTHER',
          itemCondition: itemCondition || 'GOOD',
          imeis: Array.isArray(req.body.imeis) ? req.body.imeis : [],
          inspectionNotes: '',
          status: status || 'RETURN_REQUESTED',
        },
      ];
    }

    // Source Sale Validation for VENDOR_SALES_RETURN
    let resolvedSourceSale: any = null;
    let saleReturnableSummary: ISaleReturnableSummary | null = null;
    const saleLookupKey = sourceSaleId || sourceReferenceNumber || sourceTransactionId;

    // Source Order Validation for SALES_RETURN (Customer Return)
    let resolvedSourceOrder: any = null;
    let orderReturnableSummary: IOrderReturnableSummary | null = null;
    const orderLookupKey = sourceOrderId || sourceOrderNumber || sourceReferenceNumber;

    // Source Purchase Validation for PURCHASE_RETURN (Supplier Return)
    let resolvedSourcePurchase: any = null;
    let purchaseReturnableSummary: IPurchaseReturnableSummary | null = null;
    const purchaseLookupKey = sourcePurchaseId || sourcePurchaseNumber || sourceReferenceNumber;

    if (returnType === 'VENDOR_SALES_RETURN') {
      if (!saleLookupKey) {
        return res.status(400).json({
          success: false,
          message: 'Original sale reference is required for vendor sales return',
        });
      }

      saleReturnableSummary = await calculateSaleReturnableInfo(saleLookupKey);
      if (!saleReturnableSummary) {
        return res.status(404).json({
          success: false,
          message: 'Original sale record not found',
        });
      }
      resolvedSourceSale = saleReturnableSummary.saleDoc;

      // Validate Vendor Matches Original Sale
      const saleVendorName = (saleReturnableSummary.vendorName || '').toLowerCase().trim();
      const returnVendorName = (partyName || '').toLowerCase().trim();
      if (saleVendorName && returnVendorName && !saleVendorName.includes(returnVendorName) && !returnVendorName.includes(saleVendorName)) {
        return res.status(400).json({
          success: false,
          message: `Vendor mismatch: Sale was made to "${saleReturnableSummary.vendorName}", but return is logged for "${partyName}"`,
        });
      }

      const returnableBySku = new Map<string, ISaleReturnableProductInfo>();
      const returnableById = new Map<string, ISaleReturnableProductInfo>();
      for (const it of saleReturnableSummary.items) {
        if (it.sku) returnableBySku.set(it.sku.toUpperCase(), it);
        if (it.productId) returnableById.set(it.productId, it);
      }

      const productRequestedTotals: Record<string, number> = {};
      for (const item of normalizedItems) {
        const key = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : item.productName);
        productRequestedTotals[key] = (productRequestedTotals[key] || 0) + item.quantity;
      }

      for (const item of normalizedItems) {
        const saleLine = (item.sku ? returnableBySku.get(item.sku.toUpperCase()) : null) ||
                         (item.productId ? returnableById.get(item.productId.toString()) : null);

        if (!saleLine) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.productName || item.sku}" was not part of original sale ${saleReturnableSummary.saleId}. Only products from the original sale can be returned.`,
          });
        }

        item.unitPrice = saleLine.unitPrice;
        item.totalAmount = item.unitPrice * item.quantity;

        const prodKey = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : item.productName);
        const totalRequested = productRequestedTotals[prodKey] || item.quantity;
        if (totalRequested > saleLine.returnableQuantity) {
          return res.status(400).json({
            success: false,
            message: `Return quantity exceeds the remaining returnable quantity for "${saleLine.productName}". Sold: ${saleLine.soldQuantity}, already returned/pending: ${saleLine.activeReturnedQuantity}, available returnable: ${saleLine.returnableQuantity}. Requested: ${totalRequested}.`,
          });
        }

        if (Array.isArray(item.imeis) && item.imeis.length > 0) {
          if (item.imeis.length !== item.quantity) {
            return res.status(400).json({
              success: false,
              message: `IMEI quantity mismatch: ${item.quantity} units returned, but ${item.imeis.length} IMEI(s) selected for "${saleLine.productName}".`,
            });
          }

          const uniqueImeis = new Set(item.imeis);
          if (uniqueImeis.size !== item.imeis.length) {
            return res.status(400).json({
              success: false,
              message: `Duplicate IMEI specified in return line for "${saleLine.productName}".`,
            });
          }

          for (const imei of item.imeis) {
            if (saleLine.soldImeis.length > 0 && !saleLine.soldImeis.includes(imei)) {
              return res.status(400).json({
                success: false,
                message: `Invalid IMEI: "${imei}" was not part of original sale ${saleReturnableSummary.saleId}`,
              });
            }
            if (saleLine.activeReturnedImeis.includes(imei)) {
              return res.status(400).json({
                success: false,
                message: `Duplicate IMEI: "${imei}" has already been returned or is in an active return for sale ${saleReturnableSummary.saleId}`,
              });
            }
          }
        }
      }
    } else if (returnType === 'SALES_RETURN') {
      // CUSTOMER RETURN (Step 8, 9, 15)
      if (!orderLookupKey) {
        return res.status(400).json({
          success: false,
          message: 'Original order reference is required for customer return',
        });
      }

      orderReturnableSummary = await calculateOrderReturnableInfo(orderLookupKey);
      if (!orderReturnableSummary) {
        return res.status(404).json({
          success: false,
          message: `Original order record "${orderLookupKey}" not found`,
        });
      }
      resolvedSourceOrder = orderReturnableSummary.orderDoc;

      const returnableBySku = new Map<string, IOrderReturnableProductInfo>();
      const returnableById = new Map<string, IOrderReturnableProductInfo>();
      const returnableByName = new Map<string, IOrderReturnableProductInfo>();
      for (const it of orderReturnableSummary.items) {
        if (it.sku) returnableBySku.set(it.sku.toUpperCase(), it);
        if (it.productId) returnableById.set(it.productId, it);
        if (it.productName) returnableByName.set(it.productName.toUpperCase(), it);
      }

      const productRequestedTotals: Record<string, number> = {};
      for (const item of normalizedItems) {
        const key = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : (item.productName || '').toUpperCase());
        productRequestedTotals[key] = (productRequestedTotals[key] || 0) + item.quantity;
      }

      for (const item of normalizedItems) {
        const orderLine = (item.sku ? returnableBySku.get(item.sku.toUpperCase()) : null) ||
                          (item.productId ? returnableById.get(item.productId.toString()) : null) ||
                          (item.productName ? returnableByName.get(item.productName.toUpperCase()) : null);

        if (!orderLine) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.productName || item.sku}" was not part of original order ${orderReturnableSummary.orderNumber}. Only products from the original order can be returned.`,
          });
        }

        item.unitPrice = orderLine.unitPrice;
        item.totalAmount = item.unitPrice * item.quantity;

        const prodKey = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : (item.productName || '').toUpperCase());
        const totalRequested = productRequestedTotals[prodKey] || item.quantity;
        if (totalRequested > orderLine.returnableQuantity) {
          return res.status(400).json({
            success: false,
            message: `Return quantity exceeds the remaining returnable quantity for "${orderLine.productName}". Ordered: ${orderLine.soldQuantity}, already returned/pending: ${orderLine.activeReturnedQuantity}, available returnable: ${orderLine.returnableQuantity}. Requested: ${totalRequested}.`,
          });
        }

        if (Array.isArray(item.imeis) && item.imeis.length > 0) {
          if (item.imeis.length !== item.quantity) {
            return res.status(400).json({
              success: false,
              message: `IMEI quantity mismatch: ${item.quantity} units returned, but ${item.imeis.length} IMEI(s) selected for "${orderLine.productName}".`,
            });
          }

          const uniqueImeis = new Set(item.imeis);
          if (uniqueImeis.size !== item.imeis.length) {
            return res.status(400).json({
              success: false,
              message: `Duplicate IMEI specified in return line for "${orderLine.productName}".`,
            });
          }

          for (const imei of item.imeis) {
            if (orderLine.soldImeis.length > 0 && !orderLine.soldImeis.includes(imei)) {
              return res.status(400).json({
                success: false,
                message: `Invalid IMEI: "${imei}" was not part of original order ${orderReturnableSummary.orderNumber}`,
              });
            }
            if (orderLine.activeReturnedImeis.includes(imei)) {
              return res.status(400).json({
                success: false,
                message: `Duplicate IMEI: "${imei}" has already been returned or is in an active return for order ${orderReturnableSummary.orderNumber}`,
              });
            }
          }
        }
      }
    } else if (returnType === 'PURCHASE_RETURN') {
      // SUPPLIER PURCHASE RETURN (Step 10, 23)
      if (!purchaseLookupKey) {
        return res.status(400).json({
          success: false,
          message: 'Original purchase reference is required for supplier purchase return',
        });
      }

      purchaseReturnableSummary = await calculatePurchaseReturnableInfo(purchaseLookupKey);
      if (!purchaseReturnableSummary) {
        return res.status(404).json({
          success: false,
          message: `Original purchase record "${purchaseLookupKey}" not found`,
        });
      }
      resolvedSourcePurchase = purchaseReturnableSummary.purchaseDoc;

      const returnableBySku = new Map<string, IPurchaseReturnableProductInfo>();
      const returnableById = new Map<string, IPurchaseReturnableProductInfo>();
      const returnableByName = new Map<string, IPurchaseReturnableProductInfo>();
      for (const it of purchaseReturnableSummary.items) {
        if (it.sku) returnableBySku.set(it.sku.toUpperCase(), it);
        if (it.productId) returnableById.set(it.productId, it);
        if (it.productName) returnableByName.set(it.productName.toUpperCase(), it);
      }

      const productRequestedTotals: Record<string, number> = {};
      for (const item of normalizedItems) {
        const key = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : (item.productName || '').toUpperCase());
        productRequestedTotals[key] = (productRequestedTotals[key] || 0) + item.quantity;
      }

      for (const item of normalizedItems) {
        const purchaseLine = (item.sku ? returnableBySku.get(item.sku.toUpperCase()) : null) ||
                             (item.productId ? returnableById.get(item.productId.toString()) : null) ||
                             (item.productName ? returnableByName.get(item.productName.toUpperCase()) : null);

        if (!purchaseLine) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.productName || item.sku}" was not part of original purchase ${purchaseReturnableSummary.purchaseNumber}.`,
          });
        }

        item.unitPrice = purchaseLine.unitPrice;
        item.totalAmount = item.unitPrice * item.quantity;

        const prodKey = (item.sku || '').toUpperCase() || (item.productId ? item.productId.toString() : (item.productName || '').toUpperCase());
        const totalRequested = productRequestedTotals[prodKey] || item.quantity;
        if (totalRequested > purchaseLine.returnableQuantity) {
          return res.status(400).json({
            success: false,
            message: `Return quantity exceeds the remaining returnable quantity for "${purchaseLine.productName}". Purchased: ${purchaseLine.purchasedQuantity}, already returned/pending: ${purchaseLine.activeReturnedQuantity}, available returnable: ${purchaseLine.returnableQuantity}. Requested: ${totalRequested}.`,
          });
        }
      }
    }

    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const grandTotal = normalizedItems.reduce((sum, it) => sum + it.totalAmount, 0);

    const primaryItem = normalizedItems[0];
    const resolvedPartyName =
      partyName ||
      resolvedSourceOrder?.customerName ||
      resolvedSourceSale?.vendorName ||
      resolvedSourcePurchase?.vendorName ||
      'Customer';

    const returnDoc = new Return({
      returnNumber,
      returnType,
      partyType,
      sourceTransactionId: resolvedSourceOrder?._id || resolvedSourceSale?._id || resolvedSourcePurchase?._id || sourceTransactionId,
      sourceSaleId: resolvedSourceSale?.saleId || resolvedSourceOrder?.saleId || sourceSaleId || '',
      sourceOrderId: resolvedSourceOrder?._id || sourceOrderId,
      sourceOrderNumber: resolvedSourceOrder?.orderNumber || sourceOrderNumber || '',
      sourcePurchaseId: resolvedSourcePurchase?._id || sourcePurchaseId,
      sourcePurchaseNumber: resolvedSourcePurchase?.purchaseNumber || resolvedSourcePurchase?.orderNumber || sourcePurchaseNumber || '',
      sourceReferenceNumber:
        resolvedSourceOrder?.orderNumber ||
        resolvedSourceSale?.saleId ||
        resolvedSourcePurchase?.purchaseNumber ||
        sourceReferenceNumber ||
        '',
      partyId: partyId || resolvedSourceOrder?.customerId || resolvedSourceSale?.vendorId || resolvedSourcePurchase?.vendorId,
      partyName: resolvedPartyName,
      items: normalizedItems,
      // summary compatibility fields
      productId: primaryItem.productId,
      productName: primaryItem.productName,
      sku: primaryItem.sku,
      quantity: normalizedItems.reduce((sum, it) => sum + it.quantity, 0),
      unitPrice: primaryItem.unitPrice,
      totalAmount: grandTotal,
      reason: primaryItem.reason,
      reasonCategory: primaryItem.reasonCategory,
      itemCondition: primaryItem.itemCondition,
      settlementType,
      settlementStatus: 'PENDING',
      status: status || 'RETURN_REQUESTED',
      notes,
    });

    await returnDoc.save();

    // Side-effects on linked source documents:
    if (resolvedSourceOrder) {
      const currentReturned = (orderReturnableSummary?.totalActiveReturnedQuantity || 0) + normalizedItems.reduce((s, it) => s + it.quantity, 0);
      resolvedSourceOrder.returnedCount = currentReturned;
      resolvedSourceOrder.returnStatus = currentReturned >= (orderReturnableSummary?.totalSoldQuantity || 0) ? 'FULLY_RETURNED' : (currentReturned > 0 ? 'PARTIAL' : 'NONE');
      await resolvedSourceOrder.save();
    }

    if (resolvedSourcePurchase) {
      // For Supplier Purchase Returns, stock decreases as goods leave warehouse back to vendor
      for (const item of normalizedItems) {
        const prod = item.productId ? await Product.findById(item.productId) : await Product.findOne({ sku: item.sku });
        if (prod) {
          const prev = prod.stock;
          prod.stock = Math.max(0, prod.stock - item.quantity);
          await prod.save();

          await new InventoryLog({
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            vendor: resolvedSourcePurchase.vendorId || partyId,
            vendorName: resolvedSourcePurchase.vendorName || resolvedPartyName,
            type: 'PURCHASE_RETURN',
            quantityChanged: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            reason: `Purchase Return Dispatched to Vendor (${returnNumber} for PO ${resolvedSourcePurchase.purchaseNumber || resolvedSourcePurchase.orderNumber})`,
            reference: returnNumber,
            returnId: returnNumber,
            performedBy: req.user?.name || 'Administrator',
          }).save();
        }
      }

      const pReturned = (purchaseReturnableSummary?.totalActiveReturnedQuantity || 0) + normalizedItems.reduce((s, it) => s + it.quantity, 0);
      resolvedSourcePurchase.returnedQuantity = pReturned;
      resolvedSourcePurchase.returnStatus = pReturned >= (purchaseReturnableSummary?.totalPurchasedQuantity || 0) ? 'FULLY_RETURNED' : (pReturned > 0 ? 'PARTIAL' : 'NONE');
      await resolvedSourcePurchase.save();
    }

    // If immediate COMPLETED/VERIFIED status was requested (legacy support)
    if (status === 'COMPLETED' || status === 'VERIFIED') {
      for (const item of normalizedItems) {
        const prod = item.productId ? await Product.findById(item.productId) : await Product.findOne({ sku: item.sku });
        if (prod) {
          const prev = prod.stock;
          if (item.itemCondition === 'GOOD') {
            prod.stock += item.quantity;
            await prod.save();
            await new InventoryLog({
              productId: prod._id,
              productName: prod.name,
              sku: prod.sku,
              vendor: partyId,
              vendorName: resolvedPartyName,
              type: 'RETURN',
              quantityChanged: item.quantity,
              previousStock: prev,
              newStock: prod.stock,
              reason: `Return Restocked - Good Stock (${returnNumber})`,
              reference: returnNumber,
              returnId: returnNumber,
              performedBy: req.user?.name || 'Administrator',
            }).save();
          } else {
            prod.damagedStock = (prod.damagedStock || 0) + item.quantity;
            await prod.save();
            await new InventoryLog({
              productId: prod._id,
              productName: prod.name,
              sku: prod.sku,
              vendor: partyId,
              vendorName: resolvedPartyName,
              type: 'DAMAGE',
              quantityChanged: item.quantity,
              previousStock: prev,
              newStock: prod.stock,
              reason: `Return Received - Damaged Goods Quarantine (${returnNumber})`,
              reference: returnNumber,
              returnId: returnNumber,
              performedBy: req.user?.name || 'Administrator',
            }).save();
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Return request recorded successfully',
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/returns/:id/receive - Mark items RECEIVED & place in Inspection Quarantine (Task 6 & 7)
router.patch('/:id/receive', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnDoc.status !== 'RETURN_REQUESTED' && returnDoc.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as received: current status is ${returnDoc.status}`,
      });
    }

    returnDoc.status = 'RECEIVED';
    returnDoc.receivedAt = new Date();

    const itemsToProcess = returnDoc.items.length > 0 ? returnDoc.items : [
      {
        productId: returnDoc.productId,
        productName: returnDoc.productName,
        sku: returnDoc.sku,
        quantity: returnDoc.quantity,
      },
    ];

    // Place into inspectionStock; DO NOT add to sellable stock
    for (const item of itemsToProcess) {
      const prod = item.productId
        ? await Product.findById(item.productId)
        : await Product.findOne({ sku: item.sku });

      if (prod) {
        prod.inspectionStock = (prod.inspectionStock || 0) + item.quantity;
        await prod.save();

        const log = new InventoryLog({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          vendor: returnDoc.partyId,
          vendorName: returnDoc.partyName,
          type: 'VENDOR_RETURN_RECEIVED',
          quantityChanged: item.quantity,
          previousStock: prod.stock,
          newStock: prod.stock, // sellable stock unchanged!
          reason: `Vendor Return Received (${returnDoc.returnNumber}) - Placed in Inspection Quarantine`,
          reference: returnDoc.returnNumber,
          returnId: returnDoc.returnNumber,
          notes: `Inspection stock increased to ${prod.inspectionStock} units`,
          performedBy: req.user?.name || 'Administrator',
        });
        await log.save();
      }
    }

    await returnDoc.save();
    return res.json({
      success: true,
      message: 'Return received and placed in inspection quarantine stock',
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/returns/:id/inspect - Complete inspection & categorize conditions (Task 5 & 6)
router.patch('/:id/inspect', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemConditions, inspectionNotes } = req.body;
    // itemConditions: [{ sku or productId, itemCondition, inspectionNotes }]

    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    returnDoc.status = 'INSPECTED';
    returnDoc.inspectionNotes = inspectionNotes || returnDoc.inspectionNotes || '';
    returnDoc.inspectedBy = req.user?.name || 'Administrator';
    returnDoc.inspectedAt = new Date();

    if (Array.isArray(itemConditions)) {
      returnDoc.items.forEach((it) => {
        const matching = itemConditions.find(
          (c: any) =>
            (c.productId && c.productId.toString() === it.productId?.toString()) ||
            (c.sku && c.sku.toUpperCase() === it.sku.toUpperCase())
        );
        if (matching) {
          it.itemCondition = matching.itemCondition as ReturnItemCondition;
          if (matching.inspectionNotes) it.inspectionNotes = matching.inspectionNotes;
        }
      });
      if (returnDoc.items.length > 0) {
        returnDoc.itemCondition = returnDoc.items[0].itemCondition;
      }
    } else if (req.body.itemCondition) {
      returnDoc.itemCondition = req.body.itemCondition;
      if (returnDoc.items.length > 0) {
        returnDoc.items[0].itemCondition = req.body.itemCondition;
      }
    }

    await returnDoc.save();
    return res.json({
      success: true,
      message: 'Return inspection completed',
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/:id/restock - Move GOOD items from inspection stock to sellable stock (Task 7 & 8)
router.post('/:id/restock', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnDoc.status === 'SETTLED') {
      return res.status(400).json({ success: false, message: 'This return has already been settled.' });
    }

    const targetSku = req.body?.sku;
    const targetProductId = req.body?.productId;

    let itemsToProcess = returnDoc.items && returnDoc.items.length > 0 ? returnDoc.items : [
      {
        productId: returnDoc.productId,
        productName: returnDoc.productName,
        sku: returnDoc.sku,
        quantity: returnDoc.quantity,
        itemCondition: returnDoc.itemCondition,
        status: returnDoc.status,
      } as any,
    ];

    if (targetSku || targetProductId) {
      itemsToProcess = itemsToProcess.filter((it: any) =>
        (targetSku && it.sku?.toUpperCase() === targetSku.toUpperCase()) ||
        (targetProductId && it.productId?.toString() === targetProductId.toString())
      );
    }

    let restockedCount = 0;
    for (const item of itemsToProcess) {
      if (item.itemCondition === 'GOOD' && item.status !== 'RESTOCKED') {
        const prod = item.productId
          ? await Product.findById(item.productId)
          : await Product.findOne({ sku: item.sku });

        if (prod) {
          const previousStock = prod.stock;
          // Decrement inspectionStock (if available)
          if (prod.inspectionStock && prod.inspectionStock >= item.quantity) {
            prod.inspectionStock -= item.quantity;
          }
          // Increment sellable stock
          prod.stock += item.quantity;
          await prod.save();

          const log = new InventoryLog({
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            vendor: returnDoc.partyId,
            vendorName: returnDoc.partyName,
            type: 'RETURN_INSPECTED_GOOD',
            quantityChanged: item.quantity,
            previousStock,
            newStock: prod.stock,
            reason: `Return Inspected - Restored to Active Stock (${returnDoc.returnNumber})`,
            reference: returnDoc.returnNumber,
            returnId: returnDoc.returnNumber,
            performedBy: req.user?.name || 'Administrator',
          });
          await log.save();

          item.status = 'RESTOCKED';
          restockedCount++;
        }
      }
    }

    returnDoc.status = 'RESTOCKED';
    await returnDoc.save();

    // Also update source sale returned quantities/imeis if linked
    if (returnDoc.sourceSaleId || returnDoc.sourceReferenceNumber) {
      const sale = await Sale.findOne({
        $or: [{ saleId: returnDoc.sourceSaleId }, { saleId: returnDoc.sourceReferenceNumber }],
      });
      if (sale) {
        sale.returnedQuantity = (sale.returnedQuantity || 0) + returnDoc.quantity;
        const allImeis: string[] = [];
        returnDoc.items.forEach((it) => {
          if (Array.isArray(it.imeis)) allImeis.push(...it.imeis);
        });
        if (allImeis.length > 0) {
          sale.returnedImeis = Array.from(new Set([...(sale.returnedImeis || []), ...allImeis]));
        }
        await sale.save();
      }
    }

    return res.json({
      success: true,
      message: `${restockedCount} item(s) in good condition restocked into warehouse inventory`,
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/:id/mark-damaged - Move damaged/defective items from inspection stock to damaged/discard stock (Task 7 & 8)
router.post('/:id/mark-damaged', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnDoc.status === 'SETTLED') {
      return res.status(400).json({ success: false, message: 'This return has already been settled.' });
    }

    const targetSku = req.body?.sku;
    const targetProductId = req.body?.productId;

    let itemsToProcess = returnDoc.items && returnDoc.items.length > 0 ? returnDoc.items : [
      {
        productId: returnDoc.productId,
        productName: returnDoc.productName,
        sku: returnDoc.sku,
        quantity: returnDoc.quantity,
        itemCondition: returnDoc.itemCondition,
        status: returnDoc.status,
      } as any,
    ];

    if (targetSku || targetProductId) {
      itemsToProcess = itemsToProcess.filter((it: any) =>
        (targetSku && it.sku?.toUpperCase() === targetSku.toUpperCase()) ||
        (targetProductId && it.productId?.toString() === targetProductId.toString())
      );
    }

    let damagedCount = 0;
    for (const item of itemsToProcess) {
      if (item.itemCondition !== 'GOOD' && item.status !== 'DAMAGED' && item.status !== 'DISCARDED') {
        const prod = item.productId
          ? await Product.findById(item.productId)
          : await Product.findOne({ sku: item.sku });

        if (prod) {
          if (prod.inspectionStock && prod.inspectionStock >= item.quantity) {
            prod.inspectionStock -= item.quantity;
          }

          if (item.itemCondition === 'UNSELLABLE') {
            prod.discardedStock = (prod.discardedStock || 0) + item.quantity;
            item.status = 'DISCARDED';
          } else {
            prod.damagedStock = (prod.damagedStock || 0) + item.quantity;
            item.status = 'DAMAGED';
          }
          await prod.save();

          const log = new InventoryLog({
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            vendor: returnDoc.partyId,
            vendorName: returnDoc.partyName,
            type: item.itemCondition === 'UNSELLABLE' ? 'DISCARD' : 'RETURN_INSPECTED_DAMAGED',
            quantityChanged: item.quantity,
            previousStock: prod.stock,
            newStock: prod.stock,
            reason: `Return Inspected - Marked ${item.itemCondition} (${returnDoc.returnNumber})`,
            reference: returnDoc.returnNumber,
            returnId: returnDoc.returnNumber,
            performedBy: req.user?.name || 'Administrator',
          });
          await log.save();
          damagedCount++;
        }
      }
    }

    if (returnDoc.status !== 'RESTOCKED') {
      returnDoc.status = 'DAMAGED';
    }
    await returnDoc.save();

    // Update source sale returned count
    if (returnDoc.sourceSaleId || returnDoc.sourceReferenceNumber) {
      const sale = await Sale.findOne({
        $or: [{ saleId: returnDoc.sourceSaleId }, { saleId: returnDoc.sourceReferenceNumber }],
      });
      if (sale) {
        sale.returnedQuantity = (sale.returnedQuantity || 0) + returnDoc.quantity;
        const allImeis: string[] = [];
        returnDoc.items.forEach((it) => {
          if (Array.isArray(it.imeis)) allImeis.push(...it.imeis);
        });
        if (allImeis.length > 0) {
          sale.returnedImeis = Array.from(new Set([...(sale.returnedImeis || []), ...allImeis]));
        }
        await sale.save();
      }
    }

    return res.json({
      success: true,
      message: `${damagedCount} damaged/defective item(s) isolated into quarantine stock`,
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/:id/process-inspection - Process all inspected items per item condition (Task 8 & 12)
router.post('/:id/process-inspection', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    const { itemConditions, inspectionNotes } = req.body;
    if (inspectionNotes) returnDoc.inspectionNotes = inspectionNotes;
    returnDoc.inspectedBy = req.user?.name || 'Administrator';
    returnDoc.inspectedAt = new Date();

    if (Array.isArray(itemConditions)) {
      returnDoc.items.forEach((it: any) => {
        const matching = itemConditions.find(
          (c: any) =>
            (c.productId && c.productId.toString() === it.productId?.toString()) ||
            (c.sku && c.sku.toUpperCase() === it.sku.toUpperCase())
        );
        if (matching) {
          it.itemCondition = matching.itemCondition as ReturnItemCondition;
          if (matching.inspectionNotes) it.inspectionNotes = matching.inspectionNotes;
        }
      });
      if (returnDoc.items.length > 0) {
        returnDoc.itemCondition = returnDoc.items[0].itemCondition;
      }
    }

    const itemsToProcess = returnDoc.items && returnDoc.items.length > 0 ? returnDoc.items : [
      {
        productId: returnDoc.productId,
        productName: returnDoc.productName,
        sku: returnDoc.sku,
        quantity: returnDoc.quantity,
        itemCondition: returnDoc.itemCondition,
      } as any,
    ];

    for (const item of itemsToProcess) {
      const prod = item.productId
        ? await Product.findById(item.productId)
        : await Product.findOne({ sku: item.sku });

      if (!prod) continue;

      const previousStock = prod.stock;
      if (prod.inspectionStock && prod.inspectionStock >= item.quantity) {
        prod.inspectionStock -= item.quantity;
      }

      if (item.itemCondition === 'GOOD') {
        prod.stock += item.quantity;
        item.status = 'RESTOCKED';
        await prod.save();

        await new InventoryLog({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          vendor: returnDoc.partyId,
          vendorName: returnDoc.partyName,
          type: 'RETURN_INSPECTED_GOOD',
          quantityChanged: item.quantity,
          previousStock,
          newStock: prod.stock,
          reason: `Return Inspected - Restored to Active Stock (${returnDoc.returnNumber})`,
          reference: returnDoc.returnNumber,
          returnId: returnDoc.returnNumber,
          performedBy: req.user?.name || 'Administrator',
        }).save();
      } else if (item.itemCondition === 'UNSELLABLE') {
        prod.discardedStock = (prod.discardedStock || 0) + item.quantity;
        item.status = 'DISCARDED';
        await prod.save();

        await new InventoryLog({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          vendor: returnDoc.partyId,
          vendorName: returnDoc.partyName,
          type: 'DISCARD',
          quantityChanged: item.quantity,
          previousStock,
          newStock: prod.stock,
          reason: `Return Inspected - Discarded Unusable Stock (${returnDoc.returnNumber})`,
          reference: returnDoc.returnNumber,
          returnId: returnDoc.returnNumber,
          performedBy: req.user?.name || 'Administrator',
        }).save();
      } else {
        prod.damagedStock = (prod.damagedStock || 0) + item.quantity;
        item.status = 'DAMAGED';
        await prod.save();

        await new InventoryLog({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          vendor: returnDoc.partyId,
          vendorName: returnDoc.partyName,
          type: 'RETURN_INSPECTED_DAMAGED',
          quantityChanged: item.quantity,
          previousStock,
          newStock: prod.stock,
          reason: `Return Inspected - Damaged Stock Quarantined (${returnDoc.returnNumber})`,
          reference: returnDoc.returnNumber,
          returnId: returnDoc.returnNumber,
          performedBy: req.user?.name || 'Administrator',
        }).save();
      }
    }

    returnDoc.status = 'RESTOCKED';
    await returnDoc.save();

    // Update source sale returned count
    if (returnDoc.sourceSaleId || returnDoc.sourceReferenceNumber) {
      const sale = await Sale.findOne({
        $or: [{ saleId: returnDoc.sourceSaleId }, { saleId: returnDoc.sourceReferenceNumber }],
      });
      if (sale) {
        sale.returnedQuantity = (sale.returnedQuantity || 0) + returnDoc.quantity;
        const allImeis: string[] = [];
        returnDoc.items.forEach((it: any) => {
          if (Array.isArray(it.imeis)) allImeis.push(...it.imeis);
        });
        if (allImeis.length > 0) {
          sale.returnedImeis = Array.from(new Set([...(sale.returnedImeis || []), ...allImeis]));
        }
        await sale.save();
      }
    }

    return res.json({
      success: true,
      message: 'Return inspection processed successfully for all line items',
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/:id/settle - Settle Return with Credit Note, Refund, Account Adjustment, or Exchange (Task 13)
router.post('/:id/settle', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settlementType, settlementAmount, settlementNotes } = req.body;
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    returnDoc.settlementType = settlementType || returnDoc.settlementType || 'CREDIT_NOTE';
    returnDoc.settlementAmount = settlementAmount !== undefined ? Number(settlementAmount) : returnDoc.totalAmount;
    returnDoc.settlementNotes = settlementNotes || `Settlement issued via ${returnDoc.settlementType}`;
    returnDoc.settlementStatus = 'SETTLED';
    returnDoc.settledAt = new Date();
    returnDoc.status = 'SETTLED';

    await returnDoc.save();

    return res.json({
      success: true,
      message: `Return settled via ${returnDoc.settlementType}`,
      return: returnDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/:id/verify - Legacy endpoint compatibility
router.put('/:id/verify', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, itemCondition, settlementType } = req.body;
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    const previousStatus = returnDoc.status;
    returnDoc.status = status;
    if (itemCondition) returnDoc.itemCondition = itemCondition;
    if (settlementType) returnDoc.settlementType = settlementType;

    if ((status === 'COMPLETED' || status === 'VERIFIED') && previousStatus === 'PENDING') {
      const product = returnDoc.productId
        ? await Product.findById(returnDoc.productId)
        : await Product.findOne({ sku: returnDoc.sku });

      if (product) {
        const previousStock = product.stock;
        if (returnDoc.returnType === 'SALES_RETURN' || returnDoc.returnType === 'VENDOR_SALES_RETURN') {
          if (returnDoc.itemCondition === 'GOOD') {
            product.stock += Number(returnDoc.quantity);
            await product.save();
            const log = new InventoryLog({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              vendor: returnDoc.partyId,
              vendorName: returnDoc.partyName,
              type: 'RETURN',
              quantityChanged: Number(returnDoc.quantity),
              previousStock,
              newStock: product.stock,
              reason: `Sales Return Verified - Returned to Stock (${returnDoc.returnNumber})`,
              reference: returnDoc.returnNumber,
              returnId: returnDoc.returnNumber,
              performedBy: req.user?.name || 'Administrator',
            });
            await log.save();
          } else {
            product.damagedStock = (product.damagedStock || 0) + Number(returnDoc.quantity);
            await product.save();
            const log = new InventoryLog({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              vendor: returnDoc.partyId,
              vendorName: returnDoc.partyName,
              type: 'DAMAGE',
              quantityChanged: Number(returnDoc.quantity),
              previousStock,
              newStock: product.stock,
              reason: `Sales Return Verified - Marked Damaged (${returnDoc.returnNumber})`,
              reference: returnDoc.returnNumber,
              returnId: returnDoc.returnNumber,
              performedBy: req.user?.name || 'Administrator',
            });
            await log.save();
          }
        } else if (returnDoc.returnType === 'PURCHASE_RETURN') {
          product.stock = Math.max(0, product.stock - Number(returnDoc.quantity));
          await product.save();
          const log = new InventoryLog({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            vendor: returnDoc.partyId,
            vendorName: returnDoc.partyName,
            type: 'OUT',
            quantityChanged: Number(returnDoc.quantity),
            previousStock,
            newStock: product.stock,
            reason: `Purchase Return Completed (${returnDoc.returnNumber})`,
            reference: returnDoc.returnNumber,
            returnId: returnDoc.returnNumber,
            performedBy: req.user?.name || 'Administrator',
          });
          await log.save();
        }
      }
    }

    await returnDoc.save();
    return res.json({ success: true, message: 'Return updated successfully', return: returnDoc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
