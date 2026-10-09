# PROGRESS — avancement de la feuille de route

*Fichier de reprise : à lire en premier à chaque session, à mettre à jour après chaque sous-tâche. Statuts : `[ ]` à faire · `[x]` fait (avec commit) · `[~]` déjà corrigé avant.*

**Branche de travail** : `roadmap` · **Étape en cours** : 1 (terminée) · **Dernier commit** : d253273

---

## Étape 1 — Fiabiliser le déploiement (A-28, A-05)
- [x] `public/_redirects` avec `/*  /index.html  200`
- [x] Commande de build alignée sur `workbox generateSW` ; `public/service-worker.js` régénéré (plus de hash périmés)

## Étape 2 — Bugs de confiance et d'argent (A-36, A-06, A-37, A-31)
- [x] Confirmation de suppression d'une boisson : bon titre/description selon le type (A-36)
- [x] Panier : prix/nom rafraîchis à l'ajout et à la modification d'une boisson (A-06)
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
* 09/10/2026 — Étape 1 terminée : création de `public/_redirects` pour les réécritures SPA Netlify (A-28), script de build aligné avec `workbox generateSW`, options `navigateFallback` et `cleanupOutdatedCaches` configurées dans `workbox-config.js`, et régénération du Service Worker dans `public/service-worker.js`. `yarn build` validé avec succès. Reste : Étape 2.

## Écarts et décisions en cours
*Aucun écart par rapport à la feuille de route.*

## À tester par le propriétaire sur appareil
* Tester le rechargement direct de `https://gentbar.netlify.app/app` après déploiement de la branche roadmap pour vérifier l'absence d'erreur 404 Netlify.
* Tester l'ouverture et le fonctionnement en mode avion (hors ligne) avec le nouveau Service Worker.

