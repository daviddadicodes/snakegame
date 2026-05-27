const boardSize = 18;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const gridSizeLabel = document.getElementById("grid-size-label");
const speedLabel = document.getElementById("speed-label");
const speedMeter = document.getElementById("speed-meter");
const lengthLabel = document.getElementById("length-label");
const statusPill = document.getElementById("status-pill");
const statusCopy = document.getElementById("status-copy");
const stateChip = document.getElementById("state-chip");

const startButton = document.getElementById("start-button");
const overlayStartButton = document.getElementById("overlay-start-button");
const pauseButton = document.getElementById("pause-button");
const mobilePauseButton = document.getElementById("mobile-pause-button");
const restartButton = document.getElementById("restart-button");
const resumeButton = document.getElementById("resume-button");
const restartOverlayButton = document.getElementById("restart-overlay-button");
const gameOverMessage = document.getElementById("game-over-message");

const overlays = {
  start: document.getElementById("start-overlay"),
  pause: document.getElementById("pause-overlay"),
  gameOver: document.getElementById("game-over-overlay"),
};

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const palette = {
  boardBase: "#04111f",
  boardGlow: "rgba(62, 149, 255, 0.13)",
  grid: "rgba(145, 205, 255, 0.08)",
  snake: "#7cff72",
  snakeHead: "#d6ff79",
  food: "#ff5d8f",
  foodCore: "#ffd0de",
};

let snake;
let previousSnake;
let direction;
let queuedDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score")) || 0;
let gameState = "start";
let lastTime = 0;
let accumulator = 0;
let stepTime = 150;
let pulseTime = 0;
let particles = [];

bestScoreEl.textContent = String(bestScore);
gridSizeLabel.textContent = boardSize + "x" + boardSize;

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const cssSize = canvas.getBoundingClientRect().width || 540;
  canvas.width = Math.round(cssSize * ratio);
  canvas.height = Math.round(cssSize * ratio);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  draw();
}

function cloneSnake(source) {
  return source.map((segment) => ({ x: segment.x, y: segment.y }));
}

function initGame() {
  snake = [
    { x: 3, y: 9 },
    { x: 2, y: 9 },
    { x: 1, y: 9 },
  ];
  previousSnake = cloneSnake(snake);
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  food = spawnFood();
  score = 0;
  stepTime = 150;
  accumulator = 0;
  lastTime = 0;
  pulseTime = 0;
  particles = [];
  updateHud();
  setStatus("Ready", "Press play or use the keyboard to begin.");
  hideOverlays();
  draw();
}

function updateHud() {
  const speedMultiplier = (150 / stepTime).toFixed(1) + "x";
  scoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);
  speedLabel.textContent = speedMultiplier;
  speedMeter.textContent = speedMultiplier;
  lengthLabel.textContent = String(snake.length);
}

function setStatus(label, copy) {
  statusPill.textContent = label;
  stateChip.textContent = label;
  statusCopy.textContent = copy;
}

function hideOverlays() {
  Object.keys(overlays).forEach((key) => {
    overlays[key].classList.remove("visible");
  });
}

function startGame() {
  initGame();
  gameState = "running";
  setStatus("Live", "Collect the orbs, hold your line, and avoid sharp reversals.");
  pauseButton.textContent = "Pause";
  mobilePauseButton.textContent = "II";
}

function restartGame() {
  startGame();
}

function togglePause(forceState) {
  if (gameState === "start" || gameState === "gameover") {
    return;
  }

  const shouldPause = typeof forceState === "boolean" ? forceState : gameState === "running";
  gameState = shouldPause ? "paused" : "running";
  overlays.pause.classList.toggle("visible", shouldPause);
  pauseButton.textContent = shouldPause ? "Resume" : "Pause";
  mobilePauseButton.textContent = shouldPause ? ">" : "II";

  if (shouldPause) {
    setStatus("Paused", "The reactor is idling. Hit space or resume to continue.");
  } else {
    setStatus("Live", "Collect the orbs, hold your line, and avoid sharp reversals.");
    lastTime = 0;
  }
}

