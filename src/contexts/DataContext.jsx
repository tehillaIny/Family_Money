import React, { createContext, useState, useEffect } from 'react';
import {
  Car, Briefcase as BriefcaseSimple, ShoppingBag, Gift, Building as BuildingApartment,
  GraduationCap, FolderHeart as HandHeart, Shirt, Gamepad as GameController,
  Popcorn, Bed, CreditCard, Bug as Question, ShoppingBasket as Basket,
  Coins, PiggyBank, DollarSign
} from 'lucide-react';

import { db } from '../firebase';
import {
  collection, getDocs, setDoc, deleteDoc, doc, getDoc, writeBatch
} from 'firebase/firestore';

const DataContext = createContext();

const iconMap = {
  Car, BriefcaseSimple, ShoppingBag, Gift, BuildingApartment,
  GraduationCap, HandHeart, Shirt, GameController, Popcorn,
  Bed, CreditCard, Question, Basket, Coins, PiggyBank, DollarSign
};

const getIconComponent = (iconName) => {
  return iconMap[iconName] || DollarSign;
};

const defaultCategories = [
  { id: 'cat_car', name_en: 'Car', name_he: 'רכב', iconName: 'Car', color: 'text-blue-500', colorHex: '#3b82f6', type: 'expense', showOnDashboard: true },
  { id: 'cat_transport', name_en: 'Transportation', name_he: 'תחבורה', iconName: 'BriefcaseSimple', color: 'text-purple-500', colorHex: '#8b5cf6', type: 'expense', showOnDashboard: true },
  { id: 'cat_leisure', name_en: 'Leisure', name_he: 'פנאי', iconName: 'GameController', color: 'text-pink-500', colorHex: '#ec4899', type: 'expense', showOnDashboard: true },
  { id: 'cat_restaurant', name_en: 'Restaurant', name_he: 'מסעדה', iconName: 'Popcorn', color: 'text-orange-500', colorHex: '#f97316', type: 'expense', showOnDashboard: true },
  { id: 'cat_shopping', name_en: 'Shopping', name_he: 'קניות', iconName: 'ShoppingBag', color: 'text-yellow-500', colorHex: '#eab308', type: 'expense', showOnDashboard: true },
  { id: 'cat_gifts', name_en: 'Gifts', name_he: 'מתנות', iconName: 'Gift', color: 'text-red-500', colorHex: '#ef4444', type: 'expense', showOnDashboard: true },
  { id: 'cat_rent', name_en: 'Rent', name_he: 'שכר דירה', iconName: 'BuildingApartment', color: 'text-teal-500', colorHex: '#14b8a6', type: 'expense', showOnDashboard: true },
  { id: 'cat_studies', name_en: 'Studies', name_he: 'לימודים', iconName: 'GraduationCap', color: 'text-cyan-500', colorHex: '#06b6d4', type: 'expense', showOnDashboard: false },
  { id: 'cat_donations', name_en: 'Donations', name_he: 'תרומות', iconName: 'HandHeart', color: 'text-lime-500', colorHex: '#84cc16', type: 'expense', showOnDashboard: false },
  { id: 'cat_clothing', name_en: 'Clothing', name_he: 'ביגוד', iconName: 'Shirt', color: 'text-fuchsia-500', colorHex: '#d946ef', type: 'expense', showOnDashboard: true },
  { id: 'cat_bills', name_en: 'Bills', name_he: 'חשבונות', iconName: 'CreditCard', color: 'text-sky-500', colorHex: '#0ea5e9', type: 'expense', showOnDashboard: true },
  { id: 'cat_groceries', name_en: 'Groceries', name_he: 'סופרמרקט', iconName: 'Basket', color: 'text-green-500', colorHex: '#22c55e', type: 'expense', showOnDashboard: true },
  { id: 'cat_other_expense', name_en: 'Other Expense', name_he: 'אחר', iconName: 'Question', color: 'text-gray-500', colorHex: '#6b7280', type: 'expense', showOnDashboard: false },
  { id: 'cat_salary', name_en: 'Salary', name_he: 'משכורת', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_Pocket_Money', name_en: 'PocketMoney', name_he: 'דמי כיס', iconName: 'PiggyBank', color: 'text-indigo-500', colorHex: '#6366f1', type: 'income', showOnDashboard: false },
  { id: 'cat_Grant', name_en: 'Grant', name_he: 'מענק', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_Presents', name_en: 'Presents', name_he: 'מתנה', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_other_income', name_en: 'income-else', name_he: 'אחר', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
];

export const DataProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const userId = 'demoUser';
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletedTransactions, setDeletedTransactions] = useState(new Map());

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !userId) {
        console.error('❌ Database or userId not available:', { db: !!db, userId });
        return;
      }

      try {
        console.log('🔍 Fetching transactions and categories...');
        
        // Get transactions
        const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
        const loadedTransactions = transactionsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(t => !t.deleted); // Filter out deleted transactions
        
        console.log('📝 Loaded transactions:', {
          count: loadedTransactions.length,
          ids: loadedTransactions.map(t => t.id)
        });
        
        // Initialize deleted transactions state from loaded transactions
        const deletedMap = new Map();
        transactionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.deleted) {
            const key = data.originalId || doc.id;
            if (!deletedMap.has(key)) {
              deletedMap.set(key, new Set());
            }
            deletedMap.get(key).add(data.date);
          }
        });
        setDeletedTransactions(deletedMap);
        
        setTransactions(loadedTransactions);

        // Get categories
        const categoriesSnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
        const loadedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('📝 Loaded categories:', {
          count: loadedCategories.length,
          ids: loadedCategories.map(c => c.id)
        });

        if (loadedCategories.length === 0) {
          // Initialize default categories if none exist
          const defaultCategories = [
            { name: 'מזון', icon: '🍽️', color: '#FF6B6B' },
            { name: 'תחבורה', icon: '🚗', color: '#4ECDC4' },
            { name: 'בידור', icon: '🎬', color: '#FFD93D' },
            { name: 'קניות', icon: '🛍️', color: '#95E1D3' },
            { name: 'בריאות', icon: '💊', color: '#F38181' },
            { name: 'חינוך', icon: '📚', color: '#6C5CE7' },
            { name: 'תשלומים', icon: '💸', color: '#A8E6CF' },
            { name: 'אחר', icon: '📦', color: '#FFB6B9' }
          ];

          const batch = writeBatch(db);
          defaultCategories.forEach(category => {
            const docRef = doc(collection(db, 'users', userId, 'categories'));
            batch.set(docRef, category);
          });
          await batch.commit();

          setCategories(defaultCategories.map((cat, index) => ({ ...cat, id: `default-${index}` })));
        } else {
          setCategories(loadedCategories);
        }

        console.log('✅ Data initialization complete');
        setInitialized(true);
      } catch (error) {
        console.error('❌ Error loading data from Firestore:', error);
      }
    };

    fetchData();
  }, [db, userId]);

  useEffect(() => {
    if (!initialized || !transactions.length) return;

   const generateFutureRecurringTransactions = async () => {
  const futureTransactions = [];
  const today = new Date();
  const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 5);

      // Get all transactions that are part of a recurring series
      const recurringTransactions = transactions.filter(t => t.recurring || t.originalId);
      
      console.log('🔍 DELETED TRANSACTIONS:', 
        Array.from(deletedTransactions.entries()).map(([key, dates]) => ({
          key,
          dates: Array.from(dates)
        }))
      );

      for (const t of recurringTransactions) {
    if (!t.recurring || !t.recurrenceFrequency) continue;

    let nextDate = new Date(t.date);
        let count = 1;
        let generatedCount = 0;

    const maxCount = t.recurrenceEndType === 'count' ? t.recurrenceOccurrences : 100;
    const endByDate = t.recurrenceEndType === 'date' && t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : endDate;

        // First, advance the date to the next occurrence
        switch (t.recurrenceFrequency) {
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        }

        while (nextDate <= endByDate && count <= maxCount) {
      const instanceDate = new Date(nextDate);
      const isoDate = instanceDate.toISOString().slice(0, 10);

          // Check if this date has been deleted
          const isDeleted = deletedTransactions.get(t.id)?.has(isoDate) || 
                          deletedTransactions.get(t.originalId)?.has(isoDate);

      const alreadyExists = transactions.some(
            (tx) => (tx.originalId === t.id || tx.id === t.id) && tx.date === isoDate
      );

          if (!alreadyExists && !isDeleted && instanceDate >= today) {
            const newTransaction = {
          ...t,
          id: generateId(),
          originalId: t.id,
          date: isoDate,
              recurring: false,
            };
            console.log('➕ GENERATING NEW TRANSACTION:', {
              id: newTransaction.id,
              originalId: newTransaction.originalId,
              date: newTransaction.date,
              isDeleted,
              alreadyExists
            });
            futureTransactions.push(newTransaction);
            generatedCount++;
          }

          // Advance to next occurrence
      switch (t.recurrenceFrequency) {
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
      }

      count++;
    }
  }

  if (futureTransactions.length > 0) {
        console.log('📝 ADDING NEW TRANSACTIONS:', futureTransactions.map(t => ({
          id: t.id,
          originalId: t.originalId,
          date: t.date
        })));
    await addTransactions(futureTransactions);
  }
};

    generateFutureRecurringTransactions();
  }, [initialized, transactions, deletedTransactions]);

  const addTransaction = async (transaction) => {
    const id = transaction.id || generateId();
    const newTransaction = { ...transaction, id };
    setTransactions(prev => [...prev, newTransaction]);
    if (db && userId) {
      await setDoc(doc(db, 'users', userId, 'transactions', id), newTransaction);
    }
  };

  const addTransactions = async (transactionsArray) => {
    const newTransactions = transactionsArray.map(t => ({
      ...t,
      id: t.id || generateId()
    }));
    setTransactions(prev => [...prev, ...newTransactions]);
    if (db && userId) {
      for (const t of newTransactions) {
        await setDoc(doc(db, 'users', userId, 'transactions', t.id), t);
      }
    }
  };

  const updateTransaction = async (updatedTransaction) => {
    setTransactions(prev => prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t)));
    if (db && userId) {
      await setDoc(doc(db, 'users', userId, 'transactions', updatedTransaction.id), updatedTransaction);
    }
  };

  const deleteTransaction = async (transactionId) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    if (db && userId) {
      await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
    }
  };

  const getCategoryById = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !category.icon && category.iconName) {
      return { ...category, icon: getIconComponent(category.iconName) };
    }
    return category;
  };

  const updateCategory = async (updatedCategory) => {
    const newCategory = { ...updatedCategory, icon: getIconComponent(updatedCategory.iconName) };
    setCategories(prev => prev.map(cat => cat.id === newCategory.id ? newCategory : cat));
    if (db && userId) {
      const { icon, ...categoryToSave } = updatedCategory;
      await setDoc(doc(db, 'users', userId, 'categories', newCategory.id), categoryToSave);
    }
  };

  const addCategory = async (newCategory) => {
    const id = 'cat_' + Date.now().toString() + Math.random().toString(16).slice(2);
    const category = {
      ...newCategory,
      id,
      icon: getIconComponent(newCategory.iconName),
    };
    setCategories(prev => [...prev, category]);
    if (db && userId) {
      const { icon, ...categoryToSave } = category;
      await setDoc(doc(db, 'users', userId, 'categories', id), categoryToSave);
    }
  };

  const deleteCategory = async (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (db && userId) {
      await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
    }
  };

  const getTransactionsForMonth = (date = currentDate) => {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === date.getFullYear() &&
               transactionDate.getMonth() === date.getMonth();
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getBalanceForMonth = (date = currentDate) => {
    const monthTransactions = getTransactionsForMonth(date);
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { income, expenses, balance: income - expenses };
  };

  const getCategorySummariesForMonth = (date = currentDate, type = 'expense') => {
    const monthTransactions = getTransactionsForMonth(date).filter(t => t.type === type);
    const summaries = {};
    monthTransactions.forEach(transaction => {
      if (!summaries[transaction.categoryId]) {
        summaries[transaction.categoryId] = 0;
      }
      summaries[transaction.categoryId] += parseFloat(transaction.amount || 0);
    });
    return Object.entries(summaries).map(([categoryId, total]) => ({
      categoryId,
      total,
    }));
  };

  const getIncomeSummariesForMonth = (date = currentDate) => {
    return getCategorySummariesForMonth(date, 'income');
  };

  const resetUserData = async () => {
    try {
      if (!db || !userId) return;
      const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
      const deletePromises = transactionsSnapshot.docs.map(docSnap =>
        deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id))
      );
      await Promise.all(deletePromises);
      setTransactions([]);
    } catch (error) {
      console.error("Error resetting transactions:", error);
    }
  };

  // מחיקת מופע בודד
