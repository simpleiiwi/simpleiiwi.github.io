# 个人主页 · Personal Site

一个零依赖的纯静态个人主页：吸顶导航 + 星空油画 Hero + 玻璃拟态统计条 + 项目 / 文章 /
游戏 / 番剧 / 技能五个内容区，深浅两套主题。

**没有任何构建步骤，也没有任何外部请求**：不加载 CDN、不加载字体文件、不热链图片。
连那片星空都是打开页面时用代码一笔一笔画出来的（见「星空是怎么画出来的」）。

---

## 1. 本地跑起来

### 方式 A：起一个静态服务器（推荐）

```bash
cd personal-site

# Python（macOS / Linux 自带 python3）
python3 -m http.server 4173

# 或者 Node
npx serve -l 4173 .

# 或者 PHP
php -S 127.0.0.1:4173
```

然后打开 <http://127.0.0.1:4173/>。

### 方式 B：直接双击 `index.html`

设计上支持：所有脚本都是普通 `<script>`，不是 ES module；样式和数据都走相对路径；
全程没有 `fetch` / XHR；星空是运行时用 DOM API 画出来的。这些加起来意味着它不需要服务器。

少数浏览器会限制 `file://` 下的 `localStorage`，这种情况下主题不会记住，但页面照常显示
（`index.html` 里的主题脚本和 `app.js` 都做了 try/catch 兜底），所以还是推荐方式 A。

### 自检模式

网址后面加 `?diag=1`，页面左下角会出现一个自检面板，直接告诉你：视口尺寸、有没有横向溢出、
有没有报错、有没有失败资源、有没有外链、星空画了多少笔、每块内容渲染了多少个：

```
http://127.0.0.1:4173/?diag=1
```

---

## 2. 平时怎么发内容（推荐：用后台页）

打开 <https://simpleiiwi.github.io/admin/>，就三步：

1. **登录一次**：按页面上的 4 步提示，去 GitHub 生成一个细粒度令牌（fine-grained token），
   权限只要勾这个仓库的 **Contents: Read and write**，粘进去点「保存并连接」。
   令牌只存在你自己这台浏览器里，只会发给 `api.github.com`，不经过任何第三方。
2. **写一条动态**：填日期、写内容、需要就加标签，点「发布」。
3. 大约 1 分钟后刷新 <https://simpleiiwi.github.io/> 就能看到；也可以回后台页改 / 删已经发过的。

它做的事情就是帮你改 `assets/moments.js` 并提交到 GitHub，所以**也不需要本地文件、不需要拖动、不需要命令行**。
GitHub Pages 会自动重新发布，这正是静态站能"免费 + 极快"的原因。

> 不想开后台也行：直接编辑仓库里的 `assets/moments.js`，或者把内容发给我，我改完你点一下 Commit。

## 3. 换成你自己的信息（只需要改一个文件）

**所有个人数据都在 `assets/config.js` 里**，其它文件一个都不用动。
搜索 `TODO` 可以一次找齐所有需要替换的地方。

| 字段 | 说明 |
| --- | --- |
| `profile.name` | 你的名字（首屏大标题、页脚版权都会跟着变） |
| `profile.kicker` | 名字上方的小字，默认 `Hi，我是` |
| `profile.role` | 职位副标题 |
| `profile.intro` | 一句话简介 |
| `profile.avatar` | 头像路径，例如 `assets/avatar.jpg`；**留空**就用名字首字生成的占位头像 |
| `meta.heroImage` | 首屏背景图。填相对路径（例如 `assets/hero-bg.jpg`）就是用你自己的图；**留空**则用代码画的星空 |
| `profile.location` / `profile.status` | 鼠标悬停提示 / 头像下方的小状态条 |
| `profile.ctaPrimary` / `profile.ctaGhost` | 两个按钮的文字与链接（GitHub、邮箱） |
| `githubCta.href` | 头部右侧「访问我的 GitHub」的链接 |
| `socials` | 页脚社交链接（GitHub / 邮箱 / RSS…） |
| `stats` | 首屏统计条的四组数字，`value` + `suffix`（例如 `20` + `"+"`） |
| `projects` | 项目卡片：名称、描述、语言、语言色、Star 数、链接 |
| `posts` | 文章：标题、日期、阅读时间、摘要、标签、链接 |
| `games` / `anime` | 兴趣卡片：名称、平台 / 年份、状态、时长 / 集数、评分、一句话备注 |
| `skills` | 技能分类，`level`（0-100）同时驱动雷达图和熟练度条；`short` 是雷达图轴上的短名 |
| `meta.skySeed` | 星空的随机种子（只在 `heroImage` 留空时生效）。**改这个数字会得到完全不同的一幅星空**，同一个数字每次渲染都一样 |
| `meta.isDemoData` | 现在是 `true`，页面顶部会显示一条「当前展示的是示例数据」的提示。填完真实内容后改成 `false`，提示自动消失 |

