// ==================== 敌人系统 ====================

class Enemy {
    constructor(def, pathCoords) {
        this.def = def;
        this.id = def.id;
        this.name = def.name;
        this.icon = def.icon;
        
        // 属性
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.baseSpeed = def.speed;
        this.speed = def.speed;
        this.reward = { ...def.reward };
        this.color = def.color;
        this.radius = def.radius || 14;
        this.type = def.type || 'normal';
        this.isFlying = !!def.isFlying;
        this.isBoss = !!def.isBoss;
        this.isFragment = !!def.isFragment;
        this.physResist = def.physResist || 0;
        
        // 位置与路径（安全门）
        this.pathCoords = pathCoords || [];
        this.pathIndex = 0;
        if (this.pathCoords.length > 0) {
            this.x = this.pathCoords[0].x;
            this.y = this.pathCoords[0].y;
        } else {
            this.x = 0;
            this.y = 0;
            this.alive = false; // 无效路径，不生成
            this.reachedEnd = false;
            return;
        }
        
        // 状态
        this.alive = true;
        this.reachedEnd = false;
        this.slowTimer = 0;       // 减速剩余时间
        this.slowAmount = 0;      // 减速比例
        this.rooted = false;      // 定身
        this.rootTimer = 0;       // 定身剩余
        this.poisonTimer = 0;     // 中毒
        this.poisonDamage = 0;    // 中毒伤害
        this.burnTimer = 0;       // 灼烧
        this.burnDamage = 0;      // 灼烧伤害
        this.stunned = false;     // 眩晕
        this.stunTimer = 0;
        this.blinded = false;     // 致盲（被灰雾影响塔，这里用于视觉效果）
        
        // 动画
        this.animPhase = Math.random() * Math.PI * 2;
        this.wobble = 0;
        this.hitFlash = 0;        // 受击闪白
        
        // 死亡效果标记
        this.deathEffectsApplied = false;
    }
    
    applyEffect(effectType, duration, amount = 0) {
        switch (effectType) {
            case 'slow':
                if (amount > (this.slowAmount || 0)) {
                    this.slowAmount = amount;
                    this.slowTimer = duration;
                }
                break;
            case 'root':
                this.rooted = true;
                this.rootTimer = duration;
                break;
            case 'poison':
                this.poisonTimer = duration;
                this.poisonDamage = Math.max(this.poisonDamage, amount);
                break;
            case 'burn':
                this.burnTimer = duration;
                this.burnDamage = Math.max(this.burnDamage, amount);
                break;
            case 'stun':
                this.stunned = true;
                this.stunTimer = duration;
                break;
            case 'push': {
                    const angle = angleBetween(
                        // push source would need to be passed - simplified
                        this.pathCoords[Math.max(0, this.pathIndex-3)]?.x || this.x,
                        this.pathCoords[Math.max(0, this.pathIndex-3)]?.y || this.y,
                        this.x, this.y
                    );
                    const pushed = moveAlongAngle(this.x, this.y, angle + Math.PI, amount);
                    this.x = pushed.x;
                    this.y = pushed.y;
                }
                break;
        }
    }
    
    takeDamage(amount, game) {
        if (!this.alive) return false;
        this.hp -= amount;
        this.hitFlash = 8; // 受击闪烁帧数
        
        if (this.hp <= 0) {
            this.die(game);
            return true;
        }
        return false;
    }
    
    die(game) {
        this.alive = false;
        
        if (this.deathEffectsApplied) return;
        this.deathEffectsApplied = true;
        
        if (!game) return;
        
        // 给予奖励资源
        game.chlorophyll += (this.reward.chlorophyll || 0);
        game.dewdrop += (this.reward.dewdrop || 0);
        game.totalKills++;
        if (game.addFloatingText) {
            game.addFloatingText(this.x, this.y, `+${this.reward.chlorophyll||0}🍃`, '#76ff03');
            if (this.reward.dewdrop > 0) {
                game.addFloatingText(this.x, this.y + 16, `+${this.reward.dewdrop}💧`, '#00e5ff');
            }
        }
        
        // 分裂机制（塑料缝合兽/微生物群）
        if ((this.def.ability === 'split' || this.def.ability === 'micro_split') && this.def.splitEnemy && game.enemies) {
            for (let i = 0; i < (this.def.splitCount || 3); i++) {
                const splitDef = ENEMY_DEFS[this.def.splitEnemy];
                if (splitDef) {
                    const splitEnemy = new Enemy(splitDef, this.pathCoords);
                    splitEnemy.pathIndex = this.pathIndex;
                    splitEnemy.x = this.x + randomRange(-15, 15);
                    splitEnemy.y = this.y + randomRange(-15, 15);
                    splitEnemy.hp = splitDef.hp; // 满血分裂体
                    game.enemies.push(splitEnemy);
                }
            }
            // 分裂粒子效果
            for (let i = 0; i < 8; i++) {
                game.addParticle(this.x, this.y, 'debris', this.color);
            }
        }
        
        // 死亡地面效果（油污爬行者留油渍）
        if (this.def.deathEffect === 'oil_puddle') {
            game.addGroundEffect({
                type: 'oil_puddle',
                x: this.x,
                y: this.y,
                radius: this.def.oilPuddleRadius || 40,
                slow: this.def.oilPuddleSlow || 0.3,
                duration: this.def.oilPuddleDuration || 5000,
                startTime: Date.now(),
                color: '#3e2723',
            });
        }
        
        // 死亡粒子
        for (let i = 0; i < 5; i++) {
            game.addParticle(this.x, this.y, 'death', this.color);
        }
    }
    
