const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("cashflowDesktop", {
  isDesktop: true,
});
