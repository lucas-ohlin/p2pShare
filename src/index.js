const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  
      contextIsolation: true,
      nodeIntegration: true
    }
  });

  win.loadFile('src/index.html');
  win.webContents.openDevTools();  
});
