// ==================== 地图系统 ====================

class GameMap {
    constructor(levelData) {
        this.tileSize = CONFIG.TILE_SIZE;
        
        // 安全门：验证地图数据
        if (!levelData || !levelData.mapData || !Array.isArray(levelData.mapData) || levelData.mapData.length === 0) {
            console.error('[Map] 无效的地图数据！', levelData);
            // 用默认空白地图兜底
            this.cols = 22;
            this.rows = 8;
            this.grid = [];
            for (let r = 0; r < this.rows; r++) {
                this.grid[r] = new Array(this.cols).fill(1);
            }
            this.purifyProgress = {};
            this.bonusPlants = {};
            this.pathCoords = [gridToPixel(3, 3, this.tileSize)];
            this.spawnPoint = null;
            this.corePos = null;
            return;
        }
        
        this.cols = levelData.mapData[0].length;
        this.rows = levelData.mapData.length;
        
        // 格子状态: 0=path, 1=buildable, 2=withered, 3=water, 4=geothermal, 5=core, 6=spawn
        this.grid = [];
        this.purifyProgress = {}; // { "col,row": 0~1 }
        this.bonusPlants = {};    // 净化后随机生成的增益植物
        
        // 解析地图数据（带边界检查）
        for (let r = 0; r < levelData.mapData.length; r++) {
            this.grid[r] = [];
            const rowData = levelData.mapData[r];
            if (!Array.isArray(rowData)) continue;
            for (let c = 0; c < rowData.length; c++) {
                const cellType = rowData[c] != null ? rowData[c] : 1; // 默认健康草地
                this.grid[r][c] = cellType;
                
                if (cellType === 2) {
                    this.purifyProgress[`${c},${r}`] = 0;
                }
            }
        }
        
        // 计算路径
        this.pathCoords = this.calculatePath();
        
        // 找出生点和终点
        this.findSpawnAndCore();
        
        // 安全门：确保路径有效
        if (!this.pathCoords || this.pathCoords.length === 0) {
            console.warn('[Map] 路径计算返回空，使用fallback');
            this.pathCoords = [gridToPixel(0, 0, this.tileSize)];
        }
    }
    
