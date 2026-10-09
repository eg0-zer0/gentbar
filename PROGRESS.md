# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `roadmap` · **Prochaine étape** : 5 (Robustesse) · **Dernier commit** : 6a4e6c1

---

## Étape 1 — Fiabiliser le déploiement (A-28, A-05)
- [x] `public/_redirects` avec `/*  /index.html  200`
- [x] Commande de build alignée sur `workbox generateSW` ; `public/service-worker.js` régénéré (plus de hash périmés)

## Étape 2 — Bugs de confiance et d'argent (A-36, A-06, A-37, A-31)
- [x] Confirmation de suppression d'une boisson : bon titre/description selon le type (A-36)
- [x] Panier : prix/nom rafraîchis à l'ajout et à la modification d'une boisson (A-06)
- [x] Partage : `order` et `isCurrentOrder` transmis à `ShareButtons` (A-37)
- [x] `EditDrinkModal` : `onClose` → `onOpenChange` (A-31)

## Étape 3 — Unifier les thèmes (A-01)
- [x] Jetons Tailwind pilotés par `html.dark` / `html.gentbar` dans `index.css`
- [x] Récapitulatif, en-tête, fenêtres, landing et composants `ui/*` vérifiés dans les 3 thèmes
- [x] Contraste vérifié (≥ 4,5:1)

## Étape 4 — Notifications et actions destructives (A-02, A-13, A-38, E-6)
- [x] Sonner partout, store `use-toast` supprimé, un seul `<Toaster />`
- [x] Vider le panier : confirmation (`OrderSummary` et `ConfirmOrderModal`)
- [x] Pagination du panier : `currentPage` recalé après suppression (`A-38`)
- [x] Suppressions unifiées : confirmations d'article dans le panier et de ticket dans l'historique (`OrderHistory`)

## Étape 5 — Robustesse (A-08, A-03)
- [ ] Module de stockage sûr (`try/catch`, validation, repli) et usage dans `DrinkOrderApp`
- [ ] `ErrorBoundary` global
- [ ] `sortBy` persisté

## Étape 6 — Installation et PWA (A-30, A-16, A-24)
- [ ] Un seul écouteur `beforeinstallprompt` partagé (contexte)
- [ ] `InstallBanner` rendu une seule fois (ou retiré)
- [ ] « Vérifier les mises à jour » : vrai comportement ou retiré
- [ ] Icônes `maskable`, `favicon.ico`, route `*` (404)

## Étape 7 — Nettoyage (A-25, A-35)
- [ ] Un seul fichier de verrouillage des dépendances
- [ ] Composants orphelins supprimés (`AddFriendModal`, `FriendSelector`, `AddDrinkModal`, `InstallPrompt`, `ThemeToggle` si inutilisé)

## Étape 8 — Nouvelle carte du club
- [x] `src/mock.js` remplacé par la version validée (11 catégories à jour, Royal La Louvière Hockey Club)
- [x] Synchronisation automatique de version (`MENU_VERSION`) pour prise en compte immédiate sur les appareils existants

## Étape 9 — Nouvelles fonctionnalités *(uniquement sur demande explicite)*
*Ordre : E-3, E-10, E-5, E-7, E-8, E-4, E-9, E-11, E-1, A-29, E-2.*

---

## Journal
* 09/10/2026 — Étape 1 terminée : création de `public/_redirects` pour les réécritures SPA Netlify (A-28), script de build aligné avec `workbox generateSW`, options `navigateFallback` et `cleanupOutdatedCaches` configurées dans `workbox-config.js`, et régénération du Service Worker dans `public/service-worker.js`. `yarn build` validé avec succès.
* 09/10/2026 — Étape 2 terminée : correction du titre/description selon le type dans `DeleteConfirmDialog` (A-36), synchronisation du panier (prix, nom, suppressions) dans `DrinkOrderApp` (A-06), transmission de `order` et `isCurrentOrder` à `ShareButtons` dans `OrderSummary` (A-37), remplacement de `onClose` par `onOpenChange` dans `EditDrinkModal` (A-31). `yarn build` validé avec succès.
* 09/10/2026 — Étape 3 terminée : thèmes unifiés via `index.css` et vérification des contrastes.
* 09/10/2026 — Étape 4 terminée : Sonner partout, suppression de l'ancien `use-toast`, boîtes de dialogue de confirmation ajoutées pour vider le panier (dans `OrderSummary` et dans la modale `ConfirmOrderModal`), confirmations ajoutées pour le retrait d'un article du panier et pour la suppression d'une commande dans l'historique (`OrderHistory`), recalage automatique de `currentPage` après suppression (`A-38`). Notifications repositionnées en haut au centre (`top-center`), plus courtes et discrètes pour ne pas masquer le panier sur mobile. `yarn build` validé avec succès.
* 09/10/2026 — Étape 8 terminée : remplacement de `src/mock.js` par la carte officielle validée (11 catégories, bières au fût/bouteille/sans alcool, alcools, cocktails, bulles & cidres, vins, softs, boissons chaudes, snacks, petite restauration). Ajout de `MENU_VERSION` dans `DrinkOrderApp.jsx` pour forcer le rafraîchissement automatique de la carte sur les téléphones ayant déjà ouvert l'application. `yarn build` validé avec succès.

## Écarts et décisions en cours
* Étape 8 avancée à la demande explicite du propriétaire avant les étapes 5 à 7.

## À tester par le propriétaire sur appareil
* Nouvelle carte : vérifier que les 11 catégories à jour s'affichent correctement avec leurs boissons et prix.
* Notifications : vérifier qu'elles apparaissent en haut au centre de manière discrète sans gêner le panier en bas.

