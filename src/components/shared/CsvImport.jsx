// CsvImport.jsx
import React from "react";
import Papa from "papaparse";
import { useData } from "@/hooks/useData.jsx";
import { useToast } from "@/components/ui/use-toast.js";

const CsvImport = () => {
  const { addTransactions, categories } = useData();
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newTransactions = [];

        results.data.forEach((row, index) => {
          const translatedType = translateType(row.type);

          const transactionData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: translatedType,
            amount: parseFloat(row.amount),
            categoryId: findCategoryId(row.category, translatedType),
            date: row.date,
            description: row.notes || "",
            tags: row.tags ? row.tags.split(",").map(tag => tag.trim()) : [],
          };

          if (
            transactionData.amount &&
            transactionData.categoryId &&
            transactionData.date &&
            transactionData.type
          ) {
            newTransactions.push(transactionData);
          } else {
            console.warn("⚠️ שורה לא תקינה בקובץ (שורה " + (index + 2) + "):", {
              row,
              transactionData,
            });
          }
        });

        if (newTransactions.length > 0) {
          addTransactions(newTransactions);
          toast({
            title: `ייבוא הושלם`,
            description: `ייבאת ${newTransactions.length} עסקאות.`,
          });
        } else {
          toast({
            title: "לא נמצאו עסקאות תקינות בקובץ.",
            variant: "destructive",
          });
        }
      },
      error: (err) => {
        toast({
          title: "שגיאה בקריאת הקובץ",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  function translateType(type) {
    const clean = type?.trim();
    if (clean === "הכנסה") return "income";
    if (clean === "הוצאה") return "expense";
    return null;
  }

  function findCategoryId(categoryName, type) {
    const cleanName = categoryName?.trim().normalize("NFKC").toLowerCase();

    const cat = categories.find(
      (c) =>
        [c.name_he, c.name_en].some(name =>
          name?.trim().normalize("NFKC").toLowerCase() === cleanName
        ) &&
        c.type === type
    );

    if (!cat) {
      console.warn("❌ קטגוריה לא נמצאה:", categoryName, "(סוג:", type, ")");
      return categories.find(c => c.name_he === "אחר" && c.type === type)?.id || null;
    }

    return cat.id;
  }

  return (
    <>
      <label htmlFor="csv-upload" className="btn btn-primary cursor-pointer">
        העלאת CSV
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
};

export default CsvImport;