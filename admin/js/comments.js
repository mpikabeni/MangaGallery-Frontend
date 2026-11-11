/*
==================================
MANGA GALLERY
COMMENTS
VERSION FINALE
==================================
*/

"use strict";

/*==================================
CONFIG
==================================*/

const api = window.api || window.API;

const commentState={

comments:[],

page:1,

limit:20,

totalPages:1,

search:"",

status:"",

editing:null

};


/*==================================
INITIALIZE
==================================
*/

document.addEventListener(

"DOMContentLoaded",

initializeCommentsPage

);


/*==================================
INITIALIZE PAGE
==================================
*/

async function initializeCommentsPage(){

try{

if(window.lucide){

lucide.createIcons();

}

bindEvents();

await protectPage(

["admin","super_admin"]

);

await loadComments();

}
catch(error){

console.error(error);

showError(

"Impossible de charger la page."

);

}

}


/*==================================
EVENTS
==================================
*/

function bindEvents(){

document

.getElementById(

"search-comment"

)

.addEventListener(

"input",

handleSearch

);

document

.getElementById(

"status-filter"

)

.addEventListener(

"change",

handleFilter

);

document

.getElementById(

"refresh-comments"

)

.addEventListener(

"click",

refreshPage

);

document

.getElementById(

"comment-form"

)

.addEventListener(

"submit",

saveComment

);

document

.getElementById(

"hide-comment-button"

)

.addEventListener(

"click",

hideComment

);

document

.getElementById(

"restore-comment-button"

)

.addEventListener(

"click",

restoreComment

);

document

.getElementById(

"delete-comment-button"

)

.addEventListener(

"click",

deleteCurrentComment

);

document

.getElementById(

"close-comment-button"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"close-comment-modal"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"previous-page"

)

.addEventListener(

"click",

previousPage

);

document

.getElementById(

"next-page"

)

.addEventListener(

"click",

nextPage

);

}


/*==================================
MODAL
==================================
*/

function openCommentModal(){

document

.getElementById(

"comment-modal"

)

.classList.remove(

"hidden"

);

}


function closeModal(){

document

.getElementById(

"comment-modal"

)

.classList.add(

"hidden"

);

}

/*
==================================
LOAD COMMENTS
==================================
*/

async function loadComments(){

try{

showLoader();

const response=

await api.get(

"/api/comments",

{

page:commentState.page,

limit:commentState.limit,

search:commentState.search,

status:commentState.status

}

);

commentState.comments=

response.items||[];

commentState.totalPages=

response.total_pages||1;

renderComments();

updatePagination();

hideLoader();

}
catch(error){

hideLoader();

console.error(error);

showError(

"Impossible de charger les commentaires."

);

}

}


/*
==================================
RENDER COMMENTS
==================================
*/

function renderComments(){

const tbody=

document.getElementById(

"comments-table-body"

);

tbody.innerHTML="";

if(commentState.comments.length===0){

tbody.innerHTML=

`

<tr>

<td
colspan="9"
class="loading-row">

Aucun commentaire trouvé.

</td>

</tr>

`;

updateCounter();

return;

}

commentState.comments.forEach(

comment=>{

const tr=

document.createElement(

"tr"

);

tr.innerHTML=

`

<td>

<div class="comment-avatar">

<img

src="${comment.avatar||'assets/default-avatar.png'}"

alt="${comment.user_name}">

</div>

</td>

<td>

${comment.user_name}

</td>

<td>

${comment.manga_title}

</td>

<td>

${comment.chapter_title}

</td>

<td>

<div class="comment-text">

${escapeHtml(comment.content)}

</div>

</td>

<td>

<span class="report-count">

${comment.reports||0}

</span>

</td>

<td>

<span

class="status ${comment.status}">

${getStatusLabel(

comment.status

)}

</span>

</td>

<td>

${formatDateTime(

comment.created_at

)}

</td>

<td>

<div class="actions">

<button

class="action-button view"

onclick="viewComment(${comment.id})">

<i data-lucide="eye"></i>

</button>

<button

class="action-button edit"

onclick="editComment(${comment.id})">

<i data-lucide="pencil"></i>

</button>

<button

class="action-button delete"

onclick="deleteComment(${comment.id})">

<i data-lucide="trash-2"></i>

</button>

</div>

</td>

`;

tbody.appendChild(

tr

);

}

);

updateCounter();

if(window.lucide){

lucide.createIcons();

}

}


