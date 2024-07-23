// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 50,
  height: 50,
  speed: 5,
  dx: 0,
  dy: 0,
  color: '#00f',
  weapon: 'pistol',
  health: 100,
  experience: 0,
  level: 1,
  attack: 15, // Increased initial attack
  experienceToLevelUp: 100
};

const bullets = [];
const zombies = [];
const items = [];
const zombieSpawnInterval = 1000; // Spawn a zombie every second
const itemSpawnInterval = 5000; // Spawn an item every 5 seconds

const weapons = {
  pistol: { color: '#ff0', speed: 7, damage: 15, bulletSize: 10 },
  shotgun: { color: '#f90', speed: 5, damage: 25, bulletSize: 15 },
  rifle: { color: '#0ff', speed: 10, damage: 20, bulletSize: 12 }
};

function drawRect(obj, style) {
  ctx.fillStyle = style;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function drawPlayer() {
  drawRect(player, player.color);

  // Draw player health bar
  ctx.fillStyle = 'red';
  ctx.fillRect(player.x, player.y - 10, player.width, 5);
  ctx.fillStyle = 'green';
  ctx.fillRect(player.x, player.y - 10, (player.width * player.health) / 100, 5);
}

function drawBullets() {
  bullets.forEach((bullet, index) => {
    drawRect(bullet, bullet.color);
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;

    // Remove bullet if it goes off screen
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(index, 1);
    }
  });
}

function drawZombies() {
  zombies.forEach((zombie, index) => {
    drawRect(zombie, '#0f0');

    // Draw health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(zombie.x, zombie.y - 10, zombie.width, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(zombie.x, zombie.y - 10, (zombie.width * zombie.health) / 100, 5);

    // Move zombie towards the player
    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
    zombie.x += Math.cos(angle) * zombie.speed;
    zombie.y += Math.sin(angle) * zombie.speed;

    // Check collision with player
    if (zombie.x < player.x + player.width &&
      zombie.x + zombie.width > player.x &&
      zombie.y < player.y + player.height &&
      zombie.y + zombie.height > player.y) {
      player.health -= 1;
      if (player.health <= 0) {
        alert('Game Over');
        window.location.reload();
      }
    }
  });
}

function drawItems() {
  items.forEach((item, index) => {
    drawRect(item, '#f0f');
    item.y += item.speed;

    // Remove item if it goes off screen
    if (item.y > canvas.height) {
      items.splice(index, 1);
    }
  });
}

function drawExperienceBar() {
  const expBar = document.querySelector('.experience-bar');
  const expFill = expBar.querySelector('.fill');
  const expPercentage = (player.experience / player.experienceToLevelUp) * 100;
  expFill.style.width = `${expPercentage}%`;
}

function drawAttackInfo() {
  const attackInfo = document.querySelector('.attack-info');
  attackInfo.textContent = `Attack: ${player.attack}`;
}

function spawnZombie() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  switch (edge) {
    case 0: // top
      x = Math.random() * canvas.width;
      y = 0;
      break;
    case 1: // bottom
      x = Math.random() * canvas.width;
      y = canvas.height;
      break;
    case 2: // left
      x = 0;
      y = Math.random() * canvas.height;
      break;
    case 3: // right
      x = canvas.width;
      y = Math.random() * canvas.height;
      break;
  }

  const zombie = {
    x: x,
    y: y,
    width: 50,
    height: 50,
    speed: 2,
    health: 100
  };
  zombies.push(zombie);
}

function spawnItem() {
  const item = {
    x: Math.random() * canvas.width,
    y: 0,
    width: 30,
    height: 30,
    speed: 2,
    type: Math.random() < 0.5 ? 'speed' : (Math.random() < 0.5 ? 'heal' : 'upgrade')
  };
  items.push(item);
}

function updatePlayerPosition() {
  player.x += player.dx;
  player.y += player.dy;

  // Prevent player from going out of bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    zombies.forEach((zombie, zombieIndex) => {
      if (bullet.x < zombie.x + zombie.width &&
        bullet.x + bullet.width > zombie.x &&
        bullet.y < zombie.y + zombie.height &&
        bullet.y + bullet.height > zombie.y) {
        // Reduce zombie health
        zombie.health -= weapons[player.weapon].damage;

        // Add experience to player
        if (zombie.health <= 0) {
          player.experience += 10; // Experience points for killing a zombie
          if (player.experience >= player.experienceToLevelUp) {
            levelUp();
          }
          zombies.splice(zombieIndex, 1);
        }

        // Remove the bullet
        bullets.splice(bulletIndex, 1);
      }
    });
  });

  // Check collision between player and items
  items.forEach((item, index) => {
    if (player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y) {
      // Handle item effect
      switch (item.type) {
        case 'speed':
          player.speed += 2;
          break;
        case 'heal':
          player.health = Math.min(player.health + 20, 100);
          break;
        case 'upgrade':
          upgradeWeapon();
          break;
      }
      items.splice(index, 1);
    }
  });
}

function levelUp() {
  player.level++;
  player.experience -= player.experienceToLevelUp;
  player.experienceToLevelUp += 50; // Increase experience needed for next level
  player.health += 10;
  player.attack += 5;
  player.attack = Math.min(player.attack, 50); // Max attack limit for balance
}

function upgradeWeapon() {
  const weaponKeys = Object.keys(weapons);
  const nextWeapon = weaponKeys[(weaponKeys.indexOf(player.weapon) + 1) % weaponKeys.length];
  player.weapon = nextWeapon;
  player.attack = weapons[nextWeapon].damage;

  // Adjust bullet size and color
  bullets.forEach(bullet => {
    bullet.width = weapons[nextWeapon].bulletSize;
    bullet.height = weapons[nextWeapon].bulletSize;
    bullet.color = weapons[nextWeapon].color;
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayerPosition();
  drawPlayer();
  drawBullets();
  drawZombies();
  drawItems();
  drawExperienceBar();
  drawAttackInfo();
  checkCollisions();

  requestAnimationFrame(gameLoop);
}

function keyDownHandler(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = -player.speed;
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    player.dy = -player.speed;
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    player.dy = player.speed;
  }
}

function keyUpHandler(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = 0;
  } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') {
    player.dy = 0;
  }
}

function mouseDownHandler(e) {
  const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
  const bullet = {
    x: player.x + player.width / 2 - (weapons[player.weapon].bulletSize / 2),
    y: player.y + player.height / 2 - (weapons[player.weapon].bulletSize / 2),
    width: weapons[player.weapon].bulletSize,
    height: weapons[player.weapon].bulletSize,
    speed: weapons[player.weapon].speed,
    color: weapons[player.weapon].color,
    angle: angle
  };
  bullets.push(bullet);
}

window.addEventListener('keydown', keyDownHandler);
window.addEventListener('keyup', keyUpHandler);
canvas.addEventListener('mousedown', mouseDownHandler);

setInterval(spawnZombie, zombieSpawnInterval);
setInterval(spawnItem, itemSpawnInterval);
gameLoop();
