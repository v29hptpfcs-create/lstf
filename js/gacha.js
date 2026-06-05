// ==================== 防御塔抽取系统（主界面抽卡） ====================
const TOWER_GACHA = {
    // 塔稀有度
    RARITIES: {
        common: { weight: 70, name: '普通', color: '#a5d6a7', stars: '★' },
        rare: { weight: 22, name: '稀有', color: '#42a5f5', stars: '★★' },
        epic: { weight: 8, name: '史诗', color: '#ce93d8', stars: '★★★' },
    },
    
    // 塔的稀有度分配
    _rarityMap: {
        willow_sentry: 'common', fern_cannon: 'common', bee_thrower: 'common',
        algae_purifier: 'common', wind_vortex: 'common', glow_mushroom: 'common',
        lily_platform: 'rare', electric_eel: 'rare', frost_emitter: 'rare',
        gravity_trap: 'rare', solar_matrix: 'rare',
        swift_return: 'rare', compost_fermentor: 'rare',
        plastic_melter: 'epic', geothermal_fissure: 'epic',
    },
    
    // 获取已收集的塔
    getCollection() {
        try {
            const raw = localStorage.getItem('greenline_towers');
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    },
    
    // 保存收集的塔
    _saveCollection(col) {
        try {
            localStorage.setItem('greenline_towers', JSON.stringify(col));
        } catch(e) {}
    },
    
    // 获取生态结晶数量
    getCrystals() {
        try {
            return parseInt(localStorage.getItem('greenline_crystals') || '0');
        } catch(e) { return 0; }
    },
    
    // 添加生态结晶
    addCrystals(amount) {
        const current = this.getCrystals();
        const total = current + amount;
        try { localStorage.setItem('greenline_crystals', String(total)); } catch(e) {}
        return total;
    },
    
    // 消耗生态结晶
    spendCrystals(amount) {
        const current = this.getCrystals();
        if (current < amount) return false;
        try { localStorage.setItem('greenline_crystals', String(current - amount)); } catch(e) {}
        return true;
    },
    
    // 计算关卡奖励结晶数
    calcLevelReward(levelIndex, difficulty, victory) {
        if (!victory) return 0;
        const level = levelIndex + 1; // 1-based
        const base = 8 + level * 2;   // 关卡越高奖励越多
        const diffMul = difficulty === 'easy' ? 0.8 : difficulty === 'normal' ? 1.0 : difficulty === 'hard' ? 1.5 : 2.0;
        return Math.round(base * diffMul);
    },
    
    // 抽一张塔
    drawOnce() {
        if (!this.spendCrystals(30)) return null;
        
        // 按权重选稀有度
        const rarity = this._rollRarity();
        
        // 从该稀有度的塔中随机选一个
        const pool = Object.entries(this._rarityMap)
            .filter(([id, r]) => r === rarity)
            .map(([id]) => TOWER_DEFS[id])
            .filter(Boolean);
        if (pool.length === 0) return null;
        
        const def = pool[Math.floor(Math.random() * pool.length)];
        
        // 添加到收集
        const col = this.getCollection();
        col[def.id] = (col[def.id] || 0) + 1;
        this._saveCollection(col);
        
        return {
            def,
            rarity,
            count: col[def.id],
            stars: this.RARITIES[rarity].stars,
            color: this.RARITIES[rarity].color,
            name: this.RARITIES[rarity].name,
        };
    },
    
    // 十连抽
    drawTen() {
        if (!this.spendCrystals(250)) return null;
        const results = [];
        for (let i = 0; i < 10; i++) {
            // 十连保底：第10次必出稀有或史诗
            const rarity = (i === 9) ? this._rollRarity(true) : this._rollRarity();
            const pool = Object.entries(this._rarityMap)
                .filter(([id, r]) => r === rarity)
                .map(([id]) => TOWER_DEFS[id])
                .filter(Boolean);
            if (pool.length === 0) continue;
            const def = pool[Math.floor(Math.random() * pool.length)];
            const col = this.getCollection();
            col[def.id] = (col[def.id] || 0) + 1;
            this._saveCollection(col);
            results.push({
                def, rarity,
                count: col[def.id],
                stars: this.RARITIES[rarity].stars,
                color: this.RARITIES[rarity].color,
                name: this.RARITIES[rarity].name,
            });
        }
        return results;
    },
    
    // 抽稀有度（garanteedRare=true保证最少稀有）
    _rollRarity(guaranteedRare = false) {
        if (guaranteedRare) {
            return Math.random() < 0.3 ? 'epic' : 'rare';
        }
        const roll = Math.random() * 100;
        if (roll < this.RARITIES.common.weight) return 'common';
        if (roll < this.RARITIES.common.weight + this.RARITIES.rare.weight) return 'rare';
        return 'epic';
    },
    
    // 初始化（保存游戏引用）
    _gameRef: null,
    init(game) {
        this._gameRef = game;
    },
    
    // 获取所有已收集的塔（用于关卡内可用池）
    getAvailableTowers(excludeIds = []) {
        const col = this.getCollection();
        const collected = Object.keys(col).filter(id => col[id] > 0);
        // 如果有收集的塔，使用收集池+默认池
        if (collected.length > 0) {
            const result = collected.map(id => TOWER_DEFS[id]).filter(Boolean);
            // 加上默认的蕨菜水炮和柳木哨塔
            if (!collected.includes('fern_cannon')) result.unshift(TOWER_DEFS.fern_cannon);
            if (!collected.includes('willow_sentry')) result.unshift(TOWER_DEFS.willow_sentry);
            return result.filter(d => !excludeIds.includes(d.id));
        }
        // 新玩家：使用全部塔
        return Object.values(TOWER_DEFS).filter(d => !excludeIds.includes(d.id));
    },
    
    // ====== 关卡内免费抽取（每2波触发） ======
    _maxDraws: 8,
    _drawCountKey: 'greenline_draw_count',
    
    // 检查是否还有免费抽取次数
    canDraw() {
        const used = this._getDrawCount();
        return used < this._maxDraws;
    },
    
    _getDrawCount() {
        try { return parseInt(localStorage.getItem(this._drawCountKey) || '0'); } catch(e) { return 0; }
    },
    
    _saveDrawCount(count) {
        try { localStorage.setItem(this._drawCountKey, String(count)); } catch(e) {}
    },
    
    // 关卡内免费抽取：从可用塔池中随机选3个，玩家免费建1座
    draw() {
        if (!this.canDraw()) return null;
        
        const used = this._getDrawCount();
        const pool = this.getAvailableTowers();
        if (pool.length === 0) return null;
        
        // 随机选3个不同的塔
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const options = shuffled.slice(0, 3);
        
        this._saveDrawCount(used + 1);
        
        return {
            options: options,
            index: used + 1,
            onSelect: (def, game) => {
                // 免费建造
                if (game) {
                    game.selectTowerForPlacement(def);
                    return true;
                }
                return false;
            }
        };
    },
    
    // 重置关卡内免费抽取计数（新关卡开始时调用）
    resetDrawCount() {
        try { localStorage.removeItem(this._drawCountKey); } catch(e) {}
    }
};
