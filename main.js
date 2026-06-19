/* =============================================================================
 * main.js  —  Electron үндсэн процесс
 *   - Frameless / transparent / always-on-top / draggable цонх
 *   - System tray icon (Show/Hide + Quit)
 *   - Төлвийг userData доторх JSON файлд хадгална
 * ============================================================================= */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const STATE_FILE = path.join(app.getPath('userData'), 'pixelie-state.json');

let win = null;
let tray = null;

/* --- Tray icon: sprites.js-ээс үүсгэсэн жижиг PNG-г base64-р суулгав --------- */
const TRAY_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6UlEQVR4nGNgGOmAkVQN0V7Z//HJL902lSQzmUh1ALUBCyEF6D727UslpAVFPaEQGfAQwOk6mM+J8DFesLloNgMDA+6QGHwhgMvnDvIqKPwDD++QZBGukBjwECCYC2CAVB8TCwY8BODxQa1UTwigp4UBDwGCaWBSRAMKP29FA1Z15Kof8BAYdQDBNEAoDilVP3hDwO/BDxT+JgUOFD4sP8MAevlBSD8MDHgIEF0bUgoGbW1I0AHX3r5huPb2DckGE6tvwEOA6DYhqaGgJSzCwMAwFNuE6ABXvwA9RNB9DANDt1+ACwy7viEAcAtg40+MiywAAAAASUVORK5CYII=';

function trayImage() {
  return nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON_B64);
}

/* --- Persistence ----------------------------------------------------------- */
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return null; // анх удаа — renderer default үүсгэнэ
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('saveState error:', e);
    return false;
  }
}

/* --- Window ---------------------------------------------------------------- */
function createWindow() {
  win = new BrowserWindow({
    width: 240,
    height: 280,
    frame: false,            // хүрээгүй
    transparent: true,       // тунгалаг дэвсгэр
    alwaysOnTop: true,       // үргэлж дээр
    resizable: false,
    skipTaskbar: true,       // taskbar-д харагдахгүй (tray-ээр удирдана)
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  win.setAlwaysOnTop(true, 'screen-saver');

  // X дарахад хаахгүй — зөвхөн нуу (tray-ээс буцааж нээнэ)
  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

/* --- Tray ------------------------------------------------------------------ */
function createTray() {
  tray = new Tray(trayImage());
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        if (win.isVisible()) win.hide();
        else win.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Pixelie');
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

/* --- IPC ------------------------------------------------------------------- */
ipcMain.handle('pixelie:load', () => loadState());
ipcMain.handle('pixelie:save', (_evt, state) => saveState(state));
ipcMain.handle('pixelie:getPos', () => (win ? win.getPosition() : [0, 0]));
ipcMain.on('pixelie:setPos', (_evt, x, y) => win && win.setPosition(Math.round(x), Math.round(y)));
ipcMain.on('pixelie:quit', () => {
  app.isQuiting = true;
  app.quit();
});
ipcMain.on('pixelie:hide', () => win && win.hide());

/* --- App lifecycle --------------------------------------------------------- */
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// tray-тэй учир бүх цонх хаагдсан ч апп нээлттэй хэвээр (Windows/Linux)
app.on('window-all-closed', (e) => {
  // юу ч хийхгүй — tray-ээр quit хийнэ
});
