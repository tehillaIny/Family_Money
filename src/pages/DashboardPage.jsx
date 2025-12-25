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

  const total = income + Math.abs(expenses);
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

  const formatMoney = (amount) => {
    return amount.toLocaleString('he-IL', { 
        style: 'currency', 
        currency: 'ILS', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    });
  };

  return (
    <>
      <Header />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col items-center space-y-4 pb-24 relative overflow-hidden min-h-[85vh]"
      >
        <div className="z-10 w-full flex justify-center mt-2">
             <MonthNavigator />
        </div>

        {/* אפקט זוהר מרכזי */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <motion.div
          variants={itemVariants}
          className="relative w-full h-[420px] sm:h-[480px] mx-auto -mt-2" 
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

          {/* מרכז העיגול - נקי וברור */}
          <div
            onClick={handleAddIncomeClick}
            role="button"
            tabIndex={0}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full flex flex-col items-center justify-center cursor-pointer z-10 hover:scale-105 transition-transform duration-200 bg-background/50 backdrop-blur-sm border border-white/20 shadow-inner"
            aria-label="הוסף הכנסה"
          >
            <div className="flex flex-col items-center justify-center h-full select-none text-center space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הכנסות</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-sans tracking-tight">
                {formatMoney(income)}
              </span>
              
              <div className="w-8 h-[2px] bg-border/60 my-1 rounded-full"></div>

              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הוצאות</span>
              <span className="text-lg font-bold text-rose-500 dark:text-rose-400 font-sans tracking-tight">
                {formatMoney(Math.abs(expenses))}
              </span>
              
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                 יתרה: {formatMoney(income - expenses)}
              </div>
            </div>
          </div>

          {/* קטגוריות מסביב לעיגול - צבעוניות */}
          {dashboardDisplayCategories.map((category, index) => {
            const IconComponent = getIconComponent(category.iconName) || DollarSign;
            const totalCategories = dashboardDisplayCategories.length;
            const angle = (2 * Math.PI * index) / totalCategories - Math.PI / 2; 
            const radius = 170; 
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            // חילוץ שם הצבע מתוך הקלאס (למשל text-red-500 -> red)
            // הנחה: הקלאס הוא משהו כמו 'text-red-500'
            const colorClass = category.color || 'text-primary';
            const bgColorClass = colorClass.replace('text-', 'bg-').split('-')[0] + '-' + colorClass.split('-')[1] + '-100'; 
            // התוצאה: אם היה text-red-500 נקבל bg-red-100 (רקע בהיר)

            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="absolute flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 group"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: '70px',
                  zIndex: 20,
                }}
              >
                {/* הבועה הצבעונית */}
                <div 
                  className={`
                    relative rounded-2xl p-3 mb-1.5 flex items-center justify-center 
                    shadow-sm group-hover:shadow-md border border-white/50 dark:border-white/10
                    transition-all duration-300 backdrop-blur-md
                    ${colorClass.replace('text-', 'bg-')}/10  /* רקע שקוף מאוד בצבע הקטגוריה */
                  `}
                >
                    <IconComponent 
                        className={`h-5 w-5 ${colorClass} drop-shadow-sm`} 
                    />
                </div>
                
                {/* תגית הסכום */}
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-medium text-muted-foreground leading-tight truncate w-full text-center">
                    {category.name_he}
                    </span>
                    <span className="text-xs font-bold text-foreground font-sans">
                    {formatMoney(category.total)}
                    </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
};

export default DashboardPage;