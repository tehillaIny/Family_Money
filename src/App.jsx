import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/DataContext.jsx';
import Layout from '@/components/Layout.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import TransactionsPage from '@/pages/TransactionsPage.jsx';
import ReviewPage from '@/pages/ReviewPage.jsx';
import AddTransactionMobilePage from '@/pages/AddTransactionMobilePage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import ChartsPage from './pages/ChartsPage';
import SideMenu from './components/shared/SideMenu';
import BottomNavBar from './components/shared/BottomNavBar';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <SideMenu />
          <main className="pb-16">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/add-transaction" element={<AddTransactionMobilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/charts" element={<ChartsPage />} />
            </Routes>
          </main>
          <BottomNavBar />
        </div>
        <Toaster />
      </Router>
    </DataProvider>
  );
}

export default App;
  