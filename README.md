# Nexa Manga — Mini App Telegram

Un projet **Nexa** · canal : **@Nexa_CG** · version **V2.05** · langues : **Français / English** · **6 thèmes** + Auto

## Ouvrir en local / hors Telegram
- **Double-clic sur `index.html`** (ou `?demo=1`) : l'app s'ouvre directement en **mode aperçu** avec des données fictives (bandeau orange « APERÇU DÉMO »). Rien n'est envoyé nulle part.
- **Sur le site Netlify, dans un navigateur normal** : écran d'accueil avec « Ouvrir dans Telegram », « Rejoindre @Nexa_CG » et « Voir l'aperçu du design ».
- **Dans Telegram** : l'application réelle (connexion vérifiée + canal obligatoire).

## Ce que fait l'application
- Ouverture **uniquement dans Telegram**. La session est vérifiée par le backend (signature `initData`).
- **Porte du canal** : tant que l'utilisateur n'a pas rejoint `@Nexa_CG`, il voit l'écran « Rejoins d'abord le canal Nexa » (boutons *Rejoindre* / *J'ai rejoint*). Le bot (`backend/bot.py`) applique la même règle avant même d'afficher le bouton de la mini app.
- **Tout vient du backend** : mangas, chapitres, commentaires, notifications, **et aussi** favoris, reprise de lecture et préférences (langue, thème, mode de lecteur), synchronisés entre appareils.
- Design « aurore » : splash animé (logo d'origine + *From Nexa*), carrousel automatique avec parallaxe, cartes 3D, barre de navigation flottante, ondulations au toucher, explosion de cœurs, confettis, compteurs animés, tirer pour rafraîchir, transitions de thème circulaires.
- Lecteur : défilement vertical ou page par page (glisser, appuyer sur les bords, double appui pour zoomer), curseur de pages, barres qui se cachent.
- Serveur Render endormi : l'app réessaie toute seule et affiche « Le serveur se réveille… ».
- **Langue** : Auto / Français / English (Réglages). **Thèmes** : Auto, Nexa, Clair, Noir pur, Sakura, Océan, Sunset.
- **Accès administrateur** : Réglages → ligne **Version (V2.05)** → appuyer **5 fois** rapidement. Le serveur décide : si ton compte Telegram n'est pas celui défini par `ADMIN_TELEGRAM_ID`, il ne se passe rien.

## Liens réels déjà intégrés
- Mini app : https://mangagalleryzone.netlify.app  (à mettre dans @BotFather → Menu Button et dans `TELEGRAM_MINI_APP_URL`)
- API : https://mangagallery-backend-8d98.onrender.com/api  (déjà dans `js/config.js`)

## Déploiement (Netlify / Vercel / GitHub Pages — site statique)
1. `js/config.js` contient déjà `apiUrl: "https://mangagallery-backend-8d98.onrender.com/api"` (à changer uniquement si le backend déménage).
2. Publier ce dossier tel quel (le fichier `_headers` ajoute les en-têtes de sécurité sur Netlify).
3. Dans **@BotFather** : `/mybots` → ton bot → *Bot Settings* → *Menu Button* (ou *Configure Mini App*) → URL HTTPS du site. Mettre la même URL dans `TELEGRAM_MINI_APP_URL` côté backend.
4. Dans `backend/.env` : `CORS_ORIGINS=https://ton-site` (le domaine de la mini app).

## Structure
```
index.html          application (une seule page, routage par #/…)
js/config.js        seul fichier à modifier (URL du backend)
js/i18n.js          traductions FR/EN (ajouter une langue = ajouter un bloc)
js/theme.js         thèmes ; css/themes.css = palettes
js/api.js           client API (auth Telegram, réessais, réveil du serveur)
js/store.js         favoris / historique / préférences synchronisés avec le backend
js/fx.js            animations (ondulation, 3D, confettis, compteurs, tirer-pour-rafraîchir)
js/ui.js            composants (cartes, feuilles, segments…)
js/views.js         écrans : accueil, explorer, manga, bibliothèque, notifications, réglages
js/reader.js        lecteur (vertical / page par page)
js/app.js           démarrage, porte du canal, routeur, barre de navigation
admin/              panneau d'administration (s'ouvre depuis la mini app, 5 appuis sur Version)
```

## Sécurité côté interface
- Aucun `innerHTML` avec des données : tout passe par `textContent` (commentaires, noms…).
- Pas de bibliothèque tierce (icônes en SVG intégré) ; seul `telegram-web-app.js` est chargé.
- Les jetons sont en `sessionStorage` (effacés à la fermeture) ; favoris/historique restent sur l'appareil.
- Panneau admin : assainisseur HTML (`admin/js/safe-html.js`), CSP, versions des CDN figées.
