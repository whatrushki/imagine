const { app, BrowserWindow, shell, nativeTheme } = require('electron');
const path = require('path');

function createWindow() {
  // Enforce light theme for native Windows window frame and titlebar
  nativeTheme.themeSource = 'light';

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 850,
    minHeight: 550,
    backgroundColor: '#ffffff',
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setBackgroundColor('#ffffff');
  win.setMenuBarVisibility(false);

  // Open target="_blank" links in external browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
