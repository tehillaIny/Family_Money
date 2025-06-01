
    import React, { useState, useEffect } from 'react';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { ArrowLeft, CalendarDays, CheckCircle, Tag, Type, X, DollarSign, Tags } from 'lucide-react';
    import { Button } from '@/components/ui/button.jsx';
    import { Input } from '@/components/ui/input.jsx';
    import { useData } from '@/hooks/useData.jsx';
    import { useToast } from '@/components/ui/use-toast.js';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
    import { Calendar } from '@/components/ui/calendar.jsx';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select.jsx';
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
      const { categories, addTransaction, updateTransaction, getCategoryById, currentDate: contextCurrentDate, getIconComponent } = useData();
      const { toast } = useToast();

      const transactionToEdit = location.state?.transactionToEdit;
      const preselectedCategoryId = location.state?.preselectedCategoryId;
      const preselectedType = location.state?.type;
      const currentMonthDateFromNav = location.state?.currentMonthDate ? new Date(location.state.currentMonthDate) : new Date(contextCurrentDate);


      const [amountStr, setAmountStr] = useState(transactionToEdit ? String(Math.abs(transactionToEdit.amount)) : '0');
      const [description, setDescription] = useState(transactionToEdit ? transactionToEdit.description || '' : '');
      const [selectedDate, setSelectedDate] = useState(transactionToEdit ? new Date(transactionToEdit.date) : currentMonthDateFromNav);
      const [type, setType] = useState(transactionToEdit ? transactionToEdit.type : preselectedType || 'expense');
      const [selectedCategoryId, setSelectedCategoryId] = useState(transactionToEdit ? transactionToEdit.categoryId : preselectedCategoryId || '');
      const [tagsStr, setTagsStr] = useState(transactionToEdit && transactionToEdit.tags ? transactionToEdit.tags.join(', ') : '');


      useEffect(() => {
        if (preselectedCategoryId && !transactionToEdit) {
          setSelectedCategoryId(preselectedCategoryId);
          const cat = getCategoryById(preselectedCategoryId);
          if (cat) setType(cat.type || 'expense');
        }
      }, [preselectedCategoryId, getCategoryById, transactionToEdit]);
      
      useEffect(() => {
         if (preselectedType && !transactionToEdit) {
           setType(preselectedType);
           setSelectedCategoryId(''); 
         }
      }, [preselectedType, transactionToEdit]);


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

      const handleBackspace = () => {
        setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      };

      const handleClear = () => setAmountStr('0');

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

        const tagsArray = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const transactionData = {
          id: transactionToEdit ? transactionToEdit.id : undefined, 
          type,
          amount: finalAmount,
          categoryId: selectedCategoryId,
          date: selectedDate.toISOString().split('T')[0],
          description,
          tags: tagsArray,
        };

        if (transactionToEdit) {
          updateTransaction(transactionData);
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
        <div className="fixed inset-0 bg-background flex flex-col p-4 sm:p-6 h-screen" dir="rtl">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold">{transactionToEdit ? 'עריכת עסקה' : 'הוספת עסקה חדשה'}</h1>
            <Button variant="ghost" size="icon" onClick={handleSubmit}>
              <CheckCircle className="h-6 w-6 text-primary" />
            </Button>
          </div>

          <div className="mb-4 p-4 bg-muted rounded-lg text-center">
            <span className={`text-4xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
              {parseFloat(amountStr).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: amountStr.includes('.') ? amountStr.split('.')[1].length : 0})}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
                  <CalendarDays className="ml-2 h-5 w-5 opacity-70" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
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
          
          <div className="mb-4">
             <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="h-12 w-full">
                <Tag className="ml-2 h-5 w-5 opacity-70" />
                <SelectValue placeholder={currentCategoryName} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                {filteredCategories.map((cat) => {
                  const IconComponent = getIconComponent(cat.iconName) || DollarSign;
                  return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center">
                      <IconComponent className={`ml-2 h-4 w-4 ${cat.color || 'text-gray-400'}`} />
                      {cat.name_he}
                    </div>
                  </SelectItem>
                )})}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>


          <div className="mb-4">
            <Input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="תיאור (אופציונלי)"
              className="h-12"
            />
          </div>

          <div className="mb-4">
            <div className="relative">
              <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                value={tagsStr} 
                onChange={(e) => setTagsStr(e.target.value)} 
                placeholder="תגיות (מופרדות בפסיק, אופציונלי)"
                className="h-12 pl-10"
              />
            </div>
          </div>


          <div className="grid grid-cols-4 gap-2 flex-grow content-end">
            <NumpadButton value="C" onClick={handleClear} className="text-red-500" />
            <NumpadButton value="7" onClick={handleNumpadInput} />
            <NumpadButton value="8" onClick={handleNumpadInput} />
            <NumpadButton value="9" onClick={handleNumpadInput} />
            
            <NumpadButton value="." onClick={handleNumpadInput} />
            <NumpadButton value="4" onClick={handleNumpadInput} />
            <NumpadButton value="5" onClick={handleNumpadInput} />
            <NumpadButton value="6" onClick={handleNumpadInput} />
            
            <NumpadButton value="0" onClick={handleNumpadInput} />
            <NumpadButton value="1" onClick={handleNumpadInput} />
            <NumpadButton value="2" onClick={handleNumpadInput} />
            <NumpadButton value="3" onClick={handleNumpadInput} />
            
            <Button type="button" variant="outline" className="text-2xl h-16 sm:h-20 rounded-lg col-span-2" onClick={handleBackspace} >
              <X className="h-7 w-7" />
            </Button>
            <Button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground text-xl h-16 sm:h-20 rounded-lg col-span-2">
              שמור
            </Button>
          </div>
        </div>
      );
    };

    export default AddTransactionMobilePage;
  