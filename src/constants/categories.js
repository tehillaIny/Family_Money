// src/constants/categories.js
import {
  Car, Briefcase as BriefcaseSimple, ShoppingBag, Gift, Building as BuildingApartment,
  GraduationCap, FolderHeart as HandHeart, Shirt, Gamepad as GameController,
  Popcorn, Bed, CreditCard, Bug as Question, ShoppingBasket as Basket,
  Coins, PiggyBank, DollarSign
} from 'lucide-react';

export const iconMap = {
  Car, BriefcaseSimple, ShoppingBag, Gift, BuildingApartment,
  GraduationCap, HandHeart, Shirt, GameController, Popcorn,
  Bed, CreditCard, Question, Basket, Coins, PiggyBank, DollarSign
};

export const getIconComponent = (iconName) => {
  return iconMap[iconName] || DollarSign;
};

export const defaultCategories = [
  { id: 'cat_car', name_en: 'Car', name_he: 'רכב', iconName: 'Car', color: 'text-blue-500', colorHex: '#3b82f6', type: 'expense', showOnDashboard: true },
  { id: 'cat_transport', name_en: 'Transportation', name_he: 'תחבורה', iconName: 'BriefcaseSimple', color: 'text-purple-500', colorHex: '#8b5cf6', type: 'expense', showOnDashboard: true },
  { id: 'cat_leisure', name_en: 'Leisure', name_he: 'פנאי', iconName: 'GameController', color: 'text-pink-500', colorHex: '#ec4899', type: 'expense', showOnDashboard: true },
  { id: 'cat_restaurant', name_en: 'Restaurant', name_he: 'מסעדה', iconName: 'Popcorn', color: 'text-orange-500', colorHex: '#f97316', type: 'expense', showOnDashboard: true },
  { id: 'cat_shopping', name_en: 'Shopping', name_he: 'קניות', iconName: 'ShoppingBag', color: 'text-yellow-500', colorHex: '#eab308', type: 'expense', showOnDashboard: true },
  { id: 'cat_gifts', name_en: 'Gifts', name_he: 'מתנות', iconName: 'Gift', color: 'text-red-500', colorHex: '#ef4444', type: 'expense', showOnDashboard: true },
  { id: 'cat_rent', name_en: 'Rent', name_he: 'שכר דירה', iconName: 'BuildingApartment', color: 'text-teal-500', colorHex: '#14b8a6', type: 'expense', showOnDashboard: true },
  { id: 'cat_studies', name_en: 'Studies', name_he: 'לימודים', iconName: 'GraduationCap', color: 'text-cyan-500', colorHex: '#06b6d4', type: 'expense', showOnDashboard: false },
  { id: 'cat_donations', name_en: 'Donations', name_he: 'תרומות', iconName: 'HandHeart', color: 'text-lime-500', colorHex: '#84cc16', type: 'expense', showOnDashboard: false },
  { id: 'cat_clothing', name_en: 'Clothing', name_he: 'ביגוד', iconName: 'Shirt', color: 'text-fuchsia-500', colorHex: '#d946ef', type: 'expense', showOnDashboard: true },
  { id: 'cat_bills', name_en: 'Bills', name_he: 'חשבונות', iconName: 'CreditCard', color: 'text-sky-500', colorHex: '#0ea5e9', type: 'expense', showOnDashboard: true },
  { id: 'cat_groceries', name_en: 'Groceries', name_he: 'סופרמרקט', iconName: 'Basket', color: 'text-green-500', colorHex: '#22c55e', type: 'expense', showOnDashboard: true },
  { id: 'cat_other_expense', name_en: 'Other Expense', name_he: 'אחר', iconName: 'Question', color: 'text-gray-500', colorHex: '#6b7280', type: 'expense', showOnDashboard: false },
  { id: 'cat_salary', name_en: 'Salary', name_he: 'משכורת', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_Pocket_Money', name_en: 'PocketMoney', name_he: 'דמי כיס', iconName: 'PiggyBank', color: 'text-indigo-500', colorHex: '#6366f1', type: 'income', showOnDashboard: false },
  { id: 'cat_Grant', name_en: 'Grant', name_he: 'מענק', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_Presents', name_en: 'Presents', name_he: 'מתנה', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
  { id: 'cat_other_income', name_en: 'income-else', name_he: 'אחר', iconName: 'Coins', color: 'text-emerald-500', colorHex: '#10b981', type: 'income', showOnDashboard: false },
];