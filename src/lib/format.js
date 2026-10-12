/**
 * Utilitaires de formatage pour GentBar
 */

/**
 * Formate un montant en euros selon les conventions francophones (ex: "3,00 €").
 * @param {number|string} amount - Montant numérique ou chaîne
 * @returns {string} - Montant formaté (ex: "3,00 €")
 */
export const formatPrice = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '0,00\u00A0€';
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default formatPrice;
