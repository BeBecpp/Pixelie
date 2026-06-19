/* =============================================================================
 * renderer.js  —  Pixelie тоглоомын логик + зураг
 *   - State: hunger / happiness / energy (0-100) + sleeping + lastUpdated
 *   - Бодит хугацаагаар удаан буурна (апп хаалттай байсан ч launch дээр тооцно)
 *   - ~7 fps animation loop
 * ============================================================================= */

const S = window.SPRITES;            // FRAMES/ICONS/drawSprite-ийг S.*-ээр дуудна
                                     // (sprites.js global нэртэй мөргөлдөхгүйн тулд)
const API = window.pixelAPI;

/* --- Тохиргоо (хүсвэл тааруул) --------------------------------------------- */
const SCALE = 12;                 // 1 нүд = 12x12 px (16*12 = 192)
const FPS = 7;
const FRAME_MS = 1000 / FPS;

// Цагт хэдэн нэгжээр буурах вэ (per hour)
const DECAY = {
  awake:    { hunger: 10, happiness: 8,  energy: 7  },
  sleeping: { hunger: 4,  happiness: 4,  energy: -20 }, // energy сөрөг = нөхөн сэргэнэ
};

// Threshold
const LOW_ENERGY = 15;   // үүнээс доош бол автоматаар унтана
const LOW_HUNGER = 25;   // үүнээс доош бол гунигтай/өлссөн

/* --- State ----------------------------------------------------------------- */
let state = {
  hunger: 80,
  happiness: 80,
  energy: 90,
  sleeping: false,
  lastUpdated: Date.now(),
};

// Богино хугацааны хөдөлгөөний таймер (мс үлдсэн)
let actionAnim = { name: null, until: 0 };

/* --- Canvas ---------------------------------------------------------------- */
const petCanvas = document.getElementById('pet');
const pctx = petCanvas.getContext('2d');
pctx.imageSmoothingEnabled = false;

/* --- Decay (бодит хугацаагаар) --------------------------------------------- */
function applyDecay(elapsedMs) {
  if (elapsedMs <= 0) return;
  const hours = elapsedMs / 3_600_000;
  const sleepingNow = isSleeping();
  const rate = sleepingNow ? DECAY.sleeping : DECAY.awake;

  state.hunger    = clamp(state.hunger    - rate.hunger    * hours);
  state.happiness = clamp(state.happiness - rate.happiness * hours);
  state.energy    = clamp(state.energy    - rate.energy    * hours);
  state.lastUpdated = Date.now();
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }

// Унтаж байгаа эсэх: гар аргаар унтуулсан ЭСВЭЛ эрч хүч дэндүү бага
function isSleeping() {
  return state.sleeping || state.energy < LOW_ENERGY;
}

/* --- Аль анимацийн төлөв вэ ------------------------------------------------ */
function currentState() {
  if (actionAnim.name && Date.now() < actionAnim.until) return actionAnim.name;
  if (isSleeping()) return 'sleeping';
  if (state.hunger < LOW_HUNGER) return 'sad';
  return 'idle';
}

/* --- Interactions ---------------------------------------------------------- */
function triggerAnim(name, ms) {
  actionAnim = { name, until: Date.now() + ms };
}

function feed() {
  state.hunger = clamp(state.hunger + 25);
  state.happiness = clamp(state.happiness + 4);
  triggerAnim('eating', 1300);
  save();
}

function play() {
  if (state.energy < 10) {            // хэт ядарсан — тоглож чадахгүй
    triggerAnim('sad', 800);
    return;
  }
  state.happiness = clamp(state.happiness + 20);
  state.energy = clamp(state.energy - 15);
  triggerAnim('happy', 1300);         // 'happy' frame ашиглана
  save();
}

function petReaction() {               // дээр нь дармагц бяцхан баяр
  state.happiness = clamp(state.happiness + 6);
  triggerAnim('happy', 800);
  save();
}

function toggleSleep() {
  state.sleeping = !state.sleeping;
  state.lastUpdated = Date.now();
  save();
}

/* --- Persistence ----------------------------------------------------------- */
let saveTimer = 0;
async function save() {
  state.lastUpdated = Date.now();
  await API.save(state);
}
function scheduleAutosave() {
  clearInterval(saveTimer);
  saveTimer = setInterval(save, 5000);   // 5 секунд тутам
}

