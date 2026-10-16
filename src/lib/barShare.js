// Partage et réception de cartes de bar (lien #c=..., QR code, fichier .gentbar.json) — Étape 9.7e (§ 4.4).
// Fonctions pures et sans effet de bord sur le stockage local.

import { normalizeText } from './search';
import { generateDrinkId } from '../utils/id';
import { createBar, generateBarId, BASE_BAR_IDS } from './menus';

export const SHARE_FORMAT_VERSION = 1;
export const QR_WARN_LENGTH = 1000;

export const LIMITS = {
  MAX_CATEGORIES: 40,
  MAX_DRINKS: 400,
  MAX_NAME_LENGTH: 60,
  MAX_ICON_CHARS: 2,
  MIN_PRICE_CENTS: 0,
  MAX_PRICE_CENTS: 100000
};

// Supprime les caractères de contrôle ASCII/Unicode (C0, DEL, C1)
export function stripControlChars(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

// Compte le nombre de points de code visuels (hors sélecteurs de variation FE0E/FE0F et ZWJ)
export function countIconChars(iconStr) {
  if (typeof iconStr !== 'string') return 0;
  const cleaned = iconStr.replace(/[\uFE0E\uFE0F\u200D]/g, '');
  return Array.from(cleaned).length;
}

// Tronque une icône à max 2 caractères visuels pour l'export
function clampIcon(iconStr, fallback = '🍺') {
  const cleaned = stripControlChars(iconStr);
  if (!cleaned) return fallback;
  if (countIconChars(cleaned) <= LIMITS.MAX_ICON_CHARS) return cleaned;
  return Array.from(cleaned).slice(0, LIMITS.MAX_ICON_CHARS).join('');
}

// Convertit un tableau d'octets Uint8Array en chaîne base64url sans padding
export function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

// Convertit une chaîne base64url en Uint8Array
export function base64UrlToBytes(base64url) {
  if (typeof base64url !== 'string' || !base64url.trim()) {
    throw new Error('Données base64url vides.');
  }
  const normalized = base64url.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  return new Uint8Array(Buffer.from(padded, 'base64'));
}

function utf8Encode(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  return new Uint8Array(Buffer.from(str, 'utf8'));
}

function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  return Buffer.from(bytes).toString('utf8');
}

// Compresse un Uint8Array avec CompressionStream('deflate') si disponible dans le navigateur
async function compressBytes(inputBytes) {
  if (typeof CompressionStream === 'function' && typeof Response === 'function') {
    try {
      const cs = new CompressionStream('deflate');
      const writer = cs.writable.getWriter();
      writer.write(inputBytes);
      writer.close();
      const buffer = await new Response(cs.readable).arrayBuffer();
      return { bytes: new Uint8Array(buffer), compressed: true };
    } catch {
      // Repli sans compression si l'environnement ne supporte pas les flux
    }
  }
  return { bytes: inputBytes, compressed: false };
}

// Décompresse un Uint8Array avec DecompressionStream('deflate')
async function decompressBytes(inputBytes) {
  if (typeof DecompressionStream === 'function' && typeof Response === 'function') {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(inputBytes);
    writer.close();
    const buffer = await new Response(ds.readable).arrayBuffer();
    return new Uint8Array(buffer);
  }
  throw new Error('La décompression native (DecompressionStream) n’est pas disponible sur cet appareil.');
}

/**
 * Construit la charge utile compacte d'un bar pour le partage (prix en centimes entiers).
 */
