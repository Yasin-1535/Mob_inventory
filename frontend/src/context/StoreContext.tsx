import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, mockProducts } from '../data/mockProducts';
import { Vendor, mockVendors } from '../data/mockVendors';
import { Customer, mockCustomers } from '../data/mockCustomers';
import { Order, mockOrders } from '../data/mockOrders';
import { InventoryItem, mockInventory } from '../data/mockInventory';
import { registerVendorAccount, updateStoredUserStatus } from '../services/mockAuth';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  vendorName: string;
  productName: string;
  sku: string;
  quantityRequested: number;
  unitCost: number;
  totalCost: number;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  expectedDelivery: string;
  createdAt: string;
  settlementStatus: 'PENDING' | 'SETTLED';
}

export const initialPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'req-001',
    requestNumber: 'PO-10492',
    vendorName: 'ABC Electronics',
    productName: 'HP Wireless Mouse',
    sku: 'HP-MOU-01',
    quantityRequested: 50,
    unitCost: 450,
    totalCost: 22500,
    status: 'PENDING',
    expectedDelivery: '2026-08-22',
    createdAt: '2026-08-17 09:15',
    settlementStatus: 'PENDING',
  },
  {
    id: 'req-002',
    requestNumber: 'PO-10488',
    vendorName: 'TechSupply Hub',
    productName: 'Logitech Webcam C920',
    sku: 'LOG-CAM-92',
    quantityRequested: 20,
    unitCost: 4800,
    totalCost: 96000,
    status: 'ACCEPTED',
    expectedDelivery: '2026-08-20',
    createdAt: '2026-08-16 14:00',
    settlementStatus: 'PENDING',
  },
  {
    id: 'req-003',
    requestNumber: 'PO-10450',
    vendorName: 'ABC Electronics',
    productName: 'USB-C Cable',
    sku: 'USB-C-20',
    quantityRequested: 100,
    unitCost: 180,
    totalCost: 18000,
    status: 'DELIVERED',
    expectedDelivery: '2026-08-15',
    createdAt: '2026-08-14 11:30',
    settlementStatus: 'SETTLED',
  },
];

export interface InventoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  vendorId?: string;
  vendorName?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  date: string;
}

export const initialInventoryLogs: InventoryLogEntry[] = [
  {
    id: 'log-001',
    productId: 'prod-001',
    productName: 'Samsung Galaxy A15',
    sku: 'SAM-A15',
    vendorId: 'ven-001',
    vendorName: 'ABC Electronics',
    type: 'IN',
    quantityChanged: 10,
    previousStock: 14,
    newStock: 24,
    reason: 'Received supplier shipment #PO-10420',
    performedBy: 'System Administrator',
    date: '2026-08-17 14:30',
  },
  {
    id: 'log-002',
    productId: 'prod-003',
    productName: 'Dell Keyboard',
    sku: 'DEL-KEY-02',
    vendorId: 'ven-003',
    vendorName: 'OfficeWorld Ltd',
    type: 'OUT',
    quantityChanged: 5,
    previousStock: 5,
    newStock: 0,
    reason: 'Order fulfillment #ORD-1048 & #ORD-1042',
    performedBy: 'System Administrator',
    date: '2026-08-16 18:00',
  },
];

export interface SaleRecord {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  category: string;
  mobileType?: string;
  vendorId?: string;
  vendorName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  saleStatus: 'COMPLETED' | 'CANCELLED';
  soldBy: string;
  remainingStock: number;
  notes?: string;
  date: string;
}

export const initialSales: SaleRecord[] = [
  {
    id: 'sale-001',
    saleId: 'SAL-10492',
    productId: 'prod-sp-01',
    productName: 'iPhone 16 128GB',
    brand: 'Apple',
    sku: 'APL-IP16-001',
    category: 'Mobiles',
    mobileType: 'Smartphone',
    vendorId: 'ven-001',
    vendorName: 'ABC Electronics',
    quantity: 1,
    unitPrice: 79900,
    totalAmount: 79900,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    soldBy: 'Administrator',
    remainingStock: 24,
    notes: 'Walk-in customer direct purchase',
    date: '2026-08-18 11:20',
  },
  {
    id: 'sale-002',
    saleId: 'SAL-10488',
    productId: 'prod-kp-02',
    productName: 'JioBharat V2 4G Keypad',
    brand: 'Reliance Jio',
    sku: 'JIO-JB-V2-001',
    category: 'Mobiles',
    mobileType: 'Keypad Phone',
    vendorId: 'ven-001',
    vendorName: 'ABC Electronics',
    quantity: 2,
    unitPrice: 999,
    totalAmount: 1998,
    paymentMethod: 'Cash',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    soldBy: 'Administrator',
    remainingStock: 80,
    notes: 'In-store retail counter sale',
    date: '2026-08-18 10:15',
  },
];

