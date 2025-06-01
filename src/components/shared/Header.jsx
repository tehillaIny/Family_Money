
    import React from 'react';
    import { NavLink } from 'react-router-dom';
    import { Wallet } from 'lucide-react';
    import { motion } from 'framer-motion';

    const Header = () => {
      return (
        <motion.header 
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="bg-card shadow-md sticky top-0 z-50 border-b border-border"
        >
          <nav className="container mx-auto px-4 py-3 flex justify-center items-center">
            <NavLink to="/" className="flex items-center space-x-2 text-2xl font-bold">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-foreground">חשבון בקליק</span>
            </NavLink>
            {/* Navigation items moved to BottomNavBar */}
          </nav>
        </motion.header>
      );
    };

    export default Header;
  