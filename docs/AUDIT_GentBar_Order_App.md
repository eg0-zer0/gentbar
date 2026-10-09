# Audit consolidé — GentBar Order App (PWA React)

## 0. À traiter en premier (top 10)

*Mis à jour après lecture directe du dépôt (`github.com/eg0-zer0/gentbar`, branche `main`, commit `92d4a70`). Plusieurs points du précédent « top 10 » sont déjà corrigés sur `main` (vue persistée, clavier, responsive, double ThemeProvider, suppression d'une commande, iOS) — ils ont été retirés d'ici ; vérifie seulement qu'ils sont bien déployés sur le site Netlify. La liste ci-dessous ne retient que ce qui reste réellement à faire.*

*Effort indicatif : **S** < 1 h · **M** ≈ une demi-journée · **L** ≈ 1 à 2 jours.*

| # | Action | Points | Effort |
|---|---|---|---|
| 1 | Ajouter la réécriture SPA Netlify (`public/_redirects` : `/*  /index.html  200`) ; régénérer le service worker avec les bons hash | A-28, A-05 | S |
| 2 | Corriger la confirmation de suppression d'une boisson (texte « catégorie » au lieu de « boisson ») — touche 100 % des suppressions | A-36 | S |
| 3 | Transmettre la commande réelle à `ShareButtons` (`order={orders}`) — le partage envoie actuellement toujours « Aucune commande à partager » | A-37 | S |
| 4 | Panier ↔ menu : rafraîchir prix et nom à l'ajout et à la modification | A-06 | S–M |
| 5 | Unifier les deux systèmes de thème (migrer `OrderSummary`, `Header`, les fenêtres et les composants `ui/*` vers le système déjà utilisé par `DrinkCard`) | A-01 | M |
| 6 | Changer `onClose` en `onOpenChange` dans `EditDrinkModal.jsx` (une ligne) | A-31 | S |
| 7 | Stockage sûr (`try/catch`, validation) + `ErrorBoundary` | A-08 | M |
| 8 | Confirmations / annulation (vider le panier, supprimer une ligne) | A-13 | M |
| 9 | Partage natif (`navigator.share`), retirer Messenger | A-14 | S |
| 10 | Persister `sortBy` ; corriger la pagination du panier après suppression ; supprimer le doublon d'`InstallBanner` sur `/app` | A-03, A-38, A-30 | M |

**Déjà corrigé sur `main` (à vérifier seulement sur le site déployé)** : persistance du mode d'affichage, clavier sur les cartes, détection mobile réactive, double `ThemeProvider`, suppression d'une commande de l'historique, aide à l'installation iOS, barre flottante (padding ajouté), option de tri trompeuse retirée.

**Ensuite** : mise à jour de la carte de base par fusion (A-04), multi-bars et partage de carte par lien (A-29), refactorisation progressive restante (A-32), performance mesurée (A-33), nettoyage du code mort et des deux lockfiles (A-25).

*Document mis à jour le 01/10/2026 — sources : audit de l'ami, seconde analyse, tests sur Android (Chrome, site Netlify), mesure DevTools Coverage, second plan d'un ami, lecture directe du code source sur GitHub.*

---

## 1. Contexte produit

**But de l'application** : permettre à la personne qui va chercher les boissons de **centraliser la commande du groupe** et d'avoir un **mémo à montrer/lire au bar**. Ce n'est **pas** une application de commande « par ami » : aucune attribution par personne n'est attendue.

**Conséquences sur le périmètre**
- `FriendSelector.jsx` et `AddFriendModal.jsx` sont du code mort → à supprimer.
- L'écran principal à optimiser est le **récapitulatif de commande** (lisible d'un coup d'œil, au bar, souvent en pleine lumière ou en soirée, d'une main).

**Précisions du propriétaire (à respecter)**
- Le **menu de base** reproduit la carte du club de hockey où se trouve le Gent Bar. Il est entièrement modifiable (prix, nom, icône/logo, ajout/suppression).
- Idée retenue : un **sélecteur de bar**, pour que chacun puisse créer et garder ses propres listes de tarifs (autres bars).
- L'**historique** sert surtout à **recommander une tournée déjà prise**, et éventuellement à **vérifier un montant** (la même personne gère la cagnotte).
- **Cocher les boissons au comptoir** : fonction **accessoire, optionnelle**.
- Application distribuée en **PWA**, **sans store**, réservée à un cercle d'amis, hébergée sur **Netlify**. Cibles : **Android et iPhone** (installation depuis le navigateur).

**Stack** : React 19, CRA 5 + CRACO, Tailwind 3, composants shadcn/Radix, React Router 7, persistance `localStorage`, PWA (Workbox). Routes : `/` (landing), `/app`.

**Sources de cet audit** : (1) audit statique d'un ami (25 points F-01 à F-25), (2) seconde analyse indépendante. Chaque point a été **revérifié dans le code fourni**. Le build/les tests n'ont pas pu être exécutés (pas de `node_modules`) : les points marqués « à vérifier sur appareil » demandent un test visuel.

**Gravités**
- **P0** : bloque l'usage ou panne immédiate
- **P1** : fonctionnalité majeure dégradée, perte de données, lisibilité gravement atteinte
- **P2** : défaut visible ou risque intermittent
- **P3** : dette, polish, cohérence

---

## 2. Vérification de l'audit de l'ami

