import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { useData } from '@/hooks/useData.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { motion, AnimatePresence } from 'framer-motion';

// פונקציית עזר לקבלת התאריך של היום באזור הזמן המקומי של המשתמש
const getTodayLocalString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddTransactionDialog = ({ isOpen, setIsOpen, transactionToEdit }) => {
  const { categories, addTransaction, updateTransaction } = useData();
  const { toast } = useToast();
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayLocalString());
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.categoryId);
      // שימוש ישיר בתאריך השמור במקום להמיר אותו מחדש ל-UTC
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description || '');
    } else {
      // איפוס הטופס כשפותחים עסקה חדשה
      setType('expense');
      setAmount('');
      setCategoryId('');
      setDate(getTodayLocalString());
      setDescription('');
    }
  }, [transactionToEdit, isOpen]);

  // פונקציה לאיפוס הקטגוריה כשמחליפים בין הכנסה להוצאה
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in amount, category, and date.",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      id: transactionToEdit ? transactionToEdit.id : Date.now().toString(),
      type,
      amount: parseFloat(amount),
      categoryId,
      date,
      description,
    };

    if (transactionToEdit) {
      updateTransaction(transactionData);
      toast({ title: "Success!", description: "Transaction updated successfully." });
    } else {
      addTransaction(transactionData);
      toast({ title: "Success!", description: "Transaction added successfully." });
    }
    
    setIsOpen(false);
  };

  const filteredCategories = categories.filter(cat => type === 'income' ? cat.type === 'income' : cat.type !== 'income' || !cat.type);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] glassmorphic-card dark:bg-slate-900/80">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">
            {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transactionToEdit ? 'Update the details of your transaction.' : 'Enter the details for your new income or expense.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* שינוי: קריאה לפונקציה החדשה במקום עדכון הסטייט ישירות */}
          <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </Tabs>

          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="amount" className="text-gray-300">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-gray-300">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="category" className="w-full mt-1">
                    <SelectValue placeholder={`Select a ${type} category`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{type === 'income' ? 'Income Categories' : 'Expense Categories'}</SelectLabel>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center">
                            <cat.icon className={`mr-2 h-4 w-4 ${cat.color || 'text-gray-400'}`} />
                            {cat.name_he || cat.name_en || cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div>
            <Label htmlFor="date" className="text-gray-300">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Coffee with friends"
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;