# Neon Snake Reactor

A modern, lightweight Snake game built with plain HTML, CSS, and JavaScript.

## Features

- Classic Snake gameplay on a grid
- Continuous movement with reverse-direction prevention
- Random food spawning on empty cells
- Score tracking with persistent best score via `localStorage`
- Start, pause, and game over overlays
- Keyboard controls for desktop
- Swipe and on-screen controls for mobile
- Responsive arcade-style UI with canvas effects and polished HUD

## Controls

- `Arrow keys` or `WASD`: Move
- `Space`: Pause or resume
- `R`: Restart
- `Mobile`: Swipe on the board or use the on-screen directional pad

## Project Structure

- [index.html](/C:/Users/d_dad/Documents/Codex/2026-05-27/build-a-complete-playable-snake-game/index.html): App layout and game UI
- [styles.css](/C:/Users/d_dad/Documents/Codex/2026-05-27/build-a-complete-playable-snake-game/styles.css): Responsive styling and arcade visuals
- [script.js](/C:/Users/d_dad/Documents/Codex/2026-05-27/build-a-complete-playable-snake-game/script.js): Game logic, rendering, controls, and score handling
- [preview-server.js](/C:/Users/d_dad/Documents/Codex/2026-05-27/build-a-complete-playable-snake-game/preview-server.js): Tiny local static server for previewing the game

## Run Locally

### Option 1: Open directly

Open `index.html` in a browser.

### Option 2: Run the local preview server

If you have Node.js installed:

```powershell
node preview-server.js
```

Then visit:

```text
http://127.0.0.1:8766/
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D API

## Repository

GitHub: [daviddadicodes/snakegame](https://github.com/daviddadicodes/snakegame)