export function buildCompactSharePayload(bar) {
  if (!bar || typeof bar !== 'object') {
    throw new Error('Bar invalide pour le partage.');
  }

  const name = stripControlChars(bar.name || 'Bar').slice(0, LIMITS.MAX_NAME_LENGTH) || 'Bar';
  const icon = clampIcon(bar.icon, '🍺');
  const sourceId = stripControlChars(bar.sourceId || `gentbar-${bar.id || 'shared'}`).slice(0, 80);
  const categories = Array.isArray(bar.categories) ? bar.categories.slice(0, LIMITS.MAX_CATEGORIES) : [];

  let remainingDrinks = LIMITS.MAX_DRINKS;
  const compactCategories = categories
    .filter((cat) => cat && stripControlChars(cat.name))
    .map((cat) => {
      const catName = stripControlChars(cat.name).slice(0, LIMITS.MAX_NAME_LENGTH);
      const catIcon = clampIcon(cat.icon, '🍺');
      const rawDrinks = Array.isArray(cat.drinks) ? cat.drinks : [];
      const allowedDrinks = rawDrinks.slice(0, Math.max(0, remainingDrinks));
      remainingDrinks -= allowedDrinks.length;

      const compactDrinks = allowedDrinks
        .filter((d) => d && stripControlChars(d.name) && typeof d.price === 'number' && Number.isFinite(d.price))
        .map((d) => {
          const drinkName = stripControlChars(d.name).slice(0, LIMITS.MAX_NAME_LENGTH);
          const cents = Math.max(
            LIMITS.MIN_PRICE_CENTS,
            Math.min(LIMITS.MAX_PRICE_CENTS, Math.round(d.price * 100))
          );
          return [drinkName, cents];
        });

      return {
        n: catName,
        i: catIcon,
        d: compactDrinks
      };
    });

  return {
    v: SHARE_FORMAT_VERSION,
    n: name,
    i: icon,
    s: sourceId,
    c: compactCategories
  };
}

/**
 * Valide strictement et normalise les données d'une carte reçue (depuis un lien ou un fichier).
 * Applique toutes les limites de sécurité du § 4.4 :
 *  - ≤ 40 catégories
 *  - ≤ 400 boissons au total
 *  - noms ≤ 60 caractères (non vides après suppression des caractères de contrôle)
 *  - prix entier en centimes entre 0 et 100 000
 *  - icône ≤ 2 caractères
 * Renvoie `{ valid: true, bar }` ou `{ valid: false, error }`.
 */
