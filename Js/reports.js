/*==================================
MANGA GALLERY
ADMIN REPORTS
VERSION FINALE
==================================*/

"use strict";

const ReportsModule = (() => {

    const state = {

        reports: [],

        page: 1,

        limit: 20,

        total: 0,

        totalPages: 1,

        search: "",

        type: "",

        status: "",

        severity: "",

        selectedId: null,

        pendingAction: null,

        loading: false,

        controller: null,

        searchTimer: null,

        refreshTimer: null,

        initialized: false

    };


    const dom = {

        tableBody:
            document.getElementById(
                "reports-table-body"
            ),

        reportCount:
            document.getElementById(
                "report-count"
            ),

        totalReports:
            document.getElementById(
                "total-reports"
            ),

        pendingReports:
            document.getElementById(
                "pending-reports"
            ),

        reviewingReports:
            document.getElementById(
                "reviewing-reports"
            ),

        resolvedReports:
            document.getElementById(
                "resolved-reports"
            ),

        search:
            document.getElementById(
                "search-report"
            ),

        typeFilter:
            document.getElementById(
                "report-type-filter"
            ),

        statusFilter:
            document.getElementById(
                "report-status-filter"
            ),

        severityFilter:
            document.getElementById(
                "report-severity-filter"
            ),

        refreshButton:
            document.getElementById(
                "refresh-reports"
            ),

        exportButton:
            document.getElementById(
                "export-reports"
            ),

        pagination:
            document.querySelector(
                ".pagination"
            ),

        previousPage:
            document.getElementById(
                "previous-report-page"
            ),

        nextPage:
            document.getElementById(
                "next-report-page"
            ),

        paginationInfo:
            document.getElementById(
                "report-pagination-info"
            ),

        modal:
            document.getElementById(
                "report-modal"
            ),

        closeModal:
            document.getElementById(
                "close-report-modal"
            ),

        modalSubtitle:
            document.getElementById(
                "report-modal-subtitle"
            ),

        detailTitle:
            document.getElementById(
                "detail-report-title"
            ),

        detailType:
            document.getElementById(
                "detail-report-type"
            ),

        detailSeverity:
            document.getElementById(
                "detail-report-severity"
            ),

        detailStatus:
            document.getElementById(
                "detail-report-status"
            ),

        detailUser:
            document.getElementById(
                "detail-report-user"
            ),

        detailDate:
            document.getElementById(
                "detail-report-date"
            ),

        detailReason:
            document.getElementById(
                "detail-report-reason"
            ),

        detailDescription:
            document.getElementById(
                "detail-report-description"
            ),

        detailContentContainer:
            document.getElementById(
                "detail-report-content-container"
            ),

        detailContent:
            document.getElementById(
                "detail-report-content"
            ),

        reviewButton:
            document.getElementById(
                "review-report"
            ),

        resolveButton:
            document.getElementById(
                "resolve-report"
            ),

        rejectButton:
            document.getElementById(
                "reject-report"
            ),

        confirmModal:
            document.getElementById(
                "report-confirm-modal"
            ),

        confirmMessage:
            document.getElementById(
                "report-confirm-message"
            ),

        cancelAction:
            document.getElementById(
                "cancel-report-action"
            ),

        confirmAction:
            document.getElementById(
                "confirm-report-action"
            )

    };


    function initialize(){

        if(state.initialized){

            return;

        }

        state.initialized = true;

        bindEvents();

        initializeIcons();

        loadReports();

        loadStatistics();

        startAutoRefresh();

    }


    function bindEvents(){

        dom.refreshButton?.addEventListener(
            "click",
            refreshReports
        );

        dom.exportButton?.addEventListener(
            "click",
            exportReports
        );

        dom.search?.addEventListener(
            "input",
            handleSearch
        );

        dom.typeFilter?.addEventListener(
            "change",
            handleFilters
        );

        dom.statusFilter?.addEventListener(
            "change",
            handleFilters
        );

        dom.severityFilter?.addEventListener(
            "change",
            handleFilters
        );

        dom.previousPage?.addEventListener(
            "click",
            previousPage
        );

        dom.nextPage?.addEventListener(
            "click",
            nextPage
        );

        dom.closeModal?.addEventListener(
            "click",
            closeReportModal
        );

        dom.reviewButton?.addEventListener(
            "click",
            () => requestAction("reviewing")
        );

        dom.resolveButton?.addEventListener(
            "click",
            () => requestAction("resolved")
        );

        dom.rejectButton?.addEventListener(
            "click",
            () => requestAction("rejected")
        );

        dom.cancelAction?.addEventListener(
            "click",
            closeConfirmModal
        );

        dom.confirmAction?.addEventListener(
            "click",
            executePendingAction
        );

        dom.modal?.addEventListener(
            "click",
            handleModalClick
        );

        dom.confirmModal?.addEventListener(
            "click",
            handleConfirmModalClick
        );

        document.addEventListener(
            "keydown",
            handleKeyboard
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


    async function loadReports(){

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
                await requestReports(
                    state.controller.signal
                );

            const result =
                normalizeReportsResponse(
                    response
                );

            state.reports =
                result.items;

            state.total =
                result.total;

            state.totalPages =
                Math.max(
                    1,
                    result.pages
                );

            if(
                state.page >
                state.totalPages
            ){

                state.page =
                    state.totalPages;

                state.loading = false;

                return loadReports();

            }

            renderReports();

            updateCounter();

            updatePagination();

        }
        catch(error){

            if(
                error?.name ===
                "AbortError"
            ){

                return;

            }

            renderErrorState();

            showToastMessage(
                "Impossible de charger les signalements.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function requestReports(signal){

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

            "/api/reports",

            {

                page:
                    state.page,

                limit:
                    state.limit,

                search:
                    state.search,

                type:
                    state.type,

                status:
                    state.status,

                severity:
                    state.severity

            },

            {

                signal

            }

        );

    }


    function normalizeReportsResponse(
        response
    ){

        const source =
            response?.data ??
            response?.reports ??
            response ??
            {};

        const items =
            Array.isArray(source)
                ? source
                : Array.isArray(
                    source.items
                )
                    ? source.items
                    : [];

        const total =
            Number(
                response?.total ??
                source?.total ??
                items.length
            );

        const pages =
            Number(
                response?.pages ??
                source?.pages ??
                Math.ceil(
                    total /
                    state.limit
                )
            );

        return {

            items,

            total:
                Number.isFinite(total)
                    ? total
                    : items.length,

            pages:
                Number.isFinite(pages) &&
                pages > 0
                    ? pages
                    : 1

        };

    }


    async function loadStatistics(){

        if(
            !window.API ||
            typeof window.API.get !==
            "function"
        ){

            return;

        }

        try{

            const response =
                await window.API.get(
                    "/api/reports/statistics"
                );

            const statistics =
                response?.data ??
                response ??
                {};

            updateStatistics(
                statistics
            );

        }
        catch{

            updateStatisticsFromReports();

        }

    }


    function updateStatistics(
        statistics
    ){

        const total =
            Number(
                statistics.total ??
                0
            );

        const pending =
            Number(
                statistics.pending ??
                0
            );

        const reviewing =
            Number(
                statistics.reviewing ??
                0
            );

        const resolved =
            Number(
                statistics.resolved ??
                0
            );

        setText(
            dom.totalReports,
            formatNumber(total)
        );

        setText(
            dom.pendingReports,
            formatNumber(pending)
        );

        setText(
            dom.reviewingReports,
            formatNumber(reviewing)
        );

        setText(
            dom.resolvedReports,
            formatNumber(resolved)
        );

    }


    function updateStatisticsFromReports(){

        const reports =
            Array.isArray(
                state.reports
            )
                ? state.reports
                : [];

        const countStatus =
            status =>
                reports.filter(
                    report =>
                        String(
                            report.status ||
                            ""
                        ).toLowerCase() ===
                        status
                ).length;

        setText(
            dom.totalReports,
            formatNumber(
                state.total
            )
        );

        setText(
            dom.pendingReports,
            formatNumber(
                countStatus(
                    "pending"
                )
            )
        );

        setText(
            dom.reviewingReports,
            formatNumber(
                countStatus(
                    "reviewing"
                )
            )
        );

        setText(
            dom.resolvedReports,
            formatNumber(
                countStatus(
                    "resolved"
                )
            )
        );

    }


    function updateCounter(){

        if(!dom.reportCount){

            return;

        }

        const total =
            Number.isFinite(
                state.total
            )
                ? state.total
                : 0;

        dom.reportCount.textContent =
            `${formatNumber(total)}
            signalement${
                total > 1
                    ? "s"
                    : ""
            }`;

    }


    function updatePagination(){

        if(!dom.pagination){

            return;

        }

        if(state.totalPages <= 1){

            dom.pagination.style.display =
                "none";

            return;

        }

        dom.pagination.style.display =
            "flex";

        setText(
            dom.paginationInfo,
            `Page ${state.page} sur ${state.totalPages}`
        );

        if(dom.previousPage){

            dom.previousPage.disabled =
                state.page <= 1;

        }

        if(dom.nextPage){

            dom.nextPage.disabled =
                state.page >=
                state.totalPages;

        }

    }


    function handleSearch(event){

        state.search =
            event.target.value
                .trim();

        state.page = 1;

        clearTimeout(
            state.searchTimer
        );

        state.searchTimer =
            setTimeout(
                () => {

                    loadReports();

                },
                350
            );

    }


    function handleFilters(){

        state.type =
            dom.typeFilter?.value ||
            "";

        state.status =
            dom.statusFilter?.value ||
            "";

        state.severity =
            dom.severityFilter?.value ||
            "";

        state.page = 1;

        loadReports();

    }


    function previousPage(){

        if(
            state.loading ||
            state.page <= 1
        ){

            return;

        }

        state.page--;

        loadReports();

    }


    function nextPage(){

        if(
            state.loading ||
            state.page >=
            state.totalPages
        ){

            return;

        }

        state.page++;

        loadReports();

    }


    function refreshReports(){

        loadReports();

        loadStatistics();

    }


    function setLoadingState(
        loading
    ){

        if(
            dom.refreshButton
        ){

            dom.refreshButton.disabled =
                loading;

        }

    }


    function abortRequest(){

        if(state.controller){

            state.controller.abort();

            state.controller = null;

        }

    }
    
        function renderReports(){

        if(!dom.tableBody){

            return;

        }

        if(
            !Array.isArray(state.reports) ||
            state.reports.length === 0
        ){

            dom.tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="loading-row">
                        Aucun signalement trouvé.
                    </td>
                </tr>
            `;

            return;

        }

        dom.tableBody.innerHTML =
            state.reports
                .map(
                    report =>
                        createReportRow(report)
                )
                .join("");

        bindReportActions();

        initializeIcons();

    }


    function createReportRow(report){

        const id =
            escapeHtml(
                report.id
            );

        const title =
            escapeHtml(
                report.title ||
                report.reason ||
                "Signalement"
            );

        const description =
            escapeHtml(
                report.description ||
                ""
            );

        const userName =
            escapeHtml(
                report.user_name ||
                report.username ||
                report.user?.name ||
                "Utilisateur"
            );

        const userId =
            escapeHtml(
                report.user_id ||
                report.user?.id ||
                ""
            );

        const avatar =
            escapeHtml(
                report.user_avatar ||
                report.avatar ||
                report.user?.avatar ||
                "assets/default-avatar.png"
            );

        const type =
            String(
                report.type ||
                "other"
            ).toLowerCase();

        const severity =
            String(
                report.severity ||
                "medium"
            ).toLowerCase();

        const status =
            String(
                report.status ||
                "pending"
            ).toLowerCase();

        const date =
            formatDate(
                report.created_at ||
                report.createdAt ||
                report.date
            );

        return `
            <tr data-id="${id}">

                <td>

                    <div class="report-title">

                        <strong>
                            ${title}
                        </strong>

                        <span>
                            ${description}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="report-user">

                        <img
                            src="${avatar}"
                            alt=""
                            class="report-user-avatar"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='assets/default-avatar.png';">

                        <div class="report-user-info">

                            <strong>
                                ${userName}
                            </strong>

                            <span>
                                ${userId}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="report-type ${type}">
                        ${formatType(type)}
                    </span>

                </td>


                <td>

                    <span
                        class="report-severity ${severity}">
                        ${formatSeverity(severity)}
                    </span>

                </td>


                <td>

                    <span
                        class="report-status ${status}">
                        ${formatStatus(status)}
                    </span>

                </td>


                <td>
                    ${date}
                </td>


                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="action-btn view-report"
                            data-id="${id}"
                            aria-label="Voir le signalement">

                            <i data-lucide="eye"></i>

                        </button>

                    </div>

                </td>

            </tr>
        `;

    }


    function bindReportActions(){

        document
            .querySelectorAll(
                ".view-report"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openReport(
                                button.dataset.id
                            );

                        }
                    );

                }
            );

    }


    function openReport(id){

        const report =
            state.reports.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if(!report){

            showToastMessage(
                "Signalement introuvable.",
                "error"
            );

            return;

        }

        state.selectedId =
            report.id;

        fillReportDetails(
            report
        );

        updateActionButtons(
            report.status
        );

        openReportModal();

    }


    function fillReportDetails(report){

        setText(
            dom.detailTitle,
            report.title ||
            report.reason ||
            "Signalement"
        );

        setText(
            dom.detailType,
            formatType(
                report.type
            )
        );

        setText(
            dom.detailSeverity,
            formatSeverity(
                report.severity
            )
        );

        setText(
            dom.detailStatus,
            formatStatus(
                report.status
            )
        );

        setText(
            dom.detailUser,
            report.user_name ||
            report.username ||
            report.user?.name ||
            "Utilisateur"
        );

        setText(
            dom.detailDate,
            formatDate(
                report.created_at ||
                report.createdAt ||
                report.date
            )
        );

        setText(
            dom.detailReason,
            report.reason ||
            "-"
        );

        setText(
            dom.detailDescription,
            report.description ||
            "-"
        );


        const content =
            report.reported_content ||
            report.content ||
            report.content_text ||
            report.comment?.content ||
            "";


        if(
            content &&
            dom.detailContentContainer
        ){

            dom.detailContentContainer
                .classList
                .remove(
                    "hidden"
                );

            if(dom.detailContent){

                dom.detailContent.textContent =
                    content;

            }

        }
        else if(
            dom.detailContentContainer
        ){

            dom.detailContentContainer
                .classList
                .add(
                    "hidden"
                );

        }


        if(dom.modalSubtitle){

            dom.modalSubtitle.textContent =
                `Signalement #${report.id}`;

        }

    }


    function updateActionButtons(
        status
    ){

        const normalized =
            String(
                status ||
                "pending"
            ).toLowerCase();


        if(dom.reviewButton){

            dom.reviewButton.style.display =
                normalized === "pending"
                    ? "inline-flex"
                    : "none";

        }


        if(dom.resolveButton){

            dom.resolveButton.style.display =
                [
                    "pending",
                    "reviewing"
                ].includes(
                    normalized
                )
                    ? "inline-flex"
                    : "none";

        }


        if(dom.rejectButton){

            dom.rejectButton.style.display =
                [
                    "pending",
                    "reviewing"
                ].includes(
                    normalized
                )
                    ? "inline-flex"
                    : "none";

        }

    }


    function requestAction(action){

        if(!state.selectedId){

            showToastMessage(
                "Aucun signalement sélectionné.",
                "warning"
            );

            return;

        }

        const labels = {

            reviewing:
                "mettre ce signalement en examen",

            resolved:
                "résoudre ce signalement",

            rejected:
                "rejeter ce signalement"

        };

        state.pendingAction = action;

        if(dom.confirmMessage){

            dom.confirmMessage.textContent =
                `Voulez-vous vraiment ${
                    labels[action] ||
                    "effectuer cette action"
                } ?`;

        }

        openConfirmModal();

    }


    async function executePendingAction(){

        if(
            !state.selectedId ||
            !state.pendingAction ||
            state.loading
        ){

            return;

        }

        const id =
            state.selectedId;

        const action =
            state.pendingAction;

        state.loading = true;

        setActionLoading(true);

        try{

            await updateReportStatus(
                id,
                action
            );

            showToastMessage(
                getActionSuccessMessage(
                    action
                ),
                "success"
            );

            closeConfirmModal();

            closeReportModal();

            await Promise.all([
                loadReports(),
                loadStatistics()
            ]);

        }
        catch(error){

            showToastMessage(
                error?.message ||
                "Impossible de modifier le signalement.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setActionLoading(false);

            state.pendingAction =
                null;

        }

    }


    async function updateReportStatus(
        id,
        status
    ){

        if(
            !window.API ||
            typeof window.API.patch !==
            "function"
        ){

            if(
                typeof window.API?.put !==
                "function"
            ){

                throw new Error(
                    "API indisponible."
                );

            }

            return window.API.put(

                `/api/reports/${encodeURIComponent(
                    id
                )}`,

                {
                    status
                }

            );

        }

        return window.API.patch(

            `/api/reports/${encodeURIComponent(
                id
            )}`,

            {
                status
            }

        );

    }


    function setActionLoading(
        loading
    ){

        const buttons = [

            dom.reviewButton,
            dom.resolveButton,
            dom.rejectButton,
            dom.cancelAction,
            dom.confirmAction

        ];

        buttons.forEach(
            button => {

                if(button){

                    button.disabled =
                        loading;

                }

            }
        );


        if(dom.confirmAction){

            dom.confirmAction.textContent =
                loading
                    ? "Traitement..."
                    : "Confirmer";

        }

    }


    function openReportModal(){

        if(!dom.modal){

            return;

        }

        dom.modal.classList.remove(
            "hidden"
        );

        dom.modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        requestAnimationFrame(
            () => {

                dom.closeModal?.focus();

            }
        );

    }


    function closeReportModal(){

        if(!dom.modal){

            return;

        }

        dom.modal.classList.add(
            "hidden"
        );

        dom.modal.setAttribute(
            "aria-hidden",
            "true"
        );

        state.selectedId =
            null;

        document.body.classList.remove(
            "modal-open"
        );

    }


    function openConfirmModal(){

        if(!dom.confirmModal){

            return;

        }

        dom.confirmModal.classList.remove(
            "hidden"
        );

        dom.confirmModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        requestAnimationFrame(
            () => {

                dom.cancelAction?.focus();

            }
        );

    }


    function closeConfirmModal(){

        if(!dom.confirmModal){

            return;

        }

        dom.confirmModal.classList.add(
            "hidden"
        );

        dom.confirmModal.setAttribute(
            "aria-hidden",
            "true"
        );

        state.pendingAction =
            null;

        document.body.classList.remove(
            "modal-open"
        );

    }


    function handleModalClick(
        event
    ){

        if(
            event.target ===
            dom.modal
        ){

            closeReportModal();

        }

    }


    function handleConfirmModalClick(
        event
    ){

        if(
            event.target ===
            dom.confirmModal
        ){

            closeConfirmModal();

        }

    }


    function handleKeyboard(
        event
    ){

        if(
            event.key !==
            "Escape"
        ){

            return;

        }

        if(
            dom.confirmModal &&
            !dom.confirmModal.classList.contains(
                "hidden"
            )
        ){

            closeConfirmModal();

            return;

        }

        if(
            dom.modal &&
            !dom.modal.classList.contains(
                "hidden"
            )
        ){

            closeReportModal();

        }

    }


    function exportReports(){

        if(
            !Array.isArray(
                state.reports
            ) ||
            state.reports.length === 0
        ){

            showToastMessage(
                "Aucun signalement à exporter.",
                "warning"
            );

            return;

        }

        const headers = [

            "ID",
            "Titre",
            "Utilisateur",
            "Type",
            "Gravité",
            "Statut",
            "Date"

        ];

        const rows =
            state.reports.map(
                report => [

                    report.id ?? "",

                    report.title ||
                    report.reason ||
                    "",

                    report.user_name ||
                    report.username ||
                    "",

                    formatType(
                        report.type
                    ),

                    formatSeverity(
                        report.severity
                    ),

                    formatStatus(
                        report.status
                    ),

                    formatDate(
                        report.created_at ||
                        report.createdAt ||
                        report.date
                    )

                ]
            );

        const csv = [

            headers,

            ...rows

        ]
            .map(
                row =>
                    row
                        .map(
                            value =>
                                csvEscape(
                                    value
                                )
                        )
                        .join(",")
            )
            .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            `manga-gallery-signalements-${getExportDate()}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        showToastMessage(
            "Export terminé.",
            "success"
        );

    }


    function csvEscape(value){

        const text =
            String(
                value ?? ""
            );

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    function getExportDate(){

        const date =
            new Date();

        const pad =
            value =>
                String(value)
                    .padStart(
                        2,
                        "0"
                    );

        return [

            date.getFullYear(),

            pad(
                date.getMonth() + 1
            ),

            pad(
                date.getDate()
            )

        ].join("-");

    }
    
        function getActionSuccessMessage(action){

        const messages = {

            reviewing:
                "Signalement mis en examen.",

            resolved:
                "Signalement résolu.",

            rejected:
                "Signalement rejeté."

        };

        return messages[action] ||
            "Action effectuée.";

    }


    function formatType(type){

        const types = {

            comment:
                "Commentaire",

            manga:
                "Manga",

            user:
                "Utilisateur",

            content:
                "Contenu",

            other:
                "Autre"

        };

        return types[
            String(
                type ||
                "other"
            ).toLowerCase()
        ] || "Autre";

    }


    function formatSeverity(
        severity
    ){

        const severities = {

            low:
                "Faible",

            medium:
                "Moyenne",

            high:
                "Élevée",

            critical:
                "Critique"

        };

        return severities[
            String(
                severity ||
                "medium"
            ).toLowerCase()
        ] || "Moyenne";

    }


    function formatStatus(
        status
    ){

        const statuses = {

            pending:
                "En attente",

            reviewing:
                "En examen",

            resolved:
                "Résolu",

            rejected:
                "Rejeté"

        };

        return statuses[
            String(
                status ||
                "pending"
            ).toLowerCase()
        ] || "En attente";

    }


    function formatDate(value){

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


    function formatNumber(value){

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


    function setText(
        element,
        value
    ){

        if(element){

            element.textContent =
                value ?? "";

        }

    }


    function escapeHtml(value){

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


    function renderErrorState(){

        if(!dom.tableBody){

            return;

        }

        dom.tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="loading-row">
                    Impossible de charger les signalements.
                </td>
            </tr>
        `;

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

        loadReports();

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

                        loadReports();

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


    function destroy(){

        stopAutoRefresh();

        clearTimeout(
            state.searchTimer
        );

        abortRequest();

        state.initialized =
            false;

    }


    return {

        initialize,

        destroy,

        refresh:
            refreshReports

    };

})();


window.initializeReportsPage =
    function(){

        ReportsModule.initialize();

    };