/* =============================================
   WORKOUT TRACKER — app.js
   Program loaded from program.json
   ============================================= */
'use strict';

const DEFAULT_WEIGHTS = {
  'Trap Bar Deadlift':   100,
  'DB Bench Press':       30,
  'Pull Ups':              0,
  'Cable Lateral Raise':  10,
  'Incline DB Curl':      12,
  'Core':                  0,
};

function parseSetsReps(str) {
  // "3x6-8" -> { sets: 3, reps: 8, repRange: "6-8" }
  const [setsStr, repsStr] = str.split('x');
  const sets = parseInt(setsStr);
  const repRange = repsStr;
  const reps = repRange.includes('-')
    ? parseInt(repRange.split('-')[1])
    : parseInt(repRange);
  return { sets, reps, repRange };
}

// ─── STATE ───────────────────────────────────
let SESSIONS = [];   // flat array of {phase, week, workout, exercises[]}
let state = {
  sessionIndex: 0,
  sets:    {},
  history: [],
};
let chartWeekly = null, chartExercise = null;

// ─── STORAGE ─────────────────────────────────
function saveToStorage() {
  try {
    localStorage.setItem('wt_v4', JSON.stringify({
      sessionIndex: state.sessionIndex,
      sets:         state.sets,
      history:      state.history,
    }));
  } catch(e) {}
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('wt_v4');
    if (saved) {
      const p = JSON.parse(saved);
      state.sessionIndex = p.sessionIndex || 0;
      state.sets         = p.sets         || {};
      state.history      = p.history      || [];
    }
  } catch(e) {}
}

// ─── LOAD PROGRAM ────────────────────────────
async function loadProgram() {
  const res  = await fetch('./program.json');
  const data = await res.json();

  // Flatten into ordered session list
  SESSIONS = [];
  data.forEach(week => {
    week.workouts.forEach(workout => {
      const exercises = workout.exercises.map(ex => {
        const { sets, reps, repRange } = parseSetsReps(ex.sets_reps);
        return {
          name:          ex.exercise,
          sets,
          reps,
          repRange,
          defaultWeight: DEFAULT_WEIGHTS[ex.exercise] ?? 0,
        };
      });
      SESSIONS.push({
        phase:    week.phase,
        week:     week.week,
        workout:  workout.name,
        exercises,
      });
    });
  });
}

// ─── HELPERS ─────────────────────────────────
function currentSession() {
  return SESSIONS[Math.min(state.sessionIndex, SESSIONS.length - 1)];
}

