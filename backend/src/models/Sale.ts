import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  brand?: string;
  sku: string;
  category?: string;
  mobileType?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  lineTotal: number;
  returnedQuantity?: number;
  imeis?: string[];
  returnedImeis?: string[];
}

export interface ISale extends Document {
  saleId: string;
  orderId?: mongoose.Types.ObjectId | string;
  orderNumber?: string;
  source?: 'POS' | 'ADMIN' | 'ONLINE';
  buyerType?: 'CUSTOMER' | 'VENDOR';
  vendor?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId | string;
  vendorName?: string;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  saleStatus: 'COMPLETED' | 'CANCELLED';
  soldBy: string;
  soldById?: mongoose.Types.ObjectId;
  remainingStock?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Legacy single-item fields (preserved for 100% backward compatibility with old records)
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  brand?: string;
  sku?: string;
  category?: string;
  mobileType?: string;
  quantity?: number;
  returnedQuantity?: number;
  imeis?: string[];
  returnedImeis?: string[];
  unitPrice?: number;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    brand: { type: String, default: 'N/A' },
    sku: { type: String, required: true },
    category: { type: String, default: 'General' },
    mobileType: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    imeis: [{ type: String, trim: true }],
    returnedImeis: [{ type: String, trim: true }],
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    saleId: { type: String, required: true, unique: true, uppercase: true },
    orderId: { type: Schema.Types.Mixed, default: null },
    orderNumber: { type: String, default: null, trim: true },
    source: { type: String, enum: ['POS', 'ADMIN', 'ONLINE'], default: 'POS' },
    buyerType: { type: String, enum: ['CUSTOMER', 'VENDOR'], default: 'CUSTOMER' },
    vendor: { type: Schema.Types.ObjectId, ref: 'User' },
    vendorId: { type: Schema.Types.Mixed },
    vendorName: { type: String, default: 'N/A' },
    customerName: { type: String, default: 'Counter Buyer' },
    customerPhone: { type: String, default: '' },
    items: { type: [SaleItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Other'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'CANCELLED'],
      default: 'PAID',
    },
    saleStatus: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    soldBy: { type: String, default: 'Administrator' },
    soldById: { type: Schema.Types.ObjectId, ref: 'User' },
    remainingStock: { type: Number, default: 0 },
    notes: { type: String, default: '' },

    // Legacy fields
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    brand: { type: String, default: 'N/A' },
    sku: { type: String },
    category: { type: String },
    mobileType: { type: String, default: null },
    quantity: { type: Number },
    returnedQuantity: { type: Number, default: 0 },
    imeis: [{ type: String, trim: true }],
    returnedImeis: [{ type: String, trim: true }],
    unitPrice: { type: Number },
  },
  { timestamps: true }
);

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
