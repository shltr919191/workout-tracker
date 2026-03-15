/* =============================================
   IRONLOG — app.js
   Vanilla JS · LocalStorage · Chart.js
   ============================================= */

'use strict';

// ─── WORKOUT DEFINITIONS ───────────────────────
const WORKOUTS = {
  A: {
    label: 'Workout A',
    subtitle: 'Strength Block',
    exercises: [
      { name: 'Trap Bar Deadlift', sets: 3, reps: 5,  defaultWeight: 100 },
      { name: 'DB Bench Press',    sets: 3, reps: 8,  defaultWeight: 30  },
      { name: 'Pull Ups',          sets: 3, reps: 8,  defaultWeight: 0   },
      { name: 'Dumbbell Row',      sets: 3, reps: 10, defaultWeight: 25  },
    ]
  },
  B: {
    label: 'Workout B',
    subtitle: 'Strength Block',
    exercises: [
      { name: 'Squat',          sets: 3, reps: 5,  defaultWeight: 80  },
      { name: 'Overhead Press', sets: 3, reps: 6,  defaultWeight: 40  },
      { name: 'Seated Row',     sets: 3, reps: 10, defaultWeight: 50  },
      { name: 'Romanian DL',   sets: 3, reps: 8,  defaultWeight: 60  },
    ]
  }
};

const WORKOUT_ORDER = ['A', 'B', 'A', 'B'];

const PHASE_NAMES = {
  1: 'Technique / Volume',
  2: 'Strength Building',
  3: 'Intensity',
  4: 'Deload',
};

// ─── STATE ────────────────────────────────────
let state = {
  currentWorkoutKey: 'A',
  currentWeek: 1,
  currentPhase: 1,
  activeTab: 'Home',
  sets: {},          // exerciseName -> [{weight, reps, done}]
  history: [],       // [{date, workout, exercises}]
};

let chartWeekly   = null;
let chartExercise = null;

// ─── INIT ─────────────────────────────────────
function init() {
  loadFromStorage();
  setHeaderDate();
  renderHome();
  renderHistory();
  populateExerciseSelect();
  renderProgress();
}

// ─── STORAGE ──────────────────────────────────
function loadFromStorage() {
  try {
    const saved = localStorage.getItem('ironlog_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.history          = parsed.history          || [];
      state.currentWorkoutKey= parsed.currentWorkoutKey|| 'A';
      state.currentWeek      = parsed.currentWeek      || 1;
      state.currentPhase     = parsed.currentPhase     || 1;
      state.sets             = parsed.sets             || {};
    }
  } catch (e) {
    console.warn('Storage load error', e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('ironlog_v2', JSON.stringify({
      history:           state.history,
      currentWorkoutKey: state.currentWorkoutKey,
      currentWeek:       state.currentWeek,
      currentPhase:      state.currentPhase,
      sets:              state.sets,
    }));
  } catch (e) {
    console.warn('Storage save error', e);
  }
}

// ─── DATE HELPERS ─────────────────────────────
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

// ─── TAB NAVIGATION ───────────────────────────
function switchTab(tab) {
  state.activeTab = tab;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('screen' + tab).classList.add('active');
  document.getElementById('nav' + tab).classList.add('active');

  if (tab === 'History')  renderHistory();
  if (tab === 'Progress') renderProgress();
}

// ─── HOME / WORKOUT ───────────────────────────
function renderHome() {
  const key     = state.currentWorkoutKey;
  const workout = WORKOUTS[key];

  const phaseName = PHASE_NAMES[state.currentPhase] || `Phase ${state.currentPhase}`;
  document.getElementById('phaseBadge').textContent =
    `${phaseName.toUpperCase()} · WEEK ${state.currentWeek}`;
  document.getElementById('workoutTitle').textContent   = workout.label.toUpperCase();
  document.getElementById('workoutSubtitle').textContent = workout.subtitle;

  // Init sets if not present or stale, then persist immediately
  let setsChanged = false;
  workout.exercises.forEach(ex => {
    if (!state.sets[ex.name] || state.sets[ex.name].length !== ex.sets) {
      state.sets[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight: ex.defaultWeight,
        reps:   ex.reps,
        done:   false,
      }));
      setsChanged = true;
    }
  });
  if (setsChanged) saveToStorage();

  const list = document.getElementById('exerciseList');
  list.innerHTML = workout.exercises.map((ex, ei) =>
    renderExerciseCard(ex, ei)
  ).join('');

  attachSetListeners();
}

