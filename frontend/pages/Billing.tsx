
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Transaction, Customer } from '../types';

const Billing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  const fetchData = async () => {
    try {
      const [prods, custs] = await Promise.all([
        api.getProducts(),
        api.getCustomers()
      ]);
      setProducts(prods);
      setCustomers(custs);
      if (!activeCustomer && custs.length > 0) {
        setActiveCustomer(custs.find(c => c.name === 'Walk-in Customer') || custs[0]);
      }
    } catch (error) {
      console.error("Billing fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = () => {
    if (!selectedProduct) return;
    if (qty > selectedProduct.stock) {
      alert("Insufficient stock!");
      return;
    }
    const existing = cart.find(i => i.id === selectedProduct.id);
    if (existing) {
      setCart(cart.map(i => i.id === selectedProduct.id ? { ...i, billingQty: Math.min(i.billingQty + qty, selectedProduct.stock) } : i));
    } else {
      setCart([...cart, { ...selectedProduct, billingQty: qty }]);
    }
    setSelectedProduct(null);
    setQty(1);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.billingQty), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const processBill = async () => {
    if (cart.length === 0) return;
    
    const promises = cart.map(item => {
      const itemSubtotal = item.sellingPrice * item.billingQty;
      const itemGst = itemSubtotal * 0.18;
      const tx: Partial<Transaction> = {
        type: 'Sale',
        productId: item.id,
        productName: item.name,
        quantity: item.billingQty,
        unitPrice: item.sellingPrice,
        taxAmount: itemGst,
        totalAmount: Math.round(itemSubtotal + itemGst),
        status: 'Paid',
        entityName: activeCustomer?.name || 'Walk-in Customer'
      };
      return api.addTransaction(tx);
    });
    
    await Promise.all(promises);
    alert(`Invoice finalized for ${activeCustomer?.name}. Total: ₹${Math.round(total)}`);
    setCart([]);
    fetchData();
  };

  const handleAddNewCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };
    const savedCust = await api.saveCustomer(newCustData);
    setCustomers(prev => [...prev, savedCust]);
    setActiveCustomer(savedCust);
    setIsAddingNewCustomer(false);
    setIsClientModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column: POS Entry */}
      <div className="lg:col-span-7 space-y-8">
        <div className="glass-card p-12 rounded-[3.5rem] border border-white/60">
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-12">Point of Sale</h3>
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Search Catalog</label>
              <div className="relative">
                <select 
                  className="w-full px-8 py-6 glass-input rounded-3xl font-extrabold text-slate-800 outline-none appearance-none cursor-pointer"
                  onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                  value={selectedProduct?.id || ''}
                >
                  <option value="">Scan SKU or select item...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.sellingPrice}) — {p.stock} left</option>
                  ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5"/></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  value={qty} 
                  onChange={(e) => setQty(Number(e.target.value))} 
                  className="w-full px-8 py-6 glass-input rounded-3xl font-extrabold text-slate-800 outline-none" 
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={addToCart} 
                  className="w-full md:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Append to Bill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Badge */}
        <div className="glass-card p-10 rounded-[2.5rem] flex items-center justify-between border border-white/60">
          <div className="flex items-center gap-8">
            <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
               <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-none">Active Customer</p>
               <h4 className="text-3xl font-black text-slate-900 tracking-tight">{activeCustomer?.name}</h4>
               <p className="text-sm font-bold text-slate-400 tracking-[0.1em]">{activeCustomer?.phone}</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsClientModalOpen(true); setIsAddingNewCustomer(false); }}
            className="px-10 py-4 border-2 border-slate-100 text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
          >
            Switch Client
          </button>
        </div>
      </div>

      {/* Right Column: Invoice Summary */}
      <div className="lg:col-span-5">
        <div className="glass-card rounded-[4.5rem] overflow-hidden border border-white/60 shadow-3xl h-full flex flex-col">
          <div className="p-12 bg-white/40 border-b border-white/40">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Active Invoice</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-12 space-y-10 min-h-[400px]">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start group">
                <div className="space-y-2">
                  <p className="font-black text-slate-900 text-2xl leading-tight">{item.name}</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">₹{item.sellingPrice.toLocaleString()} × {item.billingQty}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-2xl tracking-tighter">₹{(item.sellingPrice * item.billingQty).toLocaleString()}</p>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity mt-2">Void Item</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-32 text-center">
                <p className="opacity-20 font-black uppercase text-xs tracking-[0.5em] text-slate-400">Scan items to begin checkout</p>
              </div>
            )}
          </div>
          <div className="p-12 bg-white/20 border-t border-white/60 space-y-6">
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
              <span>Subtotal</span>
              <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
              <span>Tax (GST 18%)</span>
              <span className="text-slate-900">₹{gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-10 border-t border-slate-200">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">Payable</span>
              <span className="text-7xl font-black text-indigo-600 tracking-tighter">₹{Math.round(total).toLocaleString()}</span>
            </div>
            <button 
              onClick={processBill} 
              disabled={cart.length === 0}
              className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] mt-12 font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
            >
              Finalize Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Switch Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-2xl">
          <div className="bg-white/95 glass-card rounded-[4rem] w-full max-w-lg p-16 shadow-[0_32px_100px_rgba(0,0,0,0.15)] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Manage Client</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
              </button>
            </div>

            {isAddingNewCustomer ? (
              <form onSubmit={handleAddNewCustomer} className="space-y-8">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Full Identity Name</label>
                    <input name="name" required placeholder="John Doe" className="w-full px-8 py-6 glass-input rounded-3xl font-extrabold text-slate-800 outline-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Contact Phone</label>
                    <input name="phone" required placeholder="+91 00000 00000" className="w-full px-8 py-6 glass-input rounded-3xl font-extrabold text-slate-800 outline-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Digital Correspondence</label>
                    <input name="email" placeholder="john@example.com" className="w-full px-8 py-6 glass-input rounded-3xl font-extrabold text-slate-800 outline-none" />
                 </div>
                 <div className="flex gap-6 pt-6">
                    <button type="button" onClick={() => setIsAddingNewCustomer(false)} className="flex-1 py-6 text-slate-400 font-black text-xs uppercase tracking-widest">Discard</button>
                    <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Create & Select</button>
                 </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="max-h-80 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {customers.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { setActiveCustomer(c); setIsClientModalOpen(false); }}
                      className={`w-full text-left p-6 rounded-[2rem] transition-all border-2 ${activeCustomer?.id === c.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{c.name}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{c.phone}</p>
                        </div>
                        {activeCustomer?.id === c.id && (
                          <div className="bg-indigo-500 rounded-full p-2">
                             <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsAddingNewCustomer(true)}
                  className="w-full py-6 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-100 transition-all border-2 border-indigo-100/50"
                >
                  + Add New Client
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Billing;
