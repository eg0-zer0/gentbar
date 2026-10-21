import { normalizeText } from './search';
import { LIMITS } from './barShare';

export const MAX_PASTE_CHARS = 50000;

/**
 * Devine une icône de catégorie en fonction de son nom.
 * Bière → 🍺, vin → 🍷, bulles/cava/champagne → 🥂, cocktail → 🍹,
 * alcool → 🥃, soft/eau → 💧, jus → 🧃, chaud/café/thé → ☕,
 * snack → 🍫, resto/restauration → 🥪, sinon 🍹.
 *
 * @param {string} name - Nom de la catégorie
 * @returns {string} Emoji icône
 */
export function guessCategoryIcon(name = '') {
  const norm = normalizeText(name);
  if (/biere|fut|fût|pression|keg|brasserie/.test(norm)) return '🍺';
  if (/\bvins?\b|rouge|blanc|ros[eé]/.test(norm)) return '🍷';
  if (/bulle|cava|champagne|prosecco|spumante|cidre/.test(norm)) return '🥂';
  if (/cocktail|mojito|spritz|apero|apéro|sangria/.test(norm)) return '🍹';
  if (/alcool|gin|vodka|rhum|rum|whisky|whiskey|bourbon|liqueur|cognac|pastis|ricard|tequila/.test(norm)) return '🥃';
  if (/soft|eau|soda|cola|coke|sprite|fanta|limonade|tonique|tonic|perrier|ice tea|lipton|fuze/.test(norm)) return '💧';
  if (/\bjus\b|nectar|smoothie/.test(norm)) return '🧃';
  if (/chaud|cafe|café|\bthe\b|thé|infusion|espresso|expresso|cappuccino|chocolat chaud/.test(norm)) return '☕';
  if (/snack|chips|bonbon|confiserie|\bchocolat\b|barre/.test(norm)) return '🍫';
  if (/resto|restauration|panini|croque|burger|frite|sandwich|pizza|soupe|repas|plat|salade|assiette/.test(norm)) return '🥪';
  return '🍹';
}

/**
 * Analyse une ligne unique pour en extraire le nom et le prix.
 *
 * @param {string} rawLine - Ligne brute
 * @returns {object} { name, price, multiple, hasOcrO, raw }
 */
function parseSingleLine(rawLine) {
  // Retrait des puces, tirets et astérisques de début de ligne
  let cleaned = (rawLine || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();

  // Détection des zones entre parenthèses (...) pour ne pas y chercher le prix
  const parenSpans = [];
  const parenRegex = /\([^)]*\)/g;
  let pm;
  while ((pm = parenRegex.exec(cleaned)) !== null) {
    parenSpans.push({ start: pm.index, end: pm.index + pm[0].length });
  }
  const inParen = (idx) => parenSpans.some((s) => idx >= s.start && idx < s.end);

  // Recherche de tous les nombres candidats (avec virgule, point, ou lettre O)
  // Formats acceptés : 2,50 · 2.50 · 2,5 · 2 · 2,50 € · €2,50 · 2.50eur · 2,5O
  const numRegex = /(?:€\s*)?(\d+(?:[.,][0-9O0]+)?|\d+)\s*(?:€|eur|euros?)?/gi;
  let nm;
  const candidates = [];
  while ((nm = numRegex.exec(cleaned)) !== null) {
    const start = nm.index;
    const end = start + nm[0].length;

    // Ignorer les nombres entre parenthèses
    if (inParen(start)) continue;

    // Ignorer les nombres immédiatement suivis d'une unité de volume ou de degré
    const after = cleaned.slice(end);
    if (/^\s*(?:cl|ml|dl|l|litres?|°|%)(?![a-zA-Z0-9])/i.test(after)) {
      continue;
    }

    candidates.push({ match: nm[0], rawNum: nm[1], start, end });
  }

  // Aucun nombre trouvé
  if (candidates.length === 0) {
    return {
      name: cleaned.replace(/\s+/g, ' '),
      price: null,
      multiple: false,
      hasOcrO: false
    };
  }

  // Le prix est le dernier nombre candidat de la ligne
  const lastCandidate = candidates[candidates.length - 1];
  const multiple = candidates.length > 1;

  // Correction éventuelle d'un 'O' pris pour un zéro (ex: 2,5O -> 2,50)
  let hasOcrO = false;
  let numStr = lastCandidate.rawNum;
  if (/[Oo]/.test(numStr)) {
    hasOcrO = true;
    numStr = numStr.replace(/[Oo]/g, '0');
  }
  numStr = numStr.replace(',', '.');
  const price = Math.round(parseFloat(numStr) * 100) / 100;

  // Le nom est le reste de la ligne avant (ou après) le prix
  let name = (cleaned.slice(0, lastCandidate.start) + cleaned.slice(lastCandidate.end)).trim();

  // Nettoyage des séparateurs de fin et de début (points de suite, tirets, deux-points, tabulations)
  name = name.replace(/[\s\t.•\-–—:]+$/, '').trim();
  name = name.replace(/^[\s\t.•\-–—:]+/, '').trim();
  name = name.replace(/\s+/g, ' ');

  return {
    name,
    price: Number.isFinite(price) ? price : null,
    multiple,
    hasOcrO
  };
}

