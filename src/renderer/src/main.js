eventListener()

let currentOrb = null
let currentOrbUp = null
let currentOrbUpRight = null
let currentOrbUpLeft = null
let currentOrbdown = null
let currentOrbdownRight = null
let currentOrbdownLeft = null
let currentOrbLeft = null
let currentOrbRight = null
let carpetas = []

const logoText = document.createElement('img')
logoText.src = './assets/naturgy-Logo.png'
logoText.style.position = 'absolute'
logoText.style.top = '90%'
logoText.style.left = '1%'
logoText.style.width = '150px'
document.body.appendChild(logoText)

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
  await cargarCarpetas('/home/jose/Escritorio/naturgy/naturgy/resources')
  console.log('Carpetas cargadas:', carpetas)
}
inicializar()

function createOrb(event) {
  removeOrb()
  const x = event.clientX || (event.touches && event.touches[0].clientX)
  const y = event.clientY || (event.touches && event.touches[0].clientY)

  createOrb1(event, x, y, 'center')

  createOrb1(event, x, y, 'up')

  createOrb1(event, x, y, 'upRight')

  createOrb1(event, x - 10, y, 'upLeft')

  createOrb1(event, x, y, 'down')

  createOrb1(event, x - 10, y, 'downRight')

  createOrb1(event, x - 10, y, 'downLeft')

  createOrb1(event, x, y - 10, 'left')

  createOrb1(event, x, y - 10, 'right')
}

function removeOrb() {
  if (currentOrb) {
    currentOrb.remove()
    currentOrb = null
  }

  if (currentOrbUp) {
    currentOrbUp.remove()
    currentOrbUp = null
  }

  if (currentOrbUpRight) {
    currentOrbUpRight.remove()
    currentOrbUpRight = null
  }

  if (currentOrbUpLeft) {
    currentOrbUpLeft.remove()
    currentOrbUpLeft = null
  }

  if (currentOrbdown) {
    currentOrbdown.remove()
    currentOrbdown = null
  }

  if (currentOrbdownRight) {
    currentOrbdownRight.remove()
    currentOrbdownRight = null
  }

  if (currentOrbdownLeft) {
    currentOrbdownLeft.remove()
    currentOrbdownLeft = null
  }

  if (currentOrbLeft) {
    currentOrbLeft.remove()
    currentOrbLeft = null
  }

  if (currentOrbRight) {
    currentOrbRight.remove()
    currentOrbRight = null
  }
}

function eventListener() {
  document.body.addEventListener('click', createOrb)
  document.body.addEventListener('touchstart', createOrb, { passive: true })
}

function createOrb1(event, xx, yy, position) {
  const x = xx - 50
  const y = yy - 50
  if (position === 'center') {
    const orb = document.createElement('div')
    orb.style.left = `${x}px`
    orb.style.top = `${y}px`
    document.body.appendChild(orb)
    currentOrb = orb
    orb.classList.add('orb')
  }
  if (position === 'up') {
    const orbUp = document.createElement('div')
    orbUp.style.left = `${x}px`
    orbUp.style.top = `${y}px`
    document.body.appendChild(orbUp)
    currentOrbUp = orbUp
    orbUp.classList.add('orb3')
    addTextToOrb(orbUp, 'up')
  }

  if (position === 'upRight') {
    const orbUpRight = document.createElement('div')
    orbUpRight.style.left = `${x}px`
    orbUpRight.style.top = `${y}px`
    document.body.appendChild(orbUpRight)
    currentOrbUpRight = orbUpRight
    orbUpRight.classList.add('orb5')
    addTextToOrb(orbUpRight, 'upRight')
  }

  if (position === 'upLeft') {
    const orbUpLeft = document.createElement('div')
    orbUpLeft.style.left = `${x}px`
    orbUpLeft.style.top = `${y}px`
    document.body.appendChild(orbUpLeft)
    currentOrbUpLeft = orbUpLeft
    orbUpLeft.classList.add('orb6')
    addTextToOrb(orbUpLeft, 'upLeft')
  }

  if (position === 'down') {
    const orbDown = document.createElement('div')
    orbDown.style.left = `${x}px`
    orbDown.style.top = `${y}px`
    document.body.appendChild(orbDown)
    currentOrbdown = orbDown
    orbDown.classList.add('orb4')
    addTextToOrb(orbDown, 'down')
  }

  if (position === 'downRight') {
    const orbDownRight = document.createElement('div')
    orbDownRight.style.left = `${x}px`
    orbDownRight.style.top = `${y}px`
    document.body.appendChild(orbDownRight)
    currentOrbdownRight = orbDownRight
    orbDownRight.classList.add('orb7')
    addTextToOrb(orbDownRight, 'downRight')
  }

  if (position === 'downLeft') {
    const orbDownLeft = document.createElement('div')
    orbDownLeft.style.left = `${x}px`
    orbDownLeft.style.top = `${y}px`
    document.body.appendChild(orbDownLeft)
    currentOrbdownLeft = orbDownLeft
    orbDownLeft.classList.add('orb8')
    addTextToOrb(orbDownLeft, 'downLeft')
  }

  if (position === 'left') {
    const orbLeft = document.createElement('div')
    orbLeft.style.left = `${x}px`
    orbLeft.style.top = `${y}px`
    document.body.appendChild(orbLeft)
    currentOrbLeft = orbLeft
    orbLeft.classList.add('orb2')
    addTextToOrb(currentOrbLeft, 'left')
  }
  if (position === 'right') {
    const orbRight = document.createElement('div')
    orbRight.style.left = `${x}px`
    orbRight.style.top = `${y}px`
    document.body.appendChild(orbRight)
    currentOrbRight = orbRight
    orbRight.classList.add('orb1')
    addTextToOrb(currentOrbRight, 'right')
  }
}

function addTextToOrb(orb, position) {
  let nombreCarpeta = null
  const textInside = document.createElement('span')
  if (position === 'up') nombreCarpeta = carpetas[0].nombre.substring(2)
  if (position === 'upRight') nombreCarpeta = carpetas[1].nombre.substring(2)
  if (position === 'right') nombreCarpeta = carpetas[2].nombre.substring(2)
  if (position === 'downRight') nombreCarpeta = carpetas[3].nombre.substring(2)
  if (position === 'down') nombreCarpeta = carpetas[4].nombre.substring(2)
  if (position === 'downLeft') nombreCarpeta = carpetas[5].nombre.substring(2)
  if (position === 'left') nombreCarpeta = carpetas[6].nombre.substring(2)
  if (position === 'upLeft') nombreCarpeta = carpetas[7].nombre.substring(2)
  textInside.textContent = nombreCarpeta
  textInside.style.position = 'absolute'
  textInside.style.top = '50%'
  textInside.style.left = '50%'
  textInside.style.transform = 'translate(-50%, -50%)'
  textInside.style.color = '#2C3E50'
  textInside.style.fontSize = '12px'
  textInside.style.fontWeight = 'bold'
  textInside.classList.add('m2t')
  //textInside.style.zIndex = '2'
  orb.appendChild(textInside)
}
