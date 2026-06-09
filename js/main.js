// ==================== 主入口：初始化与事件绑定 ====================

let game = null;

// ==================== 新手引导 ====================
const TUTORIAL_STEPS = [
    { id: 'step1', text: '👋 欢迎！点击下方按钮开始第一波敌人', pos: { bottom: '70px', left: '50%' }, showWhen: () => game && game.waveManager && game.waveManager.currentWave === 0 },
    { id: 'step2', text: '🏗️ 点击绿色草地，再选一座塔建造！', pos: { top: '60px', left: '220px' }, showWhen: () => game && game.waveManager && game.waveManager.isRunning },
    { id: 'step3', text: '💡 塔可以升级！选中已建造的塔，查看升级选项', pos: { top: '60px', right: '260px' }, showWhen: () => game && game.towers.length >= 2 },
    { id: 'step4', text: '🌧 底部技能按钮可在关键时刻使用！', pos: { bottom: '60px', left: '50%' }, showWhen: () => game && game.abilities && game.dewdrop >= 15 },
];

let tutorialIndex = 0;
let tutorialDismissed = new Set();

function showTutorialTip(step) {
    if (tutorialDismissed.has(step.id)) return;
    const tip = document.getElementById('tutorial-tip');
    const text = document.getElementById('tutorial-text');
    tip.classList.remove('hidden');
    text.textContent = step.text;
    // Position
    Object.assign(tip.style, step.pos, { position: 'fixed', zIndex: '200' });
    // Clear other positioning
    ['top','bottom','left','right'].forEach(p => {
        if (!step.pos[p]) tip.style[p] = 'auto';
    });
    // Transform for centering
    if (step.pos.left === '50%') tip.style.transform = 'translateX(-50%)';
    if (step.pos.right !== undefined) tip.style.transform = '';
}

function checkTutorial() {
    if (!game) return;
    // Show current step
    while (tutorialIndex < TUTORIAL_STEPS.length) {
        const step = TUTORIAL_STEPS[tutorialIndex];
        if (step.showWhen()) {
            showTutorialTip(step);
            break;
        } else {
            tutorialIndex++;
        }
    }
}

document.getElementById('tutorial-close').addEventListener('click', () => {
    const tip = document.getElementById('tutorial-tip');
    tip.classList.add('hidden');
    if (tutorialIndex < TUTORIAL_STEPS.length) {
        tutorialDismissed.add(TUTORIAL_STEPS[tutorialIndex].id);
        tutorialIndex++;
    }
});

// 全局错误捕获
window.addEventListener('error', (e) => {
    console.error(`[Game Error] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`, e.error?.stack);
});

document.addEventListener('DOMContentLoaded', () => {
    // 生成图鉴内容
    generateEncyclopedia();
    // 生成关卡选择
    generateLevelSelect();
    
    // 绑定主菜单按钮
    bindMenuEvents();
    // 绑定游戏内按钮
    bindGameEvents();
    // 绑定图鉴标签
    bindTabEvents();
    
    // 主菜单浮动粒子
    const menuBg = document.querySelector('.menu-bg');
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'menu-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = '-10px';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
        menuBg.appendChild(p);
    }
    
    // 显示主菜单
    showScreen('main-menu');
});

// ====== 屏幕切换 ======
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    // 显示主菜单时刷新结晶显示
    if (screenId === 'main-menu' && typeof TOWER_GACHA !== 'undefined') {
        const el = document.getElementById('crystal-count');
        if (el) el.textContent = TOWER_GACHA.getCrystals();
    }
}

// ====== 主菜单事件 ======
function bindMenuEvents() {
    document.getElementById('btn-start').addEventListener('click', () => {
        showScreen('level-select');
    });
    
    document.getElementById('btn-howto').addEventListener('click', () => {
        showScreen('howto-screen');
    });
    
    document.getElementById('btn-encyclopedia').addEventListener('click', () => {
        showScreen('encyclopedia-screen');
    });
    
    // 抽卡按钮
    document.getElementById('btn-gacha').addEventListener('click', () => {
        _showGachaScreen();
    });
    document.getElementById('gacha-back').addEventListener('click', () => {
        document.getElementById('gacha-main-overlay').classList.add('hidden');
    });
    document.getElementById('gacha-draw-1').addEventListener('click', () => _doGachaDraw(1));
    document.getElementById('gacha-draw-10').addEventListener('click', () => _doGachaDraw(10));
    
    // 所有返回按钮
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('main-menu');
        });
    });
}

