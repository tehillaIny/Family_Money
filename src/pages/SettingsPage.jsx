import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/hooks/useData.jsx';
import Header from '@/components/shared/Header.jsx';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select.jsx';
import { 
    Check, Palette, LogOut, User, ShieldAlert, Trash2, 
    Database, ArrowDownToLine, Users, Copy, CheckCheck, UserCog, Pencil
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.js';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as DialogFooterComponent,
} from '@/components/ui/dialog.jsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import CsvExportButton from "@/components/ui/CsvExportButton.jsx";
import CsvImport from "@/components/shared/CsvImport.jsx";

// --- Imports for Migration ---
import { db } from '@/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// אייקונים לקטגוריות
import {
  Home, DollarSign, Coffee, Truck, ShoppingCart, Heart, BookOpen, Music,
} from 'lucide-react';

// --- רכיב טופס הקטגוריה ---
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

// --- הדף הראשי ---
export default function SettingsPage() {
  const { 
    logout, currentUser, familyId, joinFamily, familyMembers, 
    updateUserProfile, userData // הוספנו את הפונקציה לעדכון שם ואת נתוני המשתמש
  } = useAuth();
  
  const navigate = useNavigate();
  
  const {
    categories,
    updateCategory,
    deleteCategory,
    addCategory,
    resetUserData,
  } = useData();

  const [editingCategory, setEditingCategory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  // State עבור הצטרפות למשפחה
  const [targetFamilyCode, setTargetFamilyCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // State עבור עריכת שם (פרופיל)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [nameToEdit, setNameToEdit] = useState('');

  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
      toast({ title: "שגיאה בהתנתקות", variant: "destructive" });
    }
  };

  const iconMap = {
    home: Home, money: DollarSign, food: Coffee, transport: Truck,
    shopping: ShoppingCart, health: Heart, education: BookOpen, entertainment: Music,
  };

  const getIconComponent = (iconName) => iconMap[iconName] || Palette;

  // --- CRUD קטגוריות ---
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

  const handleCancelEdit = () => { setIsDialogOpen(false); setEditingCategory(null); };
  const handleEditCategory = (category) => { setEditingCategory(category); setIsDialogOpen(true); };
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
  const handleResetUserData = async () => {
    await resetUserData();
    toast({ title: 'הנתונים אופסו בהצלחה' });
  };

  const handleImportFromDemo = async () => {
    if (!familyId) {
        toast({ title: "שגיאה", description: "לא נמצא מזהה משפחה", variant: "destructive" });
        return;
    }
    setIsMigrating(true);
    try {
        const batchSize = 450;
        let batchCount = 0;
        const demoCatsRef = collection(db, 'users', 'demoUser', 'categories');
        const demoCatsSnapshot = await getDocs(demoCatsRef);
        const demoTransRef = collection(db, 'users', 'demoUser', 'transactions');
        const demoTransSnapshot = await getDocs(demoTransRef);

        if (demoCatsSnapshot.empty && demoTransSnapshot.empty) {
            toast({ title: "לא נמצאו נתונים", description: "החשבון 'דמו' ריק." });
            setIsMigrating(false);
            return;
        }

        const allDocsToCopy = [
            ...demoCatsSnapshot.docs.map(d => ({ type: 'category', data: d.data(), id: d.id })),
            ...demoTransSnapshot.docs.map(d => ({ type: 'transaction', data: d.data(), id: d.id }))
        ];

        console.log(`Found ${allDocsToCopy.length} documents to migrate...`);

        for (let i = 0; i < allDocsToCopy.length; i += batchSize) {
            const chunk = allDocsToCopy.slice(i, i + batchSize);
            const batch = writeBatch(db);
            chunk.forEach(item => {
                const collectionName = item.type === 'category' ? 'categories' : 'transactions';
                const docRef = doc(db, 'users', familyId, collectionName, item.id);
                batch.set(docRef, item.data);
            });
            await batch.commit();
            batchCount++;
        }
        toast({ title: "ההעברה הושלמה בהצלחה!", description: `הועתקו ${allDocsToCopy.length} פריטים לחשבון שלך.` });
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error("Migration failed:", error);
        toast({ title: "שגיאה בהעברה", description: error.message, variant: "destructive" });
    } finally {
        setIsMigrating(false);
    }
  };

  const handleCopyFamilyCode = () => {
    navigator.clipboard.writeText(familyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "הקוד הועתק ללוח" });
  };

  const handleJoinFamily = async () => {
    if (!targetFamilyCode.trim()) return;
    if (targetFamilyCode === familyId) {
        toast({ title: "זה קוד המשפחה הנוכחי שלך", variant: "destructive" });
        return;
    }

    setIsJoining(true);
    try {
        await joinFamily(targetFamilyCode);
        toast({ title: "הצטרפת למשפחה בהצלחה!" });
        setTargetFamilyCode('');
    } catch (error) {
        console.error(error);
        toast({ title: "שגיאה", description: "קוד שגוי או בעיית רשת", variant: "destructive" });
    } finally {
        setIsJoining(false);
    }
  };

  // לוגיקה לעריכת שם
  const openNameDialog = () => {
    setNameToEdit(userData?.name || currentUser?.email?.split('@')[0] || '');
    setIsNameDialogOpen(true);
  };

  const handleSaveName = async () => {
    if (!nameToEdit.trim()) return;
    try {
        await updateUserProfile(nameToEdit);
        toast({ title: "הפרופיל עודכן!", description: `השם שלך שונה ל-${nameToEdit}` });
        setIsNameDialogOpen(false);
    } catch (error) {
        toast({ title: "שגיאה", description: "לא הצלחנו לעדכן את השם", variant: "destructive" });
    }
  };

  // פונקציה ליצירת ראשי תיבות
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="pb-20">
      <Header title="הגדרות" subtitle="ניהול חשבון ומשפחה" />

      <div className="space-y-6 container mx-auto p-4">
        
        {/* --- כרטיסייה 1: החשבון שלי (משודרגת) --- */}
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              החשבון שלי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* אזור פרטים אישיים משודרג */}
            <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium">מחובר כ:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">
                            {userData?.name || currentUser?.email}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openNameDialog}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </div>
                    {userData?.name && (
                        <span className="text-xs text-muted-foreground dir-ltr text-right">{currentUser?.email}</span>
                    )}
                </div>
            </div>

            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto gap-2">
              <LogOut className="h-4 w-4" /> התנתק מהמערכת
            </Button>
          </CardContent>
        </Card>

        {/* --- כרטיסייה 2: ניהול משפחה --- */}
        <Card className="max-w-3xl mx-auto shadow-sm border-purple-100 dark:border-purple-900/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                    <Users className="h-5 w-5" />
                    שיתוף משפחתי
                </CardTitle>
                <CardDescription>
                    שתף את החשבון עם בן/בת הזוג כדי לנהל תקציב יחד.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* רשימת חברי משפחה */}
                {familyMembers.length > 0 && (
                    <div className="space-y-3">
                        <Label>חברי המשפחה:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {familyMembers.map((member) => (
                                <div key={member.uid} className="flex items-center gap-3 p-3 rounded-lg bg-white border shadow-sm">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(member.name || member.email)}`}>
                                        {getInitials(member.name || member.email)}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-semibold text-sm truncate">
                                            {member.name || member.email.split('@')[0]} 
                                            {currentUser.uid === member.uid && " (אני)"}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t"></div>

                {/* הקוד שלי */}
                <div className="space-y-2">
                    <Label>קוד המשפחה שלי (להזמנה):</Label>
                    <div className="flex gap-2">
                        <Input readOnly value={familyId || 'טוען...'} className="bg-muted font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={handleCopyFamilyCode}>
                            {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* הצטרפות לאחר */}
                <div className="space-y-2">
                    <Label>הצטרף למשפחה אחרת:</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="הדבק כאן קוד משפחה..." 
                            value={targetFamilyCode}
                            onChange={(e) => setTargetFamilyCode(e.target.value)}
                        />
                        <Button onClick={handleJoinFamily} disabled={isJoining || !targetFamilyCode}>
                            {isJoining ? 'מצרף...' : 'הצטרף'}
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>

        {/* --- כרטיסייה 3: הגירת נתונים --- */}
        <Card className="max-w-3xl mx-auto shadow-sm border-blue-100 dark:border-blue-900/30">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
                    <Database className="h-5 w-5" />
                    הגירת נתונים
                </CardTitle>
                <CardDescription>ייבוא נתונים מגרסת הדמו.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    onClick={handleImportFromDemo} 
                    disabled={isMigrating}
                    className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isMigrating ? 'מעביר נתונים...' : <><ArrowDownToLine className="h-4 w-4" /> ייבא נתונים</>}
                </Button>
            </CardContent>
        </Card>

        {/* --- כרטיסייה 4: ניהול קטגוריות --- */}
        <Card className="max-w-3xl mx-auto shadow-sm">
            <CardHeader><CardTitle>ניהול קטגוריות</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {categories.map((category) => {
                    const Icon = getIconComponent(category.iconName);
                    return (
                    <li key={category.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-3">
                        <Icon className={`h-6 w-6 ${category.color}`} />
                        <span className="font-medium">{category.name_he}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditCategory(category)}>ערוך</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteCategory(category.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </li>
                    );
                })}
                </ul>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between border-t pt-4">
                <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}>הוספת קטגוריה</Button>
                <div className="flex gap-2">
                    <CsvExportButton data={categories} filename="categories.csv" variant="outline">ייצוא</CsvExportButton>
                    <CsvImport variant="outline" onImport={handleImportCategories}>ייבוא</CsvImport>
                </div>
            </CardFooter>
        </Card>

        {/* --- אזור מסוכן --- */}
        <Card className="max-w-3xl mx-auto shadow-sm border-red-100 dark:border-red-900/30">
            <CardHeader><CardTitle className="text-red-600 flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5" /> אזור מסוכן</CardTitle></CardHeader>
            <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-200 gap-2"><Trash2 className="h-4 w-4" /> איפוס כל הנתונים</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>איפוס נתונים מלא</AlertDialogTitle>
                      <AlertDialogDescription>פעולה זו תמחק את כל המידע בחשבון.<br/><b>לא ניתן לשחזר.</b></AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetUserData} className="bg-red-600 text-white">כן, אפס הכל</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

      </div>

      {/* דיאלוג עריכת קטגוריה */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה'}</DialogTitle></DialogHeader>
          <CategoryForm category={editingCategory} onSave={handleSaveCategory} onCancel={handleCancelEdit} iconMap={iconMap} getIconComponent={getIconComponent} />
        </DialogContent>
      </Dialog>

      {/* דיאלוג עריכת שם (פרופיל) - חדש! */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת שם פרופיל</DialogTitle>
            <CardDescription>השם הזה יוצג ליד העסקאות שתבצע/י.</CardDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-right block mb-2">שם מלא / כינוי</Label>
            <Input 
                id="name" 
                value={nameToEdit} 
                onChange={(e) => setNameToEdit(e.target.value)} 
                placeholder="לדוגמה: משה"
            />
          </div>
          <DialogFooterComponent>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveName}>שמור שינויים</Button>
          </DialogFooterComponent>
        </DialogContent>
      </Dialog>
    </div>
  );
}