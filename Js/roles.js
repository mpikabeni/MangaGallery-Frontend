/*==================================
MANGA GALLERY
ADMIN ROLES
==================================*/

const rolesTableBody =
document.getElementById("roles-table-body");

const addRoleButton =
document.getElementById("add-role");

const searchInput =
document.getElementById("search-role");

const roleModal =
document.getElementById("role-modal");

const closeRoleModal =
document.getElementById("close-role-modal");

const closeRoleButton =
document.getElementById("close-role-button");

const deleteRoleButton =
document.getElementById("delete-role-button");

const roleForm =
document.getElementById("role-form");

let roles = [];


/*==================================
LOAD ROLES
==================================*/

async function loadRoles(){

/*

Le backend chargera ici :

- Les rôles
- Les permissions
- Les administrateurs

*/

}


/*==================================
RENDER ROLES
==================================*/

function renderRoles(data){

rolesTableBody.innerHTML = "";

/*

Les lignes du tableau
seront générées ici
à partir des données
du backend.

*/

}


/*==================================
MODAL
==================================*/

function openModal(){

roleModal.classList.remove("hidden");

}

function closeModal(){

roleModal.classList.add("hidden");

}

addRoleButton.addEventListener(

"click",

openModal

);

closeRoleModal.addEventListener(

"click",

closeModal

);

closeRoleButton.addEventListener(

"click",

closeModal

);

/*==================================
SAVE ROLE
==================================*/

roleForm.addEventListener(

"submit",

async(event)=>{

event.preventDefault();

/*

Le backend enregistrera ici :

- Le rôle
- Les permissions
- Les administrateurs associés

*/

});


/*==================================
DELETE ROLE
==================================*/

deleteRoleButton.addEventListener(

"click",

async()=>{

/*

Le backend supprimera ici
le rôle sélectionné.

*/

});


/*==================================
SEARCH
==================================*/

searchInput.addEventListener(

"input",

()=>{

renderRoles(roles);

}

);


/*==================================
START
==================================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

loadRoles();

if(window.lucide){

lucide.createIcons();

}

});