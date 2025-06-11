import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Calendar } from '@/components/ui/calendar.jsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.jsx';
import { cn } from '@/lib/utils.js';

export function DatePicker({ date, onDateChange, placeholder = 'בחר תאריך', className }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-right font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          {date ? format(date, 'PPP', { locale: he }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          locale={he}
        />
      </PopoverContent>
    </Popover>
  );
} 