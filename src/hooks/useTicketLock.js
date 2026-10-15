import { useState, useRef, useEffect } from 'react';

/**
 * Hook de verrouillage de l'écran (E-9) pour la Vue Ticket.
 * - Non persisté (démarre déverrouillé).
 * - Bloque le défilement et les interactions en poche / déplacement.
 * - Déverrouillage sécurisé par double-tap n'importe où.
 */
export const useTicketLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  const lastTapRef = useRef(0);
  const hintTimeoutRef = useRef(null);

  // Nettoyage du timeout d'indication au démontage
  useEffect(() => {
    return () => {
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

  // Bascule du verrouillage de l'écran
  const toggleLock = () => {
    setIsLocked(prev => !prev);
  };

  // Détection du double-tap n'importe où sur l'écran pour déverrouiller
  const handleLockTap = (e) => {
    if (!isLocked) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

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

  return {
    isLocked,
    setIsLocked,
    showUnlockHint,
    toggleLock,
    handleLockTap
  };
};

export default useTicketLock;
