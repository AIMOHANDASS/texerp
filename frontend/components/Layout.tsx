
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'inventory', name: 'Inventory', icon: ICONS.Inventory },
    { id: 'purchase', name: 'Purchases', icon: ICONS.Purchase },
    { id: 'sales', name: 'Sales & Billing', icon: ICONS.Billing },
    { id: 'payments', name: 'Payments', icon: ICONS.Payments },
    { id: 'ecommerce', name: 'E-Commerce', icon: ICONS.Ecommerce },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold text-blue-600">TexFlow</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200"></div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">Admin User</p>
                <p className="text-xs text-slate-500">Enterprise Mode</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