const CATEGORY_TERMS = [
  'boissons',
  'boissons alcoolisees',
  'boissons sans alcool',
  'boissons chaudes',
  'boissons fraiches',
  'bieres',
  'bieres pression',
  'bieres bouteille',
  'bieres au fut',
  'vins',
  'vins au verre',
  'vins bouteille',
  'cocktails',
  'alcools',
  'spiritueux',
  'softs',
  'softs et jus',
  'jus',
  'aperitifs',
  'aperos',
  'bulles',
  'champagnes',
  'snacks',
  'restauration'
];

/**
 * Détecte si une ligne correspond à un titre de catégorie :
 * - finit par ':'
 * - OU contient des lettres et est entièrement en majuscules (accents compris)
 * - OU correspond à une catégorie caractéristique en casse mixte sans volume (ex: Boissons alcoolisées, Nos bières).
 *
 * @param {string} rawLine - Ligne nettoyée
 * @returns {boolean}
 */
export function isCategoryHeaderLine(rawLine) {
  const cleaned = (rawLine || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();
  if (cleaned.endsWith(':')) return true;
  const hasLetters = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(cleaned);
  if (hasLetters && cleaned === cleaned.toUpperCase()) return true;

  // Détection en casse mixte sans unité de volume (Google Lens / OCR)
  if (!/(?:cl|ml|dl|l|litres?|°|%)(?![a-zA-Z0-9])/i.test(cleaned)) {
    const norm = normalizeText(cleaned).replace(/^(?:nos|carte des)\s+/, '');
    if (CATEGORY_TERMS.some((t) => norm === t || norm.startsWith(t + ' ') || norm.endsWith(' ' + t))) {
      return true;
    }
  }

  return false;
}

/**
 * Détecte si une ligne ne contient qu'un prix isolé (ex. 2€, 4,50, 3.00 €, 2,5O).
 *
 * @param {string} line - Ligne brute
 * @returns {boolean}
 */
export function isStandalonePriceLine(line) {
  const cleaned = (line || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();
  if (!cleaned) return false;
  // Ne doit pas contenir d'unité de volume ou de degré
  if (/(?:cl|ml|dl|l|litres?|°|%)(?![a-zA-Z0-9])/i.test(cleaned)) return false;
  const match = cleaned.match(/^[-–—:\s]*(?:[€$£]\s*)?([0-9]+(?:[.,][0-9O0]{1,2})?)\s*(?:[€$£]|eur|euros?)?$/i);
  if (!match) return false;
  const numStr = match[1].replace(/[Oo]/g, '0').replace(',', '.');
  const val = parseFloat(numStr);
  return Number.isFinite(val) && val <= 1000;
}

/**
 * Pré-traite les lignes brutes pour fusionner automatiquement les prix isolés
 * placés sur une ligne séparée sous le nom de la boisson (fréquent avec Google Lens).
 *
 * @param {string[]} rawLines - Lignes brutes
 * @param {object} options
 * @param {boolean} [options.allowCategories=false]
 * @returns {string[]} Lignes réassemblées
 */
export function stitchStandalonePrices(rawLines, { allowCategories = false } = {}) {
  const nonEmpty = (rawLines || []).map((l) => l.trim()).filter(Boolean);
  const result = [];

  for (let i = 0; i < nonEmpty.length; i += 1) {
    const current = nonEmpty[i];

    if (isStandalonePriceLine(current) && result.length > 0) {
      const prev = result[result.length - 1];
      const prevParsed = parseSingleLine(prev);
      const isPrevCat = allowCategories && isCategoryHeaderLine(prev);

      // Si la ligne précédente n'a pas encore de prix et n'est pas un titre de catégorie
      if (prevParsed.price === null && !isPrevCat) {
        result[result.length - 1] = prev + ' ' + current;
        continue;
      }
    }

    result.push(current);
  }

  return result;
}

/**
 * Analyse une liste de boissons en texte brut et produit un résultat structuré.
 *
 * @param {string} text - Texte collé brut
 * @param {object} options - Options d'analyse
 * @param {boolean} [options.allowCategories=false] - Détection des titres de catégories
 * @param {string[]} [options.existingNames=[]] - Noms de boissons déjà existants pour alerte doublon
 * @param {boolean} [options.splitSlashes=false] - Séparation des 'A / B' en deux boissons
 * @returns {object} { categories, stats }
 */
export function parseDrinkList(text, {
  allowCategories = false,
  existingNames = [],
  splitSlashes = false
} = {}) {
  const emptyStats = {
    totalDrinks: 0,
    okCount: 0,
    warningCount: 0,
    errorCount: 0,
    categoryCount: 0,
    tooLong: false
  };

  if (typeof text !== 'string' || text.trim().length === 0) {
    return { categories: [], stats: emptyStats };
  }

  let processText = text;
  let tooLong = false;
  if (processText.length > MAX_PASTE_CHARS) {
    processText = processText.slice(0, MAX_PASTE_CHARS);
    tooLong = true;
  }

  // Fin de lignes Windows (\r\n) et Unix (\n) et fusion des prix isolés (Google Lens / OCR)
  const rawLines = processText.split(/\r?\n/);
  const lines = stitchStandalonePrices(rawLines, { allowCategories });

  const categories = [];
  let currentCategory = null;

  // Préparation de l'ensemble des noms déjà existants pour doublons
  const normalizedExisting = new Set(
    (Array.isArray(existingNames) ? existingNames : [])
      .map((n) => normalizeText(n))
      .filter(Boolean)
  );

  // Suivi des noms vus dans ce parsing
  const seenInList = new Map(); // normalizedName -> occurrences count

  const parsedItems = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    if (!rawLine.trim()) continue;

    const parsed = parseSingleLine(rawLine);

    // Détection d'un titre de catégorie (mode allowCategories activé)
    if (allowCategories && parsed.price === null && isCategoryHeaderLine(rawLine)) {
      const catName = (parsed.name || rawLine)
        .replace(/^[\s*•\-–—·]+\s*/, '')
        .replace(/:$/, '')
        .trim();
      currentCategory = {
        name: catName.slice(0, LIMITS.MAX_NAME_LENGTH) || 'Catégorie',
        icon: guessCategoryIcon(catName),
        drinks: []
      };
      categories.push(currentCategory);
      continue;
    }

    // Si des boissons précèdent le premier titre de catégorie, les placer dans "Divers"
    if (allowCategories && !currentCategory) {
      currentCategory = {
        name: 'Divers',
        icon: '🍹',
        drinks: []
      };
      categories.push(currentCategory);
    }

    // Gestion de splitSlashes (ex: "Coca / Zéro 2,50" -> "Coca" et "Zéro")
    const namesToAdd = [];
    if (splitSlashes && parsed.name && parsed.name.includes('/')) {
      const parts = parsed.name
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        namesToAdd.push(...parts);
      } else {
        namesToAdd.push(parsed.name);
      }
    } else {
      namesToAdd.push(parsed.name);
    }

    for (let i = 0; i < namesToAdd.length; i += 1) {
      const rawName = namesToAdd[i];
      let finalName = rawName;
      const issues = [];
      let isWarning = false;
      let isError = false;

      // 1. Validation du nom
      if (!finalName || finalName.trim().length === 0) {
        isError = true;
        issues.push('Nom de boisson manquant');
      } else if (finalName.length > LIMITS.MAX_NAME_LENGTH) {
        // Exception pour les formules réelles avec description entre parenthèses
        const basePart = finalName.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (basePart.length <= LIMITS.MAX_NAME_LENGTH && finalName.length <= 75) {
          // Nom de base court avec parenthèse explicative : conservé intact
        } else {
          finalName = finalName.slice(0, LIMITS.MAX_NAME_LENGTH).trim();
          isWarning = true;
          issues.push(`Nom tronqué à ${LIMITS.MAX_NAME_LENGTH} caractères`);
        }
      }

      // 2. Validation du prix
      let finalPrice = parsed.price;
      if (finalPrice === null) {
        isError = true;
        issues.push('Aucun prix détecté');
      } else if (finalPrice > LIMITS.MAX_PRICE_CENTS / 100) {
        isError = true;
        issues.push(`Prix supérieur à ${LIMITS.MAX_PRICE_CENTS / 100} €`);
      } else if (finalPrice === 0) {
        isWarning = true;
        issues.push('Prix à 0 €');
      }

      // 3. Avertissements contextuels
      if (parsed.multiple && finalPrice !== null) {
        isWarning = true;
        issues.push(`Plusieurs nombres détectés (prix retenu : ${finalPrice} €)`);
      }

      if (parsed.hasOcrO) {
        isWarning = true;
        issues.push("Lettre 'O' corrigée en zéro");
      }

      // 4. Détection des doublons
      if (finalName) {
        const norm = normalizeText(finalName);
        if (norm) {
          const currentCount = seenInList.get(norm) || 0;
          if (currentCount > 0) {
            isWarning = true;
            issues.push('Doublon dans la liste collée');
          }
          seenInList.set(norm, currentCount + 1);

          if (normalizedExisting.has(norm)) {
            isWarning = true;
            issues.push('Existe déjà dans le bar');
          }
        }
      }

      const status = isError ? 'error' : isWarning ? 'warning' : 'ok';

      const drinkItem = {
        name: finalName,
        price: finalPrice,
        status,
        issues,
        raw: rawLine
      };

      if (allowCategories && currentCategory) {
        currentCategory.drinks.push(drinkItem);
      } else {
        parsedItems.push(drinkItem);
      }
    }
  }

  // En mode mono-catégorie (allowCategories = false), renvoyer une catégorie unique englobante
  const finalCategories = allowCategories
    ? categories
    : [{ name: 'Boissons', icon: '🍹', drinks: parsedItems }];

  let totalDrinks = 0;
  let okCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const cat of finalCategories) {
    for (const d of cat.drinks) {
      totalDrinks += 1;
      if (d.status === 'ok') okCount += 1;
      else if (d.status === 'warning') warningCount += 1;
      else if (d.status === 'error') errorCount += 1;
    }
  }

  return {
    categories: finalCategories,
    stats: {
      totalDrinks,
      okCount,
      warningCount,
      errorCount,
      categoryCount: finalCategories.length,
      tooLong
    }
  };
}

export default parseDrinkList;
