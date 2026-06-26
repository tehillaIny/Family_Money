import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const toLocalISOString = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); 
  return d.toISOString().split('T')[0];
};

export const formatDateHe = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
  });
};

export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00Z');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

export function exportTransactionsToCsv(transactions, categories, filename = 'transactions') {
    if (!transactions || transactions.length === 0) return;
  
    // כאן אנחנו מגדירים את העמודות (אפשר לשלוח אותן כפרמטר, אבל נשאיר כאן כרגע)
    const headers = ["תאריך", "סוג", "קטגוריה", "סכום", "תגיות", "הערות"];
    
    const csvRows = [
      headers.join(","),
      ...transactions.map((t) => {
        // עכשיו ה-categories מגיע בצורה תקינה מהפרמטרים
        const category = (Array.isArray(categories) ? categories : []).find(c => c.id === t.categoryId);
        
        return [
          formatDate(t.date),
          t.type === 'income' ? 'הכנסה' : 'הוצאה',
          category?.name_he || "לא נמצאה",
          t.amount || 0,
          Array.isArray(t.tags) ? t.tags.join(";") : "",
          `"${(t.description || "").replace(/"/g, '""')}"`
        ].join(",");
      }),
    ];
  
    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${Date.now()}.csv`;
    a.click();
  
    URL.revokeObjectURL(url);
}