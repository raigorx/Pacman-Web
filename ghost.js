import {
  DIRECTIONS,
  randomTargetsForGhosts,
  state,
  MAP,
  canvasContext,
  ONEBLOCKSIZE,
  getGridCoordinate,
  checkCollisions,
  getMapXRightSide,
  getMapYRightSide,
  moveBackwards,
  moveForwards,
  W
} from './commons.js'

const ghostFrames = document.getElementById('ghosts')

export class Ghost {
  constructor (
    x,
    y,
    width,
    height,
    speed,
    imageX,
    imageY,
    imageWidth,
    imageHeight,
    range
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.speed = speed
    this.direction = DIRECTIONS.RIGHT
    this.imageX = imageX
    this.imageY = imageY
    this.imageHeight = imageHeight
    this.imageWidth = imageWidth
    this.range = range
    this.randomTargetIndex = Math.floor(Math.random() * 4)
    this.target = randomTargetsForGhosts[this.randomTargetIndex]
    setInterval(() => {
      this.changeRandomDirection()
    }, 10000)
  }

  isInRange () {
    const xDistance = Math.abs(state.pacman.getMapX() - this.getMapX())
    const yDistance = Math.abs(state.pacman.getMapY() - this.getMapY())
    // Calculate the Euclidean distance
    const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
    if (distance <= this.range) return true
    return false
  }

  changeRandomDirection () {
    this.randomTargetIndex = (this.randomTargetIndex + 1) % 4
  }

  moveProcess () {
    this.target = this.isInRange()
      ? state.pacman
      : randomTargetsForGhosts[this.randomTargetIndex]
    this.changeDirectionIfPossible()
    this.moveForwards()
    if (this.checkCollisions()) this.moveBackwards()
  }

  checkCollisions () {
    return checkCollisions(this.x, this.y)
  }

  changeDirectionIfPossible () {
    const tempDirection = this.direction

    const newDirection = this.calculateNewDirection()

    // If no valid new direction is calculated, keep the current direction
    if (typeof newDirection === 'undefined') {
      return
    }

    this.direction = newDirection

    const shouldChangeToUp =
      this.getMapY() !== this.getMapYRightSide() &&
      (this.direction === DIRECTIONS.LEFT ||
        this.direction === DIRECTIONS.RIGHT)

    const shouldChangeToLeft =
      this.getMapX() !== this.getMapXRightSide() &&
      this.direction === DIRECTIONS.UP

    if (shouldChangeToUp) {
      this.direction = DIRECTIONS.UP
    }
    if (shouldChangeToLeft) {
      this.direction = DIRECTIONS.LEFT
    }

    // Move forward and check for collisions
    this.moveForwards()
    if (this.checkCollisions()) {
      // If collision occurs, revert to the previous direction
      this.moveBackwards()
      this.direction = tempDirection
    } else {
      // If no collision, move back to the original position
      this.moveBackwards()
    }
  }

  calculateNewDirection () {
    const initialPosition = {
      x: this.getMapX(),
      y: this.getMapY(),
      moves: []
    }

    const targetX = getGridCoordinate(this.target.x)
    const targetY = getGridCoordinate(this.target.y)

    const queue = [initialPosition]
    const visited = new Set()

    while (queue.length > 0) {
      const currentPosition = queue.shift()

      if (currentPosition.x === targetX && currentPosition.y === targetY) {
        return currentPosition.moves[0]
      }

      visited.add(`${currentPosition.x},${currentPosition.y}`)

      const neighbors = this.getValidMoves(currentPosition, visited)
      queue.push(...neighbors)
    }

    return undefined // Explicitly return undefined if no direction is found
  }

  isValidMove (x, y, numOfRows, numOfColumns, visited) {
    return (
      x >= 0 &&
      x < numOfRows &&
      y >= 0 &&
      y < numOfColumns &&
      MAP[y][x] !== W &&
      !visited.has(`${x},${y}`)
    )
  }

  getValidMoves (currentPosition, visited) {
    const queue = []
    const numOfRows = MAP.length
    const numOfColumns = MAP[0].length

    const directions = [
      { dx: -1, dy: 0, direction: DIRECTIONS.LEFT },
      { dx: 1, dy: 0, direction: DIRECTIONS.RIGHT },
      { dx: 0, dy: -1, direction: DIRECTIONS.UP },
      { dx: 0, dy: 1, direction: DIRECTIONS.DOWN }
    ]

    directions.forEach(({ dx, dy, direction }) => {
      const newX = currentPosition.x + dx
      const newY = currentPosition.y + dy
      if (this.isValidMove(newX, newY, numOfRows, numOfColumns, visited)) {
        const tempMoves = currentPosition.moves.slice()
        tempMoves.push(direction)
        queue.push({ x: newX, y: newY, moves: tempMoves })
      }
    })

    return queue
  }

  getMapX () {
    return getGridCoordinate(this.x)
  }

  getMapY () {
    return getGridCoordinate(this.y)
  }

  getMapXRightSide () {
    return getMapXRightSide(this.x)
  }

  getMapYRightSide () {
    return getMapYRightSide(this.y)
  }

  changeAnimation () {
    this.currentFrame =
      this.currentFrame == this.frameCount ? 1 : this.currentFrame + 1
  }

  drawRange () {
    canvasContext.save()
    canvasContext.beginPath()
    canvasContext.strokeStyle = 'red'
    canvasContext.lineWidth = 1 // reset line width
    canvasContext.arc(
      this.x + ONEBLOCKSIZE / 2,
      this.y + ONEBLOCKSIZE / 2,
      this.range * ONEBLOCKSIZE,
      0,
      2 * Math.PI
    )
    canvasContext.stroke()
    canvasContext.restore()
  }

  draw () {
    canvasContext.save()
    canvasContext.drawImage(
      ghostFrames,
      this.imageX,
      this.imageY,
      this.imageWidth,
      this.imageHeight,
      this.x,
      this.y,
      this.width,
      this.height
    )
    window.showGhostRange && this.drawRange()
    canvasContext.restore()
  }
}

Ghost.prototype.moveBackwards = moveBackwards
Ghost.prototype.moveForwards = moveForwards
