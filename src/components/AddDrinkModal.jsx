import React, { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus } from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';

const AddDrinkModal = ({ categories, onAddCustomDrink }) => {
  const { theme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.price && formData.category) {
      onAddCustomDrink({
        id: `custom-${Date.now()}`,
        name: formData.name,
        price: parseFloat(formData.price),
        available: true,
      }, formData.category);
      setFormData({ name: '', price: '', category: '' });
      setIsOpen(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          Ajouter une boisson
        </Button>
      </DialogTrigger>
      <DialogContent className={`${bgClass} max-w-md mx-auto rounded-md p-6`}>
        <DialogHeader>
          <DialogTitle className={`${textClass} text-xl font-semibold mb-4`}>
            Ajouter une nouvelle boisson
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la boisson */}
          <div>
            <Label htmlFor="drink-name" className={`${textClass} block mb-1`}>
              Nom de la boisson
            </Label>
            <Input
              id="drink-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Red Bull"
              required
              className="w-full"
            />
          </div>

          {/* Prix */}
          <div>
            <Label htmlFor="drink-price" className={`${textClass} block mb-1`}>
              Prix (€)
            </Label>
            <Input
              id="drink-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ex: 3.50"
              required
              className="w-full"
            />
          </div>

          {/* Choix de la catégorie */}
          <div>
            <Label htmlFor="drink-category" className={`${textClass} block mb-1`}>
              Catégorie
            </Label>
            <Select
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              value={formData.category}
              required
            >
              <SelectTrigger id="drink-category" className="w-full">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="mr-2">{category.icon}</span> {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button className="btn-outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="btn-primary">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDrinkModal;
