/* ============================================================================
 * 技能雷达图
 * ----------------------------------------------------------------------------
 * 纯手写 SVG：网格与轴线保持中性细线，数据只用主色描边 + 半透明填充，
 * 数值直接标在轴端，所以不点也能读全。
 * 交互用一组真实 <button> 覆盖在每个顶点上 —— 键盘 Tab 能走通，
 * 悬停 / 聚焦都会点亮该轴并在共享 tooltip 里显示数值。
 * 动画只在首次进入视口时跑一次，prefers-reduced-motion 时直接到位。
 * ==========================================================================*/
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  /* viewBox 比图形本身大一圈，轴端标签才不会被裁掉、也不会压到右边的技能列表 */
  var VB = 260;
  var CX = 130;
  var CY = 118;
  var R = 80;
  var LABEL_R = 100;
  var MAX = 100;

  function pointOn(axisIndex, count, radius) {
    var angle = (Math.PI * 2 * axisIndex) / count - Math.PI / 2;
    return { x: CX + Math.cos(angle) * radius, y: CY + Math.sin(angle) * radius, angle: angle };
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    return node;
  }

  function polygonPoints(values, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var p = pointOn(i, count, (values[i] / MAX) * R);
      out.push(Math.round(p.x * 10) / 10 + "," + Math.round(p.y * 10) / 10);
    }
    return out.join(" ");
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * @param {Element} container 图表容器（会清空内部）
   * @param {{axes: Array<{label:string,value:number}>}} options
   * @param {HTMLElement} tooltip 共享的 tooltip 元素
   * @returns {{ highlight: function(number|null): void, destroy: function(): void }}
   */
  function render(container, options, tooltip) {
    var axes = options.axes.slice(0, 8);
    var count = axes.length;
    var values = axes.map(function (a) {
      return Math.max(0, Math.min(MAX, Number(a.value) || 0));
    });
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var frame = 0;

    container.innerHTML = "";

    var svg = el("svg", {
      class: "radar",
      viewBox: "0 0 " + VB + " " + VB,
      role: "img",
      "aria-labelledby": "radar-title radar-desc",
    });
    svg.innerHTML =
      "<title id=\"radar-title\">技能雷达图</title><desc id=\"radar-desc\">六项技能的自评熟练度：" +
      axes
        .map(function (a) {
          return a.label + " " + a.value + " 分";
        })
        .join("，") +
      "。满分 100 分。</desc>";

    /* 网格：四圈同心多边形 + 六条轴线，都是中性细线 */
    var grid = el("g", { class: "radar-grid" });
    [0.25, 0.5, 0.75, 1].forEach(function (ratio) {
      var pts = [];
      for (var i = 0; i < count; i++) {
        var p = pointOn(i, count, R * ratio);
        pts.push(Math.round(p.x * 10) / 10 + "," + Math.round(p.y * 10) / 10);
      }
      grid.appendChild(el("polygon", { points: pts.join(" "), class: "radar-ring" }));
    });
    for (var i = 0; i < count; i++) {
      var tip = pointOn(i, count, R);
      grid.appendChild(
        el("line", {
          x1: CX,
          y1: CY,
          x2: Math.round(tip.x * 10) / 10,
          y2: Math.round(tip.y * 10) / 10,
          class: "radar-spoke",
          "data-axis": i,
        })
      );
    }
    svg.appendChild(grid);

    /* 数据区：半透明填充 + 主色描边 */
    var dataPolygon = el("polygon", {
      points: polygonPoints(values.map(function () {
        return 0;
      }), count),
      class: "radar-area",
    });
    svg.appendChild(dataPolygon);

    var vertexGroup = el("g", { class: "radar-vertices" });
    svg.appendChild(vertexGroup);

    /* 轴端标签：直接标出名称与数值，不依赖悬停 */
    var labelGroup = el("g", { class: "radar-labels" });
    axes.forEach(function (axis, index) {
      var p = pointOn(index, count, LABEL_R);
      var cos = Math.cos(p.angle);
      var sin = Math.sin(p.angle);
      var anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
      var dy = sin < -0.6 ? -2 : sin > 0.6 ? 12 : 4;

      var label = el("text", {
        x: Math.round(p.x * 10) / 10,
        y: Math.round((p.y + dy) * 10) / 10,
        "text-anchor": anchor,
        class: "radar-label",
      });
      /* 轴端只放短名：名字和数值在右侧的列表里已经写全了。
         没给 short 就截前 4 个字，保证再长的分类名也不会顶出画布。 */
      label.textContent = (axis.short || axis.label).slice(0, 4);
      labelGroup.appendChild(label);

      var value = el("text", {
        x: Math.round(p.x * 10) / 10,
        y: Math.round((p.y + dy + 13) * 10) / 10,
        "text-anchor": anchor,
        class: "radar-value",
      });
      value.textContent = axis.value;
      labelGroup.appendChild(value);
    });
    svg.appendChild(labelGroup);

    container.appendChild(svg);

    /* 顶点圆点 + 覆盖在顶点上的真实按钮（键盘可聚焦） */
    var buttons = [];
    axes.forEach(function (axis, index) {
      var p = pointOn(index, count, (values[index] / MAX) * R);
      var dot = el("circle", {
        cx: Math.round(p.x * 10) / 10,
        cy: Math.round(p.y * 10) / 10,
        r: 3.2,
        class: "radar-dot",
        "data-axis": index,
      });
      vertexGroup.appendChild(dot);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "radar-hit";
      button.dataset.axis = String(index);
      button.setAttribute("aria-label", axis.label + "：" + axis.value + " 分，满分 " + MAX + " 分");
      button.style.left = (p.x / VB) * 100 + "%";
      button.style.top = (p.y / VB) * 100 + "%";
      button.addEventListener("mouseenter", function () {
        highlight(index);
      });
      button.addEventListener("focus", function () {
        highlight(index);
      });
      button.addEventListener("mouseleave", function () {
        highlight(null);
      });
      button.addEventListener("blur", function () {
        highlight(null);
      });
      container.appendChild(button);
      buttons.push(button);
    });

    var dots = vertexGroup.querySelectorAll(".radar-dot");
    var spokes = grid.querySelectorAll(".radar-spoke");

    function highlight(index) {
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle("is-active", i === index);
        spokes[i].classList.toggle("is-active", i === index);
      }
      if (!tooltip) {
        return;
      }
      if (index === null || index === undefined) {
        tooltip.classList.remove("is-visible");
        tooltip.textContent = "";
        return;
      }
      var p = pointOn(index, count, (values[index] / MAX) * R);
      tooltip.textContent = axes[index].label + " · " + axes[index].value + " / " + MAX;
      tooltip.style.left = (p.x / VB) * 100 + "%";
      tooltip.style.top = (p.y / VB) * 100 + "%";
      tooltip.classList.add("is-visible");
    }

    function draw(t) {
      var eased = easeOutCubic(t);
      dataPolygon.setAttribute(
        "points",
        polygonPoints(
          values.map(function (v) {
            return v * eased;
          }),
          count
        )
      );
    }

    if (reduced) {
      draw(1);
    } else {
      var start = 0;
      var duration = 760;
      function tick(now) {
        if (!start) {
          start = now;
        }
        var t = Math.min(1, (now - start) / duration);
        draw(t);
        if (t < 1) {
          frame = window.requestAnimationFrame(tick);
        }
      }
      frame = window.requestAnimationFrame(tick);
    }

    return {
      highlight: highlight,
      destroy: function () {
        if (frame) {
          window.cancelAnimationFrame(frame);
        }
      },
    };
  }

  window.Radar = { render: render };
})();