async function init() {
  const saved = await API.load();
  if (saved && typeof saved.hunger === 'number') {
    state = { ...state, ...saved };
    // Хаалттай байсан хугацааны decay-г тооцно
    applyDecay(Date.now() - (saved.lastUpdated || Date.now()));
  }
  drawIcons();
  scheduleAutosave();
  requestAnimationFrame(loop);
  // Web дээр меню хаах товчнуудыг нуух
  if (!API.isElectron) {
    document.querySelectorAll('.menu [data-act="hide"], .menu [data-act="quit"]')
      .forEach((el) => el.remove());
  }
}

/* --- Animation loop -------------------------------------------------------- */
let lastTime = performance.now();
let frameAccum = 0;
let frameIdx = 0;
let prevState = null;

function loop(now) {
  const dt = now - lastTime;
  lastTime = now;

  // 1) бодит хугацааны decay
  applyDecay(dt);

  // 2) frame урагшлуулах (~7 fps)
  frameAccum += dt;
  const st = currentState();
  if (st !== prevState) { frameIdx = 0; prevState = st; frameAccum = 0; }

  if (frameAccum >= FRAME_MS) {
    frameAccum = 0;
    const frames = S.FRAMES[st] || S.FRAMES.idle;
    frameIdx = (frameIdx + 1) % frames.length;
    render(st);
    updateStatusUI();
  }

  requestAnimationFrame(loop);
}

function render(st) {
  const frames = S.FRAMES[st] || S.FRAMES.idle;
  const grid = frames[frameIdx % frames.length];
  pctx.clearRect(0, 0, petCanvas.width, petCanvas.height);
  S.drawSprite(pctx, grid, SCALE);
}

/* --- Status UI ------------------------------------------------------------- */
function drawIcons() {
  document.querySelectorAll('.icon').forEach((cv) => {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    S.drawSprite(ctx, S.ICONS[cv.dataset.icon], 2);
  });
}
function updateStatusUI() {
  document.getElementById('bar-happy').style.width  = state.happiness + '%';
  document.getElementById('bar-hunger').style.width = state.hunger + '%';
  document.getElementById('bar-energy').style.width = state.energy + '%';
}

/* --- Hover: статус + товчнуудыг харуулах ----------------------------------- */
const statusEl = document.getElementById('status');
const controlsEl = document.getElementById('controls');
const app = document.getElementById('app');
app.addEventListener('mouseenter', () => {
  statusEl.classList.remove('hidden');
  controlsEl.classList.remove('hidden');
});
app.addEventListener('mouseleave', () => {
  statusEl.classList.add('hidden');
  controlsEl.classList.add('hidden');
  hideMenu();
});

/* --- Товч / меню actions --------------------------------------------------- */
function doAction(act) {
  switch (act) {
    case 'feed':  feed(); break;
    case 'play':  play(); break;
    case 'sleep': toggleSleep(); break;
    case 'hide':  API.hide(); break;
    case 'quit':  API.quit(); break;
  }
}
controlsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.btn');
  if (b) doAction(b.dataset.act);
});

/* --- Right-click цэс ------------------------------------------------------- */
const menuEl = document.getElementById('menu');
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const x = Math.min(e.clientX, window.innerWidth - 160);
  const y = Math.min(e.clientY, window.innerHeight - 180);
  menuEl.style.left = x + 'px';
  menuEl.style.top = y + 'px';
  menuEl.classList.remove('hidden');
});
menuEl.addEventListener('click', (e) => {
  const mi = e.target.closest('.mi');
  if (mi) { doAction(mi.dataset.act); hideMenu(); }
});
window.addEventListener('click', (e) => {
  if (!menuEl.contains(e.target)) hideMenu();
});
function hideMenu() { menuEl.classList.add('hidden'); }

/* --- Custom цонх чирэх + click ялгах --------------------------------------- */
let drag = null;
petCanvas.addEventListener('pointerdown', async (e) => {
  hideMenu();
  if (e.button !== 0) return;        // зөвхөн зүүн товч
  const base = await API.getPos();   // [x, y] цонхны байрлал
  drag = {
    startX: e.screenX,
    startY: e.screenY,
    winX: base[0],
    winY: base[1],
    moved: 0,
  };
  petCanvas.setPointerCapture(e.pointerId);
});
petCanvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.screenX - drag.startX;
  const dy = e.screenY - drag.startY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  if (API.isElectron) API.setPos(drag.winX + dx, drag.winY + dy);
});
petCanvas.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const wasClick = drag.moved < 6;   // бараг хөдөлгөөгүй бол = дарсан
  drag = null;
  try { petCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
  if (wasClick) petReaction();
});

/* --- Хаах/нуухад хадгална --------------------------------------------------- */
window.addEventListener('beforeunload', () => API.save(state));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});

init();
