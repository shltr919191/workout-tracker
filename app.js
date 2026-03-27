// ─────────────────────────────────────────────
//  WORKOUT TRACKER — app.js
//  Stack: Vanilla JS + LocalStorage + Chart.js
// ─────────────────────────────────────────────

// ─── STORAGE KEYS ─────────────────────────────
const KEY_HISTORY = 'ironlog_history';
const KEY_STATE   = 'ironlog_state';
const KEY_SETS    = 'ironlog_currentSets';

// ─── 12-WEEK PROGRAM ─────────────────────────
// Direkt aus program.json übernommen.
// Änderungen: Wadenheben entfernt, Seitheben Kabel → Schulterdrücken in Workout A.

const PHASES = [
  {
    id: 'TEC', name: 'Technik & Volumen', weeks: [1,2,3],
    desc: 'Bewegungsmuster einschleifen, Basisvolumen aufbauen',
    rir: '3-4', progression: 'Leichte Progression',
  },
  {
    id: 'KRA', name: 'Kraft & Progression', weeks: [4,5,6],
    desc: 'Progressiv schwerer werden, Kraftbasis aufbauen',
    rir: '2-3', progression: 'Moderate Progression',
  },
  {
    id: 'INT', name: 'Intensität', weeks: [7,8,9],
    desc: 'Höhere Intensität, maximale Anpassung',
    rir: '1-2', progression: 'Starke Progression',
  },
  {
    id: 'PEA', name: 'Peak & Volumen', weeks: [10,11],
    desc: 'Maximale Leistung abrufen',
    rir: '0-1', progression: 'Nur wenn technisch sauber',
  },
  {
    id: 'DEL', name: 'Deload', weeks: [12],
    desc: 'Aktive Erholung, Gewicht -40%',
    rir: '4-5', progression: 'Gewicht reduzieren',
  },
];

