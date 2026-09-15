// ==========================================
// BoliForge French Number Rules Database
// Single source of truth for grammar.
// ==========================================

const NUMBER_RULES = {

  unique_0_16: {
    id: "unique_0_16",
    title: "0–16 are unique words",
    category: "Basics",
    color: "blue",
    explanation:
      "The numbers from 0 to 16 each have their own word. They don't follow a reusable pattern.",
    examples: [
      ["7", "sept"],
      ["11", "onze"],
      ["16", "seize"]
    ]
  },

  teen_rule: {
    id: "teen_rule",
    title: "17–19 use dix-",
    category: "Basics",
    color: "blue",
    explanation:
      "17–19 are built by adding dix- before the second number.",
    examples: [
      ["17", "dix-sept"],
      ["18", "dix-huit"],
      ["19", "dix-neuf"]
    ]
  },

  tens_rule: {
    id: "tens_rule",
    title: "20–69 = Tens + Unit",
    category: "Pattern",
    color: "green",
    explanation:
      "After 20, French normally combines the tens word with the unit.",
    examples: [
      ["22", "vingt-deux"],
      ["34", "trente-quatre"],
      ["58", "cinquante-huit"]
    ]
  },

  et_un: {
    id: "et_un",
    title: "Use et before un",
    category: "Pattern",
    color: "green",
    explanation:
      "Numbers ending in 1 use et before un—except in the 80s and 90s.",
    examples: [
      ["21", "vingt-et-un"],
      ["31", "trente-et-un"],
      ["61", "soixante-et-un"]
    ]
  },

  seventy_rule: {
    id: "seventy_rule",
    title: "70 = 60 + 10",
    category: "Special",
    color: "orange",
    explanation:
      "French doesn't have a separate word for seventy. It builds it as sixty-ten.",
    examples: [
      ["70", "soixante-dix"],
      ["76", "soixante-seize"],
      ["79", "soixante-dix-neuf"]
    ]
  },

  seventy_one: {
    id: "seventy_one",
    title: "71 keeps et",
    category: "Special",
    color: "orange",
    explanation:
      "71 is the biggest exception in the system. It keeps et before onze.",
    examples: [
      ["71", "soixante-et-onze"]
    ]
  },

  eighty_rule: {
    id: "eighty_rule",
    title: "80 = Four twenties",
    category: "Special",
    color: "orange",
    explanation:
      "80 literally means four twenties.",
    examples: [
      ["80", "quatre-vingts"]
    ]
  },

  eighty_plural: {
    id: "eighty_plural",
    title: "80 loses its s",
    category: "Special",
    color: "orange",
    explanation:
      "Quatre-vingts only keeps the final s when it's exactly 80.",
    examples: [
      ["80", "quatre-vingts"],
      ["81", "quatre-vingt-un"],
      ["89", "quatre-vingt-neuf"]
    ]
  },

  ninety_rule: {
    id: "ninety_rule",
    title: "90 = 80 + 10",
    category: "Special",
    color: "orange",
    explanation:
      "Ninety continues the four-twenties system by adding ten.",
    examples: [
      ["90", "quatre-vingt-dix"],
      ["95", "quatre-vingt-quinze"],
      ["99", "quatre-vingt-dix-neuf"]
    ]
  },

  hundred_rule: {
    id: "hundred_rule",
    title: "cent only pluralizes when final",
    category: "Hundreds",
    color: "purple",
    explanation:
      "Cent gets an s only when it's multiplied and nothing follows.",
    examples: [
      ["100", "cent"],
      ["200", "deux cents"],
      ["201", "deux cent un"]
    ]
  },

  thousand_rule: {
    id: "thousand_rule",
    title: "mille never pluralizes",
    category: "Thousands",
    color: "purple",
    explanation:
      "Unlike cent, mille never takes an s.",
    examples: [
      ["1,000", "mille"],
      ["2,000", "deux mille"],
      ["10,000", "dix mille"]
    ]
  }

};

// ==========================================
// Returns the most relevant rule(s)
// for any French number.
// ==========================================

function getNumberRules(number){

  number = Number(number);

  const rules = [];

  if(number <= 16)
    rules.push(NUMBER_RULES.unique_0_16);

  else if(number <= 19)
    rules.push(NUMBER_RULES.teen_rule);

  if(number >= 20 && number <= 69)
    rules.push(NUMBER_RULES.tens_rule);

  if([21,31,41,51,61].includes(number))
    rules.push(NUMBER_RULES.et_un);

  if(number >= 70 && number <= 79)
    rules.push(NUMBER_RULES.seventy_rule);

  if(number === 71)
    rules.push(NUMBER_RULES.seventy_one);

  if(number === 80)
    rules.push(NUMBER_RULES.eighty_rule);

  if(number >= 80 && number <= 89)
    rules.push(NUMBER_RULES.eighty_plural);

  if(number >= 90 && number <= 99)
    rules.push(NUMBER_RULES.ninety_rule);

  if(number >= 100 && number < 1000)
    rules.push(NUMBER_RULES.hundred_rule);

  if(number >= 1000)
    rules.push(NUMBER_RULES.thousand_rule);

  return rules;

}

// ==========================================
// Helper for detail card
// ==========================================

function getPrimaryRule(number){

  const rules = getNumberRules(number);

  return rules.length ? rules[0] : null;

}