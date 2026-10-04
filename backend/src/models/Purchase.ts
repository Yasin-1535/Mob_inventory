import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  returnedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierName: string;
  items: IPurchaseItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  purchaseStatus: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  returnStatus?: 'NONE' | 'PARTIAL' | 'FULLY_RETURNED';
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    returnedQuantity: { type: Number, default: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'User' },
    supplierName: { type: String, required: true, trim: true },
    items: { type: [PurchaseItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', null],
      default: null,
    },
    purchaseStatus: {
      type: String,
      enum: ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'],
      default: 'ORDERED',
    },
    returnStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'FULLY_RETURNED'],
      default: 'NONE',
    },
    expectedDeliveryDate: { type: Date },
    receivedDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