// ====== 关卡选择生成 ======
function generateLevelSelect() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    
    LEVELS.forEach((level, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        
        const progress = getLevelProgress(idx);
        const isUnlocked = idx === 0 || getLevelProgress(idx - 1);
        
        if (!isUnlocked) {
            btn.classList.add('locked');
            btn.innerHTML = `<span style="font-size:2rem">🔒</span><div>第${idx+1}章</div>`;
            btn.disabled = true;
        } else {
            btn.classList.add('unlocked');
            const stars = progress ? (progress.stars >= 3 ? '⭐⭐⭐' : progress.stars >= 2 ? '⭐⭐☆' : '⭐☆☆') : '☆☆☆';
            btn.innerHTML = `
                <span style="font-size:2rem">${
                    level.theme==='forest'? '🌲' : 
                    level.theme==='coast'? '🏖️' : 
                    level.theme==='urban'? '🏙️' : 
                    level.theme==='wasteland'? '🏭' :
                    level.theme==='ice'? '❄️' : '☣️'
                }</span>
                <div style="font-size:0.65rem;color:#888;margin-top:2px;">${level.subtitle||''}</div>
                <div>${level.name.split('：')[1] || level.name}</div>
                <div class="level-stars">${stars}</div>
            `;
            
            btn.addEventListener('click', () => {
                startLevel(idx);
            });
        }
        
        grid.appendChild(btn);
    });
}

// ====== 难度选择 ======
let currentDifficulty = 'normal';
const DIFFICULTY = {
    easy: { enemyHp: 0.7, enemySpeed: 0.85, goldMul: 1.5, title: '🌱 简单' },
    normal: { enemyHp: 1.0, enemySpeed: 1.0, goldMul: 1.0, title: '⚖️ 普通' },
    hard: { enemyHp: 1.5, enemySpeed: 1.15, goldMul: 0.8, title: '🔥 困难' },
    hell: { enemyHp: 2.5, enemySpeed: 1.3, goldMul: 0.5, title: '💀 地狱' },
};

// ====== 开始关卡（带难度+剧情） ======
function startLevel(levelIndex) {
    document.getElementById('difficulty-overlay').classList.remove('hidden');
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
            currentDifficulty = btn.dataset.diff;
            document.getElementById('difficulty-overlay').classList.add('hidden');
            _startLevelWithDiff(levelIndex);
        };
    });
}

function _startLevelWithDiff(levelIndex) {
    // 序章（仅当STORY存在且未播放过）
    if (typeof STORY !== 'undefined' && levelIndex === 0 && !localStorage.getItem('story_prologue_done')) {
        try {
            localStorage.setItem('story_prologue_done', '1');
            _showStory(STORY.prologue, () => _doStartLevel(levelIndex));
            return;
        } catch(e) {
            console.warn('[Main] 序章播放失败，跳过:', e);
        }
    }
    // 每关开场剧情
    const intros = (typeof STORY !== 'undefined') ? STORY.levelIntros : null;
    const intro = intros ? intros[levelIndex] : null;
    if (intro && intro.length > 0) {
        _showStory(intro, () => _doStartLevel(levelIndex));
    } else {
        _doStartLevel(levelIndex);
    }
}

function _showStory(data, callback) {
    if (typeof SFX !== 'undefined') SFX.init();
    document.getElementById('story-overlay').classList.remove('hidden');
    STORY.play(data, 'story-container', () => {
        document.getElementById('story-overlay').classList.add('hidden');
        if (callback) callback();
    });
}

// ====== 抽卡系统界面 ======
function _showGachaScreen() {
    if (typeof TOWER_GACHA === 'undefined') return;
    document.getElementById('gacha-crystals').textContent = TOWER_GACHA.getCrystals();
    document.getElementById('gacha-result').innerHTML = '';
    _updateGachaCollection();
    document.getElementById('gacha-main-overlay').classList.remove('hidden');
}

function _updateGachaCollection() {
    const col = TOWER_GACHA.getCollection();
    const html = Object.entries(col)
        .filter(([id, count]) => count > 0 && TOWER_DEFS[id])
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => {
            const def = TOWER_DEFS[id];
            const rar = TOWER_GACHA._rarityMap[id] || 'common';
            const color = TOWER_GACHA.RARITIES[rar].color;
            return `<span style="color:${color};margin:0 4px;">${def.icon}×${count}</span>`;
        }).join('');
    document.getElementById('gacha-collection').innerHTML = html ? '已收集: ' + html : '暂无收集，快去抽卡吧！';
}