// Vollständiger Wochenplan. Jede Woche definiert exakt die Übungen mit Sets/Reps.
// Workout A: Seitheben Kabel → Schulterdrücken. Wadenheben komplett entfernt.
const PROGRAM = {
  // ── Technik & Volumen ──
  1: {
    A: [
      { name: 'Kniebeugen',        setsReps: '3x6-8'   },
      { name: 'KH-Bankdrücken',    setsReps: '3x6-8'   },
      { name: 'Klimmzüge',         setsReps: '3x6-8'   },
      { name: 'Schulterdrücken',   setsReps: '3x10-12' },
      { name: 'Leg Curls',         setsReps: '3x10-12' },
      { name: 'Incline KH-Curls',  setsReps: '3x10-12' },
      { name: 'Face Pulls',        setsReps: '3x10-12' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '3x6-8'   },
      { name: 'Seated Cable Row',       setsReps: '3x6-8'   },
      { name: 'Schrägbank KH-Drücken', setsReps: '3x6-8'   },
      { name: 'Bulgarian Split Squats', setsReps: '3x6-8'   },
      { name: 'Seitheben Kabel',        setsReps: '3x10-12' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x10-12' },
    ],
  },
  2: {
    A: [
      { name: 'Kniebeugen',        setsReps: '3x6-8'   },
      { name: 'KH-Bankdrücken',    setsReps: '3x6-8'   },
      { name: 'Klimmzüge',         setsReps: '3x6-8'   },
      { name: 'Schulterdrücken',   setsReps: '3x10-12' },
      { name: 'Leg Curls',         setsReps: '3x10-12' },
      { name: 'Incline KH-Curls',  setsReps: '3x10-12' },
      { name: 'Face Pulls',        setsReps: '3x10-12' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '3x6-8'   },
      { name: 'Seated Cable Row',       setsReps: '3x6-8'   },
      { name: 'Schrägbank KH-Drücken', setsReps: '3x6-8'   },
      { name: 'Bulgarian Split Squats', setsReps: '3x6-8'   },
      { name: 'Seitheben Kabel',        setsReps: '3x10-12' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x10-12' },
    ],
  },
  3: {
    A: [
      { name: 'Kniebeugen',        setsReps: '3x6-8'   },
      { name: 'KH-Bankdrücken',    setsReps: '3x6-8'   },
      { name: 'Klimmzüge',         setsReps: '3x6-8'   },
      { name: 'Schulterdrücken',   setsReps: '3x10-12' },
      { name: 'Leg Curls',         setsReps: '3x10-12' },
      { name: 'Incline KH-Curls',  setsReps: '3x10-12' },
      { name: 'Face Pulls',        setsReps: '3x10-12' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '3x6-8'   },
      { name: 'Seated Cable Row',       setsReps: '3x6-8'   },
      { name: 'Schrägbank KH-Drücken', setsReps: '3x6-8'   },
      { name: 'Bulgarian Split Squats', setsReps: '3x6-8'   },
      { name: 'Seitheben Kabel',        setsReps: '3x10-12' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x10-12' },
    ],
  },
  // ── Kraft & Progression ──
  4: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x5-7'  },
      { name: 'KH-Bankdrücken',    setsReps: '4x5-7'  },
      { name: 'Klimmzüge',         setsReps: '4x5-7'  },
      { name: 'Schulterdrücken',   setsReps: '3x8-10' },
      { name: 'Leg Curls',         setsReps: '3x8-10' },
      { name: 'Incline KH-Curls',  setsReps: '3x8-10' },
      { name: 'Face Pulls',        setsReps: '3x8-10' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x5-7'  },
      { name: 'Seated Cable Row',       setsReps: '4x5-7'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x5-7'  },
      { name: 'Bulgarian Split Squats', setsReps: '4x5-7'  },
      { name: 'Seitheben Kabel',        setsReps: '3x8-10' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x8-10' },
    ],
  },
  5: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x5-7'  },
      { name: 'KH-Bankdrücken',    setsReps: '4x5-7'  },
      { name: 'Klimmzüge',         setsReps: '4x5-7'  },
      { name: 'Schulterdrücken',   setsReps: '3x8-10' },
      { name: 'Leg Curls',         setsReps: '3x8-10' },
      { name: 'Incline KH-Curls',  setsReps: '3x8-10' },
      { name: 'Face Pulls',        setsReps: '3x8-10' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x5-7'  },
      { name: 'Seated Cable Row',       setsReps: '4x5-7'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x5-7'  },
      { name: 'Bulgarian Split Squats', setsReps: '4x5-7'  },
      { name: 'Seitheben Kabel',        setsReps: '3x8-10' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x8-10' },
    ],
  },
  6: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x5-7'  },
      { name: 'KH-Bankdrücken',    setsReps: '4x5-7'  },
      { name: 'Klimmzüge',         setsReps: '4x5-7'  },
      { name: 'Schulterdrücken',   setsReps: '3x8-10' },
      { name: 'Leg Curls',         setsReps: '3x8-10' },
      { name: 'Incline KH-Curls',  setsReps: '3x8-10' },
      { name: 'Face Pulls',        setsReps: '3x8-10' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x5-7'  },
      { name: 'Seated Cable Row',       setsReps: '4x5-7'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x5-7'  },
      { name: 'Bulgarian Split Squats', setsReps: '4x5-7'  },
      { name: 'Seitheben Kabel',        setsReps: '3x8-10' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x8-10' },
    ],
  },
  // ── Intensität ──
  7: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x3-5' },
      { name: 'KH-Bankdrücken',    setsReps: '4x3-5' },
      { name: 'Klimmzüge',         setsReps: '4x3-5' },
      { name: 'Schulterdrücken',   setsReps: '4x6-8' },
      { name: 'Leg Curls',         setsReps: '4x6-8' },
      { name: 'Incline KH-Curls',  setsReps: '4x6-8' },
      { name: 'Face Pulls',        setsReps: '4x6-8' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x3-5' },
      { name: 'Seated Cable Row',       setsReps: '4x3-5' },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x3-5' },
      { name: 'Bulgarian Split Squats', setsReps: '4x3-5' },
      { name: 'Seitheben Kabel',        setsReps: '4x6-8' },
      { name: 'Trizeps Pushdowns',      setsReps: '4x6-8' },
    ],
  },
  8: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x3-5' },
      { name: 'KH-Bankdrücken',    setsReps: '4x3-5' },
      { name: 'Klimmzüge',         setsReps: '4x3-5' },
      { name: 'Schulterdrücken',   setsReps: '4x6-8' },
      { name: 'Leg Curls',         setsReps: '4x6-8' },
      { name: 'Incline KH-Curls',  setsReps: '4x6-8' },
      { name: 'Face Pulls',        setsReps: '4x6-8' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x3-5' },
      { name: 'Seated Cable Row',       setsReps: '4x3-5' },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x3-5' },
      { name: 'Bulgarian Split Squats', setsReps: '4x3-5' },
      { name: 'Seitheben Kabel',        setsReps: '4x6-8' },
      { name: 'Trizeps Pushdowns',      setsReps: '4x6-8' },
    ],
  },
  9: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x3-5' },
      { name: 'KH-Bankdrücken',    setsReps: '4x3-5' },
      { name: 'Klimmzüge',         setsReps: '4x3-5' },
      { name: 'Schulterdrücken',   setsReps: '4x6-8' },
      { name: 'Leg Curls',         setsReps: '4x6-8' },
      { name: 'Incline KH-Curls',  setsReps: '4x6-8' },
      { name: 'Face Pulls',        setsReps: '4x6-8' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x3-5' },
      { name: 'Seated Cable Row',       setsReps: '4x3-5' },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x3-5' },
      { name: 'Bulgarian Split Squats', setsReps: '4x3-5' },
      { name: 'Seitheben Kabel',        setsReps: '4x6-8' },
      { name: 'Trizeps Pushdowns',      setsReps: '4x6-8' },
    ],
  },
  // ── Peak & Volumen ──
  10: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x4-6'  },
      { name: 'KH-Bankdrücken',    setsReps: '4x4-6'  },
      { name: 'Klimmzüge',         setsReps: '4x4-6'  },
      { name: 'Schulterdrücken',   setsReps: '4x8-10' },
      { name: 'Leg Curls',         setsReps: '4x8-10' },
      { name: 'Incline KH-Curls',  setsReps: '4x8-10' },
      { name: 'Face Pulls',        setsReps: '4x8-10' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x4-6'  },
      { name: 'Seated Cable Row',       setsReps: '4x4-6'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x4-6'  },
      { name: 'Bulgarian Split Squats', setsReps: '4x4-6'  },
      { name: 'Seitheben Kabel',        setsReps: '4x8-10' },
      { name: 'Trizeps Pushdowns',      setsReps: '4x8-10' },
    ],
  },
  11: {
    A: [
      { name: 'Kniebeugen',        setsReps: '4x4-6'  },
      { name: 'KH-Bankdrücken',    setsReps: '4x4-6'  },
      { name: 'Klimmzüge',         setsReps: '4x4-6'  },
      { name: 'Schulterdrücken',   setsReps: '4x8-10' },
      { name: 'Leg Curls',         setsReps: '4x8-10' },
      { name: 'Incline KH-Curls',  setsReps: '4x8-10' },
      { name: 'Face Pulls',        setsReps: '4x8-10' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '4x4-6'  },
      { name: 'Seated Cable Row',       setsReps: '4x4-6'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '4x4-6'  },
      { name: 'Bulgarian Split Squats', setsReps: '4x4-6'  },
      { name: 'Seitheben Kabel',        setsReps: '4x8-10' },
      { name: 'Trizeps Pushdowns',      setsReps: '4x8-10' },
    ],
  },
  // ── Deload ──
  12: {
    A: [
      { name: 'Kniebeugen',        setsReps: '3x8-12'  },
      { name: 'KH-Bankdrücken',    setsReps: '3x8-12'  },
      { name: 'Klimmzüge',         setsReps: '3x8-12'  },
      { name: 'Schulterdrücken',   setsReps: '3x10-15' },
      { name: 'Leg Curls',         setsReps: '3x10-15' },
      { name: 'Incline KH-Curls',  setsReps: '3x10-15' },
      { name: 'Face Pulls',        setsReps: '3x10-15' },
    ],
    B: [
      { name: 'Trap Bar Deadlift',      setsReps: '3x8-12'  },
      { name: 'Seated Cable Row',       setsReps: '3x8-12'  },
      { name: 'Schrägbank KH-Drücken', setsReps: '3x8-12'  },
      { name: 'Bulgarian Split Squats', setsReps: '3x8-12'  },
      { name: 'Seitheben Kabel',        setsReps: '3x10-15' },
      { name: 'Trizeps Pushdowns',      setsReps: '3x10-15' },
    ],
  },
};

// Parst "3x6-8" → { sets: 3, repRange: '6-8', defaultReps: 8 }
function parseSetsReps(str) {
  const [s, r] = str.split('x');
  const sets = parseInt(s, 10);
  const repRange = r;
  const defaultReps = parseInt(r.split('-')[1] || r, 10);
  return { sets, repRange, defaultReps };
}

// A-B-A / B-A-B pattern: even weeks start A, odd weeks start B
function sessionPattern(sessionIndex) {
  const weekIdx    = Math.floor(sessionIndex / 3);
  const posInWeek  = sessionIndex % 3;
  const startA     = weekIdx % 2 === 0;
  if (startA) return posInWeek === 1 ? 'B' : 'A';
  else        return posInWeek === 1 ? 'A' : 'B';
}

const TOTAL_SESSIONS = 36;

// ─── STATE ────────────────────────────────────
const state = {
  sessionIndex: 0,   // 0–35
  sets:         {},
  history:      [],
};

const DEFAULT_WEIGHTS = {
  'Kniebeugen':            70,
  'KH-Bankdrücken':        25,
  'Klimmzüge':              0,
  'Schulterdrücken':       20,
  'Leg Curls':             25,
  'Incline KH-Curls':      10,
  'Face Pulls':            20,
  'Trap Bar Deadlift':     80,
  'Seated Cable Row':      69,
  'Schrägbank KH-Drücken': 25,
  'Bulgarian Split Squats': 15,
  'Seitheben Kabel':      3.75,
  'Trizeps Pushdowns':     25,
};

function currentWorkout()  { return sessionPattern(state.sessionIndex); }
function currentWeek()     { return Math.floor(state.sessionIndex / 3) + 1; }
function currentPhase()    { return PHASES.find(p => p.weeks.includes(currentWeek())) || PHASES[0]; }

function currentExercises() {
  const week    = currentWeek();
  const workout = currentWorkout();
  const entries = (PROGRAM[week] || PROGRAM[1])[workout] || [];
  return entries.map(e => {
    const { sets, repRange, defaultReps } = parseSetsReps(e.setsReps);
    return { name: e.name, sets, repRange, defaultReps, defaultWeight: DEFAULT_WEIGHTS[e.name] || 0 };
  });
}

function exercisesFor(week, workout) {
  const entries = (PROGRAM[week] || PROGRAM[1])[workout] || [];
  return entries.map(e => {
    const { sets, repRange } = parseSetsReps(e.setsReps);
    return { name: e.name, sets, repRange };
  });
}

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
    const raw = localStorage.getItem(KEY_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sessionIndex !== undefined) state.sessionIndex = parsed.sessionIndex;
    }
  } catch (e) { console.warn('State load failed:', e); }

  try {
    const raw = localStorage.getItem(KEY_SETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') state.sets = parsed;
    }
  } catch (e) { console.warn('Sets load failed:', e); }

  initSetsIfNeeded();
}

function saveState() {
  localStorage.setItem(KEY_STATE, JSON.stringify({ sessionIndex: state.sessionIndex }));
  localStorage.setItem(KEY_SETS,  JSON.stringify(state.sets));
}

function saveHistory() {
  localStorage.setItem(KEY_HISTORY, JSON.stringify(state.history));
}

// ─── MIGRATION FROM OLD EXPORT FORMAT ─────────
function importFromExport(exportData) {
  try {
    const data = typeof exportData === 'string' ? JSON.parse(exportData) : exportData;

    // Migrate history
    if (Array.isArray(data.history)) {
      const migrated = data.history.map(log => ({
        id:           log.id   ?? Date.now() + Math.random(),
        date:         log.date ?? new Date().toISOString().split('T')[0],
        workout:      log.workout ?? 'A',
        week:         log.week    ?? 1,
        phase:        log.phase   ?? null,
        sessionIndex: log.sessionIndex ?? 0,
        duration:     log.duration ?? 0,
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

    // Restore session index
    if (data.sessionIndex !== undefined) {
      state.sessionIndex = data.sessionIndex;
    }

    // Migrate current sets (old format: "Übung__sessionIdx")
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
    saveState();
    return { success: true, sessions: state.history.length };
  } catch (e) {
    console.error('Import failed:', e);
    return { success: false, error: e.message };
  }
}

// ─── SETS ─────────────────────────────────────

function initSetsIfNeeded() {
  currentExercises().forEach(ex => {
    if (!state.sets[ex.name]) state.sets[ex.name] = buildDefaultSets(ex);
  });
}

function buildDefaultSets(exercise) {
  const lastWeight = getLastWeight(exercise.name) ?? exercise.defaultWeight;
  return Array.from({ length: exercise.sets }, () => ({
    weight: lastWeight,
    reps:   exercise.defaultReps,
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
  if (tab === 'Plan')     renderPlan();
}

// ─── HEADER ──────────────────────────────────

function setHeaderDate() {
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).toUpperCase();
}

// ─── HOME ─────────────────────────────────────

function renderHome() {
  const phase     = currentPhase();
  const workout   = currentWorkout();
  const week      = currentWeek();
  const exercises = currentExercises();
  const si        = state.sessionIndex;

  document.getElementById('phaseBadge').textContent    = `${phase.name.toUpperCase()} · WEEK ${week}`;
  document.getElementById('workoutTitle').textContent  = `WORKOUT ${workout}`;
  document.getElementById('workoutSubtitle').textContent = `Session ${si + 1} of ${TOTAL_SESSIONS}`;

  // Plan progress
  const pct = Math.round((si / TOTAL_SESSIONS) * 100);
  document.getElementById('planProgressPct').textContent   = pct + '%';
  document.getElementById('planProgressFill').style.width  = pct + '%';

  // Phase pills
  document.getElementById('phasePills').innerHTML = PHASES.map(p => {
    const isDone    = p.weeks[p.weeks.length - 1] < week;
    const isActive  = p.weeks.includes(week);
    const cls = isActive ? 'active' : isDone ? 'done' : '';
    return `<span class="phase-pill ${cls}">${p.id}</span>`;
  }).join('');

  // Exercise list
  document.getElementById('exerciseList').innerHTML =
    exercises.map(ex => renderExerciseCard(ex)).join('');

  updateAllBadges();
}

function renderExerciseCard(exercise) {
  const sets      = state.sets[exercise.name] ?? buildDefaultSets(exercise);
  const doneCount = sets.filter(s => s.done).length;
  const total     = sets.length;
  const allDone   = doneCount === total;
  const lastW     = getLastWeight(exercise.name);
  const phase     = currentPhase();

  const lastHint = lastW !== null
    ? `<span class="ex-last">↑ last: ${lastW} kg</span>`
    : '';

  return `
    <div class="exercise-card ${allDone ? 'completed' : ''}" id="card-${sid(exercise.name)}">
      <div class="ex-card-header">
        <div class="ex-card-left">
          <div class="ex-name">${exercise.name}</div>
          <div class="ex-meta">
            ${exercise.sets} × ${exercise.repRange}${lastHint}
          </div>
        </div>
        <div class="ex-badge ${allDone ? 'done' : ''}" id="badge-${sid(exercise.name)}">
          ${allDone ? '✓' : `${doneCount}/${total}`}
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
      <div class="set-input-wrap">
        <span class="set-input-label">KG</span>
        <div class="set-input-box">
          <input class="set-input" type="number" min="0" step="0.5"
            value="${set.weight}"
            onchange="updateSet('${exerciseName}', ${index}, 'weight', this.value)"
            inputmode="decimal" />
        </div>
      </div>
      <div class="set-input-wrap">
        <span class="set-input-label">REPS</span>
        <div class="set-input-box">
          <input class="set-input" type="number" min="1" step="1"
            value="${set.reps}"
            onchange="updateSet('${exerciseName}', ${index}, 'reps', this.value)"
            inputmode="numeric" />
        </div>
      </div>
      <div class="set-input-wrap" style="align-items:center">
        <span class="set-input-label" style="opacity:0">✓</span>
        <button class="set-check ${set.done ? 'checked' : ''}"
          id="chk-${id}"
          onclick="toggleSet('${exerciseName}', ${index})">✓</button>
      </div>
    </div>
  `;
}

// ─── SET INTERACTIONS ─────────────────────────

function updateSet(exerciseName, index, field, value) {
  if (!state.sets[exerciseName]) return;
  state.sets[exerciseName][index][field] = field === 'weight'
    ? Math.max(0, parseFloat(value) || 0)
    : Math.max(1, parseInt(value, 10) || 1);
  saveState();
}

function toggleSet(exerciseName, index) {
  if (!state.sets[exerciseName]) return;
  state.sets[exerciseName][index].done = !state.sets[exerciseName][index].done;
  saveState();
  patchSetRow(exerciseName, index);
  updateBadge(exerciseName);
  updateCardComplete(exerciseName);
}

function patchSetRow(exerciseName, index) {
  const set = state.sets[exerciseName][index];
  const id  = `${sid(exerciseName)}-${index}`;
  document.getElementById('row-' + id)?.classList.toggle('done', set.done);
  document.getElementById('chk-'  + id)?.classList.toggle('checked', set.done);
}

function updateBadge(exerciseName) {
  const sets    = state.sets[exerciseName] ?? [];
  const done    = sets.filter(s => s.done).length;
  const total   = sets.length;
  const allDone = done === total;
  const badge   = document.getElementById('badge-' + sid(exerciseName));
  if (!badge) return;
  badge.className = `ex-badge ${allDone ? 'done' : ''}`;
  badge.textContent = allDone ? '✓' : `${done}/${total}`;
}

function updateAllBadges() {
  currentExercises().forEach(ex => updateBadge(ex.name));
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
    } else {
      showToast('Import failed — invalid format');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ─── FINISH / SKIP ────────────────────────────

function finishWorkout() {
  const exercises = currentExercises();
  const anyDone   = exercises.some(ex => (state.sets[ex.name] ?? []).some(s => s.done));
  if (!anyDone) { showToast('No sets completed — not saved.'); return; }

  const phase = currentPhase();
  state.history.push({
    id:           Date.now(),
    date:         new Date().toISOString().split('T')[0],
    workout:      currentWorkout(),
    week:         currentWeek(),
    phase:        phase.name,
    sessionIndex: state.sessionIndex,
    duration:     0,
    exercises: exercises.map(ex => ({
      name: ex.name,
      sets: (state.sets[ex.name] ?? []).map(s => ({ weight: s.weight, reps: s.reps, done: s.done })),
    })),
  });

  saveHistory();
  advanceSession();
  renderHome();
  renderHistory();
  showToast('Workout saved ✓');
}

function skipWorkout() {
  advanceSession();
  renderHome();
  showToast('Skipped →');
}

function advanceSession() {
  state.sessionIndex = Math.min(state.sessionIndex + 1, TOTAL_SESSIONS - 1);
  state.sets = {};
  initSetsIfNeeded();
  saveState();
}

// ─── HISTORY ──────────────────────────────────

function renderHistory() {
  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  const count = document.getElementById('historyCount');
  const summCard = document.getElementById('weekSummary');

  if (state.history.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    summCard.classList.add('hidden');
    count.textContent = '0 sessions';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `${state.history.length} sessions`;

  // This week summary
  const weekStart = startOfWeek(new Date());
  const thisWeek  = state.history.filter(l => new Date(l.date) >= weekStart);
  if (thisWeek.length > 0) {
    const vol    = thisWeek.reduce((s, l) => s + calcVolume(l), 0);
    const avgDur = thisWeek.reduce((s, l) => s + (l.duration || 0), 0) / thisWeek.length;
    summCard.classList.remove('hidden');
    summCard.innerHTML = `
      <div class="week-summary-tag">THIS WEEK</div>
      <div class="week-summary-stats">
        <div>
          <div class="week-stat-value">${thisWeek.length}</div>
          <div class="week-stat-label">SESSIONS</div>
        </div>
        <div>
          <div class="week-stat-value">${formatVolume(vol)}</div>
          <div class="week-stat-label">VOLUME</div>
        </div>
        <div>
          <div class="week-stat-value">${avgDur > 0 ? secToHMS(avgDur) : '—'}</div>
          <div class="week-stat-label">AVG DUR</div>
        </div>
      </div>
    `;
  } else {
    summCard.classList.add('hidden');
  }

  list.innerHTML = [...state.history].reverse().map(log => {
    const exCount = log.exercises?.length ?? 0;
    const meta    = `${exCount} exercises · ${log.phase || ''}${log.week ? ', Wk ' + log.week : ''}`;
    const dur     = log.duration ? `<div class="history-item-dur">⊙ ${secToHMS(log.duration)}</div>` : '';
    return `
      <div class="history-item" onclick="openModal(${log.id})">
        <div>
          <div class="history-item-date">${formatDateLong(log.date)}</div>
          <div class="history-item-title">WORKOUT ${log.workout}</div>
          <div class="history-item-meta">${meta}</div>
          ${dur}
        </div>
        <div class="history-item-actions">
          <span class="history-arrow">›</span>
          <button class="history-delete" onclick="deleteSession(event, ${log.id})">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function deleteSession(event, id) {
  event.stopPropagation();
  state.history = state.history.filter(l => l.id !== id);
  saveHistory();
  renderHistory();
  showToast('Session deleted');
}

function openModal(id) {
  const log = state.history.find(l => l.id === id);
  if (!log) return;

  document.getElementById('modalDate').textContent  = `${log.phase || 'WORKOUT'} · WEEK ${log.week ?? '—'}`;
  document.getElementById('modalTitle').textContent = `WORKOUT ${log.workout}`;
  document.getElementById('modalSub').textContent   = formatDateLong(log.date) +
    (log.duration ? ` · ${secToHMS(log.duration)}` : '');

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

function closeModal()      { document.getElementById('modalOverlay').classList.add('hidden'); }
function openRulesModal()  { document.getElementById('rulesOverlay').classList.remove('hidden'); }
function closeRulesModal() { document.getElementById('rulesOverlay').classList.add('hidden'); }

// ─── PLAN TAB ─────────────────────────────────

function renderPlan() {
  const week    = currentWeek();
  const workout = currentWorkout();
  const phase   = currentPhase();

  document.getElementById('planList').innerHTML = PHASES.map(p => {
    const isActive = p.id === phase.id;
    const isDone   = p.weeks[p.weeks.length - 1] < week;

    const weeksHTML = p.weeks.map(w => {
      const isCurrent = w === week;
      const isWeekDone = w < week;
      const weekSessions = state.history.filter(l => l.week === w);

      // Which workouts in this week?
      const weekStart = (w - 1) * 3;
      const wkPattern = [0,1,2].map(i => sessionPattern(weekStart + i));

      let badge = '';
      if (isWeekDone)  badge = `<span class="plan-week-badge done">✓ DONE</span>`;
      if (isCurrent)   badge = `<span class="plan-week-badge current">AKTUELL</span>`;

      const bodyHTML = (isCurrent || isWeekDone) ? `
        <div class="plan-week-body">
          <div class="plan-rir-row">
            <span class="plan-rir-badge">RIR ${p.rir}</span>
            <span class="plan-rir-label">${p.progression}</span>
          </div>
          ${['A','B'].map(wo => `
            <div class="plan-workout-section">
              <div class="plan-workout-label">WORKOUT ${wo}</div>
              ${exercisesFor(w, wo).map(ex => `
                <div class="plan-exercise-row">
                  <span class="plan-exercise-name">${ex.name}</span>
                  <span class="plan-exercise-range">${ex.sets} × ${ex.repRange}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      ` : '';

      return `
        <div class="plan-week-card ${isCurrent ? 'current-week' : ''}">
          <div class="plan-week-header">
            <div>
              <div class="plan-week-title">WOCHE ${w}</div>
              <div class="plan-week-sub">3 Workouts · ${wkPattern.map(x => 'Workout ' + x).join(', ')}</div>
            </div>
            ${badge}
          </div>
          ${bodyHTML}
        </div>
      `;
    }).join('');

    return `
      <div class="plan-phase-card ${isActive ? 'active-phase' : ''}">
        <div class="plan-phase-header">
          <div class="plan-phase-name ${isActive ? 'active-color' : ''}">${p.name.toUpperCase()}</div>
          <div class="plan-phase-weeks">Wochen ${p.weeks[0]}–${p.weeks[p.weeks.length-1]}</div>
        </div>
        <div class="plan-phase-desc">${p.desc}</div>
        ${weeksHTML}
        <div style="height:8px"></div>
      </div>
    `;
  }).join('');
}

// ─── PROGRESS ─────────────────────────────────

let chartWeekly   = null;
let chartExercise = null;

function renderProgress() {
  renderStatTiles();
  renderWeeklyChart();
  renderExerciseSelect();
  renderExerciseChart();
}

function renderStatTiles() {
  const total    = state.history.length;
  const thisWeek = state.history.filter(l => new Date(l.date) >= startOfWeek(new Date())).length;
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
  document.getElementById('progressEmpty')?.classList.toggle('hidden', total > 0);
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
        data: counts,
        backgroundColor: 'rgba(255,179,71,0.7)',
        borderColor: '#FFB347', borderWidth: 1, borderRadius: 3,
      }],
    },
    options: chartOptions('', Math.max(5, ...counts) + 1),
  });
}

function renderExerciseSelect() {
  const select  = document.getElementById('exerciseSelect');
  const current = select.value;
  const names   = new Set();
  Object.keys(DEFAULT_WEIGHTS).forEach(n => names.add(n));
  state.history.forEach(log => log.exercises?.forEach(ex => names.add(ex.name)));
  select.innerHTML = [...names].map(n =>
    `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`
  ).join('');
}

function renderExerciseChart() {
  const name = document.getElementById('exerciseSelect').value;
  if (!name) return;

  const points = state.history
    .filter(log => log.exercises?.some(e => e.name === name))
    .map(log => {
      const ex  = log.exercises.find(e => e.name === name);
      const max = Math.max(...(ex?.sets?.map(s => s.weight) ?? [0]));
      return { date: log.date, y: max };
    });

  if (chartExercise) chartExercise.destroy();
  chartExercise = new Chart(document.getElementById('chartExercise'), {
    type: 'line',
    data: {
      labels: points.map(p => formatDate(p.date)),
      datasets: [{
        data: points.map(p => p.y),
        borderColor: '#FFB347', backgroundColor: 'rgba(255,179,71,0.08)',
        borderWidth: 2, pointBackgroundColor: '#FFB347', pointRadius: 4,
        tension: 0.3, fill: true,
      }],
    },
    options: chartOptions('kg', Math.max(10, ...points.map(p => p.y)) * 1.1),
  });
}

function chartOptions(yLabel, yMax) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e1e', borderColor: '#3a3a3a', borderWidth: 1,
        titleColor: '#909090', bodyColor: '#ffffff',
        titleFont: { family: 'Share Tech Mono', size: 10 },
        bodyFont:  { family: 'Share Tech Mono', size: 12 },
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
        ticks:       { color: '#909090', font: { family: 'Share Tech Mono', size: 10 } },
        border:      { color: '#2a2a2a' },
        max:         yMax || undefined,
        beginAtZero: true,
      },
    },
  };
}

// ─── HELPERS ──────────────────────────────────

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
    day: 'numeric', month: 'short',
  });
}

function formatDateLong(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatVolume(vol) {
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 't' : vol + 'kg';
}

function secToHMS(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

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

// ─── KEYBOARD ─────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeRulesModal(); }
});

// ─── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setHeaderDate();
  renderHome();
  renderHistory();
  renderExerciseSelect();
});
