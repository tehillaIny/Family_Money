import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const BalancePieChart = ({ income, expenses }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={
            income > 0
              ? [
                  { name: 'הוצאות', value: Math.abs(expenses) },
                  { name: 'נותר', value: Math.max(income - Math.abs(expenses), 0) },
                ]
              : [{ name: 'ריק', value: 1 }]
          }
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={105}
          outerRadius={125}
          paddingAngle={income > 0 ? 5 : 0}
          cornerRadius={10}
          isAnimationActive
        >
          {income > 0 ? (
            <>
              <Cell fill="hsl(var(--chart-red))" strokeWidth={0} />
              <Cell fill="hsl(var(--chart-green))" strokeWidth={0} />
            </>
          ) : (
            <Cell fill="hsl(var(--muted))" strokeWidth={0} />
          )}
        </Pie>
        {income > 0 && (
          <Tooltip
            contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                fontSize: '0.85rem', 
                borderRadius: '0.75rem', 
                border: '1px solid hsl(var(--border))', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value, name) => [
              `${((value / income) * 100).toFixed(1)}%`,
              name === 'הוצאות' ? 'הוצאות' : 'נותר',
            ]}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default BalancePieChart;