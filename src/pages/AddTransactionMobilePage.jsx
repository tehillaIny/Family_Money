import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, CheckCircle, Tag, Type, X,
  DollarSign, Tags, Repeat, CalendarCheck2, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { useData } from '@/hooks/useData.jsx';
import { useToast } from '@/components/ui/use-toast.js';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { Calendar } from '@/components/ui/calendar.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue, SelectGroup
} from '@/components/ui/select.jsx';
import { format, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

const NumpadButton = ({ value, onClick, className = '', isLarge = false }) => (
  <Button
    type="button"
    variant="outline"
    className={`text-2xl h-16 sm:h-20 rounded-lg shadow-sm active:bg-primary/20 ${className} ${isLarge ? 'col-span-2' : ''}`}
    onClick={() => onClick(value)}
  >
    {value}
  </Button>
);

const AddTransactionMobilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    categories,
    addTransaction,
    updateTransaction,
    editSingleTransaction,
    editEntireSeries,
    editFromCurrentOnward,
    getCategoryById,
    currentDate: contextCurrentDate,
    getIconComponent
  } = useData();
  const { toast } = useToast();

  const transactionToEdit = location.state?.transactionToEdit;
  const editMode = location.state?.editMode;
  const preselectedCategoryId = location.state?.preselectedCategoryId;
  const preselectedType = location.state?.type;
  const currentMonthDateFromNav = location.state?.currentMonthDate ? new Date(location.state.currentMonthDate) : new Date(contextCurrentDate);

  const [amountStr, setAmountStr] = useState(transactionToEdit ? String(Math.abs(transactionToEdit.amount)) : '0');
  const [description, setDescription] = useState(transactionToEdit ? transactionToEdit.description || '' : '');
  const [selectedDate, setSelectedDate] = useState(transactionToEdit ? new Date(transactionToEdit.date) : currentMonthDateFromNav);
  const [type, setType] = useState(transactionToEdit ? transactionToEdit.type : preselectedType || 'expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState(transactionToEdit ? transactionToEdit.categoryId : preselectedCategoryId || '');
  const [tagsStr, setTagsStr] = useState(transactionToEdit?.tags?.join(', ') || '');

  const [isRecurring, setIsRecurring] = useState(transactionToEdit?.recurring || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(transactionToEdit?.recurrenceFrequency || 'monthly');
  const [recurrenceDay, setRecurrenceDay] = useState(transactionToEdit?.recurrenceDay || selectedDate.getDate());
  const [recurrenceEndType, setRecurrenceEndType] = useState(transactionToEdit?.recurrenceEndType || 'never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(transactionToEdit?.recurrenceEndDate ? new Date(transactionToEdit.recurrenceEndDate) : new Date());
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(transactionToEdit?.recurrenceOccurrences || 1);

  useEffect(() => {
    if (!transactionToEdit && preselectedCategoryId) {
      setSelectedCategoryId(preselectedCategoryId);
      const cat = getCategoryById(preselectedCategoryId);
      if (cat?.type) setType(cat.type);
    }
  }, [preselectedCategoryId, transactionToEdit, getCategoryById]);

  const handleNumpadInput = (value) => {
    if (value === '.' && amountStr.includes('.')) return;
    if (amountStr === '0' && value !== '.') {
      setAmountStr(value);
    } else {
      if (amountStr.length < 10) {
        setAmountStr(amountStr + value);
      }
    }
  };

  const handleSubmit = () => {
    const finalAmount = parseFloat(amountStr);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast({ title: "שגיאה", description: "נא להזין סכום חוקי.", variant: "destructive" });
      return;
    }
    if (!selectedCategoryId) {
      toast({ title: "שגיאה", description: "נא לבחור קטגוריה.", variant: "destructive" });
      return;
    }

    const tagsArray = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
    const transactionData = {
      id: transactionToEdit?.id,
      type,
      amount: finalAmount,
      categoryId: selectedCategoryId,
      date: selectedDate.toISOString().split('T')[0],
      description,
      tags: tagsArray,
      recurring: isRecurring,
      recurrenceFrequency,
      recurrenceDay,
      recurrenceEndType,
      recurrenceEndDate: recurrenceEndType === 'date' ? recurrenceEndDate.toISOString().split('T')[0] : null,
      recurrenceOccurrences: recurrenceEndType === 'count' ? recurrenceOccurrences : null,
    };

    if (transactionToEdit) {
      if (editMode) {
        switch (editMode) {
          case 'single':
            editSingleTransaction(transactionData);
            break;
          case 'future':
            editFromCurrentOnward(transactionToEdit, transactionData);
            break;
          case 'all':
            editEntireSeries(transactionToEdit.originalId || transactionToEdit.id, transactionData);
            break;
          default:
            updateTransaction(transactionData);
        }
      } else {
        updateTransaction(transactionData);
      }
      toast({ title: "הצלחה!", description: "העסקה עודכנה." });
    } else {
      addTransaction(transactionData);
      toast({ title: "הצלחה!", description: "העסקה נוספה." });
    }

    navigate(-1);
  };

  const filteredCategories = categories.filter(cat => type === 'income' ? cat.type === 'income' : cat.type !== 'income' || !cat.type);
  const currentCategoryName = getCategoryById(selectedCategoryId)?.name_he || (type === 'income' ? 'בחר קטגורית הכנסה' : 'בחר קטגורית הוצאה');

  return (
    <div className="flex flex-col h-full max-h-screen p-4 sm:p-6 bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">{transactionToEdit ? 'עריכת עסקה' : 'הוספת עסקה חדשה'}</h1>
        <Button variant="ghost" size="icon" onClick={handleSubmit}>
          <CheckCircle className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* Scrollable Form Content */}
      <div className="overflow-y-auto flex-grow space-y-4 pb-4">
        <div className="p-4 bg-muted rounded-lg text-center">
          <span className={`text-4xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
            {parseFloat(amountStr).toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              minimumFractionDigits: amountStr.includes('.') ? amountStr.split('.')[1].length : 0
            })}
          </span>
        </div>

        {/* Date & Type */}
        <div className="grid grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
                <CalendarDays className="ml-2 h-5 w-5 opacity-70" />
                {selectedDate ? format(selectedDate, 'PPP', { locale: he }) : 'בחר תאריך'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={he}
                dir="rtl"
              />
              <div className="p-2 border-t border-border grid grid-cols-3 gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>היום</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(subDays(new Date(), 1))}>אתמול</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(currentMonthDateFromNav)}>חודש נוכחי</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={type} onValueChange={(newType) => { setType(newType); setSelectedCategoryId(''); }}>
            <SelectTrigger className="h-12">
              <Type className="ml-2 h-5 w-5 opacity-70" />
              <SelectValue placeholder="סוג עסקה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">הוצאה</SelectItem>
              <SelectItem value="income">הכנסה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* קטגוריה */}
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="h-12 w-full">
            <Tag className="ml-2 h-5 w-5 opacity-70" />
            <SelectValue placeholder={currentCategoryName} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {filteredCategories.map((cat) => {
                const Icon = getIconComponent(cat.iconName) || DollarSign;
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center">
                      <Icon className={`ml-2 h-4 w-4 ${cat.color || 'text-gray-400'}`} />
                      {cat.name_he}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* תיאור */}
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תיאור (אופציונלי)"
          className="h-12"
        />

        {/* תגיות */}
        <div className="relative">
          <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="תגיות (מופרדות בפסיק, אופציונלי)"
            className="h-12 pl-10"
          />
        </div>

        {/* תזמון חוזר */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
            <Repeat className="h-5 w-5" /> עסקה מתוזמנת
          </label>

          {isRecurring && (
            <>
              <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                <SelectTrigger className="h-12 w-full">
                  <CalendarCheck2 className="ml-2 h-5 w-5 opacity-70" />
                  <SelectValue placeholder="תדירות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">יומית</SelectItem>
                  <SelectItem value="weekly">שבועית</SelectItem>
                  <SelectItem value="monthly">חודשית</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                className="h-12"
                placeholder="יום בחודש"
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(Number(e.target.value))}
              />

              <Select value={recurrenceEndType} onValueChange={setRecurrenceEndType}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="מתי להפסיק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">לא להפסיק</SelectItem>
                  <SelectItem value="date">בתאריך מסוים</SelectItem>
                  <SelectItem value="count">אחרי מספר פעמים</SelectItem>
                </SelectContent>
              </Select>

              {recurrenceEndType === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-12">
                      <CalendarDays className="ml-2 h-5 w-5 opacity-70" />
                      {format(recurrenceEndDate, 'PPP', { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={recurrenceEndDate}
                      onSelect={setRecurrenceEndDate}
                      initialFocus
                      locale={he}
                      dir="rtl"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {recurrenceEndType === 'count' && (
                <Input
                  type="number"
                  className="h-12"
                  placeholder="מספר מופעים"
                  value={recurrenceOccurrences}
                  onChange={(e) => setRecurrenceOccurrences(Number(e.target.value))}
                  min={1}
                />
              )}
            </>
          )}
        </div>

        {/* מקלדת מספרים */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <NumpadButton key={num} value={String(num)} onClick={handleNumpadInput} />
          ))}
          <NumpadButton value="." onClick={handleNumpadInput} />
          <NumpadButton value="0" onClick={handleNumpadInput} />
          <Button
            variant="outline"
            className="text-2xl h-16 sm:h-20 rounded-lg shadow-sm active:bg-primary/20"
            onClick={() => setAmountStr(amountStr.length > 1 ? amountStr.slice(0, -1) : '0')}
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionMobilePage;