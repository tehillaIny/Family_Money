import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { defaultCategories, iconMap, getIconComponent } from '../constants/categories';
import { toLocalISOString } from '../lib/utils';
import { dbService } from '../services/dbService';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { 
  getTransactionsForMonth, 
  getBalanceForMonth, 
  getCategorySummariesForMonth, 
  getIncomeSummariesForMonth, 
  searchTransactionsList 
} from '../lib/transactionUtils';

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

  // --- 2. Recurring Transactions Generator ---
  useRecurringTransactions({
    initialized,
    transactions,
    deletedTransactions,
    currentDate,
    userId,
    addTransactions: async (newTxs) => await addTransactions(newTxs) 
  });

  // --- 3. CRUD Operations ---
  const addTransaction = async (transaction) => {    
    const id = transaction.id || dbService.generateId(userId);
    const createdAt = transaction.createdAt || Date.now();
    const safeDate = toLocalISOString(transaction.date);
    const creatorName = userData?.name || currentUser?.email?.split('@')[0] || 'Unknown';

    const newTransaction = { 
        ...transaction, id, createdAt, date: safeDate, createdBy: currentUser?.uid, creatorName 
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    if (userId) await dbService.saveTransaction(userId, id, newTransaction);
    return newTransaction;
  };

  const addTransactions = async (transactionsArray) => {
    if (transactionsArray.length === 0) return;
    const newTransactions = transactionsArray.map(t => ({
      ...t, id: t.id || dbService.generateId(userId), createdAt: t.createdAt || Date.now(), date: toLocalISOString(t.date)
    }));
    
    setTransactions(prev => [...prev, ...newTransactions]);
    if (userId) await dbService.saveTransactionsBatch(userId, newTransactions);
  };

  const updateTransaction = async (updatedTransaction) => {
    const safeDate = toLocalISOString(updatedTransaction.date);
    const payload = { ...updatedTransaction, date: safeDate, createdAt: updatedTransaction.createdAt || Date.now() };

    setTransactions(prev => prev.map(t => (t.id === updatedTransaction.id ? payload : t)));
    if (userId) await dbService.saveTransaction(userId, updatedTransaction.id, payload);
  };

  const deleteTransaction = async (transactionId) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    if (userId) await dbService.deleteTransaction(userId, transactionId);
  };

  // --- 4. Special Recurrence Handlers ---
  const deleteSingleTransaction = async (transactionId) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    if (userId) await dbService.saveTransaction(userId, transactionId, { ...transactionToDelete, deleted: true });

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
        await updateTransaction({ ...originalTransaction, recurrenceEndType: 'date', recurrenceEndDate: toLocalISOString(endDateForOldSeries) });
    }

    const terminationIso = toLocalISOString(terminationDate);
    const transactionsToDelete = transactions.filter(t => {
        const isPartOfSeries = t.id === originalId || t.originalId === originalId;
        return isPartOfSeries && t.date >= terminationIso && t.id !== originalId;
    });

    if (userId && transactionsToDelete.length > 0) await dbService.updateTransactionsDeletedBatch(userId, transactionsToDelete);

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
    await terminateSeriesAtDate(transaction, new Date(y, m - 1, d, 12, 0, 0));
  };

  const editFromCurrentOnward = async (transaction, updates) => {
    const [y, m, d] = transaction.date.split('-').map(Number);
    const splitDate = new Date(y, m - 1, d, 12, 0, 0); 
    const originalId = transaction.originalId || transaction.id;
    const originalTransaction = transactions.find(t => t.id === originalId);
    
    if (!originalTransaction) return;
    await terminateSeriesAtDate(transaction, splitDate);

    const newSeriesTransaction = {
        ...originalTransaction, ...updates,             
        id: dbService.generateId(userId), originalId: null, date: toLocalISOString(splitDate), createdAt: Date.now(), recurring: true,
        recurrenceEndType: updates.recurrenceEndType || originalTransaction.recurrenceEndType,
        recurrenceEndDate: updates.recurrenceEndDate || originalTransaction.recurrenceEndDate,
        recurrenceOccurrences: updates.recurrenceOccurrences || originalTransaction.recurrenceOccurrences,
        createdBy: currentUser?.uid, creatorName: userData?.name || currentUser?.email?.split('@')[0] || 'Unknown'
    };
    await addTransaction(newSeriesTransaction);
  };

  const deleteEntireSeries = async (originalId) => {
    const transactionsToDelete = transactions.filter(t => t.id === originalId || t.originalId === originalId);
    if (userId && transactionsToDelete.length > 0) await dbService.updateTransactionsDeletedBatch(userId, transactionsToDelete);
    setTransactions(prev => prev.filter(t => !transactionsToDelete.some(del => del.id === t.id)));
  };

  const editSingleTransaction = async (updatedTransaction) => await updateTransaction(updatedTransaction);

  const editEntireSeries = async (originalId, updates) => {
    const seriesTransactions = transactions.filter(t => t.id === originalId || t.originalId === originalId);
    const childrenToDelete = seriesTransactions.filter(t => t.id !== originalId);
    const updatedParent = { ...seriesTransactions.find(t => t.id === originalId), ...updates };
    if (updates.date) updatedParent.date = toLocalISOString(updates.date);

    if (userId) await dbService.editEntireSeriesDb(userId, originalId, childrenToDelete, updatedParent);

    setDeletedTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(originalId); 
      return newMap;
    });

    setTransactions(prev => [...prev.filter(t => t.id !== originalId && t.originalId !== originalId), updatedParent]);
  };

  // --- 5. Data Getters (Using the new Utils) ---
  const contextGetTransactionsForMonth = (date = currentDate, options) => getTransactionsForMonth(transactions, date, options);
  const contextGetBalanceForMonth = (date = currentDate) => getBalanceForMonth(transactions, date);
  const contextGetCategorySummariesForMonth = (date = currentDate, type = 'expense') => getCategorySummariesForMonth(transactions, date, type);
  const contextGetIncomeSummariesForMonth = (date = currentDate) => getIncomeSummariesForMonth(transactions, date);
  const contextSearchTransactions = (query) => searchTransactionsList(transactions, categories, query);

  // --- 6. Categories CRUD ---  
  const addCategory = async (newCategory) => {
    const id = 'cat_' + dbService.generateId(userId);
    const category = { ...newCategory, id };
    const { icon, ...categoryToSave } = category;
    
    setCategories(prev => [...prev, { ...category, icon: getIconComponent(newCategory.iconName) }]);
    if (userId) await dbService.saveCategory(userId, id, categoryToSave);
  };

  const updateCategory = async (updatedCategory) => {
    const { icon, ...categoryToSave } = updatedCategory;
    const newCategory = { ...updatedCategory, icon: getIconComponent(updatedCategory.iconName) };
    
    setCategories(prev => prev.map(cat => cat.id === newCategory.id ? newCategory : cat));
    if (userId) await dbService.saveCategory(userId, newCategory.id, categoryToSave);
  };

  const deleteCategory = async (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (userId) await dbService.deleteCategory(userId, categoryId);
  };

  const getCategoryById = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !category.icon && category.iconName) return { ...category, icon: getIconComponent(category.iconName) };
    return category;
  };

  const resetUserData = async () => {
     if (!userId) return;
     await dbService.resetUserData(userId);
     setTransactions([]);
     setDeletedTransactions(new Map());
  };
  
  return (
    <DataContext.Provider value={{
      transactions, categories, currentDate, setCurrentDate,
      addTransaction, addTransactions, updateTransaction, deleteTransaction,
      getTransactionsForMonth: contextGetTransactionsForMonth, 
      getBalanceForMonth: contextGetBalanceForMonth, 
      getCategorySummariesForMonth: contextGetCategorySummariesForMonth, 
      getIncomeSummariesForMonth: contextGetIncomeSummariesForMonth,
      searchTransactions: contextSearchTransactions,
      getCategoryById, setCategories, updateCategory, addCategory, deleteCategory,
      deleteSingleTransaction, deleteEntireSeries, deleteFromCurrentOnward,
      editSingleTransaction, editEntireSeries, editFromCurrentOnward,
      getIconComponent, resetUserData, iconMap, initialized, 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;