import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { PlusCircle, Edit3, Trash2, TrendingUp, TrendingDown, DollarSign, Tag, Repeat, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import RecurringTransactionDialog from '@/components/shared/RecurringTransactionDialog.jsx';
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
import { formatDate } from '@/lib/utils.js';
import { Input } from '@/components/ui/input.jsx';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    getTransactionsForMonth, 
    getCategoryById, 
    deleteTransaction,
    deleteSingleTransaction,
    deleteEntireSeries,
    deleteFromCurrentOnward,
    currentDate, 
    getIconComponent,
    searchTransactions
  } = useData();
  
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [dialogAction, setDialogAction] = useState('delete');
  const [selectedTag, setSelectedTag] = useState(null);
  const [search, setSearch] = useState('');
  
  const filterCategoryId = location.state?.filterCategoryId;
  let transactions = getTransactionsForMonth();

  if (search) {
    transactions = searchTransactions(search);
  }

  if (filterCategoryId) {
    transactions = transactions.filter(t => t.categoryId === filterCategoryId);
  }

  if (selectedTag) {
    transactions = transactions.filter(t => t.tags?.includes(selectedTag));
  }
  
  const handleEdit = (transaction) => {
    if (transaction.originalId || transaction.recurring) {
      setSelectedTransaction(transaction);
      setDialogAction('edit');
      setRecurringDialogOpen(true);
    } else {
      navigate('/add-transaction', { state: { transactionToEdit: transaction } });
    }
  };

  const handleDelete = (transaction) => {
    if (transaction.originalId || transaction.recurring) {
      setSelectedTransaction(transaction);
      setDialogAction('delete');
      setRecurringDialogOpen(true);
    } else {
      deleteTransaction(transaction.id);
    }
  };

  const handleRecurringAction = (action) => {
    if (!selectedTransaction) return;

    if (dialogAction === 'delete') {
      switch (action) {
        case 'single':
          deleteSingleTransaction(selectedTransaction.id);
          break;
        case 'future':
          deleteFromCurrentOnward(selectedTransaction);
          break;
        case 'all':
          deleteEntireSeries(selectedTransaction.originalId || selectedTransaction.id);
          break;
      }
    } else if (dialogAction === 'edit') {
      navigate('/add-transaction', { 
        state: { 
          transactionToEdit: selectedTransaction,
          editMode: action
        } 
      });
    }
  };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const isFutureTransaction = (date) => {
    const transactionDate = new Date(date);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate > now;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const yearTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= yearStart && transactionDate <= yearEnd;
  });

  return (
    <>
      <Header />
      <div className="space-y-6 pb-16">
        <MonthNavigator />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 px-1 gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="חיפוש כללי (קטגוריה, תיאור, תגית...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex justify-end mt-2 sm:mt-0">
            <Button onClick={() => navigate('/add-transaction', {state: {currentMonthDate: currentDate.toISOString()}})} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="ml-2 h-5 w-5" /> הוסף עסקה
            </Button>
          </div>
        </div>

        {/* Tag filter */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">מסנן לפי תגית:</span>
            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full flex items-center gap-1">
              {selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

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
            {transactions.map((transaction, index) => {
              const categoryInfo = getCategoryById(transaction.categoryId);
              const IconComponent = transaction.type === 'income' 
                ? TrendingUp 
                : transaction.type === 'expense' 
                  ? TrendingDown 
                  : DollarSign;
              const categoryName = categoryInfo ? categoryInfo.name_he : 'לא מסווג';
              const categoryColor = categoryInfo ? categoryInfo.color : 'text-gray-500';
              const isFuture = isFutureTransaction(transaction.date);

              const amountColor = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
              const iconBgColor = transaction.type === 'income' ? 'bg-green-500/20' : `${categoryColor?.replace('text-', 'bg-')}/20`;
              const iconColorClass = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : categoryColor || 'text-gray-500';

              // Add separator before future transactions
              const showSeparator = index > 0 && 
                isFuture && 
                !isFutureTransaction(transactions[index - 1].date);

              return (
                <React.Fragment key={transaction.id}>
                  {showSeparator && (
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground">עסקאות עתידיות</span>
                      </div>
                    </div>
                  )}
                  <motion.li variants={itemVariants}>
                    <Card className={`clean-card hover:shadow-lg transition-shadow duration-200 ${isFuture ? 'opacity-60' : ''}`}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`p-2.5 rounded-full ${iconBgColor}`}>
                            <IconComponent className={`h-5 w-5 ${iconColorClass}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-md text-foreground truncate">
                                {categoryName}
                              </p>
                              {(transaction.originalId || transaction.recurring) && (
                                <Repeat className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span>{formatDate(transaction.date)} - {transaction.description || ''}</span>
                              {transaction.tags && transaction.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {transaction.tags.map(tag => (
                                    <button
                                      key={tag}
                                      onClick={() => setSelectedTag(tag)}
                                      className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded-full flex items-center hover:bg-primary/20 hover:text-primary transition-colors"
                                    >
                                      <Tag className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                                      {tag}
                                    </button>
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
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction)} className="text-red-500 hover:text-red-400 w-8 h-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.li>
                </React.Fragment>
              );
            })}
          </motion.ul>
        )}
      </div>

      <RecurringTransactionDialog
        isOpen={recurringDialogOpen}
        onClose={() => setRecurringDialogOpen(false)}
        onAction={handleRecurringAction}
        actionType={dialogAction}
      />
    </>
  );
};

export default TransactionsPage;
  