const deleteSingleTransaction = async (transactionId) => {
    console.log('🔍 DELETE SINGLE TRANSACTION:', transactionId);
    
    // Find the transaction to delete
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) {
      console.log('❌ Transaction not found:', transactionId);
      return;
    }

    console.log('📝 TRANSACTION TO DELETE:', {
      id: transactionToDelete.id,
      originalId: transactionToDelete.originalId,
      date: transactionToDelete.date,
      recurring: transactionToDelete.recurring
    });

    try {
      if (!db || !userId) {
        console.error('❌ Database or userId not available:', { db: !!db, userId });
        throw new Error('Database or userId not available');
      }

      const docRef = doc(db, 'users', userId, 'transactions', transactionId);
      
      // Mark as deleted in the database
      await setDoc(docRef, { ...transactionToDelete, deleted: true });
      console.log('✅ MARKED AS DELETED IN DB:', {
        id: transactionId,
        originalId: transactionToDelete.originalId,
        date: transactionToDelete.date
      });
      
      // Update deleted transactions state
      setDeletedTransactions(prev => {
        const newMap = new Map(prev);
        const key = transactionToDelete.originalId || transactionToDelete.id;
        if (!newMap.has(key)) {
          newMap.set(key, new Set());
        }
        newMap.get(key).add(transactionToDelete.date);
        console.log('🗑️ UPDATED DELETED TRANSACTIONS:', 
          Array.from(newMap.entries()).map(([key, dates]) => ({
            key,
            dates: Array.from(dates)
          }))
        );
        return newMap;
      });
      
      // Then update state
      setTransactions(prev => {
        const newTransactions = prev.filter(t => t.id !== transactionId);
        console.log('🔄 STATE UPDATED:', {
          beforeCount: prev.length,
          afterCount: newTransactions.length,
          removedId: transactionId
        });
        return newTransactions;
      });
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw error;
    }
  };

  // מחיקת החל מהמופע הנוכחי והלאה
  const deleteFromCurrentOnward = async (transaction) => {
    console.log('🔍 DELETE FROM CURRENT ONWARD:', {
      id: transaction.id,
      originalId: transaction.originalId,
      date: transaction.date
    });

    const currentDate = new Date(transaction.date);
    const originalId = transaction.originalId || transaction.id;
    
    // Find all transactions that are part of this series and are on or after the current date
    const transactionsToDelete = transactions.filter(t => {
      const txDate = new Date(t.date);
      const isPartOfSeries = t.id === originalId || t.originalId === originalId;
      const shouldDelete = isPartOfSeries && txDate >= currentDate;
      
      console.log('🔍 CHECKING TRANSACTION:', {
        id: t.id,
        originalId: t.originalId,
        date: t.date,
        isPartOfSeries,
        isAfterCurrentDate: txDate >= currentDate,
        shouldDelete
      });
      
      return shouldDelete;
    });

    console.log('📝 TRANSACTIONS TO DELETE:', transactionsToDelete.map(t => ({
      id: t.id,
      originalId: t.originalId,
      date: t.date
    })));

    try {
      if (!db || !userId) {
        console.error('❌ Database or userId not available:', { db: !!db, userId });
        throw new Error('Database or userId not available');
      }

      // Mark all transactions as deleted in the database
      const updatePromises = transactionsToDelete.map(t => {
        console.log('🗑️ MARKING AS DELETED IN DB:', {
          id: t.id,
          originalId: t.originalId,
          date: t.date
        });
        return setDoc(doc(db, 'users', userId, 'transactions', t.id), { ...t, deleted: true });
      });
      await Promise.all(updatePromises);
      
      // Update deleted transactions state
      setDeletedTransactions(prev => {
        const newMap = new Map(prev);
        transactionsToDelete.forEach(t => {
          const key = t.originalId || t.id;
          if (!newMap.has(key)) {
            newMap.set(key, new Set());
          }
          newMap.get(key).add(t.date);
        });
        console.log('🗑️ UPDATED DELETED TRANSACTIONS:', 
          Array.from(newMap.entries()).map(([key, dates]) => ({
            key,
            dates: Array.from(dates)
          }))
        );
        return newMap;
      });
      
      // Then update state
      setTransactions(prev => {
        const newTransactions = prev.filter(t => !transactionsToDelete.some(td => td.id === t.id));
        console.log('🔄 STATE UPDATED:', {
          beforeCount: prev.length,
          afterCount: newTransactions.length,
          removedIds: transactionsToDelete.map(t => t.id)
        });
        return newTransactions;
      });
      
      console.log('✅ Future transactions deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting future transactions:', error);
      throw error;
  }
};

