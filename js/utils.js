// ==================== 工具函数 ====================

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
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

// ==================== 性能优化工具 ====================

// Gradient 缓存（避免每帧创建大量 gradient 对象）
const _gradCache = new Map();
function getGradient(type, ctx, colors) {
    // type: 'linear' | 'radial'
    // colors: 参数数组 或 唯一key字符串
    const key = typeof colors === 'string' ? colors : JSON.stringify(colors);
    const cacheKey = `${type}_${key}`;
    if (_gradCache.has(cacheKey)) return _gradCache.get(cacheKey);
    return null; // 返回null表示需重新创建
}
function setGradient(type, ctx, colors, gradient) {
    const key = typeof colors === 'string' ? colors : JSON.stringify(colors);
    const cacheKey = `${type}_${key}`;
    _gradCache.set(cacheKey, gradient);
    // 控制缓存大小，超过1000时删除最早的一半
    if (_gradCache.size > 1000) {
        const keys = [..._gradCache.keys()].slice(0, 500);
        for (const k of keys) _gradCache.delete(k);
    }
}
function cachedLinearGradient(ctx, x0, y0, x1, y1, colorStops) {
    const key = `linear_${x0},${y0},${x1},${y1}_${colorStops.map(s => `${s[0]}:${s[1]}`).join('|')}`;
    let g = _gradCache.get(key);
    if (!g) {
        g = ctx.createLinearGradient(x0, y0, x1, y1);
        for (const [pos, color] of colorStops) g.addColorStop(pos, color);
        _gradCache.set(key, g);
        if (_gradCache.size > 1000) {
            const keys = [..._gradCache.keys()].slice(0, 500);
            for (const k of keys) _gradCache.delete(k);
        }
    }
    return g;
}
function cachedRadialGradient(ctx, x0, y0, r0, x1, y1, r1, colorStops) {
    const key = `radial_${x0|0},${y0|0},${r0|0},${x1|0},${y1|0},${r1|0}_${colorStops.map(s => `${s[0]}:${s[1]}`).join('|')}`;
    let g = _gradCache.get(key);
    if (!g) {
        g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (const [pos, color] of colorStops) g.addColorStop(pos, color);
        _gradCache.set(key, g);
        if (_gradCache.size > 1000) {
            const keys = [..._gradCache.keys()].slice(0, 500);
            for (const k of keys) _gradCache.delete(k);
        }
    }
    return g;
}
