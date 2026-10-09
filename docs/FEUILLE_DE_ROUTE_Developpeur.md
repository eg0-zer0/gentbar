# Feuille de route — GentBar Order App

Document court, à lire en premier. Le détail technique complet de chaque point (cause exacte, code, raisonnement) est dans `AUDIT_GentBar_Order_App.md` — les références entre parenthèses (ex. `A-06`, `E-3`) y renvoient directement.

## Avant de commencer

- **Dépôt** : `github.com/eg0-zer0/gentbar`, branche `main` — poussée automatiquement sur `gentbar.netlify.app` à chaque commit, c'est donc bien la seule version à considérer.
- `git pull` sur `main` pour partir de la dernière version (ce document se base sur le commit `92d4a70`).
- Nouvelle carte du club déjà prête : le fichier `mock.js` fourni séparément remplace directement `src/mock.js` (voir Étape 8).
- Avance phase par phase, dans l'ordre ci-dessous — chaque phase est pensée comme une petite PR indépendante, testable seule.

---

## Étape 1 — Fiabiliser le déploiement (prioritaire, tout le reste en dépend)

- [ ] Ajouter `public/_redirects` avec la ligne `/*  /index.html  200` — corrige le 404 au rechargement de `/app`
- [ ] Aligner la commande de build Netlify sur celle qui génère le service worker (`workbox generateSW`), et régénérer `public/service-worker.js` pour qu'il référence les bons fichiers (plus de hash périmés)

**Fichiers** : `public/_redirects` (à créer), `package.json`, `workbox-config.js`, `public/service-worker.js`
**Détail** : `A-28`, `A-05`

---

## Étape 2 — Bugs qui touchent la confiance et l'argent

- [ ] Suppression d'une boisson : corriger le texte trompeur « Supprimer la catégorie » (le composant de confirmation n'a jamais le bon titre/description — construire `title`/`description` selon `deleteDialog.type`)
- [ ] Panier : rafraîchir `price` et `drinkName` d'une ligne déjà présente quand on la rajoute (`handleAddDrink`), et répercuter une modification de prix du menu sur les lignes déjà dans le panier
- [ ] Partage : transmettre `order={orders}` et `isCurrentOrder={true}` à `<ShareButtons />` depuis `OrderSummary.jsx` (actuellement appelé sans aucune prop → envoie toujours « Aucune commande à partager »)
- [ ] Fenêtre de modification d'une boisson : remplacer `onClose={onClose}` par `onOpenChange={onClose}` (une ligne) — c'est pour ça que la croix ne ferme pas

**Fichiers** : `src/components/DeleteConfirmDialog.jsx`, `src/components/DrinkOrderApp.jsx`, `src/components/OrderSummary.jsx`, `src/components/EditDrinkModal.jsx`
**Détail** : `A-36`, `A-06`, `A-37`, `A-31`

---

## Étape 3 — Unifier les thèmes

- [ ] Choisir un seul système de couleurs entre les deux qui coexistent aujourd'hui : celui basé sur `[data-theme]` (`index.css`, encore utilisé par `OrderSummary`, `Header`, les fenêtres, les composants `ui/*`) et celui basé sur les classes `.dark`/`.gentbar` + variables RGB (`App.css`, déjà utilisé par `DrinkCard`/`CategorySection`)
- [ ] Migrer les composants restants vers le système conservé, pour que le récapitulatif de commande et les fenêtres changent bien de couleur avec le thème
- [ ] Vérifier le contraste dans les 3 thèmes, sur tous les écrans

**Fichiers** : `src/index.css`, `src/App.css`, `tailwind.config.js`, `src/components/OrderSummary.jsx`, `src/components/Header.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/DeleteConfirmDialog.jsx`, `src/components/LandingPage.jsx`, `src/components/ui/*.jsx`
**Détail** : `A-01`

---

## Étape 4 — Notifications et actions destructives

