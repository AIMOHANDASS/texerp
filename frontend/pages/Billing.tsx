
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Transaction, Customer } from '../types';

const Billing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Correctly await asynchronous data fetching in useEffect.
    const fetchData = async () => {
      try {
        const [prods, customers] = await Promise.all([
          api.getProducts(),
          api.getCustomers()
        ]);
        setProducts(prods);
        if (customers.length > 0) {
          setCustomer(customers[0]);
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      }
    };
    fetchData();
  }, []);

  const addToCart = () => {
    if (!selectedProduct) return;
    const item = { ...selectedProduct, billingQty: qty };
    setCart([...cart, item]);
    setSelectedProduct(null);
    setQty(1);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.billingQty), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const processBill = () => {
    if (cart.length === 0) return;
    cart.forEach(item => {
      const tx: Transaction = {
        id: `bill-${Date.now()}-${item.id}`,
        type: 'Sale',
        productId: item.id,
        productName: item.name,
        quantity: item.billingQty,
        unitPrice: item.sellingPrice,
        totalAmount: item.sellingPrice * item.billingQty,
        date: new Date().toISOString(),
        status: 'Paid',
        entityName: customer?.name || 'Walk-in'
      };
      api.addTransaction(tx);
    });
    alert("Billing Successful! Stock Updated.");
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Product Selection */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Manual Entry</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search Product</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg"
                onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                value={selectedProduct?.id || ''}
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.sellingPrice} ({p.stock} left)</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="flex items-end">
                <button onClick={addToCart} className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 shadow-lg font-bold">Add to Bill</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Customer Details</h3>
          <p className="text-sm font-medium">{customer?.name}</p>
          <p className="text-xs text-slate-500">{customer?.phone} | {customer?.email}</p>
        </div>
      </div>

      {/* Right: Cart & Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold">Order Summary</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500">₹{item.sellingPrice} x {item.billingQty}</p>
              </div>
              <p className="font-bold">₹{item.sellingPrice * item.billingQty}</p>
            </div>
          ))}
          {cart.length === 0 && <p className="text-center text-slate-400 py-10 italic">Your bill is empty</p>}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>GST (18%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-300">
            <span>Total Payable</span>
            <span className="text-blue-600">₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={processBill} 
            disabled={cart.length === 0}
            className="w-full bg-green-600 text-white py-4 rounded-xl mt-4 font-bold text-lg hover:bg-green-700 disabled:bg-slate-300 shadow-lg transition-transform active:scale-95"
          >
            Confirm & Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
