// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    primaryHover: string;
    surface: string;
    background: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    accent: string;
    border: string;
    borderHover: string;
    success: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    heroSize: string;
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
    lineHeightTight: number;
    lineHeightNormal: number;
  };
  spacing: {
    section: string;
    container: string;
    gridGap: string;
    cardPadding: string;
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
      stagger: number;
    };
    easing: {
      smooth: number[];
      bounce: number[];
      spring: { stiffness: number; damping: number };
    };
    parallax: {
      backgroundSpeed: number;
      contentSpeed: number;
      floatSpeed: number;
    };
  };
  effects: {
    glassBg: string;
    glassBlur: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowHover: string;
  };
}

// Site Types
export interface TeamInfo {
  name: string;
  slogan: string;
  description: string;
  founded: string;
  location: string;
  email: string;
  social: {
    github: string;
    telegram?: string;
    wechat?: string;
  };
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  items: FooterLink[];
}

export interface FooterConfig {
  copyright: string;
  icp: string;
  links: FooterSection[];
}

export interface SiteConfig {
  team: TeamInfo;
  seo: SEOConfig;
  footer: FooterConfig;
}

// Hero Types
export interface HeroFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface CTA {
  text: string;
  link: string;
  style: 'primary' | 'secondary';
}

export interface HeroContent {
  greeting: string;
  title: string;
  subtitle: string;
  backgroundEffect: 'fluid' | 'mesh' | 'particles';
  cta: CTA[];
  tagline: string;
  features?: HeroFeature[];
}

// Stats Types
export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface StatsConfig {
  stats: StatItem[];
}

// Services Types
export interface ServiceDetailItem {
  name: string;
  desc: string;
  price: string;
}

export interface ServiceDetailSection {
  title: string;
  items: ServiceDetailItem[];
  totalPrice?: string;
  performance?: string;
  note?: string;
}

export interface ServiceDetailModal {
  title: string;
  sections: ServiceDetailSection[];
}

export interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  size: 'large' | 'medium' | 'small';
  priceRange: string;
  delivery: string;
  features: string[];
  techStack: string[];
  caseIds: string[];
  popular?: boolean;
  detailModal?: ServiceDetailModal;
}

export interface ServicesConfig {
  services: Service[];
}

// Tech Stack Types
export interface TechItem {
  name: string;
  proficiency: number;
  icon: string;
}

export interface TechCategory {
  name: string;
  items: TechItem[];
}

export interface TechStackConfig {
  categories: TechCategory[];
}

// Pricing Types
export interface PricingItem {
  name: string;
  price: number;
  priceType: 'fixed' | 'range' | 'negotiable';
  specs: string[];
  technicalParams: Record<string, string>;
  negotiable: boolean;
  popular?: boolean;
}

export interface PricingCategory {
  id: string;
  name: string;
  description: string;
  items: PricingItem[];
}

export interface PricingConfig {
  categories: PricingCategory[];
  disclaimer: string;
}

// Process Types
export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export interface ProcessConfig {
  steps: ProcessStep[];
}

// Cases Types
export interface Case {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  result: string;
  image?: string;
  demo?: boolean;
}

export interface CasesConfig {
  cases: Case[];
}

// Navigation Types
export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface NavigationConfig {
  links: NavLink[];
  cta: {
    label: string;
    href: string;
  };
  social: SocialLink[];
}

// Unified Site Data Types (from site-data.json)
export interface SiteData {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  navigation: {
    logo: string;
    links: NavLink[];
    cta: {
      label: string;
      href: string;
    };
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta: {
      text: string;
      link: string;
      primary: boolean;
    }[];
    stats: {
      value: string;
      label: string;
    }[];
  };
  services: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    size: 'large' | 'medium' | 'small';
    price: string;
    delivery: string;
    features: string[];
    tech: string[];
    popular?: boolean;
    details?: {
      sections: {
        title: string;
        items: {
          name: string;
          desc: string;
          price: string;
        }[];
        total: string;
        performance?: string;
      }[];
    };
  }[];
  techStack: {
    title: string;
    subtitle: string;
    categories: {
      name: string;
      icon: string;
      skills: {
        name: string;
        level: number;
      }[];
    }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    disclaimer: string;
    categories: {
      id: string;
      name: string;
      plans: {
        name: string;
        price: string;
        features: string[];
        params?: Record<string, string>;
        popular?: boolean;
      }[];
    }[];
  };
  process: {
    title: string;
    subtitle: string;
    steps: {
      id: number;
      title: string;
      description: string;
      icon: string;
      details: string[];
      duration: string;
    }[];
  };
  comparison: {
    title: string;
    subtitle: string;
    items: {
      dimension: string;
      traditional: string;
      sakurain: string;
      highlight: string;
    }[];
  };
  contact: {
    title: string;
    subtitle: string;
    email: string;
    responseTime: string;
    social: SocialLink[];
    note: string;
  };
  footer: {
    copyright: string;
    slogan: string;
    links: NavLink[];
  };
}
