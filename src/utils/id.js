// Générateur d'ID unique et cohérent pour les boissons
export const generateDrinkId = (name, categoryId) => {
  const base = name
    .toLowerCase()
    .normalize("NFD") // enlever accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-") // espaces -> tirets
    .replace(/[^a-z0-9-]/g, ""); // enlever caractères non autorisés

  // Ajoute catégorie + timestamp pour l'unicité
  return `${categoryId}-${base}-${Date.now()}`;
};
