/* ============================================================================
 * 星空画布 —— 用代码画一幅油画，不引用任何图片文件。
 * ----------------------------------------------------------------------------
 * 做法：在 0..1 的归一化画布上定义一个「流场」（几个涡旋 + 基础漂移 + 噪声），
 * 再沿流场积分出上千条两端收窄的「带状笔触」，按高度 / 涡旋强度在
 * 夜色 → 靛蓝 → 霁蓝 → 近白 的色阶上取色，并给一部分笔触叠一条更亮的边，
 * 做出厚涂的高光。之后依次叠加：星点、月亮、山脊与尖塔、左侧柏树，
 * 最后盖上噪点清漆和中心压暗层。
 *
 * 同一个 seed 每次渲染结果完全一致 —— 截图稳定，刷新不闪。
 * ==========================================================================*/
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ----------------------------- 随机与噪声 ----------------------------- */

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(x, y, seed) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  /* 双线性平滑插值的 value noise，返回 0..1 */
  function valueNoise(x, y, seed) {
    var xi = Math.floor(x);
    var yi = Math.floor(y);
    var xf = smoothstep(x - xi);
    var yf = smoothstep(y - yi);
    var a = hash2(xi, yi, seed);
    var b = hash2(xi + 1, yi, seed);
    var c = hash2(xi, yi + 1, seed);
    var d = hash2(xi + 1, yi + 1, seed);
    var top = a + (b - a) * xf;
    var bottom = c + (d - c) * xf;
    return top + (bottom - top) * yf;
  }

  function makeRng(seed) {
    var next = mulberry32(seed);
    return {
      next: next,
      range: function (a, b) {
        return a + next() * (b - a);
      },
      int: function (a, b) {
        return Math.floor(a + next() * (b - a + 1));
      },
      pick: function (list) {
        return list[Math.min(list.length - 1, Math.floor(next() * list.length))];
      },
    };
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  /* ------------------------------- 色阶 ------------------------------- */

  /* 夜色 → 靛蓝 → 霁蓝 → 近白：一整条冷暖混合的天空色阶 */
  var SKY_RAMP = [
    [0.0, [4, 7, 22]],
    [0.2, [10, 18, 58]],
    [0.4, [22, 38, 104]],
    [0.56, [58, 90, 182]],
    [0.72, [128, 168, 228]],
    [0.86, [182, 210, 242]],
    [1.0, [244, 250, 255]],
  ];

  var GOLD = [
    [243, 196, 85],
    [247, 215, 122],
    [255, 233, 168],
    [232, 179, 60],
  ];

  var CYPRESS_DARK = [
    [8, 18, 16],
    [12, 27, 22],
    [6, 14, 18],
    [16, 34, 26],
  ];

  function sampleRamp(ramp, t) {
    t = clamp(t, 0, 1);
    for (var i = 0; i < ramp.length - 1; i++) {
      var a = ramp[i];
      var b = ramp[i + 1];
      if (t <= b[0]) {
        var k = (t - a[0]) / (b[0] - a[0] || 1);
        return [
          a[1][0] + (b[1][0] - a[1][0]) * k,
          a[1][1] + (b[1][1] - a[1][1]) * k,
          a[1][2] + (b[1][2] - a[1][2]) * k,
        ];
      }
    }
    return ramp[ramp.length - 1][1];
  }

  function rgb(c, mul) {
    mul = mul === undefined ? 1 : mul;
    return (
      "rgb(" +
      clamp(Math.round(c[0] * mul), 0, 255) +
      "," +
      clamp(Math.round(c[1] * mul), 0, 255) +
      "," +
      clamp(Math.round(c[2] * mul), 0, 255) +
      ")"
    );
  }

  /* ------------------------------- 流场 ------------------------------- */

  /* 几个涡旋负责旋转的笔触，基础漂移负责横向流动，噪声让笔触不那么机械 */
  function createField(config) {
    var vortices = config.vortices;
    var drift = config.drift;
    var turbulence = config.turbulence;
    var seed = config.seed;
    var noiseScale = config.noiseScale;

    return function (x, y) {
      var vx = Math.cos(drift);
      var vy = Math.sin(drift) * 0.55;
      for (var i = 0; i < vortices.length; i++) {
        var v = vortices[i];
        var dx = x - v.x;
        var dy = (y - v.y) * 1.45; /* 画布偏扁，纵向拉伸让涡旋更像圆的 */
        var w = v.power / (1 + (dx * dx + dy * dy) / (v.radius * v.radius));
        vx += -dy * w;
        vy += dx * w * v.spin;
      }
      var n = valueNoise(x * noiseScale, y * noiseScale, seed) * 2 - 1;
      var ang = n * turbulence;
      var cs = Math.cos(ang);
      var sn = Math.sin(ang);
      var rx = vx * cs - vy * sn;
      var ry = vx * sn + vy * cs;
      var mag = Math.sqrt(rx * rx + ry * ry) || 1e-6;
      return { angle: Math.atan2(ry, rx), energy: clamp((mag - 1) * 0.8, 0, 1) };
    };
  }

  /* ----------------------------- 笔触生成 ----------------------------- */

  /* 沿流场积分出一条带状笔触：两头尖、中间厚，和真实笔锋一致 */
  function buildStroke(field, x, y, steps, stepLen, width) {
    var xs = new Array(steps);
    var ys = new Array(steps);
    var ws = new Array(steps);
    var energy = 0;
    var cx = 0;
    var cy = 0;
    var i;

    for (i = 0; i < steps; i++) {
      var f = field(x, y);
      energy += f.energy;
      xs[i] = x;
      ys[i] = y;
      cx += x;
      cy += y;
      var t = steps > 1 ? i / (steps - 1) : 0.5;
      ws[i] = width * (0.24 + 0.76 * Math.pow(Math.sin(Math.PI * t), 0.8));
      x += Math.cos(f.angle) * stepLen;
      y += Math.sin(f.angle) * stepLen * 0.74;
    }

    var d = "";
    for (i = 0; i < steps; i++) {
      var p = normalAt(xs, ys, i);
      d += (i === 0 ? "M" : "L") + round1(xs[i] + p[0] * ws[i]) + " " + round1(ys[i] + p[1] * ws[i]);
    }
    for (i = steps - 1; i >= 0; i--) {
      var q = normalAt(xs, ys, i);
      d += "L" + round1(xs[i] - q[0] * ws[i]) + " " + round1(ys[i] - q[1] * ws[i]);
    }
    d += "Z";

    return { d: d, cx: cx / steps, cy: cy / steps, energy: energy / steps };
  }

  function normalAt(xs, ys, i) {
    var a = i > 0 ? i - 1 : i;
    var b = i < xs.length - 1 ? i + 1 : i;
    var tx = xs[b] - xs[a];
    var ty = ys[b] - ys[a];
    var m = Math.sqrt(tx * tx + ty * ty) || 1e-6;
    return [-ty / m, tx / m];
  }

  /* ------------------------------- 画笔 ------------------------------- */

  function paint(svg, o) {
    var W = o.width;
    var H = o.height;
    var seed = o.seed;
    var variant = o.variant || "hero";
    var cover = variant === "cover";
    var diag = Math.sqrt(W * W + H * H);
    var rng = makeRng(seed);
    var i;

    function layer(name, attrs) {
      var g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "sky-layer sky-layer--" + name);
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          g.setAttribute(key, attrs[key]);
        }
      }
      svg.appendChild(g);
      return g;
    }

    var defs = document.createElementNS(SVG_NS, "defs");
    defs.innerHTML = buildDefs(o, diag);
    svg.appendChild(defs);

    var baseRect = document.createElementNS(SVG_NS, "rect");
    baseRect.setAttribute("x", 0);
    baseRect.setAttribute("y", 0);
    baseRect.setAttribute("width", W);
    baseRect.setAttribute("height", H);
    baseRect.setAttribute("fill", "url(#sky-base-" + seed + ")");
    layer("base").appendChild(baseRect);

    var vortices = cover
      ? [
          { x: 0.34, y: 0.42, radius: 0.2, power: 2.7, spin: 1 },
          { x: 0.74, y: 0.32, radius: 0.16, power: -2.1, spin: 1 },
          { x: 0.58, y: 0.8, radius: 0.19, power: 1.9, spin: 1 },
        ]
      : [
          { x: 0.295, y: 0.42, radius: 0.165, power: 3.1, spin: 1 },
          { x: 0.63, y: 0.315, radius: 0.125, power: -2.4, spin: 1 },
          { x: 0.845, y: 0.55, radius: 0.155, power: 2.6, spin: 1 },
          { x: 0.13, y: 0.7, radius: 0.12, power: -1.9, spin: 1 },
          { x: 0.465, y: 0.845, radius: 0.18, power: 2, spin: 1 },
          { x: 0.53, y: 0.19, radius: 0.075, power: -1.5, spin: 1 },
          { x: 0.2, y: 0.63, radius: 0.06, power: 1.4, spin: 1 },
        ];

    var field = createField({
      vortices: vortices,
      drift: 0.32,
      turbulence: 1.05,
      seed: seed,
      noiseScale: cover ? 4.4 : 3.1,
    });

    /* 光核：涡旋中心是亮的，笔触经过那里就被提亮 —— 这是整幅画的明暗骨架 */
    var lights = cover
      ? [
          [0.34, 0.42],
          [0.74, 0.32],
        ]
      : [
          [0.295, 0.42],
          [0.63, 0.315],
          [0.845, 0.55],
          [0.13, 0.7],
          [0.465, 0.845],
        ];

    /* 小封面每一张都要长得不一样：换一套冷暖偏移，星星位置也重掷 */
    var tint = cover
      ? [rng.range(0.9, 1.08), rng.range(0.92, 1.08), rng.range(0.88, 1.16)]
      : [1, 1, 1];

    var paintFilter = "url(#sky-paint-" + seed + ")";
    var swirl = layer("swirl", { filter: paintFilter });
    var detail = layer("detail", { filter: paintFilter });

    /* 一条笔触：取色 → 落笔 → 有机会再叠一条更亮的高光边 */
    function drawBrush(group, spec) {
      var steps = rng.int(spec.steps[0], spec.steps[1]);
      var stepLen = diag * spec.step;
      var halfWidth = diag * rng.range(spec.width[0], spec.width[1]);
      var sx = rng.range(W * -0.04, W * 1.04);
      var sy = rng.range(H * -0.04, H * 1.04);
      var stroke = buildStroke(field, sx, sy, steps, stepLen, halfWidth);
      var nx = stroke.cx / W;
      var ny = stroke.cy / H;
      var spot = 0;
      for (var li = 0; li < lights.length; li++) {
        var lx = nx - lights[li][0];
        var ly = (ny - lights[li][1]) * 1.4;
        spot = Math.max(spot, 1 - Math.min(1, Math.sqrt(lx * lx + ly * ly) / 0.3));
      }
      var heat = clamp(
        (1 - ny) * 0.36 +
          stroke.energy * 0.42 +
          spot * 0.52 -
          Math.max(0, (ny - 0.7) / 0.3) * 0.34 +
          (rng.next() - 0.5) * 0.26,
        0,
        1
      );
      var color = sampleRamp(SKY_RAMP, heat);
      if (cover) {
        color = [color[0] * tint[0], color[1] * tint[1], color[2] * tint[2]];
      }
      /* 一成多的笔触压暗、一成多的提亮，画面才有厚涂的起伏 */
      var roll = rng.next();
      var shade =
        roll < 0.15 ? rng.range(0.34, 0.58) : roll > 0.84 ? rng.range(1.3, 1.7) : rng.range(0.82, 1.18);
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", stroke.d);
      path.setAttribute("fill", rgb(color, shade));
      path.setAttribute("fill-opacity", round1(rng.range(spec.alpha[0], spec.alpha[1])) / 100);
      group.appendChild(path);

      if (rng.next() < spec.ridge) {
        var ridge = buildStroke(field, sx, sy, steps, stepLen, halfWidth * 0.42);
        var ridgePath = document.createElementNS(SVG_NS, "path");
        ridgePath.setAttribute("d", ridge.d);
        ridgePath.setAttribute("fill", rgb(color, 1.28 + rng.next() * 0.22));
        ridgePath.setAttribute("fill-opacity", round1(rng.range(28, 58)) / 100);
        group.appendChild(ridgePath);
      }
    }

    var density = o.density === undefined ? 1 : o.density;

    /* 大笔触：铺满整幅，决定流动方向和主要明暗 */
    var big = { steps: [9, 16], step: 0.0104, width: [0.005, 0.0126], alpha: [20, 42], ridge: 0.34 };
    /* 小笔触：压在涡旋上，让旋回处出现短促的碎笔 */
    var fine = { steps: [6, 11], step: 0.0084, width: [0.0024, 0.0058], alpha: [26, 52], ridge: 0.46 };

    var bigCount = Math.round((cover ? 200 : 900) * density);
    var fineCount = Math.round((cover ? 110 : 560) * density);
    for (i = 0; i < bigCount; i++) {
      drawBrush(swirl, big);
    }
    for (i = 0; i < fineCount; i++) {
      drawBrush(detail, fine);
    }

    if (o.withStars !== false) {
      paintStars(layer("stars", { filter: "url(#sky-soft-" + seed + ")" }), W, H, rng, variant, seed, o);
    }

    var front = layer("front");
    if (o.withHill !== false) {
      paintHill(front, W, H, rng, variant, seed);
    }
    if (o.withCypress !== false && !cover) {
      paintCypress(front, W, H, rng, seed);
    }

    /* 清漆噪点：把矢量边压成颜料颗粒 */
    var varnish = document.createElementNS(SVG_NS, "rect");
    varnish.setAttribute("class", "sky-varnish");
    varnish.setAttribute("width", W);
    varnish.setAttribute("height", H);
    varnish.setAttribute("fill", "url(#sky-varnish-" + seed + ")");
    layer("varnish").appendChild(varnish);

    /* 中心压暗：Hero 文字压在这幅画上，这层保证文字对比度 */
    var scrimLayer = layer("scrim");
    var wash = document.createElementNS(SVG_NS, "rect");
    wash.setAttribute("class", "sky-wash");
    wash.setAttribute("width", W);
    wash.setAttribute("height", H);
    wash.setAttribute("fill", "url(#sky-wash-" + seed + ")");
    scrimLayer.appendChild(wash);

    var scrim = document.createElementNS(SVG_NS, "rect");
    scrim.setAttribute("class", "sky-scrim");
    scrim.setAttribute("width", W);
    scrim.setAttribute("height", H);
    scrim.setAttribute("fill", "url(#sky-scrim-" + seed + ")");
    scrimLayer.appendChild(scrim);

    return svg;
  }

  /* --------------------------- defs（滤镜 / 渐变） --------------------------- */

  function buildDefs(o, diag) {
    var id = o.seed;
    var cover = o.variant === "cover";
    return [
      '<linearGradient id="sky-base-' + id + '" x1="0" y1="0" x2="0.25" y2="1">',
      '<stop offset="0" stop-color="#0d1740"/>',
      '<stop offset="0.38" stop-color="#16255f"/>',
      '<stop offset="0.74" stop-color="#0b1236"/>',
      '<stop offset="1" stop-color="#050812"/>',
      "</linearGradient>",

      /* 从上到下压暗：Hero 的文字与统计条都压在下半幅，这层保证它们始终读得清 */
      '<linearGradient id="sky-wash-' + id + '" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0" stop-color="#03060f" stop-opacity="0.03"/>',
      '<stop offset="0.4" stop-color="#03060f" stop-opacity="0.19"/>',
      '<stop offset="0.72" stop-color="#03060f" stop-opacity="0.35"/>',
      '<stop offset="1" stop-color="#03060f" stop-opacity="0.5"/>',
      "</linearGradient>",

      /* 笔触位移：feTurbulence 生成的噪声场把每条路径揉一下，去掉矢量的锐利感 */
      '<filter id="sky-paint-' +
        id +
        '" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">',
      '<feTurbulence type="fractalNoise" baseFrequency="' +
        (cover ? 0.028 : 0.011) +
        " " +
        (cover ? 0.038 : 0.016) +
        '" numOctaves="3" seed="' +
        (id % 97) +
        '" result="warp"/>',
      '<feDisplacementMap in="SourceGraphic" in2="warp" scale="' +
        round1(diag * (cover ? 0.006 : 0.0035)) +
        '" xChannelSelector="R" yChannelSelector="G"/>',
      "</filter>",

      '<filter id="sky-soft-' + id + '" x="-16%" y="-16%" width="132%" height="132%" color-interpolation-filters="sRGB">',
      '<feGaussianBlur stdDeviation="' + round1(diag * (cover ? 0.0008 : 0.00035)) + '"/>',
      "</filter>",

      '<filter id="sky-glow-' + id + '" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">',
      '<feGaussianBlur stdDeviation="' + round1(diag * 0.016) + '"/>',
      "</filter>",

      /* 清漆：极低不透明度的细噪点，模拟画布颗粒 */
      '<filter id="sky-varnish-filter-' + id + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">',
      '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="' + ((id * 7) % 89) + '" stitchTiles="stitch"/>',
      '<feColorMatrix type="saturate" values="0"/>',
      "</filter>",
      '<pattern id="sky-varnish-' + id + '" width="200" height="200" patternUnits="userSpaceOnUse">',
      '<rect width="200" height="200" filter="url(#sky-varnish-filter-' + id + ')" opacity="0.55"/>',
      "</pattern>",

      '<radialGradient id="sky-scrim-' + id + '" cx="50%" cy="' + (cover ? 0.46 : 0.52) + '%" r="60%">',
      '<stop offset="0" stop-color="#050915" stop-opacity="' + (cover ? 0.18 : 0.58) + '"/>',
      '<stop offset="0.42" stop-color="#050915" stop-opacity="' + (cover ? 0.07 : 0.34) + '"/>',
      '<stop offset="0.78" stop-color="#04070f" stop-opacity="' + (cover ? 0.04 : 0.07) + '"/>',
      '<stop offset="1" stop-color="#04070f" stop-opacity="' + (cover ? 0.12 : 0.04) + '"/>',
      "</radialGradient>",
    ].join("");
  }

  /* ------------------------------- 星星 ------------------------------- */

  function paintStars(group, W, H, rng, variant, seed, o) {
    /* 固定构图：和参考画一样，几颗暖黄星子分布在不同位置，右上一弯月亮 */
    var spots =
      variant === "cover"
        ? (function () {
            /* 封面重掷：每张卡的星位、星数、月亮位置都不同，八张摆一起才不会像同一张 */
            var list = [
              { x: rng.range(0.16, 0.4), y: rng.range(0.24, 0.46), r: rng.range(0.13, 0.19) },
              { x: rng.range(0.62, 0.86), y: rng.range(0.18, 0.4), r: rng.range(0.07, 0.12) },
            ];
            if (rng.next() > 0.45) {
              list.push({ x: rng.range(0.45, 0.62), y: rng.range(0.5, 0.68), r: rng.range(0.05, 0.09) });
            }
            return list;
          })()
        : [
            { x: 0.297, y: 0.372, r: 0.086 },
            { x: 0.213, y: 0.628, r: 0.056 },
            { x: 0.402, y: 0.252, r: 0.048 },
            { x: 0.632, y: 0.152, r: 0.036 },
            { x: 0.742, y: 0.462, r: 0.05 },
            { x: 0.112, y: 0.238, r: 0.03 },
            { x: 0.522, y: 0.664, r: 0.032 },
          ];

    for (var i = 0; i < spots.length; i++) {
      paintStarDab(group, spots[i].x * W, spots[i].y * H, spots[i].r * H, rng, variant, seed);
    }
    if (o.withMoon !== false) {
      paintMoon(
        group,
        W * (variant === "cover" ? rng.range(0.62, 0.9) : 0.9),
        H * (variant === "cover" ? rng.range(0.14, 0.34) : 0.2),
        H * 0.052,
        rng,
        seed
      );
    }
  }

  /* 一颗星 = 一层很淡的柔光 + 三圈被拉长的弧形笔触 + 亮核。
     光晕必须淡：一旦画成实心黄圆，整颗星就变成一颗煎蛋。 */
  function paintStarDab(group, cx, cy, R, rng, variant, seed) {
    var i;
    var halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("cx", round1(cx));
    halo.setAttribute("cy", round1(cy));
    halo.setAttribute("r", round1(R * 1.55));
    halo.setAttribute("fill", "rgb(" + GOLD[1].join(",") + ")");
    halo.setAttribute("fill-opacity", "0.2");
    halo.setAttribute("filter", "url(#sky-glow-" + seed + ")");
    halo.setAttribute("data-role", "halo");
    group.appendChild(halo);

    /* 三圈同心弧：就是这三圈让星星看起来是「画」出来而不是「贴」上去的 */
    var rings = variant === "cover" ? [0.8, 1.2] : [0.78, 1.12, 1.48];
    var perRing = variant === "cover" ? 9 : 13;
    /* 最外圈换成冷色：参考画里金星外面围着的是被照亮的天蓝，不是又一圈金色 */
    var COOL = ["#7FA8E8", "#9FC0F2", "#6C93D8"];
    rings.forEach(function (ratio, ringIndex) {
      for (var k = 0; k < perRing; k++) {
        var a = (k / perRing) * Math.PI * 2 + rng.range(-0.16, 0.16);
        var rr = R * ratio * rng.range(0.94, 1.06);
        var px = cx + Math.cos(a) * rr;
        var py = cy + Math.sin(a) * rr * 0.94;
        var arc = rng.range(0.12, 0.26) * R * ratio;
        var tangent = a + Math.PI / 2;
        var strokeColor =
          variant === "cover" || ringIndex < rings.length - 1
            ? "rgb(" + rng.pick(GOLD).join(",") + ")"
            : rng.pick(COOL);
        var path = document.createElementNS(SVG_NS, "path");
        path.setAttribute(
          "d",
          "M" +
            round1(px - Math.cos(tangent) * arc) +
            " " +
            round1(py - Math.sin(tangent) * arc) +
            "Q" +
            round1(px + Math.cos(a) * arc * 0.5) +
            " " +
            round1(py + Math.sin(a) * arc * 0.5) +
            " " +
            round1(px + Math.cos(tangent) * arc) +
            " " +
            round1(py + Math.sin(tangent) * arc)
        );
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", strokeColor);
        path.setAttribute("stroke-width", round1(rng.range(0.045, 0.085) * R));
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-opacity", round1(rng.range(65, 100)) / 100);
        group.appendChild(path);
      }
    });

    for (i = 0; i < 4; i++) {
      var core = document.createElementNS(SVG_NS, "circle");
      core.setAttribute("cx", round1(cx + rng.range(-0.05, 0.05) * R));
      core.setAttribute("cy", round1(cy + rng.range(-0.05, 0.05) * R));
      core.setAttribute("r", round1(R * (0.5 - i * 0.1)));
      core.setAttribute("fill", "rgb(" + (i >= 2 ? [255, 251, 232] : GOLD[2]).join(",") + ")");
      core.setAttribute("fill-opacity", round1(96 - i * 8) / 100);
      group.appendChild(core);
    }
  }

  /* 月亮：一弯金月，外圈是柔光和一圈环形笔触 */
  function paintMoon(group, cx, cy, R, rng, seed) {
    var glow = document.createElementNS(SVG_NS, "circle");
    glow.setAttribute("cx", round1(cx));
    glow.setAttribute("cy", round1(cy));
    glow.setAttribute("r", round1(R * 2.4));
    glow.setAttribute("fill", "rgb(" + GOLD[1].join(",") + ")");
    glow.setAttribute("fill-opacity", "0.22");
    glow.setAttribute("filter", "url(#sky-glow-" + seed + ")");
    glow.setAttribute("data-role", "halo");
    group.appendChild(glow);

    var disc = document.createElementNS(SVG_NS, "circle");
    disc.setAttribute("cx", round1(cx));
    disc.setAttribute("cy", round1(cy));
    disc.setAttribute("r", round1(R));
    disc.setAttribute("fill", "url(#sky-moon-" + seed + ")");
    disc.setAttribute("data-role", "moon-disc");
    group.appendChild(disc);

    for (var i = 0; i < 26; i++) {
      var a = (i / 26) * Math.PI * 2;
      var rr = R * (i % 2 === 0 ? rng.range(1.25, 1.45) : rng.range(1.6, 1.95));
      var px = cx + Math.cos(a) * rr;
      var py = cy + Math.sin(a) * rr;
      var arc = R * rng.range(0.14, 0.32);
      var tangent = a + Math.PI / 2;
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M" +
          round1(px - Math.cos(tangent) * arc) +
          " " +
          round1(py - Math.sin(tangent) * arc) +
          "L" +
          round1(px + Math.cos(tangent) * arc) +
          " " +
          round1(py + Math.sin(tangent) * arc)
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgb(" + rng.pick(GOLD).join(",") + ")");
      path.setAttribute("stroke-width", round1(R * rng.range(0.07, 0.14)));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-opacity", round1(rng.range(55, 100)) / 100);
      group.appendChild(path);
    }
  }

  /* ------------------------------- 山脊 ------------------------------- */

  function paintHill(group, W, H, rng, variant) {
    var cover = variant === "cover";
    var baseY = H * (cover ? rng.range(0.78, 0.93) : 0.9);
    var amp = H * (cover ? 0.06 : 0.05);
    var i;

    var heights = [];
    for (i = 0; i <= 40; i++) {
      var t = i / 40;
      heights.push(
        baseY -
          amp * (0.55 + 0.45 * Math.sin(t * 5.1 + 0.7)) * 0.75 -
          amp * 0.35 * Math.sin(t * 11.3 + 2.1)
      );
    }

    var d = "M" + round1(W * -0.02) + " " + round1(H * 1.05);
    for (i = 0; i <= 40; i++) {
      d += "L" + round1((i / 40) * W) + " " + round1(heights[i]);
    }
    d += "L" + round1(W * 1.02) + " " + round1(H * 1.05) + "Z";

    var hill = document.createElementNS(SVG_NS, "path");
    hill.setAttribute("d", d);
    hill.setAttribute("fill", "#050a1a");
    hill.setAttribute("fill-opacity", "1");
    group.appendChild(hill);

    /* 山脊上的横向暗笔触，别让它变成一块死板的剪影 */
    var strokes = cover ? 10 : 30;
    for (i = 0; i < strokes; i++) {
      var sx = rng.range(W * -0.05, W * 1.02);
      var sy = rng.range(baseY - H * 0.02, H * 1.02);
      var len = rng.range(W * 0.06, W * 0.22);
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M" +
          round1(sx) +
          " " +
          round1(sy) +
          "q" +
          round1(len / 2) +
          " " +
          round1(rng.range(-5, 5)) +
          " " +
          round1(len) +
          " " +
          round1(rng.range(-2, 2))
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", rng.pick(["#0a1128", "#0d1533", "#060b1f"]));
      path.setAttribute("stroke-width", round1(rng.range(2, 7)));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-opacity", round1(rng.range(40, 85)) / 100);
      group.appendChild(path);
    }

    if (!cover) {
      /* 山脚下的教堂尖塔 —— 参考画里最容易被记住的小东西 */
      var spireX = W * 0.523;
      var spireTop = baseY - H * 0.075;
      var spire = document.createElementNS(SVG_NS, "path");
      spire.setAttribute(
        "d",
        "M" +
          round1(spireX - W * 0.0065) +
          " " +
          round1(H * 0.98) +
          "L" +
          round1(spireX - W * 0.0038) +
          " " +
          round1(spireTop + H * 0.014) +
          "L" +
          round1(spireX) +
          " " +
          round1(spireTop) +
          "L" +
          round1(spireX + W * 0.0038) +
          " " +
          round1(spireTop + H * 0.014) +
          "L" +
          round1(spireX + W * 0.0065) +
          " " +
          round1(H * 0.98) +
          "Z"
      );
      spire.setAttribute("fill", "#0a1029");
      group.appendChild(spire);

      var spike = document.createElementNS(SVG_NS, "path");
      spike.setAttribute("d", "M" + round1(spireX) + " " + round1(spireTop) + "v" + round1(-H * 0.017));
      spike.setAttribute("stroke", "#0a1029");
      spike.setAttribute("stroke-width", round1(Math.max(1.4, W * 0.0018)));
      spike.setAttribute("stroke-linecap", "round");
      spike.setAttribute("fill", "none");
      group.appendChild(spike);
    }
  }

  /* ------------------------------- 柏树 ------------------------------- */

  /* 左侧柏树：底部宽、向上收成火焰尖，用竖向笔触填满，右缘留几笔被星空照亮的冷绿 */
  function paintCypress(group, W, H, rng, seed) {
    var trunkX = W * 0.129;
    var tipY = H * -0.04;
    var baseY = H * 1.03;
    var span = baseY - tipY;
    var maxHalf = W * 0.053;
    var i;

    function halfWidthAt(t) {
      return maxHalf * Math.pow(1 - t, 0.66) + W * 0.0032;
    }
    function swayAt(t) {
      return Math.sin(t * 3.5 + 0.55) * W * 0.013 * (1 - t * 0.35);
    }

    var cypress = document.createElementNS(SVG_NS, "g");
    cypress.setAttribute("class", "sky-cypress");
    cypress.setAttribute("filter", "url(#sky-paint-" + seed + ")");

    /* 先铺一层实心轮廓，避免笔触之间露出天空 */
    var sd = "";
    for (i = 0; i <= 24; i++) {
      var t = i / 24;
      sd += (i === 0 ? "M" : "L") + round1(trunkX + swayAt(t) - halfWidthAt(t) * 0.94) + " " + round1(baseY - span * t);
    }
    for (i = 24; i >= 0; i--) {
      var t2 = i / 24;
      sd += "L" + round1(trunkX + swayAt(t2) + halfWidthAt(t2)) + " " + round1(baseY - span * t2);
    }
    sd += "Z";
    var silhouette = document.createElementNS(SVG_NS, "path");
    silhouette.setAttribute("d", sd);
    silhouette.setAttribute("fill", "#060f0d");
    silhouette.setAttribute("fill-opacity", "1");
    cypress.appendChild(silhouette);

    for (i = 0; i < 190; i++) {
      var t0 = Math.pow(rng.next(), 0.82);
      var y0 = baseY - span * t0;
      var hw = halfWidthAt(t0);
      var x0 = trunkX + swayAt(t0) + rng.range(-hw * 0.94, hw * 0.96);
      var y1 = y0 - span * rng.range(0.07, 0.3) * (0.5 + rng.next());
      var x1 = x0 + rng.range(-W * 0.014, W * 0.018);
      var tone = rng.next();
      var color = tone > 0.94 ? [26, 58, 44] : tone > 0.72 ? [13, 32, 25] : rng.pick(CYPRESS_DARK);
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M" +
          round1(x0) +
          " " +
          round1(y0) +
          "Q" +
          round1((x0 + x1) / 2 + rng.range(-W * 0.018, W * 0.018)) +
          " " +
          round1((y0 + y1) / 2) +
          " " +
          round1(x1) +
          " " +
          round1(y1)
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgb(" + color.join(",") + ")");
      path.setAttribute("stroke-width", round1(rng.range(W * 0.0034, W * 0.0125)));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-opacity", round1(rng.range(50, 95)) / 100);
      cypress.appendChild(path);
    }

    for (i = 0; i < 30; i++) {
      var th = rng.range(0.05, 0.92);
      var yh = baseY - span * th;
      var px = trunkX + swayAt(th) + halfWidthAt(th) * rng.range(0.74, 1.04);
      var hit = document.createElementNS(SVG_NS, "path");
      hit.setAttribute(
        "d",
        "M" +
          round1(px) +
          " " +
          round1(yh) +
          "q" +
          round1(rng.range(-5, 7)) +
          " " +
          round1(-span * 0.03) +
          " " +
          round1(rng.range(-9, 5)) +
          " " +
          round1(-span * 0.07)
      );
      hit.setAttribute("fill", "none");
      hit.setAttribute("stroke", rng.pick(["#3d7a58", "#2f6b4c", "#4f8f63"]));
      hit.setAttribute("stroke-width", round1(rng.range(W * 0.0013, W * 0.003)));
      hit.setAttribute("stroke-linecap", "round");
      hit.setAttribute("stroke-opacity", round1(rng.range(22, 58)) / 100);
      cypress.appendChild(hit);
    }

    group.appendChild(cypress);
  }

  /* ------------------------------- 入口 ------------------------------- */

  /**
   * 往容器里渲染一幅星空。同一个 seed 结果一致。
   * @param {Element} container
   * @param {{seed:number,width:number,height:number,variant?:string,density?:number}} options
   * @returns {SVGElement}
   */
  function render(container, options) {
    var o = options || {};
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "sky" + (o.variant === "cover" ? " sky--cover" : ""));
    svg.setAttribute("viewBox", "0 0 " + o.width + " " + o.height);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML =
      '<defs><radialGradient id="sky-moon-' +
      o.seed +
      '"><stop offset="0" stop-color="#FFF6D8"/><stop offset="0.55" stop-color="#F7D77A"/><stop offset="1" stop-color="#E8B33C"/></radialGradient></defs>';
    paint(svg, o);
    container.appendChild(svg);
    return svg;
  }

  window.Sky = { render: render };
})();
