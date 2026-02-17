
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import anime from 'animejs';

const Payments: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      anime({
        targets: '.ledger-row',
        opacity: [0, 1],
        translateX: [-20, 0],
        delay: anime.stagger(30),
        easing: 'easeOutExpo'
      });
    }
  }, [transactions, searchTerm, typeFilter]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const pendingIncoming = transactions.filter(t => t.type === 'Sale' && t.status === 'Pending').reduce((acc, t) => acc + t.totalAmount, 0);
  const pendingOutgoing = transactions.filter(t => t.type === 'Purchase' && t.status === 'Pending').reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-600 p-10 rounded-[2.5rem] flex justify-between items-center shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.57-.33-3.13-1.1-4.06-2.26l1.45-1.45c.7.83 1.83 1.38 2.61 1.63 1.57.51 3.29-.02 3.29-1.93 0-1.12-.52-1.74-1.45-2.22l-1.55-.79C8.94 10.11 7.4 9.17 7.4 7.21c0-1.79 1.31-3.23 3.19-3.7V2h2.82v1.51c1.39.29 2.58.91 3.42 1.81l-1.45 1.45c-.6-.6-1.44-1.01-1.97-1.18-1.44-.46-2.95.12-2.95 1.76 0 1.05.61 1.61 1.35 1.99l1.55.79c1.94.99 3.12 1.95 3.12 4.1.01 2.05-1.39 3.51-3.51 4.07z"/></svg>
          </div>
          <div className="z-10">
            <p className="text-emerald-100 text-xs font-black uppercase tracking-[0.2em] mb-2">Uncollected Revenue</p>
            <p className="text-5xl font-black">₹{pendingIncoming.toLocaleString()}</p>
          </div>
          <button className="z-10 bg-white text-emerald-700 px-6 py-3 rounded-2xl text-sm font-black shadow-lg hover:shadow-xl transition-all active:scale-95">Collect</button>
        </div>

        <div className="bg-rose-600 p-10 rounded-[2.5rem] flex justify-between items-center shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h18c0.55 0 1-0.45 1-1s-0.45-1-1-1H3c-0.55 0-1 0.45-1 1s0.45 1 1 1zm0-4h18c0.55 0 1-0.45 1-1s-0.45-1-1-1H3c-0.55 0-1 0.45-1 1s0.45 1 1 1zm0 8h18c0.55 0 1-0.45 1-1s-0.45-1-1-1H3c-0.55 0-1 0.45-1 1s0.45 1 1 1z"/></svg>
          </div>
          <div className="z-10">
            <p className="text-rose-100 text-xs font-black uppercase tracking-[0.2em] mb-2">Outstanding Dues</p>
            <p className="text-5xl font-black">₹{pendingOutgoing.toLocaleString()}</p>
          </div>
          <button className="z-10 bg-white text-rose-700 px-6 py-3 rounded-2xl text-sm font-black shadow-lg hover:shadow-xl transition-all active:scale-95">Pay Dues</button>
        </div>
      </div>

      <div className="glass-card rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl mt-12">
        <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h4>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mt-1">Real-time Transaction History</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Filter by client or item..." 
              className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Sale">Sales</option>
              <option value="Purchase">Purchases</option>
            </select>
            <button onClick={() => api.downloadReport('payments', filteredTransactions)} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client/Entity</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Amount</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map(t => (
              <tr key={t.id} className="ledger-row hover:bg-slate-50/80 transition-all opacity-0">
                <td className="px-10 py-6 text-sm font-bold text-slate-500">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-10 py-6">
                  <p className="font-black text-slate-800 text-base">{t.entityName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.productName}</p>
                </td>
                <td className="px-10 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.type === 'Sale' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-10 py-6 font-black text-lg text-slate-900">₹{t.totalAmount.toLocaleString()}</td>
                <td className="px-10 py-6">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'Paid' ? 'bg-emerald-700' : 'bg-amber-700'}`}></span>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No matches found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
