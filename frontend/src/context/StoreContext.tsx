import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, mockProducts } from '../data/mockProducts';
import { Vendor, mockVendors } from '../data/mockVendors';
import { Customer, mockCustomers } from '../data/mockCustomers';
import { Order, mockOrders } from '../data/mockOrders';
import { InventoryItem, mockInventory } from '../data/mockInventory';
import { registerVendorAccount, updateStoredUserStatus } from '../services/mockAuth';

export { type Product, mockProducts } from '../data/mockProducts';

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
  requestDate?: string;
  notes?: string;
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
    requestDate: '2026-08-17 09:15',
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
    requestDate: '2026-08-16 14:00',
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
    requestDate: '2026-08-14 11:30',
    settlementStatus: 'SETTLED',
  },
];

export type InventoryMovementType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'RETURN'
  | 'VENDOR_RETURN_RECEIVED'
  | 'RETURN_INSPECTED_GOOD'
  | 'RETURN_INSPECTED_DAMAGED'
  | 'DISCARD';

export interface InventoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  vendorId?: string;
  vendorName?: string;
  type: InventoryMovementType;
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  date: string;
  reference?: string;
  referenceId?: string;
  returnId?: string;
  notes?: string;
  movementType?: string;
  stockBefore?: number;
  stockAfter?: number;
  timestamp?: string;
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

export interface ISaleLineItem {
  productId?: string;
  productName: string;
  brand?: string;
  sku: string;
  category?: string;
  mobileType?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  lineTotal?: number;
  returnedQuantity?: number;
  imeis?: string[];
  returnedImeis?: string[];
}

export interface SaleRecord {
  id: string;
  saleId: string;
  items?: ISaleLineItem[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  category: string;
  mobileType?: string;
  buyerType?: 'CUSTOMER' | 'VENDOR' | string;
  vendorId?: string;
  vendorName?: string;
  customerName?: string;
  customerPhone?: string;
  quantity: number;
  returnedQuantity?: number;
  imeis?: string[];
  returnedImeis?: string[];
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED' | 'PARTIAL';
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
    customerName: 'ABC Electronics',
    quantity: 10,
    returnedQuantity: 2,
    imeis: [
      '356892110482910',
      '356892110482911',
      '356892110482912',
      '356892110482913',
      '356892110482914',
      '356892110482915',
      '356892110482916',
      '356892110482917',
      '356892110482918',
      '356892110482919',
    ],
    returnedImeis: ['356892110482910', '356892110482911'],
    unitPrice: 79900,
    totalAmount: 799000,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    soldBy: 'Administrator',
    remainingStock: 14,
    notes: 'Outbound bulk wholesale supply to ABC Electronics',
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
    customerName: 'ABC Electronics',
    quantity: 5,
    returnedQuantity: 0,
    imeis: ['864201928471011', '864201928471012', '864201928471013', '864201928471014', '864201928471015'],
    returnedImeis: [],
    unitPrice: 999,
    totalAmount: 4995,
    paymentMethod: 'Cash',
    paymentStatus: 'PAID',
    saleStatus: 'COMPLETED',
    soldBy: 'Administrator',
    remainingStock: 75,
    notes: 'Counter delivery order to ABC Electronics',
    date: '2026-08-18 10:15',
  },
];

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  category: 'Rent' | 'Electricity & Utilities' | 'Salaries' | 'Marketing' | 'Maintenance' | 'Logistics & Transport' | 'Packaging' | 'Other';
  title: string;
  amount: number;
  date: string;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  recipient?: string;
  notes?: string;
}

export const initialExpenses: ExpenseItem[] = [
  {
    id: 'exp-001',
    expenseNumber: 'EXP-10021',
    category: 'Rent',
    title: 'Showroom Commercial Rent - August',
    amount: 35000,
    date: '2026-08-01',
    paymentMethod: 'BANK_TRANSFER',
    recipient: 'Metro Plaza Real Estate',
    notes: 'Monthly retail premises rent',
  },
  {
    id: 'exp-002',
    expenseNumber: 'EXP-10022',
    category: 'Electricity & Utilities',
    title: 'Electricity & High-Speed Internet Bill',
    amount: 6200,
    date: '2026-08-10',
    paymentMethod: 'UPI',
    recipient: 'State Electricity Board & Airtel Fibernet',
    notes: 'Showroom lighting, cooling, and network',
  },
  {
    id: 'exp-003',
    expenseNumber: 'EXP-10023',
    category: 'Packaging',
    title: 'Tamper-Evident Mobile Courier Boxes & Bubble Wrap',
    amount: 2800,
    date: '2026-08-14',
    paymentMethod: 'CASH',
    recipient: 'Swift Pack Corp',
    notes: 'Safe transit materials',
  },
  {
    id: 'exp-004',
    expenseNumber: 'EXP-10024',
    category: 'Salaries',
    title: 'Sales & Inventory Staff Stipends',
    amount: 45000,
    date: '2026-08-05',
    paymentMethod: 'BANK_TRANSFER',
    recipient: 'Store Assistants',
    notes: 'Monthly team payroll',
  },
];

export type ReturnReasonCategory =
  | 'BROKEN_ITEM'
  | 'DAMAGED_ITEM'
  | 'DEFECTIVE_ITEM'
  | 'WRONG_PRODUCT'
  | 'MISMATCHED_PRODUCT'
  | 'WRONG_QUANTITY'
  | 'MISSING_PARTS'
  | 'QUALITY_ISSUE'
  | 'PACKAGING_DAMAGE'
  | 'OTHER';

export type ReturnItemCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | 'MISMATCHED' | 'UNSELLABLE';

export type ReturnLifecycleStatus =
  | 'RETURN_REQUESTED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESTOCKED'
  | 'DAMAGED'
  | 'DISCARDED'
  | 'SETTLED'
  | 'PENDING'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReturnSettlementType = 'REFUND' | 'CREDIT_NOTE' | 'ACCOUNT_ADJUSTMENT' | 'EXCHANGE' | 'CREDIT' | 'REPLACEMENT';

export interface ReturnSubItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  reasonCategory?: ReturnReasonCategory;
  itemCondition: ReturnItemCondition;
  imeis?: string[];
  inspectionNotes?: string;
  status?: string;
}

