
    import React from 'react';
    import BottomNavBar from '@/components/shared/BottomNavBar.jsx';

    const Layout = ({ children }) => {
      return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <main className="flex-grow container mx-auto px-4 py-6 pb-20 sm:pb-6">
            {children}
          </main>
          <BottomNavBar />
          {/* Removed the old footer, can add a new one if needed */}
        </div>
      );
    };

    export default Layout;
  