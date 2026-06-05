// ==================== 波次管理系统 ====================

class WaveManager {
    constructor(levelData) {
        this.waves = levelData.waves;
        this.currentWave = 0;
        this.totalWaves = this.waves.length;
        this.isRunning = false;
        this.isComplete = false;
        
        // 当前波次的敌人生成状态
        this.spawnQueue = [];      // 待生成的敌人队列 {type, count, interval}
        this.lastSpawnTime = 0;
        this.currentSpawnGroup = 0; // 当前正在生成的敌人组索引
        this.enemiesRemainingInWave = 0;
        
        // 统计
        this.totalEnemiesInLevel = 0;
        for (const wave of this.waves) {
            for (const group of wave.enemies) {
                this.totalEnemiesInLevel += group.count;
            }
        }
    }
    
    startWave(waveIndex) {
        if (waveIndex >= this.totalWaves) return false;
        if (this.isRunning) return false;
        
        this.currentWave = waveIndex + 1; // 显示用（1-based）
        this.isRunning = true;
        this.isComplete = false;
        
        const waveData = this.waves[waveIndex];
        this.spawnQueue = [];
        this.enemiesRemainingInWave = 0;
        
        // 展开所有敌人组到生成队列
        for (const group of waveData.enemies) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    interval: group.interval,
                    spawnDelay: group.interval * i // 每个敌人在组内间隔生成
                });
                this.enemiesRemainingInWave++;
            }
        }
        
        // 按时间排序
        this.spawnQueue.sort((a, b) => a.spawnDelay - b.spawnDelay);
        this.lastSpawnTime = Date.now();
        this.currentSpawnGroup = 0;
        
        return true;
    }
    
    update(now, game) {
        if (!this.isRunning || this.isComplete) return null;
        if (!game) return null;
        if (this.spawnQueue.length === 0) return null;
        
        // 检查是否该生成新敌人
        let spawned = null;
        const nowTime = now || Date.now();
        
        while (this.currentSpawnGroup < this.spawnQueue.length) {
            const spawn = this.spawnQueue[this.currentSpawnGroup];
            
            // currentWave 是 1-based 显示值
            const waveIndex = this.currentWave - 1;
            const waveDelay = (waveIndex >= 0 && this.waves[waveIndex]) ? (this.waves[waveIndex].delay || 0) : 0;
            
            if (nowTime - this.lastSpawnTime >= spawn.spawnDelay + waveDelay) {
                spawned = this.spawnEnemy(spawn.type, game);
                this.currentSpawnGroup++;
                
                if (spawned) {
                    this.enemiesRemainingInWave--;
                }
            } else {
                break;
            }
        }
        
        // 检查波次是否完成
        if (this.currentSpawnGroup >= this.spawnQueue.length && game && game.enemies && game.enemies.length === 0) {
            this.isRunning = false;
            this.isComplete = true;
        }
        
        return spawned;
    }
    
    spawnEnemy(typeId, game) {
        const def = ENEMY_DEFS[typeId];
        if (!def) return null;
        
        // 路径安全检测
        if (!game.map || !game.map.pathCoords || game.map.pathCoords.length < 2) {
            console.error('[Wave] 路径无效，无法生成敌人');
            return null;
        }
        
        // 首次生成时日志确认路径
        if (!this._firstSpawnLogged) {
            this._firstSpawnLogged = true;
            const pc = game.map.pathCoords;
            console.log('[Path] total points:', pc.length, 'first:', pc[0], 'last:', pc[pc.length-1]);
        }
        
        const enemy = new Enemy(def, game.map.pathCoords);
        // 如果敌人因路径无效被标记为死亡，不生成
        if (!enemy.alive) return null;
        
        // 波次难度递增：每波+8%血量,+3%速度
        const waveScale = Math.max(1, this.currentWave);
        const hpScale = 1 + (waveScale - 1) * 0.08;
        const speedScale = 1 + (waveScale - 1) * 0.03;
        enemy.maxHp = Math.round(enemy.maxHp * hpScale);
        enemy.hp = Math.round(enemy.hp * hpScale);
        enemy.baseSpeed *= speedScale;
        enemy.speed *= speedScale;
        
        // 难度系数
        if (game._difficulty) {
            enemy.maxHp = Math.round(enemy.maxHp * game._difficulty.enemyHp);
            enemy.hp = Math.round(enemy.hp * game._difficulty.enemyHp);
            enemy.baseSpeed *= game._difficulty.enemySpeed;
            enemy.speed *= game._difficulty.enemySpeed;
        }
        
        return enemy;
    }
    
    isAllWavesComplete() {
        return this.currentWave >= this.totalWaves && this.isComplete;
    }
    
    getProgress() {
        if (this.totalWaves === 0) return { current: 0, total: 0, percent: 0 };
        return {
            current: this.currentWave,
            total: this.totalWaves,
            percent: Math.floor(((this.currentWave - (this.isComplete ? 0 : 1)) / this.totalWaves) * 100)
        };
    }
}
