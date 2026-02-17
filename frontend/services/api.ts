
import { Product, Transaction, Supplier, Customer, Category, User } from '../types';

const BASE_URL = 'http://localhost:5000/api';

const STORAGE_KEYS = {
  PRODUCTS: 'texflow_fallback_products',
  TRANSACTIONS: 'texflow_fallback_transactions',
  SUPPLIERS: 'texflow_fallback_suppliers',
  CUSTOMERS: 'texflow_fallback_customers',
  USERS: 'texflow_users',
  CURRENT_USER: 'texflow_session',
  CARTS: 'texflow_user_carts' // Added for per-user cart persistence
};

const MOCK_PRODUCTS: Product[] = [
  { id: 'm1', name: 'Cotton Silk Blend', category: Category.Fabric, sku: 'TEX-M001', variant: 'Gold / 100m', costPrice: 500, sellingPrice: 850, stock: 45, description: 'Luxury cotton silk blend for high-end garments.', image: 'https://picsum.photos/seed/texm1/200/200' },
  { id: 'm2', name: 'Microfiber Towel', category: Category.Towel, sku: 'TEX-M002', variant: 'Blue / Set of 4', costPrice: 200, sellingPrice: 450, stock: 12, description: 'Quick-dry microfiber towels.', image: 'https://picsum.photos/seed/texm2/200/200' }
];

const MOCK_SUPPLIERS: Supplier[] = [{ id: 'ms1', name: 'Local Fabrics Co', contactPerson: 'John Doe', phone: '1234567890', email: 'contact@localfabrics.com' }];
const MOCK_CUSTOMERS: Customer[] = [{ id: 'mc1', name: 'Walk-in Customer', phone: '9999999999', email: 'walkin@example.com' }];

const hybridRequest = async (url: string, key: string, defaultValue: any, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (!options || options.method === 'GET') {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    }
  } catch (error) {}

  const cached = localStorage.getItem(key);
  return cached ? JSON.parse(cached) : defaultValue;
};

export const api = {
  login: async (email: string, password: string): Promise<User | null> => {
    if (email === 'admin@texflow.com' && password === 'admin123') {
      const admin: User = { id: 'admin-1', name: 'Admin User', email: 'admin@texflow.com', role: 'Admin' };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(admin));
      return admin;
    }
    
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  signup: async (userData: Partial<User>): Promise<User> => {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: userData.name || 'Anonymous',
      email: userData.email || '',
      role: 'User',
      phone: userData.phone,
      password: userData.password // In real app, hash this
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return session ? JSON.parse(session) : null;
  },

  // Per-user Cart Management
  getCart: (userId: string) => {
    const carts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARTS) || '{}');
    return carts[userId] || [];
  },

  saveCart: (userId: string, cart: any[]) => {
    const carts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARTS) || '{}');
    carts[userId] = cart;
    localStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts));
  },

  getProducts: async (): Promise<Product[]> => {
    return hybridRequest(`${BASE_URL}/products`, STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
  },

  saveProduct: async (product: Partial<Product>) => {
    const isNew = !product.id || product.id.startsWith('local-');
    const method = isNew ? 'POST' : 'PATCH';
    const url = isNew ? `${BASE_URL}/products` : `${BASE_URL}/products/${product.id}`;
    
    const localProds = await api.getProducts();
    if (!isNew) {
      const index = localProds.findIndex(p => p.id === product.id);
      if (index > -1) localProds[index] = { ...localProds[index], ...product } as Product;
    } else {
      const newProd = { ...product, id: product.id || `local-${Date.now()}` } as Product;
      localProds.push(newProd);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(localProds));

    return hybridRequest(url, STORAGE_KEYS.PRODUCTS, product, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },

  // Added deleteProduct method to handle product removal from both local storage and remote backend
  deleteProduct: async (id: string) => {
    const localProds = await api.getProducts();
    const filteredProds = localProds.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProds));

    try {
      await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(3000)
      });
    } catch (error) {
      console.warn("Could not delete product from backend, using local fallback.");
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return hybridRequest(`${BASE_URL}/transactions`, STORAGE_KEYS.TRANSACTIONS, []);
  },

  addTransaction: async (transaction: Partial<Transaction>) => {
    const currentUser = api.getCurrentUser();
    const localTxs = await api.getTransactions();
    const newTx = { 
      ...transaction, 
      id: transaction.id || `tx-${Date.now()}`, 
      date: new Date().toISOString(),
      userId: currentUser?.id // Tag with current user ID
    } as Transaction;
    localTxs.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(localTxs));

    const localProds = await api.getProducts();
    const prod = localProds.find(p => p.id === transaction.productId);
    if (prod) {
      const change = transaction.type === 'Purchase' ? (transaction.quantity || 0) : -(transaction.quantity || 0);
      prod.stock += change;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(localProds));
    }

    return hybridRequest(`${BASE_URL}/transactions`, STORAGE_KEYS.TRANSACTIONS, newTx, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx),
    });
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    return hybridRequest(`${BASE_URL}/suppliers`, STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
  },

  saveSupplier: async (supplier: Partial<Supplier>) => {
    const localSupps = await api.getSuppliers();
    if (supplier.id) {
      const idx = localSupps.findIndex(s => s.id === supplier.id);
      if (idx > -1) localSupps[idx] = { ...localSupps[idx], ...supplier } as Supplier;
    } else {
      localSupps.push({ ...supplier, id: `supp-${Date.now()}` } as Supplier);
    }
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(localSupps));
    return supplier;
  },

  getCustomers: async (): Promise<Customer[]> => {
    return hybridRequest(`${BASE_URL}/customers`, STORAGE_KEYS.CUSTOMERS, MOCK_CUSTOMERS);
  },

  saveCustomer: async (customer: Partial<Customer>) => {
    const localCusts = await api.getCustomers();
    const newCust = { ...customer, id: customer.id || `cust-${Date.now()}` } as Customer;
    if (customer.id) {
      const idx = localCusts.findIndex(c => c.id === customer.id);
      if (idx > -1) localCusts[idx] = newCust;
    } else {
      localCusts.push(newCust);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(localCusts));
    return newCust;
  },

  downloadReport: (type: string, data: any[]) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] ?? ''}"`).join(','))
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
