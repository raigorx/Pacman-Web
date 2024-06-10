import {
  DIRECTIONS,
  ONEBLOCKSIZE,
  MAP,
  state,
  pacmanFrames,
  canvasContext,
  E,
  F,
  W,
  iterateMap,
  checkCollisions,
  getGridCoordinate,
  getMapXRightSide,
  getMapYRightSide,
  moveBackwards,
  moveForwards
} from './commons.js'

export class Pacman {
  constructor (x, y, width, height, speed) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.speed = speed
    this.direction = 4
    this.nextDirection = 4
    this.frameCount = 7
    this.currentFrame = 1
    setInterval(() => {
      this.changeAnimation()
    }, 100)
  }

  moveProcess () {
    this.changeDirectionIfPossible()
    this.moveForwards()
    this.checkCollisions() && this.moveBackwards()
  }

  eat () {
    iterateMap((i, j, cell) => {
      if (cell === F && this.getMapX() == j && this.getMapY() == i) {
        MAP[i][j] = E
        state.score++
      }
    })
  }

  checkCollisions () {
    return checkCollisions(this.x, this.y)
  }

  checkGhostCollision (ghosts) {
    return ghosts.some(
      ghost =>
        ghost.getMapX() === this.getMapX() && ghost.getMapY() === this.getMapY()
    )
  }

  changeDirectionIfPossible () {
    if (this.direction == this.nextDirection) return
    let tempDirection = this.direction
    this.direction = this.nextDirection
    this.moveForwards()
    if (this.checkCollisions()) {
      this.moveBackwards()
      this.direction = tempDirection
    } else {
      this.moveBackwards()
    }
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

  draw () {
    canvasContext.save()
    canvasContext.translate(
      this.x + ONEBLOCKSIZE / 2,
      this.y + ONEBLOCKSIZE / 2
    )
    canvasContext.rotate((this.direction * 90 * Math.PI) / 180)
    canvasContext.translate(
      -this.x - ONEBLOCKSIZE / 2,
      -this.y - ONEBLOCKSIZE / 2
    )
    canvasContext.drawImage(
      pacmanFrames,
      (this.currentFrame - 1) * ONEBLOCKSIZE,
      0,
      ONEBLOCKSIZE,
      ONEBLOCKSIZE,
      this.x,
      this.y,
      this.width,
      this.height
    )
    canvasContext.restore()
  }
}

Pacman.prototype.moveBackwards = moveBackwards
Pacman.prototype.moveForwards = moveForwards
