/* ============================================================================
 * 主逻辑：把 config.js 里的数据渲染成页面，并接管全部交互。
 *   主题切换（记忆到 localStorage） / 导航高亮 / 吸顶折叠 / 移动端菜单
 *   滚动淡入 / 访客计数 / 封面懒加载 / 回到顶部 / 技能雷达图
 * ==========================================================================*/
(function () {
  "use strict";

  var cfg = window.SiteConfig;
  var icon = window.Icons.get;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var THEME_KEY = "personal-site.theme";
  var VISIT_SESSION_KEY = "personal-site.visit-session";
  var DEMO_DISMISS_KEY = "personal-site.demo-dismissed";

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function esc(value) {
    return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  /* ============================ 1. 文档信息 ============================ */

  /**
   * 网址上带参数时临时覆盖配置，方便调样式 / 给朋友看不同版本，不改文件也不影响正式数据：
   *   ?seed=123     换一幅星空（等价于改 config.js 里的 meta.skySeed）
   *   ?theme=light  强制亮色主题
   */
  function applyUrlOverrides() {
    try {
      var params = new URLSearchParams(window.location.search);
      var seed = Number(params.get("seed"));
      if (seed) {
        cfg.meta.skySeed = seed;
      }
      var theme = params.get("theme");
      if (theme === "light" || theme === "dark") {
        document.documentElement.dataset.theme = theme;
      }
    } catch (err) {
      /* 老浏览器没有 URLSearchParams 就算了 */
    }
  }

  function initDocument() {
    document.documentElement.lang = cfg.meta.lang || "zh-CN";
    document.title = cfg.meta.title;
    var desc = $('meta[name="description"]');
    if (desc) {
      desc.setAttribute("content", cfg.meta.description);
    }
    syncThemeColor();
  }

  function syncThemeColor() {
    var meta = $('meta[name="theme-color"]');
    if (!meta) {
      return;
    }
    meta.setAttribute(
      "content",
      document.documentElement.dataset.theme === "light" ? "#f6f7fb" : "#070c1c"
    );
  }

  /* ============================== 2. 主题 ============================== */

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function setTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch (err) {
        /* 隐私模式下写不进去也没关系，本次会话照常生效 */
      }
    }
    var toggle = $("[data-theme-toggle]");
    if (toggle) {
      var next = theme === "light" ? "切换到深色主题" : "切换到亮色主题";
      toggle.innerHTML = icon(theme === "light" ? "moon" : "sun", 18);
      toggle.setAttribute("aria-label", next);
      toggle.setAttribute("title", next);
    }
    syncThemeColor();
  }

  function initTheme() {
    var toggle = $("[data-theme-toggle]");
    if (!toggle) {
      return;
    }
    setTheme(currentTheme(), false);
    toggle.addEventListener("click", function () {
      setTheme(currentTheme() === "light" ? "dark" : "light", true);
    });
  }

  /* ============================== 3. 头部 ============================== */

  function renderHeader() {
    var nav = $("[data-nav]");
    var brand = $("[data-brand]");
    var githubCta = $("[data-github-cta]");
    var mobilePanel = $("[data-mobile-panel]");

    if (brand) {
      brand.href = cfg.profile.ctaPrimary.href || "#home";
      brand.innerHTML =
        '<span class="brand__mark" aria-hidden="true">' + icon("star", 14) + "</span>" +
        '<span class="brand__name">' + esc(cfg.profile.name) + "</span>";
      if (cfg.profile.location) {
        brand.title = cfg.profile.name + " · " + cfg.profile.location;
      }
    }

    var navHtml = cfg.nav
      .map(function (item) {
        return (
          '<li><a class="nav__link" href="' +
          esc(item.href) +
          '" data-nav-id="' +
          esc(item.id) +
          '"' +
          (item.id === "home" ? ' aria-current="true"' : "") +
          ">" +
          icon(item.icon, 18) +
          "<span>" +
          esc(item.label) +
          "</span></a></li>"
        );
      })
      .join("");
    if (nav) {
      nav.innerHTML = navHtml;
    }
    if (mobilePanel) {
      mobilePanel.innerHTML =
        '<ul class="mobile-nav__list">' + navHtml + "</ul>" +
        '<a class="mobile-nav__cta" href="' +
        esc(cfg.githubCta.href) +
        '" rel="me noopener">' +
        icon("github", 18) +
        "<span>" +
        esc(cfg.githubCta.label) +
        "</span>" +
        "</a>";
    }
    if (githubCta) {
      githubCta.href = cfg.githubCta.href;
      githubCta.rel = "me noopener";
      githubCta.innerHTML =
        icon("github", 18) + "<span>" + esc(cfg.githubCta.label) + "</span>" + icon("arrowRight", 16);
    }

    var githubIcon = $("[data-github-icon]");
    if (githubIcon) {
      githubIcon.href = cfg.githubCta.href;
      githubIcon.rel = "me noopener";
      githubIcon.innerHTML = icon("github", 18);
      githubIcon.setAttribute("aria-label", cfg.githubCta.label);
      githubIcon.setAttribute("title", cfg.githubCta.label);
    }

    var themeToggle = $("[data-theme-toggle]");
    if (themeToggle) {
      themeToggle.setAttribute("type", "button");
    }

    var menuToggle = $("[data-menu-toggle]");
    if (menuToggle) {
      menuToggle.innerHTML = icon("menu", 20);
    }
  }

  /* 访客计数：纯本地计数，没有后端也能跑；同一标签页会话只加一次 */
  function initVisitor() {
    var slot = $("[data-visitor]");
    if (!slot) {
      return;
    }
    if (!cfg.visitor.enabled) {
      slot.remove();
      return;
    }
    var value = Number(cfg.visitor.initial) || 0;
    try {
      var stored = window.localStorage.getItem(cfg.visitor.storageKey);
      value = stored ? Number(stored) : value;
      if (!window.sessionStorage.getItem(VISIT_SESSION_KEY)) {
        value += 1;
        window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
        window.localStorage.setItem(cfg.visitor.storageKey, String(value));
      }
    } catch (err) {
      /* 存不了就显示初始值，不中断渲染 */
    }
    slot.innerHTML =
      icon("eye", 18) +
      '<span class="visitor__count">' + formatNumber(value) + "</span>";
    slot.setAttribute("title", "本站访问计数（本地统计，接后端可换成真实数据）");
    slot.setAttribute("aria-label", "本站访问 " + formatNumber(value) + " 次");
  }

  /* 首屏：星空 + 头像 + 文案 + 按钮 + 统计条 */
  function renderHero() {
    var nameEl = $("[data-hero-name]");
    var kickerEl = $("[data-hero-kicker]");
    var roleEl = $("[data-hero-role]");
    var introEl = $("[data-hero-intro]");
    var avatarEl = $("[data-hero-avatar]");
    var ctaEl = $("[data-hero-cta]");
    var statsEl = $("[data-hero-stats]");

    if (kickerEl) {
      kickerEl.textContent = cfg.profile.kicker;
    }
    if (nameEl) {
      nameEl.textContent = cfg.profile.name;
    }
    if (roleEl) {
      roleEl.textContent = cfg.profile.role;
    }
    if (introEl) {
      introEl.textContent = cfg.profile.intro;
    }

    if (avatarEl) {
      /* 没有头像图、或者图挂了（还没上传 / 路径写错）时，退回姓名首字生成的头像 */
      var showInitialAvatar = function () {
        var hash = 0;
        for (var i = 0; i < cfg.profile.name.length; i++) {
          hash = (hash * 31 + cfg.profile.name.charCodeAt(i)) % 360;
        }
        avatarEl.innerHTML =
          '<span class="avatar__initial" style="--avatar-hue:' +
          hash +
          '" aria-hidden="true">' +
          esc(cfg.profile.name.charAt(0)) +
          "</span>";
        avatarEl.setAttribute("role", "img");
        avatarEl.setAttribute("aria-label", cfg.profile.name + "的头像占位图");
      };

      if (cfg.profile.avatar) {
        avatarEl.innerHTML =
          '<img src="' + esc(cfg.profile.avatar) + '" alt="' + esc(cfg.profile.name) + '的头像" width="152" height="152">';
        avatarEl.removeAttribute("role");
        avatarEl.removeAttribute("aria-label");
        var avatarImg = avatarEl.querySelector("img");
        if (avatarImg) {
          avatarImg.addEventListener("error", showInitialAvatar);
        }
      } else {
        showInitialAvatar();
      }
    }

    var statusEl = $("[data-hero-status]");
    if (statusEl) {
      if (cfg.profile.status) {
        statusEl.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + esc(cfg.profile.status);
      } else {
        statusEl.remove();
      }
    }

    if (ctaEl) {
      ctaEl.innerHTML =
        '<a class="btn btn--primary" href="' +
        esc(cfg.profile.ctaPrimary.href) +
        '" rel="me noopener">' +
        icon(cfg.profile.ctaPrimary.icon, 18) +
        "<span>" +
        esc(cfg.profile.ctaPrimary.label) +
        "</span></a>" +
        '<a class="btn btn--ghost" href="' +
        esc(cfg.profile.ctaGhost.href) +
        '">' +
        icon(cfg.profile.ctaGhost.icon, 18) +
        "<span>" +
        esc(cfg.profile.ctaGhost.label) +
        "</span></a>";
    }

    if (statsEl) {
      statsEl.innerHTML = cfg.stats
        .map(function (stat) {
          return (
            '<li class="stat">' +
            '<span class="stat__value">' +
            esc(formatNumber(stat.value)) +
            '<span class="stat__suffix">' +
            esc(stat.suffix || "") +
            "</span></span>" +
            '<span class="stat__label">' +
            esc(stat.label) +
            "</span>" +
            "</li>"
          );
        })
        .join("");
    }

    /* 首屏背景：配了图就用图，没配（或图片没传上去 / 路径写错）才用代码画星空 */
    var skySlot = $("[data-sky]");
    if (skySlot) {
      var paintSky = function () {
        if (!window.Sky) {
          return;
        }
        var started = window.performance && window.performance.now ? window.performance.now() : 0;
        window.Sky.render(skySlot, {
          seed: cfg.meta.skySeed,
          width: 1600,
          height: 900,
          variant: "hero",
        });
        var elapsed = (window.performance.now ? window.performance.now() : 0) - started;
        skySlot.dataset.paintMs = String(Math.round(elapsed));
      };

      if (cfg.meta.heroImage) {
        skySlot.classList.add("hero__sky--photo");
        skySlot.innerHTML =
          '<img class="hero__photo" src="' +
          esc(cfg.meta.heroImage) +
          '" alt="" aria-hidden="true" decoding="async">' +
          '<span class="hero__scrim" aria-hidden="true"></span>';
        skySlot.dataset.paintMs = "0";
        var heroImg = skySlot.querySelector("img");
        if (heroImg) {
          heroImg.addEventListener("error", function () {
            /* 背景图不存在时退回星空，不至于只剩一片黑 */
            skySlot.classList.remove("hero__sky--photo");
            skySlot.innerHTML = "";
            paintSky();
          });
        }
      } else {
        paintSky();
      }
    }
  }

  /* 示例数据提示条：把 isDemoData 改成 false 就自动消失 */
  function renderDemoNotice() {
    var slot = $("[data-demo-notice]");
    if (!slot) {
      return;
    }
    var dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DEMO_DISMISS_KEY) === "1";
    } catch (err) {
      dismissed = false;
    }
    if (!cfg.meta.isDemoData || dismissed) {
      slot.remove();
      return;
    }
    slot.innerHTML =
      '<p><strong>当前展示的是示例数据。</strong>把 <code>assets/config.js</code> 里的名字、链接和统计数字换成你自己的，并把 <code>isDemoData</code> 改成 <code>false</code>，这条提示就会消失。</p>' +
      '<button type="button" class="notice__close" aria-label="关闭提示">' +
      icon("close", 16) +
      "</button>";
    $(".notice__close", slot).addEventListener("click", function () {
      try {
        window.sessionStorage.setItem(DEMO_DISMISS_KEY, "1");
      } catch (err) {
        /* 忽略 */
      }
      slot.remove();
    });
  }

  /* ============================== 4. 区块 ============================== */

  /**
   * 没内容的区块整个收起来，连导航里那一项一起隐藏。
   * 比如「文章」还没写第一篇时，页面上不会留一个空区块、也不会留一个点了没反应的导航项。
   * 以后往 config.js 的 posts 里加了内容，区块和导航会自动回来。
   */
  function hideEmptySections() {
    var sections = document.querySelectorAll("main section[id]");
    Array.prototype.forEach.call(sections, function (section) {
      var body = section.querySelector(
        "[data-posts], [data-projects], [data-moments], [data-games], [data-anime], [data-skills]"
      );
      if (!body || body.children.length) {
        return;
      }
      var links = document.querySelectorAll('[data-nav-id="' + section.id + '"]');
      Array.prototype.forEach.call(links, function (link) {
        var item = link.closest("li");
        if (item) {
          item.remove();
        }
      });
      section.remove();
    });
  }

  function sectionHead(title, meta, id) {
    return (
      '<div class="section-head">' +
      '<div class="section-head__main">' +
      "<h2" +
      (id ? ' id="' + esc(id) + '"' : "") +
      ">" +
      esc(title) +
      "</h2>" +
      '<span class="brush-rule" aria-hidden="true"></span>' +
      "</div>" +
      (meta ? '<p class="section-meta">' + esc(meta) + "</p>" : "") +
      "</div>"
    );
  }

  function renderProjects() {
    var list = $("[data-projects]");
    var head = $("[data-projects-head]");
    if (!list) {
      return;
    }
    if (head) {
      head.innerHTML = sectionHead("项目", cfg.projects.length + " 个开源项目", "projects-title");
    }
    list.innerHTML = cfg.projects
      .map(function (item) {
        /* 有链接就整张卡可点；没链接（比如还没开源）就做成不可点的卡片，别硬塞一个假外链 */
        var tag = item.url ? "a" : "article";
        var opening =
          "<" +
          tag +
          ' class="card project' +
          (item.url ? "" : " project--static") +
          '"' +
          (item.url
            ? ' href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer"'
            : "") +
          ">";
        return (
          opening +
          '<span class="project__head">' +
          '<span class="project__name">' +
          esc(item.name) +
          "</span>" +
          (item.featured ? '<span class="tag tag--accent">置顶</span>' : "") +
          (item.url ? '<span class="project__open" aria-hidden="true">' + icon("external", 16) + "</span>" : "") +
          "</span>" +
          '<span class="project__desc">' +
          esc(item.description) +
          "</span>" +
          '<span class="project__foot">' +
          '<span class="lang"><i class="lang__dot" style="background:' +
          esc(item.languageColor || "#8ea0c8") +
          '" aria-hidden="true"></i>' +
          esc(item.language) +
          "</span>" +
          (item.stars
            ? '<span class="count"><span class="count__icon" aria-hidden="true">' +
              icon("star", 14) +
              "</span>" +
              formatNumber(item.stars) +
              "</span>"
            : "") +
          "</span>" +
          (item.url ? '<span class="sr-only">（在新标签页打开 GitHub）</span>' : "") +
          "</" +
          tag +
          ">"
        );
      })
      .join("");
  }

  /* 动态 / 日记：短记录列表，按日期倒序（配置里写在前面的排前面） */
  function renderMoments() {
    var list = $("[data-moments]");
    var head = $("[data-moments-head]");
    if (!list) {
      return;
    }
    /* 动态的数据放在 assets/moments.js 里（单独一个文件，方便发布 / 手改）；
       万一那个文件没加载成功，就退回 config.js 里的 moments */
    var items = window.SiteMoments || cfg.moments || [];
    if (!items.length) {
      var section = document.getElementById("moments");
      if (section) {
        section.remove();
      }
      return;
    }
    if (head) {
      head.innerHTML = sectionHead("动态", items.length + " 条记录 · 日记 / 朋友圈", "moments-title");
    }
    list.innerHTML = items
      .map(function (item) {
        return (
          "<li>" +
          '<div class="moment">' +
          '<time class="moment__date" datetime="' +
          esc(item.date) +
          '">' +
          esc(item.date) +
          "</time>" +
          '<div class="moment__body">' +
          '<p class="moment__text">' +
          esc(item.text) +
          "</p>" +
          (item.tags && item.tags.length
            ? '<p class="moment__tags">' +
              item.tags
                .map(function (tag) {
                  return '<span class="tag">' + esc(tag) + "</span>";
                })
                .join("") +
              "</p>"
            : "") +
          "</div>" +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  function renderPosts() {
    var list = $("[data-posts]");
    var head = $("[data-posts-head]");
    if (!list) {
      return;
    }
    if (head) {
      head.innerHTML = sectionHead("文章", cfg.posts.length + " 篇笔记", "posts-title");
    }
    list.innerHTML = cfg.posts
      .map(function (item) {
        return (
          "<li>" +
          '<a class="post" href="' +
          esc(item.url) +
          '">' +
          '<span class="post__date">' +
          '<time datetime="' +
          esc(item.date) +
          '">' +
          esc(item.date) +
          "</time>" +
          '<span class="post__reading">' +
          icon("clock", 14) +
          esc(item.readingTime) +
          "</span>" +
          "</span>" +
          '<span class="post__body">' +
          '<span class="post__title">' +
          esc(item.title) +
          '<span class="post__arrow" aria-hidden="true">' +
          icon("arrowRight", 16) +
          "</span>" +
          "</span>" +
          '<span class="post__summary">' +
          esc(item.summary) +
          "</span>" +
          '<span class="post__tags">' +
          item.tags
            .map(function (tag) {
              return '<span class="tag">' + esc(tag) + "</span>";
            })
            .join("") +
          "</span>" +
          "</span>" +
          "</a>" +
          "</li>"
        );
      })
      .join("");
  }

  function mediaCards(items, options) {
    return items
      .map(function (item) {
        /* 封面：按名字算出色相，做一张双色渐变海报 + 首字。
           好处是每张卡都不一样、不依赖任何图片文件，也不会像之前那样全是黑乎乎的小星空。 */
        var hash = 0;
        for (var i = 0; i < item.name.length; i++) {
          hash = (hash * 31 + item.name.charCodeAt(i)) % 997;
        }
        var hue = 196 + (hash % 74);
        var facts = [item.platform, item.status];
        if (item.hours) {
          facts.push(item.hours + " 小时");
        }
        if (item.episodes) {
          facts.push(item.episodes + " 集");
        }
        facts.push(String(item.year || ""));
        return (
          '<article class="media-card">' +
          '<div class="media-card__cover">' +
          '<div class="cover cover--poster" style="--cover-hue:' +
          hue +
          '" role="img" aria-label="' +
          esc(item.name) +
          "的封面\">" +
          '<span class="cover__glyph" aria-hidden="true">' +
          esc(item.name.charAt(0)) +
          "</span>" +
          (item.cover
            ? '<img class="cover__img" src="' +
              esc(item.cover) +
              '" alt="" loading="lazy" decoding="async">'
            : "") +
          "</div>" +
          (item.rating
            ? '<span class="media-card__rating" title="个人评分">' + esc(item.rating.toFixed(1)) + "</span>"
            : "") +
          "</div>" +
          '<div class="media-card__body">' +
          '<h3 class="media-card__name">' +
          esc(item.name) +
          "</h3>" +
          '<p class="media-card__facts">' +
          facts
            .filter(Boolean)
            .map(function (fact) {
              return "<span>" + esc(fact) + "</span>";
            })
            .join("") +
          "</p>" +
          '<p class="media-card__note">' +
          esc(item.note) +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* 封面图加载失败（还没上传 / 路径写错）时，退回背后的渐变海报，不留破图 */
  function initCoverImages() {
    var images = document.querySelectorAll(".cover__img");
    Array.prototype.forEach.call(images, function (img) {
      img.addEventListener("error", function () {
        img.remove();
      });
    });
  }

  function renderGames() {
    var list = $("[data-games]");
    var head = $("[data-games-head]");
    if (!list) {
      return;
    }
    if (head) {
      head.innerHTML = sectionHead("游戏", cfg.games.length + " 款在玩的游戏", "games-title");
    }
    list.innerHTML = mediaCards(cfg.games);
  }

  function renderAnime() {
    var list = $("[data-anime]");
    var head = $("[data-anime-head]");
    if (!list) {
      return;
    }
    if (head) {
      head.innerHTML = sectionHead("番剧", cfg.anime.length + " 部看过的番", "anime-title");
    }
    list.innerHTML = mediaCards(cfg.anime);
  }

  function renderSkills() {
    var list = $("[data-skills]");
    var head = $("[data-skills-head]");
    if (!list) {
      return;
    }
    var total = cfg.skills.reduce(function (sum, item) {
      return sum + (Number(item.level) || 0);
    }, 0);
    var average = cfg.skills.length ? Math.round(total / cfg.skills.length) : 0;
    if (head) {
      head.innerHTML = sectionHead(
        "技能",
        cfg.skills.length + " 项 · 平均自评 " + average,
        "skills-title"
      );
    }
    list.innerHTML = cfg.skills
      .map(function (item) {
        return (
          '<li class="skill">' +
          '<div class="skill__head">' +
          '<h3 class="skill__name">' +
          esc(item.name) +
          "</h3>" +
          '<span class="skill__level">' +
          esc(item.level) +
          "</span>" +
          "</div>" +
          '<div class="meter" role="progressbar" aria-label="' +
          esc(item.name) +
          '" aria-valuenow="' +
          esc(item.level) +
          '" aria-valuemin="0" aria-valuemax="100">' +
          '<span class="meter__fill" style="--scale:' +
          esc((Number(item.level) || 0) / 100) +
          '"></span>' +
          "</div>" +
          '<p class="skill__tags">' +
          item.items
            .map(function (tag) {
              return '<span class="tag">' + esc(tag) + "</span>";
            })
            .join("") +
          "</p>" +
          "</li>"
        );
      })
      .join("");

    var radarSlot = $("[data-radar]");
    if (radarSlot && window.Radar) {
      window.Radar.render(
        radarSlot,
        {
          axes: cfg.skills.map(function (item) {
            return { label: item.name, short: item.short, value: Number(item.level) || 0 };
          }),
        },
        $("[data-radar-tooltip]")
      );
    }
  }

  function renderFooter() {
    var copy = $("[data-footer-copy]");
    var socials = $("[data-socials]");
    if (copy) {
      copy.innerHTML =
        "© " +
        new Date().getFullYear() +
        " " +
        esc(cfg.profile.name) +
        ' · 手写 HTML / CSS / JS，星空由代码逐笔生成，不加载任何图片与外部资源';
    }
    if (socials) {
      socials.innerHTML = cfg.socials
        .map(function (item) {
          var external = /^https?:/.test(item.href);
          return (
            '<li><a class="social" href="' +
            esc(item.href) +
            '"' +
            (external ? ' target="_blank" rel="me noopener noreferrer"' : "") +
            ">" +
            icon(item.icon, 18) +
            "<span>" +
            esc(item.label) +
            "</span></a></li>"
          );
        })
        .join("");
    }
  }

  /* ============================ 5. 交互行为 ============================ */

  /* 移动端菜单：开合、Esc 关闭、锁滚动、点链接后收起 */
  function initMobileNav() {
    var header = $("[data-header]");
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-mobile-panel]");
    if (!header || !toggle || !panel) {
      return;
    }

    function setOpen(open) {
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
      toggle.innerHTML = icon(open ? "close" : "menu", 20);
      document.body.classList.toggle("is-nav-open", open);
      if (open) {
        /* 面板是从 visibility:hidden 展开的，要等样式落地之后再移动焦点 */
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            var first = $("a", panel);
            if (first) {
              first.focus();
            }
          });
        });
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setOpen(false);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
      }
    });
  }

  /* 吸顶头部：向下滚动时收起第一层，向上滚回来 */
  function initHeaderScroll() {
    var header = $("[data-header]");
    if (!header) {
      return;
    }
    var last = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var goingDown = y > last + 4;
      var goingUp = y < last - 4;
      if (y < 80) {
        header.classList.remove("is-condensed");
      } else if (goingDown) {
        header.classList.add("is-condensed");
      } else if (goingUp) {
        header.classList.remove("is-condensed");
      }
      last = y;
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    /* 指针或键盘焦点回到头部时立刻展开第一层：
       否则收起来的主题开关会变成「够不着」的按钮 */
    function expand() {
      header.classList.remove("is-condensed");
    }
    header.addEventListener("mouseenter", expand);
    header.addEventListener("focusin", expand);
  }

  /* 导航高亮：谁正压在视口中线附近，谁就是当前项 */
  function initActiveSection() {
    var links = document.querySelectorAll("[data-nav] a[data-nav-id]");
    if (!links.length || !("IntersectionObserver" in window)) {
      return;
    }
    var map = {};
    Array.prototype.forEach.call(links, function (link) {
      map[link.dataset.navId] = link;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var id = entry.target.id;
          Array.prototype.forEach.call(links, function (link) {
            var active = link.dataset.navId === id;
            link.classList.toggle("is-current", active);
            if (active) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-46% 0px -50% 0px", threshold: 0 }
    );

    cfg.nav.forEach(function (item) {
      var section = document.getElementById(item.id);
      if (section) {
        observer.observe(section);
      }
    });
  }

  /* 滚动淡入：统一一种动效，进入视口一次就停 */
  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) {
      return;
    }
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (node) {
        node.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    Array.prototype.forEach.call(targets, function (node) {
      observer.observe(node);
    });
  }

  /* 封面懒加载：卡片快进视口时才画，首屏渲染不被拖慢 */
  function initCovers() {
    var covers = document.querySelectorAll("[data-cover-seed]");
    if (!covers.length || !window.Sky) {
      return;
    }

    function paint(node) {
      if (node.dataset.painted === "1") {
        return;
      }
      node.dataset.painted = "1";
      window.Sky.render(node, {
        seed: Number(node.dataset.coverSeed),
        width: 480,
        height: 300,
        variant: "cover",
        density: 0.9,
      });
    }

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(covers, paint);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            paint(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    Array.prototype.forEach.call(covers, function (node) {
      observer.observe(node);
    });

    /* 兜底：首屏画完之后把剩下的封面也补上。
       这样整页截图、打印、以及「不滚动直接 Ctrl+P」都不会看到空封面。 */
    var idle =
      window.requestIdleCallback ||
      function (fn) {
        return window.setTimeout(fn, 120);
      };
    window.setTimeout(function () {
      idle(function () {
        Array.prototype.forEach.call(covers, function (node, index) {
          window.setTimeout(function () {
            paint(node);
          }, index * 24);
        });
      });
    }, 1500);
  }

  /* 技能熟练度条：进入视口再长出来 */
  function initMeters() {
    var meters = document.querySelectorAll(".meter__fill");
    if (!meters.length) {
      return;
    }
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(meters, function (node) {
        node.classList.add("is-filled");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-filled");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    Array.prototype.forEach.call(meters, function (node) {
      observer.observe(node);
    });
  }

  function initBackToTop() {
    var button = $("[data-to-top]");
    if (!button) {
      return;
    }
    button.innerHTML = icon("arrowUp", 18) + "<span>回到顶部</span>";
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      var firstLink = $("[data-nav] a[data-nav-id]");
      if (firstLink) {
        firstLink.focus({ preventScroll: true });
      }
    });
  }

  /* 首屏「画出来」的那一刻：先让星空显影，再让文字浮上来 */
  function initPaintIn() {
    var hero = $("[data-hero]");
    if (!hero) {
      return;
    }
    if (reducedMotion.matches) {
      hero.classList.add("is-painted");
      return;
    }
    window.requestAnimationFrame(function () {
      hero.classList.add("is-painted");
    });
  }

  /* ============================== 6. 启动 ============================== */

  function boot() {
    applyUrlOverrides();
    initDocument();
    renderHeader();
    initTheme();
    initVisitor();
    renderHero();
    renderDemoNotice();
    renderProjects();
    renderPosts();
    renderMoments();
    renderGames();
    renderAnime();
    renderSkills();
    renderFooter();
    initCoverImages();
    hideEmptySections();

    window.Router.register(cfg.nav);
    window.Router.attach(
      document.querySelectorAll("[data-brand], [data-mobile-panel] a, [data-github-cta], [data-github-icon]")
    );

    initMobileNav();
    initHeaderScroll();
    initBackToTop();
    initPaintIn();
    initActiveSection();
    initReveal();
    initCovers();
    initMeters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
