const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const runStarsEl = document.getElementById('run-stars-val');
const totalStarsEl = document.getElementById('total-stars-val');
const turnBtn = document.getElementById('turn-btn');
const pauseBtn = document.getElementById('pause-btn');
const pauseOverlay = document.getElementById('pause-overlay');

let width, height;
let blocks = [];
let particles = [];
let fallingBlocks = [];
let activeBlock = null;

let score = 0;
let runStars = 0;
let totalStars = parseInt(localStorage.getItem('towerTurnTotalStars')) || 0;
let state = 'playing'; // 'playing', 'paused', 'gameover'
let lastTime = performance.now();

const SCALE = 40;
const BLOCK_HEIGHT = 1;
const MOVE_SPEED = 0.008;

let turns = 0;
let cameraAngle = 0;
let cameraY = 0;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function init() {
    window.addEventListener('resize', resize);
    
    totalStarsEl.innerText = totalStars;
    
    const triggerDrop = (e) => {
        if (e.target !== turnBtn && !turnBtn.contains(e.target) && 
            e.target !== pauseBtn && !pauseBtn.contains(e.target)) {
            e.preventDefault();
            drop();
        }
    };

    window.addEventListener('mousedown', triggerDrop);
    window.addEventListener('touchstart', triggerDrop, { passive: false });
    
    turnBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); turn(); });
    turnBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); turn(); }, { passive: false });
    
    pauseBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); togglePause(); });
    pauseBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); togglePause(); }, { passive: false });
    
    pauseOverlay.addEventListener('mousedown', (e) => { e.stopPropagation(); togglePause(); });
    pauseOverlay.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); togglePause(); }, { passive: false });

    for (let i = 0; i < 75; i++) {
        particles.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.25 + 0.05
        });
    }

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

function togglePause() {
    if (state === 'playing') {
        state = 'paused';
        pauseOverlay.style.display = 'flex';
    } else if (state === 'paused') {
        state = 'playing';
        pauseOverlay.style.display = 'none';
        lastTime = performance.now();
    }
}

function turn() {
    if (state !== 'playing') return;
    turns++;
    if (activeBlock) {
        const top = blocks[blocks.length - 1];
        const dx = activeBlock.x - top.x;
        const dz = activeBlock.z - top.z;
        
        activeBlock.x = top.x + dz;
        activeBlock.z = top.z - dx;
        
        if (turns % 2 === 1) {
            activeBlock.dir = -activeBlock.dir;
        }
    }
}

function spawnActiveBlock() {
    const top = blocks[blocks.length - 1];
    const visualStart = ((blocks.length + turns) % 2 === 0) ? 6 : -6;
    
    activeBlock = {
        x: top.x,
        y: top.y + BLOCK_HEIGHT,
        z: top.z,
        w: top.w,
        d: top.d,
        h: top.h
    };
    
    if (turns % 4 === 0) activeBlock.x += visualStart;
    if (turns % 4 === 1) activeBlock.z -= visualStart;
    if (turns % 4 === 2) activeBlock.x -= visualStart;
    if (turns % 4 === 3) activeBlock.z += visualStart;
    
    const axis = (turns % 2 === 0) ? 'x' : 'z';
    const currentOffset = activeBlock[axis] - top[axis];
    activeBlock.dir = currentOffset > 0 ? -1 : 1;
}

function drop() {
    if (state !== 'playing' || !activeBlock) return;

    const top = blocks[blocks.length - 1];
    const axis = (turns % 2 === 0) ? 'x' : 'z';
    const dim = (axis === 'x') ? 'w' : 'd';
    
    const delta = activeBlock[axis] - top[axis];
    const overlap = activeBlock[dim] - Math.abs(delta);

    if (overlap <= 0) {
        state = 'gameover';
        console.log('Game Over - Total Miss');
        activeBlock.vy = 0;
        activeBlock.alpha = 1;
        fallingBlocks.push(activeBlock);
        activeBlock = null;
        return;
    }

    if (overlap > activeBlock[dim] - 0.15) {
        activeBlock[axis] = top[axis];
        blocks.push(activeBlock);
        
        runStars++;
        totalStars++;
        runStarsEl.innerText = runStars;
        totalStarsEl.innerText = totalStars;
        localStorage.setItem('towerTurnTotalStars', totalStars);
    } else {
        const newDim = overlap;
        const newPos = top[axis] + (delta / 2);
        
        const fallingDim = activeBlock[dim] - overlap;
        const fallingPos = delta > 0 
            ? newPos + (newDim / 2) + (fallingDim / 2)
            : newPos - (newDim / 2) - (fallingDim / 2);

        const fallingBlock = { ...activeBlock, vy: 0, alpha: 1 };
        fallingBlock[dim] = fallingDim;
        fallingBlock[axis] = fallingPos;
        fallingBlocks.push(fallingBlock);

        activeBlock[dim] = newDim;
        activeBlock[axis] = newPos;
        blocks.push(activeBlock);
    }

    score++;
    scoreEl.innerText = score;
    spawnActiveBlock();
}

