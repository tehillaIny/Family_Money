import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, Plus, ArrowRightLeft, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { to: '/review', label: 'סקירה', icon: Activity },
  { to: '/', label: 'ראשי', icon: LayoutDashboard },
  { to: '/add-transaction', label: 'הוספה', icon: Plus, isCentral: true },
  { to: '/transactions', label: 'עסקאות', icon: ArrowRightLeft },
  { to: '/charts', label: 'גרפים', icon: PieChart },
];

const BottomNavBar = () => {
  const location = useLocation();
  
  if (location.pathname === '/add-transaction') {
    return null;
  }

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-top-md z-50 h-16"
    >
      <ul className="flex justify-around items-center h-full max-w-md mx-auto px-2" dir="rtl">
        {navItems.map((item) => {
          // תומך גם בנתיב / וגם בנתיב /dashboard ליתר ביטחון
          const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/dashboard');
          
          return (
          <li key={item.to} className={`flex-1 ${item.isCentral ? 'relative' : ''}`}>
            <NavLink
              to={item.to}
              className={() =>
                `flex flex-col items-center justify-center w-full h-full rounded-md text-[10px] font-medium transition-all duration-200 ease-in-out
                ${ item.isCentral ? 'absolute -top-7 left-1/2 -translate-x-1/2' : ''}
                ${ isActive && !item.isCentral ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`
              }
            >
              {item.isCentral ? (
                <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-transform">
                   <item.icon className="h-6 w-6 stroke-[2.5px]" />
                </div>
              ) : (
                <>
                  <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        )})}
      </ul>
    </motion.nav>
  );
};

export default BottomNavBar;