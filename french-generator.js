// BoliForge French Number Generator (0–9999)
function generateFrenchNumber(number) {
  number = Number(number);
  if (!Number.isInteger(number) || number < 0 || number > 9999) {
    return { value: number, written: "Invalid", ipa: "", english: "", literal: "" };
  }
  return { value: number, written: buildNumber(number), ipa: generateIPA(number), english: englishNumber(number), literal: literalBreakdown(number) };
}

function buildNumber(n) {
  if (Object.hasOwn(BASE_NUMBERS, n)) return BASE_NUMBERS[n];
  if (n < 100) return buildTwoDigits(n);
  if (n < 1000) return buildHundreds(n);
  return buildThousands(n);
}

function buildTwoDigits(n) {
  if (n <= 69) {
    const tens = Math.floor(n / 10) * 10;
    const unit = n % 10;
    return unit === 1 ? `${BASE_NUMBERS[tens]}-et-un` : `${BASE_NUMBERS[tens]}-${buildNumber(unit)}`;
  }
  if (n <= 79) return n === 71 ? "soixante-et-onze" : `soixante-${buildNumber(n - 60)}`;
  if (n === 80) return "quatre-vingts";
  return `quatre-vingt-${buildNumber(n - 80)}`;
}

function buildHundreds(n) {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds === 1) return remainder ? `cent ${buildNumber(remainder)}` : "cent";
  const word = `${buildNumber(hundreds)} cent`;
  return remainder ? `${word} ${buildNumber(remainder)}` : `${word}s`;
}

function buildThousands(n) {
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  const word = thousands === 1 ? "mille" : `${buildNumber(thousands)} mille`;
  return remainder ? `${word} ${buildNumber(remainder)}` : word;
}

function literalBreakdown(n) {
  if (n >= 70 && n <= 79) return `60 + ${n - 60}`;
  if (n === 80) return "4 × 20";
  if (n >= 81 && n <= 99) return `80 + ${n - 80}`;
  return "";
}

function englishNumber(n) {
  const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? `-${ones[n % 10]}` : ""}`;
  if (n < 1000) return `${ones[Math.floor(n / 100)]} hundred${n % 100 ? ` ${englishNumber(n % 100)}` : ""}`;
  return `${ones[Math.floor(n / 1000)]} thousand${n % 1000 ? ` ${englishNumber(n % 1000)}` : ""}`;
}

function generateIPA(n) {
  if (Object.hasOwn(BASE_IPA, n)) return BASE_IPA[n];
  return `/${buildNumber(n)}/`;
}
