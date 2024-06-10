// Function to simulate key events
const triggerKey = code => {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      code,
      bubbles: true
    })
  )
}

document
  .getElementById('up')
  .addEventListener('pointerdown', () => triggerKey('ArrowUp'))
document
  .getElementById('left')
  .addEventListener('pointerdown', () => triggerKey('ArrowLeft'))
document
  .getElementById('down')
  .addEventListener('pointerdown', () => triggerKey('ArrowDown'))
document
  .getElementById('right')
  .addEventListener('pointerdown', () => triggerKey('ArrowRight'))
