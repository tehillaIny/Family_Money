import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const MonthNavigator = () => {
  const { currentDate, setCurrentDate } = useData();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const formattedDate = format(currentDate, 'LLLL yyyy', { locale: he });

  return (
    <motion.div 
      className="flex items-center justify-center space-x-4 my-6 p-3 bg-card rounded-lg shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.x < -50) {
          changeMonth(1); // swipe left, next month
        } else if (info.offset.x > 50) {
          changeMonth(-1); // swipe right, previous month
        }
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="hover:bg-primary/10 transition-colors">
        <ChevronRight className="h-6 w-6 text-primary" />
      </Button>
      <motion.h2 
        key={formattedDate} 
        className="text-lg sm:text-xl font-semibold text-primary w-40 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {formattedDate}
      </motion.h2>
      <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="hover:bg-primary/10 transition-colors">
        <ChevronLeft className="h-6 w-6 text-primary" />
      </Button>
    </motion.div>
  );
};

export default MonthNavigator;
  