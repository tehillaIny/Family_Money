import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnnualBalance } from '@/components/shared/AnnualBalance.jsx';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/40 shadow-sm"
    >
      <nav className="container mx-auto px-4 py-2 flex flex-col justify-center items-center gap-2">
        {/* לוגו לחיץ שמוביל לדף הבית */}
        <NavLink to="/" className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
             <img 
               src="/logo.png" 
               alt="Family Money" 
               className="h-16 w-auto object-contain rounded-xl mix-blend-multiply dark:mix-blend-normal"
             />
        </NavLink>
        
        {/* הרכיב של המאזן השנתי שנשמר */}
        <div className="scale-90 opacity-90"> 
            <AnnualBalance />
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;