// מחיקת כל הסדרה
const deleteEntireSeries = async (originalId) => {
    console.log('🔍 deleteEntireSeries called with originalId:', originalId);
    
    // Find all transactions that are part of this series
    const transactionsToDelete = transactions.filter(t => {
      const isPartOfSeries = t.id === originalId || t.originalId === originalId;
      console.log('🔍 Checking transaction for series:', {
        id: t.id,
        originalId: t.originalId,
        isPartOfSeries
      });
      return isPartOfSeries;
    });
    
    console.log('📝 Found transactions to delete:', transactionsToDelete.map(t => ({
      id: t.id,
      originalId: t.originalId,
      date: t.date
    })));

    try {
      if (!db || !userId) {
        console.error('❌ Database or userId not available:', { db: !!db, userId });
        throw new Error('Database or userId not available');
      }

      // Mark all transactions as deleted in the database
      const updatePromises = transactionsToDelete.map(t => {
        console.log('🗑️ Marking as deleted in database:', {
          userId,
          transactionId: t.id,
          path: `users/${userId}/transactions/${t.id}`
        });
        return setDoc(doc(db, 'users', userId, 'transactions', t.id), { ...t, deleted: true });
      });
      await Promise.all(updatePromises);
      
      // Then update state
      setTransactions(prev => {
        const newTransactions = prev.filter(t => !transactionsToDelete.some(td => td.id === t.id));
        console.log('🔄 State updated:', {
          beforeCount: prev.length,
          afterCount: newTransactions.length,
          removedIds: transactionsToDelete.map(t => t.id)
        });
        return newTransactions;
      });
      
      console.log('✅ Series deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting series:', error);
      throw error;
    }
};

