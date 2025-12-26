import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthNavigator from '@/components/shared/MonthNavigator.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { 
  PlusCircle, Edit3, Trash2, TrendingUp, TrendingDown, 
  DollarSign, Tag, Repeat, X, User // <-- הוספתי את User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import RecurringTransactionDialog from '@/components/shared/RecurringTransactionDialog.jsx';
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
  now.setHours(0, 0, 0, 0);

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

  return (
    <>
      <Header />
      <div className="space-y-6 pb-16 px-2 sm:px-0">
        <MonthNavigator />
        
        {/* חיפוש וכפתור הוספה */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="חיפוש כללי (קטגוריה, תיאור, יוצר...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex justify-end mt-2 sm:mt-0">
            <Button onClick={() => navigate('/add-transaction', {state: {currentMonthDate: currentDate.toISOString()}})} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
              <PlusCircle className="ml-2 h-5 w-5" /> הוסף עסקה
            </Button>
          </div>
        </div>

        {/* סינון תגיות */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="clean-card border-dashed">
              <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">
                  {filterCategoryId ? 'אין עסקאות לקטגוריה זו החודש.' : 'אין עסקאות לחודש זה.'}
                </p>
                {!filterCategoryId && <p className="text-sm text-muted-foreground mt-2">לחץ על "הוסף עסקה" כדי להתחיל!</p>}
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
              const iconBgColor = transaction.type === 'income' ? 'bg-green-500/10' : `${categoryColor?.replace('text-', 'bg-')}/10`;
              const iconColorClass = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : categoryColor || 'text-gray-500';

              const showSeparator = index > 0 && isFuture && !isFutureTransaction(transactions[index - 1].date);

              return (
                <React.Fragment key={transaction.id}>
                  {showSeparator && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-3 text-xs font-medium text-muted-foreground">עסקאות עתידיות</span>
                      </div>
                    </div>
                  )}
                  <motion.li variants={itemVariants}>
                    <Card className={`clean-card hover:shadow-md transition-all duration-200 border-none shadow-sm ${isFuture ? 'opacity-70 bg-muted/30' : ''}`}>
                      <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                        
                        {/* צד ימין: אייקון ופרטים */}
                        <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0 flex-1">
                          <div className={`p-3 rounded-2xl ${iconBgColor} shrink-0`}>
                            <IconComponent className={`h-5 w-5 ${iconColorClass}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-2">
                            {/* שורה עליונה: שם קטגוריה ואייקון חזרתיות */}
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-base text-foreground truncate">
                                {categoryName}
                              </p>
                              {(transaction.originalId || transaction.recurring) && (
                                <Repeat className="h-3.5 w-3.5 text-muted-foreground/70" />
                              )}
                            </div>

                            {/* שורה תחתונה: מטא-דאטה (תאריך, תיאור, יוצר) */}
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>{formatDate(transaction.date)}</span>

                              {transaction.description && (
                                <>
                                  <span className="text-muted-foreground/40">•</span>
                                  <span className="truncate max-w-[150px]">{transaction.description}</span>
                                </>
                              )}

                              {/* --- כאן השינוי: הצגת שם היוצר --- */}
                              {transaction.creatorName && (
                                <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground font-medium select-none">
                                    <User className="h-3 w-3" />
                                    {transaction.creatorName}
                                </div>
                              )}
                            </div>

                            {/* תגיות */}
                            {transaction.tags && transaction.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {transaction.tags.map(tag => (
                                  <button
                                    key={tag}
                                    onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                                    className="px-2 py-0.5 text-[10px] bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-md flex items-center transition-colors border border-transparent hover:border-primary/20"
                                  >
                                    <Tag className="h-2.5 w-2.5 mr-1 rtl:ml-1 rtl:mr-0" />
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* צד שמאל: סכום ופעולות */}
                        <div className="flex items-center gap-3 rtl:mr-2">
                          <p className={`text-lg font-bold whitespace-nowrap ${amountColor}`} dir="ltr">
                            {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </p>
                          
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-0">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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