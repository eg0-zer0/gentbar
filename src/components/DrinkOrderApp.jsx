import React, { useState, useMemo, useEffect } from 'react';
import { useViewMode } from '../contexts/ViewModeContext';
import { useToast } from '../hooks/use-toast';

// UI components
import Header from './Header';
import CategorySection from './CategorySection';
import OrderSummary from './OrderSummary';
import OrderHistory from './OrderHistory';
import ConfirmOrderModal from './ConfirmOrderModal';
import EditDrinkModal from './EditDrinkModal';
import EditCategoryModal from './EditCategoryModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import SortControls from './SortControls';
import InstallBanner from './InstallBanner';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';

// Icons etc.
import { Plus } from 'lucide-react';

// Data & utils
import { mockCategories, mockOrderHistory } from '../mock';
import { generateDrinkId } from '../utils/id';
import '../App.css';

const DrinkOrderApp = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode();

  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('categories')) || mockCategories);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('orders')) || []);
  const [orderHistory, setOrderHistory] = useState(() => JSON.parse(localStorage.getItem('orderHistory')) || mockOrderHistory);
  const [sortBy, setSortBy] = useState('name');
  const [soundEnabled, setSoundEnabled] = useState(() => JSON.parse(localStorage.getItem('soundEnabled')) ?? true);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [editDrinkModal, setEditDrinkModal] = useState({
    isOpen: false,
    drink: null,
    categoryId: null,
    mode: 'edit'
  });
  const [editCategoryModal, setEditCategoryModal] = useState({ isOpen: false, category: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: null, item: null, categoryId: null });

  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('orderHistory', JSON.stringify(orderHistory)); }, [orderHistory]);
  useEffect(() => { localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('viewMode', viewMode); }, [viewMode]);

  // Popularité des boissons
  const drinkPopularity = useMemo(() => {
    const popularity = {};
    orderHistory.forEach(order => {
      order.items.forEach(item => {
        popularity[item.drinkName] = (popularity[item.drinkName] || 0) + item.quantity;
      });
    });
    const byId = {};
    categories.forEach(c => c.drinks.forEach(d => {
      byId[d.id] = popularity[d.name] || 0;
    }));
    return byId;
  }, [orderHistory, categories]);

  // Tri des boissons
  const sortDrinks = (drinks, sortBy) => {
    const sorted = [...drinks];
    switch (sortBy) {
      case 'popularity':
        return sorted.sort((a, b) => (drinkPopularity[b.id] || 0) - (drinkPopularity[a.id] || 0));
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const getSortedCategories = () => (sortBy === 'default')
    ? categories
    : categories.map(c => ({ ...c, drinks: sortDrinks(c.drinks, sortBy) }));

  // ---- GESTION PANIER ----

  const handleAddDrink = (drink) => {
    setOrders(prevOrders => {
      const idx = prevOrders.findIndex(order => order.drinkId === drink.id);
      if (idx >= 0) {
        const updated = [...prevOrders];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [
        ...prevOrders,
        { drinkId: drink.id, drinkName: drink.name, price: drink.price, quantity: 1, addedAt: new Date().toISOString() }
      ];
    });
    toast({ title: "Boisson ajoutée", description: `${drink.name} ajoutée à la commande` });
  };

  const handleUpdateQuantity = (id, qty) => {
    if (qty <= 0) {
      handleRemoveItem(id);
    } else {
      setOrders(prev => prev.map(i => i.drinkId === id ? { ...i, quantity: qty } : i));
    }
  };

  const handleRemoveItem = (id) => {
    setOrders(prev => prev.filter(i => i.drinkId !== id));
    toast({ title: "Article supprimé", description: "L'article a été retiré du panier" });
  };

  const handleClearAll = () => {
    setOrders([]);
    toast({ title: "Commande vidée", description: "Toutes les commandes ont été supprimées" });
  };

  const handleConfirmOrderClick = () => {
    if (orders.length) setShowConfirmModal(true);
  };

  // ---- FINALISER LA COMMANDE ----

  const finalizeOrder = () => {
    const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    const newOrder = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: orders.map(o => ({ drinkName: o.drinkName, quantity: o.quantity, price: o.price })),
      total
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setOrders([]);
    setShowConfirmModal(false);
    toast({ title: "Commande confirmée", description: `Total: ${total.toFixed(2)} €` });
  };

  // ---- GESTION CATEGORIES/DRINKS ----

  const handleToggleCategory = (id) => setCategories(prev =>
    prev.map(c => c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c)
  );

  const handleEditDrink = (drink, mode = 'edit') => {
    const cat = categories.find(c => c.drinks.some(d => d.id === drink.id));
    setEditDrinkModal({ isOpen: true, drink, categoryId: cat?.id, mode });
  };

  const handleDeleteDrink = (drink) => {
    const cat = categories.find(c => c.drinks.some(d => d.id === drink.id));
    setDeleteDialog({ isOpen: true, type: 'drink', item: drink, categoryId: cat?.id });
  };

  const confirmDeleteDrink = () => {
    const { item, categoryId } = deleteDialog;
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, drinks: c.drinks.filter(d => d.id !== item.id) } : c
    ));
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
    toast({ title: "Boisson supprimée", description: `${item.name} a été retirée du menu` });
  };

  const handleSaveDrink = (updated) => {
    if (editDrinkModal.mode === 'add') {
      setCategories(prev => prev.map(c =>
        c.id === editDrinkModal.categoryId
          ? { ...c, drinks: [...c.drinks, { ...updated, id: generateDrinkId(updated.name, c.id) }] }
          : c
      ));
      toast({ title: "Boisson ajoutée", description: `${updated.name} ajoutée au menu` });
    } else {
      setCategories(prev => prev.map(c => ({
        ...c,
        drinks: c.drinks.map(d => d.id === updated.id ? updated : d)
      })));
      toast({ title: "Boisson modifiée", description: `${updated.name} modifiée` });
    }
  };

  const handleAddDrinkToCategory = (categoryId) => {
    setEditDrinkModal({ isOpen: true, drink: { id: '', name: '', price: 0 }, categoryId, mode: 'add' });
  };

  const handleEditCategory = (cat) => setEditCategoryModal({ isOpen: true, category: cat });

  const handleDeleteCategory = (cat) => {
    setDeleteDialog({ isOpen: true, type: 'category', item: cat });
  };
  
  const handleRemoveOrder = (orderId) => {
  setOrderHistory(prev => prev.filter(order => order.id !== orderId));
};

  const confirmDeleteCategory = () => {
    const cat = deleteDialog.item;
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
    toast({ title: "Catégorie supprimée", description: `${cat.name} supprimée` });
  };

  const handleSaveCategory = (cat) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === cat.id);
      if (exists) {
        toast({ title: "Catégorie modifiée", description: `${cat.name} mise à jour` });
        return prev.map(c => c.id === cat.id ? cat : c);
      } else {
        toast({ title: "Catégorie ajoutée", description: `${cat.name} créée` });
        return [...prev, { ...cat, id: `cat-${Date.now()}`, drinks: [], isCollapsed: false }];
      }
    });
  };

  const handleAddCategory = () => setEditCategoryModal({ isOpen: true, category: { name: '', icon: '' } });

  // === RENDER ===
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <div className={`container mx-auto px-4 py-8 max-w-7xl content-container ${!showConfirmModal ? 'pb-20' : ''}`}>
        <Header
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(s => !s)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onShowHistory={() => setShowHistory(true)}
        />

        <div className="flex items-center justify-between mb-4 gap-2">
          <SortControls sortBy={sortBy} setSortBy={setSortBy} />
          <Button onClick={handleAddCategory} variant="primary" size="sm">
            Ajouter une catégorie
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {getSortedCategories().map(c => (
              <CategorySection
                key={c.id}
                category={c}
                onAddDrink={handleAddDrink}
                onEditDrink={handleEditDrink}
                onToggleCategory={handleToggleCategory}
                onEditCategory={handleEditCategory}
                onAddDrinkToCategory={handleAddDrinkToCategory}
                onDeleteCategory={handleDeleteCategory}
                onDeleteDrink={handleDeleteDrink}
                sortedDrinks={sortDrinks(c.drinks, sortBy)}
                drinkPopularity={drinkPopularity}
                orders={orders}
                soundEnabled={soundEnabled}
                viewMode={viewMode}
              />
            ))}
          </div>
          <div className="lg:col-span-1 space-y-6">
            <OrderSummary
              orders={orders}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearAll={handleClearAll}
              onConfirmOrder={handleConfirmOrderClick}
              isConfirmModalOpen={showConfirmModal}
            />
          </div>
        </div>

        <OrderHistory
          orderHistory={orderHistory}
          onOpen={() => setShowHistory(true)}
          onClose={() => setShowHistory(false)}
          isOpen={showHistory}
          categories={categories}
          onRemoveOrder={handleRemoveOrder} 
        />

        <ConfirmOrderModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          orders={orders}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onConfirm={finalizeOrder}
        />

        <EditDrinkModal
          {...editDrinkModal}
          onClose={() => setEditDrinkModal({ isOpen: false, drink: null, categoryId: null, mode: 'edit' })}
          onSave={handleSaveDrink}
          onDelete={handleDeleteDrink}
        />

        <EditCategoryModal
          {...editCategoryModal}
          onClose={() => setEditCategoryModal({ isOpen: false, category: null })}
          onSave={handleSaveCategory}
        />

        <DeleteConfirmDialog
          {...deleteDialog}
          onClose={() => setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null })}
          onConfirm={() => {
            if (deleteDialog.type === 'drink') confirmDeleteDrink();
            else if (deleteDialog.type === 'category') confirmDeleteCategory();
          }}
        />

        <InstallBanner />

        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default DrinkOrderApp;
