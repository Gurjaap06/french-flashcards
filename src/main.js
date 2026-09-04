import "./style.css";
import { supabase } from "./supabaseClient.js";

const app = document.querySelector("#app");

let currentUser = null;
let privateCards = [];
let globalWords = [];
let currentQuiz = null;

function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function getStats(card) {
  const stats = card.learning_stats;

  if (Array.isArray(stats)) {
    return stats[0] || null;
  }

  return stats || null;
}

function getWord(card) {
  return card.global_words || card;
}

function renderAuth() {
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <h1>French Flashcards</h1>
        <p class="muted">Log in or create an account to save your private flashcards.</p>

        <form id="auth-form">
          <label>
            Email
            <input id="email" type="email" required placeholder="you@example.com">
          </label>

          <label>
            Password
            <input id="password" type="password" required placeholder="Minimum 6 characters">
          </label>

          <div class="button-row">
            <button class="primary" type="submit" data-action="login">Log in</button>
            <button type="submit" data-action="signup">Sign up</button>
          </div>
        </form>
      </section>
    </main>
  `;

  document.querySelector("#auth-form").addEventListener("submit", handleAuth);
}

async function handleAuth(event) {
  event.preventDefault();

  const action = event.submitter.dataset.action;
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  if (action === "signup") {
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Account created. Check your email if Supabase asks you to confirm it.",
    );
  }

  if (action === "login") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await startApp();
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  renderAuth();
}

function renderApp() {
  app.innerHTML = `
    <header class="app-header">
      <div>
        <h1>French Flashcards</h1>
        <p class="muted">Private practice + shared French library</p>
      </div>

      <div class="header-actions">
        <span class="muted">${escapeHtml(currentUser.email)}</span>
        <button id="logout">Log out</button>
      </div>
    </header>

    <nav class="tabs">
      <button class="tab active" data-view="private">My Flashcards</button>
      <button class="tab" data-view="global">Global Library</button>
      <button class="tab" data-view="add">Add Word</button>
      <button class="tab" data-view="quiz">Quiz</button>
      <button class="tab" data-view="stats">Stats</button>
    </nav>

    <section class="tool-promo">

      <div class="tool-promo-copy">

        <span class="tool-promo-kicker">
          More French practice
        </span>

        <h2>
          Learn the French alphabet
        </h2>

        <p>
          Practice letter names, sounds, accented characters,
          and pronunciation.
        </p>

      </div>

      <a class="tool-promo-action" href="/alphabet/">
        Open Alphabet Lab →
      </a>

    </section>

    <main>
      <section id="private" class="view active"></section>
      <section id="global" class="view"></section>
      <section id="add" class="view"></section>
      <section id="quiz" class="view"></section>
      <section id="stats" class="view"></section>
    </main>
  `;

  document.querySelector("#logout").addEventListener("click", logout);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  renderPrivateView();
  renderGlobalView();
  renderAddView();
  renderQuizView();
  renderStatsView();
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewId);
  });

  if (viewId === "quiz") {
    renderQuizView();
  }

  if (viewId === "stats") {
    renderStatsView();
  }
}

async function loadPrivateCards() {
  const { data, error } = await supabase
    .from("user_flashcards")
    .select(
      `
      id,
      favorite,
      notes,
      created_at,
      global_words (
        id,
        french,
        english,
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
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  privateCards = data || [];
}

async function loadGlobalWords() {
  const { data, error } = await supabase
    .from("global_words")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  globalWords = data || [];
}

function renderPrivateView() {
  const section = document.querySelector("#private");

  if (privateCards.length === 0) {
    section.innerHTML = `
      <div class="toolbar">
        <h2>My Flashcards</h2>
      </div>
      <p class="muted">You have no private flashcards yet. Add a word or copy one from the global library.</p>
    `;
    return;
  }

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>My Flashcards</h2>
        <p class="muted">${privateCards.length} private cards</p>
      </div>
      <input id="private-search" type="search" placeholder="Search my flashcards...">
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
  const search = normalize(
    document.querySelector("#private-search")?.value || "",
  );

  const filtered = privateCards.filter((card) => {
    const word = getWord(card);
    const stats = getStats(card);

    const text = normalize(
      [
        word.french,
        word.english,
        word.example,
        word.category,
        word.gender,
        stats?.status,
      ].join(" "),
    );

    return text.includes(search);
  });

  list.innerHTML = filtered
    .map((card) => {
      const word = getWord(card);
      const stats = getStats(card);
      const totalReviews = stats?.total_reviews || 0;
      const correctReviews = stats?.correct_reviews || 0;
      const accuracy =
        totalReviews === 0
          ? 0
          : Math.round((correctReviews / totalReviews) * 100);

      return `
      <article class="word-card">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(word.french)}</h3>
            <p>${escapeHtml(word.english)}</p>
          </div>

          <button data-favorite="${card.id}" class="${card.favorite ? "favorite" : ""}">★</button>
        </div>

        <p class="muted">${escapeHtml(word.example || "No example sentence.")}</p>

        <div class="pills">
          <span>${escapeHtml(word.category || "general")}</span>
          <span>${escapeHtml(word.gender || "none")}</span>
          <span>difficulty ${word.difficulty || 1}</span>
          <span>${escapeHtml(stats?.status || "NEW")}</span>
        </div>

        <p class="small">
          Reviews: ${totalReviews} |
          Accuracy: ${accuracy}% |
          Streak: ${stats?.current_streak || 0}
        </p>

        <button data-delete="${card.id}" class="danger">Remove from my cards</button>
      </article>
    `;
    })
    .join("");

  list.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleFavorite(button.dataset.favorite),
    );
  });

  list.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () =>
      deletePrivateCard(button.dataset.delete),
    );
  });
}

