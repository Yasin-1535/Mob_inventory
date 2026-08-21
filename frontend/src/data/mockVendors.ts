export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  vendorType?: string;
  gstin?: string;
  loginEmail?: string;
  productsSupplied: number;
  totalStockSupplied: number;
  pendingRequests: number;
  completedOrders: number;
  pendingPayments: number;
  status: 'Active' | 'Pending Approval' | 'Suspended';
}

export const mockVendors: Vendor[] = [
  {
    id: 'ven-001',
    name: 'ABC Electronics',
    contactPerson: 'Rajesh Kumar',
    email: 'vendor@smartinventory.com',
    phone: '+91 98765 12345',
    productsSupplied: 48,
    totalStockSupplied: 624,
    pendingRequests: 8,
    completedOrders: 126,
    pendingPayments: 18450,
    status: 'Active',
  },
  {
    id: 'ven-002',
    name: 'TechSupply Hub',
    contactPerson: 'Anjali Gupta',
    email: 'contact@techsupplyhub.com',
    phone: '+91 98111 22334',
    productsSupplied: 35,
    totalStockSupplied: 410,
    pendingRequests: 3,
    completedOrders: 94,
    pendingPayments: 12800,
    status: 'Active',
  },
  {
    id: 'ven-003',
    name: 'OfficeWorld Ltd',
    contactPerson: 'Vikram Mehta',
    email: 'sales@officeworld.in',
    phone: '+91 98222 33445',
    productsSupplied: 60,
    totalStockSupplied: 808,
    pendingRequests: 5,
    completedOrders: 210,
    pendingPayments: 24500,
    status: 'Active',
  },
];
