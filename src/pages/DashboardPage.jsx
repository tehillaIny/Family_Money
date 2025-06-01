
    import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
    import { Card, CardContent } from '@/components/ui/card.jsx';
    import { Button } from '@/components/ui/button.jsx';
    import { DollarSign, Plus } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { useData } from '@/hooks/useData.jsx';
    import Header from '@/components/shared/Header.jsx';

    const DashboardPage = () => {
      const navigate = useNavigate();
      const { getBalanceForMonth, getCategorySummariesForMonth, getCategoryById, categories: allCategories, getIconComponent } = useData();
      const { income, expenses } = getBalanceForMonth();
      
      const monthlyCategorySummaries = getCategorySummariesForMonth();

      const dashboardDisplayCategories = allCategories
        .filter(cat => cat.showOnDashboard && cat.type === 'expense')
        .map(cat => {
          const summary = monthlyCategorySummaries.find(s => s.categoryId === cat.id);
          return {
            ...cat,
            total: summary ? summary.total : 0, 
          };
        });

      const total = income + expenses;
      const incomePercentage = total > 0 ? (income / total) * 100 : 0;
      const expensePercentage = total > 0 ? (expenses / total) * 100 : 0;

      const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
      };

      const itemVariants = {
        hidden: { scale: 0.5, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 150, damping: 15 } },
      };
      
      const handleCategoryClick = (categoryId) => {
        navigate('/add-transaction', { state: { preselectedCategoryId: categoryId, type: 'expense' } });
      };
      
      const handleAddIncomeClick = () => {
         navigate('/add-transaction', { state: { type: 'income' } });
      };

      return (
        <>
        <Header />
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants} 
          className="flex flex-col items-center space-y-6 pb-16"
        >
          <MonthNavigator />

          <motion.div variants={itemVariants} className="relative w-64 h-64 sm:w-72 sm:h-72">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50" cy="50" r="45"
                fill="transparent"
                stroke="hsl(var(--chart-green) / 0.2)"
                strokeWidth="10"
              />
              {income > 0 && (
                <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke="hsl(var(--chart-green))"
                  strokeWidth="10"
                  strokeDasharray={`${incomePercentage} ${100 - incomePercentage}`}
                  strokeDashoffset="0"
                  className="transition-all duration-500 ease-out"
                />
              )}
              {expenses > 0 && (
                 <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke="hsl(var(--chart-red))"
                  strokeWidth="10"
                  strokeDasharray={`${expensePercentage} ${100 - expensePercentage}`}
                  strokeDashoffset={-incomePercentage} 
                  className="transition-all duration-500 ease-out"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                הכנסות: {income.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                הוצאות: {expenses.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                סה"כ: {(income - expenses).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Button onClick={handleAddIncomeClick} className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="ml-2 h-5 w-5" /> הוסף הכנסה
            </Button>
          </motion.div>


          <h2 className="text-xl font-semibold text-foreground pt-4">הוסף הוצאה מהירה</h2>
          {dashboardDisplayCategories.length === 0 ? (
             <motion.p variants={itemVariants} className="text-muted-foreground">אין קטגוריות להצגה בלוח המחוונים. ניתן לערוך בהגדרות.</motion.p>
          ) : (
            <motion.div 
              variants={containerVariants} 
              className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full max-w-md px-2"
            >
              {dashboardDisplayCategories.map(category => {
                const IconComponent = getIconComponent(category.iconName) || DollarSign;
                return (
                  <motion.div 
                    key={category.id} 
                    variants={itemVariants}
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex flex-col items-center space-y-1 p-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                  >
                    <div className={`p-3 rounded-full ${category.color?.replace('text-', 'bg-')}/20`}>
                      <IconComponent className={`h-7 w-7 ${category.color || 'text-primary'}`} />
                    </div>
                    <p className="text-xs text-center font-medium text-foreground truncate w-full">{category.name_he}</p>
                    <p className="text-sm font-semibold" style={{color: `hsl(var(--chart-red))`}}>
                      {category.total.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0})}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
        </>
      );
    };

    export default DashboardPage;
  