function renderExerciseCard(ex, ei) {
  const sets     = state.sets[ex.name] || [];
  const doneCount= sets.filter(s => s.done).length;
  const allDone  = doneCount === sets.length;
  const r        = 14;
  const circ     = 2 * Math.PI * r;
  const offset   = circ - (doneCount / sets.length) * circ;

  const setRows = sets.map((s, si) => `
    <div class="set-row${s.done ? ' completed' : ''}" id="row-${ei}-${si}">
      <div class="set-number">${si + 1}</div>
      <div class="set-input-group">
        <span class="set-input-label">KG</span>
        <input
          class="set-input"
          type="number"
          inputmode="decimal"
          min="0" step="0.5"
          value="${s.weight}"
          data-ex="${ex.name}"
          data-si="${si}"
          data-field="weight"
        />
      </div>
      <div class="set-input-group">
        <span class="set-input-label">REPS</span>
        <input
          class="set-input"
          type="number"
          inputmode="numeric"
          min="1" step="1"
          value="${s.reps}"
          data-ex="${ex.name}"
          data-si="${si}"
          data-field="reps"
        />
      </div>
      <button
        class="set-check"
        aria-label="Mark set ${si+1} complete"
        data-ex="${ex.name}"
        data-si="${si}"
        data-ei="${ei}"
        onclick="toggleSet(this)"
      >${s.done ? '✓' : ''}</button>
    </div>
  `).join('');

  return `
    <div class="exercise-card${allDone ? ' all-done' : ''}" id="card-${ei}">
      <div class="exercise-card-header">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-schema">${ex.sets} × ${ex.reps}</div>
        </div>
        <div class="exercise-progress-ring" title="${doneCount}/${sets.length} sets done">
          <svg viewBox="0 0 36 36">
            <circle class="progress-bg"   cx="18" cy="18" r="${r}" stroke-width="3"/>
            <circle class="progress-fill" cx="18" cy="18" r="${r}" stroke-width="3"
              stroke-dasharray="${circ}"
              stroke-dashoffset="${offset}"
            />
          </svg>
          <div class="progress-label">${doneCount}/${sets.length}</div>
        </div>
      </div>
      <div class="set-list">${setRows}</div>
    </div>
  `;
}

function attachSetListeners() {
  document.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const ex    = input.dataset.ex;
      const si    = parseInt(input.dataset.si);
      const field = input.dataset.field;
      let val     = parseFloat(input.value);

      // Validate: reject NaN, negative weights, zero/negative reps
      if (isNaN(val)) val = field === 'reps' ? 1 : 0;
      if (field === 'weight') val = Math.max(0, val);
      if (field === 'reps')   val = Math.max(1, Math.round(val));

      // Reflect sanitised value back into input
      input.value = val;

      state.sets[ex][si][field] = val;
      saveToStorage();
    });
  });
}

function toggleSet(btn) {
  const ex  = btn.dataset.ex;
  const si  = parseInt(btn.dataset.si);
  const ei  = parseInt(btn.dataset.ei);
  state.sets[ex][si].done = !state.sets[ex][si].done;
  saveToStorage();

  // Patch DOM without full re-render
  const row    = document.getElementById(`row-${ei}-${si}`);
  const isDone = state.sets[ex][si].done;
  row.classList.toggle('completed', isDone);
  btn.textContent = isDone ? '✓' : '';

  // Update ring
  const allSets  = state.sets[ex];
  const done     = allSets.filter(s => s.done).length;
  const total    = allSets.length;
  const r        = 14;
  const circ     = 2 * Math.PI * r;
  const offset   = circ - (done / total) * circ;
  const card     = document.getElementById(`card-${ei}`);
  const fill     = card.querySelector('.progress-fill');
  const label    = card.querySelector('.progress-label');
  if (fill)  fill.style.strokeDashoffset = offset;
  if (label) label.textContent = `${done}/${total}`;
  card.classList.toggle('all-done', done === total);
}

