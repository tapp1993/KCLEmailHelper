const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let win;

app.on('ready', () => {
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true
      }
    })

    win.setAutoHideMenuBar(true);
    win.webContents.openDevTools();
    win.loadFile("index.html");

    win.on('closed', function() {
        win = null;
    })
});

app.on(
  "window-all-closed",
  () => process.platform !== "darwin" && app.quit() // "darwin" targets macOS only.
);