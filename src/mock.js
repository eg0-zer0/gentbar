export const MENU_VERSION = '2026-10-09-hockey';

export const mockCategories = [
  {
    id: 'bieres-fut',
    name: 'Bières au fût',
    icon: '🍺',
    color: 'bg-yellow-100 text-yellow-800',
    isCollapsed: false,
    drinks: [
      { id: 'bieres-fut-saintfeu', name: 'Saint-Feu', price: 2.50 },
      { id: 'bieres-fut-carlsberg20', name: 'Carlsberg 20cl', price: 2.50 },
      { id: 'bieres-fut-carlsberg25', name: 'Carlsberg 25cl', price: 3.00 },
      { id: 'bieres-fut-carlsberg40', name: 'Carlsberg 40cl', price: 4.50 },
      { id: 'bieres-fut-metrecarlsberg', name: 'Mètre de Carlsberg (11 verres)', price: 25.00 },
      { id: 'bieres-fut-sthubertusblonde', name: 'St Hubertus Blonde', price: 4.50 },
      { id: 'bieres-fut-sthubertusambree', name: 'St Hubertus Ambrée', price: 4.50 },
      { id: 'bieres-fut-sthubertusblanche', name: 'St Hubertus Blanche (fût)', price: 3.50 },
      { id: 'bieres-fut-sthubertusblancherosee', name: 'St Hubertus Blanche rosée', price: 4.00 },
      { id: 'bieres-fut-sthubertusblanchepeche', name: 'St Hubertus Blanche pêche', price: 4.00 },
      { id: 'bieres-fut-stfeuillienfruit', name: 'Saint-Feuillien Fruit', price: 3.00 },
    ]
  },
  {
    id: 'bieres-bouteille',
    name: 'Bières en bouteille',
    icon: '🍾',
    color: 'bg-amber-100 text-amber-900',
    isCollapsed: true,
    drinks: [
      { id: 'bieres-bout-sthubertustripleblonde', name: 'St Hubertus Triple Blonde', price: 4.50 },
      { id: 'bieres-bout-sthubertustripleambree', name: 'St Hubertus Triple Ambrée', price: 4.50 },
      { id: 'bieres-bout-sthubertusblanche', name: 'St Hubertus Blanche (bouteille)', price: 3.50 },
      { id: 'bieres-bout-sthubertustriplehopcitra', name: 'St Hubertus Triple Hop Citra', price: 4.50 },
      { id: 'bieres-bout-embuscade', name: 'Embuscade', price: 4.50 },
      { id: 'bieres-bout-liefmans', name: 'Liefmans', price: 3.50 },
      { id: 'bieres-bout-hoegaardenrosee', name: 'Hoegaarden Rosée', price: 3.50 },
      { id: 'bieres-bout-chimaydoree', name: 'Chimay Dorée', price: 4.50 },
      { id: 'bieres-bout-chimaytriple', name: 'Chimay Triple', price: 4.50 },
      { id: 'bieres-bout-chimaybleue', name: 'Chimay Bleue', price: 4.50 },
      { id: 'bieres-bout-triplekarmeliet', name: 'Triple Karmeliet', price: 5.00 },
      { id: 'bieres-bout-duvel', name: 'Duvel', price: 4.50 },
      { id: 'bieres-bout-duvel666', name: 'Duvel 666', price: 4.50 },
      { id: 'bieres-bout-imperatrice', name: 'Impératrice', price: 5.00 },
      { id: 'bieres-bout-westmalletriple', name: 'Westmalle Triple', price: 4.50 },
      { id: 'bieres-bout-orval', name: 'Orval', price: 4.50 },
      { id: 'bieres-bout-stfeuillienblonde', name: 'Saint-Feuillien Blonde', price: 4.50 },
      { id: 'bieres-bout-stfeuilliengrandcru', name: 'Saint-Feuillien Grand Cru', price: 5.00 },
      { id: 'bieres-bout-lefferuby', name: 'Leffe Ruby', price: 3.50 },
    ]
  },
  {
    id: 'bieres-sans-alcool',
    name: 'Bières sans alcool',
    icon: '0️⃣',
    color: 'bg-lime-100 text-lime-800',
    isCollapsed: true,
    drinks: [
      { id: 'sansalcool-carlsberg00', name: 'Carlsberg 0.0', price: 2.50 },
      { id: 'sansalcool-liefmanszero', name: 'Liefmans Zero', price: 3.50 },
    ]
  },
  {
    id: 'alcools',
    name: 'Alcools',
    icon: '🥃',
    color: 'bg-orange-100 text-orange-800',
    isCollapsed: true,
    drinks: [
      { id: 'alcools-martini', name: 'Martini', price: 5.00 },
      { id: 'alcools-porto', name: 'Porto', price: 5.00 },
      { id: 'alcools-vodkaredbull', name: 'Vodka Red Bull', price: 8.00 },
      { id: 'alcools-piconvinblanc', name: 'Picon Vin Blanc', price: 6.00 },
      { id: 'alcools-4clsoft', name: 'Alcool 4cl + Soft', price: 8.00 },
      { id: 'alcools-ricard', name: 'Ricard', price: 6.00 },
      { id: 'alcools-get27', name: 'Get 27', price: 8.00 },
    ]
  },
  {
    id: 'cocktails-mocktails',
    name: 'Cocktails et Mocktails',
    icon: '🍹',
    color: 'bg-pink-100 text-pink-800',
    isCollapsed: true,
    drinks: [
      { id: 'cocktails-spritzaperol', name: 'Spritz (Apérol)', price: 8.00 },
      { id: 'cocktails-spritzlimoncello', name: 'Spritz (Limoncello)', price: 8.00 },
    ]
  },
  {
    id: 'bulles-cidres',
    name: 'Bulles et Cidres',
    icon: '🥂',
    color: 'bg-fuchsia-100 text-fuchsia-800',
    isCollapsed: true,
    drinks: [
      { id: 'bulles-proseccoverre', name: 'Prosecco (verre)', price: 4.00 },
      { id: 'bulles-proseccobouteille', name: 'Prosecco (bouteille)', price: 20.00 },
      { id: 'bulles-cavaverre', name: 'Cava (verre)', price: 6.00 },
      { id: 'bulles-cavabouteille', name: 'Cava (bouteille)', price: 20.00 },
      { id: 'bulles-ruffus', name: 'Ruffus (bouteille uniquement)', price: 40.00 },
      { id: 'somersby-apple', name: 'Somersby Apple', price: 4.50 },
      { id: 'somersby-blackberry', name: 'Somersby Blackberry', price: 4.50 },
      { id: 'somersby-mangolime', name: 'Somersby Mango & Lime', price: 4.50 },
      { id: 'somersby-00', name: 'Somersby 0,0', price: 4.50 },
    ]
  },
  {
    id: 'vins',
    name: 'Vins',
    icon: '🍷',
    color: 'bg-red-100 text-red-800',
    isCollapsed: true,
    drinks: [
      { id: 'vins-blancverre', name: 'Blanc (verre)', price: 3.50 },
      { id: 'vins-rougeverre', name: 'Rouge (verre)', price: 3.50 },
      { id: 'vins-roseverre', name: 'Rosé (verre)', price: 3.50 },
      { id: 'vins-blancbouteille', name: 'Blanc (bouteille)', price: 17.00 },
      { id: 'vins-rougebouteille', name: 'Rouge (bouteille)', price: 17.00 },
      { id: 'vins-rosebouteille', name: 'Rosé (bouteille)', price: 17.00 },
    ]
  },
  {
    id: 'softs',
    name: 'Eaux et Softs',
    icon: '💧',
    color: 'bg-blue-100 text-blue-800',
    isCollapsed: true,
    drinks: [
      { id: 'softs-coca', name: 'Coca', price: 2.50 },
      { id: 'softs-cocazero', name: 'Coca Zéro', price: 2.50 },
      { id: 'softs-fantaorange', name: 'Fanta orange', price: 2.50 },
      { id: 'softs-sprite', name: 'Sprite', price: 2.50 },
      { id: 'softs-fuzetea', name: 'Fuze Tea Pétillant / Pêche', price: 2.50 },
      { id: 'softs-redbull', name: 'Red Bull', price: 3.50 },
      { id: 'softs-eauplate', name: 'Eau plate', price: 2.00 },
      { id: 'softs-eaupetillante', name: 'Eau pétillante', price: 2.50 },
      { id: 'softs-canadadry', name: 'Canada Dry', price: 2.50 },
      { id: 'schweppes-tonic', name: 'Schweppes Tonic', price: 3.00 },
      { id: 'schweppes-agrumes', name: 'Schweppes Agrumes', price: 3.00 },
      { id: 'schweppes-mojito', name: 'Schweppes Mojito', price: 3.00 },
      { id: 'tao-greentea', name: 'TAO Green Tea & Ginkgo Biloba', price: 3.00 },
      { id: 'tao-kombucha', name: 'TAO Kombucha & Rosehip', price: 3.00 },
      { id: 'tao-ginger', name: 'TAO Ginger & Dragon fruit', price: 3.00 },
      { id: 'tao-blackcurrant', name: 'TAO Blackcurrant & Ginseng', price: 3.00 },
      { id: 'tao-aquariuscitron', name: 'Aquarius Citron', price: 3.50 },
      { id: 'tao-aquariuspeach', name: 'Aquarius Peach', price: 3.50 },
      { id: 'tao-poweradebleu', name: 'Powerade Bleu', price: 4.50 },
      { id: 'jus-minutemaidpommecerise', name: 'Min Maid Pomme Cerise', price: 3.00 },
    ]
  },
  {
    id: 'boissons-chaudes',
    name: 'Boissons chaudes',
    icon: '☕',
    color: 'bg-amber-100 text-amber-700',
    isCollapsed: true,
    drinks: [
      { id: 'chaud-cafe', name: 'Café', price: 2.50 },
      { id: 'chaud-cappuccino', name: 'Cappuccino', price: 2.50 },
      { id: 'chaud-the', name: 'Thé', price: 2.50 },
      { id: 'chaud-cacao', name: 'Cacao', price: 2.50 },
      { id: 'chaud-soupetomate', name: 'Soupe Tomate', price: 2.50 },
      { id: 'chaud-soupepoulet', name: 'Soupe Poulet', price: 2.50 },
      { id: 'chaud-cecemel', name: 'Cécémel (froid ou chaud)', price: 2.50 },
    ]
  },
  {
    id: 'snacks',
    name: 'Snacks',
    icon: '🍫',
    color: 'bg-purple-100 text-purple-800',
    isCollapsed: true,
    drinks: [
      { id: 'snacks-mars', name: 'Mars', price: 2.00 },
      { id: 'snacks-twix', name: 'Twix', price: 2.00 },
      { id: 'snacks-snickers', name: 'Snickers', price: 2.00 },
      { id: 'snacks-bonbonlutti', name: 'Sachet de Bonbon Lutti', price: 2.00 },
      { id: 'snacks-chipscrocky', name: 'Chips Crocky', price: 2.00 },
      { id: 'snacks-gaufre', name: 'Gaufre', price: 2.00 },
      { id: 'snacks-painchocolat', name: 'Pain au chocolat', price: 2.50 },
      { id: 'snacks-croissant', name: 'Croissant', price: 2.50 },
      { id: 'snacks-formuledejeuner', name: 'Formule déjeuner (boisson chaude + croissant ou pain au chocolat)', price: 4.50 },
    ]
  },
  {
    id: 'petite-restauration',
    name: 'Petite Restauration',
    icon: '🥪',
    color: 'bg-teal-100 text-teal-800',
    isCollapsed: true,
    drinks: [
      { id: 'resto-sandwich', name: 'Sandwich (Crudités comprises)', price: 4.50 },
      { id: 'resto-paninijambonfromage', name: 'Panini Jambon - Fromage', price: 5.00 },
      { id: 'resto-paninipouletpesto', name: 'Panini Poulet pesto', price: 5.00 },
      { id: 'resto-cornetpate', name: 'Cornet de pâte', price: 6.00 },
      { id: 'resto-frites', name: 'Frites (Sauce comprise)', price: 4.00 },
      { id: 'resto-assietteaperochaude', name: 'Assiette Apéro Chaude', price: 10.00 },
      { id: 'resto-assietteaperofroide', name: 'Assiette Apéro Froide', price: 10.00 },
      { id: 'resto-accompagnementfromage', name: 'Accompagnement Apéro (Fromage)', price: 4.00 },
      { id: 'resto-accompagnementsalami', name: 'Accompagnement Apéro (Salami)', price: 4.00 },
      { id: 'resto-platfrites', name: 'Plat de frites (Sauces Comprises)', price: 12.00 },
    ]
  }
];

export const mockOrderHistory = [];

export const mockOrders = [];