export function validateAndNormalizeSharedBar(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return { valid: false, error: 'Format de carte invalide.' };
  }

  const rawVersion = rawPayload.v ?? rawPayload.version ?? SHARE_FORMAT_VERSION;
  if (typeof rawVersion !== 'number' || rawVersion < 1 || rawVersion > 10) {
    return { valid: false, error: 'Version de carte non prise en charge.' };
  }

  const rawBarName = rawPayload.n ?? rawPayload.name;
  if (typeof rawBarName !== 'string') {
    return { valid: false, error: 'Le nom du bar est manquant.' };
  }
  const barName = stripControlChars(rawBarName);
  if (!barName) {
    return { valid: false, error: 'Le nom du bar est vide.' };
  }
  if (barName.length > LIMITS.MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Le nom du bar dépasse la limite de ${LIMITS.MAX_NAME_LENGTH} caractères.`
    };
  }

  const rawBarIcon = rawPayload.i ?? rawPayload.icon ?? '🍺';
  if (typeof rawBarIcon !== 'string') {
    return { valid: false, error: 'Icône du bar invalide.' };
  }
  const barIcon = stripControlChars(rawBarIcon) || '🍺';
  if (countIconChars(barIcon) > LIMITS.MAX_ICON_CHARS) {
    return {
      valid: false,
      error: `L’icône du bar dépasse la limite de ${LIMITS.MAX_ICON_CHARS} caractères.`
    };
  }

  const rawSourceId = rawPayload.s ?? rawPayload.sourceId ?? '';
  const cleanedSourceId =
    typeof rawSourceId === 'string' ? stripControlChars(rawSourceId).slice(0, 80) : '';

  const rawCategories = rawPayload.c ?? rawPayload.categories;
  if (!Array.isArray(rawCategories)) {
    return { valid: false, error: 'La liste des catégories est invalide.' };
  }
  if (rawCategories.length > LIMITS.MAX_CATEGORIES) {
    return {
      valid: false,
      error: `La carte contient trop de catégories (${rawCategories.length}, maximum ${LIMITS.MAX_CATEGORIES}).`
    };
  }

  let totalDrinks = 0;
  const normalizedCategories = [];

  for (let cIdx = 0; cIdx < rawCategories.length; cIdx += 1) {
    const rawCat = rawCategories[cIdx];
    if (!rawCat || typeof rawCat !== 'object' || Array.isArray(rawCat)) {
      return { valid: false, error: `Catégorie #${cIdx + 1} invalide.` };
    }

    const rawCatName = rawCat.n ?? rawCat.name;
    if (typeof rawCatName !== 'string') {
      return { valid: false, error: `Nom manquant pour la catégorie #${cIdx + 1}.` };
    }
    const catName = stripControlChars(rawCatName);
    if (!catName) {
      return { valid: false, error: `Le nom de la catégorie #${cIdx + 1} est vide.` };
    }
    if (catName.length > LIMITS.MAX_NAME_LENGTH) {
      return {
        valid: false,
        error: `Le nom de la catégorie « ${catName.slice(0, 20)}… » dépasse ${LIMITS.MAX_NAME_LENGTH} caractères.`
      };
    }

    const rawCatIcon = rawCat.i ?? rawCat.icon ?? '🍺';
    if (typeof rawCatIcon !== 'string') {
      return { valid: false, error: `Icône invalide pour la catégorie « ${catName} ».` };
    }
    const catIcon = stripControlChars(rawCatIcon) || '🍺';
    if (countIconChars(catIcon) > LIMITS.MAX_ICON_CHARS) {
      return {
        valid: false,
        error: `L’icône de la catégorie « ${catName} » dépasse ${LIMITS.MAX_ICON_CHARS} caractères.`
      };
    }

    const rawDrinks = rawCat.d ?? rawCat.drinks;
    if (!Array.isArray(rawDrinks)) {
      return { valid: false, error: `Liste de boissons invalide dans « ${catName} ».` };
    }

    totalDrinks += rawDrinks.length;
    if (totalDrinks > LIMITS.MAX_DRINKS) {
      return {
        valid: false,
        error: `La carte dépasse la limite de ${LIMITS.MAX_DRINKS} boissons.`
      };
    }

    const catId = `cat-shared-${cIdx + 1}-${normalizeText(catName).replace(/[^a-z0-9]+/g, '-').slice(0, 24) || cIdx}`;
    const normalizedDrinks = [];

    for (let dIdx = 0; dIdx < rawDrinks.length; dIdx += 1) {
      const rawDrink = rawDrinks[dIdx];
      let rawDrinkName;
      let rawPriceCents;

      if (Array.isArray(rawDrink)) {
        rawDrinkName = rawDrink[0];
        rawPriceCents = rawDrink[1];
      } else if (rawDrink && typeof rawDrink === 'object') {
        rawDrinkName = rawDrink.n ?? rawDrink.name;
        if (rawDrink.priceCents !== undefined) {
          rawPriceCents = rawDrink.priceCents;
        } else if (rawDrink.p !== undefined) {
          rawPriceCents = rawDrink.p;
        } else if (typeof rawDrink.price === 'number' && Number.isFinite(rawDrink.price)) {
          rawPriceCents = Math.round(rawDrink.price * 100);
        }
      } else {
        return { valid: false, error: `Boisson #${dIdx + 1} invalide dans « ${catName} ».` };
      }

      if (typeof rawDrinkName !== 'string') {
        return { valid: false, error: `Nom de boisson manquant dans « ${catName} ».` };
      }
      const drinkName = stripControlChars(rawDrinkName);
      if (!drinkName) {
        return { valid: false, error: `Nom de boisson vide dans « ${catName} ».` };
      }
      if (drinkName.length > LIMITS.MAX_NAME_LENGTH) {
        return {
          valid: false,
          error: `Le nom de la boisson « ${drinkName.slice(0, 20)}… » dépasse ${LIMITS.MAX_NAME_LENGTH} caractères.`
        };
      }

      if (
        typeof rawPriceCents !== 'number' ||
        !Number.isInteger(rawPriceCents) ||
        rawPriceCents < LIMITS.MIN_PRICE_CENTS ||
        rawPriceCents > LIMITS.MAX_PRICE_CENTS
      ) {
        return {
          valid: false,
          error: `Prix invalide pour « ${drinkName} » (doit être compris entre 0,00 € et 1 000,00 €).`
        };
      }

      normalizedDrinks.push({
        id: `${generateDrinkId(drinkName, catId)}-${dIdx}`,
        name: drinkName,
        price: rawPriceCents / 100,
        modified: false
      });
    }

    normalizedCategories.push({
      id: catId,
      name: catName,
      icon: catIcon,
      isCollapsed: false,
      modified: false,
      drinks: normalizedDrinks
    });
  }

  const newId = generateBarId();
  const safeSourceId = cleanedSourceId || `gentbar-${newId}`;

  const bar = createBar({
    id: newId,
    sourceId: safeSourceId,
    name: barName,
    icon: barIcon,
    origin: 'custom',
    baseVersion: null,
    categories: normalizedCategories
  });

  return { valid: true, bar };
}

