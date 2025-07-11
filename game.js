const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keys = {};
let bullets = [], enemies = [], explosions = [];

const player = {
  x: 100,
  y: 400,
  width: 64,
  height: 64,
  vx: 0,
  vy: 0,
  onGround: false,
  hp: 3,
  sprite: new Image(),
  frame: 0,
  shooting: false,
};

player.sprite.src = 'assets/prime8-run.png';

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const bulletImg = loadImage('assets/bullet.png');
const enemyImg = loadImage('assets/enemy.png');
const explosionImg = loadImage('assets/explosion.png');
let bgImg = new Image();

let cameraX = 0;
let currentLevel = 0;
let levelData = {};
let worldLength = 2000;

function drawPlayer() {
  ctx.drawImage(player.sprite, player.frame * 64, 0, 64, 64, player.x - cameraX, player.y, 64, 64);
}

function drawEnemies() {
  enemies.forEach(e => ctx.drawImage(enemyImg, e.x - cameraX, e.y, e.width, e.height));
}

function drawBullets() {
  bullets.forEach(b => ctx.drawImage(bulletImg, b.x - cameraX, b.y, 16, 8));
}

function drawExplosions() {
  explosions.forEach(ex => ctx.drawImage(explosionImg, ex.x - cameraX, ex.y, 64, 64));
}

function shoot() {
  bullets.push({ x: player.x + 50, y: player.y + 25, vx: 8 });
}

function update() {
  player.vy += 0.5;
  player.y += player.vy;
  player.x += player.vx;

  if (player.y > 400) {
    player.y = 400;
    player.vy = 0;
    player.onGround = true;
  }

  if (keys['ArrowUp'] && player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }

  if (keys['ArrowLeft']) player.vx = -3;
  else if (keys['ArrowRight']) player.vx = 3;
  else player.vx = 0;

  if (keys[' '] && !player.shooting) {
    shoot();
    player.shooting = true;
    setTimeout(() => (player.shooting = false), 300);
  }

  bullets.forEach(b => (b.x += b.vx));
  bullets = bullets.filter(b => b.x < cameraX + canvas.width);

  enemies.forEach(e => {
    if (e.x > player.x) e.x -= 1.5;
  });

  bullets.forEach(b => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + 16 > e.x &&
        b.y < e.y + e.height &&
        b.y + 8 > e.y
      ) {
        e.hp -= 1;
        if (e.hp <= 0) {
          explosions.push({ x: e.x, y: e.y });
          enemies.splice(ei, 1);
        }
      }
    });
  });

  cameraX = Math.max(0, player.x - canvas.width / 2);

  if (player.x > worldLength - 100) {
    currentLevel++;
    loadLevel(currentLevel);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, -cameraX * 0.5, 0, canvas.width * 2, canvas.height);
  update();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawExplosions();
  requestAnimationFrame(gameLoop);
}

async function loadLevel(index) {
  const res = await fetch(`levels/level${index + 1}.json`);
  levelData = await res.json();
  enemies = levelData.enemies.map(e => ({ ...e, width: 64, height: 64, hp: 2 }));
  bgImg.src = `assets/${levelData.background}`;
  worldLength = levelData.length;
  player.x = 100;
  cameraX = 0;
}

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function triggerKey(key, state) {
  keys[key] = state;
}

function setupMobileControls() {
  const controlMap = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    shoot: ' '
  };

  Object.entries(controlMap).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerKey(key, true);
    });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      triggerKey(key, false);
    });
  });
}

function startGame() {
  document.getElementById('intro-screen').style.display = 'none';
  setupMobileControls();
  loadLevel(currentLevel);
  gameLoop();
}

window.onload = () => {
  document.getElementById('start-button').addEventListener('click', startGame);
};