/*
==================================
COUNTER
==================================
*/

function updateCounter(){

document.getElementById(

"comment-count"

).textContent=

`${commentState.comments.length} commentaires`;

}

/*
==================================
SEARCH
==================================
*/

function handleSearch(event){

commentState.search=

event.target.value.trim();

commentState.page=1;

loadComments();

}


/*
==================================
FILTERS
==================================
*/

function handleFilter(){

commentState.status=

document.getElementById(

"status-filter"

).value;

commentState.page=1;

loadComments();

}


/*
==================================
REFRESH
==================================
*/

async function refreshPage(){

commentState.search="";

commentState.status="";

commentState.page=1;

document.getElementById(

"search-comment"

).value="";

document.getElementById(

"status-filter"

).value="";

await loadComments();

showSuccess(

"Liste des commentaires actualisée."

);

}


/*
==================================
PAGINATION
==================================
*/

function previousPage(){

if(commentState.page<=1){

return;

}

commentState.page--;

loadComments();

}


function nextPage(){

if(commentState.page>=commentState.totalPages){

return;

}

commentState.page++;

loadComments();

}


/*
==================================
UPDATE PAGINATION
==================================
*/

function updatePagination(){

const pagination=

document.querySelector(

".pagination"

);

const info=

document.getElementById(

"pagination-info"

);

const previous=

document.getElementById(

"previous-page"

);

const next=

document.getElementById(

"next-page"

);

if(commentState.totalPages<=1){

pagination.style.display="none";

return;

}

pagination.style.display="flex";

info.textContent=

`Page ${commentState.page} sur ${commentState.totalPages}`;

previous.disabled=

commentState.page===1;

next.disabled=

commentState.page===commentState.totalPages;

}


/*
==================================
LOADER
==================================
*/

function showLoader(){

const tbody=

document.getElementById(

"comments-table-body"

);

tbody.innerHTML=

`

<tr>

<td
colspan="9"
class="loading-row">

Chargement des commentaires...

</td>

</tr>

`;

}


/*
==================================
HIDE LOADER
==================================
*/

function hideLoader(){

}


/*
==================================
VIEW COMMENT
==================================
*/

function viewComment(id){

editComment(id);

}

/*
==================================
EDIT COMMENT
==================================
*/

