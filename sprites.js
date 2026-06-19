/* =============================================================================
 * sprites.js  —  Pixelie бүх pixel-art өгөгдөл нэг файлд
 * =============================================================================
 *
 * ЯАЖ АЖИЛЛАДАГ ВЭ (How the sprite matrices work):
 *   - Амьтан болгон 16x16 тор (grid). Мөр бүр яг 16 тэмдэгттэй STRING.
 *   - Тэмдэгт бүр = 1 пиксел. Тухайн тэмдэгт ямар өнгөтэй болохыг доорх
 *     PALETTE map-аас хардаг (тэмдэгт -> hex өнгө).
 *   - '.' = тунгалаг (transparent), юу ч зурахгүй.
 *   - Renderer нэг тор нүдийг SCALE x SCALE (жишээ нь 12x12 px) блок болгож
 *     <canvas> дээр томруулж зурна.
 *
 * ШИНЭ ПИКСЕЛ ЗАСАХ / ШИНЭ АМЬТАН НЭМЭХ:
 *   1. PALETTE-д шинэ өнгө нэмж, өөрийн товчлол (нэг тэмдэгт) өг.
 *   2. Доорх FRAMES доторх string-үүдийг засаж/шинээр grid үүсгэ.
 *   3. Мөр бүр ЯГ 16 тэмдэгт, нийт 16 мөр байх ёстой (validate скрипт шалгана).
 *
 * Өнгөний түлхүүр (palette keys):
 *   .  тунгалаг        o  гадна зураас (outline)
 *   B  бие (body)      H  гэрэлтэлт (highlight)
 *   s  биеийн сүүдэр   e  нүд (eye)
 *   c  хацар (cheek)   m  ам (mouth)
 *   f  хоол (food)     d  дусал/нулимс (drop)
 *   z  нойрны "z"
 * ============================================================================= */

const PALETTE = {
  '.': null,          // transparent
  'o': '#5b4a6b',     // outline — гүн нил саарал
  'B': '#a8d8d0',     // body — зөөлөн мятан/teal
  's': '#7ec5bc',     // body shadow — биеийн доод сүүдэр
  'H': '#e8f7f4',     // highlight — гялбаа
  'e': '#3a3050',     // eye — бараан нүд
  'c': '#f6b8c8',     // cheek — ягаан хацар
  'm': '#5b4a6b',     // mouth — ам (outline-тэй ижил гүн өнгө)
  'f': '#d99a6c',     // food crumb — хоолны үртэс
  'd': '#8fc3e0',     // drop — цэнхэр дусал
  'z': '#9a86b3',     // sleep z — нойрны үсэг
};

/* ---------------------------------------------------------------------------
 * Бие бүгдэд нийтлэг силуэт. Доорх frame бүр энэ хэлбэр дээр зөвхөн НҮҮРийг
 * (нүд/ам/хацар) сольж байна. Тэгснээр амьтан тогтвортой "нэг амьтан" харагдана.
 * ------------------------------------------------------------------------- */

// IDLE A — тайван байдал, нүд нээлттэй
const IDLE_A = [
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBBBBBBBo...',
  '..oBBHHBBBBBBo..',
  '..oBBBBBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBccBBmmBBccBo.',
  '..oBBBBBBBBBBo..',
  '..oBsBBBBBBsBo..',
  '...oBssssssBo...',
  '....ooBssBoo....',
  '......oooo......',
];

// IDLE B — амьсгалах мэт жаахан "хавтгайрсан" (доош 1px бууж, өргөсөн)
const IDLE_B = [
  '................',
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBBBBBBBo...',
  '..oBBHHBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBccBBmmBBccBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBsBBBBBBBBsBo.',
  '..oBssssssssBo..',
  '...ooBsssssBoo..',
  '.....oooooo.....',
];

// HAPPY — баяртай: ам нээлттэй инээмсэглэл, хацар тод
const HAPPY = [
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBBBBBBBo...',
  '..oBBHHBBBBBBo..',
  '..oBBBBBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBcBBBBBBBBcBo.',
  '.oBccBmmmmBccBo.',
  '..oBBmmmmmmBBo..',
  '..oBBBmmmmBBBo..',
  '...oBssssssBo...',
  '....ooBssBoo....',
  '......oooo......',
];

