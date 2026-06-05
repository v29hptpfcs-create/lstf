// ==================== 粒子系统 ====================

class Particle {
    constructor(x, y, type, color, extra = 0) {
        this.x = x;
        this.y = y;
        this.type = type; // 'hit', 'death', 'debris', 'aoe_burst', 'slow', 'root', 'poison', 'burn', 'aoe'
        this.color = color;
        this.alive = true;
        
        // 基于类型设置属性
        switch (type) {
            case 'hit':
                this.size = randomRange(3, 7);
                this.vx = randomRange(-2.5, 2.5);
                this.vy = randomRange(-2.5, 2.5);
                this.life = 25;
                this.maxLife = 25;
                break;
                
            case 'death':
            case 'debris':
                this.size = randomRange(2, 6);
                this.vx = randomRange(-4, 4);
                this.vy = randomRange(-5, 1);
                this.gravity = 0.15;
                this.life = 35;
                this.maxLife = 35;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotSpeed = randomRange(-0.15, 0.15);
                break;
                
            case 'aoe_burst':
                this.size = 0;
                this.maxSize = extra || 50;
                this.growSpeed = (this.maxSize) / 18;
                this.life = 20;
                this.maxLife = 20;
                break;
                
            case 'slow':
                this.size = randomRange(8, 14);
                this.life = 30;
                this.maxLife = 30;
                this.vy = -1;
                break;
                
            case 'root':
                this.size = randomRange(6, 12);
                this.life = 28;
                this.maxLife = 28;
                this.vy = -0.8;
                break;
                
            case 'poison':
                this.size = randomRange(5, 10);
                this.vx = randomRange(-1, 1);
                this.vy = randomRange(-2, -0.5);
                this.life = 32;
                this.maxLife = 32;
                break;
                
            case 'burn':
                this.size = randomRange(6, 12);
                this.vx = randomRange(-1.5, 1.5);
                this.vy = randomRange(-3, -1);
                this.life = 24;
                this.maxLife = 24;
                break;
                
            case 'aoe':
                this.size = 10;
                this.vx = randomRange(-1, 1);
                this.vy = randomRange(-1, 1);
                this.life = 18;
                this.maxLife = 18;
                break;
                
            case 'rain':
                this.size = randomRange(2, 4);
                this.vy = randomRange(3, 6);
                this.life = 35;
                this.maxLife = 35;
                break;
                
            case 'heal':
                this.size = randomRange(4, 8);
                this.vy = randomRange(-2, -0.5);
                this.life = 25;
                this.maxLife = 25;
                break;
                
            case 'crit':
                this.size = randomRange(8, 14);
                this.vx = randomRange(-1.5, 1.5);
                this.vy = randomRange(-3, -1);
                this.life = 20;
                this.maxLife = 20;
                break;
                
            default:
                this.size = 5;
                this.life = 20;
                this.maxLife = 20;
                this.vx = randomRange(-1, 1);
                this.vy = randomRange(-1, 1);
        }
    }
    
    update() {
        if (!this.alive) return;
        
        this.life--;
        if (this.life <= 0) {
            this.alive = false;
            return;
        }
        
        const ratio = this.life / this.maxLife;
        
        switch (this.type) {
            case 'hit':
            case 'debris':
            case 'death':
            case 'poison':
            case 'burn':
            case 'aoe':
                this.x += this.vx;
                this.y += this.vy;
                if (this.gravity) this.vy += this.gravity;
                this.size *= 0.96;
                break;
                
            case 'aoe_burst':
                this.size += this.growSpeed;
                break;
                
            case 'slow':
            case 'root':
                this.y += this.vy;
                this.size *= 0.97;
                break;
        }
        
        if (this.type === 'debris' || this.type === 'death') {
            this.rotation += this.rotSpeed || 0;
        }
    }
    
    render(ctx, offsetX = 0, offsetY = 0) {
        if (!this.alive) return;
        
        const cx = this.x + offsetX;
        const cy = this.y + offsetY;
        const ratio = this.life / this.maxLife;
        
        ctx.globalAlpha = clamp(ratio * 1.8, 0, 1);
        
        switch (this.type) {
            case 'hit':
                // 火花四溅
                const hitGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.size);
                hitGrad.addColorStop(0, '#ffffff');
                hitGrad.addColorStop(0.3, this.color);
                hitGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = hitGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size * ratio, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'death':
            case 'debris':
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(this.rotation || 0);
                const fragGrad = ctx.createLinearGradient(-this.size/2, 0, this.size/2, 0);
                fragGrad.addColorStop(0, this.color);
                fragGrad.addColorStop(1, hexToRgba(this.color, 0.3));
                ctx.fillStyle = fragGrad;
                ctx.beginPath();
                ctx.roundRect(-this.size/2, -this.size/2, this.size, this.size, this.size * 0.3);
                ctx.fill();
                ctx.restore();
                break;
                
            case 'aoe_burst':
                // 冲击波
                ctx.strokeStyle = hexToRgba(this.color, ratio * 0.8);
                ctx.lineWidth = 4 * ratio;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size, 0, Math.PI * 2);
                ctx.stroke();
                // 内环
                ctx.strokeStyle = hexToRgba('#ffffff', ratio * 0.5);
                ctx.lineWidth = 2 * ratio;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'slow':
            case 'root':
            case 'poison':
            case 'burn':
                // 效果粒子 - 带光晕
                const effGrad = ctx.createRadialGradient(cx, cy, this.size * 0.1, cx, cy, this.size);
                effGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
                effGrad.addColorStop(0.5, hexToRgba(this.color, 0.5));
                effGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = effGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'aoe':
                ctx.fillStyle = hexToRgba(this.color, ratio * 0.6);
                ctx.beginPath();
                ctx.arc(cx, cy, this.size * ratio, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'rain':
                ctx.strokeStyle = hexToRgba(this.color, ratio * 0.7);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, cy + this.size);
                ctx.stroke();
                break;
                
            case 'heal':
                ctx.fillStyle = hexToRgba(this.color, ratio * 0.6);
                ctx.beginPath();
                ctx.moveTo(cx, cy - this.size);
                for (let i = 0; i < 5; i++) {
                    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const px = cx + Math.cos(a) * this.size * 0.35;
                    const py = cy + Math.sin(a) * this.size * 0.35;
                    ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'crit':
                const critGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.size);
                critGrad.addColorStop(0, '#fff');
                critGrad.addColorStop(0.4, this.color);
                critGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = critGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size * ratio, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(cx, cy, this.size * ratio, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
}

// ==================== 浮动文字 ====================
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60;
        this.maxLife = 60;
        this.vy = -1.2;
    }
    
    update() {
        this.life--;
        this.y += this.vy;
        this.vy *= 0.97;
    }
    
    render(ctx, offsetX = 0, offsetY = 0) {
        const ratio = this.life / this.maxLife;
        ctx.globalAlpha = clamp(ratio * 1.8, 0, 1);
        ctx.font = `bold ${ratio > 0.6 ? '13px' : '11px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 描边
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x + offsetX, this.y + offsetY);
        
        // 填充
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x + offsetX, this.y + offsetY);
        
        ctx.globalAlpha = 1;
    }

    get alive() { return this.life > 0; }
}
