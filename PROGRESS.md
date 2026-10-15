# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `feat-multi` · **Prochaine étape** : 9.7b Modèle multi-bars + migration (un seul bar visible) · **Dernier commit** : f826ddc

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
- [x] 9.5 E-5 Tri par popularité par défaut
- [x] 9.6 E-3 Recherche + E-10 Alerte de doublon (fonctions prenant les catégories en paramètre)
- [x] 9.7a Extraction des états de DrinkOrderApp en hooks (sans changement visible)
- [ ] 9.7b Modèle multi-bars + migration (un seul bar visible)
- [ ] 9.7c Moteur de fusion mergeMenus (remplace MENU_VERSION)
- [ ] 9.7d Bouton du bar actif, Mes bars, ajout vide/copie, renommer/dupliquer/supprimer/restaurer
- [ ] 9.7e Partage et réception (lien, QR, fichier)
- [ ] 9.7f Commande sur deux bars
- [ ] 9.8 E-11 Ajout en lot (texte collé)
- [ ] 9.9a Socle Soirée (centimes, arrondis, contexte, données)
- [ ] 9.9b Parcours Soirée sans cagnotte
- [ ] 9.9c Cagnotte
- [ ] 9.9d Clôture, restitution, partage du résumé
- [ ] 9.10 Récapitulatif classique (sélection de tickets) — optionnel

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
* 14/10/2026 — Étape 9.4 terminée (branche `feature-note`) : ajout de la note libre sur une commande (`E-7`). Champ texte optionnel dans la modale de confirmation (`ConfirmOrderModal.jsx`) sous le total avec compteur (limite 100 car.), persistance de la note en cours dans le panier (`orderNote` via `localStorage`) pour éviter sa perte en fermant/rouvrant la modale lors de la prise de commande progressive de plusieurs amis, vidage automatique de la note lors de la confirmation ou du vidage du panier, persistance de `order.note` dans `orderHistory` via `DrinkOrderApp.jsx`, normalisation sécurisée dans `src/lib/storage.js` (`isHistoryOrder`), affichage valorisé en tête de la vue Ticket (`TicketView.jsx`) avec icône `StickyNote` et contraste garanti, affichage sous la liste des consommations dans l'historique (`OrderHistory.jsx`), inclusion automatique de la mention « 📌 Note : ... » dans le texte copié/partagé (`ShareButtons.jsx`), et réimport intelligent de la note lors de la recommandation d'une tournée (`reorderIntoCart` dans `src/lib/reorder.js` avec conservation de note existante et notifications séquentielles). `yarn build` validé avec succès (144.1 kB JS, 12.68 kB CSS).
* 14/10/2026 — Étape 9.5 terminée (branche `feature-tri`) : définition du tri par « Popularité » comme tri par défaut à l'ouverture de l'application (E-5) dans `DrinkOrderApp.jsx`. Ajout d'un tri secondaire alphabétique (`localeCompare`) dans `sortDrinks` en cas d'égalité de score de popularité ou de boissons sans commandes dans l'historique. Repositionnement de l'option « Popularité » en première position dans le menu déroulant de `SortControls.jsx` et correction du libellé par défaut du bouton de tri (`currentSort?.label || 'Popularité'`). Persistance du choix utilisateur dans `localStorage` (`storage.js`) intégralement préservée. `yarn build` validé avec succès.
* 15/10/2026 — Étape 9.6 terminée (branche `feature-search`) : implémentation de la recherche en direct dans le menu (E-3) et de l'alerte de doublon (E-10). Création du module partagé `src/lib/search.js` (`normalizeText` insensible aux accents/casse, recherche multi-catégories `searchDrinks`, détection de doublons `findDuplicateDrinkName`) avec harmonisation dans `reorder.js`. Création du composant `MenuSearch.jsx` avec effacement rapide et touche Échap. Affichage instantané des résultats à plat mémoïsé (`useMemo`) avec rappel de la catégorie d'origine via `DrinkCard.jsx` (dans les 3 modes de vue), message informatif en cas d'aucun résultat et restauration intégrale de l'état des catégories (plié/déplié) à l'effacement. Dans `EditDrinkModal.jsx`, détection automatique en temps réel des doublons de noms dans la même catégorie avec affichage d'un avertissement ambré non-bloquant. `yarn build` validé avec succès (145.37 kB JS, 12.79 kB CSS).
* 15/10/2026 — Ergonomie en-tête & barre d'actions (branche `feature-search`) : allègement drastique de l'en-tête sur mobile (Proposition 1). Remplacement du slogan verbeux par l'identité concise « 🍹 GentBar » accompagnée du badge du bar actif « 🏒 Club de hockey » (préparant le multi-bars A-29). Déplacement de l'action « Ajouter une catégorie » hors du haut de page et intégration exclusive dans le menu burger ☰ avec l'icône `FolderPlus`. Fusion sur une seule ligne réactive de la recherche `MenuSearch` et du bouton de tri `SortControls` (avec label visuel épuré et alignement à droite du menu). Réduction des marges supérieures de la page, divisant par deux la hauteur occupée et rendant immédiatement visibles les boissons sur smartphone sans défilement.
* 15/10/2026 — Étape 9.7a terminée (branche `feat-multi`) : extraction modulaire des états et de la logique métier de `DrinkOrderApp.jsx` en 5 custom hooks dédiés (`useStoredState`, `useCart`, `useMenus`, `useOrderHistory`, `useDrinkFilter`) ainsi que du verrouillage d'écran TicketView dans `useTicketLock`. Allègement massif de `DrinkOrderApp.jsx` (-156 lignes) sans aucune modification fonctionnelle ni visuelle. Préparation des ancrages `sessionId` et `paidFromPot` pour le mode Soirée. Sécurisation défensive contre les données corrompues et initialisation robuste de `categories` via `storage.js` et `useMenus.js`. `yarn build` validé avec succès (146.51 kB JS, 12.86 kB CSS).

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
* Persistance de la note dans le panier en cours : taper une note dans la modale de confirmation, fermer la modale, continuer à ajouter des boissons, et rouvrir la modale : la note doit être toujours présente.
* Recommander avec note reprise : recommander une tournée qui avait une note (alors que le panier n'a pas de note) : vérifier que la note est automatiquement reprise dans le panier et que la notification indique « Note reprise : "..." ».
* Recommander avec conflit de note : si le panier a déjà une note saisie et qu'on recommande une commande ayant aussi une note : vérifier que la note actuelle du panier est conservée et qu'une notification informe que l'ancienne note n'a pas été importée.
* Tri par popularité par défaut (E-5) : à l'ouverture de l'application (ou après effacement des données de navigation), le tri actif est automatiquement « Popularité » ; les boissons les plus commandées s'affichent en tête de chaque section, et celles à score égal sont rangées par ordre alphabétique. Si on change pour « Prix ↗ » ou « Alphabétique », ce choix reste persisté au rechargement.
* Recherche en direct dans le menu (E-3) : saisir un mot (ex: « blanche », « coca », « jup ») dans la barre de recherche au-dessus du menu : les boissons correspondantes de toutes les catégories s'affichent instantanément à plat avec leur catégorie d'origine indiquée en petit. Vérifier que la recherche est insensible aux accents et à la casse (« leffe » trouve « Leffe Blonde »). Effacer la recherche (croix ou touche Échap) : les catégories reprennent exactement leur état précédent (plié/déplié). Saisir une chaîne inexistante (ex. « xyz ») : vérifier le message « Aucune boisson ne correspond à « xyz » » et le bouton d'effacement.
* Alerte de doublon de nom (E-10) : ouvrir une catégorie (ex. Bières au fût), cliquer sur « + » pour ajouter une boisson, et taper le nom d'une bière déjà présente (ex. « Jupiler ») : un encadré d'avertissement ambré apparaît immédiatement sous le champ pour signaler que la boisson existe déjà dans cette catégorie. Vérifier que l'ajout reste possible en cliquant sur Ajouter (alerte informative non-bloquante). Tester également en modification de nom d'une boisson existante.
* En-tête compact et barre d'actions (Proposition 1) : vérifier que l'en-tête affiche de façon sobre « 🍹 GentBar » et la pilule « 🏒 Club de hockey » sans le slogan verbeux. Vérifier que la barre de recherche et le sélecteur de tri sont côte à côte sur la même ligne. Vérifier que l'option « Ajouter une catégorie » est présente et fonctionnelle dans le menu burger ☰ et qu'elle n'encombre plus l'écran principal. Vérifier que les premières catégories et boissons sont immédiatement visibles sans avoir besoin de faire défiler la page.
* Non-régression complète suite au découpage en hooks (9.7a) : vérifier que l'ensemble du cycle de commande fonctionne de manière strictement identique (ajout au panier avec bouton +/-, ouverture du panier, saisie de note, confirmation, ouverture du ticket, verrouillage par cadenas/double-tap, historique, recommandation de tournée, recherche et tri).



