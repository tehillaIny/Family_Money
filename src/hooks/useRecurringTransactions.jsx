import { useEffect } from 'react';
import { dbService } from '../services/dbService';
import { toLocalISOString } from '../lib/utils';

export const useRecurringTransactions = ({
  initialized,
  transactions,
  deletedTransactions,
  currentDate,
  userId,
  addTransactions
}) => {
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
  }, [initialized, transactions.length, deletedTransactions, currentDate, userId]); 
};