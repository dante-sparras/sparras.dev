export type LocaleLabels = {
  short: string;
  name: string;
};

export type Dictionary = {
  locales: {
    en: LocaleLabels;
    sv: LocaleLabels;
  };
  language: {
    triggerAria: string;
  };
  theme: {
    triggerAria: string;
    system: string;
    light: string;
    dark: string;
  };
  home: {
    title: string;
    description: string;
  };
  nav: {
    aria: string;
    menu: string;
    menuTitle: string;
    logo: string;
    logoAria: string;
    resume: string;
    links: {
      about: string;
      skills: string;
      portfolio: string;
      testimonials: string;
      contact: string;
    };
  };
  meta: {
    description: string;
    keywords: readonly string[];
    openGraphDescription: string;
    twitterDescription: string;
  };
};
