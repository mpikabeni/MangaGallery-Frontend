/*==================================
MANGA GALLERY
ADMIN MEDIA
==================================*/

const mediaGrid =
document.getElementById("media-grid");

const uploadMediaButton =
document.getElementById("upload-media");

const searchInput =
document.getElementById("search-media");

const mediaFilter =
document.getElementById("media-filter");

const mediaModal =
document.getElementById("media-modal");

const closeMediaModal =
document.getElementById("close-media-modal");

const closeMediaButton =
document.getElementById("close-media-button");

const renameMediaButton =
document.getElementById("rename-media-button");

const downloadMediaButton =
document.getElementById("download-media-button");

const deleteMediaButton =
document.getElementById("delete-media-button");

const mediaForm =
document.getElementById("media-form");

let mediaFiles = [];


/*==================================
LOAD MEDIA
==================================*/

async function loadMedia(){

/*

Le backend chargera ici :

- Les images
- Les couvertures
- Les bannières
- Les fichiers

*/

}


/*==================================
RENDER MEDIA
==================================*/

function renderMedia(data){

mediaGrid.innerHTML = "";

/*

Les cartes de médias
seront générées ici
à partir des données
du backend.

*/

}


/*==================================
MODAL
==================================*/

function openModal(){

mediaModal.classList.remove("hidden");

}

function closeModal(){

mediaModal.classList.add("hidden");

}

closeMediaModal.addEventListener(

"click",

closeModal

);

closeMediaButton.addEventListener(

"click",

closeModal

);

/*==================================
UPLOAD MEDIA
==================================*/

uploadMediaButton.addEventListener(

"click",

async()=>{

/*

Le backend ouvrira ici
la sélection de fichiers
et importera les médias.

*/

});


/*==================================
RENAME MEDIA
==================================*/

renameMediaButton.addEventListener(

"click",

async()=>{

/*

Le backend renommera ici
le fichier sélectionné.

*/

});


/*==================================
DOWNLOAD MEDIA
==================================*/

downloadMediaButton.addEventListener(

"click",

async()=>{

/*

Le backend téléchargera ici
le fichier sélectionné.

*/

});


/*==================================
DELETE MEDIA
==================================*/

deleteMediaButton.addEventListener(

"click",

async()=>{

/*

Le backend supprimera ici
le fichier sélectionné.

*/

});


/*==================================
SEARCH
==================================*/

searchInput.addEventListener(

"input",

()=>{

renderMedia(mediaFiles);

}

);


/*==================================
FILTER
==================================*/

mediaFilter.addEventListener(

"change",

()=>{

renderMedia(mediaFiles);

}

);


/*==================================
START
==================================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

loadMedia();

if(window.lucide){

lucide.createIcons();

}

});