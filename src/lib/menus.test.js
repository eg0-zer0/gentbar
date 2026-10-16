import {
  BASE_BAR_ID,
  BASE_SOURCE_ID,
  GENTBAR_BAR_ID,
  SCHEMA_VERSION,
  createBar,
  buildBaseBar,
  buildGentBar,
  migrateLegacyToMenus,
  getActiveBar,
  updateBarCategories,
  withBarId,
  isBaseBar,
  countBarDrinks,
  createCustomBar,
  duplicateBar,
  renameBar,
  removeBar
} from './menus';
import { normalizeMenus } from './storage';
import { mockCategories, mockGentBarCategories, MENU_VERSION } from '../mock';

describe('Modèle multi-bars et migration (Étapes 9.7b & 9.7d)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('1. Migration d\'une carte identique à la base : aucun modified: true', () => {
    const legacyCategories = JSON.parse(JSON.stringify(mockCategories));
    const result = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });

    expect(result.activeMenuId).toBe(BASE_BAR_ID);
    expect(result.menus).toHaveLength(1);

    const bar = result.menus[0];
    expect(bar.id).toBe(BASE_BAR_ID);
    expect(bar.sourceId).toBe(BASE_SOURCE_ID);
    expect(bar.name).toBe('Club de hockey');
    expect(bar.icon).toBe('🏒');
    expect(bar.origin).toBe('base');

    const modifiedCats = bar.categories.filter((c) => c.modified === true);
    const modifiedDrinks = bar.categories
      .flatMap((c) => c.drinks)
      .filter((d) => d.modified === true);

    expect(modifiedCats).toHaveLength(0);
    expect(modifiedDrinks).toHaveLength(0);
  });

  test('2. Un prix modifié : un seul modified: true, la valeur de l\'utilisateur est conservée', () => {
    const legacyCategories = JSON.parse(JSON.stringify(mockCategories));
    const targetDrinkId = legacyCategories[0].drinks[0].id;
    legacyCategories[0].drinks[0].price = 9.99;

    const result = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });

    const bar = result.menus[0];
    const modifiedCats = bar.categories.filter((c) => c.modified === true);
    const modifiedDrinks = bar.categories
      .flatMap((c) => c.drinks)
      .filter((d) => d.modified === true);

    expect(modifiedCats).toHaveLength(0);
    expect(modifiedDrinks).toHaveLength(1);
    expect(modifiedDrinks[0].id).toBe(targetDrinkId);
    expect(modifiedDrinks[0].price).toBe(9.99);
  });

  test('3. Une boisson ajoutée par l\'utilisateur : conservée, modified: true', () => {
    const legacyCategories = JSON.parse(JSON.stringify(mockCategories));
    const customDrink = {
      id: 'bieres-fut-custom-ipa',
      name: 'IPA Maison',
      price: 4.2
    };
    legacyCategories[0].drinks.push(customDrink);

    const result = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });

    const bar = result.menus[0];
    const allDrinks = bar.categories.flatMap((c) => c.drinks);
    const foundCustom = allDrinks.find((d) => d.id === 'bieres-fut-custom-ipa');

    expect(foundCustom).toBeDefined();
    expect(foundCustom.name).toBe('IPA Maison');
    expect(foundCustom.price).toBe(4.2);
    expect(foundCustom.modified).toBe(true);

    const modifiedDrinks = allDrinks.filter((d) => d.modified === true);
    expect(modifiedDrinks).toHaveLength(1);
  });

  test('4. Catégories absentes, vides ou invalides : repli sur la base, sans plantage', () => {
    const expectedBase = buildBaseBar(mockCategories, MENU_VERSION);

    const cases = [
      undefined,
      null,
      [],
      'corrupted',
      123,
      {},
      [null, undefined, { invalid: true }, { id: '', name: '', drinks: 'not-array' }]
    ];

    cases.forEach((invalidInput) => {
      const result = migrateLegacyToMenus({
        legacyCategories: invalidInput,
        baseCategories: mockCategories,
        baseVersion: MENU_VERSION
      });

      expect(result.activeMenuId).toBe(BASE_BAR_ID);
      expect(result.menus).toHaveLength(1);
      expect(result.menus[0]).toEqual(expectedBase);
    });
  });

  test('5. Idempotence : migrer deux fois donne exactement le même résultat', () => {
    const legacyCategories = JSON.parse(JSON.stringify(mockCategories));
    legacyCategories[0].drinks[0].price = 3.75;
    legacyCategories[1].drinks.push({
      id: 'custom-beer',
      name: 'Spéciale Club',
      price: 5.0
    });

    const firstMigration = migrateLegacyToMenus({
      legacyCategories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });

    const secondMigration = migrateLegacyToMenus({
      legacyCategories: firstMigration.menus[0].categories,
      baseCategories: mockCategories,
      baseVersion: MENU_VERSION
    });

    expect(secondMigration).toEqual(firstMigration);
  });

  test('6. withBarId n\'écrase jamais un barId existant', () => {
    const lines = [
      { drinkId: 'd1', drinkName: 'Carlsberg', price: 2.5, quantity: 2 },
      { drinkId: 'd2', drinkName: 'Mojito', price: 7.0, quantity: 1, barId: 'chez-mimi' },
      {
        id: 'order-1',
        total: 9.5,
        barId: 'buvette-stade',
        items: [
          { drinkId: 'd1', drinkName: 'Carlsberg', price: 2.5, quantity: 1 },
          { drinkId: 'd2', drinkName: 'Mojito', price: 7.0, quantity: 1, barId: 'chez-mimi' }
        ]
      }
    ];

    const updated = withBarId(lines, BASE_BAR_ID);

    expect(updated[0].barId).toBe(BASE_BAR_ID);
    expect(updated[1].barId).toBe('chez-mimi');
    expect(updated[2].barId).toBe('buvette-stade');
    expect(updated[2].items[0].barId).toBe(BASE_BAR_ID);
    expect(updated[2].items[1].barId).toBe('chez-mimi');
  });

  test('7. normalizeMenus rejette un bar invalide sans perdre les autres et sauvegarde la valeur brute', () => {
    const validBar1 = buildBaseBar(mockCategories, MENU_VERSION);
    const validBar2 = createBar({
      id: 'chez-mimi',
      sourceId: 'gentbar-chez-mimi',
      name: 'Chez Mimi',
      icon: '🍻',
      origin: 'custom',
      categories: [
        {
          id: 'cat-1',
          name: 'Bières',
          icon: '🍺',
          drinks: [{ id: 'd-1', name: 'Pils', price: 2.5 }]
        }
      ]
    });

    const invalidBarMissingId = { name: 'Sans ID', categories: [] };
    const invalidBarCorruptedCats = {
      id: 'bad-cats',
      name: 'Corrompu',
      categories: [{ bad: true }]
    };

    const rawInput = [validBar1, invalidBarMissingId, validBar2, invalidBarCorruptedCats];
    localStorage.setItem('menus', JSON.stringify(rawInput));

    const normalized = normalizeMenus(rawInput);

    expect(normalized).not.toBeNull();
    expect(normalized.dropped).toBe(2);
    expect(normalized.value).toHaveLength(2);
    expect(normalized.value[0].id).toBe(BASE_BAR_ID);
    expect(normalized.value[1].id).toBe('chez-mimi');
    expect(localStorage.getItem('menus__backup')).not.toBeNull();
  });

  test('8. getActiveBar et updateBarCategories fonctionnent avec repli sûr', () => {
    const bar1 = buildBaseBar(mockCategories, MENU_VERSION);
    const bar2 = createBar({
      id: 'bar-2',
      name: 'Deuxième Bar',
      categories: [{ id: 'c2', name: 'Softs', drinks: [] }]
    });

    const menus = [bar1, bar2];
    expect(getActiveBar(menus, 'bar-2').id).toBe('bar-2');
    expect(getActiveBar(menus, 'inexistant').id).toBe(BASE_BAR_ID);
    expect(SCHEMA_VERSION).toBe(2);

    const updated = updateBarCategories(menus, 'bar-2', (prev) => [
      ...prev,
      { id: 'c3', name: 'Vins', drinks: [] }
    ]);
    expect(updated[1].categories).toHaveLength(2);
    expect(updated[0].categories).toHaveLength(bar1.categories.length);
  });

  test('9. createCustomBar, duplicateBar, renameBar et countBarDrinks (Étape 9.7d)', () => {
    const emptyBar = createCustomBar({ name: '  Buvette du Stade  ', icon: '☕' });
    expect(emptyBar.origin).toBe('custom');
    expect(emptyBar.name).toBe('Buvette du Stade');
    expect(emptyBar.icon).toBe('☕');
    expect(emptyBar.categories).toEqual([]);
    expect(countBarDrinks(emptyBar)).toBe(0);
    expect(isBaseBar(emptyBar)).toBe(false);

    const gentBar = buildGentBar(mockGentBarCategories, MENU_VERSION);
    expect(isBaseBar(gentBar)).toBe(true);
    expect(countBarDrinks(gentBar)).toBe(14);

    const copied = duplicateBar(gentBar, { name: 'GentBar Soirée Privée', icon: '🎉' });
    expect(copied.origin).toBe('custom');
    expect(copied.id).not.toBe(gentBar.id);
    expect(copied.sourceId).not.toBe(gentBar.sourceId);
    expect(copied.name).toBe('GentBar Soirée Privée');
    expect(copied.icon).toBe('🎉');
    expect(countBarDrinks(copied)).toBe(14);

    // Indépendance de la copie : modifier la copie ne touche pas gentBar
    const originalPrice = gentBar.categories[0].drinks[0].price;
    copied.categories[0].drinks[0].price = 99;
    expect(gentBar.categories[0].drinks[0].price).toBe(originalPrice);

    const renamedMenus = renameBar([gentBar, copied], copied.id, {
      name: 'Chez Mimi',
      icon: '🍻'
    });
    expect(renamedMenus[1].name).toBe('Chez Mimi');
    expect(renamedMenus[1].icon).toBe('🍻');
  });

  test('10. removeBar refuse de supprimer les 2 cartes de base officielles et replie activeMenuId si le bar actif est supprimé (Étape 9.7d)', () => {
    const hockeyBar = buildBaseBar(mockCategories, MENU_VERSION);
    const gentBar = buildGentBar(mockGentBarCategories, MENU_VERSION);
    const customBar = createCustomBar({ id: 'chez-mimi', name: 'Chez Mimi', icon: '🍻' });
    const menus = [hockeyBar, gentBar, customBar];

    // Refus de supprimer Club de hockey ('rllhc')
    const attemptHockey = removeBar(menus, BASE_BAR_ID, BASE_BAR_ID);
    expect(attemptHockey.removed).toBe(false);
    expect(attemptHockey.menus).toHaveLength(3);

    // Refus de supprimer GentBar ('gentbar')
    const attemptGent = removeBar(menus, GENTBAR_BAR_ID, GENTBAR_BAR_ID);
    expect(attemptGent.removed).toBe(false);
    expect(attemptGent.menus).toHaveLength(3);

    // Suppression autorisée de 'chez-mimi' (qui était actif) -> repli sur 'rllhc'
    const removedCustom = removeBar(menus, 'chez-mimi', 'chez-mimi');
    expect(removedCustom.removed).toBe(true);
    expect(removedCustom.menus).toHaveLength(2);
    expect(removedCustom.activeMenuId).toBe(BASE_BAR_ID);
  });
});