export interface ReturnItem {
  id: string;
  returnNumber: string;
  returnType: 'VENDOR_SALES_RETURN' | 'SALES_RETURN' | 'PURCHASE_RETURN';
  partyType?: 'VENDOR' | 'CUSTOMER';
  partyId?: string;
  sourceSaleId?: string;
  sourceReferenceNumber: string;
  partyName: string;
  items?: ReturnSubItem[];
  // Summary & legacy fields
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  reasonCategory?: ReturnReasonCategory;
  itemCondition: ReturnItemCondition;
  settlementType: ReturnSettlementType;
  settlementStatus?: 'PENDING' | 'SETTLED';
  settlementAmount?: number;
  settlementNotes?: string;
  settlementDate?: string;
  status: ReturnLifecycleStatus;
  inspectionNotes?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  receivedAt?: string;
  settledAt?: string;
  notes?: string;
  createdAt: string;
}

export const initialReturns: ReturnItem[] = [
  {
    id: 'ret-ven-001',
    returnNumber: 'RET-20051',
    returnType: 'VENDOR_SALES_RETURN',
    partyType: 'VENDOR',
    sourceSaleId: 'SAL-10492',
    sourceReferenceNumber: 'SAL-10492',
    partyName: 'ABC Electronics',
    items: [
      {
        id: 'ritem-001',
        productId: 'prod-sp-01',
        productName: 'iPhone 16 128GB',
        sku: 'APL-IP16-001',
        quantity: 2,
        unitPrice: 79900,
        totalAmount: 159800,
        reason: 'Vendor discovered packaging damage on 2 sealed boxes',
        reasonCategory: 'PACKAGING_DAMAGE',
        itemCondition: 'GOOD',
        imeis: ['356892110482910', '356892110482911'],
        inspectionNotes: 'Inner seal intact, verified pristine hardware condition',
        status: 'RECEIVED',
      },
    ],
    productId: 'prod-sp-01',
    productName: 'iPhone 16 128GB',
    sku: 'APL-IP16-001',
    quantity: 2,
    unitPrice: 79900,
    totalAmount: 159800,
    reason: 'Vendor discovered packaging damage on 2 sealed boxes',
    reasonCategory: 'PACKAGING_DAMAGE',
    itemCondition: 'GOOD',
    settlementType: 'CREDIT_NOTE',
    settlementStatus: 'PENDING',
    settlementAmount: 159800,
    status: 'RECEIVED',
    notes: 'Returned by ABC Electronics from shipment #SAL-10492. Placed in inspection quarantine.',
    createdAt: '2026-09-18 14:10',
    receivedAt: '2026-09-18 15:30',
  },
  {
    id: 'ret-001',
    returnNumber: 'RET-10041',
    returnType: 'SALES_RETURN',
    partyType: 'CUSTOMER',
    sourceReferenceNumber: 'SAL-10492',
    partyName: 'Rahul Sharma',
    items: [
      {
        id: 'ritem-legacy-01',
        productId: 'prod-acc-01',
        productName: 'Anker 65W GaN Fast Charger',
        sku: 'ANK-GAN-65',
        quantity: 1,
        unitPrice: 2999,
        totalAmount: 2999,
        reason: 'Customer mistakenly ordered wrong color',
        reasonCategory: 'MISMATCHED_PRODUCT',
        itemCondition: 'GOOD',
        status: 'COMPLETED',
      },
    ],
    productId: 'prod-acc-01',
    productName: 'Anker 65W GaN Fast Charger',
    sku: 'ANK-GAN-65',
    quantity: 1,
    unitPrice: 2999,
    totalAmount: 2999,
    reason: 'Customer mistakenly ordered wrong color',
    reasonCategory: 'MISMATCHED_PRODUCT',
    itemCondition: 'GOOD',
    settlementType: 'REFUND',
    settlementStatus: 'SETTLED',
    status: 'COMPLETED',
    notes: 'Seal intact, returned to active inventory',
    createdAt: '2026-08-18 12:30',
  },
  {
    id: 'ret-002',
    returnNumber: 'RET-10042',
    returnType: 'PURCHASE_RETURN',
    partyType: 'VENDOR',
    sourceReferenceNumber: 'PO-10488',
    partyName: 'TechSupply Hub',
    items: [
      {
        id: 'ritem-legacy-02',
        productId: 'prod-acc-03',
        productName: 'boAt Rockerz 450 Bluetooth Headphones',
        sku: 'BOT-ROC-450',
        quantity: 2,
        unitPrice: 1100,
        totalAmount: 2200,
        reason: 'Defective audio channel out of box',
        reasonCategory: 'DEFECTIVE_ITEM',
        itemCondition: 'DAMAGED',
        status: 'VERIFIED',
      },
    ],
    productId: 'prod-acc-03',
    productName: 'boAt Rockerz 450 Bluetooth Headphones',
    sku: 'BOT-ROC-450',
    quantity: 2,
    unitPrice: 1100,
    totalAmount: 2200,
    reason: 'Defective audio channel out of box',
    reasonCategory: 'DEFECTIVE_ITEM',
    itemCondition: 'DAMAGED',
    settlementType: 'CREDIT',
    settlementStatus: 'SETTLED',
    status: 'VERIFIED',
    notes: 'Dispatched back to manufacturer vendor for credit note',
    createdAt: '2026-08-17 15:45',
  },
];

export interface PaymentItem {
  id: string;
  paymentNumber: string;
  paymentType: 'RECEIPT' | 'DISBURSEMENT';
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNumber: string;
  paymentDate: string;
  notes?: string;
}

export const initialPayments: PaymentItem[] = [
  {
    id: 'pay-001',
    paymentNumber: 'PAY-10081',
    paymentType: 'RECEIPT',
    partyName: 'Rahul Sharma',
    partyType: 'CUSTOMER',
    amount: 79900,
    paymentMethod: 'UPI',
    referenceNumber: 'SAL-10492',
    paymentDate: '2026-08-18 11:20',
    notes: 'Full payment received for iPhone 16 order',
  },
  {
    id: 'pay-002',
    paymentNumber: 'PAY-10082',
    paymentType: 'DISBURSEMENT',
    partyName: 'ABC Electronics',
    partyType: 'SUPPLIER',
    amount: 22500,
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'PO-10492',
    paymentDate: '2026-08-17 10:00',
    notes: 'Advance settlement for procurement batch',
  },
  {
    id: 'pay-003',
    paymentNumber: 'PAY-10083',
    paymentType: 'RECEIPT',
    partyName: 'Priya Patel',
    partyType: 'CUSTOMER',
    amount: 1998,
    paymentMethod: 'CASH',
    referenceNumber: 'SAL-10488',
    paymentDate: '2026-08-18 10:15',
    notes: 'Over-the-counter keypad phone purchase',
  },
];

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  date: string;
}

