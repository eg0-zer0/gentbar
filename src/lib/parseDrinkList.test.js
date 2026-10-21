import { parseDrinkList, guessCategoryIcon, MAX_PASTE_CHARS } from './parseDrinkList';

describe('parseDrinkList — Analyse tolérante de liste de boissons (Étape 9.8)', () => {
  test('entrée vide ou uniquement des espaces renvoie un résultat vide sans erreur', () => {
    expect(parseDrinkList('')).toEqual({
      categories: [],
      stats: { totalDrinks: 0, okCount: 0, warningCount: 0, errorCount: 0, categoryCount: 0, tooLong: false }
    });
    expect(parseDrinkList('   \n\t  \n   ')).toEqual({
      categories: [],
      stats: { totalDrinks: 0, okCount: 0, warningCount: 0, errorCount: 0, categoryCount: 0, tooLong: false }
    });
    expect(parseDrinkList(null)).toEqual({
      categories: [],
      stats: { totalDrinks: 0, okCount: 0, warningCount: 0, errorCount: 0, categoryCount: 0, tooLong: false }
    });
  });

  test('reconnaît tous les formats de prix courants et nettoie le nom', () => {
    const inputs = [
      { text: 'Jupiler 2,50', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler 2.50', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler 2,5', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler 2', expectedName: 'Jupiler', expectedPrice: 2 },
      { text: 'Jupiler 2,50 €', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler €2,50', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler 2.50eur', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Jupiler.........2,50', expectedName: 'Jupiler', expectedPrice: 2.5 },
      { text: 'Duvel — 4,50 €', expectedName: 'Duvel', expectedPrice: 4.5 }
    ];

    inputs.forEach(({ text, expectedName, expectedPrice }) => {
      const res = parseDrinkList(text);
      const drink = res.categories[0].drinks[0];
      expect(drink.name).toBe(expectedName);
      expect(drink.price).toBe(expectedPrice);
      expect(drink.status).toBe('ok');
    });
  });

  test('gère la tabulation et les fins de ligne Windows (CRLF)', () => {
    const text = 'Pils\t2,20\r\nBlonde\t3,80\r\n';
    const res = parseDrinkList(text);
    expect(res.stats.totalDrinks).toBe(2);
    expect(res.categories[0].drinks[0].name).toBe('Pils');
    expect(res.categories[0].drinks[0].price).toBe(2.2);
    expect(res.categories[0].drinks[1].name).toBe('Blonde');
    expect(res.categories[0].drinks[1].price).toBe(3.8);
  });

  test('conserve les volumes dans le nom et ne les prend jamais pour le prix', () => {
    const res = parseDrinkList('Carlsberg 25cl 3,00');
    const drink = res.categories[0].drinks[0];
    expect(drink.name).toBe('Carlsberg 25cl');
    expect(drink.price).toBe(3);
    expect(drink.status).toBe('ok');
  });

  test('ignore les nombres entre parenthèses pour le prix', () => {
    const res = parseDrinkList('Mètre de Carlsberg (11 verres) 25,00');
    const drink = res.categories[0].drinks[0];
    expect(drink.name).toBe('Mètre de Carlsberg (11 verres)');
    expect(drink.price).toBe(25);
    expect(drink.status).toBe('ok');
  });

  test('détecte plusieurs nombres candidats et émet un warning sans casser le nom', () => {
    const res1 = parseDrinkList('Get 27 8,00');
    const d1 = res1.categories[0].drinks[0];
    expect(d1.name).toBe('Get 27');
    expect(d1.price).toBe(8);
    expect(d1.status).toBe('warning');
    expect(d1.issues).toEqual(expect.arrayContaining([expect.stringContaining('Plusieurs nombres')]));

    const res2 = parseDrinkList('Carlsberg 0.0 25cl 2,50');
    const d2 = res2.categories[0].drinks[0];
    expect(d2.name).toBe('Carlsberg 0.0 25cl');
    expect(d2.price).toBe(2.5);
    expect(d2.status).toBe('warning');
  });

  test('gère prix manquant (error), prix à 0 (warning) et prix > 1000 (error)', () => {
    const noPrice = parseDrinkList('Eau minérale').categories[0].drinks[0];
    expect(noPrice.status).toBe('error');
    expect(noPrice.price).toBeNull();
    expect(noPrice.issues).toContain('Aucun prix détecté');

    const zeroPrice = parseDrinkList('Sirop offert 0,00').categories[0].drinks[0];
    expect(zeroPrice.status).toBe('warning');
    expect(zeroPrice.price).toBe(0);
    expect(zeroPrice.issues).toContain('Prix à 0 €');

    const highPrice = parseDrinkList('Champagne millésimé 1500,00').categories[0].drinks[0];
    expect(highPrice.status).toBe('error');
    expect(highPrice.issues).toEqual(expect.arrayContaining([expect.stringContaining('Prix supérieur')]));
  });

  test("corrige la lettre 'O' prise pour un zéro dans un prix avec warning", () => {
    const res = parseDrinkList('Bière 2,5O');
    const drink = res.categories[0].drinks[0];
    expect(drink.name).toBe('Bière');
    expect(drink.price).toBe(2.5);
    expect(drink.status).toBe('warning');
    expect(drink.issues).toContain("Lettre 'O' corrigée en zéro");
  });

  test('mode allowCategories : détecte les catégories et place les boissons avant le premier titre dans "Divers"', () => {
    const text = `
Apéritif maison 5,00
BIÈRES AU FÛT
Jupiler 2,50
Stella 2,60
VINS:
Rouge 3,50
`;
    const res = parseDrinkList(text, { allowCategories: true });
    expect(res.categories.length).toBe(3);

    expect(res.categories[0].name).toBe('Divers');
    expect(res.categories[0].drinks.length).toBe(1);
    expect(res.categories[0].drinks[0].name).toBe('Apéritif maison');

    expect(res.categories[1].name).toBe('BIÈRES AU FÛT');
    expect(res.categories[1].icon).toBe('🍺');
    expect(res.categories[1].drinks.length).toBe(2);

    expect(res.categories[2].name).toBe('VINS');
    expect(res.categories[2].icon).toBe('🍷');
    expect(res.categories[2].drinks.length).toBe(1);
  });

  test('splitSlashes vrai sépare les boissons A / B, et faux les conserve réunies', () => {
    const text = 'Coca / Zéro 2,50';

    const resFalse = parseDrinkList(text, { splitSlashes: false });
    expect(resFalse.categories[0].drinks.length).toBe(1);
    expect(resFalse.categories[0].drinks[0].name).toBe('Coca / Zéro');
    expect(resFalse.categories[0].drinks[0].price).toBe(2.5);

    const resTrue = parseDrinkList(text, { splitSlashes: true });
    expect(resTrue.categories[0].drinks.length).toBe(2);
    expect(resTrue.categories[0].drinks[0].name).toBe('Coca');
    expect(resTrue.categories[0].drinks[0].price).toBe(2.5);
    expect(resTrue.categories[0].drinks[1].name).toBe('Zéro');
    expect(resTrue.categories[0].drinks[1].price).toBe(2.5);
  });

  test('détecte les doublons dans la liste et avec existingNames (insensible à la casse et aux accents)', () => {
    const text = `
Jupiler 2,50
jupiler 2,50
Leffe Blonde 4,00
`;
    const res = parseDrinkList(text, { existingNames: ['lèffé blonde'] });
    const drinks = res.categories[0].drinks;

    // Premier Jupiler : ok
    expect(drinks[0].status).toBe('ok');
    // Deuxième Jupiler : doublon dans la liste (warning)
    expect(drinks[1].status).toBe('warning');
    expect(drinks[1].issues).toContain('Doublon dans la liste collée');

    // Leffe Blonde : doublon avec existingNames (warning)
    expect(drinks[2].status).toBe('warning');
    expect(drinks[2].issues).toContain('Existe déjà dans le bar');
  });

  test('tronque les noms de plus de 60 caractères avec warning', () => {
    const longName = 'Cocktail Signature Extraordinaire Avec Tous Les Fruits Possibles De La Terre Et Des Mers';
    const text = `${longName} 12,00`;
    const res = parseDrinkList(text);
    const drink = res.categories[0].drinks[0];
    expect(drink.name.length).toBe(60);
    expect(drink.status).toBe('warning');
    expect(drink.issues).toEqual(expect.arrayContaining([expect.stringContaining('Nom tronqué à 60')]));
  });

  test('guessCategoryIcon couvre correctement toutes les familles', () => {
    expect(guessCategoryIcon('Bières au fût')).toBe('🍺');
    expect(guessCategoryIcon('Bière sans alcool')).toBe('🍺');
    expect(guessCategoryIcon('Vins et champagnes')).toBe('🍷');
    expect(guessCategoryIcon('Bulles & Cava')).toBe('🥂');
    expect(guessCategoryIcon('Champagne')).toBe('🥂');
    expect(guessCategoryIcon('Cocktails créatifs')).toBe('🍹');
    expect(guessCategoryIcon('Alcools forts')).toBe('🥃');
    expect(guessCategoryIcon('Softs et sodas')).toBe('💧');
    expect(guessCategoryIcon('Jus d’orange')).toBe('🧃');
    expect(guessCategoryIcon('Boissons chaudes')).toBe('☕');
    expect(guessCategoryIcon('Snacks & confiserie')).toBe('🍫');
    expect(guessCategoryIcon('Petite restauration / Paninis')).toBe('🥪');
    expect(guessCategoryIcon('Inconnu au bataillon')).toBe('🍹');
  });

  test('TEST DE BOUT EN BOUT : extrait réel de la carte du club (21 boissons, 6 catégories, 0 erreur, exactement 2 warnings)', () => {
    const clubText = `
BIÈRES AU FÛT
Carlsberg 20cl 2,50
Carlsberg 25cl 3,00
Carlsberg 40cl 4,50
Mètre de Carlsberg (11 verres) 25,00
St Hubertus Blonde 33cl 4,50
Saint-Feu 25cl 2,50
BIÈRES SANS ALCOOL
Carlsberg 0.0 25cl 2,50
Liefmans Zero 25cl 3,50
ALCOOLS
Martini / Porto 5,00
Alcool 4cl + Soft 8,00
Get 27 8,00
BULLES
Prosecco (verre) 4,00
Prosecco (bouteille) 20,00
Ruffus (bouteille uniquement) 40,00
VINS
Blanc / Rouge / Rosé (verre) 3,50
SNACKS
Mars / Twix / Snickers 2,00
Formule déjeuner (une boisson chaude / 1 croissant ou 1 pain au chocolat) 4,50
Soupe Tomate / Poulet 2,50
Panini Jambon - Fromage 5,00
Frites (Sauce Comprise) 4,00
Assiette Apéro Chaude / Froide 10,00
`;
    const res = parseDrinkList(clubText, { allowCategories: true, splitSlashes: false });

    // 1. Structure globale
    expect(res.categories.length).toBe(6);
    expect(res.stats.totalDrinks).toBe(21);
    expect(res.stats.errorCount).toBe(0);
    expect(res.stats.warningCount).toBe(2);
    expect(res.stats.okCount).toBe(19);

    // 2. Vérification des 6 catégories et répartition exacte
    const [bieresFut, bieresSansAlcool, alcools, bulles, vins, snacks] = res.categories;

    expect(bieresFut.name).toBe('BIÈRES AU FÛT');
    expect(bieresFut.drinks.length).toBe(6);
    expect(bieresFut.drinks.every((d) => d.status === 'ok')).toBe(true);

    expect(bieresSansAlcool.name).toBe('BIÈRES SANS ALCOOL');
    expect(bieresSansAlcool.drinks.length).toBe(2);
    expect(bieresSansAlcool.drinks[0].name).toBe('Carlsberg 0.0 25cl');
    expect(bieresSansAlcool.drinks[0].status).toBe('warning'); // warning: plusieurs nombres (0.0)
    expect(bieresSansAlcool.drinks[1].status).toBe('ok');

    expect(alcools.name).toBe('ALCOOLS');
    expect(alcools.drinks.length).toBe(3);
    expect(alcools.drinks[0].status).toBe('ok');
    expect(alcools.drinks[1].status).toBe('ok'); // 4cl ignoré car unité
    expect(alcools.drinks[2].name).toBe('Get 27');
    expect(alcools.drinks[2].status).toBe('warning'); // warning: plusieurs nombres (27)

    expect(bulles.name).toBe('BULLES');
    expect(bulles.drinks.length).toBe(3);
    expect(bulles.drinks.every((d) => d.status === 'ok')).toBe(true);

    expect(vins.name).toBe('VINS');
    expect(vins.drinks.length).toBe(1);
    expect(vins.drinks[0].status).toBe('ok');

    expect(snacks.name).toBe('SNACKS');
    expect(snacks.drinks.length).toBe(6);
    expect(snacks.drinks.every((d) => d.status === 'ok')).toBe(true);
  });
});
