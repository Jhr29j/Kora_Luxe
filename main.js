const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'electron', 'preload.js')
    }
  });

  win.setMenu(null);

  win.loadFile(path.join(__dirname, 'electron', 'render', 'login.html'));

  ipcMain.on('print-page', (event) => {
    event.sender.print({ silent: false, printBackground: true, color: true });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
