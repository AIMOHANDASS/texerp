
import { Product, Transaction, Supplier, Customer, Category } from '../types';

const BASE_URL = 'http://localhost:5000/api';

// Keys for LocalStorage fallback
const STORAGE_KEYS = {
  PRODUCTS: 'texflow_fallback_products',
  TRANSACTIONS: 'texflow_fallback_transactions',
  SUPPLIERS: 'texflow_fallback_suppliers',
  CUSTOMERS: 'texflow_fallback_customers'
};

// Initial Mock Data
const MOCK_PRODUCTS: Product[] = [
  { id: 'm1', name: 'Cotton Silk Blend', category: Category.Fabric, sku: 'TEX-M001', variant: 'Gold / 100m', costPrice: 500, sellingPrice: 850, stock: 45, description: 'Luxury cotton silk blend for high-end garments.', image: 'https://picsum.photos/seed/texm1/200/200' },
  { id: 'm2', name: 'Microfiber Towel', category: Category.Towel, sku: 'TEX-M002', variant: 'Blue / Set of 4', costPrice: 200, sellingPrice: 450, stock: 12, description: 'Quick-dry microfiber towels.', image: 'https://picsum.photos/seed/texm2/200/200' }
];

const MOCK_TRANSACTIONS: Transaction[] = [];
const MOCK_SUPPLIERS: Supplier[] = [{ id: 'ms1', name: 'Local Fabrics Co', contact: '1234567890', email: 'contact@localfabrics.com' }];
const MOCK_CUSTOMERS: Customer[] = [{ id: 'mc1', name: 'Walk-in Customer', phone: '9999999999', email: 'walkin@example.com' }];

/**
 * Hybrid fetcher: Tries the server, falls back to LocalStorage.
 * Updates LocalStorage whenever server data is successfully fetched.
 */
const hybridRequest = async (url: string, key: string, defaultValue: any, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(3000) // 3 second timeout to avoid long hangs
    });
    
    if (response.ok) {
      const data = await response.json();
      // On success, if it's a GET, update the cache
      if (!options || options.method === 'GET') {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    }
  } catch (error) {
    // Silently handle "Failed to fetch" - we expect this if the user hasn't started the backend
  }

  // Fallback to LocalStorage
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);
  
  // Final fallback to Mock data
  return defaultValue;
};

export const api = {
  getProducts: async (): Promise<Product[]> => {
    return hybridRequest(`${BASE_URL}/products`, STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
  },

  saveProduct: async (product: Partial<Product>) => {
    const method = product.id ? 'PATCH' : 'POST';
    const url = product.id ? `${BASE_URL}/products/${product.id}` : `${BASE_URL}/products`;
    
    // Always update local storage first for immediate UI feedback
    const localProds = await api.getProducts();
    if (product.id) {
      const index = localProds.findIndex(p => p.id === product.id);
      if (index > -1) localProds[index] = { ...localProds[index], ...product } as Product;
    } else {
      const newProd = { ...product, id: `local-${Date.now()}` } as Product;
      localProds.push(newProd);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(localProds));

    // Then try to hit the server
    return hybridRequest(url, STORAGE_KEYS.PRODUCTS, product, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },

  deleteProduct: async (id: string) => {
    // Update local storage
    const localProds = (await api.getProducts()).filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(localProds));

    // Try server
    try {
      await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return hybridRequest(`${BASE_URL}/transactions`, STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
  },

  addTransaction: async (transaction: Partial<Transaction>) => {
    // Update local storage (Ledger)
    const localTxs = await api.getTransactions();
    const newTx = { ...transaction, id: `tx-${Date.now()}`, date: new Date().toISOString() } as Transaction;
    localTxs.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(localTxs));

    // Sync stock locally
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
      body: JSON.stringify(transaction),
    });
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    return hybridRequest(`${BASE_URL}/suppliers`, STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
  },

  getCustomers: async (): Promise<Customer[]> => {
    return hybridRequest(`${BASE_URL}/customers`, STORAGE_KEYS.CUSTOMERS, MOCK_CUSTOMERS);
  },

  downloadReport: (type: string, data: any[]) => {
    if (!data || data.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0] || {}).join(",") + "\n"
      + data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
