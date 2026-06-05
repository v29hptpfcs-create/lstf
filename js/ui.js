// ==================== UI系统 ====================

class UI {
    constructor(game) {
        this.game = game;
        
        // DOM元素缓存
        this.elements = {
            hpDisplay: document.getElementById('hp-display'),
            chlorophyll: document.getElementById('chlorophyll-display'),
            dewdrop: document.getElementById('dewdrop-display'),
            waveDisplay: document.getElementById('wave-display'),
            greenProgress: document.getElementById('green-progress'),
            greenPercent: document.getElementById('green-percent'),
            
            towerPanel: document.getElementById('tower-panel'),
            towerList: document.getElementById('tower-list'),
            towerInfo: document.getElementById('tower-info'),
            infoTowerName: document.getElementById('info-tower-name'),
            infoTowerStats: document.getElementById('info-tower-stats'),
            infoTowerActions: document.getElementById('info-tower-actions'),
            
            startWaveBtn: document.getElementById('btn-start-wave'),
            pauseBtn: document.getElementById('btn-pause'),
            speedBtn: document.getElementById('btn-speed'),
            
            pauseOverlay: document.getElementById('pause-overlay'),
            resultOverlay: document.getElementById('result-overlay'),
            resultTitle: document.getElementById('result-title'),
            resultStars: document.getElementById('result-stars'),
            resultStats: document.getElementById('result-stats'),
            carbonOffset: document.getElementById('carbon-offset'),
        };
    }
    
    update() {
        const g = this.game;
        if (!g) return;
        
        this.elements.hpDisplay.textContent = g.hp;
        this.elements.chlorophyll.textContent = g.chlorophyll;
        this.elements.dewdrop.textContent = g.dewdrop;
        
        // 波次显示
        const wp = g.waveManager ? g.waveManager.getProgress() : { current: 0, total: 0 };
        this.elements.waveDisplay.textContent = `${wp.current}/${wp.total}`;
        
        // 绿化度
        if (g.map) {
            const greenRatio = g.map.getGreenRatio();
            this.elements.greenProgress.style.width = `${greenRatio}%`;
            this.elements.greenPercent.textContent = `${Math.floor(greenRatio)}%`;
        }
        
        // 波次按钮状态与预览
        if (g.waveManager && !g.waveManager.isRunning && !g.waveManager.isAllWavesComplete()) {
            this.elements.startWaveBtn.disabled = false;
            const nextIdx = g.waveManager.currentWave;
            if (nextIdx < g.waveManager.totalWaves) {
                const waveData = g.waveManager.waves[nextIdx];
                const preview = waveData ? waveData.enemies.map(e => e.count + ENEMY_DEFS[e.type]?.icon || e.type).join(' ') : '';
                this.elements.startWaveBtn.textContent = `▶ 波${nextIdx+1} (${preview})`;
            } else {
                this.elements.startWaveBtn.textContent = '▶ 开始下一波';
            }
        } else {
            this.elements.startWaveBtn.disabled = true;
            this.elements.startWaveBtn.textContent = g.waveManager?.isAllWavesComplete() ? '✅ 全部完成' : '⚔️ 战斗中...';
        }
        
        // 技能冷却更新
        this._updateAbilityButtons();
    }
    
    _updateAbilityButtons() {
        if (!this.game.abilities) return;
        const now = Date.now();
        document.querySelectorAll('.ability-btn').forEach(btn => {
            const abId = btn.dataset.ability;
            const ab = this.game.abilities[abId];
            if (!ab) return;
            const elapsed = now - ab.lastUsed;
            const cdRatio = Math.min(1, elapsed / ab.cooldown);
            const canUse = cdRatio >= 1 && this.game.dewdrop >= ab.cost;
            btn.style.opacity = canUse ? '1' : '0.5';
            btn.style.cursor = canUse ? 'pointer' : 'not-allowed';
            const cdEl = btn.querySelector('.ab-cd');
            if (cdEl) {
                cdEl.textContent = cdRatio < 1 ? `${Math.ceil((ab.cooldown - elapsed) / 1000)}s` : '';
            }
        });
    }
    
