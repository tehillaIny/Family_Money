
    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
    import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx"
    import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { useData } from '@/hooks/useData.jsx';
    import Header from '@/components/shared/Header.jsx';
    import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';


    const ReviewPage = () => {
      const navigate = useNavigate();
      const { getBalanceForMonth, getCategorySummariesForMonth, getIncomeSummariesForMonth, getCategoryById, getIconComponent } = useData();
      const { income, expenses, balance } = getBalanceForMonth();
      
      const [activeTab, setActiveTab] = useState("expenses"); 

      const categoryExpenseSummaries = getCategorySummariesForMonth().sort((a, b) => b.total - a.total);
      const categoryIncomeSummaries = getIncomeSummariesForMonth().sort((a, b) => b.total - a.total);

      const dataToDisplay = activeTab === "expenses" ? categoryExpenseSummaries : categoryIncomeSummaries;
      const totalForTab = activeTab === "expenses" ? expenses : income;

      const chartData = dataToDisplay.map(summary => {
        const category = getCategoryById(summary.categoryId);
        return {
          name: category?.name_he || 'לא ידוע',
          value: summary.total,
          color: category?.colorHex || '#8884d8' 
        }
      });

      const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
      };

      const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
      };
      
      const handleCategoryItemClick = (categoryId) => {
         navigate('/transactions', { state: { filterCategoryId: categoryId } });
      };

      return (
        <>
        <Header />
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants} 
          className="space-y-6 pb-16"
        >
          <MonthNavigator />
          <h1 className="text-2xl font-bold text-foreground text-center">סקירה חודשית</h1>

          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-4 text-center px-1">
            <Card className="clean-card py-3 sm:py-4">
              <CardContent className="p-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1" />
                <p className="text-xs sm:text-sm text-muted-foreground">הכנסות</p>
                <div className="text-md sm:text-lg font-bold text-green-600 dark:text-green-400">
                  {income.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits:0 })}
                </div>
              </CardContent>
            </Card>
            <Card className="clean-card py-3 sm:py-4">
              <CardContent className="p-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-1" />
                <p className="text-xs sm:text-sm text-muted-foreground">הוצאות</p>
                <div className="text-md sm:text-lg font-bold text-red-600 dark:text-red-400">
                  {expenses.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits:0 })}
                </div>
              </CardContent>
            </Card>
            <Card className="clean-card py-3 sm:py-4">
              <CardContent className="p-0">
                <DollarSign className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                <p className="text-xs sm:text-sm text-muted-foreground">מאזן</p>
                <div className={`text-md sm:text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {balance.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits:0 })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="px-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">הוצאות</TabsTrigger>
                <TabsTrigger value="income">הכנסות</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          
          <motion.div variants={itemVariants} className="px-1">
            <Card className="clean-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center">
                  <BarChart3 className="ml-2 h-5 w-5 text-primary" />
                  {activeTab === "expenses" ? "התפלגות הוצאות" : "התפלגות הכנסות"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center text-muted-foreground">אין נתונים להצגה.</p>
                ) : (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={80} 
                          tickLine={false} 
                          axisLine={false} 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{fontSize: 12}}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits:0 })}`, activeTab === "expenses" ? "הוצאה" : "הכנסה"]}
                          cursor={{fill: 'hsl(var(--muted))'}}
                          contentStyle={{backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)', direction: 'rtl'}}
                        />
                        <Bar dataKey="value" barSize={20} radius={[0, 5, 5, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="px-1">
            <Card className="clean-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">פירוט לפי קטגוריות</CardTitle>
              </CardHeader>
              <CardContent>
                {dataToDisplay.length === 0 ? (
                  <p className="text-center text-muted-foreground">אין {activeTab === "expenses" ? "הוצאות" : "הכנסות"} החודש.</p>
                ) : (
                  <ul className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {dataToDisplay.map(summary => {
                      const categoryInfo = getCategoryById(summary.categoryId);
                      if (!categoryInfo) return null;
                      const IconComponent = getIconComponent(categoryInfo.iconName) || DollarSign;
                      const percentage = totalForTab > 0 ? (summary.total / totalForTab) * 100 : 0;
                      const amountColor = activeTab === "expenses" ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                      const barColor = categoryInfo.colorHex || (activeTab === "expenses" ? 'hsl(var(--chart-red))' : 'hsl(var(--chart-green))');

                      return (
                        <motion.li 
                          key={summary.categoryId} 
                          variants={itemVariants} 
                          className="p-2.5 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
                          onClick={() => handleCategoryItemClick(summary.categoryId)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                              <div className={`p-1.5 rounded-full ${categoryInfo.color?.replace('text-', 'bg-')}/20`}>
                                <IconComponent className={`h-5 w-5 ${categoryInfo.color || 'text-primary'}`} />
                              </div>
                              <span className="font-medium text-foreground text-sm">{categoryInfo.name_he}</span>
                            </div>
                            <span className={`font-semibold ${amountColor} text-sm`}>
                              {summary.total.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits:0})}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className="w-full bg-muted rounded-full h-2 flex-grow">
                              <motion.div 
                                className="h-2 rounded-full"
                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-left">{percentage.toFixed(0)}%</span>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        </>
      );
    };

    export default ReviewPage;
  