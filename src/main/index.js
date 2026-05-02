import { app, shell, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-accelerated-video-decode')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

ipcMain.handle('leer-archivos', async (event, rutaCarpeta) => {
  try {
    const archivos = await fs.readdir(rutaCarpeta)
    const items = []

    for (const archivo of archivos) {
      const rutaCompleta = path.join(rutaCarpeta, archivo)
      const stats = await fs.stat(rutaCompleta)

      items.push({
        nombre: archivo,
        ruta: rutaCompleta,
        esDirectorio: stats.isDirectory(),
        tamaño: stats.size,
        fechaModificacion: stats.mtime
      })
    }

    return items
  } catch (error) {
    console.error('Error al leer archivos:', error)
    return { error: error.message }
  }
})

ipcMain.handle('abrir-archivo', async (event, rutaArchivo) => {
  try {
    await shell.openPath(rutaArchivo)
    return { ok: true }
  } catch (error) {
    return { error: error.message }
  }
})

ipcMain.handle('contenido-archivo', async (event, rutaArchivo) => {
  try {
    const ext = path.extname(rutaArchivo).toLowerCase()
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico']
    const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.ogg']

    if (imageExts.includes(ext)) {
      const buffer = await fs.readFile(rutaArchivo)
      const mime = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
      }[ext] || 'application/octet-stream'
      return { tipo: 'imagen', data: `data:${mime};base64,${buffer.toString('base64')}`, nombre: path.basename(rutaArchivo) }
    }

    if (videoExts.includes(ext)) {
      const fileUrl = pathToFileURL(rutaArchivo).href
      return { tipo: 'video', data: fileUrl, nombre: path.basename(rutaArchivo) }
    }

    if (ext === '.pdf') {
      const fileUrl = pathToFileURL(rutaArchivo).href
      return { tipo: 'pdf', data: fileUrl, nombre: path.basename(rutaArchivo) }
    }

    const buffer = await fs.readFile(rutaArchivo)
    return { tipo: 'texto', data: buffer.toString('utf-8'), nombre: path.basename(rutaArchivo) }
  } catch (error) {
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

process.on('uncaughtException', (err) => {
  console.error('[MAIN] UNCAUGHT:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('[MAIN] UNHANDLED REJECTION:', reason)
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('cerrar-app', () => {
    app.quit()
  })

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
