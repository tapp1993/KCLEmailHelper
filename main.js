const { Menu, ipcMain } = require("electron");
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let win;
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  Menu.setApplicationMenu(false);
  win = new BrowserWindow({
      width: 1400,
      height: 800,
      webPreferences: {
        nodeIntegration: true
      }
    })

    win.maximize();
    // win.webContents.openDevTools();
    win.loadFile("index.html");
    win.once('ready-to-show', () => {
      autoUpdater.checkForUpdatesAndNotify();
    });
    win.on('closed', function() {
        win = null;
    })
});

app.on(
  "window-all-closed",
  () => process.platform !== "darwin" && app.quit() // "darwin" targets macOS only.
);

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
})