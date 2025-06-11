
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

    function App() {
      return (
        <DataProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/add-transaction" element={<AddTransactionMobilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
            <Toaster />
          </Router>
        </DataProvider>
      );
    }

    export default App;
  