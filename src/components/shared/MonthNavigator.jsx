import React from 'react';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useData } from '@/hooks/useData.jsx';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useSwipeable } from 'react-swipeable';
import { toLocalISOString } from '@/lib/utils.js';
import { motion, AnimatePresence } from 'framer-motion';

const MonthNavigator = () => {
  const { currentDate, setCurrentDate, loadHistoricalData } = useData();

  const now = new Date();
  const isCurrentMonth = 
    currentDate.getMonth() === now.getMonth() && 
    currentDate.getFullYear() === now.getFullYear();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);

    if (offset < 0 && loadHistoricalData) {
      const targetDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const targetDateStr = toLocalISOString(targetDate);
      loadHistoricalData(targetDateStr);
    }
  };

  const handleReturnToCurrent = () => {
    setCurrentDate(new Date());
  };

  const formattedDate = format(currentDate, 'LLLL yyyy', { locale: he });

  const handlers = useSwipeable({
    onSwipedLeft: () => changeMonth(1), 
    onSwipedRight: () => changeMonth(-1), 
    delta: 30, 
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true, 
  });

  return (
    <div className="flex flex-col items-center justify-center my-6">
      
      <div
        {...handlers}
        className="flex items-center justify-center gap-4 p-3 bg-card rounded-lg shadow cursor-grab select-none touch-pan-y w-full sm:w-auto sm:min-w-[300px]"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(1)}
          className="hover:bg-primary/10 transition-colors"
        >
          <ChevronRight className="h-6 w-6 text-primary" />
        </Button>

        <h2 className="text-lg sm:text-xl font-semibold text-primary w-40 text-center">
          {formattedDate}
        </h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(-1)}
          className="hover:bg-primary/10 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-primary" />
        </Button>
      </div>

      <AnimatePresence>
        {!isCurrentMonth && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnToCurrent}
              className="rounded-full h-8 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-all gap-1.5 shadow-sm"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              חזור לחודש הנוכחי
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default MonthNavigator;