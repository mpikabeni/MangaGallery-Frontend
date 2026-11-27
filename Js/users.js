/*
==================================
MANGA GALLERY
USERS
VERSION FINALE
==================================
*/

"use strict";

/*==================================
CONFIG
==================================*/

const api = window.api || window.API;

const userState={

users:[],

page:1,

limit:20,

totalPages:1,

search:"",

role:"",

status:"",

editing:null

};


/*==================================
INITIALIZE
==================================
*/

document.addEventListener(

"DOMContentLoaded",

initializeUsersPage

);


/*==================================
INITIALIZE PAGE
==================================
*/

async function initializeUsersPage(){

try{

if(window.lucide){

lucide.createIcons();

}

bindEvents();

await protectPage(

["admin","super_admin"]

);

await loadUsers();

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

"search-user"

)

.addEventListener(

"input",

handleSearch

);

document

.getElementById(

"role-filter"

)

.addEventListener(

"change",

handleFilter

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

"refresh-users"

)

.addEventListener(

"click",

refreshPage

);

document

.getElementById(

"user-form"

)

.addEventListener(

"submit",

saveUser

);

document

.getElementById(

"close-user-button"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"close-user-modal"

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

function openUserModal(){

document

.getElementById(

"user-modal"

)

.classList.remove(

"hidden"

);

}


function closeModal(){

document

.getElementById(

"user-modal"

)

.classList.add(

"hidden"

);

}

/*
==================================
LOAD USERS
==================================
*/

async function loadUsers(){

try{

showLoader();

const response=

await api.get(

"/api/users",

{

page:userState.page,

limit:userState.limit,

search:userState.search,

role:userState.role,

status:userState.status

}

);

userState.users=

response.items||[];

userState.totalPages=

response.total_pages||1;

renderUsers();

updatePagination();

hideLoader();

}
catch(error){

hideLoader();

console.error(error);

showError(

"Impossible de charger les utilisateurs."

);

}

}


/*
==================================
RENDER USERS
==================================
*/

function renderUsers(){

const tbody=

document.getElementById(

"users-table-body"

);

tbody.innerHTML="";

if(userState.users.length===0){

tbody.innerHTML=

`

<tr>

<td
colspan="9"
class="loading-row">

Aucun utilisateur trouvé.

</td>

</tr>

`;

updateCounter();

return;

}

userState.users.forEach(

user=>{

const tr=

document.createElement(

"tr"

);

tr.innerHTML=

`

<td>

<div class="user-avatar">

<img

src="${user.avatar||'assets/default-avatar.png'}"

alt="${escapeHtml(user.name)}">

</div>

</td>

<td>

${escapeHtml(user.name)}

</td>

<td>

${escapeHtml(user.email)}

</td>

<td>

<span

class="role ${user.role}">

${getRoleLabel(user.role)}

</span>

</td>

<td>

<span

class="status ${user.status}">

${getStatusLabel(user.status)}

</span>

</td>

<td>

${formatMoney(user.wallet_balance||0)}

</td>

<td>

${formatDate(user.created_at)}

</td>

<td>

${formatDateTime(user.last_login)}

</td>

<td>

<div class="actions">

<button

class="action-button view"

onclick="viewUser(${user.id})">

<i data-lucide="eye"></i>

</button>

<button

class="action-button edit"

onclick="editUser(${user.id})">

<i data-lucide="pencil"></i>

</button>

<button

class="action-button delete"

onclick="deleteUser(${user.id})">

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

"user-count"

).textContent=

`${userState.users.length} utilisateurs`;

}

/*
==================================
SEARCH
==================================
*/

function handleSearch(event){

userState.search=

event.target.value.trim();

userState.page=1;

loadUsers();

}


/*
==================================
FILTERS
==================================
*/

function handleFilter(){

userState.role=

document.getElementById(

"role-filter"

).value;

userState.status=

document.getElementById(

"status-filter"

).value;

userState.page=1;

loadUsers();

}


/*
==================================
REFRESH
==================================
*/

async function refreshPage(){

userState.search="";

userState.role="";

userState.status="";

userState.page=1;

document.getElementById(

"search-user"

).value="";

document.getElementById(

"role-filter"

).value="";

document.getElementById(

"status-filter"

).value="";

await loadUsers();

showSuccess(

"Liste des utilisateurs actualisée."

);

}


/*
==================================
PAGINATION
==================================
*/

function previousPage(){

if(userState.page<=1){

return;

}

userState.page--;

loadUsers();

}


function nextPage(){

if(userState.page>=userState.totalPages){

return;

}

userState.page++;

loadUsers();

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

if(userState.totalPages<=1){

pagination.style.display="none";

return;

}

pagination.style.display="flex";

info.textContent=

`Page ${userState.page} sur ${userState.totalPages}`;

previous.disabled=

userState.page===1;

next.disabled=

userState.page===userState.totalPages;

}


/*
==================================
LOADER
==================================
*/

function showLoader(){

const tbody=

document.getElementById(

"users-table-body"

);

tbody.innerHTML=

`

<tr>

<td
colspan="9"
class="loading-row">

Chargement des utilisateurs...

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
VIEW USER
==================================
*/

function viewUser(id){

editUser(id);

}

/*
==================================
EDIT USER
==================================
*/

async function editUser(id){

try{

const user=

await api.get(

`/api/users/${id}`

);

userState.editing=id;

document.getElementById(

"user-id"

).value=

user.id;

document.getElementById(

"user-name"

).value=

user.name||"";

document.getElementById(

"user-email"

).value=

user.email||"";

document.getElementById(

"user-role"

).value=

user.role||"user";

document.getElementById(

"user-status"

).value=

user.status||"active";

document.getElementById(

"user-wallet"

).value=

formatMoney(

user.wallet_balance||0

);

document.getElementById(

"user-created"

).value=

formatDateTime(

user.created_at

);

document.getElementById(

"user-favorites"

).value=

user.favorites_count||0;

document.getElementById(

"user-history"

).value=

user.history_count||0;

document.getElementById(

"user-statistics"

).value=

user.statistics||"";

document.getElementById(

"user-notes"

).value=

user.notes||"";

document.getElementById(

"user-avatar"

).src=

user.avatar||

"assets/default-avatar.png";

openUserModal();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


/*
==================================
SAVE USER
==================================
*/

async function saveUser(event){

event.preventDefault();

try{

const button=

document.getElementById(

"save-user-button"

);

setLoading(

button,

true

);

await api.put(

`/api/users/${userState.editing}`,

{

role:

document.getElementById(

"user-role"

).value,

status:

document.getElementById(

"user-status"

).value,

notes:

document.getElementById(

"user-notes"

).value.trim()

}

);

setLoading(

button,

false

);

showSuccess(

"Utilisateur mis à jour avec succès."

);

cleanupModal();

await loadUsers();

}
catch(error){

setLoading(

document.getElementById(

"save-user-button"

),

false

);

console.error(error);

handleApiError(error);

}

}

/*
==================================
DELETE USER
==================================
*/

async function deleteUser(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer cet utilisateur ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/users/${id}`

);

showSuccess(

"Utilisateur supprimé avec succès."

);

await loadUsers();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


/*
==================================
RESET FORM
==================================
*/

function resetForm(){

document.getElementById(

"user-form"

).reset();

document.getElementById(

"user-id"

).value="";

document.getElementById(

"user-avatar"

).src=

"assets/default-avatar.png";

userState.editing=null;

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
ROLE LABEL
==================================
*/

function getRoleLabel(role){

switch(role){

case"user":

return"Utilisateur";

case"moderator":

return"Modérateur";

case"admin":

return"Administrateur";

case"super_admin":

return"Super Administrateur";

default:

return role;

}

}


/*
==================================
STATUS LABEL
==================================
*/

function getStatusLabel(status){

switch(status){

case"active":

return"Actif";

case"suspended":

return"Suspendu";

case"banned":

return"Banni";

default:

return status;

}

}


/*
==================================
FORMATTERS
==================================
*/

function formatMoney(amount){

return Number(amount||0)

.toLocaleString(

"fr-FR",

{

style:"currency",

currency:"XAF"

}

);

}

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

loadUsers();

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

loadUsers();

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

window.initializeUsersPage=

initializeUsersPage;

window.viewUser=

viewUser;

window.editUser=

editUser;

window.deleteUser=

deleteUser;


/*
==================================
READY FOR PRODUCTION
==================================
*/