- [ ] Réparer l'affichage des notifications : soit migrer tous les appels `useToast()` vers Sonner (`toast.success(...)`), soit remplacer `<Toaster/>` (Sonner) par le composant `toaster.jsx` compatible avec `useToast` — une seule des deux options, pas les deux systèmes en parallèle
- [ ] Vider le panier : ajouter une confirmation (`DeleteConfirmDialog`)
- [ ] Pagination du panier : recaler `currentPage` quand `orders.length` change, pour ne pas rester bloqué sur une page vide après suppression
- [ ] Une fois les notifications réparées : unifier le style des suppressions — toast « Supprimé — Annuler » pour les actions fréquentes (une ligne du panier, une commande de l'historique), confirmation uniquement pour les actions larges (vider tout, supprimer une catégorie)

**Fichiers** : `src/components/DrinkOrderApp.jsx`, `src/hooks/use-toast.js`, `src/components/ui/sonner.jsx`, `src/components/ui/toaster.jsx`, `src/components/OrderSummary.jsx`
**Détail** : `A-02`, `A-13`, `A-38`, `E-6`

---

## Étape 5 — Robustesse

- [ ] Encapsuler toutes les lectures/écritures `localStorage` dans un petit module (`try/catch`, validation, valeur de repli) plutôt que des `JSON.parse` directs
- [ ] Ajouter un `ErrorBoundary` React global (écran « Une erreur est survenue » + bouton recharger)
- [ ] Persister `sortBy` de la même façon que `viewMode` (actuellement jamais sauvegardé)

**Fichiers** : `src/components/DrinkOrderApp.jsx`, nouveau `src/lib/storage.js`, nouveau `src/components/ErrorBoundary.jsx`
**Détail** : `A-08`, `A-03`

---

## Étape 6 — Installation et PWA

- [ ] Partager une seule instance de l'écouteur d'installation (`beforeinstallprompt`) entre tous les boutons (contexte React dédié), au lieu d'un `usePWA()` séparé par composant
- [ ] Supprimer le second rendu d'`InstallBanner` (actuellement affiché à la fois dans `App.jsx` et dans `DrinkOrderApp.jsx`)
- [ ] « Vérifier les mises à jour » : lui donner un vrai comportement (`registration.update()` + retour visible), ou le retirer s'il fait doublon avec « Accéder à l'application »
- [ ] Manifest : ajouter `"purpose": "any maskable"` aux icônes, ajouter un `favicon.ico`, ajouter une route `*` (404) dans le routeur

**Fichiers** : `src/hooks/usePWA.js`, nouveau `src/contexts/PWAContext.jsx`, `src/components/InstallBanner.jsx`, `src/components/Header.jsx`, `src/components/LandingPage.jsx`, `public/manifest.json`, `src/App.jsx`
**Détail** : `A-30`, `A-16`, `A-24`

---

## Étape 7 — Nettoyage

- [ ] Choisir un seul gestionnaire de paquets (`yarn.lock` **ou** `package-lock.json`, pas les deux)
- [ ] Supprimer les composants orphelins : `AddFriendModal.jsx`, `FriendSelector.jsx`, `AddDrinkModal.jsx`, `InstallPrompt.jsx` (fonctionnalité « commande par ami » non retenue, voir contexte produit)
- [ ] `ThemeToggle.jsx` : supprimer, ou le réutiliser si prévu quelque part (son code est déjà correct, juste inutilisé)

**Fichiers** : `package.json`, `yarn.lock`/`package-lock.json`, composants listés ci-dessus
**Détail** : `A-25`, `A-35`

---

## Étape 8 — Nouvelle carte du club

- [ ] Remplacer `src/mock.js` par le fichier déjà validé (15 catégories, carte du Royal La Louvière Hockey Club à jour)

**Fichiers** : `src/mock.js`

---

## Étape 9 — Nouvelles fonctionnalités (seulement une fois les étapes 1 à 8 faites)

Chaque fonctionnalité est détaillée (principe, flux, décisions déjà prises) dans `AUDIT_GentBar_Order_App.md`, section « Nouvelles fonctionnalités détaillées ». Ordre suggéré, du plus simple/isolé au plus structurant :

1. `E-6` — unifier les suppressions *(déjà fait en partie à l'étape 4)*
2. `E-3` — recherche dans le menu
3. `E-10` — alerte de doublon de nom (réutilise la recherche)
4. `E-5` — tri par popularité par défaut
5. `E-7` — note libre sur une commande
6. `E-8` — recommander la même tournée
7. `E-4` — vue Ticket (prise de commande au bar)
8. `E-9` — verrouillage de l'écran (dépend de la vue Ticket)
9. `E-11` — création rapide d'une carte (coller une liste + astuce photo)
10. `E-1` — récapitulatif de soirée et partage équitable
11. `A-29` (points 1 à 9) — multi-bars : plusieurs cartes, partage par lien/QR, commande sur deux bars
12. `E-2` — mode Cagnotte (la plus structurante, toutes les décisions sont déjà actées dans sa fiche)

---

## Pour chaque étape

1. Lire le détail des points concernés dans `AUDIT_GentBar_Order_App.md` (reproduction du bug, cause exacte, correction proposée).
2. Développer et tester sur un appareil réel (Android au minimum), pas seulement en navigateur desktop.
3. Vérifier qu'aucune régression n'apparaît sur la liste « Confirmé comme fonctionnant correctement » du document complet (totaux, boutons +/-, tri par prix, mode hors ligne…).
4. Cocher l'étape ici une fois déployée sur Netlify et revérifiée en ligne.
