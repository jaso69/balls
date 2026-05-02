import { contextBridge, ipcRenderer } from 'electron'

try {
  contextBridge.exposeInMainWorld('electron', {
    leerDirectorios: (rutaBase) => {
      return ipcRenderer.invoke('leer-directorios', rutaBase)
    },
    seleccionarDirectorio: () => {
      return ipcRenderer.invoke('seleccionar-directorio')
    },
    cerrarApp: () => {
      ipcRenderer.send('cerrar-app')
    },
    leerArchivos: (rutaCarpeta) => {
      return ipcRenderer.invoke('leer-archivos', rutaCarpeta)
    },
    abrirArchivo: (rutaArchivo) => {
      return ipcRenderer.invoke('abrir-archivo', rutaArchivo)
    },
    contenidoArchivo: (rutaArchivo) => {
      return ipcRenderer.invoke('contenido-archivo', rutaArchivo)
    }
  })
} catch (e) {
  console.error('PRELOAD ERROR:', e)
}

try {
  contextBridge.exposeInMainWorld('__preload_ok', true)
} catch (e) {
  // ignore
}
