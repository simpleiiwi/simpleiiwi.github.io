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
    location: "中国 · 广东",
    /* 头像下方的小状态条，不喜欢可以删掉整个字段 */
    status: "在折腾 CS2 录制工具和校园网小工具",
    ctaPrimary: { label: "访问 GitHub", href: "https://github.com/simpleiiwi", icon: "github" },
    ctaGhost: { label: "发送邮件", href: "mailto:3121332509@qq.com", icon: "mail" },
  },

  /* 顶部导航。现在全部指向单页锚点；以后要拆成多页，把 href 换成 "/projects/" 这类路径即可，
   * 路由接管见 assets/router.js 顶部说明。 */
  nav: [
    { id: "home", label: "首页", icon: "home", href: "#home" },
    { id: "projects", label: "项目", icon: "projects", href: "#projects" },
    { id: "posts", label: "文章", icon: "posts", href: "#posts" },
    { id: "moments", label: "动态", icon: "moments", href: "#moments" },
    { id: "games", label: "游戏", icon: "games", href: "#games" },
    { id: "anime", label: "番剧", icon: "anime", href: "#anime" },
    { id: "skills", label: "技能", icon: "skills", href: "#skills" },
  ],

  /* 头部右侧的 GitHub 文字入口 */
  githubCta: { label: "访问我的 GitHub", href: "https://github.com/simpleiiwi" },

  /* 页脚社交链接 */
  socials: [
    { label: "GitHub", icon: "github", href: "https://github.com/simpleiiwi" },
    { label: "邮箱", icon: "mail", href: "mailto:3121332509@qq.com" },
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
      name: "CS2 击杀自动回录",
      description:
        "检测对局里的击杀事件，自动把「击杀前 8 秒 + 后 4 秒」存成片段。用 CS2 官方 GSI 判定多杀与 ACE，走 OBS 回放缓存落盘，带系统托盘和一键热录。",
      language: "Python",
      languageColor: "#3776AB",
      stars: 0,
      url: "",
      featured: true,
    },
    {
      name: "蓝牙修复工具",
      description:
        "一键修复蓝牙耳机连不上、清理配对残留、输出诊断信息；配套的「耳机守护」会盯着连接状态，掉线或配对记录被清掉就自动处理并记日志。",
      language: "PowerShell",
      languageColor: "#4B7BB5",
      stars: 0,
      url: "",
    },
    {
      name: "选课余量监控",
      description:
        "只读轮询教务系统的选课余量，余量从 0 变成正数就用通知加声音提醒我。不改任何选课结果、不识别验证码，遇到验证码直接停下来提醒人工处理。",
      language: "Python",
      languageColor: "#3776AB",
      stars: 0,
      url: "",
    },
  ],

  /* ------------------------------- 文章 ------------------------------- */
  posts: [],

  /* ------------------------------- 游戏 ------------------------------- */
  games: [
    {
      name: "绝地求生",
      platform: "PC",
      status: "偶尔开黑",
      rating: 7.8,
      hours: 620,
      note: "第一个认真练枪的游戏，跳伞永远跳学校。",
      cover: "assets/covers/pubg.jpg",
    },
    {
      name: "CS2",
      platform: "PC",
      status: "长期在打",
      rating: 8.6,
      hours: 1400,
      note: "为了它写了个击杀自动回录工具，现在回放里全是自己的下饭操作。",
      cover: "assets/covers/cs2.jpg",
    },
    {
      name: "森林之子",
      platform: "PC",
      status: "已通关",
      rating: 8.4,
      hours: 48,
      note: "和朋友联机盖树屋，最后总是在抢木头。",
      cover: "assets/covers/sons-of-the-forest.jpg",
    },
    {
      name: "FC 25",
      platform: "PC",
      status: "偶尔玩",
      rating: 7.5,
      hours: 120,
      note: "只玩生涯模式，转会窗比比赛还上头。",
      cover: "assets/covers/fc25.jpg",
    },
  ],

  /* ------------------------------- 番剧 ------------------------------- */
  anime: [
    {
      name: "进击的巨人",
      year: 2013,
      status: "已看完",
      rating: 9.3,
      episodes: 87,
      note: "收尾争议很大，但我接受这个答案。",
      cover: "assets/covers/aot.webp",
    },
    {
      name: "无职转生",
      year: 2021,
      status: "追更中",
      rating: 9.0,
      episodes: 24,
      note: "异世界番里少见的、真的在讲成长的一部。",
      cover: "assets/covers/mushoku.jpg",
    },
    {
      name: "东京喰种",
      year: 2014,
      status: "已看完",
      rating: 8.4,
      episodes: 12,
      note: "第一季的氛围和片头曲至今难忘。",
      cover: "assets/covers/tokyo-ghoul.jpg",
    },
    {
      name: "龙珠",
      year: 1986,
      status: "童年最爱",
      rating: 9.2,
      episodes: 153,
      note: "小时候守在电视前等的那一集。",
      cover: "assets/covers/dragon-ball.webp",
    },
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
