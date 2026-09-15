// ==========================================
// BoliForge Audio Engine
// Premium French Speech System
// Uses Browser SpeechSynthesis
// ==========================================

const AudioEngine = (() => {

  let voices = [];
  let frenchVoice = null;
  let isReady = false;

  const settings = {
    rate: 0.88,     // Slightly slower for learners
    pitch: 1,
    volume: 1
  };

  // ----------------------------------------
  // Load voices
  // ----------------------------------------

  function loadVoices() {

    voices = window.speechSynthesis.getVoices();

    if (!voices.length) return;

    // Prefer France French first
    frenchVoice =
      voices.find(v => v.lang === "fr-FR") ||

      // Then Canadian French
      voices.find(v => v.lang === "fr-CA") ||

      // Any French voice
      voices.find(v => v.lang.startsWith("fr")) ||

      null;

    isReady = true;

    console.log(
      frenchVoice
        ? `🇫🇷 Voice: ${frenchVoice.name}`
        : "⚠ No French voice installed."
    );
  }

  // Chrome loads voices asynchronously
  loadVoices();

  window.speechSynthesis.onvoiceschanged = loadVoices;

  // ----------------------------------------
  // Speak
  // ----------------------------------------

  function speak(text, rate = settings.rate) {

    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = frenchVoice?.lang || "fr-FR";
    utterance.voice = frenchVoice || null;

    utterance.rate = rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    window.speechSynthesis.speak(utterance);

    animateSpeaking();

  }

  // ----------------------------------------
  // Playback Helpers
  // ----------------------------------------

  function slow(text) {
    speak(text, 0.72);
  }

  function normal(text) {
    speak(text, 0.88);
  }

  function fast(text) {
    speak(text, 1.08);
  }

  function stop() {
    window.speechSynthesis.cancel();
  }

  // ----------------------------------------
  // UI Animation
  // ----------------------------------------

  function animateSpeaking() {

    const buttons = document.querySelectorAll(".audio-btn");

    buttons.forEach(btn => {

      btn.classList.add("speaking");

      setTimeout(() => {
        btn.classList.remove("speaking");
      }, 900);

    });

  }

  // ----------------------------------------
  // Voice Info
  // ----------------------------------------

  function getVoiceInfo() {

    if (!isReady || !frenchVoice) {

      return {
        name: "No French voice",
        lang: "Unavailable"
      };

    }

    return {
      name: frenchVoice.name,
      lang: frenchVoice.lang
    };

  }

  return {

    speak,
    slow,
    normal,
    fast,
    stop,
    getVoiceInfo

  };

})();

// ==========================================
// Global Helper
// Keeps compatibility with numbers.js
// ==========================================

function speakFrench(text) {
  AudioEngine.normal(text);
}

// ==========================================
// Keyboard Shortcut
// ESC stops speech instantly
// ==========================================

document.addEventListener("keydown", e => {

  if (e.key === "Escape") {
    AudioEngine.stop();
  }

});