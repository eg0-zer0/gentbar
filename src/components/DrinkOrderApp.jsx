import React, { useState, useMemo, useEffect } from 'react';
import { useViewMode } from '../contexts/ViewModeContext';
import { toast } from 'sonner';

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
import TicketView from './TicketView';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

// Icons etc.
import { Plus, CheckCircle2, Receipt, RotateCcw } from 'lucide-react';

// Data & utils
import { mockCategories, mockOrderHistory, MENU_VERSION } from '../mock';
import { generateDrinkId } from '../utils/id';
import { load, save, removeTicketCheckmarks, purgeOrphanTicketCheckmarks, loadRaw, saveRaw, normalizeCategories, normalizeOrders, normalizeOrderHistory, normalizeBoolean, normalizeOneOf, requestPersistentStorage } from '../lib/storage';
import { reorderIntoCart } from '../lib/reorder';
import { formatPrice } from '../lib/format';
import '../App.css';

const normalizeSortBy = normalizeOneOf(['name', 'popularity', 'price-asc', 'price-desc']);

// Message à afficher une fois après un remplacement de carte ayant retiré des lignes du panier.
let menuMigrationNotice = null;

/**
 * Remplace la carte stockée quand MENU_VERSION change (8 bis) :
 *  1. l'ancienne carte est copiée telle quelle dans `categories__backup` (jamais perdue) ;
 *  2. la nouvelle carte est installée, puis le marqueur de version est écrit en dernier
 *     (une interruption en cours de route relance simplement la migration) ;
 *  3. les lignes du panier dont le drinkId n'existe plus dans la nouvelle carte sont retirées.
 * Idempotent : sans changement de version, ne fait rien.
 */
const migrateMenuIfNeeded = () => {
  if (loadRaw('menuVersion') === MENU_VERSION) return;

  const previousRaw = loadRaw('categories');
  if (previousRaw !== null) saveRaw('categories__backup', previousRaw);

  save('categories', mockCategories);

  const validIds = new Set(mockCategories.flatMap((c) => c.drinks.map((d) => d.id)));
  const currentOrders = load('orders', [], normalizeOrders);
  const keptOrders = currentOrders.filter((o) => validIds.has(o.drinkId));
  const removedCount = currentOrders.length - keptOrders.length;
  if (removedCount > 0) {
    save('orders', keptOrders);
    menuMigrationNotice = `${removedCount} article${removedCount > 1 ? 's' : ''} retiré${removedCount > 1 ? 's' : ''} du panier : absent${removedCount > 1 ? 's' : ''} de la nouvelle carte.`;
  }

  saveRaw('menuVersion', MENU_VERSION);
};

