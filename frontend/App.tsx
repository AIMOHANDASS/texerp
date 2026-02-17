
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Purchase from './pages/Purchase';
import Billing from './pages/Billing';
import ECommerce from './pages/ECommerce';
import Payments from './pages/Payments';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'purchase': return <Purchase />;
      case 'sales': return <Billing />;
      case 'payments': return <Payments />;
      case 'ecommerce': return <ECommerce />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
