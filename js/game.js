// ==================== 游戏主逻辑 ====================

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布尺寸
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        // 游戏状态
        this.running = false;
        this.paused = false;
        this.gameSpeed = 1;  // 1x, 2x
        this.lastTime = 0;
        
        // 游戏数据
        this.hp = CONFIG.STARTING_HP;
        this.chlorophyll = CONFIG.STARTING_CHLOROPHYLL;
        this.dewdrop = CONFIG.STARTING_DEWDROP;
        this.currentLevelIndex = 0;
        
        // 实体
        this.map = null;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.groundEffects = []; // 地面效果（油渍等）
        
        // 系统
        this.waveManager = null;
        this.ui = new UI(this);
        
        // 选择/放置状态
        this.selectedTowerDef = null;     // 正在放置的塔定义
        this.selectedTower = null;         // 选中的已建塔
        this.isPlacingMode = false;       // 是否在放置模式
        this.hoveredGrid = { col: -1, row: -1 };
        
        // 视觉偏移（地图居中）
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 屏幕震动
        this.screenShake = 0;
        
        // 统计
        this.totalKills = 0;
        this.totalChlorophyllEarned = 0;
        this.totalChlorophyllSpent = 0;
        this.towersBuilt = 0;
        this.towersSold = 0;
        
        // 观察笔记记录
        this.unlockedNotes = new Set();
        
        // 本局已遇敌追踪（用于首次出现弹出生物图鉴）
        this._seenEnemyTypes = new Set();
        this._bestiaryTimer = null;
        
        // 技能系统
        this.abilities = {
            purifyRain: { name: '净化雨', cost: 20, cooldown: 15000, lastUsed: 0, icon: '🌧', desc: '全图枯萎地块净化进度+20%' },
            rootSurge: { name: '根脉涌动', cost: 25, cooldown: 18000, lastUsed: 0, icon: '🌿', desc: '所有植物塔2秒内攻速翻倍' },
            thornWall: { name: '荆棘屏障', cost: 15, cooldown: 20000, lastUsed: 0, icon: '🌵', desc: '路径上的敌人受到50伤害并减速5秒' },
            energyBurst: { name: '能量爆发', cost: 30, cooldown: 25000, lastUsed: 0, icon: '💥', desc: '所有能源塔立即充能完毕，下一发伤害x3' },
            freezeAll: { name: '极寒领域', cost: 35, cooldown: 30000, lastUsed: 0, icon: '🧊', desc: '冻结全图敌人3秒，期间不受减速效果影响' },
        };
        
        // 初始化输入
        this.initInput();
    }
    
    loadLevel(levelIndex) {
        try {
            this.currentLevelIndex = levelIndex;
            const levelData = LEVELS[levelIndex];
            if (!levelData) {
                console.error('[Game] 关卡数据不存在:', levelIndex);
                return false;
            }
            
            // 重置游戏状态
            this.hp = CONFIG.STARTING_HP;
            const diff = this._difficulty || { goldMul: 1 };
            this.chlorophyll = Math.round((levelData.startingGold || CONFIG.STARTING_CHLOROPHYLL) * diff.goldMul);
            this.dewdrop = Math.round((levelData.startingDewdrop || CONFIG.STARTING_DEWDROP) * diff.goldMul);
            this.towers = [];
            this.enemies = [];
            this.projectiles = [];
            this.particles = [];
            this.floatingTexts = [];
            this.groundEffects = [];
            this.totalKills = 0;
            this.totalChlorophyllEarned = 0;
            this.totalChlorophyllSpent = 0;
            this.towersBuilt = 0;
            this.towersSold = 0;
            this.selectedTower = null;
            this.selectedTowerDef = null;
            this.isPlacingMode = false;
            this.unlockedNotes.clear();
            
            // 创建地图（带try-catch）
            try {
                this.map = new GameMap(levelData);
            } catch (mapError) {
                console.error('[Game] 地图加载失败:', mapError);
                alert('地图加载失败，请刷新页面重试。');
                return false;
            }
            
            // 验证地图关键数据
            if (!this.map.pathCoords || this.map.pathCoords.length < 2) {
                console.error('[Game] 路径数据异常，使用兜底路径');
                // 创造一个简单路径
                this.map.pathCoords = [
                    gridToPixel(0, 0),
                    gridToPixel(1, 0),
                    gridToPixel(2, 0),
                    gridToPixel(2, 1),
                    gridToPixel(2, 2),
                ];
            }
            if (!this.map.spawnPoint || !this.map.corePos) {
                console.error('[Game] 出生点或核心缺失');
                this.map.spawnPoint = gridToPixel(0, 0);
                this.map.corePos = gridToPixel(this.map.cols - 1, this.map.rows - 1);
            }
            
            // 计算地图居中偏移
            this.offsetX = Math.floor((CONFIG.CANVAS_WIDTH - this.map.getWidth()) / 2);
            this.offsetY = Math.floor((CONFIG.CANVAS_HEIGHT - this.map.getHeight()) / 2);
            if (this.offsetX < 10) this.offsetX = 10;
            if (this.offsetY < 40) this.offsetY = 40;
            
            console.log('[Map] pathCoords:', this.map.pathCoords?.length, 'points, offset:', this.offsetX, this.offsetY);
            if (this.map.pathCoords && this.map.pathCoords.length > 0) {
                console.log('[Map] first:', this.map.pathCoords[0], 'last:', this.map.pathCoords[this.map.pathCoords.length-1]);
            }
            
            // 创建波次管理器
            this.waveManager = new WaveManager(levelData);
            
            // 更新UI面板
            this.ui.renderTowerPanel();
            this.ui.hideTowerInfo();
            this.ui.update();
            
            // 初始化抽塔
            if (typeof TOWER_GACHA !== 'undefined') {
                TOWER_GACHA.init(this);
                TOWER_GACHA.resetDrawCount();
            }
            
            return true;
        } catch (e) {
            console.error('[Game] loadLevel错误:', e);
            return false;
        }
    }
    
    start() {
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop(now = performance.now()) {
        // 安全门：如果全局game已指向不同的新实例，停止当前循环
        if (typeof game !== 'undefined' && game !== null && game !== this) {
            this.running = false;
            return;
        }
        if (!this.running) return;
        if (!this.canvas || !this.ctx) return;
        
        const dt = Math.min(Math.max((now - this.lastTime) / 1000, 0.001), 0.05) * this.gameSpeed;
        this.lastTime = now;
        
        if (!this.paused) {
            try { this.update(dt, Date.now()); } catch(e) { console.error('update error:', e); }
        }
        
        try { this.render(); } catch(e) { console.error('render error:', e); }
        
        if (this.running) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
    
    update(dt, now) {
        // 安全门：确保核心数组存在
        if (!this.enemies) this.enemies = [];
        if (!this.towers) this.towers = [];
        if (!this.projectiles) this.projectiles = [];
        if (!this.particles) this.particles = [];
        if (!this.floatingTexts) this.floatingTexts = [];
        if (!this.groundEffects) this.groundEffects = [];
        
        // 屏幕震动衰减
        if (this.screenShake > 0) {
            this.screenShake *= 0.85;
            if (this.screenShake < 0.3) this.screenShake = 0;
        }
        
        // 波次管理
        if (this.waveManager) {
            const spawnedEnemy = this.waveManager.update(now, this);
            if (spawnedEnemy) {
                this.enemies.push(spawnedEnemy);
                // 首次遇到该类型敌人时弹出生物图鉴卡片
                if (!this._seenEnemyTypes.has(spawnedEnemy.id)) {
                    this._seenEnemyTypes.add(spawnedEnemy.id);
                    this.showBestiaryPopup(spawnedEnemy.def);
                }
            }
            
            // 波次完成奖励（每次波次状态从运行变完成时触发）
            if (this.waveManager.isComplete && !this.waveManager.isRunning && this.enemies.length === 0 && !this._waveBonusGiven) {
                this._waveBonusGiven = true;
                const bonus = 5 + this.waveManager.currentWave * 2; // 每波递增奖励
                this.dewdrop += bonus;
                this.addFloatingText(this.map.corePos?.x || 300, (this.map.corePos?.y || 100) - 30, `波次完成! +${bonus}💧`, '#00e5ff');
                this.addFloatingText(this.map.corePos?.x || 300, (this.map.corePos?.y || 100), `${this.waveManager.currentWave}/${this.waveManager.totalWaves}`, '#a5d6a7');
                this.ui.update();
                if (typeof SFX !== 'undefined') SFX.waveComplete();
                // 自动暂停1.5秒后恢复正常
                this.paused = true;
                setTimeout(() => { if (this && this.canvas) this.paused = false; }, 1500);
            }
            
            // 检查胜负
            if (this.waveManager.isAllWavesComplete() && this.enemies.length === 0 && !this._gameEnded) {
                this.endGame(true);
            } else if (this.hp <= 0 && !this._gameEnded) {
                this.endGame(false);
            }
        }
        
        // 更新塔
        for (const tower of this.towers) {
            tower.buffMultiplier = { damage: 1, range: 1, fireRate: 1 }; // 重置buff
            tower.update(now, this.enemies, this.projectiles, this.map, this);
            tower.applyAura(this.towers, this.enemies, this);
        }
        
        // 增益植物效果（完整实现所有4种）
        for (const [key, plant] of Object.entries(this.map.bonusPlants)) {
            const [c, r] = key.split(',').map(Number);
            const pos = gridToPixel(c, r);
            const range = plant.range || 100;
            switch (plant.effect) {
                case 'speed_aura': // 向日葵加速光环
                    for (const t of this.towers) {
                        if (distance(pos.x, pos.y, t.x, t.y) <= range) {
                            t.buffMultiplier.fireRate *= (1 + plant.value);
                        }
                    }
                    break;
                case 'gen_dewdrop': // 晨露草产露珠
                    if (!plant._lastGenTime) plant._lastGenTime = now;
                    if (now - plant._lastGenTime >= (plant.genInterval || 10000)) {
                        this.dewdrop += (plant.genAmount || 2);
                        this.addFloatingText(pos.x, pos.y, `+${plant.genAmount||2}💧`, '#00e5ff');
                        plant._lastGenTime = now;
                    }
                    break;
                case 'heal_towers': // 疗愈草修复塔
                    if (!plant._lastHealTime) plant._lastHealTime = now;
                    if (now - plant._lastHealTime >= (plant.healInterval || 6000)) {
                        for (const t of this.towers) {
                            if (distance(pos.x, pos.y, t.x, t.y) <= range && t.damageTaken) {
                                t.damageTaken = Math.max(0, t.damageTaken - (plant.healAmount || 25));
                                this.addParticle(t.x, t.y, 'heal', '#76ff03');
                            }
                        }
                        plant._lastHealTime = now;
                    }
                    break;
                case 'crit_aura': // 蝶引花暴击光环
                    for (const t of this.towers) {
                        if (distance(pos.x, pos.y, t.x, t.y) <= range) {
                            t._critChance = (t._critChance || 0) + (plant.value || 0.15);
                            t.buffMultiplier.damage = Math.max(t.buffMultiplier.damage, 1);
                        }
                    }
                    break;
            }
        }
        
        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.map, this);
            
            if (!enemy.alive && !enemy.reachedEnd) {
                this.enemies.splice(i, 1);
                
                // 解锁观察笔记
                if (!this.unlockedNotes.has(enemy.id) && enemy.def.noteTitle) {
                    this.unlockedNotes.add(enemy.id);
                    const _this = this;
                    setTimeout(() => { if (_this.enemies) _this.showNote(enemy.def); }, 500 + Math.random()*2000);
                }
            } else if (enemy.reachedEnd) {
                this.enemies.splice(i, 1);
            }
        }
        
        // 更新投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.enemies, this);
            if (!proj.alive) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
        
        // 更新浮动文字
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (!this.floatingTexts[i].alive) {
                this.floatingTexts.splice(i, 1);
            }
        }
        
        // 地面效果更新
        for (let i = this.groundEffects.length - 1; i >= 0; i--) {
            const ge = this.groundEffects[i];
            if (Date.now() - ge.startTime > ge.duration) {
                this.groundEffects.splice(i, 1);
            } else {
                // 对经过的敌人施加减速
                for (const enemy of this.enemies) {
                    if (distance(ge.x, ge.y, enemy.x, enemy.y) <= ge.radius) {
                        if (ge.slow && Math.random() < 0.03) {
                            enemy.applyEffect('slow', 500, ge.slow * 0.5);
                        }
                    }
                }
            }
        }
        
        // UI更新
        this.ui.update();
        
        // 新手引导检查
        if (typeof checkTutorial === 'function') checkTutorial();
    }
    
    render() {
        if (!this.ctx || !this.map) return;
        if (!this.enemies) this.enemies = [];
        if (!this.towers) this.towers = [];
        if (!this.projectiles) this.projectiles = [];
        if (!this.particles) this.particles = [];
        
        const ctx = this.ctx;
        
        // 清屏
        ctx.fillStyle = '#071a07';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 应用屏幕震动
        let shakeX = 0, shakeY = 0;
        if (this.screenShake > 0) {
            shakeX = randomRange(-this.screenShake, this.screenShake);
            shakeY = randomRange(-this.screenShake, this.screenShake);
        }
        
        ctx.save();
        ctx.translate(shakeX, shakeY);
        
        // 绘制地图
        if (this.map) {
            this.map.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 调试：绘制路径线+点
        if (this.map && this.map.pathCoords && this.map.pathCoords.length > 1) {
            // 路径连线
            ctx.strokeStyle = 'rgba(255,200,0,0.25)';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const pc = this.map.pathCoords;
            ctx.moveTo(pc[0].x + this.offsetX, pc[0].y + this.offsetY);
            for (let i = 1; i < pc.length; i++) {
                ctx.lineTo(pc[i].x + this.offsetX, pc[i].y + this.offsetY);
            }
            ctx.stroke();
            // 路径点
            ctx.fillStyle = '#ffeb3b';
            for (const p of pc) {
                ctx.beginPath();
                ctx.arc(p.x + this.offsetX, p.y + this.offsetY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            // 起点(绿)和终点(红)
            ctx.fillStyle = '#4caf50';
            ctx.beginPath(); ctx.arc(pc[0].x + this.offsetX, pc[0].y + this.offsetY, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f44336';
            ctx.beginPath(); ctx.arc(pc[pc.length-1].x + this.offsetX, pc[pc.length-1].y + this.offsetY, 6, 0, Math.PI * 2); ctx.fill();
        }
        
        // 绘制地面效果
        for (const ge of this.groundEffects) {
            const alpha = clamp(1 - (Date.now() - ge.startTime) / ge.duration, 0.08, 0.35);
            ctx.fillStyle = hexToRgba(ge.color || '#3e2723', alpha);
            ctx.beginPath();
            ctx.arc(ge.x + this.offsetX, ge.y + this.offsetY, ge.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(ge.color || '#3e2723', alpha + 0.15);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // 绘制塔
        for (const tower of this.towers) {
            tower.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 绘制投射物
        for (const proj of this.projectiles) {
            proj.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 绘制粒子
        for (const particle of this.particles) {
            particle.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 绘制浮动文字
        for (const ft of this.floatingTexts) {
            ft.render(ctx, this.offsetX, this.offsetY);
        }
        
        // 绘制放置预览
        if (this.isPlacingMode && this.selectedTowerDef) {
            this.renderPlacementPreview(ctx);
        }
        
        ctx.restore();
        
        // 绘制选中范围圈（最上层）
        if (this.selectedTower) {
            // 已由tower.render处理
        }
    }
    
    renderPlacementPreview(ctx) {
        const grid = this.hoveredGrid;
        if (grid.col < 0 || grid.row < 0) return;
        
        const ts = CONFIG.TILE_SIZE;
        const x = grid.col * ts + this.offsetX;
        const y = grid.row * ts + this.offsetY;
        const def = this.selectedTowerDef;
        
        const canPlace = this.canPlaceTower(grid.col, grid.row, def);
        
        // 半透明预览
        ctx.globalAlpha = canPlace ? 0.45 : 0.25;
        
        // 范围预览
        ctx.fillStyle = canPlace ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)';
        ctx.beginPath();
        ctx.arc(x + ts/2, y + ts/2, def.range, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = canPlace ? 'rgba(76,175,80,0.5)' : 'rgba(244,67,54,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 格子高亮
        ctx.fillStyle = canPlace ? 'rgba(76,175,80,0.35)' : 'rgba(244,67,54,0.35)';
        ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
        
        // 塔图标预览 - 使用实际塔的SVG精灵替代emoji
        ctx.globalAlpha = canPlace ? 0.5 : 0.25;
        if (typeof SpriteManager !== 'undefined' && SpriteManager.get(def.id, 'towers')) {
            SpriteManager.draw(ctx, def.id, 'towers', x + ts/2, y + ts/2, ts * 0.85);
        } else {
            ctx.font = `${ts - 12}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, x + ts/2, y + ts/2);
        }
        
        ctx.globalAlpha = 1;
    }
    
    // ====== 核心操作方法 ======
    
    canPlaceTower(col, row, def) {
        // 检查边界
        if (col < 0 || row < 0 || col >= this.map.cols || row >= this.map.rows) return false;
        
        // 检查是否已有塔
        for (const t of this.towers) {
            if (t.col === col && t.row === row) return false;
        }
        
        // 水域检查
        if (def.requireWater && !this.map.isWater(col, row)) return false;
        
        // 地热检查
        if (def.requireGeothermal && !this.map.isGeothermal(col, row)) return false;
        
        // 可建造区域或水域/地热（特殊地形塔）
        if (def.requireWater || def.requireGeothermal) {
            return true;
        }
        
        // 普通塔只能在健康草地建造
        if (!this.map.isBuildable(col, row)) return false;
        
        // 资源检查
        if (this.chlorophyll < (def.cost.chlorophyll || 0)) return false;
        if (this.dewdrop < (def.cost.dewdrop || 0)) return false;
        
        return true;
    }
    
    placeTower(col, row, def) {
        if (!this.canPlaceTower(col, row, def)) return false;
        
        // 扣除资源
        this.chlorophyll -= (def.cost.chlorophyll || 0);
        this.dewdrop -= (def.cost.dewdrop || 0);
        this.totalChlorophyllSpent += (def.cost.chlorophyll || 0) + (def.cost.dewdrop || 0) * 2;
        
        // 创建塔
        const tower = new Tower(def, col, row);
        this.towers.push(tower);
        this.towersBuilt++;
        
        // 特殊：地热塔对周围造成轻微震动
        if (def.shakeDamage) {
            this.screenShake = 3;
        }
        
        // 粒子效果
        this.addParticle(tower.x, tower.y, 'hit', '#7cfc00');
        this.addParticle(tower.x, tower.y, 'hit', '#7cfc00');
        this.addFloatingText(tower.x, tower.y - 20, `${def.name} 建成!`, '#a5d6a7');
        
        // 解锁观察笔记
        if (!this.unlockedNotes.has(def.id) && def.noteTitle) {
            this.unlockedNotes.add(def.id);
            const _this = this;
            setTimeout(() => { if (_this.enemies) _this.showNote(def); }, 800);
        }
        
        this.ui.update();
        if (typeof SFX !== 'undefined') SFX.towerBuild();
        return true;
    }
    
    selectTowerForPlacement(def) {
        this.selectedTowerDef = def;
        this.isPlacingMode = true;
        this.selectedTower = null;
        this.ui.hideTowerInfo();
        // 保留面板可见，方便玩家切换塔型
    }
    
    cancelPlacement() {
        this.isPlacingMode = false;
        this.selectedTowerDef = null;
    }
    
    // 显示抽塔弹窗
    showGacha(result) {
        if (!result) return;
        const overlay = document.getElementById('gacha-overlay');
        const optionsEl = document.getElementById('gacha-options');
        if (!overlay || !optionsEl) return;
        
        optionsEl.innerHTML = '';
        result.options.forEach(def => {
            const card = document.createElement('div');
            card.className = 'gacha-card';
            const tagClass = 'tag-' + (def.category || 'plant');
            card.innerHTML = `
                <div class="gacha-icon">${def.icon}</div>
                <div class="gacha-name">${def.name}</div>
                <div class="gacha-desc">${def.desc ? def.desc.slice(0, 30) : ''}</div>
                <div class="gacha-tag ${tagClass}">${def.category}</div>
            `;
            card.addEventListener('click', () => {
                if (result.onSelect(def, this)) {
                    if (typeof SFX !== 'undefined') SFX.towerUpgrade();
                }
                overlay.classList.add('hidden');
                this.paused = false;
            });
            optionsEl.appendChild(card);
        });
        
        document.getElementById('gacha-info').textContent = 
            `抽取 ${result.index}/${TOWER_GACHA._maxDraws}`;
        overlay.classList.remove('hidden');
        this.paused = true;
    }
    
    upgradeTower(tower, path) {
        if (tower.level >= 5) return false;
        
        const upgCost = 15 + tower.level * 10;
        const effCost = 5 + tower.level * 5;
        
        if (this.chlorophyll < upgCost || this.dewdrop < effCost) return false;
        
        this.chlorophyll -= upgCost;
        this.dewdrop -= effCost;
        this.totalChlorophyllSpent += upgCost + effCost * 2;
        
        const oldLevel = tower.level;
        tower.upgrade(path);
        this.ui.renderTowerInfo(tower);
        
        // 粒子
        const upgColor = tower.upgradePath === 'eco' ? '#76ff03' : tower.upgradePath === 'eff' ? '#ffab00' : '#7cfc00';
        this.addParticle(tower.x, tower.y, 'aoe_burst', upgColor, tower.range * 0.6);
        this.addFloatingText(tower.x, tower.y - 30, `Lv${oldLevel}→${tower.level}`, upgColor);
        
        this.ui.update();
        return true;
    }
    
    sellTower(tower) {
        const sellValue = tower.getSellValue();
        this.chlorophyll += sellValue;
        this.towersSold++;
        
        // 移除塔
        this.removeTower(tower);
        
        // 出售不返还100%资源（体现循环理念）
        this.addFloatingText(tower.x, tower.y, `+${sellValue}🍃 出售`, '#ffc107');
        this.ui.hideTowerInfo();
        this.selectedTower = null;
        this.ui.update();
    }
    
    removeTower(tower) {
        const idx = this.towers.indexOf(tower);
        if (idx !== -1) {
            this.towers.splice(idx, 1);
            // 销毁时污染周围地块
            this.map.polluteAround(tower.col, tower.row, 1.2);
            this.addParticle(tower.x, tower.y, 'death', '#8bc34a');
            this.addParticle(tower.x, tower.y, 'death', '#558b2f');
        }
    }
    
    selectTowerAt(col, row) {
        this.cancelPlacement();
        this.selectedTower = null;
        
        for (const t of this.towers) {
            if (t.col === col && t.row === row) {
                this.selectedTower = t;
                t._selected = true;
                this.ui.renderTowerInfo(t);
                return t;
            }
        }
        
        this.ui.hideTowerInfo();
        return null;
    }
    
    deselectAllTowers() {
        for (const t of this.towers) t._selected = false;
        this.selectedTower = null;
        this.ui.hideTowerInfo();
    }
    
    // ====== 效果添加 ======
    
    addParticle(x, y, type, color, extra = 0) {
        this.particles.push(new Particle(x, y, type, color, extra));
    }
    
    addFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }
    
    addGroundEffect(effectData) {
        this.groundEffects.push(effectData);
    }
    
    // ====== 游戏流程控制 ======
    
    startNextWave() {
        if (!this.waveManager || this.waveManager.isRunning) return;
        
        const nextIndex = this.waveManager.currentWave;
        if (nextIndex >= this.waveManager.totalWaves) return;
        
        this._waveBonusGiven = false;
        this.waveManager.startWave(nextIndex);
        this.ui.update();
        if (typeof SFX !== 'undefined') SFX.waveStart();
    }
    
    togglePause() {
        this.paused = !this.paused;
        const overlay = document.getElementById('pause-overlay');
        overlay.classList.toggle('hidden', !this.paused);
        document.getElementById('btn-pause').textContent = this.paused ? '▶️' : '⏸️';
        
        // 暂停时更新面板中的游戏状态
        if (this.paused) {
            document.getElementById('pause-hp').textContent = this.hp;
            document.getElementById('pause-chlorophyll').textContent = this.chlorophyll;
            document.getElementById('pause-dewdrop').textContent = this.dewdrop;
            const wm = this.waveManager;
            document.getElementById('pause-wave').textContent = wm ? `${wm.currentWave}/${wm.totalWaves}` : '0/0';
        }
    }
    
    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        document.getElementById('btn-speed').textContent = this.gameSpeed + 'x';
    }
    
    endGame(victory) {
        this._gameEnded = true;
        
        // 计算统计数据
        const greenPercent = this.map.getGreenRatio();
        const totalEarned = this.totalChlorophyllEarned + this.towersBuilt * 30; // 估算总收入
        const recycleRate = totalEarned > 0 ? (this.totalKills * 8 / totalEarned) * 100 : 0;
        
        const stats = {
            hp: this.hp,
            greenPercent: greenPercent,
            recycleRate: clamp(recycleRate, 0, 100),
            kills: this.totalKills,
            towersBuilt: this.towersBuilt,
        };
        
        // 保存关卡进度 + 发放生态结晶
        if (victory) {
            saveLevelProgress(this.currentLevelIndex, stats);
            if (typeof TOWER_GACHA !== 'undefined') {
                const reward = TOWER_GACHA.calcLevelReward(this.currentLevelIndex, this._difficulty || 'normal', victory);
                TOWER_GACHA.addCrystals(reward);
                this.addFloatingText(this.map.corePos?.x || 300, (this.map.corePos?.y || 100) - 60, `+${reward}💎 生态结晶`, '#ce93d8');
            }
        }
        
        // 显示结算界面（延迟一点）
        const _this = this;
        setTimeout(() => {
            if (!_this.enemies) return;
            if (typeof SFX !== 'undefined') {
                victory ? SFX.victory() : SFX.gameOver();
            }
            _this.ui.showResult(victory, stats);
        }, 600);
    }
    
    // ====== 生物图鉴弹出卡片（右上角自动消失） ======
    showBestiaryPopup(def) {
        if (!this.enemies) return;
        if (!def || !def.name) return;
        
        const contentEl = document.getElementById('bestiary-popup-content');
        const popupEl = document.getElementById('bestiary-popup');
        if (!contentEl || !popupEl) return;
        
        // 构建标签
        let tags = [];
        if (def.isBoss) tags.push('<span class="beast-tag boss-tag">Boss</span>');
        if (def.isFlying) tags.push('<span class="beast-tag flying-tag">飞行</span>');
        if (def.type) tags.push(`<span class="beast-tag">${def.type}</span>`);
        
        const statsText = `HP:${def.hp} | 速度:${def.speed}` +
            (def.reward ? ` | 🍃${def.reward.chlorophyll||0} 💧${def.reward.dewdrop||0}` : '');
        
        contentEl.innerHTML = `
            <div class="beast-icon">${def.icon}</div>
            <div class="beast-info">
                <div class="beast-name">${def.name} ${tags.join(' ')}</div>
                <div class="beast-desc">${def.desc || ''}</div>
                <div class="beast-stats">${statsText}</div>
            </div>
        `;
        
        // 清除旧动画
        popupEl.style.animation = 'none';
        // 重新触发动画
        void popupEl.offsetHeight;
        popupEl.style.animation = '';
        popupEl.classList.remove('hidden');
        
        // 重置自动关闭定时器
        if (this._bestiaryTimer) {
            clearTimeout(this._bestiaryTimer);
            this._bestiaryTimer = null;
        }
        this._bestiaryTimer = setTimeout(() => {
            const el = document.getElementById('bestiary-popup');
            if (el && !el.classList.contains('hidden')) {
                el.style.animation = 'bestiarySlideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    el.classList.add('hidden');
                    el.style.animation = '';
                }, 300);
            }
        }, 3500);
    }
    
    showNote(data) {
        if (!this.enemies) return; // 游戏实例已销毁
        if (!data || !data.noteTitle) return;
        
        const popupEl = document.getElementById('note-popup');
        const titleEl = document.getElementById('note-title');
        const contentEl = document.getElementById('note-content');
        if (!popupEl || !titleEl || !contentEl) return;
        
        titleEl.textContent = data.noteTitle;
        contentEl.textContent = data.noteContent;
        
        // 清除旧动画
        const contentWrap = popupEl.querySelector('.note-card-content');
        if (contentWrap) {
            contentWrap.style.animation = 'none';
            void contentWrap.offsetHeight;
            contentWrap.style.animation = '';
        }
        popupEl.classList.remove('hidden');
        
        // 重置自动关闭定时器
        if (this._noteTimer) {
            clearTimeout(this._noteTimer);
            this._noteTimer = null;
        }
        this._noteTimer = setTimeout(() => {
            const el = document.getElementById('note-popup');
            if (el && !el.classList.contains('hidden')) {
                const cw = el.querySelector('.note-card-content');
                if (cw) {
                    cw.style.animation = 'bestiarySlideOut 0.3s ease-in forwards';
                    setTimeout(() => {
                        el.classList.add('hidden');
                        if (cw) cw.style.animation = '';
                    }, 300);
                } else {
                    el.classList.add('hidden');
                }
            }
        }, 5000);
    }

    // ====== 输入初始化（实际事件绑定在 main.js 中） ======
    initInput() {
        // 画布输入事件由 main.js 的 bindGameEvents() 统一绑定
        // 这里预留用于后续输入处理扩展
    }

    updateUI() {
        this.ui.update();
    }
    
    // ====== 技能系统 ======
    activateAbility(abilityId) {
        const ab = this.abilities[abilityId];
        if (!ab) return false;
        const now = Date.now();
        if (now - ab.lastUsed < ab.cooldown) return false; // 冷却中
        if (this.dewdrop < ab.cost) return false; // 资源不足
        
        this.dewdrop -= ab.cost;
        ab.lastUsed = now;
        
        switch (abilityId) {
            case 'purifyRain':
                // 全图枯萎地块净化进度+20%
                for (let r = 0; r < this.map.rows; r++) {
                    for (let c = 0; c < this.map.cols; c++) {
                        if (this.map.isWithered(c, r)) {
                            const key = `${c},${r}`;
                            const current = this.map.purifyProgress[key] || 0;
                            this.map.setPurifyProgress(c, r, Math.min(1, current + 0.2));
                        }
                    }
                }
                // 下雨粒子
                for (let i = 0; i < 20; i++) {
                    const rx = randomRange(0, this.map.getWidth());
                    const ry = randomRange(0, this.map.getHeight());
                    this.addParticle(rx, ry, 'rain', '#4fc3f7');
                }
                break;
            case 'rootSurge':
                // 所有植物塔攻速翻倍2秒
                for (const t of this.towers) {
                    if (t.def.category === 'plant') {
                        t.buffMultiplier.fireRate *= 2;
                        t._surgeEndTime = now + 2000;
                        this.addParticle(t.x, t.y, 'root', '#76ff03');
                    }
                }
                break;
            case 'thornWall':
                // 路径上所有敌人受到50伤害+5秒减速
                for (const enemy of this.enemies) {
                    if (enemy.alive) {
                        enemy.takeDamage(50, this);
                        enemy.applyEffect('slow', 5000, 0.6);
                        this.addParticle(enemy.x, enemy.y, 'root', '#795548');
                    }
                }
                break;
            case 'energyBurst':
                // 所有能源塔立即充能
                for (const t of this.towers) {
                    if (t.def.category === 'energy') {
                        t._charged = true;
                        t._chargeStartTime = Date.now() - t.def.chargeTime;
                        this.addParticle(t.x, t.y, 'crit', '#ffd54f');
                    }
                }
                break;
            case 'freezeAll':
                // 冻结所有敌人3秒
                for (const enemy of this.enemies) {
                    if (enemy.alive) {
                        enemy.applyEffect('stun', 3000);
                        this.addParticle(enemy.x, enemy.y, 'hit', '#80deea');
                    }
                }
                break;
        }
        
        this.updateUI();
        if (typeof SFX !== 'undefined') SFX.abilityUse();
        return true;
    }
    
    getAbilityCooldown(abilityId) {
        const ab = this.abilities[abilityId];
        if (!ab) return 0;
        const elapsed = Date.now() - ab.lastUsed;
        return Math.max(0, 1 - elapsed / ab.cooldown);
    }
}

// ====== 存档系统 ======
function saveLevelProgress(levelIndex, stats) {
    const key = 'greenline_level_' + levelIndex;
    try {
        const data = JSON.stringify({
            stars: stats.hp > 15 ? 3 : (stats.hp > 10 ? 2 : 1),
            bestHp: stats.hp,
            completedAt: Date.now()
        });
        localStorage.setItem(key, data);
    } catch(e) {}
}

function getLevelProgress(levelIndex) {
    const key = 'greenline_level_' + levelIndex;
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
}
