
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, CartItem, Transaction } from '../types';

const ECommerce: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Properly await the asynchronous products fetch.
    const fetchProducts = async () => {
      const data = await api.getProducts();
      setProducts(data.slice(0, 5)); // Limit to 5 products as per requirement
    };
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0);

  const placeOrder = () => {
    if (cart.length === 0) return;
    cart.forEach(item => {
      const tx: Transaction = {
        id: `order-${Date.now()}-${item.id}`,
        type: 'Sale',
        productId: item.id,
        productName: item.name,
        quantity: item.cartQuantity,
        unitPrice: item.sellingPrice,
        totalAmount: item.sellingPrice * item.cartQuantity,
        date: new Date().toISOString(),
        status: 'Paid',
        entityName: 'Online Customer'
      };
      api.addTransaction(tx);
    });
    setCart([]);
    setIsCartOpen(false);
    alert("Order Placed Successfully!");
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Textile Store Prototype</h3>
        <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-white border border-slate-200 rounded-full shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
              {cart.reduce((a, c) => a + c.cartQuantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <img src={product.image} className="w-full h-48 object-cover" />
            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">{product.category}</span>
              <h4 className="text-lg font-bold mt-2">{product.name}</h4>
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mt-6">
                <span className="text-xl font-bold">₹{product.sellingPrice}</span>
                <button 
                  onClick={() => addToCart(product)} 
                  disabled={product.stock <= 0}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300"
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Shopping Cart</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 pb-6 border-b border-slate-100">
                  <img src={item.image} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h5 className="font-bold">{item.name}</h5>
                    <p className="text-sm text-slate-500">₹{item.sellingPrice}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 flex items-center justify-center border border-slate-200 rounded text-slate-500">-</button>
                      <span className="text-sm font-bold">{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 flex items-center justify-center border border-slate-200 rounded text-slate-500">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 text-xs font-bold uppercase">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-slate-400 italic mt-20">Your cart is empty.</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium uppercase tracking-widest text-xs">Subtotal</span>
                <span className="text-2xl font-bold">₹{total}</span>
              </div>
              <button onClick={placeOrder} disabled={cart.length === 0} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-200 shadow-xl transition-transform active:scale-95">
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ECommerce;