// EATING — ам том нээлттэй + хажууд хоолны үртэс
const EATING = [
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBBBBBBBo...',
  '..oBBHHBBBBBBo..',
  '..oBBBBBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBeeBBBBeeBBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBBBmmmmBBBBof.',  // f = хоол ам руу орж байгаа нь
  '..oBBmmmmmmBBo..',
  '..oBBBmmmmBBBo..',
  '...oBssssssBo...',
  '....ooBssBoo....',
  '......oooo......',
];

// SLEEPING — нүд аниастай (хэвтээ зураас) + дээр нь "z"
const SLEEPING = [
  '..............z.',
  '......oooo...z..',
  '....ooBBBBooz...',
  '...oBBBBBBBBo...',
  '..oBBBBBBBBBBo..',
  '..oBBBBBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',  // аниастай нүд (нэг мөр зураас)
  '.oBBBBBBBBBBBBo.',
  '.oBccBBBBBBccBo.',
  '.oBBBBmmmmBBBBo.',  // тайван жижиг ам
  '..oBBBBBBBBBBo..',
  '..oBsBBBBBBsBo..',
  '...oBssssssBo...',
  '....ooBssBoo....',
  '......oooo......',
];

// SAD / HUNGRY — нүд доош, ам уруугаа эргэсэн, нэг дусал
const SAD = [
  '................',
  '......oooo......',
  '....ooBBBBoo....',
  '...oBBBBBBBBo...',
  '..oBBHHBBBBBBo..',
  '..oBBBBBBBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBBBBBBBBBBBo.',
  '.oBBeeBBBBeeBBo.',  // нүд жаахан доош
  '.oBBeeBBBBeedBo.',  // d = нэг дусал (нулимс)
  '.oBBBBmmmmBBBBo.',
  '..oBBmBBBBmBBo..',  // уруугаа эргэсэн ам
  '..oBsBBBBBBsBo..',
  '...oBssssssBo...',
  '....ooBssBoo....',
  '......oooo......',
];

/* ---------------------------------------------------------------------------
 * FRAMES: төлөв бүрийн frame-уудын дараалал.
 * Renderer эдгээрийг ээлжлэн (loop) зурна.
 * ------------------------------------------------------------------------- */
const FRAMES = {
  idle:     [IDLE_A, IDLE_B],   // 2 frame — зөөлөн bob
  happy:    [HAPPY, IDLE_A],    // баярлах хөдөлгөөн
  eating:   [EATING, IDLE_A],   // зажлах
  sleeping: [SLEEPING],         // нэг frame (тайван)
  sad:      [SAD, IDLE_A],      // өлссөн/гунигтай
};

/* ---------------------------------------------------------------------------
 * UI ICONS — статусыг харуулах жижиг 7x7 pixel icon-ууд (мөн ижил pixel загвар)
 * ------------------------------------------------------------------------- */
const ICONS = {
  // Зүрх (happiness) — ягаан
  heart: [
    '.cc.cc.',
    'ccccccc',
    'ccccccc',
    'ccccccc',
    '.ccccc.',
    '..ccc..',
    '...c...',
  ],
  // Хоол (hunger) — drumstick маягийн үртэс
  food: [
    '..ff...',
    '.ffff..',
    'ffffff.',
    'ffffff.',
    '.fffff.',
    '..ooo..',
    '...oo..',
  ],
  // Эрч хүч (energy) — аянга
  energy: [
    '...zz..',
    '..zz...',
    '.zzzz..',
    '..zz...',
    '.zz....',
    'zz.....',
    'z......',
  ],
};

/* ---------------------------------------------------------------------------
 * drawSprite(ctx, grid, scale, offsetX, offsetY, palette?)
 *   - grid: string мөрүүдийн массив
 *   - scale: нэг нүдийг хэдэн px болгох (жишээ 12)
 *   - offsetX/Y: canvas дээрх байрлал (px)
 * ------------------------------------------------------------------------- */
function drawSprite(ctx, grid, scale, offsetX = 0, offsetY = 0, palette = PALETTE) {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue; // тунгалаг
      ctx.fillStyle = color;
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    }
  }
}

/* ---------------------------------------------------------------------------
 * Экспорт — Electron (CommonJS) ба browser (window) аль алинд ажиллана.
 * ------------------------------------------------------------------------- */
const SPRITES = { PALETTE, FRAMES, ICONS, drawSprite };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPRITES;
}
if (typeof window !== 'undefined') {
  window.SPRITES = SPRITES;
}
