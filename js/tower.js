// ==================== 防御塔系统 ====================

class Tower {
    constructor(def, col, row) {
        this.def = def;
        this.col = col;
        this.row = row;
        
        // 位置（像素，格子中心）
        const pos = gridToPixel(col, row);
        this.x = pos.x;
        this.y = pos.y;
        
        // 属性
        this.level = 1;
        this.damage = def.damage;
        this.range = def.range;
        this.fireRate = def.fireRate; // ms per shot
        this.lastFireTime = 0;
        this.kills = 0;
        
        // 塔耐久度（怪物可以摧毁塔）
        this.maxHp = 100;
        this.hp = 100;
        this.damageTaken = 0; // 累积受伤
        
        // 升级状态
        this.upgradePath = null; // 'eco' | 'eff' | null
        this.upgradeLevel = 0;
        
        // 特殊状态
        this.target = null;
        this.angle = -Math.PI / 2; // 初始朝上
        
        // 净化相关
        this.isPurifier = ['fern_cannon', 'willow_sentry', 'lily_platform'].includes(def.id);
        this.purifyPower = this.isPurifier ? 0.008 : 0; // 每次攻击对相邻枯萎地块的净化量
        
        // 状态效果
        this.buffMultiplier = { damage: 1, range: 1, fireRate: 1 };
        
        // 动画
        this.animPhase = Math.random() * Math.PI * 2;
    }
    
    getSellValue() {
        let baseCost = (this.def.cost.chlorophyll || 0) + (this.def.cost.dewdrop || 0) * 2;
        if (this.upgradePath) {
            const upg = this.def.upgrades[this.upgradePath === 'eco' ? 0 : 1];
            baseCost += (upg.cost.chlorophyll || 0) + (upg.cost.dewdrop || 0) * 2;
        }
        return Math.floor(baseCost * 0.55);
    }
    
    // 多层升级系统（Lv1→Lv5，每次升级增强属性）
    upgrade(path) {
        if (this.level >= 5) return false; // 满级
        
        // 第3级时选择发展方向
        if (this.level === 3 && !this.upgradePath) {
            if (!path) return false; // 需要选择方向
            this.upgradePath = path;
        }
        
        this.level++;
        
        // 基础属性提升（每级+15%伤害、+8%范围、-8%攻速）
        this.damage = Math.floor(this.damage * 1.15);
        this.range = Math.floor(this.range * 1.08);
        this.fireRate = Math.max(200, Math.floor(this.fireRate * 0.92));
        
        // 升级特殊能力（第3级时应用）
        if (this.level === 3 && this.upgradePath && this.def.upgrades) {
            const idx = this.upgradePath === 'eco' ? 0 : 1;
            const upg = this.def.upgrades[idx];
            if (upg) {
                this.specialAbility = { ...upg, path: this.upgradePath };
                // 额外升级加成
                if (upg.damageMod) this.damage = Math.floor(this.damage * (upg.damageMod - 1) * 0.5 + this.damage);
                if (upg.rangeMod) this.range = Math.floor(this.range * (upg.rangeMod - 1) * 0.5 + this.range);
                if (upg.fireRateMod) this.fireRate = Math.floor(this.fireRate * (1 - (1 - upg.fireRateMod) * 0.5));
            }
        }
        
        // 升级回血
        this.hp = Math.min(this.maxHp, this.hp + 20);
        
        return true;
    }
    
