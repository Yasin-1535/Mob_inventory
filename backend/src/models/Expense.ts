import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  expenseNumber: string;
  category:
    | 'Rent'
    | 'Electricity & Utilities'
    | 'Salaries'
    | 'Marketing'
    | 'Maintenance'
    | 'Logistics & Transport'
    | 'Packaging'
    | 'Other';
  title: string;
  amount: number;
  date: Date;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  recipient?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: [
        'Rent',
        'Electricity & Utilities',
        'Salaries',
        'Marketing',
        'Maintenance',
        'Logistics & Transport',
        'Packaging',
        'Other',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'],
      default: 'CASH',
    },
    recipient: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const Expense = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
