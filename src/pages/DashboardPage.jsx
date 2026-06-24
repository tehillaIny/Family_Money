import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
import Header from '@/components/shared/Header.jsx';
import BalancePieChart from '@/components/dashboard/BalancePieChart.jsx';
import CategoryCircleItem from '@/components/dashboard/CategoryCircleItem.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    getBalanceForMonth,
    getCategorySummariesForMonth,
    categories: allCategories,
    transactions,
    currentDate 
  } = useData();

  const { income, expenses } = useMemo(() => {
    return getBalanceForMonth();
  }, [transactions, currentDate, getBalanceForMonth]);

  const monthlyCategorySummaries = useMemo(() => {
    return getCategorySummariesForMonth();
  }, [transactions, currentDate, getCategorySummariesForMonth]);

  const dashboardDisplayCategories = useMemo(() => {
    return allCategories
      .filter(cat => cat.showOnDashboard && cat.type === 'expense')
      .map(cat => {
        const summary = monthlyCategorySummaries.find(s => s.categoryId === cat.id);
        return { ...cat, total: summary ? summary.total : 0 };
      })
      .sort((a, b) => a.name_he.localeCompare(b.name_he, 'he'))
      .slice(0, 12);
  }, [allCategories, monthlyCategorySummaries]);

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

  const formatCurrency = (amount) => {
    return amount.toLocaleString('he-IL', { 
        style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 
    });
  };

  return (
    <>
      <Header />
      <motion.div
        initial="hidden" animate="visible" variants={containerVariants}
        className="flex flex-col items-center space-y-4 pb-24 relative overflow-hidden min-h-[85vh]"
      >
        <div className="z-10 w-full flex justify-center mt-2">
             <MonthNavigator />
        </div>

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <motion.div variants={itemVariants} className="relative w-full h-[420px] sm:h-[480px] mx-auto -mt-2">
          
          <BalancePieChart income={income} expenses={expenses} />

          <div
            onClick={handleAddIncomeClick} role="button" tabIndex={0}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full flex flex-col items-center justify-center cursor-pointer z-10 hover:scale-105 transition-transform duration-200 bg-background/50 backdrop-blur-sm border border-white/20 shadow-inner"
            aria-label="הוסף הכנסה"
          >
            <div className="flex flex-col items-center justify-center h-full select-none text-center space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הכנסות</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-sans tracking-tight">
                {formatCurrency(income)}
              </span>
              
              <div className="w-8 h-[2px] bg-border/60 my-1 rounded-full"></div>

              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הוצאות</span>
              <span className="text-lg font-bold text-rose-500 dark:text-rose-400 font-sans tracking-tight">
                {formatCurrency(Math.abs(expenses))}
              </span>
              
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                 יתרה: {formatCurrency(income - expenses)}
              </div>
            </div>
          </div>

          {dashboardDisplayCategories.map((category, index) => {
            const totalCategories = dashboardDisplayCategories.length;
            const angle = (2 * Math.PI * index) / totalCategories - Math.PI / 2; 
            const radius = 170; 
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <CategoryCircleItem
                key={category.id}
                category={category}
                x={x}
                y={y}
                onClick={handleCategoryClick}
                formatCurrency={formatCurrency}
              />
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
};

export default DashboardPage;