import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Repeat } from 'lucide-react';

const RecurringTransactionDialog = ({ isOpen, onClose, onAction, actionType = 'delete' }) => {
  const isDelete = actionType === 'delete';
  const title = isDelete ? 'מחיקת עסקה חוזרת' : 'עריכת עסקה חוזרת';
  const description = isDelete 
    ? 'עסקה זו היא חלק מסדרה חוזרת. מה תרצה לעשות?'
    : 'עסקה זו היא חלק מסדרה חוזרת. איך תרצה לערוך אותה?';

  const handleAction = (action) => {
    onAction(action);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAction('single')}
          >
            {isDelete ? 'מחק רק את העסקה הנוכחית' : 'ערוך רק את העסקה הנוכחית'}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAction('future')}
          >
            {isDelete ? 'מחק מהעסקה הנוכחית והלאה' : 'ערוך מהעסקה הנוכחית והלאה'}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAction('all')}
          >
            {isDelete ? 'מחק את כל הסדרה' : 'ערוך את כל הסדרה'}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTransactionDialog; 