    // 渲染塔选择面板（使用抽卡收集的塔池）
    renderTowerPanel() {
        const listEl = this.elements.towerList;
        listEl.innerHTML = '';
        
        const towers = typeof TOWER_GACHA !== 'undefined' ? 
            TOWER_GACHA.getAvailableTowers() : Object.values(TOWER_DEFS);
        const catNames = { plant: '🌱 植物净化系', energy: '⚡ 清洁能源系', animal: '🦊 动物伙伴系', industrial: '⚙ 再生工业系' };
        const catColors = { plant: '#66bb6a', energy: '#ffd54f', animal: '#ce93d8', industrial: '#ff8a65' };
        let lastCat = '';
        
        for (const def of towers) {
            // 解锁检测
            if (def.unlockWave && this.game.waveManager.currentWave < def.unlockWave) continue;
            
            const canAfford = this.game.chlorophyll >= (def.cost.chlorophyll || 0) &&
                              this.game.dewdrop >= (def.cost.dewdrop || 0);
            
            const catColor = catColors[def.category] || '#66bb6a';
            
            // 分类标题
            if (def.category !== lastCat) {
                lastCat = def.category;
                const header = document.createElement('div');
                header.className = 'tower-cat-header';
                header.style.cssText = `color:${catColor};border-bottom:1px solid ${hexToRgba(catColor,0.3)};`;
                header.textContent = catNames[def.category] || def.category;
                listEl.appendChild(header);
            }
            
            const btn = document.createElement('button');
            btn.className = `tower-select-btn ${canAfford ? '' : 'disabled'}`;
            btn.style.borderLeftColor = catColor;
            // 小型矢量图标替代emoji
            const icoSize = 28;
            const catIcon = `<canvas class="tw-mini-icon" width="${icoSize}" height="${icoSize}" data-id="${def.id}" data-cat="${def.category}"></canvas>`;
            btn.innerHTML = `
                <span class="tw-icon">${catIcon}</span>
                <div class="tw-info">
                    <div class="tw-name">${def.name}</div>
                    <div class="tw-cost">
                        ${def.cost.chlorophyll > 0 ? `🍃${def.cost.chlorophyll}` : ''}
                        ${def.cost.dewdrop > 0 ? ` 💧${def.cost.dewdrop}` : ''}
                        ${def.requireWater ? ' [水域]' : ''}
                        ${def.requireGeothermal ? ' [地热]' : ''}
                    </div>
                </div>
            `;
            
            btn.addEventListener('click', () => {
                if (!canAfford) return;
                this.game.selectTowerForPlacement(def);
            });
            
            listEl.appendChild(btn);
        }
        
        // 延迟绘制迷你塔图标到canvas上
        requestAnimationFrame(() => {
            const canvases = listEl.querySelectorAll('.tw-mini-icon');
            canvases.forEach(canvas => {
                const id = canvas.dataset.id;
                const cat = canvas.dataset.cat;
                MiniTowerIcon.draw(canvas, id, cat);
            });
        });
    }
    
