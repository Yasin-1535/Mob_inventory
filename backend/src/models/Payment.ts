import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  paymentType: 'RECEIPT' | 'DISBURSEMENT'; // RECEIPT: from Customer; DISBURSEMENT: to Supplier
  partyId?: mongoose.Types.ObjectId;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceTransactionId?: mongoose.Types.ObjectId;
  referenceNumber?: string; // Invoice No, Sale No, Purchase No
  paymentDate: Date;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    paymentType: {
      type: String,
      enum: ['RECEIPT', 'DISBURSEMENT'],
      required: true,
    },
    partyId: { type: Schema.Types.ObjectId },
    partyName: { type: String, required: true, trim: true },
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'],
      default: 'CASH',
    },
    referenceTransactionId: { type: Schema.Types.ObjectId },
    referenceNumber: { type: String, default: '' },
    paymentDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
