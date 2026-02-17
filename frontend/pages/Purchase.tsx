
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Supplier, Transaction } from '../types';

const Purchase: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [prods, supps, txs] = await Promise.all([
        api.getProducts(),
        api.getSuppliers(),
        api.getTransactions()
      ]);
      setProducts(prods);
      setSuppliers(supps);
      setTransactions(txs);
    } catch (err) {
      console.error("Failed to fetch purchase page data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prodId = formData.get('productId') as string;
    const prod = products.find(p => p.id === prodId);
    
    if (!prod) return;

    const tx: Transaction = {
      id: `purch-${Date.now()}`,
      type: 'Purchase',
      productId: prodId,
      productName: prod.name,
      quantity: Number(formData.get('quantity')),
      unitPrice: Number(formData.get('unitPrice')),
      totalAmount: Number(formData.get('quantity')) * Number(formData.get('unitPrice')),
      date: new Date().toISOString(),
      status: formData.get('paymentStatus') as 'Paid' | 'Pending',
      entityName: formData.get('supplierName') as string
    };

    await api.addTransaction(tx);
    await fetchData(); // Refresh all data including products (stock changes) and history.
    setIsModalOpen(false);
    alert("Purchase Record Added & Stock Updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Purchase Orders</h3>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">
          New Purchase Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Supplier List</h4>
          <div className="space-y-4">
            {suppliers.map(s => (
              <div key={s.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email} | {s.contact}</p>
                </div>
                <button className="text-xs font-bold text-blue-600 uppercase">View Details</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Stock In History</h4>
          <div className="space-y-4">
            {transactions.filter(t => t.type === 'Purchase').slice(-5).reverse().map(t => (
              <div key={t.id} className="p-3 border-l-4 border-slate-900 bg-slate-50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold">{t.productName}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{new Date(t.date).toLocaleDateString()} • {t.entityName}</p>
                </div>
                <p className="text-sm font-bold">+{t.quantity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Create Purchase Entry</h3>
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Product</label>
                <select name="productId" className="w-full p-2 border border-slate-300 rounded-lg">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" name="quantity" required className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Unit Price</label>
                  <input type="number" name="unitPrice" required className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select name="supplierName" className="w-full p-2 border border-slate-300 rounded-lg">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Status</label>
                <select name="paymentStatus" className="w-full p-2 border border-slate-300 rounded-lg">
                  <option>Paid</option>
                  <option>Pending</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg shadow-lg">Confirm Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;
