import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'INACTIVE';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  vendorId?: string;
  customerId?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  vendorType?: string;
  gstin?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'VENDOR', 'CUSTOMER'],
      required: true,
      default: 'CUSTOMER',
    },
    vendorId: { type: String, trim: true },
    customerId: { type: String, trim: true },
    phone: { type: String, trim: true },
    companyName: { type: String, trim: true },
    address: { type: String, trim: true },
    vendorType: { type: String, trim: true },
    gstin: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
