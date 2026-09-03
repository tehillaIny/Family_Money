import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { formatCurrency } from '@/lib/utils.js';
import EmptyState from '@/components/shared/EmptyState.jsx';

const CustomSimpleBar = (props) => {
  const { x, y, width, height, fill, payload, onClick } = props;
  return (
    <rect 
      x={x} y={y} width={width} height={height} fill={fill} 
      radius={[0, 4, 4, 0]} 
      className="cursor-pointer transition-opacity hover:opacity-80" 
      onClick={() => onClick && onClick({ activePayload: [{ payload }] })} 
    />
  );
};

const RankedBarChart = ({ 
  data, 
  title, 
  icon: Icon, 
  iconColor = "text-primary",
  barColor = "#f59e0b",
  onBarClick, 
  emptyMessage = "אין נתונים בתקופה זו.",
  className = "h-full"
}) => {
  return (
    <Card className={`clean-card overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
        {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 mt-2 h-full flex flex-col justify-center">
        {data.length === 0 ? (
          <EmptyState title="אין נתונים" description={emptyMessage} />
        ) : (
          <div className="h-[220px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                <Bar dataKey="value" fill={barColor} barSize={20} shape={(props) => <CustomSimpleBar {...props} onClick={onBarClick} />}>
                  <LabelList dataKey="value" position="right" formatter={(val) => formatCurrency(val)} style={{fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: '500'}} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankedBarChart;