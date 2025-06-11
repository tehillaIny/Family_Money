import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { useData } from '@/hooks/useData.jsx';

const TagSelector = ({ value, onChange }) => {
  const { transactions } = useData();
  const [allTags, setAllTags] = useState(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Get all unique tags from transactions
  useEffect(() => {
    const tags = new Set();
    transactions.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tags.add(tag));
      }
    });
    setAllTags(tags);
  }, [transactions]);

  const handleAddTag = (tag) => {
    const currentTags = value.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      onChange(newTags.join(', '));
    }
  };

  const handleCreateTag = () => {
    if (newTag.trim()) {
      const currentTags = value.split(',').map(t => t.trim()).filter(Boolean);
      if (!currentTags.includes(newTag.trim())) {
        const newTags = [...currentTags, newTag.trim()];
        onChange(newTags.join(', '));
      }
      setNewTag('');
      setIsAdding(false);
    }
  };

  const currentTags = value.split(',').map(t => t.trim()).filter(Boolean);
  const availableTags = Array.from(allTags).filter(tag => !currentTags.includes(tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {currentTags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => {
                const newTags = currentTags.filter(t => t !== tag);
                onChange(newTags.join(', '));
              }}
              className="hover:text-primary/80"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            הוסף תגית
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="תגית חדשה"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTag();
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setIsAdding(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!isAdding && availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {availableTags.map(tag => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleAddTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector; 