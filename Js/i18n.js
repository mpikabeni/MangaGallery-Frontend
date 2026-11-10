/* Nexa Manga - translations (FR / EN). Add a language = add a block here. */
(function () {
  "use strict";
  const DICT = {
    fr: {
      loading: "Chargement…", retry: "Réessayer", cancel: "Annuler", confirm: "Confirmer", close: "Fermer",
      tg_only_title: "Ouvre Nexa Manga depuis Telegram",
      tg_only_body: "Cette application fonctionne uniquement à l'intérieur de Telegram. Ouvre le bot puis appuie sur « Ouvrir Nexa Manga ».",
      gate_title: "Rejoins d'abord le canal Nexa",
      gate_body: "Nexa Manga est un projet Nexa. Pour continuer, rejoins {channel} puis appuie sur « J'ai rejoint ».",
      join_channel: "Rejoindre {channel}", i_joined: "J'ai rejoint", not_joined_yet: "Tu n'as pas encore rejoint le canal.",
      maint_title: "Maintenance en cours", maint_body: "Nexa Manga revient très vite. Merci de ta patience !",
      closed_title: "Inscriptions fermées", closed_body: "Les nouvelles inscriptions sont temporairement fermées.",
      disabled_title: "Compte désactivé", disabled_body: "Ton compte a été désactivé. Contacte le support Nexa.",
      error_title: "Oups, un problème est survenu", error_body: "Vérifie ta connexion puis réessaie.",
      nav_home: "Accueil", nav_browse: "Explorer", nav_library: "Bibliothèque", nav_settings: "Réglages",
      home_continue: "Continuer la lecture", home_updates: "Dernières mises à jour", home_new: "Nouveautés",
      home_categories: "Catégories", see_all: "Tout voir", home_empty_title: "Rien à lire pour l'instant",
      home_empty_body: "Les mangas arrivent bientôt. Reviens vite !", new_badge: "Nouveau",
      search_placeholder: "Rechercher un manga…", all: "Tous", sort_latest: "Récents", sort_updated: "Mis à jour", sort_title: "A–Z",
      no_results: "Aucun résultat", no_results_body: "Essaie un autre mot-clé ou une autre catégorie.", load_more: "Voir plus",
      status_ongoing: "En cours", status_completed: "Terminé", status_paused: "En pause", status_hiatus: "Hiatus", status_cancelled: "Arrêté",
      chapters: "Chapitres", chapter_n: "Chapitre {n}", start_reading: "Commencer", continue_reading: "Continuer · Ch. {n}",
      no_chapters: "Aucun chapitre disponible.", order_desc: "Plus récents d'abord", order_asc: "Plus anciens d'abord",
      read_more: "Lire la suite", read_less: "Réduire", no_description: "Aucune description.",
      add_favorite: "Ajouter aux favoris", remove_favorite: "Retirer des favoris", fav_added: "Ajouté aux favoris", fav_removed: "Retiré des favoris",
      favorites: "Favoris", history: "Historique", fav_empty_title: "Aucun favori", fav_empty_body: "Touche le cœur sur un manga pour le retrouver ici.",
      hist_empty_title: "Historique vide", hist_empty_body: "Les chapitres que tu lis apparaîtront ici.",
      clear_history: "Vider l'historique", clear_favorites: "Vider les favoris", confirm_clear: "Cette action est définitive. Continuer ?", cleared: "C'est fait",
      comments: "Commentaires", comment_placeholder: "Écris un commentaire…", post: "Publier", comment_empty: "Sois le premier à commenter.",
      comment_sent: "Commentaire publié", comment_deleted: "Commentaire supprimé", comment_error: "Impossible d'envoyer le commentaire.",
      report: "Signaler", reported: "Signalement envoyé, merci", delete: "Supprimer", you: "Toi",
      reader_prev: "Précédent", reader_next: "Suivant", reader_end_title: "Fin du chapitre", reader_last: "Tu es à jour !", reader_back: "Retour",
      reader_error: "Image indisponible", reader_page: "Page {a}/{b}", reader_empty: "Ce chapitre n'a pas encore de pages.",
      notif_title: "Notifications", notif_empty_title: "Aucune notification", notif_empty_body: "Tu seras prévenu des nouveautés ici.", mark_all_read: "Tout marquer lu",
      settings_title: "Réglages", account: "Compte", member: "Membre Nexa", language: "Langue", lang_auto: "Auto", lang_fr: "Français", lang_en: "English",
      theme: "Thème", theme_auto: "Auto", theme_nexa: "Nexa", theme_light: "Clair", theme_amoled: "Noir pur", theme_sakura: "Sakura", theme_ocean: "Océan", theme_sunset: "Sunset",
      library: "Bibliothèque", community: "Communauté", nexa_channel: "Canal Nexa", about: "À propos", version: "Version", made_by: "Un projet Nexa", admin_mode: "Mode administrateur",
      just_now: "à l'instant", ch_short: "Ch. {n}",
    },
    en: {
      loading: "Loading…", retry: "Try again", cancel: "Cancel", confirm: "Confirm", close: "Close",
      tg_only_title: "Open Nexa Manga from Telegram",
      tg_only_body: "This app only works inside Telegram. Open the bot, then tap “Open Nexa Manga”.",
      gate_title: "Join the Nexa channel first",
      gate_body: "Nexa Manga is a Nexa project. To continue, join {channel} then tap “I joined”.",
      join_channel: "Join {channel}", i_joined: "I joined", not_joined_yet: "You haven't joined the channel yet.",
      maint_title: "Under maintenance", maint_body: "Nexa Manga will be back very soon. Thanks for your patience!",
      closed_title: "Sign-ups closed", closed_body: "New registrations are temporarily closed.",
      disabled_title: "Account disabled", disabled_body: "Your account has been disabled. Contact Nexa support.",
      error_title: "Oops, something went wrong", error_body: "Check your connection and try again.",
      nav_home: "Home", nav_browse: "Browse", nav_library: "Library", nav_settings: "Settings",
      home_continue: "Continue reading", home_updates: "Latest updates", home_new: "New releases",
      home_categories: "Categories", see_all: "See all", home_empty_title: "Nothing to read yet",
      home_empty_body: "Manga are coming soon. Come back shortly!", new_badge: "New",
      search_placeholder: "Search a manga…", all: "All", sort_latest: "Newest", sort_updated: "Updated", sort_title: "A–Z",
      no_results: "No results", no_results_body: "Try another keyword or category.", load_more: "Load more",
      status_ongoing: "Ongoing", status_completed: "Completed", status_paused: "On break", status_hiatus: "Hiatus", status_cancelled: "Cancelled",
      chapters: "Chapters", chapter_n: "Chapter {n}", start_reading: "Start reading", continue_reading: "Continue · Ch. {n}",
      no_chapters: "No chapters available.", order_desc: "Newest first", order_asc: "Oldest first",
      read_more: "Read more", read_less: "Show less", no_description: "No description.",
      add_favorite: "Add to favorites", remove_favorite: "Remove from favorites", fav_added: "Added to favorites", fav_removed: "Removed from favorites",
      favorites: "Favorites", history: "History", fav_empty_title: "No favorites", fav_empty_body: "Tap the heart on a manga to find it here.",
      hist_empty_title: "Empty history", hist_empty_body: "Chapters you read will show up here.",
      clear_history: "Clear history", clear_favorites: "Clear favorites", confirm_clear: "This cannot be undone. Continue?", cleared: "Done",
      comments: "Comments", comment_placeholder: "Write a comment…", post: "Post", comment_empty: "Be the first to comment.",
      comment_sent: "Comment posted", comment_deleted: "Comment deleted", comment_error: "Could not send the comment.",
      report: "Report", reported: "Report sent, thank you", delete: "Delete", you: "You",
      reader_prev: "Previous", reader_next: "Next", reader_end_title: "End of chapter", reader_last: "You're all caught up!", reader_back: "Back",
      reader_error: "Image unavailable", reader_page: "Page {a}/{b}", reader_empty: "This chapter has no pages yet.",
      notif_title: "Notifications", notif_empty_title: "No notifications", notif_empty_body: "You'll be notified about news here.", mark_all_read: "Mark all as read",
      settings_title: "Settings", account: "Account", member: "Nexa member", language: "Language", lang_auto: "Auto", lang_fr: "Français", lang_en: "English",
      theme: "Theme", theme_auto: "Auto", theme_nexa: "Nexa", theme_light: "Light", theme_amoled: "Pure black", theme_sakura: "Sakura", theme_ocean: "Ocean", theme_sunset: "Sunset",
      library: "Library", community: "Community", nexa_channel: "Nexa channel", about: "About", version: "Version", made_by: "A Nexa project", admin_mode: "Administrator mode",
      just_now: "just now", ch_short: "Ch. {n}",
    },
  };

  const PREF_KEY = "nexa:lang";   // "auto" | "fr" | "en"
  let current = "fr";

  function detect() {
    const code = ((window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user
      && Telegram.WebApp.initDataUnsafe.user.language_code) || navigator.language || "fr").toLowerCase();
    return code.startsWith("fr") ? "fr" : "en";
  }
  function pref() { try { return localStorage.getItem(PREF_KEY) || "auto"; } catch (_) { return "auto"; } }
  function apply() {
    const p = pref();
    current = p === "auto" ? detect() : (DICT[p] ? p : "fr");
    document.documentElement.lang = current;
  }
  function t(key, vars) {
    let s = (DICT[current] && DICT[current][key]) || DICT.fr[key] || key;
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function setPref(p) { try { localStorage.setItem(PREF_KEY, p); } catch (_) {} apply(); }

  apply();
  window.I18n = { t, setPref, pref, lang: () => current, apply };
})();
