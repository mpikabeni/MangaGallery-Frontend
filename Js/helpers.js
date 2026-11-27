"use strict";
function escapeHtml(value){const d=document.createElement("div");d.textContent=value==null?"":String(value);return d.innerHTML;}
function formatDate(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString("fr-FR");}
function showError(message){if(typeof showToast==='function')showToast(message,"error");else console.error(message);}
function showSuccess(message){if(typeof showToast==='function')showToast(message,"success");}
