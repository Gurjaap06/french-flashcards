export const BASE_LANGUAGE = {
  code: "en",
  name: "English",
  locale: "en-CA",
};

export const LANGUAGES = {
  fr: {
    code: "fr",
    name: "French",
    flag: "🇫🇷",
    locale: "fr-FR",
    wordLabel: "French word",
    wordPlaceholder: "ex: pomme",
    examplePlaceholder: "ex: Je mange une pomme.",
    genders: [
      { value: "none", label: "none" },
      { value: "masculine", label: "masculine" },
      { value: "feminine", label: "feminine" },
      { value: "both", label: "both" },
    ],
  },

  de: {
    code: "de",
    name: "German",
    flag: "🇩🇪",
    locale: "de-DE",
    wordLabel: "German word",
    wordPlaceholder: "ex: Apfel",
    examplePlaceholder: "ex: Ich esse einen Apfel.",
    genders: [
      { value: "none", label: "none" },
      { value: "masculine", label: "masculine" },
      { value: "feminine", label: "feminine" },
      { value: "neuter", label: "neuter" },
    ],
  },
};

export function isSupportedLanguage(code) {
  return Boolean(code && LANGUAGES[code]);
}

export function getLanguage(code) {
  return LANGUAGES[code] ?? LANGUAGES.fr;
}

export function getLanguageList() {
  return Object.values(LANGUAGES);
}
