import React from 'react';
import { DollarSign } from 'lucide-react';
import { useData } from '@/hooks/useData.jsx';

const colorMap = {
  'text-blue-500': { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  'text-purple-500': { text: 'text-purple-500', bg: 'bg-purple-500/10' },
  'text-pink-500': { text: 'text-pink-500', bg: 'bg-pink-500/10' },
  'text-orange-500': { text: 'text-orange-500', bg: 'bg-orange-500/10' },
  'text-yellow-500': { text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'text-red-500': { text: 'text-red-500', bg: 'bg-red-500/10' },
  'text-teal-500': { text: 'text-teal-500', bg: 'bg-teal-500/10' },
  'text-cyan-500': { text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'text-lime-500': { text: 'text-lime-500', bg: 'bg-lime-500/10' },
  'text-fuchsia-500': { text: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  'text-sky-500': { text: 'text-sky-500', bg: 'bg-sky-500/10' },
  'text-green-500': { text: 'text-green-500', bg: 'bg-green-500/10' },
  'text-gray-500': { text: 'text-gray-500', bg: 'bg-gray-500/10' },
  'text-emerald-500': { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'text-indigo-500': { text: 'text-indigo-500', bg: 'bg-indigo-500/10' },
};

const CategoryCircleItem = ({ category, x, y, onClick, formatCurrency }) => {
  const { getIconComponent } = useData();
  const IconComponent = getIconComponent(category.iconName) || DollarSign;
  
  const colorClass = category.color || 'text-primary';
  const safeColor = colorMap[colorClass] || { text: colorClass, bg: 'bg-primary/10' };

  return (
    <div
      onClick={() => onClick(category.id)}
      className="absolute flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 group"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        width: '70px',
        zIndex: 20,
      }}
    >
      <div 
        className={`relative rounded-2xl p-3 mb-1.5 flex items-center justify-center shadow-sm group-hover:shadow-md border border-white/50 dark:border-white/10 transition-all duration-300 backdrop-blur-md ${safeColor.bg}`}
      >
          <IconComponent className={`h-5 w-5 ${safeColor.text} drop-shadow-sm`} />
      </div>
      
      <div className="flex flex-col items-center">
          <span className="text-[11px] font-medium text-muted-foreground leading-tight truncate w-full text-center">
          {category.name_he}
          </span>
          <span className="text-xs font-bold text-foreground font-sans">
          {formatCurrency(category.total)}
          </span>
      </div>
    </div>
  );
};

export default CategoryCircleItem;