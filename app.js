/* =============================================
   WORKOUT TRACKER — app.js
   12-Week Program: Hypertrophy → Strength → Peak
   ============================================= */
'use strict';

// ─── FULL 12-WEEK TRAINING PLAN ──────────────
const PLAN = {
  "Hypertrophy": {
    1: {
      A: [
        { name: "Trap Bar Deadlift",   sets: 3, reps: 8,  repRange: "6-8",   defaultWeight: 100 },
        { name: "DB Bench Press",      sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 30  },
        { name: "Pull Ups",            sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 15, repRange: "12-15", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 12, repRange: "10-12", defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 15, repRange: "12-15", defaultWeight: 0   },
      ],
      B: [
        { name: "DB Bench Press",      sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 30  },
        { name: "Pull Ups",            sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 15, repRange: "12-15", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 12, repRange: "10-12", defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 15, repRange: "12-15", defaultWeight: 0   },
      ],
      C: [
        { name: "Trap Bar Deadlift",   sets: 3, reps: 8,  repRange: "6-8",   defaultWeight: 100 },
        { name: "Pull Ups",            sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 15, repRange: "12-15", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 12, repRange: "10-12", defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 15, repRange: "12-15", defaultWeight: 0   },
      ],
    },
  },
  "Strength": {
    5: {
      A: [
        { name: "Trap Bar Deadlift",   sets: 4, reps: 6,  repRange: "4-6",   defaultWeight: 100 },
        { name: "DB Bench Press",      sets: 4, reps: 8,  repRange: "6-8",   defaultWeight: 30  },
        { name: "Pull Ups",            sets: 4, reps: 8,  repRange: "6-8",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
      B: [
        { name: "DB Bench Press",      sets: 4, reps: 8,  repRange: "6-8",   defaultWeight: 30  },
        { name: "Pull Ups",            sets: 4, reps: 8,  repRange: "6-8",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
      C: [
        { name: "Trap Bar Deadlift",   sets: 4, reps: 6,  repRange: "4-6",   defaultWeight: 100 },
        { name: "Pull Ups",            sets: 4, reps: 8,  repRange: "6-8",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
    },
  },
  "Peak / Performance": {
    9: {
      A: [
        { name: "Trap Bar Deadlift",   sets: 3, reps: 5,  repRange: "3-5",   defaultWeight: 100 },
        { name: "DB Bench Press",      sets: 3, reps: 6,  repRange: "5-6",   defaultWeight: 30  },
        { name: "Pull Ups",            sets: 3, reps: 6,  repRange: "5-6",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
      B: [
        { name: "DB Bench Press",      sets: 3, reps: 6,  repRange: "5-6",   defaultWeight: 30  },
        { name: "Pull Ups",            sets: 3, reps: 6,  repRange: "5-6",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
      C: [
        { name: "Trap Bar Deadlift",   sets: 3, reps: 5,  repRange: "3-5",   defaultWeight: 100 },
        { name: "Pull Ups",            sets: 3, reps: 6,  repRange: "5-6",   defaultWeight: 0   },
        { name: "Cable Lateral Raise", sets: 3, reps: 12, repRange: "10-12", defaultWeight: 10  },
        { name: "Incline DB Curl",     sets: 3, reps: 10, repRange: "8-10",  defaultWeight: 12  },
        { name: "Core",                sets: 3, reps: 12, repRange: "10-12", defaultWeight: 0   },
      ],
    },
  },
};

// Fill weeks 2-4 from week 1 (Hypertrophy), 6-8 from week 5 (Strength), 10-12 from week 9 (Peak)
[2,3,4].forEach(w => { PLAN["Hypertrophy"][w] = PLAN["Hypertrophy"][1]; });
[6,7,8].forEach(w => { PLAN["Strength"][w]    = PLAN["Strength"][5]; });
[10,11,12].forEach(w => { PLAN["Peak / Performance"][w] = PLAN["Peak / Performance"][9]; });

// Ordered sequence of all sessions: phase, week, workout
const SESSION_SEQUENCE = [];
const PHASE_ORDER = ["Hypertrophy", "Strength", "Peak / Performance"];
const WORKOUT_ORDER = ["A", "B", "C"];
PHASE_ORDER.forEach(phase => {
  Object.keys(PLAN[phase]).map(Number).sort((a,b)=>a-b).forEach(week => {
    WORKOUT_ORDER.forEach(wk => {
      SESSION_SEQUENCE.push({ phase, week, workout: wk });
    });
  });
});

// ─── STATE ───────────────────────────────────
let state = {
  sessionIndex: 0,   // index into SESSION_SEQUENCE
  sets: {},          // exerciseName -> [{weight, reps, done}]
  history: [],
};

let chartWeekly   = null;
let chartExercise = null;

// ─── STORAGE ─────────────────────────────────
function saveToStorage() {
  try {
    localStorage.setItem('ironlog_v3', JSON.stringify({
      sessionIndex: state.sessionIndex,
      sets:         state.sets,
      history:      state.history,
    }));
  } catch(e) { console.warn('Save error', e); }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('ironlog_v3');
    if (saved) {
      const p = JSON.parse(saved);
      state.sessionIndex = p.sessionIndex || 0;
      state.sets         = p.sets         || {};
      state.history      = p.history      || [];
    }
  } catch(e) { console.warn('Load error', e); }
}

// ─── CURRENT SESSION HELPERS ─────────────────
function currentSession() {
  const idx = Math.min(state.sessionIndex, SESSION_SEQUENCE.length - 1);
  return SESSION_SEQUENCE[idx];
}

function currentExercises() {
  const { phase, week, workout } = currentSession();
  return PLAN[phase][week][workout];
}

// ─── DATE HELPERS ────────────────────────────
function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

// ─── TAB NAVIGATION ──────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen' + tab).classList.add('active');
  document.getElementById('nav' + tab).classList.add('active');
  if (tab === 'History')  renderHistory();
  if (tab === 'Progress') renderProgress();
}

// ─── HOME ────────────────────────────────────
function renderHome() {
  const { phase, week, workout } = currentSession();
  const exercises = currentExercises();

  document.getElementById('phaseBadge').textContent   = `${phase.toUpperCase()} · WEEK ${week}`;
  document.getElementById('workoutTitle').textContent  = `WORKOUT ${workout}`;
  document.getElementById('workoutSubtitle').textContent = `Session ${state.sessionIndex + 1} of ${SESSION_SEQUENCE.length}`;

  // Init sets for any missing exercise
  let changed = false;
  exercises.forEach(ex => {
    if (!state.sets[ex.name + '_' + state.sessionIndex] ||
        state.sets[ex.name + '_' + state.sessionIndex].length !== ex.sets) {
      state.sets[ex.name + '_' + state.sessionIndex] = Array.from({ length: ex.sets }, () => ({
        weight: ex.defaultWeight,
        reps:   ex.reps,
        done:   false,
      }));
      changed = true;
    }
  });
  if (changed) saveToStorage();

  document.getElementById('exerciseList').innerHTML =
    exercises.map((ex, ei) => renderExerciseCard(ex, ei)).join('');

  attachSetListeners();
}

function setKey(exName) {
  return exName + '_' + state.sessionIndex;
}

function renderExerciseCard(ex, ei) {
  const sets      = state.sets[setKey(ex.name)] || [];
  const doneCount = sets.filter(s => s.done).length;
  const allDone   = doneCount === sets.length;
  const r         = 14;
  const circ      = 2 * Math.PI * r;
  const offset    = circ - (doneCount / sets.length) * circ;

  const setRows = sets.map((s, si) => `
    <div class="set-row${s.done ? ' completed' : ''}" id="row-${ei}-${si}">
      <div class="set-number">${si + 1}</div>
      <div class="set-input-group">
        <span class="set-input-label">KG</span>
        <input class="set-input" type="number" inputmode="decimal" min="0" step="0.5"
          value="${s.weight}" data-ex="${ex.name}" data-si="${si}" data-field="weight"/>
      </div>
      <div class="set-input-group">
        <span class="set-input-label">REPS</span>
        <input class="set-input" type="number" inputmode="numeric" min="1" step="1"
          value="${s.reps}" data-ex="${ex.name}" data-si="${si}" data-field="reps"/>
      </div>
      <button class="set-check" data-ex="${ex.name}" data-si="${si}" data-ei="${ei}"
        onclick="toggleSet(this)">${s.done ? '✓' : ''}</button>
    </div>`).join('');

  return `
    <div class="exercise-card${allDone ? ' all-done' : ''}" id="card-${ei}">
      <div class="exercise-card-header">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-schema">${ex.sets} × ${ex.repRange}</div>
        </div>
        <div class="exercise-progress-ring">
          <svg viewBox="0 0 36 36">
            <circle class="progress-bg"   cx="18" cy="18" r="${r}" stroke-width="3"/>
            <circle class="progress-fill" cx="18" cy="18" r="${r}" stroke-width="3"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="progress-label">${doneCount}/${sets.length}</div>
        </div>
      </div>
      <div class="set-list">${setRows}</div>
    </div>`;
}

function attachSetListeners() {
  document.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const ex    = input.dataset.ex;
      const si    = parseInt(input.dataset.si);
      const field = input.dataset.field;
      let val     = parseFloat(input.value);
      if (isNaN(val))         val = field === 'reps' ? 1 : 0;
      if (field === 'weight') val = Math.max(0, val);
      if (field === 'reps')   val = Math.max(1, Math.round(val));
      input.value = val;
      state.sets[setKey(ex)][si][field] = val;
      saveToStorage();
    });
  });
}

function toggleSet(btn) {
  const ex = btn.dataset.ex;
  const si = parseInt(btn.dataset.si);
  const ei = parseInt(btn.dataset.ei);
  const key = setKey(ex);
  state.sets[key][si].done = !state.sets[key][si].done;
  saveToStorage();

  const row    = document.getElementById(`row-${ei}-${si}`);
  const isDone = state.sets[key][si].done;
  row.classList.toggle('completed', isDone);
  btn.textContent = isDone ? '✓' : '';

  const allSets = state.sets[key];
  const done    = allSets.filter(s => s.done).length;
  const total   = allSets.length;
  const r       = 14;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (done / total) * circ;
  const card    = document.getElementById(`card-${ei}`);
  const fill    = card.querySelector('.progress-fill');
  const label   = card.querySelector('.progress-label');
  if (fill)  fill.style.strokeDashoffset = offset;
  if (label) label.textContent = `${done}/${total}`;
  card.classList.toggle('all-done', done === total);
}

// ─── FINISH WORKOUT ──────────────────────────
function finishWorkout() {
  const { phase, week, workout } = currentSession();
  const exercises = currentExercises();

  const log = {
    id:        Date.now(),
    date:      todayISO(),
    phase,
    week,
    workout,
    sessionIndex: state.sessionIndex,
    exercises: exercises.map(ex => ({
      name: ex.name,
      repRange: ex.repRange,
      sets: state.sets[setKey(ex.name)].map(s => ({
        weight: s.weight, reps: s.reps, done: s.done,
      })),
    })),
  };

  state.history.unshift(log);

  // Advance to next session
  if (state.sessionIndex < SESSION_SEQUENCE.length - 1) {
    state.sessionIndex++;
  }

  saveToStorage();
  showToast('WORKOUT SAVED ✓');
  renderHome();
}

function skipWorkout() {
  if (!confirm('Skip this workout and move to the next one?')) return;
  if (state.sessionIndex < SESSION_SEQUENCE.length - 1) {
    state.sessionIndex++;
  }
  saveToStorage();
  renderHome();
}

// ─── HISTORY ─────────────────────────────────
function renderHistory() {
  const h       = state.history;
  const countEl = document.getElementById('historyCount');
  const list    = document.getElementById('historyList');
  const empty   = document.getElementById('historyEmpty');

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
        <div class="history-item-name">WORKOUT ${log.workout}</div>
        <div class="history-item-meta">${log.exercises.length} exercises · ${log.phase}, Wk ${log.week}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="history-item-arrow" onclick="openHistoryModal(${i})" style="cursor:pointer;">›</div>
        <button class="history-delete-btn" onclick="deleteHistoryEntry(${i})" aria-label="Delete">✕</button>
      </div>
    </div>`).join('');
}

function openHistoryModal(idx) {
  const log = state.history[idx];
  if (!log) return;
  document.getElementById('modalDate').textContent  = formatDate(log.date);
  document.getElementById('modalTitle').textContent = `WORKOUT ${log.workout} · ${log.phase}, Wk ${log.week}`;
  document.getElementById('modalBody').innerHTML = log.exercises.map(ex => `
    <div class="modal-exercise">
      <div class="modal-exercise-name">${ex.name} <span style="color:var(--text-3);font-size:11px;font-family:var(--font-mono)">${ex.repRange || ''}</span></div>
      ${ex.sets.map((s, si) => `
        <div class="modal-set-row">
          <span class="modal-set-num">${si + 1}</span>
          <span class="modal-set-val">${s.weight} kg</span>
          <span class="modal-set-val">${s.reps} reps</span>
        </div>`).join('')}
    </div>`).join('');
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

// ─── PROGRESS ────────────────────────────────
function populateExerciseSelect() {
  const names = [];
  Object.values(PLAN).forEach(phases =>
    Object.values(phases).forEach(weeks =>
      Object.values(weeks).forEach(exList =>
        exList.forEach(ex => { if (!names.includes(ex.name)) names.push(ex.name); })
      )
    )
  );
  document.getElementById('exerciseSelect').innerHTML =
    names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function renderProgress() {
  const h     = state.history;
  const empty = document.getElementById('progressEmpty');
  const stats = document.getElementById('statsRow');

  if (!h.length) {
    empty.classList.remove('hidden');
    stats.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');
  renderStats();
  renderWeeklyChart();
  renderExerciseChart();
}

function renderStats() {
  const h = state.history;
  let totalVol = 0;
  h.forEach(log => log.exercises.forEach(ex =>
    ex.sets.forEach(s => { totalVol += (s.weight || 0) * (s.reps || 0); })
  ));
  const now = new Date(), weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const thisWeek = h.filter(l => new Date(l.date) >= weekAgo).length;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="stat-value">${h.length}</div><div class="stat-label">TOTAL SESSIONS</div></div>
    <div class="stat-card"><div class="stat-value">${thisWeek}</div><div class="stat-label">THIS WEEK</div></div>
    <div class="stat-card"><div class="stat-value">${formatVolume(totalVol)}</div><div class="stat-label">TOTAL VOL</div></div>`;
}

function formatVolume(kg) {
  return kg >= 1000 ? (kg / 1000).toFixed(1) + 't' : kg + 'kg';
}

function renderWeeklyChart() {
  const h = state.history, now = new Date(), weeks = [];
  for (let i = 7; i >= 0; i--) {
    const s = new Date(now); s.setDate(now.getDate() - i * 7);
    const e = new Date(s);   e.setDate(s.getDate() + 6);
    weeks.push({ start: s, end: e, count: 0,
      label: s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
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
        backgroundColor: weeks.map(w => w.count > 0 ? 'rgba(245,166,35,.7)' : 'rgba(42,42,42,.5)'),
        borderColor:     weeks.map(w => w.count > 0 ? '#f5a623' : '#2a2a2a'),
        borderWidth: 1, borderRadius: 4, borderSkipped: false,
      }]
    },
    options: chartOptions({ yMax: Math.max(5, ...weeks.map(w => w.count)) + 1 }),
  });
}

function renderExerciseChart() {
  const sel    = document.getElementById('exerciseSelect');
  const exName = sel.value;
  const points = [];

  [...state.history].reverse().forEach(log => {
    const ex = log.exercises.find(e => e.name === exName);
    if (!ex) return;
    const maxW = Math.max(...ex.sets.map(s => s.weight || 0));
    if (maxW > 0) points.push({ date: formatDate(log.date), weight: maxW });
  });

  const ctx = document.getElementById('chartExercise').getContext('2d');
  if (chartExercise) chartExercise.destroy();

  if (!points.length) {
    chartExercise = new Chart(ctx, { type: 'line', data: { labels: [], datasets: [{ data: [] }] }, options: chartOptions({}) });
    return;
  }

  chartExercise = new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map(p => p.date),
      datasets: [{
        data: points.map(p => p.weight),
        borderColor: '#f5a623', backgroundColor: 'rgba(245,166,35,.08)',
        borderWidth: 2, pointBackgroundColor: '#f5a623', pointBorderColor: '#0f0f0f',
        pointBorderWidth: 2, pointRadius: 5, tension: .35, fill: true,
      }]
    },
    options: chartOptions({ yLabel: 'kg' }),
  });
}

function chartOptions({ yMax, yLabel } = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1f1f', borderColor: '#3a3a3a', borderWidth: 1,
        titleColor: '#999', bodyColor: '#f0f0f0',
        titleFont: { family: 'Share Tech Mono', size: 11 },
        bodyFont:  { family: 'Share Tech Mono', size: 13 },
        callbacks: { label: ctx => ` ${ctx.parsed.y}${yLabel ? ' ' + yLabel : ''}` },
      }
    },
    scales: {
      x: { grid: { color: 'rgba(42,42,42,.5)', drawTicks: false }, ticks: { color: '#555', font: { family: 'Share Tech Mono', size: 10 }, maxRotation: 45 }, border: { color: '#2a2a2a' } },
      y: { grid: { color: 'rgba(42,42,42,.5)', drawTicks: false }, ticks: { color: '#555', font: { family: 'Share Tech Mono', size: 10 }, stepSize: 1 }, border: { color: '#2a2a2a' }, max: yMax || undefined, beginAtZero: true },
    },
  };
}

// ─── TOAST ───────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ─── BOOT ────────────────────────────────────
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setHeaderDate();
  renderHome();
  renderHistory();
  populateExerciseSelect();
  renderProgress();
});