// ─── FINISH WORKOUT ───────────────────────────
function finishWorkout() {
  const key     = state.currentWorkoutKey;
  const workout = WORKOUTS[key];

  // Collect data
  const exercises = workout.exercises.map(ex => ({
    name: ex.name,
    sets: state.sets[ex.name].map(s => ({
      weight: s.weight,
      reps:   s.reps,
      done:   s.done,
    }))
  }));

  const log = {
    id:       Date.now(),
    date:     todayISO(),
    workout:  key,
    label:    workout.label,
    week:     state.currentWeek,
    phase:    state.currentPhase,
    exercises,
  };

  state.history.unshift(log);

  // Advance to next workout
  advanceWorkout();

  saveToStorage();
  showToast('WORKOUT SAVED ✓');
  renderHome();
}

function advanceWorkout() {
  const keys    = Object.keys(WORKOUTS);
  const idx     = keys.indexOf(state.currentWorkoutKey);
  const nextIdx = (idx + 1) % keys.length;
  const nextKey = keys[nextIdx];

  // Every full cycle (back to A), bump week
  if (nextIdx === 0) {
    state.currentWeek++;
    if (state.currentWeek > 4) {
      state.currentWeek  = 1;
      state.currentPhase++;
    }
  }

  // Init sets for the incoming workout BEFORE updating the key,
  // so renderHome() never sees a key/sets mismatch
  WORKOUTS[nextKey].exercises.forEach(ex => {
    state.sets[ex.name] = Array.from({ length: ex.sets }, () => ({
      weight: ex.defaultWeight,
      reps:   ex.reps,
      done:   false,
    }));
  });

  state.currentWorkoutKey = nextKey;
}

function skipWorkout() {
  if (!confirm('Skip this workout and move to the next one?')) return;
  advanceWorkout();
  saveToStorage();
  renderHome();
}

