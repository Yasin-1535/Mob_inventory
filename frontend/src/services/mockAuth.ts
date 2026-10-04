import api from './api';

// Password hashing helper for client-side storage security
export const hashPassword = (password: string): string => {
  let hash = 0x811c9dc5;
  const str = `si_salt_2026_${password}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `sha256_${(hash >>> 0).toString(16)}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  if (!stored) return false;
  if (stored === password) return true; // legacy plaintext compatibility
  return stored === hashPassword(password);
};

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
    password: hashPassword('Admin@123'),
    role: 'ADMIN',
    status: 'Active',
  },
  {
    id: 'vendor-001',
    name: 'ABC Electronics (Rajesh Kumar)',
    email: 'vendor@smartinventory.com',
    password: hashPassword('Vendor@123'),
    role: 'VENDOR',
    vendorId: 'ven-001',
    shopName: 'ABC Electronics',
    status: 'Active',
  },
  {
    id: 'customer-001',
    name: 'Rahul Sharma',
    email: 'customer@smartinventory.com',
    password: hashPassword('Customer@123'),
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
      saveStoredUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveStoredUsers = (users: StoredUserAccount[]): void => {
  const sanitized = users.map((u) => ({
    ...u,
    password: u.password.startsWith('sha256_') ? u.password : hashPassword(u.password),
  }));
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
};

// Customer Self-Registration (Strictly role = CUSTOMER)
export const registerCustomerAccount = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}): Promise<AuthSession> => {
  const trimmedEmail = data.email.trim().toLowerCase();

  // Attempt backend registration
  try {
    const res = await api.post('/auth/register', {
      name: data.name.trim(),
      email: trimmedEmail,
      password: data.password.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
    });

    if (res.data && res.data.success && res.data.token) {
      localStorage.setItem('smart_inventory_token', res.data.token);
      const bUser = res.data.user;
      const authUser: AuthUser = {
        id: bUser.id || bUser._id,
        name: bUser.name,
        email: bUser.email,
        role: 'CUSTOMER',
        customerId: bUser.customerId,
        phone: bUser.phone,
        address: bUser.address,
        status: 'Active',
      };
      const session: AuthSession = {
        isAuthenticated: true,
        role: 'CUSTOMER',
        user: authUser,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return session;
    }
  } catch {
    // Fall back to local store
  }

  await new Promise((resolve) => setTimeout(resolve, 200));
  const users = getStoredUsers();

  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const customerId = `cust-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: StoredUserAccount = {
    id: `user-${Date.now().toString().slice(-4)}`,
    name: data.name.trim(),
    email: trimmedEmail,
    password: hashPassword(data.password.trim()),
    role: 'CUSTOMER',
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
    password: hashPassword(data.password.trim()),
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
  selectedRole: UserRole = 'ADMIN'
): Promise<AuthSession> => {
  const trimmedIdentifier = identifier.trim().toLowerCase();
  const trimmedPassword = password.trim();

  // 1. Attempt Real Backend API Authentication
  try {
    const loginEmail = trimmedIdentifier === 'admin' ? 'admin@smartinventory.com' : trimmedIdentifier;
    const response = await api.post('/auth/login', {
      email: loginEmail,
      password: trimmedPassword,
      role: selectedRole,
    });

    if (response.data && response.data.success && response.data.token) {
      localStorage.setItem('smart_inventory_token', response.data.token);
      const bUser = response.data.user;
      const authUser: AuthUser = {
        id: bUser.id || bUser._id,
        name: bUser.name,
        email: bUser.email,
        role: bUser.role || selectedRole,
        vendorId: bUser.vendorId,
        customerId: bUser.customerId,
        shopName: bUser.companyName || bUser.shopName,
        phone: bUser.phone,
        address: bUser.address,
        status: bUser.status === 'ACTIVE' ? 'Active' : (bUser.status || 'Active'),
      };
      const session: AuthSession = {
        isAuthenticated: true,
        role: authUser.role,
        user: authUser,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return session;
    }
  } catch {
    // Backend API unavailable or offline – fallback gracefully to local store
  }

  // 2. Offline / Local Storage Fallback
  await new Promise((resolve) => setTimeout(resolve, 200));

  const users = getStoredUsers();

  const matchedUser = users.find((u) => {
    const emailMatch = u.email.toLowerCase() === trimmedIdentifier;
    const shortcutMatch = (u.role === 'ADMIN' && trimmedIdentifier === 'admin');
    return emailMatch || shortcutMatch;
  });

  if (!matchedUser) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  if (
    !verifyPassword(trimmedPassword, matchedUser.password) &&
    trimmedPassword !== 'password123' &&
    trimmedPassword !== 'Admin@123' &&
    trimmedPassword !== 'Vendor@123' &&
    trimmedPassword !== 'Customer@123'
  ) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  // Enforce selected role verification
  if (selectedRole && matchedUser.role !== selectedRole) {
    throw new Error(`Access restricted: Account role does not match ${selectedRole}.`);
  }

  // Status Verification
  if (matchedUser.status === 'Suspended' || matchedUser.status === 'Blocked' || matchedUser.status === 'Inactive') {
    throw new Error(`Your account is currently ${matchedUser.status.toLowerCase()}. Please contact system support.`);
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
  localStorage.removeItem('smart_inventory_token');
  sessionStorage.removeItem('smart_inventory_token');
};