    // 渲染选中塔的信息面板（多层升级系统）
    renderTowerInfo(tower) {
        const panel = this.elements.towerInfo;
        panel.classList.remove('hidden');
        
        const nameStr = tower.specialAbility?.name || tower.def.name;
        const catTag = tower.def.category === 'plant' ? '🌱' : tower.def.category === 'energy' ? '⚡' : tower.def.category === 'animal' ? '🦊' : '⚙';
        this.elements.infoTowerName.textContent = `${catTag} ${nameStr}`;
        
        const hpRatio = tower.hp / tower.maxHp;
        const hpColor = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
        let statsHtml = `
            <div><span>❤️ 耐久</span> <span style="color:${hpColor}">${tower.hp}/${tower.maxHp}</span></div>
            <div><span>🗡 伤害</span> <span>${Math.floor(tower.damage * tower.buffMultiplier.damage)}</span></div>
            <div><span>◎ 范围</span> <span>${Math.floor(tower.range * tower.buffMultiplier.range)}</span></div>
            <div><span>⏱ 攻速</span> <span>${(1000 / (tower.fireRate / tower.buffMultiplier.fireRate)).toFixed(1)}/s</span></div>
            <div><span>Lv ${tower.level}/5</span> <span>☠ ${tower.kills}</span></div>
            ${tower.upgradePath ? `<div style="color:${tower.upgradePath==='eco'?'#76ff03':'#ffab00'}"><span>★ ${tower.upgradePath==='eco'?'生态':'高效'}</span> <span>能力激活</span></div>` : ''}
        `;
        this.elements.infoTowerStats.innerHTML = statsHtml;
        
        let actionsHtml = '';
        
        // 升级按钮（Lv1-Lv4可升级，消耗递增）
        if (tower.level < 5) {
            const upgCost = 15 + tower.level * 10;
            const effCost = 5 + tower.level * 5;
            const canAfford = this.game.chlorophyll >= upgCost && this.game.dewdrop >= effCost;
            
            // 第3级时需选择路线
            if (tower.level === 3 && !tower.upgradePath) {
                if (tower.def.upgrades && tower.def.upgrades.length >= 2) {
                    actionsHtml += `
                        <button class="upgrade-eco" data-path="eco" ${!canAfford?'disabled':''}>
                            🌿 生态强化 Lv3<br><small>🍃${upgCost} 💧${effCost} 解锁特殊能力</small>
                        </button>
                        <button class="upgrade-eff" data-path="eff" ${!canAfford?'disabled':''}>
                            ⚡ 高效净化 Lv3<br><small>🍃${upgCost} 💧${effCost} 解锁特殊能力</small>
                        </button>
                    `;
                }
            } else {
                actionsHtml += `
                    <button class="upgrade-eco" data-upgrade="1" ${!canAfford?'disabled':''}>
                        ↑ 升级至 Lv${tower.level+1}<br>
                        <small>🍃${upgCost} 💧${effCost} 攻+15% 范围+8% 攻速+8%</small>
                    </button>
                `;
            }
        }
        
        // 出售按钮
        actionsHtml += `
            <button class="sell-btn">出售 (+🍃${tower.getSellValue()})</button>
        `;
        
        this.elements.infoTowerActions.innerHTML = actionsHtml;
        
        // 绑定事件：升级按钮
        this.elements.infoTowerActions.querySelectorAll('[data-path], [data-upgrade]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = btn.dataset.path;
                this.game.upgradeTower(tower, path);
            });
        });
        
        // 绑定事件：出售按钮
        const sellBtn = this.elements.infoTowerActions.querySelector('.sell-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.game.sellTower(tower);
            });
        }
    }
    
    hideTowerInfo() {
        this.elements.towerInfo.classList.add('hidden');
    }
    
    showPanel(panelId) {
        this.elements.towerPanel.classList.toggle('hidden', panelId !== 'tower-panel');
    }
    
    // 显示结算界面
    showResult(isVictory, stats) {
        const overlay = this.elements.resultOverlay;
        overlay.classList.remove('hidden');
        
        this.elements.resultTitle.textContent = isVictory ? '🎉 胜利！大地复苏' : '💔 失败...生命之树枯萎';
        this.elements.resultTitle.style.color = isVictory ? '#76ff03' : '#f44336';
        
        // 计算星级
        const levelData = LEVELS[this.game.currentLevelIndex];
        const starsData = levelData.stars;
        
        let stars = 0;
        if (stats.hp >= starsData.hp[0]) stars++;
        if (stats.hp >= starsData.hp[1]) stars++;
        if (stats.hp >= starsData.hp[2]) stars++;
        if (stats.greenPercent >= starsData.green[0] && stars < 3) stars++;
        if (stats.greenPercent >= starsData.green[1] && stars < 4) stars++;
        if (stats.recycleRate >= starsData.recycle[0] && stars < 5) stars++;
        stars = clamp(stars, 1, 3); // 简化为三星
        
        // 重新计算：三项各一星
        let starCount = 0;
        let starStr = '';
        const hpStar = stats.hp >= starsData.hp[2] ? '⭐' : (stats.hp >= starsData.hp[1] ? '☆' : '☆');
        const greenStar = stats.greenPercent >= starsData.green[2] ? '⭐' : (stats.greenPercent >= starsData.green[1] ? '☆' : '☆');
        const recycleStar = stats.recycleRate >= starsData.recycle[2] ? '⭐' : (stats.recycleRate >= starsData.recycle[1] ? '☆' : '☆');
        starStr = hpStar + greenStar + recycleStar;
        starCount = [hpStar, greenStar, recycleStar].filter(s => s === '⭐').length;
        
        this.elements.resultStars.textContent = starStr;
        
        this.elements.resultStats.innerHTML = `
            <div><span>❤️ 剩余生命值</span> <span>${stats.hp} / ${CONFIG.STARTING_HP}</span></div>
            <div><span>🌱 地图绿化度</span> <span>${stats.greenPercent.toFixed(1)}%</span></div>
            <div><span>♻️ 资源回收率</span> <span>${stats.recycleRate.toFixed(1)}%</span></div>
            <div><span>☠️ 击杀敌人</span> <span>${stats.kills}</span></div>
            <div><span>🏗️ 建造塔数</span> <span>${stats.towersBuilt}</span></div>
        `;
        
        // 碳抵消信息
        const treesEquivalent = Math.floor(stats.greenPercent * 0.5 + stats.kills * 0.3 + stats.towersBuilt * 2);
        this.elements.carbonOffset.innerHTML = `
            <h4>🌍 本次守护碳抵消估算</h4>
            <p>你建造了 ${stats.towersBuilt} 座防御塔，净化了 ${stats.greenPercent.toFixed(1)}% 的土地，击败 ${stats.kills} 个污染体。</p>
            <p>相当于在现实中种下了约 <b style="color:#76ff03;font-size:1.15em">${treesEquivalent}</b> 棵树！</p>
            <p style="font-size:0.82rem;color:#81c784;margin-top:6px">每一次游戏都是对环保理念的践行 ✨</p>
        `;
        
        // 按钮显隐
        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = (isVictory && this.game.currentLevelIndex + 1 < LEVELS.length) ? 'block' : 'none';
    }
    
    hideResult() {
        this.elements.resultOverlay.classList.add('hidden');
    }
}