export const initialInvoices: InvoiceItem[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    customerAddress: '42 MG Road, Bengaluru, Karnataka',
    items: [
      {
        productId: 'prod-sp-01',
        productName: 'iPhone 16 128GB',
        sku: 'APL-IP16-001',
        quantity: 1,
        unitPrice: 79900,
        total: 79900,
      },
    ],
    subtotal: 79900,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 79900,
    paidAmount: 79900,
    balanceAmount: 0,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    date: '2026-08-18 11:20',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    customerName: 'Priya Patel',
    customerPhone: '+91 98234 56789',
    customerAddress: '15 Ring Road, Ahmedabad, Gujarat',
    items: [
      {
        productId: 'prod-kp-02',
        productName: 'JioBharat V2 4G Keypad',
        sku: 'JIO-JB-V2-001',
        quantity: 2,
        unitPrice: 999,
        total: 1998,
      },
    ],
    subtotal: 1998,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 1998,
    paidAmount: 1998,
    balanceAmount: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'PAID',
    date: '2026-08-18 10:15',
  },
];

export interface SaleReturnableItemBreakdown {
  productId?: string;
  productName: string;
  sku: string;
  unitPrice: number;
  soldQuantity: number;
  alreadyReturnedQuantity: number;
  pendingQuantity: number;
  activeReturnedQuantity: number;
  returnableQuantity: number;
  soldImeis: string[];
  returnedImeis: string[];
  availableImeis: string[];
}

export interface SaleReturnableInfo {
  sale?: SaleRecord;
  items: SaleReturnableItemBreakdown[];
  soldQuantity: number;
  previouslyReturned: number;
  pendingQuantity: number;
  maxReturnable: number;
  returnableQuantity: number;
  totalReturnableQuantity: number;
  soldImeis: string[];
  returnedImeis: string[];
  availableImeis: string[];
}

interface StoreContextType {
  products: Product[];
  inventory: InventoryItem[];
  inventoryLogs: InventoryLogEntry[];
  sales: SaleRecord[];
  orders: Order[];
  vendors: Vendor[];
  customers: Customer[];
  purchaseRequests: PurchaseRequest[];
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  invoices: InvoiceItem[];
  expenses: ExpenseItem[];
  returns: ReturnItem[];
  payments: PaymentItem[];

  // Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (id: string, newStock: number) => void;
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
    notes?: string,
    customerName?: string
  ) => { success: boolean; message: string; sale?: SaleRecord; remainingStock?: number };
  createSaleTransaction: (data: {
    buyerType?: 'CUSTOMER' | 'VENDOR' | string;
    vendorId?: string;
    vendorName?: string;
    customerName: string;
    customerPhone?: string;
    items: { product: Product; quantity: number; unitPrice: number; imeis?: string[] }[];
    discountAmount?: number;
    taxAmount?: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
    paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
    paidAmount?: number;
    notes?: string;
  }) => { success: boolean; invoice: InvoiceItem };
  addPurchaseOrder: (data: {
    vendorName: string;
    productName: string;
    sku: string;
    quantityRequested: number;
    unitCost: number;
    status: PurchaseRequest['status'];
    expectedDelivery?: string;
    notes?: string;
  }) => PurchaseRequest;
  receivePurchaseShipment: (requestId: string) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'expenseNumber'>) => ExpenseItem;
  deleteExpense: (id: string) => void;
  addReturnRecord: (ret: Omit<ReturnItem, 'id' | 'returnNumber' | 'createdAt'>) => ReturnItem;
  verifyReturnRecord: (returnId: string, status: ReturnItem['status'], itemCondition?: ReturnItem['itemCondition']) => void;
  createVendorReturn: (data: {
    vendorName: string;
    vendorId?: string;
    sourceSaleId?: string;
    sourceReferenceNumber?: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      reason?: string;
      reasonCategory?: ReturnReasonCategory;
      otherReason?: string;
      itemCondition?: ReturnItemCondition;
      imeis?: string[];
      inspectionNotes?: string;
    }[];
    notes?: string;
    status?: ReturnLifecycleStatus;
  }) => { success: boolean; message: string; returnDoc?: ReturnItem };
  receiveReturnRecord: (returnId: string) => { success: boolean; message: string };
  inspectReturnRecord: (
    returnId: string,
    inspections: { sku: string; condition: ReturnItemCondition; notes?: string }[] | ReturnItemCondition,
    generalNotes?: string
  ) => { success: boolean; message: string };
  restockReturnRecord: (returnId: string) => { success: boolean; message: string };
  markDamagedReturnRecord: (returnId: string, notes?: string) => { success: boolean; message: string };
  settleReturnRecord: (
    returnId: string,
    settlement:
      | {
          type: ReturnSettlementType;
          amount?: number;
          notes?: string;
        }
      | ReturnSettlementType,
    amount?: number,
    status?: 'PENDING' | 'SETTLED',
    notes?: string
  ) => { success: boolean; message: string };
  getSaleReturnableInfo: (saleId: string) => SaleReturnableInfo;
  addPaymentRecord: (pay: Omit<PaymentItem, 'id' | 'paymentNumber'>) => PaymentItem;
  addCustomer: (cust: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'joinedDate'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
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

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

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

  const updateProductStock = (id: string, newStock: number) => {
    updateProduct(id, { stock: newStock });
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
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newReq: PurchaseRequest = {
      ...req,
      id: `req-${Date.now().toString().slice(-4)}`,
      requestNumber: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: nowStr,
      requestDate: req.requestDate || nowStr,
      notes: req.notes,
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

  const updateVendorStatus = (id: string, status: Vendor['status']) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
  };

  const updateCustomerStatus = (id: string, status: 'Active' | 'Inactive') => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('si_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [returns, setReturns] = useState<ReturnItem[]>(() => {
    const saved = localStorage.getItem('si_returns');
    return saved ? JSON.parse(saved) : initialReturns;
  });

  const [payments, setPayments] = useState<PaymentItem[]>(() => {
    const saved = localStorage.getItem('si_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem('si_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  useEffect(() => {
    localStorage.setItem('si_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('si_returns', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('si_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('si_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Unified Sale Transaction (Creates Sale, Deducts Inventory, Generates Invoice, Records Payment)
  const createSaleTransaction = (data: {
    customerName: string;
    customerPhone?: string;
    items: { product: Product; quantity: number; unitPrice: number; imeis?: string[] }[];
    discountAmount?: number;
    taxAmount?: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
    paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
    paidAmount?: number;
    notes?: string;
    vendorId?: string;
    vendorName?: string;
    buyerType?: 'CUSTOMER' | 'VENDOR' | string;
  }): { success: boolean; invoice: InvoiceItem } => {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').slice(0, 16);
    const invoiceNum = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleTransactionId = `SAL-${Math.floor(10000 + Math.random() * 90000)}`;

    let subtotal = 0;
    const saleLineItems: ISaleLineItem[] = [];

    const invoiceItems = data.items.map(({ product, quantity, unitPrice, imeis }) => {
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      // Generate IMEIs for mobile phones if not provided
      let resolvedImeis = imeis || [];
      if (resolvedImeis.length === 0 && (product.category === 'Mobiles' || product.mobileType)) {
        resolvedImeis = Array.from(
          { length: quantity },
          () => `356${Math.floor(100000000000 + Math.random() * 900000000000)}`
        );
      }

      // Deduct inventory stock for EACH item
      adjustStock(product.id, 'OUT', quantity, `Sale to ${data.vendorName || data.customerName} (${invoiceNum})`);

      saleLineItems.push({
        productId: product.id,
        productName: product.name,
        brand: product.brand || 'N/A',
        sku: product.sku,
        category: product.category,
        mobileType: product.mobileType,
        quantity,
        unitPrice,
        lineTotal,
        returnedQuantity: 0,
        imeis: resolvedImeis,
        returnedImeis: [],
      });

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        total: lineTotal,
      };
    });

    const discount = data.discountAmount || 0;
    const tax = data.taxAmount || 0;
    const grandTotal = Math.max(0, subtotal - discount + tax);
    const paid = data.paidAmount !== undefined ? data.paidAmount : (data.paymentStatus === 'PAID' ? grandTotal : 0);
    const balance = Math.max(0, grandTotal - paid);

    const primaryProduct = data.items[0]?.product;
    const totalQty = data.items.reduce((sum, it) => sum + it.quantity, 0);

    // Record ONE unified sale record with multiple line items (Task 1B)
    const saleRec: SaleRecord = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      saleId: saleTransactionId,
      items: saleLineItems,
      subtotal,
      discountAmount: discount,
      taxAmount: tax,
      totalAmount: grandTotal,
      productId: primaryProduct?.id || '',
      productName: data.items.length > 1 ? `${primaryProduct?.name || 'Item'} + ${data.items.length - 1} more item(s)` : (primaryProduct?.name || 'Direct Sale'),
      brand: primaryProduct?.brand || 'N/A',
      sku: primaryProduct?.sku || '',
      category: primaryProduct?.category || 'General',
      mobileType: primaryProduct?.mobileType,
      vendorId: data.vendorId,
      vendorName: data.vendorName || (data.buyerType === 'VENDOR' ? data.customerName : primaryProduct?.vendor),
      customerName: data.customerName || data.vendorName || 'Counter Buyer',
      quantity: totalQty,
      returnedQuantity: 0,
      imeis: saleLineItems.flatMap((it) => it.imeis || []),
      returnedImeis: [],
      unitPrice: primaryProduct?.price || 0,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus === 'PAID' ? 'PAID' : data.paymentStatus === 'PARTIAL' ? 'PAID' : 'PENDING',
      saleStatus: 'COMPLETED',
      soldBy: 'Administrator',
      remainingStock: primaryProduct ? Math.max(0, primaryProduct.stock - primaryProduct.stock) : 0,
      notes: `Buyer: ${data.vendorName || data.customerName} (${data.buyerType || 'Client'}). ${data.notes || ''}`.trim(),
      date: dateStr,
    };
    setSales((prev) => [saleRec, ...prev]);

    const newInvoice: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      items: invoiceItems,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      grandTotal,
      paidAmount: paid,
      balanceAmount: balance,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      date: dateStr,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Record incoming payment if paid > 0
    if (paid > 0) {
      const paymentRec: PaymentItem = {
        id: `pay-${Date.now()}`,
        paymentNumber: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentType: 'RECEIPT',
        partyName: data.customerName,
        partyType: 'CUSTOMER',
        amount: paid,
        paymentMethod: data.paymentMethod === 'UPI' ? 'UPI' : data.paymentMethod === 'Card' ? 'CARD' : 'CASH',
        referenceNumber: invoiceNum,
        paymentDate: dateStr,
        notes: `Payment for Invoice ${invoiceNum}`,
      };
      setPayments((prev) => [paymentRec, ...prev]);
    }

    return { success: true, invoice: newInvoice };
  };

  // Purchase Order Operations
  const addPurchaseOrder = (data: {
    vendorName: string;
    productName: string;
    sku: string;
    quantityRequested: number;
    unitCost: number;
    status: PurchaseRequest['status'];
    expectedDelivery?: string;
    notes?: string;
  }): PurchaseRequest => {
    const totalCost = data.quantityRequested * data.unitCost;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newPurchase: PurchaseRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorName: data.vendorName,
      productName: data.productName,
      sku: data.sku,
      quantityRequested: data.quantityRequested,
      unitCost: data.unitCost,
      totalCost,
      status: data.status,
      expectedDelivery: data.expectedDelivery || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      createdAt: nowStr,
      requestDate: nowStr,
      notes: data.notes,
      settlementStatus: 'PENDING',
    };

    setPurchaseRequests((prev) => [newPurchase, ...prev]);

    // If marked DELIVERED on creation, receive shipment immediately
    if (data.status === 'DELIVERED') {
      const prod = products.find((p) => p.sku === data.sku);
      if (prod) {
        adjustStock(prod.id, 'IN', data.quantityRequested, `Supplier Purchase Received (${newPurchase.requestNumber})`);
      }
    }

    return newPurchase;
  };

  const receivePurchaseShipment = (requestId: string) => {
    const req = purchaseRequests.find((r) => r.id === requestId);
    if (!req) return;

    setPurchaseRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DELIVERED', settlementStatus: 'SETTLED' } : r))
    );

    const prod = products.find((p) => p.sku === req.sku);
    if (prod) {
      adjustStock(prod.id, 'IN', req.quantityRequested, `Shipment Received (${req.requestNumber})`);
    }

    // Record disbursement payment
    const paymentRec: PaymentItem = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentType: 'DISBURSEMENT',
      partyName: req.vendorName,
      partyType: 'SUPPLIER',
      amount: req.totalCost,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: req.requestNumber,
      paymentDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: `Settlement for received shipment ${req.requestNumber}`,
    };
    setPayments((prev) => [paymentRec, ...prev]);
  };

  // Expense Actions
  const addExpense = (data: Omit<ExpenseItem, 'id' | 'expenseNumber'>): ExpenseItem => {
    const newExpense: ExpenseItem = {
      ...data,
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Returns Actions & Vendor Sales Return Lifecycle (Tasks 3-13)
  const getSaleReturnableInfo = (saleId: string) => {
    const sale = sales.find((s) => s.saleId === saleId || s.id === saleId);
    if (!sale) {
      return {
        sale: undefined,
        items: [] as SaleReturnableItemBreakdown[],
        soldQuantity: 0,
        previouslyReturned: 0,
        pendingQuantity: 0,
        maxReturnable: 0,
        returnableQuantity: 0,
        totalReturnableQuantity: 0,
        soldImeis: [] as string[],
        returnedImeis: [] as string[],
        availableImeis: [] as string[],
      };
    }

    // Extract items from sale (supporting multi-item sales and legacy single-item sales)
    let saleItems: Array<{
      productId?: string;
      productName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      imeis?: string[];
    }> = [];

    if (Array.isArray(sale.items) && sale.items.length > 0) {
      saleItems = sale.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        unitPrice: it.unitPrice || 0,
        quantity: it.quantity || 0,
        imeis: it.imeis || [],
      }));
    } else {
      saleItems = [
        {
          productId: sale.productId,
          productName: sale.productName || 'Product',
          sku: sale.sku || '',
          unitPrice: sale.unitPrice || 0,
          quantity: sale.quantity || 0,
          imeis: sale.imeis || [],
        },
      ];
    }

    // Find all active returns against this source sale (exclude REJECTED and CANCELLED)
    const activeReturns = returns.filter(
      (r) =>
        (r.sourceSaleId === sale.saleId || r.sourceReferenceNumber === sale.saleId) &&
        r.status !== 'REJECTED' &&
        r.status !== 'CANCELLED'
    );

    // Aggregate active returned quantities and IMEIs per product SKU
    const productActiveData: Record<
      string,
      { returnedQty: number; pendingQty: number; completedQty: number; returnedImeis: Set<string> }
    > = {};

    activeReturns.forEach((r) => {
      const isCompleted = ['COMPLETED', 'SETTLED', 'RESTOCKED'].includes(r.status);
      const isPending = ['RETURN_REQUESTED', 'PENDING', 'RECEIVED', 'INSPECTED', 'APPROVED'].includes(r.status);

      if (r.items && r.items.length > 0) {
        r.items.forEach((it) => {
          const key = (it.sku || '').toUpperCase();
          if (!key) return;
          if (!productActiveData[key]) {
            productActiveData[key] = { returnedQty: 0, pendingQty: 0, completedQty: 0, returnedImeis: new Set() };
          }
          productActiveData[key].returnedQty += (it.quantity || 0);
          if (isCompleted) productActiveData[key].completedQty += (it.quantity || 0);
          if (isPending) productActiveData[key].pendingQty += (it.quantity || 0);
          if (Array.isArray(it.imeis)) {
            it.imeis.forEach((im) => productActiveData[key].returnedImeis.add(im.trim()));
          }
        });
      } else if (r.sku) {
        const key = (r.sku || '').toUpperCase();
        if (!productActiveData[key]) {
          productActiveData[key] = { returnedQty: 0, pendingQty: 0, completedQty: 0, returnedImeis: new Set() };
        }
        productActiveData[key].returnedQty += (r.quantity || 0);
        if (isCompleted) productActiveData[key].completedQty += (r.quantity || 0);
        if (isPending) productActiveData[key].pendingQty += (r.quantity || 0);
      }
    });

    const itemsBreakdown = saleItems.map((sItem) => {
      const key = (sItem.sku || '').toUpperCase();
      const activeData = productActiveData[key] || { returnedQty: 0, pendingQty: 0, completedQty: 0, returnedImeis: new Set() };

      const soldQty = sItem.quantity || 0;
      const returnedQty = activeData.returnedQty;
      const returnableQty = Math.max(0, soldQty - returnedQty);

      const soldImeis = Array.isArray(sItem.imeis) ? sItem.imeis : [];
      const returnedImeis = Array.from(activeData.returnedImeis);
      const availableImeis = soldImeis.filter((im) => !activeData.returnedImeis.has(im));

      return {
        productId: sItem.productId,
        productName: sItem.productName,
        sku: sItem.sku,
        unitPrice: sItem.unitPrice,
        soldQuantity: soldQty,
        alreadyReturnedQuantity: activeData.completedQty,
        pendingQuantity: activeData.pendingQty,
        activeReturnedQuantity: returnedQty,
        returnableQuantity: returnableQty,
        soldImeis,
        returnedImeis,
        availableImeis,
      };
    });

    const totalSold = itemsBreakdown.reduce((sum, it) => sum + it.soldQuantity, 0);
    const totalReturned = itemsBreakdown.reduce((sum, it) => sum + it.activeReturnedQuantity, 0);
    const totalPending = itemsBreakdown.reduce((sum, it) => sum + it.pendingQuantity, 0);
    const totalReturnable = itemsBreakdown.reduce((sum, it) => sum + it.returnableQuantity, 0);

    const primaryItem = itemsBreakdown[0] || {
      soldQuantity: 0,
      activeReturnedQuantity: 0,
      returnableQuantity: 0,
      soldImeis: [],
      returnedImeis: [],
      availableImeis: [],
    };

    return {
      sale,
      items: itemsBreakdown,
      soldQuantity: totalSold,
      previouslyReturned: totalReturned,
      pendingQuantity: totalPending,
      maxReturnable: totalReturnable,
      returnableQuantity: totalReturnable,
      totalReturnableQuantity: totalReturnable,
      soldImeis: primaryItem.soldImeis,
      returnedImeis: primaryItem.returnedImeis,
      availableImeis: primaryItem.availableImeis,
    };
  };

  const createVendorReturn = (data: {
    vendorName: string;
    vendorId?: string;
    sourceSaleId?: string;
    sourceReferenceNumber?: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      reason?: string;
      reasonCategory?: ReturnReasonCategory;
      otherReason?: string;
      itemCondition?: ReturnItemCondition;
      imeis?: string[];
      inspectionNotes?: string;
    }[];
    notes?: string;
    status?: ReturnLifecycleStatus;
  }): { success: boolean; message: string; returnDoc?: ReturnItem } => {
    if (!data.vendorName) {
      return { success: false, message: 'Vendor name is required' };
    }
    if (!data.items || data.items.length === 0) {
      return { success: false, message: 'At least one return item must be provided' };
    }

    const saleIdKey = data.sourceSaleId || data.sourceReferenceNumber;
    let targetSale = sales.find((s) => s.saleId === saleIdKey || s.id === saleIdKey);

    if (targetSale) {
      const saleVendor = (targetSale.vendorName || '').toLowerCase().trim();
      const retVendor = data.vendorName.toLowerCase().trim();
      if (saleVendor && retVendor && !saleVendor.includes(retVendor) && !retVendor.includes(saleVendor)) {
        return {
          success: false,
          message: `Vendor mismatch: Sale ${targetSale.saleId} was made to "${targetSale.vendorName}", not "${data.vendorName}".`,
        };
      }

      const info = getSaleReturnableInfo(targetSale.saleId);
      const returnableMap = new Map(info.items.map((it) => [it.sku.toUpperCase(), it]));

      for (const it of data.items) {
        const saleLine = returnableMap.get((it.sku || '').toUpperCase());

        // Task 2B: Product must be part of original sale
        if (!saleLine) {
          return {
            success: false,
            message: `Product "${it.productName || it.sku}" was not part of original sale ${targetSale.saleId}. Only products from the original sale can be returned.`,
          };
        }

        // Task 2C: Lock return pricing to original sale pricing
        it.unitPrice = saleLine.unitPrice;

        // Task 3B: Over-return protection
        if (it.quantity > saleLine.returnableQuantity) {
          return {
            success: false,
            message: `Return quantity exceeds the remaining returnable quantity for "${saleLine.productName}". Sold: ${saleLine.soldQuantity}, already returned/pending: ${saleLine.activeReturnedQuantity}, available returnable: ${saleLine.returnableQuantity}. Requested: ${it.quantity}.`,
          };
        }

        // Task 3C: Serial / IMEI protection
        if (it.imeis && it.imeis.length > 0) {
          if (it.imeis.length !== it.quantity) {
            return {
              success: false,
              message: `IMEI count (${it.imeis.length}) must match returned quantity (${it.quantity}) for "${saleLine.productName}".`,
            };
          }
          const uniqueImeis = new Set(it.imeis);
          if (uniqueImeis.size !== it.imeis.length) {
            return {
              success: false,
              message: `Duplicate IMEI specified in return line for "${saleLine.productName}".`,
            };
          }
          for (const im of it.imeis) {
            if (saleLine.soldImeis.length > 0 && !saleLine.soldImeis.includes(im)) {
              return {
                success: false,
                message: `IMEI "${im}" was not part of original sale ${targetSale.saleId}.`,
              };
            }
            if (saleLine.returnedImeis.includes(im)) {
              return {
                success: false,
                message: `IMEI "${im}" has already been returned or is in an active return for this sale.`,
              };
            }
          }
        }
      }
    }

    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const subItems: ReturnSubItem[] = data.items.map((it, idx) => ({
      id: `ritem-${Date.now()}-${idx}`,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalAmount: it.unitPrice * it.quantity,
      reason: it.reason || it.otherReason || it.reasonCategory || 'Return',
      reasonCategory: it.reasonCategory || 'OTHER',
      itemCondition: it.itemCondition || 'GOOD',
      imeis: it.imeis || [],
      inspectionNotes: it.inspectionNotes || '',
      status: data.status || 'RETURN_REQUESTED',
    }));

    const primary = subItems[0];
    const totalAmount = subItems.reduce((sum, it) => sum + it.totalAmount, 0);
    const totalQty = subItems.reduce((sum, it) => sum + it.quantity, 0);

    const newReturn: ReturnItem = {
      id: `ret-${Date.now()}`,
      returnNumber,
      returnType: 'VENDOR_SALES_RETURN',
      partyType: 'VENDOR',
      sourceSaleId: targetSale?.saleId || data.sourceSaleId,
      sourceReferenceNumber: targetSale?.saleId || data.sourceReferenceNumber || `SAL-DIRECT`,
      partyName: data.vendorName,
      items: subItems,
      productId: primary.productId,
      productName: primary.productName,
      sku: primary.sku,
      quantity: totalQty,
      unitPrice: primary.unitPrice,
      totalAmount,
      reason: primary.reason,
      reasonCategory: primary.reasonCategory,
      itemCondition: primary.itemCondition,
      settlementType: 'CREDIT_NOTE',
      settlementStatus: 'PENDING',
      settlementAmount: totalAmount,
      status: data.status || 'RETURN_REQUESTED',
      notes: data.notes || '',
      createdAt: nowStr,
    };

    setReturns((prev) => [newReturn, ...prev]);

    return {
      success: true,
      message: `Vendor Return #${returnNumber} recorded successfully with status ${newReturn.status}.`,
      returnDoc: newReturn,
    };
  };

  const receiveReturnRecord = (returnId: string): { success: boolean; message: string } => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return { success: false, message: 'Return record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? {
              ...r,
              status: 'RECEIVED',
              receivedAt: nowStr,
              items: r.items?.map((it) => ({ ...it, status: 'RECEIVED' })),
            }
          : r
      )
    );

    const items = target.items && target.items.length > 0 ? target.items : [
      {
        productId: target.productId,
        productName: target.productName,
        sku: target.sku,
        quantity: target.quantity,
      },
    ];

    items.forEach((it) => {
      const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
      if (prod) {
        const curInsp = prod.inspectionStock || 0;
        updateProduct(prod.id, { inspectionStock: curInsp + it.quantity });

        const newLog: InventoryLogEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          vendorName: target.partyName,
          type: 'VENDOR_RETURN_RECEIVED',
          quantityChanged: it.quantity,
          previousStock: prod.stock,
          newStock: prod.stock,
          reason: `Vendor Return Received (${target.returnNumber}) - Placed in Inspection Quarantine`,
          performedBy: 'Administrator',
          date: nowStr,
          reference: target.returnNumber,
          returnId: target.returnNumber,
          notes: `Inspection quarantine stock increased by ${it.quantity} to ${curInsp + it.quantity}`,
        };
        setInventoryLogs((prevLogs) => [newLog, ...prevLogs]);
      }
    });

    return { success: true, message: `Return #${target.returnNumber} marked as RECEIVED. Items placed in inspection quarantine.` };
  };

  const inspectReturnRecord = (
    returnId: string,
    inspections: { sku: string; condition: ReturnItemCondition; notes?: string }[] | ReturnItemCondition,
    generalNotes?: string
  ): { success: boolean; message: string } => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return { success: false, message: 'Return record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const inspArray: { sku: string; condition: ReturnItemCondition; notes?: string }[] = Array.isArray(inspections)
      ? inspections
      : (target.items && target.items.length > 0
          ? target.items.map((it) => ({
              sku: it.sku,
              condition: inspections as ReturnItemCondition,
              notes: generalNotes,
            }))
          : [
              {
                sku: target.sku,
                condition: inspections as ReturnItemCondition,
                notes: generalNotes,
              },
            ]);

    setReturns((prev) =>
      prev.map((r) => {
        if (r.id === returnId) {
          const updatedItems = r.items?.map((it) => {
            const match = inspArray.find((insp) => insp.sku.toUpperCase() === it.sku.toUpperCase());
            if (match) {
              return {
                ...it,
                itemCondition: match.condition,
                inspectionNotes: match.notes || it.inspectionNotes,
                status: 'INSPECTED' as ReturnLifecycleStatus,
              };
            }
            return {
              ...it,
              itemCondition: typeof inspections === 'string' ? inspections : it.itemCondition,
              status: 'INSPECTED' as ReturnLifecycleStatus,
            };
          });
          const primaryCondition =
            updatedItems && updatedItems[0]
              ? updatedItems[0].itemCondition
              : typeof inspections === 'string'
              ? inspections
              : r.itemCondition;
          return {
            ...r,
            status: 'INSPECTED' as ReturnLifecycleStatus,
            itemCondition: primaryCondition,
            items: updatedItems,
            inspectionNotes: generalNotes || r.inspectionNotes,
            inspectedBy: 'Administrator',
            inspectedAt: nowStr,
          };
        }
        return r;
      })
    );

    return { success: true, message: `Return #${target.returnNumber} inspection completed.` };
  };

  const restockReturnRecord = (returnId: string): { success: boolean; message: string } => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return { success: false, message: 'Return record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const items = target.items && target.items.length > 0 ? target.items : [
      {
        productId: target.productId,
        productName: target.productName,
        sku: target.sku,
        quantity: target.quantity,
        itemCondition: target.itemCondition,
      },
    ];

    let restockedCount = 0;
    items.forEach((it) => {
      if (it.itemCondition === 'GOOD') {
        const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
        if (prod) {
          const prevInsp = prod.inspectionStock || 0;
          const newInsp = Math.max(0, prevInsp - it.quantity);
          const prevStock = prod.stock;
          const newStock = prevStock + it.quantity;

          updateProduct(prod.id, {
            stock: newStock,
            inspectionStock: newInsp,
          });

          restockedCount += it.quantity;

          const newLog: InventoryLogEntry = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            vendorName: target.partyName,
            type: 'RETURN_INSPECTED_GOOD',
            quantityChanged: it.quantity,
            previousStock: prevStock,
            newStock: newStock,
            reason: `Return Inspected - Restored to Active Stock (${target.returnNumber})`,
            performedBy: 'Administrator',
            date: nowStr,
            reference: target.returnNumber,
            returnId: target.returnNumber,
          };
          setInventoryLogs((prevLogs) => [newLog, ...prevLogs]);
        }
      }
    });

    if (target.sourceSaleId || target.sourceReferenceNumber) {
      setSales((prevSales) =>
        prevSales.map((s) => {
          if (s.saleId === target.sourceSaleId || s.saleId === target.sourceReferenceNumber) {
            const addedReturned = restockedCount;
            const imeisToAppend: string[] = [];
            target.items?.forEach((it) => {
              if (it.itemCondition === 'GOOD' && it.imeis) imeisToAppend.push(...it.imeis);
            });
            return {
              ...s,
              returnedQuantity: (s.returnedQuantity || 0) + addedReturned,
              returnedImeis: Array.from(new Set([...(s.returnedImeis || []), ...imeisToAppend])),
            };
          }
          return s;
        })
      );
    }

    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? {
              ...r,
              status: 'APPROVED',
              items: r.items?.map((it) =>
                it.itemCondition === 'GOOD' ? { ...it, status: 'RESTOCKED' } : it
              ),
            }
          : r
      )
    );

    return {
      success: true,
      message: `${restockedCount} unit(s) of Good stock restored to live warehouse inventory.`,
    };
  };

  const markDamagedReturnRecord = (returnId: string, notes?: string): { success: boolean; message: string } => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return { success: false, message: 'Return record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const items = target.items && target.items.length > 0 ? target.items : [
      {
        productId: target.productId,
        productName: target.productName,
        sku: target.sku,
        quantity: target.quantity,
        itemCondition: target.itemCondition,
      },
    ];

    let damagedCount = 0;
    items.forEach((it) => {
      if (it.itemCondition !== 'GOOD') {
        const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
        if (prod) {
          const prevInsp = prod.inspectionStock || 0;
          const newInsp = Math.max(0, prevInsp - it.quantity);

          if (it.itemCondition === 'UNSELLABLE') {
            const curDisc = prod.discardedStock || 0;
            updateProduct(prod.id, {
              inspectionStock: newInsp,
              discardedStock: curDisc + it.quantity,
            });
          } else {
            const curDam = prod.damagedStock || 0;
            updateProduct(prod.id, {
              inspectionStock: newInsp,
              damagedStock: curDam + it.quantity,
            });
          }

          damagedCount += it.quantity;

          const newLog: InventoryLogEntry = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            vendorName: target.partyName,
            type: it.itemCondition === 'UNSELLABLE' ? 'DISCARD' : 'RETURN_INSPECTED_DAMAGED',
            quantityChanged: it.quantity,
            previousStock: prod.stock,
            newStock: prod.stock,
            reason: `Return Inspected - Isolated as ${it.itemCondition} (${target.returnNumber})`,
            performedBy: 'Administrator',
            date: nowStr,
            reference: target.returnNumber,
            returnId: target.returnNumber,
          };
          setInventoryLogs((prevLogs) => [newLog, ...prevLogs]);
        }
      }
    });

    if (target.sourceSaleId || target.sourceReferenceNumber) {
      setSales((prevSales) =>
        prevSales.map((s) => {
          if (s.saleId === target.sourceSaleId || s.saleId === target.sourceReferenceNumber) {
            const imeisToAppend: string[] = [];
            target.items?.forEach((it) => {
              if (it.itemCondition !== 'GOOD' && it.imeis) imeisToAppend.push(...it.imeis);
            });
            return {
              ...s,
              returnedQuantity: (s.returnedQuantity || 0) + damagedCount,
              returnedImeis: Array.from(new Set([...(s.returnedImeis || []), ...imeisToAppend])),
            };
          }
          return s;
        })
      );
    }

    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? {
              ...r,
              status: 'DAMAGED',
              items: r.items?.map((it) =>
                it.itemCondition !== 'GOOD' ? { ...it, status: 'DAMAGED' } : it
              ),
            }
          : r
      )
    );

    return {
      success: true,
      message: `${damagedCount} unit(s) isolated into damaged/discard quarantine stock.`,
    };
  };

  const settleReturnRecord = (
    returnId: string,
    settlement:
      | {
          type: ReturnSettlementType;
          amount?: number;
          notes?: string;
        }
      | ReturnSettlementType,
    amountArg?: number,
    statusArg?: 'PENDING' | 'SETTLED',
    notesArg?: string
  ): { success: boolean; message: string } => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return { success: false, message: 'Return record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const type: ReturnSettlementType = typeof settlement === 'object' ? settlement.type : settlement;
    const amount =
      typeof settlement === 'object' && settlement.amount !== undefined
        ? settlement.amount
        : amountArg !== undefined
        ? amountArg
        : target.totalAmount;
    const notes = typeof settlement === 'object' ? settlement.notes : notesArg;
    const status = statusArg || 'SETTLED';

    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? {
              ...r,
              settlementType: type,
              settlementAmount: amount,
              settlementNotes: notes || `Settlement via ${type}`,
              settlementStatus: status,
              settledAt: nowStr,
              status: 'SETTLED',
            }
          : r
      )
    );

    if (type === 'REFUND') {
      const paymentRec: PaymentItem = {
        id: `pay-${Date.now()}`,
        paymentNumber: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentType: 'DISBURSEMENT',
        partyName: target.partyName,
        partyType: target.partyType === 'VENDOR' ? 'SUPPLIER' : 'CUSTOMER',
        amount,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: target.returnNumber,
        paymentDate: nowStr,
        notes: `Refund payout for Return Voucher ${target.returnNumber}`,
      };
      setPayments((prev) => [paymentRec, ...prev]);
    }

    return { success: true, message: `Return #${target.returnNumber} settled successfully via ${type}.` };
  };

  const addReturnRecord = (data: Omit<ReturnItem, 'id' | 'returnNumber' | 'createdAt'>): ReturnItem => {
    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReturn: ReturnItem = {
      ...data,
      id: `ret-${Date.now()}`,
      returnNumber,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setReturns((prev) => [newReturn, ...prev]);

    if (data.status === 'COMPLETED' || data.status === 'VERIFIED') {
      const prod = products.find((p) => p.id === data.productId || p.sku === data.sku);
      if (prod) {
        if (data.returnType === 'SALES_RETURN' && data.itemCondition === 'GOOD') {
          adjustStock(prod.id, 'RETURN', data.quantity, `Sales Return Stock Restored (${returnNumber})`);
        } else if (data.returnType === 'SALES_RETURN' && data.itemCondition === 'DAMAGED') {
          adjustStock(prod.id, 'DAMAGE', data.quantity, `Sales Return Damaged Stock (${returnNumber})`);
        } else if (data.returnType === 'PURCHASE_RETURN') {
          adjustStock(prod.id, 'OUT', data.quantity, `Purchase Return Dispatched (${returnNumber})`);
        }
      }
    }

    return newReturn;
  };

  const verifyReturnRecord = (
    returnId: string,
    status: ReturnItem['status'],
    itemCondition?: ReturnItem['itemCondition']
  ) => {
    const target = returns.find((r) => r.id === returnId);
    if (!target) return;

    setReturns((prev) =>
      prev.map((r) => {
        if (r.id === returnId) {
          return {
            ...r,
            status,
            itemCondition: itemCondition || r.itemCondition,
          };
        }
        return r;
      })
    );

    if (status === 'COMPLETED' || status === 'VERIFIED') {
      const prod = products.find((p) => p.id === target.productId || p.sku === target.sku);
      if (prod) {
        const cond = itemCondition || target.itemCondition;
        if ((target.returnType === 'SALES_RETURN' || target.returnType === 'VENDOR_SALES_RETURN') && cond === 'GOOD') {
          adjustStock(prod.id, 'RETURN', target.quantity, `Verified Return Stock Restored (${target.returnNumber})`);
        } else if ((target.returnType === 'SALES_RETURN' || target.returnType === 'VENDOR_SALES_RETURN') && cond === 'DAMAGED') {
          adjustStock(prod.id, 'DAMAGE', target.quantity, `Verified Return Damaged (${target.returnNumber})`);
        } else if (target.returnType === 'PURCHASE_RETURN') {
          adjustStock(prod.id, 'OUT', target.quantity, `Verified Purchase Return to Supplier (${target.returnNumber})`);
        }
      }
    }
  };

  // Payments Action
  const addPaymentRecord = (data: Omit<PaymentItem, 'id' | 'paymentNumber'>): PaymentItem => {
    const newPayment: PaymentItem = {
      ...data,
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  // Customers Action
  const addCustomer = (data: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'joinedDate'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now().toString().slice(-4)}`,
      totalOrders: 0,
      totalSpent: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
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
        expenses,
        returns,
        payments,
        invoices,
        cart,
        cartCount,
        cartTotal,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        adjustStock,
        sellProduct,
        createSaleTransaction,
        addPurchaseOrder,
        receivePurchaseShipment,
        addExpense,
        deleteExpense,
        addReturnRecord,
        verifyReturnRecord,
        createVendorReturn,
        receiveReturnRecord,
        inspectReturnRecord,
        restockReturnRecord,
        markDamagedReturnRecord,
        settleReturnRecord,
        getSaleReturnableInfo,
        addPaymentRecord,
        addCustomer,
        updateCustomer,
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

export const useOptionalStore = (): StoreContextType | undefined => {
  return useContext(StoreContext);
};