    update(dt, gameMap, game) {
        if (!this.alive) return;
        if (!game) return;
        
        // 确保dt有效且有路径
        if (!dt || dt <= 0) dt = 0.016;
        if (!this.pathCoords || this.pathCoords.length < 2) return;
        
        // 更新动画相位
        this.animPhase += 0.06;
        this.wobble = Math.sin(this.animPhase) * 2;
        if (this.hitFlash > 0) this.hitFlash--;
        
        // 状态效果计时
        const now = Date.now();
        
        // 减速
        if (this.slowTimer > 0) {
            this.slowTimer -= dt * 1000;
            if (this.slowTimer <= 0) { this.slowTimer = 0; this.slowAmount = 0; }
        }
        
        // 定身
        if (this.rooted && this.rootTimer > 0) {
            this.rootTimer -= dt * 1000;
            if (this.rootTimer <= 0) { this.rooted = false; this.rootTimer = 0; }
        }
        
        // 中毒DoT
        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt * 1000;
            if (this.poisonTimer > 0 && this.poisonTimer % 500 < dt*1000 + 50) {
                this.takeDamage(this.poisonDamage * 0.1, game); // 小额持续伤害
            }
        }
        
        // 灼烧DoT
        if (this.burnTimer > 0) {
            this.burnTimer -= dt * 1000;
            if (this.burnTimer > 0 && this.burnTimer % 500 < dt*1000 + 50) {
                this.takeDamage(this.burnDamage * 0.12, game);
            }
        }
        
        // 眩晕
        if (this.stunned && this.stunTimer > 0) {
            this.stunTimer -= dt * 1000;
            if (this.stunTimer <= 0) { this.stunned = false; this.stunTimer = 0; }
        }
        
        // 移动逻辑
        if (this.rooted || this.stunned) return;
        
        // 计算当前速度（考虑减速）
        let currentSpeed = this.baseSpeed;
        if (this.slowAmount > 0) currentSpeed *= (1 - this.slowAmount);
        
