/* =============================================
   WORKOUT TRACKER — app.js
   Features: weight suggestion, rest timer,
             plan progress, workout duration,
             weekly summary
   ============================================= */
'use strict';

// ─── CONFIG ──────────────────────────────────
const DEFAULT_WEIGHTS = {
  // Workout A
  'Kniebeugen':               60,
  'Kurzhantel Bankdrücken':   24,
  'Klimmzüge':                 0,
  'Seitheben am Kabel':        8,
  'Leg Curls':                30,
  'Incline Dumbbell Curls':   12,
  'Face Pulls':               15,
  // Workout B
  'Trap Bar Deadlift':       100,
  'Seated Cable Row':         50,
  'Schrägbankdrücken Kurzhantel': 20,
  'Bulgarian Split Squats':   20,
  'Trizeps Pushdowns':        20,
  'Wadenheben':               40,
};
const REST_DEFAULT = 90; // seconds

// ─── GLOBALS ─────────────────────────────────
let SESSIONS = [];
let state = {
  sessionIndex: 0,
  sets:         {},
  history:      [],
};

// Timer state
let durationStart   = null;
let durationTimer   = null;
let restTotal       = REST_DEFAULT;
let restRemaining   = REST_DEFAULT;
let restInterval    = null;

let chartWeekly  = null;
let chartExercise = null;

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

// ─── PARSE ───────────────────────────────────
function parseSetsReps(str) {
  const [setsStr, repsStr] = str.split('x');
  const sets     = parseInt(setsStr);
  const repRange = repsStr;
  const reps     = repRange.includes('-')
    ? parseInt(repRange.split('-')[1])
    : parseInt(repRange);
  return { sets, reps, repRange };
}

