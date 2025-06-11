import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, PlusCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'דף הבית' },
    { path: '/transactions', icon: CreditCard, label: 'התנועות שלי' },
    { path: '/add-transaction', icon: PlusCircle, label: 'הוספת תנועה' },
    { path: '/settings', icon: Settings, label: 'הגדרות' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t">
      <div className="flex justify-around items-center h-16 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className="relative"
              onClick={() => navigate(item.path)}
            >
              <Icon className="h-6 w-6" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav; 