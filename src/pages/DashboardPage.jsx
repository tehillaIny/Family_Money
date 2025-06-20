import React from 'react';
import { useNavigate } from 'react-router-dom';
import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
import { DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    getBalanceForMonth,
    getCategorySummariesForMonth,
    categories: allCategories,
    getIconComponent,
  } = useData();

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

  const total = income; + Math.abs(expenses);
  const hasData = income > 0 || Math.abs(expenses) > 0;

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

        <motion.div
          variants={itemVariants}
          className="relative w-80 h-80 sm:w-[22rem] sm:h-[22rem] mx-auto mt-8"
        >
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
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={income > 0 ? 2 : 0}
                isAnimationActive
              >
                {income > 0 ? (
                  <>
                    <Cell fill="hsl(var(--chart-red))" />
                    <Cell fill="hsl(var(--chart-green))" />
                  </>
                ) : (
                  <Cell fill="#ccc" />
                )}
              </Pie>
              {income > 0 && (
                <Tooltip
                  contentStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem' }}
                  formatter={(value, name) => [
                    `${((value / income) * 100).toFixed(1)}%`,
                    name === 'הוצאות' ? 'הוצאות' : 'נותר',
                  ]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* מרכז העיגול */}
          <div
            onClick={handleAddIncomeClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleAddIncomeClick();
            }}
            className="absolute"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 10,
            }}
            aria-label="הוסף הכנסה"
          >
            <div className="flex flex-col items-center justify-center h-full select-none pointer-events-none text-center">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                הכנסות: {income.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                הוצאות: {expenses.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                סה"כ: {(income - expenses).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* קטגוריות מסביב לעיגול */}
          {dashboardDisplayCategories.map((category, index) => {
            const IconComponent = getIconComponent(category.iconName) || DollarSign;
            const totalCategories = dashboardDisplayCategories.length;
            const angle = (2 * Math.PI * index) / totalCategories;
            const radius = 170; // הורחב
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="absolute flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-secondary rounded-xl"
                style={{
                  transform: `translate(-50%, -50%)`,
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: '64px',
                  pointerEvents: 'auto',
                  zIndex: 5,
                }}
              >
                <div className={`p-2 rounded-full ${category.color?.replace('text-', 'bg-')}/20`}>
                  <IconComponent className={`h-6 w-6 ${category.color || 'text-primary'}`} />
                </div>
                <p className="text-xs font-medium text-foreground truncate w-full">{category.name_he}</p>
                <p
                  className="text-xs font-semibold text-[hsl(var(--chart-red))]"
                  style={{ userSelect: 'none' }}
                >
                  {category.total.toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
};

export default DashboardPage;