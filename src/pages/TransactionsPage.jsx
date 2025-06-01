
    import React from 'react';
    import { useNavigate, useLocation } from 'react-router-dom';
    import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
    import { Card, CardContent } from '@/components/ui/card.jsx';
    import { Button } from '@/components/ui/button.jsx';
    import { PlusCircle, Edit3, Trash2, TrendingUp, TrendingDown, DollarSign, Tag } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { useData } from '@/hooks/useData.jsx';
    import Header from '@/components/shared/Header.jsx';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog.jsx"


    const TransactionsPage = () => {
      const navigate = useNavigate();
      const location = useLocation();
      const { getTransactionsForMonth, getCategoryById, deleteTransaction, currentDate, getIconComponent } = useData();
      
      const filterCategoryId = location.state?.filterCategoryId;
      let transactions = getTransactionsForMonth();

      if (filterCategoryId) {
        transactions = transactions.filter(t => t.categoryId === filterCategoryId);
      }
      
      const handleEdit = (transaction) => {
        navigate('/add-transaction', { state: { transactionToEdit: transaction } });
      };

      const handleDelete = (transactionId) => {
        deleteTransaction(transactionId);
      };
      
      const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
      };

      const itemVariants = {
        hidden: { x: 20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      };

      return (
        <>
        <Header />
        <div className="space-y-6 pb-16">
          <MonthNavigator />
          <div className="flex justify-between items-center mb-6 px-1">
            <h1 className="text-2xl font-bold text-foreground">
              {filterCategoryId ? `עסקאות - ${getCategoryById(filterCategoryId)?.name_he || 'קטגוריה לא ידועה'}` : 'כל העסקאות'}
            </h1>
            <Button onClick={() => navigate('/add-transaction', {state: {currentMonthDate: currentDate.toISOString()}})} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="ml-2 h-5 w-5" /> הוסף עסקה
            </Button>
          </div>

          {transactions.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-1">
              <Card className="clean-card">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground text-lg">
                    {filterCategoryId ? 'אין עסקאות לקטגוריה זו החודש.' : 'אין עסקאות לחודש זה.'}
                  </p>
                  {!filterCategoryId && <p className="text-center text-muted-foreground">לחץ על "הוסף עסקה" כדי להתחיל!</p>}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.ul variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {transactions.map((transaction) => {
                const categoryInfo = getCategoryById(transaction.categoryId);
                const IconComponent = transaction.type === 'income' 
                  ? TrendingUp 
                  : (categoryInfo ? getIconComponent(categoryInfo.iconName) : DollarSign);
                const categoryName = categoryInfo ? categoryInfo.name_he : 'לא מסווג';
                const categoryColor = categoryInfo ? categoryInfo.color : 'text-gray-500';

                const amountColor = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                const iconBgColor = transaction.type === 'income' ? 'bg-green-500/20' : `${categoryColor?.replace('text-', 'bg-')}/20`;
                const iconColorClass = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : categoryColor || 'text-gray-500';

                return (
                  <motion.li key={transaction.id} variants={itemVariants}>
                    <Card className="clean-card hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`p-2.5 rounded-full ${iconBgColor}`}>
                            <IconComponent className={`h-5 w-5 ${iconColorClass}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-md text-foreground truncate">{transaction.description || categoryName}</p>
                            <div className="text-xs text-muted-foreground">
                              <span>{new Date(transaction.date).toLocaleDateString('he-IL')} - {categoryName}</span>
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
                        </div>
                        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                          <p className={`text-lg font-bold ${amountColor}`}>
                            {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="text-blue-500 hover:text-blue-400 w-8 h-8">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 w-8 h-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  פעולה זו תמחק את העסקה לצמיתות. לא ניתן לבטל פעולה זו.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>
        </>
      );
    };

    export default TransactionsPage;
  