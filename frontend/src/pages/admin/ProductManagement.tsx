import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  Boxes,
  X,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  Phone,
  Headphones,
  Shield,
  Zap,
  HardDrive,
  Camera,
  Wrench,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Minus,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import BrandCard from '../../components/BrandCard';
import { SmartphoneAutocompleteInput } from '../../components/SmartphoneAutocompleteInput';
import { SmartphoneSuggestion } from '../../data/smartphoneProductCatalog';
import { useStore, SaleRecord } from '../../context/StoreContext';
import { Product } from '../../data/mockProducts';
import {
  SMARTPHONE_BRANDS,
  KEYPAD_BRANDS,
  SECONDHAND_MOBILE_CATEGORY,
  findBrandById,
  MobileBrand,
} from '../../data/mobileCategories';
import {
  ACCESSORY_CATEGORIES,
  findAccessoryCategoryById,
  findAccessoryCategoryByNameOrKey,
  AccessoryCategory,
} from '../../data/accessoryCategories';

const CATEGORIES = [
  'All',
  'Mobiles',
  'Accessories',
];

const CATEGORY_META = [
  {
    name: 'Mobiles',
    description: 'Smartphones & Indian Keypad phones',
    icon: Smartphone,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    badge: 'Smart & Keypad',
    link: '/admin/products/mobiles',
  },
  {
    name: 'Accessories',
    description: 'Cases, chargers, audio, holders, storage & spares',
    icon: Headphones,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    badge: '7 Categories',
    link: '/admin/products/accessories',
  },
];