| ID ami | Verdict | Commentaire |
|---|---|---|
| F-01 (P0 crash `Toaster`/`next-themes`) | **Faux (pas de crash)** | Vérifié dans le paquet `next-themes@0.4.6` : `useTheme()` sans provider renvoie un contexte par défaut (`setTheme` vide, `theme` indéfini). `theme = "system"` est alors utilisé. Reste un vrai défaut mineur : le thème de Sonner ne suit pas le thème de l'app → **P3** (voir A-19). |
| F-02 (toasts invisibles) | **Confirmé, P1** | Voir A-02. |
| F-03 (build PWA) | **Confirmé, P1** | Voir A-05. Plus grave que décrit : le SW écrit à la main peut échouer à s'installer. |
| F-04 (panier obsolète) | **Confirmé, P1** | Voir A-06. |
| F-05 (cartes clavier) | **Confirmé, P1** | Voir A-10. |
| F-06 (overlay mobile) | **Confirmé, P1** | Voir A-11. |
| F-07 (JSON corrompu) | **Confirmé, P1** | Voir A-08. |
| F-08 (tri « Par Catégorie ») | **Confirmé, P2** | Voir A-09. |
| F-09 (`innerWidth`) | **Confirmé, P2** | Voir A-15. |
| F-10 (vues denses) | **Partiellement exact** | La vue *Compact* affiche bien la pastille de quantité (l'ami dit le contraire). Compact masque prix + popularité ; *Minimal* masque prix, quantité, popularité **et n'a aucun retour visuel à l'ajout**. Voir A-12. |
| F-11 (double enregistrement SW) | **Confirmé, P2** | Voir A-16. |
| F-12 (« Vérifier les mises à jour ») | **Confirmé, P2** | Voir A-16. |
| F-13 (recalculs) | **Vrai mais surévalué → P3** | Le menu compte ~60 éléments : impact réel négligeable. |
| F-14 (transitions `*`, reduced-motion) | **Confirmé, P2** | Voir A-18. |
| F-15 (vidage sans confirmation) | **Confirmé, P2** | Voir A-13. |
| F-16 (popularité par nom) | **Confirmé, P2** | Voir A-17. |
| F-17 (écritures localStorage) | **Confirmé, P2** | Voir A-08. |
| F-18 (partage Messenger) | **Partiellement exact** | Icône identique WhatsApp/Messenger : oui. « Deux notifications » : non, `TOAST_LIMIT = 1` fait que la 2ᵉ remplace la 1ʳᵉ. Le vrai correctif est `navigator.share`. Voir A-14. |
| F-19 (AudioContext) | **Confirmé → P3 avec nuance** | Si `AudioContext` n'existe pas ou échoue, l'exception survient **avant** `onAdd` : la boisson n'est pas ajoutée. Voir A-20. |
| F-20 (boutons sans nom) | **Confirmé, P2** | Complété : boutons +/− du panier aussi. Voir A-21. |
| F-21 (chemins absolus) | **Vrai, P3** | Sans impact si hébergé à la racine. Voir A-24. |
| F-22 (outillage) | **Vrai mais P3** | Un build existe (donc la chaîne fonctionne aujourd'hui). Lockfile et tests restent recommandés. Voir A-25. |
| F-23 (historique fictif) | **Confirmé, P3** | Voir A-22. |
| F-24 (favicon) | **Confirmé, P3** | Aucun `favicon.ico` dans `public/`. Voir A-24. |
| F-25 (double ThemeProvider) | **Confirmé, P3** | Voir A-19. |

*Note : le document de l'ami contient quelques caractères parasites (mots en chinois/portugais) sans incidence ; les numéros de lignes cités n'ont pas été repris car non vérifiables. Les fichiers/fonctions sont cités à la place.*

**Points absents de l'audit de l'ami, découverts à la vérification** : A-01 (thèmes sombre/Gent Bar cassés), A-03 (mode d'affichage non persisté), A-04 (menu jamais mis à jour côté utilisateur), A-07 (panier flottant qui masque le contenu), et plusieurs P2/P3.

---

## 3. Résumé des problèmes

| ID | Gravité | Domaine | Problème |
|---|---|---|---|
| A-01 | **P1** | Design/Accessibilité | Thèmes « sombre » et « Gent Bar » : classes `dark:` jamais actives → titre invisible, texte blanc sur fond clair |
| A-02 | **P1** | Fonctionnel | Aucune notification (toast) ne s'affiche : mauvais composant `Toaster` |
| A-03 | **P2→P3** | Persistance | Mode d'affichage : **corrigé** sur `main` (`ViewModeContext`) ; le tri (`sortBy`), lui, reste non persisté |
| A-04 | **P1** | Données | Le menu modifié dans `mock.js` n'atteint jamais les appareils existants ; aucune sauvegarde/export |
| A-05 | **P2** | PWA | Build/Service Worker incohérents (l'hors ligne fonctionne aujourd'hui, mais un déploiement peut le casser), page « serveur hors ligne » trompeuse |
| A-06 | **P1** | Intégrité | Modifier/supprimer une boisson ou catégorie laisse le panier obsolète |
| A-07 | **P1→à confirmer** | Ergonomie mobile | Barre panier flottante : **`padding-bottom: 80px` déjà ajouté** sur `main` (probablement suffisant, à confirmer visuellement) ; zone de sécurité (encoche) toujours absente |
| A-08 | **P1** | Robustesse | `localStorage` corrompu/plein = écran blanc ; aucun `ErrorBoundary` |
| A-09 | **P3** | Fonctionnel | Tri « Par Catégorie » : **option retirée** du sélecteur sur `main`, code mort résiduel sans impact |
| A-10 | **P1→Corrigé** | Accessibilité | Cartes de boissons : **`role`/`tabIndex`/`onKeyDown` ajoutés sur `main`** (reste à gérer la touche Espace) |
| A-11 | **P1** | Accessibilité | Détail du panier mobile : faux dialogue (pas de focus, Échap, etc.) |
| A-12 | **P2** | Ergonomie | Vues Compact/Minimal : infos manquantes, pas de retour à l'ajout, débordement probable des boutons |
| A-13 | **P2** | Ergonomie | « Vider la commande » immédiat, à côté de « Confirmer » |
| A-14 | **P2** | Partage | Partage : Messenger factice, `window.open` sur mailto/sms, pas de `navigator.share` |
| A-15 | **Corrigé** | Responsive | **`useMediaQuery` réactif ajouté, une seule instance du panier** sur `main` |
| A-16 | **P2** | PWA | Double enregistrement SW, flux de mise à jour incohérent, bouton « Vérifier » factice |
| A-17 | **P2** | Données | Popularité calculée par nom, pas par identifiant |
| A-18 | **P2** | Performance/A11y | Transition sur `*`, aucun `prefers-reduced-motion` |
| A-19 | **P3→partiel** | Architecture | Double `ThemeProvider` : **corrigé** sur `main` ; `ThemeToggle` réparé mais toujours inutilisé ; thème Sonner inchangé |
| A-20 | **P3** | Audio | Web Audio non protégé |
| A-21 | **P2** | Accessibilité | Boutons icônes sans nom, `Badge` en live-region globale, titres non sémantiques, descriptions de dialogue absentes |
| A-22 | **P3** | Données | Historique fictif, historique non borné, pas de purge |
| A-23 | **P2** | Ergonomie | Écrans/formulaires : détails de saisie, notifications trop nombreuses, libellés |
| A-24 | **P3** | PWA/Déploiement | `start_url`, chemins absolus, favicon, icônes maskable, 404, `theme-color` |
| A-25 | **P3** | Qualité | Pas de tests/lockfile, dépendances et code mort |
| A-26 | **P3** | Design | Couleurs codées en dur hors charte, incohérences de nom, format monétaire |
| A-27 | **P1→largement traité** | Compatibilité iPhone | **`IosInstallPopup.jsx` ajouté sur `main`** (détection iOS, instructions, overlay accessible) ; stockage local Safari toujours à traiter |
| A-28 | **P1** | Déploiement Netlify | Aucune règle de réécriture SPA dans l'arborescence : `/app` rechargé ou ouvert directement = 404 ; commande de build à aligner |
| A-29 | **P2** | Fonctionnel (nouveau) | Multi-bars : plusieurs cartes de tarifs, partage par lien |
| A-30 | **P2** | PWA | Boutons d'installation : toujours inerte sur `main` (`usePWA.js` inchangé) ; **nouveau : `InstallBanner` rendu deux fois sur `/app`** malgré la décision de le supprimer |
| A-31 | **P2** | Ergonomie | Fenêtre de modification : croix inopérante — **cause exacte trouvée** (`onClose` au lieu de `onOpenChange`, une ligne), isolée à `EditDrinkModal.jsx` |
| A-32 | **P3** | Architecture | `App.js` = « God file » ; `DrinkCard` triplé ; plan de découpage progressif |
| A-33 | **P3** | Performance | Mesure Coverage à interpréter (tailles brutes, pas des octets transférés) ; actions réalistes |
| A-34 | **Corrigé** | Fonctionnel | Historique : **`handleRemoveOrder` ajouté et câblé** sur `main` |
| A-35 | **P3** | Divers | Couleurs CMJN du club à vérifier, `ThemeToggle`, `EditDrinkModal`, `InstallBanner` (compléments du second plan) |
| A-36 | **P1** | Fonctionnel/Confiance | Confirmation de suppression d'une boisson affichant le texte « Supprimer la catégorie » — **touche 100 % des suppressions**, cause exacte trouvée |
| A-37 | **P1** | Fonctionnel (nouveau) | Partage : `ShareButtons` ne reçoit jamais la commande, envoie toujours « Aucune commande à partager » |
| A-38 | **P2** | Fonctionnel (nouveau) | Pagination du panier : page affichée non recalée après suppression |

---

## 3 bis. Résultats des tests sur appareil (site Netlify, téléphone Android)

**Avertissement de version** : deux constats suggèrent que la **version déployée sur Netlify n'est pas exactement le code audité** (arborescence du 14/03/26) : en vue Minimal, le testeur ne voit **qu'un bouton Modifier** (le code fourni affiche Modifier **et** Supprimer) ; et la vue Compact **est conservée** au rechargement (le code fourni prévoit un retour en Large, voir A-03). **Le programmeur doit d'abord identifier le commit réellement déployé** et travailler à partir de celui-ci ; les points marqués « non reproduit » sont à rechecker sur cette base.

| Test | Résultat | Statut de l'audit |
|---|---|---|
| Notifications à l'ajout | Aucun message | **Confirmé** (A-02) |
| Thèmes sombre / Gent Bar | Non uniformes ; le récapitulatif de commande n'a pas le même fond que le reste ; l'historique est correct | **Confirmé** (A-01) : harmoniser toutes les surfaces |
| Vue Minimal | Un seul bouton Modifier, jugé satisfaisant ; la modale de modification a des alignements/couleurs imparfaits, la **croix ne ferme pas** (il faut « Annuler ») | **Décision produit** : un seul bouton Modifier ; nouveau point **A-31** |
| Persistance de la vue | La vue Compact est conservée ; mais recharger `/app` affiche **« Page not found »** | A-03 **non reproduit** (voir avertissement) ; **A-28 confirmé** |
| Panier mobile | Bandeau « Voir (N articles) » présent | A-07 : le recouvrement du bas de liste **reste à vérifier** |
| Modification de prix | Le panier garde l'ancien prix, **même en rajoutant la boisson après la modification** | **Confirmé** (A-06), avec cause précise ci-dessous |
| Vider le panier | Vide tout **sans confirmation** ; la suppression d'une ligne du panier se fait aussi sans confirmation | **Confirmé** (A-13) |
| Hors ligne (app installée, mode avion) | La landing et la page de commande s'ouvrent | **Fonctionne** : A-05 ramené à P2 (risque au prochain déploiement). Rechargement de `/app` hors ligne testé : **« Page not found »** (A-28, A-05) |
| Partage | **Messenger : rien ne se passe** ; **WhatsApp** s'ouvre, propose de choisir un contact et envoie bien le résumé | **Confirmé** (A-14) |
| Installation PWA | Installation possible via le **bandeau** en navigation normale (impossible en privé, normal) ; app installée fonctionnelle ; bouton « Installer l'App » de la landing **inerte** | **A-30** reformulé (l'app est installable) |
| « Vérifier les mises à jour » (landing) | Redirige vers `/app` comme « Accéder » | **Confirmé** (A-16) |

---

## 3 ter. Vérification du second plan (ami) — analyse comparative

Second document reçu, structuré en 5 modules. Chaque affirmation a été confrontée au code fourni.

**Confirmé (déjà dans ce document, parfois avec une approche différente)**

| Point du 2ᵉ plan | Renvoi | Remarque |
|---|---|---|
| `Toaster` en double | A-02 | Confirmé. Le 2ᵉ plan propose de migrer **entièrement vers Sonner** (`toast.success(...)`) plutôt que de basculer sur `toaster.jsx`/`use-toast`. **Alternative valable** : Sonner est déjà une dépendance installée, la migration est plus rapide, mais impose de réécrire tous les appels `useToast()` existants (`App.js`, `ShareButtons.jsx`, `OrderSummary.jsx`). À trancher avec le programmeur selon l'effort préféré ; les deux corrigent le même bug. |
| `ThemeProvider` en double | A-19 | Confirmé, même correctif proposé (garder celui d'`index.js`). |
| Thème sombre/Gent Bar et classe `.dark` | A-01 | Confirmé, même cause identifiée (`data-theme` sans classe `dark`), même piste de correction. |
| `ThemeToggle.jsx` plante | A-19 | Confirmé ; voir A-35 pour l'alternative « réparer » proposée par le 2ᵉ plan. |
| Tri en double (`sortDrinks` appelé deux fois) | A-09 | Confirmé, même correctif (`useMemo` dans le parent). |
| `AudioContext` recréé à chaque bip | A-20 | Confirmé ; « fuite de mémoire » est excessif (chaque contexte se ferme via `onended`), mais mutualiser reste une bonne pratique. |
| `skipWaiting()` à ne pas déclencher automatiquement | A-16 | Confirmé, c'est l'option « B » déjà proposée dans ce document (par opposition à garder `skipWaiting: true` et simplifier le message). |
| Chemins relatifs du manifest / icônes maskable | A-24 | Confirmé, déjà couvert. |
| `InstallBanner`/`InstallPrompt` à traiter | A-25, A-30, A-35 | Confirmé ; le 2ᵉ plan penche pour une suppression complète du bandeau, voir arbitrage en A-35. |

**Non vérifiable ou probablement inexact avec le code fourni**

| Point du 2ᵉ plan | Constat |
|---|---|
| « Duplication complète de `DrinkOrderApp` dans `App.js` » | Dans le code fourni, `DrinkOrderApp` est défini **une seule fois** dans `App.js`. Extraire ce composant dans son propre fichier reste une **bonne idée de structure** (déjà couverte, en plus large, par A-32), mais il ne s'agit pas d'un bug de « duplication » à proprement parler. |
| « Bug de pagination du panier » (`currentPage`) dans `OrderSummary.jsx` | Le fichier fourni ne contient **aucune pagination** (pas d'état `currentPage`). Soit une fonctionnalité ajoutée depuis dans une version plus récente, soit une confusion. **Non actionnable** sans voir le code réellement concerné. |
| « Déplier le panier par défaut sur grand écran (`isWide`) » | Le fichier fourni gère déjà l'affichage desktop/mobile **en CSS pur** (`hidden lg:block` / `lg:hidden`), sans variable `isWide`. Point non retrouvé dans le code fourni. |
| `App_2.js` à supprimer | Ce fichier **n'apparaît pas** dans l'arborescence ni dans les fichiers fournis. |

**Ce que cela confirme** : comme observé lors des tests sur ton Android (section 3 bis), il existe un **écart entre le code que j'ai reçu et une version plus avancée du projet** (probablement en cours de développement en local). Les trois points ci-dessus doivent être revérifiés par le programmeur **directement sur le dépôt de code actuel**, pas sur la base de ce document.

**Nouveau, ajouté à ce document** : suppression d'une commande individuelle dans l'historique (A-34), précision des couleurs CMJN du club et trois compléments mineurs (A-35).

---

## 3 quater. Troisième round de tests (testeur indépendant, gentbar.netlify.app)

Tests ciblés menés par une tierce personne sur le site en ligne, avec restauration de l'état après coup (aucune donnée réelle touchée).

**Confirmé, avec mécanisme précis**

| Test | Résultat |
|---|---|
| Rechargement `/app` | **404 confirmé.** Cause vérifiée directement : ni `/_redirects` ni `/netlify.toml` n'existent sur le site déployé (404 sur les deux fichiers eux-mêmes). → **A-28**, cause désormais certaine, pas seulement déduite du code. |
| Prix modifié non répercuté | **Confirmé avec un cas précis.** Duvel 4,50 → 6,00 € : la tuile du menu affiche 6,00 €, mais la ligne déjà présente dans le panier reste à 4,50 €, et **rajouter** Duvel au panier incrémente toujours à 4,50 € (2 × 4,50 au lieu de 2 × 6,00). À l'inverse, Jupiler **pas encore présent** dans le panier, ajouté après modification de son prix, prend bien le **nouveau** prix. → confirme exactement le mécanisme déjà identifié en **A-06** : `handleAddDrink` retrouve la ligne existante par `drinkId` et n'incrémente que la quantité, sans jamais rafraîchir `price`/`drinkName`. |
| « Vérifier les mises à jour » | Aucun retour visible (vérifié au DOM pendant 2 s, pas seulement à l'œil) ; navigue vers `/app`. → confirme **A-16**. |
| Prix invisibles en vues Compact/Minimal | Confirmé. **Précision du propriétaire : c'est voulu**, faute de place sur les tuiles. → reclassé en décision produit, voir A-12 mis à jour. |
| Bannière d'installation | Bouton « Installer » à contraste très faible sur fond bleu (thèmes clair **et** sombre) ; réapparaît après navigation même une fois fermée. **Décision prise : la bannière sera supprimée** au profit du seul bouton de la page d'accueil. → tranche l'arbitrage laissé ouvert en A-35 (point 4) et en A-30. |
| Historique par défaut pollué | Confirmé (« test boisson », « test », 12/01/2024). **Précision : c'est un jeu de données de test, à supprimer avant une release finale** (pas un oubli à corriger maintenant, mais à ne pas oublier avant mise en production). → **A-22** mis à jour. |
| Barre flottante du panier | Chevauche la dernière rangée de tuiles sur mobile. → **confirme A-07**, jusque-là non vérifié sur appareil. |
| Tri non persistant | Le tri choisi (ex. Prix ↗) est perdu en repassant par la landing. → nouveau détail confirmé, ajouté à **A-03** (qui ne couvrait jusqu'ici que le mode d'affichage). |

**Nouveau bug critique, non présent dans l'audit jusqu'ici**

Dans la fenêtre « Modifier la boisson », un bouton **« Supprimer la boisson »** ouvre une confirmation **intitulée « Supprimer la catégorie »**, annonçant que « toute la catégorie et ses boissons seront supprimées ». En réalité, seule la boisson est supprimée (vérifié par le testeur) — mais le texte fait craindre une perte de données bien plus large que ce qui se produit réellement. Voir **A-36** ci-dessous.

*Remarque : ce bouton « Supprimer la boisson » n'existe pas dans le fichier `EditDrinkModal.jsx` qui m'a été fourni (qui n'a que « Annuler » et « Ajouter/Modifier »). C'est un signal supplémentaire, cohérent avec ceux déjà relevés (section 3 ter), que la version en ligne a évolué par rapport au code transmis. Le bug est réel et confirmé sur le site ; seul son emplacement exact dans le code actuel reste à localiser par le programmeur.*

**Confirmé comme fonctionnant correctement (base de non-régression)**

Totaux justes sur un panier mixte, pas de double-incrément au double-clic rapide, boutons +/− du panier fiables, panier persistant via `localStorage` à la navigation (mais pas au rechargement direct, à cause du 404 ci-dessus — pas un second bug, la même cause), tri par prix croissant correct sur toute la liste, mode hors ligne fonctionnel via le service worker, les 5 icônes PWA répondent toutes en 200, thèmes sombre et Gent Bar lisibles **sur desktop** (le défaut de contraste noté par le propriétaire concernait spécifiquement le récapitulatif de commande sur mobile, voir A-01 — pas contredit, les deux retours portent sur des zones/appareils différents).

**À garder tel quel** : cette liste sert de base de tests de non-régression (reprise dans la checklist, section 8).

---

## 3 quinquies. Lecture directe du dépôt GitHub (branche `main`)

**Dépôt** : `https://github.com/eg0-zer0/gentbar`, branche `main`, commit `92d4a70` (2025-08-29). 5 commits au total. Ce commit va **nettement plus loin** que les fichiers initialement transmis pour cet audit : `App.js` a été scindé en `App.jsx` + `DrinkOrderApp.jsx`, un hook `useMediaQuery`, un contexte `ViewModeContext`, un composant `IosInstallPopup.jsx` ont été ajoutés, et un **second système de thème** (variables RGB + classes `.dark`/`.gentbar`) a été introduit en parallèle de l'ancien.

Cette lecture directe remplace les hypothèses faites jusqu'ici à partir du code transmis par des **constats vérifiés avec numéros de ligne**. Tableau de statut, point par point :

| Point | Statut vérifié sur `main` | Détail |
|---|---|---|
| A-01 Thèmes cassés | **Partiellement corrigé, cause précise identifiée** | Voir réécriture ci-dessous |
| A-02 Toasts invisibles | **Toujours présent** | `Toaster` (Sonner) à nouveau unique (le doublon est corrigé), mais toujours découplé de `useToast` |
| A-03 Vue non persistée | **Corrigé** | `ViewModeContext.jsx` valide et persiste correctement |
| A-03 Tri non persisté | **Toujours présent** | `sortBy` reste un simple `useState`, jamais écrit dans `localStorage` |
| A-05 Service worker | **Toujours présent, à l'identique** | `public/service-worker.js` garde exactement les mêmes hash périmés (`main.062af3e9.js`…) |
| A-06 Prix figé au panier | **Toujours présent, confirmé ligne à ligne** | `handleAddDrink` (DrinkOrderApp.jsx) n'incrémente que la quantité |
| A-07 Barre panier qui chevauche | **Vraisemblablement corrigé** | `.content-container { padding-bottom: 80px }` ajouté dans `App.css` — à confirmer visuellement |
| A-09 Tri « Par Catégorie » | **Résolu autrement** | L'option a été retirée de `SortControls.jsx` ; le code mort (`case 'default'`) reste dans `DrinkOrderApp.jsx`, sans impact utilisateur |
| A-10 Cartes non accessibles au clavier | **Corrigé** | `role="button" tabIndex={0} onKeyDown` ajoutés dans `DrinkCard.jsx` (reste à gérer la touche Espace, pas seulement Entrée) |
| A-12 Vues denses (infos manquantes) | **Confirmé inchangé** ; bouton `size="xs"` déplacé | Compact/Minimal toujours sans prix (assumé, voir section 3 quater) ; le `size="xs"` inexistant dans `button.jsx` n'est plus utilisé par `DrinkCard` mais par **`OrderSummary.jsx`** (lignes 108/117/125) — impact réduit car des classes `w-7 h-5` explicites compensent déjà |
| A-13 Vidage sans confirmation | **Toujours présent** | `onClick={onClearAll}` direct, aucune confirmation, dans `OrderSummary.jsx` |
| A-14 Partage | **Nouveau bug critique trouvé** | Voir **A-37** ci-dessous |
| A-15 `window.innerWidth` non réactif / double panier | **Corrigé** | `useMediaQuery('(min-width: 1080px)')` ; une seule instance de `OrderSummary` désormais |
| A-16 Mise à jour trompeuse | **Toujours présent, à l'identique** | `onClick={() => navigate('/app')}` pour « Vérifier les mises à jour », dans `LandingPage.jsx` |
| A-17 Popularité par nom | **Toujours présent** | `popularity[item.drinkName]` inchangé |
| A-19 Double `ThemeProvider` | **Corrigé** | Un seul, dans `App.jsx` |
| A-19 `ThemeToggle` orphelin | **Code réparé, toujours inutilisé** | `{ theme, cycleTheme }` désormais corrects ; `Header.jsx` ne l'importe pas, il réimplémente son propre cycle de thème |
| A-20 `AudioContext` recréé | **Toujours présent** | Inchangé dans `DrinkCard.jsx` |
| A-22 Historique de test | **Toujours présent** | `mock.js` : « test boisson », 12/01/2024, inchangé |
| A-23 `EditCategoryModal` | **Partiellement corrigé** | `maxLength={2}` ajouté sur le champ icône (déjà fait, bonne surprise) |
| A-24 Manifest / favicon / route 404 | **Toujours présents** | Pas d'icône `maskable`, pas de `favicon.ico`, pas de route `*`, `start_url: "/"` inchangé |
| A-25 Code mort / dépendances | **Confirmé** + nouveau détail | `AddFriendModal`, `FriendSelector`, `AddDrinkModal`, `InstallPrompt` toujours orphelins ; **`yarn.lock` ET `package-lock.json` coexistent** (deux gestionnaires de paquets, risque d'installations incohérentes) ; outillage de tests ajouté (Jest, Testing Library, ESLint, Stylelint) mais **aucun fichier de test réel** n'existe encore |
| A-27 Compatibilité iPhone | **Largement implémenté** | `IosInstallPopup.jsx` : détection iOS, instructions claires, overlay accessible (`role="dialog"`, `aria-modal`) — bon travail, détail mineur : pas de fermeture par Échap |
| A-28 Netlify 404 | **Confirmé avec certitude absolue** | Ni `public/_redirects` ni `netlify.toml` n'existent dans le dépôt |
| A-30 Boutons d'installation | **Toujours présent** + nouveau détail | `usePWA.js` inchangé (toujours instancié séparément) ; **`InstallBanner` est désormais rendu deux fois** sur `/app` (une fois globalement dans `App.jsx`, une fois à nouveau dans `DrinkOrderApp.jsx`) alors que sa suppression était actée (voir A-35) |
| A-31 Croix de fenêtre inopérante | **Cause exacte trouvée** | `EditDrinkModal.jsx` ligne 46 : `<Dialog open={isOpen} onClose={onClose}>` — Radix attend `onOpenChange`, pas `onClose` ; `EditCategoryModal.jsx`, `OrderHistory.jsx` et `ConfirmOrderModal.jsx` utilisent eux correctement `onOpenChange` |
| A-32 God files | **Nettement amélioré** | `App.js` scindé en `App.jsx` (29 lignes) + `DrinkOrderApp.jsx` (324 lignes, encore dense mais isolé) ; prop drilling du `viewMode` supprimé (contexte dédié) |
| A-34 Suppression d'une commande | **Corrigé** | `handleRemoveOrder` ajouté et câblé à `OrderHistory` |
| A-35 Compléments | Voir détail par sous-point ci-dessus (A-19, A-23) |
| A-36 Confirmation trompeuse | **Cause exacte trouvée, bug plus large que constaté** | Voir réécriture ci-dessous |

**Deux bugs confirmés par le code, non encore détectés par les tests manuels** : A-37 (partage toujours vide) et A-38 (pagination du panier qui se dérègle) — détaillés en section 4.

---

## 4. Détail des problèmes

### A-01 — Thèmes sombre / Gent Bar cassés — P1 (cause exacte confirmée sur le dépôt `main`)

**Fichiers concernés** : `src/contexts/ThemeContext.jsx`, `src/index.css`, `src/App.css`, `tailwind.config.js`, `src/components/OrderSummary.jsx`, `src/components/Header.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/DeleteConfirmDialog.jsx`, `src/components/LandingPage.jsx`, `src/components/ui/*.jsx` (card, dialog, badge, input, etc.)

**Correction partielle déjà en place** : `ThemeContext.jsx` ajoute désormais la classe `dark` ou `gentbar` sur `document.documentElement` (`classList.add(theme)`), et `App.css` définit bien `html.dark { ... }` et `html.gentbar { ... }` avec un **nouveau** système de variables (`--background-rgb`, `--foreground-rgb`, etc.). `tailwind.config.js` a même été mis à jour (`darkMode: ['class', '[data-theme="dark"]']`). **C'est exactement la correction que je recommandais.**

**Mais elle n'a été appliquée qu'à une partie de l'application.** `DrinkCard.jsx` et `CategorySection.jsx` ont été réécrits pour utiliser ce nouveau système (classes personnalisées + variables RGB) et changent donc correctement de couleur. **Tous les autres composants** — `OrderSummary.jsx` (le récapitulatif de commande), `Header.jsx`, `EditDrinkModal.jsx`, `EditCategoryModal.jsx`, `DeleteConfirmDialog.jsx`, `LandingPage.jsx`, et la quasi-totalité des composants `ui/*` (Dialog, Card, Badge, Input…) — utilisent toujours les classes Tailwind historiques (`bg-card`, `text-foreground`, `bg-background`…). Or ces classes tirent leurs couleurs de `src/index.css`, où les variantes sombre/Gent Bar sont **encore conditionnées par l'attribut `[data-theme="dark"]` / `[data-theme="gentbar"]`** (lignes 66 et 90) — un attribut que `ThemeContext.jsx` **ne pose plus du tout** depuis son passage à `classList.add`.

**Résultat concret** : le récapitulatif de commande, les fenêtres de modification, l'en-tête et la landing restent bloqués sur les couleurs du thème clair, quel que soit le thème choisi — exactement ce que le propriétaire avait signalé (« le fond blanc sur le récap n'est pas là en mode sombre »). Seules les tuiles du menu (boissons/catégories) changent réellement de couleur, ce qui explique pourquoi un testeur, en regardant surtout le menu, les a trouvés « lisibles en desktop ».

**Correction** : unifier sur **un seul** système. Le plus simple, puisque `DrinkCard`/`CategorySection` et le nouveau `App.css` fonctionnent déjà : migrer les composants restants vers les mêmes classes personnalisées (ou, au choix, faire pointer les variables Tailwind historiques de `index.css` sur les nouvelles variables RGB). Dans tous les cas, **retirer un des deux systèmes** pour éviter que ce décalage ne revienne à la prochaine modification. Vérifier ensuite le contraste dans les 3 thèmes sur **tous** les écrans, pas seulement le menu.

---

### A-02 — Aucune notification affichée — P1

**Fichiers concernés** : `src/App.js`, `src/hooks/use-toast.js`, `src/components/ui/sonner.jsx`, `src/components/ui/toaster.jsx`, `src/components/ui/toast.jsx`, `src/components/ShareButtons.jsx`, `package.json`

**Cause** : `App.js` importe `Toaster` depuis `./components/ui/sonner` (bibliothèque **Sonner**), alors que tous les messages passent par `useToast` (`hooks/use-toast.js`, store maison). Sonner ne lit pas ce store : **aucun toast ne s'affiche jamais**. Le vrai composant compatible existe (`components/ui/toaster.jsx`) mais n'est pas utilisé. Le `<Toaster/>` est de plus rendu **deux fois** (dans `DrinkOrderApp` et dans `App`).

**Reproduction** : `/app` → toucher une boisson → aucun message, alors que l'état change.

**Correction**
1. Dans `App.js`, importer `Toaster` depuis `./components/ui/toaster` et n'en monter **qu'un seul**, à la racine de `App`.
2. Supprimer `sonner.jsx` et les dépendances `sonner` / `next-themes` si plus utilisés.
3. **Attention à l'effet de bord** : une fois corrigé, un toast apparaîtrait à **chaque** ajout de boisson (très bruyant, `TOAST_LIMIT = 1`, remplacement constant). Recommandation : supprimer le toast « Boisson ajoutée » (le badge de quantité, le flash et le bip suffisent) et garder les toasts pour les actions rares (commande confirmée, suppression, erreur, copie).
4. Distinguer les messages : « Boisson ajoutée » est utilisé à la fois pour ajout à la commande et ajout au menu.

---

### A-03 — Mode d'affichage mal persisté — P2

**Fichiers concernés** : `src/App.js`, `src/components/Header.jsx`, `src/components/CategorySection.jsx`, `src/components/DrinkCard.jsx`

**Cause** : `App.js` sauvegarde `JSON.stringify(viewMode)` (donc `"compact"` **avec guillemets**) mais relit `localStorage.getItem('viewMode') || 'large'` **sans** `JSON.parse`. Après rechargement, `viewMode` vaut `"\"compact\""` : aucune vue ne correspond → rendu « Large » ; dans `Header.jsx`, `modes.indexOf(...)` renvoie −1, donc le prochain clic sur « Passer vers la vue … » revient à **Large** (l'utilisateur croit que le bouton ne fait rien).

**Reproduction** : choisir la vue Minimal → recharger → l'affichage est en Large ; ouvrir le menu, choisir « vue Large » (ou suivante) → on ne change pas comme prévu.

**Confirmé par un testeur indépendant** : le tri choisi (ex. « Prix ↗ ») est également perdu en repassant par la landing — `sortBy` n'est **jamais** écrit dans `localStorage` (seuls `categories`, `orders`, `orderHistory`, `soundEnabled` et `viewMode` le sont) ; il revient systématiquement à `'name'` dès que `DrinkOrderApp` est remonté.

**Correction** : lire/écrire la même forme (soit `getItem`/`setItem` bruts, soit `JSON.parse`/`JSON.stringify` des deux côtés) via un helper unique (voir A-08), valider la valeur parmi `['large','compact','minimal']` ; **persister aussi `sortBy`** de la même manière (désormais confirmé nécessaire, pas une simple suggestion).

---

### A-04 — Mises à jour du menu et sauvegarde — P1

**Fichiers concernés** : `src/mock.js`, `src/App.js`, `src/utils/id.js`, `src/components/Header.jsx`, `src/lib/storage.js` (à créer)

**Règle voulue par le propriétaire** : les prix et noms de base viennent du fichier `mock.js` ; ensuite chaque utilisateur les modifie lui-même ; quand le propriétaire publie une nouvelle version sur Netlify, les changements de la carte de base doivent pouvoir arriver **sans écraser** les personnalisations des utilisateurs.

**Problème actuel** : `categories` est lu depuis `localStorage` en priorité, `mock.js` n'est qu'un défaut de premier lancement. Toute modification de `mock.js` (nouveau prix, nouvelle bière, catégorie) **n'atteint jamais** les appareils déjà utilisés. Aucun numéro de version de schéma, aucune réinitialisation, aucun export/import. Désinstaller la PWA ou vider les données du navigateur **détruit** le menu personnalisé et l'historique.

**Reproduction** : lancer l'app, modifier un prix dans `mock.js`, déployer sur Netlify → un téléphone qui a déjà ouvert l'app garde l'ancien prix.

**Correction proposée (fusion à la mise à jour)**
1. Ajouter un `menuVersion` (entier ou date) dans `mock.js` et dans les données stockées : `{ version, baseVersion, categories, deletedBaseIds }`.
2. Marquer chaque élément : `origin: 'base' | 'custom'` et, pour les éléments de base, `modified: true` dès que l'utilisateur change le nom ou le prix. Les identifiants de base (`bieres-jupiler`, `soft-coca`…) sont déjà stables ; ceux créés par l'utilisateur (`generateDrinkId`, `cat-<timestamp>`) restent `custom`.
3. Au démarrage, si `baseVersion` stockée < `menuVersion` de l'application : fusionner.
   - Boisson/catégorie de base **non modifiée** par l'utilisateur → mise à jour du nom, du prix et de l'icône.
   - Boisson de base **modifiée** par l'utilisateur → conservée telle quelle.
   - **Nouvelle** boisson/catégorie de base → ajoutée, sauf si son id est dans `deletedBaseIds` (l'utilisateur l'avait supprimée).
   - Éléments `custom` → jamais touchés.
4. Afficher un message : « La carte de base a été mise à jour — N changements » avec **Voir le détail** et **Appliquer tout** (option pour écraser aussi les éléments modifiés).
5. Menu ☰ : **Restaurer la carte de base** (avec confirmation), **Restaurer le prix de base** par boisson, **Exporter / Importer (JSON)**.
6. Mémoriser les suppressions de boissons de base (`deletedBaseIds`) pour ne pas les réintroduire.
7. Tester la migration à partir des données actuelles (sans `version`) : tout est considéré comme `origin: 'base'` non modifié tant que le nom/prix est identique à `mock.js`, sinon `modified: true`.

**Complément (multi-bars)** : voir A-29 ; le versionnage et la fusion s'appliquent **uniquement à la carte de base du club de hockey**. Les cartes créées pour d'autres bars sont `custom`.

---

### A-05 — Build PWA / Service Worker — P2 (fonctionne aujourd'hui, fragile)

**Fichiers concernés** : `package.json`, `workbox-config.js`, `public/service-worker.js`, `public/offline.html`, `src/serviceWorkerRegistration.js`, `src/index.js`

**Test sur appareil** : en mode avion, l'app installée ouvre la landing et la page de commande. La version déployée est donc saine ; le risque est **au prochain déploiement** (service worker écrit à la main aux hash périmés, commande `build` sans Workbox). Testé : **recharger** `/app` hors ligne échoue (« Page not found ») faute de repli SPA (`navigateFallback`, voir A-28).

**Faits vérifiés**
- `package.json` : `build` = `craco build` **sans Workbox** ; seul `build-pwa` génère le SW.
- `public/service-worker.js` est écrit à la main : précache avec des **hash figés** (`main.062af3e9.js`, `main.7a6564fc.css`) qui ne correspondent plus au build (`main.0a3c1466.js`, `main.44a2eb18.css`). Un `precacheAndRoute` avec une ressource en 404 **fait échouer l'installation** du SW → pas d'offline.
- `workbox-config.js` (`generateSW`) **écrase** ce fichier par un SW minimal : les stratégies personnalisées (cache-first images, network-first pages, fallback `offline.html`) sont perdues. Le build actuel (`build/service-worker.js` + `workbox-*.js`) est bien du `generateSW`.
- Aucun `navigateFallback` : ouvrir `/app` hors ligne **sans l'avoir visité** ne fonctionne pas.
- Le SW manuel importe Workbox depuis un **CDN Google** : indisponible hors ligne à la première installation.
- `offline.html` affiche « Serveur temporairement hors ligne » alors que l'app fonctionne entièrement en local.

**Reproduction** : `yarn build`, servir `build/`, installer la PWA, couper le réseau, ouvrir `/app` directement.

**Correction**
1. Un seul chemin de build de production : `"build": "craco build && workbox generateSW workbox-config.js"` (ou `injectManifest` pour conserver les stratégies maison). La CI/le déploiement (Netlify, voir A-28) utilise **cette** commande.
2. **Supprimer** `public/service-worker.js` (artefact, pas une source), ou en faire un vrai template `injectManifest`.
3. Dans `workbox-config.js` : `navigateFallback: '/index.html'`, `navigateFallbackDenylist` adapté, `cleanupOutdatedCaches: true`, `runtimeCaching` pour les images.
4. Reformuler `offline.html` (« Pas de connexion. L'application locale reste utilisable ») ou le retirer une fois le fallback SPA en place.
5. Tester : installation en ligne → mode avion → ouverture de `/` et `/app` ; puis mise à jour de version.

---

### A-06 — Panier incohérent après modification / suppression — P1

**Fichiers concernés** : `src/App.js`, `src/components/OrderSummary.jsx`

**Cause** : `handleSaveDrink`, `confirmDeleteDrink` et `confirmDeleteCategory` (dans `App.js`) ne modifient que `categories`. Les lignes de `orders` gardent `drinkName`/`price` anciens ; une boisson supprimée reste dans le panier.

**Reproduction** : ajouter Jupiler (2,50 €) au panier → modifier son prix à 3,00 € ou la supprimer → le panier affiche/facture toujours 2,50 € (ou l'article « fantôme »).

**Constat confirmé sur appareil, à deux reprises** : par le propriétaire d'abord, puis avec un cas précis par un testeur indépendant — Duvel passé de 4,50 à 6,00 € : la tuile du menu affiche bien 6,00 €, mais la ligne déjà présente dans le panier reste à 4,50 €, et rajouter Duvel au panier incrémente toujours à l'ancien prix (2 × 4,50 € au lieu de 2 × 6,00 €). À l'inverse, Jupiler (pas encore au panier), ajouté après modification de son prix, prend bien le nouveau prix : le problème ne touche que les lignes **déjà présentes** dans le panier. Cause : `handleAddDrink` retrouve la ligne existante (même `drinkId`) et **n'incrémente que la quantité**, sans rafraîchir `price`/`drinkName`.

**Correction** : lors d'une modification, mettre à jour les lignes du panier par `drinkId` (nom et prix) ; dans `handleAddDrink`, rafraîchir aussi `price` et `drinkName` de la ligne existante ; lors d'une suppression (boisson ou catégorie → toutes ses boissons), retirer les lignes correspondantes (avec un message clair). Ajouter un test.

---

### A-07 — Barre panier flottante qui masque le contenu — P1 (confirmé sur appareil par un testeur indépendant)

**Fichiers concernés** : `src/components/OrderSummary.jsx`, `src/App.js`, `public/index.html`, `src/index.css`

**Confirmé** : la barre flottante chevauche bien la dernière rangée de tuiles du menu sur mobile.

**Cause** : sur mobile, `OrderSummary` affiche une barre `fixed bottom-4`. Le conteneur principal n'a **aucun `padding-bottom`** : la dernière catégorie/les dernières boissons restent cachées derrière la barre. Aucune prise en compte de la barre de gestes (`env(safe-area-inset-bottom)`) ; le `viewport` n'a pas `viewport-fit=cover` et la meta iOS `black-translucent` fait passer le contenu sous la barre d'état sans `safe-area-inset-top`.

**Correction** : `padding-bottom` du conteneur ≥ hauteur de la barre + `env(safe-area-inset-bottom)` dès qu'il y a une commande ; ajouter `viewport-fit=cover` et les marges de zone de sécurité en haut et en bas.

---

### A-08 — Robustesse du stockage et des erreurs — P1

**Fichiers concernés** : `src/App.js`, `src/index.js`, `src/lib/storage.js` (à créer), `src/components/ErrorBoundary.jsx` (à créer)

**Cause** : `App.js` fait `JSON.parse(localStorage.getItem(...))` directement à l'initialisation (5 clés) et `localStorage.setItem` sans `try/catch`. Une valeur invalide (`localStorage.setItem('categories','{invalide')`) → **écran blanc**. Aucun `ErrorBoundary` dans l'app : toute exception de rendu (ex. prix `undefined` → `toFixed`) = page blanche.

**Reproduction** : DevTools → `localStorage.setItem('categories', '{invalide')` → recharger `/app`.

**Correction**
1. Un module `storage.js` : `load(key, fallback, validate)` et `save(key, value)` avec `try/catch`, validation (tableaux, champs `id/name/price`), gestion `QuotaExceededError` + message à l'utilisateur.
2. `ErrorBoundary` global avec écran « Une erreur est survenue » + bouton « Recharger » et « Réinitialiser les données ».
3. Envisager de rester sur `localStorage` (données très légères) — voir A-22 pour la limite de l'historique.

---

### A-09 — Tri « Par Catégorie » — P2

**Fichiers concernés** : `src/App.js`, `src/components/SortControls.jsx`, `src/components/CategorySection.jsx`

**Cause** : `sortDrinks` n'a pas de `case 'default'` : il retombe sur le tri alphabétique, et `App.js` passe toujours `sortedDrinks={sortDrinks(c.drinks, sortBy)}`. Le libellé est aussi trompeur : les boissons sont **toujours** groupées par catégorie.

**Reproduction** : Trier par → « Par Catégorie » : l'ordre reste alphabétique, identique à « Alphabétique ».

**Correction** : `case 'default': return drinks` (ordre du menu) ; trier une seule fois via `useMemo([categories, sortBy, drinkPopularity])` ; renommer l'option « Ordre du menu ».

---

### A-10 — Cartes non utilisables au clavier — P1

**Fichiers concernés** : `src/components/DrinkCard.jsx`

**Cause** : dans `DrinkCard.jsx` (3 vues) l'action principale est un `onClick` sur une `div` (`Card`), sans `role`, `tabIndex` ni `onKeyDown`. Les boutons Modifier/Supprimer sont imbriqués dans la zone cliquable.

**Reproduction** : navigation Tab/Entrée ou TalkBack : impossible d'ajouter une boisson.

**Correction** : zone principale = vrai `<button type="button">` (nom accessible : « Ajouter Jupiler, 2,50 € »), focus visible, actions d'édition **hors** du bouton (pas d'éléments interactifs imbriqués).

---

### A-11 — Détail du panier mobile : faux dialogue — P1

**Fichiers concernés** : `src/components/OrderSummary.jsx`, `src/components/ui/sheet.jsx`, `src/components/ui/dialog.jsx`

**Cause** : `OrderSummary.jsx` construit l'overlay avec des `div` : pas de `role="dialog"`, `aria-modal`, piège de focus, fermeture par Échap/retour arrière, ni blocage du défilement de fond.

**Correction** : utiliser le composant `Sheet` (ou `Drawer`/`Dialog`) déjà présent, avec titre, description, fermeture Échap, restauration du focus. Bonus Android : le geste « retour » doit fermer le panneau.

---

### A-12 — Vues Compact / Minimal — P2

**Fichiers concernés** : `src/components/DrinkCard.jsx`, `src/components/CategorySection.jsx`, `src/components/ui/button.jsx`, `src/index.css`, `src/components/Header.jsx`

**Faits vérifiés**
- *Large* : prix, popularité, quantité, flash vert. *Compact* : quantité, **sans prix ni popularité**. *Minimal* : **rien** (ni prix, ni quantité, ni popularité) et **pas de flash** (`isAdded` n'est utilisé qu'en Large).
- Comme les toasts ne s'affichent pas (A-02), en Minimal **avec le son coupé, un ajout n'a aucun retour visuel**.
- `button.jsx` n'a pas la taille `xs` (`DrinkCard` l'utilise 4 fois) : aucune classe de taille appliquée. Et `index.css` impose `min-height/min-width: 44px` à tous les `button` ≤ 1024 px : en Minimal (grille 4 colonnes, ≈ 85 px par carte sur téléphone) **deux boutons de 44 px + espace ≈ 96 px débordent** de la carte (à vérifier visuellement).

**Précision confirmée** : l'absence de prix en vues Compact et Minimal est **voulue** par manque de place sur les tuiles, pas un oubli. La correction proposée plus bas (afficher au moins le prix) est donc à traiter comme une **suggestion d'amélioration**, pas comme un bug à corriger en priorité — à arbitrer avec le propriétaire (ex. prix en police réduite sous le nom, ou visible uniquement via la fenêtre de modification/un appui long).

**Décision du propriétaire** : en vue Minimal, **un seul bouton Modifier** (le testeur le trouve très bien). Recommandation : généraliser ce principe aux trois vues et **déplacer « Supprimer » dans la fenêtre de modification** (bouton rouge en bas, avec confirmation), ce qui libère de la place et évite les suppressions accidentelles.

**Correction** : ajouter `xs` dans `buttonVariants` ou passer à `sm` ; afficher au minimum une **pastille de quantité** en Minimal et Compact ; retour visuel (flash) sur toutes les vues ; déplacer Modifier/Supprimer hors des cartes denses (mode « édition » du menu ou appui long) pour libérer la place ; revoir la règle globale 44 px (la limiter aux zones réellement tactiles, sans casser les mises en page).

---

### A-13 — « Vider la commande » — P2

**Fichiers concernés** : `src/components/OrderSummary.jsx`, `src/App.js`, `src/components/DeleteConfirmDialog.jsx`

**Cause** : bouton corbeille (`onClearAll`) sans confirmation ni annulation, collé à « Confirmer ». Dans un bar bruyant, un mauvais appui efface toute la tournée.

**Constat sur appareil** : la corbeille vide tout sans confirmation, et la suppression d'une **ligne** du panier (bouton rouge à côté de +/−) se fait aussi sans confirmation.

**Correction** : *vider toute la commande* → confirmation (`DeleteConfirmDialog`) ; *supprimer une ligne* (action fréquente) → pas de fenêtre, mais un message « Ligne supprimée — Annuler » (nécessite la correction d'A-02). Ou, pour les deux, toast « Commande vidée — Annuler » (10 s) ; éloigner le bouton de « Confirmer » ; nom accessible « Vider la commande ».

---

### A-14 — Partage — P2

**Fichiers concernés** : `src/components/ShareButtons.jsx`, `src/components/OrderSummary.jsx`, `src/components/OrderHistory.jsx`

**Cause** (`ShareButtons.jsx`) : « Messenger » copie simplement le texte ; Messenger et WhatsApp ont la même icône ; `window.open(..., '_blank')` sur `mailto:`/`sms:` peut ouvrir un onglet vide dans une PWA installée ; `sms:?body=` sans destinataire se comporte différemment selon les téléphones.

**Constat sur appareil** : WhatsApp fonctionne (ouverture du sélecteur de contacts avec le résumé). **Messenger ne fait rien de visible** : le texte est copié dans le presse-papiers mais le message de confirmation ne s'affiche pas (A-02), donc l'utilisateur ne voit aucun effet.

**Correction** : utiliser **`navigator.share({ title, text })`** en priorité (feuille de partage native Android : WhatsApp, SMS, Messenger…), avec repli « copier ». Supprimer l'entrée Messenger. Utiliser `window.location.href` pour `mailto:`/`sms:`. Une seule notification.

---

### A-15 — Détection mobile et double panier — P2

**Fichiers concernés** : `src/components/OrderSummary.jsx`, `src/App.js`

**Cause** : `OrderSummary` lit `window.innerWidth < 1024` au rendu sans écouteur (rotation, split-screen) et est rendu **deux fois** dans `App.js` (bloc desktop + bloc mobile).

**Correction** : une seule instance ; `matchMedia('(min-width: 1024px)')` + écouteur (ou pilotage 100 % CSS).

---

### A-16 — Mise à jour de l'application / Service Worker côté interface — P2

**Fichiers concernés** : `src/index.js`, `src/components/LandingPage.jsx`, `src/serviceWorkerRegistration.js`, `workbox-config.js`

**Faits vérifiés**
- `index.js` et `LandingPage.jsx` appellent tous deux `register()` (écouteurs et rechargements potentiellement doublés).
- `register()` attend l'événement `load` : depuis une navigation interne (retour vers `/`), il ne se déclenche plus → **la bannière « Nouvelle version » ne peut s'afficher que si la landing est la première page ouverte**.
- `skipWaiting: true` (Workbox) rend le SW actif immédiatement : `registration.waiting` est alors vide, donc le bouton « Mettre à jour » (`waitingSW.postMessage`) ne fait rien.
- Le bouton « Vérifier les mises à jour » appelle `navigate('/app')` (identique à « Accéder à l'application ») — **confirmé sur appareil**.

**Correction** : enregistrer le SW **une seule fois** (`index.js`) ; exposer l'état de mise à jour via un contexte/hook ; choisir une stratégie : soit `skipWaiting: false` + message `SKIP_WAITING` + `controllerchange` → reload, soit `skipWaiting: true` + simple toast « Nouvelle version installée — Recharger » ; bouton « Vérifier » = `registration.update()` avec retour utilisateur, ou suppression.

---

### A-17 — Popularité par nom — P2

**Fichiers concernés** : `src/App.js`, `src/mock.js`, `src/components/DrinkCard.jsx`, `src/components/OrderHistory.jsx`

`drinkPopularity` compte `item.drinkName` ; l'historique n'enregistre pas `drinkId`. Renommer une boisson remet son score à zéro ; deux boissons de même nom fusionnent. **Correction** : stocker `drinkId` dans l'historique, compter par identifiant (repli sur le nom pour les anciennes commandes).

---

### A-18 — Transitions globales / mouvement réduit — P2

**Fichiers concernés** : `src/index.css`, `src/components/DrinkCard.jsx`, `src/components/OrderSummary.jsx`

`index.css` applique `transition-property` à `*` ; `animate-bounce` (badge quantité) sans règle `@media (prefers-reduced-motion: reduce)`. **Correction** : limiter les transitions aux composants concernés, ajouter la règle `prefers-reduced-motion` désactivant animations et transitions non essentielles.

---

### A-19 — Architecture des thèmes — P3

**Fichiers concernés** : `src/index.js`, `src/App.js`, `src/contexts/ThemeContext.jsx`, `src/components/ThemeToggle.jsx`, `src/components/ui/sonner.jsx`, `src/components/CategorySection.jsx`, `public/index.html`, `public/manifest.json`, `src/index.css`

- Double `ThemeProvider` (`index.js` **et** `App.js`) : garder celui de `index.js`.
- `ui/sonner.jsx` utilise `next-themes` (sans provider) : sans objet une fois A-02 corrigé.
- Classes inexistantes : `text-text-primary` (le jeton Tailwind est `textPrimary`) et variables `--text-primary` / `--text-secondary` non définies dans `index.css` → sans effet.
- `ThemeToggle.jsx` (non utilisé) attend `isDark`/`toggleTheme` que le contexte ne fournit pas : le clic ne fait rien. À supprimer.
- `theme-color` (meta + manifest) fixe à `#0f172a` : mettre à jour dynamiquement selon le thème.

---

### A-20 — Audio — P3

**Fichiers concernés** : `src/components/DrinkCard.jsx`

`playBeep` crée un `AudioContext` à chaque clic, sans garde ni `try/catch`, **avant** `onAdd` : une erreur audio empêcherait l'ajout. **Correction** : un contexte partagé, vérifier la disponibilité, `resume()`, `try/catch`, et appeler `onAdd` en premier. Le son est considéré comme un gadget : **désactivé par défaut** (voir décisions). Option de vibration (`navigator.vibrate`, Android uniquement) en complément.

---

### A-21 — Accessibilité (compléments) — P2

**Fichiers concernés** : `src/components/Header.jsx`, `src/components/OrderSummary.jsx`, `src/components/InstallBanner.jsx`, `src/components/ui/badge.jsx`, `src/components/ui/card.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/OrderHistory.jsx`, `src/components/DrinkCard.jsx`

- Boutons icônes sans nom : menu ☰ (`Header`), fermeture du panier, vidage, **boutons +/−** et suppression de ligne du panier, fermeture de `InstallBanner` → ajouter `aria-label` explicites.
- `Badge` (`badge.jsx`) porte `role="status" aria-live="polite"` **globalement** : les lecteurs d'écran annoncent chaque badge statique. Ne l'appliquer qu'aux vrais messages dynamiques (ex. total du panier).
- `CardTitle` rend une `div` : utiliser de vrais titres (`h2/h3`).
- `EditDrinkModal`, `EditCategoryModal`, `OrderHistory` n'ont pas de `DialogDescription` (avertissement Radix + accessibilité).
- `aria-label` sur la `div` de quantité (`DrinkCard`) sans rôle : ignoré.
- Vérifier contraste et taille du texte (`text-xs`, gris clairs) dans les 3 thèmes ; supporter le zoom texte système Android sans troncature.

---

### A-22 — Historique — P3

**Fichiers concernés** : `src/mock.js`, `src/App.js`, `src/components/OrderHistory.jsx`

- `mockOrderHistory` (« test boisson », « test », 12/01/2024) s'affiche au premier lancement → initialiser à `[]`. **Confirmé comme un jeu de données de développement/test, à retirer avant toute mise en production réelle** — à ajouter explicitement à une check-list de « dernière ligne droite avant release » (voir section 8).
- Historique non borné, réécrit en entier à chaque commande : limite pratique lointaine (chaque commande ≈ quelques centaines d'octets), mais prévoir un plafond (ex. 500 commandes / 12 mois) et un bouton « Vider l'historique ».
- Envisager « Recommander la même tournée » (réutiliser une commande passée), très utile pour l'usage réel.

---

### A-23 — Formulaires et détails d'usage — P2/P3

**Fichiers concernés** : `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/App.js`, `src/components/InstallBanner.jsx`

- `EditDrinkModal` : en mode ajout, le prix est pré-rempli à **0** (`(0).toString()` est truthy) au lieu d'être vide ; le nom n'est pas nettoyé (`trim`) → « ␣␣ » accepté ; doublons de noms possibles.
- `EditCategoryModal` : champ icône sans `maxLength`/validation → « ABCDEF » casse la mise en page en Minimal.
- `handleSaveCategory` appelle `toast` **dans** la fonction de mise à jour d'état (effet de bord impur ; doublons en `StrictMode`).
- Impossible de changer une boisson de catégorie ; impossible de saisir une quantité directement (utile pour 10 bières).
- `InstallBanner` : bandeau affiché sur toutes les pages, fermeture non mémorisée (revient à chaque lancement) ; textes « Installer Drink » alors que l'app s'appelle GentBar.

---

### A-24 — PWA / déploiement — P3

**Fichiers concernés** : `public/manifest.json`, `public/index.html`, `src/App.js`, `public/icons/`

- `manifest.json` : `start_url: "/"` ouvre la **landing** à chaque lancement : pour un usage au bar, préférer `"/app"` (ou rediriger automatiquement si l'app est installée, `display-mode: standalone`).
- Chemins absolus (`/manifest.json`, `/icons/…`, `BrowserRouter`) : sans conséquence sur Netlify (hébergé à la racine du domaine) **à condition** d'avoir la réécriture SPA (voir A-28).
- Icônes sans `"purpose": "maskable"` (rendu Android adaptatif) et pas d'icône 96/48 ; `favicon.ico` référencé mais **absent** de `public/` (404) → utiliser `gentbar-logo.svg`/PNG existants.
- Aucune route 404 / `path="*"` : URL inconnue = page vide.

---

### A-25 — Qualité, outillage, code mort — P3

**Fichiers concernés** : `package.json`, `src/components/FriendSelector.jsx`, `src/components/AddFriendModal.jsx`, `src/components/AddDrinkModal.jsx`, `src/components/InstallPrompt.jsx`, `src/components/ThemeToggle.jsx`, `src/App.css`, `src/components/ui/sonner.jsx`

- Pas de lockfile, pas de tests, pas de script `lint`. `react-scripts 5` + React 19 + ESLint 9 + `react-day-picker 8` + `date-fns 4` : combinaisons de dépendances hors des versions supportées (le build actuel fonctionne, mais fragile).
- **À supprimer** : `FriendSelector.jsx`, `AddFriendModal.jsx`, `AddDrinkModal.jsx`, `InstallPrompt.jsx` (redondant avec `InstallBanner`), `ThemeToggle.jsx`, `App.css` (résidus CRA), `ui/sonner.jsx`, et les dépendances inutilisées (`axios`, `zod`, `react-hook-form`, `@hookform/resolvers`, `next-themes`, `sonner`, `cmdk`, `embla-carousel-react`, `vaul`, etc. après vérification).
- Ajouter : lockfile, ESLint/Prettier, tests unitaires (total, tri, cohérence panier, parsing storage) et 2–3 tests de bout en bout (Playwright/Cypress) : ajout → confirmation → historique → partage.

---

### A-26 — Cohérence design — P3

**Fichiers concernés** : `src/App.js`, `src/components/ConfirmOrderModal.jsx`, `src/components/DrinkCard.jsx`, `src/components/OrderSummary.jsx`, `src/components/Header.jsx`, `src/components/LandingPage.jsx`, `src/components/InstallBanner.jsx`, `src/components/ShareButtons.jsx`, `src/mock.js`, `public/index.html`, `public/manifest.json`

- Couleurs codées en dur hors charte (`bg-purple-600`, dégradés `blue-500/600`, `green-100`, `yellow-300`) alors que la charte Gent Bar est bleu marine `#071D49` / fuchsia `#E6007E` → utiliser `bg-primary`, `bg-secondary`, etc.
- Noms incohérents : « GentBar Order App », « Drink Order », « Commandes de Boissons », « Drink » (meta Apple), « Installer Drink » → choisir **un** nom.
- Montants affichés `3.00€` → format francophone `3,00 €` via `Intl.NumberFormat('fr-BE'|'fr-FR', { style:'currency', currency:'EUR' })` ; calculs en **centimes entiers** pour éviter tout arrondi flottant.
- Libellés des boutons : « Ajouter » (menu) vs « Boisson ajoutée » (commande) → vocabulaire distinct.

---

### A-27 — Compatibilité iPhone (PWA sans App Store) — P1

**Fichiers concernés** : `src/hooks/usePWA.js`, `src/components/LandingPage.jsx`, `src/components/InstallBanner.jsx`, `public/index.html`, `public/manifest.json`, `public/icons/`

Une PWA fonctionne sur iPhone **sans passer par l'App Store** : ouverture dans **Safari** → Partager → « Sur l'écran d'accueil » (fonctionne depuis iOS 11.3 ; iOS 16.4+ apporte des améliorations, cible pragmatique : iOS 15 ou plus). Il n'y a donc rien à « porter », mais l'app doit s'adapter :

- **Pas d'événement `beforeinstallprompt` sur iOS** : le bouton « Installer l'App » (`usePWA`) n'apparaît jamais. **Correction** : détecter iOS Safari hors mode standalone et afficher un court encart « Pour installer : Partager ▸ Sur l'écran d'accueil » (avec pictogramme), mémorisé une fois fermé. Sur `LandingPage`, remplacer le texte « astuce » par cette procédure claire.
- **Stockage local** : dans un onglet Safari (app non installée), iOS peut **effacer les données du site après environ 7 jours sans utilisation**, donc le menu personnalisé et l'historique. Installée sur l'écran d'accueil, l'app est mieux protégée, mais rien n'est garanti. **Correction** : demander `navigator.storage.persist()`, et surtout proposer l'export/import (A-04, A-29). Le stockage de l'app installée est **séparé** de celui de Safari : un utilisateur qui a testé dans Safari ne retrouvera pas ses données dans l'app installée (à expliquer).
- **Zone de sécurité** : la meta `black-translucent` fait passer le contenu sous l'encoche/barre d'état : ajouter `viewport-fit=cover` et `env(safe-area-inset-*)` (voir A-07).
- **APIs à prévoir avec repli** : `navigator.vibrate` non disponible sur iOS ; Web Audio ne démarre qu'après un geste utilisateur (déjà le cas, à garder) ; Screen Wake Lock disponible sur les versions récentes (à tester) ; `navigator.share` fonctionne (A-14).
- **Icône** : `apple-touch-icon` pointe sur le 192 px ; fournir un **180×180** dédié, sans transparence.
- **À tester** sur au moins un iPhone réel (Safari + app installée) : landing, ajout, panier, partage, hors ligne, mise à jour de version.

---

### A-28 — Déploiement Netlify — P1 (confirmé sur appareil)

**Fichiers concernés** : `public/_redirects` (à créer), `netlify.toml` (à créer), `package.json`, `workbox-config.js`

**Constat confirmé à deux reprises**, et la cause est désormais certaine (vérifiée directement, pas seulement déduite du code) : ni `/_redirects` ni `/netlify.toml` n'existent sur le site déployé — les deux fichiers renvoient eux-mêmes une 404. Recharger `https://gentbar.netlify.app/app` affiche donc la page **« Page not found »** de Netlify. La règle de réécriture SPA est bien absente ; l'ouverture réussie de `/app` observée auparavant venait d'une navigation interne ou du cache.

- **Réécriture SPA absente** : l'arborescence fournie ne contient ni `public/_redirects` ni `netlify.toml`. Sans règle, ouvrir ou recharger `https://…/app` renvoie normalement une **404** (seule `/` existe physiquement). *Constat complémentaire : dans l'app installée en mode avion, tirer pour rafraîchir `/app` mène aussi à « Page not found » (aucun repli SPA dans le service worker, voir A-05).* *Constat du propriétaire : `/app` s'ouvre sur son téléphone ; à re-tester en navigation privée, car le service worker ou une règle configurée dans le tableau de bord Netlify peut masquer le problème.* Cela casse aussi `start_url: "/app"` recommandé en A-24. **Correction** : ajouter `public/_redirects` avec la ligne `/*  /index.html  200` (ou l'équivalent dans `netlify.toml`). Vérifier ensuite dans Netlify si une règle existe déjà dans le tableau de bord.
- **Commande de build** : Netlify doit exécuter la commande qui inclut Workbox (voir A-05) — ex. `yarn build-pwa` — avec dossier de publication `build`. Sinon le service worker déployé est celui écrit à la main, avec des hash périmés.
- **Cache du service worker** : s'assurer que `service-worker.js` (et `index.html`) sont servis sans cache long (`Cache-Control: no-cache`) via `netlify.toml` ; les fichiers `static/*` hachés peuvent, eux, avoir un cache d'un an (`immutable`).
- **Version Node/Yarn** : fixer la version dans `netlify.toml` (`NODE_VERSION`) et committer un **lockfile** (A-25) pour des builds reproductibles ; `CI=true` fait échouer le build sur les avertissements ESLint, à connaître.
- **Confidentialité** : les données restent sur l'appareil ; aucun suivi ni script tiers dans `index.html` — à conserver.
- **Mise à jour** : chaque déploiement produit une nouvelle version ; le mécanisme d'A-16 doit prévenir les amis (toast « Nouvelle version — Recharger ») pour ne pas rester sur une ancienne version.

---

### A-29 — Multi-bars : plusieurs cartes de tarifs — P2 (évolution)

**Fichiers concernés** : `src/App.js`, `src/mock.js`, `src/components/Header.jsx`, `src/utils/id.js`, `src/components/OrderHistory.jsx`, `src/components/OrderSummary.jsx`, `src/components/ConfirmOrderModal.jsx`, `src/components/ShareButtons.jsx`, `src/components/TicketView.jsx` (E-4), `src/components/EditCategoryModal.jsx`, `src/lib/menus.js` (à créer), `src/components/BarSelector.jsx` (à créer)

**Besoin** : chacun peut créer et garder ses propres listes de tarifs pour d'autres bars, en plus de la carte du club de hockey.

**Proposition technique**
1. Modèle de données : `{ version, activeMenuId, menus: [{ id, sourceId, name, icon, categories: [...] }] }`. La carte du club de hockey est la carte **par défaut** (non supprimable, restaurable). `id` est propre à l'appareil (identité locale du bar, ce que l'utilisateur voit et renomme librement) ; `sourceId` est un identifiant stable généré **une seule fois, à la création d'une carte**, qui voyage avec elle à chaque partage (lien, QR, fichier) — voir point 8, il sert à reconnaître « la même carte » au fil des partages, indépendamment du nom donné localement par chacun.
2. Sélecteur de bar : liste déroulante dans l'en-tête ou le menu ☰ ; actions **Nouveau bar** (vide ou copie d'une carte existante), **Renommer**, **Dupliquer**, **Supprimer** (avec confirmation).
3. Le **panier** est propre à la carte active ; changer de bar avec un panier non vide demande confirmation (ou conserve un panier par bar).
4. L'**historique** enregistre l'identifiant/nom du bar ; le prix est **figé à la date de commande** (déjà le cas : `items[].price`) ; filtre d'historique par bar.
5. **Partage d'une carte par lien (décidé : souhaité)** : une « carte de tarifs » = un bar avec ses catégories (nom + emoji), ses boissons (nom + prix). Le propriétaire crée un bar, choisit **Partager cette carte** et envoie un lien (WhatsApp, SMS…) ; l'ami l'ouvre et l'app affiche « Ajouter le bar « X » (N boissons) ? » avec aperçu, puis l'ajoute à sa liste de bars.
   - Sans serveur : la carte est **compressée et encodée dans le fragment d'URL** (`https://gentbar.netlify.app/app#carte=…`), quelques Ko pour ~60 boissons. Prévoir aussi l'export/import de **fichier JSON** en secours (lien trop long, messagerie qui tronque).
   - Sécurité : à l'import, **valider et nettoyer** (types, longueur des noms, prix numériques positifs, nombre maximal de catégories/boissons, emojis limités) ; ne jamais interpréter du HTML ; **ne jamais écraser** un bar existant sans confirmation (proposer « Ajouter comme nouveau bar » ou « Remplacer »).
   - Le lien doit fonctionner même si l'app n'est pas ouverte ; sur iPhone, si l'app installée ne s'ouvre pas depuis le lien, l'ouverture se fait dans Safari (stockage séparé, voir A-27) : prévoir le bouton « Copier le lien » et l'import par fichier.
   - **Second mode de transport, en complément du lien, confirmé souhaité : un QR code.** Le propriétaire d'une carte affiche un QR encodant ce même lien (ou directement les données compressées) ; l'ami le scanne avec l'appareil photo de son téléphone, sans rien installer — pratique à table, entre amis, sans réseau ni Bluetooth (piste explorée puis écartée : une PWA ne peut pas diffuser ni se faire découvrir en Bluetooth, et Safari sur iPhone n'y a de toute façon pas accès). Techniquement, un seul investissement sert les deux usages : une librairie de génération de QR (ex. une fonction utilitaire autour de `canvas`, légère) affiche le code depuis la même URL déjà produite pour le lien ; aucun scanner propre à l'app n'est nécessaire côté réception, l'appareil photo natif + son navigateur suffisent à ouvrir le lien.
6. Migration : au premier lancement de la nouvelle version, transformer les données actuelles (`categories`) en un premier bar « Club de hockey ».
7. Logos : le besoin concerne uniquement l'**icône emoji des catégories** (les boissons restent en texte). Aucun import d'image à prévoir ; améliorer plutôt le sélecteur d'emoji (`EditCategoryModal` : champ limité à 1 emoji, plus de suggestions dont 🍺 🥤 🍷 🥃 ☕ 🥪) et ajouter la validation d'A-23.
8. **Réception d'une carte pour un bar déjà présent, sous un autre nom (cas posé par le propriétaire)** : comme il n'existe pas de registre central des bars, l'app ne peut pas deviner toute seule que « la carte reçue de Paul pour La Taverne » correspond au bar que j'ai déjà créé de mon côté sous le nom « Chez Mimi ». La reconnaissance automatique ne doit donc se faire **que** quand c'est fiable (même `sourceId`, voir point 1) ; dans les autres cas, on laisse la personne décider, sans lui faire perdre son travail ni celui de son ami :
   - À la réception d'un lien/QR/fichier, l'app compare d'abord le `sourceId` reçu aux `sourceId` déjà connus localement. **Correspondance trouvée** (on avait déjà reçu cette carte, par ce ou un autre ami) → fusion automatique directe sur le bar correspondant, sans redemander (le nom local, lui, ne change pas).
   - **Aucune correspondance** → l'app affiche le nom et un aperçu de la carte reçue (nombre de boissons, quelques exemples), puis propose un choix explicite :
     - **Ajouter comme nouveau bar** (par défaut, le plus sûr) ;
     - **Fusionner avec un bar existant** → une liste des bars déjà enregistrés, pour que l'utilisateur choisisse lui-même celui qu'il reconnaît (« ah oui, c'est mon “Chez Mimi” »). Pour aider ce choix, suggestion facultative : mettre en avant le bar existant qui partage le plus de noms de boissons identiques avec la carte reçue (« “Chez Mimi” a 14 boissons en commun avec cette carte ») — une aide, jamais une fusion automatique.
   - En cas de fusion (qu'elle soit automatique par `sourceId` ou choisie manuellement), **réutiliser exactement le moteur de fusion déjà prévu pour la mise à jour de la carte de base (A-04)** : les boissons non modifiées localement sont mises à jour avec les valeurs reçues, celles modifiées par l'utilisateur sont conservées, les nouveautés sont ajoutées, rien n'est supprimé silencieusement. Une seule fonction de fusion sert donc aux deux cas (mise à jour de la carte du club de hockey, et réception d'une carte d'ami) plutôt que d'en coder deux.
   - Une fois la fusion faite (automatique ou manuelle), le bar reçu **retient le `sourceId`** de la carte d'origine : les partages suivants de la même carte, par n'importe quel ami qui l'a lui-même reçue, pourront alors se fusionner automatiquement, sans repasser par ce choix.
9. **Commander sur deux cartes à la fois, avec séparation visible au récapitulatif (cas posé par le propriétaire : deux bars proches, chacun avec des produits que l'autre n'a pas)**. Le comportement par défaut (point 3) reste simple : un panier par bar, pas de mélange. Mais une action explicite permet de combiner volontairement deux bars dans **une seule commande en cours** :
   - En changeant de bar depuis le sélecteur (point 2) alors qu'un panier n'est pas vide, la confirmation déjà prévue au point 3 propose une **troisième option**, à côté de « Vider » et « Garder de côté » : **« Ajouter ce bar à la commande en cours »**. Dès ce choix fait, un petit indicateur permanent (ex. dans l'en-tête) rappelle « Commande sur 2 bars » tant que la commande n'est pas confirmée ou vidée, pour ne pas l'oublier en cours de route.
   - **Donnée technique** : chaque ligne du panier porte alors l'identifiant du bar d'origine (`barId`), en plus de `drinkId` — la clé d'une ligne du panier devient `barId:drinkId` plutôt que `drinkId` seul. Important à poser ainsi **dès le départ** de ce chantier, pour que la correction déjà prévue en A-06 (rafraîchir prix/nom à l'ajout) s'appuie directement sur cette même clé composée, sans devoir être reprise une seconde fois.
   - **Récapitulatif de commande (`OrderSummary`)** : les lignes sont groupées par bar, chacune sous un petit en-tête visuellement distinct (nom et icône du bar), avec un sous-total par bar et le total général en bas — répond directement à la demande de séparation visible.
   - **Vue Ticket (E-4)** : même regroupement par bar (puis par catégorie à l'intérieur), d'autant plus utile ici que les deux commandes seront physiquement prises à deux comptoirs différents.
   - **Historique et partage** : chaque article de l'historique garde la trace de son bar d'origine (`barId`/nom), affiché de la même façon groupée dans `OrderHistory` et dans le texte généré par `ShareButtons` ; la recommandation d'une tournée (E-8) et le calcul de répartition (E-1) continuent de fonctionner sans changement, puisqu'ils travaillent sur le total ou sur les lignes existantes, peu importe de quel bar elles viennent.
   - **Décision par défaut** : mélanger deux bars reste une action volontaire, jamais automatique — la grande majorité des commandes resteront sur un seul bar, ce chantier ne doit pas complexifier ce cas courant.

---

### A-30 — Installation de la PWA : boutons d'installation défaillants — P2

**Fichiers concernés** : `src/hooks/usePWA.js`, `src/components/LandingPage.jsx`, `src/components/InstallBanner.jsx`, `src/components/Header.jsx`, `src/index.js`, `src/contexts/PWAContext.jsx` (à créer)

**Constats sur appareil (Android)**
- Le manifest et l'icône 512 px sont servis correctement par Netlify (ouverture directe des liens) : le manifest et les icônes ne sont **pas** en cause.
- En **navigation normale** dans Chrome, le **bandeau d'installation** (`InstallBanner`) apparaît, l'installation fonctionne et l'app installée se lance sans problème.
- En **navigation privée**, l'installation est impossible : comportement normal de Chrome, pas un défaut de l'app.
- Sur la **landing page**, le bouton **« Installer l'App » ne fait rien** au clic.
- Sur **Firefox**, le bouton de l'app ne peut jamais apparaître (Firefox ne déclenche pas `beforeinstallprompt`) : installation via le menu du navigateur.

**Cause probable du bouton inerte** : le hook `usePWA` est instancié **séparément** dans `InstallBanner`, `Header` et `LandingPage` ; chacune écoute `beforeinstallprompt` et garde sa propre copie de l'événement. Or l'événement n'est émis **qu'une fois** au chargement et ne peut être utilisé qu'**une seule fois** (`prompt()`) : un composant monté après l'émission (retour vers `/` depuis `/app`) ne le reçoit jamais, et un événement déjà consommé ou refusé ne peut plus être rejoué. Le clic ne produit alors aucun résultat, **sans message** (`installApp` se contente d'un `console.log`, et les notifications sont invisibles, A-02). *Cause à confirmer sur la version déployée.*

**Correction**
1. Capturer `beforeinstallprompt` **une seule fois, le plus tôt possible** (au démarrage de l'application, avant le rendu) et le partager via un **contexte React** unique (`PWAContext`) ; les trois composants consomment ce contexte.
2. Donner un **retour visible** à chaque clic : installation acceptée → message ; refusée → message ; événement indisponible → texte d'aide « Ouvre le menu ⋮ du navigateur puis Installer l'application / Ajouter à l'écran d'accueil ».
3. Une fois installée (`display-mode: standalone` ou événement `appinstalled`) : masquer tous les boutons d'installation et **ouvrir directement `/app`** (voir `start_url`, A-24) ; ne plus afficher la landing.
4. Sur iPhone : encart d'aide dédié (A-27).
5. **`InstallBanner.jsx` supprimé** (décision prise, voir A-35) : son point « mémoriser la fermeture » devient sans objet.
6. Tester : Chrome normal (bandeau et bouton landing), Chrome après retour sur `/`, Firefox (menu), application déjà installée, navigation privée (aucun bouton attendu).

---

### A-31 — Fenêtre de modification (boisson/catégorie) — P2

**Fichiers concernés** : `src/components/EditDrinkModal.jsx`, `src/components/EditCategoryModal.jsx`, `src/components/ui/dialog.jsx`, `src/index.css`

**Constat sur appareil** : la petite croix de fermeture **ne fonctionne pas** (seul « Annuler » ferme) ; alignements et couleurs **non conformes** au reste de l'app.

**Pistes** (non déterminées par lecture du code, à diagnostiquer sur appareil) : la règle globale de `index.css` (`min-width/min-height: 44px` sur tous les `button` ≤ 1024 px) agrandit le bouton de fermeture positionné en absolu ; les composants de fenêtre utilisent les jetons de thème (`bg-background`) alors que les champs et étiquettes portent des couleurs codées en dur (A-01) ; la transition globale sur `*` (A-18).

**Correction** : vérifier le gestionnaire `onOpenChange` sur toutes les fenêtres et tester la croix, la touche Échap et le retour Android ; harmoniser espacements, alignements, largeurs de champs (`sm:max-w-[425px]` mais plein écran ≤ 640 px), boutons « Annuler/Enregistrer » alignés à droite, couleurs issues des jetons ; ajouter « Supprimer » (rouge, avec confirmation) dans la fenêtre de modification d'une boisson (voir A-12) ; libellé du bouton principal « Enregistrer » plutôt que « Modifier ».

---

### A-32 — Architecture : « God files » et duplication — P3 (facilitateur de toutes les évolutions)

**Fichiers concernés** : `src/App.js`, `src/components/DrinkCard.jsx`, `src/components/OrderSummary.jsx`, `src/components/Header.jsx`, `src/components/LandingPage.jsx`, `src/components/CategorySection.jsx`, `src/index.css`

**Verdict** : l'app est petite (~60 boissons, ~30 composants), mais **`src/App.js` est un vrai « God file »** et `DrinkCard.jsx` contient de la duplication forte. Les autres fichiers sont corrects. Ce n'est pas une urgence utilisateur, mais c'est **le frein principal** pour les évolutions décidées (fusion des mises à jour du menu A-04, multi-bars A-29, vue Ticket) et la cause indirecte de plusieurs bugs (panier obsolète A-06, stockage fragile A-08, tri en double A-09).

| Fichier | Taille | Constat | Verdict |
|---|---|---|---|
| `src/App.js` | ~13 Ko, ~330 lignes | **Deux composants** (`DrinkOrderApp`, `App`) ; ~10 états ; persistance `localStorage` ; tri et calcul de popularité ; logique du panier ; finalisation de commande ; CRUD boissons **et** catégories ; état de 3 fenêtres ; routage ; toasts ; mise en page. Une vingtaine de fonctions dans un seul composant. | **God file** |
| `src/components/DrinkCard.jsx` | ~9,5 Ko | **Trois rendus quasi dupliqués** (Large/Compact/Minimal, ~80 lignes chacun), plus son, seuils de popularité et animation. | **Duplication** |
| `src/components/OrderSummary.jsx` | ~8,7 Ko | Deux composants dans un fichier, détection mobile, overlay maison, deux rendus. | À découper (moyen) |
| `src/components/Header.jsx` | ~6 Ko | En-tête + menu + installation PWA + thèmes + vues. | Acceptable, à alléger |
| `src/components/LandingPage.jsx` | ~3,8 Ko | Interface + logique d'installation + logique de mise à jour du service worker. | À découper (léger) |
| `CategorySection.jsx` | ~5,4 Ko | **12 propriétés** transmises (« prop drilling » : `App` → `CategorySection` → `DrinkCard`). | À simplifier |

**Refactorisation proposée (progressive, sans réécriture complète)**
```
src/
  pages/           LandingPage.jsx, OrderPage.jsx   (ex-DrinkOrderApp, < 80 lignes de rendu)
  hooks/           useStoredState.js  (localStorage sûr, A-08)
                   useMenu.js         (catégories/boissons, fusion de mises à jour, A-04/A-29)
                   useCart.js         (useReducer : ajouter, quantité, retirer, vider ; prix rafraîchis, A-06)
                   useOrderHistory.js (historique, plafond, A-22)
                   usePWA / PWAContext (une seule instance, A-30)
  lib/             storage.js, money.js (centimes, format €), sort.js (tri, popularité), share.js, audio.js
  components/
    drink/         DrinkCard.jsx + variantes (une seule structure, 3 variantes de style)
    cart/          OrderSummary.jsx, CartLine.jsx, CartSheet.jsx
    menu/          CategorySection.jsx, SortControls.jsx, EditDrinkModal.jsx, EditCategoryModal.jsx
  contexts/        ThemeContext.jsx, PWAContext.jsx, (option) MenuContext.jsx pour éviter le prop drilling
```
- `App.js` doit se réduire au routage et aux fournisseurs de contexte (< 50 lignes).
- Repère : aucun fichier au-delà d'environ 200 lignes, aucune fonction métier (panier, tri, fusion) écrite dans un composant.
- Pas besoin de Redux ni d'une autre bibliothèque : hooks + `useReducer` + un ou deux contextes suffisent à cette taille.

**Ordre conseillé** (chaque étape livrable seule et testée) :
1. `lib/storage.js` + `useStoredState` (corrige aussi A-03 et A-08).
2. `lib/money.js` et `lib/sort.js` (fonctions pures, faciles à tester).
3. `useCart` (corrige A-06, A-13) puis `useMenu` (prérequis de A-04 et A-29).
4. Découper `DrinkCard` (A-10, A-12, A-20) et `OrderSummary` (A-11, A-15).
5. Extraire `OrderPage` et `PWAContext` ; `App.js` devient minimal.

**Règle** : ne pas lancer cette refactorisation avant d'avoir corrigé les bugs bloquants (A-28, A-02, A-06) ; l'intégrer ensuite au fil des évolutions, avec des tests unitaires sur les fonctions pures (panier, tri, fusion du menu, lecture du stockage).

---

### A-33 — Poids de l'application et performance au chargement — P3 (à mesurer avant d'agir)

**Fichiers concernés** : `package.json`, `craco.config.js`, `tailwind.config.js`, `src/index.js`, `src/App.js`, `src/components/ui/sonner.jsx`

**Mesure fournie (Chrome DevTools ▸ Coverage, chargement de la page)**

| Fichier | Taille brute | Exécuté au chargement | Non exécuté |
|---|---|---|---|
| `main.a6992fd4.js` | 446,6 Ko | 78,4 Ko | 368,3 Ko (82,5 %) |
| `main.0e3b1f8e.css` | 67,2 Ko | 20,6 Ko | 46,6 Ko (69,3 %) |
| **Total** | **513,8 Ko** | **99,0 Ko** | **414,8 Ko (80,7 %)** |

*Observation : les noms de fichiers (`a6992fd4`, `0e3b1f8e`) diffèrent de ceux de l'arborescence fournie (`0a3c1466`, `44a2eb18`) et de ceux codés en dur dans `public/service-worker.js` : trois builds différents coexistent. Cela renforce l'avertissement de version (section 3 bis).*

**Lecture critique de cette mesure (à ne pas transmettre telle quelle)**
1. **Ce ne sont pas des octets téléchargés.** 446,6 Ko et 67,2 Ko sont des tailles **non compressées**. Netlify sert normalement le JS/CSS en **Brotli ou gzip** : le transfert réel est de l'ordre de **130–160 Ko pour le JS et 10–15 Ko pour le CSS** (estimation à confirmer dans l'onglet Réseau, colonne « Transféré »). L'affirmation « l'utilisateur télécharge 513 Ko » est fausse pour un site compressé.
2. **« Code non exécuté » ≠ « code mort ».** Coverage compte seulement ce qui a **tourné pendant l'enregistrement** : fenêtres de modification, menus déroulants, historique, partage, styles de survol/animation ne s'exécutent qu'à l'interaction, et une grande partie de React/React-DOM/Radix n'est utilisée que par moments. Un taux de 80 % est **normal** pour une application React interactive ; il ne signifie pas 80 % de gaspillage.
3. **Tailwind est déjà configuré correctement** : `tailwind.config.js` balaie `./src/**/*.{js,jsx,ts,tsx}` et `./public/index.html`, et Tailwind 3 ne génère que les classes utilisées. Il n'y a **pas** de PurgeCSS/UnCSS à ajouter. Les 67 Ko incluent les trois jeux de variables de thème et les variantes de composants ; l'objectif « 20 Ko » n'est ni réaliste ni utile (≈ 10–15 Ko une fois compressé).
4. **Plusieurs consignes du plan proposé ne s'appliquent pas à cette application** : pas de « modales de paiement, graphiques, panneau d'administration » ; pas de `lodash` ; `lucide-react` est déjà importé par icône nommée (le tree shaking fonctionne) ; l'application n'a que deux routes dont l'une (la landing) est minuscule : un découpage par route apporterait très peu. `rollup-plugin-visualizer` concerne Vite ; ici (CRA + CRACO) l'outil adapté est **`source-map-explorer`** (les fichiers `.map` sont déjà générés).
5. **Cible « JS initial < 150 Ko » à reformuler** : en taille brute elle est impossible (React 19 DOM + React Router 7 + Radix dépassent déjà ce seuil) ; en taille **compressée**, l'application est probablement déjà proche.
6. **Effet PWA** : le service worker précache les fichiers ; le poids n'est payé qu'**une fois par version**, ensuite l'app se lance depuis le cache.

**Ce qui vaut la peine d'être fait (par ordre d'utilité)**
1. **Mesurer correctement** : DevTools ▸ Réseau (colonne « Transféré » et en-tête `content-encoding: br` ou `gzip`), puis **Lighthouse en mode mobile** (throttling 4G lent) sur `/` et `/app` : relever LCP, TBT, score Performance. Décider seulement ensuite.
2. **Retirer `sonner` et `next-themes`** lors de la correction d'A-02 (quelques Ko, et une dépendance inutile).
3. **Charger à la demande** les composants d'usage rare via `React.lazy` + `Suspense` : `OrderHistory`, `EditDrinkModal`, `EditCategoryModal`, `ConfirmOrderModal`, `DeleteConfirmDialog` (gain modeste, à valider avec l'analyseur ; prévoir un état de chargement et vérifier que les fragments sont bien précachés hors ligne).
4. **Analyser la composition** : `npx source-map-explorer 'build/static/js/main.*.js'` pour voir la part de React DOM, React Router, Radix, `tailwind-merge`, etc. ; ne supprimer une bibliothèque (ex. remplacer React Router pour deux routes) que si le gain est significatif.
5. **Ne pas** ajouter PurgeCSS, ne pas fixer d'objectif en Ko bruts.
6. Corriger les vrais coûts de rendu déjà notés : transition sur `*` (A-18), tri en double (A-09).

---

### A-34 — Historique : impossible de supprimer une commande individuelle — P3

**Fichiers concernés** : `src/components/OrderHistory.jsx`, `src/App.js`

**Origine** : relevé dans le second plan de l'ami, vérifié dans le code fourni — confirmé, absent de l'audit initial.

**Constat** : `OrderHistory.jsx` n'a aucun bouton de suppression par commande ; seul un vidage global serait à ajouter (voir A-22, « bouton Vider l'historique », qui ne couvre que l'ensemble). Il est impossible de retirer une seule commande erronée (doublon, test, erreur de saisie) sans tout effacer.

**Correction** : ajouter un bouton de suppression par ligne d'historique, avec confirmation (`DeleteConfirmDialog`, cohérent avec le reste de l'app) ; remonter un gestionnaire `onRemoveOrder(orderId)` depuis `App.js` qui filtre `orderHistory`.

---

### A-35 — Compléments ponctuels du second plan (ami) — P3

**Fichiers concernés** : `src/index.css`, `src/contexts/ThemeContext.jsx`, `src/components/ThemeToggle.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/InstallBanner.jsx`, `src/components/Header.jsx`

Quatre points mineurs, confirmés en relisant le second plan, qui n'étaient pas déjà couverts ailleurs :

1. **Couleurs CMJN exactes du club** : le thème `gentbar` de `index.css` utilise déjà un bleu marine et un fuchsia proches de l'identité du club (`#071D49` / `#E6007E`, voir A-01), mais ce ne sont pas des conversions exactes des valeurs CMJN citées (C100 M77 K66 pour le bleu, M100 pour le magenta). Conversion calculée : le bleu du club donnerait plutôt `#001457` (plus sombre, plus bleu) et le magenta pur `#FF00FF` (plus saturé que le fuchsia actuel). **À trancher avec le club/le graphiste** : soit les valeurs CMJN citées sont approximatives et les couleurs actuelles conviennent, soit il faut recalculer précisément (une conversion CMJN→RVB dépend aussi du profil colorimétrique utilisé) et mettre à jour les variables `--background`/`--primary` du thème `gentbar` dans `index.css`.
2. **`ThemeToggle.jsx`** : confirmation qu'il plante s'il est utilisé (`{ isDark, toggleTheme }` inexistants dans le contexte, voir A-19). Le second plan propose de le **réparer** (`{ theme, cycleTheme }`) plutôt que de le supprimer : les deux options sont valables ; à réparer seulement s'il doit être réutilisé quelque part, sinon le supprimer reste plus simple (A-25).
3. **`EditDrinkModal.jsx`** : le titre et le libellé du bouton se basent à la fois sur la prop `mode` et sur un test `drink.id.startsWith('custom-')`, redondant et source d'incohérence si l'id change de convention. Simplifier pour ne se baser que sur `mode`.
4. **`InstallBanner.jsx`** : **décision prise** (confirmée lors du 3ᵉ round de tests) — le bouton « Installer » de la bannière a un contraste très faible sur fond bleu (thèmes clair et sombre) et la bannière réapparaît après navigation même une fois fermée. **La bannière sera supprimée**, au profit du seul bouton d'installation de la page d'accueil (voir A-30). Le correctif d'A-30 (un seul écouteur `beforeinstallprompt` partagé) doit donc cibler **le bouton de la landing uniquement**, `InstallBanner.jsx` étant retiré du projet (et son import dans `App.js`).

---

### A-36 — Confirmation de suppression trompeuse pour une boisson — P1 (cause exacte confirmée, bug plus large que ce qui avait été testé)

**Fichiers concernés** : `src/components/DeleteConfirmDialog.jsx`, `src/components/DrinkOrderApp.jsx`, `src/components/EditDrinkModal.jsx`

**Cause exacte, lue dans le code** : `DeleteConfirmDialog.jsx` définit `title = "Supprimer la catégorie"` comme **valeur par défaut du paramètre**, avec une description par défaut qui parle elle aussi de supprimer « la catégorie ainsi que l'ensemble des boissons ». Dans `DrinkOrderApp.jsx`, ce composant est appelé ainsi :

```jsx
<DeleteConfirmDialog
  {...deleteDialog}
  onClose={...}
  onConfirm={...}
/>
```

Or `deleteDialog` (le state) ne contient que `{ isOpen, type, item, categoryId }` — **jamais** de `title` ni de `description`. Résultat : **quel que soit `type`** (`'drink'` ou `'category'`), aucun `title`/`description` n'est jamais transmis, et le composant retombe **systématiquement** sur ses valeurs par défaut, celles de la catégorie.

**Ce qui change par rapport à ce qui avait été testé** : le testeur avait repéré le problème en supprimant une boisson **depuis la fenêtre de modification**. En réalité, dans la version actuelle du dépôt, **c'est devenu le seul chemin possible** pour supprimer une boisson : `DrinkCard.jsx` n'a plus de bouton Supprimer propre (seul « Modifier » subsiste, conformément à la décision produit prise en A-12), la suppression se fait exclusivement via « Modifier → Supprimer la boisson ». **Le bug touche donc 100 % des suppressions de boisson**, pas un cas particulier.

**Correction**
1. Dans `DrinkOrderApp.jsx`, construire explicitement `title`/`description` selon `deleteDialog.type` au moment de l'ouverture (comme c'était fait dans l'ancienne version de `App.js`), ou les calculer directement dans `DeleteConfirmDialog.jsx` à partir de `type` plutôt que de dépendre de valeurs par défaut.
2. Nommer la boisson dans le texte (« Supprimer **Duvel** ? ») pour lever toute ambiguïté.
3. Ajouter un test qui couvre ce chemin unique de suppression, pour éviter qu'un futur changement de structure (ex. remise d'un bouton Supprimer sur la carte) ne fasse régresser à nouveau silencieusement.

---

### A-37 — Partage : la commande réelle n'est jamais envoyée — P1 (nouveau, confirmé sur le dépôt)

**Fichiers concernés** : `src/components/OrderSummary.jsx`, `src/components/ShareButtons.jsx`

**Constat** : `OrderSummary.jsx` appelle `<ShareButtons />` **sans aucune prop** (ni `order`, ni `isCurrentOrder`). Dans `ShareButtons.jsx`, `formatOrderSummary(orderData)` commence par `if (!orderData) return "Aucune commande à partager."`. Avec `order` toujours `undefined`, **tous** les canaux de partage (WhatsApp, Messenger, SMS, e-mail, copier) envoient ou copient systématiquement le texte **« Aucune commande à partager. »**, jamais le contenu réel du panier.

**Remarque** : un testeur avait pourtant rapporté que WhatsApp « propose de choisir un contact et permet de partager la commande via un résumé » — sans préciser avoir vérifié le **contenu** du message envoyé. Deux explications possibles : soit le site Netlify déployé est **en retard** sur la branche `main` du dépôt (cohérent avec les autres écarts déjà relevés), soit le texte « Aucune commande à partager » est passé inaperçu dans l'aperçu WhatsApp. **À reconfirmer par un test où l'on ouvre réellement le message envoyé.**

**Correction** : transmettre `order={orders}` et `isCurrentOrder={true}` à `<ShareButtons />` depuis `OrderSummary.jsx` (comme c'est déjà bien fait dans `OrderHistory.jsx`) ; ajouter un test qui vérifie que le texte partagé contient effectivement les articles du panier en cours.

---

### A-38 — Pagination du panier : la page affichée ne se corrige pas après suppression — P2 (nouveau, confirmé — ce point du second plan était à tort classé « non vérifiable »)

**Fichiers concernés** : `src/components/OrderSummary.jsx`

**Correction du document** : ce point figurait en section 3 ter comme « non retrouvé dans le code fourni ». Il est bien réel dans la version actuelle : `OrderSummary.jsx` pagine désormais le panier par blocs de 5 lignes (`ITEMS_PER_PAGE = 5`, état `currentPage`), fonctionnalité ajoutée après les fichiers initialement transmis.

**Constat** : aucun effet ne surveille `orders.length` ni `currentPage` pour les recaler l'un par rapport à l'autre. En supprimant ou en vidant des lignes jusqu'à ce que la page actuellement affichée devienne vide (ex. : 7 articles, page 2 affichée, suppression des 2 derniers articles de cette page), `currentPage` reste pointé sur une page qui n'existe plus : la liste affichée devient vide alors que le panier contient encore des articles sur la page précédente, et les commandes de pagination (« Page 2 sur 2 ») restent incohérentes.

**Correction** : ajouter un `useEffect` qui recale `currentPage` (`Math.min(currentPage, totalPages - 1)`, jamais négatif) à chaque changement de `orders.length` ou de `totalPages` ; ou plus simplement, repasser automatiquement en première page après toute suppression/vidage.

---

## 5. Recommandations produit (alignées sur le but « mémo au bar »)

**Priorité haute**
1. **Recommander une tournée** depuis l'historique : bouton « Recommander » qui recharge les lignes dans le panier, aux **prix actuels de la carte** (avec avertissement si un prix a changé ou si une boisson n'existe plus).
2. **Sauvegarde / restauration** (export + import JSON) et **multi-bars** (A-29).
3. **Vue « Ticket »** plein écran : quantité × nom en gros caractères, lisible au comptoir, écran maintenu allumé si possible.

**Priorité moyenne**
4. **Historique orienté vérification** : étiquette libre optionnelle par commande (ex. « Match du samedi »), total visible par ligne, tri par date, filtre par bar, bouton « Vider l'historique ». Pas de comptabilité complète : seulement de quoi vérifier un montant.
5. **Mode installation guidée** iPhone et Android (A-27).

**Fonction accessoire (optionnelle)**
6. **Cocher les lignes** au comptoir (« servi / à prendre ») dans la vue Ticket, avec compteur « 5 sur 8 » ; option activable/désactivable dans le menu pour ne pas alourdir l'interface. Cette fonction ne doit **pas** changer le total ni l'historique ; état temporaire lié à la commande en cours.

---

## 6. Décisions du propriétaire et questions restantes

**Décisions**
- Carte de base = club de hockey, modifiable ; ajout futur d'un sélecteur de bar (A-29).
- Prix et noms de base définis dans `mock.js`, ensuite modifiables par chaque utilisateur ; une mise à jour publiée sur Netlify doit se **fusionner** sans écraser les personnalisations (A-04).
- Logos = icônes emoji des catégories uniquement ; boissons en texte.
- Historique = recommander une tournée + vérifier un montant ; cocher = accessoire.
- Distribution par PWA (Android + iPhone), pas de store, Netlify (`https://gentbar.netlify.app/`), cercle d'amis.
- **Partage d'une carte par lien** : souhaité (A-29, point 5).
- **Son désactivé par défaut** : dans `App.js`, `soundEnabled` doit valoir `false` au premier lancement (aujourd'hui `?? true`) ; l'option reste activable dans le menu ☰.
- **Version d'iPhone** : pas d'exigence fixée ; cible pragmatique **iOS 15 ou plus récent**, les fonctions récentes (écran maintenu allumé, etc.) devant se dégrader proprement si absentes.

**Hypothèse retenue (à corriger si faux)** : « Recommander une tournée » recharge les quantités dans le panier aux **prix actuels de la carte**, avec un avertissement si un prix a changé ou si une boisson n'existe plus. Le montant réellement payé à l'époque reste visible dans l'historique.

**Questions restantes** : aucune bloquante. Recommandation : demander aux amis quel téléphone ils utilisent pour confirmer la cible iPhone.

**Vérification du site en ligne** (`https://gentbar.netlify.app/`) : la page d'accueil déployée correspond au code fourni (mêmes balises meta, `theme-color #0f172a`, viewport sans `viewport-fit=cover`). Le propriétaire confirme que `https://gentbar.netlify.app/app` s'ouvre correctement sur son téléphone Android : une règle de réécriture existe donc peut-être déjà dans Netlify, ou le service worker a servi la page depuis le cache. Le programmeur doit tout de même le vérifier dans un **onglet privé / navigateur neuf** et **ajouter la règle dans le dépôt** (`public/_redirects`) pour ne pas dépendre d'un réglage invisible (A-28).

---

## 6 bis. Nouvelles fonctionnalités détaillées (demandées par le propriétaire)

Six pistes, approfondies à la demande du propriétaire, à développer **après** la correction des bugs du top 10. Chaque fiche distingue ce qui est une **décision par défaut** (proposée faute de précision, modifiable sans repasser par cette discussion) d'une **question à trancher** (nécessite une réponse du propriétaire avant de coder).

---

### E-1 — Récapitulatif de soirée et partage équitable

**Fichiers concernés** : `src/components/OrderHistory.jsx`, `src/components/DrinkOrderApp.jsx`, nouveau composant `SplitBillModal.jsx` (à créer)

**Principe** : dans l'historique, un mode « Sélection » (bouton à bascule) fait apparaître une case à cocher sur chaque commande. Les commandes sélectionnées affichent un total courant en bas d'écran (« 3 commandes sélectionnées — 47,50 € ») avec un bouton **Diviser**.

**Flux** :
1. Bouton « Sélection » dans l'historique → cases à cocher par commande (même composant visuel que les cases de la vue Ticket, voir E-4, pour rester cohérent).
2. Par défaut, **toutes les commandes du jour en cours sont pré-sélectionnées** à l'ouverture du mode Sélection (calculées sur la date de la commande, fuseau horaire de l'appareil) — évite de tout cocher à la main pour l'usage le plus fréquent (« combien on a dépensé ce soir »). L'utilisateur peut décocher/cocher librement, y compris des commandes plus anciennes.
3. Bouton **Diviser** → demande le nombre de personnes (stepper +/− ou champ numérique, 1 à 20) → affiche :
   - le montant exact par personne (ex. 47,50 € ÷ 4 = **11,875 €** affiché 11,88 €),
   - une **suggestion arrondie** à la pièce ou au billet le plus proche (0,10 €, 0,50 € ou 1 € selon préférence), avec l'écart signalé (« arrondi à 12,00 €, soit 0,13 € de plus par personne, 0,50 € au total en faveur de la cagnotte »).
4. Pas de paiement réel ni de répartition nominative (pas de comptes, pas de noms d'amis dans l'app, cohérent avec A-6/A-29) : l'écran sert uniquement de calculette à montrer aux amis.

**Décisions par défaut** : pré-sélection du jour en cours ; arrondi au 0,10 € le plus proche, affiché à titre de suggestion à côté du montant exact (l'utilisateur choisit celui qu'il annonce).

**Question à trancher** : aucune — fonctionnalité autonome, sans dépendance à E-2.

---

### E-2 — Mode Cagnotte (décompte, alerte, réapprovisionnement, restitution) — décidé

**Fichiers concernés** : nouveau `src/contexts/CagnotteContext.jsx`, nouveau composant `CagnotteModal.jsx` et/ou bandeau dans `Header.jsx`, `src/App.css` (bandeau d'alerte), `src/components/ConfirmOrderModal.jsx` (case à cocher)

**Principe, confirmé** : une cagnotte est un solde suivi **localement sur l'appareil** de la personne qui la gère — ce n'est **pas** un solde partagé en temps réel entre les téléphones des amis (l'app n'a pas de serveur, voir A-27/A-28). C'est un compteur personnel d'aide-mémoire pour celui qui gère l'argent du groupe.

**Données à stocker** (`localStorage`, nouvelle clé dédiée) :
```
{
  isActive: bool,
  montantParPersonne: number,
  nombreCagnotteurs: number,
  soldeInitial: number,       // montantParPersonne × nombreCagnotteurs
  soldeCourant: number,
  seuilAlerte: number,        // montant fixe choisi à la création
  mouvements: [               // historique de la session en cours, pour le résumé de clôture
    { type: 'depense' | 'reapprovisionnement', montant, date, orderId? }
  ],
  dateCreation
}
```

**Flux complet** :
1. **Créer une cagnotte** (menu ☰ ▸ « Démarrer une cagnotte ») : montant par personne (ex. 5 €), nombre de cagnotteurs (ex. 6) → `soldeInitial = soldeCourant = 30 €` ; **seuil d'alerte** demandé au même moment, en **montant fixe** (ex. « me prévenir sous 10 € »).
2. **Indicateur permanent** : bandeau discret (sous l'en-tête ou badge dans le menu ☰) affichant le solde courant, visible tant que la cagnotte est active.
3. **Déduction à la commande** : dans `ConfirmOrderModal`, une case à cocher **« Payée via la cagnotte »**, cochée par défaut si une cagnotte est active, décochable au cas par cas (quelqu'un paie de sa poche). Si cochée, le total de la commande est déduit du solde et ajouté à `mouvements` au moment de la confirmation.
4. **Alerte de réapprovisionnement** : dès que `soldeCourant < seuilAlerte`, un bandeau apparaît et **reste affiché** (pas un toast qui disparaît seul) : « La cagnotte passe sous {seuil} € — pensez à remettre de l'argent », avec un bouton direct vers l'action suivante.
5. **Réapprovisionner en cours de soirée** : bouton toujours accessible (depuis le bandeau d'alerte ou le menu ☰) → saisie d'un montant libre → ajouté à `soldeCourant` et à `mouvements` (horodaté), disponible à tout moment, pas seulement quand l'alerte est affichée.
6. **Réinitialiser la cagnotte** : action séparée et immédiate — remet `soldeCourant = soldeInitial` et vide `mouvements`, **sans calcul de restitution** ; utile en cas d'erreur de saisie en cours de soirée plutôt que de tout re-créer. Demande une confirmation simple (pas de résumé affiché, puisqu'on efface justement une session qu'on considère invalide).
7. **Clôturer la cagnotte (fin de soirée)** : affiche un résumé — total dépensé, nombre de réapprovisionnements et leur somme, **solde final** — puis propose la **restitution** : `soldeCourant ÷ nombreCagnotteurs`, avec le même principe d'arrondi que E-1 (montant exact affiché, suggestion arrondie à la pièce la plus proche à côté). Valider la clôture désactive la cagnotte (`isActive: false`) ; les prochaines commandes reviennent au mode normal (case à cocher absente) jusqu'à la création d'une nouvelle cagnotte.

**Décisions confirmées** (ne sont plus des questions ouvertes) : seuil fixe choisi à la création ; déduction via case à cocher sur `ConfirmOrderModal`, cochée par défaut ; réapprovisionnement possible à tout moment en cours de soirée ; réinitialisation immédiate (distincte de la clôture) ; restitution du solde final divisé entre les cagnotteurs, avec arrondi suggéré.

**Point de vigilance à garder à l'esprit lors du développement** : comme ce n'est pas un vrai porte-monnaie partagé en temps réel, le nom « cagnotte » dans l'interface devra être accompagné d'un petit texte explicatif la première fois (« ce compteur n'est visible que sur ce téléphone ») pour éviter toute confusion avec un système qui suivrait l'argent réel de plusieurs personnes en direct.

---

### E-3 — Recherche dans le menu

**Fichiers concernés** : `src/components/DrinkOrderApp.jsx`, `src/components/CategorySection.jsx`, nouveau petit composant `MenuSearch.jsx` (ou champ directement dans l'en-tête du menu)

**Principe** : un champ de recherche au-dessus des catégories, filtre en direct sur le nom des boissons (insensible à la casse et aux accents).

**Performance** : avec ~60 boissons, un filtre en mémoire à chaque frappe est instantané (pas de debounce nécessaire, pas de recherche distante, rien à optimiser côté réseau). Le seul point d'attention est de **mémoïser** la liste filtrée (`useMemo` sur `[categories, query]`) pour ne pas refaire le calcul à chaque rendu du reste de l'app — cohérent avec le découpage déjà recommandé en A-32.

**Comportement par défaut** : pendant une recherche active, affichage d'une liste **à plat** (toutes catégories confondues, nom de la catégorie d'origine rappelé en petit à côté de chaque résultat) plutôt que de déplier/replier les catégories correspondantes — plus direct à l'usage, un seul geste pour trouver et ajouter. Champ vidé → retour à l'affichage normal par catégories, dans l'état où il était avant la recherche (plié/déplié conservé).

**Question à trancher** : aucune, c'est la vue Ticket (E-4) qui a plus besoin d'arbitrages.

---

### E-4 — Vue Ticket (prise de commande au bar)

**Fichiers concernés** : nouveau composant `TicketView.jsx`, `src/components/DrinkOrderApp.jsx` (déclenchement), `src/App.css`

**Principe** : un écran plein écran, distinct du panier habituel, pensé pour être lu au comptoir pendant que le bar prépare ou sert la commande.

**Caractéristiques** :
- Ouverture : soit automatiquement après « Confirmer la commande », soit via un bouton dédié « Voir le ticket » depuis le panier, au choix de l'utilisateur à chaque fois (les deux usages sont légitimes : partir commander tout de suite, ou relire après coup).
- Présentation : gros caractères, une ligne par article (« 2× Jupiler », « 1× Duvel »…), **groupé par catégorie** dans le même ordre que le menu (plus facile à suivre pour le barman qui prépare dans un ordre logique), total bien visible en haut ou en bas, fixe à l'écran.
- Case à cocher par ligne (fonction accessoire déjà validée précédemment) : coche visuelle « pris » sans effet sur le total ni sur l'historique, compteur « 5 sur 8 » affiché en tête d'écran.
- **Écran maintenu allumé** pendant que la vue est ouverte (API *Screen Wake Lock*, avec repli silencieux si le navigateur ne la supporte pas).
- Fermeture par un bouton explicite (pas seulement le retour arrière, pour éviter une fermeture accidentelle pendant qu'on tient son téléphone au comptoir).
- Fonctionne hors ligne comme le reste de l'app (aucune dépendance réseau).

**Décision par défaut** : les cases cochées sont réinitialisées à chaque nouvelle commande (état temporaire, non persisté), cohérent avec leur rôle d'aide-mémoire ponctuel.

---

### E-5 — Tri par popularité plutôt que favoris

**Fichiers concernés** : `src/components/SortControls.jsx`, `src/components/DrinkOrderApp.jsx`

**Constat** : l'option de tri « Popularité » existe déjà (calculée depuis l'historique, voir A-17 pour son défaut actuel — comptage par nom plutôt que par identifiant, à corriger en même temps). Plutôt qu'une rangée de favoris séparée, la préférence est de s'appuyer sur ce tri existant.

**Amélioration proposée** : une fois la persistance du tri ajoutée (A-03), permettre de **définir « Popularité » comme tri par défaut** à l'ouverture de l'app plutôt que « Alphabétique », au choix dans un réglage simple. Corriger A-17 en parallèle, sinon le tri par popularité reste peu fiable dès qu'une boisson est renommée.

**Question à trancher** : aucune — confirmé, pas de développement de rangée de favoris séparée.

---

### E-6 — Unifier le style des actions destructives

**Fichiers concernés** : `src/components/DeleteConfirmDialog.jsx`, `src/components/OrderSummary.jsx`, `src/components/EditDrinkModal.jsx`, `src/components/OrderHistory.jsx`, `src/components/DrinkOrderApp.jsx`

**Principe** : un seul mécanisme, utilisé partout où une suppression est possible, avec deux niveaux selon la gravité réelle de l'action :
- **Action réversible, fréquente** (supprimer une ligne du panier, supprimer une commande de l'historique) → pas de fenêtre de confirmation, mais un **toast « Supprimé — Annuler »** pendant quelques secondes (nécessite d'abord de réparer l'affichage des notifications, voir A-02).
- **Action large ou irréversible** (vider tout le panier, supprimer une catégorie entière de boissons, supprimer une boisson du menu) → fenêtre de confirmation unique (`DeleteConfirmDialog`), avec un **texte construit dynamiquement** à partir du type et du nom de l'élément (voir la correction d'A-36 : ne plus dépendre d'un texte par défaut) plutôt qu'un texte différent par écran.

**Effet** : ce chantier referme en une seule fois A-13, A-36, et une partie d'A-21/A-22 (vidage de l'historique), en plus de rendre plus prévisible l'ajout de la case « vider la commande » dans la cagnotte (E-2) ou de la sélection multiple de l'historique (E-1).

---

### E-7 — Note libre sur une commande

**Fichiers concernés** : `src/components/ConfirmOrderModal.jsx`, `src/components/DrinkOrderApp.jsx`, `src/components/OrderHistory.jsx`, `src/components/ShareButtons.jsx`, nouveau composant `TicketView.jsx` (E-4)

**Principe** : un champ de texte **optionnel**, dans la fenêtre de confirmation (`ConfirmOrderModal`), sous le total — pas sur chaque ligne du panier. Une commande = une note, pas une note par boisson, pour rester simple (« sans glaçons pour le mojito » se dit aussi bien en une phrase que par ligne).

**Flux** : champ vide par défaut, limité à une longueur raisonnable (une centaine de caractères, pour qu'il reste lisible dans le ticket et l'historique sans déborder) ; enregistré avec la commande (`note` ajouté à l'objet stocké dans `orderHistory`, vide si non renseigné) ; affiché :
- dans l'historique, sous la liste des articles de la commande concernée ;
- dans la vue Ticket (E-4), en évidence en haut, puisque c'est l'écran tenu au comptoir ;
- dans le texte partagé (`ShareButtons`), ajouté à la fin du résumé si la note n'est pas vide.

**Décision par défaut** : pas de note par ligne du panier, uniquement une note globale par commande — plus simple à afficher partout, et couvre l'usage décrit.

---

### E-8 — Recommander la même tournée

**Fichiers concernés** : `src/components/OrderHistory.jsx`, `src/components/ConfirmOrderModal.jsx`, `src/components/DrinkOrderApp.jsx`

**Principe** : complète la recommandation déjà notée en section 5 avec un second point d'accès, pour l'usage le plus fréquent — repartir tout de suite chercher la même chose.

**Deux points d'accès** :
1. **Dans l'historique**, un bouton « Recommander » sur chaque commande passée (déjà prévu).
2. **Sur l'écran de confirmation lui-même**, juste après validation : un bouton ou un lien « Recommander cette tournée » dans le message de succès — évite de rouvrir l'historique pour le cas, très courant, où on repart aussitôt.

**Logique commune aux deux (fonction partagée, pas dupliquée)** :
- Recharge les articles de la commande choisie dans le panier courant, **aux prix actuels de la carte** (décision déjà actée en section 6).
- Pour chaque article : s'il correspond encore à une boisson existante (par `drinkId`), on prend son prix et son nom **actuels** ; s'il a été supprimé du menu depuis, on l'ignore et on le signale (« Jupiler n'est plus au menu, non rajoutée ») plutôt que de le rajouter avec un prix obsolète — cohérent avec la correction prévue en A-06.
- Si le panier courant n'est pas vide au moment de « Recommander », les nouvelles lignes s'ajoutent aux lignes déjà présentes (cumul), sans écraser — pas de confirmation nécessaire, l'ajout au panier est déjà une action réversible (voir E-6).

---

### E-9 — Verrouillage de l'écran pendant la prise de commande (vue Ticket)

**Fichiers concernés** : `src/components/TicketView.jsx` (composant de E-4)

**Principe** : dans la vue Ticket plein écran (E-4), un petit bouton cadenas permet de **verrouiller l'écran** avant d'aller au comptoir, pour éviter qu'un contact accidentel (téléphone qui bouge en poche, main qui frôle l'écran) ne coche une ligne ou ne ferme la vue par erreur.

**Flux** :
- Une fois verrouillé, toute la surface de la vue devient inerte (les cases à cocher et le bouton de fermeture ne réagissent plus à un appui simple), un petit indicateur visuel reste visible (icône cadenas, léger assombrissement du fond) pour rappeler l'état.
- **Déverrouillage par double-appui** n'importe où sur l'écran — rapide à faire volontairement, assez improbable par accident dans une poche ou en marchant.
- Le verrouillage **n'interrompt pas** le maintien de l'écran allumé (*Wake Lock*, déjà prévu en E-4) : les deux mécanismes sont indépendants.
- État non persisté : la vue s'ouvre toujours déverrouillée, l'utilisateur verrouille volontairement avant de partir vers le comptoir.

---

### E-10 — Alerte de doublon de nom de boisson

**Fichiers concernés** : `src/components/EditDrinkModal.jsx`, nouveau `src/lib/search.js` (fonction de normalisation, créée pour E-3 et réutilisée ici)

**Principe, confirmé** : pas d'algorithme séparé — la fonction de normalisation déjà nécessaire pour la recherche (E-3 : minuscules, accents retirés, espaces superflus nettoyés) est extraite dans un petit module partagé (`src/lib/search.js`) et réutilisée ici.

**Flux** : à l'enregistrement d'une boisson (ajout ou renommage) dans `EditDrinkModal`, le nom saisi est comparé, via cette même fonction de normalisation, aux autres boissons **de la même catégorie** (en excluant la boisson en cours d'édition s'il s'agit d'un renommage). En cas de correspondance, un message s'affiche sous le champ (« Une boisson nommée « Duvel » existe déjà dans cette catégorie ») **sans bloquer l'enregistrement** — un nom identique peut être volontaire dans de rares cas (ex. deux formats de la même bière mal distingués autrement) ; l'utilisateur reste libre de confirmer malgré l'avertissement.

**Effet secondaire utile** : fiabilise au passage le tri par popularité (A-17, qui compte aujourd'hui par nom plutôt que par identifiant) en réduisant les doublons de noms qui faussent ce comptage.

---

### E-11 — Création rapide d'une carte : coller une liste de texte, avec vérification, et astuce photo

**Fichiers concernés** : nouveau composant `BulkAddDrinksModal.jsx`, `src/components/EditCategoryModal.jsx` (ou l'en-tête de catégorie, point d'entrée), nouveau `src/lib/parseDrinkList.js`

**Constat de départ** : créer une carte boisson par boisson (une fenêtre par article) est long. Deux apports combinés, l'un simple, l'autre gratuit techniquement :

**1. Coller une liste de texte** (le cœur de la fonctionnalité) : dans une catégorie, un bouton **« Ajouter plusieurs boissons »** ouvre une grande zone de texte où l'on tape ou colle une liste, une boisson par ligne (« Jupiler 2,50 », « Duvel — 4,50 € », peu importe le séparateur). Une fonction d'analyse tolérante (`parseDrinkList.js`) repère le **dernier nombre de la ligne** comme le prix (virgule ou point accepté, symbole € ignoré) et prend le reste comme nom.

**2. Vérification et correction immédiate, avant tout enregistrement** : l'analyse affiche aussitôt un tableau d'aperçu, une ligne par boisson détectée, **modifiable directement** (nom et prix restent des champs éditables) :
   - ✅ ligne reconnue sans ambiguïté ;
   - ⚠️ ligne où plusieurs nombres étaient présents (le dernier a été pris, à vérifier) ;
   - ❌ ligne sans prix détecté (nom conservé, prix à remplir à la main).
   
   Chaque ligne reste supprimable individuellement avant de valider « Ajouter ces N boissons à {catégorie} ». Rien n'est enregistré tant que cette étape de vérification n'est pas validée — c'est elle qui rend l'ensemble fiable malgré une analyse volontairement simple.

**3. L'astuce photo, pour ne pas avoir à retaper une carte existante** : un petit texte d'aide à côté du bouton, plutôt qu'une vraie fonction à développer : *« Pas envie de tout retaper ? Prends la carte en photo, utilise Google Lens (Android) ou Texte en direct (iPhone) pour copier le texte reconnu, puis colle-le ici. »* **Important pour le programmeur** : l'app n'intègre **aucun moteur de reconnaissance de texte (OCR) elle-même** — ce serait une bibliothèque lourde, ou un service payant, pour un résultat pas forcément meilleur que ce que le téléphone sait déjà faire tout seul, gratuitement et hors ligne. L'app se contente de guider vers cette fonction déjà présente sur le téléphone, puis récupère le texte collé normalement par l'étape 1. Aucune intégration caméra, aucune dépendance d'image à prévoir.

**Décision par défaut** : l'ajout en lot cible toujours **une catégorie à la fois** (celle depuis laquelle le bouton est ouvert) plutôt que de deviner des catégories depuis le texte collé — plus simple à vérifier, et cohérent avec le fait qu'une carte de bar se construit déjà catégorie par catégorie.

---

## 7. Plan de correction recommandé

1. **Immédiat** : A-02 (toasts), A-01 (thèmes/contraste), A-06 (panier ↔ menu), A-08 (stockage + ErrorBoundary), A-03 (mode d'affichage), A-09 (tri).
2. **Fiabilité PWA et Netlify** : A-28 (priorité), A-30 (boutons d'installation) (réécriture `/app`, commande de build), A-05, A-16, A-24 (`start_url`, favicon, icônes), A-27 (installation iPhone).
3. **Ergonomie mobile** : A-07, A-11, A-12, A-13, A-15.
4. **Accessibilité** : A-10, A-21, A-18.
5. **Données et évolutions** : A-04 (fusion des mises à jour de la carte + export), A-29 (multi-bars), recommander une tournée, A-17, A-22 ; puis vue Ticket et cases à cocher (optionnelles).
6. **Architecture et performance** : A-32 (étapes 1 à 5, au fil des évolutions) ; A-33 (mesurer d'abord, puis actions ciblées).
6 bis. **Compléments (second plan de l'ami)** : A-34 (suppression d'une commande de l'historique), A-35 (couleurs CMJN à trancher avec le club, `ThemeToggle`, `EditDrinkModal`, arbitrage `InstallBanner`).
7. **Nettoyage** : A-19, A-20, A-23, A-25, A-26 (suppression du code mort dont les fichiers « amis »).
8. **Validation** : lint/tests, puis recette manuelle sur au moins 2 téléphones Android (petit et grand écran), portrait/paysage, 3 thèmes, hors ligne, mise à jour de version, TalkBack.
9. **Nouvelles fonctionnalités** (après les corrections ci-dessus) : dans l'ordre suggéré — E-6 (unifier les suppressions, referme plusieurs bugs existants) → E-3 (recherche, isolé et simple, sa fonction de normalisation sert aussi à E-10) → E-10 (alerte doublon, réutilise E-3) → E-5 (tri par défaut, dépend d'A-03/A-17 déjà prévus) → E-7 (note libre, isolé) → E-8 (recommander la tournée) → E-4 (vue Ticket) → E-9 (verrouillage, dépend de E-4) → E-11 (ajout en lot, utile dès la création des premières cartes) → E-1 (récapitulatif/partage, dont la logique de répartition/arrondi est réutilisée par E-2) → A-29 (multi-bars, dont le moteur de fusion réutilise celui d'A-04 — à construire une seule fois pour les deux) → E-2 (cagnotte, la plus structurante, toutes les décisions sont actées dans la fiche).

## 8. Checklist de recette

- [ ] 3 thèmes : aucun texte illisible (contraste ≥ 4,5:1), titre visible
- [ ] Ajout/suppression/quantité : retour visuel + notification cohérente, dans les 3 vues
- [ ] Modifier/supprimer une boisson : le panier se met à jour
- [ ] Rechargement : vue, thème, son et tri conservés
- [ ] `localStorage` corrompu : l'app démarre avec les valeurs par défaut
- [ ] Panier mobile : le bas de la liste n'est jamais masqué ; Échap/retour ferme le panneau
- [ ] Partage : feuille native Android, un seul message ; chaque option donne un retour visible
- [ ] Vider le panier : confirmation ; suppression d'une ligne : annulation possible
- [ ] Hors ligne : recharger `/app` en mode avion ouvre l'application
- [ ] Hors ligne : `/` et `/app` s'ouvrent ; mise à jour de version claire
- [ ] Netlify : recharger `/app` directement ne donne pas de 404
- [ ] Installation possible dans Chrome (bandeau ET bouton de la landing) ; via le menu dans Firefox ; « Ajouter à l'écran d'accueil » sur iPhone ; aucun bouton d'installation une fois l'app installée
- [ ] Navigation privée : aucune installation attendue (comportement normal)
- [ ] Fenêtres de modification : croix, Échap, retour Android, Annuler et Enregistrer fonctionnent
- [ ] iPhone : installation guidée, données conservées après plusieurs jours, zone de sécurité respectée
- [ ] Multi-bars : changement de bar, panier, historique, export/import
- [ ] Mise à jour de la carte de base : prix non modifiés mis à jour, prix modifiés conservés, nouveautés ajoutées, suppressions respectées
- [ ] Clavier et TalkBack : parcours complet possible
- [ ] Performance : poids transféré (Brotli/gzip) et Lighthouse mobile mesurés avant/après ; aucune régression hors ligne
- [ ] Suppression d'une boisson (depuis sa fenêtre de modification, seul chemin désormais) : le texte annonce bien une boisson, jamais une catégorie
- [ ] Partage : le message envoyé contient réellement le contenu du panier, pas « Aucune commande à partager »
- [ ] Panier : supprimer des lignes jusqu'à vider une page de pagination ne laisse pas d'affichage incohérent
- [ ] Un seul `InstallBanner` visible sur `/app`, pas deux
- [ ] Rechargement/navigation : le tri choisi est conservé, pas seulement la vue
- [ ] Non-régression (base validée par un testeur, à ne pas casser) : totaux corrects, pas de double-incrément, boutons +/− fiables, tri par prix correct sur toute la liste, icônes PWA toutes en 200
- [ ] Rotation d'écran et split-screen : mise en page correcte

---

## 9. Index des fichiers → problèmes

Pour retrouver d'un coup d'œil tout ce qui touche un fichier donné (les fichiers « à créer » n'apparaissent pas). Préfixe `A-` = bug/audit, `E-` = nouvelle fonctionnalité.

| Fichier | Points concernés |
|---|---|
| `BulkAddDrinksModal.jsx` | E-11 |
| `CagnotteModal.jsx` | E-2 |
| `Header.jsx` | E-2 |
| `MenuSearch.jsx` | E-3 |
| `TicketView.jsx` | E-4, E-7 |
| `craco.config.js` | A-33 |
| `package.json` | A-02, A-05, A-25, A-28, A-33 |
| `public/icons/` | A-24, A-27 |
| `public/index.html` | A-07, A-19, A-24, A-26, A-27 |
| `public/manifest.json` | A-19, A-24, A-26, A-27 |
| `public/offline.html` | A-05 |
| `public/service-worker.js` | A-05 |
| `src/App.css` | A-01, A-25, E-2, E-4 |
| `src/App.js` | A-02, A-03, A-04, A-06, A-07, A-08, A-09, A-13, A-15, A-17, A-19, A-22, A-23, A-24, A-26, A-29, A-32, A-33, A-34 |
| `src/components/AddDrinkModal.jsx` | A-25 |
| `src/components/AddFriendModal.jsx` | A-25 |
| `src/components/CategorySection.jsx` | A-03, A-09, A-12, A-19, A-32, E-3 |
| `src/components/ConfirmOrderModal.jsx` | A-26, A-29, E-2, E-7, E-8 |
| `src/components/DeleteConfirmDialog.jsx` | A-01, A-13, A-36, E-6 |
| `src/components/DrinkCard.jsx` | A-03, A-10, A-12, A-17, A-18, A-20, A-21, A-26, A-32 |
| `src/components/DrinkOrderApp.jsx` | A-36, E-1, E-3, E-4, E-5, E-6, E-7, E-8 |
| `src/components/EditCategoryModal.jsx` | A-01, A-21, A-23, A-29, A-31, E-11 |
| `src/components/EditDrinkModal.jsx` | A-01, A-21, A-23, A-31, A-35, A-36, E-10, E-6 |
| `src/components/FriendSelector.jsx` | A-25 |
| `src/components/Header.jsx` | A-01, A-03, A-04, A-12, A-21, A-26, A-29, A-30, A-32, A-35 |
| `src/components/InstallBanner.jsx` | A-21, A-23, A-26, A-27, A-30, A-35 |
| `src/components/InstallPrompt.jsx` | A-25 |
| `src/components/LandingPage.jsx` | A-01, A-16, A-26, A-27, A-30, A-32 |
| `src/components/OrderHistory.jsx` | A-14, A-17, A-21, A-22, A-29, A-34, E-1, E-6, E-7, E-8 |
| `src/components/OrderSummary.jsx` | A-01, A-06, A-07, A-11, A-13, A-14, A-15, A-18, A-21, A-26, A-29, A-32, A-37, A-38, E-6 |
| `src/components/ShareButtons.jsx` | A-02, A-14, A-26, A-29, A-37, E-7 |
| `src/components/SortControls.jsx` | A-09, E-5 |
| `src/components/ThemeToggle.jsx` | A-19, A-25, A-35 |
| `src/components/TicketView.jsx` | A-29, E-9 |
| `src/components/ui/*.jsx` | A-01 |
| `src/components/ui/badge.jsx` | A-21 |
| `src/components/ui/button.jsx` | A-12 |
| `src/components/ui/card.jsx` | A-21 |
| `src/components/ui/dialog.jsx` | A-11, A-31 |
| `src/components/ui/sheet.jsx` | A-11 |
| `src/components/ui/sonner.jsx` | A-02, A-19, A-25, A-33 |
| `src/components/ui/toast.jsx` | A-02 |
| `src/components/ui/toaster.jsx` | A-02 |
| `src/contexts/CagnotteContext.jsx` | E-2 |
| `src/contexts/ThemeContext.jsx` | A-01, A-19, A-35 |
| `src/hooks/use-toast.js` | A-02 |
| `src/hooks/usePWA.js` | A-27, A-30 |
| `src/index.css` | A-01, A-07, A-12, A-18, A-19, A-31, A-32, A-35 |
| `src/index.js` | A-05, A-08, A-16, A-19, A-30, A-33 |
| `src/lib/parseDrinkList.js` | E-11 |
| `src/lib/search.js` | E-10 |
| `src/mock.js` | A-04, A-17, A-22, A-26, A-29 |
| `src/serviceWorkerRegistration.js` | A-05, A-16 |
| `src/utils/id.js` | A-04, A-29 |
| `tailwind.config.js` | A-01, A-33 |
| `workbox-config.js` | A-05, A-16, A-28 |
