// if canvas has an id the element is already in the window no idea why
// so no need for getElementById
export const canvasContext = window.canvas.getContext('2d')
export const pacmanFrames = document.getElementById('animation')

export const ONEBLOCKSIZE = 20

export const state = {
  score: 0,
  pacman: null
}

export const DIRECTIONS = Object.freeze({
  RIGHT: 4,
  UP: 3,
  LEFT: 2,
  BOTTOM: 1
})

export const W = 1 // Wall
export const F = 2 // Food
export const E = 0 // Empty

export const initMap = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, F, F, F, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, W],
  [W, F, W, W, W, F, W, W, W, F, W, F, W, W, W, F, W, W, W, F, W],
  [W, F, W, W, W, F, W, W, W, F, W, F, W, W, W, F, W, W, W, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, W, W, W, F, W, F, W, W, W, W, W, F, W, F, W, W, W, F, W],
  [W, F, F, F, F, F, W, F, F, F, W, F, F, F, W, F, F, F, F, F, W],
  [W, W, W, W, W, F, W, W, W, F, W, F, W, W, W, F, W, W, W, W, W],
  [E, E, E, E, W, F, W, F, F, F, F, F, F, F, W, F, W, E, E, E, E],
  [W, W, W, W, W, F, W, F, W, W, E, W, W, F, W, F, W, W, W, W, W],
  [W, F, F, F, F, F, F, F, W, E, E, E, W, F, F, F, F, F, F, F, W],
  [W, W, W, W, W, F, W, F, W, E, E, E, W, F, W, F, W, W, W, W, W],
  [E, E, E, E, W, F, W, F, W, W, W, W, W, F, W, F, W, E, E, E, E],
  [E, E, E, E, W, F, W, F, F, F, F, F, F, F, W, F, W, E, E, E, E],
  [W, W, W, W, W, F, F, F, W, W, W, W, W, F, F, F, W, W, W, W, W],
  [W, F, F, F, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, W],
  [W, F, W, W, W, F, W, W, W, F, W, F, W, W, W, F, W, W, W, F, W],
  [W, F, F, F, W, F, F, F, F, F, W, F, F, F, F, F, W, F, F, F, W],
  [W, W, F, F, W, F, W, F, W, W, W, W, W, F, W, F, W, F, F, W, W],
  [W, F, F, F, F, F, W, F, F, F, W, F, F, F, W, F, F, F, F, F, W],
  [W, F, W, W, W, W, W, W, W, F, W, F, W, W, W, W, W, W, W, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
]

export const maxScore = []
  .concat(...initMap) /* flatten the array */
  .filter(x => x === F).length

export const MAP = initMap.map(row => [...row])

export const iterateMap = async callback => {
  for (const [i, row] of MAP.entries()) {
    for (const [j, cell] of row.entries()) {
      await callback(i, j, cell)
    }
  }
}

export const randomTargetsForGhosts = [
  { x: 1 * ONEBLOCKSIZE, y: 1 * ONEBLOCKSIZE },
  { x: 1 * ONEBLOCKSIZE, y: (MAP.length - F) * ONEBLOCKSIZE },
  { x: (MAP[0].length - F) * ONEBLOCKSIZE, y: ONEBLOCKSIZE },
  {
    x: (MAP[0].length - F) * ONEBLOCKSIZE,
    y: (MAP.length - F) * ONEBLOCKSIZE
  }
]

export const getGridCoordinate = coordinate =>
  Math.floor(coordinate / ONEBLOCKSIZE)

export const isWall = (x, y) =>
  MAP[getGridCoordinate(y)][getGridCoordinate(x)] === W

export const checkCollisions = (x, y) => {
  const topLeft = isWall(x, y)
  const bottomLeft = isWall(x, y + 0.9999 * ONEBLOCKSIZE)
  const topRight = isWall(x + 0.9999 * ONEBLOCKSIZE, y)
  const bottomRight = isWall(
    x + 0.9999 * ONEBLOCKSIZE,
    y + 0.9999 * ONEBLOCKSIZE
  )

  return topLeft || bottomLeft || topRight || bottomRight
}

export const moveBackwards = function () {
  switch (this.direction) {
    case DIRECTIONS.RIGHT:
      this.x -= this.speed
      break
    case DIRECTIONS.UP:
      this.y += this.speed
      break
    case DIRECTIONS.LEFT:
      this.x += this.speed
      break
    case DIRECTIONS.BOTTOM:
      this.y -= this.speed
      break
  }
}

export const moveForwards = function () {
  switch (this.direction) {
    case DIRECTIONS.RIGHT:
      this.x += this.speed
      break
    case DIRECTIONS.UP:
      this.y -= this.speed
      break
    case DIRECTIONS.LEFT:
      this.x -= this.speed
      break
    case DIRECTIONS.BOTTOM:
      this.y += this.speed
      break
  }
}

export const getMapXRightSide = x => getGridCoordinate(x * 0.99 + ONEBLOCKSIZE)
export const getMapYRightSide = y => getGridCoordinate(y * 0.99 + ONEBLOCKSIZE)

window.addEventListener('keydown', event => {
  switch (event.code) {
    case 'KeyS':
    case 'ArrowDown':
      state.pacman.nextDirection = DIRECTIONS.BOTTOM
      break
    case 'KeyW':
    case 'ArrowUp':
      state.pacman.nextDirection = DIRECTIONS.UP
      break
    case 'KeyA':
    case 'ArrowLeft':
      state.pacman.nextDirection = DIRECTIONS.LEFT
      break
    case 'KeyD':
    case 'ArrowRight':
      state.pacman.nextDirection = DIRECTIONS.RIGHT
      break
  }
})
