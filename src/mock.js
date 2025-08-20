export const mockCategories = [
  {
    id: 'bieres',
    name: 'Bières',
    icon: '🍺',
    color: 'bg-yellow-100 text-yellow-800',
    isCollapsed: false,
    drinks: [
      { id: 'bieres-jupiler', name: 'Jupiler', price: 2.50 },
      { id: 'bieres-embuscade', name: 'Embuscade', price: 4.00 },
      { id: 'bieres-liefmans', name: 'Liefmans', price: 3.00 },
      { id: 'bieres-hoegaarden', name: 'Hoegaarden Rosée', price: 3.00 },
      { id: 'bieres-grisette', name: 'Grisette Blanche', price: 3.00 },
      { id: 'bieres-chimay', name: 'Chimay Dorée', price: 4.50 },
      { id: 'bieres-chimaytriple33', name: 'Chimay Bleue', price: 4.50 },
      { id: 'bieres-leffe33', name: 'Leffe Blonde', price: 4.00 },
      { id: 'bieres-triplekarmeliet33', name: 'Triple Karmeliet', price: 4.50 },
      { id: 'bieres-duvel666', name: 'Duvel 666', price: 4.50 },
      { id: 'bieres-duvel', name: 'Duvel', price: 4.50 },
      { id: 'bieres-imperatrice33', name: 'Impératrice', price: 5.00 },
      { id: 'bieres-westmalle33', name: 'Westmalle', price: 4.50 },
      { id: 'bieres-asnaise', name: 'Asnaise', price: 4.50 },
      { id: 'bieres-orval33', name: 'Orval', price: 4.50 },
      { id: 'bieres-stfeuillienblonde33', name: 'St Feuillien Blonde', price: 4.00 },
      { id: 'bieres-stfeuilliensaison33', name: 'St Feuillien Saison', price: 4.00 },
      { id: 'bieres-stfeuilliengrandcru33', name: 'St Feuillien Grand Cru', price: 5.00 },
      { id: 'bieres-stfeuillienfive25', name: 'Five', price: 2.50 },
      { id: 'bieres-stfeuillienfruit25', name: 'Four Fruit', price: 2.50 },
      { id: 'bieres-goldenstick', name: 'Golden Stick', price: 3.00 },
      { id: 'bieres-carlsbergzero25', name: 'Carlsberg Zero', price: 2.50 },
      { id: 'bieres-liefmanszero25', name: 'Liefmans Zero', price: 2.50 },
      { id: 'bieres-valdecentre', name: 'Val de Centre', price: 3.00 },
    ]
  },
  {
    id: 'soft',
    name: 'Soft Drinks',
    icon: '🥤',
    color: 'bg-blue-100 text-blue-800',
    isCollapsed: true,
    drinks: [
      { id: 'soft-coca', name: 'Coca', price: 2.50 },
      { id: 'soft-coca-zero', name: 'Coca Zéro', price: 2.50 },
      { id: 'soft-sprite', name: 'Sprite', price: 2.50 },
      { id: 'soft-fanta', name: 'Fanta', price: 2.50 },
      { id: 'soft-schweppes-tonic', name: 'Schweppes Tonic', price: 2.50 },
      { id: 'soft-schweppes-agrumes', name: 'Schweppes Agrumes', price: 2.50 },
      { id: 'soft-fuze-tea', name: 'Fuze Tea Pêche', price: 2.50 },
      { id: 'soft-red-bull', name: 'Red Bull', price: 3.50 },
      { id: 'soft-aquarius', name: 'Aquarius', price: 3.50 },
      { id: 'soft-tao', name: 'Tao', price: 3.50 },
      { id: 'soft-pomme-cerise', name: 'Pomme Cerise', price: 2.50 },
      { id: 'soft-cecemel', name: 'Cecemel', price: 2.50 },
      { id: 'soft-eau-plate', name: 'Eau plate', price: 2.00 },
      { id: 'soft-eau-petillante', name: 'Eau Pétillante', price: 2.00 },
    ]
  },
  {
    id: 'vins',
    name: 'Vins',
    icon: '🍷',
    color: 'bg-red-100 text-red-800',
    isCollapsed: true,
    drinks: [
      { id: 'vins-verre-blanc', name: 'Blanc (verre)', price: 3.50 },
      { id: 'vins-verre-rouge', name: 'Rouge (verre)', price: 3.50 },
      { id: 'vins-verre-rose', name: 'Rosé (verre)', price: 3.50 },
      { id: 'vins-verre-cava', name: 'Cava (verre)', price: 3 },
      { id: 'vins-cava', name: 'Cava (Bouteille)', price: 15 },
    ]
  },
  {
    id: 'cocktails',
    name: 'Cocktails',
    icon: '🥃',
    color: 'bg-orange-100 text-orange-800',
    isCollapsed: true,
    drinks: [
      { id: 'cocktails-martini', name: 'Martini / Porto', price: 5.00 },
      { id: 'cocktails-vodkaredbull', name: 'Vodka Red Bull', price: 8.00 },
      { id: 'cocktails-piconvinblanc', name: 'Picon Vin Blanc', price: 6.00 },
      { id: 'cocktails-spritz', name: 'Spritz', price: 8.00 },
      { id: 'cocktails-ricard', name: 'Ricard', price: 6.00 },
      { id: 'cocktails-cuba', name: 'Cuba Libre', price: 5.00 },
      { id: 'cocktails-gin-tonic', name: 'Gin Tonic', price: 5.00 },
    ]
  },
  {
    id: 'cafe',
    name: 'Boissons chaudes',
    icon: '☕',
    color: 'bg-amber-100 text-amber-800',
    isCollapsed: true,
    drinks: [
      { id: 'cafe-cafe', name: 'Café', price: 2.50 },
      { id: 'cafe-the', name: 'Thé', price: 2.50 },
      { id: 'cafe-chocolat-chaud', name: 'Chocolat chaud', price: 2.50 },
      { id: 'cafe-soupe', name: 'Soupe Royco', price: 2.50 },
    ]
  },
  {
    id: 'snacks',
    name: 'Snacks',
    icon: '🥪',
    color: 'bg-green-100 text-green-800',
    isCollapsed: true,
    drinks: [
      { id: 'snacks-chips', name: 'Chips', price: 1.50 },
      { id: 'snacks-assietteapero', name: 'Assiette apéro', price: 9.00 },
    ]
  }
];

export const mockOrderHistory = [
  {
    id: 'order-1',
    date: '2024-01-12T14:30:00Z',
    items: [
      { drinkName: 'test boisson', quantity: 2, price: 2.50 },
      { drinkName: 'test', quantity: 1, price: 2.50 }
    ],
    total: 7.50
  }
];

export const mockOrders = [];
