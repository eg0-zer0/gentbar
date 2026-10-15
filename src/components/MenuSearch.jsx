import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';

const MenuSearch = ({ value, onChange, onClear, className = '' }) => {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      onClear();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`} role="search">
      <Search
        size={18}
        className="absolute left-3 text-muted-foreground pointer-events-none select-none"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Rechercher une boisson..."
        aria-label="Rechercher une boisson dans le menu"
        className="pl-9 pr-9 h-10 w-full bg-card text-foreground border-border rounded-lg placeholder:text-muted-foreground shadow-sm focus-visible:ring-primary text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Effacer la recherche"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default MenuSearch;
