export interface AdminDashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  totalVendors: number;
  totalCustomers: number;
  todaysSales: number;
  pendingOrders: number;
}

export const mockAdminStats: AdminDashboardStats = {
  totalProducts: 248,
  totalStock: 1842,
  lowStock: 17,
  outOfStock: 6,
  totalVendors: 24,
  totalCustomers: 1284,
  todaysSales: 48750,
  pendingOrders: 32,
};
