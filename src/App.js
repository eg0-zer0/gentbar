// React & routing
import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Contexts & hooks
import { ThemeProvider } from './contexts/ThemeContext';
import { useToast } from './hooks/use-toast';

// UI components
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Plus } from 'lucide-react';

// App components
import Header from './components/Header';
import CategorySection from './components/CategorySection';
import OrderSummary from './components/OrderSummary';
import OrderHistory from './components/OrderHistory';
import ConfirmOrderModal from './components/ConfirmOrderModal';
import EditDrinkModal from './components/EditDrinkModal';
import EditCategoryModal from './components/EditCategoryModal';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import SortControls from './components/SortControls';
import InstallBanner from './components/InstallBanner';
import LandingPage from './components/LandingPage';

// Data & utils
import { mockCategories, mockOrderHistory } from './mock';
import { generateDrinkId } from './utils/id';

// Styles
import './App.css';

const DrinkOrderApp = () => {
  const { toast } = useToast();

  // === États persistants ===
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('categories')) || mockCategories);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('orders')) || []);
  const [orderHistory, setOrderHistory] = useState(() => JSON.parse(localStorage.getItem('orderHistory')) || mockOrderHistory);
  const [sortBy, setSortBy] = useState('name');
  const [soundEnabled, setSoundEnabled] = useState(() => JSON.parse(localStorage.getItem('soundEnabled')) ?? true);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'large');

  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // États modals
  const [editDrinkModal, setEditDrinkModal] = useState({ isOpen: false, drink: null, categoryId: null, mode: 'edit' });
  const [editCategoryModal, setEditCategoryModal] = useState({ isOpen: false, category: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: null, item: null, categoryId: null });

  // Sauvegarde auto dans localStorage
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('orderHistory', JSON.stringify(orderHistory)); }, [orderHistory]);
  useEffect(() => { localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('viewMode', JSON.stringify(viewMode)); }, [viewMode]);

  // Popularité via historique
  const drinkPopularity = useMemo(() => {
    const popularity = {};
    orderHistory.forEach(order =>
      order.items.forEach(item => {
        popularity[item.drinkName] = (popularity[item.drinkName] || 0) + item.quantity;
      })
    );
    const byId = {};
    categories.forEach(c => c.drinks.forEach(d => { byId[d.id] = popularity[d.name] || 0; }));
    return byId;
  }, [orderHistory, categories]);

  // Tri boissons
  const sortDrinks = (drinks, sortBy) => {
    const sorted = [...drinks];
    switch (sortBy) {
      case 'popularity': return sorted.sort((a, b) => (drinkPopularity[b.id] || 0) - (drinkPopularity[a.id] || 0));
      case 'price-asc': return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc': return sorted.sort((a, b) => b.price - a.price);
      case 'name':
      default: return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };


  const getSortedCategories = () =>
    (sortBy === 'default') ? categories :
      categories.map(c => ({ ...c, drinks: sortDrinks(c.drinks, sortBy) }));

  // === Gestion panier ===
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
        {
          drinkId: drink.id,
          drinkName: drink.name,
          price: drink.price,
          quantity: 1,
          addedAt: new Date().toISOString()
        }
      ];
    });
    toast({ title: "Boisson ajoutée", description: `${drink.name} ajouté à la commande` });
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
    toast({ title: "Article supprimé", description: "L'article a été retiré" });
  };

  const handleClearAll = () => {
    setOrders([]);
    toast({ title: "Commande vidée", description: "Toutes les commandes ont été supprimées" });
  };

  const handleConfirmOrderClick = () => orders.length && setShowConfirmModal(true);

  const finalizeOrder = () => {
    const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    const newOrder = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: orders.map(o => ({
        drinkName: o.drinkName,
        quantity: o.quantity,
        price: o.price
      })),
      total
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setOrders([]);
    setShowConfirmModal(false);
    toast({ title: "Commande confirmée", description: `Total: ${total.toFixed(2)}€` });
  };

  // === Gestion catégories ===
  const handleToggleCategory = id =>
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c));

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

  const handleSaveDrink = updated => {
    if (editDrinkModal.mode === 'add') {
      setCategories(prev => prev.map(c =>
        c.id === editDrinkModal.categoryId
          ? { ...c, drinks: [...c.drinks, { ...updated, id: generateDrinkId(updated.name, c.id) }] }
          : c
      ));
      toast({ title: "Boisson ajoutée", description: `${updated.name} ajouté au menu` });
    } else {
      setCategories(prev => prev.map(c => ({
        ...c,
        drinks: c.drinks.map(d => d.id === updated.id ? updated : d)
      })));
      toast({ title: "Boisson modifiée", description: `${updated.name} modifiée` });
    }
  };

  const handleAddDrinkToCategory = categoryId =>
    setEditDrinkModal({ isOpen: true, drink: { id: '', name: '', price: 0 }, categoryId, mode: 'add' });

  const handleEditCategory = (cat) => setEditCategoryModal({ isOpen: true, category: cat });
  const handleDeleteCategory = (cat) => setDeleteDialog({ isOpen: true, type: 'category', item: cat });

  const confirmDeleteCategory = () => {
    const cat = deleteDialog.item;
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setDeleteDialog({ isOpen: false, type: null, item: null });
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

  // === Rendu ===
  return (
    // IMPORTANT : UTILISER bg-background TEXT-FOREGROUND pour gérer les thèmes dynamiques
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header
  soundEnabled={soundEnabled}
  onToggleSound={() => setSoundEnabled(s => !s)}
  viewMode={viewMode}
  onChangeViewMode={setViewMode}
  onShowHistory={() => setShowHistory(true)}
/>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Menu des Boissons</h2>
              <div className="flex flex-wrap gap-3">
                <SortControls sortBy={sortBy} onSortChange={setSortBy} />
                <Button onClick={handleAddCategory} className="bg-purple-600 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Nouvelle catégorie
                </Button>
              </div>
            </div>
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

          <div className="lg:col-span-1 space-y-6 hidden lg:block">
            <OrderSummary
              orders={orders}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearAll={handleClearAll}
              onConfirmOrder={handleConfirmOrderClick}
            />
          </div>
        </div>

        <div className="lg:hidden">
          <OrderSummary
            orders={orders}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            onConfirmOrder={handleConfirmOrderClick}
          />
        </div>
      </div>

      <EditDrinkModal
        {...editDrinkModal}
        onClose={() => setEditDrinkModal({ isOpen: false, drink: null, categoryId: null, mode: 'edit' })}
        onSave={handleSaveDrink}
      />
      <EditCategoryModal
        {...editCategoryModal}
        onClose={() => setEditCategoryModal({ isOpen: false, category: null })}
        onSave={handleSaveCategory}
      />
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null })}
        onConfirm={deleteDialog.type === 'drink' ? confirmDeleteDrink : confirmDeleteCategory}
        title={deleteDialog.type === 'drink' ? "Supprimer la boisson" : "Supprimer la catégorie"}
        description={
          deleteDialog.type === 'drink'
            ? `Êtes-vous sûr de vouloir supprimer "${deleteDialog.item?.name}" ?`
            : `Supprimer "${deleteDialog.item?.name}" supprimera aussi ${deleteDialog.item?.drinks?.length || 0} boissons.`
        }
      />
      {showHistory && <OrderHistory orderHistory={orderHistory} isOpen={showHistory} onClose={() => setShowHistory(false)} />}
      {showConfirmModal && <ConfirmOrderModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} orders={orders} onConfirm={finalizeOrder} />}
      <Toaster />
    </div>
  );
};

// Routage avec landing page
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <InstallBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<DrinkOrderApp />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
