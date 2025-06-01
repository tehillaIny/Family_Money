import React, { createContext, useState, useEffect } from 'react';
import {
  Car, Briefcase as BriefcaseSimple, ShoppingBag, Gift, Building as BuildingApartment,
  GraduationCap, FolderHeart as HandHeart, Shirt, Gamepad as GameController,
  Popcorn, Bed, CreditCard, Bug as Question, ShoppingBasket as Basket,
  Coins, PiggyBank, DollarSign
} from 'lucide-react';

import { db } from '../firebase';
import {
  collection, getDocs, setDoc, deleteDoc, doc
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


  useEffect(() => {
    const fetchData = async () => {
      if (!db || !userId) return;
      try {
        const [transactionsSnapshot, categoriesSnapshot] = await Promise.all([
          getDocs(collection(db, 'users', userId, 'transactions')),
          getDocs(collection(db, 'users', userId, 'categories')),
        ]);
        setInitialized(true);
  
        const transactionsData = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(transactionsData);
  
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          icon: getIconComponent(doc.data().iconName),
        }));
  
        if (categoriesData.length === 0) {
          // אין קטגוריות בפיירבייס, משתמשים בברירת המחדל ושומרים בפיירבייס
          const defaultWithIcons = defaultCategories.map(c => ({
            ...c,
            icon: getIconComponent(c.iconName),
          }));
          setCategories(defaultWithIcons);
  
          // שמירה ב-Firestore
          for (const cat of defaultWithIcons) {
            const { icon, ...categoryToSave } = cat;
            await setDoc(doc(db, 'users', userId, 'categories', cat.id), categoryToSave);
          }
        } else {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      }
    };
    fetchData();
  }, [userId]);

  const addTransaction = async (transaction) => {
    const id = transaction.id || generateId();
    const newTransaction = { ...transaction, id };
    setTransactions(prev => [...prev, newTransaction]);
    if (db && userId) {
      await setDoc(doc(db, 'users', userId, 'transactions', id), transaction);
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

    // קבלת כל המסמכים בתיקיית העסקאות
    const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));

    // מחיקה של כל מסמך אחד אחד
    const deletePromises = transactionsSnapshot.docs.map(docSnap =>
      deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id))
    );
    await Promise.all(deletePromises);

    // ניקוי ה-state המקומי
    setTransactions([]);
  } catch (error) {
    console.error("Error resetting transactions:", error);
  }
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