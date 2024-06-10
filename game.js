import { Ghost } from './ghost.js'
import { Pacman } from './pacman.js'
import {
  ONEBLOCKSIZE,
  state,
  canvasContext,
  pacmanFrames,
  MAP,
  iterateMap,
  initMap,
  maxScore,
  F,
  W
} from './commons.js'

const initLives = 3
const ghostsStartLocation = [
  { x: 0, y: 0 },
  { x: 176, y: 0 },
  { x: 0, y: 121 },
  { x: 176, y: 121 }
]
const wallSpaceSize = ONEBLOCKSIZE / 1.8
const wallSpaceOffset = (ONEBLOCKSIZE - wallSpaceSize) / 2
const wallSpaceColor = 'black'
const peach = '#FEB897'
const blue = '#342DCA'
const font = 'Arial'
const fps = 35
const interval = 1000 / fps // Interval in milliseconds
const debugType = Object.freeze({
  OFF: 0,
  FAST: 1,
  SLOW: 2
})
const staticCtx = window.staticCanvas.getContext('2d')

window.debugState = debugType.OFF
window.showGhostRange = false

let delay = 0
let leftRectColor = wallSpaceColor
let rightRectColor = wallSpaceColor
let topRectColor = wallSpaceColor
let bottomRectColor = wallSpaceColor
let ghosts = []
let lives = initLives
let animationFrameId = 0
let lastTime = 0
let abortController = new AbortController()
let useCache = false

const sleep = (ms, context) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)
    abortController.signal.addEventListener('abort', () => {
      clearTimeout(timeout) // Clear the timeout to avoid memory leaks
      const error = new Error('Aborted')
      error.context = context
      reject(error)
    })
  })

const abortableSleep = async (ms, context) => await sleep(ms, context)

const isDead = () => lives === 0
const isWin = () => state.score === maxScore

let drawRect = (x, y, width, height, color, canvasContext) => {
  canvasContext.fillStyle = color
  canvasContext.fillRect(x, y, width, height)
}

const restartPacmanAndGhosts = () => {
  createNewPacman()
  createGhosts()
}

const onGhostCollision = () => {
  lives--
  restartPacmanAndGhosts()
}

const drawText = text => {
  canvasContext.font = `50px ${font}`
  canvasContext.fillStyle = 'white'
  const textWidth = canvasContext.measureText(text).width

  // Calculate the position to center the text
  const x = (canvas.width - textWidth) / 2
  const y = canvas.height / 2

  // Draw the text border
  canvasContext.lineWidth = 10
  canvasContext.strokeStyle = 'black'
  canvasContext.strokeText(text, x, y)

  canvasContext.fillText(text, x, y)
}

const gameOver = () => {
  cancelAnimationFrame(animationFrameId)
  drawText('Game Over')
}

const winner = () => {
  cancelAnimationFrame(animationFrameId)
  drawText('You Win!')
}

const update = () => {
  state.pacman.moveProcess()
  state.pacman.eat()
  updateGhosts()
  state.pacman.checkGhostCollision(ghosts) && onGhostCollision()
}

const indexToGridCoor = index => index * ONEBLOCKSIZE

const drawFood = (i, j) => {
  const foodSize = ONEBLOCKSIZE / 3
  const centerX = indexToGridCoor(j) + ONEBLOCKSIZE / 2
  const centerY = indexToGridCoor(i) + ONEBLOCKSIZE / 2
  const radius = foodSize / 2

  canvasContext.beginPath()
  canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  canvasContext.fillStyle = peach
  canvasContext.fill()
}

// this function draw a single square/cell of wall in the grid/canvas
const drawWall = async (i, j) => {
  const canvasCtx = debugState === debugType.OFF ? staticCtx : canvasContext
  drawRect(
    indexToGridCoor(j),
    indexToGridCoor(i),
    ONEBLOCKSIZE,
    ONEBLOCKSIZE,
    blue,
    canvasCtx
  ) // start with a blue square
  debugState && (await abortableSleep(delay, `drawWall ${debugState}`))

  // draw rectangles big enough to cover the wall space and because
  // the rectangle has the same color as the background, it will look like a open space
  const hasValidLeftIndex = j > 0
  const hasLeftOpen = hasValidLeftIndex && MAP[i][j - 1] === 1
  if (hasLeftOpen) {
    drawRect(
      indexToGridCoor(j),
      indexToGridCoor(i) + wallSpaceOffset,
      wallSpaceSize + wallSpaceOffset,
      wallSpaceSize,
      leftRectColor,
      canvasCtx
    )
    debugState && (await abortableSleep(delay, `drawWall ${debugState}`))
  }

  const hasValidRightIndex = j < MAP[0].length - 1
  const hasRightOpen = hasValidRightIndex && MAP[i][j + 1] === 1
  if (hasRightOpen) {
    drawRect(
      indexToGridCoor(j) + wallSpaceOffset,
      indexToGridCoor(i) + wallSpaceOffset,
      wallSpaceSize + wallSpaceOffset,
      wallSpaceSize,
      rightRectColor,
      canvasCtx
    )
    debugState && (await abortableSleep(delay, `drawWall ${debugState}`))
  }

  const hasValidBottomIndex = i < MAP.length - 1
  const hasBottomOpen = hasValidBottomIndex && MAP[i + 1][j] === 1
  if (hasBottomOpen) {
    drawRect(
      indexToGridCoor(j) + wallSpaceOffset,
      indexToGridCoor(i) + wallSpaceOffset,
      wallSpaceSize,
      wallSpaceSize + wallSpaceOffset,
      bottomRectColor,
      canvasCtx
    )
    debugState && (await abortableSleep(delay, `drawWall ${debugState}`))
  }

  const hasValidTopIndex = i > 0
  const hasTopOpen = hasValidTopIndex && MAP[i - 1][j] === 1
  if (hasTopOpen) {
    drawRect(
      indexToGridCoor(j) + wallSpaceOffset,
      indexToGridCoor(i),
      wallSpaceSize,
      wallSpaceSize + wallSpaceOffset,
      topRectColor,
      canvasCtx
    )
    debugState && (await abortableSleep(delay, `drawWall ${debugState}`))
  }
}