// ─── HISTORY ──────────────────────────────────
function renderHistory() {
  const list    = document.getElementById('historyList');
  const empty   = document.getElementById('historyEmpty');
  const countEl = document.getElementById('historyCount');

  const h = state.history;
  countEl.textContent = `${h.length} session${h.length !== 1 ? 's' : ''}`;

  if (!h.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = h.map((log, i) => `
    <div class="history-item" id="hist-${i}">
      <div class="history-item-left" onclick="openHistoryModal(${i})" style="flex:1;cursor:pointer;">
        <div class="history-item-date">${formatDate(log.date)}</div>
        <div class="history-item-name">${(log.label || 'Workout ' + log.workout).toUpperCase()}</div>
        <div class="history-item-meta">${log.exercises.length} exercises · ${PHASE_NAMES[log.phase || 1] || 'Phase ' + (log.phase || 1)}, Wk ${log.week || 1}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="history-item-arrow" onclick="openHistoryModal(${i})" style="cursor:pointer;">›</div>
        <button class="history-delete-btn" onclick="deleteHistoryEntry(${i})" aria-label="Delete workout">✕</button>
      </div>
    </div>
  `).join('');
}

function openHistoryModal(idx) {
  const log = state.history[idx];
  if (!log) return;

  document.getElementById('modalDate').textContent  = formatDate(log.date);
  document.getElementById('modalTitle').textContent = (log.label || 'Workout ' + log.workout).toUpperCase();

  const body = document.getElementById('modalBody');
  body.innerHTML = log.exercises.map(ex => `
    <div class="modal-exercise">
      <div class="modal-exercise-name">${ex.name}</div>
      ${ex.sets.map((s, si) => `
        <div class="modal-set-row">
          <span class="modal-set-num">${si + 1}</span>
          <span class="modal-set-val">${s.weight} kg</span>
          <span class="modal-set-val">${s.reps} reps</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function deleteHistoryEntry(idx) {
  if (!confirm('Delete this workout from history?')) return;
  state.history.splice(idx, 1);
  saveToStorage();
  renderHistory();
}

// ─── PROGRESS ─────────────────────────────────
function populateExerciseSelect() {
  const sel = document.getElementById('exerciseSelect');
  if (!sel) return;
  const allNames = [];
  Object.values(WORKOUTS).forEach(w => {
    w.exercises.forEach(ex => {
      if (!allNames.includes(ex.name)) allNames.push(ex.name);
    });
  });
  sel.innerHTML = allNames.map(n => `<option value="${n}">${n}</option>`).join('');
}

function renderProgress() {
  const h      = state.history;
  const empty  = document.getElementById('progressEmpty');
  const statsEl= document.getElementById('statsRow');

  if (!h.length) {
    empty.classList.remove('hidden');
    statsEl.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');

  renderStats();
  renderWeeklyChart();
  renderExerciseChart();
}

function renderStats() {
  const h      = state.history;
  const statsEl= document.getElementById('statsRow');

  const totalSessions = h.length;

  // Total volume (kg × reps)
  let totalVol = 0;
  h.forEach(log => {
    log.exercises.forEach(ex => {
      ex.sets.forEach(s => { totalVol += (s.weight || 0) * (s.reps || 0); });
    });
  });

  // Sessions this week
  const now     = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const thisWeek = h.filter(l => new Date(l.date) >= weekAgo).length;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${totalSessions}</div>
      <div class="stat-label">TOTAL SESSIONS</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${thisWeek}</div>
      <div class="stat-label">THIS WEEK</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatVolume(totalVol)}</div>
      <div class="stat-label">TOTAL VOL (t)</div>
    </div>
  `;
}

function formatVolume(kg) {
  if (kg >= 1000) return (kg / 1000).toFixed(1) + 't';
  return kg + 'kg';
}

function renderWeeklyChart() {
  const h = state.history;
  // Build last 8 weeks
  const weeks = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    weeks.push({ start, end, count: 0, label: weekLabel(start) });
  }
  h.forEach(log => {
    const d = new Date(log.date);
    weeks.forEach(w => { if (d >= w.start && d <= w.end) w.count++; });
  });

  const ctx = document.getElementById('chartWeekly').getContext('2d');
  if (chartWeekly) chartWeekly.destroy();
  chartWeekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.label),
      datasets: [{
        data: weeks.map(w => w.count),
        backgroundColor: weeks.map(w => w.count > 0 ? 'rgba(245,166,35,0.7)' : 'rgba(42,42,42,0.5)'),
        borderColor: weeks.map(w => w.count > 0 ? '#f5a623' : '#2a2a2a'),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: chartOptions({ yMax: Math.max(5, ...weeks.map(w => w.count)) + 1 })
  });
}

function renderExerciseChart() {
  const sel = document.getElementById('exerciseSelect');
  if (!sel) return;
  const exName = sel.value;
  const h = state.history;

  // Gather max weight per session for this exercise
  const points = [];
  [...h].reverse().forEach(log => {
    const ex = log.exercises.find(e => e.name === exName);
    if (!ex) return;
    const maxW = Math.max(...ex.sets.map(s => s.weight || 0));
    if (maxW > 0) points.push({ date: formatDate(log.date), weight: maxW });
  });

  const ctx = document.getElementById('chartExercise').getContext('2d');
  if (chartExercise) chartExercise.destroy();

  if (!points.length) {
    chartExercise = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [] }] },
      options: chartOptions({})
    });
    return;
  }

  chartExercise = new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map(p => p.date),
      datasets: [{
        label: exName,
        data: points.map(p => p.weight),
        borderColor: '#f5a623',
        backgroundColor: 'rgba(245,166,35,0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#f5a623',
        pointBorderColor: '#0f0f0f',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.35,
        fill: true,
      }]
    },
    options: chartOptions({ yLabel: 'kg' })
  });
}

function chartOptions({ yMax, yLabel } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1f1f',
        borderColor: '#3a3a3a',
        borderWidth: 1,
        titleColor: '#999',
        bodyColor: '#f0f0f0',
        titleFont: { family: 'Share Tech Mono', size: 11 },
        bodyFont:  { family: 'Share Tech Mono', size: 13 },
        callbacks: {
          label: ctx => ` ${ctx.parsed.y}${yLabel ? ' ' + yLabel : ''}`,
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks: {
          color: '#555',
          font: { family: 'Share Tech Mono', size: 10 },
          maxRotation: 45,
        },
        border: { color: '#2a2a2a' }
      },
      y: {
        grid: { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks: {
          color: '#555',
          font: { family: 'Share Tech Mono', size: 10 },
          stepSize: 1,
        },
        border: { color: '#2a2a2a' },
        max: yMax || undefined,
        beginAtZero: true,
      }
    }
  };
}

function weekLabel(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── TOAST ────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ─── KEYBOARD / A11Y ──────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
