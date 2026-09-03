import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils.js';
import EmptyState from '@/components/shared/EmptyState.jsx';

const renderPercentLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null; 
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const DistributionPieChart = ({ 
  data, 
  title, 
  icon: Icon, 
  onPieClick, 
  selectedId = null, 
  showLegend = false, 
  emptyMessage = "אין נתונים בתקופה זו.",
  className = "h-full"
}) => {
  return (
    <Card className={`clean-card overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 mt-2 flex flex-col items-center h-full">
        {data.length === 0 ? (
          <EmptyState title="אין נתונים" description={emptyMessage} />
        ) : (
          <>
            <div className="h-[220px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data} 
                    cx="50%" cy="50%" 
                    innerRadius={showLegend ? 55 : 45} 
                    outerRadius={85} 
                    paddingAngle={showLegend ? 4 : 2} 
                    dataKey="value" 
                    onClick={(d) => onPieClick && onPieClick(d.payload || d)} 
                    labelLine={false} 
                    label={renderPercentLabel} 
                    className="cursor-pointer focus:outline-none"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.colorHex} 
                        style={{ opacity: selectedId && selectedId !== (entry.id || entry.name) ? 0.3 : 1 }}
                        className="hover:opacity-80 transition-all duration-300" 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                  {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {!showLegend && (
              <div className="flex flex-wrap justify-center gap-3 px-2 pb-2 mt-2">
                {data.map(item => (
                  <div 
                    key={item.id || item.name} 
                    className={`flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 p-1 rounded transition-all duration-300 ${selectedId && selectedId !== (item.id || item.name) ? 'opacity-40 grayscale-[0.5]' : ''}`} 
                    onClick={() => onPieClick && onPieClick(item)}
                  >
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.colorHex }}></div>
                    <span className="text-xs font-medium">{item.name} <span className="text-muted-foreground opacity-70">({formatCurrency(item.value)})</span></span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DistributionPieChart;

