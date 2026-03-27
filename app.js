// ─────────────────────────────────────────────
//  IRONLOG — app.js
//  Stack: Vanilla JS + LocalStorage + Chart.js
// ─────────────────────────────────────────────

// ─── STORAGE KEYS ─────────────────────────────
const KEY_HISTORY = 'ironlog_history';
const KEY_WORKOUT = 'ironlog_currentWorkout';
const KEY_SETS    = 'ironlog_currentSets';

// ─── WORKOUT PLAN ─────────────────────────────
// Basiert auf deinen tatsächlichen Übungen aus dem Export.
// Wadenheben wurde entfernt.
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
  } catch (e) { console.warn('History konnte nicht geladen werden:', e); }

  try {
    const raw = localStorage.getItem(KEY_WORKOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.currentWorkout) state.currentWorkout = parsed.currentWorkout;
      if (parsed.currentWeek)    state.currentWeek    = parsed.currentWeek;
    }
  } catch (e) { console.warn('Workout-State konnte nicht geladen werden:', e); }

  try {
    const raw = localStorage.getItem(KEY_SETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') state.sets = parsed;
    }
  } catch (e) { console.warn('Sets konnten nicht geladen werden:', e); }

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
// Altes Format:
//   { sessionIndex, sets: { "Übung__sessionIdx": [...] }, history: [...] }
//
// Neues Format:
//   history: [{ id, date, workout, week, exercises: [{ name, sets }] }]
//   currentWorkout / currentWeek / sets separat
//
function importFromExport(exportData) {
  try {
    const data = typeof exportData === 'string' ? JSON.parse(exportData) : exportData;

    // ── History migrieren ──
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

      // Chronologisch sortieren (älteste zuerst)
      migrated.sort((a, b) => new Date(a.date) - new Date(b.date));
      state.history = migrated;
    }

    // ── Aktuellen Workout-Stand ableiten ──
    // sessionIndex (gerade = A, ungerade = B)
    if (data.sessionIndex !== undefined) {
      state.currentWorkout = data.sessionIndex % 2 === 0 ? 'A' : 'B';
      state.currentWeek    = Math.floor(data.sessionIndex / 2) + 1;
    }

    // ── Aktuelle Sets migrieren ──
    // Altes Format: { "Übungsname__sessionIdx": [...] }
    // Nur Sets des aktuellen sessionIndex übernehmen, Wadenheben ignorieren.
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
    console.error('Import fehlgeschlagen:', e);
    return { success: false, error: e.message };
  }
}

// ─── SETS INITIALISIERUNG ─────────────────────

