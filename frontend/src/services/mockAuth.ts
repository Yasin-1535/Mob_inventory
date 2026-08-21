// Unified Authentication & Credential Management
export type UserRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type AccountStatus = 'Active' | 'Suspended' | 'Blocked' | 'Inactive';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendorId?: string;
  customerId?: string;
  shopName?: string;
  phone?: string;
  address?: string;
  status?: AccountStatus;
}

export interface AuthSession {
  isAuthenticated: boolean;
  role: UserRole;
  user: AuthUser;
}

export interface StoredUserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  vendorId?: string;
  customerId?: string;
  shopName?: string;
  phone?: string;
  address?: string;
  status: AccountStatus;
}

export const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@smartinventory.com',
    password: 'Admin@123',
    role: 'ADMIN',
    status: 'Active',
  },
  {
    id: 'vendor-001',
    name: 'ABC Electronics (Rajesh Kumar)',
    email: 'vendor@smartinventory.com',
    password: 'Vendor@123',
    role: 'VENDOR',
    vendorId: 'ven-001',
    shopName: 'ABC Electronics',
    status: 'Active',
  },
  {
    id: 'customer-001',
    name: 'Rahul Sharma',
    email: 'customer@smartinventory.com',
    password: 'Customer@123',
    role: 'CUSTOMER',
    customerId: 'cust-001',
    status: 'Active',
  },
];

export const AUTH_STORAGE_KEY = 'smart_inventory_auth';
export const USERS_STORAGE_KEY = 'smart_inventory_users_v2';

export const getStoredUsers = (): StoredUserAccount[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveStoredUsers = (users: StoredUserAccount[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Customer Self-Registration (Strictly role = CUSTOMER)
export const registerCustomerAccount = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}): Promise<AuthSession> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const users = getStoredUsers();
  const trimmedEmail = data.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const customerId = `cust-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: StoredUserAccount = {
    id: `user-${Date.now().toString().slice(-4)}`,
    name: data.name.trim(),
    email: trimmedEmail,
    password: data.password.trim(),
    role: 'CUSTOMER', // FORCED: Public registration can NEVER create ADMIN or VENDOR
    customerId,
    phone: data.phone?.trim() || '',
    address: data.address?.trim() || '',
    status: 'Active',
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);

  const authUser: AuthUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: 'CUSTOMER',
    customerId: newUser.customerId,
    phone: newUser.phone,
    address: newUser.address,
    status: 'Active',
  };

  const session: AuthSession = {
    isAuthenticated: true,
    role: 'CUSTOMER',
    user: authUser,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
};

// Admin Provisions Vendor Account
export const registerVendorAccount = (data: {
  businessName: string;
  contactPerson: string;
  loginEmail: string;
  password: string;
  vendorId: string;
  phone?: string;
  address?: string;
  status: AccountStatus;
}): StoredUserAccount => {
  const users = getStoredUsers();
  const trimmedEmail = data.loginEmail.trim().toLowerCase();

  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
  const vendorUser: StoredUserAccount = {
    id: `user-ven-${Date.now().toString().slice(-4)}`,
    name: `${data.businessName} (${data.contactPerson})`,
    email: trimmedEmail,
    password: data.password.trim(),
    role: 'VENDOR',
    vendorId: data.vendorId,
    shopName: data.businessName,
    phone: data.phone?.trim() || '',
    address: data.address?.trim() || '',
    status: data.status,
  };

  let updatedUsers: StoredUserAccount[];
  if (existingIndex >= 0) {
    updatedUsers = [...users];
    updatedUsers[existingIndex] = vendorUser;
  } else {
    updatedUsers = [...users, vendorUser];
  }

  saveStoredUsers(updatedUsers);
  return vendorUser;
};

// Update User Account Status (e.g., when Admin suspends vendor or blocks customer)
export const updateStoredUserStatus = (identifier: string, status: AccountStatus): void => {
  const users = getStoredUsers();
  const updated = users.map((u) => {
    if (
      u.id === identifier ||
      u.email.toLowerCase() === identifier.toLowerCase() ||
      u.vendorId === identifier ||
      u.customerId === identifier
    ) {
      return { ...u, status };
    }
    return u;
  });
  saveStoredUsers(updated);
};

export const mockLogin = async (
  identifier: string,
  password: string,
  selectedRole: UserRole
): Promise<AuthSession> => {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const trimmedIdentifier = identifier.trim().toLowerCase();
  const trimmedPassword = password.trim();

  const users = getStoredUsers();

  // Find user by email or shortcut aliases (admin, vendor, customer)
  const matchedUser = users.find((u) => {
    const emailMatch = u.email.toLowerCase() === trimmedIdentifier;
    const shortcutMatch =
      (u.role === 'ADMIN' && trimmedIdentifier === 'admin') ||
      (u.role === 'VENDOR' && trimmedIdentifier === 'vendor') ||
      (u.role === 'CUSTOMER' && trimmedIdentifier === 'customer');
    return emailMatch || shortcutMatch;
  });

  if (!matchedUser) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  if (matchedUser.password !== trimmedPassword) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  // Strict Role Verification: Selected Role MUST match Actual User Role
  if (matchedUser.role !== selectedRole) {
    throw new Error('Incorrect account type selected.');
  }

  // Status Verification
  if (matchedUser.status === 'Suspended' || matchedUser.status === 'Blocked' || matchedUser.status === 'Inactive') {
    throw new Error(`Your account is currently ${matchedUser.status.toLowerCase()}. Please contact administrator.`);
  }

  const authUser: AuthUser = {
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    role: matchedUser.role,
    vendorId: matchedUser.vendorId,
    customerId: matchedUser.customerId,
    shopName: matchedUser.shopName,
    phone: matchedUser.phone,
    address: matchedUser.address,
    status: matchedUser.status,
  };

  const session: AuthSession = {
    isAuthenticated: true,
    role: matchedUser.role,
    user: authUser,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
};

export const getStoredSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const clearStoredSession = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
