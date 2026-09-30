/* ============================================================================
 * 路由占位层
 * ----------------------------------------------------------------------------
 * 现在整站是「单页滚动 + 锚点导航」。为了让以后拆成多页时不用重写导航，
 * 所有跳转都统一走这里，而不是直接写 <a href="#x"> 的行为。
 *
 * 以后要拆成多页时，只需要做两件事：
 *   1) 在 config.js 的 nav 里把 href 从 "#projects" 改成 "/projects/"；
 *   2) 在这个文件里给 ROUTES 补上对应条目，并在 resolve() 里返回
 *      { external: true }，让浏览器自己去导航 —— 就完成了。
 * 组件层（app.js）不需要改动，因为它只调用 Router.attach()。
 * ==========================================================================*/
(function () {
  "use strict";

  /* 把 hash 锚点映射到 section id；多页化以后这里会变成真实路径表 */
  var ROUTES = {};

  function register(navItems) {
    ROUTES = {};
    navItems.forEach(function (item) {
      ROUTES[item.href] = { id: item.id, anchor: item.href.charAt(0) === "#" ? item.href.slice(1) : null };
    });
  }

  /**
   * 解析一个 href。
   * @returns {{anchor: (string|null), external: boolean, id: (string|null)}}
   */
  function resolve(href) {
    if (!href) {
      return { anchor: null, external: true, id: null };
    }
    var route = ROUTES[href];
    if (route) {
      return { anchor: route.anchor, external: false, id: route.id };
    }
    /* 没注册过的链接：站外的交给浏览器，站内的按锚点处理 */
    if (href.charAt(0) === "#") {
      return { anchor: href.slice(1), external: false, id: null };
    }
    if (/^(https?:)?\/\//.test(href) || href.indexOf("mailto:") === 0 || href.charAt(0) === "/") {
      return { anchor: null, external: true, id: null };
    }
    return { anchor: href, external: false, id: null };
  }

  /**
   * 给一批链接挂上统一行为：站内锚点做平滑滚动并更新地址栏，站外照常跳转。
   * @param {NodeList|Array} links
   * @param {(id: (string|null)) => void} [onNavigate]
   */
  function attach(links, onNavigate) {
    Array.prototype.forEach.call(links, function (link) {
      /* 已经是修饰键点击 / 新标签页打开：交给浏览器 */
      if (link.dataset.routerBound === "1") {
        return;
      }
      link.dataset.routerBound = "1";
      link.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        var target = resolve(link.getAttribute("href"));
        if (target.external) {
          return;
        }
        event.preventDefault();
        if (target.anchor) {
          var node = document.getElementById(target.anchor);
          if (node) {
            var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, "", "#" + target.anchor);
            }
          }
        }
        if (typeof onNavigate === "function") {
          onNavigate(target.id);
        }
      });
    });
  }

  window.Router = { register: register, resolve: resolve, attach: attach };
})();
