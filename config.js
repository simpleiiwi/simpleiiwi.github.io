/* ============================================================================
 * 站点唯一数据源
 * ----------------------------------------------------------------------------
 * 所有个人信息、统计数字、项目 / 文章 / 游戏 / 番剧 / 技能都在这个文件里。
 * 换成你自己的内容即可，其它文件都不用改。
 *
 * 替换清单（搜 "TODO" 就能找到全部）：
 *   1. name / role / intro / avatar / location
 *   2. github / email / 其它社交链接
 *   3. stats 四个统计数字
 *   4. projects / posts / games / anime / skills
 *   5. 填完真实内容后把 meta.isDemoData 改成 false（页面上的示例数据提示会自动消失）
 * ==========================================================================*/
window.SiteConfig = {
  meta: {
    /* TODO: 换成你自己的内容后改成 false */
    isDemoData: true,
    title: "kyky · 个人主页",
    description: "全栈开发者 / 独立开发者 · 喜欢把想法做成能用的小工具。",
    /* 首屏背景：填相对路径就用你自己的图当 Hero 背景（会取代代码画的星空）；留空则用星空。
       建议用 16:9 左右的横图，深色或暗调最好，文字会更清楚。 */
    heroImage: "assets/hero-bg.jpg",
    /* 星空画布的随机种子：改这个数字会得到一幅不同的星空（同一数字每次渲染都一样）。
       只在 heroImage 留空时生效；想快速预览不同星空，可以用 ?seed=123 加在网址后面。 */
    skySeed: 20260930,
    /* 语言，用于 <html lang> */
    lang: "zh-CN",
  },

  profile: {
    /* 你的名字或昵称 */
    name: "kyky",
    kicker: "Hi，我是",
    /* TODO: 职位副标题 */
    role: "全栈开发者 / 独立开发者",
    /* TODO: 一句话简介 */
    intro: "喜欢把想法做成能用的小工具。",
    /* 头像：正方形图最好。留空则用姓名首字生成的占位头像 */
    avatar: "assets/avatar.jpg",
    location: "中国 · 上海",
    /* 头像下方的小状态条，不喜欢可以删掉整个字段 */
    status: "目前在折腾本地优先的桌面应用",
    ctaPrimary: { label: "访问 GitHub", href: "https://github.com/simpleiiwi", icon: "github" },
    ctaGhost: { label: "发送邮件", href: "mailto:you@example.com", icon: "mail" },
  },

  /* 顶部导航。现在全部指向单页锚点；以后要拆成多页，把 href 换成 "/projects/" 这类路径即可，
   * 路由接管见 assets/router.js 顶部说明。 */
  nav: [
    { id: "home", label: "首页", icon: "home", href: "#home" },
    { id: "projects", label: "项目", icon: "projects", href: "#projects" },
    { id: "posts", label: "文章", icon: "posts", href: "#posts" },
    { id: "games", label: "游戏", icon: "games", href: "#games" },
    { id: "anime", label: "番剧", icon: "anime", href: "#anime" },
    { id: "skills", label: "技能", icon: "skills", href: "#skills" },
  ],

  /* 头部右侧的 GitHub 文字入口 */
  githubCta: { label: "访问我的 GitHub", href: "https://github.com/simpleiiwi" },

  /* 页脚社交链接 */
  socials: [
    { label: "GitHub", icon: "github", href: "https://github.com/simpleiiwi" },
    { label: "邮箱", icon: "mail", href: "mailto:you@example.com" },
    { label: "RSS", icon: "rss", href: "/feed.xml" },
  ],

  /* 访客计数：纯本地计数（同一浏览器每开一次会话 +1），没有后端也能跑。
   * 想要真实统计就把 enabled 改成 false，然后在页脚挂上你的统计服务。 */
  visitor: {
    enabled: true,
    label: "访问",
    storageKey: "personal-site.visits",
    initial: 1024,
  },

  /* Hero 底部统计条。TODO: 换成你的真实数字 */
  stats: [
    { value: 0, suffix: "+", label: "GitHub Stars" },
    { value: 0, suffix: "+", label: "Forks" },
    { value: 0, suffix: "", label: "Followers" },
    { value: 0, suffix: "+", label: "开源项目" },
  ],

  /* ------------------------------- 项目 ------------------------------- */
  projects: [
    {
      name: "LumenNote",
      description: "本地优先的 Markdown 笔记应用，支持双向链接、全文检索与端到端加密同步。",
      language: "TypeScript",
      languageColor: "#3178C6",
      stars: 128,
      url: "https://github.com/simpleiiwi",
      featured: true,
    },
    {
      name: "PixelKit",
      description: "跨平台截图与标注工具，全局快捷键唤起，支持滚动截图和贴图。",
      language: "C#",
      languageColor: "#7B4BD1",
      stars: 86,
      url: "https://github.com/simpleiiwi",
    },
    {
      name: "Feedfold",
      description: "把 RSS、Newsletter 和稍后读折叠成一份每日简报，只推给你真正想看的。",
      language: "Go",
      languageColor: "#00ADD8",
      stars: 54,
      url: "https://github.com/simpleiiwi",
    },
    {
      name: "TabNest",
      description: "标签页收纳浏览器扩展：按项目分组、一键收起，隔天再打开还在原地。",
      language: "JavaScript",
      languageColor: "#F1E05A",
      stars: 41,
      url: "https://github.com/simpleiiwi",
    },
    {
      name: "Clippy",
      description: "轻量剪贴板历史管理器，支持正则搜索、模糊匹配和多设备同步。",
      language: "Rust",
      languageColor: "#DEA584",
      stars: 33,
      url: "https://github.com/simpleiiwi",
    },
    {
      name: "dotfiles",
      description: "我的开发环境配置：Windows Terminal、Neovim、PowerShell 一键同步。",
      language: "PowerShell",
      languageColor: "#4B7BB5",
      stars: 22,
      url: "https://github.com/simpleiiwi",
    },
  ],

  /* ------------------------------- 文章 ------------------------------- */
  posts: [
    {
      title: "用 Tauri 重写桌面笔记应用：我踩过的 7 个坑",
      date: "2026-08-14",
      readingTime: "12 分钟",
      summary: "从 Electron 迁移到 Tauri 之后包体小了 90%，但文件和 SQLite 的权限模型把我按在地上摩擦了三轮。这是踩坑清单和最终方案。",
      tags: ["桌面端", "Tauri", "Rust"],
      url: "#posts",
    },
    {
      title: "本地优先（Local-first）到底解决了什么问题",
      date: "2026-06-02",
      readingTime: "9 分钟",
      summary: "云端优先的产品默认你的网络永远在线。我把自己三个小工具改成离线可用之后，才真正理解 CRDT 和冲突合并为什么值得。",
      tags: ["架构", "CRDT"],
      url: "#posts",
    },
    {
      title: "把 RSS 折叠成一份每日简报",
      date: "2026-04-21",
      readingTime: "7 分钟",
      summary: "订阅 200 个源以后，我需要的不是更多内容，而是一个会替我删掉东西的过滤器。记录一次信息减法的实现。",
      tags: ["工具", "Go"],
      url: "#posts",
    },
    {
      title: "Windows 下的终端美学：一份可复制的配置",
      date: "2026-02-09",
      readingTime: "6 分钟",
      summary: "Windows Terminal、PowerShell 7、Nerd Font 和一条能一眼看懂的提示符。附完整配置文件。",
      tags: ["Windows", "效率"],
      url: "#posts",
    },
    {
      title: "我是怎么给开源项目写 README 的",
      date: "2025-12-18",
      readingTime: "5 分钟",
      summary: "README 是项目的第一个界面。前 8 行必须回答：这是干什么的、怎么装、跑起来长什么样。",
      tags: ["开源", "写作"],
      url: "#posts",
    },
  ],

  /* ------------------------------- 游戏 ------------------------------- */
  games: [
    { name: "艾尔登法环", platform: "PC", status: "二周目", rating: 9.6, hours: 168, note: "把探索奖励做成了信仰。" },
    { name: "空洞骑士：丝之歌", platform: "PC", status: "进行中", rating: 9.2, hours: 34, note: "手感比前作更锋利。" },
    { name: "塞尔达传说：王国之泪", platform: "Switch", status: "已通关", rating: 9.4, hours: 121, note: "究极手是这一代的灵魂。" },
    { name: "星露谷物语", platform: "PC", status: "长期挂着", rating: 9.0, hours: 240, note: "每年冬天都会回去种一次地。" },
  ],

  /* ------------------------------- 番剧 ------------------------------- */
  anime: [
    { name: "葬送的芙莉莲", year: 2023, status: "已看完", rating: 9.5, episodes: 28, note: "把「之后」拍得比「当时」更动人。" },
    { name: "进击的巨人 最终季", year: 2023, status: "已看完", rating: 9.3, episodes: 28, note: "收尾争议很大，但我接受这个答案。" },
    { name: "钢之炼金术师 FA", year: 2009, status: "三周目", rating: 9.7, episodes: 64, note: "结构最工整的长篇，没有之一。" },
    { name: "悠哉日常大王", year: 2013, status: "已看完", rating: 9.1, episodes: 12, note: "睡前看两集，比什么都管用。" },
  ],

  /* ------------------------------- 技能 ------------------------------- */
  /* level 是 0-100 的自评熟练度，同时驱动左侧雷达图和右侧熟练度条。
   * 只想要标签云、不想要数值：把 level 换成 items 就行（见下方注释）。 */
  skills: [
    {
      name: "后端服务",
      short: "后端",
      level: 88,
      items: [".NET / ASP.NET Core", "Go", "REST & gRPC", "消息队列"],
    },
    {
      name: "桌面应用",
      short: "桌面",
      level: 82,
      items: ["WPF / WinUI 3", "Tauri", "原生互操作"],
    },
    {
      name: "前端界面",
      short: "前端",
      level: 74,
      items: ["TypeScript", "React", "Tailwind CSS", "Vite"],
    },
    {
      name: "工程与协作",
      short: "工程",
      level: 80,
      items: ["Git 工作流", "单元测试", "CI/CD", "代码评审"],
    },
    {
      name: "数据与存储",
      short: "数据",
      level: 70,
      items: ["PostgreSQL", "SQLite", "Redis", "数据建模"],
    },
    {
      name: "云与部署",
      short: "云",
      level: 66,
      items: ["Docker", "Linux", "Nginx", "Cloudflare Pages"],
    },
  ],
};