export const ProductManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { brandId, subcategoryId } = useParams<{ brandId?: string; subcategoryId?: string }>();
  const { products, vendors, addProduct, updateProduct, deleteProduct, sellProduct } = useStore();

  // Active Vendors available for selection
  const activeVendors = useMemo(() => {
    return vendors.filter((v) => v.status === 'Active');
  }, [vendors]);

  // Route Analysis
  const pathname = location.pathname;
  const isMobilesRoot = pathname === '/admin/products/mobiles';
  const isSmartphonesGrid = pathname === '/admin/products/mobiles/smartphones';
  const isKeypadGrid = pathname === '/admin/products/mobiles/keypad-phones';
  const isSecondhandPage = pathname === '/admin/products/mobiles/secondhand' || pathname === '/admin/products/mobiles/secondhand-mobiles';
  const isSmartphoneBrandPage = pathname.startsWith('/admin/products/mobiles/smartphones/') && !!brandId;
  const isKeypadBrandPage = pathname.startsWith('/admin/products/mobiles/keypad-phones/') && !!brandId;
  const isBrandPage = isSmartphoneBrandPage || isKeypadBrandPage;

  // Accessories Route Analysis
  const isAccessoriesRoot = pathname === '/admin/products/accessories';
  const isAccessorySubcategoryPage = pathname.startsWith('/admin/products/accessories/') && !!subcategoryId;

  const currentMobileType: 'Smartphone' | 'Keypad Phone' | null = isSmartphoneBrandPage || isSmartphonesGrid
    ? 'Smartphone'
    : isKeypadBrandPage || isKeypadGrid
    ? 'Keypad Phone'
    : null;

  // Selected Brand Object if on Brand Page
  const currentBrand: MobileBrand | undefined = useMemo(() => {
    if (!brandId || !currentMobileType) return undefined;
    return findBrandById(currentMobileType, brandId);
  }, [brandId, currentMobileType]);

  // Selected Accessory Category if on Accessory Subcategory Page
  const currentAccessoryCategory: AccessoryCategory | undefined = useMemo(() => {
    if (!subcategoryId) return undefined;
    return findAccessoryCategoryById(subcategoryId);
  }, [subcategoryId]);

  // Local Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccessoryCategory, setSelectedAccessoryCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Stepper Quantity state per row (product.id -> number)
  const [rowQuantities, setRowQuantities] = useState<Record<string, number>>({});
  const getRowQty = (id: string) => rowQuantities[id] || 1;
  const handleRowQtyChange = (id: string, delta: number, maxStock: number) => {
    const current = rowQuantities[id] || 1;
    const updated = Math.max(1, Math.min(maxStock, current + delta));
    setRowQuantities((prev) => ({ ...prev, [id]: updated }));
  };

  // Sell Modal States
  const [sellModalProduct, setSellModalProduct] = useState<Product | null>(null);
  const [sellQuantityInput, setSellQuantityInput] = useState('1');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [sellNotes, setSellNotes] = useState('');
  const [sellError, setSellError] = useState('');

  // Derived sell quantity parsing & validation
  const parsedSellQuantity = useMemo(() => {
    const trimmed = sellQuantityInput.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return null;
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? null : num;
  }, [sellQuantityInput]);

  const isQuantityValid = useMemo(() => {
    if (!sellModalProduct) return false;
    if (parsedSellQuantity === null) return false;
    return parsedSellQuantity >= 1 && parsedSellQuantity <= sellModalProduct.stock;
  }, [parsedSellQuantity, sellModalProduct]);

  const quantityValidationMessage = useMemo(() => {
    if (!sellModalProduct) return '';
    const trimmed = sellQuantityInput.trim();
    if (!trimmed) return 'Enter a quantity.';
    if (!/^\d+$/.test(trimmed)) return 'Only whole positive numbers are allowed.';
    if (parsedSellQuantity === null || parsedSellQuantity <= 0) return 'Quantity must be at least 1.';
    if (parsedSellQuantity > sellModalProduct.stock) {
      return `Maximum available quantity is ${sellModalProduct.stock}.`;
    }
    return '';
  }, [sellQuantityInput, parsedSellQuantity, sellModalProduct]);

  // Stepper helper handlers for Sell Modal
  const handleModalDecreaseQty = () => {
    const current = parsedSellQuantity || 1;
    const next = Math.max(1, current - 1);
    setSellQuantityInput(next.toString());
    if (sellError) setSellError('');
  };

  const handleModalIncreaseQty = () => {
    if (!sellModalProduct) return;
    const current = parsedSellQuantity || 0;
    const next = Math.min(sellModalProduct.stock, current + 1);
    setSellQuantityInput(next.toString());
    if (sellError) setSellError('');
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setSellQuantityInput('');
      if (sellError) setSellError('');
      return;
    }
    const sanitized = raw.replace(/\D/g, '');
    const normalized = sanitized.replace(/^0+(?=\d)/, '');
    setSellQuantityInput(normalized);
    if (sellError) setSellError('');
  };

  const handleQuantityInputBlur = () => {
    if (!sellModalProduct) return;
    const trimmed = sellQuantityInput.trim();
    if (!trimmed || parsedSellQuantity === null || parsedSellQuantity < 1) {
      setSellQuantityInput('1');
    } else if (parsedSellQuantity > sellModalProduct.stock) {
      setSellQuantityInput(sellModalProduct.stock.toString());
    }
  };

  // Sale Receipt Modal State
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  // Modal States (CRUD)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: string;
    mobileType: 'Smartphone' | 'Keypad Phone' | 'Secondhand' | '';
    mobileCondition?: 'NEW' | 'SECONDHAND';
    brand: string;
    accessoryCategory: string;
    productType: string;
    price: string;
    costPrice: string;
    supplierCost: string;
    stock: string;
    minStockAlert: string;
    lowStockThreshold: string;
    vendor: string;
    description: string;
  }>({
    name: '',
    sku: '',
    category: 'Mobiles',
    mobileType: 'Smartphone',
    mobileCondition: 'NEW',
    brand: 'Apple',
    accessoryCategory: 'CASES_PROTECTION',
    productType: 'Transparent Back Cover',
    price: '',
    costPrice: '',
    supplierCost: '',
    stock: '',
    minStockAlert: '10',
    lowStockThreshold: '10',
    vendor: 'ABC Electronics',
    description: '',
  });

  // Duplicate product detection
  const duplicateProduct = useMemo(() => {
    if (!formData.name.trim()) return null;
    if (editingProduct && editingProduct.name.toLowerCase().trim() === formData.name.toLowerCase().trim()) {
      return null;
    }
    const normName = formData.name.toLowerCase().trim();

    return products.find((p) => {
      const pName = p.name.toLowerCase().trim();
      return pName === normName;
    });
  }, [formData.name, products, editingProduct]);

  // Brand mismatch warning calculation
  const brandMismatchWarning = useMemo(() => {
    if (!formData.name.trim() || !formData.brand || formData.category !== 'Mobiles') return null;

    const normBrand = formData.brand.toLowerCase().trim();
    if (normBrand === 'secondhand mobiles' || normBrand === 'all') return null;

    const knownBrands = [
      'apple', 'samsung', 'poco', 'redmi', 'xiaomi', 'google', 'oneplus',
      'vivo', 'iqoo', 'realme', 'nothing', 'cmf', 'motorola', 'infinix', 'tecno', 'honor', 'oppo'
    ];

    const normName = formData.name.toLowerCase().trim();
    const detectedBrand = knownBrands.find((b) => normName.includes(b) || normName.startsWith(b));

    if (detectedBrand && !normBrand.includes(detectedBrand) && !detectedBrand.includes(normBrand)) {
      const formattedDetected = detectedBrand === 'apple' ? 'Apple' : detectedBrand.toUpperCase();
      return `Selected product belongs to ${formattedDetected}, but Brand is ${formData.brand}.`;
    }
    return null;
  }, [formData.name, formData.brand, formData.category]);

  // Autocomplete selection handler with optional brand & SKU auto-fill
  const handleAutocompleteSelect = (
    newName: string,
    suggestion?: SmartphoneSuggestion
  ) => {
    let updatedBrand = formData.brand;

    if (suggestion) {
      if (!formData.brand || formData.brand === 'Secondhand Mobiles' || formData.brand === '') {
        updatedBrand = suggestion.brandName;
      }
    }

    let updatedSku = formData.sku;
    if (!editingProduct && (!formData.sku || formData.sku.startsWith('APL-') || formData.sku.startsWith('PRD-') || formData.sku.startsWith('POC-') || formData.sku.startsWith('SAM-'))) {
      const bPrefix = (updatedBrand || suggestion?.brandName || 'PRD').substring(0, 3).toUpperCase();
      const mClean = newName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      const randSuffix = Math.floor(100 + Math.random() * 900);
      updatedSku = `${bPrefix}-${mClean}-${randSuffix}`;
    }

    setFormData((prev) => ({
      ...prev,
      name: newName,
      brand: updatedBrand,
      sku: updatedSku,
    }));
  };

  // Open Sell Modal with intelligent vendor pre-selection
  const handleOpenSellModal = (product: Product, initialQty = 1) => {
    if (product.stock <= 0) return;
    setSellModalProduct(product);
    const safeQty = Math.max(1, Math.min(product.stock, initialQty));
    setSellQuantityInput(safeQty.toString());

    // Pre-select matching active vendor if product has an assigned vendor
    const matchingVendor = activeVendors.find(
      (v) =>
        v.name.toLowerCase().trim() === (product.vendor || '').toLowerCase().trim() ||
        v.id.toLowerCase().trim() === (product.vendor || '').toLowerCase().trim()
    );
    setSelectedVendorId(matchingVendor ? matchingVendor.id : '');
    setSellPaymentMethod('Cash');
    setSellNotes('');
    setSellError('');
  };

  // Confirm Sale action
  const handleConfirmSale = () => {
    if (!sellModalProduct) return;
    if (!isQuantityValid || parsedSellQuantity === null) {
      setSellError(quantityValidationMessage || 'Please enter a valid quantity.');
      return;
    }
    if (!selectedVendorId) {
      setSellError('Please select a vendor.');
      return;
    }

    const vendorObj = vendors.find((v) => v.id === selectedVendorId);
    const result = sellProduct(
      sellModalProduct.id,
      parsedSellQuantity,
      sellPaymentMethod,
      selectedVendorId,
      vendorObj?.name,
      sellNotes
    );
    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setSellModalProduct(null);
      setSelectedVendorId('');
      setSellQuantityInput('1');
      setRowQuantities((prev) => ({ ...prev, [sellModalProduct.id]: 1 }));
    } else {
      setSellError(result.message || 'Failed to complete sale');
    }
  };

  // Open Add Product Modal with context-aware defaults
  const handleOpenAddModal = (
    presetBrand?: string,
    presetMobileType?: 'Smartphone' | 'Keypad Phone',
    presetCategory?: string,
    presetAccessoryCategory?: string,
    presetProductType?: string
  ) => {
    const effectiveCategory =
      presetCategory ||
      (isAccessoriesRoot || isAccessorySubcategoryPage
        ? 'Accessories'
        : currentMobileType || isMobilesRoot || isSmartphonesGrid || isKeypadGrid || isBrandPage
        ? 'Mobiles'
        : selectedCategory !== 'All'
        ? selectedCategory
        : 'Mobiles');

    const effectiveMobileType =
      presetMobileType ||
      (effectiveCategory === 'Mobiles' ? currentMobileType || 'Smartphone' : '');

    const defaultBrand =
      presetBrand ||
      (currentBrand ? currentBrand.name : effectiveMobileType === 'Keypad Phone' ? 'Lava' : 'Apple');

    const defaultAccCatKey =
      presetAccessoryCategory ||
      (currentAccessoryCategory ? currentAccessoryCategory.key : 'CASES_PROTECTION');

    const defaultAccCatObj =
      ACCESSORY_CATEGORIES.find((c) => c.key === defaultAccCatKey || c.id === defaultAccCatKey) ||
      ACCESSORY_CATEGORIES[0];

    const defaultProductType = presetProductType || defaultAccCatObj.productTypes[0] || '';

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const skuPrefix =
      effectiveCategory === 'Mobiles'
        ? defaultBrand.replace(/\s+/g, '').substring(0, 3).toUpperCase()
        : 'ACC';

    setFormData({
      name: effectiveCategory === 'Accessories' ? defaultProductType : '',
      sku: `${skuPrefix}-${randomSuffix}`,
      category: effectiveCategory,
      mobileType: effectiveMobileType,
      brand: effectiveCategory === 'Mobiles' ? defaultBrand : '',
      accessoryCategory: defaultAccCatKey,
      productType: defaultProductType,
      price: '',
      costPrice: '',
      supplierCost: '',
      stock: '',
      minStockAlert: '10',
      lowStockThreshold: '10',
      vendor: 'ABC Electronics',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      mobileType:
        (product.mobileType as 'Smartphone' | 'Keypad Phone') ||
        (product.category === 'Mobiles' ? 'Smartphone' : ''),
      brand: product.brand || '',
      accessoryCategory: product.accessoryCategory || 'CASES_PROTECTION',
      productType: product.productType || '',
      price: product.price.toString(),
      costPrice: (product.costPrice || product.supplierCost || 0).toString(),
      supplierCost: (product.supplierCost || product.costPrice || 0).toString(),
      stock: product.stock.toString(),
      minStockAlert: (product.minStockAlert || product.lowStockThreshold || 10).toString(),
      lowStockThreshold: (product.lowStockThreshold || product.minStockAlert || 10).toString(),
      vendor: product.vendor,
      description: product.description || '',
    });
  };

  // Handle Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return;

    const parsedPrice = parseFloat(formData.price) || 0;
    const parsedCost = parseFloat(formData.supplierCost || formData.costPrice) || 0;
    const parsedStock = parseInt(formData.stock, 10) || 0;
    const parsedThreshold = parseInt(formData.lowStockThreshold || formData.minStockAlert, 10) || 10;

    const status: Product['status'] =
      parsedStock <= 0 ? 'Out of Stock' : parsedStock <= parsedThreshold ? 'Low Stock' : 'In Stock';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        category: formData.category,
        mobileType: formData.category === 'Mobiles' ? formData.mobileType : undefined,
        brand: formData.category === 'Mobiles' ? formData.brand : undefined,
        accessoryCategory: formData.category === 'Accessories' ? formData.accessoryCategory : undefined,
        productType: formData.category === 'Accessories' ? formData.productType : undefined,
        price: parsedPrice,
        costPrice: parsedCost,
        supplierCost: parsedCost,
        stock: parsedStock,
        minStockAlert: parsedThreshold,
        lowStockThreshold: parsedThreshold,
        vendor: formData.vendor,
        description: formData.description,
        status,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category: formData.category,
        mobileType: formData.category === 'Mobiles' ? formData.mobileType : undefined,
        brand: formData.category === 'Mobiles' ? formData.brand : undefined,
        accessoryCategory: formData.category === 'Accessories' ? formData.accessoryCategory : undefined,
        productType: formData.category === 'Accessories' ? formData.productType : undefined,
        price: parsedPrice,
        costPrice: parsedCost,
        supplierCost: parsedCost,
        stock: parsedStock,
        minStockAlert: parsedThreshold,
        lowStockThreshold: parsedThreshold,
        vendor: formData.vendor,
        description: formData.description,
        status,
      });
      setIsAddModalOpen(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Products Counts and Filtering
  const smartphoneProductsCount = useMemo(() => {
    return products.filter((p) => p.category === 'Mobiles' && p.mobileType === 'Smartphone').length;
  }, [products]);

  const secondhandProductsCount = useMemo(() => {
    return products.filter(
      (p) =>
        p.category === 'Mobiles' &&
        (p.mobileType === 'Secondhand' || p.mobileCondition === 'SECONDHAND' || p.brand === 'Secondhand Mobiles')
    ).length;
  }, [products]);

  const keypadProductsCount = useMemo(() => {
    return products.filter((p) => p.category === 'Mobiles' && p.mobileType === 'Keypad Phone').length;
  }, [products]);

  const getBrandProductCount = (brandName: string, type: 'Smartphone' | 'Keypad Phone') => {
    const normalized = brandName.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.category === 'Mobiles' &&
        p.mobileType === type &&
        p.brand?.toLowerCase().trim() === normalized
    ).length;
  };

  // Filtered Products for the table
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      // 0. If on Secondhand Mobiles Page
      if (isSecondhandPage) {
        const matchesCategory =
          p.category === 'Mobiles' &&
          (p.mobileType === 'Secondhand' || p.mobileCondition === 'SECONDHAND' || p.brand === 'Secondhand Mobiles');
        const matchesSearch =
          !searchQuery ||
          (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
        return matchesCategory && matchesSearch && matchesStatus;
      }

      // 1. If on Mobile Brand Page (e.g. Apple or Reliance Jio)
      if (isBrandPage && currentBrand && currentMobileType) {
        const matchesBrand = p.brand?.toLowerCase().trim() === currentBrand.name.toLowerCase().trim();
        const matchesType = p.mobileType === currentMobileType;
        const matchesSearch =
          !searchQuery ||
          (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
        return matchesBrand && matchesType && matchesSearch && matchesStatus;
      }

      // 2. If on Accessory Subcategory Page (e.g. /admin/products/accessories/audio)
      if (isAccessorySubcategoryPage && currentAccessoryCategory) {
        const matchesAccessoryCat =
          p.category === 'Accessories' &&
          (p.accessoryCategory === currentAccessoryCategory.key ||
            p.accessoryCategory?.toLowerCase() === currentAccessoryCategory.id ||
            p.accessoryCategory?.toLowerCase() === currentAccessoryCategory.name.toLowerCase());
        const matchesSearch =
          !searchQuery ||
          (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.productType && p.productType.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
        return matchesAccessoryCat && matchesSearch && matchesStatus;
      }

      // 3. If on Accessories Root (/admin/products/accessories)
      if (isAccessoriesRoot) {
        const matchesCategory = p.category === 'Accessories';
        const matchesAccessoryFilter =
          selectedAccessoryCategory === 'All' ||
          p.accessoryCategory === selectedAccessoryCategory ||
          p.accessoryCategory === findAccessoryCategoryByNameOrKey(selectedAccessoryCategory)?.key;
        const matchesSearch =
          !searchQuery ||
          (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.productType && p.productType.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
        return matchesCategory && matchesAccessoryFilter && matchesSearch && matchesStatus;
      }

      // 4. If on Main Products page (/admin/products)
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.productType && p.productType.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [
    products,
    isBrandPage,
    currentBrand,
    currentMobileType,
    isAccessorySubcategoryPage,
    currentAccessoryCategory,
    isAccessoriesRoot,
    selectedAccessoryCategory,
    searchQuery,
    selectedCategory,
    selectedStatus,
  ]);

  // Filtered Brand Cards on Smartphone Brands Page (13 brands)
  const filteredSmartphoneBrands = useMemo(() => {
    if (!brandSearchQuery) return SMARTPHONE_BRANDS;
    const query = brandSearchQuery.toLowerCase();
    return SMARTPHONE_BRANDS.filter(
      (b) => b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query)
    );
  }, [brandSearchQuery]);

  // Filtered Brand Cards on Keypad Brands Page (8 brands)
  const filteredKeypadBrands = useMemo(() => {
    if (!brandSearchQuery) return KEYPAD_BRANDS;
    const query = brandSearchQuery.toLowerCase();
    return KEYPAD_BRANDS.filter(
      (b) => b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query)
    );
  }, [brandSearchQuery]);

  // KPIs for the active view
  const activeProductsPool = isSecondhandPage
    ? products.filter(
        (p) =>
          p.category === 'Mobiles' &&
          (p.mobileType === 'Secondhand' || p.mobileCondition === 'SECONDHAND' || p.brand === 'Secondhand Mobiles')
      )
    : isBrandPage
    ? products.filter(
        (p) =>
          currentBrand &&
          p.brand?.toLowerCase().trim() === currentBrand.name.toLowerCase().trim() &&
          p.mobileType === currentMobileType
      )
    : isAccessorySubcategoryPage
    ? products.filter(
        (p) =>
          currentAccessoryCategory &&
          p.category === 'Accessories' &&
          (p.accessoryCategory === currentAccessoryCategory.key ||
            p.accessoryCategory?.toLowerCase() === currentAccessoryCategory.id ||
            p.accessoryCategory?.toLowerCase() === currentAccessoryCategory.name.toLowerCase())
      )
    : isAccessoriesRoot
    ? products.filter((p) => p.category === 'Accessories')
    : isMobilesRoot
    ? products.filter((p) => p.category === 'Mobiles')
    : isSmartphonesGrid
    ? products.filter((p) => p.category === 'Mobiles' && p.mobileType === 'Smartphone')
    : isKeypadGrid
    ? products.filter((p) => p.category === 'Mobiles' && p.mobileType === 'Keypad Phone')
    : selectedCategory !== 'All'
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const totalCount = activeProductsPool.length;
  const inStockCount = activeProductsPool.filter((p) => p.status === 'In Stock').length;
  const lowStockCount = activeProductsPool.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = activeProductsPool.filter((p) => p.status === 'Out of Stock').length;

  // Breadcrumb generation
  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-4 overflow-x-auto whitespace-nowrap">
        <Link
          to="/admin/products"
          className="hover:text-[#1552B3] transition-colors flex items-center space-x-1"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products</span>
        </Link>

        {/* Mobiles branch */}
        {(isMobilesRoot || isSmartphonesGrid || isKeypadGrid || isSecondhandPage || isBrandPage) && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <Link
              to="/admin/products/mobiles"
              className={`hover:text-[#1552B3] transition-colors ${
                isMobilesRoot ? 'text-gray-900 font-bold' : ''
              }`}
            >
              Mobiles
            </Link>
          </>
        )}

        {(isSmartphonesGrid || isSmartphoneBrandPage) && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <Link
              to="/admin/products/mobiles/smartphones"
              className={`hover:text-[#1552B3] transition-colors ${
                isSmartphonesGrid ? 'text-gray-900 font-bold' : ''
              }`}
            >
              Smartphones
            </Link>
          </>
        )}

        {isSecondhandPage && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-bold">Secondhand Mobiles</span>
          </>
        )}

        {(isKeypadGrid || isKeypadBrandPage) && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <Link
              to="/admin/products/mobiles/keypad-phones"
              className={`hover:text-[#1552B3] transition-colors ${
                isKeypadGrid ? 'text-gray-900 font-bold' : ''
              }`}
            >
              Keypad Phones
            </Link>
          </>
        )}

        {isBrandPage && currentBrand && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-bold">{currentBrand.name}</span>
          </>
        )}

        {/* Accessories branch */}
        {(isAccessoriesRoot || isAccessorySubcategoryPage) && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <Link
              to="/admin/products/accessories"
              className={`hover:text-[#1552B3] transition-colors ${
                isAccessoriesRoot ? 'text-gray-900 font-bold' : ''
              }`}
            >
              Accessories
            </Link>
          </>
        )}

        {isAccessorySubcategoryPage && currentAccessoryCategory && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-bold">{currentAccessoryCategory.name}</span>
          </>
        )}
      </div>
    );
  };

  // Back Button generation
  const renderBackButton = () => {
    if (isBrandPage) {
      const backPath = isSmartphoneBrandPage
        ? '/admin/products/mobiles/smartphones'
        : '/admin/products/mobiles/keypad-phones';
      const backLabel = isSmartphoneBrandPage
        ? 'Back to Smartphone Brands'
        : 'Back to Keypad Brands';
      return (
        <button
          onClick={() => navigate(backPath)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </button>
      );
    }

    if (isAccessorySubcategoryPage) {
      return (
        <button
          onClick={() => navigate('/admin/products/accessories')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Accessories</span>
        </button>
      );
    }

    if (isAccessoriesRoot) {
      return (
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </button>
      );
    }

    if (isSmartphonesGrid || isKeypadGrid) {
      return (
        <button
          onClick={() => navigate('/admin/products/mobiles')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mobile Categories</span>
        </button>
      );
    }

    if (isMobilesRoot) {
      return (
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </button>
      );
    }

    return null;
  };

  // Page Header Titles
  const pageTitle = isBrandPage && currentBrand
    ? `${currentBrand.name} Products`
    : isAccessorySubcategoryPage && currentAccessoryCategory
    ? `${currentAccessoryCategory.name}`
    : isAccessoriesRoot
    ? 'Accessories Catalog'
    : isSmartphonesGrid
    ? 'Smartphone Brands'
    : isKeypadGrid
    ? 'Indian Keypad Phone Brands'
    : isMobilesRoot
    ? 'Mobile Products'
    : 'Product Catalog & Categories';

  const pageSubtitle = isBrandPage && currentBrand
    ? `Manage ${currentBrand.name} ${currentBrand.mobileType} catalog, pricing, SKU assignments, and stock.`
    : isAccessorySubcategoryPage && currentAccessoryCategory
    ? `Manage ${currentAccessoryCategory.name} products, accessories inventory, pricing, and stock.`
    : isAccessoriesRoot
    ? 'Browse and manage products across 7 specialized accessory subcategories.'
    : isSmartphonesGrid
    ? 'Select a smartphone brand to manage its products and inventory.'
    : isKeypadGrid
    ? 'Manage feature phones and keypad devices.'
    : isMobilesRoot
    ? 'Manage smartphones, keypad phones and mobile inventory.'
    : 'Organize products by Mobiles and Accessories categories, manage brands, pricing, and stock levels.';

  return (
    <AdminLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={
        <div className="flex items-center space-x-2">
          {renderBackButton()}
          <button
            onClick={() =>
              handleOpenAddModal(
                currentBrand?.name,
                currentMobileType || undefined,
                isAccessorySubcategoryPage || isAccessoriesRoot ? 'Accessories' : undefined,
                currentAccessoryCategory?.key,
                currentAccessoryCategory?.productTypes[0]
              )
            }
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        {renderBreadcrumb()}

        {/* 1. MAIN PRODUCT CATEGORIES (Shown when on /admin/products) */}
        {!isMobilesRoot && !isSmartphonesGrid && !isKeypadGrid && !isBrandPage && !isAccessoriesRoot && !isAccessorySubcategoryPage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Product Categories</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Select a category to browse organized products, brands, and accessory subcategories
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORY_META.map((cat) => {
                const Icon = cat.icon;
                const count = products.filter((p) => p.category === cat.name).length;

                return (
                  <div
                    key={cat.name}
                    onClick={() => {
                      if (cat.link) {
                        navigate(cat.link);
                      } else {
                        setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (cat.link) navigate(cat.link);
                        else setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name);
                      }
                    }}
                    className="bg-white border border-gray-200 shadow-xs hover:border-[#1552B3] hover:shadow-md hover:-translate-y-0.5 rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {cat.badge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1552B3] border border-blue-100 text-[11px] font-bold">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">
                        {count} {count === 1 ? 'Product' : 'Products'} Available
                      </span>
                      <div className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1552B3] group-hover:translate-x-1 transition-transform">
                        <span>Explore {cat.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MOBILES CATEGORY SELECTION (Shown when on /admin/products/mobiles) */}
        {isMobilesRoot && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-gray-900">Mobile Types</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Choose a mobile phone classification to manage specialized brands and products
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Smartphones Box */}
                <div
                  onClick={() => navigate('/admin/products/mobiles/smartphones')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate('/admin/products/mobiles/smartphones');
                  }}
                  className="group bg-white border border-gray-200 hover:border-[#1552B3] hover:shadow-md hover:-translate-y-0.5 rounded-xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-[#EEF4FF] group-hover:bg-[#1552B3] text-[#1552B3] group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <Smartphone className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1552B3] transition-colors">
                          Smartphones
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#1552B3] border border-blue-100 rounded-md text-[10px] font-bold">
                          13 Brands
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Android & iOS devices
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Apple, Samsung, OnePlus, Vivo, Oppo, Xiaomi, Realme, Nothing, Motorola, Google, Poco, iQOO, Infinix
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">
                      {smartphoneProductsCount} Products in Stock
                    </span>
                    <div className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1552B3] group-hover:translate-x-1 transition-transform">
                      <span>Explore Brands</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Keypad Phones Box */}
                <div
                  onClick={() => navigate('/admin/products/mobiles/keypad-phones')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate('/admin/products/mobiles/keypad-phones');
                  }}
                  className="group bg-white border border-gray-200 hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 rounded-xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <Phone className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                          Indian Keypad Phones
                        </h3>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold">
                          8 Indian Brands
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Feature and keypad phones
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Lava, Reliance Jio, Micromax, Karbonn, Itel, Samsung, AJ, Celkon
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">
                      {keypadProductsCount} Products in Stock
                    </span>
                    <div className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
                      <span>Explore Brands</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2B. ACCESSORIES 7 CATEGORIES GRID (Shown when on /admin/products/accessories) */}
        {isAccessoriesRoot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Accessories Categories</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Select an accessory category to browse specialized product types and inventory
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {ACCESSORY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = products.filter(
                  (p) =>
                    p.category === 'Accessories' &&
                    (p.accessoryCategory === cat.key ||
                      p.accessoryCategory?.toLowerCase() === cat.id ||
                      p.accessoryCategory?.toLowerCase() === cat.name.toLowerCase())
                ).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => navigate(`/admin/products/accessories/${cat.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/admin/products/accessories/${cat.id}`);
                      }
                    }}
                    className="bg-white border border-gray-200 shadow-xs hover:border-[#1552B3] hover:shadow-md hover:-translate-y-0.5 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cat.badgeColor}`}>
                          {cat.productTypes.length} Types
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1552B3] transition-colors">{cat.name}</h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </span>
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#1552B3] group-hover:bg-blue-50 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2C. ACCESSORY SUBCATEGORY BANNER (Shown when on /admin/products/accessories/:subcategoryId) */}
        {isAccessorySubcategoryPage && currentAccessoryCategory && (
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentAccessoryCategory.color}`}>
                <currentAccessoryCategory.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-900">{currentAccessoryCategory.name}</h2>
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${currentAccessoryCategory.badgeColor}`}>
                    Accessory Subcategory
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {currentAccessoryCategory.description} • {currentAccessoryCategory.productTypes.length} standardized product types
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/admin/products/accessories')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Accessories</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SMARTPHONE BRANDS GRID (Shown when on /admin/products/mobiles/smartphones) */}
        {isSmartphonesGrid && (
          <div className="space-y-6">
            {/* Search Brands Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                <span>Showing <strong>{filteredSmartphoneBrands.length}</strong> New Smartphone Brands</span>
              </div>
            </div>

            {/* SECTION 1 — SECONDHAND MOBILES */}
            {(!brandSearchQuery ||
              'secondhand mobiles'.includes(brandSearchQuery.toLowerCase()) ||
              'second hand'.includes(brandSearchQuery.toLowerCase()) ||
              'used'.includes(brandSearchQuery.toLowerCase()) ||
              'refurbished'.includes(brandSearchQuery.toLowerCase())) && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Secondhand Mobiles</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Used, refurbished and pre-owned mobile devices
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <BrandCard
                    brand={{
                      id: SECONDHAND_MOBILE_CATEGORY.id,
                      name: SECONDHAND_MOBILE_CATEGORY.name,
                      description: SECONDHAND_MOBILE_CATEGORY.description,
                      mobileType: 'Smartphone',
                      logoText: SECONDHAND_MOBILE_CATEGORY.logoText,
                    }}
                    productCount={secondhandProductsCount}
                    onClick={() => navigate('/admin/products/mobiles/secondhand')}
                  />
                </div>
              </div>
            )}

            {/* SECTION 2 — NEW MOBILES */}
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">New Mobiles</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  New smartphones from popular brands
                </p>
              </div>

              {filteredSmartphoneBrands.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-xs">
                  <p>No new smartphone brands matching "{brandSearchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSmartphoneBrands.map((brand) => {
                    const count = getBrandProductCount(brand.name, 'Smartphone');
                    return (
                      <BrandCard
                        key={brand.id}
                        brand={brand}
                        productCount={count}
                        onClick={() => navigate(`/admin/products/mobiles/smartphones/${brand.id}`)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. KEYPAD PHONE BRANDS GRID (Shown when on /admin/products/mobiles/keypad-phones) */}
        {isKeypadGrid && (
          <div className="space-y-4">
            {/* Search Brands Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                <span>Showing <strong>{filteredKeypadBrands.length}</strong> Indian Keypad Brands</span>
              </div>
            </div>

            {/* 8 Indian Keypad Brands Cards */}
            {filteredKeypadBrands.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                <p>No keypad brands matching "{brandSearchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredKeypadBrands.map((brand) => {
                  const count = getBrandProductCount(brand.name, 'Keypad Phone');
                  return (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      productCount={count}
                      onClick={() => navigate(`/admin/products/mobiles/keypad-phones/${brand.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. KPI COUNTERS (Shown on All Views) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                {isBrandPage ? `${currentBrand?.name} Products` : 'Total Products'}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-[#1552B3] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">In Stock</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{inStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Low Stock Warning</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Out of Stock</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{outOfStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 6. FILTER & SEARCH BAR (Shown on Brand Pages & Main Products view) */}
        {(!isSmartphonesGrid && !isKeypadGrid) && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isBrandPage ? `Search ${currentBrand?.name} products...` : "Search by name, SKU, brand, or vendor..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              {!isBrandPage && !isMobilesRoot && (
                <>
                  <div className="flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-500">Category:</span>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. PRODUCT TABLE */}
        {(!isSmartphonesGrid && !isKeypadGrid) && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Category & Brand</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Retail Price</th>
                    <th className="py-3 px-4">Supplier Cost</th>
                    <th className="py-3 px-4">Stock Units</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions & Sell</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {displayedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="max-w-xs mx-auto text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                            <Package className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">
                            {isBrandPage && currentBrand
                              ? `No products found for ${currentBrand.name}.`
                              : 'No products found matching criteria.'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isBrandPage && currentBrand
                              ? `You can add the first ${currentBrand.name} product to the catalog now.`
                              : 'Try adjusting your search query or add a new product.'}
                          </p>
                          <button
                            onClick={() => handleOpenAddModal(currentBrand?.name, currentMobileType || undefined)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1552B3] text-white text-xs font-semibold rounded-lg hover:bg-[#0f4091] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Product</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map((product) => {
                      const qty = getRowQty(product.id);
                      const isOutOfStock = product.stock <= 0;

                      return (
                        <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <span className="text-[10px] font-mono text-gray-400">{product.sku}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                                {product.category}
                              </span>
                              {product.brand && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1552B3] text-[10px] font-semibold">
                                  {product.brand}
                                </span>
                              )}
                              {product.mobileType && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                    product.mobileType === 'Smartphone'
                                      ? 'bg-purple-50 text-purple-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {product.mobileType}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{product.vendor}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            ₹{product.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono">
                            ₹{(product.supplierCost || product.costPrice || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">
                            {product.stock}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                product.status === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : product.status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Quantity Stepper & SELL Button */}
                              <div className="flex items-center space-x-1.5">
                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    disabled={isOutOfStock || qty <= 1}
                                    onClick={() => handleRowQtyChange(product.id, -1, product.stock)}
                                    className="w-6 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold transition-colors select-none"
                                    title="Decrease quantity"
                                  >
                                    −
                                  </button>
                                  <span className="w-7 text-center font-mono text-xs font-bold text-gray-900 select-none">
                                    {isOutOfStock ? 0 : qty}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isOutOfStock || qty >= product.stock}
                                    onClick={() => handleRowQtyChange(product.id, 1, product.stock)}
                                    className="w-6 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold transition-colors select-none"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => handleOpenSellModal(product, qty)}
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                    isOutOfStock
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                      : 'bg-[#1552B3] hover:bg-[#0f4091] text-white active:scale-95'
                                  }`}
                                  title={isOutOfStock ? 'Out of Stock' : `Sell ${qty} unit(s)`}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>{isOutOfStock ? 'Out of Stock' : 'SELL'}</span>
                                </button>
                              </div>

                              <div className="h-4 w-px bg-gray-200" />

                              {/* Edit & Delete Buttons */}
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(product)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sell Confirmation Modal */}
      {sellModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Confirm Product Sale</h2>
              </div>
              <button
                onClick={() => setSellModalProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {sellError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sellError}</span>
                </div>
              )}

              {/* Product Details Box */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Product:</span>
                  <span className="font-bold text-gray-900 text-right">{sellModalProduct.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Brand / SKU:</span>
                  <span className="font-mono text-gray-700">
                    {sellModalProduct.brand || 'N/A'} • {sellModalProduct.sku}
                  </span>
                </div>
                {sellModalProduct.mobileType && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Type:</span>
                    <span className="font-medium text-gray-700">{sellModalProduct.mobileType}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Retail Unit Price:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    ₹{sellModalProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper with Direct Keyboard Input */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <p className="font-bold text-gray-900">Quantity</p>
                  <p className="text-[11px] text-gray-500">Available: {sellModalProduct.stock} units</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-[#1552B3]/30 focus-within:border-[#1552B3] transition-all">
                    <button
                      type="button"
                      disabled={!sellModalProduct || (parsedSellQuantity !== null && parsedSellQuantity <= 1) || parsedSellQuantity === null}
                      onClick={handleModalDecreaseQty}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-sm select-none transition-colors"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={sellQuantityInput}
                      onChange={handleQuantityInputChange}
                      onBlur={handleQuantityInputBlur}
                      className="w-14 h-8 text-center font-mono text-sm font-bold text-gray-900 bg-transparent border-x border-gray-200 focus:outline-none focus:bg-blue-50/30 select-text"
                      aria-label="Quantity to sell"
                    />
                    <button
                      type="button"
                      disabled={!sellModalProduct || (parsedSellQuantity !== null && parsedSellQuantity >= sellModalProduct.stock) || parsedSellQuantity === null}
                      onClick={handleModalIncreaseQty}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-sm select-none transition-colors"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {quantityValidationMessage && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1 animate-in fade-in duration-150">
                      {quantityValidationMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Vendor Selection Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-gray-700">
                    Vendor <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/admin/vendors"
                    className="text-[11px] font-semibold text-[#1552B3] hover:underline inline-flex items-center space-x-0.5"
                  >
                    <span>Manage Vendors</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <select
                  value={selectedVendorId}
                  onChange={(e) => {
                    setSelectedVendorId(e.target.value);
                    if (sellError) setSellError('');
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium ${
                    !selectedVendorId && sellError
                      ? 'border-rose-300 ring-2 ring-rose-500/20 text-gray-700'
                      : 'border-gray-200 focus:border-[#1552B3] text-gray-900'
                  }`}
                >
                  <option value="">Select Vendor</option>
                  {activeVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id.toUpperCase()})
                    </option>
                  ))}
                </select>
                {activeVendors.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    No active vendors available. Please add or activate a vendor before completing a sale.
                  </p>
                )}
              </div>

              {/* Stock Forecast */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[11px] text-gray-500 font-medium">Available Stock</p>
                  <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                    {sellModalProduct.stock}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-[11px] text-emerald-700 font-medium">Remaining Stock</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {parsedSellQuantity !== null ? Math.max(0, sellModalProduct.stock - parsedSellQuantity) : sellModalProduct.stock}
                  </p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'UPI', 'Card', 'Other'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSellPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        sellPaymentMethod === method
                          ? 'bg-[#1552B3] text-white border-[#1552B3] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Sale Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Retail counter walk-in sale"
                  value={sellNotes}
                  onChange={(e) => setSellNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              {/* Dynamic Sale Total */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">Total Sale Amount:</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  ₹{((parsedSellQuantity !== null && isQuantityValid ? parsedSellQuantity : 0) * sellModalProduct.price).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSellModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isQuantityValid || !selectedVendorId || activeVendors.length === 0}
                onClick={handleConfirmSale}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
                  !isQuantityValid || !selectedVendorId || activeVendors.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    : 'bg-[#1552B3] hover:bg-[#0f4091] text-white active:scale-95'
                }`}
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Sale Completed Successfully</h3>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{completedSale.saleId}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Product:</span>
                <span className="font-semibold text-gray-900 text-right">{completedSale.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Brand / SKU:</span>
                <span className="font-medium text-gray-800">{completedSale.brand} • {completedSale.sku}</span>
              </div>
              {completedSale.vendorName && completedSale.vendorName !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Vendor:</span>
                  <span className="font-semibold text-[#1552B3] text-right">{completedSale.vendorName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Quantity Sold:</span>
                <span className="font-bold text-gray-900">{completedSale.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Unit Price:</span>
                <span className="font-mono text-gray-800">₹{completedSale.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-sm text-gray-900">
                <span>Total Paid:</span>
                <span className="text-emerald-600 font-mono">₹{completedSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <span className="font-medium text-gray-800">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Remaining Stock:</span>
                <span className="font-mono font-semibold text-gray-800">{completedSale.remainingStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Sold By:</span>
                <span className="font-medium text-gray-800">{completedSale.soldBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Date & Time:</span>
                <span className="text-gray-700">{completedSale.date}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center space-x-2">
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCompletedSale(null);
                  navigate('/admin/sales');
                }}
                className="flex-1 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                View Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <SmartphoneAutocompleteInput
                  value={formData.name}
                  onChange={(val, sug) => handleAutocompleteSelect(val, sug)}
                  selectedBrand={formData.brand}
                  mobileClassification={formData.mobileType}
                  category={formData.category}
                  placeholder="e.g. iPhone 16 128GB or POCO X7 Pro 5G"
                  required
                />
                {duplicateProduct && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-[11px] text-amber-800 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong className="font-semibold">{formData.name}</strong> already exists in your product catalog.
                    </span>
                  </div>
                )}
                {brandMismatchWarning && !duplicateProduct && (
                  <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-[11px] text-blue-800 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{brandMismatchWarning}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const newType = cat === 'Mobiles' ? 'Smartphone' : '';
                      const newBrand = cat === 'Mobiles' ? 'Apple' : '';
                      const newAccCat = cat === 'Accessories' ? 'CASES_PROTECTION' : '';
                      const newProductType =
                        cat === 'Accessories' ? ACCESSORY_CATEGORIES[0].productTypes[0] : '';
                      setFormData({
                        ...formData,
                        category: cat,
                        mobileType: newType as any,
                        brand: newBrand,
                        accessoryCategory: newAccCat,
                        productType: newProductType,
                        name: cat === 'Accessories' && !formData.name ? newProductType : formData.name,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Dynamic Mobile Fields */}
              {formData.category === 'Mobiles' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Mobile Classification *
                    </label>
                    <select
                      value={formData.mobileType || 'Smartphone'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const newBrand =
                          newType === 'Smartphone'
                            ? 'Apple'
                            : newType === 'Secondhand'
                            ? 'Secondhand Mobiles'
                            : 'Lava';
                        setFormData({
                          ...formData,
                          mobileType: newType as any,
                          mobileCondition: newType === 'Secondhand' ? 'SECONDHAND' : 'NEW',
                          brand: newBrand,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] font-medium"
                    >
                      <option value="Smartphone">New Mobiles (Smartphone)</option>
                      <option value="Secondhand">Secondhand Mobiles</option>
                      <option value="Keypad Phone">Keypad Phone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      {formData.mobileType === 'Secondhand' ? 'Actual / Device Brand' : 'Brand *'}
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] font-semibold text-gray-900"
                    >
                      {formData.mobileType === 'Smartphone'
                        ? SMARTPHONE_BRANDS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))
                        : formData.mobileType === 'Secondhand'
                        ? [
                            'Secondhand Mobiles',
                            'Apple',
                            'Samsung',
                            'OnePlus',
                            'Vivo',
                            'iQOO',
                            'Realme',
                            'POCO',
                            'Google',
                            'Nothing',
                            'Motorola',
                            'Infinix',
                            'Tecno',
                            'Honor',
                          ].map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))
                        : KEYPAD_BRANDS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Accessories Fields */}
              {formData.category === 'Accessories' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Accessory Subcategory *
                    </label>
                    <select
                      value={formData.accessoryCategory}
                      onChange={(e) => {
                        const newCatKey = e.target.value;
                        const catObj = ACCESSORY_CATEGORIES.find((c) => c.key === newCatKey || c.id === newCatKey);
                        const firstType = catObj?.productTypes[0] || '';
                        setFormData({
                          ...formData,
                          accessoryCategory: newCatKey,
                          productType: firstType,
                          name: !formData.name || ACCESSORY_CATEGORIES.some((c) => c.productTypes.includes(formData.name)) ? firstType : formData.name,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] font-medium"
                    >
                      {ACCESSORY_CATEGORIES.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Product Type *
                    </label>
                    <select
                      value={formData.productType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          productType: newType,
                          name: !formData.name || ACCESSORY_CATEGORIES.some((c) => c.productTypes.includes(formData.name)) ? newType : formData.name,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] font-semibold text-gray-900"
                    >
                      {(
                        ACCESSORY_CATEGORIES.find(
                          (c) => c.key === formData.accessoryCategory || c.id === formData.accessoryCategory
                        ) || ACCESSORY_CATEGORIES[0]
                      ).productTypes.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="79900"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Supplier Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="68000"
                    value={formData.supplierCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplierCost: e.target.value,
                        costPrice: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: e.target.value,
                        minStockAlert: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier / Vendor
                </label>
                <select
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                >
                  <option value="ABC Electronics">ABC Electronics</option>
                  <option value="TechSupply Hub">TechSupply Hub</option>
                  <option value="OfficeWorld Ltd">OfficeWorld Ltd</option>
                  <option value="Zenith Global Supply">Zenith Global Supply</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Key features, specifications, or packaging notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Product</h3>
            <p className="text-xs text-gray-500 mt-2">
              Are you sure you want to remove{' '}
              <strong className="text-gray-900">{deleteTarget.name}</strong> ({deleteTarget.sku})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductManagement;
