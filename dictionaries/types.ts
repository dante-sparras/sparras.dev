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
    short: {
      system: string;
      light: string;
      dark: string;
    };
  };
  home: {
    title: string;
    description: string;
  };
  meta: {
    description: string;
    keywords: readonly string[];
    openGraphDescription: string;
    twitterDescription: string;
  };
};
