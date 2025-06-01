import React, { useState } from 'react';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select.jsx';
import { Check, Palette } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterComponent,
} from '@/components/ui/dialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import CsvExportButton from "@/components/ui/CsvExportButton.jsx";
import CsvImport from "@/components/shared/CsvImport.jsx";

// הוספתי אייקונים מגוונים מ-lucide-react במקום Palette יחיד
import {
  Home,
  DollarSign,
  Coffee,
  Truck,
  ShoppingCart,
  Heart,
  BookOpen,
  Music,
} from 'lucide-react';

const CategoryForm = ({ category, onSave, onCancel, iconMap, getIconComponent }) => {
  const [name_he, setNameHe] = useState(category?.name_he || '');
  const [iconName, setIconName] = useState(category?.iconName || Object.keys(iconMap)[0]);
  const [color, setColor] = useState(category?.color || 'text-blue-500');
  const [type, setType] = useState(category?.type || 'expense');
  const [showOnDashboard, setShowOnDashboard] = useState(category?.showOnDashboard ?? true);
  const { toast } = useToast();

  const IconComponent = getIconComponent(iconName);

  const colorOptions = [
    { name: 'כחול', value: 'text-blue-500', hex: '#3b82f6' },
    { name: 'סגול', value: 'text-purple-500', hex: '#8b5cf6' },
    { name: 'ורוד', value: 'text-pink-500', hex: '#ec4899' },
    { name: 'כתום', value: 'text-orange-500', hex: '#f97316' },
    { name: 'צהוב', value: 'text-yellow-500', hex: '#eab308' },
    { name: 'אדום', value: 'text-red-500', hex: '#ef4444' },
    { name: 'טורקיז', value: 'text-teal-500', hex: '#14b8a6' },
    { name: 'ציאן', value: 'text-cyan-500', hex: '#06b6d4' },
    { name: 'ליים', value: 'text-lime-500', hex: '#84cc16' },
    { name: 'פוקסיה', value: 'text-fuchsia-500', hex: '#d946ef' },
    { name: 'שמיים', value: 'text-sky-500', hex: '#0ea5e9' },
    { name: 'ירוק', value: 'text-green-500', hex: '#22c55e' },
    { name: 'אמרלד', value: 'text-emerald-500', hex: '#10b981' },
    { name: 'אינדיגו', value: 'text-indigo-500', hex: '#6366f1' },
    { name: 'אפור', value: 'text-gray-500', hex: '#6b7280' },
  ];

  const selectedColorHex = colorOptions.find(opt => opt.value === color)?.hex;

  const handleSave = () => {
    if (!name_he.trim()) {
      toast({ title: "שגיאה", description: "שם קטגוריה הוא שדה חובה.", variant: "destructive" });
      return;
    }
    onSave({
      ...category,
      name_he,
      name_en: category?.name_en || name_he,
      iconName,
      color,
      colorHex: selectedColorHex,
      type,
      showOnDashboard,
    });
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <Label htmlFor="name_he">שם קטגוריה (עברית)</Label>
        <Input id="name_he" value={name_he} onChange={(e) => setNameHe(e.target.value)} className="mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="iconName">אייקון</Label>
          <Select value={iconName} onValueChange={setIconName}>
            <SelectTrigger id="iconName" className="mt-1">
              <div className="flex items-center">
                <IconComponent className={`ml-2 h-4 w-4 ${color}`} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(iconMap).map(([name, IconComp]) => (
                <SelectItem key={name} value={name}>
                  <div className="flex items-center">
                    <IconComp className="ml-2 h-4 w-4" /> {name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">צבע</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger id="color" className="mt-1">
              <div className="flex items-center">
                <Palette className={`ml-2 h-4 w-4 ${color}`} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full ml-2" style={{ backgroundColor: opt.hex }}></div>
                    {opt.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="type">סוג</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">הוצאה</SelectItem>
            <SelectItem value="income">הכנסה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'expense' && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
          <Switch id="showOnDashboard" checked={showOnDashboard} onCheckedChange={setShowOnDashboard} />
          <Label htmlFor="showOnDashboard">הצג בלוח המחוונים</Label>
        </div>
      )}

      <DialogFooterComponent className="pt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>ביטול</Button>
        <Button onClick={handleSave}><Check className="ml-2 h-4 w-4" /> שמור</Button>
      </DialogFooterComponent>
    </div>
  );
};

export default function SettingsPage() {
  const {
    categories,
    updateCategory,
    deleteCategory,
    addCategory,
    resetUserData,
  } = useData();

  const [editingCategory, setEditingCategory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // מפת אייקונים מעודכנת עם אייקונים שונים
  const iconMap = {
    home: Home,
    money: DollarSign,
    food: Coffee,
    transport: Truck,
    shopping: ShoppingCart,
    health: Heart,
    education: BookOpen,
    entertainment: Music,
  };

  const getIconComponent = (iconName) => iconMap[iconName] || Palette;

  const { toast } = useToast();

  const handleSaveCategory = (category) => {
    if (category.id) {
      updateCategory(category);
      toast({ title: 'קטגוריה עודכנה בהצלחה' });
    } else {
      addCategory(category);
      toast({ title: 'קטגוריה נוספה בהצלחה' });
    }
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
      deleteCategory(categoryId);
      toast({ title: 'קטגוריה נמחקה בהצלחה' });
    }
  };

  const handleImportCategories = (importedCategories) => {
    importedCategories.forEach(cat => addCategory(cat));
    toast({ title: 'קטגוריות יובאו בהצלחה' });
  };

  const handleResetUserData = () => {
    resetUserData();
    toast({ title: 'הנתונים אופסו בהצלחה' });
  };

  return (
    <>
      <Header title="הגדרות" subtitle="ניהול קטגוריות ונתונים" />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>קטגוריות</CardTitle>
          <CardDescription>הוספה, עריכה ומחיקה של קטגוריות ההוצאה/הכנסה שלך.</CardDescription>
        </CardHeader>

        <CardContent>
          {categories.length === 0 && (
            <p className="text-center text-muted-foreground">לא נמצאו קטגוריות</p>
          )}

          <ul className="space-y-3">
            {categories.map((category) => {
              const Icon = getIconComponent(category.iconName);
              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${category.color}`} />
                    <span>{category.name_he}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                    >
                      ערוך
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      מחק
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}>
            הוספת קטגוריה
          </Button>

          <div className="flex gap-2">
            <CsvExportButton
              data={categories}
              filename="categories_export.csv"
              headers={[
                { label: "שם בעברית", key: "name_he" },
                { label: "סוג", key: "type" },
                { label: "אייקון", key: "iconName" },
                { label: "צבע", key: "color" },
                { label: "הצג בלוח מחוונים", key: "showOnDashboard" },
              ]}
            >
              ייצוא CSV
            </CsvExportButton>

            <CsvImport onImport={handleImportCategories} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">איפוס נתונים</Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>איפוס נתונים</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחוק את כל הנתונים וקטגוריות הקטגוריה שלך.
                    האם אתה בטוח שברצונך להמשיך?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetUserData}>איפוס</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>

      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה'}</DialogTitle>
          </DialogHeader>

          <CategoryForm
            category={editingCategory}
            onSave={handleSaveCategory}
            onCancel={handleCancelEdit}
            iconMap={iconMap}
            getIconComponent={getIconComponent}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}