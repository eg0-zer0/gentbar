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
  if (/sans alcool|soft|eau|soda|cola|coke|sprite|fanta|limonade|tonique|tonic|perrier|ice tea|lipton|fuze/.test(norm)) return '💧';
  if (/alcool|gin|vodka|rhum|rum|whisky|whiskey|bourbon|liqueur|cognac|pastis|ricard|tequila/.test(norm)) return '🥃';
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
  // Formats acceptés : 2,50 · 2.50 · 2,5 · 2 · 2,50 € · €2,50 · 2.50eur · 2,5O · 10E · 12e
  const numRegex = /(?:[€$£]\s*)?(\d+(?:[.,][0-9O0]+)?|\d+)\s*(?:€|eur|euros?|[eE](?![a-z0-9]))?/gi;
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
      hasOcrO: false,
      hasOcrE: false
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

  // Détection de la lettre 'E' / 'e' reconnue pour le symbole '€'
  let hasOcrE = false;
  if (/[0-9][eE](?:\s|$|[^a-df-z0-9])/i.test(lastCandidate.match)) {
    hasOcrE = true;
  }

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
    hasOcrO,
    hasOcrE
  };
}

const EXACT_CATEGORY_TERMS = new Set([
  'boissons sans alcool',
  'boissons avec alcool',
  'boissons alcoolisees',
  'boissons alcoolise',
  'boissons chaudes',
  'boissons fraiches',
  'boissons',
  'bieres',
  'bieres au fut',
  'bieres pression',
  'bieres bouteille',
  'vins',
  'vins au verre',
  'vins bouteille',
  'cocktails',
  'alcools',
  'spiritueux',
  'softs',
  'softs et jus',
  'aperitifs',
  'aperos',
  'bulles',
  'champagnes',
  'snacks',
  'restauration'
]);

/**
 * Détecte si une ligne correspond à un titre de catégorie :
 * - finit par ':'
 * - OU contient des lettres et est entièrement en majuscules (accents compris)
 * - OU correspond à une catégorie caractéristique en casse mixte sans volume (ex: Boissons sans alcool, Boissons avec alcool).
 *
 * @param {string} rawLine - Ligne nettoyée
 * @returns {boolean}
 */
