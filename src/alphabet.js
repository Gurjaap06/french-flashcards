import { alphabet } from "./alphabet-data.js";

const grid = document.querySelector("#alphabetGrid");

const infoLetter = document.querySelector("#infoLetter");
const infoIPA = document.querySelector("#infoIPA");
const infoWord = document.querySelector("#infoWord");
const infoMode = document.querySelector("#infoMode");

const repeatBtn = document.querySelector("#repeatBtn");
const audioNote = document.querySelector("#audioNote");

const modeNames = document.querySelector("#modeNames");
const modeSounds = document.querySelector("#modeSounds");

const accentToggle = document.querySelector("#accentToggle");

let mode = "names";
let accents = false;

let unlocked = false;

let frenchVoice = null;

let selectedItem = alphabet[0];
let selectedVariant = alphabet[0].variants[0];

let currentSpeak = selectedItem.name;

const speechSupported =
  "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/* =========================
   SPEECH
========================= */

function loadVoice() {
  if (!speechSupported) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  frenchVoice =
    voices.find((voice) => voice.lang.toLowerCase() === "fr-fr") ||
    voices.find((voice) => voice.lang.toLowerCase() === "fr-ca") ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("fr")) ||
    null;
}

if (speechSupported) {
  window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

  loadVoice();
} else {
  repeatBtn.disabled = true;

  audioNote.textContent = "Speech playback is not supported in this browser.";
}

/* =========================
   SPEECH TEXT
========================= */

function getSpeechText(item, variant) {
  if (mode === "names") {
    return item.name;
  }

  return variant.speak;
}

/* =========================
   SPEAK
========================= */

function speak(text) {
  if (!speechSupported || !unlocked || !text) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "fr-FR";

  utterance.rate = 0.8;

  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/* =========================
   INFO CARD
========================= */

function updateInfo() {
  currentSpeak = getSpeechText(selectedItem, selectedVariant);

  infoLetter.textContent = selectedVariant.char;

  infoIPA.textContent = selectedVariant.ipa || "Pronunciation varies by word";

  infoWord.textContent = selectedVariant.word || "—";

  infoMode.textContent = mode === "names" ? "Letter name" : "Sound example";
}

/* =========================
   SELECT LETTER
========================= */

function selectLetter(item, variant, button, shouldSpeak = false) {
  document.querySelectorAll(".letter").forEach((letter) => {
    letter.classList.remove("active");
  });

  button.classList.add("active");

  selectedItem = item;

  selectedVariant = variant;

  updateInfo();

  if (shouldSpeak) {
    speak(currentSpeak);
  }
}

/* =========================
   BUILD ALPHABET
========================= */

function buildGrid() {
  grid.innerHTML = "";

  alphabet.forEach((item) => {
    const variants = accents ? item.variants : [item.variants[0]];

    variants.forEach((variant) => {
      const button = document.createElement("button");

      button.type = "button";

      button.className = "letter";

      button.textContent = variant.char;

      button.setAttribute("aria-label", `Practice ${variant.char}`);

      /* Hover */

      button.addEventListener("mouseenter", () => {
        selectLetter(item, variant, button, true);
      });

      /* Keyboard focus */

      button.addEventListener("focus", () => {
        selectLetter(item, variant, button, false);
      });

      /* Click */

      button.addEventListener("click", () => {
        unlocked = true;

        selectLetter(item, variant, button, false);

        speak(currentSpeak);
      });

      grid.appendChild(button);
    });
  });

  /* Select A initially */

  const firstButton = grid.querySelector(".letter");

  if (firstButton) {
    selectedItem = alphabet[0];

    selectedVariant = alphabet[0].variants[0];

    firstButton.classList.add("active");

    updateInfo();
  }
}

/* =========================
   MODE BUTTON STATES
========================= */

function updateModeButtons() {
  const namesActive = mode === "names";

  modeNames.classList.toggle("active", namesActive);

  modeSounds.classList.toggle("active", !namesActive);

  modeNames.setAttribute("aria-pressed", String(namesActive));

  modeSounds.setAttribute("aria-pressed", String(!namesActive));

  updateInfo();
}

/* =========================
   REPEAT
========================= */

repeatBtn.addEventListener("click", () => {
  unlocked = true;

  speak(currentSpeak);
});

/* =========================
   LETTER NAMES MODE
========================= */

modeNames.addEventListener("click", () => {
  mode = "names";

  updateModeButtons();
});

/* =========================
   SOUNDS MODE
========================= */

modeSounds.addEventListener("click", () => {
  mode = "sounds";

  updateModeButtons();
});

/* =========================
   ACCENTS
========================= */

accentToggle.addEventListener("click", () => {
  accents = !accents;

  accentToggle.textContent = accents ? "ON" : "OFF";

  accentToggle.classList.toggle("active", accents);

  accentToggle.setAttribute("aria-pressed", String(accents));

  buildGrid();
});

/* =========================
   START
========================= */

updateModeButtons();

buildGrid();
