// ─────────────────────────────────────────────
//  WORKOUT TRACKER — app.js
//  Stack: Vanilla JS + LocalStorage + Chart.js
// ─────────────────────────────────────────────

// ─── STORAGE KEYS ─────────────────────────────
const KEY_HISTORY = 'ironlog_history';
const KEY_WORKOUT = 'ironlog_currentWorkout';
const KEY_SETS    = 'ironlog_currentSets';

// ─── WORKOUT PLAN ─────────────────────────────
// Basiert auf deinen tatsächlichen Übungen aus dem Export.
// Wadenheben entfernt.
const WORKOUTS = {
  A: [
    { name: 'Kniebeugen',       sets: 3, reps: 8,  defaultWeight: 70   },
    { name: 'KH-Bankdrücken',   sets: 3, reps: 8,  defaultWeight: 25   },
    { name: 'Klimmzüge',        sets: 3, reps: 8,  defaultWeight: 0    },
    { name: 'Seitheben Kabel',  sets: 3, reps: 12, defaultWeight: 3.75 },
    { name: 'Leg Curls',        sets: 3, reps: 12, defaultWeight: 25   },
    { name: 'Incline KH-Curls', sets: 3, reps: 12, defaultWeight: 10   },
    { name: 'Face Pulls',       sets: 3, reps: 12, defaultWeight: 20   },
  ],
  B: [
    { name: 'Trap Bar Deadlift',      sets: 3, reps: 8,  defaultWeight: 80   },
    { name: 'Seated Cable Row',       sets: 3, reps: 8,  defaultWeight: 69   },
    { name: 'Schrägbank KH-Drücken', sets: 3, reps: 8,  defaultWeight: 25   },
    { name: 'Bulgarian Split Squats', sets: 3, reps: 10, defaultWeight: 15   },
    { name: 'Seitheben Kabel',        sets: 3, reps: 12, defaultWeight: 3.75 },
    { name: 'Trizeps Pushdowns',      sets: 3, reps: 12, defaultWeight: 25   },
  ],
};

// ─── STATE ────────────────────────────────────
const state = {
  currentWorkout: 'A',
  currentWeek:    1,
  sets:           {},
  history:        [],
};

// ─── STORAGE ──────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) state.history = parsed;
    }
  } catch (e) { console.warn('History load failed:', e); }

  try {
    const raw = localStorage.getItem(KEY_WORKOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.currentWorkout) state.currentWorkout = parsed.currentWorkout;
      if (parsed.currentWeek)    state.currentWeek    = parsed.currentWeek;
    }
  } catch (e) { console.warn('Workout state load failed:', e); }

  try {
    const raw = localStorage.getItem(KEY_SETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') state.sets = parsed;
    }
  } catch (e) { console.warn('Sets load failed:', e); }

  initSetsIfNeeded();
}

function saveWorkoutState() {
  localStorage.setItem(KEY_WORKOUT, JSON.stringify({
    currentWorkout: state.currentWorkout,
    currentWeek:    state.currentWeek,
  }));
  localStorage.setItem(KEY_SETS, JSON.stringify(state.sets));
}

function saveHistory() {
  localStorage.setItem(KEY_HISTORY, JSON.stringify(state.history));
}

