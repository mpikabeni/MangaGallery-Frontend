/*==================================
MANGA GALLERY
ADMIN SYSTEM
VERSION FINALE
==================================*/

"use strict";

const SystemModule = (() => {

    const state = {

        data: null,

        loading: false,

        initialized: false,

        controller: null,

        refreshTimer: null

    };


    const dom = {

        refresh:
            document.getElementById(
                "refresh-system"
            ),

        retry:
            document.getElementById(
                "retry-system"
            ),

        state:
            document.getElementById(
                "system-state"
            ),

        stateTitle:
            document.getElementById(
                "system-state-title"
            ),

        stateMessage:
            document.getElementById(
                "system-state-message"
            ),

        serverStatus:
            document.getElementById(
                "server-status"
            ),

        serverUptime:
            document.getElementById(
                "server-uptime"
            ),

        databaseStatus:
            document.getElementById(
                "database-status"
            ),

        databaseDetail:
            document.getElementById(
                "database-status-detail"
            ),

        apiStatus:
            document.getElementById(
                "api-status"
            ),

        apiResponseTime:
            document.getElementById(
                "api-response-time"
            ),

        storageStatus:
            document.getElementById(
                "storage-status"
            ),

        storageUsage:
            document.getElementById(
                "storage-usage"
            ),

        appVersion:
            document.getElementById(
                "app-version"
            ),

        apiVersion:
            document.getElementById(
                "api-version"
            ),

        environment:
            document.getElementById(
                "environment"
            ),

        serverVersion:
            document.getElementById(
                "server-version"
            ),

        databaseVersion:
            document.getElementById(
                "database-version"
            ),

        serverStarted:
            document.getElementById(
                "server-started"
            ),

        cpuUsage:
            document.getElementById(
                "cpu-usage"
            ),

        cpuProgress:
            document.getElementById(
                "cpu-progress"
            ),

        memoryUsage:
            document.getElementById(
                "memory-usage"
            ),

        memoryProgress:
            document.getElementById(
                "memory-progress"
            ),

        diskUsage:
            document.getElementById(
                "disk-usage"
            ),

        diskProgress:
            document.getElementById(
                "disk-progress"
            ),

        servicesList:
            document.getElementById(
                "services-list"
            ),

        logs:
            document.getElementById(
                "system-logs"
            ),

        clearCache:
            document.getElementById(
                "clear-system-cache"
            ),

        restartServices:
            document.getElementById(
                "restart-services"
            ),

        systemCheck:
            document.getElementById(
                "run-system-check"
            ),

        createBackup:
            document.getElementById(
                "create-system-backup"
            ),

        clearLogs:
            document.getElementById(
                "clear-system-logs"
            )

    };


    function initialize(){

        if(state.initialized){

            return;

        }

        state.initialized = true;

        bindEvents();

        initializeIcons();

        loadSystem();

        startAutoRefresh();

    }


    function bindEvents(){

        dom.refresh?.addEventListener(
            "click",
            loadSystem
        );


        dom.retry?.addEventListener(
            "click",
            loadSystem
        );


        dom.clearCache?.addEventListener(
            "click",
            clearCache
        );


        dom.restartServices?.addEventListener(
            "click",
            restartServices
        );


        dom.systemCheck?.addEventListener(
            "click",
            runSystemCheck
        );


        dom.createBackup?.addEventListener(
            "click",
            createBackup
        );


        dom.clearLogs?.addEventListener(
            "click",
            clearLogs
        );


        document.addEventListener(
            "visibilitychange",
            handleVisibility
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


    async function loadSystem(){

        if(state.loading){

            return;

        }

        state.loading = true;

        setLoadingState(true);

        hideState();

        abortRequest();

        state.controller =
            new AbortController();

        try{

            const response =
                await requestSystem(
                    state.controller.signal
                );

            const data =
                normalizeSystemResponse(
                    response
                );

            state.data =
                data;

            renderSystem(
                data
            );

            hideState();

        }
        catch(error){

            if(
                error?.name ===
                "AbortError"
            ){

                return;

            }

            showState(
                "Système indisponible",
                error?.message ||
                "Impossible de récupérer les informations du système."
            );

            showToastMessage(
                "Impossible de charger les informations système.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function requestSystem(
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

            "/api/system/info",

            {},

            {
                signal
            }

        );

    }


    function normalizeSystemResponse(
        response
    ){

        const source =
            response?.data ??
            response?.system ??
            response ??
            {};

        return {

            server:
                source.server ||
                {},

            database:
                source.database ||
                {},

            api:
                source.api ||
                {},

            storage:
                source.storage ||
                {},

            resources:
                source.resources ||
                {},

            application:
                source.application ||
                {},

            services:
                Array.isArray(
                    source.services
                )
                    ? source.services
                    : [],

            logs:
                Array.isArray(
                    source.logs
                )
                    ? source.logs
                    : []

        };

    }


    function renderSystem(
        data
    ){

        renderServer(
            data.server
        );

        renderDatabase(
            data.database
        );

        renderApi(
            data.api
        );

        renderStorage(
            data.storage
        );

        renderApplication(
            data.application
        );

        renderResources(
            data.resources
        );

        renderServices(
            data.services
        );

        renderLogs(
            data.logs
        );

        initializeIcons();

    }


    function renderServer(
        server
    ){

        const status =
            normalizeStatus(
                server.status
            );

        setText(
            dom.serverStatus,
            getStatusLabel(
                status,
                "Opérationnel"
            )
        );

        setText(
            dom.serverUptime,
            server.uptime
                ? `Uptime : ${formatUptime(
                    server.uptime
                )}`
                : "-"
        );

        setStatusClass(
            dom.serverStatus,
            status
        );

    }


    function renderDatabase(
        database
    ){

        const status =
            normalizeStatus(
                database.status
            );

        setText(
            dom.databaseStatus,
            getStatusLabel(
                status,
                "Opérationnelle"
            )
        );

        setText(
            dom.databaseDetail,
            database.version
                ? `Version ${database.version}`
                : "-"
        );

        setStatusClass(
            dom.databaseStatus,
            status
        );

    }


    function renderApi(
        api
    ){

        const status =
            normalizeStatus(
                api.status
            );

        setText(
            dom.apiStatus,
            getStatusLabel(
                status,
                "Opérationnelle"
            )
        );

        const responseTime =
            Number(
                api.response_time ??
                api.responseTime ??
                0
            );

        setText(
            dom.apiResponseTime,
            responseTime > 0
                ? `${Math.round(
                    responseTime
                )} ms`
                : "-"
        );

        setStatusClass(
            dom.apiStatus,
            status
        );

    }


    function renderStorage(
        storage
    ){

        const status =
            normalizeStatus(
                storage.status
            );

        setText(
            dom.storageStatus,
            getStatusLabel(
                status,
                "Disponible"
            )
        );

        const used =
            Number(
                storage.used_percentage ??
                storage.usedPercentage ??
                storage.usage ??
                0
            );

        setText(
            dom.storageUsage,
            `${formatNumber(
                used
            )}% utilisé`
        );

        setStatusClass(
            dom.storageStatus,
            status
        );

    }


    function renderApplication(
        application
    ){

        setText(
            dom.appVersion,
            application.version ||
            "-"
        );

        setText(
            dom.apiVersion,
            application.api_version ||
            application.apiVersion ||
            "-"
        );

        setText(
            dom.environment,
            application.environment ||
            "-"
        );

        setText(
            dom.serverVersion,
            application.server_version ||
            application.serverVersion ||
            "-"
        );

        setText(
            dom.databaseVersion,
            application.database_version ||
            application.databaseVersion ||
            "-"
        );

        setText(
            dom.serverStarted,
            formatDate(
                application.started_at ||
                application.startedAt
            )
        );

    }


    function renderResources(
        resources
    ){

        updateResource(
            dom.cpuUsage,
            dom.cpuProgress,
            resources.cpu ??
            resources.cpu_usage ??
            resources.cpuUsage ??
            0
        );

        updateResource(
            dom.memoryUsage,
            dom.memoryProgress,
            resources.memory ??
            resources.memory_usage ??
            resources.memoryUsage ??
            0
        );

        updateResource(
            dom.diskUsage,
            dom.diskProgress,
            resources.disk ??
            resources.disk_usage ??
            resources.diskUsage ??
            0
        );

    }


    function updateResource(
        label,
        progress,
        value
    ){

        const percentage =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(value) || 0
                )
            );

        setText(
            label,
            `${formatNumber(
                percentage
            )}%`
        );

        if(progress){

            progress.style.width =
                `${percentage}%`;

            progress.classList.remove(
                "success",
                "warning",
                "danger"
            );

            if(percentage >= 85){

                progress.classList.add(
                    "danger"
                );

            }
            else if(percentage >= 70){

                progress.classList.add(
                    "warning"
                );

            }
            else{

                progress.classList.add(
                    "success"
                );

            }

        }

    }
    
        function renderServices(
        services
    ){

        if(!dom.servicesList){

            return;

        }

        if(
            !Array.isArray(services) ||
            services.length === 0
        ){

            return;

        }

        dom.servicesList.innerHTML =
            services
                .map(
                    service =>
                        createServiceRow(
                            service
                        )
                )
                .join("");

        initializeIcons();

    }


    function createServiceRow(
        service
    ){

        const name =
            escapeHtml(
                service.name ||
                service.title ||
                "Service"
            );

        const description =
            escapeHtml(
                service.description ||
                service.detail ||
                ""
            );

        const icon =
            escapeHtml(
                service.icon ||
                "server"
            );

        const status =
            normalizeStatus(
                service.status
            );

        return `
            <div class="service-row">

                <div class="service-info">

                    <div class="service-icon">

                        <i data-lucide="${icon}"></i>

                    </div>

                    <div>

                        <strong>
                            ${name}
                        </strong>

                        <span>
                            ${description}
                        </span>

                    </div>

                </div>

                <span class="service-status ${status}">
                    ${getStatusLabel(
                        status,
                        "Inconnu"
                    )}
                </span>

            </div>
        `;

    }


    function renderLogs(
        logs
    ){

        if(!dom.logs){

            return;

        }

        if(
            !Array.isArray(logs) ||
            logs.length === 0
        ){

            dom.logs.innerHTML = `
                <div class="system-log-row">

                    <div class="log-icon info">

                        <i data-lucide="info"></i>

                    </div>

                    <div class="log-content">

                        <strong>
                            Aucun journal
                        </strong>

                        <span>
                            Aucun événement système récent.
                        </span>

                    </div>

                    <time>
                        -
                    </time>

                </div>
            `;

            initializeIcons();

            return;

        }

        dom.logs.innerHTML =
            logs
                .slice(0,100)
                .map(
                    log =>
                        createLogRow(
                            log
                        )
                )
                .join("");

        initializeIcons();

    }


    function createLogRow(
        log
    ){

        const type =
            normalizeLogType(
                log.level ||
                log.type ||
                "info"
            );

        const title =
            escapeHtml(
                log.title ||
                log.message ||
                "Événement système"
            );

        const message =
            escapeHtml(
                log.description ||
                log.detail ||
                log.message ||
                ""
            );

        const date =
            formatDate(
                log.created_at ||
                log.createdAt ||
                log.date
            );

        const icon =
            type === "error"
                ? "circle-x"
                : type === "warning"
                    ? "triangle-alert"
                    : type === "success"
                        ? "circle-check"
                        : "info";

        return `
            <div class="system-log-row">

                <div class="log-icon ${type}">

                    <i data-lucide="${icon}"></i>

                </div>

                <div class="log-content">

                    <strong>
                        ${title}
                    </strong>

                    <span>
                        ${message}
                    </span>

                </div>

                <time>
                    ${date}
                </time>

            </div>
        `;

    }


    async function clearCache(){

        const confirmed =
            window.confirm(
                "Voulez-vous vraiment vider le cache système ?"
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

            await executeAction(
                "/api/system/cache/clear",
                {}
            );

            addLocalLog(
                "success",
                "Cache système vidé",
                "Le cache a été nettoyé avec succès."
            );

            showToastMessage(
                "Cache système vidé avec succès.",
                "success"
            );

            await loadSystem();

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


    async function restartServices(){

        const confirmed =
            window.confirm(
                "Voulez-vous redémarrer les services système ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.restartServices,
            true,
            "Redémarrage..."
        );

        try{

            await executeAction(
                "/api/system/services/restart",
                {}
            );

            addLocalLog(
                "success",
                "Services redémarrés",
                "Les services système ont été redémarrés."
            );

            showToastMessage(
                "Services redémarrés avec succès.",
                "success"
            );

            await loadSystem();

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de redémarrer les services.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.restartServices,
                false,
                "Redémarrer les services"
            );

        }

    }


    async function runSystemCheck(){

        setButtonLoading(
            dom.systemCheck,
            true,
            "Vérification..."
        );

        try{

            const response =
                await executeAction(
                    "/api/system/check",
                    {}
                );

            addLocalLog(
                "success",
                "Vérification terminée",
                response?.message ||
                "Le contrôle système est terminé."
            );

            showToastMessage(
                response?.message ||
                "Vérification système terminée.",
                "success"
            );

            await loadSystem();

        }
        catch(error){

            addLocalLog(
                "error",
                "Échec de la vérification",
                error?.message ||
                "Le contrôle système a échoué."
            );

            showToastMessage(
                error?.message ||
                "La vérification système a échoué.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.systemCheck,
                false,
                "Vérifier le système"
            );

        }

    }


    async function createBackup(){

        const confirmed =
            window.confirm(
                "Voulez-vous créer une sauvegarde du système ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.createBackup,
            true,
            "Sauvegarde..."
        );

        try{

            const response =
                await executeAction(
                    "/api/system/backup",
                    {}
                );

            addLocalLog(
                "success",
                "Sauvegarde créée",
                response?.message ||
                "La sauvegarde a été créée."
            );

            showToastMessage(
                response?.message ||
                "Sauvegarde créée avec succès.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de créer la sauvegarde.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.createBackup,
                false,
                "Créer une sauvegarde"
            );

        }

    }


    async function clearLogs(){

        const confirmed =
            window.confirm(
                "Voulez-vous effacer les journaux système ?"
            );

        if(!confirmed){

            return;

        }

        setButtonLoading(
            dom.clearLogs,
            true,
            "Suppression..."
        );

        try{

            await executeAction(
                "/api/system/logs/clear",
                {}
            );

            if(dom.logs){

                dom.logs.innerHTML = "";

            }

            showToastMessage(
                "Journaux système effacés.",
                "success"
            );

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible d'effacer les journaux.",
                "error"
            );

        }
        finally{

            setButtonLoading(
                dom.clearLogs,
                false,
                "Effacer"
            );

        }

    }


    async function executeAction(
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

        throw new Error(
            "Méthode POST API indisponible."
        );

    }


    function addLocalLog(
        type,
        title,
        message
    ){

        if(!dom.logs){

            return;

        }

        const empty =
            dom.logs.querySelector(
                ".system-log-row"
            );

        if(
            empty &&
            empty.textContent.includes(
                "Aucun journal"
            )
        ){

            dom.logs.innerHTML = "";

        }

        const row =
            createLogRow({

                type,

                title,

                description:
                    message,

                date:
                    new Date().toISOString()

            });

        dom.logs.insertAdjacentHTML(
            "afterbegin",
            row
        );

        initializeIcons();

    }
    
        function normalizeStatus(
        status
    ){

        const value =
            String(
                status || "online"
            )
            .toLowerCase()
            .trim();

        if(
            [
                "online",
                "ok",
                "healthy",
                "running",
                "operational",
                "up"
            ].includes(value)
        ){

            return "online";

        }

        if(
            [
                "warning",
                "degraded",
                "partial"
            ].includes(value)
        ){

            return "warning";

        }

        if(
            [
                "error",
                "failed",
                "failure"
            ].includes(value)
        ){

            return "error";

        }

        return "offline";

    }


    function normalizeLogType(
        type
    ){

        const value =
            String(
                type || "info"
            )
            .toLowerCase()
            .trim();

        if(
            [
                "success",
                "ok"
            ].includes(value)
        ){

            return "success";

        }

        if(
            [
                "warning",
                "warn"
            ].includes(value)
        ){

            return "warning";

        }

        if(
            [
                "error",
                "failed"
            ].includes(value)
        ){

            return "error";

        }

        return "info";

    }


    function getStatusLabel(
        status,
        fallback
    ){

        const labels = {

            online:
                "Opérationnel",

            warning:
                "Attention",

            error:
                "Erreur",

            offline:
                "Hors ligne"

        };

        return labels[status] ||
            fallback ||
            "Inconnu";

    }


    function setStatusClass(
        element,
        status
    ){

        if(!element){

            return;

        }

        element.classList.remove(
            "online",
            "warning",
            "error",
            "offline"
        );

        element.classList.add(
            status
        );

    }


    function formatNumber(
        value
    ){

        const number =
            Number(value);

        if(
            !Number.isFinite(number)
        ){

            return "0";

        }

        return number.toLocaleString(
            "fr-FR",
            {
                maximumFractionDigits:1
            }
        );

    }


    function formatUptime(
        value
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "-";

        }

        if(
            typeof value === "number"
        ){

            const totalSeconds =
                Math.max(
                    0,
                    Math.floor(value)
                );

            const days =
                Math.floor(
                    totalSeconds /
                    86400
                );

            const hours =
                Math.floor(
                    (totalSeconds % 86400) /
                    3600
                );

            const minutes =
                Math.floor(
                    (totalSeconds % 3600) /
                    60
                );

            if(days > 0){

                return `${days} j ${hours} h`;

            }

            if(hours > 0){

                return `${hours} h ${minutes} min`;

            }

            return `${minutes} min`;

        }

        return String(value);

    }


    function formatDate(
        value
    ){

        if(!value){

            return "-";

        }

        const date =
            new Date(value);

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return "-";

        }

        return date.toLocaleString(
            "fr-FR",
            {
                day:"2-digit",
                month:"2-digit",
                year:"numeric",
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    }


    function setText(
        element,
        value
    ){

        if(element){

            element.textContent =
                value ?? "";

        }

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

            if(
                !button.dataset.originalText
            ){

                button.dataset.originalText =
                    span.textContent;

            }

            span.textContent =
                loading
                    ? text
                    : button.dataset.originalText;

        }

    }


    function showState(
        title,
        message
    ){

        if(!dom.state){

            return;

        }

        setText(
            dom.stateTitle,
            title
        );

        setText(
            dom.stateMessage,
            message
        );

        dom.state.classList.remove(
            "hidden"
        );

    }


    function hideState(){

        if(dom.state){

            dom.state.classList.add(
                "hidden"
            );

        }

    }


    function setLoadingState(
        loading
    ){

        document.body.classList.toggle(
            "system-loading",
            loading
        );

        if(dom.refresh){

            dom.refresh.disabled =
                loading;

        }

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


    function escapeHtml(
        value
    ){

        if(
            value === null ||
            value === undefined
        ){

            return "";

        }

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    function startAutoRefresh(){

        stopAutoRefresh();

        state.refreshTimer =
            setInterval(
                () => {

                    if(
                        !document.hidden &&
                        !state.loading
                    ){

                        loadSystem();

                    }

                },
                60000
            );

    }


    function stopAutoRefresh(){

        if(state.refreshTimer){

            clearInterval(
                state.refreshTimer
            );

            state.refreshTimer =
                null;

        }

    }


    function handleVisibility(){

        if(document.hidden){

            stopAutoRefresh();

            return;

        }

        loadSystem();

        startAutoRefresh();

    }


    function abortRequest(){

        if(state.controller){

            state.controller.abort();

            state.controller =
                null;

        }

    }


    function destroy(){

        stopAutoRefresh();

        abortRequest();

        state.initialized =
            false;

    }


    return {

        initialize,

        destroy,

        refresh:
            loadSystem

    };

})();


window.initializeSystemPage =
    async function(){

        SystemModule.initialize();

    };