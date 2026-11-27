"use strict";
function showToast(message,type="info"){
 let box=document.getElementById("mg-toast-container");
 if(!box){box=document.createElement("div");box.id="mg-toast-container";box.style.cssText="position:fixed;right:20px;top:20px;z-index:99999;display:flex;flex-direction:column;gap:10px";document.body.appendChild(box);}
 const item=document.createElement("div");item.textContent=message;item.style.cssText="padding:12px 16px;border-radius:10px;background:#111827;color:white;box-shadow:0 8px 30px rgba(0,0,0,.2);font:500 14px Poppins,Arial";box.dataset.type=type;box.style.borderLeft="4px solid "+(type==="error"?"#dc2626":type==="success"?"#16a34a":"#6b7280");box.appendChild(item);setTimeout(()=>item.remove(),3500);
}