    findSpawnAndCore() {
        this.spawnPoint = null;
        this.corePos = null;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 6) {
                    this.spawnPoint = gridToPixel(c, r, this.tileSize);
                    this.spawnGrid = { col: c, row: r };
                } else if (this.grid[r][c] === 5) {
                    this.corePos = gridToPixel(c, r, this.tileSize);
                    this.coreGrid = { col: c, row: r };
                }
            }
        }
    }
    
    // 计算从出生点到核心的完整路径（BFS沿路径格子寻路）
    calculatePath() {
        const ts = this.tileSize;
        
        // 1. 找到起点(6=spawn)和终点(5=core)
        let start = null, end = null;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 6) start = { c, r };
                if (this.grid[r][c] === 5) end = { c, r };
            }
        }
        if (!start || !end) {
            console.warn('[Map] 找不到出生点或核心！使用默认路径');
            // 收集所有标记为路径的格子(0,5,6)作为fallback
            let fallbackCells = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const t = this.grid[r][c];
                    if (t === 0 || t === 6 || t === 5) {
                        fallbackCells.push({ c, r });
                    }
                }
            }
            if (fallbackCells.length === 0) return [gridToPixel(0, 0, ts)];
            // 返回所有路径格子的中心点作为紧急路径
            return fallbackCells.map(cell => gridToPixel(cell.c, cell.r, ts));
        }
        
        // 2. BFS从起点到终点，只走路径格子(0=path, 6=spawn, 5=core)
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]]; // 四方向
        const visited = new Set();
        const parent = new Map();
        const queue = [start];
        const key = (c,r) => `${c},${r}`;
        visited.add(key(start.c, start.r));
        let found = false;
        
        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.c === end.c && cur.r === end.r) {
                found = true;
                break;
            }
            for (const [dc, dr] of dirs) {
                const nc = cur.c + dc;
                const nr = cur.r + dr;
                const k = key(nc, nr);
                if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
                if (visited.has(k)) continue;
                const t = this.grid[nr][nc];
                if (t !== 0 && t !== 6 && t !== 5) continue; // 只走路径格子
                visited.add(k);
                parent.set(k, { c: cur.c, r: cur.r });
                queue.push({ c: nc, r: nr });
            }
        }
        
        // 3. 回溯路径
        if (!found) {
            console.warn('[Map] BFS找不到路径！使用fallback');
            let fallbackCells = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const t = this.grid[r][c];
                    if (t === 0 || t === 6 || t === 5) {
                        fallbackCells.push({ c, r });
                    }
                }
            }
            if (fallbackCells.length === 0) return [gridToPixel(0, 0, ts)];
            return fallbackCells.map(cell => gridToPixel(cell.c, cell.r, ts));
        }
        
        // 回溯：从终点到起点
        const pathCells = [];
        let cur = { c: end.c, r: end.r };
        while (cur) {
            pathCells.unshift(cur);
            const k = key(cur.c, cur.r);
            const p = parent.get(k);
            if (!p) break;
            if (p.c === cur.c && p.r === cur.r) break;
            cur = p;
        }
        // 确保起点在路径开头
        if (pathCells.length === 0 || pathCells[0].c !== start.c || pathCells[0].r !== start.r) {
            pathCells.unshift({ c: start.c, r: start.r });
        }
        
        // 4. 转成像素坐标，对间隙>1格的插入中间点（平滑路径）
        const path = [];
        for (let i = 0; i < pathCells.length; i++) {
            path.push(gridToPixel(pathCells[i].c, pathCells[i].r, ts));
            if (i > 0) {
                const prev = pathCells[i - 1];
                const curr = pathCells[i];
                const dc = curr.c - prev.c;
                const dr = curr.r - prev.r;
                const absDc = Math.abs(dc);
                const absDr = Math.abs(dr);
                // 对角移动需要中间过渡
                if (absDc > 1 || absDr > 1 || (absDc > 0 && absDr > 0)) {
                    const steps = Math.max(absDc, absDr);
                    for (let s = 1; s < steps; s++) {
                        const t = s / steps;
                        const ic = Math.round(prev.c + dc * t);
                        const ir = Math.round(prev.r + dr * t);
                        path.push(gridToPixel(ic, ir, ts));
                    }
                }
            }
        }
        
        return path;
    }
    
    getType(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
        return this.grid[row][col];
    }
    
    isBuildable(col, row) {
        const t = this.getType(col, row);
        return t === 1; // 只有健康草地可以建造
    }
    
    isPath(col, row) {
        return this.getType(col, row) === 0;
    }
    
    isWater(col, row) {
        return this.getType(col, row) === 3;
    }
    
    isGeothermal(col, row) {
        return this.getType(col, row) === 4;
    }
    
    isWithered(col, row) {
        return this.getType(col, row) === 2;
    }
    
    getPurifyProgress(col, row) {
        const key = `${col},${row}`;
        return this.purifyProgress[key] || 0;
    }
    
    setPurifyProgress(col, row, amount) {
        const key = `${col},${row}`;
        if (!this.purifyProgress.hasOwnProperty(key)) return false;
        this.purifyProgress[key] = clamp(amount, 0, 1);
        
        if (this.purifyProgress[key] >= 1) {
            // 净化完成，转换为可建造地块
            this.grid[row][col] = 1;
            delete this.purifyProgress[key];
            
            // 随机生成增益植物
            if (chance(0.65)) {
                const plantTypes = Object.keys(BONUS_PLANTS);
                const plantKey = randomPick(plantTypes);
                this.bonusPlants[key] = {
                    ...shallowClone(BONUS_PLANTS[plantKey]),
                    type: plantKey,
                    bornTime: Date.now()
                };
            }
            
            return 'completed';
        }
        return 'progressing';
    }
    
    // 再次污染周围地块（塔被破坏时调用）
    polluteAround(centerCol, centerRow, radius = 1.5) {
        let polluted = [];
        for (let dr = -Math.ceil(radius); dr <= Math.ceil(radius); dr++) {
            for (let dc = -Math.ceil(radius); dc <= Math.ceil(radius); dc++) {
                const nc = centerCol + dc;
                const nr = centerRow + dr;
                if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
                const dist = Math.sqrt(dc*dc + dr*dr);
                if (dist <= radius && this.isBuildable(nc, nr)) {
                    this.grid[nr][nc] = 2;
                    this.purifyProgress[`${nc},${nr}`] = 0;
                    // 移除该位置的增益植物
                    delete this.bonusPlants[`${nc},${nr}`];
                    polluted.push({ col: nc, row: nr });
                }
            }
        }
        return polluted;
    }
    
    getGreenRatio() {
        let totalBuildable = 0;
        let healthyCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const t = this.grid[r][c];
                if (t === 1 || t === 2) totalBuildable++;
                if (t === 1) healthyCount++;
            }
        }
        return totalBuildable > 0 ? (healthyCount / totalBuildable * 100) : 0;
    }
    
    // 获取指定位置相邻的枯萎地块
    getAdjacentWithered(col, row) {
        const adjacent = [];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dc, dr] of dirs) {
            const nc = col + dc, nr = row + dr;
            if (this.isWithered(nc, nr)) {
                adjacent.push({ col: nc, row: nr });
            }
        }
        return adjacent;
    }
    
    // 绘制地图
    render(ctx, offsetX = 0, offsetY = 0) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.tileSize + offsetX;
                const y = r * this.tileSize + offsetY;
                const type = this.grid[r][c];
                
                this.renderTile(ctx, x, y, c, r, type);
            }
        }
        
        // 绘制路径线
        this.renderPath(ctx, offsetX, offsetY);
    }
    
    renderTile(ctx, x, y, col, row, type) {
        const ts = this.tileSize;
        const cx = x + ts / 2;
        const cy = y + ts / 2;
        const now = Date.now();
        const seed = (col * 31 + row * 17) % 100 / 100;
        
        switch (type) {
            case 0: // 路径
                // 泥土底色
                ctx.fillStyle = '#6d4c41';
                ctx.fillRect(x, y, ts, ts);
                // 路面主体
                const pathGrad = ctx.createLinearGradient(x, y, x, y + ts);
                pathGrad.addColorStop(0, '#8d6e63');
                pathGrad.addColorStop(0.5, '#795548');
                pathGrad.addColorStop(1, '#6d4c41');
                ctx.fillStyle = pathGrad;
                ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
                // 路面随机纹理
                for (let i = 0; i < 4; i++) {
                    const px = x + 4 + ((seed * 37 + i * 13) % (ts - 8));
                    const py = y + 4 + ((seed * 53 + i * 19) % (ts - 8));
                    ctx.fillStyle = hexToRgba('#a1887f', 0.2);
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 1: // 可建造健康草地
                // 深绿底色
                ctx.fillStyle = '#2e7d32';
                ctx.fillRect(x, y, ts, ts);
                // 草地主渐变
                const grassGrad = ctx.createLinearGradient(x, y, x, y + ts);
                grassGrad.addColorStop(0, '#4caf50');
                grassGrad.addColorStop(0.5, '#43a047');
                grassGrad.addColorStop(1, '#388e3c');
                ctx.fillStyle = grassGrad;
                ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
                // 草丛细节
                this.drawGrassDetail(ctx, x, y, ts, seed);
                break;
                
            case 2: // 枯萎地块
                {
                    const progress = this.getPurifyProgress(col, row);
                    if (progress > 0 && progress < 1) {
                        // 净化渐变
                        const ratio = progress;
                        const rr = Math.floor(lerp(62, 46, ratio));
                        const gg = Math.floor(lerp(39, 125, ratio));
                        const bb = Math.floor(lerp(35, 55, ratio));
                        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
                        ctx.fillRect(x, y, ts, ts);
                        // 绿色新生
                        for (let i = 0; i < Math.floor(ratio * 5); i++) {
                            const gx = x + 3 + ((seed * 41 + i * 11) % (ts - 6));
                            const gy = y + 3 + ((seed * 59 + i * 17) % (ts - 6));
                            ctx.fillStyle = hexToRgba('#66bb6a', ratio * 0.5);
                            ctx.beginPath();
                            ctx.moveTo(gx, gy + 4);
                            ctx.lineTo(gx - 2, gy);
                            ctx.lineTo(gx + 2, gy);
                            ctx.fill();
                        }
                        // 净化进度条
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        ctx.fillRect(x + 2, y + ts - 7, ts - 4, 5);
                        const progGrad = ctx.createLinearGradient(x, 0, x + ts * progress, 0);
                        progGrad.addColorStop(0, '#76ff03');
                        progGrad.addColorStop(1, '#4caf50');
                        ctx.fillStyle = progGrad;
                        ctx.fillRect(x + 2, y + ts - 7, (ts - 4) * progress, 5);
                    } else {
                        // 枯萎地面
                        ctx.fillStyle = '#2d1f1b';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = '#3e2723';
                        ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
                        // 裂缝纹理
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                        ctx.lineWidth = 1;
                        for (let i = 0; i < 3; i++) {
                            ctx.beginPath();
                            const fx = x + 5 + ((seed * 29 + i * 7) % (ts - 10));
                            const fy = y + 3 + ((seed * 43 + i * 11) % 10);
                            ctx.moveTo(fx, fy);
                            ctx.quadraticCurveTo(fx + 5, fy + ts * 0.3, fx + 3, fy + ts * 0.6);
                            ctx.stroke();
                        }
                    }
                }
                break;
                
            case 3: // 水域
                const waterGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.7);
                waterGrad.addColorStop(0, '#42a5f5');
                waterGrad.addColorStop(0.6, '#1e88e5');
                waterGrad.addColorStop(1, '#0d47a1');
                ctx.fillStyle = waterGrad;
                ctx.fillRect(x, y, ts, ts);
                // 波光粼粼
                for (let i = 0; i < 3; i++) {
                    const wx = cx + Math.sin(now / 2000 + seed * 10 + i * 2) * ts * 0.3;
                    const wy = cy + Math.cos(now / 1800 + seed * 8 + i * 1.7) * ts * 0.25;
                    ctx.fillStyle = hexToRgba('#e3f2fd', 0.2 + 0.08 * Math.sin(now / 500 + i));
                    ctx.beginPath();
                    ctx.arc(wx, wy, 2.5 + Math.sin(now / 700 + i) * 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 边框高光
                ctx.strokeStyle = hexToRgba('#bbdefb', 0.25);
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
                break;
                
            case 4: // 地热
                ctx.fillStyle = '#1a0d08';
                ctx.fillRect(x, y, ts, ts);
                // 脉动热光
                const pulse = 0.4 + 0.2 * Math.sin(now / 300 + seed * 7);
                const geoGlow = ctx.createRadialGradient(cx, cy, 3, cx, cy, ts * 0.55);
                geoGlow.addColorStop(0, hexToRgba('#ff5722', pulse));
                geoGlow.addColorStop(0.4, hexToRgba('#ff3d00', pulse * 0.6));
                geoGlow.addColorStop(1, 'rgba(255,61,0,0)');
                ctx.fillStyle = geoGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, ts * 0.55, 0, Math.PI * 2);
                ctx.fill();
                // 裂隙纹理
                ctx.strokeStyle = hexToRgba('#ff6e40', 0.5);
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    const fa = (i / 3) * Math.PI * 2 + seed * 2;
                    const fx = cx + Math.cos(fa) * ts * 0.15;
                    const fy = cy + Math.sin(fa) * ts * 0.15;
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(cx + Math.cos(fa + 0.5) * ts * 0.4, cy + Math.sin(fa + 0.5) * ts * 0.4);
                    ctx.stroke();
                }
                break;
                
            case 5: // 核心·生命之树
                // 深绿背景
                ctx.fillStyle = '#0a1f0a';
                ctx.fillRect(x, y, ts, ts);
                // 多层光晕
                for (let l = 2; l >= 0; l--) {
                    const coreGlow = ctx.createRadialGradient(cx, cy, l * ts * 0.12, cx, cy, ts * (0.4 + l * 0.15));
                    coreGlow.addColorStop(0, hexToRgba('#76ff03', 0.25 - l * 0.07));
                    coreGlow.addColorStop(1, 'rgba(118,255,3,0)');
                    ctx.fillStyle = coreGlow;
                    ctx.beginPath();
                    ctx.arc(cx, cy, ts * (0.4 + l * 0.15), 0, Math.PI * 2);
                    ctx.fill();
                }
                // 树干
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(cx - 4, cy - 2, 8, ts * 0.35);
                // 树冠
                const crownGrad = ctx.createRadialGradient(cx, cy - ts * 0.12, 2, cx, cy - ts * 0.15, ts * 0.3);
                crownGrad.addColorStop(0, '#66bb6a');
                crownGrad.addColorStop(0.7, '#2e7d32');
                crownGrad.addColorStop(1, '#1b5e20');
                ctx.fillStyle = crownGrad;
                ctx.beginPath();
                ctx.arc(cx, cy - ts * 0.15, ts * 0.28, 0, Math.PI * 2);
                ctx.fill();
                // 叶片纹理
                ctx.fillStyle = hexToRgba('#a5d6a7', 0.3);
                ctx.beginPath();
                ctx.arc(cx - ts * 0.06, cy - ts * 0.22, ts * 0.08, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + ts * 0.08, cy - ts * 0.18, ts * 0.06, 0, Math.PI * 2);
                ctx.fill();
                // 脉动光环
                const heartPulse = 0.3 + 0.15 * Math.sin(now / 800);
                ctx.strokeStyle = hexToRgba('#76ff03', heartPulse);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, ts * 0.33 + Math.sin(now / 600) * 2, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 6: // 出生点
                ctx.fillStyle = '#3e1a1a';
                ctx.fillRect(x, y, ts, ts);
                // 警示条纹
                const stripeCount = 6;
                for (let i = 0; i < stripeCount; i++) {
                    const sx = x + i * (ts / stripeCount);
                    ctx.fillStyle = i % 2 === 0 ? '#b71c1c' : '#3e1a1a';
                    ctx.fillRect(sx, y + 2, ts / stripeCount, ts - 4);
                }
                // 危险光晕
                const dangerGlow = ctx.createRadialGradient(cx, cy, 3, cx, cy, ts * 0.45);
                dangerGlow.addColorStop(0, hexToRgba('#f44336', 0.4));
                dangerGlow.addColorStop(1, 'rgba(244,67,54,0)');
                ctx.fillStyle = dangerGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, ts * 0.45, 0, Math.PI * 2);
                ctx.fill();
                // 矢量危险标志（三角+感叹号）
                const triR = ts * 0.18;
                ctx.fillStyle = '#f44336';
                ctx.strokeStyle = '#b71c1c';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy - triR);
                ctx.lineTo(cx + triR * 0.85, cy + triR * 0.6);
                ctx.lineTo(cx - triR * 0.85, cy + triR * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // 感叹号
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${ts * 0.28}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', cx, cy + triR * 0.06);
                break;
        }
        
        // 绘制增益植物（矢量）
        const bpKey = `${col},${row}`;
        if (this.bonusPlants[bpKey]) {
            const bp = this.bonusPlants[bpKey];
            const floatY = Math.sin(now / 600 + col * 0.7 + row * 1.3) * 2;
            const bpx = cx;
            const bpy = cy + floatY;
            // 光晕
            const bpGlow = ctx.createRadialGradient(bpx, bpy, 2, bpx, bpy, ts * 0.38);
            bpGlow.addColorStop(0, hexToRgba(bp.color, 0.35));
            bpGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bpGlow;
            ctx.beginPath();
            ctx.arc(bpx, bpy, ts * 0.38, 0, Math.PI * 2);
            ctx.fill();
            // 根据类型绘制矢量植物
            MapRenderer.drawBonusPlant(ctx, bpx, bpy, ts * 0.2, bp, now);
        }
        
        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, ts, ts);
    }
    
    drawGrassDetail(ctx, x, y, ts, seed) {
        // 草丛1
        ctx.fillStyle = hexToRgba('#81c784', 0.3);
        const gx1 = x + 4 + (seed * ts * 0.7) % (ts - 8);
        const gy1 = y + 4 + (seed * ts * 0.5) % (ts - 8);
        ctx.beginPath();
        ctx.moveTo(gx1, gy1 + 5);
        ctx.quadraticCurveTo(gx1 - 2, gy1, gx1 - 1, gy1 - 1);
        ctx.quadraticCurveTo(gx1, gy1 - 3, gx1 + 1, gy1 - 1);
        ctx.quadraticCurveTo(gx1 + 2, gy1, gx1, gy1 + 5);
        ctx.fill();
        // 草丛2
        const gx2 = x + ts * 0.6 + (seed * ts * 0.3) % (ts * 0.3);
        const gy2 = y + ts * 0.3 + (seed * ts * 0.4) % (ts * 0.4);
        ctx.fillStyle = hexToRgba('#a5d6a7', 0.25);
        ctx.beginPath();
        ctx.moveTo(gx2, gy2 + 4);
        ctx.quadraticCurveTo(gx2 - 1.5, gy2, gx2, gy2 - 2);
        ctx.quadraticCurveTo(gx2 + 1.5, gy2, gx2, gy2 + 4);
        ctx.fill();
        // 小花
        if (seed > 0.7) {
            const fx = x + ts * 0.3 + (seed * ts * 0.4) % (ts * 0.4);
            const fy = y + ts * 0.5 + (seed * ts * 0.3) % (ts * 0.3);
            ctx.fillStyle = hexToRgba('#fff9c4', 0.5);
            ctx.beginPath();
            ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderPath(ctx, offsetX, offsetY) {
        if (this.pathCoords.length < 2) return;
        
        ctx.strokeStyle = 'rgba(121,85,72,0.25)';
        ctx.lineWidth = this.tileSize * 0.55;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.pathCoords[0].x + offsetX, this.pathCoords[0].y + offsetY);
        for (let i = 1; i < this.pathCoords.length; i++) {
            ctx.lineTo(this.pathCoords[i].x + offsetX, this.pathCoords[i].y + offsetY);
        }
        ctx.stroke();
        
        // 方向箭头
        ctx.fillStyle = 'rgba(121,85,72,0.18)';
        for (let i = 4; i < this.pathCoords.length - 4; i += 5) {
            const p = this.pathCoords[i];
            const pNext = this.pathCoords[Math.min(i + 1, this.pathCoords.length - 1)];
            const angle = angleBetween(p.x, p.y, pNext.x, pNext.y);
            ctx.save();
            ctx.translate(p.x + offsetX, p.y + offsetY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    getWidth() { return this.cols * this.tileSize; }
    getHeight() { return this.rows * this.tileSize; }
}

// ==================== 地图装饰渲染器 ====================
const MapRenderer = {
    
    // 增益植物矢量绘制
    drawBonusPlant(ctx, x, y, size, bp, now) {
        const pulse = Math.sin(now / 500 + x * 0.1) * 0.15 + 0.85;
        
        switch (bp.type) {
            case 'speed_herb': // 速生草 - 闪电⚡造型
                ctx.fillStyle = bp.color;
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x - size * 0.3, y - size * 0.15);
                ctx.lineTo(x + size * 0.05, y - size * 0.1);
                ctx.lineTo(x - size * 0.35, y + size * 0.5);
                ctx.lineTo(x + size * 0.1, y + size * 0.05);
                ctx.lineTo(x - size * 0.05, y + size * 0.15);
                ctx.lineTo(x + size * 0.35, y - size * 0.35);
                ctx.lineTo(x - size * 0.05, y - size * 0.2);
                ctx.lineTo(x + size * 0.35, y + size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = hexToRgba('#fff', 0.4);
                ctx.lineWidth = 0.8;
                ctx.stroke();
                break;
                
            case 'regen_moss': // 再生苔藓 - 心形
                ctx.fillStyle = bp.color;
                ctx.beginPath();
                const hs = size * 0.5;
                ctx.arc(x - hs * 0.45, y - hs * 0.15, hs * 0.38, Math.PI * 0.8, Math.PI * 2.2);
                ctx.arc(x + hs * 0.45, y - hs * 0.15, hs * 0.38, Math.PI * 0.8, Math.PI * 2.2);
                ctx.lineTo(x, y + hs * 0.8);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'shield_flower': // 守护花 - 盾牌花
                // 花瓣
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const px = x + Math.cos(a) * size * 0.3;
                    const py = y + Math.sin(a) * size * 0.3;
                    ctx.fillStyle = hexToRgba(bp.color, pulse);
                    ctx.beginPath();
                    ctx.arc(px, py, size * 0.22, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 花蕊
                ctx.fillStyle = '#fff9c4';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // 盾形轮廓
                ctx.strokeStyle = bp.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            default: // 通用嫩芽
                ctx.fillStyle = bp.color;
                ctx.beginPath();
                ctx.moveTo(x, y + size * 0.5);
                ctx.quadraticCurveTo(x - size * 0.15, y + size * 0.1, x - size * 0.05, y - size * 0.3);
                ctx.quadraticCurveTo(x, y - size * 0.5, x + size * 0.1, y - size * 0.35);
                ctx.quadraticCurveTo(x + size * 0.2, y + size * 0.1, x, y + size * 0.5);
                ctx.fill();
                break;
        }
    }
};