const DrinkOrderApp = () => {

  const { viewMode, setViewMode } = useViewMode();

  const [categories, setCategories] = useState(() => {
    migrateMenuIfNeeded();
    return load('categories', mockCategories, normalizeCategories);
  });
  const [orders, setOrders] = useState(() => load('orders', [], normalizeOrders));
  const [orderHistory, setOrderHistory] = useState(() => load('orderHistory', mockOrderHistory, normalizeOrderHistory));
  const [sortBy, setSortBy] = useState(() => load('sortBy', 'name', normalizeSortBy));
  const [soundEnabled, setSoundEnabled] = useState(() => load('soundEnabled', false, normalizeBoolean));
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ticketViewData, setTicketViewData] = useState(null);
  const [orderSuccessModal, setOrderSuccessModal] = useState({ isOpen: false, order: null });

  const [editDrinkModal, setEditDrinkModal] = useState({
    isOpen: false,
    drink: null,
    categoryId: null,
    mode: 'edit'
  });
  const [editCategoryModal, setEditCategoryModal] = useState({ isOpen: false, category: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: null, item: null, categoryId: null });

  useEffect(() => { save('categories', categories); }, [categories]);
  useEffect(() => { save('orders', orders); }, [orders]);
  useEffect(() => { save('orderHistory', orderHistory); }, [orderHistory]);
  useEffect(() => { save('soundEnabled', soundEnabled); }, [soundEnabled]);
  useEffect(() => { save('sortBy', sortBy); }, [sortBy]);
  useEffect(() => {
    requestPersistentStorage();
    purgeOrphanTicketCheckmarks(orderHistory);
  }, []);
  // viewMode : déjà persisté (et validé) par ViewModeContext.

  // Remplacement de carte : prévenir si des articles ont été retirés du panier (une seule fois).
  useEffect(() => {
    if (menuMigrationNotice) {
      toast(menuMigrationNotice);
      menuMigrationNotice = null;
    }
  }, []);

  // Popularité des boissons (comptée par drinkId, avec repli sur le nom pour l'historique antérieur)
  const drinkPopularity = useMemo(() => {
    const nameToId = new Map();
    categories.forEach(c => {
      c.drinks.forEach(d => {
        if (!nameToId.has(d.name)) {
          nameToId.set(d.name, d.id);
        }
      });
    });

    const byId = {};
    orderHistory.forEach(order => {
      order.items.forEach(item => {
        const id = item.drinkId || nameToId.get(item.drinkName);
        if (id) {
          byId[id] = (byId[id] || 0) + item.quantity;
        }
      });
    });
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

  // ---- GESTION PANIER ----

  const handleAddDrink = (drink) => {
    setOrders(prevOrders => {
      const idx = prevOrders.findIndex(order => order.drinkId === drink.id);
      if (idx >= 0) {
        const updated = [...prevOrders];
        updated[idx] = {
          ...updated[idx],
          drinkName: drink.name,
          price: drink.price,
          quantity: updated[idx].quantity + 1
        };
        return updated;
      }
      return [
        ...prevOrders,
        { drinkId: drink.id, drinkName: drink.name, price: drink.price, quantity: 1, addedAt: new Date().toISOString() }
      ];
    });
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
    toast("Article supprimé", { description: "L'article a été retiré du panier" });
  };

  const handleClearAll = () => {
    setOrders([]);
    toast("Panier vidé", { description: "Toutes les boissons ont été retirées du panier." });
  };

  const handleConfirmOrderClick = () => {
    if (orders.length) setShowConfirmModal(true);
  };

  // ---- FINALISER LA COMMANDE ----

  const finalizeOrder = (note = '') => {
    const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    const trimmedNote = typeof note === 'string' ? note.trim() : '';
    const newOrder = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: orders.map(o => ({
        drinkId: o.drinkId,
        drinkName: o.drinkName,
        quantity: o.quantity,
        price: o.price
      })),
      total,
      note: trimmedNote
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setOrders([]);
    setShowConfirmModal(false);
    toast("Commande confirmée", { description: `Total : ${formatPrice(total)}` });
    setOrderSuccessModal({ isOpen: true, order: newOrder });
  };

  // ---- GESTION VUE TICKET (E-4) ----

  const handleOpenTicket = (orderToView, returnTo = 'menu') => {
    if (returnTo === 'history') {
      setShowHistory(false);
    }
    setTicketViewData({ order: orderToView, returnTo });
  };

  const handleCloseTicket = () => {
    const returnTo = ticketViewData?.returnTo;
    setTicketViewData(null);
    if (returnTo === 'history') {
      setShowHistory(true);
    }
  };

  const handleReorder = (orderToReorder) => {
    if (!orderToReorder) return;
    reorderIntoCart({
      order: orderToReorder,
      currentOrders: orders,
      categories,
      onOrdersUpdated: setOrders
    });
    setTicketViewData(null);
    setShowHistory(false);
    setOrderSuccessModal({ isOpen: false, order: null });
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
    setOrders(prev => prev.filter(o => o.drinkId !== item.id));
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
    toast("Boisson supprimée", { description: `${item.name} a été retirée du menu` });
  };

  const handleSaveDrink = (updated) => {
    if (editDrinkModal.mode === 'add') {
      setCategories(prev => prev.map(c =>
        c.id === editDrinkModal.categoryId
          ? { ...c, drinks: [...c.drinks, { ...updated, id: generateDrinkId(updated.name, c.id) }] }
          : c
      ));
      toast("Boisson ajoutée", { description: `${updated.name} ajoutée au menu` });
    } else {
      setCategories(prev => prev.map(c => ({
        ...c,
        drinks: c.drinks.map(d => d.id === updated.id ? updated : d)
      })));
      setOrders(prev => prev.map(o =>
        o.drinkId === updated.id
          ? { ...o, drinkName: updated.name, price: updated.price }
          : o
      ));
      toast("Boisson modifiée", { description: `${updated.name} modifiée` });
    }
  };

  const handleAddDrinkToCategory = (categoryId) => {
    setEditDrinkModal({ isOpen: true, drink: { id: '', name: '', price: '' }, categoryId, mode: 'add' });
  };

  const handleEditCategory = (cat) => setEditCategoryModal({ isOpen: true, category: cat });

  const handleDeleteCategory = (cat) => {
    setDeleteDialog({ isOpen: true, type: 'category', item: cat });
  };
  
  const handleRemoveOrder = (orderId) => {
    removeTicketCheckmarks(orderId);
    setOrderHistory(prev => prev.filter(order => order.id !== orderId));
  };

  const confirmDeleteCategory = () => {
    const cat = deleteDialog.item;
    const catDrinkIds = new Set(cat?.drinks?.map(d => d.id) || []);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setOrders(prev => prev.filter(o => !catDrinkIds.has(o.drinkId)));
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
    toast("Catégorie supprimée", { description: `${cat.name} supprimée` });
  };

  const handleSaveCategory = (cat) => {
    const exists = categories.some(c => c.id === cat.id);
    if (exists) {
      setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
      toast("Catégorie modifiée", { description: `${cat.name} mise à jour` });
    } else {
      setCategories(prev => [...prev, { ...cat, id: `cat-${Date.now()}`, drinks: [], isCollapsed: false }]);
      toast("Catégorie ajoutée", { description: `${cat.name} créée` });
    }
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
            {categories.map(c => (
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
              isTicketOpen={Boolean(ticketViewData)}
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
          onOpenTicket={(order) => handleOpenTicket(order, 'history')}
          onReorder={handleReorder}
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

        {/* Écran de succès post-confirmation (E-4) */}
        <Dialog 
          open={orderSuccessModal.isOpen} 
          onOpenChange={(open) => {
            if (!open) setOrderSuccessModal({ isOpen: false, order: null });
          }}
        >
          <DialogContent className="max-w-sm mx-auto rounded-lg p-6 bg-card text-foreground border border-border shadow-xl text-center">
            <DialogHeader className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Commande confirmée !
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Votre commande de {orderSuccessModal.order?.items?.reduce((s, i) => s + i.quantity, 0) || 0} article(s) pour un total de {formatPrice(orderSuccessModal.order?.total || 0)} a bien été enregistrée.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 font-semibold"
                onClick={() => {
                  const confirmedOrder = orderSuccessModal.order;
                  setOrderSuccessModal({ isOpen: false, order: null });
                  handleOpenTicket(confirmedOrder, 'menu');
                }}
              >
                <Receipt className="w-4 h-4" />
                Voir le ticket
              </Button>
              <Button
                variant="outline"
                className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                onClick={() => {
                  handleReorder(orderSuccessModal.order);
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Recommander cette tournée
              </Button>
              <Button
                variant="ghost"
                className="w-full py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setOrderSuccessModal({ isOpen: false, order: null })}
              >
                Retour au menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Vue Ticket plein écran (E-4) */}
        {ticketViewData && (
          <TicketView
            order={ticketViewData.order}
            categories={categories}
            onClose={handleCloseTicket}
            onReorder={ticketViewData.order.isCurrentOrder ? null : handleReorder}
          />
        )}
      </div>
    </div>
  );
};

export default DrinkOrderApp;
