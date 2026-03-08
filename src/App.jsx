import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AddTransactionMobilePage from './pages/AddTransactionMobilePage';
import ReviewPage from './pages/ReviewPage'; // דף סקירה
import ChartsPage from './pages/ChartsPage'; // דף גרפים
import { Toaster } from "@/components/ui/toaster";

const AuthenticatedApp = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/" />} />
      
      <Route path="/" element={currentUser ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="add-transaction" element={<AddTransactionMobilePage />} />
        
        {/* שני דפים נפרדים לגמרי */}
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
          <AuthenticatedApp />
          <Toaster />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;