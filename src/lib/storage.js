// Accès sûr au localStorage (A-08).
// - Aucune exception ne remonte : lecture invalide => valeur de repli.
// - Une valeur stockée illisible ou invalide est copiée dans `<clé>__backup`
//   avant d'être remplacée, pour ne jamais perdre définitivement des données.
// - Stockage plein (QuotaExceededError) : message à l'utilisateur (une seule fois).
import { toast } from 'sonner';

let quotaWarningShown = false;

const isQuotaError = (e) =>
  e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);

const backupRaw = (key, raw) => {
  try {
    localStorage.setItem(`${key}__backup`, raw);
  } catch {
    // Sauvegarde de secours impossible : on n'insiste pas.
  }
};

/** Lit une chaîne brute (sans JSON). */
export function loadRaw(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

/** Écrit une chaîne brute (sans JSON). Renvoie true si l'écriture a réussi. */
export function saveRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    handleWriteError(e);
    return false;
  }
}

/**
 * Lit une valeur JSON.
 * @param {string} key
 * @param {*} fallback valeur renvoyée si absente, illisible ou inutilisable
 * @param {(value:any)=>({value:any, dropped:number}|null)} [normalize]
 *        renvoie la valeur nettoyée (et le nombre d'éléments écartés), ou null si inutilisable
 */
export function load(key, fallback, normalize) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[storage] JSON illisible pour « ${key} », valeur par défaut utilisée.`);
    backupRaw(key, raw);
    return fallback;
  }
  if (parsed === null || parsed === undefined) return fallback;
  if (!normalize) return parsed;

  const result = normalize(parsed);
  if (!result) {
    console.warn(`[storage] Donnée invalide pour « ${key} », valeur par défaut utilisée.`);
    backupRaw(key, raw);
    return fallback;
  }
  if (result.dropped > 0) {
    console.warn(`[storage] ${result.dropped} élément(s) invalide(s) écarté(s) dans « ${key} ».`);
    backupRaw(key, raw);
  }
  return result.value;
}

/** Écrit une valeur JSON. Renvoie true si l'écriture a réussi. */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    handleWriteError(e);
    return false;
  }
}

/** Supprime une liste de clés (utilisé par la réinitialisation des données). */
export function removeKeys(keys) {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignoré
    }
  });
}

function handleWriteError(e) {
  if (isQuotaError(e)) {
    if (!quotaWarningShown) {
      quotaWarningShown = true;
      toast.error('Mémoire du téléphone pleine', {
        description: "Les dernières modifications n'ont pas pu être enregistrées. Supprimez d'anciennes commandes de l'historique.",
      });
    }
  } else {
    console.warn('[storage] Écriture impossible :', e);
  }
}

// ---- Normaliseurs ----
// Chacun renvoie { value, dropped } ou null si la donnée est inutilisable.

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const isStr = (s) => typeof s === 'string';

const isDrink = (d) => d && isStr(d.id) && isStr(d.name) && isNum(d.price);
const isOrderLine = (o) => o && isStr(o.drinkId) && isStr(o.drinkName) && isNum(o.price) && isNum(o.quantity) && o.quantity > 0;
const isHistoryItem = (i) => i && isStr(i.drinkName) && isNum(i.quantity) && isNum(i.price);
const isHistoryOrder = (o) => o && isStr(o.id) && isNum(o.total) && Array.isArray(o.items) && o.items.every(isHistoryItem);

const filterList = (v, isValid) => {
  if (!Array.isArray(v)) return null;
  const value = v.filter(isValid);
  return { value, dropped: v.length - value.length };
};

export const normalizeCategories = (v) => {
  if (!Array.isArray(v)) return null;
  let dropped = 0;
  const value = v
    .filter((c) => {
      const ok = c && isStr(c.id) && isStr(c.name) && Array.isArray(c.drinks);
      if (!ok) dropped += 1;
      return ok;
    })
    .map((c) => {
      const drinks = c.drinks.filter(isDrink);
      dropped += c.drinks.length - drinks.length;
      return drinks.length === c.drinks.length ? c : { ...c, drinks };
    });
  // Un menu qui contenait des catégories mais dont plus rien n'est lisible est inutilisable.
  if (v.length > 0 && value.length === 0) return null;
  return { value, dropped };
};

export const normalizeOrders = (v) => filterList(v, isOrderLine);

export const normalizeOrderHistory = (v) => filterList(v, isHistoryOrder);

export const normalizeBoolean = (v) => (typeof v === 'boolean' ? { value: v, dropped: 0 } : null);

export const normalizeOneOf = (allowed) => (v) => (allowed.includes(v) ? { value: v, dropped: 0 } : null);

// Clés de données de l'application (réinitialisation).
export const APP_DATA_KEYS = ['categories', 'orders', 'orderHistory', 'menuVersion', 'sortBy', 'soundEnabled'];
