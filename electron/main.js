const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = process.env.PORT || 5005;
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

function isServerRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

function startBackendServer() {
  return new Promise((resolve) => {
    console.log('[Electron] Starting internal backend server...');
    const backendPath = path.join(__dirname, '..', 'backend', 'index.js');
    
    backendProcess = spawn(process.execPath, [backendPath], {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
      console.error('[Electron] Failed to start backend server:', err);
    });

    // Poll server until ready
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const running = await isServerRunning(BACKEND_URL);
      if (running || attempts > 20) {
        clearInterval(interval);
        resolve();
      }
    }, 500);
  });
}

async function createWindow() {
  const running = await isServerRunning(BACKEND_URL);
  if (!running) {
    await startBackendServer();
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    title: 'AI B-Roll Downloader',
    backgroundColor: '#0F0F12',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