function renderGlobalView() {
  const section = document.querySelector("#global");

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Global Library</h2>
        <p class="muted">${globalWords.length} shared words from everyone</p>
      </div>
      <input id="global-search" type="search" placeholder="Search global library...">
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
  const search = normalize(
    document.querySelector("#global-search")?.value || "",
  );
  const myGlobalIds = new Set(
    privateCards.map((card) => card.global_words?.id),
  );

  const filtered = globalWords.filter((word) => {
    const text = normalize(
      [
        word.french,
        word.english,
        word.example,
        word.category,
        word.gender,
      ].join(" "),
    );

    return text.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="muted">No global words found.</p>`;
    return;
  }

  list.innerHTML = filtered
    .map((word) => {
      const alreadyMine = myGlobalIds.has(word.id);

      return `
      <article class="word-card">
        <h3>${escapeHtml(word.french)}</h3>
        <p>${escapeHtml(word.english)}</p>
        <p class="muted">${escapeHtml(word.example || "No example sentence.")}</p>

        <div class="pills">
          <span>${escapeHtml(word.category || "general")}</span>
          <span>${escapeHtml(word.gender || "none")}</span>
          <span>difficulty ${word.difficulty || 1}</span>
        </div>

        <button data-add-global="${word.id}" ${alreadyMine ? "disabled" : ""}>
          ${alreadyMine ? "Already in my cards" : "Add to my cards"}
        </button>
      </article>
    `;
    })
    .join("");

  list.querySelectorAll("[data-add-global]").forEach((button) => {
    button.addEventListener("click", () =>
      addGlobalWordToMine(button.dataset.addGlobal),
    );
  });
}

function renderAddView() {
  const section = document.querySelector("#add");

  section.innerHTML = `
    <h2>Add Word</h2>
    <p class="muted page-note">
      This adds the word to your private flashcards and also adds it to the shared global library.
    </p>

    <form id="add-form" class="form-grid">
      <label>
        French word
        <input name="french" required placeholder="ex: pomme">
      </label>

      <label>
        English meaning
        <input name="english" required placeholder="ex: apple">
      </label>

      <label>
        Category
        <input name="category" placeholder="ex: food, travel, school">
      </label>

      <label>
        Gender
        <select name="gender">
          <option value="none">none</option>
          <option value="masculine">masculine</option>
          <option value="feminine">feminine</option>
          <option value="both">both</option>
        </select>
      </label>

      <label>
        Difficulty
        <input name="difficulty" type="number" min="1" max="5" value="1">
      </label>

      <label class="full">
        Example sentence
        <input name="example" placeholder="ex: Je mange une pomme.">
      </label>

      <button class="primary" type="submit">Add word</button>
    </form>
  `;

  document.querySelector("#add-form").addEventListener("submit", handleAddWord);
}

async function handleAddWord(event) {
  event.preventDefault();

  const form = new FormData(event.target);

  const newWord = {
    french: form.get("french").trim(),
    english: form.get("english").trim(),
    example: form.get("example").trim(),
    category: form.get("category").trim(),
    gender: form.get("gender"),
    difficulty: Number(form.get("difficulty")),
    normalized_french: normalize(form.get("french")),
    normalized_english: normalize(form.get("english")),
    created_by: currentUser.id,
  };

  const globalWord = await findOrCreateGlobalWord(newWord);

  if (!globalWord) return;

  await addGlobalWordToMine(globalWord.id);

  event.target.reset();

  await refreshData();
  switchView("private");
}

async function findOrCreateGlobalWord(word) {
  const { data: existingWord, error: existingError } = await supabase
    .from("global_words")
    .select("*")
    .eq("normalized_french", word.normalized_french)
    .eq("normalized_english", word.normalized_english)
    .maybeSingle();

  if (existingError) {
    alert(existingError.message);
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

  if (error) {
    alert(error.message);
    return null;
  }

  return data;
}

async function addGlobalWordToMine(globalWordId) {
  const alreadyMine = privateCards.some(
    (card) => card.global_words?.id === globalWordId,
  );

  if (alreadyMine) {
    alert("This word is already in your private flashcards.");
    return;
  }

  const { data: flashcard, error: flashcardError } = await supabase
    .from("user_flashcards")
    .insert({
      user_id: currentUser.id,
      global_word_id: globalWordId,
    })
    .select()
    .single();

  if (flashcardError) {
    alert(flashcardError.message);
    return;
  }

  const { error: statsError } = await supabase.from("learning_stats").insert({
    user_id: currentUser.id,
    user_flashcard_id: flashcard.id,
    next_review: new Date().toISOString(),
  });

  if (statsError) {
    alert(statsError.message);
    return;
  }

  await refreshData();
  renderGlobalView();
  renderPrivateView();
}

async function toggleFavorite(userFlashcardId) {
  const card = privateCards.find((item) => item.id === userFlashcardId);

  if (!card) return;

  const { error } = await supabase
    .from("user_flashcards")
    .update({ favorite: !card.favorite })
    .eq("id", userFlashcardId);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  renderPrivateView();
}

async function deletePrivateCard(userFlashcardId) {
  const confirmed = confirm(
    "Remove this word from your private flashcards? It will stay in the global library.",
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("user_flashcards")
    .delete()
    .eq("id", userFlashcardId);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  renderPrivateView();
  renderGlobalView();
}

function renderQuizView() {
  const section = document.querySelector("#quiz");

  section.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Quiz</h2>
        <p class="muted">Practice your private flashcards.</p>
      </div>

      <select id="quiz-direction">
        <option value="fr-en">French → English</option>
        <option value="en-fr">English → French</option>
      </select>
    </div>

    <article class="quiz-card">
      <p id="quiz-meta" class="muted"></p>
      <h3 id="quiz-question">Click start.</h3>

      <div id="quiz-options" class="options"></div>

      <div id="quiz-feedback" class="feedback hidden"></div>

      <button id="start-quiz" class="primary">Start / Next</button>
    </article>
  `;

  document.querySelector("#start-quiz").addEventListener("click", startQuiz);
}

function startQuiz() {
  const direction = document.querySelector("#quiz-direction").value;

  if (privateCards.length < 4) {
    document.querySelector("#quiz-question").textContent =
      "Add at least 4 private flashcards first.";
    return;
  }

  currentQuiz = createQuizQuestion(direction);

  document.querySelector("#quiz-feedback").classList.add("hidden");
  document.querySelector("#quiz-question").textContent = currentQuiz.question;
  document.querySelector("#quiz-meta").textContent = currentQuiz.meta;

  const optionsBox = document.querySelector("#quiz-options");
  optionsBox.innerHTML = "";

  currentQuiz.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
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

  const question =
    direction === "fr-en" ? selectedWord.french : selectedWord.english;
  const correctAnswer =
    direction === "fr-en" ? selectedWord.english : selectedWord.french;

  const answerOptions = privateCards
    .filter((card) => card.id !== selectedCard.id)
    .map((card) => {
      const word = getWord(card);
      return direction === "fr-en" ? word.english : word.french;
    });

  return {
    userFlashcardId: selectedCard.id,
    direction,
    question,
    correctAnswer,
    options: shuffle([correctAnswer, ...shuffle(answerOptions).slice(0, 3)]),
    example: selectedWord.example,
    meta: `${selectedWord.category || "general"} · ${selectedWord.gender || "none"} · difficulty ${selectedWord.difficulty || 1}`,
  };
}

async function submitQuizAnswer(selectedAnswer) {
  if (!currentQuiz) return;

  const wasCorrect = selectedAnswer === currentQuiz.correctAnswer;

  const { data: stats, error: statsError } = await supabase
    .from("learning_stats")
    .select("*")
    .eq("user_flashcard_id", currentQuiz.userFlashcardId)
    .single();

  if (statsError) {
    alert(statsError.message);
    return;
  }

  const totalReviews = stats.total_reviews + 1;
  const correctReviews = stats.correct_reviews + (wasCorrect ? 1 : 0);
  const wrongReviews = stats.wrong_reviews + (wasCorrect ? 0 : 1);

  let reviewStage = stats.review_stage;
  let currentStreak = stats.current_streak;
  let longestStreak = stats.longest_streak;
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
    .eq("user_flashcard_id", currentQuiz.userFlashcardId);

  if (updateError) {
    alert(updateError.message);
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
    alert(historyError.message);
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
      <p>Correct answer: ${escapeHtml(currentQuiz.correctAnswer)}</p>
      <p>Review again: ${nextReview.toLocaleDateString()}</p>
      <p class="muted">${escapeHtml(currentQuiz.example || "")}</p>
    `;

  await refreshData();
}

function renderStatsView() {
  const section = document.querySelector("#stats");

  const totalWords = privateCards.length;
  const totalReviews = privateCards.reduce(
    (sum, card) => sum + (getStats(card)?.total_reviews || 0),
    0,
  );
  const correctReviews = privateCards.reduce(
    (sum, card) => sum + (getStats(card)?.correct_reviews || 0),
    0,
  );
  const mastered = privateCards.filter(
    (card) => getStats(card)?.status === "MASTERED",
  ).length;
  const due = privateCards.filter((card) => {
    const stats = getStats(card);
    if (!stats?.next_review) return true;
    return new Date(stats.next_review) <= new Date();
  }).length;

  const accuracy =
    totalReviews === 0 ? 0 : Math.round((correctReviews / totalReviews) * 100);

  section.innerHTML = `
    <h2>Stats</h2>

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

    <button id="export-json">Export my data</button>
    <textarea id="export-box" readonly placeholder="Your exported data appears here."></textarea>
  `;

  document.querySelector("#export-json").addEventListener("click", () => {
    document.querySelector("#export-box").value = JSON.stringify(
      privateCards,
      null,
      2,
    );
  });
}

async function refreshData() {
  await loadPrivateCards();
  await loadGlobalWords();
}

async function startApp() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    renderAuth();
    return;
  }

  currentUser = user;

  await refreshData();
  renderApp();
}

startApp();
