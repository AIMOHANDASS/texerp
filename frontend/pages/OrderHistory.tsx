
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction, User } from '../types';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = api.getCurrentUser();
    setCurrentUser(user);

    const fetchOrders = async () => {
      const allTxs = await api.getTransactions();
      const sales = allTxs.filter(t => t.type === 'Sale');
      
      // Strict data isolation
      if (user && user.role !== 'Admin') {
        // Only show orders belonging to this userId
        setOrders(sales.filter(o => o.userId === user.id));
      } else {
        // Admin sees everything
        setOrders(sales);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Order History</h2>
          <p className="text-sm text-slate-500 font-medium">Track your personal purchase history and deliveries.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search my orders..." 
            className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-xs outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
        </div>
      </div>

      <div className="glass-card rounded-[3.5rem] border border-white/60 shadow-3xl overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50/30 border-b border-slate-50">
            <tr>
              <th className="px-10 py-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Order ID</th>
              <th className="px-10 py-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Date</th>
              <th className="px-10 py-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Items</th>
              <th className="px-10 py-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Qty</th>
              <th className="px-10 py-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-10 py-10 text-xs font-mono font-black text-indigo-400/50">#{order.id.slice(-6).toUpperCase()}</td>
                <td className="px-10 py-10 text-sm font-bold text-slate-500">{new Date(order.date).toLocaleDateString()}</td>
                <td className="px-10 py-10">
                   <p className="text-lg font-black text-slate-900 tracking-tight">{order.productName}</p>
                   {currentUser?.role === 'Admin' && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{order.entityName}</span>}
                </td>
                <td className="px-10 py-10 font-bold text-slate-400">{order.quantity} units</td>
                <td className="px-10 py-10 text-3xl font-black text-right text-slate-900 tracking-tighter">₹{order.totalAmount.toLocaleString()}</td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={5} className="py-40 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] opacity-40 italic">You have no order history yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;
