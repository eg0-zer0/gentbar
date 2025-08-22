# Application de Gestion de Commandes de Boissons

## Présentation générale

Cette application permet de gérer facilement les commandes de boissons en temps réel. Elle offre une interface responsive adaptée aux différents types d’écrans (mobile, tablette, desktop) avec plusieurs modes d’affichage (large, compact, minimal).

---

## Structure du projet

- **`DrinkOrderApp`** : composant principal, gère l’état global, affichage des catégories, boissons, panier, modals et historique.
- **`CategorySection`** : affiche une catégorie et sa liste de boissons.
- **`DrinkCard`** : carte affichant une boisson, avec actions d’ajout, modification et suppression.
- **`OrderSummary`** : résumé du panier, modification des quantités, validation de la commande.
- **`ConfirmOrderModal`** : modal de confirmation de commande.
- Modals complémentaires pour l’édition et suppression (`EditDrinkModal`, `EditCategoryModal`, `DeleteConfirmDialog`).
- **`OrderHistory`** : consultation des commandes passées.
- Composants UI secondaires : `Header`, `SortControls`, `InstallBanner`, `ShareButtons`, etc.

---

## Fonctionnalités principales

- Gestion complète et dynamique des catégories et boissons.
- Ajout, mise à jour, suppression des commandes dans le panier.
- Tri des boissons par popularité, prix, nom.
- Trois modes d’affichage adaptatifs (large, compact, minimal) pour optimiser la visibilité des produits selon le terminal.
- Modal de confirmation avec récapitulatif des articles.
- Historique consultable des commandes passées.
- Notifications toast et retours sonores.
- Partage simplifié des commandes.

---

## Technologies utilisées

- **React** avec hooks et Context API.
- **Tailwind CSS** pour la gestion des styles, thèmes clair/sombre, et responsivité.
- **CSS variables** pour la cohérence des couleurs sur différents thèmes.
- **Progressive Web App (PWA)** avec Workbox pour la mise en cache, fonctionnement hors-ligne et installation.
- **Service Worker** personnalisé pour la gestion des ressources.
- **LocalStorage** pour persistance des données utilisateur.
- **Lucide** pour les icônes vectorielles.
- **Netlify** pour le déploiement continu via un dépôt GitHub.

---

## Déploiement

- Le projet est lié à un dépôt GitHub configuré avec Netlify.
- Chaque push déclenche une compilation (`npm run build`) et une mise en ligne automatique.
- Recommandé d’utiliser les environnements de développement et production distincts.

---

## Prochaines étapes et améliorations

- Affiner les vues compacte et minimal pour augmenter la densité de produits affichés et améliorer la ergonomie.
- Effectuer des tests approfondis du PWA, vérifier l’efficacité du service worker en environnement local et production.
- Optimiser le panier flottant avec une bonne intégration des modals pour éviter chevauchements ou confusions.
- Ajouter des tests automatisés unitaires et E2E pour sécuriser les fonctionnalités clés.
- Envisager de nouvelles fonctionnalités avancées (ex : multi-utilisateur, synchronisation cloud).

---

## Informations complémentaires

- L’application est conçue mobile-first pour une expérience fluide.
- Le code est organisé pour faciliter la maintenance et l’extension.
- Le design est cohérent grâce à Tailwind et CSS variables avec prise en charge multi-thème.
- Documentation complémentaire en commentaires dans les composants.
- L’application respecte les bonnes pratiques d’accessibilité et ergonomie.

---

## Installation locale

1. Cloner le dépôt  
2. Installer les dépendances : `npm install`  
3. Lancer le serveur de développement : `npm start`  
4. Pour générer le build production : `npm run build-pwa`  
5. Déployer via Netlify ou autre plateforme capable d’héberger des apps React (SPA).

## Build et déploiement
- Le dossier `build/` contient le site statique prêt à être servi.
- **Déploiement Netlify (dépôt GitHub lié avec Netlify) :**  
  - Pusher sur la branche principale déclenche automatiquement la compilation et publication.
  - Pour lancer manuellement le déploiement :
    ```
    git add .
    git commit -m "Update code and fix bugs"
    git push origin main
    ```
  - Netlify détectera le push et déploiera automatiquement la nouvelle version.

---

Pour toute question ou contribution, merci de contacter l’équipe de développement ou ouvrir une issue sur GitHub.

---
