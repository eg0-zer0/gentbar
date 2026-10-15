# Conception — Multi-bars et Mode Soirée

*Version du 15/10/2026. Base : `main` au commit `7b69713`. Complète les fiches `A-29`, `E-1`, `E-2` et `E-11` de l'audit ; en cas de contradiction, **ce document prime**.*

---

## 1. En bref

- **Multi-bars** : l'application gère plusieurs cartes de prix (« bars »). La carte du club de hockey reste la carte de base, restaurable. On crée, copie, importe et partage des cartes. Tant qu'il n'y a qu'un bar, l'écran actuel ne change pas.
- **Mode Soirée** : un mode à part entière, à côté de l'expérience classique. Une soirée regroupe plusieurs tournées, avec en option une cagnotte (solde, alerte, réapprovisionnement, restitution). Elle se termine par un résumé et un partage équitable.
- **Expérience classique** : inchangée. Elle reste la « commande rapide » pour une tournée isolée.
- Les deux modes partagent le même moteur de commande (menu, panier, ticket, recommander, note). Seul l'habillage et les règles autour changent.

## 2. Principes directeurs

1. **Pas de serveur, pas de compte** : tout reste dans l'appareil (comme aujourd'hui). Le partage se fait par lien, QR code ou fichier.
2. **Ne jamais perdre de données** : toute opération destructive (migration, fusion, mise à jour de la carte de base, remise à zéro) commence par une sauvegarde.
3. **Un moteur, deux habillages** : pas de seconde application. Le mode Soirée réutilise l'écran de commande existant.
4. **Simple par défaut** : un utilisateur qui n'ouvre jamais « Mes bars » ni « Soirée » ne voit aucun changement.
5. **Montants en centimes entiers** dans tout ce qui touche à la cagnotte et au partage (pas de calcul en nombres décimaux).

## 3. Les deux expériences côte à côte

| | **Classique** (`/app`) | **Soirée** (`/soiree`) |
|---|---|---|
| Usage | Une tournée isolée, rapide | Toute une soirée, plusieurs tournées |
| Point de départ | Le menu | Un tableau de bord |
| Commandes | Historique global | Regroupées dans la soirée |
| Argent | Total de la commande | Cagnotte, solde, alerte, restitution |
| Fin | Aucune | « Terminer la soirée » : résumé et partage |
| Ticket, Recommander, Note, Verrouillage | Oui | Oui (mêmes composants) |

---

## 4. Multi-bars

### 4.1 Vocabulaire

- **Bar** = une carte de prix complète (nom, icône, catégories, boissons).
- **Bar actif** = celui dont le menu est affiché.
- **Carte de base** = la carte du Royal La Louvière Hockey Club livrée avec l'application.
- **Carte liée** = un bar qui retient l'identifiant (`sourceId`) de la carte dont il vient, pour se mettre à jour ensuite.

### 4.2 Présentation

**Le bar actif dans l'en-tête.** Un petit bouton sous le titre affiche le bar actif. Il n'apparaît que lorsqu'il existe au moins deux bars ; avant cela, l'accès se fait par « Mes bars » dans le menu ☰.

```
┌──────────────────────────────────┐
│ 🍹 GentBar                     ☰ │
│ [🏒 Club de hockey ▾]            │
├──────────────────────────────────┤
│  Bières au fût …                 │
```

**Choisir un bar** (feuille qui monte du bas) :

```
┌──────────────────────────────────┐
│ Choisir un bar                 ✕ │
│ ✓ 🏒 Club de hockey   102 boiss. │
│   🍻 Chez Mimi          38 boiss.│
│   ☕ Buvette du stade   24 boiss.│
│ ──────────────────────────────── │
│ [ ＋ Ajouter un bar ]            │
│ [ Gérer mes bars ]               │
└──────────────────────────────────┘
```

**Changer de bar avec un panier non vide** : fenêtre à trois choix — « Ajouter ce bar à la commande en cours » (commande sur deux bars, § 4.7), « Vider le panier et changer », « Annuler ».

**Mes bars** (route `/bars`) :

