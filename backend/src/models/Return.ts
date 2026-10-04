import mongoose, { Document, Schema } from 'mongoose';

export type ReturnType = 'VENDOR_SALES_RETURN' | 'SALES_RETURN' | 'PURCHASE_RETURN';
export type ReturnPartyType = 'VENDOR' | 'CUSTOMER';
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
  | 'COMPLETED';

export type ReturnSettlementType = 'REFUND' | 'CREDIT_NOTE' | 'ACCOUNT_ADJUSTMENT' | 'EXCHANGE' | 'CREDIT' | 'REPLACEMENT';

export interface IReturnItemLine {
  productId?: mongoose.Types.ObjectId;
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

export interface IReturn extends Document {
  returnNumber: string;
  returnType: ReturnType;
  partyType: ReturnPartyType;
  sourceTransactionId?: mongoose.Types.ObjectId;
  sourceSaleId?: mongoose.Types.ObjectId | string;
  sourceOrderId?: mongoose.Types.ObjectId | string;
  sourceOrderNumber?: string;
  sourcePurchaseId?: mongoose.Types.ObjectId | string;
  sourcePurchaseNumber?: string;
  sourceReferenceNumber?: string;
  partyId?: mongoose.Types.ObjectId;
  partyName: string;
  items: IReturnItemLine[];
  // Legacy & summary fields for backward compatibility
  productId?: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  reasonCategory?: ReturnReasonCategory;
  itemCondition: ReturnItemCondition;
  settlementType: ReturnSettlementType;
  settlementStatus: 'PENDING' | 'SETTLED';
  settlementAmount?: number;
  settlementNotes?: string;
  status: ReturnLifecycleStatus;
  inspectionNotes?: string;
  inspectedBy?: string;
  inspectedAt?: Date;
  receivedAt?: Date;
  settledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemLineSchema = new Schema<IReturnItemLine>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    reasonCategory: {
      type: String,
      enum: [
        'BROKEN_ITEM',
        'DAMAGED_ITEM',
        'DEFECTIVE_ITEM',
        'WRONG_PRODUCT',
        'MISMATCHED_PRODUCT',
        'WRONG_QUANTITY',
        'MISSING_PARTS',
        'QUALITY_ISSUE',
        'PACKAGING_DAMAGE',
        'OTHER',
      ],
      default: 'OTHER',
    },
    itemCondition: {
      type: String,
      enum: ['GOOD', 'DAMAGED', 'DEFECTIVE', 'MISMATCHED', 'UNSELLABLE'],
      default: 'GOOD',
    },
    imeis: [{ type: String, trim: true }],
    inspectionNotes: { type: String, default: '' },
    status: { type: String, default: 'PENDING' },
  },
  { _id: true }
);

const ReturnSchema = new Schema<IReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    returnType: {
      type: String,
      enum: ['VENDOR_SALES_RETURN', 'SALES_RETURN', 'PURCHASE_RETURN'],
      required: true,
    },
    partyType: {
      type: String,
      enum: ['VENDOR', 'CUSTOMER'],
      default: 'VENDOR',
    },
    sourceTransactionId: { type: Schema.Types.ObjectId },
    sourceSaleId: { type: Schema.Types.Mixed },
    sourceOrderId: { type: Schema.Types.Mixed, default: null },
    sourceOrderNumber: { type: String, default: null, trim: true },
    sourcePurchaseId: { type: Schema.Types.Mixed, default: null },
    sourcePurchaseNumber: { type: String, default: null, trim: true },
    sourceReferenceNumber: { type: String, default: '' },
    partyId: { type: Schema.Types.ObjectId },
    partyName: { type: String, required: true, trim: true },
    items: { type: [ReturnItemLineSchema], default: [] },
    // Summary / backward compatibility fields
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    reasonCategory: {
      type: String,
      enum: [
        'BROKEN_ITEM',
        'DAMAGED_ITEM',
        'DEFECTIVE_ITEM',
        'WRONG_PRODUCT',
        'MISMATCHED_PRODUCT',
        'WRONG_QUANTITY',
        'MISSING_PARTS',
        'QUALITY_ISSUE',
        'PACKAGING_DAMAGE',
        'OTHER',
      ],
      default: 'OTHER',
    },
    itemCondition: {
      type: String,
      enum: ['GOOD', 'DAMAGED', 'DEFECTIVE', 'MISMATCHED', 'UNSELLABLE'],
      default: 'GOOD',
    },
    settlementType: {
      type: String,
      enum: ['REFUND', 'CREDIT_NOTE', 'ACCOUNT_ADJUSTMENT', 'EXCHANGE', 'CREDIT', 'REPLACEMENT'],
      default: 'REFUND',
    },
    settlementStatus: {
      type: String,
      enum: ['PENDING', 'SETTLED'],
      default: 'PENDING',
    },
    settlementAmount: { type: Number, default: 0 },
    settlementNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'RETURN_REQUESTED',
        'RECEIVED',
        'INSPECTED',
        'APPROVED',
        'REJECTED',
        'RESTOCKED',
        'DAMAGED',
        'DISCARDED',
        'SETTLED',
        'PENDING',
        'VERIFIED',
        'COMPLETED',
      ],
      default: 'RETURN_REQUESTED',
    },
    inspectionNotes: { type: String, default: '' },
    inspectedBy: { type: String },
    inspectedAt: { type: Date },
    receivedAt: { type: Date },
    settledAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Return = mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);

