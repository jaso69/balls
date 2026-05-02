import { contextBridge, ipcRenderer } from 'electron'

try {
  contextBridge.exposeInMainWorld('electron', {
    obtenerRutaResources: () => ipcRenderer.invoke('obtener-ruta-resources'),
    cambiarCarpetaResources: () => ipcRenderer.invoke('cambiar-carpeta-resources'),
    abrirCarpetaResources: () => ipcRenderer.invoke('abrir-carpeta-resources'),
    leerDirectorios: (rutaBase) => ipcRenderer.invoke('leer-directorios', rutaBase),
    seleccionarDirectorio: () => ipcRenderer.invoke('seleccionar-directorio'),
    cerrarApp: () => ipcRenderer.send('cerrar-app'),
    leerArchivos: (rutaCarpeta) => ipcRenderer.invoke('leer-archivos', rutaCarpeta),
    abrirArchivo: (rutaArchivo) => ipcRenderer.invoke('abrir-archivo', rutaArchivo),
    contenidoArchivo: (rutaArchivo) => ipcRenderer.invoke('contenido-archivo', rutaArchivo)
  })
} catch (e) {
  console.error('PRELOAD ERROR:', e)
}
