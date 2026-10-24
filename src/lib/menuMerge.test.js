import { mergeMenus, summarizeReport } from './menuMerge';
import {
  BASE_BAR_ID,
  GENTBAR_BAR_ID,
  createBar,
  buildDefaultBaseBars,
  appendDeletedIds,
  syncOrdersWithBar
} from './menus';
import { mockCategories, mockGentBarCategories, MENU_VERSION } from '../mock';

describe('Moteur de fusion mergeMenus et utilitaires 9.7c', () => {
  const makeSampleLocalBar = () =>
    createBar({
      id: 'custom-bar',
      name: 'Soirée Vendredi',
      icon: '🍻',
      origin: 'custom',
      baseVersion: '1',
      deletedIds: ['deleted-drink-1'],
      categories: [
        {
          id: 'cat-bieres',
          name: 'Bières',
          icon: '🍺',
          modified: false,
          drinks: [
            { id: 'd-blonde', name: 'Blonde', price: 3.0, icon: '🍺', modified: false },
            { id: 'd-ipa', name: 'IPA Maison', price: 4.5, icon: '🍺', modified: true },
            { id: 'd-stout', name: 'Stout', price: 5.0, icon: '🍺', modified: true },
            { id: 'd-local-only', name: 'Cuvée Secrète', price: 6.0, icon: '🍺', modified: true }
          ]
        }
      ]
    });

  const makeSampleIncomingBar = () => ({
    baseVersion: '2',
    categories: [
      {
        id: 'cat-bieres',
        name: 'Bières',
        icon: '🍺',
        drinks: [
          { id: 'd-blonde', name: 'Blonde', price: 3.5, icon: '🍺' },
          { id: 'd-ipa', name: 'IPA Maison', price: 4.0, icon: '🍺' },
          { id: 'd-stout', name: 'Stout', price: 5.0, icon: '🍺' },
          { id: 'd-ambree', name: 'Ambrée', price: 3.8, icon: '🍺' },
          { id: 'deleted-drink-1', name: 'Ancienne Bière', price: 2.5, icon: '🍺' }
        ]
      },
      {
        id: 'cat-softs',
        name: 'Softs',
        icon: '🥤',
        drinks: [
          { id: 'd-cola', name: 'Cola', price: 2.0, icon: '🥤' }
        ]
      }
    ]
  });

  test('1. boisson non modifiée : prix mis à jour, listée dans report.updated', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const blonde = bar.categories[0].drinks.find((d) => d.id === 'd-blonde');
    expect(blonde.price).toBe(3.5);
    expect(blonde.modified).toBe(false);
    expect(report.updated).toEqual([
      expect.objectContaining({
        id: 'd-blonde',
        name: 'Blonde',
        oldPrice: 3.0,
        newPrice: 3.5
      })
    ]);
    // Pureté : l'argument local n'a pas été muté
    expect(local.categories[0].drinks[0].price).toBe(3.0);
  });

  test('2. boisson modifiée localement (modified: true) : prix local conservé, listée dans report.kept avec ancien et nouveau prix', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const ipa = bar.categories[0].drinks.find((d) => d.id === 'd-ipa');
    expect(ipa.price).toBe(4.5);
    expect(ipa.modified).toBe(true);
    expect(report.kept).toEqual([
      expect.objectContaining({
        id: 'd-ipa',
        name: 'IPA Maison',
        oldPrice: 4.5,
        newPrice: 4.0,
        localPrice: 4.5,
        incomingPrice: 4.0
      })
    ]);
  });

  test('3. boisson modifiée localement mais identique au incoming : conservée, PAS listée dans report.kept', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const stout = bar.categories[0].drinks.find((d) => d.id === 'd-stout');
    expect(stout.price).toBe(5.0);
    expect(stout.modified).toBe(true);
    expect(report.kept.some((k) => k.id === 'd-stout')).toBe(false);
  });

  test('4. nouvelle boisson dans une catégorie existante : ajoutée en fin de catégorie, modified: false, listée dans report.added', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const bieresDrinks = bar.categories[0].drinks;
    const lastDrink = bieresDrinks[bieresDrinks.length - 1];
    expect(lastDrink).toMatchObject({
      id: 'd-ambree',
      name: 'Ambrée',
      price: 3.8,
      modified: false
    });
    expect(report.added).toContainEqual(
      expect.objectContaining({
        categoryId: 'cat-bieres',
        id: 'd-ambree',
        name: 'Ambrée',
        price: 3.8
      })
    );
  });

  test('5. nouvelle catégorie entière : ajoutée en fin de liste, listée dans report.addedCategories et ses boissons dans report.added', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    expect(bar.categories).toHaveLength(2);
    expect(bar.categories[1]).toMatchObject({
      id: 'cat-softs',
      name: 'Softs',
      modified: false
    });
    expect(report.addedCategories).toEqual([
      expect.objectContaining({ id: 'cat-softs', name: 'Softs' })
    ]);
    expect(report.added).toContainEqual(
      expect.objectContaining({
        categoryId: 'cat-softs',
        id: 'd-cola',
        name: 'Cola',
        price: 2.0
      })
    );
  });

  test('6. boisson supprimée localement (id dans deletedIds) : PAS réintroduite et deletedIds préservé', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const allDrinkIds = bar.categories.flatMap((c) => c.drinks.map((d) => d.id));
    expect(allDrinkIds).not.toContain('deleted-drink-1');
    expect(report.added.some((a) => a.id === 'deleted-drink-1')).toBe(false);
    expect(bar.deletedIds).toEqual(['deleted-drink-1']);
    expect(bar.baseVersion).toBe('2');
  });

  test('7. boisson présente en local mais absente du incoming : conservée, listée dans report.missing', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming);

    const secret = bar.categories[0].drinks.find((d) => d.id === 'd-local-only');
    expect(secret).toBeDefined();
    expect(secret.price).toBe(6.0);
    expect(report.missing).toEqual([
      expect.objectContaining({
        categoryId: 'cat-bieres',
        id: 'd-local-only',
        name: 'Cuvée Secrète',
        price: 6.0
      })
    ]);
  });

  test('8. matchBy: "name" : appariement insensible à la casse et aux accents même avec des id différents', () => {
    const local = createBar({
      id: 'ami-local',
      name: 'Carte Ami',
      categories: [
        {
          id: 'cat-1',
          name: 'Bières Artisanales',
          icon: '🍺',
          modified: false,
          drinks: [
            { id: 'local-1', name: 'Bière Pression', price: 3.0, icon: '🍺', modified: false }
          ]
        }
      ]
    });

    const incoming = {
      categories: [
        {
          id: 'other-cat-99',
          name: 'bieres artisanales',
          icon: '🍺',
          drinks: [
            { id: 'friend-id-42', name: 'biere pression', price: 3.5, icon: '🍺' },
            { id: 'friend-id-43', name: 'Triple Dorée', price: 4.5, icon: '🍺' }
          ]
        }
      ]
    };

    const { bar, report } = mergeMenus(local, incoming, { matchBy: 'name' });
    expect(bar.categories).toHaveLength(1);
    expect(bar.categories[0].drinks).toHaveLength(2);
    // L'id local est préservé mais le prix est mis à jour
    expect(bar.categories[0].drinks[0]).toMatchObject({
      id: 'local-1',
      price: 3.5,
      modified: false
    });
    expect(report.updated).toHaveLength(1);
    expect(report.added).toHaveLength(1);
  });

  test('9. overwriteModified: true : les éléments modifiés sont mis à jour et repassent à modified: false', () => {
    const local = makeSampleLocalBar();
    const incoming = makeSampleIncomingBar();
    const { bar, report } = mergeMenus(local, incoming, { overwriteModified: true });

    const ipa = bar.categories[0].drinks.find((d) => d.id === 'd-ipa');
    expect(ipa.price).toBe(4.0);
    expect(ipa.modified).toBe(false);
    expect(report.kept).toHaveLength(0);
    expect(report.updated).toContainEqual(
      expect.objectContaining({
        id: 'd-ipa',
        oldPrice: 4.5,
        newPrice: 4.0
      })
    );
    expect(summarizeReport(report)).toBe('2 ajoutées · 2 prix mis à jour');
  });

  test('10. syncOrdersWithBar : met à jour nom et prix des lignes connues, laisse intactes les lignes inconnues, conserve barId', () => {
    const bar = createBar({
      id: BASE_BAR_ID,
      name: 'Club de hockey',
      categories: [
        {
          id: 'bieres',
          name: 'Bières',
          drinks: [
            { id: 'blonde-25', name: 'Blonde 25cl (Nouveau)', price: 3.2, icon: '🍺' }
          ]
        }
      ]
    });

    const orders = [
      { drinkId: 'blonde-25', drinkName: 'Blonde 25cl', price: 2.5, quantity: 2, barId: BASE_BAR_ID },
      { drinkId: 'custom-99', drinkName: 'Boisson Ami', price: 4.0, quantity: 1, barId: 'ami-bar' }
    ];

    const synced = syncOrdersWithBar(orders, bar);
    expect(synced).toEqual([
      {
        drinkId: 'blonde-25',
        drinkName: 'Blonde 25cl (Nouveau)',
        price: 3.2,
        quantity: 2,
        barId: BASE_BAR_ID
      },
      {
        drinkId: 'custom-99',
        drinkName: 'Boisson Ami',
        price: 4.0,
        quantity: 1,
        barId: 'ami-bar'
      }
    ]);
    // Pureté : le tableau orders d'origine est intact
    expect(orders[0].price).toBe(2.5);
  });

  test('Bonus : buildDefaultBaseBars construit les 2 bars de base officiels (Club de hockey et GentBar) et appendDeletedIds plafonne à 500 sans doublon', () => {
    const baseBars = buildDefaultBaseBars(mockCategories, mockGentBarCategories, MENU_VERSION);
    expect(baseBars).toHaveLength(2);
    expect(baseBars[0]).toMatchObject({
      id: BASE_BAR_ID,
      name: 'Club de hockey',
      icon: '🏒',
      origin: 'base',
      baseVersion: MENU_VERSION
    });
    expect(baseBars[1]).toMatchObject({
      id: GENTBAR_BAR_ID,
      name: 'GentBar',
      icon: '🍹',
      origin: 'base',
      baseVersion: MENU_VERSION
    });
    expect(baseBars[1].categories.map((c) => c.name)).toEqual([
      'Cocktails',
      'Bières',
      'Vins',
      'Softs'
    ]);

    const manyIds = Array.from({ length: 505 }, (_, i) => `id-${i}`);
    const capped = appendDeletedIds(manyIds, ['id-504', 'id-505']);
    expect(capped).toHaveLength(500);
    expect(capped[capped.length - 1]).toBe('id-505');
  });
});