// ==================== 图鉴生成 ====================
function generateEncyclopedia() {
    const tabTowers = document.getElementById('tab-towers');
    const tabEnemies = document.getElementById('tab-enemies');
    
    // 塔图鉴
    let towerHtml = '';
    Object.values(TOWER_DEFS).forEach(def => {
        const catName = { plant: '植物净化系', energy: '清洁能源系', animal: '动物伙伴系', industrial: '再生工业系' }[def.category] || '';
        towerHtml += `
            <div class="entry-card">
                <h4>${def.icon} ${def.name} <small style="color:#888; font-weight:normal">[${catName}]</small></h4>
                <p>${def.desc}</p>
                <p style="margin-top:4px; font-size:0.82rem; color:#888;">
                    伤害:${def.damage} | 范围:${def.range} | 攻速:${(1000/def.fireRate).toFixed(1)}/s |
                    成本: ${def.cost.chlorophyll?`🍃${def.cost.chlorophyll}`:''}${def.cost.dewdrop?` 💧${def.cost.dewdrop}`:''}
                </p>
            </div>
        `;
    });
    tabTowers.innerHTML = towerHtml;
    
    // 敌人图鉴
    let enemyHtml = '';
    Object.values(ENEMY_DEFS).forEach(def => {
        enemyHtml += `
            <div class="entry-card">
                <h4>${def.icon} ${def.name} <small style="color:#888; font-weight:normal">${def.isBoss?'[Boss]':''}</small></h4>
                <p>${def.desc}</p>
                <p style="margin-top:4px; font-size:0.82rem; color:#888;">
                    HP:${def.hp} | 速度:${def.speed} | 奖励: 🍃${def.reward.chlorophyll||0} 💧${def.reward.dewdrop||0}
                </p>
            </div>
        `;
    });
    tabEnemies.innerHTML = enemyHtml;
}

