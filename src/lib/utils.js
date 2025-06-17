import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function formatDate(date) {
	if (!date) return '';
	// Create date in UTC to prevent timezone issues
	const d = new Date(date + 'T00:00:00Z');
	const day = String(d.getUTCDate()).padStart(2, '0');
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	const year = d.getUTCFullYear();
	return `${day}/${month}/${year}`;
}

export function exportTransactionsToCsv(transactions, categories = []) {
	if (!transactions.length) return;
  
	const headers = ["date", "type", "category", "amount", "tags", "notes"];
	const csvRows = [
	  headers.join(","),
	  ...transactions.map((t) => {
		const category = categories.find(c => c.id === t.categoryId);
		return [
		  formatDate(t.date),
		  t.type,
		  category?.name_he || "",
		  t.amount,
		  Array.isArray(t.tags) ? t.tags.join(",") : "",
		  `"${(t.description || "").replace(/"/g, '""')}"`
		].join(",");
	  }),
	];
  
	const csvString = csvRows.join("\n");
	const blob = new Blob([csvString], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
  
	const a = document.createElement("a");
	a.href = url;
	a.download = `transactions_${Date.now()}.csv`;
	a.click();
  
	URL.revokeObjectURL(url);
  }  