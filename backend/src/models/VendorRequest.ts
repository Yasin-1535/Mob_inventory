import mongoose, { Document, Schema } from 'mongoose';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface IVendorRequest extends Document {
  requestNumber: string;
  vendorName: string;
  vendorId?: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantityRequested: number;
  unitCost: number;
  totalCost: number;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  status: RequestStatus;
  notes?: string;
  settlementStatus: 'PENDING' | 'SETTLED';
  createdAt: Date;
  updatedAt: Date;
}

const VendorRequestSchema = new Schema<IVendorRequest>(
  {
    requestNumber: { type: String, required: true, unique: true },
    vendorName: { type: String, required: true, trim: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User' },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantityRequested: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    notes: { type: String },
    settlementStatus: {
      type: String,
      enum: ['PENDING', 'SETTLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

export const VendorRequest = mongoose.model<IVendorRequest>('VendorRequest', VendorRequestSchema);
