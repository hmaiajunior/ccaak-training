/* ── State ─────────────────────────────────────────────────── */
const state = {
  lang: null,
  mode: null,
  phase: 'SETUP',
  totalQuestions: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  timeLeft: 0,
  startedAt: null,
  timerInterval: null,
  selectedOption: null,
  feedbackShown: false,
};

/* ── I18n ──────────────────────────────────────────────────── */
let strings = {};

async function loadI18n(lang) {
  const key = lang === 'pt' ? 'pt-br' : 'en';
  const res = await fetch(`i18n/${key}.json`);
  strings = await res.json();
}

function t(key) {
  return strings[key] ?? key;
}

/* ── Question Bank ─────────────────────────────────────────── */
let allQuestions = [];

async function loadQuestions() {
  const res = await fetch('data/questions.json');
  allQuestions = await res.json();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleQuestions(n) {
  return shuffle(allQuestions).slice(0, Math.min(n, allQuestions.length));
}

/* ── Timer ─────────────────────────────────────────────────── */
function startTimer() {
  renderTimer();
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  const el = document.getElementById('timer');
  el.textContent = state.timeLeft > 0
    ? `${t('label_time_left')}: ${formatTime(state.timeLeft)}`
    : t('label_time_up');
  el.classList.toggle('warning', state.timeLeft <= 60);
}

/* ── Quiz Session ──────────────────────────────────────────── */
function startQuiz() {
  state.questions    = sampleQuestions(state.totalQuestions);
  state.currentIndex = 0;
  state.answers      = {};
  state.timeLeft     = state.totalQuestions * 120;
  state.startedAt    = Date.now();
  state.phase        = 'RUNNING';
  showScreen('screen-quiz');
  if (state.mode === 'exam') {
    document.getElementById('timer').classList.remove('hidden');
    startTimer();
  }
  renderQuizScreen();
}

function confirmAnswer() {
  if (state.selectedOption === null) return;
  const q = state.questions[state.currentIndex];
  state.answers[q.id] = state.selectedOption;

  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  document.getElementById('btn-confirm').disabled = true;

  if (state.mode === 'training') {
    showFeedback(q, state.selectedOption);
    state.feedbackShown = true;
    const btn = document.getElementById('btn-confirm');
    btn.textContent = t('btn_next');
    btn.disabled = false;
  } else {
    advanceQuestion();
  }
}

function advanceQuestion() {
  state.currentIndex++;
  state.selectedOption = null;
  state.feedbackShown  = false;
  if (state.currentIndex >= state.questions.length) {
    submitQuiz();
  } else {
    renderQuizScreen();
  }
}

function submitQuiz() {
  stopTimer();
  state.phase = 'FINISHED';
  showScreen('screen-results');
  renderResultsScreen();
}

/* ── Score Calculator ──────────────────────────────────────── */
function calcResults() {
  let correct = 0;
  const byCategory = {};
  state.questions.forEach(q => {
    const hit = state.answers[q.id] === q.correct;
    if (hit) correct++;
    if (!byCategory[q.category]) byCategory[q.category] = { correct: 0, total: 0 };
    byCategory[q.category].total++;
    if (hit) byCategory[q.category].correct++;
  });
  return { correct, total: state.questions.length, byCategory };
}

/* ── UI ────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}

function renderSetupScreen() {
  applyI18n();
  document.getElementById('setup-title').textContent    = t('app_title');
  document.getElementById('setup-subtitle').textContent = t('app_subtitle');
  updateStartButton();
}

function updateStartButton() {
  const ok = state.lang !== null && state.mode !== null && state.totalQuestions !== null;
  document.getElementById('btn-start').disabled = !ok;
}

function renderQuizScreen() {
  const q    = state.questions[state.currentIndex];
  const qLoc = q[state.lang];

  document.getElementById('progress').textContent =
    `${t('label_question')} ${state.currentIndex + 1} ${t('label_of')} ${state.questions.length}`;

  document.getElementById('mode-badge').textContent =
    state.mode === 'exam' ? t('mode_exam') : t('mode_training');

  document.getElementById('question-text').textContent = qLoc.question;

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.letter = letter;
    btn.innerHTML = `<span class="option-letter">${letter}</span>${qLoc.options[letter]}`;
    btn.addEventListener('click', () => selectOption(letter));
    container.appendChild(btn);
  });

  document.getElementById('feedback-box').classList.add('hidden');
  const confirmBtn = document.getElementById('btn-confirm');
  confirmBtn.textContent = t('btn_confirm');
  confirmBtn.disabled    = true;
  state.selectedOption   = null;
  state.feedbackShown    = false;
}

function selectOption(letter) {
  if (state.feedbackShown) return;
  state.selectedOption = letter;
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.letter === letter);
  });
  document.getElementById('btn-confirm').disabled = false;
}

function showFeedback(q, userAnswer) {
  const isCorrect = userAnswer === q.correct;
  const qLoc = q[state.lang];

  document.querySelectorAll('.option-btn').forEach(btn => {
    const l = btn.dataset.letter;
    if (l === q.correct) btn.classList.add('correct');
    else if (l === userAnswer && !isCorrect) btn.classList.add('incorrect');
  });

  const box = document.getElementById('feedback-box');
  box.classList.remove('hidden');

  const status = document.getElementById('feedback-status');
  status.textContent = isCorrect ? t('feedback_correct') : t('feedback_incorrect');
  status.className   = `feedback-status ${isCorrect ? 'correct' : 'incorrect'}`;

  document.getElementById('feedback-explanation').textContent = qLoc.explanation;
}

function renderResultsScreen() {
  applyI18n();
  const { correct, total, byCategory } = calcResults();
  const pct = Math.round((correct / total) * 100);

  document.getElementById('results-score').textContent = `${correct} / ${total} — ${pct}%`;

  const statusEl = document.getElementById('results-status');
  const passed   = pct >= 70;
  statusEl.textContent = passed ? t('label_approved') : t('label_failed');
  statusEl.className   = `results-status ${passed ? 'approved' : 'failed'}`;

  const tbody = document.querySelector('#results-breakdown tbody');
  tbody.innerHTML = '';
  Object.entries(byCategory).forEach(([cat, data]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cat}</td><td>${data.correct} / ${data.total}</td>`;
    tbody.appendChild(tr);
  });
}

function renderReviewScreen() {
  applyI18n();
  const list = document.getElementById('review-list');
  list.innerHTML = '';

  state.questions.forEach((q, i) => {
    const qLoc      = q[state.lang];
    const userAns   = state.answers[q.id] ?? '—';
    const isCorrect = userAns === q.correct;

    const card = document.createElement('div');
    card.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;

    const resultLabel = isCorrect ? t('feedback_correct') : t('feedback_incorrect');

    card.innerHTML = `
      <div class="review-card-header">
        <span class="review-card-number">${t('label_question')} ${i + 1}</span>
        <span class="review-card-result">${resultLabel}</span>
      </div>
      <p class="review-card-question">${qLoc.question}</p>
      <div class="review-card-answers">
        <div>
          <span>${t('label_your_answer')}: </span>
          <strong class="${isCorrect ? 'answer-correct' : 'answer-wrong'}">
            ${userAns} — ${userAns !== '—' ? qLoc.options[userAns] : '—'}
          </strong>
        </div>
        <div>
          <span>${t('label_correct_answer')}: </span>
          <strong class="answer-correct">${q.correct} — ${qLoc.options[q.correct]}</strong>
        </div>
      </div>
      <p class="review-card-explanation">${qLoc.explanation}</p>
    `;
    list.appendChild(card);
  });
}

function resetToSetup() {
  stopTimer();
  state.lang            = null;
  state.mode            = null;
  state.phase           = 'SETUP';
  state.totalQuestions  = null;
  state.questions       = [];
  state.currentIndex    = 0;
  state.answers         = {};
  state.timeLeft        = 0;
  state.selectedOption  = null;
  state.feedbackShown   = false;

  document.getElementById('timer').classList.add('hidden');
  document.querySelectorAll('.btn-option, .mode-card').forEach(b => b.classList.remove('selected'));

  showScreen('screen-setup');
  renderSetupScreen();
}

/* ── Event Wiring ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  await loadI18n('pt');
  state.lang = 'pt';
  document.querySelector('[data-lang="pt"]').classList.add('selected');

  renderSetupScreen();
  showScreen('screen-setup');

  /* Language toggle */
  document.getElementById('lang-toggle').addEventListener('click', async e => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    state.lang = btn.dataset.lang;
    await loadI18n(state.lang);
    document.querySelectorAll('[data-lang]').forEach(b =>
      b.classList.toggle('selected', b.dataset.lang === state.lang)
    );
    renderSetupScreen();
  });

  /* Mode cards */
  document.getElementById('mode-cards').addEventListener('click', e => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    state.mode = btn.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b =>
      b.classList.toggle('selected', b.dataset.mode === state.mode)
    );
    updateStartButton();
  });

  /* Quantity buttons */
  document.getElementById('qty-buttons').addEventListener('click', e => {
    const btn = e.target.closest('[data-qty]');
    if (!btn) return;
    const requested = parseInt(btn.dataset.qty, 10);
    state.totalQuestions = Math.min(requested, allQuestions.length);
    document.querySelectorAll('[data-qty]').forEach(b =>
      b.classList.toggle('selected', b.dataset.qty === btn.dataset.qty)
    );
    updateStartButton();
  });

  /* Start */
  document.getElementById('btn-start').addEventListener('click', startQuiz);

  /* Confirm / Next */
  document.getElementById('btn-confirm').addEventListener('click', () => {
    if (state.feedbackShown) {
      advanceQuestion();
    } else {
      confirmAnswer();
    }
  });

  /* Exit quiz (cancel during quiz) */
  document.getElementById('btn-exit').addEventListener('click', () => {
    if (confirm(t('confirm_exit'))) resetToSetup();
  });

  /* Review */
  document.getElementById('btn-review').addEventListener('click', () => {
    showScreen('screen-review');
    renderReviewScreen();
  });

  /* Restart / Home from results */
  document.getElementById('btn-restart-results').addEventListener('click', resetToSetup);
  document.getElementById('btn-home-results').addEventListener('click', resetToSetup);

  /* Restart / Home from review */
  document.getElementById('btn-restart-review').addEventListener('click', resetToSetup);
  document.getElementById('btn-home-review').addEventListener('click', resetToSetup);
});
