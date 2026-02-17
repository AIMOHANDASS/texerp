
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Purchase from './pages/Purchase';
import Billing from './pages/Billing';
import ECommerce from './pages/ECommerce';
import Payments from './pages/Payments';
import OrderHistory from './pages/OrderHistory';
import AuthPage from './pages/AuthPage';
import { api } from './services/api';
import { User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Set default tab based on role
      setActiveTab(user.role === 'Admin' ? 'dashboard' : 'ecommerce');
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'Admin' ? 'dashboard' : 'ecommerce');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black tracking-widest uppercase">Initializing TexFlow...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return currentUser.role === 'Admin' ? <Dashboard onNavigate={setActiveTab} /> : <ECommerce />;
      case 'inventory': 
        return currentUser.role === 'Admin' ? <Inventory /> : <ECommerce />;
      case 'purchase': 
        return currentUser.role === 'Admin' ? <Purchase /> : <ECommerce />;
      case 'sales': 
        return currentUser.role === 'Admin' ? <Billing /> : <ECommerce />;
      case 'payments': 
        return <Payments />;
      case 'ecommerce': 
        return <ECommerce />;
      case 'order-history': 
        return <OrderHistory />;
      default: 
        return currentUser.role === 'Admin' ? <Dashboard onNavigate={setActiveTab} /> : <ECommerce />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={currentUser} 
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
