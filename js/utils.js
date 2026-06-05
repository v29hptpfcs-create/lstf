// ==================== 工具函数 ====================

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 概率判定
function chance(probability) {
    return Math.random() < probability;
}

// 角度转弧度
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// 计算从(x1,y1)到(x2,y2)的角度
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// 沿角度移动
function moveAlongAngle(x, y, angle, dist) {
    return {
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist
    };
}

// 格子坐标 → 像素坐标（格子中心）
function gridToPixel(col, row, tileSize = CONFIG.TILE_SIZE) {
    return {
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize / 2
    };
}

// 像素坐标 → 格子坐标
function pixelToGrid(px, py, tileSize = CONFIG.TILE_SIZE) {
    return {
        col: Math.floor(px / tileSize),
        row: Math.floor(py / tileSize)
    };
}

// 检查点是否在圆内
function inCircle(px, py, cx, cy, r) {
    return distance(px, py, cx, cy) <= r;
}

// 浅拷贝对象
function shallowClone(obj) {
    return { ...obj };
}

// 格式化数字显示
function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

// 颜色工具：hex转rgba
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// Canvas roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
    };
}
