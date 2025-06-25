import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useData } from '@/hooks/useData.jsx';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useSwipeable } from 'react-swipeable';

const MonthNavigator = () => {
  const { currentDate, setCurrentDate } = useData();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const formattedDate = format(currentDate, 'LLLL yyyy', { locale: he });

  // הגדרות החלקה
  const handlers = useSwipeable({
    onSwipedLeft: () => changeMonth(1), // החלקה שמאלה => קדימה
    onSwipedRight: () => changeMonth(-1), // החלקה ימינה => אחורה
    delta: 30, // רגישות (pixels)
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true, // שימושי גם במחשב
  });

  return (
    <div
      {...handlers}
      className="flex items-center justify-center gap-4 my-6 p-3 bg-card rounded-lg shadow cursor-grab select-none touch-pan-y"
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
  );
};

export default MonthNavigator;
