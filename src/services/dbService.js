import { db } from '../firebase';
import {
  collection, getDocs, setDoc, deleteDoc, doc, writeBatch, query, where, getDoc
} from 'firebase/firestore';

export const dbService = {
  async fetchInitialData(userId) {
    if (!db || !userId) return { loadedTransactions: [], categoriesDocs: [], deletedMap: new Map() };

    const transactionsRef = collection(db, 'users', userId, 'transactions');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDateStr = sixMonthsAgo.toISOString().split('T')[0];

    const recentQuery = query(transactionsRef, where('date', '>=', startDateStr));
    const recentSnapshot = await getDocs(recentQuery);

    const recurringQuery = query(transactionsRef, where('recurring', '==', true));
    const recurringSnapshot = await getDocs(recurringQuery);

    const docsMap = new Map();
    recentSnapshot.docs.forEach(doc => docsMap.set(doc.id, doc));
    recurringSnapshot.docs.forEach(doc => docsMap.set(doc.id, doc));
    
    const allDocs = Array.from(docsMap.values());

    const loadedTransactions = allDocs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => !t.deleted);

    const deletedMap = new Map();
    allDocs.forEach(doc => {
      const data = doc.data();
      if (data.deleted) {
        const key = data.originalId || doc.id;
        if (!deletedMap.has(key)) deletedMap.set(key, new Set());
        deletedMap.get(key).add(data.date);
      }
    });

    const categoriesSnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
    
    return { loadedTransactions, categoriesDocs: categoriesSnapshot.docs, deletedMap };
  },

  // בדיקת סטטוס סנכרון (משלב 2)
  async checkSyncStatus(userId, todayStr) {
    const syncDocRef = doc(db, 'users', userId, 'metadata', 'sync_status');
    const syncSnap = await getDoc(syncDocRef);
    return syncSnap.exists() && syncSnap.data().lastRecurringSync === todayStr;
  },

  // עדכון סטטוס סנכרון (משלב 2)
  async updateSyncStatus(userId, todayStr) {
    const syncDocRef = doc(db, 'users', userId, 'metadata', 'sync_status');
    await setDoc(syncDocRef, { lastRecurringSync: todayStr }, { merge: true });
  },

  async saveTransaction(userId, id, transaction) {
    await setDoc(doc(db, 'users', userId, 'transactions', id), transaction);
  },

  async saveTransactionsBatch(userId, transactionsArray) {
    const batch = writeBatch(db);
    transactionsArray.forEach(t => {
      const docRef = doc(db, 'users', userId, 'transactions', t.id);
      batch.set(docRef, t);
    });
    await batch.commit();
  },

  async deleteTransaction(userId, transactionId) {
    await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
  },

  async updateTransactionsDeletedBatch(userId, transactionsToDelete) {
    const batch = writeBatch(db);
    transactionsToDelete.forEach(t => {
      const docRef = doc(db, 'users', userId, 'transactions', t.id);
      batch.update(docRef, { deleted: true });
    });
    await batch.commit();
  },

  async editEntireSeriesDb(userId, originalId, childrenToDelete, updatedParent) {
    const batch = writeBatch(db);
    childrenToDelete.forEach(t => {
      const docRef = doc(db, 'users', userId, 'transactions', t.id);
      batch.delete(docRef); 
    });
    const parentDocRef = doc(db, 'users', userId, 'transactions', originalId);
    batch.set(parentDocRef, updatedParent, { merge: true });
    await batch.commit();
  },

  async saveCategoriesBatch(userId, defaultCategories) {
    const batch = writeBatch(db);
    defaultCategories.forEach(category => {
      const docRef = doc(db, 'users', userId, 'categories', category.id);
      const { id, ...categoryData } = category;
      batch.set(docRef, categoryData);
    });
    await batch.commit();
  },

  async saveCategory(userId, id, categoryToSave) {
    await setDoc(doc(db, 'users', userId, 'categories', id), categoryToSave);
  },

  async deleteCategory(userId, categoryId) {
    await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
  },

  async resetUserData(userId) {
    const snapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },
  
  generateId(userId) {
    return doc(collection(db, 'users', userId, 'transactions')).id;
  }
};