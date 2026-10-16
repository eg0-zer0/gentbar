import {
  LIMITS,
  QR_WARN_LENGTH,
  stripControlChars,
  validateAndNormalizeSharedBar,
  encodeBarToShareLink,
  decodeBarFromShareInput,
  serializeBarToFileContent,
  parseBarFromFileContent,
  findLinkedBarBySourceId,
  findSimilarBar
} from './barShare';
import { generateQrMatrix, buildQrSvgPath } from './qrcode';
import { mockCategories, mockGentBarCategories, MENU_VERSION } from '../mock';
import { buildBaseBar, buildGentBar, createCustomBar } from './menus';

describe('barShare — Partage et réception de carte (Étape 9.7e)', () => {
  const sampleBar = createCustomBar({
    id: 'bar-chez-mimi',
    name: 'Chez Mimi',
    icon: '🍻',
    categories: [
      {
        id: 'cat-1',
        name: 'Bières',
        icon: '🍺',
        drinks: [
          { id: 'd-1', name: 'Jupiler 25cl', price: 2.5 },
          { id: 'd-2', name: 'Chouffe', price: 4.2 }
        ]
      },
      {
        id: 'cat-2',
        name: 'Softs',
        icon: '🥤',
        drinks: [{ id: 'd-3', name: 'Coca-Cola', price: 2.3 }]
      }
    ]
  });

  test('1. Aller-retour lien complet (/recevoir#c=...) : conserve nom, icône, sourceId, catégories et prix au centime', async () => {
    const { url, token, length, isLargeForQr } = await encodeBarToShareLink(
      sampleBar,
      'https://gentbar.netlify.app'
    );

    expect(url.startsWith('https://gentbar.netlify.app/recevoir#c=')).toBe(true);
    expect(token.length).toBeGreaterThan(10);
    expect(length).toBe(url.length);
    expect(isLargeForQr).toBe(false);

    // Décodage depuis l'URL complète
    const decodedFromUrl = await decodeBarFromShareInput(url);
    expect(decodedFromUrl.valid).toBe(true);
    expect(decodedFromUrl.bar.name).toBe('Chez Mimi');
    expect(decodedFromUrl.bar.icon).toBe('🍻');
    expect(decodedFromUrl.bar.sourceId).toBe(sampleBar.sourceId);
    expect(decodedFromUrl.bar.origin).toBe('custom');
    expect(decodedFromUrl.bar.categories).toHaveLength(2);
    expect(decodedFromUrl.bar.categories[0].name).toBe('Bières');
    expect(decodedFromUrl.bar.categories[0].drinks[0]).toMatchObject({
      name: 'Jupiler 25cl',
      price: 2.5,
      modified: false
    });
    expect(decodedFromUrl.bar.categories[0].drinks[1]).toMatchObject({
      name: 'Chouffe',
      price: 4.2,
      modified: false
    });

    // Décodage depuis le fragment #c=... seul
    const decodedFromHash = await decodeBarFromShareInput(`#c=${token}`);
    expect(decodedFromHash.valid).toBe(true);
    expect(decodedFromHash.bar.sourceId).toBe(sampleBar.sourceId);
  });

  test('2. Aller-retour fichier (.gentbar.json) : exporte les prix en centimes et réimporte à l’identique', () => {
    const jsonContent = serializeBarToFileContent(sampleBar);
    const parsedJson = JSON.parse(jsonContent);

    expect(parsedJson.name).toBe('Chez Mimi');
    expect(parsedJson.sourceId).toBe(sampleBar.sourceId);
    expect(parsedJson.categories[0].drinks[0]).toEqual({
      name: 'Jupiler 25cl',
      priceCents: 250
    });

    const result = parseBarFromFileContent(jsonContent);
    expect(result.valid).toBe(true);
    expect(result.bar.name).toBe('Chez Mimi');
    expect(result.bar.sourceId).toBe(sampleBar.sourceId);
    expect(result.bar.categories[0].drinks[0].price).toBe(2.5);
    expect(result.bar.categories[0].drinks[1].price).toBe(4.2);
  });

  test('3. Limites de sécurité strictes à l’import (§ 4.4)', () => {
    // Suppression des caractères de contrôle
    expect(stripControlChars('Chez\u0000 Mimi\u001F\u007F')).toBe('Chez Mimi');
    const withCtrl = validateAndNormalizeSharedBar({
      v: 1,
      n: 'Bar\u0007 Test\u001B',
      i: '🍺',
      s: 'src-test',
      c: [{ n: 'Bières\u0000', i: '🍺', d: [['Pils\u0008', 250]] }]
    });
    expect(withCtrl.valid).toBe(true);
    expect(withCtrl.bar.name).toBe('Bar Test');
    expect(withCtrl.bar.categories[0].name).toBe('Bières');
    expect(withCtrl.bar.categories[0].drinks[0].name).toBe('Pils');

    // Rejet > 40 catégories
    const tooManyCategories = Array.from({ length: LIMITS.MAX_CATEGORIES + 1 }, (_, i) => ({
      n: `Cat ${i}`,
      i: '🍺',
      d: []
    }));
    expect(
      validateAndNormalizeSharedBar({ v: 1, n: 'Bar', i: '🍺', c: tooManyCategories }).valid
    ).toBe(false);

    // Rejet > 400 boissons
    const tooManyDrinks = Array.from({ length: LIMITS.MAX_DRINKS + 1 }, (_, i) => [
      `Boisson ${i}`,
      200
    ]);
    expect(
      validateAndNormalizeSharedBar({
        v: 1,
        n: 'Bar',
        i: '🍺',
        c: [{ n: 'Tout', i: '🍺', d: tooManyDrinks }]
      }).valid
    ).toBe(false);

    // Rejet nom > 60 caractères
    const longName = 'A'.repeat(LIMITS.MAX_NAME_LENGTH + 1);
    expect(validateAndNormalizeSharedBar({ v: 1, n: longName, i: '🍺', c: [] }).valid).toBe(false);
    expect(
      validateAndNormalizeSharedBar({
        v: 1,
        n: 'Bar',
        i: '🍺',
        c: [{ n: 'Cat', i: '🍺', d: [[longName, 250]] }]
      }).valid
    ).toBe(false);

    // Rejet prix hors bornes (négatif, décimal ou > 100 000 centimes)
    expect(
      validateAndNormalizeSharedBar({
        v: 1,
        n: 'Bar',
        i: '🍺',
        c: [{ n: 'Cat', i: '🍺', d: [['Pils', -10]] }]
      }).valid
    ).toBe(false);
    expect(
      validateAndNormalizeSharedBar({
        v: 1,
        n: 'Bar',
        i: '🍺',
        c: [{ n: 'Cat', i: '🍺', d: [['Pils', 100001]] }]
      }).valid
    ).toBe(false);
    expect(
      validateAndNormalizeSharedBar({
        v: 1,
        n: 'Bar',
        i: '🍺',
        c: [{ n: 'Cat', i: '🍺', d: [['Pils', 250.5]] }]
      }).valid
    ).toBe(false);

    // Rejet icône > 2 caractères
    expect(
      validateAndNormalizeSharedBar({ v: 1, n: 'Bar', i: '🍺🍻🍷', c: [] }).valid
    ).toBe(false);
  });

  test('4. Détection de carte liée (sourceId) et de ressemblance (findSimilarBar)', () => {
    const hockeyBar = buildBaseBar(mockCategories, MENU_VERSION);
    const gentBar = buildGentBar(mockGentBarCategories, MENU_VERSION);
    const menus = [hockeyBar, gentBar, sampleBar];

    // Même sourceId sur une carte custom -> trouvé
    const linked = findLinkedBarBySourceId(menus, sampleBar.sourceId);
    expect(linked).not.toBeNull();
    expect(linked.id).toBe(sampleBar.id);

    // Les cartes de base ('rllhc', 'gentbar') ne sont jamais considérées comme cibles d'écrasement externe
    expect(findLinkedBarBySourceId(menus, hockeyBar.sourceId)).toBeNull();

    // Ressemblance par noms de boissons normalisés (insensible aux accents/casse)
    const incomingFriendBar = createCustomBar({
      name: 'Taverne de Mimi',
      icon: '🍺',
      categories: [
        {
          id: 'c1',
          name: 'Pression',
          icon: '🍺',
          drinks: [
            { id: 'x1', name: 'jupiler 25cl', price: 2.6 },
            { id: 'x2', name: 'CHOUFFE', price: 4.5 },
            { id: 'x3', name: 'Inconnue', price: 3.0 }
          ]
        }
      ]
    });

    const similarity = findSimilarBar(menus, incomingFriendBar);
    expect(similarity).not.toBeNull();
    expect(similarity.bar.id).toBe(sampleBar.id);
    expect(similarity.commonCount).toBe(2);
  });

  test('5. Génération de QR code SVG et avertissement > 1 000 caractères sur la grande carte', async () => {
    const matrix = generateQrMatrix('https://gentbar.netlify.app/recevoir#c=test');
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0].length).toBe(matrix.length);

    const { path, viewBoxSize } = buildQrSvgPath(matrix);
    expect(path.startsWith('M')).toBe(true);
    expect(viewBoxSize).toBe(matrix.length + 4);

    // La carte complète du club de hockey (102 boissons) dépasse 1 000 caractères en lien non compressé ou dense
    const hockeyBar = buildBaseBar(mockCategories, MENU_VERSION);
    const hockeyShare = await encodeBarToShareLink(hockeyBar);
    expect(hockeyShare.length > QR_WARN_LENGTH).toBe(hockeyShare.isLargeForQr);
  });
});
