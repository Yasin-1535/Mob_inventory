import { Router, Request, Response } from 'express';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/orders - List orders (Admin gets all, Customer gets own, Vendor gets orders containing supplied products)
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};

    if (req.user?.role === 'CUSTOMER') {
      filter.customerId = req.user.id;
    }

    if (status && status !== 'All') {
      filter.orderStatus = status;
    }

    if (search) {
      filter.$or = [
        { orderNumber: safeRegex(search as string) },
        { customerName: safeRegex(search as string) },
      ];
    }

    let orders = await Order.find(filter).sort({ createdAt: -1 });

    if (req.user?.role === 'VENDOR') {
      const vendorOrConditions: any[] = [
        { vendor: req.user.name },
        { vendorId: req.user.id },
      ];
      if (req.user.vendorId) {
        vendorOrConditions.push({ vendorId: req.user.vendorId });
      }
      if (req.user.companyName) {
        vendorOrConditions.push({ vendor: req.user.companyName });
      }

      // Find vendor's products
      const vendorProducts = await Product.find({
        $or: vendorOrConditions,
      });
      const vendorProductIds = new Set(vendorProducts.map((p) => p._id.toString()));
      const vendorSkus = new Set(vendorProducts.map((p) => p.sku.toUpperCase()));

      // Filter orders that have items belonging to this vendor
      orders = orders
        .filter((order) =>
          order.items.some(
            (item) =>
              (item.productId && vendorProductIds.has(item.productId.toString())) ||
              (item.sku && vendorSkus.has(item.sku.toUpperCase()))
          )
        )
        .map((order) => {
          // Scope order items to only vendor's items
          const vendorItems = order.items.filter(
            (item) =>
              (item.productId && vendorProductIds.has(item.productId.toString())) ||
              (item.sku && vendorSkus.has(item.sku.toUpperCase()))
          );
          const vendorSubtotal = vendorItems.reduce((sum, item) => sum + item.subtotal, 0);
          const orderObj = order.toObject();
          return {
            ...orderObj,
            items: vendorItems,
            totalAmount: vendorSubtotal,
            grandTotal: vendorSubtotal,
          } as any;
        });
    }

    return res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders - Create new order (Customer checkout)
router.post('/', authenticateJWT, requireRole(['CUSTOMER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;
    const orderItems: IOrderItem[] = [];

    // Verify stock and calculate total
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name || item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      // Deduct inventory stock
      product.stock -= item.quantity;
      await product.save();
    }

    const shippingFee = totalAmount > 50 ? 0 : 9.99;
    const taxAmount = Math.round(totalAmount * 0.08 * 100) / 100;
    const grandTotal = Math.round((totalAmount + shippingFee + taxAmount) * 100) / 100;

    const order = new Order({
      orderNumber,
      customerId: req.user?.id,
      customerName: req.user?.name || 'Customer',
      customerEmail: req.user?.email || 'customer@smartinventory.com',
      items: orderItems,
      totalAmount,
      shippingFee,
      taxAmount,
      grandTotal,
      orderStatus: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod || 'Credit Card',
      shippingAddress: shippingAddress || {},
      notes,
    });

    await order.save();
    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin)
router.put('/:id/status', authenticateJWT, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();
    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