async function editComment(id){

try{

const comment=

await api.get(

`/api/comments/${id}`

);

commentState.editing=id;

document.getElementById(

"comment-id"

).value=

comment.id;

document.getElementById(

"comment-user"

).value=

comment.user_name||"";

document.getElementById(

"comment-manga"

).value=

comment.manga_title||"";

document.getElementById(

"comment-chapter"

).value=

comment.chapter_title||"";

document.getElementById(

"comment-content"

).value=

comment.content||"";

document.getElementById(

"comment-status"

).value=

comment.status||"published";

document.getElementById(

"comment-date"

).value=

formatDateTime(

comment.created_at

);

document.getElementById(

"comment-reports"

).value=

comment.reports||0;

document.getElementById(

"moderator-note"

).value=

comment.moderator_note||"";

document.getElementById(

"comment-avatar"

).src=

comment.avatar||

"assets/default-avatar.png";

openCommentModal();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


/*
==================================
SAVE COMMENT
==================================
*/

async function saveComment(event){

event.preventDefault();

try{

const button=

document.getElementById(

"save-comment-button"

);

setLoading(

button,

true

);

await api.put(

`/api/comments/${commentState.editing}`,

{

status:

document.getElementById(

"comment-status"

).value,

moderator_note:

document.getElementById(

"moderator-note"

).value.trim()

}

);

setLoading(

button,

false

);

showSuccess(

"Commentaire mis à jour avec succès."

);

cleanupModal();

await loadComments();

}
catch(error){

setLoading(

document.getElementById(

"save-comment-button"

),

false

);

console.error(error);

handleApiError(error);

}

}


/*
==================================
HIDE COMMENT
==================================
*/

async function hideComment(){

if(!commentState.editing){

return;

}

try{

await api.patch(

`/api/comments/${commentState.editing}/hide`

);

showSuccess(

"Commentaire masqué."

);

cleanupModal();

await loadComments();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


/*
==================================
RESTORE COMMENT
==================================
*/

async function restoreComment(){

if(!commentState.editing){

return;

}

try{

await api.patch(

`/api/comments/${commentState.editing}/restore`

);

showSuccess(

"Commentaire restauré."

);

cleanupModal();

await loadComments();

}
catch(error){

console.error(error);

handleApiError(error);

}

}

/*
==================================
DELETE COMMENT
==================================
*/

async function deleteComment(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer ce commentaire ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/comments/${id}`

);

showSuccess(

"Commentaire supprimé avec succès."

);

await loadComments();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


async function deleteCurrentComment(){

if(!commentState.editing){

return;

}

await deleteComment(

commentState.editing

);

cleanupModal();

}


/*
==================================
RESET FORM
==================================
*/

function resetForm(){

document.getElementById(

"comment-form"

).reset();

document.getElementById(

"comment-id"

).value="";

document.getElementById(

"comment-avatar"

).src=

"assets/default-avatar.png";

commentState.editing=null;

}


/*
==================================
MODAL CLEANUP
==================================
*/

function cleanupModal(){

resetForm();

closeModal();

}


/*
==================================
BUTTON LOADING
==================================
*/

function setLoading(button,state){

if(!button){

return;

}

button.disabled=state;

button.classList.toggle(

"loading",

state

);

}


/*
==================================
STATUS LABEL
==================================
*/

function getStatusLabel(status){

switch(status){

case"published":

return"Publié";

case"hidden":

return"Masqué";

case"reported":

return"Signalé";

default:

return status;

}

}


/*
==================================
FORMATTERS
==================================
*/

function formatDate(date){

if(!date){

return"-";

}

return new Date(date)

.toLocaleDateString(

"fr-FR"

);

}

function formatDateTime(date){

if(!date){

return"-";

}

return new Date(date)

.toLocaleString(

"fr-FR"

);

}


/*
==================================
MESSAGES
==================================
*/

function showSuccess(message){

if(typeof showToast==="function"){

showToast(

message,

"success"

);

}

}

function showError(message){

if(typeof showToast==="function"){

showToast(

message,

"error"

);

}

}


/*
==================================
API ERROR
==================================
*/

function handleApiError(error){

console.error(error);

const message=

error?.response?.message||

error?.message||

"Une erreur est survenue.";

showError(message);

}


/*
==================================
KEYBOARD
==================================
*/

document.addEventListener(

"keydown",

event=>{

if(event.key==="Escape"){

closeModal();

}

if(event.ctrlKey&&event.key==="r"){

event.preventDefault();

refreshPage();

}

});


/*
==================================
AUTO REFRESH
==================================
*/

let refreshTimer=null;

function startAutoRefresh(){

stopAutoRefresh();

refreshTimer=setInterval(

()=>{

loadComments();

},

60000

);

}

function stopAutoRefresh(){

if(refreshTimer){

clearInterval(refreshTimer);

refreshTimer=null;

}

}

window.addEventListener(

"focus",

()=>{

loadComments();

}

);

window.addEventListener(

"beforeunload",

()=>{

stopAutoRefresh();

}

);

startAutoRefresh();


/*
==================================
PUBLIC METHODS
==================================
*/

window.initializeCommentsPage=

initializeCommentsPage;

window.viewComment=

viewComment;

window.editComment=

editComment;

window.deleteComment=

deleteComment;


/*
==================================
READY FOR PRODUCTION
==================================
*/