import { useEffect, useRef } from 'react';
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
  // הנעילה שלנו - מונעת מ-React להריץ את הלולאה שוב כשהיא באמצע עבודה
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!initialized || !transactions.length || isProcessing.current) return;

    const generateFutureRecurringTransactions = async () => {
      isProcessing.current = true; // נועלים את הדלת
      
      const futureTransactions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // מייצרים עסקאות ל-12 חודשים קדימה (במקום 3)
      const endDate = new Date(currentDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const recurringTransactions = transactions.filter(t => t.recurring && !t.originalId);

      // חילוץ תאריך בטוח (מתעלם מ-T ומשעות אם פיירבייס הוסיף אותם)
      const parseLocalDate = (dateStr) => {
          if (!dateStr) return new Date();
          const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
          const [y, m, d] = datePart.split('-').map(Number);
          return new Date(y, m - 1, d, 12, 0, 0); 
      };

      // פונקציית עזר להשוואת תאריכים נקייה 
      const getDateOnly = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
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
          const isoDateOnly = getDateOnly(isoDate);
          
          const isDeleted = deletedTransactions.get(t.id)?.has(isoDate);
          
          // השוואה מדויקת על בסיס התאריך הנקי למניעת כפילויות
          const alreadyExists = transactions.some(
            (tx) => (tx.originalId === t.id || tx.id === t.id) && getDateOnly(tx.date) === isoDateOnly
          );

          if (!alreadyExists && !isDeleted && nextInstanceDate >= today) {
            futureTransactions.push({
              ...t,
              id: dbService.generateId(userId),
              originalId: t.id,
              date: isoDate,
              recurring: false,
              createdAt: Date.now() // הוספנו את חותמת הזמן שהייתה חסרה!
            });
          }

          count++;
          nextInstanceDate = calculateNextDate(count);
        }
      }

      if (futureTransactions.length > 0) {
        await addTransactions(futureTransactions);
      }

      isProcessing.current = false; // פותחים את הדלת מחדש
    };

    generateFutureRecurringTransactions();
  }, [initialized, transactions, deletedTransactions, currentDate, userId]); 
};