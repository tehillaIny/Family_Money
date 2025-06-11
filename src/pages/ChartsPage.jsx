import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '@/hooks/useData.jsx';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Tag, Calendar } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker.jsx';

const ChartsPage = () => {
  const { transactions, getCategoryById, getIconComponent } = useData();
  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(now, 12)));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const handleShowFromYearStart = () => {
    setStartDate(startOfYear(now));
    setEndDate(endOfMonth(now));
  };

  const chartData = useMemo(() => {
    const months = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const profit = income - expenses;
      const loss = profit < 0 ? Math.abs(profit) : 0;
      const netProfit = profit > 0 ? profit : 0;

      months.push({
        name: format(currentDate, 'MMM', { locale: he }),
        month: format(currentDate, 'MM'),
        year: format(currentDate, 'yyyy'),
        income,
        expenses,
        profit: netProfit,
        loss,
        transactions: monthTransactions
      });

      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return months;
  }, [transactions, startDate, endDate]);

  const handleBarClick = (data) => {
    if (!data || !data.activePayload) return;
    const clickedData = data.activePayload[0];
    setSelectedMonth(clickedData.payload);
    setSelectedType(clickedData.dataKey);
  };

  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    
    let transactions = selectedMonth.transactions;
    if (selectedType === 'income') {
      transactions = transactions.filter(t => t.type === 'income');
    } else if (selectedType === 'expenses') {
      transactions = transactions.filter(t => t.type === 'expense');
    }
    return transactions;
  }, [selectedMonth, selectedType]);

  const getTypeLabel = () => {
    switch (selectedType) {
      case 'income': return 'הכנסות';
      case 'expenses': return 'הוצאות';
      default: return 'תנועות';
    }
  };

  const CustomBar = (props) => {
    const { x, y, width, height, fill, dataKey, payload } = props;
    const isClickable = dataKey === 'income' || dataKey === 'expenses';
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          style={{ cursor: isClickable ? 'pointer' : 'default' }}
          onClick={isClickable ? () => handleBarClick({ activePayload: [{ dataKey, payload }] }) : undefined}
        />
      </g>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">ניתוח חודשי</CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowFromYearStart}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              הצג מתחילת השנה
            </Button>
            <div className="flex items-center gap-2">
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="מתאריך"
                className="w-[140px]"
              />
              <span className="text-muted-foreground">עד</span>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="עד תאריך"
                className="w-[140px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    const formattedValue = value.toLocaleString('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                      minimumFractionDigits: 0
                    });
                    const labels = {
                      income: 'הכנסות',
                      expenses: 'הוצאות',
                      profit: 'רווח',
                      loss: 'הפסד'
                    };
                    return [formattedValue, labels[name]];
                  }}
                />
                <Bar dataKey="income" name="income" fill="#22c55e" shape={<CustomBar />} />
                <Bar dataKey="expenses" name="expenses" fill="#ef4444" shape={<CustomBar />} />
                <Bar dataKey="profit" name="profit" fill="#3b82f6" shape={<CustomBar />} />
                <Bar dataKey="loss" name="loss" fill="#f97316" shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {selectedMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {getTypeLabel()} - {selectedMonth.name} {selectedMonth.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                const IconComponent = getIconComponent(category?.icon);
                const amountColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
                const amountPrefix = transaction.type === 'income' ? '+' : '-';

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-card rounded-lg border"
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className={`p-2 rounded-full ${category?.color?.replace('text-', 'bg-')}/20`}>
                        <IconComponent className={`h-5 w-5 ${category?.color || 'text-primary'}`} />
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{category?.name_he}</div>
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {transaction.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded-full flex items-center">
                                <Tag className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`font-semibold ${amountColor}`}>
                      {amountPrefix}
                      {transaction.amount.toLocaleString('he-IL', {
                        style: 'currency',
                        currency: 'ILS',
                        minimumFractionDigits: 0
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChartsPage; 