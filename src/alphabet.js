import { getAlphabet } from "./alphabet-data.js";
import {
  getLanguage,
  getLanguageList,
  isSupportedLanguage,
} from "./languages.js";

/* =====================================================
   DOM
===================================================== */

const grid = document.querySelector("#alphabetGrid");

const infoLetter = document.querySelector("#infoLetter");
const infoIPA = document.querySelector("#infoIPA");
const infoWord = document.querySelector("#infoWord");
const infoMode = document.querySelector("#infoMode");

const repeatBtn = document.querySelector("#repeatBtn");
const audioNote = document.querySelector("#audioNote");

const modeNames = document.querySelector("#modeNames");
const modeSounds = document.querySelector("#modeSounds");

const specialToggle = document.querySelector("#accentToggle");

const siteBrand = document.querySelector("#siteBrand");
const alphabetTitle = document.querySelector("#alphabetTitle");
const alphabetSubtitle = document.querySelector("#alphabetSubtitle");
const languageSelect = document.querySelector("#alphabetLanguageSelect");

/* =====================================================
   LANGUAGE
===================================================== */

const LANGUAGE_STORAGE_KEY = "selectedLanguage";

const params = new URLSearchParams(window.location.search);
const urlLanguage = params.get("lang");
const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

let currentLanguageCode = isSupportedLanguage(urlLanguage)
  ? urlLanguage
  : isSupportedLanguage(storedLanguage)
    ? storedLanguage
    : "fr";

let language = getLanguage(currentLanguageCode);
let alphabet = getAlphabet(currentLanguageCode);

/*
  Save the language immediately.

  This means visiting:
  /alphabet/?lang=de

  also makes German the selected language when the
  user returns to the main flashcard page.
*/
localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguageCode);

/* =====================================================
   STATE
===================================================== */

let mode = "names";
let showSpecialCharacters = false;

let unlocked = false;
let selectedVoice = null;

let selectedItem = alphabet[0];
let selectedVariant = alphabet[0].variants[0];

let currentSpeak = selectedItem.name;

/* =====================================================
   SPEECH SUPPORT
===================================================== */

const speechSupported =
  "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/* =====================================================
   VOICE
===================================================== */

function loadVoice() {
  if (!speechSupported) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  const wantedLocale = language.locale.toLowerCase();
  const wantedLanguage = language.code.toLowerCase();

  selectedVoice =
    voices.find((voice) => voice.lang.toLowerCase() === wantedLocale) ||
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(wantedLanguage),
    ) ||
    null;
}

if (speechSupported) {
  window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

  loadVoice();
} else {
  repeatBtn.disabled = true;

  audioNote.textContent = "Speech playback is not supported in this browser.";
}

/* =====================================================
   SPEECH TEXT
===================================================== */

function getSpeechText(item, variant) {
  if (mode === "names") {
    return variant.name || item.name;
  }

  return variant.speak || variant.word || item.name;
}

/* =====================================================
   SPEAK
===================================================== */

function speak(text) {
  if (!speechSupported || !unlocked || !text) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = language.locale;
  utterance.rate = 0.8;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/* =====================================================
   INFO CARD
===================================================== */

function updateInfo() {
  currentSpeak = getSpeechText(selectedItem, selectedVariant);

  infoLetter.textContent = selectedVariant.char;

  infoIPA.textContent = selectedVariant.ipa || "Pronunciation varies by word";

  infoWord.textContent = selectedVariant.word || "—";

  infoMode.textContent = mode === "names" ? "Letter name" : "Sound example";
}

/* =====================================================
   SELECT LETTER
===================================================== */

function selectLetter(item, variant, button, shouldSpeak = false) {
  document.querySelectorAll(".letter").forEach((letterButton) => {
    letterButton.classList.remove("active");
  });

  button.classList.add("active");

  selectedItem = item;
  selectedVariant = variant;

  updateInfo();

  if (shouldSpeak) {
    speak(currentSpeak);
  }
}

/* =====================================================
   BUILD GRID
===================================================== */

function buildGrid() {
  grid.innerHTML = "";

  alphabet.forEach((item) => {
    const variants = showSpecialCharacters ? item.variants : [item.variants[0]];

    variants.forEach((variant) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "letter";
      button.textContent = variant.char;

      button.setAttribute("aria-label", `Practice ${variant.char}`);

      /*
        Hover will only play audio after the user
        has clicked at least once.
      */
      button.addEventListener("mouseenter", () => {
        selectLetter(item, variant, button, true);
      });

      /*
        Keyboard users can move through letters
        without automatically playing audio.
      */
      button.addEventListener("focus", () => {
        selectLetter(item, variant, button, false);
      });

      /*
        First click unlocks browser speech.
      */
      button.addEventListener("click", () => {
        unlocked = true;

        selectLetter(item, variant, button, false);

        speak(currentSpeak);
      });

      grid.appendChild(button);
    });
  });

  /*
    Select the first letter after building/rebuilding.
  */
  const firstButton = grid.querySelector(".letter");

  if (firstButton && alphabet.length > 0) {
    selectedItem = alphabet[0];
    selectedVariant = alphabet[0].variants[0];

    firstButton.classList.add("active");

    updateInfo();
  }
}