### 关于统计数字的说明

`stats` 里现在都是 `0`，`projects[].stars` 是示例数字。页脚和 README 都不会假装它们是真的。
想显示真实数据有两种做法：

1. 手动填：定期把 GitHub 上的数字抄进 `config.js`。
2. 自动拉：在部署平台加一个定时任务，调用 GitHub API 把结果写进一个 JSON，
   再在 `assets/app.js` 的 `renderHero()` 里替换 `cfg.stats`。这样改不会影响其它任何地方。

### 关于访客计数

导航栏右侧的访客数是**本地计数**（存在 `localStorage`，同一个浏览器会话只加一次），
它不冒充全站真实访问量。想要真实统计：把 `visitor.enabled` 改成 `false`，
再把你惯用的统计服务（Umami / Cloudflare Web Analytics 等）的脚本挂到 `index.html` 底部。

### 关于文章

`posts: []` 现在是**空的**，所以页面上的「文章」区块和导航项会自动隐藏（没内容就不显示空壳）。
写第一篇时照 `config.js` 里那段注释的格式加进去，区块和导航会自动回来。

### 关于图片（头像和首屏背景）

站点默认不放任何图片文件：头像用名字首字生成，首屏是代码画的星空。一旦你填了
`profile.avatar` 或 `meta.heroImage`，就会用到 `assets/` 里的图片（本地图，不是外链）。

- 头像：建议正方形图，400×400 左右就够。
- 首屏背景：建议 16:9 左右的横图，**深色或暗调最好**，压在上面的文字才清楚；
  浅色图需要把 `styles.css` 里 `.hero__scrim` 的压暗层调重一些。
- 图片的**取景**（放大倍数和位置）在 `styles.css` 的 `.hero__photo` 里，
  手机端另有一份在 `@media (max-width: 620px)` 里。
- 图片没上传上去、或路径写错时，页面会自动退回「名字首字头像 + 代码画的星空」，
  不会出现破图或黑屏。

### 临时预览参数

网址后面加参数就能临时看效果，不改任何文件：

```
http://127.0.0.1:4173/?seed=314159     换一幅星空
http://127.0.0.1:4173/?theme=light     强制亮色主题
http://127.0.0.1:4173/?diag=1          打开自检面板
```

---

## 4. 构建

不需要构建。`assets/` 里就是浏览器直接执行的文件。

如果想要压缩：任意静态服务器开启 gzip/brotli 即可，或者手动压缩 CSS / JS /
`assets/*.js`（都是纯文本，压缩后总体积会小很多）。

---

## 5. 部署到 GitHub Pages

```bash
cd personal-site
git init
git add .
git commit -m "feat: personal homepage"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

然后在 GitHub 仓库页面：**Settings → Pages → Build and deployment**

- Source 选 `Deploy from a branch`
- Branch 选 `main`，目录选 `/ (root)`
- 保存，等一两分钟，访问 `https://你的用户名.github.io/你的仓库/`

因为整站用的都是相对路径（`assets/...`、`favicon.svg`），放在子路径下也能正常工作。

### 部署到 Cloudflare Pages

1. Cloudflare 控制台 → **Workers & Pages → Create → Pages → Connect to Git**
2. 选择仓库
3. **Build command 留空**，**Build output directory 填 `/`（或 `personal-site` 这一层）**
4. 保存部署，之后每次 push 都会自动更新

### 想要自定义域名

GitHub Pages 在仓库 Settings → Pages → Custom domain 里填；
Cloudflare Pages 在项目的 Custom domains 里加。两者都会自动签 HTTPS 证书。

---

## 6. 星空是怎么画出来的

`assets/sky.js` 是一个很小的「油画引擎」，整个过程不超过 400 行：

