/*
==================================
MANGA GALLERY
MANGAS
VERSION FINALE
==================================
*/

"use strict";

/*==================================
CONFIG
==================================*/

const api = window.api || window.API;

const mangaState = {

mangas:[],

categories:[],

page:1,

limit:20,

totalPages:1,

search:"",

category:"",

status:"",

editing:null

};


/*==================================
INITIALIZE
==================================
*/

document.addEventListener(

"DOMContentLoaded",

initializeMangasPage

);


/*==================================
INITIALIZE PAGE
==================================
*/

async function initializeMangasPage(){

try{

if(window.lucide){

lucide.createIcons();

}

bindEvents();

await protectPage(

["admin","super_admin"]

);

await loadCategories();

await loadMangas();

initializeCoverPreview();

initializeSlugGenerator();

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

"search-manga"

)

.addEventListener(

"input",

handleSearch

);

document

.getElementById(

"category-filter"

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

"refresh-mangas"

)

.addEventListener(

"click",

refreshPage

);

document

.getElementById(

"add-manga"

)

.addEventListener(

"click",

openCreateModal

);

document

.getElementById(

"manga-form"

)

.addEventListener(

"submit",

saveManga

);

document

.getElementById(

"cancel-button"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"close-modal"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"manga-cover"

)

.addEventListener(

"change",

previewCover

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

function openCreateModal(){

mangaState.editing=null;

document

.getElementById(

"manga-form"

)

.reset();

document

.getElementById(

"modal-title"

)

.textContent=

"Ajouter un manga";

document

.getElementById(

"manga-modal"

)

.classList

.remove(

"hidden"

);

resetCoverPreview();

}


function closeModal(){

document

.getElementById(

"manga-modal"

)

.classList

.add(

"hidden"

);

}

/*
==================================
LOAD MANGAS
==================================
*/

async function loadMangas(){

try{

showLoader();

const response=await api.get(

"/api/mangas",

{

page:mangaState.page,

limit:mangaState.limit,

search:mangaState.search,

category_id:mangaState.category,

status:mangaState.status

}

);

mangaState.mangas=response.items||[];

mangaState.totalPages=response.total_pages||1;

renderMangas();

updatePagination();

hideLoader();

}
catch(error){

hideLoader();

console.error(error);

showError(

"Impossible de charger les mangas."

);

}

}


/*
==================================
LOAD CATEGORIES
==================================
*/

async function loadCategories(){

try{

const response=

await api.get(

"/api/categories"

);

mangaState.categories=

response.items||[];

renderCategoryFilters();

}
catch(error){

console.error(error);

showError(

"Impossible de charger les catégories."

);

}

}


/*
==================================
RENDER CATEGORY FILTERS
==================================
*/

function renderCategoryFilters(){

const filter=

document.getElementById(

"category-filter"

);

const select=

document.getElementById(

"manga-category"

);

filter.innerHTML=

'<option value="">Toutes les catégories</option>';

select.innerHTML=

'<option value="">Sélectionner une catégorie</option>';

mangaState.categories.forEach(

category=>{

const option=document.createElement(

"option"

);

option.value=category.id;

option.textContent=category.name;

filter.appendChild(

option

);

select.appendChild(

option.cloneNode(true)

);

}

);

}


/*
==================================
RENDER TABLE
==================================
*/

function renderMangas(){

const tbody=

document.getElementById(

"mangas-table-body"

);

tbody.innerHTML="";

if(

mangaState.mangas.length===0

){

tbody.innerHTML=

`<tr>

<td colspan="9"

class="loading-row">

Aucun manga trouvé.

</td>

</tr>`;

document.getElementById(

"manga-count"

).textContent="0 mangas";

return;

}

mangaState.mangas.forEach(

manga=>{

const tr=document.createElement(

"tr"

);

tr.innerHTML=`

<td>

<div class="manga-cover">

<img

src="${manga.cover}"

alt="${escapeHtml(manga.title)}">

</div>

</td>

<td>

${escapeHtml(manga.title)}

</td>

<td>

${manga.category_name}

</td>

<td>

<span class="status ${manga.status}">

${getStatusLabel(manga.status)}

</span>

</td>

<td>

${manga.chapters_count}

</td>

<td>

${Number(manga.views||0).toLocaleString("fr-FR")}

</td>

<td>

⭐ ${Number(manga.rating||0).toFixed(1)}

</td>

<td>

${formatDate(manga.created_at)}

</td>

<td>

<div class="actions">

<button

class="action-button view"

onclick="viewManga(${manga.id})">

<i data-lucide="eye"></i>

</button>

<button

class="action-button edit"

onclick="editManga(${manga.id})">

<i data-lucide="pencil"></i>

</button>

<button

class="action-button delete"

onclick="deleteManga(${manga.id})">

<i data-lucide="trash-2"></i>

</button>

</div>

</td>

`;

tbody.appendChild(tr);

}

);

document.getElementById(

"manga-count"

).textContent=

`${mangaState.mangas.length} mangas`;

if(window.lucide){

lucide.createIcons();

}

}

/*
==================================
SEARCH
==================================
*/

function handleSearch(event){

mangaState.search=

event.target.value.trim();

mangaState.page=1;

loadMangas();

}


/*
==================================
FILTERS
==================================
*/

function handleFilter(){

mangaState.category=

document.getElementById(

"category-filter"

).value;

mangaState.status=

document.getElementById(

"status-filter"

).value;

mangaState.page=1;

loadMangas();

}


/*
==================================
REFRESH
==================================
*/

async function refreshPage(){

mangaState.search="";

mangaState.category="";

mangaState.status="";

mangaState.page=1;

document.getElementById(

"search-manga"

).value="";

document.getElementById(

"category-filter"

).value="";

document.getElementById(

"status-filter"

).value="";

await loadMangas();

showSuccess(

"Liste des mangas actualisée."

);

}


/*
==================================
PAGINATION
==================================
*/

function previousPage(){

if(

mangaState.page<=1

){

return;

}

mangaState.page--;

loadMangas();

}


function nextPage(){

if(

mangaState.page>=

mangaState.totalPages

){

return;

}

mangaState.page++;

loadMangas();

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

if(

mangaState.totalPages<=1

){

pagination.style.display="none";

return;

}

pagination.style.display="flex";

info.textContent=

`Page ${mangaState.page} sur ${mangaState.totalPages}`;

previous.disabled=

mangaState.page===1;

next.disabled=

mangaState.page===

mangaState.totalPages;

}


/*
==================================
LOADER
==================================
*/

function showLoader(){

const tbody=

document.getElementById(

"mangas-table-body"

);

tbody.innerHTML=

`

<tr>

<td
colspan="9"
class="loading-row">

Chargement des mangas...

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
VIEW
==================================
*/

function viewManga(id){

window.location.href=

`chapters.html?manga=${id}`;

}

/*
==================================
SAVE MANGA
==================================
*/

async function saveManga(event){

event.preventDefault();

try{

const formData=new FormData();

formData.append(

"title",

document.getElementById(

"manga-title"

).value.trim()

);

formData.append(

"slug",

document.getElementById(

"manga-slug"

).value.trim()

);

formData.append(

"author",

document.getElementById(

"manga-author"

).value.trim()

);

formData.append(

"category_id",

document.getElementById(

"manga-category"

).value

);

formData.append(

"description",

document.getElementById(

"manga-description"

).value.trim()

);

formData.append(

"status",

document.getElementById(

"manga-status"

).value

);

formData.append(

"language",

document.getElementById(

"manga-language"

).value

);

const cover=

document.getElementById(

"manga-cover"

).files[0];

if(cover){

formData.append(

"cover",

cover

);

}

if(mangaState.editing){

await api.put(

`/api/mangas/${mangaState.editing}`,

formData

);

showSuccess(

"Manga modifié avec succès."

);

}else{

await api.post(

"/api/mangas",

formData

);

showSuccess(

"Manga ajouté avec succès."

);

}

closeModal();

await loadMangas();

}
catch(error){

console.error(error);

showError(

"Impossible d'enregistrer le manga."

);

}

}


/*
==================================
EDIT MANGA
==================================
*/

async function editManga(id){

try{

const manga=

await api.get(

`/api/mangas/${id}`

);

mangaState.editing=id;

document.getElementById(

"modal-title"

).textContent=

"Modifier le manga";

document.getElementById(

"manga-id"

).value=

manga.id;

document.getElementById(

"manga-title"

).value=

manga.title;

document.getElementById(

"manga-slug"

).value=

manga.slug;

document.getElementById(

"manga-author"

).value=

manga.author||"";

document.getElementById(

"manga-category"

).value=

manga.category_id;

document.getElementById(

"manga-description"

).value=

manga.description||"";

document.getElementById(

"manga-status"

).value=

manga.status;

document.getElementById(

"manga-language"

).value=

manga.language||"fr";

document.getElementById(

"cover-preview"

).src=

manga.cover||

"assets/default-cover.png";

document.getElementById(

"manga-modal"

).classList.remove(

"hidden"

);

}
catch(error){

console.error(error);

showError(

"Impossible de charger le manga."

);

}

}

/*
==================================
DELETE MANGA
==================================
*/

async function deleteManga(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer ce manga ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/mangas/${id}`

);

showSuccess(

"Manga supprimé avec succès."

);

await loadMangas();

}
catch(error){

console.error(error);

showError(

"Impossible de supprimer le manga."

);

}

}