function endGame() {
  gameState = "gameover";
  setStatus("Game Over", "Restart and chase a cleaner route.");
  gameOverMessage.textContent = "Score: " + score + "  Best: " + bestScore;
  overlays.gameOver.classList.add("visible");
  pauseButton.textContent = "Pause";
  mobilePauseButton.textContent = "II";
}

function spawnFood() {
  const emptyCells = [];
  let x;
  let y;

  for (y = 0; y < boardSize; y += 1) {
    for (x = 0; x < boardSize; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        emptyCells.push({ x: x, y: y });
      }
    }
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function queueDirection(nextDirection) {
  if (gameState === "start") {
    startGame();
  }

  if (gameState !== "running") {
    return;
  }

  if (nextDirection.x === -direction.x && nextDirection.y === -direction.y) {
    return;
  }

  if (nextDirection.x === queuedDirection.x && nextDirection.y === queuedDirection.y) {
    return;
  }

  queuedDirection = nextDirection;
}

function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake-best-score", String(bestScore));
  }
}

function addFoodParticles(cellX, cellY) {
  const cellSize = canvas.getBoundingClientRect().width / boardSize;
  const centerX = (cellX + 0.5) * cellSize;
  const centerY = (cellY + 0.5) * cellSize;
  let index;

  for (index = 0; index < 10; index += 1) {
    particles.push({
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 2.8,
      vy: (Math.random() - 0.5) * 2.8,
      life: 18 + Math.random() * 12,
      size: 2 + Math.random() * 4,
    });
  }
}

function step() {
  previousSnake = cloneSnake(snake);
  direction = queuedDirection;

  const nextHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const willEat = nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = willEat ? snake : snake.slice(0, snake.length - 1);
  const hitsWall =
    nextHead.x < 0 ||
    nextHead.x >= boardSize ||
    nextHead.y < 0 ||
    nextHead.y >= boardSize;
  const hitsSelf = bodyToCheck.some((segment) => {
    return segment.x === nextHead.x && segment.y === nextHead.y;
  });

  if (hitsWall || hitsSelf) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (willEat) {
    score += 1;
    addFoodParticles(food.x, food.y);
    updateBestScore();
    food = spawnFood();
    stepTime = Math.max(72, stepTime - 4);
    setStatus("Live", "Nice. The line just got longer and a little faster.");
  } else {
    snake.pop();
  }

  updateHud();
}

function updateParticles() {
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    particle.life -= 1;
  });
}

function getInterpolatedSnake(alpha) {
  return snake.map((segment, index) => {
    const previous = previousSnake[index] || segment;
    return {
      x: previous.x + (segment.x - previous.x) * alpha,
      y: previous.y + (segment.y - previous.y) * alpha,
    };
  });
}

function roundedRect(x, y, width, height, radius) {
  const cappedRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + cappedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, cappedRadius);
  ctx.arcTo(x + width, y + height, x, y + height, cappedRadius);
  ctx.arcTo(x, y + height, x, y, cappedRadius);
  ctx.arcTo(x, y, x + width, y, cappedRadius);
  ctx.closePath();
}

function drawBoard(cellSize, alpha) {
  const size = canvas.getBoundingClientRect().width;
  const pulse = (Math.sin(pulseTime / 280) + 1) / 2;
  let lineIndex;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = palette.boardBase;
  ctx.fillRect(0, 0, size, size);

  const boardGlow = ctx.createRadialGradient(size * 0.3, size * 0.2, 0, size * 0.3, size * 0.2, size * 0.9);
  boardGlow.addColorStop(0, "rgba(67, 145, 255, " + (0.14 + pulse * 0.05) + ")");
  boardGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = boardGlow;
  ctx.fillRect(0, 0, size, size);

  for (lineIndex = 0; lineIndex <= boardSize; lineIndex += 1) {
    const offset = lineIndex * cellSize;
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }

  drawFood(cellSize, pulse);
  drawSnake(cellSize, alpha);
  drawParticles();
}

