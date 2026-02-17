
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Product, CartItem, Transaction, User } from '../types';

const ECommerce: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [formError, setFormError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const data = await api.getProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCustomerName(user.name);
      setCustomerPhone(user.phone || '');
      const savedCart = api.getCart(user.id);
      setCart(savedCart);
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (currentUser) {
      api.saveCart(currentUser.id, cart);
    }
  }, [cart, currentUser]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cartQuantity: Math.max(1, item.cartQuantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const placeOrder = async () => {
    setFormError('');
    if (cart.length === 0) return;
    
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setFormError("Identity, Contact, and Shipping Address are all mandatory.");
      return;
    }
    
    const promises = cart.map(item => {
      const itemSubtotal = item.sellingPrice * item.cartQuantity;
      const itemTax = itemSubtotal * 0.18;
      const tx: Partial<Transaction> = {
        type: 'Sale',
        productId: item.id,
        productName: item.name,
        quantity: item.cartQuantity,
        unitPrice: item.sellingPrice,
        taxAmount: itemTax,
        totalAmount: Math.round(itemSubtotal + itemTax),
        status: 'Paid',
        entityName: customerName,
        customerPhone: customerPhone,
        shippingAddress: shippingAddress
      };
      return api.addTransaction(tx);
    });

    await Promise.all(promises);
    setCart([]);
    setShippingAddress('');
    setIsCartOpen(false);
    alert(`Success! Your order is placed.\nRecipient: ${customerName}\nDelivering to: ${shippingAddress}`);
    fetchProducts(); 
  };

  return (
    <div className="relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">Digital Storefront</h3>
          <p className="text-slate-500 font-medium">Welcome back, {currentUser?.name}! Browse our premium collections.</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="group flex items-center gap-3 bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all"
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {cart.reduce((a, c) => a + c.cartQuantity, 0)}
              </span>
            )}
          </div>
          <span className="font-bold text-slate-700">My Bag</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-96 bg-slate-100 rounded-[2rem]"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="glass-card rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="h-64 relative overflow-hidden">
                <img 
                  src={product.image || `https://picsum.photos/seed/${product.id}/500/400`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={product.name}
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-indigo-600 rounded-xl shadow-sm border border-white/50">{product.category}</span>
                </div>
              </div>
              <div className="p-8">
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{product.name}</h4>
                <p className="text-slate-500 text-xs font-medium mt-2 line-clamp-2 h-8">{product.description}</p>
                <div className="flex items-center justify-between mt-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</p>
                    <span className="text-2xl font-black text-slate-900">₹{product.sellingPrice.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => addToCart(product)} 
                    disabled={product.stock <= 0}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      product.stock > 0 
                        ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg active:scale-95' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-3xl flex flex-col p-10 animate-slide-left overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">My Bag</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex gap-5 pb-6 border-b border-slate-50 group">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-50 shadow-inner flex-shrink-0">
                    <img src={item.image} className="h-full w-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h5 className="font-bold text-slate-800">{item.name}</h5>
                      <p className="font-black text-slate-900">₹{(item.sellingPrice * item.cartQuantity).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">₹{item.sellingPrice} per unit</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 px-2 border border-slate-100">
                        <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold">-</button>
                        <span className="text-sm font-black w-8 text-center">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 ml-auto">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Bag empty</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-8 space-y-6 pt-6 border-t border-slate-50">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Identity Name *</label>
                    <input 
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className={`w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-800 outline-none border ${!customerName.trim() && formError ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Contact Number *</label>
                    <input 
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone Number"
                      className={`w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-800 outline-none border ${!customerPhone.trim() && formError ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Shipping Address *</label>
                    <textarea 
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter full shipping/delivery address..."
                      className={`w-full px-6 py-4 glass-input rounded-2xl font-bold text-slate-800 outline-none min-h-[100px] border ${!shippingAddress.trim() && formError ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Tax (GST 18%)</span>
                    <span className="font-bold text-slate-600 text-sm">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Total Payable</span>
                    <span className="text-4xl font-black text-indigo-600 tracking-tighter">₹{Math.round(total).toLocaleString()}</span>
                  </div>
                  
                  {formError && (
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">{formError}</p>
                  )}

                  <button 
                    onClick={placeOrder} 
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    Complete Purchase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-left { animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default ECommerce;
