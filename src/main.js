import "./style.css";
import { supabase } from "./supabaseClient.js";
import {
  BASE_LANGUAGE,
  LANGUAGES,
  getLanguage,
  getLanguageList,
  isSupportedLanguage,
} from "./languages.js";

const app = document.querySelector("#app");

const LANGUAGE_STORAGE_KEY = "selectedLanguage";

let currentUser = null;
let privateCards = [];
let globalWords = [];
let lessons = [];
let lessonProgress = [];
let currentLesson = null;
let currentQuiz = null;
let activeView = "dashboard";

const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
let currentLanguageCode = isSupportedLanguage(storedLanguage)
  ? storedLanguage
  : null;

/* ------------------------------ Helpers ------------------------------ */

function getCurrentLanguage() {
  if (!isSupportedLanguage(currentLanguageCode)) {
    return null;
  }

  return getLanguage(currentLanguageCode);
}

function normalizeForSearch(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ß", "ss")
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae");
}

function normalizeForIdentity(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .normalize("NFC");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getStats(card) {
  const stats = card?.learning_stats;

  if (Array.isArray(stats)) {
    return stats[0] ?? null;
  }

  return stats ?? null;
}

function getWord(card) {
  return card?.global_words ?? card;
}

function calculateAccuracy(stats) {
  const total = stats?.total_reviews ?? 0;
  const correct = stats?.correct_reviews ?? 0;

  if (total === 0) return 0;

  return Math.round((correct / total) * 100);
}

function getLanguageProgress() {
  const totalWords = privateCards.length;

  const totalReviews = privateCards.reduce(
    (sum, card) => sum + (getStats(card)?.total_reviews ?? 0),
    0,
  );

  const correctReviews = privateCards.reduce(
    (sum, card) => sum + (getStats(card)?.correct_reviews ?? 0),
    0,
  );

  const mastered = privateCards.filter(
    (card) => getStats(card)?.status === "MASTERED",
  ).length;

  const now = new Date();

  const due = privateCards.filter((card) => {
    const stats = getStats(card);

    if (!stats?.next_review) {
      return true;
    }

    return new Date(stats.next_review) <= now;
  }).length;

  const accuracy =
    totalReviews === 0 ? 0 : Math.round((correctReviews / totalReviews) * 100);

  return {
    totalWords,
    totalReviews,
    correctReviews,
    mastered,
    due,
    accuracy,
  };
}

function showError(error, fallback = "Something went wrong.") {
  console.error(error);
  alert(error?.message || fallback);
}

/* ------------------------------ Authentication ------------------------------ */

function renderAuth() {
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-mark">Aa</div>
        <h1>Language Flashcards</h1>
        <p class="muted">
          Learn vocabulary, review with quizzes, and track your progress.
        </p>

        <form id="auth-form" class="auth-form">
          <label>
            Email
            <input
              id="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              minlength="6"
              required
              placeholder="Minimum 6 characters"
            />
          </label>

          <div class="button-row">
            <button class="primary" type="submit" data-action="login">
              Log in
            </button>

            <button type="submit" data-action="signup">
              Sign up
            </button>
          </div>
        </form>
      </section>
    </main>
  `;

  document.querySelector("#auth-form").addEventListener("submit", handleAuth);
}

async function handleAuth(event) {
  event.preventDefault();

  const action = event.submitter?.dataset.action;
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  if (action === "signup") {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      showError(error);
      return;
    }

    alert(
      "Account created. Check your email if your Supabase project requires email confirmation.",
    );

    return;
  }

  if (action === "login") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(error);
      return;
    }

    await startApp();
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    showError(error);
    return;
  }

  currentUser = null;
  privateCards = [];
  globalWords = [];
  lessons = [];
  lessonProgress = [];
  currentLesson = null;
  currentQuiz = null;
  activeView = "dashboard";

  renderAuth();
}

/* ------------------------------ App shell ------------------------------ */

function renderLanguageHome() {
  const languages = getLanguageList();

  app.innerHTML = `
    <main class="language-home">
      <header class="language-home-header">
        <div>
          <div class="eyebrow">Language learning</div>
          <h1>Choose a language</h1>
          <p class="muted">
            Select the language you want to learn.
          </p>
        </div>

        <div class="header-actions">
          <span class="user-email muted">
            ${escapeHtml(currentUser?.email ?? "")}
          </span>

          <button id="home-logout" type="button">
            Log out
          </button>
        </div>
      </header>

      <section class="language-grid">
        ${languages
          .map(
            (language) => `
              <button
                type="button"
                class="language-card ${
                  language.code === currentLanguageCode ? "selected" : ""
                }"
                data-language="${escapeHtml(language.code)}"
              >
                <span class="language-card-flag">
                  ${language.flag}
                </span>

                <div>
                  <h2>${escapeHtml(language.name)}</h2>

                  <p>
                    Learn vocabulary, practice pronunciation,
                    review flashcards, and track your progress.
                  </p>
                </div>

                <span class="language-card-action">
                  ${
                    language.code === currentLanguageCode
                      ? "Continue learning →"
                      : `Learn ${escapeHtml(language.name)} →`
                  }
                </span>
              </button>
            `,
          )
          .join("")}
      </section>
    </main>
  `;

  document.querySelector("#home-logout").addEventListener("click", logout);

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      selectLanguage(button.dataset.language);
    });
  });
}

async function selectLanguage(code) {
  if (!isSupportedLanguage(code)) {
    return;
  }

  currentLanguageCode = code;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguageCode);

  activeView = "dashboard";
  currentQuiz = null;
  currentLesson = null;

  await refreshData();
  renderApp();
}

function renderApp() {
  const language = getCurrentLanguage();

  if (!language) {
    renderLanguageHome();
    return;
  }

  app.innerHTML = `
    <header class="app-header">
      <div>
        <div class="eyebrow">
          ${escapeHtml(language.name)} course
        </div>

        <h1>
          ${language.flag}
          ${escapeHtml(language.name)} Learning
        </h1>

        <p class="muted">
          Learn vocabulary, practice, and track your progress.
        </p>
      </div>

      <div class="header-actions">
        <button id="all-languages" type="button">
          All Languages
        </button>

        <span class="user-email muted">
          ${escapeHtml(currentUser.email)}
        </span>

        <button id="logout" type="button">
          Log out
        </button>
      </div>
    </header>

    <nav class="tabs" aria-label="Main navigation">
      <button class="tab" data-view="dashboard">
        Dashboard
      </button>

      <button class="tab" data-view="lessons">
        Lessons
      </button>

      <button class="tab" data-view="private">
        My Flashcards
      </button>

      <button class="tab" data-view="global">
        Vocabulary
      </button>

      <button class="tab" data-view="add">
        Add Word
      </button>

      <button class="tab" data-view="quiz">
        Quiz
      </button>

      <button class="tab" data-view="stats">
        Stats
      </button>

      <button class="tab" data-view="alphabet">
        Alphabet
      </button>
    </nav>

    <main class="app-main">
      <section id="dashboard" class="view"></section>
      <section id="lessons" class="view"></section>
      <section id="lesson-detail" class="view"></section>
      <section id="private" class="view"></section>
      <section id="global" class="view"></section>
      <section id="add" class="view"></section>
      <section id="quiz" class="view"></section>
      <section id="stats" class="view"></section>
    </main>
  `;

  document.querySelector("#logout").addEventListener("click", logout);

  document
    .querySelector("#all-languages")
    .addEventListener("click", renderLanguageHome);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchView(tab.dataset.view);
    });
  });

  renderDashboardView();
  renderLessonsView();

  if (currentLesson) {
    renderLessonDetail();
  }

  renderPrivateView();
  renderGlobalView();
  renderAddView();
  renderQuizView();
  renderStatsView();

  switchView(activeView);
}

function renderDashboardView() {
  const section = document.querySelector("#dashboard");

  if (!section) {
    return;
  }

  const language = getCurrentLanguage();

  if (!language) {
    return;
  }

  const { totalWords, mastered, due, accuracy } = getLanguageProgress();

  const completedLessons = lessons.filter((lesson) => {
    return lessonProgress.some(
      (progress) =>
        progress.lesson_id === lesson.id && progress.status === "completed",
    );
  }).length;

  section.innerHTML = `
    <div class="dashboard-hero">
      <div>
        <div class="eyebrow">
          Continue learning
        </div>

        <h2>
          ${language.flag}
          ${escapeHtml(language.name)}
        </h2>

        <p class="muted">
          Choose what you want to practice today.
        </p>
      </div>

      <button
        class="primary"
        type="button"
        data-dashboard-view="quiz"
      >
        Start Review
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <span>Words</span>
        <strong>${totalWords}</strong>
      </div>

      <div class="stat">
        <span>Due today</span>
        <strong>${due}</strong>
      </div>

      <div class="stat">
        <span>Mastered</span>
        <strong>${mastered}</strong>
      </div>

      <div class="stat">
        <span>Accuracy</span>
        <strong>${accuracy}%</strong>
      </div>
    </div>

    <div class="dashboard-grid">
      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="lessons"
      >
        <span class="dashboard-card-icon">01</span>

        <div>
          <h3>Lessons</h3>

          <p>
            Learn ${escapeHtml(language.name)} through structured beginner
            lessons. ${completedLessons}/${lessons.length} completed.
          </p>
        </div>

        <span class="dashboard-card-link">
          Start learning →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="private"
      >
        <span class="dashboard-card-icon">Aa</span>

        <div>
          <h3>My Flashcards</h3>

          <p>
            Review the ${totalWords} words currently
            in your ${escapeHtml(language.name)} collection.
          </p>
        </div>

        <span class="dashboard-card-link">
          Open flashcards →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="alphabet"
      >
        <span class="dashboard-card-icon">ABC</span>

        <div>
          <h3>Alphabet Lab</h3>

          <p>
            Practice letters, sounds, and pronunciation.
          </p>
        </div>

        <span class="dashboard-card-link">
          Practice alphabet →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="global"
      >
        <span class="dashboard-card-icon">W</span>

        <div>
          <h3>Vocabulary Library</h3>

          <p>
            Browse ${globalWords.length} shared
            ${escapeHtml(language.name)} words.
          </p>
        </div>

        <span class="dashboard-card-link">
          Browse vocabulary →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="quiz"
      >
        <span class="dashboard-card-icon">?</span>

        <div>
          <h3>Quiz</h3>

          <p>
            Test yourself with your saved vocabulary.
            ${due} ${due === 1 ? "word is" : "words are"} due.
          </p>
        </div>

        <span class="dashboard-card-link">
          Start quiz →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="add"
      >
        <span class="dashboard-card-icon">+</span>

        <div>
          <h3>Add Vocabulary</h3>

          <p>
            Add another ${escapeHtml(language.name)}
            word to your collection.
          </p>
        </div>

        <span class="dashboard-card-link">
          Add a word →
        </span>
      </button>

      <button
        class="dashboard-card"
        type="button"
        data-dashboard-view="stats"
      >
        <span class="dashboard-card-icon">%</span>

        <div>
          <h3>Progress</h3>

          <p>
            See your mastery, accuracy,
            reviews, and learning stats.
          </p>
        </div>

        <span class="dashboard-card-link">
          View progress →
        </span>
      </button>
    </div>
  `;

  section.querySelectorAll("[data-dashboard-view]").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.dashboardView);
    });
  });
}

function switchView(viewId) {
  /*
    Alphabet Lab is a separate Vite page,
    so navigate there instead of switching
    one of the main app views.
  */
  if (viewId === "alphabet") {
    window.location.href = `/alphabet/?lang=${currentLanguageCode}`;
    return;
  }

  activeView = viewId;

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewId);
  });

  if (viewId === "dashboard") {
    renderDashboardView();
  }

  if (viewId === "lessons") {
    renderLessonsView();
  }

  if (viewId === "lesson-detail") {
    renderLessonDetail();
  }

  if (viewId === "quiz") {
    renderQuizView();
  }

  if (viewId === "stats") {
    renderStatsView();
  }
}

/* ------------------------------ Data loading ------------------------------ */

async function loadPrivateCards() {
  const { data, error } = await supabase
    .from("user_flashcards")
    .select(
      `
        id,
        user_id,
        favorite,
        notes,
        created_at,
        global_words!inner (
          id,
          language_code,
          target_word,
          translation,
          normalized_target_word,
          normalized_translation,
          example,
          category,
          gender,
          difficulty
        ),
        learning_stats (
          total_reviews,
          correct_reviews,
          wrong_reviews,
          current_streak,
          longest_streak,
          review_stage,
          status,
          last_review,
          next_review
        )
      `,
    )
    .eq("user_id", currentUser.id)
    .eq("global_words.language_code", currentLanguageCode)
    .order("created_at", { ascending: false });

  if (error) {
    showError(error);
    privateCards = [];
    return;
  }

  privateCards = data ?? [];
}

async function loadGlobalWords() {
  const { data, error } = await supabase
    .from("global_words")
    .select("*")
    .eq("language_code", currentLanguageCode)
    .order("created_at", { ascending: false });

  if (error) {
    showError(error);
    globalWords = [];
    return;
  }

  globalWords = data ?? [];
}

async function loadLessons() {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("language_code", currentLanguageCode)
    .eq("published", true)
    .order("order_index", { ascending: true });

  if (error) {
    showError(error);
    lessons = [];
    return;
  }

  lessons = data ?? [];
}

async function loadLessonProgress() {
  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("*")
    .eq("user_id", currentUser.id);

  if (error) {
    showError(error);
    lessonProgress = [];
    return;
  }

  lessonProgress = data ?? [];
}

async function refreshData() {
  await Promise.all([
    loadPrivateCards(),
    loadGlobalWords(),
    loadLessons(),
    loadLessonProgress(),
  ]);
}

/* ------------------------------ Lessons ------------------------------ */

function getLessonProgress(lessonId) {
  return (
    lessonProgress.find((progress) => progress.lesson_id === lessonId) ?? null
  );
}

function formatLessonStatus(status) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In progress";
  }

  return "Not started";
}

function renderLessonsView() {
  const section = document.querySelector("#lessons");

  if (!section) {
    return;
  }

  const language = getCurrentLanguage();

  if (!language) {
    return;
  }

  if (lessons.length === 0) {
    section.innerHTML = `
      <div class="page-heading">
        <div class="eyebrow">
          ${escapeHtml(language.name)} course
        </div>

        <h2>
          ${language.flag}
          ${escapeHtml(language.name)} Lessons
        </h2>

        <p class="muted">
          Learn ${escapeHtml(language.name)} step by step.
        </p>
      </div>

      <div class="empty-state">
        <h3>No lessons yet</h3>

        <p>
          Lessons have not been added for
          ${escapeHtml(language.name)} yet.
        </p>
      </div>
    `;

    return;
  }

  section.innerHTML = `
    <div class="page-heading">
      <div class="eyebrow">
        ${escapeHtml(language.name)} course
      </div>

      <h2>
        ${language.flag}
        ${escapeHtml(language.name)} Lessons
      </h2>

      <p class="muted">
        Learn ${escapeHtml(language.name)} step by step.
      </p>
    </div>

    <div class="lesson-grid">
      ${lessons
        .map((lesson) => {
          const progress = getLessonProgress(lesson.id);
          const status = progress?.status ?? "not_started";
          const completed = status === "completed";

          return `
            <article class="lesson-card ${completed ? "completed" : ""}">
              <div class="lesson-card-top">
                <span class="lesson-number">
                  Lesson ${lesson.order_index}
                </span>

                ${
                  completed
                    ? `
                      <span class="lesson-completed">
                        ✓ Completed
                      </span>
                    `
                    : ""
                }
              </div>

              <h3>${escapeHtml(lesson.title)}</h3>

              <p class="muted">
                ${escapeHtml(lesson.description)}
              </p>

              <div class="pills">
                <span>${escapeHtml(lesson.level)}</span>
                <span>${escapeHtml(formatLessonStatus(status))}</span>
              </div>

              <button
                class="primary"
                type="button"
                data-open-lesson="${lesson.id}"
              >
                ${
                  completed
                    ? "Review Lesson"
                    : status === "in_progress"
                      ? "Continue Lesson"
                      : "Start Lesson"
                }
              </button>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  section.querySelectorAll("[data-open-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      openLesson(button.dataset.openLesson);
    });
  });
}

async function openLesson(lessonId) {
  const lesson = lessons.find((item) => item.id === lessonId);

  if (!lesson) {
    return;
  }

  const { data, error } = await supabase
    .from("lesson_words")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });

  if (error) {
    showError(error);
    return;
  }

  currentLesson = {
    ...lesson,
    words: data ?? [],
  };

  await markLessonStarted(lessonId);
  switchView("lesson-detail");
}

async function markLessonStarted(lessonId) {
  const existing = getLessonProgress(lessonId);

  if (existing?.status === "completed") {
    return;
  }

  const { error } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: currentUser.id,
      lesson_id: lessonId,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,lesson_id",
    },
  );

  if (error) {
    showError(error);
    return;
  }

  await loadLessonProgress();
}

function renderLessonContentBlock(block) {
  if (block?.type === "example") {
    return `
      <div class="lesson-example">
        <strong>${escapeHtml(block.target)}</strong>
        <span>${escapeHtml(block.translation)}</span>
      </div>
    `;
  }

  if (block?.type === "text") {
    return `
      <div class="lesson-text-block">
        ${
          block.title
            ? `
              <h3>${escapeHtml(block.title)}</h3>
            `
            : ""
        }

        <p>${escapeHtml(block.body)}</p>
      </div>
    `;
  }

  return "";
}

function findGlobalWordForLessonWord(lessonWord) {
  const target = normalizeForIdentity(lessonWord.target_word);
  const translation = normalizeForIdentity(lessonWord.translation);

  return globalWords.find(
    (word) =>
      word.normalized_target_word === target &&
      word.normalized_translation === translation,
  );
}

function isLessonWordSaved(lessonWord) {
  const globalWord = findGlobalWordForLessonWord(lessonWord);

  if (!globalWord) {
    return false;
  }

  return privateCards.some((card) => card.global_words?.id === globalWord.id);
}

function renderLessonDetail() {
  const section = document.querySelector("#lesson-detail");

  if (!section || !currentLesson) {
    return;
  }

  const language = getCurrentLanguage();
  const content = Array.isArray(currentLesson.content)
    ? currentLesson.content
    : [];
  const progress = getLessonProgress(currentLesson.id);
  const completed = progress?.status === "completed";

  section.innerHTML = `
    <button
      id="back-to-lessons"
      type="button"
      class="lesson-back"
    >
      ← Back to Lessons
    </button>

    <div class="lesson-detail-header">
      <div class="eyebrow">
        ${escapeHtml(language.name)} · Lesson ${currentLesson.order_index}
      </div>

      <h2>${escapeHtml(currentLesson.title)}</h2>

      <p class="muted">
        ${escapeHtml(currentLesson.description)}
      </p>

      <div class="pills">
        <span>${escapeHtml(currentLesson.level)}</span>
        ${completed ? "<span>✓ Completed</span>" : ""}
      </div>
    </div>

    <section class="lesson-section">
      <div class="lesson-section-heading">
        <span class="lesson-step">1</span>

        <div>
          <h3>Learn</h3>
          <p class="muted">Read the explanation and examples.</p>
        </div>
      </div>

      <div class="lesson-content">
        ${content.map(renderLessonContentBlock).join("")}
      </div>
    </section>

    <section class="lesson-section">
      <div class="lesson-section-heading">
        <span class="lesson-step">2</span>

        <div>
          <h3>Vocabulary</h3>
          <p class="muted">Add useful words to your flashcards.</p>
        </div>
      </div>

      <div class="lesson-word-list">
        ${currentLesson.words
          .map((word) => {
            const saved = isLessonWordSaved(word);

            return `
              <div class="lesson-word">
                <div>
                  <strong>${escapeHtml(word.target_word)}</strong>
                  <span>${escapeHtml(word.translation)}</span>
                  ${
                    word.example
                      ? `<small>${escapeHtml(word.example)}</small>`
                      : ""
                  }
                </div>

                <button
                  type="button"
                  data-add-lesson-word="${word.id}"
                  ${saved ? "disabled" : ""}
                >
                  ${saved ? "Added ✓" : "Add to Flashcards"}
                </button>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>

    <section class="lesson-section">
      <div class="lesson-section-heading">
        <span class="lesson-step">3</span>

        <div>
          <h3>Finish</h3>
          <p class="muted">Mark the lesson complete when you're finished.</p>
        </div>
      </div>

      <button
        id="complete-lesson"
        class="primary"
        type="button"
        ${completed ? "disabled" : ""}
      >
        ${completed ? "Lesson Completed ✓" : "Complete Lesson"}
      </button>
    </section>
  `;

  document.querySelector("#back-to-lessons").addEventListener("click", () => {
    currentLesson = null;
    switchView("lessons");
  });

  section.querySelectorAll("[data-add-lesson-word]").forEach((button) => {
    button.addEventListener("click", () => {
      addLessonWordToMine(button.dataset.addLessonWord);
    });
  });

  document.querySelector("#complete-lesson").addEventListener("click", () => {
    completeLesson(currentLesson.id);
  });
}

async function addLessonWordToMine(lessonWordId) {
  if (!currentLesson) {
    return;
  }

  const lessonWord = currentLesson.words.find(
    (word) => word.id === lessonWordId,
  );

  if (!lessonWord) {
    return;
  }

  if (isLessonWordSaved(lessonWord)) {
    return;
  }

  const newWord = {
    language_code: currentLanguageCode,
    target_word: lessonWord.target_word,
    translation: lessonWord.translation,
    example: lessonWord.example ?? "",
    category: lessonWord.category ?? "lesson",
    gender: lessonWord.gender ?? "none",
    difficulty: lessonWord.difficulty ?? 1,
    normalized_target_word: normalizeForIdentity(lessonWord.target_word),
    normalized_translation: normalizeForIdentity(lessonWord.translation),
    created_by: currentUser.id,
  };

  const globalWord = await findOrCreateGlobalWord(newWord);

  if (!globalWord) {
    return;
  }

  const added = await addGlobalWordToMine(globalWord.id, {
    refreshViews: false,
  });

  if (!added) {
    return;
  }

  await refreshData();
  renderLessonDetail();
  renderDashboardView();
}

async function completeLesson(lessonId) {
  const { error } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: currentUser.id,
      lesson_id: lessonId,
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,lesson_id",
    },
  );

  if (error) {
    showError(error);
    return;
  }

  await loadLessonProgress();
  currentLesson = null;
  switchView("lessons");
  renderDashboardView();
}

/* ------------------------------ Private cards ------------------------------ */

function renderPrivateView() {
  const section = document.querySelector("#private");

  if (!section) return;

  const language = getCurrentLanguage();

  if (privateCards.length === 0) {
    section.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>My ${escapeHtml(language.name)} Flashcards</h2>
          <p class="muted">0 private cards</p>
        </div>
      </div>

      <div class="empty-state">
        <h3>No ${escapeHtml(language.name)} flashcards yet</h3>
        <p>
          Add a new word or copy one from the ${escapeHtml(language.name)}
          global library.
        </p>
        <button class="primary" id="empty-add-word">Add a word</button>
      </div>
    `;

    document
      .querySelector("#empty-add-word")
      .addEventListener("click", () => switchView("add"));

    return;
  }

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>My ${escapeHtml(language.name)} Flashcards</h2>
        <p class="muted">${privateCards.length} private cards</p>
      </div>

      <input
        id="private-search"
        type="search"
        placeholder="Search my ${escapeHtml(language.name)} flashcards..."
      />
    </div>

    <div id="private-list" class="card-grid"></div>
  `;

  document
    .querySelector("#private-search")
    .addEventListener("input", renderPrivateList);

  renderPrivateList();
}

function renderPrivateList() {
  const list = document.querySelector("#private-list");

  if (!list) return;

  const search = normalizeForSearch(
    document.querySelector("#private-search")?.value ?? "",
  );

  const filtered = privateCards.filter((card) => {
    const word = getWord(card);
    const stats = getStats(card);

    const searchableText = normalizeForSearch(
      [
        word.target_word,
        word.translation,
        word.example,
        word.category,
        word.gender,
        stats?.status,
      ].join(" "),
    );

    return searchableText.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state compact">
        <p>No matching flashcards found.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered
    .map((card) => {
      const word = getWord(card);
      const stats = getStats(card);
      const totalReviews = stats?.total_reviews ?? 0;
      const accuracy = calculateAccuracy(stats);

      return `
        <article class="word-card">
          <div class="card-top">
            <div>
              <h3>${escapeHtml(word.target_word)}</h3>
              <p class="translation">${escapeHtml(word.translation)}</p>
            </div>

            <button
              type="button"
              class="favorite-button ${card.favorite ? "favorite" : ""}"
              data-favorite="${card.id}"
              aria-label="Toggle favorite"
              title="Toggle favorite"
            >
              ★
            </button>
          </div>

          <p class="muted example">
            ${escapeHtml(word.example || "No example sentence.")}
          </p>

          <div class="pills">
            <span>${escapeHtml(word.category || "general")}</span>
            <span>${escapeHtml(word.gender || "none")}</span>
            <span>difficulty ${word.difficulty || 1}</span>
            <span>${escapeHtml(stats?.status || "NEW")}</span>
          </div>

          <p class="small">
            Reviews: ${totalReviews}
            <span class="separator">•</span>
            Accuracy: ${accuracy}%
            <span class="separator">•</span>
            Streak: ${stats?.current_streak ?? 0}
          </p>

          <button
            type="button"
            data-delete="${card.id}"
            class="danger ghost-danger"
          >
            Remove from my cards
          </button>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleFavorite(button.dataset.favorite);
    });
  });

  list.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deletePrivateCard(button.dataset.delete);
    });
  });
}

/* ------------------------------ Global library ------------------------------ */

function renderGlobalView() {
  const section = document.querySelector("#global");

  if (!section) return;

  const language = getCurrentLanguage();

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>${escapeHtml(language.name)} Global Library</h2>
        <p class="muted">
          ${globalWords.length} shared ${escapeHtml(language.name)} words
        </p>
      </div>

      <input
        id="global-search"
        type="search"
        placeholder="Search ${escapeHtml(language.name)} library..."
      />
    </div>

    <div id="global-list" class="card-grid"></div>
  `;

  document
    .querySelector("#global-search")
    .addEventListener("input", renderGlobalList);

  renderGlobalList();
}

function renderGlobalList() {
  const list = document.querySelector("#global-list");

  if (!list) return;

  const search = normalizeForSearch(
    document.querySelector("#global-search")?.value ?? "",
  );

  const myGlobalIds = new Set(
    privateCards.map((card) => card.global_words?.id).filter(Boolean),
  );

  const filtered = globalWords.filter((word) => {
    const searchableText = normalizeForSearch(
      [
        word.target_word,
        word.translation,
        word.example,
        word.category,
        word.gender,
      ].join(" "),
    );

    return searchableText.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state compact">
        <p>No shared words found for this search.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered
    .map((word) => {
      const alreadyMine = myGlobalIds.has(word.id);

      return `
        <article class="word-card">
          <h3>${escapeHtml(word.target_word)}</h3>
          <p class="translation">${escapeHtml(word.translation)}</p>

          <p class="muted example">
            ${escapeHtml(word.example || "No example sentence.")}
          </p>

          <div class="pills">
            <span>${escapeHtml(word.category || "general")}</span>
            <span>${escapeHtml(word.gender || "none")}</span>
            <span>difficulty ${word.difficulty || 1}</span>
          </div>

          <button
            type="button"
            data-add-global="${word.id}"
            ${alreadyMine ? "disabled" : ""}
          >
            ${alreadyMine ? "Already in my cards" : "Add to my cards"}
          </button>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-add-global]").forEach((button) => {
    button.addEventListener("click", () => {
      addGlobalWordToMine(button.dataset.addGlobal);
    });
  });
}

/* ------------------------------ Add words ------------------------------ */

function renderAddView() {
  const section = document.querySelector("#add");

  if (!section) return;

  const language = getCurrentLanguage();

  const genderOptions = language.genders
    .map(
      (gender) => `
        <option value="${escapeHtml(gender.value)}">
          ${escapeHtml(gender.label)}
        </option>
      `,
    )
    .join("");

  section.innerHTML = `
    <div class="page-heading">
      <h2>Add ${escapeHtml(language.name)} Word</h2>
      <p class="muted">
        The word is added to your private cards and the shared
        ${escapeHtml(language.name)} library.
      </p>
    </div>

    <form id="add-form" class="form-grid">
      <label>
        ${escapeHtml(language.wordLabel)}
        <input
          name="target_word"
          required
          maxlength="150"
          placeholder="${escapeHtml(language.wordPlaceholder)}"
        />
      </label>

      <label>
        English meaning
        <input
          name="translation"
          required
          maxlength="150"
          placeholder="ex: apple"
        />
      </label>

      <label>
        Category
        <input
          name="category"
          maxlength="80"
          placeholder="ex: food, travel, school"
        />
      </label>

      <label>
        Gender
        <select name="gender">
          ${genderOptions}
        </select>
      </label>

      <label>
        Difficulty
        <input
          name="difficulty"
          type="number"
          min="1"
          max="5"
          value="1"
          required
        />
      </label>

      <label class="full">
        Example sentence
        <input
          name="example"
          maxlength="300"
          placeholder="${escapeHtml(language.examplePlaceholder)}"
        />
      </label>

      <button class="primary" type="submit">
        Add ${escapeHtml(language.name)} word
      </button>
    </form>
  `;

  document.querySelector("#add-form").addEventListener("submit", handleAddWord);
}

async function handleAddWord(event) {
  event.preventDefault();

  const form = new FormData(event.target);

  const targetWord = String(form.get("target_word") ?? "").trim();
  const translation = String(form.get("translation") ?? "").trim();
  const example = String(form.get("example") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const gender = String(form.get("gender") ?? "none");
  const difficulty = Number(form.get("difficulty"));

  if (!targetWord || !translation) {
    alert("Enter both the word and its English meaning.");
    return;
  }

  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    alert("Difficulty must be a whole number from 1 to 5.");
    return;
  }

  const allowedGenders = new Set(
    getCurrentLanguage().genders.map((item) => item.value),
  );

  if (!allowedGenders.has(gender)) {
    alert("Choose a valid gender.");
    return;
  }

  const newWord = {
    language_code: currentLanguageCode,
    target_word: targetWord,
    translation,
    example,
    category,
    gender,
    difficulty,
    normalized_target_word: normalizeForIdentity(targetWord),
    normalized_translation: normalizeForIdentity(translation),
    created_by: currentUser.id,
  };

  const globalWord = await findOrCreateGlobalWord(newWord);

  if (!globalWord) return;

  const added = await addGlobalWordToMine(globalWord.id, {
    refreshViews: false,
  });

  if (!added) return;

  event.target.reset();

  await refreshData();
  activeView = "private";
  renderApp();
}

async function findOrCreateGlobalWord(word) {
  const { data: existingWord, error: existingError } = await supabase
    .from("global_words")
    .select("*")
    .eq("language_code", word.language_code)
    .eq("normalized_target_word", word.normalized_target_word)
    .eq("normalized_translation", word.normalized_translation)
    .maybeSingle();

  if (existingError) {
    showError(existingError);
    return null;
  }

  if (existingWord) {
    return existingWord;
  }

  const { data, error } = await supabase
    .from("global_words")
    .insert(word)
    .select()
    .single();

  if (!error) {
    return data;
  }

  // A second user may have inserted the same word at the same time.
  // If the unique index rejected this insert, fetch the existing row.
  if (error.code === "23505") {
    const { data: raceWinner, error: fetchError } = await supabase
      .from("global_words")
      .select("*")
      .eq("language_code", word.language_code)
      .eq("normalized_target_word", word.normalized_target_word)
      .eq("normalized_translation", word.normalized_translation)
      .maybeSingle();

    if (fetchError) {
      showError(fetchError);
      return null;
    }

    return raceWinner;
  }

  showError(error);
  return null;
}

/* ------------------------------ Card mutations ------------------------------ */

async function addGlobalWordToMine(globalWordId, { refreshViews = true } = {}) {
  const alreadyMine = privateCards.some(
    (card) => card.global_words?.id === globalWordId,
  );

  if (alreadyMine) {
    alert("This word is already in your private flashcards.");
    return false;
  }

  const selectedGlobalWord = globalWords.find(
    (word) => word.id === globalWordId,
  );

  if (
    selectedGlobalWord &&
    selectedGlobalWord.language_code !== currentLanguageCode
  ) {
    alert("That word belongs to a different language.");
    return false;
  }

  const { data: flashcard, error: flashcardError } = await supabase
    .from("user_flashcards")
    .insert({
      user_id: currentUser.id,
      global_word_id: globalWordId,
    })
    .select("id")
    .single();

  if (flashcardError) {
    showError(flashcardError);
    return false;
  }

  const { error: statsError } = await supabase.from("learning_stats").insert({
    user_id: currentUser.id,
    user_flashcard_id: flashcard.id,
    next_review: new Date().toISOString(),
  });

  if (statsError) {
    showError(statsError);
    return false;
  }

  if (refreshViews) {
    await refreshData();
    renderPrivateView();
    renderGlobalView();
    renderStatsView();
  }

  return true;
}

async function toggleFavorite(userFlashcardId) {
  const card = privateCards.find((item) => item.id === userFlashcardId);

  if (!card) return;

  const { error } = await supabase
    .from("user_flashcards")
    .update({
      favorite: !card.favorite,
    })
    .eq("id", userFlashcardId)
    .eq("user_id", currentUser.id);

  if (error) {
    showError(error);
    return;
  }

  await refreshData();
  renderPrivateView();
}

async function deletePrivateCard(userFlashcardId) {
  const confirmed = confirm(
    "Remove this word from your private flashcards? It will stay in the shared library.",
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("user_flashcards")
    .delete()
    .eq("id", userFlashcardId)
    .eq("user_id", currentUser.id);

  if (error) {
    showError(error);
    return;
  }

  await refreshData();
  renderPrivateView();
  renderGlobalView();
  renderStatsView();
}

/* ------------------------------ Quiz ------------------------------ */

function renderQuizView() {
  const section = document.querySelector("#quiz");

  if (!section) return;

  const language = getCurrentLanguage();
  const targetToEnglish = `${currentLanguageCode}-${BASE_LANGUAGE.code}`;
  const englishToTarget = `${BASE_LANGUAGE.code}-${currentLanguageCode}`;

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>${escapeHtml(language.name)} Quiz</h2>
        <p class="muted">
          Practice only your private ${escapeHtml(language.name)} flashcards.
        </p>
      </div>

      <select id="quiz-direction">
        <option value="${targetToEnglish}">
          ${escapeHtml(language.name)} → ${escapeHtml(BASE_LANGUAGE.name)}
        </option>

        <option value="${englishToTarget}">
          ${escapeHtml(BASE_LANGUAGE.name)} → ${escapeHtml(language.name)}
        </option>
      </select>
    </div>

    <article class="quiz-card">
      <p id="quiz-meta" class="muted"></p>
      <h3 id="quiz-question">Click start to begin.</h3>

      <div id="quiz-options" class="options"></div>

      <div id="quiz-feedback" class="feedback hidden"></div>

      <button id="start-quiz" class="primary" type="button">
        Start / Next
      </button>
    </article>
  `;

  document.querySelector("#start-quiz").addEventListener("click", startQuiz);
}

function startQuiz() {
  const direction = document.querySelector("#quiz-direction").value;

  if (privateCards.length < 4) {
    document.querySelector("#quiz-question").textContent =
      "Add at least 4 private flashcards for this language first.";
    document.querySelector("#quiz-options").innerHTML = "";
    return;
  }

  currentQuiz = createQuizQuestion(direction);

  if (!currentQuiz) {
    document.querySelector("#quiz-question").textContent =
      "You need at least 4 cards with enough different answers for this quiz direction.";
    document.querySelector("#quiz-options").innerHTML = "";
    return;
  }

  document.querySelector("#quiz-feedback").classList.add("hidden");
  document.querySelector("#quiz-feedback").innerHTML = "";

  document.querySelector("#quiz-question").textContent = currentQuiz.question;
  document.querySelector("#quiz-meta").textContent = currentQuiz.meta;

  const optionsBox = document.querySelector("#quiz-options");
  optionsBox.innerHTML = "";

  currentQuiz.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => submitQuizAnswer(option));
    optionsBox.appendChild(button);
  });
}

function createQuizQuestion(direction) {
  const now = new Date();

  const dueCards = privateCards.filter((card) => {
    const stats = getStats(card);

    if (!stats?.next_review) return true;

    return new Date(stats.next_review) <= now;
  });

  const pool = dueCards.length > 0 ? dueCards : privateCards;
  const selectedCard = pool[Math.floor(Math.random() * pool.length)];
  const selectedWord = getWord(selectedCard);

  const targetToEnglish = `${currentLanguageCode}-${BASE_LANGUAGE.code}`;
  const isTargetToEnglish = direction === targetToEnglish;

  const question = isTargetToEnglish
    ? selectedWord.target_word
    : selectedWord.translation;

  const correctAnswer = isTargetToEnglish
    ? selectedWord.translation
    : selectedWord.target_word;

  const distractors = unique(
    privateCards
      .filter((card) => card.id !== selectedCard.id)
      .map((card) => {
        const word = getWord(card);

        return isTargetToEnglish ? word.translation : word.target_word;
      })
      .filter((answer) => answer !== correctAnswer),
  );

  if (distractors.length < 3) {
    return null;
  }

  return {
    userFlashcardId: selectedCard.id,
    direction,
    question,
    correctAnswer,
    options: shuffle([correctAnswer, ...shuffle(distractors).slice(0, 3)]),
    example: selectedWord.example,
    meta: [
      selectedWord.category || "general",
      selectedWord.gender || "none",
      `difficulty ${selectedWord.difficulty || 1}`,
    ].join(" · "),
  };
}

async function submitQuizAnswer(selectedAnswer) {
  if (!currentQuiz) return;

  const wasCorrect = selectedAnswer === currentQuiz.correctAnswer;

  const { data: stats, error: statsError } = await supabase
    .from("learning_stats")
    .select("*")
    .eq("user_flashcard_id", currentQuiz.userFlashcardId)
    .eq("user_id", currentUser.id)
    .single();

  if (statsError) {
    showError(statsError);
    return;
  }

  const totalReviews = (stats.total_reviews ?? 0) + 1;
  const correctReviews = (stats.correct_reviews ?? 0) + (wasCorrect ? 1 : 0);
  const wrongReviews = (stats.wrong_reviews ?? 0) + (wasCorrect ? 0 : 1);

  let reviewStage = stats.review_stage ?? 0;
  let currentStreak = stats.current_streak ?? 0;
  let longestStreak = stats.longest_streak ?? 0;

  const nextReview = new Date();

  if (wasCorrect) {
    reviewStage = Math.min(reviewStage + 1, 3);
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);

    const days = reviewStage === 1 ? 3 : reviewStage === 2 ? 7 : 14;

    nextReview.setDate(nextReview.getDate() + days);
  } else {
    reviewStage = 0;
    currentStreak = 0;
    nextReview.setDate(nextReview.getDate() + 1);
  }

  const status =
    wasCorrect && correctReviews >= 5 && reviewStage >= 3
      ? "MASTERED"
      : "LEARNING";

  const { error: updateError } = await supabase
    .from("learning_stats")
    .update({
      total_reviews: totalReviews,
      correct_reviews: correctReviews,
      wrong_reviews: wrongReviews,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      review_stage: reviewStage,
      status,
      last_review: new Date().toISOString(),
      next_review: nextReview.toISOString(),
    })
    .eq("user_flashcard_id", currentQuiz.userFlashcardId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    showError(updateError);
    return;
  }

  const { error: historyError } = await supabase.from("review_history").insert({
    user_id: currentUser.id,
    user_flashcard_id: currentQuiz.userFlashcardId,
    direction: currentQuiz.direction,
    selected_answer: selectedAnswer,
    correct_answer: currentQuiz.correctAnswer,
    was_correct: wasCorrect,
  });

  if (historyError) {
    showError(historyError);
    return;
  }

  document.querySelectorAll(".option").forEach((button) => {
    if (button.textContent === currentQuiz.correctAnswer) {
      button.classList.add("correct");
    }

    if (button.textContent === selectedAnswer && !wasCorrect) {
      button.classList.add("wrong");
    }

    button.disabled = true;
  });

  const feedback = document.querySelector("#quiz-feedback");

  feedback.classList.remove("hidden");

  feedback.innerHTML = wasCorrect
    ? `
      <strong>Correct.</strong>
      <p>Next review: ${nextReview.toLocaleDateString()}</p>
      <p class="muted">${escapeHtml(currentQuiz.example || "")}</p>
    `
    : `
      <strong>Incorrect.</strong>
      <p>
        Correct answer:
        <strong>${escapeHtml(currentQuiz.correctAnswer)}</strong>
      </p>
      <p>Review again: ${nextReview.toLocaleDateString()}</p>
      <p class="muted">${escapeHtml(currentQuiz.example || "")}</p>
    `;

  await refreshData();
}

/* ------------------------------ Stats ------------------------------ */

function renderStatsView() {
  const section = document.querySelector("#stats");

  if (!section) return;

  const language = getCurrentLanguage();
  const { totalWords, mastered, due, accuracy } = getLanguageProgress();

  section.innerHTML = `
    <div class="page-heading">
      <h2>${escapeHtml(language.name)} Stats</h2>
      <p class="muted">
        These numbers only include your ${escapeHtml(language.name)} cards.
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <span>Private words</span>
        <strong>${totalWords}</strong>
      </div>

      <div class="stat">
        <span>Due now</span>
        <strong>${due}</strong>
      </div>

      <div class="stat">
        <span>Mastered</span>
        <strong>${mastered}</strong>
      </div>

      <div class="stat">
        <span>Accuracy</span>
        <strong>${accuracy}%</strong>
      </div>
    </div>

    <div class="export-panel">
      <div>
        <h3>Export this language</h3>
        <p class="muted">
          Export your currently selected language data as JSON.
        </p>
      </div>

      <button id="export-json" type="button">Generate JSON</button>
    </div>

    <textarea
      id="export-box"
      readonly
      placeholder="Your exported data appears here."
    ></textarea>
  `;

  document.querySelector("#export-json").addEventListener("click", () => {
    const exportPayload = {
      language: {
        code: currentLanguageCode,
        name: language.name,
      },
      exported_at: new Date().toISOString(),
      cards: privateCards,
    };

    document.querySelector("#export-box").value = JSON.stringify(
      exportPayload,
      null,
      2,
    );
  });
}

/* ------------------------------ Startup ------------------------------ */

async function startApp() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    showError(error);
  }

  if (!user) {
    currentUser = null;
    renderAuth();
    return;
  }

  currentUser = user;
  activeView = "dashboard";

  if (!isSupportedLanguage(currentLanguageCode)) {
    renderLanguageHome();
    return;
  }

  await refreshData();
  renderApp();
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.user && currentUser) {
    currentUser = null;
    renderAuth();
  }
});

startApp();
