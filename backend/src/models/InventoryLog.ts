import mongoose, { Document, Schema } from 'mongoose';

export type InventoryMovementType =
  | 'IN'
  | 'OUT'
  | 'ORDER'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'RETURN'
  | 'VENDOR_RETURN_RECEIVED'
  | 'RETURN_INSPECTED_GOOD'
  | 'RETURN_INSPECTED_DAMAGED'
  | 'PURCHASE_RETURN'
  | 'DISCARD';

export interface IInventoryLog extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  vendor?: mongoose.Types.ObjectId;
  vendorName?: string;
  type: InventoryMovementType;
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  returnId?: string;
  notes?: string;
  performedBy: string;
  createdAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User' },
    vendorName: { type: String, default: null },
    type: {
      type: String,
      enum: [
        'IN',
        'OUT',
        'ORDER',
        'ADJUSTMENT',
        'DAMAGE',
        'RETURN',
        'VENDOR_RETURN_RECEIVED',
        'RETURN_INSPECTED_GOOD',
        'RETURN_INSPECTED_DAMAGED',
        'PURCHASE_RETURN',
        'DISCARD',
      ],
      required: true,
    },
    quantityChanged: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    reference: { type: String, default: '' },
    returnId: { type: String, default: '' },
    notes: { type: String, default: '' },
    performedBy: { type: String, default: 'Admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryLog = mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);
