# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `roadmap` · **Étape en cours** : 1 · **Dernier commit** : —

---

## Étape 1 — Fiabiliser le déploiement (A-28, A-05)
- [x] `public/_redirects` avec `/*  /index.html  200`
- [ ] Commande de build alignée sur `workbox generateSW` ; `public/service-worker.js` régénéré (plus de hash périmés)

## Étape 2 — Bugs de confiance et d'argent (A-36, A-06, A-37, A-31)
- [ ] Confirmation de suppression d'une boisson : bon titre/description selon le type (A-36)
- [ ] Panier : prix/nom rafraîchis à l'ajout et à la modification d'une boisson (A-06)
- [ ] Partage : `order` et `isCurrentOrder` transmis à `ShareButtons` (A-37)
- [ ] `EditDrinkModal` : `onClose` → `onOpenChange` (A-31)

## Étape 3 — Unifier les thèmes (A-01)
- [ ] Jetons Tailwind pilotés par `html.dark` / `html.gentbar` dans `index.css`
- [ ] Récapitulatif, en-tête, fenêtres, landing et composants `ui/*` vérifiés dans les 3 thèmes
- [ ] Contraste vérifié (≥ 4,5:1)

## Étape 4 — Notifications et actions destructives (A-02, A-13, A-38, E-6)
- [ ] Sonner partout, store `use-toast` supprimé, un seul `<Toaster />`
- [ ] Vider le panier : confirmation
- [ ] Pagination du panier : `currentPage` recalé après suppression
- [ ] Suppressions unifiées (toast « Annuler » pour les actions fréquentes, confirmation pour les actions larges)

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
- [ ] `src/mock.js` remplacé par la version validée

## Étape 9 — Nouvelles fonctionnalités *(uniquement sur demande explicite)*
*Ordre : E-3, E-10, E-5, E-7, E-8, E-4, E-9, E-11, E-1, A-29, E-2.*

---

## Journal
*Une ligne par session : date — étape — ce qui a été fait — ce qui reste.*

## Écarts et décisions en cours
*Points où le code actuel ne correspond pas à l'audit, fichiers modifiés hors liste (avec justification), questions en attente.*

## À tester par le propriétaire sur appareil
*Ce que l'agent n'a pas pu vérifier lui-même.*
