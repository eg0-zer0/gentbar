# Instructions permanentes — GentBar Order App

PWA React (CRA + CRACO, Tailwind, composants Radix/shadcn), interface en français.
La branche `main` est déployée automatiquement sur Netlify à chaque push : c'est la version utilisée en vrai par des amis.

## Documents de référence

- `docs/FEUILLE_DE_ROUTE_Developpeur.md` : fait foi pour **quoi faire et dans quel ordre** (étapes 1 à 9).
- `docs/AUDIT_GentBar_Order_App.md` : détail de chaque point (`A-xx` = bug, `E-xx` = fonctionnalité). **Fichier très long : ne pas le lire en entier.** Chercher seulement les sections des points de l'étape en cours (ex. `grep -n "### A-06" docs/AUDIT_GentBar_Order_App.md`, puis lire cette section).
- `PROGRESS.md` : état d'avancement. **À lire en premier à chaque session**, à mettre à jour après chaque sous-tâche terminée (pas seulement à la fin).

## Règles de travail

1. Travailler uniquement sur la branche `roadmap`. Ne jamais commiter ni pousser sur `main`.
2. **Une seule étape à la fois**, dans l'ordre. À la fin d'une étape : build, vérification, commit (`Étape N — titre`), mise à jour de `PROGRESS.md`, compte rendu, puis **s'arrêter**. Ne pas enchaîner sur l'étape suivante sans demande.
3. Commiter aussi après chaque sous-tâche terminée (`WIP Étape N — sous-tâche`), pour qu'une interruption ne perde rien.
4. L'étape 9 (nouvelles fonctionnalités) ne se fait que sur demande explicite, une fonctionnalité à la fois.
5. Avant de modifier : **vérifier dans le code actuel que le problème existe encore** (les numéros de ligne de l'audit peuvent avoir bougé). S'il est déjà corrigé, le noter dans `PROGRESS.md` (statut « déjà corrigé ») et passer au suivant.
6. Se limiter aux fichiers listés pour l'étape. Tout autre fichier modifié doit être justifié dans `PROGRESS.md`. Pas de refactorisation opportuniste.
7. Aucune nouvelle dépendance sans demander. Textes d'interface en français.
8. Ne pas toucher à `src/mock.js` avant l'étape 8.
9. Ne pas régresser sur : totaux de commande, boutons +/− du panier, tri par prix, persistance du panier, mode hors ligne.
10. Si un choix produit n'est tranché ni ci-dessous ni dans les documents : **poser la question** plutôt que deviner.

## Décisions déjà prises

- **Notifications (A-02)** : utiliser Sonner partout (`import { toast } from 'sonner'`), supprimer le store maison `use-toast`. Un seul `<Toaster />` à la racine, dont le thème suit `ThemeContext` (pas `next-themes`). Pas de notification à chaque ajout d'une boisson au panier.
- **Thèmes (A-01)** : conserver le système à classes (`html.dark`, `html.gentbar`). Faire suivre les jetons Tailwind (`bg-card`, `text-foreground`…) en ciblant ces classes dans `src/index.css` à la place de `[data-theme="…"]`. Vérifier visuellement le contraste (≥ 4,5:1 pour le texte) dans les 3 thèmes, sur tous les écrans, y compris le récapitulatif de commande et les fenêtres.
- **Commande « par ami »** : abandonnée (ne rien développer dans ce sens).
- **Son à l'ajout** : désactivé par défaut.
- **Gestionnaire de paquets** : celui déclaré dans `package.json` (yarn) ; n'en changer qu'à l'étape 7.

## Définition de « terminé » pour une étape

- Le build passe (`yarn build`) sans nouvel avertissement ESLint.
- Chaque point de l'étape a un statut avec preuve (voir format ci-dessous).
- `PROGRESS.md` est à jour, le commit est fait.

## Format du compte rendu de fin d'étape

Un tableau, une ligne par point de l'étape :

| Point | Statut | Fichiers modifiés | Preuve |
|---|---|---|---|
| A-xx | ✅ fait / ⚠️ partiel / ❌ non fait / ⏭️ déjà corrigé | … | ligne de code précise, ou commande exécutée et son résultat |

Un statut ✅ sans preuve concrète n'est pas accepté. Si quelque chose n'a pas pu être vérifié (ex. test sur téléphone), l'écrire explicitement dans « À tester par moi sur appareil ».
