const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cashflowDesktop", {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke("desktop-open-external", url),
});