// ─── MIGRATION AUS ALTEM EXPORT-FORMAT ────────
//
// Altes Format: { sessionIndex, sets: { "Übung__sessionIdx": [...] }, history: [...] }
// Neues Format: ironlog_* keys
//
function importFromExport(exportData) {
  try {
    const data = typeof exportData === 'string' ? JSON.parse(exportData) : exportData;

    if (Array.isArray(data.history)) {
      const migrated = data.history.map(log => ({
        id:        log.id  ?? Date.now() + Math.random(),
        date:      log.date ?? new Date().toISOString().split('T')[0],
        workout:   log.workout ?? 'A',
        week:      log.week    ?? 1,
        phase:     log.phase   ?? null,
        exercises: (log.exercises ?? []).map(ex => ({
          name: ex.name,
          sets: (ex.sets ?? []).map(s => ({
            weight: Number(s.weight) || 0,
            reps:   Number(s.reps)   || 0,
            done:   Boolean(s.done),
          })),
        })),
      }));
      migrated.sort((a, b) => new Date(a.date) - new Date(b.date));
      state.history = migrated;
    }

    if (data.sessionIndex !== undefined) {
      state.currentWorkout = data.sessionIndex % 2 === 0 ? 'A' : 'B';
      state.currentWeek    = Math.floor(data.sessionIndex / 2) + 1;
    }

    const currentIdx = data.sessionIndex ?? 0;
    const newSets = {};
    if (data.sets && typeof data.sets === 'object') {
      Object.entries(data.sets).forEach(([key, sets]) => {
        const lastDunder   = key.lastIndexOf('__');
        const sessionIdx   = parseInt(key.slice(lastDunder + 2), 10);
        const exerciseName = key.slice(0, lastDunder);
        if (sessionIdx === currentIdx && exerciseName !== 'Wadenheben') {
          newSets[exerciseName] = sets.map(s => ({
            weight: Number(s.weight) || 0,
            reps:   Number(s.reps)   || 0,
            done:   Boolean(s.done),
          }));
        }
      });
    }
    state.sets = newSets;

    initSetsIfNeeded();
    saveHistory();
    saveWorkoutState();
    return { success: true, sessions: state.history.length };
  } catch (e) {
    console.error('Import failed:', e);
    return { success: false, error: e.message };
  }
}

// ─── SETS INITIALISIERUNG ─────────────────────

function initSetsIfNeeded() {
  WORKOUTS[state.currentWorkout].forEach(ex => {
    if (!state.sets[ex.name]) state.sets[ex.name] = buildDefaultSets(ex);
  });
}

function buildDefaultSets(exercise) {
  const lastWeight = getLastWeight(exercise.name) ?? exercise.defaultWeight;
  return Array.from({ length: exercise.sets }, () => ({
    weight: lastWeight,
    reps:   exercise.reps,
    done:   false,
  }));
}

function getLastWeight(exerciseName) {
  for (let i = state.history.length - 1; i >= 0; i--) {
    const ex = state.history[i].exercises?.find(e => e.name === exerciseName);
    if (ex?.sets?.length > 0) return ex.sets[ex.sets.length - 1].weight;
  }
  return null;
}

// ─── TAB NAVIGATION ──────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen' + tab).classList.add('active');
  document.getElementById('nav' + tab).classList.add('active');
  if (tab === 'Progress') renderProgress();
}

// ─── HEADER DATE ─────────────────────────────

