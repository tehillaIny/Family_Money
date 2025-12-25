import React, { createContext, useState, useEffect } from 'react';
import {
  Car, Briefcase as BriefcaseSimple, ShoppingBag, Gift, Building as BuildingApartment,
  GraduationCap, FolderHeart as HandHeart, Shirt, Gamepad as GameController,
  Popcorn, Bed, CreditCard, Bug as Question, ShoppingBasket as Basket,
  Coins, PiggyBank, DollarSign
} from 'lucide-react';

import { db } from '../firebase';
import {
  collection, getDocs, setDoc, deleteDoc, doc, writeBatch
} from 'firebase/firestore';

const DataContext = createContext();

// --- Icons & Categories Setup ---

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

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- DATE UTILS (DEBUG VERSION) ---
const formatToLocalIso = (dateInput) => {
    if (!dateInput) return '';
    
  

    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }

    const d = new Date(dateInput);
  
    d.setHours(12, 0, 0, 0); 
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    return result;
};

// --- Provider ---

export const DataProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const userId = 'demoUser'; 
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletedTransactions, setDeletedTransactions] = useState(new Map());

  // --- 1. Initial Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      if (!db || !userId) return;

      try {
        const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
        const loadedTransactions = transactionsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(t => !t.deleted);

        const deletedMap = new Map();
        transactionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.deleted) {
            const key = data.originalId || doc.id;
            if (!deletedMap.has(key)) deletedMap.set(key, new Set());
            deletedMap.get(key).add(data.date);
          }
        });
        setDeletedTransactions(deletedMap);
        setTransactions(loadedTransactions);

        const categoriesSnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
        const usedCategoryIds = new Set((loadedTransactions || []).map(t => t.categoryId).filter(Boolean));
        const rawCategories = categoriesSnapshot.docs.map(docSnap => ({
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
          const batch = writeBatch(db);
          defaultCategories.forEach(category => {
            const docRef = doc(db, 'users', userId, 'categories', category.id);
            const { id, ...categoryData } = category;
            batch.set(docRef, categoryData);
          });
          await batch.commit();
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

  // --- 2. Generator for Recurring Transactions (WITH LOGS) ---
  useEffect(() => {
    if (!initialized || !transactions.length) return;

    const generateFutureRecurringTransactions = async () => {
      const futureTransactions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 5);

      const recurringTransactions = transactions.filter(t => t.recurring && !t.originalId);

      // Helper to parse strings to Noon Local Time
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
            endByDate = parseLocalDate(t.recurrenceEndDate);
            endByDate.setHours(23, 59, 59);
        }

        let count = 1; 

        const calculateNextDate = (index) => {
            const d = new Date(startDate);
            d.setHours(12, 0, 0, 0); // Always force Noon

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
          
          const isoDate = formatToLocalIso(nextInstanceDate);
          
          const isDeleted = deletedTransactions.get(t.id)?.has(isoDate);
          const alreadyExists = transactions.some(
            (tx) => (tx.originalId === t.id || tx.id === t.id) && tx.date === isoDate
          );

          if (!alreadyExists && !isDeleted && nextInstanceDate >= today) {
            (`      ✅ Adding new instance: ${isoDate}`);
            futureTransactions.push({
              ...t,
              id: generateId(),
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
    };

    generateFutureRecurringTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, transactions.length, deletedTransactions]); 

  // --- 3. CRUD Operations ---

  const addTransaction = async (transaction) => {    
    const id = transaction.id || generateId();
    const createdAt = transaction.createdAt || Date.now();
    
    const safeDate = formatToLocalIso(transaction.date);
    
    const newTransaction = { 
        ...transaction, 
        id, 
        createdAt,
        date: safeDate 
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    if (db && userId) {
      await setDoc(doc(db, 'users', userId, 'transactions', id), newTransaction);
    }
    return newTransaction;
  };

  const addTransactions = async (transactionsArray) => {
    const newTransactions = transactionsArray.map(t => ({
      ...t,
      id: t.id || generateId(),
      createdAt: t.createdAt || Date.now(),
      date: formatToLocalIso(t.date)
    }));
    
    setTransactions(prev => [...prev, ...newTransactions]);
    
    if (db && userId) {
      const batch = writeBatch(db);
      newTransactions.forEach(t => {
        const docRef = doc(db, 'users', userId, 'transactions', t.id);
        batch.set(docRef, t);
      });
      await batch.commit();
    }
  };

  const updateTransaction = async (updatedTransaction) => {
    const safeDate = formatToLocalIso(updatedTransaction.date);
    
    const payload = { 
        ...updatedTransaction, 
        date: safeDate,
        createdAt: updatedTransaction.createdAt || Date.now() 
    };

    setTransactions(prev => prev.map(t => (t.id === updatedTransaction.id ? payload : t)));
    
    if (db && userId) {
      await setDoc(doc(db, 'users', userId, 'transactions', updatedTransaction.id), payload);
    }
  };

  const deleteTransaction = async (transactionId) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    if (db && userId) {
      await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
    }
  };

  // --- 4. Special Recurrence Handlers ---

  const deleteSingleTransaction = async (transactionId) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    if (db && userId) {
        await setDoc(doc(db, 'users', userId, 'transactions', transactionId), { 
            ...transactionToDelete, 
            deleted: true 
        });
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
            recurrenceEndDate: formatToLocalIso(endDateForOldSeries)
        };
        await updateTransaction(updatedOriginal);
    }

    const terminationIso = formatToLocalIso(terminationDate);
    
    const transactionsToDelete = transactions.filter(t => {
        const isPartOfSeries = t.id === originalId || t.originalId === originalId;
        return isPartOfSeries && t.date >= terminationIso && t.id !== originalId;
    });

    if (db && userId && transactionsToDelete.length > 0) {
        const batch = writeBatch(db);
        transactionsToDelete.forEach(t => {
            const docRef = doc(db, 'users', userId, 'transactions', t.id);
            batch.update(docRef, { deleted: true });
        });
        await batch.commit();
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

    const newSeriesTransaction = {
        ...originalTransaction, 
        ...updates,             
        id: generateId(),
        originalId: null,       
        date: formatToLocalIso(splitDate),
        createdAt: Date.now(),
        recurring: true,
        recurrenceEndType: updates.recurrenceEndType || originalTransaction.recurrenceEndType,
        recurrenceEndDate: updates.recurrenceEndDate || originalTransaction.recurrenceEndDate,
        recurrenceOccurrences: updates.recurrenceOccurrences || originalTransaction.recurrenceOccurrences
    };

    await addTransaction(newSeriesTransaction);
  };

  const deleteEntireSeries = async (originalId) => {
    const transactionsToDelete = transactions.filter(t => 
        t.id === originalId || t.originalId === originalId
    );

    if (db && userId && transactionsToDelete.length > 0) {
        const batch = writeBatch(db);
        transactionsToDelete.forEach(t => {
            const docRef = doc(db, 'users', userId, 'transactions', t.id);
            batch.update(docRef, { deleted: true });
        });
        await batch.commit();
    }
    
    setTransactions(prev => prev.filter(t => !transactionsToDelete.some(del => del.id === t.id)));
  };

  const editSingleTransaction = async (updatedTransaction) => {
    await updateTransaction(updatedTransaction);
  };

  const editEntireSeries = async (originalId, updates) => {
    // 1. מוצאים את כל העסקאות ששייכות לסדרה הזו (כולל האבא)
    const seriesTransactions = transactions.filter(t => t.id === originalId || t.originalId === originalId);
    
    // 2. מוחקים את כל ה"ילדים" (המופעים החוזרים) מהדאטה ומהסטייט
    // משאירים רק את האבא (originalId) כדי לעדכן אותו
    const childrenToDelete = seriesTransactions.filter(t => t.id !== originalId);
    
    if (db && userId) {
        const batch = writeBatch(db);
        
        // מחיקת הילדים
        childrenToDelete.forEach(t => {
            const docRef = doc(db, 'users', userId, 'transactions', t.id);
            batch.delete(docRef); // מחיקה פיזית (Hard Delete) כדי למנוע כפילויות
        });

        // עדכון האבא עם ההגדרות החדשות
        const parentDocRef = doc(db, 'users', userId, 'transactions', originalId);
        const updatedParent = { ...seriesTransactions.find(t => t.id === originalId), ...updates };
        // וודאי שהתאריך נשמר תקין
        if (updates.date) updatedParent.date = formatToLocalIso(updates.date);
        
        batch.set(parentDocRef, updatedParent, { merge: true });
        
        await batch.commit();
    }

    // 3. איפוס רשימת המחיקות (החלק הקריטי שהיה חסר!)
    // אנחנו רוצים שפברואר יחזור אם המשתמש הגדיר את הסדרה מחדש
    setDeletedTransactions(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalId); // מוחקים את ההיסטוריה של "מה מחקתי בסדרה הזו"
        return newMap;
    });

    // 4. עדכון הסטייט: משאירים רק את האבא המעודכן, מעיפים את הילדים הישנים
    // ה-useEffect של הגנרטור יזהה שהילדים חסרים וייצר אותם מחדש נכון מיד
    setTransactions(prev => {
        const parent = prev.find(t => t.id === originalId);
        const updatedParent = { ...parent, ...updates };
        if (updates.date) updatedParent.date = formatToLocalIso(updates.date);

        // מסננים החוצה את כל הסדרה הישנה, ומחזירים רק את האבא המעודכן
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
    const id = 'cat_' + Date.now() + Math.random().toString(16).slice(2);
    const category = { ...newCategory, id };
    const { icon, ...categoryToSave } = category;
    
    setCategories(prev => [...prev, { ...category, icon: getIconComponent(newCategory.iconName) }]);
    if (db && userId) {
        await setDoc(doc(db, 'users', userId, 'categories', id), categoryToSave);
    }
  };

  const updateCategory = async (updatedCategory) => {
    const { icon, ...categoryToSave } = updatedCategory;
    const newCategory = { ...updatedCategory, icon: getIconComponent(updatedCategory.iconName) };
    
    setCategories(prev => prev.map(cat => cat.id === newCategory.id ? newCategory : cat));
    if (db && userId) {
        await setDoc(doc(db, 'users', userId, 'categories', newCategory.id), categoryToSave);
    }
  };

  const deleteCategory = async (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (db && userId) {
        await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
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
     if (!db || !userId) return;
     const snapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
     const batch = writeBatch(db);
     snapshot.docs.forEach(doc => batch.delete(doc.ref));
     await batch.commit();
     setTransactions([]);
     setDeletedTransactions(new Map());
  };
  
  const searchTransactions = (query) => {
    if (!query || typeof query !== 'string') return transactions;
    const lowerQuery = query.toLowerCase();
    return transactions.filter(t => {
      const category = categories.find(c => c.id === t.categoryId);
      return (
        category?.name_he?.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery) ||
        (t.tags || []).join(' ').toLowerCase().includes(lowerQuery)
      );
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