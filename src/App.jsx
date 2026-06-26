import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AddTransactionMobilePage from './pages/AddTransactionMobilePage';
import ReviewPage from './pages/ReviewPage';
import ChartsPage from './pages/ChartsPage';
import { Toaster } from "@/components/ui/toaster";
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const BackButtonHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1);
        } else {
          CapacitorApp.exitApp();
        }
      });

      return () => {
        backButtonListener.remove();
      };
    }
  }, [navigate]);

  return null;
};

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/" />} />
      
      <Route path="/" element={currentUser ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="add-transaction" element={<AddTransactionMobilePage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="charts" element={<ChartsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <BackButtonHandler />
          <AuthenticatedApp />
          <Toaster />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;