function setKey(exName) {
  return `${exName}__${state.sessionIndex}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayISO() { return new Date().toISOString().split('T')[0]; }

function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (el) el.textContent = new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();
}

// ─── TAB NAV ─────────────────────────────────
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
  const sess = currentSession();
  if (!sess) return;
  const { phase, week, workout, exercises } = sess;

  document.getElementById('phaseBadge').textContent    = `${phase.toUpperCase()} · WEEK ${week}`;
  document.getElementById('workoutTitle').textContent   = `WORKOUT ${workout}`;
  document.getElementById('workoutSubtitle').textContent =
    `Session ${state.sessionIndex + 1} of ${SESSIONS.length}`;

  let changed = false;
  exercises.forEach(ex => {
    const k = setKey(ex.name);
    if (!state.sets[k] || state.sets[k].length !== ex.sets) {
      state.sets[k] = Array.from({ length: ex.sets }, () => ({
        weight: ex.defaultWeight, reps: ex.reps, done: false,
      }));
      changed = true;
    }
  });
  if (changed) saveToStorage();

  document.getElementById('exerciseList').innerHTML =
    exercises.map((ex, ei) => renderCard(ex, ei)).join('');
  attachListeners();
}

function renderCard(ex, ei) {
  const sets      = state.sets[setKey(ex.name)] || [];
  const doneCount = sets.filter(s => s.done).length;
  const r = 14, circ = 2 * Math.PI * r;
  const offset = circ - (doneCount / sets.length) * circ;

  const rows = sets.map((s, si) => `
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
    <div class="exercise-card${doneCount === sets.length ? ' all-done' : ''}" id="card-${ei}">
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
      <div class="set-list">${rows}</div>
    </div>`;
}

function attachListeners() {
  document.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const ex = input.dataset.ex, si = parseInt(input.dataset.si), field = input.dataset.field;
      let v = parseFloat(input.value);
      if (isNaN(v))         v = field === 'reps' ? 1 : 0;
      if (field === 'weight') v = Math.max(0, v);
      if (field === 'reps')   v = Math.max(1, Math.round(v));
      input.value = v;
      state.sets[setKey(ex)][si][field] = v;
      saveToStorage();
    });
  });
}

function toggleSet(btn) {
  const ex = btn.dataset.ex, si = parseInt(btn.dataset.si), ei = parseInt(btn.dataset.ei);
  const k  = setKey(ex);
  state.sets[k][si].done = !state.sets[k][si].done;
  saveToStorage();

  const row    = document.getElementById(`row-${ei}-${si}`);
  const isDone = state.sets[k][si].done;
  row.classList.toggle('completed', isDone);
  btn.textContent = isDone ? '✓' : '';

  const all   = state.sets[k];
  const done  = all.filter(s => s.done).length;
  const r = 14, circ = 2 * Math.PI * r, offset = circ - (done / all.length) * circ;
  const card  = document.getElementById(`card-${ei}`);
  card.querySelector('.progress-fill').style.strokeDashoffset = offset;
  card.querySelector('.progress-label').textContent = `${done}/${all.length}`;
  card.classList.toggle('all-done', done === all.length);
}

// ─── FINISH ──────────────────────────────────
function finishWorkout() {
  const { phase, week, workout, exercises } = currentSession();

  state.history.unshift({
    id:           Date.now(),
    date:         todayISO(),
    phase, week, workout,
    sessionIndex: state.sessionIndex,
    exercises: exercises.map(ex => ({
      name:     ex.name,
      repRange: ex.repRange,
      sets:     state.sets[setKey(ex.name)].map(s => ({
        weight: s.weight, reps: s.reps, done: s.done,
      })),
    })),
  });

  if (state.sessionIndex < SESSIONS.length - 1) state.sessionIndex++;
  saveToStorage();
  showToast('WORKOUT SAVED ✓');
  renderHome();
}

function skipWorkout() {
  if (!confirm('Skip this workout?')) return;
  if (state.sessionIndex < SESSIONS.length - 1) state.sessionIndex++;
  saveToStorage();
  renderHome();
}

// ─── HISTORY ─────────────────────────────────
function renderHistory() {
  const h     = state.history;
  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  document.getElementById('historyCount').textContent =
    `${h.length} session${h.length !== 1 ? 's' : ''}`;

  if (!h.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  list.innerHTML = h.map((log, i) => `
    <div class="history-item" id="hist-${i}">
      <div class="history-item-left" onclick="openHistoryModal(${i})" style="flex:1;cursor:pointer;">
        <div class="history-item-date">${formatDate(log.date)}</div>
        <div class="history-item-name">WORKOUT ${log.workout}</div>
        <div class="history-item-meta">${log.exercises.length} exercises · ${log.phase}, Wk ${log.week}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="history-item-arrow" onclick="openHistoryModal(${i})" style="cursor:pointer;">›</div>
        <button class="history-delete-btn" onclick="deleteHistoryEntry(${i})">✕</button>
      </div>
    </div>`).join('');
}

function openHistoryModal(idx) {
  const log = state.history[idx]; if (!log) return;
  document.getElementById('modalDate').textContent  = formatDate(log.date);
  document.getElementById('modalTitle').textContent = `WORKOUT ${log.workout} · ${log.phase}, Wk ${log.week}`;
  document.getElementById('modalBody').innerHTML = log.exercises.map(ex => `
    <div class="modal-exercise">
      <div class="modal-exercise-name">
        ${ex.name}
        <span style="color:var(--text-3);font-size:11px;font-family:var(--font-mono)">${ex.repRange || ''}</span>
      </div>
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
  const names = [...new Set(SESSIONS.flatMap(s => s.exercises.map(e => e.name)))];
  document.getElementById('exerciseSelect').innerHTML =
    names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function renderProgress() {
  const h     = state.history;
  const empty = document.getElementById('progressEmpty');
  const stats = document.getElementById('statsRow');
  if (!h.length) { empty.classList.remove('hidden'); stats.innerHTML = ''; return; }
  empty.classList.add('hidden');
  renderStats();
  renderWeeklyChart();
  renderExerciseChart();
}

function renderStats() {
  const h = state.history;
  let vol = 0;
  h.forEach(log => log.exercises.forEach(ex =>
    ex.sets.forEach(s => { vol += (s.weight || 0) * (s.reps || 0); })
  ));
  const now = new Date(), wa = new Date(now);
  wa.setDate(now.getDate() - 7);
  const tw = h.filter(l => new Date(l.date) >= wa).length;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="stat-value">${h.length}</div><div class="stat-label">TOTAL SESSIONS</div></div>
    <div class="stat-card"><div class="stat-value">${tw}</div><div class="stat-label">THIS WEEK</div></div>
    <div class="stat-card"><div class="stat-value">${fmtVol(vol)}</div><div class="stat-label">TOTAL VOL</div></div>`;
}
function fmtVol(kg) { return kg >= 1000 ? (kg / 1000).toFixed(1) + 't' : kg + 'kg'; }

function renderWeeklyChart() {
  const h = state.history, now = new Date(), weeks = [];
  for (let i = 7; i >= 0; i--) {
    const s = new Date(now); s.setDate(now.getDate() - i * 7);
    const e = new Date(s);   e.setDate(s.getDate() + 6);
    weeks.push({ s, e, n: 0, lbl: s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
  }
  h.forEach(log => { const d = new Date(log.date); weeks.forEach(w => { if (d >= w.s && d <= w.e) w.n++; }); });
  const ctx = document.getElementById('chartWeekly').getContext('2d');
  if (chartWeekly) chartWeekly.destroy();
  chartWeekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.lbl),
      datasets: [{
        data: weeks.map(w => w.n),
        backgroundColor: weeks.map(w => w.n > 0 ? 'rgba(245,166,35,.7)' : 'rgba(42,42,42,.5)'),
        borderColor:     weeks.map(w => w.n > 0 ? '#f5a623' : '#2a2a2a'),
        borderWidth: 1, borderRadius: 4, borderSkipped: false,
      }]
    },
    options: chartOpts({ yMax: Math.max(5, ...weeks.map(w => w.n)) + 1 }),
  });
}

function renderExerciseChart() {
  const name = document.getElementById('exerciseSelect').value;
  const pts  = [];
  [...state.history].reverse().forEach(log => {
    const ex = log.exercises.find(e => e.name === name); if (!ex) return;
    const mx = Math.max(...ex.sets.map(s => s.weight || 0));
    if (mx > 0) pts.push({ d: formatDate(log.date), v: mx });
  });
  const ctx = document.getElementById('chartExercise').getContext('2d');
  if (chartExercise) chartExercise.destroy();
  if (!pts.length) {
    chartExercise = new Chart(ctx, { type: 'line', data: { labels: [], datasets: [{ data: [] }] }, options: chartOpts({}) });
    return;
  }
  chartExercise = new Chart(ctx, {
    type: 'line',
    data: {
      labels: pts.map(p => p.d),
      datasets: [{
        data: pts.map(p => p.v),
        borderColor: '#f5a623', backgroundColor: 'rgba(245,166,35,.08)',
        borderWidth: 2, pointBackgroundColor: '#f5a623', pointBorderColor: '#0f0f0f',
        pointBorderWidth: 2, pointRadius: 5, tension: .35, fill: true,
      }]
    },
    options: chartOpts({ yLabel: 'kg' }),
  });
}

function chartOpts({ yMax, yLabel } = {}) {
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
        callbacks: { label: c => ` ${c.parsed.y}${yLabel ? ' ' + yLabel : ''}` },
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
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ─── BOOT ────────────────────────────────────
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('DOMContentLoaded', async () => {
  loadFromStorage();
  setHeaderDate();
  await loadProgram();
  renderHome();
  renderHistory();
  populateExerciseSelect();
  renderProgress();
});