const drawMap = async () => {
  if (debugState !== debugType.OFF) useCache = false
  await iterateMap(async (i, j, cell) => {
    if (!useCache && cell === W) await drawWall(i, j)
    cell === F && drawFood(i, j)
  })
  if (!useCache) useCache = true

  // Draw the static canvas onto the main canvas
  // this works as a cache
  useCache && canvasContext.drawImage(staticCanvas, 0, 0)
}

const drawRemainingLives = () => {
  canvasContext.font = `20px ${font}`
  canvasContext.fillStyle = 'white'
  canvasContext.fillText('Lives: ', 280, indexToGridCoor(MAP.length + 1))

  for (let i = 0; i < lives; i++) {
    canvasContext.drawImage(
      pacmanFrames,
      2 * ONEBLOCKSIZE, // second frame of pacman
      0,
      ONEBLOCKSIZE,
      ONEBLOCKSIZE,
      indexToGridCoor(i) + 350,
      indexToGridCoor(MAP.length) + 1,
      ONEBLOCKSIZE,
      ONEBLOCKSIZE
    )
  }
}

const drawScore = () => {
  canvasContext.font = `20px ${font}`
  canvasContext.fillStyle = 'white'
  canvasContext.fillText(
    'Score: ' + state.score,
    0,
    indexToGridCoor(MAP.length + 1)
  )
}

const draw = async () => {
  if (isDead() || isWin()) return // stop the draw so the game freeze
  // set background color and clear the screen
  drawRect(0, 0, canvas.width, canvas.height, wallSpaceColor, canvasContext)
  await drawMap()
  drawGhosts()
  debugState && (await abortableSleep(delay + 1000))
  state.pacman.draw()
  debugState && (await abortableSleep(delay + 1000))
  drawScore()
  drawRemainingLives()
  debugState && (await abortableSleep(delay + 2000))
}

const createGhosts = () => {
  ghosts = []
  for (let i = 0; i < 8; i++) {
    const newGhost = new Ghost(
      9 * ONEBLOCKSIZE + (i % 2 == 0 ? 0 : 1) * ONEBLOCKSIZE,
      10 * ONEBLOCKSIZE + (i % 2 == 0 ? 0 : 1) * ONEBLOCKSIZE,
      ONEBLOCKSIZE,
      ONEBLOCKSIZE,
      state.pacman.speed / 2,
      ghostsStartLocation[i % 4].x,
      ghostsStartLocation[i % 4].y,
      124,
      116,
      6 + i
    )
    ghosts.push(newGhost)
  }
}

export const createNewPacman = () => {
  state.pacman = new Pacman(
    ONEBLOCKSIZE,
    ONEBLOCKSIZE,
    ONEBLOCKSIZE,
    ONEBLOCKSIZE,
    ONEBLOCKSIZE / 5
  )
}

const updateGhosts = () => ghosts.forEach(ghost => ghost.moveProcess())

const drawGhosts = () => ghosts.forEach(ghost => ghost.draw())

const resetGame = () => {
  state.score = 0
  lives = initLives
  restartPacmanAndGhosts()
  MAP.length = 0 // Clear the current MAP
  for (let row of initMap) {
    MAP.push([...row]) // Copy it
  }

  start()
}

const gameLoop = async timestamp => {
  const deltaTime = timestamp - lastTime

  if (deltaTime > interval) {
    update()
    if (isDead()) {
      gameOver()
      return
    }
    if (isWin()) {
      winner()
      return
    }
    await draw().catch(error => {
      if (error.message === 'Aborted') {
        console.log(`Sleep was aborted. Context: ${error.context}`)
      } else {
        console.error('An error occurred:', error)
      }
    })
    lastTime = timestamp
  }
  animationFrameId = requestAnimationFrame(gameLoop)
}

const start = () => {
  cancelAnimationFrame(animationFrameId)
  abortController.abort() // Cancel any pending sleep calls
  abortController = new AbortController()

  gameLoop()
}

document.getElementById('reset').addEventListener('pointerdown', resetGame)

const toggleDebug = element => {
  let mode = ''

  switch (debugState) {
    case debugType.OFF:
      debugState = debugType.FAST
      mode = 'fast'
      delay = 50
      break
    case debugType.FAST:
      debugState = debugType.SLOW
      mode = 'slow'
      delay = 1500
      break
    case debugType.SLOW:
      debugState = debugType.OFF
      mode = 'off'
      break
  }

  element.innerText = `Debug ${mode}`

  const isDebug = debugState !== debugType.OFF

  leftRectColor = isDebug ? '#FFFFFF' : wallSpaceColor // White or default
  rightRectColor = isDebug ? '#00FF00' : wallSpaceColor // Green or default
  topRectColor = isDebug ? '#FF0000' : wallSpaceColor // Red or default
  bottomRectColor = isDebug ? '#FFA500' : wallSpaceColor // Orange or default
}

document.getElementById('debug').addEventListener('pointerdown', event => {
  toggleDebug(event.target)
  start()
})

document.getElementById('ghostRange').addEventListener('pointerdown', event => {
  window.showGhostRange = !window.showGhostRange
  const toggle = window.showGhostRange ? 'on' : 'off'
  event.target.innerText = `Ghost Range ${toggle}`
})

restartPacmanAndGhosts()
start()