/*
==================================
COVER PREVIEW
==================================
*/

function initializeCoverPreview(){

const input=

document.getElementById(

"manga-cover"

);

if(!input){

return;

}

input.addEventListener(

"change",

previewCover

);

}


function previewCover(event){

const file=

event.target.files[0];

if(!file){

resetCoverPreview();

return;

}

const reader=

new FileReader();

reader.onload=function(e){

document.getElementById(

"cover-preview"

).src=e.target.result;

};

reader.readAsDataURL(file);

}


function resetCoverPreview(){

document.getElementById(

"cover-preview"

).src=

"assets/default-cover.png";

}


/*
==================================
SLUG
==================================
*/

function initializeSlugGenerator(){

const title=

document.getElementById(

"manga-title"

);

if(!title){

return;

}

title.addEventListener(

"input",

generateSlug

);

}


function generateSlug(){

const title=

document.getElementById(

"manga-title"

).value;

document.getElementById(

"manga-slug"

).value=

title

.toLowerCase()

.normalize("NFD")

.replace(/[\u0300-\u036f]/g,"")

.replace(/[^a-z0-9]+/g,"-")

.replace(/^-|-$/g,"");

}


/*
==================================
STATUS LABEL
==================================
*/

function getStatusLabel(status){

switch(status){

case"ongoing":

return"En cours";

case"completed":

return"Terminé";

case"paused":

return"En pause";

default:

return status;

}

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
UTILS
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


/*
==================================
END
==================================
*/

/*
==================================
DELETE MANGA
==================================
*/

async function deleteManga(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer ce manga ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/mangas/${id}`

);

showSuccess(

"Manga supprimé avec succès."

);

await loadMangas();

}
catch(error){

console.error(error);

showError(

"Impossible de supprimer le manga."

);

}

}


/*
==================================
COVER PREVIEW
==================================
*/

function initializeCoverPreview(){

const input=

document.getElementById(

"manga-cover"

);

if(!input){

return;

}

input.addEventListener(

"change",

previewCover

);

}


function previewCover(event){

const file=

event.target.files[0];

if(!file){

resetCoverPreview();

return;

}

const reader=

new FileReader();

reader.onload=function(e){

document.getElementById(

"cover-preview"

).src=e.target.result;

};

reader.readAsDataURL(file);

}


function resetCoverPreview(){

document.getElementById(

"cover-preview"

).src=

"assets/default-cover.png";

}


/*
==================================
SLUG
==================================
*/

function initializeSlugGenerator(){

const title=

document.getElementById(

"manga-title"

);

if(!title){

return;

}

title.addEventListener(

"input",

generateSlug

);

}


function generateSlug(){

const title=

document.getElementById(

"manga-title"

).value;

document.getElementById(

"manga-slug"

).value=

title

.toLowerCase()

.normalize("NFD")

.replace(/[\u0300-\u036f]/g,"")

.replace(/[^a-z0-9]+/g,"-")

.replace(/^-|-$/g,"");

}


/*
==================================
STATUS LABEL
==================================
*/

function getStatusLabel(status){

switch(status){

case"ongoing":

return"En cours";

case"completed":

return"Terminé";

case"paused":

return"En pause";

default:

return status;

}

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
UTILS
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


/*
==================================
END
==================================
*/