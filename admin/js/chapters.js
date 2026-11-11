/*
==================================
MANGA GALLERY
CHAPTERS
VERSION FINALE
==================================
*/

"use strict";


/*==================================
CONFIG
==================================*/

const API = window.API || {};

const chapterState = {

chapters:[],

mangas:[],

page:1,

limit:20,

totalPages:1,

search:"",

manga:"",

status:"",

editing:null

};


/*==================================
INITIALIZE
==================================*/

document.addEventListener(

"DOMContentLoaded",

initializeChaptersPage

);


/*==================================
INITIALIZE PAGE
==================================*/

async function initializeChaptersPage(){

try{

if(window.lucide){

lucide.createIcons();

}

bindEvents();

await protectPage(

["admin","super_admin"]

);

await loadMangas();

await loadChapters();

if (typeof initializePreview === "function") { initializePreview(); }

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
==================================*/

function bindEvents(){

document

.getElementById(

"search-chapter"

)

.addEventListener(

"input",

handleSearch

);

document

.getElementById(

"manga-filter"

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

"refresh-chapters"

)

.addEventListener(

"click",

refreshPage

);

document

.getElementById(

"add-chapter"

)

.addEventListener(

"click",

openCreateModal

);

document

.getElementById(

"chapter-form"

)

.addEventListener(

"submit",

saveChapter

);

document

.getElementById(

"cancel-chapter-button"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"close-chapter-modal"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"chapter-pages"

)

.addEventListener(

"change",

previewPages

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
==================================*/

function openCreateModal(){

chapterState.editing=null;

document

.getElementById(

"chapter-form"

)

.reset();

document

.getElementById(

"chapter-modal-title"

)

textContent=

"Ajouter un chapitre";

document

.getElementById(

"chapter-modal"

)

classList

.remove(

"hidden"

);

clearPreview();

}

function closeModal(){

document

.getElementById(

"chapter-modal"

)

.classList

.add(

"hidden"

);

}

/*
==================================
LOAD CHAPTERS
==================================
*/

async function loadChapters(){

try{

showLoader();

const response=await api.get(

"/api/chapters",

{

page:chapterState.page,

limit:chapterState.limit,

search:chapterState.search,

manga_id:chapterState.manga,

status:chapterState.status

}

);

chapterState.chapters=

response.items||[];

chapterState.totalPages=

response.total_pages||1;

renderChapters();

updatePagination();

hideLoader();

}
catch(error){

hideLoader();

console.error(error);

showError(

"Impossible de charger les chapitres."

);

}

}


/*==================================
LOAD MANGAS
==================================
*/

async function loadMangas(){

try{

const response=

await api.get(

"/api/mangas"

);

chapterState.mangas=

response.items||[];

renderMangaFilters();

}
catch(error){

console.error(error);

showError(

"Impossible de charger les mangas."

);

}

}


/*==================================
RENDER FILTERS
==================================
*/

function renderMangaFilters(){

const filter=

document.getElementById(

"manga-filter"

);

const select=

document.getElementById(

"chapter-manga"

);

filter.innerHTML=

'<option value="">Tous les mangas</option>';

select.innerHTML=

'<option value="">Sélectionner un manga</option>';

chapterState.mangas.forEach(

manga=>{

const option1=

document.createElement(

"option"

);

option1.value=

manga.id;

option1.textContent=

manga.title;

filter.appendChild(

option1

);

const option2=

option1.cloneNode(

true

);

select.appendChild(

option2

);

}

);

}


/*==================================
RENDER TABLE
==================================
*/

function renderChapters(){

const tbody=

document.getElementById(

"chapters-table-body"

);

tbody.innerHTML="";

if(

chapterState.chapters.length===0

){

tbody.innerHTML=

`<tr>

<td colspan="6"

class="loading-row">

Aucun chapitre trouvé.

</td>

</tr>`;

return;

}

chapterState.chapters.forEach(

chapter=>{

const tr=

document.createElement(

"tr"

);

tr.innerHTML=

`

<td>

Chapitre ${chapter.number}

</td>

<td>

${chapter.manga_title}

</td>

<td>

${chapter.pages_count}

</td>

<td>

${formatDate(

chapter.created_at

)}

</td>

<td>

<span class="status ${chapter.status}">

${chapter.status==="published"

?"Publié"

:"Brouillon"}

</span>

</td>

<td>

<div class="actions">

<button

class="action-button view"

onclick="viewChapter(${chapter.id})">

<i data-lucide="eye"></i>

</button>

<button

class="action-button edit"

onclick="editChapter(${chapter.id})">

<i data-lucide="pencil"></i>

</button>

<button

class="action-button delete"

onclick="deleteChapter(${chapter.id})">

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

document

.getElementById(

"chapter-count"

)

.textContent=

`${chapterState.chapters.length} chapitres`;

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

chapterState.search=

event.target.value.trim();

chapterState.page=1;

loadChapters();

}


/*
==================================
FILTERS
==================================
*/

function handleFilter(){

chapterState.manga=

document

.getElementById(

"manga-filter"

)

.value;

chapterState.status=

document

.getElementById(

"status-filter"

)

.value;

chapterState.page=1;

loadChapters();

}


/*
==================================
REFRESH
==================================
*/

async function refreshPage(){

chapterState.search="";

chapterState.manga="";

chapterState.status="";

chapterState.page=1;

document.getElementById(

"search-chapter"

).value="";

document.getElementById(

"manga-filter"

).value="";

document.getElementById(

"status-filter"

).value="";

await loadChapters();

showSuccess(

"Liste actualisée."

);

}


/*
==================================
PAGINATION
==================================
*/

function previousPage(){

if(

chapterState.page<=1

){

return;

}

chapterState.page--;

loadChapters();

}


function nextPage(){

if(

chapterState.page>=

chapterState.totalPages

){

return;

}

chapterState.page++;

loadChapters();

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

chapterState.totalPages<=1

){

pagination.style.display="none";

return;

}

pagination.style.display="flex";

info.textContent=

`Page ${chapterState.page} sur ${chapterState.totalPages}`;

previous.disabled=

chapterState.page===1;

next.disabled=

chapterState.page===

chapterState.totalPages;

}


/*
==================================
LOADER
==================================
*/

function showLoader(){

const tbody=

document.getElementById(

"chapters-table-body"

);

tbody.innerHTML=

`<tr>

<td colspan="6"

class="loading-row">

Chargement...

</td>

</tr>`;

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
CREATE CHAPTER
==================================
*/

async function saveChapter(event){

event.preventDefault();

try{

const formData=new FormData();

formData.append(

"manga_id",

document.getElementById(

"chapter-manga"

).value

);

formData.append(

"number",

document.getElementById(

"chapter-number"

).value

);

formData.append(

"title",

document.getElementById(

"chapter-title"

).value

);

formData.append(

"status",

document.getElementById(

"chapter-status"

).value

);

formData.append(

"publish_date",

document.getElementById(

"chapter-date"

).value

);

formData.append(

"notes",

document.getElementById(

"chapter-notes"

).value

);

const files=

document.getElementById(

"chapter-pages"

).files;

for(

const file of files

){

formData.append(

"pages",

file

);

}

if(

chapterState.editing

){

await api.put(

`/api/chapters/${chapterState.editing}`,

formData

);

showSuccess(

"Chapitre modifié avec succès."

);

}
else{

await api.post(

"/api/chapters",

formData

);

showSuccess(

"Chapitre ajouté avec succès."

);

}

closeModal();

await loadChapters();

}
catch(error){

console.error(error);

showError(

"Impossible d'enregistrer le chapitre."

);

}

}


/*
==================================
EDIT
==================================
*/

async function editChapter(id){

try{

const chapter=

await api.get(

`/api/chapters/${id}`

);

chapterState.editing=id;

document.getElementById(

"chapter-modal-title"

).textContent=

"Modifier le chapitre";

document.getElementById(

"chapter-manga"

).value=

chapter.manga_id;

document.getElementById(

"chapter-number"

).value=

chapter.number;

document.getElementById(

"chapter-title"

).value=

chapter.title;

document.getElementById(

"chapter-status"

).value=

chapter.status;

document.getElementById(

"chapter-date"

).value=

chapter.publish_date||"";

document.getElementById(

"chapter-notes"

).value=

chapter.notes||"";

document.getElementById(

"chapter-modal"

).classList.remove(

"hidden"

);

renderPreview(

chapter.pages||[]

);

}
catch(error){

console.error(error);

showError(

"Impossible de charger le chapitre."

);

}

}


/*
==================================
VIEW
==================================
*/

function viewChapter(id){

window.location.href=

`reader.html?chapter=${id}`;

}

/*
==================================
DELETE CHAPTER
==================================
*/

async function deleteChapter(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer ce chapitre ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/chapters/${id}`

);

showSuccess(

"Chapitre supprimé avec succès."

);

await loadChapters();

}
catch(error){

console.error(error);

showError(

"Impossible de supprimer le chapitre."

);

}

}


/*
==================================
PREVIEW PAGES
==================================
*/

function previewPages(event){

const files=Array.from(

event.target.files

);

renderPreview(files);

}


/*
==================================
RENDER PREVIEW
==================================
*/

function renderPreview(items){

const grid=

document.getElementById(

"preview-grid"

);

grid.innerHTML="";

items.forEach(

(item,index)=>{

const reader=

new FileReader();

reader.onload=function(e){

const card=

document.createElement(

"div"

);

card.className=

"preview-item";

card.innerHTML=`

<img
src="${e.target.result}"
alt="Page ${index+1}">

<span
class="preview-number">

${index+1}

</span>

`;

grid.appendChild(

card

);

};

if(item instanceof File){

reader.readAsDataURL(item);

}

}

);

}


/*
==================================
CLEAR PREVIEW
==================================
*/

function clearPreview(){

document.getElementById(

"preview-grid"

).innerHTML="";

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

return "-";

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