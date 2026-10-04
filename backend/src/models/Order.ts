import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  discount?: number;
  tax?: number;
  subtotal: number;
  lineTotal?: number;
  returnedQuantity?: number;
  imeis?: string[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'REFUNDED';
export type OrderSource = 'POS' | 'ADMIN' | 'ONLINE';
export type OrderReturnStatus = 'NONE' | 'PARTIAL' | 'FULLY_RETURNED';

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount?: number;
  taxAmount: number;
  grandTotal: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  source: OrderSource;
  saleId?: string;
  saleMongoId?: mongoose.Types.ObjectId;
  returnStatus: OrderReturnStatus;
  returnedCount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    unitPrice: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    lineTotal: { type: Number },
    returnedQuantity: { type: Number, default: 0 },
    imeis: [{ type: String, trim: true }],
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'UNPAID', 'PARTIAL', 'REFUNDED'],
      default: 'PAID',
    },
    paymentMethod: { type: String, default: 'Cash' },
    source: {
      type: String,
      enum: ['POS', 'ADMIN', 'ONLINE'],
      default: 'ADMIN',
    },
    saleId: { type: String, default: null, trim: true },
    saleMongoId: { type: Schema.Types.ObjectId, ref: 'Sale', default: null },
    returnStatus: {
      type: String,
      enum: ['NONE', 'PARTIAL', 'FULLY_RETURNED'],
      default: 'NONE',
    },
    returnedCount: { type: Number, default: 0 },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    trackingNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