interface StoreContextType {
  products: Product[];
  inventory: InventoryItem[];
  inventoryLogs: InventoryLogEntry[];
  orders: Order[];
  sales: SaleRecord[];
  vendors: Vendor[];
  customers: Customer[];
  purchaseRequests: PurchaseRequest[];
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;

  // Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN',
    quantity: number,
    reason: string
  ) => void;
  sellProduct: (
    productId: string,
    quantity: number,
    paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Other',
    vendorId?: string,
    vendorName?: string,
    notes?: string
  ) => { success: boolean; message: string; sale?: SaleRecord; remainingStock?: number };
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (customerName: string, shippingAddress: string, paymentMethod: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  createPurchaseRequest: (
    req: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'settlementStatus'>
  ) => void;
  updatePurchaseRequestStatus: (requestId: string, status: PurchaseRequest['status']) => void;
  addVendor: (vendorData: {
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
    vendorType?: string;
    gstin?: string;
    loginEmail: string;
    password: string;
    status: 'Active' | 'Suspended';
  }) => Vendor;
  updateVendorStatus: (vendorId: string, status: Vendor['status']) => void;
  updateCustomerStatus: (customerId: string, status: Customer['status']) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('si_products_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: Product) => p.accessoryCategory)) {
          const updated = parsed.map((p: Product) => {
            if (p.brand?.toLowerCase().trim() === 'second mobiles' || p.sku?.startsWith('SEC-')) {
              return {
                ...p,
                mobileType: 'Secondhand',
                mobileCondition: 'SECONDHAND' as const,
                brand: p.brand === 'Second Mobiles' ? 'Secondhand Mobiles' : p.brand,
              };
            }
            return p;
          });
          const hasSecondhand = updated.some((p: Product) => p.mobileType === 'Secondhand' || p.mobileCondition === 'SECONDHAND');
          if (!hasSecondhand) {
            const secondhandSeed = mockProducts.filter((p: Product) => p.mobileType === 'Secondhand' || p.mobileCondition === 'SECONDHAND');
            return [...updated, ...secondhandSeed];
          }
          return updated;
        }
      } catch (e) {
        return mockProducts;
      }
    }
    return mockProducts;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('si_inventory');
    return saved ? JSON.parse(saved) : mockInventory;
  });

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogEntry[]>(() => {
    const saved = localStorage.getItem('si_inventory_logs');
    return saved ? JSON.parse(saved) : initialInventoryLogs;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('si_orders');
    return saved ? JSON.parse(saved) : mockOrders;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('si_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('si_vendors');
    return saved ? JSON.parse(saved) : mockVendors;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('si_customers');
    return saved ? JSON.parse(saved) : mockCustomers;
  });

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('si_purchase_requests');
    return saved ? JSON.parse(saved) : initialPurchaseRequests;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('si_cart');
    if (saved) return JSON.parse(saved);
    return [
      { product: mockProducts[0], quantity: 1 },
      { product: mockProducts[1], quantity: 1 },
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('si_products_v3', JSON.stringify(products));
    localStorage.setItem('si_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('si_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('si_inventory_logs', JSON.stringify(inventoryLogs));
  }, [inventoryLogs]);

  useEffect(() => {
    localStorage.setItem('si_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('si_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('si_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('si_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('si_purchase_requests', JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);

  useEffect(() => {
    localStorage.setItem('si_cart', JSON.stringify(cart));
  }, [cart]);

  // Product Actions
  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now().toString().slice(-4)}`;
    const status: Product['status'] =
      newProdData.stock <= 0
        ? 'Out of Stock'
        : newProdData.stock <= 10
        ? 'Low Stock'
        : 'In Stock';

    const newProduct: Product = {
      ...newProdData,
      id: newId,
      status,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Also add to inventory
    const newInvItem: InventoryItem = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      productName: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      stock: newProduct.stock,
      threshold: 10,
      status,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      warehouseLocation: 'Bay Main-01',
    };
    setInventory((prev) => [newInvItem, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedStock = updates.stock !== undefined ? updates.stock : p.stock;
          const status: Product['status'] =
            updatedStock <= 0
              ? 'Out of Stock'
              : updatedStock <= 10
              ? 'Low Stock'
              : 'In Stock';
          return { ...p, ...updates, status };
        }
        return p;
      })
    );

    setInventory((prev) =>
      prev.map((inv) => {
        const prod = products.find((p) => p.id === id);
        if (prod && inv.sku === prod.sku) {
          const updatedStock = updates.stock !== undefined ? updates.stock : inv.stock;
          const status: InventoryItem['status'] =
            updatedStock <= 0
              ? 'Out of Stock'
              : updatedStock <= inv.threshold
              ? 'Low Stock'
              : 'In Stock';
          return {
            ...inv,
            productName: updates.name || inv.productName,
            category: updates.category || inv.category,
            stock: updatedStock,
            status,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return inv;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      setInventory((prev) => prev.filter((inv) => inv.sku !== target.sku));
    }
  };

  // Inventory Adjustments
  const adjustStock = (
    productId: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN',
    quantity: number,
    reason: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.stock;
    let newStock = prevStock;

    if (type === 'IN' || type === 'RETURN') {
      newStock = prevStock + Math.abs(quantity);
    } else if (type === 'OUT' || type === 'DAMAGE') {
      newStock = Math.max(0, prevStock - Math.abs(quantity));
    } else if (type === 'ADJUSTMENT') {
      newStock = Math.max(0, quantity);
    }

    updateProduct(productId, { stock: newStock });

    const newLog: InventoryLogEntry = {
      id: `log-${Date.now().toString().slice(-4)}`,
      productId,
      productName: prod.name,
      sku: prod.sku,
      type,
      quantityChanged: quantity,
      previousStock: prevStock,
      newStock,
      reason,
      performedBy: 'System Administrator',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setInventoryLogs((prev) => [newLog, ...prev]);
  };

  // Sell Product Action (Deduct stock, create sale record and inventory log with Vendor)
  const sellProduct = (
    productId: string,
    quantity: number,
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other' = 'Cash',
    vendorId?: string,
    vendorName?: string,
    notes = ''
  ): { success: boolean; message: string; sale?: SaleRecord; remainingStock?: number } => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return { success: false, message: 'Product not found' };
    }

    if (!vendorId && !vendorName) {
      return { success: false, message: 'Please select a vendor.' };
    }

    // Validate vendor
    let resolvedVendorId = vendorId || '';
    let resolvedVendorName = vendorName || '';
    if (vendorId) {
      const matchedVendor = vendors.find((v) => v.id === vendorId || v.name === vendorId);
      if (matchedVendor) {
        if (matchedVendor.status !== 'Active') {
          return { success: false, message: 'Selected vendor is currently inactive.' };
        }
        resolvedVendorId = matchedVendor.id;
        resolvedVendorName = matchedVendor.name;
      } else {
        resolvedVendorName = vendorName || vendorId;
      }
    }

    const qty = Math.floor(Number(quantity));
    if (isNaN(qty) || qty <= 0) {
      return { success: false, message: 'Quantity must be at least 1' };
    }

    if (prod.stock < qty) {
      return {
        success: false,
        message: `Insufficient stock available. Current stock: ${prod.stock}, requested: ${qty}`,
      };
    }

    const prevStock = prod.stock;
    const newStock = Math.max(0, prevStock - qty);
    const totalAmount = prod.price * qty;

    // 1. Update Product stock & status
    updateProduct(productId, { stock: newStock });

    // 2. Add Inventory Log (type: 'OUT', reason: 'SALE', with Vendor)
    const newLog: InventoryLogEntry = {
      id: `log-${Date.now().toString().slice(-4)}`,
      productId,
      productName: prod.name,
      sku: prod.sku,
      vendorId: resolvedVendorId,
      vendorName: resolvedVendorName,
      type: 'OUT',
      quantityChanged: qty,
      previousStock: prevStock,
      newStock: newStock,
      reason: 'SALE',
      performedBy: 'Administrator',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setInventoryLogs((prev) => [newLog, ...prev]);

    // 3. Create Sale Record with Vendor info
    const saleId = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const newSale: SaleRecord = {
      id: `sale-${Date.now().toString().slice(-4)}`,
      saleId,
      productId: prod.id,
      productName: prod.name,
      brand: prod.brand || 'N/A',
      sku: prod.sku,
      category: prod.category,
      mobileType: prod.mobileType,
      vendorId: resolvedVendorId,
      vendorName: resolvedVendorName,
      quantity: qty,
      unitPrice: prod.price,
      totalAmount,
      paymentMethod,
      paymentStatus: 'PAID',
      saleStatus: 'COMPLETED',
      soldBy: 'Administrator',
      remainingStock: newStock,
      notes: notes || `Direct sale of ${qty} unit(s) via ${resolvedVendorName}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setSales((prev) => [newSale, ...prev]);

    return {
      success: true,
      message: 'Sale completed successfully',
      sale: newSale,
      remainingStock: newStock,
    };
  };

  // Cart Actions
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = (
    customerName: string,
    shippingAddress: string,
    paymentMethod: string
  ): Order => {
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      orderNumber,
      customerName,
      items: cart.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount,
      status: 'Confirmed',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      paymentMethod,
    };

    // Deduct stock for all items
    cart.forEach((item) => {
      adjustStock(
        item.product.id,
        'OUT',
        item.quantity,
        `Customer checkout order ${orderNumber}`
      );
    });

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const createPurchaseRequest = (
    req: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'settlementStatus'>
  ) => {
    const newReq: PurchaseRequest = {
      ...req,
      id: `req-${Date.now().toString().slice(-4)}`,
      requestNumber: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      settlementStatus: 'PENDING',
    };
    setPurchaseRequests((prev) => [newReq, ...prev]);
  };

  const updatePurchaseRequestStatus = (
    requestId: string,
    status: PurchaseRequest['status']
  ) => {
    setPurchaseRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const settlementStatus =
            status === 'DELIVERED' ? 'SETTLED' : r.settlementStatus;
          return { ...r, status, settlementStatus };
        }
        return r;
      })
    );
  };

  const addVendor = (vendorData: {
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
    vendorType?: string;
    gstin?: string;
    loginEmail: string;
    password: string;
    status: 'Active' | 'Suspended';
  }): Vendor => {
    const newId = `ven-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVendor: Vendor = {
      id: newId,
      name: vendorData.businessName,
      contactPerson: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      address: vendorData.address,
      vendorType: vendorData.vendorType,
      gstin: vendorData.gstin,
      loginEmail: vendorData.loginEmail,
      productsSupplied: 0,
      totalStockSupplied: 0,
      pendingRequests: 0,
      completedOrders: 0,
      pendingPayments: 0,
      status: vendorData.status,
    };

    // 1. Save in vendors list
    setVendors((prev) => [newVendor, ...prev]);

    // 2. Provision User authentication account in mockAuth storage
    registerVendorAccount({
      businessName: vendorData.businessName,
      contactPerson: vendorData.contactPerson,
      loginEmail: vendorData.loginEmail,
      password: vendorData.password,
      vendorId: newId,
      phone: vendorData.phone,
      address: vendorData.address,
      status: vendorData.status,
    });

    return newVendor;
  };

  const updateVendorStatus = (vendorId: string, status: Vendor['status']) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status } : v))
    );
    updateStoredUserStatus(vendorId, status === 'Active' ? 'Active' : 'Suspended');
  };

  const updateCustomerStatus = (customerId: string, status: Customer['status']) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status } : c))
    );
    updateStoredUserStatus(customerId, status === 'Active' ? 'Active' : 'Blocked');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        inventory,
        inventoryLogs,
        orders,
        sales,
        vendors,
        customers,
        purchaseRequests,
        cart,
        cartCount,
        cartTotal,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        sellProduct,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkout,
        updateOrderStatus,
        createPurchaseRequest,
        updatePurchaseRequestStatus,
        addVendor,
        updateVendorStatus,
        updateCustomerStatus,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
