const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

let width, height;
let blocks = [];
let particles = [];
let fallingBlocks = [];
let activeBlock = null;

let score = 0;
let state = 'playing'; // 'playing' | 'gameover'
let lastTime = performance.now();

const SCALE = 40;
const BLOCK_HEIGHT = 1;
const MOVE_SPEED = 0.008;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function init() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousedown', drop);
    window.addEventListener('touchstart', (e) => {
        e.preventDefault();
        drop();
    }, { passive: false });
    
    for (let i = 0; i < 75; i++) {
        particles.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.25 + 0.05
        });
    }

    // Base stack
    for (let i = 0; i < 5; i++) {
        blocks.push({
            x: 0,
            y: i * BLOCK_HEIGHT,
            z: 0,
            w: 4,
            d: 4,
            h: BLOCK_HEIGHT
        });
    }

    resize();
    spawnActiveBlock();
    requestAnimationFrame(tick);
}

function spawnActiveBlock() {
    const topBlock = blocks[blocks.length - 1];
    const direction = (blocks.length % 2 === 0) ? 1 : -1;
    
    activeBlock = {
        x: direction * 6,
        y: topBlock.y + BLOCK_HEIGHT,
        z: topBlock.z,
        w: topBlock.w,
        d: topBlock.d,
        h: topBlock.h,
        dir: -direction
    };
}

function drop() {
    if (state !== 'playing' || !activeBlock) return;

    const topBlock = blocks[blocks.length - 1];
    const delta = activeBlock.x - topBlock.x;
    const overlap = topBlock.w - Math.abs(delta);

    if (overlap <= 0) {
        // Total miss
        state = 'gameover';
        console.log('Game Over - Total Miss');
        activeBlock.vy = 0;
        activeBlock.alpha = 1;
        fallingBlocks.push(activeBlock);
        activeBlock = null;
        return;
    }

    if (overlap > topBlock.w - 0.15) {
        // Perfect placement
        activeBlock.x = topBlock.x;
        activeBlock.w = topBlock.w;
        blocks.push(activeBlock);
    } else {
        // Sliced placement
        const newW = overlap;
        const newX = topBlock.x + (delta / 2);
        
        const fallingW = topBlock.w - overlap;
        const fallingX = delta > 0 
            ? newX + (newW / 2) + (fallingW / 2)
            : newX - (newW / 2) - (fallingW / 2);

        fallingBlocks.push({
            x: fallingX,
            y: activeBlock.y,
            z: activeBlock.z,
            w: fallingW,
            d: activeBlock.d,
            h: activeBlock.h,
            vy: 0,
            alpha: 1
        });

        activeBlock.w = newW;
        activeBlock.x = newX;
        blocks.push(activeBlock);
    }

    score++;
    scoreEl.innerText = score;
    spawnActiveBlock();
}

function tick(time) {
    const dt = time - lastTime;
    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(tick);
}

function update(dt) {
    if (state === 'playing' && activeBlock) {
        activeBlock.x += activeBlock.dir * MOVE_SPEED * dt;
        if (Math.abs(activeBlock.x) > 6) {
            activeBlock.dir *= -1;
        }
    }

    fallingBlocks.forEach(fb => {
        fb.vy -= 0.0005 * dt;
        fb.y += fb.vy * dt;
        fb.alpha -= 0.001 * dt;
    });
    fallingBlocks = fallingBlocks.filter(fb => fb.alpha > 0);
}

function project(x, y, z) {
    const cos30 = 0.866;
    const sin30 = 0.5;
    
    const originX = width / 2;
    const originY = height * 0.8;
    
    const sx = originX + (x - z) * cos30 * SCALE;
    const sy = originY + (x + z) * sin30 * SCALE - y * SCALE;
    
    return { x: sx, y: sy };
}

function drawPolygon(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    
    const start = project(points[0].x, points[0].y, points[0].z);
    ctx.moveTo(start.x, start.y);
    
    for (let i = 1; i < points.length; i++) {
        const p = project(points[i].x, points[i].y, points[i].z);
        ctx.lineTo(p.x, p.y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function drawBlock(block) {
    ctx.globalAlpha = block.alpha !== undefined ? Math.max(0, block.alpha) : 1;

    const { x, y, z, w, d, h } = block;
    const hw = w / 2;
    const hd = d / 2;
    
    const topFace = [
        {x: x - hw, y: y + h, z: z - hd},
        {x: x + hw, y: y + h, z: z - hd},
        {x: x + hw, y: y + h, z: z + hd},
        {x: x - hw, y: y + h, z: z + hd}
    ];
    
    const rightFace = [
        {x: x + hw, y: y + h, z: z + hd},
        {x: x + hw, y: y + h, z: z - hd},
        {x: x + hw, y: y, z: z - hd},
        {x: x + hw, y: y, z: z + hd}
    ];
    
    const leftFace = [
        {x: x - hw, y: y + h, z: z + hd},
        {x: x + hw, y: y + h, z: z + hd},
        {x: x + hw, y: y, z: z + hd},
        {x: x - hw, y: y, z: z + hd}
    ];

    drawPolygon(leftFace, '#59526b');
    drawPolygon(rightFace, '#746c8a');
    drawPolygon(topFace, '#938bac');

    ctx.globalAlpha = 1;
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fillRect(p.x * width, p.y * height, p.size, p.size);
    });
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    drawParticles();
    
    blocks.forEach(drawBlock);
    fallingBlocks.forEach(drawBlock);
    if (activeBlock) drawBlock(activeBlock);
}

init();