```
┌──────────────────────────────────┐
│ ← Mes bars                       │
│ ┌──────────────────────────────┐ │
│ │ 🏒 Club de hockey  carte de base│
│ │ 102 boissons · utilisé aujourd'hui│
│ │ [Utiliser] [Partager]      ⋯ │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 🍻 Chez Mimi                 │ │
│ │ 38 boissons · reçue d'un lien │ │
│ │ [Utiliser] [Partager]      ⋯ │ │
│ └──────────────────────────────┘ │
│ [ ＋ Ajouter un bar ]            │
└──────────────────────────────────┘
```

Le menu `⋯` de chaque bar : Renommer · Dupliquer · Mettre à jour (si carte liée) · Restaurer la carte de base (carte de base seulement) · Supprimer (jamais pour la carte de base).

### 4.3 Ajouter un bar : quatre chemins

```
Ajouter un bar
┌──────────────┐  ┌──────────────┐
│ ✏️ Carte vide │  │ 📋 Copier une │
│              │  │ carte        │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│ 📝 Coller une │  │ 📲 Recevoir   │
│ liste / photo│  │ lien, QR…    │
└──────────────┘  └──────────────┘
```

1. **Carte vide** : nom et icône, puis menu vide avec un message d'aide (« Ajoute une catégorie ou colle une liste »).
2. **Copier une carte** : on choisit le bar à copier ; la copie devient indépendante (nouveau `sourceId`).
3. **Coller une liste / photo** : fonctionnalité `E-11` (une boisson par ligne, aperçu à corriger, astuce de reconnaissance de texte du téléphone).
4. **Recevoir** : coller un lien, ouvrir un fichier, ou (via l'appareil photo du téléphone) scanner un QR code, ce qui ouvre le lien dans le navigateur.

### 4.4 Partage et réception (lien, QR, fichier)

**Partager** : l'écran affiche un QR code, un bouton « Partager » (feuille native), « Copier le lien » et « Exporter un fichier ».

**Format du lien** : `https://gentbar.netlify.app/recevoir#c=<données>`. Les données sont placées après le `#` : elles ne sont **jamais envoyées au serveur**. Contenu : version, nom, icône, `sourceId`, catégories, boissons avec prix **en centimes**, compressé (`deflate`) puis encodé en base64url. La compression se fait avec l'API native du navigateur (`CompressionStream`, disponible sur Android récent et iOS 16.4 et plus), sans bibliothèque.

**Taille mesurée sur la vraie carte** :

| Carte | Boissons | Lien |
|---|---|---|
| Carte complète du club | 102 | ≈ 1 700 caractères |
| Carte moyenne | ≈ 40 | ≈ 750 caractères |

Conséquence pour le QR code : jusqu'à environ 1 000 caractères il est confortable à scanner ; autour de 1 700 il devient très dense. Règle retenue : le QR est toujours proposé, accompagné d'un message « Carte volumineuse : préfère le lien ou le fichier » au-delà d'environ 1 000 caractères.

**Réception** (route `/recevoir`) : jamais d'ajout automatique.

```
┌──────────────────────────────────┐
│ Carte reçue                      │
│ 🍻 « La Taverne » · 38 boissons  │
│ Bières (12) · Softs (8) · Snacks…│
│ Ce bar ressemble à « Chez Mimi » │
│ (14 boissons en commun)          │
│ [ Ajouter comme nouveau bar ]    │
│ [ Fusionner avec… ▾ ]            │
│ [ Annuler ]                      │
└──────────────────────────────────┘
```

- Même `sourceId` déjà connu → fusion directe avec le bar lié, sans question (le nom local ne change pas).
- Sinon → choix explicite ; la suggestion « ressemble à » repose sur le nombre de noms de boissons identiques, et reste une aide, jamais une décision.
- Après une première fusion manuelle, le bar retient le `sourceId` : les partages suivants se fusionnent seuls.

**Sécurité à l'import** : limites (≤ 40 catégories, ≤ 400 boissons, noms ≤ 60 caractères, prix entier entre 0 et 100 000 centimes, icône ≤ 2 caractères), caractères de contrôle supprimés, aucun contenu affiché sans échappement.

**Sur iPhone** : un lien ouvert dans Safari utilise un stockage séparé de l'application installée. L'écran « Recevoir » propose donc aussi « Coller un lien » et « Ouvrir un fichier » depuis l'application installée.

### 4.5 Moteur de fusion (un seul, pour deux usages)

Une fonction unique, `mergeMenus(local, incoming)`, sert à la fois à **mettre à jour la carte de base** (remplace l'écrasement actuel par `MENU_VERSION`) et à **recevoir une carte**.

| Cas | Règle |
|---|---|
| Boisson ou catégorie **non modifiée** localement | reprend les valeurs reçues (nom, prix, icône) |
| Modifiée localement | **conservée** ; listée comme « conservée » dans le compte rendu |
| **Nouvelle** dans la carte reçue | ajoutée (sauf si l'utilisateur l'avait supprimée : on le mémorise) |
| Absente de la carte reçue | **jamais supprimée** automatiquement |

Appariement : par identifiant pour la carte de base ; par couple (catégorie, nom) normalisé (minuscules, sans accents) pour une carte venue d'un ami, dont les identifiants sont différents. Chaque boisson/catégorie porte un indicateur `modified`, posé par la fenêtre de modification. Le compte rendu (« 6 ajoutées · 4 mises à jour · 2 conservées ») s'affiche avant validation.

### 4.6 Commande sur deux bars

Action volontaire (§ 4.2). Chaque ligne du panier porte `barId` ; la clé d'une ligne devient `barId:drinkId`. Le panier, le ticket, l'historique et le texte partagé sont **groupés par bar**, avec un sous-total par bar et un total général.

```
Commande · 2 bars
── 🏒 Club de hockey ──────── 12,50 €
 2× Carlsberg 25cl
 1× Duvel
── 🍻 Chez Mimi ────────────── 6,00 €
 2× Mojito
Total ─────────────────────── 18,50 €
```

Un indicateur « Commande sur 2 bars » reste visible tant que la commande n'est pas confirmée ou vidée.

### 4.7 Données et migration

Nouvelles clés de stockage : `schemaVersion`, `menus`, `activeMenuId`. Forme d'un bar :

```json
{ "id": "rlhc", "sourceId": "gentbar-rlhc", "name": "Club de hockey", "icon": "🏒",
  "origin": "base", "baseVersion": 3, "createdAt": "…",
  "categories": [ { "id": "…", "name": "…", "icon": "🍺", "modified": false,
                    "drinks": [ { "id": "…", "name": "…", "price": 2.5, "modified": false } ] } ] }
```

**Migration (au premier lancement après mise à jour)** : lecture de l'ancienne clé `categories` → création du bar `rlhc` avec ces catégories ; marquage `modified: true` des boissons dont le nom ou le prix diffère de la carte de base ; ajout de `barId: 'rlhc'` aux lignes du panier et de l'historique existants ; **sauvegarde de l'ancien état** (`categories__backup`) ; ancienne clé conservée jusqu'à la version suivante. La migration est une fonction pure, testée.

---

## 5. Mode Soirée

### 5.1 Définition et cycle de vie

Une **soirée** est un conteneur de tournées. Cycle : **Préparation** (écran de démarrage) → **En cours** → **Clôture** (résumé) → **Archivée** (consultable). **Une seule soirée active à la fois.** Les participants sont comptés (un nombre), sans noms ni comptes.

### 5.2 Entrées dans le mode

- **Page d'accueil** : deux grands boutons, « Commande rapide » (classique) et « Mode soirée ».
- **Menu ☰** de l'application : « Mode soirée » (ou « Reprendre la soirée » si elle est active).
- **Bandeau dans l'expérience classique** quand une soirée est active :

```
🎉 Soirée en cours · cagnotte 15,70 €   [Reprendre]
```

Dans l'expérience classique, les commandes ne sont **pas** rattachées à la soirée ; le bandeau est un simple rappel.

### 5.3 Écrans

**Démarrer une soirée**

```
┌──────────────────────────────────┐
│ Démarrer une soirée            ✕ │
│ Nom        [Soirée du 14/10     ]│
│ Bar        [🏒 Club de hockey  ▾]│
│ Personnes  [ − ]  6  [ + ]       │
│ [✓] Utiliser une cagnotte        │
│   Mise par personne  [ 5,00 € ]  │
│   Solde de départ      30,00 €   │
│   Prévenir sous      [ 10,00 € ] │
│ [      Démarrer la soirée      ] │
└──────────────────────────────────┘
```

**Tableau de bord** (route `/soiree`) :

```
┌──────────────────────────────────┐
│ ← Soirée du 14/10            ⋯  │
│ 🏒 Club de hockey · 6 personnes  │
├──────────────────────────────────┤
│ CAGNOTTE                         │
│  15,70 €          ▓▓▓▓▓░░░░░ 52% │
│  alerte sous 10 €                │
│  [ ＋ Réapprovisionner ]         │
├──────────────────────────────────┤
│ [       ＋ Nouvelle tournée     ]│
├──────────────────────────────────┤
│ Tournées (3)         Total 24,40 €│
│ 21:42  8 art.   10,10 €  👛  [🎫]│
│ 21:05  6 art.    5,70 €  💰  [🎫]│
│ 20:30  7 art.    8,60 €  💰  [🎫]│
├──────────────────────────────────┤
│ [ Terminer la soirée ]           │
└──────────────────────────────────┘
```

`💰` = payée avec la cagnotte, `👛` = payée à part, `🎫` = ouvrir le ticket (avec « Recommander »).

**Alerte** : un bandeau persistant (pas une notification qui disparaît) :

```
⚠ La cagnotte passe sous 10 € (7,90 €)
   [ Réapprovisionner ]
```

**Nouvelle tournée** : ouvre l'écran de commande existant, en « contexte soirée » : rappel du solde en haut, et sur la fenêtre de confirmation une case « **Payée avec la cagnotte** », cochée par défaut. Après confirmation : écran de succès existant (ticket, recommander), avec un bouton « Retour à la soirée ».

**Clôture** :

```
┌──────────────────────────────────┐
│ Résumé de la soirée              │
│ Durée 3 h 10 · 5 tournées        │
│ Dépensé                 62,40 €  │
│   avec la cagnotte      52,40 €  │
│   à part                10,00 €  │
│ Par personne (6)        10,40 €  │
│ ──────────────────────────────── │
│ Cagnotte                         │
│   Mise de départ        30,00 €  │
│   + Réapprovisionnements 40,00 € │
│   − Dépenses            52,40 €  │
│   = Solde final         17,60 €  │
│ À rendre à chacun (6)    2,93 €  │
│   suggestion            2,90 €   │
│   reste à garder        0,20 €   │
│ [ Partager le résumé ] [Terminer]│
└──────────────────────────────────┘
```

Si le solde final est **négatif** (cagnotte dépassée), la ligne devient « **À compléter** » avec le montant par personne à remettre.

**Historique des soirées** : liste (date, nombre de tournées, total), ouverture du résumé, suppression.

### 5.4 Règles de la cagnotte

- **Seuil d'alerte** : montant fixe, choisi au démarrage.
- **Déduction** : case à cocher à chaque confirmation de tournée, cochée par défaut.
- **Réapprovisionner** : à tout moment (bouton du tableau de bord et du bandeau d'alerte), montant libre, horodaté.
- **Réinitialiser** : remet le solde au montant de départ et efface les mouvements, avec une confirmation ; différent de « Terminer », qui archive.
- **Restitution** en fin de soirée : solde final ÷ nombre de cagnotteurs.
- **Arrondis (précision apportée aux fiches E-1 et E-2)** : on ne distribue jamais plus d'argent qu'il n'en existe. Donc : **restitution arrondie vers le bas**, le reste est affiché (« reste à garder ») ; **collecte arrondie vers le haut**, pour ne jamais encaisser moins que le coût. Pas d'arrondi réglable par défaut : 0,10 €.
- Un solde négatif est autorisé et signalé ; il ne bloque jamais une commande.

### 5.5 Relations avec le reste de l'application

| Élément | Comportement |
|---|---|
| Ticket, verrouillage | identiques ; le ticket d'une tournée de soirée s'ouvre depuis le tableau de bord |
| Recommander | disponible depuis le ticket et le tableau de bord ; les lignes s'ajoutent au panier de la nouvelle tournée |
| Note libre | une note par tournée, comme aujourd'hui |
| Historique | une seule liste en base ; l'historique classique n'affiche que les commandes **hors soirée** ; les tournées d'une soirée se voient dans la soirée |
| Tri par popularité | calculé sur toutes les commandes du bar concerné |
| Recherche (E-3), doublon (E-10) | portent sur le menu du bar actif |
| Plusieurs bars | le bar de la soirée est celui du démarrage ; chaque tournée peut en changer ou mélanger deux bars (§ 4.6) ; la cagnotte n'est pas liée à un bar |

### 5.6 Données

Nouvelles clés : `sessions` (liste), `activeSessionId`. Forme :

```json
{ "id": "s-…", "name": "Soirée du 14/10", "status": "active", "barId": "rlhc",
  "participants": 6, "startedAt": "…", "endedAt": null,
  "pot": { "enabled": true, "perPersonCents": 500, "initialCents": 3000,
           "alertBelowCents": 1000,
           "movements": [ { "type": "topup", "cents": 4000, "at": "…" },
                          { "type": "spend", "cents": 860, "orderId": "…", "at": "…" } ] } }
```

Les commandes de l'historique reçoivent `sessionId` (absent en classique) et `paidFromPot` (booléen). Le solde est **recalculé** à partir des mouvements (jamais stocké seul), ce qui évite les incohérences.

### 5.7 Cas limites

- **Rechargement ou fermeture de l'application** en pleine soirée : tout est repris depuis le stockage.
- **Mise à jour de l'application** pendant une soirée : aucun rechargement automatique ; le message de mise à jour est différé après la soirée.
- **Bouton « réinitialiser » de l'écran d'erreur** : ne doit jamais effacer `sessions` ni `menus` (sauvegarde préalable).
- **Suppression d'un bar** utilisé par une soirée en cours : refusée avec explication.
- **Suppression d'une tournée** d'une soirée : permise depuis le tableau de bord, avec recalcul du solde.

### 5.8 Hors périmètre (pour plus tard)

Noms des participants et soldes individuels ; soirée partagée en direct entre plusieurs téléphones (demanderait un serveur) ; plusieurs soirées simultanées ; export des soirées.

---

## 6. Décisions par défaut — à valider ou corriger

1. Le bouton du bar actif n'apparaît qu'à partir de deux bars.
2. Soirée et classique ont des **historiques séparés** (mêmes données, deux vues).
3. **Une seule soirée active**, participants comptés sans noms.
4. Cagnotte **optionnelle** dans une soirée, solde négatif toléré (« À compléter »).
5. Restitution arrondie **vers le bas**, collecte **vers le haut**, pas de 0,10 €.
6. QR toujours proposé, avec un avertissement pour les grosses cartes ; lien et fichier en alternative.
7. **Une dépendance à autoriser** : une petite bibliothèque de génération de QR code (la compression est assurée sans dépendance par le navigateur).
8. Dans l'expérience classique, les commandes ne sont **pas** rattachées à une soirée active.

---

## 7. Découpage en étapes

Chaque ligne = une session de l'agent. Les fonctions pures (fusion, migration, partage, cagnotte) sont **testées** (outillage de test déjà présent dans `package.json`).

**9.6 Recherche + alerte de doublon** *(inchangé, avec une contrainte)* — les fonctions de `src/lib/search.js` prennent la liste des catégories **en paramètre** (aucune lecture directe de l'état global), pour fonctionner avec n'importe quel bar actif.

**9.7 Multi-bars**

| Étape | Contenu | Fichiers principaux | Critères d'acceptation |
|---|---|---|---|
| 9.7a | Préparation technique : extraire de `DrinkOrderApp.jsx` (505 lignes) les états en hooks (`useCart`, `useMenus`, `useOrderHistory`) | `DrinkOrderApp.jsx`, nouveaux `src/hooks/*` | aucun changement visible ; build OK ; parcours complet identique |
| 9.7b | Modèle multi-bars et migration, un seul bar visible | `src/lib/storage.js`, `src/lib/menus.js` (nouveau), `DrinkOrderApp.jsx`, `src/mock.js` | migration testée avec données anciennes ; sauvegarde créée ; aucune perte |
| 9.7c | Moteur de fusion `mergeMenus` + remplacement de `MENU_VERSION` | `src/lib/menuMerge.js` (nouveau), `DrinkOrderApp.jsx` | tests des 4 règles ; prix modifiés par l'utilisateur conservés ; compte rendu affiché |
| 9.7d | Bouton du bar actif, « Mes bars », ajout (vide/copie), renommer, dupliquer, supprimer, restaurer | `Header.jsx`, nouveaux `BarSelector.jsx`, `MyBarsScreen.jsx`, `App.jsx` (route `/bars`) | changement de bar avec panier non vide géré ; carte de base non supprimable |
| 9.7e | Partage et réception : lien, QR, fichier ; route `/recevoir` ; validation ; aperçu et fusion | nouveaux `ShareBarModal.jsx`, `ReceiveBarPage.jsx`, `src/lib/barShare.js`, `App.jsx` | aller-retour lien et fichier testés ; limites de sécurité vérifiées ; `sourceId` retenu |
| 9.7f | Commande sur deux bars (`barId` par ligne) | `OrderSummary.jsx`, `TicketView.jsx`, `OrderHistory.jsx`, `ShareButtons.jsx`, `ConfirmOrderModal.jsx`, `src/lib/reorder.js` | regroupement par bar partout ; Recommander gère un bar supprimé |

**9.8 Ajout en lot (E-11)** — branché sur la tuile « Coller une liste » de « Ajouter un bar » et sur chaque catégorie. Fichiers : nouveaux `BulkAddDrinksModal.jsx`, `src/lib/parseDrinkList.js`.

**9.9 Mode Soirée** *(absorbe E-2 et la partie principale de E-1)*

| Étape | Contenu | Fichiers principaux | Critères d'acceptation |
|---|---|---|---|
| 9.9a | Socle invisible : `money.js` (centimes), `split.js` (arrondis), `SessionContext`, clés `sessions` / `activeSessionId`, `sessionId` sur les commandes | nouveaux `src/lib/money.js`, `src/lib/split.js`, `src/contexts/SessionContext.jsx`, `storage.js` | tests de calcul (cas du résumé du § 5.3 reproduit au centime) |
| 9.9b | Parcours sans cagnotte : accueil à deux boutons, bandeau, démarrer, tableau de bord, nouvelle tournée, liste des tournées, terminer (résumé simple), historique des soirées | `LandingPage.jsx`, `App.jsx` (routes `/soiree`…), `Header.jsx`, nouveaux écrans, `DrinkOrderApp.jsx` | une soirée complète de bout en bout ; reprise après rechargement |
| 9.9c | Cagnotte : création au démarrage, case dans la confirmation, jauge et alerte persistante, réapprovisionnement, réinitialisation | `CagnotteModal.jsx`, `ConfirmOrderModal.jsx`, tableau de bord | solde exact après chaque action ; alerte au franchissement du seuil |
| 9.9d | Clôture complète : résumé, restitution, solde négatif, partage du résumé | `SessionSummary.jsx`, `ShareButtons.jsx` | chiffres du § 5.3 retrouvés ; partage contenant le vrai résumé |

**9.10 Récapitulatif classique (reste de E-1)** — sélection de tickets dans l'historique classique avec `split.js` ; optionnel une fois le mode Soirée en place.

## 8. À coller dans `AGENTS.md` (Décisions déjà prises)

- **Multi-bars** : un bar = `{id, sourceId, name, icon, origin, categories}` ; clés `menus` et `activeMenuId` ; migration avec sauvegarde ; fusion unique `mergeMenus` ; aucune suppression silencieuse.
- **Montants** : en centimes entiers pour la cagnotte et les partages. Restitution arrondie vers le bas, collecte vers le haut, pas de 0,10 €.
- **Mode Soirée** : une soirée active à la fois ; commandes rattachées par `sessionId` ; solde recalculé depuis les mouvements ; aucun rechargement automatique pendant une soirée ; l'écran d'erreur ne doit jamais effacer `menus` ni `sessions`.
- **Partage de carte** : lien avec données après `#`, validation stricte à l'import, jamais d'ajout automatique.

## 9. À coller dans `PROGRESS.md` (remplace les lignes 9.6 à 9.10)

```markdown
- [x] 9.6 E-3 Recherche + E-10 Alerte de doublon (fonctions prenant les catégories en paramètre)
- [ ] 9.7a Extraction des états de DrinkOrderApp en hooks (sans changement visible)
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
```
