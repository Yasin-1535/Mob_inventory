import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { getProductSuggestions } from '../controllers/productSuggestionController';
import { safeRegex } from '../utils/sanitize';

const router = Router();

// GET /api/products/suggestions - Universal Smartphone Product Suggestions
router.get('/suggestions', getProductSuggestions);

// GET /api/products/my-products - Get products scoped to authenticated vendor
router.get('/my-products', authenticateJWT, requireRole(['VENDOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, mobileType, brand, accessoryCategory, productType, search, status } = req.query;
    const filter: any = {};

    if (req.user?.role === 'VENDOR') {
      const vendorConditions: any[] = [
        { vendor: req.user.name },
        { vendorId: req.user.id },
      ];
      if (req.user.vendorId) {
        vendorConditions.push({ vendorId: req.user.vendorId });
      }
      if (req.user.companyName) {
        vendorConditions.push({ vendor: req.user.companyName });
      }
      filter.$or = vendorConditions;
    }

    if (category && category !== 'All') filter.category = category;
    if (mobileType && mobileType !== 'All') filter.mobileType = mobileType;
    if (brand && brand !== 'All') filter.brand = brand;
    if (accessoryCategory && accessoryCategory !== 'All') filter.accessoryCategory = accessoryCategory;
    if (productType && productType !== 'All') filter.productType = productType;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      const searchMatch = [
        { name: safeRegex(search as string) },
        { sku: safeRegex(search as string) },
        { category: safeRegex(search as string) },
        { brand: safeRegex(search as string) },
        { accessoryCategory: safeRegex(search as string) },
        { productType: safeRegex(search as string) },
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: searchMatch });
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products - Get all products with filtering & search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, mobileType, brand, accessoryCategory, productType, search, vendor, status } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (mobileType && mobileType !== 'All') {
      filter.mobileType = mobileType;
    }
    if (brand && brand !== 'All') {
      filter.brand = brand;
    }
    if (accessoryCategory && accessoryCategory !== 'All') {
      filter.accessoryCategory = accessoryCategory;
    }
    if (productType && productType !== 'All') {
      filter.productType = productType;
    }
    if (vendor && vendor !== 'All') {
      filter.vendor = vendor;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: safeRegex(search as string) },
        { sku: safeRegex(search as string) },
        { category: safeRegex(search as string) },
        { brand: safeRegex(search as string) },
        { accessoryCategory: safeRegex(search as string) },
        { productType: safeRegex(search as string) },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Create a product (Admin or Vendor)
router.post('/', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sku,
      name,
      category,
      mobileType,
      brand,
      accessoryCategory,
      productType,
      price,
      costPrice,
      supplierCost,
      stock,
      minStockAlert,
      lowStockThreshold,
      vendor,
      description,
      imageUrl,
    } = req.body;

    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `SKU ${sku} already exists` });
    }

    const calculatedCost = Number(supplierCost !== undefined ? supplierCost : costPrice) || 0;
    const calculatedMinAlert = Number(lowStockThreshold !== undefined ? lowStockThreshold : minStockAlert) || 10;

    const product = new Product({
      sku: sku.toUpperCase(),
      name,
      category,
      mobileType: mobileType || null,
      brand: brand || null,
      accessoryCategory: accessoryCategory || null,
      productType: productType || null,
      price: Number(price),
      costPrice: calculatedCost,
      supplierCost: calculatedCost,
      stock: Number(stock) || 0,
      minStockAlert: calculatedMinAlert,
      lowStockThreshold: calculatedMinAlert,
      vendor: vendor || req.user?.name || 'In-House',
      vendorId: req.user?.id,
      description,
      imageUrl,
    });

    await product.save();
    return res.status(201).json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authenticateJWT, requireRole(['ADMIN', 'VENDOR']), async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      mobileType,
      brand,
      accessoryCategory,
      productType,
      price,
      costPrice,
      supplierCost,
      stock,
      minStockAlert,
      lowStockThreshold,
      vendor,
      description,
      imageUrl,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (mobileType !== undefined) product.mobileType = mobileType;
    if (brand !== undefined) product.brand = brand;
    if (accessoryCategory !== undefined) product.accessoryCategory = accessoryCategory;
    if (productType !== undefined) product.productType = productType;
    if (price !== undefined) product.price = Number(price);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (supplierCost !== undefined) {
      product.supplierCost = Number(supplierCost);
      product.costPrice = Number(supplierCost);
    }
    if (stock !== undefined) product.stock = Number(stock);
    if (minStockAlert !== undefined) product.minStockAlert = Number(minStockAlert);
    if (lowStockThreshold !== undefined) {
      product.lowStockThreshold = Number(lowStockThreshold);
      product.minStockAlert = Number(lowStockThreshold);
    }
    if (vendor !== undefined) product.vendor = vendor;
    if (description !== undefined) product.description = description;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;

    await product.save();
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
