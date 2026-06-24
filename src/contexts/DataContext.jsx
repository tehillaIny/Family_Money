import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { defaultCategories, iconMap, getIconComponent } from '../constants/categories';
import { toLocalISOString } from '../lib/utils';
import { dbService } from '../services/dbService';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const { familyId, userData, currentUser } = useAuth();
  const userId = familyId; 
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletedTransactions, setDeletedTransactions] = useState(new Map());

  // --- 1. Initial Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const { loadedTransactions, categoriesDocs, deletedMap } = await dbService.fetchInitialData(userId);
        
        setDeletedTransactions(deletedMap);
        setTransactions(loadedTransactions);

        const usedCategoryIds = new Set((loadedTransactions || []).map(t => t.categoryId).filter(Boolean));
        const rawCategories = categoriesDocs.map(docSnap => ({
          ...docSnap.data(),
          firestoreId: docSnap.id,
          dataId: docSnap.data().id,
        }));

        const groups = new Map();
        rawCategories.forEach(cat => {
          const canonicalId = cat.dataId || cat.firestoreId;
          if (!groups.has(canonicalId)) groups.set(canonicalId, []);
          groups.get(canonicalId).push(cat);
        });

        const loadedCategories = Array.from(groups.entries()).map(([canonicalId, cats]) => {
          const referenced = cats.find(c => usedCategoryIds.has(c.firestoreId));
          const byIdMatch = cats.find(c => c.firestoreId === canonicalId);
          const chosen = referenced || byIdMatch || cats[0];
          
          const merged = { ...chosen };
          cats.forEach(c => {
             Object.keys(c).forEach(k => {
               if (merged[k] == null || merged[k] === '') merged[k] = c[k];
             });
          });

          if (!merged.type) merged.type = 'expense';
          if (merged.showOnDashboard === undefined) merged.showOnDashboard = merged.type === 'expense';
          
          const { firestoreId, dataId, ...rest } = merged;
          return { ...rest, id: firestoreId };
        });

        if (loadedCategories.length === 0) {
          await dbService.saveCategoriesBatch(userId, defaultCategories);
          setCategories(defaultCategories);
        } else {
          setCategories(loadedCategories);
        }

        setInitialized(true);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };

    fetchData();
  }, [userId]);

  // --- 2. Generator for Recurring Transactions ---
  useEffect(() => {
    if (!initialized || !transactions.length) return;

    const generateFutureRecurringTransactions = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      try {
        const isAlreadySynced = await dbService.checkSyncStatus(userId, todayStr);
        if (isAlreadySynced) return;
      } catch (error) {
        console.error('❌ Error checking sync status:', error);
      }

      const futureTransactions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 3);

      const recurringTransactions = transactions.filter(t => t.recurring && !t.originalId);

      const parseLocalDate = (dateStr) => {
          if (!dateStr) return new Date();
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(y, m - 1, d, 12, 0, 0); 
      };

      for (const t of recurringTransactions) {
        if (!t.recurrenceFrequency) continue;

        const startDate = parseLocalDate(t.date);
        const startDay = startDate.getDate(); 

        const maxCount = t.recurrenceEndType === 'count' ? (t.recurrenceOccurrences || 100) : 1000;
        let endByDate = endDate;
        if (t.recurrenceEndType === 'date' && t.recurrenceEndDate) {
            const explicitEndDate = parseLocalDate(t.recurrenceEndDate);
            explicitEndDate.setHours(23, 59, 59);
            endByDate = explicitEndDate < endDate ? explicitEndDate : endDate;
        }

        let count = 1; 

        const calculateNextDate = (index) => {
            const d = new Date(startDate);
            d.setHours(12, 0, 0, 0); 

            if (t.recurrenceFrequency === 'monthly') {
                d.setMonth(startDate.getMonth() + index);
                if (d.getDate() !== startDay) {
                    d.setDate(0); 
                }
            } else if (t.recurrenceFrequency === 'weekly') {
                d.setDate(startDate.getDate() + (index * 7));
            } else if (t.recurrenceFrequency === 'daily') {
                d.setDate(startDate.getDate() + index);
            }
            return d;
        };

        let nextInstanceDate = calculateNextDate(count);

        while (nextInstanceDate <= endByDate && count < maxCount) {
          const isoDate = toLocalISOString(nextInstanceDate);
          const isDeleted = deletedTransactions.get(t.id)?.has(isoDate);
          const alreadyExists = transactions.some(
            (tx) => (tx.originalId === t.id || tx.id === t.id) && tx.date === isoDate
          );

          if (!alreadyExists && !isDeleted && nextInstanceDate >= today) {
            futureTransactions.push({
              ...t,
              id: dbService.generateId(userId),
              originalId: t.id,
              date: isoDate,
              recurring: false,
              createdAt: Date.now()
            });
          }

          count++;
          nextInstanceDate = calculateNextDate(count);
        }
      }

      if (futureTransactions.length > 0) {
        await addTransactions(futureTransactions);
      }

      try {
        await dbService.updateSyncStatus(userId, todayStr);
      } catch (error) {
        console.error('❌ Error updating sync status:', error);
      }
    };

    generateFutureRecurringTransactions();
  }, [initialized, transactions.length, deletedTransactions, currentDate]); 

  // --- 3. CRUD Operations ---
  const addTransaction = async (transaction) => {    
    const id = transaction.id || dbService.generateId(userId);
    const createdAt = transaction.createdAt || Date.now();
    const safeDate = toLocalISOString(transaction.date);
    const creatorName = userData?.name || currentUser?.email?.split('@')[0] || 'Unknown';

    const newTransaction = { 
        ...transaction, 
        id, 
        createdAt,
        date: safeDate,
        createdBy: currentUser?.uid, 
        creatorName: creatorName     
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    if (userId) {
      await dbService.saveTransaction(userId, id, newTransaction);
    }
    return newTransaction;
  };

  const addTransactions = async (transactionsArray) => {
    if (transactionsArray.length === 0) return;
    
    const newTransactions = transactionsArray.map(t => ({
      ...t,
      id: t.id || dbService.generateId(userId),
      createdAt: t.createdAt || Date.now(),
      date: toLocalISOString(t.date)
    }));
    
    setTransactions(prev => [...prev, ...newTransactions]);
    if (userId) {
      await dbService.saveTransactionsBatch(userId, newTransactions);
    }
  };

  const updateTransaction = async (updatedTransaction) => {
    const safeDate = toLocalISOString(updatedTransaction.date);
    const payload = { 
        ...updatedTransaction, 
        date: safeDate,
        createdAt: updatedTransaction.createdAt || Date.now() 
    };

    setTransactions(prev => prev.map(t => (t.id === updatedTransaction.id ? payload : t)));
    if (userId) {
      await dbService.saveTransaction(userId, updatedTransaction.id, payload);
    }
  };

  const deleteTransaction = async (transactionId) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    if (userId) {
      await dbService.deleteTransaction(userId, transactionId);
    }
  };

  // --- 4. Special Recurrence Handlers ---
  const deleteSingleTransaction = async (transactionId) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    const payload = { ...transactionToDelete, deleted: true };

    if (userId) {
        await dbService.saveTransaction(userId, transactionId, payload);
    }

    setDeletedTransactions(prev => {
      const newMap = new Map(prev);
      const key = transactionToDelete.originalId || transactionToDelete.id;
      if (!newMap.has(key)) newMap.set(key, new Set());
      newMap.get(key).add(transactionToDelete.date);
      return newMap;
    });

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  const terminateSeriesAtDate = async (transaction, terminationDate) => {
    const originalId = transaction.originalId || transaction.id;
    const originalTransaction = transactions.find(t => t.id === originalId);
    
    if (originalTransaction) {
        const endDateForOldSeries = new Date(terminationDate);
        endDateForOldSeries.setDate(endDateForOldSeries.getDate() - 1); 

        const updatedOriginal = {
            ...originalTransaction,
            recurrenceEndType: 'date',
            recurrenceEndDate: toLocalISOString(endDateForOldSeries)
        };
        await updateTransaction(updatedOriginal);
    }

    const terminationIso = toLocalISOString(terminationDate);
    const transactionsToDelete = transactions.filter(t => {
        const isPartOfSeries = t.id === originalId || t.originalId === originalId;
        return isPartOfSeries && t.date >= terminationIso && t.id !== originalId;
    });

    if (userId && transactionsToDelete.length > 0) {
        await dbService.updateTransactionsDeletedBatch(userId, transactionsToDelete);
    }

    setTransactions(prev => prev.filter(t => !transactionsToDelete.some(del => del.id === t.id)));
    
    setDeletedTransactions(prev => {
        const newMap = new Map(prev);
        transactionsToDelete.forEach(t => {
            const key = t.originalId || t.id;
            if (!newMap.has(key)) newMap.set(key, new Set());
            newMap.get(key).add(t.date);
        });
        return newMap;
    });
  };

  const deleteFromCurrentOnward = async (transaction) => {
    const [y, m, d] = transaction.date.split('-').map(Number);
    const currentDateObj = new Date(y, m - 1, d, 12, 0, 0); 
    await terminateSeriesAtDate(transaction, currentDateObj);
  };

  const editFromCurrentOnward = async (transaction, updates) => {
    const [y, m, d] = transaction.date.split('-').map(Number);
    const splitDate = new Date(y, m - 1, d, 12, 0, 0); 
    const originalId = transaction.originalId || transaction.id;
    const originalTransaction = transactions.find(t => t.id === originalId);
    
    if (!originalTransaction) return;

    await terminateSeriesAtDate(transaction, splitDate);
    const creatorName = userData?.name || currentUser?.email?.split('@')[0] || 'Unknown';

    const newSeriesTransaction = {
        ...originalTransaction, 
        ...updates,             
        id: dbService.generateId(userId),
        originalId: null,       
        date: toLocalISOString(splitDate),
        createdAt: Date.now(),
        recurring: true,
        recurrenceEndType: updates.recurrenceEndType || originalTransaction.recurrenceEndType,
        recurrenceEndDate: updates.recurrenceEndDate || originalTransaction.recurrenceEndDate,
        recurrenceOccurrences: updates.recurrenceOccurrences || originalTransaction.recurrenceOccurrences,
        createdBy: currentUser?.uid,
        creatorName: creatorName
    };

    await addTransaction(newSeriesTransaction);
  };

  const deleteEntireSeries = async (originalId) => {
    const transactionsToDelete = transactions.filter(t => 
        t.id === originalId || t.originalId === originalId
    );

    if (userId && transactionsToDelete.length > 0) {
        await dbService.updateTransactionsDeletedBatch(userId, transactionsToDelete);
    }
    
    setTransactions(prev => prev.filter(t => !transactionsToDelete.some(del => del.id === t.id)));
  };

  const editSingleTransaction = async (updatedTransaction) => {
    await updateTransaction(updatedTransaction);
  };

  const editEntireSeries = async (originalId, updates) => {
    const seriesTransactions = transactions.filter(t => t.id === originalId || t.originalId === originalId);
    const childrenToDelete = seriesTransactions.filter(t => t.id !== originalId);
    const parent = seriesTransactions.find(t => t.id === originalId);
    
    const updatedParent = { ...parent, ...updates };
    if (updates.date) updatedParent.date = toLocalISOString(updates.date);

    if (userId) {
        await dbService.editEntireSeriesDb(userId, originalId, childrenToDelete, updatedParent);
    }

    setDeletedTransactions(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalId); 
        return newMap;
    });

    setTransactions(prev => {
        const otherTransactions = prev.filter(t => t.id !== originalId && t.originalId !== originalId);
        return [...otherTransactions, updatedParent];
    });
  };

  // --- 5. Data Getters ---
  const getTransactionsForMonth = (date = currentDate, { excludeFuture = false } = {}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions
      .filter(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        const tDate = new Date(y, m - 1, d); 
        
        if (excludeFuture && tDate > today) return false;
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      })
      .sort((a, b) => {
        const da = new Date(a.date);
        const db_date = new Date(b.date);
        if (db_date.getTime() !== da.getTime()) return db_date - da;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  };

  const getBalanceForMonth = (date = currentDate) => {
    const monthTransactions = getTransactionsForMonth(date, { excludeFuture: true });
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { income, expenses, balance: income - expenses };
  };

  const getCategorySummariesForMonth = (date = currentDate, type = 'expense') => {
    const monthTransactions = getTransactionsForMonth(date, { excludeFuture: true }).filter(t => t.type === type);
    const summaries = {};
    monthTransactions.forEach(t => {
      summaries[t.categoryId] = (summaries[t.categoryId] || 0) + parseFloat(t.amount || 0);
    });
    return Object.entries(summaries).map(([categoryId, total]) => ({ categoryId, total }));
  };

  const getIncomeSummariesForMonth = (date = currentDate) => getCategorySummariesForMonth(date, 'income');

  // --- 6. Categories CRUD ---  
  const addCategory = async (newCategory) => {
    const id = 'cat_' + dbService.generateId(userId);
    const category = { ...newCategory, id };
    const { icon, ...categoryToSave } = category;
    
    setCategories(prev => [...prev, { ...category, icon: getIconComponent(newCategory.iconName) }]);
    if (userId) {
        await dbService.saveCategory(userId, id, categoryToSave);
    }
  };

  const updateCategory = async (updatedCategory) => {
    const { icon, ...categoryToSave } = updatedCategory;
    const newCategory = { ...updatedCategory, icon: getIconComponent(updatedCategory.iconName) };
    
    setCategories(prev => prev.map(cat => cat.id === newCategory.id ? newCategory : cat));
    if (userId) {
        await dbService.saveCategory(userId, newCategory.id, categoryToSave);
    }
  };

  const deleteCategory = async (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (userId) {
        await dbService.deleteCategory(userId, categoryId);
    }
  };

  const getCategoryById = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !category.icon && category.iconName) {
      return { ...category, icon: getIconComponent(category.iconName) };
    }
    return category;
  };

  const resetUserData = async () => {
     if (!userId) return;
     await dbService.resetUserData(userId);
     setTransactions([]);
     setDeletedTransactions(new Map());
  };
  
  const searchTransactions = (query) => {
    let filtered = transactions;
    if (query && typeof query === 'string') {
      const lowerQuery = query.toLowerCase();
      filtered = transactions.filter(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return (
          category?.name_he?.toLowerCase().includes(lowerQuery) ||
          t.description?.toLowerCase().includes(lowerQuery) ||
          (t.tags || []).join(' ').toLowerCase().includes(lowerQuery)
        );
      });
    }

    return filtered.sort((a, b) => {
      const da = new Date(a.date);
      const db_date = new Date(b.date);
      if (db_date.getTime() !== da.getTime()) return db_date - da;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  };

  return (
    <DataContext.Provider value={{
      transactions, categories, currentDate, setCurrentDate,
      addTransaction, addTransactions, updateTransaction, deleteTransaction,
      getTransactionsForMonth, getBalanceForMonth, getCategorySummariesForMonth, getIncomeSummariesForMonth,
      getCategoryById, setCategories, updateCategory, addCategory, deleteCategory,
      deleteSingleTransaction, deleteEntireSeries, deleteFromCurrentOnward,
      editSingleTransaction, editEntireSeries, editFromCurrentOnward,
      getIconComponent, resetUserData, iconMap, initialized, searchTransactions,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;