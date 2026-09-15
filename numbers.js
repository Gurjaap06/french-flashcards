// BoliForge Number Lab — main controller
document.addEventListener("DOMContentLoaded", () => {
  const state = { audioEnabled: true, selectedNumber: 17 };
  const numberGrid = document.getElementById("numberGrid");
  const numberCard = document.getElementById("numberCard");
  const builderInput = document.getElementById("builderInput");
  const builderResult = document.getElementById("builderResult");
  const weirdSlider = document.getElementById("weirdSlider");
  const weirdOutput = document.getElementById("weirdOutput");
  const audioToggle = document.getElementById("audioToggle");
  const modeSelect = document.getElementById("modeSelect");
  const rangeSelect = document.getElementById("rangeSelect");
  const quizContainer = document.getElementById("quizContainer");
  let quizInitialized = false;

  function createNumberGrid() {
    numberGrid.replaceChildren();
    for (let i = 0; i <= 20; i += 1) {
      const data = generateFrenchNumber(i);
      const button = document.createElement("button");
      button.className = "number-btn";
      button.classList.toggle("active", i === state.selectedNumber);
      button.innerHTML = `<div class="number-value">${i}</div><div class="number-word">${data.written}</div>`;
      button.addEventListener("click", () => {
        state.selectedNumber = i;
        createNumberGrid();
        if (state.audioEnabled) speakFrench(data.written);
      });
      numberGrid.append(button);
    }
    renderNumberCard(state.selectedNumber);
  }

  function renderNumberCard(number) {
    const data = generateFrenchNumber(number);
    const primaryRule = getPrimaryRule(number);
    numberCard.innerHTML = `<div class="big-number">${number}</div><div class="french-word">${data.written}</div><div class="ipa">${data.ipa}</div><div><strong>Meaning</strong><br>${data.english}</div><div><strong>Literal</strong><br>${data.literal || "Direct form"}</div>${primaryRule ? `<div class="rule-box ${primaryRule.color}"><div class="rule-header">${primaryRule.title}</div><p>${primaryRule.explanation}</p></div>` : ""}<button class="audio-btn" id="detailSpeak">🔊 Listen</button>`;
    document.getElementById("detailSpeak").addEventListener("click", () => speakFrench(data.written));
  }

  function updateBuilder() {
    let value = Number.parseInt(builderInput.value, 10);
    value = Number.isNaN(value) ? 0 : Math.min(9999, Math.max(0, value));
    builderInput.value = value;
    const data = generateFrenchNumber(value);
    builderResult.innerHTML = `<div class="builder-number">${value}</div><div class="builder-word">${data.written}</div><div class="builder-literal">${data.literal || "Direct form"}</div><button class="audio-btn" id="builderSpeakNow">🔊 Speak</button>`;
    document.getElementById("builderSpeakNow").addEventListener("click", () => speakFrench(data.written));
  }

  function updateWeirdSlider() {
    const data = generateFrenchNumber(Number(weirdSlider.value));
    weirdOutput.innerHTML = `<div class="builder-number">${data.value}</div><div class="builder-word">${data.written}</div><div class="builder-literal">${data.literal}</div>`;
  }

  function updateMode() {
    const isQuizMode = modeSelect.value === "quiz";
    quizContainer.closest("section").hidden = !isQuizMode;
    if (isQuizMode && !quizInitialized && typeof initQuiz === "function") {
      quizInitialized = true;
      initQuiz();
    }
  }
  function updateRange() {
    const [min, max] = rangeSelect.value === "100+" ? [100, 9999] : rangeSelect.value.split("-").map(Number);
    builderInput.min = min;
    builderInput.max = max;
    builderInput.value = Math.min(max, Math.max(min, Number(builderInput.value) || min));
    updateBuilder();
  }

  builderInput.addEventListener("input", updateBuilder);
  weirdSlider.addEventListener("input", updateWeirdSlider);
  audioToggle.addEventListener("click", () => {
    state.audioEnabled = !state.audioEnabled;
    audioToggle.textContent = state.audioEnabled ? "ON" : "OFF";
    audioToggle.classList.toggle("active", state.audioEnabled);
  });
  modeSelect.addEventListener("change", updateMode);
  rangeSelect.addEventListener("change", updateRange);
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      state.selectedNumber = Math.max(0, Math.min(20, state.selectedNumber + (event.key === "ArrowRight" ? 1 : -1)));
      createNumberGrid();
    }
    if (event.key === " ") {
      event.preventDefault();
      speakFrench(generateFrenchNumber(state.selectedNumber).written);
    }
  });

  createNumberGrid();
  updateRange();
  updateBuilder();
  updateWeirdSlider();
  updateMode();
});
