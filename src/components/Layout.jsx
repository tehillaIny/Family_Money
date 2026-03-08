import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavBar from './shared/BottomNavBar';
import SideMenu from './shared/SideMenu';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SideMenu />
      
      <main className="flex-grow container mx-auto px-4 pt-4 pb-32">
        <Outlet />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavBar />
      </div>
    </div>
  );
};

export default Layout;