function _doGachaDraw(count) {
    if (typeof TOWER_GACHA === 'undefined') return;
    const resultEl = document.getElementById('gacha-result');
    
    if (count === 1) {
        const result = TOWER_GACHA.drawOnce();
        if (!result) { resultEl.innerHTML = '<span style="color:#f44336;">结晶不足！需要30💎</span>'; return; }
        resultEl.innerHTML = `
            <div class="gacha-card" style="border-color:${result.color};max-width:150px;">
                <div class="gacha-icon">${result.def.icon}</div>
                <div class="gacha-name" style="color:${result.color};">${result.def.name}</div>
                <div style="color:${result.color};font-size:0.9rem;">${result.stars} ${result.name}</div>
                <div style="color:#a5d6a7;font-size:0.75rem;">已收集×${result.count}</div>
            </div>
        `;
    } else {
        const results = TOWER_GACHA.drawTen();
        if (!results) { resultEl.innerHTML = '<span style="color:#f44336;">结晶不足！需要250💎</span>'; return; }
        resultEl.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">' +
            results.map(r => `
                <div class="gacha-card" style="border-color:${r.color};max-width:100px;padding:10px 6px;">
                    <div style="font-size:1.5rem;">${r.def.icon}</div>
                    <div style="color:${r.color};font-size:0.7rem;">${r.def.name}</div>
                    <div style="color:${r.color};font-size:0.7rem;">${r.stars}</div>
                </div>
            `).join('') + '</div>';
    }
    
    document.getElementById('gacha-crystals').textContent = TOWER_GACHA.getCrystals();
    _updateGachaCollection();
    if (typeof SFX !== 'undefined') SFX.towerUpgrade();
    
    // 更新主菜单结晶显示
    const crystalCount = document.getElementById('crystal-count');
    if (crystalCount) crystalCount.textContent = TOWER_GACHA.getCrystals();
}

function _doStartLevel(levelIndex) {
    showScreen('game-screen');
    
    const diff = DIFFICULTY[currentDifficulty] || DIFFICULTY.normal;
    game = new Game();
    game._difficulty = diff;
    const loaded = game.loadLevel(levelIndex);
    
    if (!loaded) {
        console.error('[Main] 关卡加载失败:', levelIndex);
        alert('关卡加载失败，请返回主菜单重试。');
        showScreen('main-menu');
        return;
    }
    
    game.start();
    
    document.getElementById('tower-panel').classList.remove('hidden');
}

