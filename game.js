const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let width, height;
const blocks = [];
const particles = [];

const SCALE = 40;
const BLOCK_HEIGHT = 1;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    draw();
}

function init() {
    window.addEventListener('resize', resize);
    
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
}

init();