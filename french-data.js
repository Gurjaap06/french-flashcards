// ==========================================
// BoliForge French Number Database
// Root words only (0–20, tens, hundred, thousand)
// Everything else is generated.
// ==========================================

const BASE_NUMBERS = {

  // 0–20
  0: "zéro",
  1: "un",
  2: "deux",
  3: "trois",
  4: "quatre",
  5: "cinq",
  6: "six",
  7: "sept",
  8: "huit",
  9: "neuf",
  10: "dix",
  11: "onze",
  12: "douze",
  13: "treize",
  14: "quatorze",
  15: "quinze",
  16: "seize",
  17: "dix-sept",
  18: "dix-huit",
  19: "dix-neuf",
  20: "vingt",

  // Tens
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",

  // Base words
  80: "quatre-vingts",
  100: "cent",
  1000: "mille"

};

// ==========================================
// IPA Dictionary
// Used by the detail card and browser audio.
// Larger numbers fall back automatically.
// ==========================================

const BASE_IPA = {

  0: "/zeʁo/",
  1: "/œ̃/",
  2: "/dø/",
  3: "/tʁwa/",
  4: "/katʁ/",
  5: "/sɛ̃k/",
  6: "/sis/",
  7: "/sɛt/",
  8: "/ɥit/",
  9: "/nœf/",
  10: "/dis/",
  11: "/ɔ̃z/",
  12: "/duz/",
  13: "/tʁɛz/",
  14: "/katɔʁz/",
  15: "/kɛ̃z/",
  16: "/sɛz/",
  17: "/dis sɛt/",
  18: "/diz ɥit/",
  19: "/dis nœf/",
  20: "/vɛ̃/",

  30: "/tʁɑ̃t/",
  40: "/kaʁɑ̃t/",
  50: "/sɛ̃kɑ̃t/",
  60: "/swasɑ̃t/",
  80: "/katʁə vɛ̃/",
  100: "/sɑ̃/",
  1000: "/mil/"

};

// ==========================================
// English Meanings
// Used for the info panel.
// ==========================================

const BASE_ENGLISH = {

  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",

  30: "thirty",
  40: "forty",
  50: "fifty",
  60: "sixty",
  80: "eighty",
  100: "one hundred",
  1000: "one thousand"

};

// ==========================================
// Useful examples shown around the page.
// ==========================================

const SHOWCASE_NUMBERS = [

  21,
  31,
  41,
  51,
  61,

  70,
  71,
  72,
  76,
  79,

  80,
  81,
  82,
  89,

  90,
  91,
  95,
  99,

  100,
  101,
  200,
  201,
  999,

  1000,
  2025,
  9999

];

// ==========================================
// Difficulty Pools
// Used by quiz.js
// ==========================================

const QUIZ_POOLS = {

  easy: Array.from({ length: 21 }, (_, i) => i),

  medium: Array.from({ length: 49 }, (_, i) => i + 21),

  hard: Array.from({ length: 30 }, (_, i) => i + 70),

  expert: Array.from({ length: 500 }, (_, i) => i)

};