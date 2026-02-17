
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { User } from '../types';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Filter navigation items based on role
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: ICONS.Dashboard, roles: ['Admin'] },
    { id: 'inventory', name: 'Inventory', icon: ICONS.Inventory, roles: ['Admin'] },
    { id: 'purchase', name: 'Purchases', icon: ICONS.Purchase, roles: ['Admin'] },
    { id: 'sales', name: 'Sales & Billing', icon: ICONS.Billing, roles: ['Admin'] },
    { id: 'payments', name: 'Invoices', icon: ICONS.Payments, roles: ['Admin', 'User'] },
    { id: 'order-history', name: 'Order History', icon: ICONS.History, roles: ['Admin', 'User'] },
    { id: 'ecommerce', name: 'Storefront', icon: ICONS.Ecommerce, roles: ['Admin', 'User'] },
  ].filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    api.logout();
    onLogout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-24'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <span className="font-black text-xs">T</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">TexFlow</h1>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <item.icon className={`h-6 w-6 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className={`flex items-center gap-4 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-50 flex-shrink-0">
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2.5"/></svg>
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 truncate leading-none mb-1">{user.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2.5"/></svg>
            {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-10 py-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter capitalize leading-none">{activeTab.replace('-', ' ')}</h2>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Central Console</p>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
