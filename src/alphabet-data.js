function createLetter(
  letter,
  name,
  word,
  ipa,
  speak = word,
  specialVariants = [],
) {
  return {
    letter,
    name,
    variants: [
      {
        char: letter,
        speak,
        ipa,
        word,
      },
      ...specialVariants,
    ],
  };
}

/* =====================================================
   FRENCH
===================================================== */

const frenchAlphabet = [
  createLetter("A", "a", "ami", "/a/", "ami", [
    {
      char: "À",
      name: "a accent grave",
      speak: "là",
      ipa: "/a/",
      word: "là",
    },
    {
      char: "Â",
      name: "a accent circonflexe",
      speak: "pâte",
      ipa: "/ɑ/",
      word: "pâte",
    },
  ]),

  createLetter("B", "bé", "bonjour", "/b/"),

  createLetter("C", "cé", "café", "/k/", "café", [
    {
      char: "Ç",
      name: "c cédille",
      speak: "ça",
      ipa: "/s/",
      word: "ça",
    },
  ]),

  createLetter("D", "dé", "demain", "/d/"),

  createLetter("E", "e", "le", "/ə/", "le", [
    {
      char: "É",
      name: "e accent aigu",
      speak: "été",
      ipa: "/e/",
      word: "été",
    },
    {
      char: "È",
      name: "e accent grave",
      speak: "père",
      ipa: "/ɛ/",
      word: "père",
    },
    {
      char: "Ê",
      name: "e accent circonflexe",
      speak: "fête",
      ipa: "/ɛ/",
      word: "fête",
    },
    {
      char: "Ë",
      name: "e tréma",
      speak: "Noël",
      ipa: "/ɛ/",
      word: "Noël",
    },
  ]),

  createLetter("F", "effe", "fleur", "/f/"),

  createLetter("G", "gé", "gare", "/g/"),

  createLetter("H", "ache", "hôtel", "Often silent", "hôtel"),

  createLetter("I", "i", "ici", "/i/", "ici", [
    {
      char: "Î",
      name: "i accent circonflexe",
      speak: "île",
      ipa: "/i/",
      word: "île",
    },
    {
      char: "Ï",
      name: "i tréma",
      speak: "naïf",
      ipa: "/i/",
      word: "naïf",
    },
  ]),

  createLetter("J", "ji", "jour", "/ʒ/"),

  createLetter("K", "ka", "kiwi", "/k/"),

  createLetter("L", "elle", "livre", "/l/"),

  createLetter("M", "emme", "maman", "/m/"),

  createLetter("N", "enne", "nuit", "/n/"),

  createLetter("O", "o", "mot", "/o/", "mot", [
    {
      char: "Ô",
      name: "o accent circonflexe",
      speak: "hôpital",
      ipa: "/o/",
      word: "hôpital",
    },
  ]),

  createLetter("P", "pé", "pain", "/p/"),

  createLetter("Q", "ku", "question", "/k/"),

  createLetter("R", "erre", "rouge", "/ʁ/"),

  createLetter("S", "esse", "soleil", "/s/"),

  createLetter("T", "té", "table", "/t/"),

  createLetter("U", "u", "lune", "/y/", "lune", [
    {
      char: "Ù",
      name: "u accent grave",
      speak: "où",
      ipa: "/u/",
      word: "où",
    },
    {
      char: "Û",
      name: "u accent circonflexe",
      speak: "sûr",
      ipa: "/y/",
      word: "sûr",
    },
    {
      char: "Ü",
      name: "u tréma",
      speak: "aiguë",
      ipa: "/y/",
      word: "aiguë",
    },
  ]),

  createLetter("V", "vé", "ville", "/v/"),

  createLetter("W", "double vé", "wagon", "/v/"),

  createLetter("X", "ixe", "taxi", "/ks/"),

  createLetter("Y", "i grec", "yaourt", "/j/", "yaourt", [
    {
      char: "Ÿ",
      name: "y tréma",
      speak: "L'Haÿ-les-Roses",
      ipa: "/i/",
      word: "L'Haÿ-les-Roses",
    },
  ]),

  createLetter("Z", "zède", "zéro", "/z/"),
];

/* =====================================================
   GERMAN
===================================================== */

const germanAlphabet = [
  createLetter("A", "a", "Apfel", "/a/", "Apfel", [
    {
      char: "Ä",
      name: "A Umlaut",
      speak: "Äpfel",
      ipa: "/ɛ/",
      word: "Äpfel",
    },
  ]),

  createLetter("B", "be", "Ball", "/b/"),

  createLetter("C", "tse", "Café", "/k/"),

  createLetter("D", "de", "Deutsch", "/d/"),

  createLetter("E", "e", "Essen", "/ɛ/"),

  createLetter("F", "eff", "Fisch", "/f/"),

  createLetter("G", "ge", "Garten", "/g/"),

  createLetter("H", "ha", "Haus", "/h/"),

  createLetter("I", "i", "Insel", "/ɪ/"),

  createLetter("J", "jot", "Jahr", "/j/"),

  createLetter("K", "ka", "Kind", "/k/"),

  createLetter("L", "ell", "Lampe", "/l/"),

  createLetter("M", "emm", "Mann", "/m/"),

  createLetter("N", "enn", "Nacht", "/n/"),

  createLetter("O", "o", "Obst", "/oː/", "Obst", [
    {
      char: "Ö",
      name: "O Umlaut",
      speak: "Öl",
      ipa: "/øː/",
      word: "Öl",
    },
  ]),

  createLetter("P", "pe", "Pferd", "/p/"),

  createLetter("Q", "ku", "Quelle", "/kv/"),

  createLetter("R", "err", "rot", "/ʁ/"),

  createLetter("S", "ess", "Sonne", "/z/", "Sonne", [
    {
      char: "ß",
      name: "Eszett",
      speak: "Straße",
      ipa: "/s/",
      word: "Straße",
    },
  ]),

  createLetter("T", "te", "Tag", "/t/"),

  createLetter("U", "u", "Uhr", "/uː/", "Uhr", [
    {
      char: "Ü",
      name: "U Umlaut",
      speak: "über",
      ipa: "/yː/",
      word: "über",
    },
  ]),

  createLetter("V", "fau", "Vater", "/f/"),

  createLetter("W", "we", "Wasser", "/v/"),

  createLetter("X", "iks", "Xylophon", "/ks/"),

  createLetter("Y", "Ypsilon", "Yoga", "/j/"),

  createLetter("Z", "zett", "Zeit", "/ts/"),
];

/* =====================================================
   EXPORTS
===================================================== */

export const ALPHABETS = {
  fr: frenchAlphabet,
  de: germanAlphabet,
};

export function getAlphabet(languageCode) {
  return ALPHABETS[languageCode] ?? ALPHABETS.fr;
}
