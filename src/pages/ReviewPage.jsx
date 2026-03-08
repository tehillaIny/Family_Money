import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { TrendingUp, TrendingDown, DollarSign, Repeat, Calendar, Calculator, Tag, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import { formatCurrency, formatDateHe } from '@/lib/utils.js';

const ReviewPage = () => {
  const navigate = useNavigate();
  const { 
    transactions, 
    getBalanceForMonth, 
    getCategorySummariesForMonth, 
    getIncomeSummariesForMonth, 
    getCategoryById, 
    getIconComponent,
    getTransactionsForMonth,
    currentDate
  } = useData();
  
  const { income, expenses, balance } = getBalanceForMonth();
  
  const [mainTab, setMainTab] = useState("overview");
  const [overviewTab, setOverviewTab] = useState("expenses");

  const [drillDownData, setDrillDownData] = useState({ isOpen: false, title: '', amount: 0, transactions: [], subtitle: '' });
  
  const [trackedTags, setTrackedTags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trackedAverages')) || []; } 
    catch { return []; }
  });
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const categoryExpenseSummaries = getCategorySummariesForMonth().sort((a, b) => b.total - a.total);
  const categoryIncomeSummaries = getIncomeSummariesForMonth().sort((a, b) => b.total - a.total);

  const dataToDisplay = overviewTab === "expenses" ? categoryExpenseSummaries : categoryIncomeSummaries;
  const totalForTab = overviewTab === "expenses" ? expenses : income;
  
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const todayIso = d.toISOString().split('T')[0];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setHours(12, 0, 0, 0);
  const sixMonthsAgoIso = sixMonthsAgo.toISOString().split('T')[0];

  const monthTransactions = getTransactionsForMonth(currentDate);
  const activeRecurringIds = new Set(
    monthTransactions
      .filter(t => (t.recurring || t.originalId) && t.type === 'expense')
      .map(t => t.originalId || t.id)
  );
  const recurringExpenses = transactions.filter(t => activeRecurringIds.has(t.id));

  const historicalBills = transactions.filter(t => 
    t.categoryId === 'cat_bills' && 
    t.type === 'expense' && 
    t.date <= todayIso && 
    t.date >= sixMonthsAgoIso &&
    !t.tags?.includes('חד_פעמי') 
  );

  let billsMonthlyAverage = 0;
  let totalBillsHistorical = 0;
  if (historicalBills.length > 0) {
    totalBillsHistorical = historicalBills.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const earliestDate = new Date(Math.min(...historicalBills.map(t => new Date(t.date).getTime())));
    const latestDate = new Date(); 
    let monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    monthsDiff = Math.max(1, Math.min(6, monthsDiff)); 
    billsMonthlyAverage = totalBillsHistorical / monthsDiff;
  }

  // --- 3. חישוב ממוצעים אישיים (לפי תגיות שהמשתמש בחר למעקב) ---
  const customAverages = trackedTags.map(tag => {
    const txs = transactions.filter(t => 
      t.type === 'expense' && 
      t.tags?.includes(tag) && 
      t.date <= todayIso && 
      t.date >= sixMonthsAgoIso &&
      !t.tags?.includes('חד_פעמי')
    );
    
    if (txs.length === 0) return null;

    const total = txs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const earliestDate = new Date(Math.min(...txs.map(t => new Date(t.date).getTime())));
    const latestDate = new Date();
    let monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    monthsDiff = Math.max(1, Math.min(6, monthsDiff));
    
    return { id: tag, title: tag, totalHistorical: total, average: total / monthsDiff, transactions: txs };
  }).filter(Boolean);

  const totalCustomAverages = customAverages.reduce((sum, item) => sum + item.average, 0);

  // --- 4. סך הכל עלות מחיה בסיסית ---
  const totalRecurringMonthly = recurringExpenses.reduce((sum, t) => {
    let amount = parseFloat(t.amount || 0);
    if (t.recurrenceFrequency === 'yearly') amount /= 12;
    else if (t.recurrenceFrequency === 'weekly') amount *= 4.33; 
    else if (t.recurrenceFrequency === 'daily') amount *= 30;
    return sum + amount;
  }, 0) + billsMonthlyAverage + totalCustomAverages; 

  const frequencyText = { monthly: 'כל חודש', yearly: 'כל שנה', weekly: 'כל שבוע', daily: 'כל יום' };

  // --- פונקציות עזר לניהול תגיות אישיות ---
  const allExistingTags = [...new Set(transactions.flatMap(t => t.tags || []))].filter(t => t !== 'חד_פעמי');
  const availableTagsToAdd = allExistingTags.filter(tag => !trackedTags.includes(tag));

  const addTrackedTag = (tag) => {
    const newTags = [...trackedTags, tag];
    setTrackedTags(newTags);
    localStorage.setItem('trackedAverages', JSON.stringify(newTags));
    setIsTagDialogOpen(false);
  };

  const removeTrackedTag = (tag) => {
    const newTags = trackedTags.filter(t => t !== tag);
    setTrackedTags(newTags);
    localStorage.setItem('trackedAverages', JSON.stringify(newTags));
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };
  
  const handleCategoryItemClick = (categoryId) => navigate('/transactions', { state: { filterCategoryId: categoryId } });

  const openDrillDown = (title, amount, txs, subtitle) => {
    setDrillDownData({
      isOpen: true,
      title,
      amount,
      transactions: txs.sort((a,b) => new Date(b.date) - new Date(a.date)), 
      subtitle
    });
  };

  const billsCategoryInfo = getCategoryById('cat_bills');
  const BillsIcon = billsCategoryInfo ? getIconComponent(billsCategoryInfo.iconName) : DollarSign;
  const billsColor = billsCategoryInfo ? billsCategoryInfo.color : 'text-sky-500';

  return (
    <>
    <Header />
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-16 px-2">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground text-center mb-4">סקירה וניתוח</h1>
        
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">סיכום חודשי</TabsTrigger>
            <TabsTrigger value="recurring">הוצאות קבועות</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* תוכן הסיכום החודשי הרגיל - נשאר ללא שינוי */}
            <MonthNavigator />
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <Card className="clean-card py-3 sm:py-4">
                <CardContent className="p-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-xs sm:text-sm text-muted-foreground">הכנסות</p>
                  <div className="text-md sm:text-lg font-bold text-green-600 dark:text-green-400" dir="ltr">{formatCurrency(income)}</div>
                </CardContent>
              </Card>
              <Card className="clean-card py-3 sm:py-4">
                <CardContent className="p-0">
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-xs sm:text-sm text-muted-foreground">הוצאות</p>
                  <div className="text-md sm:text-lg font-bold text-red-600 dark:text-red-400" dir="ltr">{formatCurrency(expenses)}</div>
                </CardContent>
              </Card>
              <Card className="clean-card py-3 sm:py-4">
                <CardContent className="p-0">
                  <DollarSign className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                  <p className="text-xs sm:text-sm text-muted-foreground">מאזן</p>
                  <div className={`text-md sm:text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} dir="ltr">{formatCurrency(balance)}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={overviewTab} onValueChange={setOverviewTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">הוצאות</TabsTrigger>
                <TabsTrigger value="income">הכנסות</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="clean-card">
              <CardHeader><CardTitle className="text-lg text-foreground">פירוט לפי קטגוריות</CardTitle></CardHeader>
              <CardContent>
                {dataToDisplay.length === 0 ? (
                  <p className="text-center text-muted-foreground">אין {overviewTab === "expenses" ? "הוצאות" : "הכנסות"} החודש.</p>
                ) : (
                  <ul className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {dataToDisplay.map(summary => {
                      const categoryInfo = getCategoryById(summary.categoryId);
                      if (!categoryInfo) return null;
                      const IconComponent = getIconComponent(categoryInfo.iconName) || DollarSign;
                      const percentage = totalForTab > 0 ? (summary.total / totalForTab) * 100 : 0;
                      const amountColor = overviewTab === "expenses" ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                      const barColor = categoryInfo.colorHex || (overviewTab === "expenses" ? 'hsl(var(--chart-red))' : 'hsl(var(--chart-green))');

                      return (
                        <li key={summary.categoryId} className="p-2.5 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer" onClick={() => handleCategoryItemClick(summary.categoryId)}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                              <div className={`p-1.5 rounded-full ${categoryInfo.color?.replace('text-', 'bg-')}/20`}>
                                <IconComponent className={`h-5 w-5 ${categoryInfo.color || 'text-primary'}`} />
                              </div>
                              <span className="font-medium text-foreground text-sm">{categoryInfo.name_he}</span>
                            </div>
                            <span className={`font-semibold ${amountColor} text-sm`} dir="ltr">{formatCurrency(summary.total)}</span>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className="w-full bg-muted rounded-full h-2 flex-grow">
                              <div className="h-2 rounded-full" style={{ backgroundColor: barColor, width: `${percentage}%` }} />
                            </div>
                            <span className="text-muted-foreground text-xs w-10 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring" className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <Card className="clean-card bg-primary/5 border-primary/20">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-3 text-primary"><Repeat className="h-8 w-8" /></div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">עלות מחיה בסיסית (הערכה לחודש)</h3>
                <p className="text-3xl font-bold text-primary" dir="ltr">{formatCurrency(totalRecurringMonthly)}</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs px-4">
                  משקלל מנויים חודשיים, ממוצע חשבונות, ותגיות אישיות במעקב.
                </p>
              </CardContent>
            </Card>

            <h3 className="font-bold text-lg mb-2 mt-6">פירוט התחייבויות וממוצעים</h3>
            {recurringExpenses.length === 0 && billsMonthlyAverage === 0 && customAverages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">לא הוגדרו הוצאות קבועות.</p>
            ) : (
              <ul className="space-y-3">
                
                {/* כרטיסיית ממוצע חשבונות */}
                {billsMonthlyAverage > 0 && (
                  <Card 
                    className="clean-card border-none shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openDrillDown('חשבונות (ממוצע)', totalBillsHistorical, historicalBills, 'סך כל החשבונות בחצי השנה האחרונה')}
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-primary/40"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`p-2.5 rounded-full ${billsColor.replace('text-', 'bg-')}/10`}><BillsIcon className={`h-5 w-5 ${billsColor}`} /></div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">חשבונות (ממוצע חודשי)</p>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-1">
                            <Calculator className="h-3 w-3" /> מחושב אוטומטית (ללא "חד_פעמי")
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-red-600 dark:text-red-400" dir="ltr">{formatCurrency(billsMonthlyAverage)}</div>
                    </CardContent>
                  </Card>
                )}

                {/* כרטיסיות ממוצע לפי תגיות אישיות */}
                {customAverages.map(avg => (
                  <Card 
                    key={avg.id} 
                    className="clean-card border-none shadow-sm relative overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openDrillDown(`תגית: ${avg.title}`, avg.totalHistorical, avg.transactions, `עסקאות עם התגית "${avg.title}" בחצי השנה האחרונה`)}
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-primary/40"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="p-2.5 rounded-full bg-primary/10"><Tag className="h-5 w-5 text-primary" /></div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{avg.title} (ממוצע)</p>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-1">
                            <Calculator className="h-3 w-3" /> ממוצע נע ל-6 חודשים
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-red-600 dark:text-red-400" dir="ltr">{formatCurrency(avg.average)}</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeTrackedTag(avg.id); }}
                          className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                          title="הסר ממעקב"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* עסקאות קבועות רגילות */}
                {recurringExpenses.map(transaction => {
                  const categoryInfo = getCategoryById(transaction.categoryId);
                  const IconComponent = categoryInfo ? getIconComponent(categoryInfo.iconName) : DollarSign;
                  const categoryColor = categoryInfo ? categoryInfo.color : 'text-gray-500';

                  return (
                    <Card key={transaction.id} className="clean-card border-none shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`p-2.5 rounded-full ${categoryColor.replace('text-', 'bg-')}/10`}><IconComponent className={`h-5 w-5 ${categoryColor}`} /></div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{transaction.description || categoryInfo?.name_he || 'הוצאה קבועה'}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-1">
                              <Calendar className="h-3 w-3" /> {frequencyText[transaction.recurrenceFrequency] || transaction.recurrenceFrequency}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-red-600 dark:text-red-400" dir="ltr">{formatCurrency(transaction.amount)}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            )}

            {/* כפתור הוספת תגית למעקב */}
            <button 
              onClick={() => setIsTagDialogOpen(true)}
              className="w-full mt-4 flex items-center justify-center p-3 border-2 border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              הוסף תגית למעקב ממוצע חודשי
            </button>

          </TabsContent>
        </Tabs>
      </div>
    </motion.div>

    {/* חלון קופץ: בחירת תגית למעקב */}
    <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">איזו תגית לעקוב?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          בחרי תגית קיימת. המערכת תחשב אוטומטית את הממוצע החודשי שלה ותציג אותו בהוצאות הקבועות.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {availableTagsToAdd.length === 0 ? (
            <p className="text-sm text-muted-foreground w-full text-center py-4">אין תגיות זמינות למעקב כרגע.</p>
          ) : (
            availableTagsToAdd.map(tag => (
              <button 
                key={tag} 
                onClick={() => addTrackedTag(tag)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-colors"
              >
                {tag}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* החלון הקופץ לפירוט העסקאות */}
    <Dialog open={drillDownData.isOpen} onOpenChange={(isOpen) => setDrillDownData(prev => ({ ...prev, isOpen }))}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">{drillDownData.title}</DialogTitle>
        </DialogHeader>
        <div className="mb-2 bg-muted/30 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">{drillDownData.subtitle}</p>
          <p className="font-bold text-2xl mt-1 text-foreground" dir="ltr">{formatCurrency(drillDownData.amount)}</p>
        </div>
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold mb-2">היסטוריית תשלומים:</h4>
          {drillDownData.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">לא נמצאו עסקאות.</p>
          ) : (
            drillDownData.transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-md border border-secondary/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{t.description || 'ללא תיאור'}</p>
                  <p className="text-xs text-muted-foreground">{formatDateHe(t.date)}</p>
                </div>
                <p className="font-semibold text-sm text-foreground" dir="ltr">{formatCurrency(t.amount)}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ReviewPage;