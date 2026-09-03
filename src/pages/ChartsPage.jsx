import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Switch } from '@/components/ui/switch.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useData } from '@/hooks/useData.jsx';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, LineChart, Scale, Trophy, Tags, Filter } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker.jsx';
import { formatCurrency, formatDateHe, toLocalISOString } from '@/lib/utils.js';

import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart.jsx';
import DistributionPieChart from '@/components/charts/DistributionPieChart.jsx';
import RankedBarChart from '@/components/charts/RankedBarChart.jsx';
import CategoryTrendLineChart from '@/components/charts/CategoryTrendLineChart.jsx';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ChartsPage = () => {
  const { transactions, getCategoryById, loadHistoricalData, updateTransaction, editTransaction } = useData();
  const now = new Date();
  
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(now, 5)));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  
  const [drillDownData, setDrillDownData] = useState({ 
    isOpen: false, title: '', amount: 0, transactions: [], subtitle: '', sourceChart: 'none' 
  });
  
  const [selectedTrendCategoryId, setSelectedTrendCategoryId] = useState(null);

  const handleShowFromYearStart = () => {
    const newStart = startOfYear(now);
    setStartDate(newStart);
    setEndDate(endOfMonth(now));
    if (loadHistoricalData) loadHistoricalData(toLocalISOString(newStart));
  };

  const handleShowSixMonths = () => {
    const newStart = startOfMonth(subMonths(now, 5));
    setStartDate(newStart);
    setEndDate(endOfMonth(now));
    if (loadHistoricalData) loadHistoricalData(toLocalISOString(newStart));
  };

  const handleShowLastYear = () => {
    const newStart = startOfMonth(subMonths(now, 11));
    setStartDate(newStart);
    setEndDate(endOfMonth(now));
    if (loadHistoricalData) loadHistoricalData(toLocalISOString(newStart));
  };
  
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (loadHistoricalData) loadHistoricalData(toLocalISOString(date));
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

  const categoryTrendMonthlyData = useMemo(() => {
    if (!selectedTrendCategoryId) return [];
    const months = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(1);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const monthAmount = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               t.categoryId === selectedTrendCategoryId &&
               transactionDate >= monthStart &&
               transactionDate <= monthEnd;
      }).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      months.push({
        name: format(currentDate, 'MMM', { locale: he }),
        fullDate: format(currentDate, 'MMMM yyyy', { locale: he }),
        amount: monthAmount
      });
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    return months;
  }, [transactions, startDate, endDate, selectedTrendCategoryId]);

  const selectedTrendCategoryInfo = useMemo(() => selectedTrendCategoryId ? getCategoryById(selectedTrendCategoryId) : null, [selectedTrendCategoryId, getCategoryById]);
  const selectedCategoryPieData = useMemo(() => categoryPieData.find(c => c.id === selectedTrendCategoryId), [categoryPieData, selectedTrendCategoryId]);

  const fixedVsVariableData = useMemo(() => {
    const fixedTxs = [];
    const variableTxs = [];
    let fixedTotal = 0;
    let variableTotal = 0;

    transactionsInRange.filter(t => t.type === 'expense').forEach(t => {
      const isFixed = t.recurring || t.originalId || t.categoryId === 'cat_bills' || (t.tags || []).includes('ממוצע_קבוע');
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
        t.categoryId !== 'cat_rent' &&
        !(t.tags || []).includes('ממוצע_קבוע')
      )
      .sort((a, b) => parseFloat(b.amount||0) - parseFloat(a.amount||0))
      .slice(0, 5)
      .map(t => {
        const displayTags = (t.tags || []).filter(tag => tag !== 'ממוצע_קבוע' && tag !== 'חד_פעמי');
        const tagsStr = displayTags.length > 0 ? displayTags.join(', ') : '';
        
        let nameStr = t.description || '';
        if (nameStr && tagsStr) nameStr = `${nameStr} (${tagsStr})`;
        else if (!nameStr && tagsStr) nameStr = tagsStr;
        else if (!nameStr && !tagsStr) nameStr = getCategoryById(t.categoryId)?.name_he || 'ללא תיאור';

        return { id: t.id, name: nameStr, value: parseFloat(t.amount||0), date: formatDateHe(t.date), transactions: [t] };
      });
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

  const openDrillDown = (title, amount, txs, subtitle, sourceChart = 'none') => {
    setDrillDownData({
      isOpen: true, title, amount, subtitle, sourceChart,
      transactions: txs ? [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)) : []
    });
  };

  const handleBarClick = (data, titlePrefix = '', subtitle = '', sourceChart = 'none') => {
    if (!data || !data.activePayload) return;
    const payload = data.activePayload[0].payload;
    openDrillDown(`${titlePrefix} ${payload.name}`, payload.value || payload.expenses || payload.income, payload.transactions, subtitle, sourceChart);
  };

  const handleMonthlyBarClick = (data) => {
    if (!data || !data.activePayload) return;
    const monthPayload = data.activePayload[0].payload;
    const dataKey = data.activePayload[0].dataKey;
    const title = dataKey === 'income' ? 'הכנסות' : 'הוצאות';
    const amount = dataKey === 'income' ? monthPayload.income : monthPayload.expenses;
    const filteredTxs = monthPayload.transactions.filter(t => t.type === (dataKey === 'income' ? 'income' : 'expense'));
    openDrillDown(`${title} - ${monthPayload.fullDate}`, amount, filteredTxs, `סך הכל ${title} בחודש זה`, 'none');
  };

  const handlePieClick = (item, subtitle = '', sourceChart = 'none') => {
    if (!item) return;
    openDrillDown(item.name, item.value, item.transactions, subtitle, sourceChart);
  };

  // מנגנון חדש שעובד קודם על תווית ורק אח"כ על קטגוריה!
  const toggleBulkFixed = (transaction, makeFixed) => {
    const saveFunc = updateTransaction || editTransaction;
    if (!saveFunc) return;

    const displayTags = (transaction.tags || []).filter(tag => tag !== 'ממוצע_קבוע' && tag !== 'חד_פעמי');
    const primaryTag = displayTags.length > 0 ? displayTags[0] : null;
    const categoryId = transaction.categoryId;

    // 1. איתור העסקאות לשינוי (לפי תווית או קטגוריה)
    const txsToUpdate = transactions.filter(t => {
      if (primaryTag) {
        return (t.tags || []).includes(primaryTag);
      } else {
        return t.categoryId === categoryId;
      }
    });
    
    // 2. עדכון מסד הנתונים
    txsToUpdate.forEach(t => {
      const currentTags = t.tags || [];
      const hasFixedTag = currentTags.includes('ממוצע_קבוע');
      
      if (makeFixed && !hasFixedTag) {
        saveFunc({ ...t, tags: [...currentTags, 'ממוצע_קבוע'] });
      } else if (!makeFixed && hasFixedTag) {
        saveFunc({ ...t, tags: currentTags.filter(tag => tag !== 'ממוצע_קבוע') });
      }
    });
    
    // 3. עדכון התצוגה המקומית
    setDrillDownData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
         let isMatch = false;
         if (primaryTag) {
            isMatch = (t.tags || []).includes(primaryTag);
         } else {
            isMatch = t.categoryId === categoryId;
         }

         if (isMatch) {
           const currentTags = t.tags || [];
           const hasFixedTag = currentTags.includes('ממוצע_קבוע');
           let newTags = currentTags;
           if (makeFixed && !hasFixedTag) newTags = [...currentTags, 'ממוצע_קבוע'];
           if (!makeFixed && hasFixedTag) newTags = currentTags.filter(tag => tag !== 'ממוצע_קבוע');
           return { ...t, tags: newTags };
         }
         return t;
      })
    }));
  };

  const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  const showToggleInDrillDown = ['fixed_vs_variable_fixed', 'fixed_vs_variable_variable', 'top_expenses'].includes(drillDownData.sourceChart);

  return (
    <>
    <div className="container mx-auto p-2 pb-16">
      
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-2 px-2 shadow-sm mb-4">
        <h1 className="text-xl font-bold text-foreground text-center mb-3 flex justify-center items-center gap-2">
          <Filter className="w-5 h-5" /> ניתוח ומגמות
        </h1>
        <Card className="clean-card m-0">
          <CardContent className="p-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleShowSixMonths} className="text-xs flex-1 max-w-[120px]">6 חודשים</Button>
              <Button variant="outline" size="sm" onClick={handleShowLastYear} className="text-xs flex-1 max-w-[120px]">שנה אחרונה</Button>
              <Button variant="outline" size="sm" onClick={handleShowFromYearStart} className="text-xs flex-1 max-w-[120px]">מתחילת השנה</Button>
            </div>
            <div className="flex items-center justify-center gap-2">
              <DatePicker date={startDate} onDateChange={handleStartDateChange} className="w-[110px] text-xs h-8" />
              <span className="text-xs text-muted-foreground">-</span>
              <DatePicker date={endDate} onDateChange={setEndDate} className="w-[110px] text-xs h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <MonthlyTrendChart data={monthlyData} onBarClick={handleMonthlyBarClick} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <motion.div variants={itemVariants}>
            <DistributionPieChart 
              data={categoryPieData} 
              title="לאן הלך הכסף?" 
              icon={PieChartIcon} 
              selectedId={selectedTrendCategoryId}
              onPieClick={(item) => setSelectedTrendCategoryId(item.id === selectedTrendCategoryId ? null : item.id)} 
              emptyMessage="לא נמצאו הוצאות בטווח התאריכים הנבחר."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
             <CategoryTrendLineChart 
                data={categoryTrendMonthlyData}
                title={`מגמת הוצאות: ${selectedTrendCategoryInfo ? selectedTrendCategoryInfo.name_he : 'בחר קטגוריה'}`}
                icon={LineChart}
                categoryInfo={selectedTrendCategoryInfo}
                onDetailsClick={() => openDrillDown(selectedCategoryPieData.name, selectedCategoryPieData.value, selectedCategoryPieData.transactions, 'פירוט הוצאות בקטגוריה', 'none')}
             />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
             <DistributionPieChart 
              data={fixedVsVariableData} 
              title="קבועות מול משתנות" 
              icon={Scale} 
              onPieClick={(item) => {
                const source = item.name === 'קבועות (חובה)' ? 'fixed_vs_variable_fixed' : 'fixed_vs_variable_variable';
                handlePieClick(item, item.name, source);
              }} 
              showLegend={true}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
             <RankedBarChart 
                data={topExpensesData}
                title="הוצאות חד-פעמיות בולטות"
                icon={Trophy}
                iconColor="text-amber-500"
                barColor="#f59e0b"
                onBarClick={(data) => handleBarClick(data, 'פירוט:', 'עסקה ספציפית מהמצעד', 'top_expenses')}
             />
          </motion.div>

          {tagsData.length > 0 && (
            <motion.div variants={itemVariants}>
               <RankedBarChart 
                  data={tagsData}
                  title="הוצאות לפי תגיות אישיות"
                  icon={Tags}
                  iconColor="text-indigo-500"
                  barColor="#6366f1"
                  onBarClick={(data) => handleBarClick(data, 'תגית:', 'כל ההוצאות תחת תגית זו', 'none')}
               />
            </motion.div>
          )}

          {incomePieData.length > 0 && (
            <motion.div variants={itemVariants} className="md:col-span-2">
               <DistributionPieChart 
                  data={incomePieData} 
                  title="מקורות הכנסה" 
                  icon={TrendingUp} 
                  onPieClick={(item) => handlePieClick(item, 'פירוט מקור הכנסה', 'none')} 
                />
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>

    {/* חלון ה-Drill Down */}
    <Dialog open={drillDownData.isOpen} onOpenChange={(isOpen) => setDrillDownData(prev => ({ ...prev, isOpen }))}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">{drillDownData.title}</DialogTitle>
        </DialogHeader>
        <div className="mb-2 bg-muted/30 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">{drillDownData.subtitle}</p>
          <p className="font-bold text-3xl mt-1 text-foreground" dir="ltr">{formatCurrency(drillDownData.amount)}</p>
          {drillDownData.transactions.length > 0 && (
             <p className="text-xs text-muted-foreground mt-2">
               ממוצע לעסקה: {formatCurrency(drillDownData.amount / drillDownData.transactions.length)} | מס' עסקאות: {drillDownData.transactions.length}
             </p>
          )}
        </div>
        
        <div className="space-y-3 mt-4 pb-4">
          <h4 className="text-sm font-semibold mb-2">היסטוריית תשלומים:</h4>
          {drillDownData.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו עסקאות.</p>
          ) : (
            drillDownData.transactions.map(t => {
               const catInfo = getCategoryById(t.categoryId);
               const hasFixedTag = (t.tags || []).includes('ממוצע_קבוע');
               const displayTags = (t.tags || []).filter(tag => tag !== 'ממוצע_קבוע' && tag !== 'חד_פעמי');
               
               // הגדרת השם של התווית או הקטגוריה עבור כפתור המתג
               const primaryTag = displayTags.length > 0 ? displayTags[0] : null;
               const entityName = primaryTag ? `תווית "${primaryTag}"` : `קטגוריית "${catInfo?.name_he || 'אחר'}"`;
               
               const isInherentlyFixed = t.recurring || t.originalId || t.categoryId === 'cat_bills';
               
               return (
                <div key={t.id} className="flex flex-col p-3 bg-secondary/20 rounded-lg border border-secondary/50 gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-foreground leading-tight">
                        {t.description || catInfo?.name_he || 'ללא תיאור'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateHe(t.date)}</p>
                    </div>
                    <p className="font-bold text-sm text-foreground bg-background px-2 py-1 rounded-md shadow-sm border border-border/50" dir="ltr">
                      {formatCurrency(t.amount)}
                    </p>
                  </div>
                  
                  {showToggleInDrillDown && (
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {displayTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] font-normal px-2 py-0 h-5 bg-background">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-md">
                        {isInherentlyFixed ? (
                          <span className="text-[10px] text-muted-foreground font-medium px-1">קטגוריה קבועה במערכת</span>
                        ) : (
                          <>
                            <Label htmlFor={`bulk-fixed-${t.id}`} className="text-[11px] font-medium cursor-pointer text-muted-foreground select-none">
                              {drillDownData.sourceChart === 'fixed_vs_variable_fixed' 
                                ? `הסר ${entityName} מקבועות` 
                                : `הגדר ${entityName} כקבועה`}
                            </Label>
                            <Switch 
                              id={`bulk-fixed-${t.id}`}
                              checked={hasFixedTag}
                              onCheckedChange={(checked) => toggleBulkFixed(t, checked)}
                              className="scale-90 data-[state=checked]:bg-blue-600"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {!showToggleInDrillDown && displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3 mt-1">
                      {displayTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-normal px-2 py-0 h-5 bg-background">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
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