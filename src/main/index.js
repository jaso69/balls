import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// DESHABILITAR ACELERACIÓN DE HARDWARE (para evitar errores VAAPI)
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-accelerated-video-decode')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false, // AÑADIR ESTO para permitir require/import en renderer
      contextIsolation: true // AÑADIR ESTO para facilitar la comunicación
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Resto de tus manejadores ipcMain...
ipcMain.handle('leer-directorios', async (event, rutaBase) => {
  try {
    const archivos = await fs.readdir(rutaBase)
    const directorios = []

    for (const archivo of archivos) {
      const rutaCompleta = path.join(rutaBase, archivo)
      const stats = await fs.stat(rutaCompleta)

      if (stats.isDirectory()) {
        directorios.push({
          nombre: archivo,
          ruta: rutaCompleta,
          fechaModificacion: stats.mtime
        })
      }
    }

    return directorios
  } catch (error) {
    console.error('Error al leer directorios:', error)
    return { error: error.message }
  }
})

ipcMain.handle('seleccionar-directorio', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return { ruta: result.filePaths[0] }
  }
  return { error: 'No se seleccionó ningún directorio' }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