    // 塔受到伤害
    takeDamage(amount) {
        this.damageTaken = (this.damageTaken || 0) + amount;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // 塔被摧毁
        }
        return false;
    }
    
    // 获取出售价格
    getSellValue() {
        let value = (this.def.cost.chlorophyll || 0) + (this.def.cost.dewdrop || 0) * 2;
        // 每级追加价值
        value += (this.level - 1) * 15;
        if (this.upgradePath) value += 30;
        return Math.floor(value * 0.5);
    }
    
    findTarget(enemies, gameMap) {
        if (!enemies || enemies.length === 0) {
            this.target = null;
            return null;
        }
        
        let best = null;
        let bestProgress = -1;
        let bestDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            
            // 超出范围跳过
            if (dist > this.range) continue;
            
            // 飞行优先判断（雨燕归巢）
            if (this.def.flyingPriority && enemy.isFlying) {
                if (!best || dist < bestDist) {
                    best = enemy;
                    bestDist = dist;
                }
                continue;
            }
            
            // 动物优先目标判断（偷猎机甲优先打动物塔的反向：动物塔优先打偷猎者）
            if (this.def.category === 'animal' && enemy.id === 'poacher_mech') {
                if (!best || enemy.pathIndex > bestProgress) {
                    best = enemy;
                    bestProgress = enemy.pathIndex;
                    bestDist = dist;
                }
                continue;
            }
            
            // 默认选择路径进度最远的敌人（最靠近核心的）
            if (enemy.pathIndex > bestProgress || (enemy.pathIndex === bestProgress && dist < bestDist)) {
                best = enemy;
                bestProgress = enemy.pathIndex;
                bestDist = dist;
            }
        }
        
        this.target = best;
        return best;
    }
    
    update(now, enemies, projectiles, gameMap, game) {
        // 更新动画相位
        this.animPhase += 0.03;
        
        // 太阳能充能机制
        if (this.def.chargeTime) {
            if (!this._chargeStartTime) this._chargeStartTime = now;
            if (!this._charged && now - this._chargeStartTime >= this.def.chargeTime) {
                this._charged = true;
                this._chargeStartTime = now;
                game.addFloatingText(this.x, this.y - 20, '⚡充能!', '#ffd54f');
            }
        }
        
        // 藻类净化塔：不攻击，被动吸附枯萎地块
        if (this.def.noAttack) {
            this._updateAlgae(game, gameMap);
            return;
        }
        
        // 引力陷阱：持续范围效果
        if (this.def.gravityPull) {
            this._updateGravity(enemies, game);
            // 仍然射击
        }
        
        // 找目标
        const target = this.findTarget(enemies, gameMap);
        if (!target) return;
        
        // 计算角度
        this.angle = angleBetween(this.x, this.y, target.x, target.y);
        
        // 射击冷却检查
        const effectiveFireRate = this.fireRate / this.buffMultiplier.fireRate;
        if (now - this.lastFireTime < effectiveFireRate) return;
        
        // 发射投射物并造成伤害
        this.fire(target, now, projectiles, gameMap, game);
        
        // 直接对目标造成伤害
        if (target && target.alive) {
            let dmg = this.damage * this.buffMultiplier.damage;
            if (this.def.vsOilMult && target.type === 'oil') dmg *= this.def.vsOilMult;
            if (this.def.vsPlasticMult && target.type === 'plastic') dmg *= this.def.vsPlasticMult;
            if (this.def.vsTrashMult && target.type === 'trash') dmg *= this.def.vsTrashMult;
            if (target.physResist) dmg *= (1 - target.physResist);
            // 水域增伤(电鳗)
            if (this.def.vsWaterBonus && gameMap.isWater(this.col, this.row)) dmg *= this.def.vsWaterBonus;
            
            const killed = target.takeDamage(Math.round(dmg), game);
            game.addFloatingText(target.x, target.y - target.radius - 10, String(Math.round(dmg)), '#fff');
            game.addParticle(target.x, target.y, 'hit', this.def.projectileColor || '#fff');
            if (killed) {
                this.kills++;
                if (typeof SFX !== 'undefined') SFX.enemyDeath();
            } else {
                if (typeof SFX !== 'undefined') SFX.enemyHurt();
            }
            
            // 特殊效果
            if (this.def.slowAmount > 0) target.applyEffect('slow', this.def.slowDuration, this.def.slowAmount);
            if (this.def.rootChance && chance(this.def.rootChance)) target.applyEffect('root', this.def.rootDuration || 2000);
            if (this.def.poisonDamage > 0) target.applyEffect('poison', this.def.poisonDuration || 3000, this.def.poisonDamage);
            if (this.def.burnDamage > 0) target.applyEffect('burn', this.def.burnDuration || 3000, this.def.burnDamage);
            if (this.def.stealResource && chance(this.def.stealChance || 0.2)) {
                const amt = randomInt(1, 3); game.chlorophyll += amt;
                game.addFloatingText(target.x, target.y - 25, `+${amt}🍃`, '#76ff03');
            }
            
            // 电鳗：连锁闪电
            if (this.def.chainLightning && game.enemies) {
                const chainCount = this.specialAbility?.chainCount || this.def.chainCount || 3;
                const falloff = this.specialAbility?.chainFalloff || this.def.chainFalloff || 0.6;
                let lastTarget = target;
                let chainDmg = dmg * falloff;
                for (let c = 1; c < chainCount; c++) {
                    let nearest = null;
                    let nearestDist = 80; // 连锁范围
                    for (const e of game.enemies) {
                        if (e === lastTarget || !e.alive) continue;
                        const d = distance(lastTarget.x, lastTarget.y, e.x, e.y);
                        if (d < nearestDist) { nearest = e; nearestDist = d; }
                    }
                    if (!nearest) break;
                    const cKilled = nearest.takeDamage(Math.round(chainDmg), game);
                    game.addParticle(nearest.x, nearest.y, 'hit', '#00e5ff');
                    // 眩晕
                    if (this.specialAbility?.stunOnChain && chance(0.5)) nearest.applyEffect('stun', this.specialAbility.stunDuration || 800);
                    if (cKilled) this.kills++;
                    lastTarget = nearest;
                    chainDmg *= falloff;
                }
            }
            
            // 霜冻射线：叠加冰冻
            if (this.def.frostStack) {
                const maxStacks = this.specialAbility?.maxFrostStacks || this.def.maxFrostStacks || 3;
                target._frostStacks = (target._frostStacks || 0) + 1;
                if (target._frostStacks >= maxStacks) {
                    target.applyEffect('stun', this.specialAbility?.frostFreezeDuration || this.def.frostFreezeDuration || 2000);
                    target._frostStacks = 0;
                    game.addParticle(target.x, target.y, 'hit', '#80deea');
                    // 冰冻碎裂伤害
                    if (this.specialAbility?.frostExplode || this.def.frostExplode) {
                        const explodeDmg = this.specialAbility?.explodeDamage || this.def.explodeDamage || 40;
                        target.takeDamage(explodeDmg, game);
                        game.addParticle(target.x, target.y, 'aoe_burst', '#80deea', 40);
                    }
                }
            }
        }
    }
    
    fire(target, now, projectiles, gameMap, game) {
        const effectiveDamage = this.damage * this.buffMultiplier.damage;
        
        // 多重射击
        const shotCount = this.specialAbility?.multiShot || this.def.multiShot || 1;
        const spreadAngle = this.specialAbility?.spreadAngle || (shotCount > 1 ? 15 : 0);
        
        // 立即造成伤害（直接命中，不依赖投射物碰撞）
        for (let i = 0; i < shotCount; i++) {
            let angle = this.angle;
            if (shotCount > 1) {
                angle += degToRad(-spreadAngle/2 + (spreadAngle / (shotCount-1)) * i);
            }
            
            // 伤害修正
            let dmg = effectiveDamage;
            
            // 特攻加成
            if (this.def.vsOilMult && target.type === 'oil') dmg *= this.def.vsOilMult;
            if (this.def.vsPlasticMult && target.type === 'plastic') dmg *= this.def.vsPlasticMult;
            if (this.def.vsTrashMult && target.type === 'trash') dmg *= this.def.vsTrashMult;
            
            // 物理抗性减免
            if (target.physResist) {
                dmg *= (1 - target.physResist);
            }
            
            // 夜间加成
            if (this.def.nightBonus) {
                dmg *= this.def.nightBonus; // 假设始终夜间简化处理，或可由game.timeOfDay控制
            }
            
            // 高地加成
            if (this.def.highlandBonus && gameMap.getType(this.col, this.row) !== 3) {
                // 简化：非水域位置给加成
                // 可扩展为高地格检测
            }
            
            // 暴击（蝶引花光环或塔自带暴击）
            const critRate = (this._critChance || 0) + (this.def.critChance || 0);
            if (critRate > 0 && chance(critRate)) {
                dmg *= (this.def.critMultiplier || 1.5);
                this._critThisShot = true;
            } else {
                this._critThisShot = false;
            }
            
            // 充能倍率（太阳能矩阵）
            if (this._charged) {
                dmg *= this.def.chargeMultiplier || 2;
                this._charged = false;
                this._chargedShot = true;
            } else {
                this._chargedShot = false;
            }
            
            // 立即造成伤害（由update中的直接伤害代码处理）
            // 这里不再调用_applyDirectDamage，避免双重伤害
            
            const proj = new Projectile(
                this.x, this.y, angle,
                this.def.projectileSpeed,
                dmg,
                this.def.projectileColor,
                this.def.projectileSize || 5,
                {
                    slowAmount: this.def.slowAmount,
                    slowDuration: this.def.slowDuration,
                    aoeRadius: this.def.aoeRadius || this.specialAbility?.aoeRadius || 0,
                    effect: this.def.effect,
                    pierce: this.specialAbility?.pierce || 0,
                    burnDamage: this.specialAbility?.burnDamage || this.def.burnDamage,
                    burnDuration: this.specialAbility?.burnDuration || this.def.burnDuration,
                    toxicDot: this.specialAbility?.toxicDot || this.def.toxicDot,
                    toxicSlow: this.specialAbility?.toxicSlow || this.def.toxicSlow,
                    poisonDamage: this.specialAbility?.poisonDamage || this.def.poisonDamage,
                    poisonDuration: this.specialAbility?.poisonDuration || this.def.poisonDuration,
                    rootChance: this.def.rootChance || this.specialAbility?.rootChance || 0,
                    rootDuration: this.def.rootDuration || this.specialAbility?.rootDuration || 0,
                    towerId: this,
                    pushForce: this.def.pushForce || 0,
                    pushChance: this.def.pushChance || 0,
                }
            );
            projectiles.push(proj);
        }
        
        this.lastFireTime = now;
        
        // 净化相邻枯萎地块
        if (this.isPurifier) {
            const withered = gameMap.getAdjacentWithered(this.col, this.row);
            for (const w of withered) {
                gameMap.setPurifyProgress(w.col, w.row, 
                    gameMap.getPurifyProgress(w.col, w.row) + this.purifyPower);
            }
        }
        
        // 地热裂隙震动伤害
        if (this.def.shakeDamage) {
            // 对周围地块造成轻微"污染"效果（简化为不实现负面，只做视觉提示）
        }
        
        // 升级特殊能力触发
        if (this.specialAbility) {
            this.triggerSpecialAbility(target, gameMap, game);
        }
    }
    
    // 藻类被动净化
    _updateAlgae(game, gameMap) {
        if (!game || !gameMap) return;
        const now = Date.now();
        if (!this._algaeTimer) this._algaeTimer = now;
        if (now - this._algaeTimer < (this.fireRate || 3000)) return;
        this._algaeTimer = now;
        
        // 吸附周围枯萎地块
        const range = this.specialAbility?.purifyRange || this.def.purifyRange || 80;
        const rate = this.specialAbility?.purifyRate || this.def.purifyRate || 0.05;
        const reward = this.specialAbility?.purifyReward || this.def.purifyReward || 3;
        let purified = 0;
        
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nc = this.col + dc, nr = this.row + dr;
                if (gameMap.isWithered(nc, nr)) {
                    const progress = gameMap.getPurifyProgress(nc, nr);
                    if (progress < 1) {
                        gameMap.setPurifyProgress(nc, nr, Math.min(1, progress + rate));
                        purified++;
                    }
                }
            }
        }
        if (purified > 0) {
            const earn = purified * reward;
            game.chlorophyll += earn;
            game.addFloatingText(this.x, this.y - 15, `+${earn}🍃`, '#76ff03');
            game.addParticle(this.x, this.y, 'heal', '#4caf50');
        }
    }
    
    // 引力陷阱
    _updateGravity(enemies, game) {
        if (!enemies || !game) return;
        const now = Date.now();
        if (!this._gravityTimer) this._gravityTimer = now;
        
        // 周期伤害
        if (now - this._gravityTimer >= (this.def.dotInterval || 500)) {
            this._gravityTimer = now;
            const dmg = this.def.dotDamage || 8;
            const radius = this.specialAbility?.gravityRadius || this.def.gravityRadius || 100;
            for (const e of enemies) {
                if (!e.alive) continue;
                if (distance(this.x, this.y, e.x, e.y) <= radius) {
                    e.takeDamage(dmg, game);
                    game.addParticle(e.x, e.y, 'hit', '#7c4dff');
                }
            }
        }
        
        // 引力拉扯
        const pullStr = this.specialAbility?.pullStrength || this.def.pullStrength || 8;
        const radius = this.specialAbility?.gravityRadius || this.def.gravityRadius || 100;
        for (const e of enemies) {
            if (!e.alive || e.isFlying || e.rooted) continue;
            const d = distance(this.x, this.y, e.x, e.y);
            if (d > 0 && d <= radius) {
                const dx = (this.x - e.x) / d * pullStr;
                const dy = (this.y - e.y) / d * pullStr;
                e.x += dx * 0.1;
                e.y += dy * 0.1;
            }
        }
    }
    
    // 直接伤害（不依赖投射物碰撞，解决子弹穿模问题）
    _applyDirectDamage(target, dmg, game) {
        if (!target || !target.alive) return;
        if (target._hitThisFrame >= (this._lastFireTime || 0)) return; // 同帧防重复
        target._hitThisFrame = this._lastFireTime || Date.now();
        const killed = target.takeDamage(dmg, game);
        // 显示伤害数字
        let txt = Math.floor(dmg).toString();
        let color = '#fff';
        if (this._critThisShot) { txt += '!'; color = '#ffeb3b'; }
        if (this._chargedShot) { txt += '⚡'; color = '#ffd54f'; }
        game.addFloatingText(target.x + randomRange(-8,8), target.y - target.radius - 12, txt, color);
        game.addParticle(target.x, target.y, 'hit', this.def.projectileColor || '#fff');
        if (this._critThisShot) game.addParticle(target.x, target.y - target.radius, 'crit', '#ffeb3b');
        
        // 应用效果
        if (this.def.slowAmount > 0) target.applyEffect('slow', this.def.slowDuration, this.def.slowAmount);
        if (chance(this.def.rootChance || 0)) target.applyEffect('root', this.def.rootDuration);
        if (this.def.burnDamage > 0) target.applyEffect('burn', this.def.burnDuration, this.def.burnDamage);
        if (this.def.poisonDamage > 0) target.applyEffect('poison', this.def.poisonDuration, this.def.poisonDamage);
        
        // 雨燕偷资源
        if (this.def.stealResource && chance(this.def.stealChance || 0.2)) {
            const amt = randomInt(1, 3);
            game.chlorophyll += amt;
            game.addFloatingText(target.x, target.y - 25, `+${amt}🍃`, '#76ff03');
        }
        if (killed) this.kills++;
    }
    
    triggerSpecialAbility(target, gameMap, game) {
        const sa = this.specialAbility;
        if (!game || !game.enemies) return;
        
        // 召唤树根缠绕
        if (sa.special === 'summon_roots' && chance(0.12)) {
            const rootRange = sa.rootRange || 80;
            for (const enemy of game.enemies) {
                if (distance(this.x, this.y, enemy.x, enemy.y) <= rootRange && !enemy.isRooted) {
                    enemy.applyEffect('root', sa.rootDuration);
                    game.addParticle(enemy.x, enemy.y, 'root', '#4a7c42');
                    break; // 只缠绕一个
                }
            }
        }
        
        // 击退
        if (sa.knockbackForce && chance(sa.stunChance || 0)) {
            // 通过projectile的pushForce已处理
        }
    }
    
    // ====== 塔的2D矢量模型渲染 ======
    render(ctx, offsetX = 0, offsetY = 0) {
        const cx = this.x + offsetX;
        const cy = this.y + offsetY;
        const ts = CONFIG.TILE_SIZE;
        const r = ts * 0.38; // 塔半径
        const floatY = 1.5 * Math.sin(this.animPhase);
        const catColors = {
            plant: ['#4caf50', '#2e7d32', '#81c784', '#a5d6a7'],
            energy: ['#ffd54f', '#f9a825', '#ffecb3', '#fff176'],
            animal: ['#ce93d8', '#8e24aa', '#e1bee7', '#ab47bc'],
            industrial: ['#ff8a65', '#e64a19', '#ffab91', '#ff7043']
        };
        const cc = catColors[this.def.category] || catColors.plant;
        
        // ---- 地基阴影 ----
        const shadowGrad = ctx.createRadialGradient(cx, cy + ts * 0.22, r * 0.1, cx, cy + ts * 0.28, r * 1.05);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + ts * 0.24, r * 0.95, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ---- 攻击范围（选中时） ----
        if (this._selected) {
            ctx.strokeStyle = hexToRgba(cc[0], 0.22);
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.arc(cx, cy, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // 内部填充
            ctx.fillStyle = hexToRgba(cc[0], 0.04);
            ctx.fill();
        }
        
        // ---- 升级光环 ----
        if (this.upgradePath) {
            const glowColor = this.upgradePath === 'eco' ? '#76ff03' : '#ffab00';
            const pulseA = 0.25 + 0.12 * Math.sin(this.animPhase * 2);
            const pulseR = r + 3 + 2.5 * Math.sin(this.animPhase * 1.7);
            // 外环
            ctx.strokeStyle = hexToRgba(glowColor, pulseA);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            // 旋转粒子点
            for (let i = 0; i < 3; i++) {
                const dotAngle = this.animPhase * 0.8 + i * Math.PI * 2 / 3;
                const dx = cx + Math.cos(dotAngle) * pulseR;
                const dy = cy + Math.sin(dotAngle) * pulseR;
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // ---- 分类型绘制塔主体 ----
        ctx.save();
        const drawId = (this.specialAbility?.drawAsId) || this.def.id;
        TowerRenderer.draw(ctx, cx, cy + floatY, r, ts, this.angle, this.animPhase, cc, drawId, this.def, this.specialAbility, this.upgradePath);
        ctx.restore();
        
        // ---- 等级标识 ----
        if (this.upgradePath) {
            const starX = cx + r * 0.85;
            const starY = cy - r * 0.9;
            const starColor = this.upgradePath === 'eco' ? '#76ff03' : '#ffab00';
            ctx.fillStyle = starColor;
            ctx.shadowColor = starColor;
            ctx.shadowBlur = 6;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', starX, starY);
            ctx.shadowBlur = 0;
        }
    }

    // 光环效果（每帧调用）
    applyAura(towers, enemies, game) {
        if (!this.specialAbility) return;
        const sa = this.specialAbility;
        const auraRange = (sa.auraRange || sa.healRange || sa.honeyRange || sa.networkRange || 100);
        
        switch (sa.auraType) {
            case 'speed_aura':
                for (const t of towers) {
                    if (t !== this && distance(this.x, this.y, t.x, t.y) <= auraRange) {
                        t.buffMultiplier.fireRate = Math.max(t.buffMultiplier.fireRate, 1 + sa.speedBonus);
                    }
                }
                break;
            case 'heal_around':
                // 在tower update中按interval执行
                break;
            case 'generate_dewdrop':
                // 定时产生资源
                if (!this._lastGenTime) this._lastGenTime = Date.now();
                if (Date.now() - this._lastGenTime >= (sa.genInterval || 8000)) {
                    game.dewdrop += (sa.dewdropGenAmount || 1);
                    game.updateUI();
                    this._lastGenTime = Date.now();
                    game.addFloatingText(this.x, this.y, `+${sa.dewdropGenAmount}💧`, '#00e5ff');
                }
                break;
        }
    }
}

// ==================== 塔渲染器：2D矢量模型 ====================
const TowerRenderer = {
    
    // 绘制圆形基台
    _base(ctx, x, y, r, fill, stroke) {
        // 外环
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 内圈
        ctx.fillStyle = hexToRgba(fill, 0.4);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 炮管
    _barrel(ctx, x, y, angle, r, color, length, width) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.strokeStyle = hexToRgba('#000', 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        const bl = length || r * 0.75;
        const bw = width || r * 0.15;
        ctx.roundRect(r * 0.25, -bw, bl, bw * 2, bw * 0.6);
        ctx.fill();
        ctx.stroke();
        // 炮口发光
        const tipGrad = ctx.createLinearGradient(r * 0.25 + bl, 0, r * 0.25 + bl + 4, 0);
        tipGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
        tipGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.arc(r * 0.25 + bl, 0, bw * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    // ====== 植物系 ======
    
    fern_cannon(ctx, x, y, r, ts, angle, phase, cc) {
        // 木质底座 - 树桩造型
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.7, y + r * 0.1, r * 1.4, r * 0.55, r * 0.2);
        ctx.fill();
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y + r * 0.05, r * 1.1, r * 0.45, r * 0.15);
        ctx.fill();
        // 蕨叶 - 大叶片
        const leafLen = r * 1.1;
        for (let i = 0; i < 4; i++) {
            const la = (i / 4) * Math.PI * 2 + phase * 0.3;
            ctx.fillStyle = i % 2 === 0 ? '#43a047' : '#66bb6a';
            ctx.beginPath();
            ctx.save();
            ctx.translate(x, y - r * 0.25);
            ctx.rotate(la);
            ctx.ellipse(0, -leafLen * 0.55, r * 0.2, leafLen * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            // 叶脉
            ctx.strokeStyle = hexToRgba('#1b5e20', 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -leafLen * 0.95);
            ctx.stroke();
            ctx.restore();
        }
        // 中心水炮
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.15, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 水滴高光
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.25, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        // 炮管
        TowerRenderer._barrel(ctx, x, y - r * 0.15, angle, r, '#64b5f6', r * 0.55, r * 0.12);
    },
    
    lily_platform(ctx, x, y, r, ts, angle, phase, cc) {
        // 水面波纹
        ctx.strokeStyle = hexToRgba('#42a5f5', 0.35);
        ctx.lineWidth = 1.5;
        for (let i = 2; i >= 0; i--) {
            ctx.beginPath();
            ctx.arc(x, y + r * 0.1, r * (0.7 + i * 0.15) + Math.sin(phase * 1.5 + i) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 睡莲叶
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        const notch = 0.35;
        ctx.moveTo(x, y - r * 0.1);
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
            const rr = r * 0.75 * (0.9 + 0.1 * Math.sin(a * 6));
            const px = x + Math.cos(a) * rr;
            const py = y + Math.sin(a) * rr * 0.55;
            if (a < Math.PI * notch || a > Math.PI * (2 - notch)) {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 莲花
        const petalLen = r * 0.4;
        for (let i = 0; i < 5; i++) {
            const pa = (i / 5) * Math.PI * 2 + phase * 0.2;
            ctx.fillStyle = i % 2 === 0 ? '#f8bbd0' : '#f48fb1';
            ctx.save();
            ctx.translate(x, y - r * 0.3);
            ctx.rotate(pa);
            ctx.beginPath();
            ctx.ellipse(0, -petalLen * 0.5, r * 0.12, petalLen * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // 花蕊（炮口）
        ctx.fillStyle = '#fdd835';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        TowerRenderer._barrel(ctx, x, y - r * 0.25, angle, r, '#ffeb3b', r * 0.4, r * 0.08);
    },
    
    willow_sentry(ctx, x, y, r, ts, angle, phase, cc) {
        // 树干
        const trunkGrad = ctx.createLinearGradient(x - r * 0.2, 0, x + r * 0.2, 0);
        trunkGrad.addColorStop(0, '#5d4037');
        trunkGrad.addColorStop(0.5, '#795548');
        trunkGrad.addColorStop(1, '#5d4037');
        ctx.fillStyle = trunkGrad;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.22, y - r * 0.6, r * 0.44, r * 1.2, r * 0.1);
        ctx.fill();
        // 树冠 - 柳条
        for (let i = 0; i < 6; i++) {
            const wa = (i / 6) * Math.PI * 2 + phase * 0.2;
            const wx = x + Math.cos(wa) * r * 0.25;
            const wy = y - r * 0.65;
            ctx.strokeStyle = i % 2 === 0 ? '#66bb6a' : '#4caf50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            const cx1 = wx + Math.cos(wa) * r * 0.7;
            const cy1 = wy - r * 0.2 + Math.sin(phase * 1.3 + i) * 3;
            const cx2 = wx + Math.cos(wa) * r * 0.5;
            const cy2 = wy - r * 0.5;
            ctx.quadraticCurveTo(cx1, cy1, cx2, cy2);
            ctx.stroke();
            // 柳叶
            ctx.fillStyle = '#a5d6a7';
            ctx.beginPath();
            ctx.ellipse(cx2, cy2, r * 0.15, r * 0.08, wa, 0, Math.PI * 2);
            ctx.fill();
        }
        // 哨塔顶
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.35, y - r * 0.8, r * 0.7, r * 0.3, r * 0.12);
        ctx.fill();
        TowerRenderer._barrel(ctx, x, y - r * 0.65, angle, r, '#aed581', r * 0.5, r * 0.1);
    },
    
    // ====== 能源系 ======
    
    wind_vortex(ctx, x, y, r, ts, angle, phase, cc) {
        // 金属基座
        const baseGrad = ctx.createLinearGradient(x, y - r * 0.3, x, y + r * 0.5);
        baseGrad.addColorStop(0, '#78909c');
        baseGrad.addColorStop(1, '#455a64');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.7, y + r * 0.05, r * 1.4, r * 0.45, r * 0.15);
        ctx.fill();
        // 能量线圈
        for (let i = 0; i < 3; i++) {
            const coilY = y - r * 0.4 + i * r * 0.3;
            ctx.strokeStyle = hexToRgba('#4fc3f7', 0.6 + i * 0.15);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(x, coilY, r * 0.4, r * 0.15, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 涡轮叶片
        const bladeLen = r * 0.85;
        for (let i = 0; i < 3; i++) {
            const ba = (i / 3) * Math.PI * 2 + phase * 2;
            ctx.fillStyle = hexToRgba('#b0bec5', 0.8);
            ctx.save();
            ctx.translate(x, y - r * 0.55);
            ctx.rotate(ba);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(bladeLen * 0.5, -r * 0.15, bladeLen, 0);
            ctx.quadraticCurveTo(bladeLen * 0.5, r * 0.08, 0, 0);
            ctx.fill();
            ctx.restore();
        }
        // 中心轴
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.55, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.55, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
    },
    
    solar_matrix(ctx, x, y, r, ts, angle, phase, cc) {
        // 支架
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.4);
        ctx.lineTo(x, y - r * 0.1);
        ctx.lineTo(x + r * 0.5, y + r * 0.4);
        ctx.closePath();
        ctx.fill();
        // 太阳能板主体
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.75, y - r * 0.7, r * 1.5, r * 0.9, r * 0.08);
        ctx.fill();
        // 网格线
        ctx.strokeStyle = '#1e88e5';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const gy = y - r * 0.7 + i * r * 0.3;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.7, gy);
            ctx.lineTo(x + r * 0.7, gy);
            ctx.stroke();
        }
        for (let i = 1; i < 5; i++) {
            const gx = x - r * 0.75 + i * r * 0.375;
            ctx.beginPath();
            ctx.moveTo(gx, y - r * 0.65);
            ctx.lineTo(gx, y + r * 0.15);
            ctx.stroke();
        }
        // 聚光效果
        const glowGrad = ctx.createRadialGradient(x, y - r * 0.25, 0, x, y - r * 0.25, r * 0.6);
        glowGrad.addColorStop(0, hexToRgba('#ffd54f', 0.7));
        glowGrad.addColorStop(0.5, hexToRgba('#ffd54f', 0.2));
        glowGrad.addColorStop(1, 'rgba(255,213,79,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.25, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
    },
    
    geothermal_fissure(ctx, x, y, r, ts, angle, phase, cc) {
        // 岩石底座
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        const rockCount = 7;
        for (let i = 0; i < rockCount; i++) {
            const ra = (i / rockCount) * Math.PI * 2;
            const rr = r * 0.75 * (0.8 + 0.2 * Math.sin(i * 2.5));
            const rx = x + Math.cos(ra) * rr;
            const ry = y + Math.sin(ra) * rr * 0.5 + r * 0.15;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 裂缝
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.1, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        // 岩浆发光
        const lavaGrad = ctx.createRadialGradient(x, y - r * 0.08, r * 0.05, x, y, r * 0.5);
        lavaGrad.addColorStop(0, '#ff5722');
        lavaGrad.addColorStop(0.3, '#ff6e40');
        lavaGrad.addColorStop(0.6, hexToRgba('#ff3d00', 0.4));
        lavaGrad.addColorStop(1, 'rgba(255,61,0,0)');
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // 脉动
        const pulseA = 0.5 + 0.3 * Math.sin(phase * 3);
        ctx.fillStyle = hexToRgba('#ffab00', pulseA);
        ctx.beginPath();
        ctx.arc(x, y - r * 0.05, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        TowerRenderer._barrel(ctx, x, y - r * 0.1, angle, r, '#ff8a65', r * 0.45, r * 0.11);
    },
    
    // ====== 动物系 ======
    
    bee_thrower(ctx, x, y, r, ts, angle, phase, cc) {
        // 蜂巢底座
        const hexR = r * 0.65;
        ctx.fillStyle = '#e65100';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const ha = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const hx = x + Math.cos(ha) * hexR;
            const hy = y + Math.sin(ha) * hexR;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#bf360c';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 蜂巢纹理
        ctx.strokeStyle = hexToRgba('#ff8f00', 0.4);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - hexR + i * hexR * 0.65, y + hexR * 0.4);
            ctx.lineTo(x - hexR * 0.4 + i * hexR * 0.65, y - hexR * 0.4);
            ctx.stroke();
        }
        // 蜜蜂（射击口）
        const beeX = x + Math.cos(angle) * r * 0.5;
        const beeY = y + Math.sin(angle) * r * 0.5;
        ctx.fillStyle = '#ffa000';
        ctx.beginPath();
        ctx.ellipse(beeX, beeY, r * 0.15, r * 0.1, angle, 0, Math.PI * 2);
        ctx.fill();
        // 翅膀
        ctx.fillStyle = hexToRgba('#e3f2fd', 0.6);
        ctx.beginPath();
        ctx.ellipse(beeX - r * 0.05, beeY - r * 0.08, r * 0.1, r * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();
    },
    
    swift_return(ctx, x, y, r, ts, angle, phase, cc) {
        // 巢穴平台
        ctx.fillStyle = '#795548';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.05, r * 0.6, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 树枝编织纹理
        ctx.strokeStyle = hexToRgba('#a1887f', 0.5);
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const bx = x - r * 0.5 + i * r * 0.25;
            ctx.beginPath();
            ctx.moveTo(bx, y - r * 0.05 + Math.sin(i) * 5);
            ctx.quadraticCurveTo(bx, y + r * 0.25, bx + r * 0.3, y + r * 0.1);
            ctx.stroke();
        }
        // 雨燕鸟影
        const birdPhase = phase * 1.5;
        const birdX = x + Math.cos(angle) * r * 0.55;
        const birdY = y - r * 0.2 + Math.sin(birdPhase) * r * 0.3;
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(birdX + r * 0.25, birdY);
        ctx.quadraticCurveTo(birdX + r * 0.05, birdY - r * 0.2, birdX - r * 0.25, birdY);
        ctx.quadraticCurveTo(birdX + r * 0.05, birdY + r * 0.15, birdX + r * 0.25, birdY);
        ctx.fill();
        // 白胸
        ctx.fillStyle = '#efebe9';
        ctx.beginPath();
        ctx.ellipse(birdX - r * 0.02, birdY - r * 0.02, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    glow_mushroom(ctx, x, y, r, ts, angle, phase, cc) {
        // 菌柄
        const stemGrad = ctx.createLinearGradient(x - r * 0.15, 0, x + r * 0.15, 0);
        stemGrad.addColorStop(0, '#d7ccc8');
        stemGrad.addColorStop(0.5, '#efebe9');
        stemGrad.addColorStop(1, '#bcaaa4');
        ctx.fillStyle = stemGrad;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.15, y + r * 0.15, r * 0.3, r * 0.55, r * 0.05);
        ctx.fill();
        // 菌盖
        const capGrad = ctx.createRadialGradient(x, y - r * 0.35, r * 0.1, x, y - r * 0.15, r * 0.6);
        capGrad.addColorStop(0, '#ce93d8');
        capGrad.addColorStop(0.6, '#8e24aa');
        capGrad.addColorStop(1, '#6a1b9a');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.25, r * 0.6, r * 0.35, 0, Math.PI, Math.PI * 2);
        ctx.ellipse(x, y - r * 0.25, r * 0.6, r * 0.1, 0, 0, Math.PI);
        ctx.fill();
        // 菌斑
        for (let i = 0; i < 4; i++) {
            const sx = x + Math.cos(i * 1.7) * r * 0.3;
            const sy = y - r * 0.35 + Math.sin(i * 1.3) * r * 0.15;
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.arc(sx, sy, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        // 发光孢子
        const sporeGlow = ctx.createRadialGradient(x, y - r * 0.3, 0, x, y - r * 0.3, r * 0.55);
        sporeGlow.addColorStop(0, hexToRgba('#e1bee7', 0.5));
        sporeGlow.addColorStop(1, 'rgba(225,190,231,0)');
        ctx.fillStyle = sporeGlow;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 工业系 ======
    
    plastic_melter(ctx, x, y, r, ts, angle, phase, cc) {
        // 熔炉主体
        const bodyGrad = ctx.createLinearGradient(x, y - r * 0.5, x, y + r * 0.3);
        bodyGrad.addColorStop(0, '#546e7a');
        bodyGrad.addColorStop(0.4, '#455a64');
        bodyGrad.addColorStop(1, '#37474f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y - r * 0.5, r * 1.1, r * 1.0, r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 观察窗
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.05, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bf360c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 火焰
        const flameGrad = ctx.createRadialGradient(x, y - r * 0.05, 0, x, y - r * 0.05, r * 0.3);
        flameGrad.addColorStop(0, '#ffeb3b');
        flameGrad.addColorStop(0.4, '#ff9800');
        flameGrad.addColorStop(1, 'rgba(255,87,34,0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.05, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 排气管
        ctx.fillStyle = '#607d8b';
        ctx.fillRect(x + r * 0.45, y - r * 0.45, r * 0.18, r * 0.55);
        // 烟
        for (let i = 0; i < 2; i++) {
            const sy = y - r * 0.6 - i * r * 0.25 + Math.sin(phase * 2 + i) * 3;
            ctx.fillStyle = hexToRgba('#bdbdbd', 0.3 - i * 0.1);
            ctx.beginPath();
            ctx.arc(x + r * 0.54, sy, r * 0.08 + i * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        TowerRenderer._barrel(ctx, x, y - r * 0.2, angle, r, '#ff7043', r * 0.5, r * 0.11);
    },
    
    compost_fermentor(ctx, x, y, r, ts, angle, phase, cc) {
        // 发酵罐主体
        const tankGrad = ctx.createLinearGradient(x - r * 0.5, 0, x + r * 0.5, 0);
        tankGrad.addColorStop(0, '#795548');
        tankGrad.addColorStop(0.3, '#8d6e63');
        tankGrad.addColorStop(0.7, '#6d4c41');
        tankGrad.addColorStop(1, '#5d4037');
        ctx.fillStyle = tankGrad;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.45, y - r * 0.5, r * 0.9, r * 1.0, r * 0.15);
        ctx.fill();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 玻璃观察管
        ctx.fillStyle = hexToRgba('#b2dfdb', 0.3);
        ctx.beginPath();
        ctx.roundRect(x - r * 0.12, y - r * 0.3, r * 0.24, r * 0.5, r * 0.04);
        ctx.fill();
        ctx.strokeStyle = hexToRgba('#fff', 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
        // 发酵液位
        const liquidH = 0.3 + 0.15 * Math.sin(phase * 0.5);
        ctx.fillStyle = hexToRgba('#76ff03', 0.5);
        ctx.beginPath();
        ctx.roundRect(x - r * 0.1, y + r * 0.1 - liquidH * r, r * 0.2, liquidH * r, r * 0.03);
        ctx.fill();
        // 气泡
        for (let i = 0; i < 3; i++) {
            const bx = x - r * 0.05 + Math.sin(phase * 2 + i * 2) * r * 0.07;
            const by = y - r * 0.2 + ((phase * 0.6 + i * 1.2) % 2) * r * 0.3;
            ctx.fillStyle = hexToRgba('#b9f6ca', 0.4);
            ctx.beginPath();
            ctx.arc(bx, by, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
        // 管道
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(x + r * 0.25, y - r * 0.45, r * 0.2, r * 0.15);
        TowerRenderer._barrel(ctx, x, y - r * 0.3, angle, r, '#aed581', r * 0.4, r * 0.1);
    },
    
    // ====== 全新塔型：电鳗发射台 ======
    electric_eel(ctx, x, y, r, ts, angle, phase, cc) {
        // 水底座
        ctx.fillStyle = hexToRgba('#1565c0', 0.3);
        ctx.beginPath();
        ctx.arc(x, y + r * 0.15, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 电鳗身体（S形曲线）
        ctx.strokeStyle = '#1a237e';
        ctx.lineWidth = r * 0.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const eelPhase = phase * 0.8;
        ctx.moveTo(x - r * 0.35, y + r * 0.2);
        ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.15, x, y - r * 0.25);
        ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.35, x + r * 0.35, y - r * 0.5);
        ctx.stroke();
        // 电光
        ctx.strokeStyle = hexToRgba('#00e5ff', 0.6);
        ctx.lineWidth = r * 0.08;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.15);
        ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.1, x, y - r * 0.15);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.2, x + r * 0.3, y - r * 0.4);
        ctx.stroke();
        // 闪电弧
        const sparkAlpha = 0.3 + 0.2 * Math.sin(phase * 2);
        ctx.strokeStyle = hexToRgba('#76ff03', sparkAlpha);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const sa = angle + (i - 1) * 0.3;
            ctx.beginPath();
            ctx.moveTo(x + r * 0.4, y - r * 0.4);
            ctx.lineTo(x + r * 0.6 + Math.cos(sa) * r * 0.3, y - r * 0.4 + Math.sin(sa) * r * 0.3);
            ctx.stroke();
        }
        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.4, r * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a237e';
        ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.4, r * 0.04, 0, Math.PI * 2); ctx.fill();
    },
    
    // ====== 藻类净化塔 ======
    algae_purifier(ctx, x, y, r, ts, angle, phase, cc) {
        // 透明水珠造型
        ctx.fillStyle = hexToRgba('#a5d6a7', 0.25);
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // 内部藻类
        for (let i = 0; i < 5; i++) {
            const ax = x + Math.cos(phase * 0.5 + i * 1.3) * r * 0.25;
            const ay = y + Math.sin(phase * 0.7 + i * 1.7) * r * 0.2;
            ctx.fillStyle = hexToRgba('#4caf50', 0.6);
            ctx.beginPath();
            ctx.arc(ax, ay, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        // 气泡上升
        for (let i = 0; i < 3; i++) {
            const bx = x + Math.sin(phase * 1.5 + i * 2) * r * 0.3;
            const by = y + r * 0.3 - ((phase * 0.8 + i * 1.5) % 2) * r * 0.3;
            ctx.fillStyle = hexToRgba('#e3f2fd', 0.5);
            ctx.beginPath();
            ctx.arc(bx, by, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
        // 顶盖
        ctx.fillStyle = '#43a047';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.3, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 引力陷阱 ======
    gravity_trap(ctx, x, y, r, ts, angle, phase, cc) {
        // 核心球
        const gravGrad = ctx.createRadialGradient(x, y, 2, x, y, r * 0.5);
        gravGrad.addColorStop(0, '#7c4dff');
        gravGrad.addColorStop(0.4, '#536dfe');
        gravGrad.addColorStop(1, '#1a237e');
        ctx.fillStyle = gravGrad;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.05, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 光环
        const ringA = 0.3 + 0.15 * Math.sin(phase * 2);
        ctx.strokeStyle = hexToRgba('#7c4dff', ringA);
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.arc(x, y + r * 0.05, r * (0.5 + i * 0.15) + Math.sin(phase + i) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 吸引线
        ctx.strokeStyle = hexToRgba('#7c4dff', 0.15);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const la = (i / 4) * Math.PI * 2 + phase * 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y + r * 0.05);
            ctx.lineTo(x + Math.cos(la) * r * 1.0, y + r * 0.05 + Math.sin(la) * r * 0.5);
            ctx.stroke();
        }
    },
    
    // ====== 霜冻射线 ======
    frost_emitter(ctx, x, y, r, ts, angle, phase, cc) {
        // 冰晶底座
        ctx.fillStyle = '#e3f2fd';
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.4);
        ctx.lineTo(x - r * 0.4, y + r * 0.1);
        ctx.lineTo(x - r * 0.25, y - r * 0.25);
        ctx.lineTo(x, y - r * 0.1);
        ctx.lineTo(x + r * 0.25, y - r * 0.25);
        ctx.lineTo(x + r * 0.4, y + r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 冰晶核心
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.05, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 发射棱镜
        ctx.fillStyle = '#81d4fa';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.5);
        ctx.lineTo(x - r * 0.12, y - r * 0.2);
        ctx.lineTo(x + r * 0.12, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        // 射线
        const beamAlpha = 0.25 + 0.15 * Math.sin(phase * 4);
        ctx.strokeStyle = hexToRgba('#80deea', beamAlpha);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.35);
        ctx.lineTo(x + Math.cos(angle) * r * 1.2, y - r * 0.35 + Math.sin(angle) * r * 1.2);
        ctx.stroke();
    },
    
    // ====== 分发入口（SVG Sprite + 炮管） ======
    
    // 有炮管的塔
    _hasBarrel: new Set([
        'fern_cannon', 'willow_sentry', 'geothermal_fissure',
        'frost_emitter', 'plastic_melter', 'compost_fermentor',
        'bee_thrower', 'swift_return'
    ]),
    
    draw(ctx, x, y, r, ts, angle, phase, catColors, id, def, sa, upgradePath) {
        // 升级后的特殊绘制
        if (sa && sa.drawAsId) id = sa.drawAsId;
        
        // 绘制精灵主体（详细模型）
        const spriteSize = ts * 1.1;
        if (typeof SpriteManager !== 'undefined' && SpriteManager.get(id, 'towers')) {
            SpriteManager.draw(ctx, id, 'towers', x, y + r * 0.05, spriteSize);
        } else {
            // fallback: 基台+分类色圆
            const baseColor = catColors[3];
            const baseStroke = catColors[1];
            ctx.fillStyle = baseColor;
            ctx.strokeStyle = baseStroke;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + r * 0.05, r * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = hexToRgba(baseColor, 0.4);
            ctx.beginPath();
            ctx.arc(x, y + r * 0.05, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = catColors[0];
            ctx.beginPath();
            ctx.arc(x, y + r * 0.05, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 炮管（对有炮管的塔添加旋转动画）
        if (this._hasBarrel.has(id) && def && def.damage > 0) {
            const barrelColor = catColors[4] || '#78909c';
            this._barrel(ctx, x, y + r * 0.05, angle, r * 0.8, barrelColor, r * 0.55, r * 0.12);
        }
        
        // 升级后的额外装饰
        if (upgradePath) {
            const edgeColor = upgradePath === 'eco' ? '#76ff03' : '#ffab00';
            ctx.strokeStyle = hexToRgba(edgeColor, 0.3);
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
};