function setHeaderDate() {
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ─── HOME SCREEN ─────────────────────────────

function renderHome() {
  const exercises = WORKOUTS[state.currentWorkout];

  // Badges & titles
  document.getElementById('phaseBadge').textContent    = `WEEK ${state.currentWeek}`;
  document.getElementById('workoutTitle').textContent  = `WORKOUT ${state.currentWorkout}`;
  document.getElementById('workoutSubtitle').textContent =
    `${exercises.length} exercises · ${exercises.reduce((s, e) => s + e.sets, 0)} sets`;

  // Exercise list
  document.getElementById('exerciseList').innerHTML =
    exercises.map(ex => renderExerciseCard(ex)).join('');

  // Inject import button into finish-zone if not yet there
  let importBtn = document.getElementById('btnImport');
  if (!importBtn) {
    const zone = document.querySelector('.finish-zone');
    importBtn = document.createElement('button');
    importBtn.id = 'btnImport';
    importBtn.className = 'btn-import';
    importBtn.textContent = '↑ IMPORT DATA';
    importBtn.onclick = triggerImport;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'importFileInput';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = e => handleImportFile(e.target);
    zone.appendChild(importBtn);
    zone.appendChild(fileInput);
  }

  updateAllRings();
}

function renderExerciseCard(exercise) {
  const sets      = state.sets[exercise.name] ?? buildDefaultSets(exercise);
  const doneCount = sets.filter(s => s.done).length;
  const circ      = 2 * Math.PI * 14;
  return `
    <div class="exercise-card ${doneCount === sets.length ? 'completed' : ''}" id="card-${sid(exercise.name)}">
      <div class="exercise-card-header">
        <div class="exercise-name">${exercise.name}</div>
        <div class="ring-wrap">
          <div class="exercise-meta">${exercise.sets} × ${exercise.reps} reps</div>
          <svg class="progress-ring" viewBox="0 0 32 32">
            <circle class="ring-bg"   cx="16" cy="16" r="14"/>
            <circle class="ring-fill" cx="16" cy="16" r="14"
              id="ring-${sid(exercise.name)}"
              style="stroke-dasharray:${circ};stroke-dashoffset:${circ}"/>
          </svg>
        </div>
      </div>
      <div class="sets-container">
        ${sets.map((set, i) => renderSetRow(exercise.name, set, i)).join('')}
      </div>
    </div>
  `;
}

function renderSetRow(exerciseName, set, index) {
  const id = `${sid(exerciseName)}-${index}`;
  return `
    <div class="set-row ${set.done ? 'done' : ''}" id="row-${id}">
      <span class="set-num">${index + 1}</span>
      <div class="set-input-group">
        <input class="set-input" type="number" min="0" step="0.5"
          value="${set.weight}"
          onchange="updateSet('${exerciseName}', ${index}, 'weight', this.value)"
          inputmode="decimal" />
        <span class="set-unit">kg</span>
      </div>
      <div class="set-input-group">
        <input class="set-input" type="number" min="1" step="1"
          value="${set.reps}"
          onchange="updateSet('${exerciseName}', ${index}, 'reps', this.value)"
          inputmode="numeric" />
        <span class="set-unit">reps</span>
      </div>
      <button class="set-check ${set.done ? 'checked' : ''}"
        id="chk-${id}"
        onclick="toggleSet('${exerciseName}', ${index})">✓</button>
    </div>
  `;
}

// ─── SET INTERACTIONS ─────────────────────────

function updateSet(exerciseName, index, field, value) {
  if (!state.sets[exerciseName]) return;
  state.sets[exerciseName][index][field] = field === 'weight'
    ? Math.max(0, parseFloat(value) || 0)
    : Math.max(1, parseInt(value, 10) || 1);
  saveWorkoutState();
}

function toggleSet(exerciseName, index) {
  if (!state.sets[exerciseName]) return;
  state.sets[exerciseName][index].done = !state.sets[exerciseName][index].done;
  saveWorkoutState();
  patchSetRow(exerciseName, index);
  updateRing(exerciseName);
  updateCardComplete(exerciseName);
}

function patchSetRow(exerciseName, index) {
  const set  = state.sets[exerciseName][index];
  const id   = `${sid(exerciseName)}-${index}`;
  document.getElementById('row-' + id)?.classList.toggle('done', set.done);
  document.getElementById('chk-'  + id)?.classList.toggle('checked', set.done);
}

function updateRing(exerciseName) {
  const sets = state.sets[exerciseName] ?? [];
  const ring = document.getElementById('ring-' + sid(exerciseName));
  if (!ring) return;
  const circ = 2 * Math.PI * 14;
  ring.style.strokeDashoffset = circ - (sets.filter(s => s.done).length / sets.length) * circ;
}

function updateAllRings() {
  WORKOUTS[state.currentWorkout].forEach(ex => updateRing(ex.name));
}

function updateCardComplete(exerciseName) {
  const sets = state.sets[exerciseName] ?? [];
  document.getElementById('card-' + sid(exerciseName))
    ?.classList.toggle('completed', sets.every(s => s.done));
}

// ─── IMPORT ───────────────────────────────────

function triggerImport() {
  document.getElementById('importFileInput')?.click();
}

function handleImportFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const result = importFromExport(e.target.result);
    if (result.success) {
      showToast(`✓ ${result.sessions} sessions imported`);
      renderHome();
      renderHistory();
      renderProgress();
    } else {
      showToast('Import failed — invalid format');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ─── FINISH / SKIP WORKOUT ───────────────────

function finishWorkout() {
  const exercises = WORKOUTS[state.currentWorkout];
  const anyDone   = exercises.some(ex => (state.sets[ex.name] ?? []).some(s => s.done));
  if (!anyDone) {
    showToast('No sets checked — workout not saved.');
    return;
  }

  state.history.push({
    id:        Date.now(),
    date:      new Date().toISOString().split('T')[0],
    workout:   state.currentWorkout,
    week:      state.currentWeek,
    exercises: exercises.map(ex => ({
      name: ex.name,
      sets: (state.sets[ex.name] ?? []).map(s => ({ weight: s.weight, reps: s.reps, done: s.done })),
    })),
  });

  saveHistory();
  advanceWorkout();
  renderHome();
  renderHistory();
  showToast('Workout saved ✓');
}

function skipWorkout() {
  advanceWorkout();
  renderHome();
  showToast('Skipped to next workout');
}

function advanceWorkout() {
  state.currentWorkout = state.currentWorkout === 'A' ? 'B' : 'A';
  if (state.currentWorkout === 'A') state.currentWeek++;
  state.sets = {};
  initSetsIfNeeded();
  saveWorkoutState();
}

// ─── HISTORY SCREEN ───────────────────────────

function renderHistory() {
  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  const count = document.getElementById('historyCount');

  if (state.history.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    count.textContent = '0 sessions';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `${state.history.length} sessions`;

  list.innerHTML = [...state.history].reverse().map(log => {
    const vol = calcVolume(log);
    return `
      <div class="history-item" onclick="openModal(${log.id})">
        <div>
          <div class="history-tag">WEEK ${log.week ?? '—'} · WORKOUT ${log.workout}${log.phase ? ' · ' + log.phase : ''}</div>
          <div class="history-name">${formatDate(log.date)}</div>
          <div class="history-meta">${log.exercises?.map(e => e.name).join(', ') || ''}</div>
          ${vol > 0 ? `<div class="history-meta" style="color:var(--accent);margin-top:2px">${vol.toLocaleString('en-GB')} kg volume</div>` : ''}
        </div>
        <span class="history-arrow">›</span>
      </div>
    `;
  }).join('');
}

function openModal(id) {
  const log = state.history.find(l => l.id === id);
  if (!log) return;

  document.getElementById('modalDate').textContent  = `WEEK ${log.week ?? '—'} · WORKOUT ${log.workout}`;
  document.getElementById('modalTitle').textContent = formatDate(log.date);

  document.getElementById('modalBody').innerHTML = (log.exercises ?? []).map(ex => `
    <div class="modal-exercise">
      <div class="modal-exercise-name">${ex.name}</div>
      ${(ex.sets ?? []).map((s, i) => `
        <div class="modal-set-row">
          <span class="modal-set-num">${i + 1}</span>
          <span class="modal-set-weight">${s.weight} kg</span>
          <span class="modal-set-reps">× ${s.reps} reps</span>
          <span class="modal-set-done" style="color:${s.done ? 'var(--success)' : 'var(--text-3)'}">
            ${s.done ? '✓' : '○'}
          </span>
        </div>
      `).join('')}
    </div>
  `).join('');

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ─── PROGRESS SCREEN ─────────────────────────

let chartWeekly = null;
let chartExercise = null;

function renderProgress() {
  renderStatTiles();
  renderWeeklyChart();
  renderExerciseSelect();
  renderExerciseChart();
}

function renderStatTiles() {
  const total    = state.history.length;
  const thisWeek = workoutsThisWeek();
  const totalVol = state.history.reduce((s, l) => s + calcVolume(l), 0);

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-tile">
      <div class="stat-value">${total}</div>
      <div class="stat-label">TOTAL</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${thisWeek}</div>
      <div class="stat-label">THIS WEEK</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${formatVolume(totalVol)}</div>
      <div class="stat-label">VOLUME</div>
    </div>
  `;

  const isEmpty = state.history.length === 0;
  document.getElementById('progressEmpty')?.classList.toggle('hidden', !isEmpty);
}

function workoutsThisWeek() {
  const start = startOfWeek(new Date());
  return state.history.filter(l => new Date(l.date) >= start).length;
}

function renderWeeklyChart() {
  const weeks  = last8Weeks();
  const counts = weeks.map(w => w.count);

  if (chartWeekly) chartWeekly.destroy();
  chartWeekly = new Chart(document.getElementById('chartWeekly'), {
    type: 'bar',
    data: {
      labels: weeks.map(w => weekLabel(w.start)),
      datasets: [{
        data:            counts,
        backgroundColor: 'rgba(255,179,71,0.7)',
        borderColor:     '#FFB347',
        borderWidth:     1,
        borderRadius:    3,
      }],
    },
    options: chartOptions('', Math.max(5, ...counts) + 1),
  });
}

function renderExerciseSelect() {
  const select  = document.getElementById('exerciseSelect');
  const current = select.value;
  const names   = new Set();

  Object.values(WORKOUTS).forEach(list => list.forEach(ex => names.add(ex.name)));
  state.history.forEach(log => log.exercises?.forEach(ex => names.add(ex.name)));

  select.innerHTML = [...names].map(n =>
    `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`
  ).join('');
}

function renderExerciseChart() {
  const exerciseName = document.getElementById('exerciseSelect').value;
  if (!exerciseName) return;

  const points = state.history
    .filter(log => log.exercises?.some(e => e.name === exerciseName))
    .map(log => {
      const ex  = log.exercises.find(e => e.name === exerciseName);
      const max = Math.max(...(ex?.sets?.map(s => s.weight) ?? [0]));
      return { date: log.date, y: max };
    });

  if (chartExercise) chartExercise.destroy();
  chartExercise = new Chart(document.getElementById('chartExercise'), {
    type: 'line',
    data: {
      labels: points.map(p => formatDate(p.date)),
      datasets: [{
        data:                 points.map(p => p.y),
        borderColor:          '#FFB347',
        backgroundColor:      'rgba(255,179,71,0.08)',
        borderWidth:          2,
        pointBackgroundColor: '#FFB347',
        pointRadius:          4,
        tension:              0.3,
        fill:                 true,
      }],
    },
    options: chartOptions('kg', Math.max(10, ...points.map(p => p.y)) * 1.1),
  });
}

// ─── CHART OPTIONS ────────────────────────────

function chartOptions(yLabel, yMax) {
  return {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1c1c',
        borderColor:     '#383838',
        borderWidth:     1,
        titleColor:      '#909090',
        bodyColor:       '#ffffff',
        titleFont:       { family: 'Share Tech Mono', size: 10 },
        bodyFont:        { family: 'Share Tech Mono', size: 12 },
        callbacks: { label: ctx => ctx.parsed.y + (yLabel ? ' ' + yLabel : '') },
      },
    },
    scales: {
      x: {
        grid:   { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks:  { color: '#909090', font: { family: 'Share Tech Mono', size: 10 }, maxRotation: 45 },
        border: { color: '#2a2a2a' },
      },
      y: {
        grid:        { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks:       { color: '#909090', font: { family: 'Share Tech Mono', size: 10 }, stepSize: 1 },
        border:      { color: '#2a2a2a' },
        max:         yMax || undefined,
        beginAtZero: true,
      },
    },
  };
}

// ─── HILFSFUNKTIONEN ──────────────────────────

function calcVolume(log) {
  return (log.exercises ?? []).reduce((sum, ex) =>
    sum + (ex.sets ?? []).reduce((s2, set) =>
      s2 + (set.done ? set.weight * set.reps : 0), 0
    ), 0
  );
}

function last8Weeks() {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const start = startOfWeek(new Date(now.getTime() - (7 - i) * 7 * 86400_000));
    const end   = new Date(start.getTime() + 7 * 86400_000);
    return {
      start,
      count: state.history.filter(l => { const d = new Date(l.date); return d >= start && d < end; }).length,
    };
  });
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatVolume(vol) {
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 't' : vol + 'kg';
}

// CSS-sicherer Bezeichner
function sid(str) {
  return str.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase();
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
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setHeaderDate();
  renderHome();
  renderHistory();
  renderExerciseSelect();
  renderProgress();
});
