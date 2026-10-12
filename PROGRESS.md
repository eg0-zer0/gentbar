# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `roadmap-8ter` · **Prochaine étape** : 8 ter-c (Cohérence et nettoyage) · **Dernier commit** : d8be929

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
- [x] Module de stockage sûr (`try/catch`, validation, repli) et usage dans `DrinkOrderApp`
- [x] `ErrorBoundary` global (`src/components/ErrorBoundary.jsx` avec options recharger et réinitialiser)
- [x] `sortBy` persisté avec validation et sauvegarde automatique

## Étape 6 — Installation et PWA (A-30, A-16, A-24)
- [x] Un seul écouteur `beforeinstallprompt` partagé (contexte `PWAContext`)
- [x] `InstallBanner` retiré du projet et supprimé de `App.jsx` et `DrinkOrderApp.jsx` (décision A-35)
- [x] « Vérifier les mises à jour » : vrai comportement avec `registration.update()` et notification de statut utilisateur
- [x] Icônes `maskable`, `favicon.ico`, route `*` (404 avec page dédiée), redirection automatique standalone vers `/app`

## Étape 7 — Nettoyage (A-25, A-35)
- [x] Un seul fichier de verrouillage des dépendances (`yarn.lock` conservé, `package-lock.json` supprimé)
- [x] Composants orphelins supprimés (`AddFriendModal.jsx`, `FriendSelector.jsx`, `AddDrinkModal.jsx`, `InstallPrompt.jsx`, `ThemeToggle.jsx`)

## Étape 8 — Nouvelle carte du club
- [x] `src/mock.js` remplacé par la version validée (11 catégories à jour, Royal La Louvière Hockey Club)
- [x] Synchronisation automatique de version (`MENU_VERSION`) pour prise en compte immédiate sur les appareils existants

## Étape 8 bis — Corrections (1, 2, 4 et 6 de docs/VERIFICATION_Etapes_1-8.md)
- [x] Contraste WCAG ≥ 4,5:1 sur toutes les paires de jetons des 3 thèmes (`index.css`, `App.css`) ; `--foreground` et `--card-foreground` du thème gentbar remis à `0 0% 100%` (Problème 1)
- [x] Sauvegarde de l'ancienne carte dans `categories__backup` et purge automatique du panier pour les boissons obsolètes lors de la migration `MENU_VERSION` (Problème 2)
- [x] Son désactivé par défaut (`soundEnabled` à false si non défini) et suppression du toast « Boisson ajoutée » lors de l'ajout au panier (Problème 4)
- [x] `public/service-worker.js` et `public/workbox-*.js` retirés du suivi git (`git rm --cached`) et ajoutés au `.gitignore` ; build toujours intègre dans `build/` (Problème 6)

## Étape 8 ter — Points d'audit restants (3 sous-étapes, une par session)

