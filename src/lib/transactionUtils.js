export const getTransactionsForMonth = (transactions, date, { excludeFuture = false } = {}) => {
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

export const getBalanceForMonth = (transactions, date) => {
  const monthTransactions = getTransactionsForMonth(transactions, date, { excludeFuture: true });
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  return { income, expenses, balance: income - expenses };
};

export const getCategorySummariesForMonth = (transactions, date, type = 'expense') => {
  const monthTransactions = getTransactionsForMonth(transactions, date, { excludeFuture: true }).filter(t => t.type === type);
  const summaries = {};
  monthTransactions.forEach(t => {
    summaries[t.categoryId] = (summaries[t.categoryId] || 0) + parseFloat(t.amount || 0);
  });
  return Object.entries(summaries).map(([categoryId, total]) => ({ categoryId, total }));
};

export const getIncomeSummariesForMonth = (transactions, date) => {
  return getCategorySummariesForMonth(transactions, date, 'income');
};

export const searchTransactionsList = (transactions, categories, query) => {
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