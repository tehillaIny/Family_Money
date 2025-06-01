
    import React from 'react';
    import { NavLink, useLocation } from 'react-router-dom';
    import { LayoutDashboard, ListChecks, PieChart, Settings, PlusCircle } from 'lucide-react';
    import { motion } from 'framer-motion';

    const navItems = [
      { to: '/review', label: 'סקירה', icon: PieChart },
      { to: '/transactions', label: 'עסקאות', icon: ListChecks },
      { to: '/add-transaction', label: 'הוספה', icon: PlusCircle, isCentral: true },
      { to: '/dashboard', label: 'ראשי', icon: LayoutDashboard },
      { to: '/settings', label: 'הגדרות', icon: Settings },
    ];

    const BottomNavBar = () => {
      const location = useLocation();
      // Hide nav bar on add transaction page or any other full screen page
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
          <ul className="flex justify-around items-center h-full max-w-md mx-auto px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
              return (
              <li key={item.to} className={`flex-1 ${item.isCentral ? 'relative' : ''}`}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full rounded-md text-xs font-medium transition-all duration-200 ease-in-out
                    ${ item.isCentral ? 'absolute -top-7 left-1/2 -translate-x-1/2' : ''}
                    ${ isActive ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`
                  }
                >
                  {item.isCentral ? (
                    <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90">
                       <item.icon className="h-7 w-7" />
                    </div>
                  ) : (
                    <>
                      <item.icon className="h-5 w-5 mb-0.5" />
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
  