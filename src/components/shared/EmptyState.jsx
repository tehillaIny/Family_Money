import React from 'react';
import { FileSearch } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileSearch, 
  title = "אין נתונים", 
  description = "לא נמצאו עסקאות מתאימות לתקופה זו." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center opacity-70">
      <div className="bg-muted/30 p-3 rounded-full mb-3">
        <Icon className="h-8 w-8 text-muted-foreground/70" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
};

export default EmptyState;