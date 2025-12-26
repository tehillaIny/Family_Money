import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/DataContext.jsx';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx'; // ייבוא ה-Context החדש

import DashboardPage from '@/pages/DashboardPage.jsx';
import TransactionsPage from '@/pages/TransactionsPage.jsx';
import ReviewPage from '@/pages/ReviewPage.jsx';
import AddTransactionMobilePage from '@/pages/AddTransactionMobilePage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import ChartsPage from './pages/ChartsPage';
import SideMenu from './components/shared/SideMenu';
import BottomNavBar from './components/shared/BottomNavBar';
import LoginPage from '@/pages/LoginPage.jsx'; // דף ההתחברות החדש

// רכיב "שומר סף" - בודק אם המשתמש מחובר
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  // אם יש משתמש - מציג את התוכן. אם לא - זורק לדף לוגין
  return currentUser ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    // עוטפים את הכל ב-AuthProvider כדי שנוכל לדעת מי המשתמש
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* --- נתיב ציבורי (פתוח לכולם): דף התחברות --- */}
              <Route path="/login" element={<LoginPage />} />

              {/* --- נתיבים פרטיים (רק למחוברים) --- */}
              {/* כל נתיב אחר (*) ייכנס לכאן ויעבור בדיקה */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    {/* המבנה הפנימי של האפליקציה - מופיע רק למחוברים */}
                    <>
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
                    </>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;