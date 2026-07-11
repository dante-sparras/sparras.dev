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
    hero: {
      name: string;
      role: string;
      avatarAlt: string;
      student: string;
      location: string;
      pronouns: string;
    };
  };
  nav: {
    aria: string;
    menu: string;
    menuTitle: string;
    logo: string;
    logoAria: string;
    links: {
      about: string;
      work: string;
      resume: string;
      contact: string;
    };
  };
  pages: {
    about: { title: string; description: string };
    work: { title: string; description: string };
    resume: { title: string; description: string };
    contact: { title: string; description: string };
  };
  meta: {
    description: string;
    keywords: readonly string[];
    openGraphDescription: string;
    twitterDescription: string;
  };
};