### 8 ter-a — Logique et données
- [x] A-17 : popularité calculée par `drinkId` (conserver `drinkId` dans les lignes de l'historique ; repli sur le nom pour les anciennes commandes)
- [x] A-23 : formulaires — nom nettoyé (`trim`), prix vide (et non « 0 ») à l'ajout d'une boisson, notification sortie de la fonction de mise à jour d'état (`handleSaveCategory`)
- [x] A-14 : partage natif (`navigator.share`) avec repli « copier » ; entrée Messenger retirée
- [x] A-20 : un seul `AudioContext` réutilisé, protégé par `try/catch`, qui ne doit jamais empêcher l'ajout au panier

### 8 ter-b — Accessibilité et ergonomie
- [x] A-10 : touche Espace en plus d'Entrée sur les cartes de boissons
- [x] A-21 : `Badge` sans `role="status"`/`aria-live` global ; `DialogDescription` ajoutée aux 4 fenêtres (modification boisson, modification catégorie, historique, confirmation)
- [x] A-07 : `viewport-fit=cover` + marges `env(safe-area-inset-*)` pour la barre flottante du panier et le haut de page (iPhone)
- [x] A-18 : règle `prefers-reduced-motion`, transition globale limitée aux éléments concernés
- [x] A-12 : `size="xs"` inexistant remplacé (3 occurrences dans `OrderSummary`)

### 8 ter-c — Cohérence et nettoyage
- [x] A-26 : « Drink » / « Drink Order » remplacés par GentBar ; montants affichés au format français (`3,00 €`) via un utilitaire unique
- [x] A-27 : `navigator.storage.persist()` demandé au démarrage
- [x] A-09 : code mort du tri `'default'` retiré
- [ ] A-25 : dépendances sans aucun usage retirées (`axios`, `zod`, `next-themes`, `date-fns` — revérifier avant)

## Étape 9 — Nouvelles fonctionnalités *(une par session, dans cet ordre)*
- [ ] 9.1 E-4 Vue Ticket
- [ ] 9.2 E-9 Verrouillage de l'écran du ticket
- [ ] 9.3 E-8 Recommander la même tournée
- [ ] 9.4 E-7 Note libre sur une commande
- [ ] 9.5 E-3 Recherche dans le menu + E-10 Alerte de doublon
- [ ] 9.6 E-5 Tri par popularité par défaut
- [ ] 9.7 E-1 Récapitulatif de soirée et partage équitable
- [ ] 9.8 E-2 Cagnotte
- [ ] 9.9 E-11 Ajout en lot (texte collé)
- [ ] 9.10 A-29 Multi-bars (en sous-étapes, après la fusion A-04)

---

## Journal
* 09/10/2026 — Étape 1 terminée : création de `public/_redirects` pour les réécritures SPA Netlify (A-28), script de build aligné avec `workbox generateSW`, options `navigateFallback` et `cleanupOutdatedCaches` configurées dans `workbox-config.js`, et régénération du Service Worker dans `public/service-worker.js`. `yarn build` validé avec succès.
* 09/10/2026 — Étape 2 terminée : correction du titre/description selon le type dans `DeleteConfirmDialog` (A-36), synchronisation du panier (prix, nom, suppressions) dans `DrinkOrderApp` (A-06), transmission de `order` et `isCurrentOrder` à `ShareButtons` dans `OrderSummary` (A-37), remplacement de `onClose` par `onOpenChange` dans `EditDrinkModal` (A-31). `yarn build` validé avec succès.
* 09/10/2026 — Étape 3 terminée : thèmes unifiés via `index.css` et vérification des contrastes.
* 09/10/2026 — Étape 4 terminée : Sonner partout, suppression de l'ancien `use-toast`, boîtes de dialogue de confirmation ajoutées pour vider le panier (dans `OrderSummary` et dans la modale `ConfirmOrderModal`), confirmations ajoutées pour le retrait d'un article du panier et pour la suppression d'une commande dans l'historique (`OrderHistory`), recalage automatique de `currentPage` après suppression (`A-38`). Notifications repositionnées en haut au centre (`top-center`), plus courtes et discrètes pour ne pas masquer le panier sur mobile. `yarn build` validé avec succès.
* 09/10/2026 — Étape 8 terminée : remplacement de `src/mock.js` par la carte officielle validée (11 catégories, bières au fût/bouteille/sans alcool, alcools, cocktails, bulles & cidres, vins, softs, boissons chaudes, snacks, petite restauration). Ajout de `MENU_VERSION` dans `DrinkOrderApp.jsx` pour forcer le rafraîchissement automatique de la carte sur les téléphones ayant déjà ouvert l'application. `yarn build` validé avec succès.
* 10/10/2026 — Étape 5 terminée : création du module `src/lib/storage.js` avec chargement sûr (`load`, `save`), gestion d'erreurs, normalisation des données et backup automatique (`__backup`), remplacement des accès directs `localStorage` dans `DrinkOrderApp.jsx`, création et intégration de `ErrorBoundary` global (`src/components/ErrorBoundary.jsx`) évitant les pages blanches avec options de rechargement et de réinitialisation sécurisée, persistance du tri `sortBy` avec validation (`A-03`). `yarn build` validé avec succès.
* 10/10/2026 — Étape 6 terminée : création de `PWAContext` (écouteur unique `beforeinstallprompt`, détection standalone, feedback toast lors de l'installation), suppression de la bannière redondante `InstallBanner`, fiabilisation du bouton « Vérifier les mises à jour » sur la landing (appel réel à `registration.update()` avec notification Sonner), mise à jour du `manifest.json` (`purpose: any maskable`, `start_url: /app`), création du `favicon.ico` et du lien favicon SVG, ajout de la page 404 (`NotFoundPage`) sur la route `path="*"` et consolidation du `<Toaster />` unique à la racine de l'application. `yarn build` validé avec succès.
* 11/10/2026 — Étape 7 terminée : suppression de `package-lock.json` pour unifier le gestionnaire de paquets sur `yarn.lock` (`package.json`), suppression définitive des 5 composants orphelins (`AddFriendModal.jsx`, `FriendSelector.jsx`, `AddDrinkModal.jsx`, `InstallPrompt.jsx`, `ThemeToggle.jsx`). `yarn build` validé avec succès (138.8 kB JS, CSS allégé de 265 B).
* 11/10/2026 — Étape 8 bis terminée (branche `roadmap-fix`) : validation des contrastes WCAG ≥ 4,5:1 sur tous les thèmes (clair, sombre, gentbar) et rétablissement du blanc pur pour le texte gentbar, sécurisation de la migration de carte avec backup `categories__backup` et dédoublonnage/élagage du panier, son désactivé par défaut et suppression de la notification répétitive à chaque ajout de boisson au panier, exclusion git des fichiers service worker dans `public/` tout en garantissant leur génération propre dans `build/`. `yarn build` validé avec succès.
* 12/10/2026 — Étape 8 ter-a terminée (branche `roadmap-8ter`) : popularité calculée par `drinkId` avec repli nom (A-17), formulaires nettoyés avec `trim`, prix vide à l'ajout et extraction du `toast` de la fonction de mise à jour d'état `setCategories` (A-23), partage natif `navigator.share` prioritaire avec repli copier et suppression de Messenger (A-14), AudioContext partagé protégé par `try/catch` avec exécution de `onAdd` prioritaire (A-20). `yarn build` validé avec succès.

## Écarts et décisions en cours
* Étape 8 avancée à la demande explicite du propriétaire avant les étapes 5 à 7.
* Étape 8 bis exécutée sur la branche isolée `roadmap-fix` pour les points 1, 2, 4 et 6 de `docs/VERIFICATION_Etapes_1-8.md` sans impacter `main`.

## À tester par le propriétaire sur appareil
* Rendu visuel et lisibilité des textes sous le thème Gentbar (contraste texte blanc sur fond bleu nuit vérifié à plus de 14:1).
* Non-déclenchement de toast lors de l'ajout d'une boisson au panier (mise à jour directe du compteur du panier sans notification superflue).
* Persistance du tri : choisir un tri (ex. « Prix ↗ »), recharger la page ou naviguer vers la page d'accueil puis revenir sur l'application, vérifier que le tri reste conservé.
* Robustesse : tester le bon chargement des données sans aucun écran blanc même en cas de données corrompues.


