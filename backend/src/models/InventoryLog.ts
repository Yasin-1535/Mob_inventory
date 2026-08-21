import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryLog extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  vendor?: mongoose.Types.ObjectId;
  vendorName?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  reason: string;
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
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN'],
      required: true,
    },
    quantityChanged: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    performedBy: { type: String, default: 'Admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryLog = mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);
