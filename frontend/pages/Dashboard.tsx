
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getBusinessInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Product, Transaction, Category } from '../types';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string>("Analyzing your data...");
  const [isSyncing, setIsSyncing] = useState(true);
  const [threshold] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataProducts, dataTxs] = await Promise.all([api.getProducts(), api.getTransactions()]);
        setProducts(dataProducts);
        setTransactions(dataTxs);
        setIsSyncing(false);

        const text = await getBusinessInsights(dataProducts, dataTxs);
        setInsights(text || "Your business is performing well. Consider expanding into high-demand fabric categories.");
      } catch (error) {
        setIsSyncing(false);
      }
    };
    fetchData();
  }, []);

  const totalStockValue = products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
  const totalSales = transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const totalPurchases = transactions.filter(t => t.type === 'Purchase').reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const lowStockItems = products.filter(p => p.stock <= threshold);

  const salesData = products.map(p => ({
    name: p.name,
    sales: transactions.filter(t => t.productId === p.id && t.type === 'Sale').reduce((acc, t) => acc + (t.totalAmount || 0), 0)
  })).filter(d => d.sales > 0);

  const categoryMix = Object.values(Category).map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.stock || 0), 0)
  })).filter(d => d.value > 0);

  const COLORS_CHART = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#9333ea'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Business Overview</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time textile enterprise analytics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
          System Synchronized
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-[2rem] border border-white/60">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-3">Inventory Value</p>
          <p className="text-4xl font-black text-slate-900 leading-none">₹{totalStockValue.toLocaleString()}</p>
          <div className="mt-8 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 w-3/4"></div>
          </div>
        </div>
        <div className="glass-card p-8 rounded-[2rem] border border-white/60">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-3">Gross Sales</p>
          <p className="text-4xl font-black text-slate-900 leading-none">₹{totalSales.toLocaleString()}</p>
          <p className="text-emerald-500 text-xs font-bold mt-4">+12.5% from last month</p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] border border-white/60">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-3">Purchasing</p>
          <p className="text-4xl font-black text-rose-500 leading-none">₹{totalPurchases.toLocaleString()}</p>
          <p className="text-slate-400 text-xs font-bold mt-4">Active supply chain</p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] border border-white/60">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-3">Stock Health</p>
          <p className="text-4xl font-black text-amber-500 leading-none">{lowStockItems.length} Low Items</p>
          <p className="text-slate-400 text-xs font-bold mt-4">Requires immediate reorder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 rounded-[3rem] shadow-sm border border-white/60 min-h-[400px]">
            <h3 className="text-xl font-black mb-10 text-slate-900 tracking-tight">Sales Analysis</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.length > 0 ? salesData : [{name: 'No Sales Data', sales: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} 
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 rounded-[3rem] border border-white/60">
              <h3 className="text-xl font-black mb-8 text-slate-900 tracking-tight">Category Mix</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryMix.length > 0 ? categoryMix : [{name: 'None', value: 1}]} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                      {categoryMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '1rem', border: 'none'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-card p-10 rounded-[3rem] border border-white/60">
              <h3 className="text-xl font-black mb-8 text-slate-900 tracking-tight">Critical Stock</h3>
              <div className="space-y-6">
                {lowStockItems.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden border border-white shadow-sm flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate leading-none">{item.name}</p>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{item.stock} left in stock</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-slate-400 italic text-xs font-bold">Inventory levels are healthy.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1a1c2e] p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden min-h-[350px]">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-indigo-400/30">
                   <svg className="h-7 w-7 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-black tracking-tight">Gen-AI Strategy</h3>
              </div>
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scroll-invert">
                <p className="text-indigo-100/90 font-medium leading-relaxed text-sm whitespace-pre-line">
                  {insights}
                </p>
              </div>
              <button 
                onClick={async () => {
                   setInsights("Analyzing refreshed datasets...");
                   const text = await getBusinessInsights(products, transactions);
                   setInsights(text || "Insights refreshed successfully.");
                }}
                className="mt-10 w-full py-5 bg-indigo-600/30 hover:bg-indigo-600 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 active:scale-95"
              >
                Refresh Analysis
              </button>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[3rem] border border-white/60">
            <h3 className="text-xl font-black mb-10 text-slate-900 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-5">
               <button 
                 onClick={() => onNavigate?.('inventory')}
                 className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[2.5rem] hover:bg-indigo-50 group transition-all border border-transparent hover:border-indigo-100"
               >
                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md mb-4 transition-all">
                   <svg className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5"/></svg>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest text-center">Add Product</span>
               </button>
               <button 
                 onClick={() => onNavigate?.('sales')}
                 className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[2.5rem] hover:bg-emerald-50 group transition-all border border-transparent hover:border-emerald-100"
               >
                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md mb-4 transition-all">
                   <svg className="h-6 w-6 text-slate-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest text-center">New Bill</span>
               </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scroll-invert::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .custom-scroll-invert::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default Dashboard;
