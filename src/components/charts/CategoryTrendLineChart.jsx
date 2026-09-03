import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils.js';
import EmptyState from '@/components/shared/EmptyState.jsx';
import { PieChart as PieChartIcon } from 'lucide-react';

const CategoryTrendLineChart = ({ 
  data, 
  title, 
  icon: Icon, 
  categoryInfo, 
  onDetailsClick,
  className = "h-full"
}) => {
  return (
    <Card className={`clean-card overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <CardTitle className="text-base font-bold">
            {title}
          </CardTitle>
        </div>
        {categoryInfo && onDetailsClick && (
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={onDetailsClick}>
            פירוט
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 mt-2 h-full flex flex-col justify-center">
        {!categoryInfo ? (
          <div className="h-[220px] flex items-center justify-center text-center bg-muted/20 rounded-md border border-dashed border-muted/50 p-4">
            <EmptyState icon={PieChartIcon} title="בחר קטגוריה" description="לחץ על קטגוריה בעוגת ההוצאות כדי לראות את המגמה שלה." />
          </div>
        ) : (
          <div className="h-[220px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'הוצאות']} labelFormatter={(label) => `חודש ${label}`} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                <Line type="monotone" dataKey="amount" name="amount" stroke={categoryInfo?.colorHex || "#8b5cf6"} strokeWidth={3} dot={{ r: 4, fill: categoryInfo?.colorHex || "#8b5cf6" }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryTrendLineChart;