# Feuille de route — GentBar Order App

Document court, à lire en premier. Le détail technique complet de chaque point (cause exacte, code, raisonnement) est dans `AUDIT_GentBar_Order_App.md` — les références entre parenthèses (ex. `A-06`, `E-3`) y renvoient directement.

## Avant de commencer

- **Dépôt** : `github.com/eg0-zer0/gentbar`, branche `main` — poussée automatiquement sur `gentbar.netlify.app` à chaque commit, c'est donc bien la seule version à considérer.
- `git pull` sur `main` pour partir de la dernière version (ce document se base sur le commit `92d4a70`).
- Nouvelle carte du club déjà prête : le fichier `mock.js` fourni séparément remplace directement `src/mock.js` (voir Étape 8).
- Avance phase par phase, dans l'ordre ci-dessous — chaque phase est pensée comme une petite PR indépendante, testable seule.

---

## Étape 1 — Fiabiliser le déploiement (prioritaire, tout le reste en dépend)

- [x] Ajouter `public/_redirects` avec la ligne `/*  /index.html  200` — corrige le 404 au rechargement de `/app`
- [x] Aligner la commande de build Netlify sur celle qui génère le service worker (`workbox generateSW`), et régénérer `public/service-worker.js` pour qu'il référence les bons fichiers (plus de hash périmés)

**Fichiers** : `public/_redirects` (à créer), `package.json`, `workbox-config.js`, `public/service-worker.js`
**Détail** : `A-28`, `A-05`

---

## Étape 2 — Bugs qui touchent la confiance et l'argent

- [x] Suppression d'une boisson : corriger le texte trompeur « Supprimer la catégorie » (le composant de confirmation n'a jamais le bon titre/description — construire `title`/`description` selon `deleteDialog.type`)
- [x] Panier : rafraîchir `price` et `drinkName` d'une ligne déjà présente quand on la rajoute (`handleAddDrink`), et répercuter une modification de prix du menu sur les lignes déjà dans le panier
- [x] Partage : transmettre `order={orders}` et `isCurrentOrder={true}` à `<ShareButtons />` depuis `OrderSummary.jsx` (actuellement appelé sans aucune prop → envoie toujours « Aucune commande à partager »)
- [x] Fenêtre de modification d'une boisson : remplacer `onClose={onClose}` par `onOpenChange={onClose}` (une ligne) — c'est pour ça que la croix ne ferme pas

**Fichiers** : `src/components/DeleteConfirmDialog.jsx`, `src/components/DrinkOrderApp.jsx`, `src/components/OrderSummary.jsx`, `src/components/EditDrinkModal.jsx`
**Détail** : `A-36`, `A-06`, `A-37`, `A-31`

---

## Étape 3 — Unifier les thèmes

- [x] Choisir un seul système de couleurs entre les deux qui coexistent aujourd'hui : celui basé sur `[data-theme]` (`index.css`, encore utilisé par `OrderSummary`, `Header`, les fenêtres, les composants `ui/*`) et celui basé sur les classes `.dark`/`.gentbar` + variables RGB (`App.css`, déjà utilisé par `DrinkCard`/`CategorySection`)
- [x] Migrer les composants restants vers le système conservé, pour que le récapitulatif de commande et les fenêtres changent bien de couleur avec le thème
- [x] Vérifier le contraste dans les 3 thèmes, sur tous les écrans

**Fichiers** : `src/index.css`, `src/App.css`, `tailwind.config.js`, `src/components/OrderSummary.jsx`, `src/components/Header.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/DeleteConfirmDialog.jsx`, `src/components/LandingPage.jsx`, `src/components/ui/*.jsx`
**Détail** : `A-01`

---

## Étape 4 — Notifications et actions destructives

- [x] Réparer l'affichage des notifications : soit migrer tous les appels `useToast()` vers Sonner (`toast.success(...)`), soit remplacer `<Toaster/>` (Sonner) par le composant `toaster.jsx` compatible avec `useToast` — une seule des deux options, pas les deux systèmes en parallèle
- [x] Vider le panier : ajouter une confirmation (`DeleteConfirmDialog`)
- [x] Pagination du panier : recaler `currentPage` quand `orders.length` change, pour ne pas rester bloqué sur une page vide après suppression
- [x] Une fois les notifications réparées : unifier le style des suppressions — toast « Supprimé — Annuler » pour les actions fréquentes (une ligne du panier, une commande de l'historique), confirmation uniquement pour les actions larges (vider tout, supprimer une catégorie)

**Fichiers** : `src/components/DrinkOrderApp.jsx`, `src/hooks/use-toast.js`, `src/components/ui/sonner.jsx`, `src/components/ui/toaster.jsx`, `src/components/OrderSummary.jsx`
**Détail** : `A-02`, `A-13`, `A-38`, `E-6`

---

## Étape 5 — Robustesse

- [x] Encapsuler toutes les lectures/écritures `localStorage` dans un petit module (`try/catch`, validation, valeur de repli) plutôt que des `JSON.parse` directs
- [x] Ajouter un `ErrorBoundary` React global (écran « Une erreur est survenue » + bouton recharger)
- [x] Persister `sortBy` de la même façon que `viewMode` (actuellement jamais sauvegardé)

**Fichiers** : `src/components/DrinkOrderApp.jsx`, nouveau `src/lib/storage.js`, nouveau `src/components/ErrorBoundary.jsx`
**Détail** : `A-08`, `A-03`

---

## Étape 6 — Installation et PWA

- [x] Partager une seule instance de l'écouteur d'installation (`beforeinstallprompt`) entre tous les boutons (contexte React dédié), au lieu d'un `usePWA()` séparé par composant
- [x] Supprimer le second rendu d'`InstallBanner` (actuellement affiché à la fois dans `App.jsx` et dans `DrinkOrderApp.jsx`)
- [x] « Vérifier les mises à jour » : lui donner un vrai comportement (`registration.update()` + retour visible), ou le retirer s'il fait doublon avec « Accéder à l'application »
- [x] Manifest : ajouter `"purpose": "any maskable"` aux icônes, ajouter un `favicon.ico`, ajouter une route `*` (404) dans le routeur

**Fichiers** : `src/hooks/usePWA.js`, nouveau `src/contexts/PWAContext.jsx`, `src/components/InstallBanner.jsx`, `src/components/Header.jsx`, `src/components/LandingPage.jsx`, `public/manifest.json`, `src/App.jsx`
**Détail** : `A-30`, `A-16`, `A-24`

---

## Étape 7 — Nettoyage

- [x] Choisir un seul gestionnaire de paquets (`yarn.lock` **ou** `package-lock.json`, pas les deux)
- [x] Supprimer les composants orphelins : `AddFriendModal.jsx`, `FriendSelector.jsx`, `AddDrinkModal.jsx`, `InstallPrompt.jsx` (fonctionnalité « commande par ami » non retenue, voir contexte produit)
- [x] `ThemeToggle.jsx` : supprimer, ou le réutiliser si prévu quelque part (son code est déjà correct, juste inutilisé)

**Fichiers** : `package.json`, `yarn.lock`/`package-lock.json`, composants listés ci-dessus
**Détail** : `A-25`, `A-35`

---

## Étape 8 — Nouvelle carte du club

- [x] Remplacer `src/mock.js` par le fichier déjà validé (11 catégories, carte du Royal La Louvière Hockey Club à jour)

**Fichiers** : `src/mock.js`

---

## Étape 8 bis — Corrections de vérification (contraste WCAG, migration carte, notifications, SW)

- [x] Contraste WCAG ≥ 4,5:1 sur toutes les paires de jetons des 3 thèmes (`index.css`, `App.css`) ; remise de `--foreground` et `--card-foreground` à blanc pur pour Gentbar ; normalisation des modales (`ConfirmOrderModal`, `SortControls`, `OrderHistory`)
- [x] Sauvegarde de l'ancienne carte dans `categories__backup` et purge automatique du panier des boissons devenues obsolètes lors d'une migration `MENU_VERSION`
- [x] Son désactivé par défaut si non paramétré et suppression du toast redondant à chaque ajout de boisson au panier
- [x] Alignement horizontal et égalisation de la taille du bouton de suppression dans les fenêtres d'édition (`EditDrinkModal`, `EditCategoryModal`)
- [x] Retrait de `public/service-worker.js` et `public/workbox-*.js` du suivi git (`git rm --cached`) avec ajout au `.gitignore` ; génération automatique propre assurée dans `build/`

**Fichiers** : `src/index.css`, `src/App.css`, `src/components/DrinkOrderApp.jsx`, `src/components/ConfirmOrderModal.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/SortControls.jsx`, `src/components/OrderHistory.jsx`, `src/components/ui/input.jsx`, `.gitignore`

---

## Étape 8 ter — Points d'audit restants

### 8 ter-a — Logique et données

- **A-17** : `src/components/DrinkOrderApp.jsx` (calcul de popularité, finalizeOrder doit enregistrer drinkId), `src/lib/storage.js` (la normalisation de l'historique doit conserver drinkId)
- **A-23** : `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/DrinkOrderApp.jsx`
- **A-14** : `src/components/ShareButtons.jsx`
- **A-20** : `src/components/DrinkCard.jsx`

### 8 ter-b — Accessibilité et ergonomie

- **A-10** : `src/components/DrinkCard.jsx`
- **A-21** : `src/components/ui/badge.jsx`, `EditDrinkModal.jsx`, `EditCategoryModal.jsx`, `OrderHistory.jsx`, `ConfirmOrderModal.jsx`
- **A-07** : `public/index.html`, `src/App.css`
- **A-18** : `src/index.css`, `src/App.css`
- **A-12** : `src/components/OrderSummary.jsx`

### 8 ter-c — Cohérence et nettoyage

- **A-26** : `public/index.html`, `LandingPage.jsx`, `ShareButtons.jsx`, `OrderHistory.jsx`, `OrderSummary.jsx`, `ConfirmOrderModal.jsx`, nouveau `src/lib/format.js`
- **A-27** : `src/components/DrinkOrderApp.jsx` (ou `src/index.js`)
- **A-09** : `src/components/DrinkOrderApp.jsx`
- **A-25** : `package.json`, `yarn.lock`

*Hors périmètre de cette étape : A-04 (fusion de carte, préalable du multi-bars), A-33 (performance : mesurer avant d'agir), A-35 (couleurs CMJN du club, décision à prendre avec le club).*

---

## Étape 9 — Nouvelles fonctionnalités (détail dans l'audit, section « Nouvelles fonctionnalités détaillées »)

| # | Fonctionnalité | Fichiers principaux |
|---|---|---|
| **9.1** | **E-4** Vue Ticket | nouveau `TicketView.jsx`, `OrderSummary.jsx` (bouton « Voir le ticket »), `ConfirmOrderModal.jsx` (ouverture après confirmation), `OrderHistory.jsx` (ouvrir un ticket passé), `DrinkOrderApp.jsx`, `App.css` |
| **9.2** | **E-9** Verrouillage | `TicketView.jsx` |
| **9.3** | **E-8** Recommander | `OrderHistory.jsx`, `ConfirmOrderModal.jsx`, `DrinkOrderApp.jsx` |
| **9.4** | **E-7** Note libre | `ConfirmOrderModal.jsx`, `DrinkOrderApp.jsx`, `OrderHistory.jsx`, `ShareButtons.jsx`, `TicketView.jsx` |
| **9.5** | **E-5** Tri par popularité par défaut | `SortControls.jsx`, `DrinkOrderApp.jsx` |
| **9.6** | **E-3** Recherche + **E-10** Doublon | nouveau `MenuSearch.jsx`, nouveau `src/lib/search.js`, `DrinkOrderApp.jsx`, `CategorySection.jsx`, `EditDrinkModal.jsx` |
| **9.7** | **A-29** Multi-bars | sous-étapes : (a) modèle de données et sélecteur, (b) fusion A-04 en remplacement de MENU_VERSION, (c) partage par lien/QR, (d) commande sur deux bars |
| **9.8** | **E-11** Ajout en lot | nouveau `BulkAddDrinksModal.jsx`, nouveau `src/lib/parseDrinkList.js`, `CategorySection.jsx` |
| **9.9** | **E-2** Cagnotte | nouveau `CagnotteContext.jsx` et `CagnotteModal.jsx`, `Header.jsx`, `ConfirmOrderModal.jsx`, `App.css` |
| **9.10** | **E-1** Récap. et partage équitable | nouveau `SplitBillModal.jsx`, nouveau `src/lib/split.js` (arrondi, réutilisé par E-2), `OrderHistory.jsx`, `DrinkOrderApp.jsx` |

## Étape 10 — Nettoyage et tests finaux de l'application

| # | Tâche | Fichiers principaux |
|---|---|---|
| **10.1** | **Unification des thèmes** : suppression du double système (suppression du bloc RGB dans `App.css`), centralisation absolue dans `src/index.css` via variables HSL, composants 100% agnostiques (tokens sémantiques universels), suppression des classes `dark:` en dur et nettoyage de `tailwind.config.js`. | `src/index.css`, `src/App.css`, `tailwind.config.js`, `src/components/**/*.jsx` |
| **10.2** | **Audit final Lighthouse & PWA** : validation sur build de production (`yarn build`), mesure de performance réelle (>90/100), accessibilité, PWA hors-ligne et installation. | `build/`, `workbox-config.js` |

---

## Pour chaque étape

1. Lire le détail des points concernés dans `AUDIT_GentBar_Order_App.md` (reproduction du bug, cause exacte, correction proposée).
2. Développer et tester sur un appareil réel (Android au minimum), pas seulement en navigateur desktop.
3. Vérifier qu'aucune régression n'apparaît sur la liste « Confirmé comme fonctionnant correctement » du document complet (totaux, boutons +/-, tri par prix, mode hors ligne…).
4. Cocher l'étape ici une fois déployée sur Netlify et revérifiée en ligne.