export function isCategoryHeaderLine(rawLine) {
  const cleaned = (rawLine || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();
  if (cleaned.endsWith(':')) return true;
  const hasLetters = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(cleaned);
  if (hasLetters && cleaned === cleaned.toUpperCase()) return true;

  // Détection en casse mixte sans chiffre d'unité de volume (évite le faux positif sur la lettre 'l' d'alcool)
  if (!/\d+\s*(?:cl|ml|dl|l|litres?|°|%)/i.test(cleaned)) {
    const norm = normalizeText(cleaned).replace(/^(?:nos|carte des|tarifs?)\s+/, '');
    if (EXACT_CATEGORY_TERMS.has(norm)) {
      return true;
    }
  }

  return false;
}

/**
 * Détecte si une ligne ne contient qu'un prix isolé (ex. 2€, 4,50, 3.00 €, 2,5O, 10E).
 *
 * @param {string} line - Ligne brute
 * @returns {boolean}
 */
export function isStandalonePriceLine(line) {
  const cleaned = (line || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();
  if (!cleaned) return false;
  // Ne doit pas contenir d'unité de volume ou de degré
  if (/(?:cl|ml|dl|l|litres?|°|%)(?![a-zA-Z0-9])/i.test(cleaned)) return false;
  const match = cleaned.match(/^[-–—:\s]*(?:[€$£E]\s*)?([0-9]+(?:[.,][0-9O0]{1,2})?)\s*(?:[€$£]|eur|euros?|[eE](?![a-df-z0-9]))?$/i);
  if (!match) return false;
  const numStr = match[1].replace(/[Oo]/g, '0').replace(',', '.');
  const val = parseFloat(numStr);
  return Number.isFinite(val) && val <= 1000;
}

/**
 * Détecte si une ligne ne contient que des tarifs et des mentions de contenants
 * (ex: "10€ le verre/50€ la bouteille", "8€ verre / 35€ bouteille", "9€ le verre/35 E la bouteille").
 *
 * @param {string} line - Ligne brute
 * @returns {boolean}
 */
export function isTariffOnlyLine(line) {
  const cleaned = (line || '').replace(/^[\s*•\-–—·]+\s*/, '').trim();
  if (!cleaned) return false;
  // Doit comporter au moins un prix
  const hasPrice = /(?:\d+(?:[.,][0-9O0]+)?|\d+)\s*(?:€|eur|euros?|[eE](?![a-df-z0-9]))|(?:[€$£]\s*\d+)/i.test(cleaned);
  if (!hasPrice) return false;

  // Retirer les nombres et symboles de prix
  const stripped = cleaned
    .replace(/(?:[€$£]|eur)\s*\d+(?:[.,][0-9O0]+)?/gi, '')
    .replace(/\d+(?:[.,][0-9O0]+)?\s*(?:€|eur|euros?|[eE](?![a-df-z0-9]))?/gi, '')
    .replace(/\b(?:le|la|les|en|au|du|un|une|verres?|bouteilles?|pichets?|demi|pintes?|flûtes?|coupes?|galopins?|doses?|shots?|pots?|carafes?|cl|ml|dl|l)\b/gi, '')
    .replace(/[\s\t.,;:/\-–—()]+/g, '')
    .trim();

  return stripped.length === 0;
}

/**
 * Pré-traite les lignes brutes pour fusionner automatiquement les prix isolés
 * placés sur une ligne séparée (fréquent avec Google Lens / OCR en colonnes).
 * Fusionne en priorité vers la ligne précédente si elle n'a pas de prix,
 * sinon vers la ligne suivante si le prix précède le produit.
 *
 * @param {string[]} rawLines - Lignes brutes
 * @param {object} options
 * @param {boolean} [options.allowCategories=false]
 * @returns {string[]} Lignes réassemblées
 */
export function stitchStandalonePrices(rawLines, { allowCategories = false } = {}) {
  const nonEmpty = (rawLines || []).map((l) => l.trim()).filter(Boolean);
  const items = nonEmpty.map((line) => ({
    text: line,
    isPrice: isStandalonePriceLine(line) || isTariffOnlyLine(line),
    isCat: allowCategories && isCategoryHeaderLine(line),
    merged: false
  }));

  // Passe 1 : fusion vers le haut (Nom suivi de Prix sur la ligne suivante)
  for (let i = 0; i < items.length; i += 1) {
    if (items[i].isPrice && i > 0) {
      const prev = items[i - 1];
      // Si items[i] est une pure ligne de tarifs (ex: verre/bouteille), prev est le produit même s'il finissait par ':'
      const canMergeWithCat = isTariffOnlyLine(items[i].text) && !prev.isPrice;
      if (!prev.isPrice && (!prev.isCat || canMergeWithCat) && parseSingleLine(prev.text).price === null) {
        prev.text = prev.text + ' ' + items[i].text;
        items[i].merged = true;
      }
    }
  }

  const remaining = items.filter((it) => !it.merged);

  // Passe 2 : fusion vers le bas (Prix seul précédant un nom sans prix)
  for (let i = 0; i < remaining.length; i += 1) {
    if (remaining[i].isPrice && i + 1 < remaining.length) {
      const next = remaining[i + 1];
      if (!next.isPrice && !next.isCat && parseSingleLine(next.text).price === null) {
        next.text = next.text + ' ' + remaining[i].text;
        remaining[i].merged = true;
      }
    }
  }

  return remaining.filter((it) => !it.merged).map((it) => it.text);
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

    // Gestion de splitSlashes (boissons multiples "Coca / Zéro 2,50" ou "Coca, Oasis, Ice Tea 1,50", ou double prix "Whisky 10€ le verre / 50€ la bouteille")
    let itemsToAdd = [];
    if (splitSlashes && (rawLine.includes('/') || (parsed.name && parsed.name.includes(',')))) {
      const slashParts = rawLine.split('/');
      const parsedParts = slashParts.map((p) => parseSingleLine(p));
      const partsWithPrice = parsedParts.filter((p) => p.price !== null);

      if (slashParts.length > 1 && partsWithPrice.length >= 2) {
        // Multi-tarifs avec un prix par segment
        const p0 = parsedParts[0];
        const containerRegex = /^(?:le\s+|la\s+|les\s+|en\s+|au\s+|du\s+|un\s+|une\s+)?(?:verres?|bouteilles?|pichets?|demi|pintes?|flûtes?|coupes?|galopins?|doses?|shots?|pots?|carafes?|\d+\s*(?:cl|ml|dl|l))$/i;
        const baseMatch = p0.name.match(/^(.*?)(?:\s+[-–—:]\s*|\s+)(?:le\s+|la\s+|les\s+|en\s+|au\s+|du\s+|un\s+|une\s+)?(?:verres?|bouteilles?|pichets?|demi|pintes?|flûtes?|coupes?|galopins?|doses?|shots?|pots?|carafes?|\d+\s*(?:cl|ml|dl|l))$/i);
        const baseName = (baseMatch ? baseMatch[1] : p0.name).replace(/[\s\t.•\-–—:]+$/, '').trim();

        itemsToAdd = parsedParts.map((pp, idx) => {
          let segName = pp.name;
          const isJustContainer = !segName || containerRegex.test(segName.trim());
          if (idx === 0) {
            if (baseMatch) {
              const spec = p0.name.slice(baseName.length).trim().replace(/^[-–—:]\s*/, '');
              segName = spec ? `${baseName} (${spec})` : baseName;
            }
          } else if (isJustContainer) {
            segName = segName ? `${baseName} (${segName})` : `${baseName} (${idx + 1})`;
          }
          return {
            name: segName,
            price: pp.price,
            multiple: pp.multiple,
            hasOcrO: pp.hasOcrO,
            hasOcrE: pp.hasOcrE
          };
        });
      } else if (parsed.name && (parsed.name.includes('/') || parsed.name.includes(','))) {
        // Séparation des boissons groupées de même prix ("Coca / Zéro" ou "Coca, Oasis, Ice Tea")
        const delimiter = parsed.name.includes('/') ? '/' : ',';
        const parts = parsed.name
          .split(delimiter)
          .map((p) => p.trim())
          .filter(Boolean);
        const names = parts.length > 0 ? parts : [parsed.name];
        itemsToAdd = names.map((n) => ({
          name: n,
          price: parsed.price,
          multiple: parsed.multiple,
          hasOcrO: parsed.hasOcrO,
          hasOcrE: parsed.hasOcrE
        }));
      }
    }

    if (itemsToAdd.length === 0) {
      itemsToAdd.push({
        name: parsed.name,
        price: parsed.price,
        multiple: parsed.multiple,
        hasOcrO: parsed.hasOcrO,
        hasOcrE: parsed.hasOcrE
      });
    }

    for (let i = 0; i < itemsToAdd.length; i += 1) {
      const item = itemsToAdd[i];
      let finalName = item.name;
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
      let finalPrice = item.price;
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
      if (item.multiple && finalPrice !== null) {
        isWarning = true;
        issues.push(`Plusieurs nombres détectés (prix retenu : ${finalPrice} €)`);
      }

      if (item.hasOcrO) {
        isWarning = true;
        issues.push("Lettre 'O' corrigée en zéro");
      }

      if (item.hasOcrE) {
        isWarning = true;
        issues.push("Lettre 'E' reconnue comme symbole €");
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