// ====== 游戏内事件绑定 ======
function bindGameEvents() {
    // 技能按钮
    document.querySelectorAll('.ability-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const abilityId = btn.dataset.ability;
            if (game && game.activateAbility) {
                game.activateAbility(abilityId);
            }
        });
    });
    
    // 波次开始
    document.getElementById('btn-start-wave').addEventListener('click', () => {
        if (game && game.waveManager) {
            game.startNextWave();
        }
    });
    
    // 暂停
    document.getElementById('btn-pause').addEventListener('click', () => {
        if (game) game.togglePause();
    });
    
    // 加速
    document.getElementById('btn-speed').addEventListener('click', () => {
        if (game) game.toggleSpeed();
    });
    
    // 菜单（暂停）
    document.getElementById('btn-menu').addEventListener('click', () => {
        if (game) game.togglePause();
    });
    
    // 音效开关
    document.getElementById('btn-sound').addEventListener('click', () => {
        if (typeof SFX !== 'undefined') {
            if (!SFX._ctx) SFX.init();
            const unmuted = SFX.toggle();
            document.getElementById('btn-sound').textContent = unmuted ? '🔊' : '🔇';
        }
    });
    
    // 暂停界面按钮
    document.getElementById('btn-resume').addEventListener('click', () => {
        if (game) game.togglePause();
    });
    
    document.getElementById('btn-restart').addEventListener('click', () => {
        document.getElementById('pause-overlay').classList.add('hidden');
        if (game) {
            game.stop();
            startLevel(game.currentLevelIndex);
        }
    });
    
    document.getElementById('btn-quit-level').addEventListener('click', () => {
        document.getElementById('pause-overlay').classList.add('hidden');
        if (game) game.stop();
        showScreen('main-menu');
        generateLevelSelect(); // 刷新进度
    });
    
    // 结算界面按钮（带关卡剧情+结局）
    document.getElementById('btn-next-level').addEventListener('click', () => {
        game.ui.hideResult();
        const nextIdx = game.currentLevelIndex + 1;
        if (nextIdx < LEVELS.length) {
            // 显示下一关开场剧情（已包含在startLevel中）
            startLevel(nextIdx);
        } else {
            // 最终结局
            if (typeof STORY !== 'undefined') {
                document.getElementById('story-overlay').classList.remove('hidden');
                STORY.play(STORY.ending.victory, 'story-container', () => {
                    document.getElementById('story-overlay').classList.add('hidden');
                    showScreen('main-menu');
                    generateLevelSelect();
                });
            } else {
                showScreen('main-menu');
                generateLevelSelect();
            }
        }
    });
    
    document.getElementById('btn-retry').addEventListener('click', () => {
        game.ui.hideResult();
        startLevel(game.currentLevelIndex);
    });
    
    document.getElementById('btn-back-menu').addEventListener('click', () => {
        game.ui.hideResult();
        if (game) game.stop();
        showScreen('main-menu');
        generateLevelSelect();
    });
    
    // 观察笔记现已自动消失，无需手动关闭

    // ====== Canvas输入事件 ======
    const canvas = document.getElementById('game-canvas');
    
    canvas.addEventListener('mousemove', (e) => {
        if (!game || !game.map) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - game.offsetX;
        const my = e.clientY - rect.top - game.offsetY;
        
        const grid = pixelToGrid(mx, my, CONFIG.TILE_SIZE);
        game.hoveredGrid = grid;
        
        canvas.style.cursor = 'default';
        
        if (game.isPlacingMode && game.selectedTowerDef) {
            canvas.style.cursor = game.canPlaceTower(grid.col, grid.row, game.selectedTowerDef) ? 'pointer' : 'not-allowed';
        }
    });
    
    canvas.addEventListener('click', (e) => {
        if (!game || !game.map) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - game.offsetX;
        const my = e.clientY - rect.top - game.offsetY;
        
        const grid = pixelToGrid(mx, my, CONFIG.TILE_SIZE);
        
        if (game.isPlacingMode && game.selectedTowerDef) {
            // 尝试放置塔
            if (game.placeTower(grid.col, grid.row, game.selectedTowerDef)) {
                // 放置成功 → 退出放置模式，面板保持可见
                game.cancelPlacement();
                game.ui.update();
            } else {
                // 放置失败，退出放置模式
                game.cancelPlacement();
            }
        } else {
            // 选择已有塔
            const clickedTower = game.selectTowerAt(grid.col, grid.row);
            if (!clickedTower) {
                // 点击空白处取消选择
                game.deselectAllTowers();
                
                // 如果点击的是可建造区域，打开塔选择面板
                if (game.map.isBuildable(grid.col, grid.row)) {
                    document.getElementById('tower-panel').classList.remove('hidden');
                    game.cancelPlacement();
                }
            }
        }
    });
    
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!game || !game.map) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - game.offsetX;
        const my = e.clientY - rect.top - game.offsetY;
        const grid = pixelToGrid(mx, my, CONFIG.TILE_SIZE);
        
        // 右键取消放置模式
        if (game.isPlacingMode) {
            game.cancelPlacement();
            document.getElementById('tower-panel').classList.remove('hidden');
        } else {
            // 右键点击已有塔 → 出售
            const tower = game.selectTowerAt(grid.col, grid.row);
            if (tower) {
                const sellVal = tower.getSellValue();
                game.addFloatingText(tower.x, tower.y - 30, `出售 +${sellVal}🍃`, '#ffab00');
                game.sellTower(tower);
                game.deselectAllTowers();
            }
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        if (e.key === 'Escape') {
            if (game) {
                if (game.isPlacingMode) {
                    game.cancelPlacement();
                    document.getElementById('tower-panel').classList.remove('hidden');
                } else if (document.getElementById('game-screen').classList.contains('active')) {
                    game.togglePause();
                }
            }
        }
        
        // 空格键开始波次
        if (e.key === ' ' && game && game.waveManager && !game.waveManager.isRunning) {
            e.preventDefault();
            game.startNextWave();
        }
        
        // P键暂停
        if ((e.key === 'p' || e.key === 'P') && game) {
            game.togglePause();
        }
        
        // S键切换速度
        if ((e.key === 's' || e.key === 'S') && game) {
            game.toggleSpeed();
        }
    });
}

// ====== 图鉴标签切换 ======
function bindTabEvents() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // 切换标签激活状态
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切换内容
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}
