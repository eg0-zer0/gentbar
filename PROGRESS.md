# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `feature-note` · **Prochaine étape** : 9.5 E-3 Recherche dans le menu + E-10 Alerte de doublon · **Dernier commit** : 13cfa2a

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
- [x] A-25 : dépendances sans aucun usage retirées (`axios`, `zod`, `next-themes`, `date-fns` — revérifier avant)

## Étape 9 — Nouvelles fonctionnalités *(une par session, dans cet ordre)*
- [x] 9.1 E-4 Vue Ticket
- [x] 9.2 E-9 Verrouillage de l'écran du ticket
- [x] 9.3 E-8 Recommander la même tournée
- [x] 9.4 E-7 Note libre sur une commande
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
* 12/10/2026 — Étape 8 ter-b terminée (branche `roadmap-8ter`) : touche Espace sur les cartes de boissons (A-10), DialogDescription ajoutée aux 4 fenêtres et nettoyage rôles ARIA (A-21), safe areas iOS `env(safe-area-inset-*)` et `viewport-fit=cover` (A-07), transitions ciblées et respect de `prefers-reduced-motion` (A-18), remplacement de `size="xs"` (A-12). `yarn build` validé avec succès.
* 12/10/2026 — Étape 8 ter-c terminée (branche `roadmap-8ter`) : harmonisation nom « GentBar » et formatage des montants francophone via utilitaire unique `formatPrice` dans `src/lib/format.js` (A-26), demande de stockage persistant `navigator.storage.persist()` au démarrage (A-27), retrait du code mort du tri `'default'` et des imports inutilisés (A-09), désinstallation des dépendances inutilisées `axios`, `zod`, `next-themes`, `date-fns` (A-25). `yarn build` validé avec succès (139.72 kB JS, 11.91 kB CSS).
* 12/10/2026 — Étape 9.1 terminée (branche `feature-ticket`) : création de la Vue Ticket plein écran (`TicketView.jsx`, E-4) pour la prise de commande au bar (design ultra-compact tenant sur un seul écran sans défilement, démarcation nette des familles de boissons par cartes indépendantes avec espacement léger et sans bandeaux/icônes superflus, noms complets sans troncature, cases « pris » mémorisées par commande avec compteur dynamique « X sur Y servis » et bouton tout cocher/décocher, retrait de la date/heure superflue en en-tête pour éviter tout chevauchement, total fixe via `formatPrice`, actions Partager/Recommander/Fermer sans chevauchement, retour garanti vers l'écran d'origine — historique ou carte —, bouton « Voir le ticket » réservé à l'écran de succès post-commande et à l'historique). `yarn build` validé avec succès (142.15 kB JS, 12.38 kB CSS).
* 12/10/2026 — Étape 9.2 terminée (branche `feature-ticket`) : verrouillage de l'écran pendant la prise de commande (`TicketView.jsx`, E-9). Bouton cadenas dans l'en-tête (icône `Lock` / `Unlock`), neutralisation de toutes les actions et boutons lorsque verrouillé (cases à cocher, fermeture, commande, et bouton Partager via `ShareButtons.jsx`), calque protecteur transparent prévenant les appuis accidentels en marchant ou en poche, déverrouillage fluide par double-tap n'importe où avec badge visuel indicatif (« Double-tapez pour déverrouiller »), blocage strict du défilement et du pull-to-refresh du navigateur (`touch-action: none`, `overscroll-behavior: none`, `touchmove preventDefault`), et état non persisté (ouvert déverrouillé). `yarn build` validé avec succès (142.89 kB JS, 12.61 kB CSS).
* 14/10/2026 — Étape 9.3 terminée (branche `feature-reorder`) : implémentation de la fonction partagée `reorderIntoCart` (`src/lib/reorder.js`, E-8). Résolution sécurisée des boissons par `drinkId` puis par nom normalisé (accents/casse), reprise stricte des prix et noms du menu actuel, omission sans plantage des boissons retirées de la carte avec avertissement toast (« X n'est plus au menu, non ajoutée »), cumul des quantités dans le panier en cours sans écrasement, accessibilité depuis l'historique des commandes (`OrderHistory.jsx`), la vue Ticket (`TicketView.jsx`) et l'écran de succès post-commande (`orderSuccessModal`), sécurisation et purge automatique des clés de stockage des coches orphelines/supprimées (`src/lib/storage.js`). `yarn build` validé avec succès (143.47 kB JS, 12.61 kB CSS).
* 14/10/2026 — Étape 9.4 terminée (branche `feature-note`) : ajout de la note libre sur une commande (`E-7`). Champ texte optionnel dans la modale de confirmation (`ConfirmOrderModal.jsx`) sous le total avec compteur (limite 100 car.), persistance de `order.note` dans `orderHistory` via `DrinkOrderApp.jsx`, normalisation sécurisée dans `src/lib/storage.js` (`isHistoryOrder`), affichage valorisé en tête de la vue Ticket (`TicketView.jsx`) avec icône `StickyNote` et contraste garanti, affichage sous la liste des consommations dans l'historique (`OrderHistory.jsx`), et inclusion automatique de la mention « 📌 Note : ... » dans le texte copié/partagé (`ShareButtons.jsx`). `yarn build` validé avec succès (143.91 kB JS, 12.68 kB CSS).

## Écarts et décisions en cours
* Étape 8 avancée à la demande explicite du propriétaire avant les étapes 5 à 7.
* Étape 8 bis exécutée sur la branche isolée `roadmap-fix` pour les points 1, 2, 4 et 6 de `docs/VERIFICATION_Etapes_1-8.md` sans impacter `main`.
* Maintien actif de l'écran (Screen Wake Lock) : non indispensable pour l'étape 9.2 selon retour utilisateur, consigné pour d'éventuelles améliorations UX ultérieures selon le support des navigateurs mobiles.
* Vue Ticket depuis le panier : restreinte aux commandes finalisées (écran de succès et historique) pour garantir l'intégrité de l'historique et des prix.

## À tester par le propriétaire sur appareil
* Rendu visuel et lisibilité des textes sous le thème Gentbar (contraste texte blanc sur fond bleu nuit vérifié à plus de 14:1).
* Non-déclenchement de toast lors de l'ajout d'une boisson au panier (mise à jour directe du compteur du panier sans notification superflue).
* Persistance du tri : choisir un tri (ex. « Prix ↗ »), recharger la page ou naviguer vers la page d'accueil puis revenir sur l'application, vérifier que le tri reste conservé.
* Robustesse : tester le bon chargement des données sans aucun écran blanc même en cas de données corrompues.
* Verrouillage du ticket : bouton Partager bien inerte en mode verrouillé, double-tap fluide pour déverrouiller.
* Recommander une tournée avec un panier déjà rempli : vérifier le cumul des quantités pour les boissons déjà présentes et l'ajout des nouvelles lignes sans écrasement du panier existant.
* Recommander une ancienne commande contenant une boisson supprimée du menu : vérifier l'avertissement « X n'est plus au menu, non ajoutée » et l'absence de tout plantage (aucun écran d'erreur).
* Points d'accès Recommander : tester depuis la carte de l'historique, depuis la vue Ticket et depuis l'écran de confirmation de commande (« Recommander cette tournée »).
* Note libre lors de la commande (E-7) : saisir une note dans la modale de confirmation (ex. « sans glaçons pour le mojito »), confirmer la commande, vérifier qu'elle s'affiche bien en évidence en haut de la vue Ticket avec l'icône, dans l'historique sous les articles, et dans le message partagé (WhatsApp/SMS/Copie).
* Commande sans note : vérifier qu'une commande validée sans note ne crée aucun bloc vide ni artefact visuel sur le ticket, l'historique ou le partage.


