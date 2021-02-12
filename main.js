const { Menu } = require("electron");
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let win;

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