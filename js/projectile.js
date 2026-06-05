// ==================== 投射物系统 ====================

class Projectile {
    constructor(x, y, angle, speed, damage, color, size, options = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.size = size || 4;
        this.alive = true;
        
        // 选项
        this.slowAmount = options.slowAmount || 0;
        this.slowDuration = options.slowDuration || 0;
        this.aoeRadius = options.aoeRadius || 0;
        this.effect = options.effect || null;
        this.pierce = options.pierce || 0;   // 穿透数
        this.piercedTargets = [];           // 已穿透目标
        
        // DoT效果
        this.burnDamage = options.burnDamage || 0;
        this.burnDuration = options.burnDuration || 0;
        this.poisonDamage = options.poisonDamage || 0;
        this.poisonDuration = options.poisonDuration || 0;
        this.toxicDot = options.toxicDot || 0;
        this.toxicSlow = options.toxicSlow || 0;
        
        // 控制
        this.rootChance = options.rootChance || 0;
        this.rootDuration = options.rootDuration || 0;
        
        // 击退
        this.pushForce = options.pushForce || 0;
        this.pushChance = options.pushChance || 0;
        
        // 关联塔
        this.towerId = options.towerId || null;
        
        // 拖尾
        this.trail = [];
    }
    
    update(dt, enemies, game) {
        if (!this.alive) return;
        if (!game || !game.map) return;
        
        // 移动
        const moveX = Math.cos(this.angle) * this.speed * dt * 60;
        const moveY = Math.sin(this.angle) * this.speed * dt * 60;
        
        // 记录拖尾
        if (this.trail.length > 5) this.trail.shift();
        this.trail.push({ x: this.x, y: this.y });
        
        this.x += moveX;
        this.y += moveY;
        
        // 边界检查（超出地图范围销毁）
        const mapW = game.map.getWidth();
        const mapH = game.map.getHeight();
        if (this.x < -50 || this.x > mapW + 50 || this.y < -50 || this.y > mapH + 50) {
            this.alive = false;
            return;
        }
        
        // 碰撞检测
        for (const enemy of enemies) {
            if (!enemy.alive || enemy.reachedEnd) continue;
            if (this.piercedTargets.includes(enemy)) continue;
            
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            const hitRadius = (enemy.radius || 14) + this.size;
            
            if (dist <= hitRadius) {
                // 命中！（投射物纯视觉，伤害已在tower.update中直接处理）
                game.addParticle(this.x, this.y, 'hit', this.color);
                this.alive = false;
                return;
            }
        }
    }
    
    handleAOE(enemies, hitTarget, game) {
        // AOE伤害范围内其他敌人
        let aoeDmg = this.damage * 0.4; // AOE伤害为主伤害的40%
        
        for (const enemy of enemies) {
            if (enemy === hitTarget || !enemy.alive) continue;
            
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.aoeRadius) {
                enemy.takeDamage(aoeDmg, game);
                game.addParticle(enemy.x, enemy.y, 'aoe', this.color);
                
                if (this.slowAmount > 0) {
                    enemy.applyEffect('slow', this.slowDuration * 0.7, this.slowAmount * 0.7);
                }
            }
        }
        
        // AOE视觉效果
        game.addParticle(this.x, this.y, 'aoe_burst', this.color, this.aoeRadius);
    }
    
    render(ctx, offsetX = 0, offsetY = 0) {
        if (!this.alive) return;
        
        const cx = this.x + offsetX;
        const cy = this.y + offsetY;
        
        // 外发光
        const glowGrad = ctx.createRadialGradient(cx, cy, this.size * 0.5, cx, cy, this.size * 2.5);
        glowGrad.addColorStop(0, hexToRgba(this.color, 0.4));
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, this.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 拖尾
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.35;
                const tsize = this.size * (0.3 + i / this.trail.length * 0.7);
                ctx.fillStyle = hexToRgba(this.color, alpha);
                ctx.beginPath();
                ctx.arc(this.trail[i].x + offsetX, this.trail[i].y + offsetY, tsize, 0, Math.PI * 2);
                ctx.fill();
            }
            // 拖尾连线
            ctx.strokeStyle = hexToRgba(this.color, 0.25);
            ctx.lineWidth = this.size * 0.7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x + offsetX, this.trail[0].y + offsetY);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x + offsetX, this.trail[i].y + offsetY);
            }
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }
        
        // 本体
        const bodyGrad = ctx.createRadialGradient(cx - this.size * 0.2, cy - this.size * 0.2, this.size * 0.1, cx, cy, this.size);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, this.color);
        bodyGrad.addColorStop(0.7, hexToRgba(this.color, 0.6));
        bodyGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心亮点
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}
