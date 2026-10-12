import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, 
  Check, 
  RotateCcw, 
  Receipt, 
  Share2, 
  CheckCircle2, 
  Circle,
  Calendar
} from 'lucide-react';
import { formatPrice } from '../lib/format';
import ShareButtons from './ShareButtons';

/**
 * Vue Ticket (E-4) : Prise de commande au bar.
 * Reçoit `order` (panier en cours, commande confirmée ou commande d'historique).
 * Gros caractères, groupé par catégorie dans l'ordre du menu, cases « pris » locales,
 * total fixe, emplacement note libre E-7, fermeture explicite avec retour à l'écran d'origine.
 */
const TicketView = ({
  order,
  categories = [],
  onClose,
  onReorder
}) => {
  // L'état des cases « pris » est purement local (non persisté, E-4)
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  // Normalisation des articles de la commande
  const items = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order)) return order;
    if (Array.isArray(order.orders)) return order.orders;
    return [];
  }, [order]);

  // Calcul du total
  const totalAmount = useMemo(() => {
    if (order && typeof order.total === 'number') return order.total;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [order, items]);

  // Nombre total de verres / articles
  const totalDrinksCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  // Nombre de verres servis
  const servedDrinksCount = useMemo(() => {
    return items.reduce((sum, item, idx) => {
      const key = item.drinkId || `${item.drinkName || item.name}-${idx}`;
      return checkedIds.has(key) ? sum + (item.quantity || 1) : sum;
    }, 0);
  }, [items, checkedIds]);

  // Bascule l'état d'un article
  const toggleItem = (key) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Cocher / Décocher tout
  const handleToggleAll = () => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set());
    } else {
      const allKeys = items.map((item, idx) => item.drinkId || `${item.drinkName || item.name}-${idx}`);
      setCheckedIds(new Set(allKeys));
    }
  };

  // Groupement des articles par catégorie dans l'ordre officiel du menu (E-4)
  const groupedCategories = useMemo(() => {
    const groups = [];
    const assignedIndices = new Set();

    categories.forEach(category => {
      const categoryDrinks = category.drinks || [];
      const matchingItems = [];

      items.forEach((item, index) => {
        const itemName = item.drinkName || item.name;
        const matchesCategory = categoryDrinks.some(
          d => d.id === item.drinkId || d.name.toLowerCase() === (itemName || '').toLowerCase()
        );

        if (matchesCategory) {
          matchingItems.push({ item, originalIndex: index });
          assignedIndices.add(index);
        }
      });

      if (matchingItems.length > 0) {
        groups.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          items: matchingItems
        });
      }
    });

    // Éléments non catégorisés (ou catégorie supprimée)
    const orphanItems = items
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(({ originalIndex }) => !assignedIndices.has(originalIndex));

    if (orphanItems.length > 0) {
      groups.push({
        id: 'other',
        name: 'Autres boissons',
        icon: '🍹',
        items: orphanItems
      });
    }

    return groups;
  }, [categories, items]);

  const isComplete = totalDrinksCount > 0 && servedDrinksCount === totalDrinksCount;
  const isCurrentOrder = Boolean(order?.isCurrentOrder);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticket de commande"
    >
      {/* En-tête fixe */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate text-foreground">
                Ticket de commande
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {order?.date ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.date)}
                  </span>
                ) : isCurrentOrder ? (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    Panier en cours
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="btn-outline text-xs px-2.5 py-1"
              onClick={handleToggleAll}
              aria-label={checkedIds.size === items.length ? "Tout décocher" : "Tout cocher"}
            >
              {checkedIds.size === items.length ? "Tout décocher" : "Tout cocher"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-9 w-9 rounded-full hover:bg-accent"
              onClick={onClose}
              aria-label="Fermer le ticket"
            >
              <X className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>

        {/* Barre de progression & compteur de service */}
        <div className="max-w-2xl mx-auto mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span>Servis :</span>
            <span className={`font-bold ${isComplete ? 'text-green-500' : 'text-primary'}`}>
              {servedDrinksCount} sur {totalDrinksCount}
            </span>
            {isComplete && (
              <Badge className="bg-green-600 text-white text-xs">
                Terminé ✓
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {checkedIds.size} ligne{checkedIds.size > 1 ? 's' : ''} cochée{checkedIds.size > 1 ? 's' : ''}
          </div>
        </div>
      </header>

      {/* Contenu principal du ticket */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-6 pb-28">
        {/* Emplacement note libre (E-7) - vide par défaut mais prêt */}
        {order?.note ? (
          <div className="p-3 rounded-lg bg-accent/15 border border-accent/30 text-foreground text-sm">
            <span className="font-semibold text-accent">Note : </span>
            <span>{order.note}</span>
          </div>
        ) : (
          <div id="ticket-note-container" className="hidden" aria-hidden="true" />
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun article dans cette commande.
          </div>
        ) : (
          groupedCategories.map((group) => (
            <section 
              key={group.id} 
              className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3"
              aria-label={group.name}
            >
              {/* En-tête de catégorie */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/70 font-semibold text-base text-foreground">
                <span className="text-xl" role="img" aria-hidden="true">{group.icon}</span>
                <span>{group.name}</span>
              </div>

              {/* Liste des articles en gros caractères pour le bar */}
              <ul className="space-y-2.5 m-0 p-0 list-none">
                {group.items.map(({ item, originalIndex }) => {
                  const key = item.drinkId || `${item.drinkName || item.name}-${originalIndex}`;
                  const isChecked = checkedIds.has(key);
                  const itemName = item.drinkName || item.name;

                  return (
                    <li
                      key={key}
                      onClick={() => toggleItem(key)}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer select-none transition-colors border ${
                        isChecked 
                          ? 'bg-muted/40 border-border/50 text-muted-foreground' 
                          : 'bg-background hover:bg-accent/10 border-border text-foreground'
                      }`}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleItem(key);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Case à cocher visuelle */}
                        <div 
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isChecked 
                              ? 'bg-green-600 border-green-600 text-white' 
                              : 'border-muted-foreground/60 bg-transparent'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        {/* Quantité en gros caractères */}
                        <span className={`text-xl font-bold min-w-[2.2rem] ${isChecked ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                          {item.quantity}×
                        </span>

                        {/* Nom de la boisson en gros caractères */}
                        <span className={`text-lg font-semibold truncate ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {itemName}
                        </span>
                      </div>

                      {/* Montant de la ligne */}
                      <span className={`text-sm font-medium flex-shrink-0 ${isChecked ? 'line-through opacity-70' : 'text-foreground'}`}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>

      {/* Barre inférieure fixe (Total + Actions) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
            <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Total :</span>
            <span className="text-2xl font-extrabold text-foreground">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            {/* Partage */}
            <ShareButtons 
              order={isCurrentOrder ? { items, total: totalAmount } : order} 
              isCurrentOrder={isCurrentOrder} 
            />

            {/* Bouton Recommander (si disponible pour commande passée ou confirmée) */}
            {onReorder && (
              <Button
                variant="outline"
                className="btn-outline flex items-center gap-1.5"
                onClick={() => onReorder(order)}
                aria-label="Recommander cette commande"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recommander</span>
              </Button>
            )}

            {/* Bouton explicite Fermer */}
            <Button
              className="btn-primary px-4 font-semibold"
              onClick={onClose}
              aria-label="Fermer la vue ticket"
            >
              Fermer
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TicketView;