/**
 * Encode un bar en jeton de partage (`c=...`) et construit l'URL complète `/recevoir#c=<données>`.
 */
export async function encodeBarToShareLink(bar, origin = 'https://gentbar.netlify.app') {
  const payload = buildCompactSharePayload(bar);
  const json = JSON.stringify(payload);
  const utf8Bytes = utf8Encode(json);
  const { bytes, compressed } = await compressBytes(utf8Bytes);
  const encoded = bytesToBase64Url(bytes);
  const token = `${compressed ? 'z.' : 'u.'}${encoded}`;
  const cleanOrigin = typeof origin === 'string' && origin.trim() ? origin.trim().replace(/\/+$/g, '') : 'https://gentbar.netlify.app';
  const url = `${cleanOrigin}/recevoir#c=${token}`;

  return {
    url,
    token,
    length: url.length,
    isLargeForQr: url.length > QR_WARN_LENGTH
  };
}

/**
 * Extrait la valeur du paramètre `c` depuis un lien complet, un hash `#c=...` ou un jeton brut.
 */
export function extractShareToken(input) {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const hashIndex = trimmed.indexOf('#');
  const fragment = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : trimmed;

  if (fragment.startsWith('c=')) {
    return decodeURIComponent(fragment.slice(2).trim());
  }

  const match = fragment.match(/(?:^|[&#?])c=([^&#\s]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1].trim());
  }

  // Si l'utilisateur a collé directement le jeton z.xxx ou u.xxx
  if (trimmed.startsWith('z.') || trimmed.startsWith('u.')) {
    return trimmed;
  }

  return '';
}

/**
 * Décode et valide une carte à partir d'un lien complet, d'un hash `#c=...` ou d'un jeton brut.
 * Renvoie `{ valid: true, bar }` ou `{ valid: false, error }`.
 */
export async function decodeBarFromShareInput(input) {
  try {
    const token = extractShareToken(input);
    if (!token) {
      return { valid: false, error: 'Aucun code de carte trouvé dans ce lien.' };
    }

    let jsonStr;
    if (token.startsWith('z.')) {
      const compressedBytes = base64UrlToBytes(token.slice(2));
      const decompressedBytes = await decompressBytes(compressedBytes);
      jsonStr = utf8Decode(decompressedBytes);
    } else if (token.startsWith('u.')) {
      const rawBytes = base64UrlToBytes(token.slice(2));
      jsonStr = utf8Decode(rawBytes);
    } else {
      // Compatibilité : tentative de décompression deflate puis repli UTF-8 direct
      const rawBytes = base64UrlToBytes(token);
      try {
        const decompressedBytes = await decompressBytes(rawBytes);
        jsonStr = utf8Decode(decompressedBytes);
      } catch {
        jsonStr = utf8Decode(rawBytes);
      }
    }

    const parsed = JSON.parse(jsonStr);
    return validateAndNormalizeSharedBar(parsed);
  } catch {
    return {
      valid: false,
      error: 'Ce lien de carte est invalide, incomplet ou endommagé.'
    };
  }
}

/**
 * Sérialise un bar en contenu JSON lisible pour l'export de fichier (`.gentbar.json`).
 * Les prix sont exportés en centimes entiers (`priceCents`) conformément au § 4.4.
 */
export function serializeBarToFileContent(bar) {
  const compact = buildCompactSharePayload(bar);
  const fileObject = {
    format: 'gentbar-menu',
    version: SHARE_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    name: compact.n,
    icon: compact.i,
    sourceId: compact.s,
    categories: compact.c.map((cat) => ({
      name: cat.n,
      icon: cat.i,
      drinks: cat.d.map(([drinkName, priceCents]) => ({
        name: drinkName,
        priceCents
      }))
    }))
  };
  return JSON.stringify(fileObject, null, 2);
}

/**
 * Lit et valide le contenu texte d'un fichier `.json` / `.gentbar.json` importé.
 */
export function parseBarFromFileContent(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { valid: false, error: 'Le fichier est vide.' };
  }
  try {
    const parsed = JSON.parse(text);
    return validateAndNormalizeSharedBar(parsed);
  } catch {
    return { valid: false, error: 'Le fichier sélectionné n’est pas un fichier de carte JSON valide.' };
  }
}

/**
 * Cherche dans `menus` un bar existant qui partage déjà le même `sourceId` (carte liée).
 * Ignore les 2 cartes de base officielles ('rllhc' et 'gentbar') pour ne jamais les altérer via un lien externe.
 */
export function findLinkedBarBySourceId(menus, sourceId) {
  if (!Array.isArray(menus) || typeof sourceId !== 'string' || !sourceId.trim()) {
    return null;
  }
  const targetSourceId = sourceId.trim();
  return (
    menus.find(
      (b) =>
        b &&
        !BASE_BAR_IDS.includes(b.id) &&
        b.origin !== 'base' &&
        typeof b.sourceId === 'string' &&
        b.sourceId.trim() === targetSourceId
    ) || null
  );
}

/**
 * Cherche dans `menus` le bar existant ayant le plus de noms de boissons (normalisés) en commun
 * avec `incomingBar` (§ 4.4 : « Ce bar ressemble à « Chez Mimi » (14 boissons en commun) »).
 * Renvoie `{ bar, commonCount }` ou `null` si aucune boisson en commun.
 */
export function findSimilarBar(menus, incomingBar) {
  if (!Array.isArray(menus) || !incomingBar || !Array.isArray(incomingBar.categories)) {
    return null;
  }

  const incomingNames = new Set();
  incomingBar.categories.forEach((cat) => {
    if (cat && Array.isArray(cat.drinks)) {
      cat.drinks.forEach((d) => {
        const key = normalizeText(d?.name || '');
        if (key) incomingNames.add(key);
      });
    }
  });

  if (incomingNames.size === 0) return null;

  let bestBar = null;
  let bestCount = 0;

  menus.forEach((bar) => {
    if (!bar || !Array.isArray(bar.categories)) return;
    const seenInBar = new Set();
    let count = 0;
    bar.categories.forEach((cat) => {
      if (cat && Array.isArray(cat.drinks)) {
        cat.drinks.forEach((d) => {
          const key = normalizeText(d?.name || '');
          if (key && !seenInBar.has(key) && incomingNames.has(key)) {
            seenInBar.add(key);
            count += 1;
          }
        });
      }
    });

    if (count > bestCount) {
      bestCount = count;
      bestBar = bar;
    }
  });

  if (!bestBar || bestCount === 0) return null;
  return { bar: bestBar, commonCount: bestCount };
}
