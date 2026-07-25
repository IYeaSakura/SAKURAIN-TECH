/**
 * i18n core types.
 *
 * Defines the supported locales and the shape of the translation dictionary.
 * All dictionaries must conform to Dictionary so the useTranslation hook is
 * fully type-safe.
 */

export type Locale = 'en' | 'zh';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh'];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_STORAGE_KEY = 'sakurain-locale';

export interface Dictionary {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    blog: string;
    projects: string;
    shuoshuo: string;
    friends: string;
    friendsCircle: string;
    earth: string;
    about: string;
    photos: string;
    music: string;
    docs: string;
    algoViz: string;
    resume: string;
    studio: string;
    settings: string;
    terminal: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    open: string;
    back: string;
    search: string;
    clear: string;
    submit: string;
    cancel: string;
    save: string;
    copy: string;
    copied: string;
    theme: string;
    light: string;
    dark: string;
    en: string;
    zh: string;
    language: string;
    unknown: string;
    more: string;
    all: string;
    empty: string;
    readMore: string;
    scrollToTop: string;
    settingsTitle: string;
    control: string;
  };
  home: {
    intro: string;
    tagline: string;
    readBlog: string;
    viewShuoshuo: string;
    terminalMode: string;
    recentPosts: string;
    allPosts: string;
    noPosts: string;
    recentShuoshuo: string;
  };
  footer: {
    docs: string;
    shuoshuo: string;
    algoViz: string;
    builtWith: string;
    icp: string;
    beian: string;
  };
  settings: {
    title: string;
    description: string;
    backHome: string;
    colorTheme: string;
    styleIntensity: string;
    borderWidth: string;
    shadowIntensity: string;
    accessibility: string;
    reducedMotion: string;
    reset: string;
    previewTitle: string;
    previewSubtitle: string;
    primary: string;
    secondary: string;
    tertiary: string;
    language: string;
  };
  music: {
    nowPlaying: string;
    playlist: string;
    playlistCount: string;
    lyrics: string;
    noLyrics: string;
    enjoyMusic: string;
    shrinkLyrics: string;
    enlargeLyrics: string;
    alignCenter: string;
    alignLeft: string;
    closePlaylist: string;
    previous: string;
    next: string;
    mute: string;
    unmute: string;
    fullscreen: string;
    exitFullscreen: string;
    shuffle: string;
    repeat: string;
    sequential: string;
    trackInfo: string;
    unknownTrack: string;
    unknownArtist: string;
    loading: string;
    unavailable: string;
    playing: string;
    paused: string;
    buffering: string;
    systemPaused: string;
    systemPausedNotice: string;
    clickToRetry: string;
    playMode: string;
    bottomLyrics: string;
    collapse: string;
    trackNumber: string;
    backToHome: string;
    audioMetrics: {
      playing: string;
      paused: string;
      buffering: string;
      systemPaused: string;
    };
  };
  blog: {
    title: string;
    description: string;
    readTime: string;
    words: string;
    tags: string;
    archive: string;
    latest: string;
    noPosts: string;
    backToList: string;
    tableOfContents: string;
    expandToc: string;
    collapseToc: string;
    bookmark: string;
    bookmarked: string;
    comments: string;
    commentCount: string;
    writeComment: string;
    nickname: string;
    email: string;
    content: string;
    publish: string;
    reply: string;
    noComments: string;
    loadMore: string;
  };
  about: {
    title: string;
    subtitle: string;
    role: string;
    education: string;
    skillGameTheory: string;
    skillFullStack: string;
    skillAI: string;
    statsProjects: string;
    statsLines: string;
    statsStack: string;
    statsDeps: string;
    techStack: string;
    honors: string;
    contactTitle: string;
    contactDesc: string;
    qq: string;
    uses: {
      title: string;
      hardware: string;
      software: string;
      development: string;
      services: string;
      updatedAt: string;
    };
    colophon: {
      title: string;
    };
  };
  notFound: {
    title: string;
    subtitle: string;
    backHome: string;
  };
  earth: {
    title: string;
    sendDanmaku: string;
    textMode: string;
    satelliteMode: string;
    orbitMode: string;
    beidou: string;
    danmakuList: string;
    showAll: string;
    hideAll: string;
    showMine: string;
    showAllDanmaku: string;
    deleteDanmaku: string;
    expand: string;
    toggleEffects: string;
    enterFullscreen: string;
    exitFullscreen: string;
  };
  friends: {
    title: string;
    description: string;
    apply: string;
    siteName: string;
    siteDesc: string;
    siteUrl: string;
    siteAvatar: string;
    submit: string;
    statusUp: string;
    statusDown: string;
    statusJS: string;
  };
  docs: {
    title: string;
    description: string;
    search: string;
    searchPlaceholder: string;
    categories: string;
    chapters: string;
    prev: string;
    next: string;
    toc: string;
  };
  photos: {
    title: string;
    description: string;
    noPhotos: string;
  };
  notes: {
    title: string;
    description: string;
    noNotes: string;
    readingTime: string;
  };
  terminal: {
    toggleTheme: string;
    exitTerminal: string;
    welcome: string;
    commandNotFound: string;
    fileNotFound: string;
    directoryNotFound: string;
    permissionDenied: string;
    usage: string;
    view: string;
  };
  algoViz: {
    start: string;
    resume: string;
    pause: string;
    stop: string;
    stepBack: string;
    stepForward: string;
    newData: string;
    importArray: string;
    importGraph: string;
    codeTemplate: string;
    complexity: string;
    graphMode: string;
    mazeMode: string;
    fullscreen: string;
    exitFullscreen: string;
    timeComplexity: string;
    spaceComplexity: string;
    enterReview: string;
  };
  resume: {
    title: string;
    preview: string;
    visitSite: string;
    viewSource: string;
    frontend: string;
    backend: string;
    ai: string;
    devops: string;
    storage: string;
  };
  studio: {
    welcomeTitle: string;
    welcomeDesc: string;
    servicesTitle: string;
    servicesSubtitle: string;
  };
  customContextMenu: {
    copyLink: string;
    copyImage: string;
    openImage: string;
    saveImage: string;
    refresh: string;
    back: string;
    forward: string;
  };
}
