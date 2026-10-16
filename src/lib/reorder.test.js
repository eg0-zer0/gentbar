import { reorderIntoCart } from './reorder';
import { BASE_BAR_ID } from './menus';
import { toast } from 'sonner';
import { formatOrderSummary } from '../components/ShareButtons';
import { formatPrice } from './format';

jest.mock('sonner', () => {
  const fn = jest.fn();
  fn.success = jest.fn();
  fn.warning = jest.fn();
  fn.error = jest.fn();
  fn.info = jest.fn();
  return { toast: fn };
});

describe('reorderIntoCart — Recommander une commande (E-8, § 4.6 multi-bars)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const baseMenus = [
    {
      id: BASE_BAR_ID,
      name: 'Club de hockey',
      icon: '🏒',
      categories: [
        {
          id: 'cat-bieres',
          name: 'Bières',
          drinks: [
            { id: 'carlsberg-25', name: 'Carlsberg 25cl', price: 2.7 },
            { id: 'duvel', name: 'Duvel', price: 4.5 }
          ]
        }
      ]
    },
    {
      id: 'bar-mimi',
      name: 'Chez Mimi',
      icon: '🍻',
      categories: [
        {
          id: 'cat-cocktails',
          name: 'Cocktails',
          drinks: [
            { id: 'mojito', name: 'Mojito', price: 7.0 },
            { id: 'duvel', name: 'Duvel Mimi', price: 4.8 } // même drinkId mais dans un bar différent
          ]
        }
      ]
    }
  ];

  test('1. Commande vide : renvoie le panier sans changement et notifie une erreur', () => {
    const currentOrders = [{ drinkId: 'carlsberg-25', quantity: 1, price: 2.7, barId: BASE_BAR_ID }];
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: { items: [] },
      currentOrders,
      menus: baseMenus,
      onOrdersUpdated
    });

    expect(result).toBe(currentOrders);
    expect(onOrdersUpdated).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Aucun article à recommander dans cette commande.');
  });

  test('2. Recommandation multi-bars : résout les boissons dans leurs bars respectifs et cumule par (drinkId, barId)', () => {
    const currentOrders = [
      { drinkId: 'carlsberg-25', drinkName: 'Carlsberg 25cl', quantity: 1, price: 2.7, barId: BASE_BAR_ID }
    ];
    const orderToReorder = {
      items: [
        { drinkId: 'carlsberg-25', drinkName: 'Carlsberg 25cl', quantity: 2, price: 2.5, barId: BASE_BAR_ID },
        { drinkId: 'mojito', drinkName: 'Mojito', quantity: 1, price: 6.5, barId: 'bar-mimi' }
      ]
    };
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: orderToReorder,
      currentOrders,
      menus: baseMenus,
      onOrdersUpdated
    });

    expect(onOrdersUpdated).toHaveBeenCalled();
    expect(result).toHaveLength(2);

    // Carlsberg cumulée : 1 + 2 = 3, prix mis à jour à 2.70 € depuis le menu
    const carlsberg = result.find(o => o.drinkId === 'carlsberg-25' && o.barId === BASE_BAR_ID);
    expect(carlsberg).toBeDefined();
    expect(carlsberg.quantity).toBe(3);
    expect(carlsberg.price).toBe(2.7);

    // Mojito ajouté au panier pour 'bar-mimi' avec prix actuel 7.00 €
    const mojito = result.find(o => o.drinkId === 'mojito' && o.barId === 'bar-mimi');
    expect(mojito).toBeDefined();
    expect(mojito.quantity).toBe(1);
    expect(mojito.price).toBe(7.0);

    expect(toast.success).toHaveBeenCalledWith(
      'Commande ajoutée au panier',
      expect.objectContaining({ description: expect.stringContaining('3 boissons') })
    );
  });

  test('3. Deux boissons avec même drinkId mais des bars différents ne fusionnent pas', () => {
    const currentOrders = [
      { drinkId: 'duvel', drinkName: 'Duvel', quantity: 1, price: 4.5, barId: BASE_BAR_ID }
    ];
    const orderToReorder = {
      items: [
        { drinkId: 'duvel', drinkName: 'Duvel Mimi', quantity: 2, price: 4.8, barId: 'bar-mimi' }
      ]
    };
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: orderToReorder,
      currentOrders,
      menus: baseMenus,
      onOrdersUpdated
    });

    expect(result).toHaveLength(2);
    expect(result.find(o => o.drinkId === 'duvel' && o.barId === BASE_BAR_ID).quantity).toBe(1);
    expect(result.find(o => o.drinkId === 'duvel' && o.barId === 'bar-mimi').quantity).toBe(2);
  });

  test('4. Bar supprimé : avertit par toast spécifique et ajoute les boissons des bars valides', () => {
    const orderToReorder = {
      items: [
        { drinkId: 'carlsberg-25', drinkName: 'Carlsberg 25cl', quantity: 1, barId: BASE_BAR_ID },
        { drinkId: 'old-drink', drinkName: 'Gin Tonic', quantity: 2, barId: 'bar-disparu' }
      ]
    };
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: orderToReorder,
      currentOrders: [],
      menus: baseMenus, // 'bar-disparu' n'est pas dans baseMenus
      onOrdersUpdated
    });

    // Seul Carlsberg est ajouté
    expect(result).toHaveLength(1);
    expect(result[0].drinkId).toBe('carlsberg-25');

    // Notification toast du bar supprimé
    jest.runAllTimers();
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining("« Gin Tonic » n'est plus disponible (bar supprimé)"),
      expect.any(Object)
    );
  });

  test('5. Boisson disparue du menu d\'un bar existant : avertit « n\'est plus au menu »', () => {
    const orderToReorder = {
      items: [
        { drinkId: 'unknown-beer', drinkName: 'Bière mystère', quantity: 1, barId: BASE_BAR_ID },
        { drinkId: 'mojito', drinkName: 'Mojito', quantity: 1, barId: 'bar-mimi' }
      ]
    };
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: orderToReorder,
      currentOrders: [],
      menus: baseMenus,
      onOrdersUpdated
    });

    expect(result).toHaveLength(1);
    expect(result[0].drinkId).toBe('mojito');

    jest.runAllTimers();
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining("« Bière mystère » n'est plus au menu, non ajoutée"),
      expect.any(Object)
    );
  });

  test('6. Repli mono-bar avec categories : fonctionne si menus n\'est pas fourni (rétrocompatibilité)', () => {
    const categories = baseMenus[0].categories;
    const orderToReorder = {
      items: [{ drinkId: 'carlsberg-25', quantity: 2 }]
    };
    const onOrdersUpdated = jest.fn();

    const result = reorderIntoCart({
      order: orderToReorder,
      currentOrders: [],
      categories,
      onOrdersUpdated
    });

    expect(result).toHaveLength(1);
    expect(result[0].drinkId).toBe('carlsberg-25');
    expect(result[0].price).toBe(2.7);
  });

  test('7. Gestion de la note : réimport si panier sans note, préservation si note existante', () => {
    const onNoteUpdated = jest.fn();

    // Cas A : Panier vide de note -> réimport
    reorderIntoCart({
      order: {
        items: [{ drinkId: 'mojito', barId: 'bar-mimi', quantity: 1 }],
        note: 'Sans glaçons'
      },
      currentOrders: [],
      menus: baseMenus,
      currentNote: '',
      onNoteUpdated
    });
    expect(onNoteUpdated).toHaveBeenCalledWith('Sans glaçons');

    // Cas B : Panier avec déjà une note -> note conservée, toast.info après délai
    onNoteUpdated.mockClear();
    reorderIntoCart({
      order: {
        items: [{ drinkId: 'mojito', barId: 'bar-mimi', quantity: 1 }],
        note: 'Sans glaçons'
      },
      currentOrders: [],
      menus: baseMenus,
      currentNote: 'Note actuelle',
      onNoteUpdated
    });
    expect(onNoteUpdated).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(toast.info).toHaveBeenCalledWith(
      'Note précédente non importée',
      expect.any(Object)
    );
  });
});