function tick(time) {
    const dt = time - lastTime;
    lastTime = time;

    if (state !== 'paused') {
        update(dt);
    }
    draw();

    requestAnimationFrame(tick);
}

function update(dt) {
    if (state === 'playing' && activeBlock) {
        const axis = (turns % 2 === 0) ? 'x' : 'z';
        activeBlock[axis] += activeBlock.dir * MOVE_SPEED * dt;
        
        const top = blocks[blocks.length - 1];
        if (Math.abs(activeBlock[axis] - top[axis]) > 6) {
            activeBlock.dir *= -1;
        }
    }

    fallingBlocks.forEach(fb => {
        fb.vy -= 0.0005 * dt;
        fb.y += fb.vy * dt;
        fb.alpha -= 0.001 * dt;
    });
    fallingBlocks = fallingBlocks.filter(fb => fb.alpha > 0);

    const targetAngle = turns * (Math.PI / 2);
    cameraAngle += (targetAngle - cameraAngle) * 0.01 * dt;

    const targetCameraY = Math.max(0, (blocks.length - 5) * BLOCK_HEIGHT);
    cameraY += (targetCameraY - cameraY) * 0.005 * dt;
}

function project(x, y, z) {
    const cos30 = 0.866;
    const sin30 = 0.5;
    const originX = width / 2;
    const originY = height * 0.7;
    
    const sx = originX + (x - z) * cos30 * SCALE;
    const sy = originY + (x + z) * sin30 * SCALE - (y - cameraY) * SCALE;
    return { x: sx, y: sy };
}

function drawCube(block) {
    ctx.globalAlpha = block.alpha !== undefined ? Math.max(0, block.alpha) : 1;

    const { x, y, z, w, d, h } = block;
    const hw = w / 2, hd = d / 2;
    
    const corners = [
        { cx: x - hw, cy: y + h, cz: z - hd },
        { cx: x + hw, cy: y + h, cz: z - hd },
        { cx: x + hw, cy: y + h, cz: z + hd },
        { cx: x - hw, cy: y + h, cz: z + hd },
        { cx: x - hw, cy: y, cz: z - hd },
        { cx: x + hw, cy: y, cz: z - hd },
        { cx: x + hw, cy: y, cz: z + hd },
        { cx: x - hw, cy: y, cz: z + hd }
    ];

    const pts = corners.map(c => {
        const rx = c.cx * Math.cos(cameraAngle) - c.cz * Math.sin(cameraAngle);
        const rz = c.cx * Math.sin(cameraAngle) + c.cz * Math.cos(cameraAngle);
        return project(rx, c.cy, rz);
    });

    const blockCx = pts.reduce((sum, p) => sum + p.x, 0) / 8;

    const faces = [
        { indices: [0, 1, 2, 3], type: 'top' },
        { indices: [4, 5, 6, 7], type: 'bottom' },
        { indices: [3, 2, 6, 7], type: 'side' },
        { indices: [5, 4, 0, 1], type: 'side' },
        { indices: [2, 1, 5, 6], type: 'side' },
        { indices: [4, 7, 3, 0], type: 'side' }
    ];

    faces.forEach(face => {
        const p0 = pts[face.indices[0]];
        const p1 = pts[face.indices[1]];
        const p2 = pts[face.indices[2]];
        const p3 = pts[face.indices[3]];

        const cp = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
        
        if (cp > 0) {
            let color = '#938bac';
            if (face.type === 'bottom') color = '#2a2536';
            if (face.type === 'side') {
                const faceCx = (p0.x + p1.x + p2.x + p3.x) / 4;
                color = faceCx < blockCx - 0.1 ? '#59526b' : '#746c8a';
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < 4; i++) ctx.lineTo(pts[face.indices[i]].x, pts[face.indices[i]].y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    });

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
    
    let allBlocks = [...blocks, ...fallingBlocks];
    if (activeBlock) allBlocks.push(activeBlock);
    
    allBlocks.forEach(b => {
        const rx = b.x * Math.cos(cameraAngle) - b.z * Math.sin(cameraAngle);
        const rz = b.x * Math.sin(cameraAngle) + b.z * Math.cos(cameraAngle);
        b.depth = b.y * 100 + (rx + rz); 
    });
    
    allBlocks.sort((a, b) => a.depth - b.depth);
    allBlocks.forEach(drawCube);
}

init();