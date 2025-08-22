import React from 'react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';

import { ArrowUpDown, TrendingUp, DollarSign, ArrowDownAZ, Layers3 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

import { useTheme } from '../contexts/ThemeContext';

const SortControls = ({ sortBy, setSortBy }) => {
  const { theme } = useTheme();

  const sortOptions = [
    { value: 'name', label: 'Alphabétique', icon: ArrowDownAZ },
    { value: 'popularity', label: 'Popularité', icon: TrendingUp },
    { value: 'price-asc', label: 'Prix ↗', icon: DollarSign },
    { value: 'price-desc', label: 'Prix ↘', icon: DollarSign },
  ];

  const currentSort = sortOptions.find(option => option.value === sortBy);

  const bgSelectedClass = theme === 'dark' ? 'bg-accent text-white' : 'bg-accent text-white';
  const bgHoverClass = theme === 'dark' ? 'hover:bg-accent/80' : 'hover:bg-accent/90';

  return (
    <div className="inline-block text-sm font-medium">
      <label className="mr-2" htmlFor="sort-menu">Trier par:</label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            id="sort-menu"
            className="btn-outline"
            aria-haspopup="listbox"
            aria-label={`Trier les éléments, option actuelle: ${currentSort?.label || 'Alphabétique'}`}
          >
            <ArrowUpDown className="mr-2 w-4 h-4" />
            {currentSort?.label || 'name'}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className={`w-48 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`} align="start">
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
