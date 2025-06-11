import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '@/hooks/useData.jsx';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Tag, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const totalIncome = chartData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = chartData.reduce((sum, month) => sum + month.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  return (
    <div className="container mx-auto p-2 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-xs text-muted-foreground">הכנסות</div>
                <div className="text-sm font-bold text-green-500">
                  {totalIncome.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-xs text-muted-foreground">הוצאות</div>
                <div className="text-sm font-bold text-red-500">
                  {totalExpenses.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {totalProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <div>
                <div className="text-xs text-muted-foreground">רווח/הפסד</div>
                <div className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalProfit.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">תקופה</div>
                <div className="text-sm">
                  {format(startDate, 'MMM yyyy', { locale: he })} - {format(endDate, 'MMM yyyy', { locale: he })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-base font-bold">ניתוח חודשי</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowFromYearStart}
                className="flex items-center gap-1 text-xs"
              >
                <Calendar className="h-3 w-3" />
                מתחילת השנה
              </Button>
              <div className="flex items-center gap-1">
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="מתאריך"
                  className="w-[100px] text-xs"
                />
                <span className="text-xs text-muted-foreground">עד</span>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="עד תאריך"
                  className="w-[100px] text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-[250px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
              >
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => 
                    (value / 1000).toLocaleString('he-IL') + 'K'
                  }
                  width={40}
                />
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
          <CardHeader className="p-3">
            <CardTitle className="text-base font-bold">
              {getTypeLabel()} - {selectedMonth.name} {selectedMonth.year}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
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
                    className="flex items-center justify-between p-2 bg-card rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${category?.color?.replace('text-', 'bg-')}/20`}>
                        <IconComponent className={`h-3.5 w-3.5 ${category?.color || 'text-primary'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-xs">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">{category?.name_he}</div>
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-0.5">
                            {transaction.tags.map(tag => (
                              <span key={tag} className="px-1 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full flex items-center">
                                <Tag className="h-2.5 w-2.5 mr-0.5 rtl:ml-0.5 rtl:mr-0" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`font-semibold text-xs ${amountColor}`}>
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