function drawSnake(cellSize, alpha) {
  const renderedSnake = getInterpolatedSnake(alpha);

  renderedSnake.forEach((segment, index) => {
    const x = segment.x * cellSize;
    const y = segment.y * cellSize;
    const inset = index === 0 ? cellSize * 0.08 : cellSize * 0.12;
    const width = cellSize - inset * 2;
    const height = cellSize - inset * 2;

    ctx.shadowBlur = index === 0 ? 26 : 18;
    ctx.shadowColor = index === 0 ? "rgba(214, 255, 121, 0.34)" : "rgba(124, 255, 114, 0.24)";
    ctx.fillStyle = index === 0 ? palette.snakeHead : palette.snake;
    roundedRect(x + inset, y + inset, width, height, width * 0.34);
    ctx.fill();

    if (index === 0) {
      const eyeOffsetX = direction.x !== 0 ? width * 0.52 : width * 0.28;
      const eyeOffsetY = direction.y !== 0 ? height * 0.52 : height * 0.28;
      const baseX = x + inset;
      const baseY = y + inset;

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0b1523";
      ctx.beginPath();
      ctx.arc(baseX + eyeOffsetX, baseY + eyeOffsetY, cellSize * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        baseX + width - eyeOffsetX,
        baseY + height - eyeOffsetY,
        cellSize * 0.055,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

  ctx.shadowBlur = 0;
}

function drawFood(cellSize, pulse) {
  const centerX = (food.x + 0.5) * cellSize;
  const centerY = (food.y + 0.5) * cellSize;
  const outerRadius = cellSize * (0.24 + pulse * 0.03);
  const innerRadius = outerRadius * 0.42;

  ctx.shadowColor = "rgba(255, 93, 143, 0.45)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = palette.food;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.foodCore;
  ctx.beginPath();
  ctx.arc(centerX - outerRadius * 0.18, centerY - outerRadius * 0.18, innerRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / 30);
    ctx.fillStyle = "#ff8eb1";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function draw(alpha) {
  if (!snake || !food) {
    return;
  }

  const size = canvas.getBoundingClientRect().width;
  const cellSize = size / boardSize;
  drawBoard(cellSize, typeof alpha === "number" ? alpha : 0);
}

function gameLoop(timestamp) {
  if (!snake) {
    initGame();
  }

  if (!lastTime) {
    lastTime = timestamp;
  }

  const delta = timestamp - lastTime;
  lastTime = timestamp;
  pulseTime += delta;

  if (gameState === "running") {
    accumulator += delta;

    while (accumulator >= stepTime) {
      accumulator -= stepTime;
      step();

      if (gameState !== "running") {
        break;
      }
    }
  }

  updateParticles();
  draw(Math.min(accumulator / stepTime, 1));
  window.requestAnimationFrame(gameLoop);
}

function handlePauseToggle() {
  if (gameState === "running") {
    togglePause(true);
  } else if (gameState === "paused") {
    togglePause(false);
  }
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const controlledKeys = [
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "w",
    "a",
    "s",
    "d",
    "r",
    " ",
  ];

  if (controlledKeys.indexOf(key) !== -1 || event.code === "Space") {
    event.preventDefault();
  }

  if (key === "r") {
    restartGame();
    return;
  }

  if (key === " " || event.code === "Space") {
    handlePauseToggle();
    return;
  }

  const keyToDirection = {
    arrowup: directions.up,
    w: directions.up,
    arrowdown: directions.down,
    s: directions.down,
    arrowleft: directions.left,
    a: directions.left,
    arrowright: directions.right,
    d: directions.right,
  };

  if (keyToDirection[key]) {
    queueDirection(keyToDirection[key]);
  }
}

function bindSwipeControls() {
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });

  canvas.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    if (Math.abs(diffX) < 24 && Math.abs(diffY) < 24) {
      return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
      queueDirection(diffX > 0 ? directions.right : directions.left);
    } else {
      queueDirection(diffY > 0 ? directions.down : directions.up);
    }
  }, { passive: true });
}

document.addEventListener("keydown", handleKeydown);
startButton.addEventListener("click", startGame);
overlayStartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", handlePauseToggle);
mobilePauseButton.addEventListener("click", handlePauseToggle);
restartButton.addEventListener("click", restartGame);
resumeButton.addEventListener("click", () => togglePause(false));
restartOverlayButton.addEventListener("click", restartGame);

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    const directionName = button.getAttribute("data-direction");
    queueDirection(directions[directionName]);
  });
});

bindSwipeControls();
initGame();
window.requestAnimationFrame(gameLoop);
