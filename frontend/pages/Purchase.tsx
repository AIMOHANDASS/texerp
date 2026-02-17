import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Supplier, Transaction } from '../types';
import anime from 'animejs';

const Purchase: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Filter States
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    try {
      const [prods, supps, txs] = await Promise.all([
        api.getProducts(),
        api.getSuppliers(),
        api.getTransactions()
      ]);
      setProducts(prods);
      setSuppliers(supps);
      setTransactions(txs.filter(t => t.type === 'Purchase'));
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      (anime as any)({
        targets: '.purchase-row',
        opacity: [0, 1],
        translateX: [-10, 0],
        delay: anime.stagger(25),
        easing: 'easeOutQuad'
      });
    }
  }, [transactions, supplierFilter, dateRange]);

  const filteredPurchases = transactions.filter(t => {
    const matchesSupplier = supplierFilter === 'All' || t.entityName === supplierFilter;
    const tDate = new Date(t.date).getTime();
    const matchesStart = !dateRange.start || tDate >= new Date(dateRange.start).getTime();
    const matchesEnd = !dateRange.end || tDate <= new Date(dateRange.end).getTime() + 86400000;
    return matchesSupplier && matchesStart && matchesEnd;
  });

  const handlePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prodId = formData.get('productId') as string;
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const tx: Partial<Transaction> = {
      type: 'Purchase',
      productId: prodId,
      productName: prod.name,
      quantity: Number(formData.get('quantity')),
      unitPrice: Number(formData.get('unitPrice')),
      totalAmount: Number(formData.get('quantity')) * Number(formData.get('unitPrice')),
      status: formData.get('paymentStatus') as 'Paid' | 'Pending',
      entityName: formData.get('supplierName') as string
    };

    await api.addTransaction(tx);
    await fetchData();
    setIsModalOpen(false);
  };

  const handleSupplierSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplier: Partial<Supplier> = {
      id: editingSupplier?.id,
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };
    await api.saveSupplier(supplier);
    await fetchData();
    setIsSuppModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Replenishment Engine</h2>
          <p className="text-slate-500 font-bold mt-1">Manage vendor relations and capital flow.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setEditingSupplier(null); setIsSuppModalOpen(true); }} 
            className="px-8 py-4 glass-card bg-white/40 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/60 transition-all border border-white/60"
          >
            Vendor CRM
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-10 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            + New Purchase
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="glass-card p-6 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vendor Filter</label>
          <select 
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-6 py-3 glass-input rounded-2xl font-bold text-slate-700 outline-none"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">From Date</label>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full px-6 py-3 glass-input rounded-2xl font-bold text-slate-700 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">To Date</label>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full px-6 py-3 glass-input rounded-2xl font-bold text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Suppliers List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/50">
            <h4 className="text-lg font-black text-slate-800 tracking-tight mb-6">Registered Vendors</h4>
            <div className="space-y-4">
              {suppliers.map(s => (
                <div key={s.id} className="p-5 bg-white/40 border border-white/60 rounded-[1.5rem] group hover:bg-white/80 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900">{s.name}</p>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{s.contactPerson}</p>
                    </div>
                    <button onClick={() => { setEditingSupplier(s); setIsSuppModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/50 flex gap-4">
                    <div className="text-[9px] font-bold text-slate-500">{s.phone}</div>
                    <div className="text-[9px] font-bold text-slate-500 lowercase">{s.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/50 shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/30">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value (INR)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredPurchases.map(t => (
                  <tr key={t.id} className="purchase-row hover:bg-white/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{new Date(t.date).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">{t.entityName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-extrabold text-slate-800 leading-none">{t.productName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">QTY: {t.quantity} • UNIT: ₹{t.unitPrice}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-lg text-slate-900">₹{t.totalAmount.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'Paid' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200' : 'bg-amber-100/50 text-amber-700 border border-amber-200'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${t.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPurchases.length === 0 && (
              <div className="py-24 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.2em] opacity-50">No restock logs for selected criteria</div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      {isSuppModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
          <div className="bg-white/90 glass-card rounded-[3rem] w-full max-w-md p-12 shadow-3xl animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">{editingSupplier ? 'Vendor Profile' : 'New Vendor'}</h3>
            <form onSubmit={handleSupplierSave} className="space-y-6">
               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Company Legal Name</label>
                 <input name="name" defaultValue={editingSupplier?.name} required className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Key Contact Person</label>
                 <input name="contactPerson" defaultValue={editingSupplier?.contactPerson} required className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone No</label>
                    <input name="phone" defaultValue={editingSupplier?.phone} required className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email ID</label>
                    <input name="email" defaultValue={editingSupplier?.email} className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
                  </div>
               </div>
               <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setIsSuppModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Discard</button>
                 <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all">Save Profile</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
          <div className="bg-white/90 glass-card rounded-[3rem] w-full max-w-lg p-12 shadow-3xl animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">Purchase Manifest</h3>
            <form onSubmit={handlePurchase} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Product Catalog</label>
                <select name="productId" className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none appearance-none">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Quantity</label>
                  <input type="number" name="quantity" required className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Unit Cost (INR)</label>
                  <input type="number" name="unitPrice" required className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Vendor</label>
                  <select name="supplierName" className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none appearance-none">
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Payment Status</label>
                  <select name="paymentStatus" className="w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-700 outline-none appearance-none">
                    <option value="Paid">Cleared / Paid</option>
                    <option value="Pending">Unpaid / Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Authorize Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;