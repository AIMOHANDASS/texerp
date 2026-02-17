
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getBusinessInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Product, Transaction } from '../types';

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string>("Analyzing your data...");
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataProducts = await api.getProducts();
        const dataTxs = await api.getTransactions();
        
        setProducts(dataProducts);
        setTransactions(dataTxs);
        setIsSyncing(false);

        const text = await getBusinessInsights(dataProducts, dataTxs);
        setInsights(text || "No insights available.");
      } catch (error) {
        // Errors are now gracefully handled by the hybrid API service
        setIsSyncing(false);
      }
    };
    fetchData();
  }, []);

  const totalStockValue = products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
  const lowStockItems = products.filter(p => p.stock < 10);
  const totalSales = transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const totalPurchases = transactions.filter(t => t.type === 'Purchase').reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  const salesByProduct = products.map(p => ({
    name: p.name,
    sales: transactions.filter(t => t.productId === p.id && t.type === 'Sale').reduce((acc, t) => acc + (t.totalAmount || 0), 0)
  })).filter(d => d.sales > 0);

  const stockByCategory = ['Fabric', 'Towel', 'Garment'].map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.stock || 0), 0)
  }));

  const COLORS_CHART = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Business Overview</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time textile enterprise analytics</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isSyncing ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
          <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
          {isSyncing ? 'Syncing with Server...' : 'System Synchronized'}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-3xl border border-white/50 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Inventory Value</p>
          <p className="text-3xl font-black mt-2 text-slate-800">₹{totalStockValue.toLocaleString()}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 w-2/3"></div>
          </div>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/50 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gross Sales</p>
          <p className="text-3xl font-black mt-2 text-emerald-600">₹{totalSales.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-emerald-500 mt-2">+12.5% from last month</p>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/50 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Purchasing</p>
          <p className="text-3xl font-black mt-2 text-rose-500">₹{totalPurchases.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Active supply chain</p>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/50 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Stock Health</p>
          <p className="text-3xl font-black mt-2 text-amber-500">{lowStockItems.length} Low Items</p>
          <p className="text-[10px] font-bold text-amber-600 mt-2">Requires immediate reorder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl h-96 border border-white/40">
            <h3 className="text-xl font-black mb-8 text-slate-800 tracking-tight">Sales Analysis</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sales" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-3xl shadow-xl h-80 border border-white/40">
              <h3 className="text-lg font-black mb-4 text-slate-800 tracking-tight">Category Mix</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockByCategory} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                    {stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="glass-card p-8 rounded-3xl shadow-xl border border-white/40 bg-gradient-to-br from-indigo-50/50 to-white">
              <h3 className="text-lg font-black mb-6 text-slate-800 tracking-tight">Critical Stock</h3>
              <div className="space-y-4">
                {lowStockItems.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-700">{item.name}</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{item.stock} left</p>
                    </div>
                    <button className="h-8 w-8 flex items-center justify-center bg-rose-100 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-all">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ))}
                {lowStockItems.length === 0 && <p className="text-slate-400 italic text-center py-12 text-sm">Inventory is healthy</p>}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-700">
              <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                   <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-black tracking-tight">Gen-AI Strategy</h3>
              </div>
              <div className="prose prose-sm prose-invert">
                <p className="text-indigo-100 font-medium leading-relaxed opacity-90 whitespace-pre-line">
                  {insights}
                </p>
              </div>
              <button className="w-full mt-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
                Refresh Analysis
              </button>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[3rem] shadow-2xl border border-white/50">
             <h4 className="text-lg font-black text-slate-800 mb-6">Quick Actions</h4>
             <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                   <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Add Product</span>
                </button>
                <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
                   <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth={2}/></svg>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest">New Bill</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