// ==================== 迷你塔图标渲染器（用于UI面板canvas） ====================
const MiniTowerIcon = {
    draw(canvas, towerId, category) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = w * 0.38;
        
        ctx.clearRect(0, 0, w, h);
        
        // 分类颜色
        const colors = {
            plant: ['#4caf50', '#2e7d32', '#81c784'],
            energy: ['#ffd54f', '#f9a825', '#ffecb3'],
            animal: ['#ce93d8', '#8e24aa', '#e1bee7'],
            industrial: ['#ff8a65', '#e64a19', '#ffab91']
        };
        const cc = colors[category] || colors.plant;
        
        // 圆形底座
        const baseGrad = ctx.createRadialGradient(cx, cy + r * 0.2, r * 0.1, cx, cy + r * 0.3, r * 0.85);
        baseGrad.addColorStop(0, hexToRgba(cc[1], 0.5));
        baseGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.25, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 卡通化塔型
        switch (towerId) {
            case 'fern_cannon':
                ctx.fillStyle = cc[1]; // 花盆
                ctx.beginPath(); ctx.roundRect(cx - r * 0.5, cy + r * 0.05, r, r * 0.4, r * 0.1); ctx.fill();
                for (let i = 0; i < 3; i++) { // 叶子
                    const la = (i/3) * Math.PI + 0.3;
                    ctx.fillStyle = cc[0];
                    ctx.beginPath();
                    ctx.save(); ctx.translate(cx, cy - r * 0.1); ctx.rotate(la);
                    ctx.ellipse(0, -r * 0.5, r * 0.12, r * 0.4, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
                }
                ctx.fillStyle = '#42a5f5'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.18, 0, Math.PI*2); ctx.fill();
                break;
            case 'lily_platform':
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.65, r * 0.25, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.2, 0, Math.PI*2); ctx.fill();
                break;
            case 'willow_sentry':
                ctx.fillStyle = '#795548'; ctx.fillRect(cx - r * 0.1, cy + r * 0.1, r * 0.2, r * 0.5);
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.35, 0, Math.PI*2); ctx.fill();
                break;
            case 'wind_vortex':
                ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.roundRect(cx - r * 0.5, cy + r * 0.05, r, r * 0.3, r * 0.08); ctx.fill();
                for (let i = 0; i < 3; i++) {
                    const ba = i * Math.PI*2/3;
                    ctx.strokeStyle = cc[0]; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.25); ctx.lineTo(cx + Math.cos(ba)*r*0.6, cy - r*0.25 + Math.sin(ba)*r*0.6); ctx.stroke();
                }
                ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.25, r * 0.12, 0, Math.PI*2); ctx.fill();
                break;
            case 'solar_matrix':
                ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy + r * 0.3); ctx.lineTo(cx, cy - r * 0.1); ctx.lineTo(cx + r * 0.3, cy + r * 0.3); ctx.fill();
                ctx.fillStyle = '#1565c0'; ctx.beginPath(); ctx.roundRect(cx - r * 0.5, cy - r * 0.5, r, r * 0.6, r * 0.06); ctx.fill();
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r * 0.15, 0, Math.PI*2); ctx.fill();
                break;
            case 'geothermal_fissure':
                ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, r * 0.2, 0, Math.PI*2); ctx.fill();
                break;
            case 'bee_thrower':
                ctx.fillStyle = '#e65100'; ctx.beginPath();
                for (let i = 0; i < 6; i++) { const a = i*Math.PI/3 - Math.PI/2; ctx.lineTo(cx + Math.cos(a)*r*0.5, cy + Math.sin(a)*r*0.5); }
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#ffa000'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, r * 0.18, 0, Math.PI*2); ctx.fill();
                break;
            case 'swift_return':
                ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.arc(cx, cy + r * 0.05, r * 0.5, Math.PI, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#5d4037'; ctx.beginPath();
                ctx.moveTo(cx + r * 0.3, cy - r * 0.2); ctx.quadraticCurveTo(cx, cy - r * 0.5, cx - r * 0.3, cy - r * 0.2);
                ctx.quadraticCurveTo(cx, cy - r * 0.05, cx + r * 0.3, cy - r * 0.2); ctx.fill();
                break;
            case 'glow_mushroom':
                ctx.fillStyle = '#d7ccc8'; ctx.fillRect(cx - r * 0.08, cy + r * 0.1, r * 0.16, r * 0.35);
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.1, r * 0.45, r * 0.28, 0, Math.PI, Math.PI*2); ctx.fill();
                break;
            case 'plastic_melter':
                ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.roundRect(cx - r * 0.4, cy - r * 0.3, r * 0.8, r * 0.7, r * 0.08); ctx.fill();
                ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, Math.PI*2); ctx.fill();
                break;
            case 'compost_fermentor':
                ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.roundRect(cx - r * 0.35, cy - r * 0.3, r * 0.7, r * 0.7, r * 0.1); ctx.fill();
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, Math.PI*2); ctx.fill();
                break;
            default:
                ctx.fillStyle = cc[0]; ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = cc[2]; ctx.beginPath(); ctx.arc(cx, cy, r * 0.2, 0, Math.PI*2); ctx.fill();
        }
    }
};
