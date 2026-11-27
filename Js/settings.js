/*==================================
MANGA GALLERY
ADMIN SETTINGS
VERSION FINALE
==================================*/

"use strict";

const SettingsModule = (() => {

    const state = {

        settings: {},

        originalSettings: {},

        activeSection: "general",

        loading: false,

        initialized: false,

        controller: null

    };


    const dom = {

        save:
            document.getElementById(
                "save-settings"
            ),

        saveBottom:
            document.getElementById(
                "save-settings-bottom"
            ),

        reset:
            document.getElementById(
                "reset-settings"
            ),

        logoInput:
            document.getElementById(
                "site-logo"
            ),

        logoPreview:
            document.getElementById(
                "site-logo-preview"
            ),

        siteName:
            document.getElementById(
                "site-name"
            ),

        siteLanguage:
            document.getElementById(
                "site-language"
            ),

        siteDescription:
            document.getElementById(
                "site-description"
            ),

        siteUrl:
            document.getElementById(
                "site-url"
            ),

        accentColor:
            document.getElementById(
                "accent-color"
            ),

        sidebarMode:
            document.getElementById(
                "sidebar-mode"
            ),

        systemNotifications:
            document.getElementById(
                "system-notifications"
            ),

        newMangaNotifications:
            document.getElementById(
                "new-manga-notifications"
            ),

        newChapterNotifications:
            document.getElementById(
                "new-chapter-notifications"
            ),

        commentNotifications:
            document.getElementById(
                "comment-notifications"
            ),

        twoFactorAuth:
            document.getElementById(
                "two-factor-auth"
            ),

        autoLogout:
            document.getElementById(
                "auto-logout"
            ),

        sessionTimeout:
            document.getElementById(
                "session-timeout"
            ),

        maxLoginAttempts:
            document.getElementById(
                "max-login-attempts"
            ),

        maintenanceMode:
            document.getElementById(
                "maintenance-mode"
            ),

        maintenanceMessage:
            document.getElementById(
                "maintenance-message"
            ),

        logoutAllSessions:
            document.getElementById(
                "logout-all-sessions"
            ),

        resetSecurity:
            document.getElementById(
                "reset-security"
            ),

        clearCache:
            document.getElementById(
                "clear-cache"
            ),

        refreshData:
            document.getElementById(
                "refresh-data"
            )

    };


    function initialize(){

        if(state.initialized){

            return;

        }

        state.initialized = true;

        bindEvents();

        initializeIcons();

        loadSettings();

    }


    function bindEvents(){

        document
            .querySelectorAll(
                ".settings-nav-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            activateSection(
                                button.dataset.section
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                'input[name="theme"]'
            )
            .forEach(
                input => {

                    input.addEventListener(
                        "change",
                        handleThemeChange
                    );

                }
            );


        dom.save?.addEventListener(
            "click",
            saveSettings
        );


        dom.saveBottom?.addEventListener(
            "click",
            saveSettings
        );


        dom.reset?.addEventListener(
            "click",
            resetSettings
        );


        dom.logoInput?.addEventListener(
            "change",
            handleLogoChange
        );


        dom.maintenanceMode?.addEventListener(
            "change",
            handleMaintenanceChange
        );


        dom.logoutAllSessions?.addEventListener(
            "click",
            logoutAllSessions
        );


        dom.resetSecurity?.addEventListener(
            "click",
            resetSecurity
        );


        dom.clearCache?.addEventListener(
            "click",
            clearCache
        );


        dom.refreshData?.addEventListener(
            "click",
            refreshData
        );


        window.addEventListener(
            "beforeunload",
            destroy
        );

    }


    function initializeIcons(){

        if(
            window.lucide &&
            typeof window.lucide.createIcons ===
            "function"
        ){

            window.lucide.createIcons();

        }

    }


    async function loadSettings(){

        if(state.loading){

            return;

        }

        state.loading = true;

        setLoadingState(true);

        abortRequest();

        state.controller =
            new AbortController();

        try{

            const response =
                await requestSettings(
                    state.controller.signal
                );

            const settings =
                normalizeSettingsResponse(
                    response
                );

            state.settings =
                cloneObject(settings);

            state.originalSettings =
                cloneObject(settings);

            populateForm(
                settings
            );

            applySettings(
                settings
            );

        }
        catch(error){

            if(
                error?.name ===
                "AbortError"
            ){

                return;

            }

            showToastMessage(
                error?.message ||
                "Impossible de charger les paramètres.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function requestSettings(
        signal
    ){

        if(
            !window.API ||
            typeof window.API.get !==
            "function"
        ){

            throw new Error(
                "API indisponible."
            );

        }

        return window.API.get(

            "/api/settings",

            {},

            {
                signal
            }

        );

    }


    function normalizeSettingsResponse(
        response
    ){

        const source =
            response?.data ??
            response?.settings ??
            response ??
            {};

        return {

            site_name:
                source.site_name ??
                source.siteName ??
                "",

            language:
                source.language ??
                "fr",

            description:
                source.description ??
                "",

            site_url:
                source.site_url ??
                source.siteUrl ??
                "",

            logo:
                source.logo ??
                "assets/logo.png",

            theme:
                source.theme ??
                "dark",

            accent_color:
                source.accent_color ??
                source.accentColor ??
                "red",

            sidebar_mode:
                source.sidebar_mode ??
                source.sidebarMode ??
                "expanded",

            system_notifications:
                Boolean(
                    source.system_notifications ??
                    source.systemNotifications ??
                    true
                ),

            new_manga_notifications:
                Boolean(
                    source.new_manga_notifications ??
                    source.newMangaNotifications ??
                    true
                ),

            new_chapter_notifications:
                Boolean(
                    source.new_chapter_notifications ??
                    source.newChapterNotifications ??
                    true
                ),

            comment_notifications:
                Boolean(
                    source.comment_notifications ??
                    source.commentNotifications ??
                    true
                ),

            two_factor_auth:
                Boolean(
                    source.two_factor_auth ??
                    source.twoFactorAuth ??
                    false
                ),

            auto_logout:
                Boolean(
                    source.auto_logout ??
                    source.autoLogout ??
                    true
                ),

            session_timeout:
                String(
                    source.session_timeout ??
                    source.sessionTimeout ??
                    "60"
                ),

            max_login_attempts:
                String(
                    source.max_login_attempts ??
                    source.maxLoginAttempts ??
                    "5"
                ),

            maintenance_mode:
                Boolean(
                    source.maintenance_mode ??
                    source.maintenanceMode ??
                    false
                ),

            maintenance_message:
                source.maintenance_message ??
                source.maintenanceMessage ??
                ""

        };

    }


    function populateForm(
        settings
    ){

        setValue(
            dom.siteName,
            settings.site_name
        );

        setValue(
            dom.siteLanguage,
            settings.language
        );

        setValue(
            dom.siteDescription,
            settings.description
        );

        setValue(
            dom.siteUrl,
            settings.site_url
        );

        setValue(
            dom.accentColor,
            settings.accent_color
        );

        setValue(
            dom.sidebarMode,
            settings.sidebar_mode
        );

        setValue(
            dom.sessionTimeout,
            settings.session_timeout
        );

        setValue(
            dom.maxLoginAttempts,
            settings.max_login_attempts
        );

        setValue(
            dom.maintenanceMessage,
            settings.maintenance_message
        );


        setChecked(
            dom.systemNotifications,
            settings.system_notifications
        );

        setChecked(
            dom.newMangaNotifications,
            settings.new_manga_notifications
        );

        setChecked(
            dom.newChapterNotifications,
            settings.new_chapter_notifications
        );

        setChecked(
            dom.commentNotifications,
            settings.comment_notifications
        );

        setChecked(
            dom.twoFactorAuth,
            settings.two_factor_auth
        );

        setChecked(
            dom.autoLogout,
            settings.auto_logout
        );

        setChecked(
            dom.maintenanceMode,
            settings.maintenance_mode
        );


        const theme =
            document.querySelector(
                `input[name="theme"][value="${CSS.escape(
                    settings.theme
                )}"]`
            );

        if(theme){

            theme.checked = true;

        }


        if(
            dom.logoPreview &&
            settings.logo
        ){

            dom.logoPreview.src =
                settings.logo;

        }

    }


    function collectSettings(){

        const theme =
            document.querySelector(
                'input[name="theme"]:checked'
            )?.value ||
            "dark";

        return {

            site_name:
                dom.siteName?.value.trim() ||
                "",

            language:
                dom.siteLanguage?.value ||
                "fr",

            description:
                dom.siteDescription?.value.trim() ||
                "",

            site_url:
                dom.siteUrl?.value.trim() ||
                "",

            theme,

            accent_color:
                dom.accentColor?.value ||
                "red",

            sidebar_mode:
                dom.sidebarMode?.value ||
                "expanded",

            system_notifications:
                Boolean(
                    dom.systemNotifications?.checked
                ),

            new_manga_notifications:
                Boolean(
                    dom.newMangaNotifications?.checked
                ),

            new_chapter_notifications:
                Boolean(
                    dom.newChapterNotifications?.checked
                ),

            comment_notifications:
                Boolean(
                    dom.commentNotifications?.checked
                ),

            two_factor_auth:
                Boolean(
                    dom.twoFactorAuth?.checked
                ),

            auto_logout:
                Boolean(
                    dom.autoLogout?.checked
                ),

            session_timeout:
                dom.sessionTimeout?.value ||
                "60",

            max_login_attempts:
                dom.maxLoginAttempts?.value ||
                "5",

            maintenance_mode:
                Boolean(
                    dom.maintenanceMode?.checked
                ),

            maintenance_message:
                dom.maintenanceMessage?.value.trim() ||
                ""

        };

    }


    function activateSection(
        section
    ){

        if(!section){

            return;

        }

        state.activeSection =
            section;

        document
            .querySelectorAll(
                ".settings-nav-item"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.section ===
                        section
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-section-content]"
            )
            .forEach(
                content => {

                    content.classList.toggle(
                        "active",
                        content.dataset.sectionContent ===
                        section
                    );

                }
            );

    }


    function handleThemeChange(
        event
    ){

        if(!event.target.checked){

            return;

        }

        applyTheme(
            event.target.value
        );

    }


    function applySettings(
        settings
    ){

        applyTheme(
            settings.theme
        );

        applyAccentColor(
            settings.accent_color
        );

        applySidebarMode(
            settings.sidebar_mode
        );

    }


    function applyTheme(
        theme
    ){

        const root =
            document.documentElement;

        if(theme === "light"){

            root.dataset.theme =
                "light";

        }
        else if(theme === "system"){

            root.dataset.theme =
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light";

        }
        else{

            root.dataset.theme =
                "dark";

        }

    }


    function applyAccentColor(
        color
    ){

        const colors = {

            red:"#E11D2E",

            purple:"#7C3AED",

            blue:"#2563EB",

            green:"#16A34A"

        };

        const selected =
            colors[color] ||
            colors.red;

        document.documentElement.style
            .setProperty(
                "--primary",
                selected
            );

    }


    function applySidebarMode(
        mode
    ){

        document.body.classList.toggle(
            "sidebar-compact",
            mode === "compact"
        );

    }


    function handleLogoChange(
        event
    ){

        const file =
            event.target.files?.[0];

        if(!file){

            return;

        }

        if(
            !file.type.startsWith(
                "image/"
            )
        ){

            showToastMessage(
                "Veuillez sélectionner une image valide.",
                "error"
            );

            event.target.value =
                "";

            return;

        }

        const reader =
            new FileReader();

        reader.onload =
            () => {

                if(dom.logoPreview){

                    dom.logoPreview.src =
                        reader.result;

                }

            };

        reader.readAsDataURL(
            file
        );

    }
    
        function handleMaintenanceChange(
        event
    ){

        const enabled =
            Boolean(
                event.target.checked
            );

        if(enabled){

            showToastMessage(
                "Le mode maintenance sera activé après l'enregistrement.",
                "warning"
            );

        }

    }


    async function saveSettings(){

        if(state.loading){

            return;

        }

        const settings =
            collectSettings();

        const validation =
            validateSettings(
                settings
            );

        if(!validation.valid){

            showToastMessage(
                validation.message,
                "error"
            );

            return;

        }

        state.loading = true;

        setLoadingState(true);

        try{

            const response =
                await updateSettings(
                    settings
                );

            const savedSettings =
                normalizeSettingsResponse(
                    response?.data ??
                    response ??
                    settings
                );

            state.settings =
                cloneObject(
                    savedSettings
                );

            state.originalSettings =
                cloneObject(
                    savedSettings
                );

            populateForm(
                savedSettings
            );

            applySettings(
                savedSettings
            );

            showToastMessage(
                "Paramètres enregistrés avec succès.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible d'enregistrer les paramètres.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function updateSettings(
        settings
    ){

        if(
            !window.API
        ){

            throw new Error(
                "API indisponible."
            );

        }


        if(
            typeof window.API.put ===
            "function"
        ){

            return window.API.put(

                "/api/settings",

                settings

            );

        }


        if(
            typeof window.API.patch ===
            "function"
        ){

            return window.API.patch(

                "/api/settings",

                settings

            );

        }


        throw new Error(
            "Méthode de modification API indisponible."
        );

    }


    function validateSettings(
        settings
    ){

        if(
            !settings.site_name
        ){

            return {

                valid:false,

                message:
                    "Le nom de la plateforme est obligatoire."

            };

        }


        if(
            settings.site_url
        ){

            try{

                new URL(
                    settings.site_url
                );

            }
            catch{

                return {

                    valid:false,

                    message:
                        "L'URL de la plateforme est invalide."

                };

            }

        }


        if(
            !Number.isInteger(
                Number(
                    settings.session_timeout
                )
            ) ||
            Number(
                settings.session_timeout
            ) <= 0
        ){

            return {

                valid:false,

                message:
                    "La durée de session est invalide."

            };

        }


        if(
            !Number.isInteger(
                Number(
                    settings.max_login_attempts
                )
            ) ||
            Number(
                settings.max_login_attempts
            ) <= 0
        ){

            return {

                valid:false,

                message:
                    "Le nombre de tentatives de connexion est invalide."

            };

        }


        if(
            settings.maintenance_mode &&
            !settings.maintenance_message
        ){

            return {

                valid:false,

                message:
                    "Ajoutez un message avant d'activer le mode maintenance."

            };

        }


        return {

            valid:true,

            message:""

        };

    }


    async function resetSettings(){

        if(state.loading){

            return;

        }

        const confirmed =
            await confirmAction(
                "Voulez-vous restaurer les paramètres précédents ?"
            );

        if(!confirmed){

            return;

        }

        populateForm(
            state.originalSettings
        );

        applySettings(
            state.originalSettings
        );

        showToastMessage(
            "Les modifications ont été annulées.",
            "info"
        );

    }


    async function logoutAllSessions(){

        const confirmed =
            await confirmAction(
                "Voulez-vous déconnecter toutes les sessions administrateur ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.logoutAllSessions,
            true,
            "Déconnexion..."
        );

        try{

            await executeSecurityAction(
                "/api/security/logout-all",
                {}
            );

            showToastMessage(
                "Toutes les sessions ont été déconnectées.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de déconnecter les sessions.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.logoutAllSessions,
                false,
                "Déconnecter toutes les sessions"
            );

        }

    }


    async function resetSecurity(){

        const confirmed =
            await confirmAction(
                "Voulez-vous réinitialiser les paramètres de sécurité ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.resetSecurity,
            true,
            "Réinitialisation..."
        );

        try{

            await executeSecurityAction(
                "/api/security/reset",
                {}
            );

            showToastMessage(
                "Paramètres de sécurité réinitialisés.",
                "success"
            );

            await loadSettings();

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de réinitialiser la sécurité.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.resetSecurity,
                false,
                "Réinitialiser la sécurité"
            );

        }

    }


    async function clearCache(){

        const confirmed =
            await confirmAction(
                "Voulez-vous vider le cache de la plateforme ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.clearCache,
            true,
            "Nettoyage..."
        );

        try{

            await executeMaintenanceAction(
                "/api/maintenance/cache/clear",
                {}
            );

            showToastMessage(
                "Cache vidé avec succès.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de vider le cache.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.clearCache,
                false,
                "Vider le cache"
            );

        }

    }


    async function refreshData(){

        setButtonLoading(
            dom.refreshData,
            true,
            "Actualisation..."
        );

        try{

            await executeMaintenanceAction(
                "/api/maintenance/refresh",
                {}
            );

            await loadSettings();

            showToastMessage(
                "Les données ont été actualisées.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible d'actualiser les données.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.refreshData,
                false,
                "Actualiser les données"
            );

        }

    }


    async function executeSecurityAction(
        endpoint,
        payload
    ){

        if(
            !window.API
        ){

            throw new Error(
                "API indisponible."
            );

        }

        if(
            typeof window.API.post ===
            "function"
        ){

            return window.API.post(
                endpoint,
                payload
            );

        }

        if(
            typeof window.API.put ===
            "function"
        ){

            return window.API.put(
                endpoint,
                payload
            );

        }

        throw new Error(
            "Méthode API indisponible."
        );

    }


    async function executeMaintenanceAction(
        endpoint,
        payload
    ){

        return executeSecurityAction(
            endpoint,
            payload
        );

    }


    function confirmAction(
        message
    ){

        return new Promise(
            resolve => {

                const result =
                    window.confirm(
                        message
                    );

                resolve(
                    result
                );

            }
        );

    }


    function setLoadingState(
        loading
    ){

        const buttons = [

            dom.save,
            dom.saveBottom,
            dom.reset

        ];

        buttons.forEach(
            button => {

                if(button){

                    button.disabled =
                        loading;

                }

            }
        );


        document.body.classList.toggle(
            "settings-loading",
            loading
        );

    }


    function setButtonLoading(
        button,
        loading,
        text
    ){

        if(!button){

            return;

        }

        button.disabled =
            loading;

        const span =
            button.querySelector(
                "span"
            );

        if(span){

            span.textContent =
                text;

        }

    }


    function setValue(
        element,
        value
    ){

        if(element){

            element.value =
                value ?? "";

        }

    }


    function setChecked(
        element,
        value
    ){

        if(element){

            element.checked =
                Boolean(value);

        }

    }


    function cloneObject(
        object
    ){

        return JSON.parse(
            JSON.stringify(
                object || {}
            )
        );

    }


    function showToastMessage(
        message,
        type = "info"
    ){

        if(
            typeof window.showToast ===
            "function"
        ){

            window.showToast(
                message,
                type
            );

        }

    }


    function abortRequest(){

        if(state.controller){

            state.controller.abort();

            state.controller =
                null;

        }

    }
    
        function destroy(){

        abortRequest();

        state.initialized =
            false;

    }


    return {

        initialize,

        destroy,

        save:
            saveSettings,

        reset:
            resetSettings,

        refresh:
            loadSettings

    };

})();


window.initializeSettingsPage =
    function(){

        SettingsModule.initialize();

    };