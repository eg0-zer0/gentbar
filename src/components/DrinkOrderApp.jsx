import React, { useState, useEffect } from 'react';
import { useViewMode } from '../contexts/ViewModeContext';

// UI components
import Header from './Header';
import BarSelector from './BarSelector';
import CategorySection from './CategorySection';
import OrderSummary from './OrderSummary';
import OrderHistory from './OrderHistory';
import ConfirmOrderModal from './ConfirmOrderModal';
import EditDrinkModal from './EditDrinkModal';
import EditCategoryModal from './EditCategoryModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import SortControls from './SortControls';
import TicketView from './TicketView';
import DrinkCard from './DrinkCard';
import MenuSearch from './MenuSearch';
import BulkAddDrinksModal from './BulkAddDrinksModal';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

// Icons
import { CheckCircle2, Receipt, RotateCcw, FolderPlus, ClipboardList } from 'lucide-react';

// Custom Hooks
import { useStoredState } from '../hooks/useStoredState';
import { useCart } from '../hooks/useCart';
import { useMenus } from '../hooks/useMenus';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { useDrinkFilter } from '../hooks/useDrinkFilter';

// Data & utils
import { normalizeBoolean, requestPersistentStorage } from '../lib/storage';
import { reorderIntoCart } from '../lib/reorder';
import { formatPrice } from '../lib/format';
import '../App.css';

