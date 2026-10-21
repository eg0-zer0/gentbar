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
  test('Google Lens / OCR : fusionne automatiquement les prix sur lignes séparées et détecte les catégories en casse mixte', () => {
    const lensText = `
Boissons alcoolisées

Bieres pression 25 cl

2€

Spritz

4€
`;
    const res = parseDrinkList(lensText, { allowCategories: true });
    expect(res.categories.length).toBe(1);
    expect(res.categories[0].name).toBe('Boissons alcoolisées');
    expect(res.categories[0].drinks.length).toBe(2);

    expect(res.categories[0].drinks[0].name).toBe('Bieres pression 25 cl');
    expect(res.categories[0].drinks[0].price).toBe(2);
    expect(res.categories[0].drinks[0].status).toBe('ok');

    expect(res.categories[0].drinks[1].name).toBe('Spritz');
    expect(res.categories[0].drinks[1].price).toBe(4);
    expect(res.categories[0].drinks[1].status).toBe('ok');

    expect(res.stats.errorCount).toBe(0);
    expect(res.stats.totalDrinks).toBe(2);
  });

  test('Google Lens / OCR en mode mono-catégorie : associe chaque prix à la boisson au-dessus', () => {
    const text = `
Jupiler
2,50 €
Coca-Cola 33cl
2.00
`;
    const res = parseDrinkList(text, { allowCategories: false });
    const drinks = res.categories[0].drinks;
    expect(drinks.length).toBe(2);
    expect(drinks[0].name).toBe('Jupiler');
    expect(drinks[0].price).toBe(2.5);
    expect(drinks[1].name).toBe('Coca-Cola 33cl');
    expect(drinks[1].price).toBe(2);
  });
  test('Google Lens réel (Golf Haut Bugey) : 3 catégories réelles, zéro Divers, boissons et prix correctement rattachés', () => {
    const text = `Boissons sans alcool

Jus de fruits.....

3€

Cocktail sans alcool.

3€

Eau 50cl.

2€

Eau 1L

3€

Eau pétillante 33cl.

3€

Soda 33cl

3€

Soda 25cl.

3€

Boissons avec alcool

Bière galopin 15cl.

2€

Bière pression 25cl.

2,50 €

Bière pression 50cl.

5€

10 €

Bière pression pichet 1L.

4€

Bière bouteille

4€

Stitz

2€

Vin verre 12,5cl

3€

Vin verre + crème de fruits.

Vin pichet 25cl.

5€

9€

Vin pichet 50cl.

15 €

Vin pichet 1L...

18 €

Vin bouteille (Rouge, rosé, blanc).

Mousseux coupe..

4€

19 €

Mousseux bouteillle

45 €

Champagne bouteille.

Boissons chaudes

Café

1,50 €

Café décaféiné.

1,50 €

Thé

2,50 €`;

    const res = parseDrinkList(text, { allowCategories: true });

    // Exactement 3 catégories détectées (aucun Divers)
    expect(res.categories.length).toBe(3);
    expect(res.categories[0].name).toBe('Boissons sans alcool');
    expect(res.categories[0].icon).toBe('💧');
    expect(res.categories[0].drinks.length).toBe(7);
    expect(res.categories[0].drinks[0].name).toBe('Jus de fruits');
    expect(res.categories[0].drinks[0].price).toBe(3);
    expect(res.categories[0].drinks[0].status).toBe('ok');

    expect(res.categories[1].name).toBe('Boissons avec alcool');
    expect(res.categories[1].drinks.length).toBeGreaterThanOrEqual(10);

    expect(res.categories[2].name).toBe('Boissons chaudes');
    expect(res.categories[2].icon).toBe('☕');
    expect(res.categories[2].drinks.length).toBe(3);
    expect(res.categories[2].drinks[0].name).toBe('Café');
    expect(res.categories[2].drinks[0].price).toBe(1.5);
    expect(res.categories[2].drinks[1].name).toBe('Café décaféiné');
    expect(res.categories[2].drinks[1].price).toBe(1.5);
    expect(res.categories[2].drinks[2].name).toBe('Thé');
    expect(res.categories[2].drinks[2].price).toBe(2.5);
  });

  test("OCR : reconnaît la lettre 'E' / 'e' comme symbole monétaire avec avertissement", () => {
    const text = 'Mojito 10E\nMargarita 12e\nExpresso 2E';
    const res = parseDrinkList(text);
    const drinks = res.categories[0].drinks;
    expect(drinks.length).toBe(3);
    expect(drinks[0].name).toBe('Mojito');
    expect(drinks[0].price).toBe(10);
    expect(drinks[0].status).toBe('warning');
    expect(drinks[0].issues).toContain("Lettre 'E' reconnue comme symbole €");

    expect(drinks[1].name).toBe('Margarita');
    expect(drinks[1].price).toBe(12);
    expect(drinks[1].status).toBe('warning');

    expect(drinks[2].name).toBe('Expresso');
    expect(drinks[2].price).toBe(2);
  });

  test('Multi-tarifs : découpe les doubles prix (verre / bouteille) avec splitSlashes', () => {
    const text = `Whisky 10€ le verre / 50€ la bouteille
Vodka 8€ le verre/35€ la bouteille
Rouge: 9€ le verre/35 E la bouteille`;
    const res = parseDrinkList(text, { splitSlashes: true });
    const drinks = res.categories[0].drinks;
    expect(drinks.length).toBe(6);

    expect(drinks[0].name).toBe('Whisky (le verre)');
    expect(drinks[0].price).toBe(10);

    expect(drinks[1].name).toBe('Whisky (la bouteille)');
    expect(drinks[1].price).toBe(50);

    expect(drinks[2].name).toBe('Vodka (le verre)');
    expect(drinks[2].price).toBe(8);

    expect(drinks[3].name).toBe('Vodka (la bouteille)');
    expect(drinks[3].price).toBe(35);

    expect(drinks[4].name).toBe('Rouge (le verre)');
    expect(drinks[4].price).toBe(9);

    expect(drinks[5].name).toBe('Rouge (la bouteille)');
    expect(drinks[5].price).toBe(35);
  });

  test('OCR & Tarifs : fusionne une ligne de tarif (verre/bouteille) avec le nom de boisson sur la ligne précédente', () => {
    const text = `Whisky
10€ le verre/50€ la bouteille
Vodka
8€ le verre/35€ la bouteille`;
    const res = parseDrinkList(text, { splitSlashes: true });
    const drinks = res.categories[0].drinks;
    expect(drinks.length).toBe(4);
    expect(drinks[0].name).toBe('Whisky (le verre)');
    expect(drinks[0].price).toBe(10);
    expect(drinks[1].name).toBe('Whisky (la bouteille)');
    expect(drinks[1].price).toBe(50);
    expect(drinks[2].name).toBe('Vodka (le verre)');
    expect(drinks[2].price).toBe(8);
    expect(drinks[3].name).toBe('Vodka (la bouteille)');
    expect(drinks[3].price).toBe(35);
  });

  test('Carte complexe utilisateur (affiche 2 colonnes avec Mojito 10E et doubles tarifs)', () => {
    const text = `COCETAILS CLASSIQUES
Mojito
10E
Margarita
12€
Cosmopolitan
12€
SPIRITUEUX
Whisky
10€ le verre/50€ la bouteille
Vodka
8€ le verre/35€ la bouteille
VINS
Rouge:
9€ le verre/35 E la bouteille
Blanc
8€ le verre/30€ la bouteille`;

    const res = parseDrinkList(text, { allowCategories: true, splitSlashes: true });
    expect(res.categories.length).toBe(3);

    // Cocktails
    const cocktails = res.categories[0];
    expect(cocktails.name).toBe('COCETAILS CLASSIQUES');
    expect(cocktails.drinks[0].name).toBe('Mojito');
    expect(cocktails.drinks[0].price).toBe(10);
    expect(cocktails.drinks[0].status).toBe('warning'); // hasOcrE

    // Spiritueux
    const spirits = res.categories[1];
    expect(spirits.name).toBe('SPIRITUEUX');
    expect(spirits.drinks[0].name).toBe('Whisky (le verre)');
    expect(spirits.drinks[0].price).toBe(10);
    expect(spirits.drinks[1].name).toBe('Whisky (la bouteille)');
    expect(spirits.drinks[1].price).toBe(50);
    expect(spirits.drinks[2].name).toBe('Vodka (le verre)');
    expect(spirits.drinks[2].price).toBe(8);
    expect(spirits.drinks[3].name).toBe('Vodka (la bouteille)');
    expect(spirits.drinks[3].price).toBe(35);

    // Vins
    const wines = res.categories[2];
    expect(wines.name).toBe('VINS');
    expect(wines.drinks[0].name).toBe('Rouge (le verre)');
    expect(wines.drinks[0].price).toBe(9);
    expect(wines.drinks[1].name).toBe('Rouge (la bouteille)');
    expect(wines.drinks[1].price).toBe(35);
  });

  test('Carte de buvette : sépare les listes de boissons ou viennoiseries avec virgules (splitSlashes)', () => {
    const text = `VIENNOISERIES
Snikers, Kitkat, Chips 0,50 €
SOFTS
Coca, Oasis, Ice Tea 1,50 €`;
    const res = parseDrinkList(text, { allowCategories: true, splitSlashes: true });
    expect(res.categories.length).toBe(2);

    const viennoiseries = res.categories[0].drinks;
    expect(viennoiseries.length).toBe(3);
    expect(viennoiseries[0].name).toBe('Snikers');
    expect(viennoiseries[0].price).toBe(0.5);
    expect(viennoiseries[1].name).toBe('Kitkat');
    expect(viennoiseries[1].price).toBe(0.5);
    expect(viennoiseries[2].name).toBe('Chips');
    expect(viennoiseries[2].price).toBe(0.5);

    const softs = res.categories[1].drinks;
    expect(softs.length).toBe(3);
    expect(softs[0].name).toBe('Coca');
    expect(softs[0].price).toBe(1.5);
    expect(softs[1].name).toBe('Oasis');
    expect(softs[1].price).toBe(1.5);
    expect(softs[2].name).toBe('Ice Tea');
    expect(softs[2].price).toBe(1.5);
  });
});
