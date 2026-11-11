/*
==================================
MANGA GALLERY
CATEGORIES
VERSION FINALE
==================================
*/

"use strict";

/*==================================
CONFIG
==================================*/

const api = window.api || window.API;

const categoryState = {

categories:[],

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

initializeCategoriesPage

);


/*==================================
INITIALIZE PAGE
==================================
*/

async function initializeCategoriesPage(){

try{

if(window.lucide){

lucide.createIcons();

}

bindEvents();

await protectPage(

["admin","super_admin"]

);

await loadCategories();

initializeIconPreview();

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

"search-category"

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

"refresh-categories"

)

.addEventListener(

"click",

refreshPage

);

document

.getElementById(

"add-category"

)

.addEventListener(

"click",

openCreateModal

);

document

.getElementById(

"category-form"

)

.addEventListener(

"submit",

saveCategory

);

document

.getElementById(

"cancel-category-button"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"close-category-modal"

)

.addEventListener(

"click",

closeModal

);

document

.getElementById(

"category-icon"

)

.addEventListener(

"change",

previewIcon

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

categoryState.editing=null;

document

.getElementById(

"category-form"

)

.reset();

document

.getElementById(

"category-id"

).value="";

document

.getElementById(

"category-modal-title"

)

.textContent=

"Ajouter une catégorie";

resetIconPreview();

document

.getElementById(

"category-modal"

)

.classList.remove(

"hidden"

);

}


function closeModal(){

document

.getElementById(

"category-modal"

)

.classList.add(

"hidden"

);

}

/*
==================================
LOAD CATEGORIES
==================================
*/

async function loadCategories(){

try{

showLoader();

const response=

await api.get(

"/api/categories",

{

page:categoryState.page,

limit:categoryState.limit,

search:categoryState.search,

status:categoryState.status

}

);

categoryState.categories=

response.items||[];

categoryState.totalPages=

response.total_pages||1;

renderCategories();

updatePagination();

hideLoader();

}
catch(error){

hideLoader();

console.error(error);

showError(

"Impossible de charger les catégories."

);

}

}


/*
==================================
RENDER TABLE
==================================
*/

function renderCategories(){

const tbody=

document.getElementById(

"categories-table-body"

);

tbody.innerHTML="";

if(

categoryState.categories.length===0

){

tbody.innerHTML=

`

<tr>

<td
colspan="8"
class="loading-row">

Aucune catégorie trouvée.

</td>

</tr>

`;

updateCounter();

return;

}

categoryState.categories.forEach(

category=>{

const tr=

document.createElement(

"tr"

);

tr.innerHTML=

`

<td>

<div class="category-icon">

<img

src="${category.icon||'assets/default-category.png'}"

alt="${escapeHtml(category.name)}">

</div>

</td>

<td>

${escapeHtml(category.name)}

</td>

<td>

${category.slug}

</td>

<td>

<div

style="

width:28px;

height:28px;

border-radius:50%;

background:${category.color};

border:1px solid #444;

">

</div>

</td>

<td>

${category.mangas_count||0}

</td>

<td>

<span

class="status ${category.status}">

${getStatusLabel(

category.status

)}

</span>

</td>

<td>

${formatDate(

category.created_at

)}

</td>

<td>

<div class="actions">

<button

class="action-button view"

onclick="viewCategory(${category.id})">

<i data-lucide="eye"></i>

</button>

<button

class="action-button edit"

onclick="editCategory(${category.id})">

<i data-lucide="pencil"></i>

</button>

<button

class="action-button delete"

onclick="deleteCategory(${category.id})">

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

"category-count"

).textContent=

`${categoryState.categories.length} catégories`;

}

/*
==================================
SEARCH
==================================
*/

function handleSearch(event){

categoryState.search=

event.target.value.trim();

categoryState.page=1;

loadCategories();

}


/*
==================================
FILTERS
==================================
*/

function handleFilter(){

categoryState.status=

document.getElementById(

"status-filter"

).value;

categoryState.page=1;

loadCategories();

}


/*
==================================
REFRESH
==================================
*/

async function refreshPage(){

categoryState.search="";

categoryState.status="";

categoryState.page=1;

document.getElementById(

"search-category"

).value="";

document.getElementById(

"status-filter"

).value="";

await loadCategories();

showSuccess(

"Liste des catégories actualisée."

);

}


/*
==================================
PAGINATION
==================================
*/

function previousPage(){

if(categoryState.page<=1){

return;

}

categoryState.page--;

loadCategories();

}


function nextPage(){

if(categoryState.page>=categoryState.totalPages){

return;

}

categoryState.page++;

loadCategories();

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

if(categoryState.totalPages<=1){

pagination.style.display="none";

return;

}

pagination.style.display="flex";

info.textContent=

`Page ${categoryState.page} sur ${categoryState.totalPages}`;

previous.disabled=

categoryState.page===1;

next.disabled=

categoryState.page===categoryState.totalPages;

}


/*
==================================
LOADER
==================================
*/

function showLoader(){

const tbody=

document.getElementById(

"categories-table-body"

);

tbody.innerHTML=

`

<tr>

<td
colspan="8"
class="loading-row">

Chargement des catégories...

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
VIEW CATEGORY
==================================
*/

function viewCategory(id){

window.location.href=

`mangas.html?category=${id}`;

}

/*
==================================
SAVE CATEGORY
==================================
*/

async function saveCategory(event){

event.preventDefault();

if(!validateCategoryForm()){

return;

}

try{

const formData=new FormData();

formData.append(

"name",

document.getElementById(

"category-name"

).value.trim()

);

formData.append(

"slug",

document.getElementById(

"category-slug"

).value.trim()

);

formData.append(

"color",

document.getElementById(

"category-color"

).value

);

formData.append(

"description",

document.getElementById(

"category-description"

).value.trim()

);

formData.append(

"status",

document.getElementById(

"category-status"

).value

);

const icon=

document.getElementById(

"category-icon"

).files[0];

if(icon){

formData.append(

"icon",

icon

);

}

const saveButton=

document.getElementById(

"save-category-button"

);

setLoading(

saveButton,

true

);

if(categoryState.editing){

await api.put(

`/api/categories/${categoryState.editing}`,

formData

);

showSuccess(

"Catégorie modifiée avec succès."

);

}else{

await api.post(

"/api/categories",

formData

);

showSuccess(

"Catégorie ajoutée avec succès."

);

}

setLoading(

saveButton,

false

);

cleanupModal();

await loadCategories();

}
catch(error){

setLoading(

document.getElementById(

"save-category-button"

),

false

);

console.error(error);

handleApiError(error);

}

}


/*
==================================
EDIT CATEGORY
==================================
*/

async function editCategory(id){

try{

const category=

await api.get(

`/api/categories/${id}`

);

categoryState.editing=id;

document.getElementById(

"category-modal-title"

).textContent=

"Modifier la catégorie";

document.getElementById(

"category-id"

).value=

category.id;

document.getElementById(

"category-name"

).value=

category.name;

document.getElementById(

"category-slug"

).value=

category.slug;

document.getElementById(

"category-color"

).value=

category.color||

"#E11D2E";

document.getElementById(

"category-status"

).value=

category.status||

"active";

document.getElementById(

"category-description"

).value=

category.description||

"";

document.getElementById(

"icon-preview"

).src=

category.icon||

"assets/default-category.png";

document.getElementById(

"category-modal"

).classList.remove(

"hidden"

);

}
catch(error){

console.error(error);

handleApiError(error);

}

}

/*
==================================
DELETE CATEGORY
==================================
*/

async function deleteCategory(id){

try{

const confirmed=confirm(

"Voulez-vous vraiment supprimer cette catégorie ?"

);

if(!confirmed){

return;

}

await api.delete(

`/api/categories/${id}`

);

showSuccess(

"Catégorie supprimée avec succès."

);

await loadCategories();

}
catch(error){

console.error(error);

handleApiError(error);

}

}


/*
==================================
ICON PREVIEW
==================================
*/

function initializeIconPreview(){

const input=

document.getElementById(

"category-icon"

);

if(!input){

return;

}

input.addEventListener(

"change",

previewIcon

);

}


function previewIcon(event){

const file=

event.target.files[0];

if(!file){

resetIconPreview();

return;

}

const reader=

new FileReader();

reader.onload=function(e){

document.getElementById(

"icon-preview"

).src=e.target.result;

};

reader.readAsDataURL(file);

}


function resetIconPreview(){

document.getElementById(

"icon-preview"

).src=

"assets/default-category.png";

}


/*
==================================
SLUG
==================================
*/

function initializeSlugGenerator(){

const input=

document.getElementById(

"category-name"

);

if(!input){

return;

}

input.addEventListener(

"input",

generateSlug

);

}


function generateSlug(){

const value=

document.getElementById(

"category-name"

).value;

document.getElementById(

"category-slug"

).value=

value

.toLowerCase()

.normalize("NFD")

.replace(/[\u0300-\u036f]/g,"")

.replace(/[^a-z0-9]+/g,"-")

.replace(/^-|-$/g,"");

}


/*
==================================
VALIDATION
==================================
*/

function validateCategoryForm(){

const name=

document.getElementById(

"category-name"

).value.trim();

const slug=

document.getElementById(

"category-slug"

).value.trim();

if(name.length<2){

showError(

"Le nom est obligatoire."

);

return false;

}

if(slug.length<2){

showError(

"Le slug est invalide."

);

return false;

}

return true;

}


/*
==================================
STATUS LABEL
==================================
*/

function getStatusLabel(status){

switch(status){

case"active":

return"Active";

case"disabled":

return"Désactivée";

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
RESET FORM
==================================
*/

function resetForm(){

document.getElementById(

"category-form"

).reset();

document.getElementById(

"category-id"

).value="";

categoryState.editing=null;

resetIconPreview();

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
ESC CLOSE
==================================
*/

document.addEventListener(

"keydown",

event=>{

if(event.key==="Escape"){

closeModal();

}

});


/*
==================================
OUTSIDE CLICK
==================================
*/

document.getElementById(

"category-modal"

)

.addEventListener(

"click",

event=>{

if(event.target.id==="category-modal"){

closeModal();

}

});


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
AUTO REFRESH
==================================
*/

let refreshTimer=null;

function startAutoRefresh(){

stopAutoRefresh();

refreshTimer=setInterval(

()=>{

loadCategories();

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


/*
==================================
WINDOW EVENTS
==================================
*/

window.addEventListener(

"focus",

()=>{

loadCategories();

}

);

window.addEventListener(

"beforeunload",

()=>{

stopAutoRefresh();

}

);


/*
==================================
KEYBOARD SHORTCUTS
==================================
*/

document.addEventListener(

"keydown",

event=>{

if(event.ctrlKey&&event.key==="n"){

event.preventDefault();

openCreateModal();

}

if(event.ctrlKey&&event.key==="r"){

event.preventDefault();

refreshPage();

}

});


/*
==================================
APPLICATION READY
==================================
*/

(async()=>{

try{

startAutoRefresh();

}
catch(error){

console.error(error);

}

})();


/*
==================================
PUBLIC METHODS
==================================
*/

window.initializeCategoriesPage=

initializeCategoriesPage;

window.editCategory=

editCategory;

window.deleteCategory=

deleteCategory;

window.viewCategory=

viewCategory;


/*
==================================
READY FOR PRODUCTION
==================================
*/