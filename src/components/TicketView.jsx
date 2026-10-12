import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { 
  X, 
  Check, 
  RotateCcw, 
  Receipt,
  Lock,
  Unlock
} from 'lucide-react';
import { formatPrice } from '../lib/format';
import ShareButtons from './ShareButtons';

/**
 * Vue Ticket (E-4) : Prise de commande au bar en mode compact et lisible.
 * - Groupement distinct par catégorie de boissons (démarcation claire pour le barman).
 * - Noms de boissons complets sans coupure.
 * - Mémorisation des cases cochées par commande.
 * - Fermeture explicite ramenant à l'écran d'origine (historique ou menu).
 */
const TicketView = ({
  order,
  categories = [],
  onClose,
  onReorder
}) => {
  // Clé de persistance des coches par commande
  const storageKey = useMemo(() => {
    return order?.id ? `gentbar_ticket_checked_${order.id}` : null;
  }, [order?.id]);

  // Initialisation des coches depuis le stockage ou ensemble vide
  const [checkedIds, setCheckedIds] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // En cas d'erreur de lecture localStorage, repli sur ensemble vide
      }
    }
    return new Set();
  });

  // Normalisation des articles
  const items = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order)) return order;
    if (Array.isArray(order.orders)) return order.orders;
    return [];
  }, [order]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    if (order && typeof order.total === 'number') return order.total;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [order, items]);

  // Nombre total de verres
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

  // État du verrouillage de l'écran (E-9) - non persisté, démarre déverrouillé
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  const lastTapRef = useRef(0);
  const hintTimeoutRef = useRef(null);
  const wakeLockSentinelRef = useRef(null);
  const videoWakeLockRef = useRef(null);

  // Maintien actif de l'écran allumé au bar (Wake Lock API + fallback vidéo NoSleep)
  const requestWakeLock = async () => {
    // 1. Tenter l'API standard Screen Wake Lock
    if ('wakeLock' in navigator && typeof navigator.wakeLock?.request === 'function') {
      try {
        if (!wakeLockSentinelRef.current || wakeLockSentinelRef.current.released) {
          wakeLockSentinelRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // En cas de rejet par le navigateur (ex. mode économie d'énergie), le fallback vidéo prend le relais
      }
    }
    // 2. Fallback universel : boucle vidéo muette (maintient l'écran allumé sur iOS et Android)
    if (videoWakeLockRef.current) {
      try {
        videoWakeLockRef.current.play().catch(() => {});
      } catch {}
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockSentinelRef.current) {
      wakeLockSentinelRef.current.release().catch(() => {});
      wakeLockSentinelRef.current = null;
    }
    if (videoWakeLockRef.current) {
      try {
        videoWakeLockRef.current.pause();
      } catch {}
    }
  };

  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // Blocage strict du défilement et du pull-to-refresh lorsque l'écran est verrouillé (E-9)
  useEffect(() => {
    if (!isLocked) return;

    const preventTouch = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // { passive: false } requis pour autoriser e.preventDefault() sur touchmove
    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventTouch, { passive: false });

    return () => {
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventTouch);
    };
  }, [isLocked]);

  // Bascule du verrouillage (geste utilisateur qui renouvelle le wake lock)
  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    if (nextLocked) {
      requestWakeLock();
    }
  };

  // Détection du double-tap n'importe où sur l'écran pour déverrouiller (E-9)
  const handleLockTap = (e) => {
    if (!isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    // Renouveler le wake lock sur tap utilisateur
    requestWakeLock();

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 400; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap validé -> déverrouillage immédiat
      setIsLocked(false);
      lastTapRef.current = 0;
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      setShowUnlockHint(false);
    } else {
      // Premier tap -> mémorisation et affichage du rappel visuel
      lastTapRef.current = now;
      setShowUnlockHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowUnlockHint(false);
      }, 1500);
    }
  };

  // Bascule coche d'une boisson et sauvegarde
  const toggleItem = (key) => {
    if (isLocked) return;
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {}
      }
      return next;
    });
  };

  // Cocher / Décocher tout et sauvegarde
  const handleToggleAll = () => {
    if (isLocked) return;
    if (checkedIds.size === items.length) {
      const emptySet = new Set();
      setCheckedIds(emptySet);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
    } else {
      const allKeys = items.map((item, idx) => item.drinkId || `${item.drinkName || item.name}-${idx}`);
      const fullSet = new Set(allKeys);
      setCheckedIds(fullSet);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...fullSet]));
        } catch {}
      }
    }
  };

  // Groupement par catégorie avec ordre du menu officiel (démarcation nette et compacte)
  const categoryGroups = useMemo(() => {
    const groups = [];
    const assignedIndices = new Set();

    categories.forEach(category => {
      const categoryDrinks = category.drinks || [];
      const matchingItems = [];

      items.forEach((item, index) => {
        const itemName = item.drinkName || item.name;
        const matches = categoryDrinks.some(
          d => d.id === item.drinkId || d.name.toLowerCase() === (itemName || '').toLowerCase()
        );

        if (matches && !assignedIndices.has(index)) {
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

    // Boissons personnalisées ou orphelines
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

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col bg-background text-foreground ${
        isLocked 
          ? 'overflow-hidden overscroll-none touch-none select-none' 
          : 'overflow-y-auto'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        touchAction: isLocked ? 'none' : 'auto',
        overscrollBehavior: isLocked ? 'none' : 'auto'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticket de commande"
    >
      {/* En-tête compact avec bouton de verrouillage (E-9) */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-sm px-3 sm:px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Titre */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-foreground">
              Ticket
            </h1>
          </div>

          {/* Compteur et boutons d'action rapide */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
              <span className={isComplete ? 'text-green-500 font-bold' : 'text-primary font-bold'}>
                {servedDrinksCount}/{totalDrinksCount}
              </span>
              {' '}servis
            </span>

            <Button
              variant="outline"
              size="sm"
              className="btn-outline text-xs h-7 px-2"
              onClick={handleToggleAll}
              disabled={isLocked}
              aria-label={checkedIds.size === items.length ? "Tout décocher" : "Tout cocher"}
            >
              {checkedIds.size === items.length ? "Décocher" : "Tout cocher"}
            </Button>

            {/* Bouton Cadenas (E-9 Verrouillage écran) */}
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                isLocked 
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 ring-1 ring-amber-500/50' 
                  : 'text-foreground hover:bg-accent'
              }`}
              onClick={handleToggleLock}
              aria-label={isLocked ? "Déverrouiller l'écran (ou double-tapez n'importe où)" : "Verrouiller l'écran"}
              title={isLocked ? "Déverrouiller l'écran" : "Verrouiller l'écran contre les appuis accidentels"}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Unlock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"
              onClick={onClose}
              disabled={isLocked}
              aria-label="Fermer le ticket"
            >
              <X className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Corps du ticket : groupement net par catégorie de boissons */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 sm:px-4 py-3 space-y-3 pb-24">
        {/* Emplacement note libre (E-7) */}
        {order?.note ? (
          <div className="p-2.5 mb-2 rounded-lg bg-accent/15 border border-accent/30 text-foreground text-xs sm:text-sm">
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
          <div className="space-y-2.5">
            {categoryGroups.map((group) => (
              <div 
                key={group.id} 
                className="bg-card border-2 border-border/80 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Liste des verres de cette catégorie avec démarcation nette entre blocs */}
                <ul className="divide-y divide-border/60 p-0 m-0 list-none">
                    {group.items.map(({ item, originalIndex }) => {
                      const key = item.drinkId || `${item.drinkName || item.name}-${originalIndex}`;
                      const isChecked = checkedIds.has(key);
                      const itemName = item.drinkName || item.name;

                      return (
                        <li
                          key={key}
                          onClick={() => toggleItem(key)}
                          className={`flex items-center justify-between gap-2.5 px-3 py-2 cursor-pointer select-none transition-colors ${
                            isChecked 
                              ? 'bg-muted/40 text-muted-foreground' 
                              : 'bg-card hover:bg-accent/10 text-foreground'
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
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Case à cocher carrée */}
                            <div 
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked 
                                  ? 'bg-green-600 border-green-600 text-white' 
                                  : 'border-muted-foreground/60 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {/* Quantité bien lisible */}
                            <span className={`text-lg font-bold min-w-[2rem] flex-shrink-0 ${isChecked ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                              {item.quantity}×
                            </span>

                            {/* Nom de la boisson EN ENTIER (sans coupure) */}
                            <span className={`text-base font-semibold leading-tight break-words ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {itemName}
                            </span>
                          </div>

                          {/* Prix */}
                          <span className={`text-sm font-semibold flex-shrink-0 whitespace-nowrap ml-2 ${isChecked ? 'line-through opacity-70' : 'text-foreground'}`}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Barre inférieure fixe (Total + Actions responsives sans chevauchement) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border shadow-lg px-3 sm:px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Total bien visible */}
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">TOTAL</span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Actions : Partager, Recommander, Fermer sans chevauchement */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <ShareButtons 
              order={order} 
              isCurrentOrder={false} 
              className="w-auto h-8 px-2.5 text-xs"
              size="sm"
            />

            {onReorder && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline flex items-center gap-1 text-xs h-8 px-2.5"
                onClick={() => onReorder(order)}
                disabled={isLocked}
                aria-label="Recommander cette commande"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommander</span>
              </Button>
            )}

            <Button
              size="sm"
              className="btn-primary font-semibold text-xs h-8 px-3"
              onClick={onClose}
              disabled={isLocked}
              aria-label="Fermer la vue ticket"
            >
              Fermer
            </Button>
          </div>
        </div>
      </footer>

      {/* Calque protecteur couvrant l'écran quand verrouillé (E-9) */}
      {isLocked && (
        <div 
          onClick={handleLockTap}
          className="fixed inset-0 z-35 bg-black/[0.06] dark:bg-black/25 cursor-pointer select-none transition-colors touch-none overscroll-none"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'none'
          }}
          role="button"
          tabIndex={0}
          aria-label="Écran verrouillé. Double-tapez n'importe où pour déverrouiller"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsLocked(false);
            }
          }}
        />
      )}

      {/* Badge flottant discret rappelant l'état verrouillé (E-9) */}
      {isLocked && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md border transition-all duration-200 ${
            showUnlockHint 
              ? 'bg-amber-600 text-white border-amber-500 scale-105 ring-2 ring-amber-400/50' 
              : 'bg-background/95 text-foreground border-border/80'
          }`}>
            <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{showUnlockHint ? "Double-tapez pour déverrouiller" : "Écran verrouillé"}</span>
          </div>
        </div>
      )}

      {/* Vidéo invisible en boucle pour maintenir l'écran allumé sur tous les mobiles (fallback WakeLock, E-9) */}
      <video
        ref={videoWakeLockRef}
        playsInline
        muted
        loop
        className="hidden pointer-events-none"
        aria-hidden="true"
        src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADFtb292AAAAbG12aGQAAAAA7Fv18Oxb9fAAA+gAAAAPAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
      />
    </div>
  );
};

export default TicketView;