1. 在 0..1 的归一化画布上定义一个**流场**：7 个涡旋 + 基础横向漂移 + 一层平滑 value noise；
2. 沿流场积分出上千条**两端收窄的带状笔触**（每条约 8–16 段），
   按所在高度、涡旋能量、以及 5 个「光核」的距离从
   夜色 → 靛蓝 → 霁蓝 → 近白 的色阶上取色；
3. 其中约 15% 的笔触被刻意压暗、约 16% 被提亮，画面才有厚涂的起伏；
4. 一部分笔触再叠一条更窄更亮的**高光边**，模拟颜料堆叠；
5. 叠加星星（一层很淡的柔光 + 三圈被拉长的弧形光斑 + 亮核，最外圈换成冷色）、
   月亮、山脊与教堂尖塔、左侧柏树；
6. 用 `feTurbulence` + `feDisplacementMap` 把矢量边揉出颜料颗粒，
   再压一层噪点清漆；
7. 最后盖一层从上到下、以及中心向外的压暗层 —— 不是为了好看，
   是为了让压在这幅画上的文字达到 AA 对比度。

同一张卡片封面用的是同一个引擎的 `variant: "cover"` 模式：笔触更少、星位和冷暖偏移
按种子重掷，所以八张封面互不相同，而且**一张图片文件都不需要**。

想换一幅星空：改 `config.js` 里的 `meta.skySeed` 就行。

---

## 7. 文件结构

```
personal-site/
├── index.html            # 页面骨架（语义化标签 + 各区块容器）
├── 404.html              # GitHub Pages 的 404 页面
├── favicon.svg           # 站点图标（手写 SVG）
├── README.md
├── admin/
│   └── index.html        # ★ 发布后台：登录一次后就能直接发动态
└── assets/
    ├── config.js         # ★ 唯一数据源：你的所有信息都在这里
    ├── moments.js        # ★ 动态/日记的数据（后台页维护的就是它）
    ├── styles.css        # 设计令牌 + 全部样式（深/亮两套主题）
    ├── app.js            # 渲染 + 交互：主题、导航高亮、移动端菜单、滚动淡入、封面懒加载
    ├── sky.js            # 星空油画引擎（含卡片封面）
    ├── radar.js          # 技能雷达图（可悬停 / 可键盘聚焦）
    ├── icons.js          # 全部图标的 inline SVG（统一 1.5 描边）
    ├── router.js         # 路由占位层：以后要拆成多页时改这里
    ├── diag.js           # ?diag=1 才启用的自检面板
    ├── diag.css
    └── covers/           # 游戏封面图（从各游戏官方素材下载到本地，不是外链）
```

### 以后想把单页拆成多页

导航链接统一走 `assets/router.js`，所以只要两步：

1. 在 `config.js` 的 `nav` 里把 `href` 从 `"#projects"` 改成 `"/projects/"`；
2. 在 `router.js` 的 `ROUTES` 里给这些路径补上条目，并在 `resolve()` 里让它们返回
   `{ external: true }`，浏览器就会自己去导航。

组件层不用改，因为它只调用 `Router.attach()`。

---

## 8. 无障碍与细节

- 深浅两套主题都按 AA 对比度选色；深色主题正文 `#EEF2FC` 压在 `#070C1C` 上约 17:1。
- 首屏文字压在油画上，所以额外做了从上到下 + 中心向外的压暗层和 1px 紧贴阴影。
- 键盘：第一个 Tab 是「跳到主要内容」；导航、主题开关、卡片、雷达图顶点、
  回到顶部全部可聚焦，焦点环统一 `2px solid #F0453A`。
- 移动端菜单支持 Esc 关闭、打开后焦点移入面板、展开时锁滚动。
- `prefers-reduced-motion: reduce` 下，星空显影、文字上浮、滚动淡入、
  熟练度条全部直接到终态。
- 触屏下雷达图顶点点击区域放大到 44px。
- 打印时会自动展开所有滚动淡入的区块，不会出现空白页。

## 9. 浏览器支持

Chrome / Edge 111+、Firefox 113+、Safari 16.4+（用到了
`color-scheme`、`100svh`、独立 `translate` 属性、`text-wrap: balance`、
`backdrop-filter`）。更旧的浏览器会退化成没有玻璃模糊和显影动画，但内容与布局仍然可用。