// עריכת מופע בודד
const editSingleTransaction = async (updatedTransaction) => {
  setTransactions(prev => prev.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t)));
  if (db && userId) {
    await setDoc(doc(db, 'users', userId, 'transactions', updatedTransaction.id), updatedTransaction);
  }
};

// עריכת כל הסדרה
const editEntireSeries = async (originalId, updates) => {
  const transactionsToUpdate = transactions.filter(t => t.id === originalId || t.originalId === originalId);
  const updatePromises = transactionsToUpdate.map(t => {
    const updated = { ...t, ...updates };
    return setDoc(doc(db, 'users', userId, 'transactions', t.id), updated);
  });
  await Promise.all(updatePromises);
  setTransactions(prev => prev.map(t =>
    t.id === originalId || t.originalId === originalId ? { ...t, ...updates } : t
  ));
};

// עריכת החל מהמופע הנוכחי והלאה
const editFromCurrentOnward = async (transaction, updates) => {
  const currentDate = new Date(transaction.date);
  const transactionsToUpdate = transactions.filter(t =>
    (t.originalId === transaction.originalId || t.id === transaction.originalId) &&
    new Date(t.date) >= currentDate
  );
  const updatePromises = transactionsToUpdate.map(t => {
    const updated = { ...t, ...updates };
    return setDoc(doc(db, 'users', userId, 'transactions', t.id), updated);
  });
  await Promise.all(updatePromises);
  setTransactions(prev => prev.map(t =>
    transactionsToUpdate.some(tu => tu.id === t.id) ? { ...t, ...updates } : t
  ));
};

  return (
    <DataContext.Provider value={{
      transactions,
      categories,
      currentDate,
      setCurrentDate,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      getTransactionsForMonth,
      getBalanceForMonth,
      getCategorySummariesForMonth,
      getIncomeSummariesForMonth,
      getCategoryById,
      setCategories,
      updateCategory,
      addCategory,
      deleteCategory,
      deleteSingleTransaction,
      deleteEntireSeries,
      deleteFromCurrentOnward,
      editSingleTransaction,
      editEntireSeries,
      editFromCurrentOnward,
      getIconComponent,
      resetUserData,
      iconMap,
      initialized,
    }}>
      {children}
    </DataContext.Provider>
  );
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

export default DataContext;