// ─── LOAD PROGRAM ────────────────────────────
async function loadProgram() {
  const res  = await fetch('./program.json');
  const data = await res.json();
  SESSIONS   = [];
  data.forEach(week => {
    week.workouts.forEach(workout => {
      SESSIONS.push({
        phase:    week.phase,
        week:     week.week,
        workout:  workout.name,
        exercises: workout.exercises.map(ex => {
          const { sets, reps, repRange } = parseSetsReps(ex.sets_reps);
          return { name: ex.exercise, sets, reps, repRange,
                   defaultWeight: DEFAULT_WEIGHTS[ex.exercise] ?? 0 };
        }),
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

// ─── WEIGHT SUGGESTION ───────────────────────
// Returns the last logged weight for an exercise, or defaultWeight
function suggestedWeight(exName, defaultWeight) {
  for (const log of state.history) {
    const ex = log.exercises.find(e => e.name === exName);
    if (ex && ex.sets.length > 0) {
      const w = ex.sets[0].weight;
      if (w !== undefined) return w;
    }
  }
  return defaultWeight;
}

// ─── WORKOUT DURATION ────────────────────────
function startDurationTimer() {
  if (durationTimer) return; // already running
  durationStart = Date.now();
  const el = document.getElementById('workoutDuration');
  if (el) el.style.display = 'flex';
  durationTimer = setInterval(updateDurationDisplay, 1000);
}
function updateDurationDisplay() {
  if (!durationStart) return;
  const secs  = Math.floor((Date.now() - durationStart) / 1000);
  const m     = Math.floor(secs / 60);
  const s     = secs % 60;
  const el    = document.getElementById('durationVal');
  if (el) el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}
function stopDurationTimer() {
  clearInterval(durationTimer);
  durationTimer = null;
  const elapsed = durationStart ? Math.floor((Date.now() - durationStart) / 1000) : 0;
  durationStart = null;
  const el = document.getElementById('workoutDuration');
  if (el) el.style.display = 'none';
  const valEl = document.getElementById('durationVal');
  if (valEl) valEl.textContent = '0:00';
  return elapsed;
}
function fmtDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── REST TIMER ──────────────────────────────
function startRestTimer(duration = REST_DEFAULT) {
  stopRestTimer();
  restTotal     = duration;
  restRemaining = duration;
  document.getElementById('restTimerOverlay').classList.remove('hidden');
  updateRestDisplay();
  restInterval = setInterval(() => {
    restRemaining--;
    updateRestDisplay();
    if (restRemaining <= 0) stopRestTimer();
  }, 1000);
}
function updateRestDisplay() {
  document.getElementById('restTimerDisplay').textContent = restRemaining;
  const circ   = 2 * Math.PI * 54; // r=54
  const offset = circ * (1 - restRemaining / restTotal);
  document.getElementById('restRingFill').style.strokeDashoffset = offset;
  // Pulse colour when low
  const fill = document.getElementById('restRingFill');
  if (restRemaining <= 10) fill.style.stroke = '#e05555';
  else                      fill.style.stroke = '#f5a623';
}
function stopRestTimer() {
  clearInterval(restInterval);
  restInterval = null;
  document.getElementById('restTimerOverlay').classList.add('hidden');
}
function adjustRestTimer(delta) {
  restRemaining = Math.max(5, restRemaining + delta);
  restTotal     = Math.max(restTotal, restRemaining);
  updateRestDisplay();
}

// ─── PLAN PROGRESS ───────────────────────────
function renderPlanProgress() {
  const total   = SESSIONS.length;
  const current = Math.min(state.sessionIndex, total - 1);
  const pct     = Math.round((current / total) * 100);

  document.getElementById('planProgressPct').textContent  = `${pct}%`;
  document.getElementById('planProgressFill').style.width = `${pct}%`;

  // Build phase blocks
  // Group sessions by phase
  const phases = [];
  let lastPhase = null;
  SESSIONS.forEach((s, i) => {
    if (s.phase !== lastPhase) {
      phases.push({ phase: s.phase, start: i, end: i });
      lastPhase = s.phase;
    } else {
      phases[phases.length - 1].end = i;
    }
  });

  const blocksEl = document.getElementById('planPhaseBlocks');
  blocksEl.innerHTML = phases.map(p => {
    const isDone   = current > p.end;
    const isActive = current >= p.start && current <= p.end;
    const cls      = isDone ? 'done' : isActive ? 'active' : '';
    // Short label
    const label = p.phase === 'Peak / Performance' ? 'PEAK' :
                  p.phase === 'Hypertrophy'         ? 'HYP'  :
                  p.phase === 'Strength'             ? 'STR'  : p.phase.slice(0,3).toUpperCase();
    return `<div class="phase-block ${cls}">${label}</div>`;
  }).join('');
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
  const sess = currentSession(); if (!sess) return;
  const { phase, week, workout, exercises } = sess;

  document.getElementById('phaseBadge').textContent     = `${phase.toUpperCase()} · WEEK ${week}`;
  document.getElementById('workoutTitle').textContent    = `WORKOUT ${workout}`;
  document.getElementById('workoutSubtitle').textContent =
    `Session ${state.sessionIndex + 1} of ${SESSIONS.length}`;

  // Init sets using last-session weight suggestion
  let changed = false;
  exercises.forEach(ex => {
    const k = setKey(ex.name);
    if (!state.sets[k] || state.sets[k].length !== ex.sets) {
      const suggested = suggestedWeight(ex.name, ex.defaultWeight);
      state.sets[k] = Array.from({ length: ex.sets }, () => ({
        weight: suggested, reps: ex.reps, done: false,
      }));
      changed = true;
    }
  });
  if (changed) saveToStorage();

  document.getElementById('exerciseList').innerHTML =
    exercises.map((ex, ei) => renderCard(ex, ei)).join('');

  renderPlanProgress();
  attachListeners();
}

function renderCard(ex, ei) {
  const sets      = state.sets[setKey(ex.name)] || [];
  const doneCount = sets.filter(s => s.done).length;
  const r = 14, circ = 2 * Math.PI * r;
  const offset = circ - (doneCount / sets.length) * circ;

  // Check if this exercise has a suggestion different from default
  const suggested = suggestedWeight(ex.name, ex.defaultWeight);
  const hasHint   = suggested !== ex.defaultWeight;
  const hintHtml  = hasHint
    ? `<span class="weight-hint">↑ last: ${suggested} kg</span>`
    : '';

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
          <div class="exercise-schema">${ex.sets} × ${ex.repRange} ${hintHtml}</div>
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
      if (isNaN(v))           v = field === 'reps' ? 1 : 0;
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

  // Start duration timer on first set check
  if (state.sets[k][si].done && !durationTimer) startDurationTimer();

  const row    = document.getElementById(`row-${ei}-${si}`);
  const isDone = state.sets[k][si].done;
  row.classList.toggle('completed', isDone);
  btn.textContent = isDone ? '✓' : '';

  // Start rest timer after completing a set
  if (isDone) startRestTimer(REST_DEFAULT);

  const all  = state.sets[k];
  const done = all.filter(s => s.done).length;
  const r = 14, circ = 2 * Math.PI * r, offset = circ - (done / all.length) * circ;
  const card = document.getElementById(`card-${ei}`);
  card.querySelector('.progress-fill').style.strokeDashoffset = offset;
  card.querySelector('.progress-label').textContent = `${done}/${all.length}`;
  card.classList.toggle('all-done', done === all.length);
}

// ─── FINISH ──────────────────────────────────
function finishWorkout() {
  const { phase, week, workout, exercises } = currentSession();
  const duration = stopDurationTimer();

  state.history.unshift({
    id:           Date.now(),
    date:         todayISO(),
    phase, week, workout,
    sessionIndex: state.sessionIndex,
    duration,
    exercises: exercises.map(ex => ({
      name:     ex.name,
      repRange: ex.repRange,
      sets:     state.sets[setKey(ex.name)].map(s => ({
        weight: s.weight, reps: s.reps, done: s.done,
      })),
    })),
  });

  if (state.sessionIndex < SESSIONS.length - 1) state.sessionIndex++;
  stopRestTimer();
  saveToStorage();
  showToast('WORKOUT SAVED ✓');
  renderHome();
}

function skipWorkout() {
  if (!confirm('Skip this workout?')) return;
  stopDurationTimer();
  stopRestTimer();
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

  renderWeeklySummary();

  if (!h.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  list.innerHTML = h.map((log, i) => {
    const dur = log.duration ? `<div class="history-item-dur">◷ ${fmtDuration(log.duration)}</div>` : '';
    return `
    <div class="history-item" id="hist-${i}">
      <div class="history-item-left" onclick="openHistoryModal(${i})" style="flex:1;cursor:pointer;">
        <div class="history-item-date">${formatDate(log.date)}</div>
        <div class="history-item-name">WORKOUT ${log.workout}</div>
        <div class="history-item-meta">${log.exercises.length} exercises · ${log.phase}, Wk ${log.week}</div>
        ${dur}
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="history-item-arrow" onclick="openHistoryModal(${i})" style="cursor:pointer;">›</div>
        <button class="history-delete-btn" onclick="deleteHistoryEntry(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

// ─── WEEKLY SUMMARY ──────────────────────────
function renderWeeklySummary() {
  const card = document.getElementById('weeklySummary');
  const h    = state.history;
  if (!h.length) { card.style.display = 'none'; return; }

  const now     = new Date();
  const monday  = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const thisWeek = h.filter(l => new Date(l.date) >= monday);

  if (!thisWeek.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const sessions  = thisWeek.length;
  let   totalVol  = 0;
  let   totalSecs = 0;
  thisWeek.forEach(log => {
    totalSecs += log.duration || 0;
    log.exercises.forEach(ex =>
      ex.sets.forEach(s => { totalVol += (s.weight || 0) * (s.reps || 0); })
    );
  });

  const avgDur = sessions > 0 && totalSecs > 0
    ? fmtDuration(Math.round(totalSecs / sessions))
    : '—';

  document.getElementById('weeklySummaryStats').innerHTML = `
    <div class="wsstat">
      <div class="wsstat-val">${sessions}</div>
      <div class="wsstat-lbl">SESSIONS</div>
    </div>
    <div class="wsstat">
      <div class="wsstat-val">${fmtVol(totalVol)}</div>
      <div class="wsstat-lbl">VOLUME</div>
    </div>
    <div class="wsstat">
      <div class="wsstat-val">${avgDur}</div>
      <div class="wsstat-lbl">AVG DUR</div>
    </div>`;
}

function openHistoryModal(idx) {
  const log = state.history[idx]; if (!log) return;
  document.getElementById('modalDate').textContent  = formatDate(log.date);
  document.getElementById('modalTitle').textContent =
    `WORKOUT ${log.workout} · ${log.phase}, Wk ${log.week}`;
  const durLine = log.duration
    ? `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);margin-bottom:12px">◷ ${fmtDuration(log.duration)}</div>`
    : '';
  document.getElementById('modalBody').innerHTML = durLine + log.exercises.map(ex => `
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
  const h = state.history;
  const empty = document.getElementById('progressEmpty');
  const stats = document.getElementById('statsRow');
  if (!h.length) { empty.classList.remove('hidden'); stats.innerHTML = ''; return; }
  empty.classList.add('hidden');
  renderStats(); renderWeeklyChart(); renderExerciseChart();
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

// ─── WEIGHT HINT CSS (injected once) ─────────
function injectWeightHintStyle() {
  const s = document.createElement('style');
  s.textContent = `.weight-hint{font-family:var(--font-mono);font-size:10px;color:var(--accent);opacity:.7;margin-left:4px;}`;
  document.head.appendChild(s);
}

// ─── BOOT ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); stopRestTimer(); }
});

document.addEventListener('DOMContentLoaded', async () => {
  loadFromStorage();
  setHeaderDate();
  injectWeightHintStyle();
  await loadProgram();
  renderHome();
  renderHistory();
  populateExerciseSelect();
  renderProgress();
});
