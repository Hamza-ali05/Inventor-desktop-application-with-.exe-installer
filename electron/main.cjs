const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let viteProcess = null;
let mainWindow = null;

const isDev = !app.isPackaged;
const devServerUrl = 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Hussnain Traders - Inventory',
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startViteDevServer() {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    viteProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true,
    });

    viteProcess.stdout.on('data', (data) => {
      const str = data.toString();
      if (str.includes('Local:') || str.includes('localhost')) {
        resolve();
      }
    });

    viteProcess.stderr.on('data', (data) => {
      const str = data.toString();
      if (str.includes('Local:') || str.includes('localhost')) {
        resolve();
      }
    });

    viteProcess.on('error', reject);

    // Fallback: assume server is ready after 3 seconds
    setTimeout(resolve, 3000);
  });
}

app.whenReady().then(async () => {
  if (isDev) {
    await startViteDevServer();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (viteProcess) {
    viteProcess.kill();
    viteProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});
