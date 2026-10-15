import React from 'react';

import { Button } from './ui/button';
import { ArrowUpDown, TrendingUp, DollarSign, ArrowDownAZ } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

const SortControls = ({ sortBy, setSortBy, className = '' }) => {

  const sortOptions = [
    { value: 'popularity', label: 'Popularité', icon: TrendingUp },
    { value: 'name', label: 'Alphabétique', icon: ArrowDownAZ },
    { value: 'price-asc', label: 'Prix ↗', icon: DollarSign },
    { value: 'price-desc', label: 'Prix ↘', icon: DollarSign },
  ];

  const currentSort = sortOptions.find(option => option.value === sortBy);

  const bgSelectedClass = 'bg-accent text-accent-foreground font-semibold';
  const bgHoverClass = 'hover:bg-accent/80 hover:text-accent-foreground';

  return (
    <div className={`inline-flex shrink-0 ${className}`}>
      <label className="sr-only" htmlFor="sort-menu">Trier par</label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            id="sort-menu"
            variant="outline"
            className="h-10 px-3 bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm font-medium shrink-0 shadow-sm gap-1.5"
            aria-haspopup="listbox"
            aria-label={`Trier les éléments, option actuelle: ${currentSort?.label || 'Popularité'}`}
          >
            <ArrowUpDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{currentSort?.label || 'Popularité'}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-44 bg-popover text-popover-foreground border border-border shadow-md" align="end">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const selected = sortBy === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded 
                  ${selected ? bgSelectedClass : bgHoverClass}`}
                role="option"
                aria-selected={selected}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortControls;
