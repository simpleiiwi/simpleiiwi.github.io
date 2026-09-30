/* ============================================================================
 * 图标集：全部手写内联 SVG，统一 24×24 画布、统一 1.6 描边、圆头圆角。
 * 没有任何图标字体、CDN 或 Unicode/emoji 占位。
 * ==========================================================================*/
(function () {
  "use strict";

  var STROKE = {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.6",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };

  /* 描边类图标：图形由 path / rect / circle 组成 */
  var OUTLINE = {
    home:
      '<path d="M3.6 10.4 12 3.9l8.4 6.5V19a1.6 1.6 0 0 1-1.6 1.6h-3.9v-6H9.1v6H5.2A1.6 1.6 0 0 1 3.6 19z"/>',
    projects:
      '<rect x="3.6" y="3.6" width="6.8" height="6.8" rx="1.8"/><rect x="13.6" y="3.6" width="6.8" height="6.8" rx="1.8"/><rect x="3.6" y="13.6" width="6.8" height="6.8" rx="1.8"/><rect x="13.6" y="13.6" width="6.8" height="6.8" rx="1.8"/>',
    posts:
      '<path d="M13.9 3.4H7.3a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h9.4a2 2 0 0 0 2-2V8.1z"/><path d="M13.9 3.4v4.7h4.8"/><path d="M8.6 12.6h6.8M8.6 16.1h4.4"/>',
    games:
      '<path d="M7.4 7.7h9.2a4.6 4.6 0 0 1 4.5 5.5l-.5 2.4a2.5 2.5 0 0 1-4.5 1l-1-1.4H8.9l-1 1.4a2.5 2.5 0 0 1-4.5-1l-.5-2.4a4.6 4.6 0 0 1 4.5-5.5z"/><path d="M7.2 11.1v2.6M5.9 12.4h2.6"/><path d="M16.2 11.7h.01M18.2 13.5h.01"/>',
    anime:
      '<rect x="2.7" y="4.4" width="18.6" height="13.1" rx="2.1"/><path d="M8.4 20.6h7.2"/><path d="M10.7 8.9v4.2l3.9-2.1z"/>',
    skills:
      '<path d="M4.2 19.8 13.4 10.6"/><path d="M11.8 9 15 12.2"/><path d="M17.6 3.2v3.6M15.8 5h3.6"/><path d="M20.4 9.1v2.9M19 10.55h2.9"/><path d="M16.9 12.1v2.4M15.7 13.3h2.4"/>',
    sun:
      '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.6v2.2M12 19.2v2.2M4.35 4.35l1.55 1.55M18.1 18.1l1.55 1.55M2.6 12h2.2M19.2 12h2.2M4.35 19.65 5.9 18.1M18.1 5.9l1.55-1.55"/>',
    moon:
      '<path d="M20.4 14.8A8.7 8.7 0 0 1 9.1 3.5a8.7 8.7 0 1 0 11.3 11.3z"/>',
    eye:
      '<path d="M2.6 12S6.1 5.9 12 5.9 21.4 12 21.4 12 17.9 18.1 12 18.1 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.9"/>',
    mail:
      '<rect x="2.9" y="5.1" width="18.2" height="13.8" rx="2.2"/><path d="M3.6 7.3 12 13.1l8.4-5.8"/>',
    rss:
      '<circle cx="5.4" cy="18.5" r="1.5" fill="currentColor" stroke="none"/><path d="M4 11.1a8.9 8.9 0 0 1 8.9 8.9"/><path d="M4 4.4A15.6 15.6 0 0 1 19.6 20"/>',
    external:
      '<path d="M13.9 4.3h5.8v5.8"/><path d="M19.7 4.3 11 13"/><path d="M18 14.2v4.4a1.7 1.7 0 0 1-1.7 1.7H5.9a1.7 1.7 0 0 1-1.7-1.7V8.2a1.7 1.7 0 0 1 1.7-1.7h4.4"/>',
    clock:
      '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.2V12l3.2 2.1"/>',
    arrowUp:
      '<path d="M12 19.3V5.1"/><path d="M5.9 11.2 12 5.1l6.1 6.1"/>',
    menu: '<path d="M3.8 7.2h16.4M3.8 12h16.4M3.8 16.8h16.4"/>',
    close: '<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>',
    location:
      '<path d="M12 21.2s6.6-5.6 6.6-10.4a6.6 6.6 0 1 0-13.2 0C5.4 15.6 12 21.2 12 21.2z"/><circle cx="12" cy="10.6" r="2.5"/>',
    arrowRight: '<path d="M4.6 12h14.2"/><path d="M13 6.3l5.8 5.7-5.8 5.7"/>',
  };

  /* 实心类图标 */
  var SOLID = {
    github:
      '<path fill="currentColor" stroke="none" d="M12 2.2A9.9 9.9 0 0 0 2.1 12.1c0 4.4 2.85 8.13 6.8 9.45.5.09.68-.22.68-.48v-1.7c-2.77.6-3.35-1.33-3.35-1.33-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.52 1.03 1.52 1.03.88 1.52 2.32 1.08 2.89.83.09-.64.35-1.08.63-1.33-2.21-.25-4.54-1.11-4.54-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.56 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48a9.9 9.9 0 0 0 6.79-9.45A9.9 9.9 0 0 0 12 2.2z"/>',
    star:
      '<path fill="currentColor" stroke="none" d="M12 3.3 14.75 9l6.25.92-4.5 4.4 1.06 6.2L12 17.6l-5.56 2.92L7.5 14.3 3 9.9 9.25 9z"/>',
    fork:
      '<path fill="currentColor" stroke="none" d="M6.2 3.4a3 3 0 0 0-1.1 5.8v1.1a3.4 3.4 0 0 0 3.4 3.4h2.6v2.1a3 3 0 1 0 1.8 0v-2.1h2.6a3.4 3.4 0 0 0 3.4-3.4V9.2a3 3 0 1 0-1.8 0v1.1c0 .9-.7 1.6-1.6 1.6H8.5c-.9 0-1.6-.7-1.6-1.6V9.1A3 3 0 0 0 6.2 3.4zm-.6 2.4a1.8 1.8 0 1 1 3.6 0 1.8 1.8 0 0 1-3.6 0zm5.5 12.1a1.8 1.8 0 1 1 3.6 0 1.8 1.8 0 0 1-3.6 0zM16.9 4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z"/>',
  };

  function attrs(map) {
    var out = "";
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        out += " " + key + '="' + map[key] + '"';
      }
    }
    return out;
  }

  /**
   * 生成一个图标 SVG 字符串。
   * @param {string} name  图标名（OUTLINE / SOLID 里的键）
   * @param {number} size  像素尺寸，默认 20
   * @param {string} cls   附加 class
   */
  function icon(name, size, cls) {
    var body = OUTLINE[name] || SOLID[name];
    if (!body) {
      return "";
    }
    var solid = Object.prototype.hasOwnProperty.call(SOLID, name) && !OUTLINE[name];
    size = size || 20;
    return (
      '<svg class="icon' +
      (cls ? " " + cls : "") +
      '" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24"' +
      (solid ? "" : attrs(STROKE)) +
      ' aria-hidden="true" focusable="false">' +
      body +
      "</svg>"
    );
  }

  window.Icons = {
    get: icon,
    names: Object.keys(OUTLINE).concat(Object.keys(SOLID)),
  };
})();
