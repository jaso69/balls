import { contextBridge, ipcRenderer } from 'electron'

console.log('🔧 PRELOAD: Iniciando carga...')

// Exponer APIs
try {
  contextBridge.exposeInMainWorld('electron', {
    leerDirectorios: (rutaBase) => {
      console.log('📞 PRELOAD: llamando a leerDirectorios con:', rutaBase)
      return ipcRenderer.invoke('leer-directorios', rutaBase)
    },
    seleccionarDirectorio: () => {
      console.log('📞 PRELOAD: llamando a seleccionarDirectorio')
      return ipcRenderer.invoke('seleccionar-directorio')
    }
  })
  console.log('✅ PRELOAD: API expuesta correctamente')
} catch (error) {
  console.error('❌ PRELOAD: Error al exponer API:', error)
}

console.log('🔧 PRELOAD: Cargado completamente')
