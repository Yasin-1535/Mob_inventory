import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  mobileType?: 'Smartphone' | 'Keypad Phone' | 'Secondhand' | null;
  mobileCondition?: 'NEW' | 'SECONDHAND' | null;
  brand?: string | null;
  accessoryCategory?: string | null;
  productType?: string | null;
  price: number;
  costPrice: number;
  supplierCost?: number;
  stock: number;
  minStockAlert: number;
  lowStockThreshold?: number;
  vendor: string;
  vendorId?: mongoose.Types.ObjectId;
  description: string;
  imageUrl?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    mobileType: {
      type: String,
      enum: ['Smartphone', 'Keypad Phone', 'Secondhand', null],
      default: null,
    },
    mobileCondition: {
      type: String,
      enum: ['NEW', 'SECONDHAND', null],
      default: 'NEW',
    },
    brand: { type: String, default: null, trim: true },
    accessoryCategory: { type: String, default: null, trim: true },
    productType: { type: String, default: null, trim: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    supplierCost: { type: Number, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minStockAlert: { type: Number, required: true, min: 0, default: 10 },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    vendor: { type: String, required: true, trim: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
  },
  { timestamps: true }
);

// Auto-derive status from stock and minStockAlert
ProductSchema.pre<IProduct>('save', function (next) {
  if (this.stock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stock <= this.minStockAlert) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