describe('formatOrderSummary — Formatage texte de partage (§ 4.6)', () => {
  const menus = [
    { id: 'rllhc', name: 'Club de hockey', icon: '🏒' },
    { id: 'bar-mimi', name: 'Chez Mimi', icon: '🍻' }
  ];

  test('1. Commande mono-bar : format classique à puces', () => {
    const order = {
      items: [
        { drinkId: 'carlsberg', drinkName: 'Carlsberg 25cl', quantity: 2, price: 2.5, barId: 'rllhc' }
      ],
      total: 5.0,
      note: 'Pour la table 3'
    };

    const text = formatOrderSummary(order, menus);
    expect(text).toContain('🍹 Commande GentBar');
    expect(text).toContain(`• 2x Carlsberg 25cl - ${formatPrice(5.0)}`);
    expect(text).toContain(`💰 Total : ${formatPrice(5.0)}`);
    expect(text).toContain('📌 Note : Pour la table 3');
    expect(text).not.toContain('Commande · 2 bars');
  });

  test('2. Commande multi-bars : format groupé par bar avec tirets et sous-totaux', () => {
    const order = {
      items: [
        { drinkId: 'carlsberg', drinkName: 'Carlsberg 25cl', quantity: 2, price: 2.5, barId: 'rllhc' },
        { drinkId: 'duvel', drinkName: 'Duvel', quantity: 1, price: 4.5, barId: 'rllhc' },
        { drinkId: 'mojito', drinkName: 'Mojito', quantity: 2, price: 6.0, barId: 'bar-mimi' }
      ],
      total: 21.5,
      note: 'Sans paille'
    };

    const text = formatOrderSummary(order, menus);
    expect(text).toContain('Commande · 2 bars');
    expect(text).toContain(`── 🏒 Club de hockey ──────── ${formatPrice(9.5)}`);
    expect(text).toContain(' 2× Carlsberg 25cl');
    expect(text).toContain(' 1× Duvel');
    expect(text).toContain(`── 🍻 Chez Mimi ──────── ${formatPrice(12.0)}`);
    expect(text).toContain(' 2× Mojito');
    expect(text).toContain(`Total ─────────────────────── ${formatPrice(21.5)}`);
    expect(text).toContain('📌 Note : Sans paille');
  });
});

