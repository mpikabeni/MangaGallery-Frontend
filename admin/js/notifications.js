/*==================================
MANGA GALLERY
ADMIN NOTIFICATIONS
VERSION FINALE
==================================*/

"use strict";

const NotificationsModule = (() => {

    const state = {

        notifications: [],

        page: 1,

        limit: 20,

        total: 0,

        totalPages: 1,

        search: "",

        type: "",

        status: "",

        loading: false,

        editingId: null,

        controller: null,

        refreshTimer: null,

        searchTimer: null,

        initialized: false

    };


    const dom = {

        tableBody:
            document.getElementById(
                "notifications-table-body"
            ),

        notificationCount:
            document.getElementById(
                "notification-count"
            ),

        pagination:
            document.querySelector(
                ".pagination"
            ),

        paginationInfo:
            document.getElementById(
                "pagination-info"
            ),

        previousPage:
            document.getElementById(
                "previous-page"
            ),

        nextPage:
            document.getElementById(
                "next-page"
            ),

        search:
            document.getElementById(
                "search-notification"
            ),

        typeFilter:
            document.getElementById(
                "type-filter"
            ),

        statusFilter:
            document.getElementById(
                "status-filter"
            ),

        refreshButton:
            document.getElementById(
                "refresh-notifications"
            ),

        addButton:
            document.getElementById(
                "add-notification"
            ),

        modal:
            document.getElementById(
                "notification-modal"
            ),

        modalTitle:
            document.getElementById(
                "notification-modal-title"
            ),

        closeModal:
            document.getElementById(
                "close-notification-modal"
            ),

        cancelButton:
            document.getElementById(
                "cancel-notification-button"
            ),

        scheduleButton:
            document.getElementById(
                "schedule-notification-button"
            ),

        sendButton:
            document.getElementById(
                "send-notification-button"
            ),

        form:
            document.getElementById(
                "notification-form"
            ),

        id:
            document.getElementById(
                "notification-id"
            ),

        title:
            document.getElementById(
                "notification-title"
            ),

        target:
            document.getElementById(
                "notification-target"
            ),

        type:
            document.getElementById(
                "notification-type"
            ),

        message:
            document.getElementById(
                "notification-message"
            ),

        priority:
            document.getElementById(
                "notification-priority"
            ),

        date:
            document.getElementById(
                "notification-date"
            ),

        link:
            document.getElementById(
                "notification-link"
            )

    };


    function initialize(){

        if(state.initialized){

            return;

        }

        state.initialized = true;

        bindEvents();

        initializeIcons();

        loadNotifications();

        startAutoRefresh();

    }


    function bindEvents(){

        dom.refreshButton?.addEventListener(
            "click",
            handleRefresh
        );


        dom.addButton?.addEventListener(
            "click",
            openCreateModal
        );


        dom.closeModal?.addEventListener(
            "click",
            closeModal
        );


        dom.cancelButton?.addEventListener(
            "click",
            closeModal
        );


        dom.modal?.addEventListener(
            "click",
            handleModalClick
        );


        dom.form?.addEventListener(
            "submit",
            handleSubmit
        );


        dom.scheduleButton?.addEventListener(
            "click",
            handleSchedule
        );


        dom.search?.addEventListener(
            "input",
            handleSearch
        );


        dom.typeFilter?.addEventListener(
            "change",
            handleFilterChange
        );


        dom.statusFilter?.addEventListener(
            "change",
            handleFilterChange
        );


        dom.previousPage?.addEventListener(
            "click",
            handlePreviousPage
        );


        dom.nextPage?.addEventListener(
            "click",
            handleNextPage
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


    async function loadNotifications(){

        if(state.loading){

            return;

        }

        state.loading = true;

        setLoadingState(true);

        abortPendingRequest();

        state.controller =
            new AbortController();

        try{

            const response =
                await requestNotifications(
                    state.controller.signal
                );

            const result =
                normalizeResponse(response);

            state.notifications =
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

                return loadNotifications();

            }

            renderNotifications();

            updateCounter();

            updatePagination();

        }
        catch(error){

            if(
                error &&
                error.name ===
                "AbortError"
            ){

                return;

            }

            renderErrorState();

            showToastMessage(
                "Impossible de charger les notifications.",
                "error"
            );

        }
        finally{

            state.loading = false;

            setLoadingState(false);

        }

    }


    async function requestNotifications(signal){

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

            "/api/notifications",

            {

                page: state.page,

                limit: state.limit,

                search: state.search,

                type: state.type,

                status: state.status

            },

            {

                signal

            }

        );

    }


    function normalizeResponse(response){

        const source =
            response?.data ??
            response?.notifications ??
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


    function setLoadingState(loading){

        if(!dom.refreshButton){

            return;

        }

        dom.refreshButton.disabled =
            loading;

        if(loading){

            dom.refreshButton.classList.add(
                "is-loading"
            );

        }
        else{

            dom.refreshButton.classList.remove(
                "is-loading"
            );

        }

    }


    function handleRefresh(){

        loadNotifications();

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
                () => loadNotifications(),
                350
            );

    }


    function handleFilterChange(){

        state.type =
            dom.typeFilter?.value ||
            "";

        state.status =
            dom.statusFilter?.value ||
            "";

        state.page = 1;

        loadNotifications();

    }


    function handlePreviousPage(){

        if(
            state.loading ||
            state.page <= 1
        ){

            return;

        }

        state.page--;

        loadNotifications();

    }


    function handleNextPage(){

        if(
            state.loading ||
            state.page >=
            state.totalPages
        ){

            return;

        }

        state.page++;

        loadNotifications();

    }


    function updateCounter(){

        if(!dom.notificationCount){

            return;

        }

        const count =
            Number.isFinite(
                state.total
            )
                ? state.total
                : 0;

        dom.notificationCount.textContent =
            `${count.toLocaleString(
                "fr-FR"
            )} notification${
                count > 1
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

        if(dom.paginationInfo){

            dom.paginationInfo.textContent =
                `Page ${state.page} sur ${state.totalPages}`;

        }

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


    function abortPendingRequest(){

        if(state.controller){

            state.controller.abort();

            state.controller = null;

        }

    }
    
        function renderNotifications(){

        if(!dom.tableBody){

            return;

        }

        if(
            !Array.isArray(
                state.notifications
            ) ||
            state.notifications.length === 0
        ){

            dom.tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="loading-row">
                        Aucune notification trouvée.
                    </td>
                </tr>
            `;

            return;

        }

        dom.tableBody.innerHTML =
            state.notifications
                .map(
                    notification =>
                        createNotificationRow(
                            notification
                        )
                )
                .join("");

        bindRowActions();

        initializeIcons();

    }


    function createNotificationRow(notification){

        const id =
            escapeHtml(
                notification.id
            );

        const title =
            escapeHtml(
                notification.title ||
                "Sans titre"
            );

        const target =
            escapeHtml(
                notification.target_name ||
                notification.target ||
                "Tous les utilisateurs"
            );

        const type =
            escapeHtml(
                notification.type ||
                "system"
            );

        const priority =
            escapeHtml(
                notification.priority ||
                "normal"
            );

        const status =
            escapeHtml(
                notification.status ||
                "pending"
            );

        const schedule =
            formatDate(
                notification.schedule_at ||
                notification.scheduled_at ||
                notification.created_at
            );

        return `
            <tr data-id="${id}">

                <td>
                    <div class="notification-title">
                        <strong>
                            ${title}
                        </strong>
                    </div>
                </td>

                <td>
                    ${target}
                </td>

                <td>
                    <span
                        class="type-badge type-${type}">
                        ${formatType(type)}
                    </span>
                </td>

                <td>
                    ${renderPriority(priority)}
                </td>

                <td>
                    <span
                        class="status ${status}">
                        ${formatStatus(status)}
                    </span>
                </td>

                <td>
                    ${schedule}
                </td>

                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="action-btn edit-notification"
                            data-id="${id}"
                            aria-label="Modifier la notification">

                            <i data-lucide="square-pen"></i>

                        </button>

                        <button
                            type="button"
                            class="action-btn resend-notification"
                            data-id="${id}"
                            aria-label="Renvoyer la notification">

                            <i data-lucide="send"></i>

                        </button>

                        <button
                            type="button"
                            class="action-btn delete-notification"
                            data-id="${id}"
                            aria-label="Supprimer la notification">

                            <i data-lucide="trash-2"></i>

                        </button>

                    </div>

                </td>

            </tr>
        `;

    }


    function bindRowActions(){

        const editButtons =
            document.querySelectorAll(
                ".edit-notification"
            );

        const resendButtons =
            document.querySelectorAll(
                ".resend-notification"
            );

        const deleteButtons =
            document.querySelectorAll(
                ".delete-notification"
            );


        editButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        openEditModal(id);

                    }
                );

            }
        );


        resendButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        resendNotification(id);

                    }
                );

            }
        );


        deleteButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        deleteNotification(id);

                    }
                );

            }
        );

    }


    function renderPriority(priority){

        switch(priority){

            case "urgent":

                return `
                    <span class="status failed">
                        Urgente
                    </span>
                `;

            case "important":

                return `
                    <span class="status pending">
                        Importante
                    </span>
                `;

            default:

                return `
                    <span class="status sent">
                        Normale
                    </span>
                `;

        }

    }


    function formatType(type){

        const types = {

            system:
                "Système",

            manga:
                "Manga",

            user:
                "Utilisateur",

            promotion:
                "Promotion",

            announcement:
                "Annonce"

        };

        return types[type] ||
            "Notification";

    }


    function formatStatus(status){

        const statuses = {

            sent:
                "Envoyée",

            pending:
                "En attente",

            failed:
                "Échec",

            draft:
                "Brouillon"

        };

        return statuses[status] ||
            "Inconnu";

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


    function openCreateModal(){

        state.editingId = null;

        resetForm();

        if(dom.modalTitle){

            dom.modalTitle.textContent =
                "Nouvelle notification";

        }

        openModal();

    }


    function openEditModal(id){

        const notification =
            state.notifications.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if(!notification){

            showToastMessage(
                "Notification introuvable.",
                "error"
            );

            return;

        }

        state.editingId =
            notification.id;

        if(dom.modalTitle){

            dom.modalTitle.textContent =
                "Modifier la notification";

        }

        if(dom.id){

            dom.id.value =
                notification.id || "";

        }

        if(dom.title){

            dom.title.value =
                notification.title || "";

        }

        if(dom.target){

            dom.target.value =
                notification.target || "all";

        }

        if(dom.type){

            dom.type.value =
                notification.type || "system";

        }

        if(dom.message){

            dom.message.value =
                notification.message || "";

        }

        if(dom.priority){

            dom.priority.value =
                notification.priority ||
                "normal";

        }

        if(dom.date){

            dom.date.value =
                normalizeDateTimeLocal(
                    notification.schedule_at ||
                    notification.scheduled_at
                );

        }

        if(dom.link){

            dom.link.value =
                notification.link || "";

        }

        openModal();

    }


    function openModal(){

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

                dom.title?.focus();

            }
        );

    }


    function closeModal(){

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

        document.body.classList.remove(
            "modal-open"
        );

        resetForm();

        state.editingId = null;

    }


    function handleModalClick(event){

        if(
            event.target ===
            dom.modal
        ){

            closeModal();

        }

    }


    function resetForm(){

        if(dom.form){

            dom.form.reset();

        }

        if(dom.id){

            dom.id.value = "";

        }

        if(dom.target){

            dom.target.value =
                "all";

        }

        if(dom.type){

            dom.type.value =
                "system";

        }

        if(dom.priority){

            dom.priority.value =
                "normal";

        }

        if(dom.date){

            dom.date.value = "";

        }

        if(dom.link){

            dom.link.value = "";

        }

    }
    
        async function handleSubmit(event){

        event.preventDefault();

        if(state.loading){

            return;

        }

        const payload =
            collectFormData();

        if(!validatePayload(payload)){

            return;

        }

        await saveNotification(
            payload,
            false
        );

    }


    async function handleSchedule(){

        if(state.loading){

            return;

        }

        const payload =
            collectFormData();

        if(!validatePayload(payload)){

            return;

        }

        if(!payload.schedule_at){

            showToastMessage(
                "Sélectionnez une date de programmation.",
                "warning"
            );

            dom.date?.focus();

            return;

        }

        await saveNotification(
            payload,
            true
        );

    }


    function collectFormData(){

        return {

            title:
                dom.title?.value
                    .trim() || "",

            target:
                dom.target?.value || "all",

            type:
                dom.type?.value || "system",

            message:
                dom.message?.value
                    .trim() || "",

            priority:
                dom.priority?.value ||
                "normal",

            schedule_at:
                dom.date?.value || "",

            link:
                dom.link?.value
                    .trim() || ""

        };

    }


    function validatePayload(payload){

        if(!payload.title){

            showToastMessage(
                "Le titre est obligatoire.",
                "warning"
            );

            dom.title?.focus();

            return false;

        }

        if(payload.title.length > 120){

            showToastMessage(
                "Le titre ne peut pas dépasser 120 caractères.",
                "warning"
            );

            dom.title?.focus();

            return false;

        }

        if(!payload.message){

            showToastMessage(
                "Le message est obligatoire.",
                "warning"
            );

            dom.message?.focus();

            return false;

        }

        if(payload.message.length > 1000){

            showToastMessage(
                "Le message ne peut pas dépasser 1000 caractères.",
                "warning"
            );

            dom.message?.focus();

            return false;

        }

        if(
            payload.link &&
            !isValidUrl(payload.link)
        ){

            showToastMessage(
                "Le lien fourni n'est pas valide.",
                "warning"
            );

            dom.link?.focus();

            return false;

        }

        if(
            payload.schedule_at &&
            Number.isNaN(
                new Date(
                    payload.schedule_at
                ).getTime()
            )
        ){

            showToastMessage(
                "La date de programmation est invalide.",
                "warning"
            );

            return false;

        }

        return true;

    }


    function isValidUrl(value){

        try{

            const url =
                new URL(value);

            return [
                "http:",
                "https:"
            ].includes(
                url.protocol
            );

        }
        catch{

            return false;

        }

    }


    async function saveNotification(
        payload,
        scheduled
    ){

        state.loading = true;

        setFormLoading(true);

        try{

            const body = {

                ...payload,

                scheduled:
                    scheduled === true

            };

            let response;

            if(state.editingId){

                response =
                    await window.API.put(

                        `/api/notifications/${encodeURIComponent(
                            state.editingId
                        )}`,

                        body

                    );

            }
            else{

                response =
                    await window.API.post(

                        "/api/notifications",

                        body

                    );

            }

            if(!response){

                throw new Error(
                    "Réponse serveur invalide."
                );

            }

            showToastMessage(

                state.editingId
                    ? "Notification mise à jour."
                    : scheduled
                        ? "Notification programmée."
                        : "Notification envoyée.",

                "success"

            );

            closeModal();

            await loadNotifications();

        }
        catch(error){

            showToastMessage(

                error?.message ||
                "Impossible d'enregistrer la notification.",

                "error"

            );

        }
        finally{

            state.loading = false;

            setFormLoading(false);

        }

    }


    async function resendNotification(id){

        if(state.loading){

            return;

        }

        const confirmed =
            await confirmAction(
                "Voulez-vous renvoyer cette notification ?"
            );

        if(!confirmed){

            return;

        }

        state.loading = true;

        try{

            await window.API.post(

                `/api/notifications/${encodeURIComponent(
                    id
                )}/resend`

            );

            showToastMessage(
                "Notification renvoyée.",
                "success"
            );

            await loadNotifications();

        }
        catch(error){

            showToastMessage(

                error?.message ||
                "Impossible de renvoyer la notification.",

                "error"

            );

        }
        finally{

            state.loading = false;

        }

    }


    async function deleteNotification(id){

        if(state.loading){

            return;

        }

        const confirmed =
            await confirmAction(
                "Voulez-vous supprimer cette notification ?"
            );

        if(!confirmed){

            return;

        }

        state.loading = true;

        try{

            await window.API.delete(

                `/api/notifications/${encodeURIComponent(
                    id
                )}`

            );

            showToastMessage(
                "Notification supprimée.",
                "success"
            );

            if(
                state.notifications.length === 1 &&
                state.page > 1
            ){

                state.page--;

            }

            await loadNotifications();

        }
        catch(error){

            showToastMessage(

                error?.message ||
                "Impossible de supprimer la notification.",

                "error"

            );

        }
        finally{

            state.loading = false;

        }

    }


    function setFormLoading(loading){

        const controls = [

            dom.title,
            dom.target,
            dom.type,
            dom.message,
            dom.priority,
            dom.date,
            dom.link,
            dom.sendButton,
            dom.scheduleButton,
            dom.cancelButton

        ];

        controls.forEach(
            element => {

                if(element){

                    element.disabled =
                        loading;

                }

            }
        );

        if(dom.sendButton){

            const span =
                dom.sendButton.querySelector(
                    "span"
                );

            if(span){

                span.textContent =
                    loading
                        ? "Traitement..."
                        : "Envoyer";

            }

        }

    }


    async function confirmAction(message){

        if(
            typeof window.showConfirm ===
            "function"
        ){

            return Boolean(
                await window.showConfirm(
                    message
                )
            );

        }

        return window.confirm(
            message
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


    function normalizeDateTimeLocal(value){

        if(!value){

            return "";

        }

        const date =
            new Date(value);

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return "";

        }

        const pad =
            number =>
                String(number)
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

        ].join("-") +
        "T" +
        [

            pad(
                date.getHours()
            ),

            pad(
                date.getMinutes()
            )

        ].join(":");

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
                    Impossible de charger les notifications.
                </td>
            </tr>
        `;

    }


    function handleKeyboard(event){

        if(
            event.key === "Escape" &&
            dom.modal &&
            !dom.modal.classList.contains(
                "hidden"
            )
        ){

            closeModal();

        }

    }


    function handleVisibilityChange(){

        if(document.hidden){

            stopAutoRefresh();

            return;

        }

        loadNotifications();

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

                        loadNotifications();

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


    function destroy(){

        stopAutoRefresh();

        clearTimeout(
            state.searchTimer
        );

        abortPendingRequest();

        state.initialized =
            false;

    }


    return {

        initialize,

        destroy,

        refresh:
            loadNotifications

    };

})();


window.initializeNotificationsPage =
    function(){

        NotificationsModule.initialize();

    };