import mongoose, { Document, Schema } from 'mongoose';

export interface ISale extends Document {
  saleId: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  brand: string;
  sku: string;
  category: string;
  mobileType?: string;
  vendor?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId | string;
  vendorName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  saleStatus: 'COMPLETED' | 'CANCELLED';
  soldBy: string;
  soldById?: mongoose.Types.ObjectId;
  remainingStock: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    saleId: { type: String, required: true, unique: true, uppercase: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    brand: { type: String, default: 'N/A' },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    mobileType: { type: String, default: null },
    vendor: { type: Schema.Types.ObjectId, ref: 'User' },
    vendorId: { type: Schema.Types.Mixed },
    vendorName: { type: String, default: 'N/A' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
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
    remainingStock: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
