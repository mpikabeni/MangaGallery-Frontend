/* Nexa Admin - HTML sanitizer (defense in depth against stored XSS).
 * The admin panel renders data written by ordinary users (names, comments...). Everything assigned through
 * innerHTML / insertAdjacentHTML is parsed and cleaned first: no <script>/<iframe>/..., no on* attributes
 * (except a strict allow-list of the panel's own buttons, e.g. onclick="editUser(12)"), no javascript: URLs. */
(function () {
  "use strict";
  const BAD_TAGS = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "BASE", "FRAME", "FRAMESET", "APPLET", "NOSCRIPT"]);
  const URL_ATTRS = new Set(["href", "src", "xlink:href", "action", "formaction", "data", "poster", "background"]);
  const SAFE_CLICK = /^(view|edit|delete|toggle|approve|reject|hide|restore|resend|download|rename|assign|open|close|show|publish|unpublish|ban|unban|suspend|activate|deactivate|resolve|review|mark)[A-Za-z]*\(\s*\d+\s*\)\s*;?$/;

  function clean(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const doomed = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (BAD_TAGS.has(n.tagName.toUpperCase())) { doomed.push(n); continue; }
      for (const a of Array.from(n.attributes || [])) {
        const name = a.name.toLowerCase(), val = a.value.trim();
        if (name.startsWith("on")) {
          if (!(name === "onclick" && SAFE_CLICK.test(val))) n.removeAttribute(a.name);
        } else if (name === "srcdoc") {
          n.removeAttribute(a.name);
        } else if (URL_ATTRS.has(name) && /^(javascript|vbscript|data\s*:\s*text\/html)/i.test(val.replace(/[\u0000-\u0020]+/g, ""))) {
          n.removeAttribute(a.name);
        }
      }
    }
    doomed.forEach((n) => n.remove());
  }
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  function sanitize(html) {
    const t = document.createElement("template");
    desc.set.call(t, String(html));          // native setter: no recursion
    clean(t.content);
    return desc.get.call(t);
  }

  Object.defineProperty(Element.prototype, "innerHTML", {
    configurable: true, enumerable: desc.enumerable, get: desc.get,
    set(v) { desc.set.call(this, sanitize(v)); },
  });
  const insert = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, html) { return insert.call(this, pos, sanitize(html)); };
  window.NexaSanitize = sanitize;
})();
