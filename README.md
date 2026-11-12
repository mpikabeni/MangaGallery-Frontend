# Manga Gallery FR — Mini App Telegram

Un projet **Nexa** · canal : **@Nexa_CG** · version **Finale** · langues : **Français / English** · **6 thèmes** + Auto

## Deux espaces
- **Galerie** : manga, webtoon et bande dessinée (Accueil / Explorer, filtre par type).
- **La Sainte Culture** (18+) : webtoons et bandes dessinées pour adultes. Bannière sur l'accueil, écran de confirmation
  « J'ai 18 ans ou plus » (enregistré côté serveur), puis liste filtrable (Webtoon / Bande dessinée). Réglages → *Espace adulte*
  permet de la verrouiller à nouveau. Le contenu est réellement protégé par le serveur, pas seulement masqué.

## Publier (administrateur)
Réglages → ligne **Version** → appuyer **5 fois** → panneau admin.
- **Mangas** : deux onglets, *Galerie* et *La Sainte Culture · 18+*. « Publier un titre » choisit l'espace, le type, la couverture (lien https)…
  La Sainte Culture n'accepte que webtoon et bande dessinée.
- **Chapitres** : choisir le titre, le numéro, puis coller les liens d'images des pages (un par ligne).

## Ouverture
L'application s'ouvre **uniquement dans Telegram** (bot → « Ouvrir Manga Gallery FR »). Hors Telegram, une page d'accueil renvoie vers le bot.
Si le serveur Render dort, l'app réessaie seule et affiche « Le serveur se réveille… ».

## Déploiement (Netlify — site statique)
1. `js/config.js` contient l'URL du backend (`apiUrl`) : à changer uniquement si le backend déménage.
2. Publier ce dossier tel quel (`_headers` ajoute les en-têtes de sécurité).
3. @BotFather → ton bot → *Menu Button* → URL du site (le backend le configure aussi tout seul au démarrage).
4. Côté backend : `CORS_ORIGINS=https://ton-site`.

## Structure
```
index.html          application (une page, routage #/…)
js/config.js        URL du backend, version
js/i18n.js          traductions FR/EN
js/api.js           client API (auth Telegram, réessais, réveil du serveur)
js/views.js         accueil, explorer, La Sainte Culture, manga, bibliothèque, notifications, réglages
js/reader.js        lecteur (vertical / page par page)
js/app.js           démarrage, porte du canal, routeur
admin/              panneau d'administration
```
