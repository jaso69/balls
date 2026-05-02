let carpetas = []
let disableClick = false

function createStars() {
  const container = document.createElement('div')
  container.classList.add('stars-container')
  document.body.appendChild(container)

  const starCount = 80
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div')
    star.classList.add('star')
    const size = Math.random() * 3 + 1
    const x = Math.random() * 100
    const y = Math.random() * 100
    const duration = Math.random() * 3 + 2
    const delay = Math.random() * 5
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      --duration: ${duration}s;
      --delay: ${delay}s;
    `
    container.appendChild(star)
  }

  for (let i = 0; i < 5; i++) {
    const shootingStar = document.createElement('div')
    shootingStar.classList.add('shooting-star')
    const startX = Math.random() * 100
    const startY = Math.random() * 50
    const duration = Math.random() * 1 + 0.5
    shootingStar.style.cssText = `
      left: ${startX}%;
      top: ${startY}%;
      animation-duration: ${duration}s;
      animation-delay: ${Math.random() * 10}s;
    `
    container.appendChild(shootingStar)
  }
}

function createNebula() {
  const nebula = document.createElement('div')
  nebula.classList.add('nebula')
  document.body.appendChild(nebula)
}

createStars()
createNebula()

eventListener()

const logoText = document.createElement('img')
logoText.src = './assets/naturgy-Logo.png'
logoText.style.position = 'absolute'
logoText.style.top = '90%'
logoText.style.left = '1%'
logoText.style.width = '150px'
document.body.appendChild(logoText)

const closeButton = document.createElement('div')
closeButton.classList.add('close-btn')
closeButton.innerHTML = '&#x2715;'
closeButton.title = 'Cerrar aplicación'
closeButton.addEventListener('click', () => {
  if (window.electron && window.electron.cerrarApp) {
    window.electron.cerrarApp()
  }
})
document.body.appendChild(closeButton)

const dragBar = document.createElement('div')
dragBar.classList.add('drag-bar')
document.body.appendChild(dragBar)

async function cargarCarpetas(rutaBase) {
  try {
    if (!window.electron) {
      console.error('❌ window.electron no está disponible. Verifica el preload.')
      return []
    }
    if (!window.electron.leerDirectorios) {
      console.error('❌ electron.leerDirectorios no es una función')
      console.log('🔍 window.electron disponible:', Object.keys(window.electron))
      return []
    }
    console.log('🔄 Cargando carpetas desde:', rutaBase)
    const resultado = await window.electron.leerDirectorios(rutaBase)

    if (resultado.error) {
      console.error('Error:', resultado.error)
      return []
    }

    carpetas = resultado
    return carpetas
  } catch (error) {
    console.error('Error al cargar carpetas:', error)
    return []
  }
}

async function inicializar() {
  if (window.electron && window.electron.obtenerRutaResources) {
    const ruta = await window.electron.obtenerRutaResources()
    console.log('📁 Ruta resources:', ruta)
    await cargarCarpetas(ruta)
  }
  console.log('Carpetas cargadas:', carpetas)
}
inicializar()

let justDragged = false

function createBurstEffect(x, y) {
  const burstCount = 12
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2
    const distance = 80 + Math.random() * 40
    const tx = Math.cos(angle) * distance
    const ty = Math.sin(angle) * distance

    const particle = document.createElement('div')
    particle.classList.add('orb-burst')
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    particle.style.setProperty('--tx', `${tx}px`)
    particle.style.setProperty('--ty', `${ty}px`)
    particle.style.width = `${Math.random() * 4 + 2}px`
    particle.style.height = particle.style.width
    document.body.appendChild(particle)

    setTimeout(() => particle.remove(), 800)
  }
}

function createOrb(event) {
  if (disableClick || justDragged) return
  if (event.target.closest('#drawing-toolbar') || event.target.closest('#drawing-canvas')) {
    console.log('🖱️ Click en toolbar/canvas, ignorando')
    return
  }
  console.log('🖱️ createOrb called')
  const x = event.clientX || (event.touches && event.touches[0].clientX)
  const y = event.clientY || (event.touches && event.touches[0].clientY)

  createBurstEffect(x, y)

  const group = [
    createOrb1(event, x, y, 'center'),
    createOrb1(event, x, y, 'up'),
    createOrb1(event, x, y, 'upRight'),
    createOrb1(event, x, y, 'upLeft'),
    createOrb1(event, x, y, 'down'),
    createOrb1(event, x, y, 'downRight'),
    createOrb1(event, x, y, 'downLeft'),
    createOrb1(event, x, y, 'left'),
    createOrb1(event, x, y, 'right'),
  ]

  makeDraggable(group)
}

function makeDraggable(group) {
  const center = group[0]
  let dragging = false
  let startX, startY, startPositions, moved
  let rafId = null
  let targetLeft, targetTop
  let closed = false

  function getXY(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }
  }

  function closeGroup() {
    if (closed) return
    closed = true
    group.forEach((o) => {
      o.style.transition = 'opacity 0.4s ease'
      o.style.opacity = '0'
    })
    setTimeout(() => group.forEach((o) => o.remove()), 400)
  }

  function onStart(e) {
    if (closed) return
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    moved = false
    const pos = getXY(e)
    startX = pos.x
    startY = pos.y
    startPositions = group.map((orb) => ({
      left: parseFloat(orb.style.left),
      top: parseFloat(orb.style.top),
    }))
    targetLeft = startPositions[0].left
    targetTop = startPositions[0].top

    group.forEach((orb, i) => {
      if (i > 0) orb.style.transition = 'none'
    })

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    rafId = requestAnimationFrame(animate)
  }

  function onMove(e) {
    if (!dragging) return
    e.preventDefault()
    const pos = getXY(e)
    const dx = pos.x - startX
    const dy = pos.y - startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true

    center.style.left = `${startPositions[0].left + dx}px`
    center.style.top = `${startPositions[0].top + dy}px`
    targetLeft = startPositions[0].left + dx
    targetTop = startPositions[0].top + dy
  }

  function animate() {
    if (!dragging) return
    for (let i = 1; i < group.length; i++) {
      const orb = group[i]
      const cx = parseFloat(orb.style.left) || 0
      const cy = parseFloat(orb.style.top) || 0
      const lag = 0.08 + i * 0.012
      orb.style.left = `${cx + (targetLeft - cx) * lag}px`
      orb.style.top = `${cy + (targetTop - cy) * lag}px`
    }
    rafId = requestAnimationFrame(animate)
  }

  function onEnd() {
    if (!dragging) return
    dragging = false
    if (rafId) cancelAnimationFrame(rafId)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)

    if (!moved) {
      closeGroup()
    } else {
      justDragged = true
      setTimeout(() => { justDragged = false }, 100)
    }
  }

  center.addEventListener('mousedown', onStart)
  center.addEventListener('touchstart', onStart, { passive: false })
  center.addEventListener('click', (e) => {
    e.stopPropagation()
    if (!moved) closeGroup()
  })
}

function eventListener() {
  if (disableClick) return
  document.body.addEventListener('click', (e) => {
    console.log('🖱️ Body click en:', e.target.tagName, e.target.id, e.target.className)
    createOrb(e)
  })
  document.body.addEventListener('touchstart', createOrb, { passive: true })
}

function newOrb(x, y, className) {
  const orb = document.createElement('div')
  orb.style.left = `${x}px`
  orb.style.top = `${y}px`
  document.body.appendChild(orb)
  orb.classList.add(className)
  orb.classList.add('removeOrbs')
  orb.classList.add(`classSel-${x}`)
  if (className !== 'orb') {
    orb.addEventListener('click', (e) => {
      e.stopPropagation()
      const ruta = orb.dataset.ruta
      if (ruta) showFilesPanel(ruta, orb)
    })
  }
  return orb
}

function createOrb1(event, xx, yy, position) {
  const isCenter = position === 'center'
  const offset = isCenter ? 50 : 30
  const x = xx - offset
  const y = yy - offset
  let orb
  if (position === 'center') {
    orb = newOrb(x, y, 'orb')
  }
  if (position === 'up') {
    orb = newOrb(x, y, 'orb3')
    if (carpetas[0]) orb.dataset.ruta = carpetas[0].ruta
    addTextToOrb(orb, 'up')
  }

  if (position === 'upRight') {
    orb = newOrb(x, y, 'orb5')
    if (carpetas[1]) orb.dataset.ruta = carpetas[1].ruta
    addTextToOrb(orb, 'upRight')
  }

  if (position === 'upLeft') {
    orb = newOrb(x, y, 'orb6')
    if (carpetas[7]) orb.dataset.ruta = carpetas[7].ruta
    addTextToOrb(orb, 'upLeft')
  }

  if (position === 'down') {
    orb = newOrb(x, y, 'orb4')
    if (carpetas[4]) orb.dataset.ruta = carpetas[4].ruta
    addTextToOrb(orb, 'down')
  }

  if (position === 'downRight') {
    orb = newOrb(x, y, 'orb7')
    if (carpetas[3]) orb.dataset.ruta = carpetas[3].ruta
    addTextToOrb(orb, 'downRight')
  }

  if (position === 'downLeft') {
    orb = newOrb(x, y, 'orb8')
    if (carpetas[5]) orb.dataset.ruta = carpetas[5].ruta
    addTextToOrb(orb, 'downLeft')
  }

  if (position === 'left') {
    orb = newOrb(x, y, 'orb2')
    if (carpetas[6]) orb.dataset.ruta = carpetas[6].ruta
    addTextToOrb(orb, 'left')
  }
  if (position === 'right') {
    orb = newOrb(x, y, 'orb1')
    if (carpetas[2]) orb.dataset.ruta = carpetas[2].ruta
    addTextToOrb(orb, 'right')
  }
  return orb
}

async function showFilesPanel(rutaCarpeta, orbElement) {
  const existing = document.querySelector('.files-panel')
  if (existing) existing.remove()

  const panel = document.createElement('div')
  panel.classList.add('files-panel')
  panel.innerHTML = '<div class="files-loading">Cargando...</div>'

  const orbRect = orbElement.getBoundingClientRect()
  panel.style.left = `${orbRect.left + orbRect.width / 2}px`
  panel.style.top = `${orbRect.top + orbRect.height + 10}px`
  document.body.appendChild(panel)

  if (!window.electron || !window.electron.leerArchivos) {
    panel.innerHTML = '<div class="files-empty">No disponible</div>'
    return
  }

  const items = await window.electron.leerArchivos(rutaCarpeta)

  if (items.error) {
    panel.innerHTML = `<div class="files-error">${items.error}</div>`
    return
  }

  if (items.length === 0) {
    panel.innerHTML = '<div class="files-empty">Carpeta vacía</div>'
    return
  }

  const dirs = items.filter((i) => i.esDirectorio).sort((a, b) => a.nombre.localeCompare(b.nombre))
  const files = items.filter((i) => !i.esDirectorio).sort((a, b) => a.nombre.localeCompare(b.nombre))
  const sorted = [...dirs, ...files]

  panel.innerHTML = ''

  const title = document.createElement('div')
  title.classList.add('files-title')
  const folderName = rutaCarpeta.split('/').pop()
  title.textContent = folderName
  panel.appendChild(title)

  const list = document.createElement('div')
  list.classList.add('files-list')

  sorted.forEach((item) => {
    const row = document.createElement('div')
    row.classList.add('files-item')

    const icon = document.createElement('span')
    icon.classList.add('files-icon')
    icon.textContent = item.esDirectorio ? '📁' : '📄'

    const name = document.createElement('span')
    name.classList.add('files-name')
    name.textContent = item.nombre

    row.appendChild(icon)
    row.appendChild(name)

    if (!item.esDirectorio) {
      row.addEventListener('click', async (e) => {
        e.stopPropagation()
        panel.remove()
        openFileViewer(item.ruta)
      })
    }

    list.appendChild(row)
  })

  panel.appendChild(list)

  setTimeout(() => {
    const close = (e) => {
      if (!panel.contains(e.target) && !orbElement.contains(e.target)) {
        panel.remove()
        document.removeEventListener('click', close)
      }
    }
    document.addEventListener('click', close)
  }, 10)
}

async function openFileViewer(rutaArchivo) {
  const viewer = document.createElement('div')
  viewer.classList.add('file-viewer')

  const dragBar = document.createElement('div')
  dragBar.classList.add('file-viewer-dragbar')
  dragBar.style.cssText = 'width:100%;height:20px;cursor:grab;position:absolute;top:0;left:0;z-index:10;'

  const closeBtn = document.createElement('div')
  closeBtn.classList.add('file-viewer-close')
  closeBtn.innerHTML = '&#x2715;'

  const content = document.createElement('div')
  content.classList.add('file-viewer-content')

  viewer.appendChild(content)
  viewer.appendChild(dragBar)
  viewer.appendChild(closeBtn)
  document.body.appendChild(viewer)

  viewer.addEventListener('click', (e) => e.stopPropagation())
  viewer.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })

  let offsetX = Math.random() * 200
  let offsetY = Math.random() * 200
  viewer.style.left = `${60 + offsetX}px`
  viewer.style.top = `${40 + offsetY}px`

  let dragging = false
  let dragStartX, dragStartY, startLeft, startTop

  function makeDraggable(target) {
    target.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return
      e.stopPropagation()
      dragging = true
      dragStartX = e.clientX
      dragStartY = e.clientY
      startLeft = viewer.offsetLeft
      startTop = viewer.offsetTop
      e.preventDefault()
    })

    target.addEventListener('touchstart', (e) => {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return
      if (e.touches.length === 1) {
        dragging = true
        dragStartX = e.touches[0].clientX
        dragStartY = e.touches[0].clientY
        startLeft = viewer.offsetLeft
        startTop = viewer.offsetTop
      }
    }, { passive: true })
  }

  makeDraggable(dragBar)
  makeDraggable(viewer)

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return
    viewer.style.left = `${startLeft + (e.clientX - dragStartX)}px`
    viewer.style.top = `${startTop + (e.clientY - dragStartY)}px`
  })

  document.addEventListener('mouseup', () => { dragging = false })

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return
    viewer.style.left = `${startLeft + (e.touches[0].clientX - dragStartX)}px`
    viewer.style.top = `${startTop + (e.touches[0].clientY - dragStartY)}px`
  }, { passive: true })

  document.addEventListener('touchend', () => { dragging = false })

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    viewer.remove()
  })

  if (!window.electron || !window.electron.contenidoArchivo) {
    content.innerHTML = '<div class="file-viewer-error">No disponible</div>'
    return
  }
  const resultado = await window.electron.contenidoArchivo(rutaArchivo)
  if (resultado.error) {
    content.innerHTML = `<div class="file-viewer-error">${resultado.error}</div>`
    return
  }

  if (resultado.tipo === 'imagen') {
    const img = document.createElement('img')
    img.src = resultado.data
    img.classList.add('file-viewer-img')
    img.draggable = false
    content.appendChild(img)
    setupPinchZoom(viewer, img)
  } else if (resultado.tipo === 'video') {
    const video = document.createElement('video')
    video.src = resultado.data
    video.controls = true
    video.classList.add('file-viewer-video')
    content.appendChild(video)
    setupPinchZoom(viewer, video)
  } else if (resultado.tipo === 'pdf') {
    const iframe = document.createElement('iframe')
    iframe.src = resultado.data
    iframe.classList.add('file-viewer-pdf')
    iframe.setAttribute('frameborder', '0')
    content.appendChild(iframe)
    setupPinchZoom(viewer, iframe)
  } else {
    const pre = document.createElement('pre')
    pre.classList.add('file-viewer-text')
    pre.textContent = resultado.data
    content.appendChild(pre)
    setupPinchZoom(viewer, pre)
  }
}

function setupPinchZoom(container, element) {
  let scale = 1
  let startDist = 0
  let startScale = 1
  let panX = 0
  let panY = 0
  let startX = 0
  let startY = 0
  let startPanX = 0
  let startPanY = 0
  let pinching = false
  let panning = false

  function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function getMidpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    }
  }

  function applyTransform() {
    element.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault()
      pinching = true
      panning = false
      startDist = getDistance(e.touches[0], e.touches[1])
      startScale = scale
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault()
      panning = true
      pinching = false
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startPanX = panX
      startPanY = panY
    }
  }

  function onTouchMove(e) {
    if (pinching && e.touches.length === 2) {
      e.preventDefault()
      const dist = getDistance(e.touches[0], e.touches[1])
      const newScale = Math.min(Math.max(startScale * (dist / startDist), 0.5), 5)

      const mid = getMidpoint(e.touches[0], e.touches[1])
      const rect = element.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      const scaleChange = newScale / scale
      panX = mid.x - cx + (panX - (mid.x - cx)) * scaleChange
      panY = mid.y - cy + (panY - (mid.y - cy)) * scaleChange

      scale = newScale
      applyTransform()
    } else if (panning && e.touches.length === 1) {
      e.preventDefault()
      panX = startPanX + (e.touches[0].clientX - startX)
      panY = startPanY + (e.touches[0].clientY - startY)
      applyTransform()
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) pinching = false
    if (e.touches.length === 0) panning = false
  }

  function onWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 5)

    const rect = element.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const scaleChange = newScale / scale
    panX = e.clientX - cx + (panX - (e.clientX - cx)) * scaleChange
    panY = e.clientY - cy + (panY - (e.clientY - cy)) * scaleChange

    scale = newScale
    applyTransform()
  }

  function onDblClick(e) {
    e.stopPropagation()
    scale = 1
    panX = 0
    panY = 0
    applyTransform()
  }

  container.addEventListener('touchstart', onTouchStart, { passive: false })
  container.addEventListener('touchmove', onTouchMove, { passive: false })
  container.addEventListener('touchend', onTouchEnd)
  container.addEventListener('wheel', onWheel, { passive: false })
  container.addEventListener('dblclick', onDblClick)
}

function addTextToOrb(orb, position) {
  let nombreCarpeta = null
  const textInside = document.createElement('span')
  if (position === 'up' && carpetas[0]) nombreCarpeta = carpetas[0].nombre.substring(2)
  if (position === 'upRight' && carpetas[1]) nombreCarpeta = carpetas[1].nombre.substring(2)
  if (position === 'right' && carpetas[2]) nombreCarpeta = carpetas[2].nombre.substring(2)
  if (position === 'downRight' && carpetas[3]) nombreCarpeta = carpetas[3].nombre.substring(2)
  if (position === 'down' && carpetas[4]) nombreCarpeta = carpetas[4].nombre.substring(2)
  if (position === 'downLeft' && carpetas[5]) nombreCarpeta = carpetas[5].nombre.substring(2)
  if (position === 'left' && carpetas[6]) nombreCarpeta = carpetas[6].nombre.substring(2)
  if (position === 'upLeft' && carpetas[7]) nombreCarpeta = carpetas[7].nombre.substring(2)
  textInside.textContent = nombreCarpeta
  textInside.style.position = 'absolute'
  textInside.style.top = '50%'
  textInside.style.left = '50%'
  textInside.style.transform = 'translate(-50%, -50%)'
  textInside.style.color = '#ffffff'
  textInside.style.fontSize = '12px'
  textInside.style.fontWeight = 'bold'
  textInside.classList.add('m2t')
  //textInside.style.zIndex = '2'
  orb.appendChild(textInside)
}

function initDrawing() {
  console.log('🎨 initDrawing: Creando toolbar y canvas...')
  const canvas = document.createElement('canvas')
  canvas.id = 'drawing-canvas'
  canvas.classList.add('drawing-canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9998;pointer-events:none;touch-action:none;'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')

  const toolbar = document.createElement('div')
  toolbar.id = 'drawing-toolbar'
  toolbar.classList.add('drawing-toolbar')
  toolbar.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(10,15,30,0.95);border:1px solid rgba(100,180,255,0.3);border-top:none;border-radius:0 0 12px 12px;z-index:10000;user-select:none;-webkit-app-region:no-drag;'

  const toggleBtn = document.createElement('button')
  toggleBtn.classList.add('draw-btn')
  toggleBtn.title = 'Activar pizarra'
  toggleBtn.textContent = '✏️'
  toggleBtn.style.cssText = 'width:32px;height:32px;border:1px solid rgba(100,180,255,0.2);border-radius:6px;background:rgba(34,139,230,0.1);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;'

  const folderBtn = document.createElement('button')
  folderBtn.classList.add('draw-btn')
  folderBtn.title = 'Abrir carpeta de contenido'
  folderBtn.textContent = '📂'
  folderBtn.style.cssText = 'width:32px;height:32px;border:1px solid rgba(100,180,255,0.2);border-radius:6px;background:rgba(34,139,230,0.1);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;'
  folderBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (window.electron && window.electron.abrirCarpetaResources) {
      window.electron.abrirCarpetaResources()
    }
  })

  const changeFolderBtn = document.createElement('button')
  changeFolderBtn.classList.add('draw-btn')
  changeFolderBtn.title = 'Cambiar carpeta de contenido'
  changeFolderBtn.textContent = '📁'
  changeFolderBtn.style.cssText = 'width:32px;height:32px;border:1px solid rgba(100,180,255,0.2);border-radius:6px;background:rgba(34,139,230,0.1);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;'
  changeFolderBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (window.electron && window.electron.cambiarCarpetaResources) {
      const result = await window.electron.cambiarCarpetaResources()
      if (result.ruta) {
        carpetas = []
        await cargarCarpetas(result.ruta)
        console.log('Carpetas recargadas:', carpetas)
      }
    }
  })

  const toolsDiv = document.createElement('div')
  toolsDiv.id = 'draw-tools'
  toolsDiv.classList.add('draw-tools', 'hidden')
  toolsDiv.style.cssText = 'display:none;align-items:center;gap:6px;'

  function makeBtn(text, title, active) {
    const b = document.createElement('button')
    b.classList.add('draw-btn')
    if (active) b.classList.add('active')
    b.title = title
    b.textContent = text
    b.style.cssText = 'width:32px;height:32px;border:1px solid rgba(100,180,255,0.2);border-radius:6px;background:rgba(34,139,230,0.1);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;'
    if (active) b.style.background = 'rgba(34,139,230,0.5)'
    return b
  }

  function makeSep() {
    const s = document.createElement('div')
    s.classList.add('draw-separator')
    s.style.cssText = 'width:1px;height:20px;background:rgba(100,180,255,0.2);margin:0 2px;'
    return s
  }

  const pencilBtn = makeBtn('✏️', 'Lápiz', true)
  const eraserBtn = makeBtn('🧹', 'Borrador', false)

  const colorInput = document.createElement('input')
  colorInput.type = 'color'
  colorInput.value = '#ffffff'
  colorInput.classList.add('draw-color')
  colorInput.title = 'Color'
  colorInput.style.cssText = 'width:32px;height:32px;border:1px solid rgba(100,180,255,0.3);border-radius:6px;cursor:pointer;background:transparent;padding:2px;'

  const sizeInput = document.createElement('input')
  sizeInput.type = 'range'
  sizeInput.min = '1'
  sizeInput.max = '20'
  sizeInput.value = '3'
  sizeInput.classList.add('draw-size')
  sizeInput.title = 'Grosor'
  sizeInput.style.cssText = 'width:80px;height:4px;cursor:pointer;'

  const sizeLabel = document.createElement('span')
  sizeLabel.classList.add('draw-size-label')
  sizeLabel.textContent = '3px'
  sizeLabel.style.cssText = 'color:#8899aa;font-size:11px;min-width:28px;text-align:center;'

  const bgTransparent = makeBtn('🔲', 'Fondo transparente', true)
  const bgWhite = makeBtn('⬜', 'Fondo blanco', false)
  const bgBlack = makeBtn('⬛', 'Fondo negro', false)
  const clearBtn = makeBtn('🗑️', 'Limpiar pizarra', false)
  const closeBtn = makeBtn('❌', 'Cerrar pizarra', false)

  toolsDiv.append(pencilBtn, eraserBtn, colorInput, sizeInput, sizeLabel, makeSep(), bgTransparent, bgWhite, bgBlack, makeSep(), clearBtn, closeBtn)
  toolbar.append(toggleBtn, folderBtn, changeFolderBtn, toolsDiv)
  document.body.appendChild(toolbar)
  console.log('🎨 Toolbar creada:', toolbar)
  console.log('🎨 Canvas creado:', canvas)
  console.log('🎨 Toggle button:', toggleBtn)
  console.log('🎨 Tools div:', toolsDiv)

  let drawing = false
  let tool = 'pencil'
  let bgColor = 'transparent'
  let lastX = 0
  let lastY = 0
  let isActive = false

  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    redrawBackground()
  }

  function redrawBackground() {
    if (bgColor === 'white') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else if (bgColor === 'black') {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  function startDraw(e) {
    e.preventDefault()
    e.stopPropagation()
    drawing = true
    const pos = getPos(e)
    lastX = pos.x
    lastY = pos.y
  }

  function drawLine(e) {
    if (!drawing) return
    e.preventDefault()
    e.stopPropagation()
    const pos = getPos(e)

    ctx.lineWidth = parseInt(sizeInput.value)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = colorInput.value
    }

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastX = pos.x
    lastY = pos.y
  }

  function endDraw() {
    drawing = false
  }

  function setTool(t) {
    tool = t
    pencilBtn.classList.toggle('active', t === 'pencil')
    eraserBtn.classList.toggle('active', t === 'eraser')
    pencilBtn.style.background = t === 'pencil' ? 'rgba(34,139,230,0.5)' : 'rgba(34,139,230,0.1)'
    eraserBtn.style.background = t === 'eraser' ? 'rgba(34,139,230,0.5)' : 'rgba(34,139,230,0.1)'
  }

  function setBg(bg) {
    bgColor = bg
    bgTransparent.classList.toggle('active', bg === 'transparent')
    bgWhite.classList.toggle('active', bg === 'white')
    bgBlack.classList.toggle('active', bg === 'black')
    bgTransparent.style.background = bg === 'transparent' ? 'rgba(34,139,230,0.5)' : 'rgba(34,139,230,0.1)'
    bgWhite.style.background = bg === 'white' ? 'rgba(34,139,230,0.5)' : 'rgba(34,139,230,0.1)'
    bgBlack.style.background = bg === 'black' ? 'rgba(34,139,230,0.5)' : 'rgba(34,139,230,0.1)'
    redrawBackground()
  }

  function toggleDrawing(active) {
    console.log('🎨 toggleDrawing called with:', active)
    if (active) {
      canvas.classList.add('active')
      canvas.style.pointerEvents = 'auto'
      canvas.style.cursor = 'crosshair'
      toolsDiv.style.display = 'flex'
      toolsDiv.classList.remove('hidden')
      toggleBtn.classList.add('active')
      toggleBtn.style.background = 'rgba(34,139,230,0.5)'
      console.log('🎨 Canvas classes:', canvas.classList.toString())
      console.log('🎨 Tools display:', toolsDiv.style.display)
    } else {
      canvas.classList.remove('active')
      canvas.style.pointerEvents = 'none'
      canvas.style.cursor = ''
      toolsDiv.style.display = 'none'
      toolsDiv.classList.add('hidden')
      toggleBtn.classList.remove('active')
      toggleBtn.style.background = 'rgba(34,139,230,0.1)'
      drawing = false
    }
  }

  function stopAll(e) { e.stopPropagation() }

  toggleBtn.addEventListener('click', (e) => {
    console.log('🖱️ Toggle btn click!')
    e.stopPropagation()
    isActive = !isActive
    console.log('🎨 Toggle pizarra:', isActive)
    toggleDrawing(isActive)
  })

  pencilBtn.addEventListener('click', (e) => { stopAll(e); setTool('pencil') })
  eraserBtn.addEventListener('click', (e) => { stopAll(e); setTool('eraser') })

  sizeInput.addEventListener('input', () => {
    sizeLabel.textContent = `${sizeInput.value}px`
  })
  sizeInput.addEventListener('click', stopAll)

  colorInput.addEventListener('click', stopAll)
  colorInput.addEventListener('input', stopAll)

  bgTransparent.addEventListener('click', (e) => { stopAll(e); setBg('transparent') })
  bgWhite.addEventListener('click', (e) => { stopAll(e); setBg('white') })
  bgBlack.addEventListener('click', (e) => { stopAll(e); setBg('black') })

  clearBtn.addEventListener('click', (e) => {
    stopAll(e)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    redrawBackground()
  })

  closeBtn.addEventListener('click', (e) => {
    stopAll(e)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    isActive = false
    toggleDrawing(false)
  })

  canvas.addEventListener('mousedown', startDraw)
  canvas.addEventListener('mousemove', drawLine)
  canvas.addEventListener('mouseup', endDraw)
  canvas.addEventListener('mouseleave', endDraw)

  canvas.addEventListener('touchstart', startDraw, { passive: false })
  canvas.addEventListener('touchmove', drawLine, { passive: false })
  canvas.addEventListener('touchend', endDraw)

  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()
}

initDrawing()