        // 沿路径移动
        if (this.pathIndex < this.pathCoords.length) {
            const target = this.pathCoords[this.pathIndex];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < currentSpeed * dt * 60) {
                this.pathIndex++;
                if (this.pathIndex >= this.pathCoords.length) {
                    // 到达终点
                    this.reachedEnd = true;
                    this.alive = false;
                    game.hp--;
                    game.addFloatingText(game.map.corePos.x, game.map.corePos.y, `-1❤️`, '#f44336');
                    
                    // 核心受击震动效果
                    game.screenShake = 8;
                    
                    // 再次污染周围地块
                    if (gameMap.coreGrid) {
                        gameMap.polluteAround(gameMap.coreGrid.col, gameMap.coreGrid.row, 1.5);
                    }
                    return;
                }
            } else {
                // 正常移动
                const moveX = (dx / dist) * currentSpeed * dt * 60;
                const moveY = (dy / dist) * currentSpeed * dt * 60;
                this.x += moveX;
                this.y += moveY;
                
                // 地面污染能力（油污爬行者）
                if (this.def.ability === 'pollute_ground') {
                    const grid = pixelToGrid(this.x, this.y);
                    if (chance(0.01)) { // 低概率污染经过的相邻地块
                        gameMap.polluteAround(grid.col, grid.row, 0.8);
                    }
                }
            }
        }
        
        // 敌人自身能力触发
        this.triggerAbility(game);
    }
    
    triggerAbility(game) {
        if (!game || !game.towers || !game.enemies) return;
        
        // 灰雾致盲（改为每30帧检查一次，避免帧帧触发）
        if (this.def.ability === 'blind' && (this._blindFrame = (this._blindFrame || 0) + 1) % 30 === 0) {
            if (chance(0.5)) {
                for (const tower of game.towers) {
                    if (distance(this.x, this.y, tower.x, tower.y) <= (this.def.blindRadius || 60)) {
                        if (chance(this.def.blindChance || 0.15)) {
                            tower._missNextShot = true;
                        }
                    }
                }
            }
        }
        
        // 酸雨AOE腐蚀
        if (this.def.ability === 'acid_aoe') {
            const acidRadius = this.def.acidRadius || 50;
            for (const tower of game.towers) {
                if (distance(this.x, this.y, tower.x, tower.y) <= acidRadius) {
                    // 降低塔"耐久"，简化为不实现塔HP系统，仅做视觉提示
                }
            }
        }
        
        // 攻击塔（砍伐者巨魔）
        if (this.def.ability === 'attack_towers' && !this._lastAttackTime) {
            this._lastAttackTime = 0;
        }
        if (this.def.ability === 'attack_towers') {
            const atkRange = this.def.attackRange || 40;
            let targetTower = null;
            let closestDist = Infinity;
            
            for (const tower of game.towers) {
                const d = distance(this.x, this.y, tower.x, tower.y);
                if (d <= atkRange && d < closestDist) {
                    if (!this.def.targetPlantTowers || tower.def.category === 'plant') {
                        closestDist = d;
                        targetTower = tower;
                    }
                }
            }
            
            if (targetTower && Date.now() - (this._lastAttackTime || 0) > 1500) {
                // 对塔造成伤害（使用塔的HP系统）
                const dmg = this.def.attackDamage || 20;
                const destroyed = targetTower.takeDamage(dmg);
                game.addFloatingText(targetTower.x, targetTower.y - 15, `💥 -${dmg}`, '#ff9800');
                if (destroyed) {
                    game.removeTower(targetTower);
                    game.map.polluteAround(targetTower.col, targetTower.row, 1.5);
                    game.addParticle(targetTower.x, targetTower.y, 'death', '#ff5722');
                    game.addFloatingText(targetTower.x, targetTower.y - 30, '💥 塔被摧毁!', '#f44336');
                }
                this._lastAttackTime = Date.now();
            }
            
            // 如果有目标塔，停止移动攻击它
            if (targetTower) {
                const tAngle = angleBetween(this.x, this.y, targetTower.x, targetTower.y);
                this.x += Math.cos(tAngle) * 0.3;
                this.y += Math.sin(tAngle) * 0.3;
            }
        }
        
        // 辐射（核废料蠕虫）
        if (this.def.ability === 'radiation') {
            const radRadius = this.def.radiationRadius || 90;
            for (const enemy of game.enemies) {
                if (enemy !== this && distance(this.x, this.y, enemy.x, enemy.y) <= radRadius) {
                    // 辐射对敌人也有伤害（包括友方？不，只影响敌人）
                }
            }
            // 对范围内塔造成持续辐射伤害（通过game处理）
        }
        
        // 锈蚀光环（电子垃圾傀儡）- 降低攻速并持续伤害
        if (this.def.ability === 'rust_aura') {
            const now = Date.now();
            if (!this._rustTick) this._rustTick = now;
            if (now - this._rustTick > 1000) { // 每秒造成伤害
                this._rustTick = now;
                for (const tower of game.towers) {
                    if (distance(this.x, this.y, tower.x, tower.y) <= (this.def.rustRadius || 70)) {
                        // 降低塔攻速
                        tower.buffMultiplier.fireRate *= (1 - (this.def.rustSlow || 0.1));
                        // 持续伤害（每2秒5点）
                        const dmg = this.def.rustDamage || 5;
                        const destroyed = tower.takeDamage(dmg);
                        game.addParticle(tower.x, tower.y, 'poison', '#4e342e');
                        if (destroyed) {
                            game.removeTower(tower);
                            game.map.polluteAround(tower.col, tower.row, 1.5);
                            game.addFloatingText(tower.x, tower.y - 30, '💥 塔被腐蚀!', '#f44336');
                        }
                    }
                }
            }
        }
        
        // 毒雾轨迹（烟霾巨蟒）
        if (this.def.ability === 'toxic_trail') {
            if (!this._trailTimer) this._trailTimer = 0;
            if (Date.now() - this._trailTimer > (this.def.trailInterval || 500)) {
                this._trailTimer = Date.now();
                // 对周围敌人造成伤害
                const trailRadius = 30;
                for (const e of game.enemies) {
                    if (e !== this && distance(this.x, this.y, e.x, e.y) <= trailRadius) {
                        e.takeDamage(this.def.trailDamage || 3, game);
                    }
                }
                // 减速周围敌人
                for (const e of game.enemies) {
                    if (e !== this && distance(this.x, this.y, e.x, e.y) <= trailRadius) {
                        e.applyEffect('slow', 500, this.def.trailSlow || 0.3);
                    }
                }
                game.addParticle(this.x, this.y, 'poison', '#616161');
            }
        }
        
        // 微生物分裂
        if (this.def.ability === 'micro_split' && this.alive && !this._splitApplied) {
            // split handled in die()
        }
    }
    
    // ====== 敌人的2D矢量模型渲染 ======
    render(ctx, offsetX = 0, offsetY = 0) {
        if (!this.alive && !this.reachedEnd) return;
        
        const cx = this.x + offsetX;
        const cy = this.y + offsetY;
        const r = this.radius;
        const anim = this.animPhase;
        
        ctx.save();
        
        // ---- 阴影 ----
        if (!this.isFlying) {
            const shadowGrad = ctx.createRadialGradient(cx, cy + r * 0.65, r * 0.1, cx, cy + r * 0.7, r * 0.9);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy + r * 0.68, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ---- 受击闪白 ----
        if (this.hitFlash > 0) {
            ctx.globalAlpha = 1;
        }
        
        // ---- Boss 外发光 ----
        if (this.isBoss) {
            const bossGlow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.6);
            bossGlow.addColorStop(0, hexToRgba('#ff1744', 0.35));
            bossGlow.addColorStop(0.5, hexToRgba('#d50000', 0.1));
            bossGlow.addColorStop(1, 'rgba(213,0,0,0)');
            ctx.fillStyle = bossGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ---- 分类型绘制敌人主体 ----
        EnemyRenderer.draw(ctx, cx, cy, r, anim, this);
        
        ctx.restore();
        
        // ---- 血条 ----
        this._renderHealthBar(ctx, cx, cy, r);
        
        // ---- 状态图标 ----
        this._renderStatusIcons(ctx, cx, cy, r);
    }
    
    _renderHealthBar(ctx, cx, cy, r) {
        const hpBarWidth = r * 2.4;
        const hpBarHeight = this.isBoss ? 6 : 4;
        const hpBarX = cx - hpBarWidth / 2;
        const hpBarY = cy - r - 12;
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        
        // 背景
        ctx.fillStyle = 'rgba(20,20,20,0.8)';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2);
        ctx.fill();
        ctx.stroke();
        
        // 血量
        if (hpRatio > 0) {
            const hpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarWidth, 0);
            if (hpRatio > 0.6) {
                hpGrad.addColorStop(0, '#66bb6a');
                hpGrad.addColorStop(1, '#43a047');
            } else if (hpRatio > 0.3) {
                hpGrad.addColorStop(0, '#ffa726');
                hpGrad.addColorStop(1, '#ef6c00');
            } else {
                hpGrad.addColorStop(0, '#ef5350');
                hpGrad.addColorStop(1, '#c62828');
            }
            ctx.fillStyle = hpGrad;
            ctx.beginPath();
            ctx.roundRect(hpBarX + 1, hpBarY + 1, (hpBarWidth - 2) * hpRatio, hpBarHeight - 2, 1.5);
            ctx.fill();
        }
    }
    
    _renderStatusIcons(ctx, cx, cy, r) {
        let sy = cy - r - 22;
        const bs = 7; // badge size
        
        const statuses = [];
        if (this.rooted) statuses.push({ type: 'root', col: '#795548' });
        if (this.slowAmount > 0) statuses.push({ type: 'slow', col: '#4fc3f7' });
        if (this.poisonTimer > 0) statuses.push({ type: 'poison', col: '#ce93d8' });
        if (this.burnTimer > 0) statuses.push({ type: 'burn', col: '#ff5722' });
        
        for (const s of statuses) {
            // 背景圆角
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.strokeStyle = hexToRgba(s.col, 0.5);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cx - bs, sy - bs, bs * 2, bs * 2, 3);
            ctx.fill();
            ctx.stroke();
            // 矢量图标
            StatusIconRenderer.draw(ctx, cx, sy, bs * 0.65, s.type, s.col);
            sy -= bs * 2 + 3;
        }
    }
}

