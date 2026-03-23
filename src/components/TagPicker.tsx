import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import type { Tag } from '@/src/db';

interface TagPickerProps {
  category: 'SETUP' | 'MISTAKE' | 'EMOTION';
  selected: string[];
  onChange: (selected: string[]) => void;
  allTags: Tag[];
  /** Allow users to type and add a tag that doesn't exist in allTags */
  allowCustom?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  SETUP: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  MISTAKE: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
  EMOTION: 'bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20',
};

const SELECTED_COLORS: Record<string, string> = {
  SETUP: 'bg-blue-500 text-white border-blue-500',
  MISTAKE: 'bg-rose-500 text-white border-rose-500',
  EMOTION: 'bg-violet-500 text-white border-violet-500',
};

export function TagPicker({
  category,
  selected,
  onChange,
  allTags,
  allowCustom = true,
}: TagPickerProps) {
  const [customInput, setCustomInput] = useState('');

  const categoryTags = allTags.filter((t) => t.type === category);

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  function addCustom() {
    const name = customInput.trim();
    if (!name || selected.includes(name)) return;
    onChange([...selected, name]);
    setCustomInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  }

  const base = CATEGORY_COLORS[category];
  const activeClass = SELECTED_COLORS[category];

  return (
    <div className="space-y-3">
      {/* Available tags */}
      <div className="flex flex-wrap gap-2">
        {categoryTags.map((tag) => {
          const isSelected = selected.includes(tag.name);
          return (
            <button
              key={tag.id ?? tag.name}
              type="button"
              onClick={() => toggle(tag.name)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isSelected ? activeClass : base
              }`}
            >
              {tag.name}
              {isSelected && <X className="ml-1.5 h-3 w-3" />}
            </button>
          );
        })}

        {/* Show custom selected tags not in the list */}
        {selected
          .filter((s) => !categoryTags.some((t) => t.name === s))
          .map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${activeClass}`}
            >
              {name}
              <X className="ml-1.5 h-3 w-3" />
            </button>
          ))}
      </div>

      {/* Custom tag input */}
      {allowCustom && (
        <div className="flex items-center space-x-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add custom ${category.toLowerCase()} tag…`}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
