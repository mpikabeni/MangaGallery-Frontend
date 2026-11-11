/*==================================
MANGA GALLERY
ADMIN STATISTICS
VERSION FINALE
==================================*/

"use strict";

const StatisticsModule = (() => {

    const state = {

        range: 7,

        metric: "users",

        data: null,

        loading: false,

        controller: null,

        refreshTimer: null,

        initialized: false

    };


    const dom = {

        refresh:
            document.getElementById(
                "refresh-statistics"
            ),

        retry:
            document.getElementById(
                "retry-statistics"
            ),

        state:
            document.getElementById(
                "statistics-state"
            ),

        stateTitle:
            document.getElementById(
                "statistics-state-title"
            ),

        stateMessage:
            document.getElementById(
                "statistics-state-message"
            ),

        metric:
            document.getElementById(
                "activity-metric"
            ),

        activityChart:
            document.getElementById(
                "activity-chart"
            ),

        contentChart:
            document.getElementById(
                "content-chart"
            ),

        users:
            document.getElementById(
                "stat-users"
            ),

        usersChange:
            document.getElementById(
                "stat-users-change"
            ),

        mangas:
            document.getElementById(
                "stat-mangas"
            ),

        mangasChange:
            document.getElementById(
                "stat-mangas-change"
            ),

        chapters:
            document.getElementById(
                "stat-chapters"
            ),

        chaptersChange:
            document.getElementById(
                "stat-chapters-change"
            ),

        views:
            document.getElementById(
                "stat-views"
            ),

        viewsChange:
            document.getElementById(
                "stat-views-change"
            ),

        readingStarted:
            document.getElementById(
                "reading-started"
            ),

        readingCompleted:
            document.getElementById(
                "reading-completed"
            ),

        readingTime:
            document.getElementById(
                "reading-time"
            ),

        completionRate:
            document.getElementById(
                "completion-rate"
            ),

        comments:
            document.getElementById(
                "stat-comments"
            ),

        favorites:
            document.getElementById(
                "stat-favorites"
            ),

        bookmarks:
            document.getElementById(
                "stat-bookmarks"
            ),

        shares:
            document.getElementById(
                "stat-shares"
            ),

        topManga:
            document.getElementById(
                "top-manga-list"
            ),

        topUsers:
            document.getElementById(
                "top-users-list"
            ),

        topCategories:
            document.getElementById(
                "top-category-list"
            ),

        recentActivity:
            document.getElementById(
                "recent-activity-body"
            ),

        newUsers:
            document.getElementById(
                "new-users"
            ),

        newUsersChange:
            document.getElementById(
                "new-users-change"
            ),

        newMangas:
            document.getElementById(
                "new-mangas"
            ),

        newMangasChange:
            document.getElementById(
                "new-mangas-change"
            ),

        averageViews:
            document.getElementById(
                "average-views"
            ),

        averageReadingTime:
            document.getElementById(
                "average-reading-time"
            ),

        viewAllActivity:
            document.getElementById(
                "view-all-activity"
            )

    };


    let activityChart = null;

    let contentChart = null;


    function initialize(){

        if(state.initialized){

            return;

        }

        state.initialized = true;

        bindEvents();

        initializeIcons();

        loadStatistics();

        startAutoRefresh();

    }


    function bindEvents(){

        dom.refresh?.addEventListener(
            "click",
            refreshStatistics
        );


        dom.retry?.addEventListener(
            "click",
            loadStatistics
        );


        dom.metric?.addEventListener(
            "change",
            handleMetricChange
        );


        document
            .querySelectorAll(
                ".range-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            changeRange(
                                button.dataset.range
                            );

                        }
                    );

                }
            );


        dom.viewAllActivity?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "activity.html";

            }
        );


        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
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


    async function loadStatistics(){

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
                await requestStatistics(
                    state.controller.signal
                );

            const data =
                normalizeStatisticsResponse(
                    response
                );

            state.data =
                data;

            renderStatistics(
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
                "Impossible de charger les statistiques",
                error?.message ||
                "Une erreur est survenue lors du chargement des données."
            );

            showToastMessage(
                "Impossible de charger les statistiques.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function requestStatistics(
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

            "/api/statistics",

            {

                range:
                    state.range,

                metric:
                    state.metric

            },

            {

                signal

            }

        );

    }


    function normalizeStatisticsResponse(
        response
    ){

        const source =
            response?.data ??
            response ??
            {};

        return {

            overview:
                source.overview ||
                {},

            activity:
                source.activity ||
                {},

            content:
                source.content ||
                {},

            reading:
                source.reading ||
                {},

            engagement:
                source.engagement ||
                {},

            topMangas:
                Array.isArray(
                    source.top_mangas
                )
                    ? source.top_mangas
                    : Array.isArray(
                        source.topMangas
                    )
                        ? source.topMangas
                        : [],

            topUsers:
                Array.isArray(
                    source.top_users
                )
                    ? source.top_users
                    : Array.isArray(
                        source.topUsers
                    )
                        ? source.topUsers
                        : [],

            categories:
                Array.isArray(
                    source.categories
                )
                    ? source.categories
                    : [],

            recentActivity:
                Array.isArray(
                    source.recent_activity
                )
                    ? source.recent_activity
                    : Array.isArray(
                        source.recentActivity
                    )
                        ? source.recentActivity
                        : [],

            performance:
                source.performance ||
                {}

        };

    }


    function renderStatistics(
        data
    ){

        renderOverview(
            data.overview
        );

        renderReading(
            data.reading
        );

        renderEngagement(
            data.engagement
        );

        renderPerformance(
            data.performance
        );

        renderTopMangas(
            data.topMangas
        );

        renderTopUsers(
            data.topUsers
        );

        renderCategories(
            data.categories
        );

        renderRecentActivity(
            data.recentActivity
        );

        renderActivityChart(
            data.activity
        );

        renderContentChart(
            data.content
        );

        initializeIcons();

    }


    function renderOverview(
        overview
    ){

        setText(
            dom.users,
            formatNumber(
                overview.users ??
                overview.total_users ??
                0
            )
        );

        setText(
            dom.mangas,
            formatNumber(
                overview.mangas ??
                overview.total_mangas ??
                0
            )
        );

        setText(
            dom.chapters,
            formatNumber(
                overview.chapters ??
                overview.total_chapters ??
                0
            )
        );

        setText(
            dom.views,
            formatNumber(
                overview.views ??
                overview.total_views ??
                0
            )
        );


        setChange(
            dom.usersChange,
            overview.users_change
        );

        setChange(
            dom.mangasChange,
            overview.mangas_change
        );

        setChange(
            dom.chaptersChange,
            overview.chapters_change
        );

        setChange(
            dom.viewsChange,
            overview.views_change
        );

    }


    function renderReading(
        reading
    ){

        setText(
            dom.readingStarted,
            formatNumber(
                reading.started ??
                reading.started_count ??
                0
            )
        );

        setText(
            dom.readingCompleted,
            formatNumber(
                reading.completed ??
                reading.completed_count ??
                0
            )
        );

        setText(
            dom.readingTime,
            formatReadingTime(
                reading.time ??
                reading.total_time ??
                0
            )
        );

        setText(
            dom.completionRate,
            formatPercent(
                reading.completion_rate ??
                reading.completionRate ??
                0
            )
        );

    }


    function renderEngagement(
        engagement
    ){

        setText(
            dom.comments,
            formatNumber(
                engagement.comments ??
                0
            )
        );

        setText(
            dom.favorites,
            formatNumber(
                engagement.favorites ??
                0
            )
        );

        setText(
            dom.bookmarks,
            formatNumber(
                engagement.bookmarks ??
                0
            )
        );

        setText(
            dom.shares,
            formatNumber(
                engagement.shares ??
                0
            )
        );

    }


    function renderPerformance(
        performance
    ){

        setText(
            dom.newUsers,
            formatNumber(
                performance.new_users ??
                performance.newUsers ??
                0
            )
        );

        setText(
            dom.newMangas,
            formatNumber(
                performance.new_mangas ??
                performance.newMangas ??
                0
            )
        );

        setText(
            dom.averageViews,
            formatNumber(
                performance.average_views ??
                performance.averageViews ??
                0
            )
        );

        setText(
            dom.averageReadingTime,
            formatReadingTime(
                performance.average_reading_time ??
                performance.averageReadingTime ??
                0
            )
        );

        setChange(
            dom.newUsersChange,
            performance.new_users_change
        );

        setChange(
            dom.newMangasChange,
            performance.new_mangas_change
        );

    }


    function handleMetricChange(
        event
    ){

        state.metric =
            event.target.value ||
            "users";

        if(
            state.data &&
            state.data.activity
        ){

            renderActivityChart(
                state.data.activity
            );

        }
        else{

            loadStatistics();

        }

    }


    function changeRange(
        value
    ){

        const range =
            Number(value);

        if(
            !Number.isFinite(range) ||
            range <= 0
        ){

            return;

        }

        state.range =
            range;

        document
            .querySelectorAll(
                ".range-button"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        String(
                            button.dataset.range
                        ) ===
                        String(range)
                    );

                }
            );

        loadStatistics();

    }


    function refreshStatistics(){

        loadStatistics();

    }


    function setLoadingState(
        loading
    ){

        if(dom.refresh){

            dom.refresh.disabled =
                loading;

            dom.refresh.classList.toggle(
                "is-loading",
                loading
            );

        }

        if(dom.retry){

            dom.retry.disabled =
                loading;

        }

    }
    
        function renderTopMangas(
        mangas
    ){

        if(!dom.topManga){

            return;

        }

        if(
            !Array.isArray(mangas) ||
            mangas.length === 0
        ){

            dom.topManga.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="book-open"></i>
                    <h3>Aucune donnée</h3>
                    <p>Aucun manga n'a encore enregistré d'activité.</p>
                </div>
            `;

            initializeIcons();

            return;

        }

        dom.topManga.innerHTML =
            mangas
                .slice(0,10)
                .map(
                    (manga,index) =>
                        createMangaRankingItem(
                            manga,
                            index
                        )
                )
                .join("");

    }


    function createMangaRankingItem(
        manga,
        index
    ){

        const title =
            escapeHtml(
                manga.title ||
                manga.name ||
                "Manga"
            );

        const cover =
            escapeHtml(
                manga.cover ||
                manga.image ||
                "assets/default-manga.png"
            );

        const value =
            Number(
                manga.views ??
                manga.reads ??
                manga.readings ??
                0
            );

        return `
            <div class="ranking-item">

                <div class="ranking-position">
                    ${index + 1}
                </div>

                <img
                    src="${cover}"
                    alt=""
                    class="ranking-avatar"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='assets/default-manga.png';">

                <div class="ranking-info">

                    <strong>
                        ${title}
                    </strong>

                    <span>
                        ${formatNumber(value)} lectures
                    </span>

                </div>

                <strong class="ranking-value">
                    ${formatNumber(value)}
                </strong>

            </div>
        `;

    }


    function renderTopUsers(
        users
    ){

        if(!dom.topUsers){

            return;

        }

        if(
            !Array.isArray(users) ||
            users.length === 0
        ){

            dom.topUsers.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="users"></i>
                    <h3>Aucune donnée</h3>
                    <p>Aucune activité utilisateur disponible.</p>
                </div>
            `;

            initializeIcons();

            return;

        }

        dom.topUsers.innerHTML =
            users
                .slice(0,10)
                .map(
                    (user,index) =>
                        createUserRankingItem(
                            user,
                            index
                        )
                )
                .join("");

    }


    function createUserRankingItem(
        user,
        index
    ){

        const name =
            escapeHtml(
                user.name ||
                user.username ||
                "Utilisateur"
            );

        const avatar =
            escapeHtml(
                user.avatar ||
                user.photo ||
                "assets/default-avatar.png"
            );

        const activity =
            Number(
                user.activity ??
                user.reads ??
                user.views ??
                0
            );

        return `
            <div class="ranking-item">

                <div class="ranking-position">
                    ${index + 1}
                </div>

                <img
                    src="${avatar}"
                    alt=""
                    class="ranking-avatar"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='assets/default-avatar.png';">

                <div class="ranking-info">

                    <strong>
                        ${name}
                    </strong>

                    <span>
                        Activité utilisateur
                    </span>

                </div>

                <strong class="ranking-value">
                    ${formatNumber(activity)}
                </strong>

            </div>
        `;

    }


    function renderCategories(
        categories
    ){

        if(!dom.topCategories){

            return;

        }

        if(
            !Array.isArray(categories) ||
            categories.length === 0
        ){

            dom.topCategories.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="tags"></i>
                    <h3>Aucune catégorie</h3>
                    <p>Aucune donnée de catégorie disponible.</p>
                </div>
            `;

            initializeIcons();

            return;

        }

        const maximum =
            Math.max(
                ...categories.map(
                    category =>
                        Number(
                            category.value ??
                            category.count ??
                            category.views ??
                            0
                        )
                ),
                1
            );

        dom.topCategories.innerHTML =
            categories
                .slice(0,10)
                .map(
                    category => {

                        const name =
                            escapeHtml(
                                category.name ||
                                category.title ||
                                "Catégorie"
                            );

                        const value =
                            Number(
                                category.value ??
                                category.count ??
                                category.views ??
                                0
                            );

                        const percentage =
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    (value / maximum) *
                                    100
                                )
                            );

                        return `
                            <div class="category-item">

                                <div class="category-header">

                                    <span>
                                        ${name}
                                    </span>

                                    <strong>
                                        ${formatNumber(value)}
                                    </strong>

                                </div>

                                <div class="category-progress">

                                    <div
                                        class="category-progress-bar"
                                        style="width:${percentage}%">
                                    </div>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    function renderRecentActivity(
        activities
    ){

        if(!dom.recentActivity){

            return;

        }

        if(
            !Array.isArray(activities) ||
            activities.length === 0
        ){

            dom.recentActivity.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="loading-row">
                        Aucune activité récente.
                    </td>
                </tr>
            `;

            return;

        }

        dom.recentActivity.innerHTML =
            activities
                .slice(0,20)
                .map(
                    activity =>
                        createActivityRow(
                            activity
                        )
                )
                .join("");

    }


    function createActivityRow(
        activity
    ){

        const name =
            escapeHtml(
                activity.user_name ||
                activity.username ||
                activity.user?.name ||
                "Utilisateur"
            );

        const avatar =
            escapeHtml(
                activity.user_avatar ||
                activity.avatar ||
                activity.user?.avatar ||
                "assets/default-avatar.png"
            );

        const action =
            escapeHtml(
                activity.action ||
                activity.type ||
                "Activité"
            );

        const content =
            escapeHtml(
                activity.content ||
                activity.content_title ||
                activity.manga_title ||
                "-"
            );

        const date =
            formatDate(
                activity.created_at ||
                activity.date
            );

        return `
            <tr>

                <td>

                    <div class="activity-user">

                        <img
                            src="${avatar}"
                            alt=""
                            class="activity-avatar"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='assets/default-avatar.png';">

                        <div class="activity-user-info">

                            <strong>
                                ${name}
                            </strong>

                            <span>
                                Utilisateur
                            </span>

                        </div>

                    </div>

                </td>

                <td>

                    <span class="activity-action">

                        <i data-lucide="activity"></i>

                        ${action}

                    </span>

                </td>

                <td>

                    <div class="activity-content">
                        ${content}
                    </div>

                </td>

                <td>
                    ${date}
                </td>

            </tr>
        `;

    }


    function renderActivityChart(
        activity
    ){

        if(!dom.activityChart){

            return;

        }

        const labels =
            Array.isArray(
                activity.labels
            )
                ? activity.labels
                : [];

        const datasets =
            getActivityDataset(
                activity
            );

        if(
            typeof Chart ===
            "undefined"
        ){

            renderChartFallback(
                dom.activityChart,
                "Graphique indisponible."
            );

            return;

        }

        if(activityChart){

            activityChart.destroy();

        }

        activityChart =
            new Chart(
                dom.activityChart.getContext(
                    "2d"
                ),
                {

                    type:"line",

                    data:{

                        labels,

                        datasets:[

                            {

                                label:
                                    getMetricLabel(),

                                data:
                                    datasets,

                                borderColor:
                                    "#E11D2E",

                                backgroundColor:
                                    "rgba(225,29,46,.12)",

                                borderWidth:2,

                                fill:true,

                                tension:.35,

                                pointRadius:3,

                                pointHoverRadius:5,

                                pointBackgroundColor:
                                    "#E11D2E",

                                pointBorderColor:
                                    "#171717"

                            }

                        ]

                    },

                    options:{

                        responsive:true,

                        maintainAspectRatio:false,

                        interaction:{

                            mode:"index",

                            intersect:false

                        },

                        plugins:{

                            legend:{

                                display:false

                            }

                        },

                        scales:{

                            x:{

                                grid:{

                                    color:
                                        "rgba(255,255,255,.05)"

                                },

                                ticks:{

                                    color:"#A1A1AA"

                                }

                            },

                            y:{

                                beginAtZero:true,

                                grid:{

                                    color:
                                        "rgba(255,255,255,.05)"

                                },

                                ticks:{

                                    color:"#A1A1AA",

                                    precision:0

                                }

                            }

                        }

                    }

                }
            );

    }


    function getActivityDataset(
        activity
    ){

        const keyMap = {

            users:
                [
                    "users",
                    "user_count"
                ],

            views:
                [
                    "views",
                    "view_count"
                ],

            reading:
                [
                    "reading",
                    "readings",
                    "reading_count"
                ]

        };

        const keys =
            keyMap[state.metric] ||
            keyMap.users;

        for(
            const key of keys
        ){

            if(
                Array.isArray(
                    activity[key]
                )
            ){

                return activity[key];

            }

        }

        return [];

    }


    function getMetricLabel(){

        const labels = {

            users:
                "Utilisateurs",

            views:
                "Vues",

            reading:
                "Lectures"

        };

        return labels[
            state.metric
        ] || "Activité";

    }
    
        function renderContentChart(
        content
    ){

        if(!dom.contentChart){

            return;

        }

        if(
            typeof Chart ===
            "undefined"
        ){

            renderChartFallback(
                dom.contentChart,
                "Graphique indisponible."
            );

            return;

        }

        const labels =
            Array.isArray(
                content.labels
            )
                ? content.labels
                : [];

        const values =
            Array.isArray(
                content.values
            )
                ? content.values
                : [];

        if(contentChart){

            contentChart.destroy();

        }

        contentChart =
            new Chart(
                dom.contentChart.getContext(
                    "2d"
                ),
                {

                    type:"doughnut",

                    data:{

                        labels,

                        datasets:[

                            {

                                data:values,

                                backgroundColor:[
                                    "#E11D2E",
                                    "#7C3AED",
                                    "#2563EB",
                                    "#16A34A",
                                    "#D97706",
                                    "#0891B2",
                                    "#DB2777"
                                ],

                                borderColor:
                                    "#171717",

                                borderWidth:3

                            }

                        ]

                    },

                    options:{

                        responsive:true,

                        maintainAspectRatio:false,

                        cutout:"68%",

                        plugins:{

                            legend:{

                                position:"bottom",

                                labels:{

                                    color:"#A1A1AA",

                                    usePointStyle:true,

                                    pointStyle:"circle",

                                    padding:16,

                                    font:{

                                        family:
                                            "Poppins",

                                        size:11

                                    }

                                }

                            }

                        }

                    }

                }
            );

    }


    function renderChartFallback(
        canvas,
        message
    ){

        if(!canvas){

            return;

        }

        const container =
            canvas.parentElement;

        if(!container){

            return;

        }

        canvas.style.display =
            "none";

        container.classList.add(
            "is-empty"
        );

        let fallback =
            container.querySelector(
                ".chart-fallback"
            );

        if(!fallback){

            fallback =
                document.createElement(
                    "div"
                );

            fallback.className =
                "chart-fallback";

            container.appendChild(
                fallback
            );

        }

        fallback.textContent =
            message;

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


    function setChange(
        element,
        value
    ){

        if(!element){

            return;

        }

        const number =
            Number(value);

        if(
            !Number.isFinite(number)
        ){

            element.textContent =
                "0%";

            element.className =
                "stat-neutral";

            return;

        }

        const sign =
            number > 0
                ? "+"
                : "";

        element.textContent =
            `${sign}${formatPercent(number)} sur la période`;

        element.classList.remove(
            "stat-positive",
            "stat-negative",
            "stat-neutral"
        );

        if(number > 0){

            element.classList.add(
                "stat-positive"
            );

        }
        else if(number < 0){

            element.classList.add(
                "stat-negative"
            );

        }
        else{

            element.classList.add(
                "stat-neutral"
            );

        }

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
            "fr-FR"
        );

    }


    function formatPercent(
        value
    ){

        const number =
            Number(value);

        if(
            !Number.isFinite(number)
        ){

            return "0%";

        }

        return `${number.toLocaleString(
            "fr-FR",
            {
                maximumFractionDigits:1
            }
        )}%`;

    }


    function formatReadingTime(
        value
    ){

        const minutes =
            Number(value);

        if(
            !Number.isFinite(minutes) ||
            minutes <= 0
        ){

            return "0 min";

        }

        if(minutes < 60){

            return `${Math.round(
                minutes
            )} min`;

        }

        const hours =
            Math.floor(
                minutes / 60
            );

        const remaining =
            Math.round(
                minutes % 60
            );

        if(!remaining){

            return `${hours} h`;

        }

        return `${hours} h ${remaining} min`;

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


    function handleVisibilityChange(){

        if(document.hidden){

            stopAutoRefresh();

            return;

        }

        loadStatistics();

        startAutoRefresh();

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

                        loadStatistics();

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

        if(activityChart){

            activityChart.destroy();

            activityChart =
                null;

        }

        if(contentChart){

            contentChart.destroy();

            contentChart =
                null;

        }

        state.initialized =
            false;

    }


    return {

        initialize,

        destroy,

        refresh:
            refreshStatistics

    };

})();


window.initializeStatisticsPage =
    function(){

        StatisticsModule.initialize();

    };