function initSetsIfNeeded() {
  WORKOUTS[state.currentWorkout].forEach(ex => {
    if (!state.sets[ex.name]) {
      state.sets[ex.name] = buildDefaultSets(ex);
    }
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

function switchTab(tab, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen' + tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'Progress') renderProgress();
}

// ─── HEADER DATE ─────────────────────────────

function setHeaderDate() {
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ─── HOME SCREEN ─────────────────────────────

function renderHome() {
  const exercises = WORKOUTS[state.currentWorkout];
  document.getElementById('homeContent').innerHTML = `
    <div class="workout-header">
      <div class="phase-badge">WOCHE ${state.currentWeek}</div>
      <div class="workout-title">WORKOUT ${state.currentWorkout}</div>
      <div class="workout-subtitle">${exercises.length} Übungen · ${totalSetsCount(exercises)} Sets</div>
    </div>
    ${exercises.map(ex => renderExerciseCard(ex)).join('')}
    <button class="finish-btn" onclick="finishWorkout()">WORKOUT ABSCHLIESSEN</button>
    <button class="import-btn" onclick="triggerImport()">↑ DATEN IMPORTIEREN</button>
    <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportFile(this)" />
  `;
  updateAllRings();
}

function totalSetsCount(exercises) {
  return exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

function renderExerciseCard(exercise) {
  const sets      = state.sets[exercise.name] ?? buildDefaultSets(exercise);
  const doneCount = sets.filter(s => s.done).length;
  const circ      = 2 * Math.PI * 14;
  return `
    <div class="exercise-card ${doneCount === sets.length ? 'completed' : ''}" id="card-${sanitizeId(exercise.name)}">
      <div class="exercise-card-header">
        <div class="exercise-name">${exercise.name}</div>
        <div class="ring-wrap">
          <div class="exercise-meta">${exercise.sets} × ${exercise.reps} Wdh</div>
          <svg class="progress-ring" viewBox="0 0 32 32">
            <circle class="ring-bg"   cx="16" cy="16" r="14"/>
            <circle class="ring-fill" cx="16" cy="16" r="14"
              id="ring-${sanitizeId(exercise.name)}"
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
  const sid = `${sanitizeId(exerciseName)}-${index}`;
  return `
    <div class="set-row ${set.done ? 'done' : ''}" id="row-${sid}">
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
        <span class="set-unit">Wdh</span>
      </div>
      <button class="set-check ${set.done ? 'checked' : ''}"
        id="chk-${sid}"
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
  const set = state.sets[exerciseName][index];
  const sid = `${sanitizeId(exerciseName)}-${index}`;
  document.getElementById('row-' + sid)?.classList.toggle('done', set.done);
  document.getElementById('chk-'  + sid)?.classList.toggle('checked', set.done);
}

function updateRing(exerciseName) {
  const sets = state.sets[exerciseName] ?? [];
  const ring = document.getElementById('ring-' + sanitizeId(exerciseName));
  if (!ring) return;
  const circ = 2 * Math.PI * 14;
  ring.style.strokeDashoffset = circ - (sets.filter(s => s.done).length / sets.length) * circ;
}

function updateAllRings() {
  WORKOUTS[state.currentWorkout].forEach(ex => updateRing(ex.name));
}

function updateCardComplete(exerciseName) {
  const sets = state.sets[exerciseName] ?? [];
  document.getElementById('card-' + sanitizeId(exerciseName))
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
      showToast(`✓ ${result.sessions} Sessions importiert`);
      renderHome();
      renderHistory();
      renderProgress();
    } else {
      showToast('Import fehlgeschlagen — ungültiges Format');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ─── FINISH WORKOUT ───────────────────────────

function finishWorkout() {
  const exercises = WORKOUTS[state.currentWorkout];
  const anyDone   = exercises.some(ex => (state.sets[ex.name] ?? []).some(s => s.done));
  if (!anyDone) {
    showToast('Kein Set abgehakt — Workout nicht gespeichert.');
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
  showToast('Workout gespeichert ✓');
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
    count.textContent = '';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `${state.history.length} Sessions`;

  list.innerHTML = [...state.history].reverse().map(log => {
    const vol = calcVolume(log);
    return `
      <div class="history-item" onclick="openHistoryModal(${log.id})">
        <div class="history-item-left">
          <div class="history-tag">WOCHE ${log.week ?? '—'} · WORKOUT ${log.workout}${log.phase ? ' · ' + log.phase : ''}</div>
          <div class="history-name">${formatDate(log.date)}</div>
          <div class="history-meta">${log.exercises?.map(e => e.name).join(', ') || ''}</div>
          ${vol > 0 ? `<div class="history-meta" style="color:var(--accent);margin-top:2px">${vol.toLocaleString('de-DE')} kg Volumen</div>` : ''}
        </div>
        <span class="history-arrow">›</span>
      </div>
    `;
  }).join('');
}

function openHistoryModal(id) {
  const log = state.history.find(l => l.id === id);
  if (!log) return;

  document.getElementById('modalTag').textContent   = `WOCHE ${log.week ?? '—'} · WORKOUT ${log.workout}`;
  document.getElementById('modalTitle').textContent = formatDate(log.date);
  document.getElementById('modalSub').textContent   =
    `${log.exercises?.length ?? 0} Übungen · ${calcVolume(log).toLocaleString('de-DE')} kg Volumen`;

  document.getElementById('modalBody').innerHTML = (log.exercises ?? []).map(ex => `
    <div class="modal-exercise">
      <div class="modal-exercise-name">${ex.name}</div>
      ${(ex.sets ?? []).map((s, i) => `
        <div class="modal-set-row">
          <span class="modal-set-num">${i + 1}</span>
          <span class="modal-set-weight">${s.weight} kg</span>
          <span class="modal-set-reps">× ${s.reps} Wdh</span>
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
let chartWeight = null;

function renderProgress() {
  renderStatTiles();
  renderWeeklyChart();
  populateExerciseSelect();
  renderWeightChart();
}

function renderStatTiles() {
  const total    = state.history.length;
  const thisWeek = workoutsThisWeek();
  const totalVol = state.history.reduce((s, l) => s + calcVolume(l), 0);

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile">
      <div class="stat-value">${total}</div>
      <div class="stat-label">GESAMT</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${thisWeek}</div>
      <div class="stat-label">DIESE WOCHE</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${formatVolume(totalVol)}</div>
      <div class="stat-label">VOLUMEN</div>
    </div>
  `;
}

function workoutsThisWeek() {
  const start = startOfWeek(new Date());
  return state.history.filter(l => new Date(l.date) >= start).length;
}

function renderWeeklyChart() {
  const weeks    = last8Weeks();
  const labels   = weeks.map(w => weekLabel(w.start));
  const counts   = weeks.map(w => w.count);

  if (chartWeekly) chartWeekly.destroy();
  chartWeekly = new Chart(document.getElementById('chartWeekly'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            counts,
        backgroundColor: 'rgba(245,166,35,0.7)',
        borderColor:     '#f5a623',
        borderWidth:     1,
        borderRadius:    3,
      }],
    },
    options: chartOptions('', Math.max(5, ...counts) + 1),
  });
}

function populateExerciseSelect() {
  const select  = document.getElementById('exerciseSelect');
  const current = select.value;
  const names   = new Set();

  Object.values(WORKOUTS).forEach(list => list.forEach(ex => names.add(ex.name)));
  state.history.forEach(log => log.exercises?.forEach(ex => names.add(ex.name)));

  select.innerHTML = [...names].map(n =>
    `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`
  ).join('');
  select.onchange = renderWeightChart;
}

function renderWeightChart() {
  const exerciseName = document.getElementById('exerciseSelect').value;
  if (!exerciseName) return;

  const points = state.history
    .filter(log => log.exercises?.some(e => e.name === exerciseName))
    .map(log => {
      const ex  = log.exercises.find(e => e.name === exerciseName);
      const max = Math.max(...(ex?.sets?.map(s => s.weight) ?? [0]));
      return { date: log.date, y: max };
    });

  if (chartWeight) chartWeight.destroy();
  chartWeight = new Chart(document.getElementById('chartWeight'), {
    type: 'line',
    data: {
      labels: points.map(p => formatDate(p.date)),
      datasets: [{
        data:                 points.map(p => p.y),
        borderColor:          '#f5a623',
        backgroundColor:      'rgba(245,166,35,0.08)',
        borderWidth:          2,
        pointBackgroundColor: '#f5a623',
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
        backgroundColor: '#1f1f1f',
        borderColor:     '#3a3a3a',
        borderWidth:     1,
        titleColor:      '#999',
        bodyColor:       '#f0f0f0',
        titleFont:       { family: 'Share Tech Mono', size: 10 },
        bodyFont:        { family: 'Share Tech Mono', size: 12 },
        callbacks: { label: ctx => ctx.parsed.y + (yLabel ? ' ' + yLabel : '') },
      },
    },
    scales: {
      x: {
        grid:   { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks:  { color: '#555', font: { family: 'Share Tech Mono', size: 10 }, maxRotation: 45 },
        border: { color: '#2a2a2a' },
      },
      y: {
        grid:        { color: 'rgba(42,42,42,0.5)', drawTicks: false },
        ticks:       { color: '#555', font: { family: 'Share Tech Mono', size: 10 }, stepSize: 1 },
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
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatVolume(vol) {
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 't' : vol + 'kg';
}

function sanitizeId(str) {
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
  populateExerciseSelect();
  renderProgress();
});
