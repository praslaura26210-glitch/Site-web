# Bibliothèque

Site privé pour ranger livres, articles, projets, sites et vidéos : une fiche par référence, une recherche qui ignore accents et majuscules et comprend les synonymes, des liens entre fiches. Il s'installe sur le téléphone comme une appli.

Ce dossier est **indépendant du portfolio** : il a son propre site Netlify.

## Mettre en ligne (une seule fois)

1. Sur [app.netlify.com](https://app.netlify.com) : **Add new site → Import an existing project → GitHub**, puis choisir le dépôt `site-web`.
2. Réglages de construction :
   - **Branch to deploy** : la branche où se trouve ce dossier (`main` une fois la branche fusionnée).
   - **Base directory** : `bibliotheque`
   - Le reste (commande, dossier publié, fonctions) est lu dans `netlify.toml` : ne rien changer.
3. Avant le premier déploiement, dans **Environment variables**, ajouter :
   - `MOT_DE_PASSE` : le mot de passe pour entrer (long, une phrase par exemple).
4. Déployer. Renommer ensuite le site (Site configuration → Change site name), par exemple `bibliotheque-laura`.

Les fiches et les photos sont stockées dans **Netlify Blobs**, inclus dans le compte Netlify : il n'y a pas d'autre service à créer.

Au premier lancement, la bibliothèque contient les 15 références du rapport d'études. On peut les modifier ou les supprimer comme les autres.

## Sur le téléphone

- iPhone : ouvrir le site dans Safari → Partager → « Sur l'écran d'accueil ».
- Android : menu de Chrome → « Installer l'application ». Le menu « Partager » d'Android propose ensuite « Bibliothèque » : un lien partagé ouvre une nouvelle fiche préremplie.

La dernière version consultée reste lisible sans réseau. Les modifications demandent une connexion.

## Sauvegarde

Réglages → **Tout exporter (.zip)** : un fichier `bibliotheque.json` et toutes les images. À faire de temps en temps.

## Changer le mot de passe

Modifier `MOT_DE_PASSE` dans Netlify puis redéployer : tous les appareils sont déconnectés.

## Travailler sur l'ordinateur

```
npm install
npm run dev       # site sur http://localhost:5173, mot de passe « test »
npm run local     # version construite, sur http://localhost:8788
```

Les données locales sont dans `.local/` (ignoré par git), séparées de celles en ligne.

## Organisation

- `src/` : l'interface (React). `src/vocabulaire.ts` : mots-clés et synonymes de départ.
- `serveur/` : la fonction `/api` (connexion, fiches, images, ISBN, aperçu des pages web).
- `depart/depart.json` : les références du rapport d'études, chargées au premier lancement.