/* =====================================================
   MODE BUTTON STATES
===================================================== */

function updateModeButtons() {
  const namesActive = mode === "names";

  modeNames.classList.toggle("active", namesActive);

  modeSounds.classList.toggle("active", !namesActive);

  modeNames.setAttribute("aria-pressed", String(namesActive));

  modeSounds.setAttribute("aria-pressed", String(!namesActive));

  updateInfo();
}

/* =====================================================
   LANGUAGE UI
===================================================== */

function renderLanguageUI() {
  document.title = `${language.name} Alphabet Lab`;

  siteBrand.textContent = `${language.flag} ${language.name} Learning`;

  alphabetTitle.textContent = `${language.flag} ${language.name} Alphabet Lab`;

  alphabetSubtitle.textContent = `Explore ${language.name} letters, special characters, example words and pronunciation.`;

  grid.setAttribute("aria-label", `${language.name} alphabet`);

  languageSelect.innerHTML = getLanguageList()
    .map(
      (item) => `
        <option
          value="${item.code}"
          ${item.code === currentLanguageCode ? "selected" : ""}
        >
          ${item.flag} ${item.name}
        </option>
      `,
    )
    .join("");
}

/* =====================================================
   LANGUAGE CHANGE
===================================================== */

languageSelect.addEventListener("change", (event) => {
  const newCode = event.target.value;

  if (!isSupportedLanguage(newCode) || newCode === currentLanguageCode) {
    return;
  }

  /*
      Stop whatever was being spoken in the
      previous language.
    */
  if (speechSupported) {
    window.speechSynthesis.cancel();
  }

  currentLanguageCode = newCode;

  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguageCode);

  language = getLanguage(currentLanguageCode);

  alphabet = getAlphabet(currentLanguageCode);

  selectedVoice = null;

  loadVoice();

  renderLanguageUI();
  buildGrid();

  /*
      Change:
      /alphabet/?lang=fr

      into:
      /alphabet/?lang=de

      without refreshing the page.
    */
  const url = new URL(window.location.href);

  url.searchParams.set("lang", currentLanguageCode);

  window.history.replaceState({}, "", url);
});

/* =====================================================
   REPEAT
===================================================== */

repeatBtn.addEventListener("click", () => {
  unlocked = true;

  speak(currentSpeak);
});

/* =====================================================
   LETTER NAMES MODE
===================================================== */

modeNames.addEventListener("click", () => {
  mode = "names";

  updateModeButtons();
});

/* =====================================================
   SOUNDS MODE
===================================================== */

modeSounds.addEventListener("click", () => {
  mode = "sounds";

  updateModeButtons();
});

/* =====================================================
   SPECIAL CHARACTERS
===================================================== */

specialToggle.addEventListener("click", () => {
  showSpecialCharacters = !showSpecialCharacters;

  specialToggle.textContent = showSpecialCharacters ? "ON" : "OFF";

  specialToggle.classList.toggle("active", showSpecialCharacters);

  specialToggle.setAttribute("aria-pressed", String(showSpecialCharacters));

  buildGrid();
});

/* =====================================================
   START
===================================================== */

renderLanguageUI();
updateModeButtons();
buildGrid();
