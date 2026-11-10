# Nexa Manga — Mini App Telegram

Un projet **Nexa** · canal : **@Nexa_CG** · version **V2.05** · langues : **Français / English** · **6 thèmes** + Auto

## Ce que fait l'application
- Ouverture **uniquement dans Telegram**. La session est vérifiée par le backend (signature `initData`).
- **Porte du canal** : tant que l'utilisateur n'a pas rejoint `@Nexa_CG`, il voit l'écran « Rejoins d'abord le canal Nexa » (boutons *Rejoindre* / *J'ai rejoint*). Le bot (`backend/bot.py`) applique la même règle avant même d'afficher le bouton de la mini app.
- Accueil, explorer (recherche, catégories, tri), fiche manga (favoris, chapitres, commentaires, signalement), lecteur vertical (progression, reprise, chapitre suivant/précédent), bibliothèque (favoris + historique), notifications, réglages.
- **Langue** : Auto / Français / English (Réglages). **Thèmes** : Auto, Nexa, Clair, Noir pur, Sakura, Océan, Sunset.
- **Accès administrateur** : Réglages → ligne **Version (V2.05)** → appuyer **5 fois** rapidement. Le serveur décide : si ton compte Telegram n'est pas celui défini par `ADMIN_TELEGRAM_ID`, il ne se passe rien.

## Déploiement (Netlify / Vercel / GitHub Pages — site statique)
1. Ouvrir `js/config.js` et mettre l'URL de ton backend : `apiUrl: "https://TON-BACKEND.onrender.com/api"`.
2. Publier ce dossier tel quel (le fichier `_headers` ajoute les en-têtes de sécurité sur Netlify).
3. Dans **@BotFather** : `/mybots` → ton bot → *Bot Settings* → *Menu Button* (ou *Configure Mini App*) → URL HTTPS du site. Mettre la même URL dans `TELEGRAM_MINI_APP_URL` côté backend.
4. Dans `backend/.env` : `CORS_ORIGINS=https://ton-site` (le domaine de la mini app).

## Structure
```
index.html          application (une seule page, routage par #/…)
js/config.js        seul fichier à modifier (URL du backend)
js/i18n.js          traductions FR/EN (ajouter une langue = ajouter un bloc)
js/theme.js         thèmes ; css/themes.css = palettes
js/api.js           client API (auth Telegram, rafraîchissement automatique)
js/app.js           écrans : accueil, explorer, manga, lecteur, bibliothèque, notifications, réglages
admin/              panneau d'administration (s'ouvre depuis la mini app, 5 appuis sur Version)
```

## Sécurité côté interface
- Aucun `innerHTML` avec des données : tout passe par `textContent` (commentaires, noms…).
- Pas de bibliothèque tierce (icônes en SVG intégré) ; seul `telegram-web-app.js` est chargé.
- Les jetons sont en `sessionStorage` (effacés à la fermeture) ; favoris/historique restent sur l'appareil.
- Panneau admin : assainisseur HTML (`admin/js/safe-html.js`), CSP, versions des CDN figées.