// ==================== 敌人渲染器：2D矢量模型 ====================
const EnemyRenderer = {
    
    draw(ctx, cx, cy, r, anim, enemy) {
        // 受击闪白处理
        const isFlashing = enemy.hitFlash > 0;
        
        // 使用Sprite绘制
        const spriteSize = r * 3.5;
        if (typeof SpriteManager !== 'undefined' && SpriteManager.get(enemy.id, 'enemies')) {
            SpriteManager.draw(ctx, enemy.id, 'enemies', cx, cy, spriteSize);
        } else {
            // fallback: 基础圆形
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 受击闪白叠加层
        if (isFlashing) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    
    // ====== 灰雾团 ======
    fog_cloud(ctx, cx, cy, r, anim, e) {
        // 半透明雾气主体
        const fogColor = e.hitFlash > 0 ? '#fff' : '#b0bec5';
        ctx.fillStyle = hexToRgba(fogColor, 0.5);
        ctx.beginPath();
        // 不规则云团
        const bumps = 7;
        for (let i = 0; i < bumps; i++) {
            const ba = (i / bumps) * Math.PI * 2 + anim * 0.4;
            const br = r * (0.7 + 0.3 * Math.sin(i * 2.5 + anim));
            const bx = cx + Math.cos(ba) * br;
            const by = cy + Math.sin(ba) * br * 0.7;
            if (i === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hexToRgba('#cfd8dc', 0.3);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 雾眼
        ctx.fillStyle = hexToRgba('#37474f', 0.7);
        ctx.beginPath();
        ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.2, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 0.13, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.18, cy - r * 0.13, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 油污爬行者 ======
    oil_crawler(ctx, cx, cy, r, anim, e) {
        const wobble = Math.sin(anim) * 1.5;
        // 油污主体
        const oilGrad = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.05, cx, cy, r);
        oilGrad.addColorStop(0, '#4e342e');
        oilGrad.addColorStop(0.7, '#3e2723');
        oilGrad.addColorStop(1, '#1b0000');
        ctx.fillStyle = oilGrad;
        ctx.beginPath();
        // 不规则油滴
        for (let i = 0; i < 8; i++) {
            const ba = (i / 8) * Math.PI * 2;
            const br = r * (0.8 + 0.2 * Math.sin(i * 3));
            const px = cx + Math.cos(ba) * br;
            const py = cy + Math.sin(ba) * br * 0.75 + wobble;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        // 油光反射
        ctx.fillStyle = hexToRgba('#6d4c41', 0.4);
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.15, cy - r * 0.3, r * 0.25, r * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 触须
        for (let i = 0; i < 3; i++) {
            const ta = (i / 3) * Math.PI - Math.PI / 2;
            const tx = cx + Math.cos(ta) * r * 0.5;
            const ty = cy + Math.sin(ta) * r * 0.5;
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            const endX = tx + Math.cos(ta) * r * 0.6 + Math.sin(anim * 2 + i) * 3;
            const endY = ty + Math.sin(ta) * r * 0.6;
            ctx.quadraticCurveTo(tx + Math.cos(ta) * r * 0.3, ty + r * 0.2, endX, endY);
            ctx.stroke();
        }
    },
    
    // ====== 塑料缝合兽 ======
    plastic_beast(ctx, cx, cy, r, anim, e) {
        const wobble = Math.sin(anim * 0.8) * 2;
        // 拼接身体
        ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#1e88e5';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        // 锯齿边缘
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const rr = r * (0.75 + 0.25 * (i % 3 === 0 ? 1 : 0.85));
            const px = cx + Math.cos(a) * rr;
            const py = cy + Math.sin(a) * rr * 0.8 + wobble;
            ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 缝合线
        ctx.strokeStyle = '#42a5f5';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy - r * 0.5);
        ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
        ctx.moveTo(cx + r * 0.5, cy - r * 0.4);
        ctx.lineTo(cx - r * 0.2, cy + r * 0.3);
        ctx.stroke();
        ctx.setLineDash([]);
        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.2, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, cy - r * 0.2, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a237e';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, cy - r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        // 嘴巴
        ctx.strokeStyle = '#1a237e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r * 0.25, 0.2, Math.PI - 0.2);
        ctx.stroke();
    },
    
    // ====== 偷猎机甲 ======
    poacher_mech(ctx, cx, cy, r, anim, e) {
        const wobble = Math.sin(anim * 1.2) * 1;
        // 履带底座
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.roundRect(cx - r * 0.6, cy + r * 0.15, r * 1.2, r * 0.3, r * 0.1);
        ctx.fill();
        // 履带轮
        for (let i = 0; i < 4; i++) {
            const wx = cx - r * 0.45 + i * r * 0.3;
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.arc(wx, cy + r * 0.3, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        // 机身
        const bodyGrad = ctx.createLinearGradient(cx, cy - r * 0.4, cx, cy + r * 0.1);
        bodyGrad.addColorStop(0, '#78909c');
        bodyGrad.addColorStop(1, '#455a64');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(cx - r * 0.4, cy - r * 0.35, r * 0.8, r * 0.55, r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 驾驶舱
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.05, cy - r * 0.2, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        // 机械臂
        ctx.fillStyle = '#546e7a';
        ctx.fillRect(cx + r * 0.35, cy - r * 0.2, r * 0.45, r * 0.08);
        // 钳子
        const clampAngle = anim * 0.5;
        ctx.save();
        ctx.translate(cx + r * 0.8, cy - r * 0.16);
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.rotate(clampAngle);
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.25, -r * 0.08);
        ctx.lineTo(r * 0.25, r * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.rotate(-clampAngle * 2);
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.25, -r * 0.08);
        ctx.lineTo(r * 0.25, r * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // 天线
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.4);
        ctx.lineTo(cx, cy - r * 0.7);
        ctx.stroke();
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.72, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 酸雨云（飞行单位） ======
    acid_rain_cloud(ctx, cx, cy, r, anim, e) {
        const flyY = 5 * Math.sin(anim * 1.5);
        const y = cy + flyY;
        
        // 乌云主体
        ctx.fillStyle = hexToRgba('#37474f', 0.85);
        ctx.beginPath();
        const cloudBumps = [
            [0, -r * 0.4, r * 0.45],
            [r * 0.4, -r * 0.2, r * 0.35],
            [r * 0.6, y - r * 0.05, r * 0.3],
            [-r * 0.4, -r * 0.2, r * 0.35],
            [-r * 0.6, y - r * 0.05, r * 0.3],
        ];
        for (const [bx, by, br] of cloudBumps) {
            ctx.moveTo(bx + br, y + by);
            ctx.arc(bx, y + by, br, 0, Math.PI * 2);
        }
        // 底部填充
        ctx.fillStyle = hexToRgba('#263238', 0.85);
        ctx.beginPath();
        ctx.ellipse(0, y + r * 0.15, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 雨滴
        ctx.strokeStyle = hexToRgba('#4fc3f7', 0.5);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const rx = cx - r * 0.5 + i * r * 0.35 + Math.sin(anim * 3 + i) * 5;
            const ry = y + r * 0.2 + ((anim * 2 + i * 1.5) % 3) * r * 0.2;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx, ry + r * 0.15);
            ctx.stroke();
        }
        
        // 闪电
        if (Math.sin(anim * 4) > 0.85) {
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const lx = cx + r * 0.3;
            ctx.moveTo(lx, y - r * 0.15);
            ctx.lineTo(lx - r * 0.15, y + r * 0.05);
            ctx.lineTo(lx + r * 0.05, y + r * 0.05);
            ctx.lineTo(lx - r * 0.05, y + r * 0.25);
            ctx.stroke();
        }
        
        // 酸性光泽
        ctx.fillStyle = hexToRgba('#aeea00', 0.3);
        ctx.beginPath();
        ctx.arc(cx - r * 0.15, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 砍伐者巨魔 ======
    defiler_troll(ctx, cx, cy, r, anim, e) {
        const wobble = Math.sin(anim * 1.5) * 2;
        // 巨大的身体
        const bodyGrad = ctx.createLinearGradient(cx, cy - r * 0.6, cx, cy + r * 0.4);
        bodyGrad.addColorStop(0, '#8bc34a');
        bodyGrad.addColorStop(0.6, '#689f38');
        bodyGrad.addColorStop(1, '#33691e');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.05, r * 0.85, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 头部
        ctx.fillStyle = '#aed581';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.6, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#689f38';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 角
        for (let side = -1; side <= 1; side += 2) {
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.moveTo(cx + side * r * 0.25, cy - r * 0.8);
            ctx.lineTo(cx + side * r * 0.4, cy - r * 1.2);
            ctx.lineTo(cx + side * r * 0.35, cy - r * 0.7);
            ctx.closePath();
            ctx.fill();
        }
        
        // 眼睛
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(cx - r * 0.15, cy - r * 0.7, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.15, cy - r * 0.7, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // 斧头
        const axeCX = cx + r * 0.7;
        const axeCY = cy - r * 0.1 + wobble;
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, cy + r * 0.1);
        ctx.lineTo(axeCX, axeCY);
        ctx.stroke();
        // 斧刃
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.moveTo(axeCX - r * 0.15, axeCY - r * 0.3);
        ctx.quadraticCurveTo(axeCX + r * 0.15, axeCY + r * 0.05, axeCX - r * 0.15, axeCY + r * 0.2);
        ctx.quadraticCurveTo(axeCX - r * 0.1, axeCY, axeCX - r * 0.15, axeCY - r * 0.3);
        ctx.fill();
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 背刺
        for (let i = 0; i < 3; i++) {
            const sx = cx + Math.sin(i * 1.5) * r * 0.3;
            const sy = cy - r * 0.4 + i * r * 0.2;
            ctx.fillStyle = '#558b2f';
            ctx.beginPath();
            ctx.moveTo(sx - r * 0.1, sy + r * 0.08);
            ctx.lineTo(sx, sy - r * 0.15);
            ctx.lineTo(sx + r * 0.1, sy + r * 0.08);
            ctx.closePath();
            ctx.fill();
        }
    },
    
    // ====== 核废料蠕虫 (Boss) ======
    nuclear_worm(ctx, cx, cy, r, anim, e) {
        const segments = 4;
        
        // 身体节段
        for (let s = segments - 1; s >= 0; s--) {
            const sx = cx - s * r * 0.7;
            const sy = cy + Math.sin(anim * 0.8 + s * 0.7) * r * 0.3;
            const sr = r * (0.7 + s * 0.08);
            
            // 节段渐变
            const segGrad = ctx.createRadialGradient(sx, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
            segGrad.addColorStop(0, '#4a148c');
            segGrad.addColorStop(0.5, '#6a1b9a');
            segGrad.addColorStop(1, '#1a0033');
            ctx.fillStyle = segGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7c4dff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 放射性裂纹
            ctx.strokeStyle = hexToRgba('#e040fb', 0.6);
            ctx.lineWidth = 1;
            for (let c = 0; c < 3; c++) {
                const ca = (c / 3) * Math.PI * 2 + s * 0.5;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + Math.cos(ca) * sr * 0.6, sy + Math.sin(ca) * sr * 0.6);
                ctx.stroke();
            }
        }
        
        // 头部（最后绘制，在最上面）
        const headX = cx + r * 0.05;
        const headY = cy + Math.sin(anim * 0.8) * r * 0.3;
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.arc(headX, headY, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 口器
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.ellipse(headX + r * 0.4, headY, r * 0.2, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 牙齿
        for (let t = 0; t < 3; t++) {
            const tx = headX + r * 0.4;
            const ty = headY - r * 0.2 + t * r * 0.2;
            ctx.fillStyle = '#e0e0e0';
            ctx.beginPath();
            ctx.moveTo(tx + r * 0.1, ty - r * 0.04);
            ctx.lineTo(tx + r * 0.25, ty + r * 0.02);
            ctx.lineTo(tx + r * 0.1, ty + r * 0.08);
            ctx.closePath();
            ctx.fill();
        }
        
        // 眼睛（多个）
        for (let i = 0; i < 3; i++) {
            const ex = headX - r * 0.2 + i * r * 0.2;
            const ey = headY - r * 0.3 + Math.sin(i) * r * 0.1;
            ctx.fillStyle = '#ea80fc';
            ctx.beginPath();
            ctx.arc(ex, ey, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex, ey, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 放射性光环脉动
        const radPulse = 0.2 + 0.15 * Math.sin(anim * 2);
        const radGlow = ctx.createRadialGradient(headX, headY, r * 0.3, headX, headY, r * 1.8);
        radGlow.addColorStop(0, hexToRgba('#e040fb', radPulse));
        radGlow.addColorStop(1, 'rgba(224,64,251,0)');
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(headX, headY, r * 1.8, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 小塑料粒（分裂体） ======
    plastic_shard(ctx, cx, cy, r, anim, e) {
        const spin = anim * 3;
        ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#42a5f5';
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin);
        // 不规则碎片
        ctx.beginPath();
        ctx.moveTo(r * 0.8, 0);
        ctx.lineTo(r * 0.3, -r * 0.6);
        ctx.lineTo(-r * 0.5, -r * 0.3);
        ctx.lineTo(-r * 0.6, r * 0.2);
        ctx.lineTo(r * 0.1, r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1565c0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.1, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    // ====== 电子垃圾傀儡 ======
    e_waste_golem(ctx, cx, cy, r, anim, e) {
        const wobble = Math.sin(anim * 0.5) * 1.5;
        // 金属方块身体
        const bodyGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        bodyGrad.addColorStop(0, '#607d8b');
        bodyGrad.addColorStop(0.5, '#455a64');
        bodyGrad.addColorStop(1, '#37474f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(cx - r * 0.7, cy - r * 0.5 + wobble, r * 1.4, r * 1.0, r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 电子线路纹理
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.5, cy + wobble + (i - 1) * r * 0.3);
            ctx.lineTo(cx + r * 0.5, cy + wobble + (i - 1) * r * 0.3);
            ctx.stroke();
        }
        // 电阻元件
        for (let i = 0; i < 4; i++) {
            const rx = cx - r * 0.4 + i * r * 0.25;
            const ry = cy + wobble;
            ctx.fillStyle = i % 2 === 0 ? '#e91e63' : '#ffeb3b';
            ctx.beginPath();
            ctx.arc(rx, ry - r * 0.15, r * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
        // 独眼
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.25 + wobble, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + r * 0.04, cy - r * 0.28 + wobble, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 天线
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.5 + wobble);
        ctx.lineTo(cx, cy - r * 0.85);
        ctx.stroke();
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.88, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 烟霾巨蟒 ======
    smog_serpent(ctx, cx, cy, r, anim, e) {
        const flyY = 3 * Math.sin(anim * 1.2);
        const y = cy + flyY;
        // 烟雾身体
        const bodyLen = 3;
        for (let s = bodyLen - 1; s >= 0; s--) {
            const sx = cx - s * r * 0.55;
            const sy = y + Math.sin(anim * 0.6 + s * 0.8) * r * 0.2;
            const sr = r * (0.7 + s * 0.1);
            ctx.fillStyle = hexToRgba('#616161', 0.6 - s * 0.1);
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
        // 头部
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(cx, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, y - r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, y - r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        // 毒气
        ctx.fillStyle = hexToRgba('#aeea00', 0.15);
        ctx.beginPath();
        ctx.arc(cx, y + r * 0.1, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ====== 微生物群 ======
    microbe_swarm(ctx, cx, cy, r, anim, e) {
        // 小圆点群
        const count = 5;
        for (let i = 0; i < count; i++) {
            const ma = anim * 2 + i * 1.3;
            const mr = r * 0.3;
            const mx = cx + Math.cos(ma) * mr;
            const my = cy + Math.sin(ma) * mr * 0.8;
            const mr2 = r * (0.25 + 0.1 * Math.sin(anim + i));
            ctx.fillStyle = hexToRgba('#e91e63', 0.7);
            ctx.beginPath();
            ctx.arc(mx, my, mr2, 0, Math.PI * 2);
            ctx.fill();
        }
        // 外壳
        ctx.strokeStyle = hexToRgba('#e91e63', 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    },
    
    // ====== 微尘螨（分裂体） ======
    microbe_mite(ctx, cx, cy, r, anim, e) {
        const spin = anim * 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin);
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 触角
        ctx.strokeStyle = '#f48fb1';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const ta = i * Math.PI;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ta) * r * 0.2, Math.sin(ta) * r * 0.2);
            ctx.quadraticCurveTo(Math.cos(ta) * r * 0.6, Math.sin(ta) * r * 0.2, Math.cos(ta) * r * 0.8, Math.sin(ta) * r * 0.4);
            ctx.stroke();
        }
        ctx.restore();
    },
};

// ==================== 状态图标矢量渲染器 ====================
const StatusIconRenderer = {
    draw(ctx, x, y, size, type, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = hexToRgba('#fff', 0.3);
        ctx.lineWidth = 0.8;
        
        switch (type) {
            case 'root': // 链条/锁
                ctx.beginPath();
                ctx.arc(x - size * 0.3, y, size * 0.22, 0, Math.PI * 2);
                ctx.arc(x + size * 0.3, y, size * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x - size * 0.5, y - size * 0.12, size, size * 0.24);
                break;
            case 'slow': // 雪花
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const ex = x + Math.cos(a) * size * 0.55;
                    const ey = y + Math.sin(a) * size * 0.55;
                    ctx.moveTo(x, y);
                    ctx.lineTo(ex, ey);
                }
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'poison': // 骷髅
                ctx.beginPath();
                ctx.arc(x, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x - size * 0.4, y - size * 0.15, size * 0.8, size * 0.45);
                // 眼窝
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.arc(x - size * 0.15, y + size * 0.05, size * 0.1, 0, Math.PI * 2);
                ctx.arc(x + size * 0.15, y + size * 0.05, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'burn': // 火焰
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.6);
                ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.2, x + size * 0.2, y + size * 0.5);
                ctx.quadraticCurveTo(x, y + size * 0.2, x - size * 0.3, y + size * 0.3);
                ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.1, x, y - size * 0.6);
                ctx.fill();
                // 内焰
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.35);
                ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.05, x + size * 0.05, y + size * 0.25);
                ctx.quadraticCurveTo(x, y + size * 0.1, x - size * 0.15, y + size * 0.15);
                ctx.quadraticCurveTo(x - size * 0.2, y - size * 0.05, x, y - size * 0.35);
                ctx.fill();
                break;
        }
    }
};
