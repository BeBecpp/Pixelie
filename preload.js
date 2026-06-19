/* =============================================================================
 * preload.js  —  Renderer-т аюулгүй API дамжуулна (contextIsolation: true)
 *   window.pixelAPI.load()  -> Promise<state|null>
 *   window.pixelAPI.save(s) -> Promise<bool>
 *   window.pixelAPI.hide() / quit()
 * ============================================================================= */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pixelAPI', {
  isElectron: true,
  load: () => ipcRenderer.invoke('pixelie:load'),
  save: (state) => ipcRenderer.invoke('pixelie:save', state),
  getPos: () => ipcRenderer.invoke('pixelie:getPos'),
  setPos: (x, y) => ipcRenderer.send('pixelie:setPos', x, y),
  hide: () => ipcRenderer.send('pixelie:hide'),
  quit: () => ipcRenderer.send('pixelie:quit'),
});
