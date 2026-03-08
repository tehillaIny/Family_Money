import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { 
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { useData } from '@/hooks/useData.jsx';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, LineChart, Scale, Trophy, Tags } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker.jsx';
import { formatCurrency, formatDateHe } from '@/lib/utils.js';

const ChartsPage = () => {
  const { transactions, getCategoryById } = useData();
  const now = new Date();
  
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(now, 5)));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  
  const [drillDownData, setDrillDownData] = useState({ 
    isOpen: false, title: '', amount: 0, transactions: [], subtitle: '' 
  });

  const handleShowFromYearStart = () => {
    setStartDate(startOfYear(now));
    setEndDate(endOfMonth(now));
  };

  const handleShowSixMonths = () => {
    setStartDate(startOfMonth(subMonths(now, 5)));
    setEndDate(endOfMonth(now));
  };

  const handleShowLastYear = () => {
    setStartDate(startOfMonth(subMonths(now, 11)));
    setEndDate(endOfMonth(now));
  };

  const transactionsInRange = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const monthlyData = useMemo(() => {
    const months = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(1);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount||0), 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount||0), 0);

      months.push({
        name: format(currentDate, 'MMM', { locale: he }),
        fullDate: format(currentDate, 'MMMM yyyy', { locale: he }),
        income,
        expenses,
        profit: income - expenses,
        transactions: monthTransactions
      });

      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    return months;
  }, [transactions, startDate, endDate]);

  const categoryPieData = useMemo(() => {
    const categoryMap = {};
    transactionsInRange.filter(t => t.type === 'expense').forEach(t => {
      if (!categoryMap[t.categoryId]) categoryMap[t.categoryId] = { total: 0, transactions: [] };
      categoryMap[t.categoryId].total += parseFloat(t.amount||0);
      categoryMap[t.categoryId].transactions.push(t);
    });

    return Object.entries(categoryMap)
      .map(([categoryId, data]) => {
        const catInfo = getCategoryById(categoryId);
        return {
          id: categoryId, name: catInfo?.name_he || 'אחר', value: data.total,
          colorHex: catInfo?.colorHex || '#94a3b8', transactions: data.transactions
        };
      }).sort((a, b) => b.value - a.value);
  }, [transactionsInRange, getCategoryById]);

  const fixedVsVariableData = useMemo(() => {
    const fixedTxs = [];
    const variableTxs = [];
    let fixedTotal = 0;
    let variableTotal = 0;

    transactionsInRange.filter(t => t.type === 'expense').forEach(t => {
      const isFixed = t.recurring || t.originalId || t.categoryId === 'cat_bills' || t.tags?.includes('ממוצע_קבוע');
      if (isFixed) {
        fixedTotal += parseFloat(t.amount||0);
        fixedTxs.push(t);
      } else {
        variableTotal += parseFloat(t.amount||0);
        variableTxs.push(t);
      }
    });

    return [
      { name: 'קבועות (חובה)', value: fixedTotal, colorHex: '#8b5cf6', transactions: fixedTxs },
      { name: 'משתנות (מחייה)', value: variableTotal, colorHex: '#ec4899', transactions: variableTxs }
    ].filter(item => item.value > 0);
  }, [transactionsInRange]);

  const incomePieData = useMemo(() => {
    const INCOME_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
    const categoryMap = {};
    transactionsInRange.filter(t => t.type === 'income').forEach(t => {
      if (!categoryMap[t.categoryId]) categoryMap[t.categoryId] = { total: 0, transactions: [] };
      categoryMap[t.categoryId].total += parseFloat(t.amount||0);
      categoryMap[t.categoryId].transactions.push(t);
    });

    return Object.entries(categoryMap)
      .map(([categoryId, data], index) => {
        const catInfo = getCategoryById(categoryId);
        return {
          id: categoryId, name: catInfo?.name_he || 'אחר', value: data.total,
          colorHex: INCOME_COLORS[index % INCOME_COLORS.length], transactions: data.transactions
        };
      }).sort((a, b) => b.value - a.value);
  }, [transactionsInRange, getCategoryById]);

  const topExpensesData = useMemo(() => {
    return transactionsInRange
      .filter(t => 
        t.type === 'expense' && 
        !t.recurring && 
        !t.originalId && 
        t.categoryId !== 'cat_bills' &&
        t.categoryId !== 'cat_rent'
      )
      .sort((a, b) => parseFloat(b.amount||0) - parseFloat(a.amount||0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.description || getCategoryById(t.categoryId)?.name_he || 'ללא תיאור',
        value: parseFloat(t.amount||0),
        date: formatDateHe(t.date),
        transactions: [t] 
      }));
  }, [transactionsInRange, getCategoryById]);

  const tagsData = useMemo(() => {
    const tagMap = {};
    transactionsInRange.filter(t => t.type === 'expense').forEach(t => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach(tag => {
          if (tag === 'חד_פעמי' || tag === 'ממוצע_קבוע') return; 
          if (!tagMap[tag]) tagMap[tag] = { total: 0, transactions: [] };
          tagMap[tag].total += parseFloat(t.amount||0);
          tagMap[tag].transactions.push(t);
        });
      }
    });

    return Object.entries(tagMap)
      .map(([tag, data]) => ({ name: tag, value: data.total, transactions: data.transactions }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactionsInRange]);

  const formatK = (value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;

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

  const handleBarClick = (data, titlePrefix = '', subtitle = '') => {
    if (!data || !data.activePayload) return;
    const payload = data.activePayload[0].payload;
    openDrillDown(`${titlePrefix} ${payload.name}`, payload.value || payload.expenses || payload.income, payload.transactions, subtitle);
  };

  const handleMonthlyBarClick = (data) => {
    if (!data || !data.activePayload) return;
    const monthPayload = data.activePayload[0].payload;
    const dataKey = data.activePayload[0].dataKey;
    const title = dataKey === 'income' ? 'הכנסות' : 'הוצאות';
    const amount = dataKey === 'income' ? monthPayload.income : monthPayload.expenses;
    const filteredTxs = monthPayload.transactions.filter(t => t.type === (dataKey === 'income' ? 'income' : 'expense'));
    openDrillDown(`${title} - ${monthPayload.fullDate}`, amount, filteredTxs, `סך הכל ${title} בחודש זה`);
  };

  const handlePieClick = (data, subtitle = '') => {
    if (!data) return;
    openDrillDown(data.name, data.value, data.transactions, subtitle);
  };

  const openDrillDown = (title, amount, txs, subtitle) => {
    setDrillDownData({
      isOpen: true, title, amount, subtitle,
      transactions: txs ? [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)) : []
    });
  };

  const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  const CustomBar = (props) => {
    const { x, y, width, height, fill, dataKey, payload } = props;
    return <rect x={x} y={y} width={width} height={height} fill={fill} className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => handleMonthlyBarClick({ activePayload: [{ dataKey, payload }] })} />;
  };

  const CustomSimpleBar = (props) => {
    const { x, y, width, height, fill, payload, onClick } = props;
    return <rect x={x} y={y} width={width} height={height} fill={fill} radius={[0, 4, 4, 0]} className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => onClick({ activePayload: [{ payload }] })} />;
  };

  return (
    <>
    <div className="container mx-auto p-2 space-y-4 pb-16">
      <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-2">ניתוח ומגמות</h1>

      <Card className="clean-card">
        <CardContent className="p-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleShowSixMonths} className="text-xs flex-1 max-w-[120px]">6 חודשים אחרונים</Button>
            <Button variant="outline" size="sm" onClick={handleShowLastYear} className="text-xs flex-1 max-w-[120px]">שנה אחרונה</Button>
            <Button variant="outline" size="sm" onClick={handleShowFromYearStart} className="text-xs flex-1 max-w-[120px]">מתחילת השנה</Button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <DatePicker date={startDate} onDateChange={setStartDate} className="w-[110px] text-xs h-8" />
            <span className="text-xs text-muted-foreground">-</span>
            <DatePicker date={endDate} onDateChange={setEndDate} className="w-[110px] text-xs h-8" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card className="clean-card py-2">
          <CardContent className="p-0 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">הכנסות</div>
            <div className="text-sm font-bold text-green-600" dir="ltr">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="clean-card py-2">
          <CardContent className="p-0 text-center">
            <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">הוצאות</div>
            <div className="text-sm font-bold text-red-600" dir="ltr">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="clean-card py-2">
          <CardContent className="p-0 text-center">
            {totalProfit >= 0 ? <ArrowUpRight className="h-5 w-5 text-blue-500 mx-auto mb-1" /> : <ArrowDownRight className="h-5 w-5 text-orange-500 mx-auto mb-1" />}
            <div className="text-xs text-muted-foreground">מאזן תקופתי</div>
            <div className={`text-sm font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} dir="ltr">{formatCurrency(totalProfit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* --- מגמה חודשית --- */}
      <Card className="clean-card overflow-hidden">
        <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold">מגמת הכנסות מול הוצאות</CardTitle>
        </CardHeader>
        <CardContent className="p-2 mt-4">
          <div className="h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'income' ? 'הכנסות' : name === 'expenses' ? 'הוצאות' : 'מאזן']} labelFormatter={(label) => `חודש ${label}`} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} formatter={(value) => value === 'income' ? 'הכנסות' : value === 'expenses' ? 'הוצאות' : 'מאזן (קו)'}/>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* --- הוצאות לפי קטגוריות --- */}
        <Card className="clean-card overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">לאן הלך הכסף?</CardTitle>
          </CardHeader>
          <CardContent className="p-2 mt-2 flex flex-col items-center">
            {categoryPieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">אין הוצאות בתקופה זו.</p>
            ) : (
              <>
                <div className="h-[220px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value" onClick={(d) => handlePieClick(d, 'פירוט הוצאות בקטגוריה')} labelLine={false} label={renderPercentLabel} className="cursor-pointer focus:outline-none">
                        {categoryPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.colorHex} className="hover:opacity-80 transition-opacity" />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 px-2 pb-2">
                  {categoryPieData.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors" onClick={() => handlePieClick(cat)}>
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.colorHex }}></div>
                      <span className="text-xs font-medium">{cat.name} <span className="text-muted-foreground opacity-70">({formatCurrency(cat.value)})</span></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* --- קבועות מול משתנות --- */}
        <Card className="clean-card overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">קבועות מול משתנות</CardTitle>
          </CardHeader>
          <CardContent className="p-2 mt-2 flex flex-col items-center">
            {fixedVsVariableData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">אין הוצאות בתקופה זו.</p>
            ) : (
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fixedVsVariableData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" onClick={(d) => handlePieClick(d, d.name)} labelLine={false} label={renderPercentLabel} className="cursor-pointer focus:outline-none">
                      {fixedVsVariableData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.colorHex} className="hover:opacity-80 transition-opacity" />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- מצעד החד פעמיות (TOP 5) --- */}
        <Card className="clean-card overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold">הוצאות חד-פעמיות בולטות</CardTitle>
          </CardHeader>
          <CardContent className="p-4 mt-2">
             {topExpensesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">אין הוצאות בתקופה זו.</p>
             ) : (
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topExpensesData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                    <Bar dataKey="value" fill="#f59e0b" barSize={20} shape={(props) => <CustomSimpleBar {...props} onClick={(data) => handleBarClick(data, 'פירוט:', 'עסקה ספציפית מהמצעד')} />}>
                      <LabelList dataKey="value" position="right" formatter={(val) => formatCurrency(val)} style={{fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: '500'}} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
             )}
          </CardContent>
        </Card>

        {/* --- ניתוח תגיות --- */}
        {tagsData.length > 0 && (
          <Card className="clean-card overflow-hidden">
            <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
              <Tags className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-base font-bold">הוצאות לפי תגיות אישיות</CardTitle>
            </CardHeader>
            <CardContent className="p-4 mt-2">
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tagsData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                    <Bar dataKey="value" fill="#6366f1" barSize={20} shape={(props) => <CustomSimpleBar {...props} onClick={(data) => handleBarClick(data, 'תגית:', 'כל ההוצאות תחת תגית זו')} />}>
                      <LabelList dataKey="value" position="right" formatter={(val) => formatCurrency(val)} style={{fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: '500'}} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- מקורות הכנסה --- */}
        {incomePieData.length > 0 && (
          <Card className="clean-card overflow-hidden md:col-span-2">
            <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base font-bold">מקורות הכנסה</CardTitle>
            </CardHeader>
            <CardContent className="p-2 mt-2 flex flex-col items-center">
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" onClick={(d) => handlePieClick(d, 'פירוט מקור הכנסה')} labelLine={false} label={renderPercentLabel} className="cursor-pointer focus:outline-none">
                      {incomePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.colorHex} className="hover:opacity-80 transition-opacity" />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', textAlign: 'right', direction: 'rtl' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 px-2 pb-2 mt-2">
                {incomePieData.map(cat => (
                  <div key={cat.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors" onClick={() => handlePieClick(cat)}>
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.colorHex }}></div>
                    <span className="text-xs font-medium">{cat.name} <span className="text-muted-foreground opacity-70">({formatCurrency(cat.value)})</span></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>

    {/* --- חלון פירוט Drill-down --- */}
    <Dialog open={drillDownData.isOpen} onOpenChange={(isOpen) => setDrillDownData(prev => ({ ...prev, isOpen }))}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">{drillDownData.title}</DialogTitle>
        </DialogHeader>
        <div className="mb-2 bg-muted/30 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">{drillDownData.subtitle}</p>
          <p className="font-bold text-3xl mt-1 text-foreground" dir="ltr">{formatCurrency(drillDownData.amount)}</p>
        </div>
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold mb-2">היסטוריית תשלומים:</h4>
          {drillDownData.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו עסקאות.</p>
          ) : (
            drillDownData.transactions.map(t => {
               const catInfo = getCategoryById(t.categoryId);
               return (
                <div key={t.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-md border border-secondary/50">
                  <div>
                    <p className="font-medium text-sm text-foreground">{t.description || catInfo?.name_he || 'ללא תיאור'}</p>
                    <p className="text-xs text-muted-foreground">{formatDateHe(t.date)}</p>
                  </div>
                  <p className="font-semibold text-sm text-foreground" dir="ltr">{formatCurrency(t.amount)}</p>
                </div>
               )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ChartsPage;