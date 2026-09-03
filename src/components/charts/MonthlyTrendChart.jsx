import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList, ReferenceLine } from 'recharts';
import { LineChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils.js';

const MonthlyTrendChart = ({ data, onBarClick }) => {
  const formatK = (value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
  
  const avgExpenses = data.length > 0 
    ? data.reduce((sum, item) => sum + item.expenses, 0) / data.length 
    : 0;

  const CustomBar = (props) => {
    const { x, y, width, height, fill, dataKey, payload } = props;
    return (
      <rect 
        x={x} y={y} width={width} height={height} fill={fill} 
        className="cursor-pointer transition-opacity hover:opacity-80" 
        onClick={() => onBarClick({ activePayload: [{ dataKey, payload }] })} 
      />
    );
  };

  return (
    <Card className="clean-card overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
        <LineChart className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-bold">מגמת הכנסות מול הוצאות</CardTitle>
      </CardHeader>
      <CardContent className="p-2 mt-4">
        <div className="h-[250px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value), name === 'income' ? 'הכנסות' : name === 'expenses' ? 'הוצאות' : 'מאזן']} 
                labelFormatter={(label) => `חודש ${label}`} 
                contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} formatter={(value) => value === 'income' ? 'הכנסות' : value === 'expenses' ? 'הוצאות' : 'מאזן (קו)'}/>
              
              {/* קו הממוצע שהוספנו */}
              {avgExpenses > 0 && (
                <ReferenceLine 
                  y={avgExpenses} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  opacity={0.4}
                  label={{ position: 'insideTopLeft', value: 'ממוצע', fill: '#ef4444', fontSize: 10 }} 
                />
              )}

              <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} shape={<CustomBar />} maxBarSize={40}>
                <LabelList dataKey="income" position="top" formatter={formatK} style={{fontSize: 10, fill: '#22c55e', fontWeight: 'bold'}} />
              </Bar>
              <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} shape={<CustomBar />} maxBarSize={40}>
                <LabelList dataKey="expenses" position="top" formatter={formatK} style={{fontSize: 10, fill: '#ef4444', fontWeight: 'bold'}} />
              </Bar>
              <Line type="monotone" dataKey="profit" name="profit" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;