const DrinkOrderApp = () => {
  const { viewMode, setViewMode } = useViewMode();

  const searchGridColsClass =
    viewMode === 'minimal'
      ? 'grid grid-cols-4 gap-1.5 sm:gap-2'
      : viewMode === 'compact'
      ? 'grid grid-cols-3 gap-2 sm:gap-3'
      : 'grid grid-cols-2 gap-2.5 sm:gap-4';

  // 1. Gestion des menus et catégories (multi-bars)
  const {
    menus,
    activeMenuId,
    activeMenu,
    selectBar,
    addEmptyBar,
    duplicateExistingBar,
    categories,
    toggleCategory,
    saveCategory,
    deleteCategory,
    saveDrink,
    deleteDrink,
    addDrinksToCategory,
    createBarFromCategories,
    addCategoriesToActiveBar
  } = useMenus();

  // 2. Gestion du panier et de la note libre
  const {
    orders,
    setOrders,
    orderNote,
    setOrderNote,
    totalAmount,
    totalItems,
    addDrink,
    updateQuantity,
    removeItem,
    removeDrinkFromCart,
    clearCart,
    removeItemsByDrinkIds,
    updateItemDetails
  } = useCart(activeMenuId);

  // 3. Gestion de l'historique et popularité des boissons
  const {
    orderHistory,
    drinkPopularity,
    createOrder,
    removeOrder
  } = useOrderHistory(categories);

  // 4. Filtrage, tri et recherche multi-catégories (E-3, E-5)
  const {
    sortBy,
    setSortBy,
    sortDrinks,
    searchQuery,
    setSearchQuery,
    searchResults
  } = useDrinkFilter(categories, drinkPopularity);

  // 5. Préférences locales
  const [soundEnabled, setSoundEnabled] = useStoredState('soundEnabled', false, normalizeBoolean);

  // 6. États des fenêtres modales & dialogues
  const [showBarSelector, setShowBarSelector] = useState(false);
  const [showBulkAddInActiveBar, setShowBulkAddInActiveBar] = useState(false);
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

  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // ---- AJOUT D'UNE BOISSON AVEC MÉTADONNÉES DU BAR ----
  const handleAddDrink = (drink) => {
    addDrink(drink, activeMenuId, { name: activeMenu?.name, icon: activeMenu?.icon });
  };

  // ---- FINALISER LA COMMANDE ----
  const finalizeOrder = () => {
    const newOrder = createOrder({
      items: orders,
      total: totalAmount,
      note: orderNote,
      barId: activeMenuId,
      menus
    });
    clearCart(false);
    setShowConfirmModal(false);
    setOrderSuccessModal({ isOpen: true, order: newOrder });
  };

  const handleConfirmOrderClick = () => {
    if (orders.length) setShowConfirmModal(true);
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

  // ---- RECOMMANDER UNE TOURNÉE (E-8) ----
  const handleReorder = (orderToReorder) => {
    if (!orderToReorder) return;
    reorderIntoCart({
      order: orderToReorder,
      currentOrders: orders,
      categories,
      menus,
      onOrdersUpdated: setOrders,
      currentNote: orderNote,
      onNoteUpdated: setOrderNote
    });
    setTicketViewData(null);
    setShowHistory(false);
    setOrderSuccessModal({ isOpen: false, order: null });
  };

  // ---- HANDLERS BOISSONS ET CATÉGORIES ----
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
    deleteDrink(item, categoryId, removeDrinkFromCart);
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
  };

  const handleSaveDrink = (updated) => {
    saveDrink(updated, editDrinkModal.mode, editDrinkModal.categoryId, updateItemDetails);
  };

  const handleAddDrinkToCategory = (categoryId) => {
    setEditDrinkModal({ isOpen: true, drink: { id: '', name: '', price: '' }, categoryId, mode: 'add' });
  };

  const handleEditCategory = (cat) => setEditCategoryModal({ isOpen: true, category: cat });

  const handleDeleteCategory = (cat) => {
    setDeleteDialog({ isOpen: true, type: 'category', item: cat });
  };

  const confirmDeleteCategory = () => {
    const cat = deleteDialog.item;
    deleteCategory(cat, removeItemsByDrinkIds);
    setDeleteDialog({ isOpen: false, type: null, item: null, categoryId: null });
  };

  const handleSaveCategory = (cat) => {
    saveCategory(cat);
  };

  const handleAddCategory = () => setEditCategoryModal({ isOpen: true, category: { name: '', icon: '' } });

  // === RENDER ===
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      {/* HEADER FIXE / STICKY GLOBAL : Choix de la carte, Burger menu, Recherche et Tri */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/40 shadow-xs">
        <div className="container mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-2.5 max-w-7xl">
          <Header
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(s => !s)}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onShowHistory={() => setShowHistory(true)}
            activeBarName={activeMenu?.name || 'Club de hockey'}
            activeBarIcon={activeMenu?.icon || '🏒'}
            barsCount={Array.isArray(menus) ? menus.length : 1}
            onOpenBarSelector={() => setShowBarSelector(true)}
          />

          <div className="flex items-center gap-2 mt-2 sm:mt-2.5">
            <MenuSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              className="flex-1"
            />
            <SortControls sortBy={sortBy} setSortBy={setSortBy} />
          </div>
        </div>
      </header>

      <div className={`container mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-8 max-w-7xl content-container ${!showConfirmModal ? 'pb-20' : ''}`}>
        <BarSelector
          isOpen={showBarSelector}
          onClose={() => setShowBarSelector(false)}
          menus={menus}
          activeMenuId={activeMenuId}
          onSelectBar={(barId) => {
            setSearchQuery('');
            selectBar(barId);
          }}
          onCreateEmptyBar={(params) => {
            setSearchQuery('');
            addEmptyBar({ ...params, activate: true });
          }}
          onDuplicateBar={(srcId, params) => {
            setSearchQuery('');
            duplicateExistingBar(srcId, { ...params, activate: true });
          }}
          onCreateFromCategories={(params) => {
            setSearchQuery('');
            createBarFromCategories(params);
          }}
          cartItemsCount={totalItems}
          onClearCart={clearCart}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {searchResults !== null ? (
              <section aria-label="Résultats de recherche" className="mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-base font-semibold text-foreground">
                    {searchResults.length === 0
                      ? 'Aucun résultat'
                      : `${searchResults.length} boisson${searchResults.length > 1 ? 's' : ''} trouvée${searchResults.length > 1 ? 's' : ''}`}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    Effacer la recherche
                  </Button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-8 text-center rounded-lg border border-border bg-card/50 text-muted-foreground">
                    <p className="text-sm">Aucune boisson ne correspond à « <span className="font-medium text-foreground">{searchQuery}</span> ».</p>
                  </div>
                ) : (
                  <div className={`category-grid ${searchGridColsClass}`} aria-label="Boissons trouvées">
                    {searchResults.map((drink) => (
                      <DrinkCard
                        key={drink.id}
                        drink={drink}
                        onAdd={addDrink}
                        onEdit={handleEditDrink}
                        onDelete={handleDeleteDrink}
                        popularityScore={drinkPopularity[drink.id] ?? 0}
                        quantityInOrder={orders.find(o => o.drinkId === drink.id)?.quantity || 0}
                        soundEnabled={soundEnabled}
                        categoryName={drink.categoryName}
                        categoryIcon={drink.categoryIcon}
                        className="drink-card"
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-dashed border-border bg-card/60 text-foreground space-y-3">
                <div className="text-3xl select-none">{activeMenu?.icon || '🍺'}</div>
                <h2 className="text-base font-semibold">
                  La carte « {activeMenu?.name} » est vide
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Ajoutez une première catégorie (ex. Bières, Cocktails, Softs) pour commencer à enregistrer vos boissons.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2"
                    onClick={handleAddCategory}
                  >
                    <FolderPlus className="w-4 h-4" />
                    Ajouter une catégorie
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="inline-flex items-center gap-2"
                    onClick={() => setShowBulkAddInActiveBar(true)}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Coller une liste
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {categories.map(c => (
                  <CategorySection
                    key={c.id}
                    category={c}
                    onAddDrink={handleAddDrink}
                    onEditDrink={handleEditDrink}
                    onToggleCategory={toggleCategory}
                    onEditCategory={handleEditCategory}
                    onAddDrinkToCategory={handleAddDrinkToCategory}
                    onAddDrinksToCategory={addDrinksToCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onDeleteDrink={handleDeleteDrink}
                    sortedDrinks={sortDrinks(c.drinks, sortBy)}
                    drinkPopularity={drinkPopularity}
                    orders={orders}
                    soundEnabled={soundEnabled}
                    viewMode={viewMode}
                  />
                ))}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCategory}
                    className="flex-1 py-3 border-dashed text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Ajouter une catégorie</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBulkAddInActiveBar(true)}
                    className="py-3 px-4 border-dashed text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                    title="Ajouter plusieurs catégories et boissons par texte collé"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Ajout en lot</span>
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="lg:col-span-1 space-y-6">
            <OrderSummary
              orders={orders}
              menus={menus}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearAll={clearCart}
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
          menus={menus}
          onRemoveOrder={removeOrder}
          onOpenTicket={(order) => handleOpenTicket(order, 'history')}
          onReorder={handleReorder}
        />

        <ConfirmOrderModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          orders={orders}
          menus={menus}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearAll={clearCart}
          onConfirm={finalizeOrder}
          note={orderNote}
          onNoteChange={setOrderNote}
        />

        <EditDrinkModal
          {...editDrinkModal}
          categories={categories}
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

        {/* Modale d'ajout en lot pour le bar actif (E-11) */}
        <BulkAddDrinksModal
          isOpen={showBulkAddInActiveBar}
          onClose={() => setShowBulkAddInActiveBar(false)}
          allowCategories={true}
          targetCategoryName={activeMenu?.name}
          currentCategoriesCount={categories.length}
          currentDrinksCount={categories.reduce((acc, c) => acc + (Array.isArray(c.drinks) ? c.drinks.length : 0), 0)}
          onConfirm={({ categories: parsedCats }) => {
            addCategoriesToActiveBar(parsedCats);
            setShowBulkAddInActiveBar(false);
          }}
        />
        {/* Vue Ticket plein écran (E-4) */}
        {ticketViewData && (
          <TicketView
            order={ticketViewData.order}
            categories={categories}
            menus={menus}
            onClose={handleCloseTicket}
            onReorder={ticketViewData.order?.isCurrentOrder ? null : handleReorder}
          />
        )}
      </div>
    </div>
  );
};

export default DrinkOrderApp;
