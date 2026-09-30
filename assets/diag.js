/* ============================================================================
 * 自检面板（只在网址后面加 ?diag=1 时启用，平时完全不做事）
 * ----------------------------------------------------------------------------
 * 它会钩住 window.onerror / unhandledrejection / console.error，统计资源加载
 * 状态，并把视口、横向溢出、各区块元素数量、星空绘制耗时直接印在页面上。
 * 部署到线上后同样可用：打开 https://你的域名/?diag=1 就能自查。
 * ==========================================================================*/
(function () {
  "use strict";

  var enabled = /(^|[?&])diag=1(&|$)/.test(window.location.search);
  if (!enabled) {
    return;
  }

  var errors = [];
  var warnings = [];
  var started = window.performance && window.performance.now ? performance.now() : 0;

  window.addEventListener("error", function (event) {
    var target = event.target;
    if (target && target !== window && (target.src || target.href)) {
      errors.push("资源加载失败: " + (target.src || target.href));
      return;
    }
    errors.push("Error: " + (event.message || "unknown") + " @" + (event.filename || "") + ":" + event.lineno);
  });

  window.addEventListener("unhandledrejection", function (event) {
    errors.push("Unhandled rejection: " + (event.reason && event.reason.message ? event.reason.message : event.reason));
  });

  var originalError = console.error;
  console.error = function () {
    errors.push("console.error: " + Array.prototype.join.call(arguments, " "));
    return originalError.apply(console, arguments);
  };
  var originalWarn = console.warn;
  console.warn = function () {
    warnings.push("console.warn: " + Array.prototype.join.call(arguments, " "));
    return originalWarn.apply(console, arguments);
  };

  function row(label, value, ok) {
    var tone = ok === undefined ? "" : ok ? " ok" : " bad";
    return '<div class="diag__row' + tone + '"><span>' + label + "</span><b>" + value + "</b></div>";
  }

  function collect() {
    var resources = window.performance.getEntriesByType ? performance.getEntriesByType("resource") : [];
    var badResources = resources.filter(function (entry) {
      return entry.responseStatus && entry.responseStatus >= 400;
    });
    var lands = resources.filter(function (entry) {
      return /^https?:/i.test(entry.name) && entry.name.indexOf(window.location.origin) !== 0;
    });
    var wide = document.documentElement.scrollWidth > window.innerWidth + 1;
    var sky = document.querySelector("[data-sky]");

    var panels = [
      ["视口", window.innerWidth + " × " + window.innerHeight],
      ["文档宽度", document.documentElement.scrollWidth + "px（视口 " + window.innerWidth + "px）"],
      ["横向溢出", wide ? "有 ❌" : "无 ✅", !wide],
      ["主题", document.documentElement.dataset.theme],
      ["页面报错", String(errors.length), errors.length === 0],
      ["失败资源", badResources.length ? badResources.length + " → " + badResources[0].name : "0", badResources.length === 0],
      ["外部请求", lands.length ? lands.length + " 个（不应该有！）" : "0（零外链）", lands.length === 0],
      ["星空笔触", document.querySelectorAll("[data-sky] path").length + " path"],
      ["绘制耗时", (sky && sky.dataset.paintMs) + "ms"],
      ["首屏完成", Math.round((performance.now ? performance.now() : 0) - started) + "ms"],
      ["项目/文章", document.querySelectorAll(".project").length + " / " + document.querySelectorAll(".post").length],
      ["游戏/番剧", document.querySelectorAll("[data-games] .media-card").length + " / " + document.querySelectorAll("[data-anime] .media-card").length],
      ["技能/雷达轴", document.querySelectorAll(".skill").length + " / " + document.querySelectorAll(".radar-label").length],
      ["导航项", document.querySelectorAll("[data-nav] a").length],
      ["入场动画", document.querySelectorAll("[data-reveal].is-visible").length + "/" + document.querySelectorAll("[data-reveal]").length],
      ["星空已显影", document.querySelector("[data-hero]").classList.contains("is-painted") ? "是 ✅" : "否 ❌"],
      ["控制台警告", warnings.length ? String(warnings.length) : "0"],
    ];

    var html = '<div class="diag__head">自检 · ' + (errors.length === 0 ? "无报错 ✅" : errors.length + " 个报错 ❌") + "</div>";
    panels.forEach(function (entry) {
      html += row(entry[0], String(entry[1]), entry[2]);
    });
    errors.slice(0, 6).forEach(function (message) {
      html += '<div class="diag__err">' + message + "</div>";
    });

    var box = document.createElement("div");
    box.className = "diag";
    box.innerHTML = html;
    document.body.appendChild(box);
  }

  window.addEventListener("load", function () {
    window.setTimeout(collect, 3200);
  });
})();
