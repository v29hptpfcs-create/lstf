// ==================== 游戏配置 ====================
const CONFIG = {
    // 画布
    CANVAS_WIDTH: 1100,
    CANVAS_HEIGHT: 620,
    
    // 地图格子
    TILE_SIZE: 50,
    MAP_COLS: 22,
    MAP_ROWS: 12,
    
    // 基础
    STARTING_HP: 20,
    STARTING_CHLOROPHYLL: 150,
    STARTING_DEWDROP: 30,
    
    // 敌人基础速度系数
    ENEMY_BASE_SPEED: 1.0,
    
    // 颜色主题
    COLORS: {
        grassHealthy: '#3a7d34',
        grassLight: '#4caf50',
        withered: '#3e2723',
        witheredDark: '#2d1f1b',
        path: '#795548',
        pathLight: '#8d6e63',
        water: '#1565c0',
        waterLight: '#42a5f5',
        geothermal: '#bf360c',
        geothermalGlow: '#ff5722',
        treeCore: '#2e7d32',
        spawnPoint: '#4e342e',
        
        // UI
        panelBg: 'rgba(13,42,13,0.96)',
        panelBorder: 'rgba(76,175,80,0.3)',
        textPrimary: '#c8e6c9',
        textSecondary: '#81c784',
        
        // 塔类型颜色
        towerPlant: '#66bb6a',
        towerEnergy: '#ffd54f',
        towerAnimal: '#ce93d8',
        towerIndustrial: '#ff8a65',
        
        // 敌人类型颜色
        enemyFog: '#9e9e9e',
        enemyOil: '#3e2723',
        enemyPlastic: '#90a4ae',
        enemyMech: '#f44336',
        enemyAcid: '#ffc107',
        enemyBoss: '#b71c1c',
        
        // 资源
        chlorophyll: '#76ff03',
        dewdrop: '#00e5ff',
        
        // 净化效果
        purifyColor: 'rgba(124,252,0,0.35)',
    }
};

// ==================== 塔定义 ==================== 
const TOWER_DEFS = {
    // ---- 植物净化系 ----
    fern_cannon: {
        id: 'fern_cannon', name: '蕨菜水炮', icon: '🌿', category: 'plant',
        cost: { chlorophyll: 50, dewdrop: 0 },
        damage: 18, range: 120, fireRate: 1000, // ms
        desc: '喷射净化水流，对单体造成伤害并附加"潮湿"减速。',
        effect: 'slow', slowAmount: 0.35, slowDuration: 2000,
        projectileSpeed: 280, projectileColor: '#4fc3f7', projectileSize: 5,
        upgrades: [
            {
                name: '生态强化·古树守护者',
                icon: '🌳', cost: { chlorophyll: 80, dewdrop: 40 },
                damageMod: 1.6, rangeMod: 1.3, fireRateMod: 0.85, eco: true,
                special: 'summon_roots', rootDamage: 12, rootRange: 80,
                desc: '融入古树之力，攻击时概率召唤树根缠绕群怪'
            },
            {
                name: '高效净化·高压水炮',
                icon: '💦', cost: { chlorophyll: 60, dewdrop: 20 },
                damageMod: 2.2, rangeMod: 1.0, fireRateMod: 0.75, eff: true,
                aoeRadius: 45, aoeDamage: 10,
                desc: '高压水炮造成溅射伤害，但产生微量水渍污染'
            }
        ],
        noteTitle: '蕨类植物的净化力量',
        noteContent: '蕨类植物是地球上最古老的植物之一，能够通过叶片吸收空气中的有害微粒。一片成年蕨叶每月可净化约0.5立方米空气。湿地中的蕨类更是天然的"净水器"，其根系能过滤重金属。'
    },
    
    lily_platform: {
        id: 'lily_platform', name: '睡莲平台', icon: '🪷', category: 'plant',
        cost: { chlorophyll: 70, dewdrop: 15 },
        damage: 14, range: 140, fireRate: 1300,
        desc: '水面放置，范围攻击，几率将怪物困在藤蔓中。',
        requireWater: true,
        effect: 'root_chance', rootChance: 0.18, rootDuration: 2500,
        projectileSpeed: 180, projectileColor: '#80deea', projectileSize: 6,
        aoeRadius: 55,
        upgrades: [
            {
                name: '生态强化·莲心共鸣',
                icon: '🪼', cost: { chlorophyll: 100, dewdrop: 60 },
                damageMod: 1.4, rangeMod: 1.5, fireRateMod: 0.9, eco: true,
                auraType: 'heal_around', healAmount: 2, healRange: 100, healInterval: 3000,
                desc: '莲心共鸣为周围植物塔缓慢回复耐久'
            },
            {
                name: '高效净化·剧毒莲雾',
                icon: '☠️', cost: { chlorophyll: 75, dewdrop: 30 },
                damageMod: 1.9, rangeMod: 1.1, fireRateMod: 0.8, eff: true,
                poisonDamage: 6, poisonDuration: 4000,
                desc: '释放毒雾持续伤害敌人，微量污染周围水域'
            }
        ],
        noteTitle: '睡莲：水体净化者',
        noteContent: '睡莲不仅美丽，更是优秀的水质指示植物——它只在清洁的水域中绽放。其根系能有效吸收水中氮磷，抑制藻类繁殖。一平方米睡莲每月可吸收约8克氮元素。'
    },

    willow_sentry: {
        id: 'willow_sentry', name: '柳木哨塔', icon: '🎋', category: 'plant',
        cost: { chlorophyll: 35, dewdrop: 0 },
        damage: 12, range: 130, fireRate: 800,
        desc: '基础物理塔，造价低廉，攻速快。',
        projectileSpeed: 320, projectileColor: '#aed581', projectileSize: 4,
        upgrades: [
            {
                name: '生态强化·古树守护者',
                icon: '🌳', cost: { chlorophyll: 65, dewdrop: 35 },
                damageMod: 1.5, rangeMod: 1.2, fireRateMod: 0.9, eco: true,
                special: 'summon_roots', rootDamage: 10, rootRange: 70,
                desc: '柳根蔓延，攻击时有几率释放树根缠绕群怪'
            },
            {
                name: '高效净化·柳刃风暴',
                icon: '🍃', cost: { chlorophyll: 50, dewdrop: 15 },
                damageMod: 1.8, rangeMod: 1.0, fireRateMod: 0.65, eff: true,
                multiShot: 3, spreadAngle: 15,
                desc: '同时发射多枚柳叶弹丸，火力凶猛但消耗更多资源'
            }
        ],
        noteTitle: '柳树的韧性',
        noteContent: '柳树是极少数能从被砍伐的枝条中重新生长的树木，这种再生能力使其成为"生命顽强"的象征。柳树林每年每公顷可固碳约12吨，是优秀的碳汇树种。'
    },
    
    // ---- 清洁能源系 ----
    wind_vortex: {
        id: 'wind_vortex', name: '风力涡流机', icon: '💨', category: 'energy',
        cost: { chlorophyll: 65, dewdrop: 10 },
        damage: 16, range: 135, fireRate: 1100,
        desc: '范围气流攻击，高地加成，推开轻量敌人。',
        effect: 'pushback', pushForce: 25, pushChance: 0.25,
        projectileSpeed: 250, projectileColor: '#e0f7fa', projectileSize: 7,
        aoeRadius: 40, highlandBonus: 1.35,
        upgrades: [
            {
                name: '生态强化·清风环流',
                icon: '🌀', cost: { chlorophyll: 100, dewdrop: 50 },
                damageMod: 1.3, rangeMod: 1.4, fireRateMod: 0.88, eco: true,
                auraType: 'speed_aura', speedBonus: 0.15, auraRange: 120,
                desc: '清新气流提升周围友方塔的攻速'
            },
            {
                name: '高效净化·飓风撕裂',
                icon: '🌪️', cost: { chlorophyll: 80, dewdrop: 30 },
                damageMod: 2.0, rangeMod: 1.15, fireRateMod: 0.78, eff: true,
                knockbackForce: 50, stunChance: 0.12,
                desc: '强风击退并眩晕敌人，但可能吹散有益花粉'
            }
        ],
        noteTitle: '风能的清洁未来',
        noteContent: '一台2MW风力发电机每年可减少约3500吨二氧化碳排放，相当于种植约17万棵树。全球风电容量正以年均15%的速度增长，是最具潜力的清洁能源之一。'
    },
    
    solar_matrix: {
        id: 'solar_matrix', name: '太阳能矩阵', icon: '☀️', category: 'energy',
        cost: { chlorophyll: 80, dewdrop: 25 },
        damage: 25, range: 125, fireRate: 2200,
        desc: '充能后释放范围高温净化，对油污怪特攻。',
        chargeTime: 5000, chargeMultiplier: 3.0,
        vsOilMult: 2.2,
        projectileSpeed: 350, projectileColor: '#ffee58', projectileSize: 9,
        aoeRadius: 60,
        upgrades: [
            {
                name: '生态强化·光合圣殿',
                icon: '🌻', cost: { chlorophyll: 120, dewdrop: 70 },
                damageMod: 1.4, rangeMod: 1.3, fireRateMod: 0.85, eco: true,
                auraType: 'generate_dewdrop', dewdropGenAmount: 1, genInterval: 8000, auraRange: 160,
                desc: '高效光合作用定期产生纯净露珠'
            },
            {
                name: '高效净化·聚光熔炉',
                icon: '🔥', cost: { chlorophyll: 90, dewdrop: 40 },
                damageMod: 2.3, rangeMod: 1.1, fireRateMod: 0.7, eff: true,
                burnDamage: 8, burnDuration: 5000,
                desc: '聚焦阳光造成灼烧效果，高温会略微蒸干周边土壤水分'
            }
        ],
        noteTitle: '太阳能：取之不尽',
        noteContent: '地球每小时接收的太阳能量足以满足全人类一年的能源需求！目前太阳能板效率已达26%，而实验室数据已突破47%。每安装1千瓦太阳能系统，年减碳量约为0.8吨。'
    },
    
    geothermal_fissure: {
        id: 'geothermal_fissure', name: '地热裂隙', icon: '🌋', category: 'energy',
        cost: { chlorophyll: 90, dewdrop: 35 },
        damage: 38, range: 100, fireRate: 2400,
        desc: '高爆发伤害，需建在地热格，对周围有轻微震动。',
        requireGeothermal: true,
        shakeDamage: 2, shakeRange: 55,
        projectileSpeed: 400, projectileColor: '#ff7043', projectileSize: 11,
        aoeRadius: 50,
        upgrades: [
            {
                name: '生态强化·大地脉动',
                icon: '🏔️', cost: { chlorophyll: 130, dewdrop: 80 },
                damageMod: 1.3, rangeMod: 1.4, fireRateMod: 0.82, eco: true,
                purifyAdjacent: true, purifyRate: 0.02,
                desc: '温和的地热脉动加速相邻枯萎地块的净化'
            },
            {
                name: '高效净化·岩浆喷涌',
                icon: '🔴', cost: { chlorophyll: 100, dewdrop: 50 },
                damageMod: 2.5, rangeMod: 1.05, fireRateMod: 0.68, eff: true,
                lavaPool: true, lavaDamage: 15, lavaDuration: 6000,
                desc: '岩浆喷涌造成毁灭性伤害并留下熔岩池，但严重震裂地面'
            }
        ],
        noteTitle: '地热能：来自地心',
        noteContent: '地热发电是唯一不受天气影响的可再生能源。冰岛超过25%电力来自地热。一座典型地热电站的碳排放仅为燃气电厂的1/20，且几乎不消耗水资源。'
    },
    
    // ---- 动物伙伴系 ----
    bee_thrower: {
        id: 'bee_thrower', name: '蜂巢镖手', icon: '🐝', category: 'animal',
        cost: { chlorophyll: 55, dewdrop: 10 },
        damage: 10, range: 115, fireRate: 450,
        desc: '召唤蜜蜂快速攻击，优先攻击垃圾怪（清除固体污染）。',
        vsTrashMult: 1.8,
        multiShot: 3,
        projectileSpeed: 260, projectileColor: '#ffe082', projectileSize: 3,
        upgrades: [
            {
                name: '生态强化·蜂巢共生',
                icon: '🍯', cost: { chlorophyll: 85, dewdrop: 45 },
                damageMod: 1.3, rangeMod: 1.25, fireRateMod: 0.82, eco: true,
                honeyAura: true, honeyHeal: 1, honeyRange: 90,
                desc: '蜂蜜滋养周围植物塔，缓慢恢复耐久'
            },
            {
                name: '高效净化·狂蜂之怒',
                icon: '🐝‍🟨', cost: { chlorophyll: 65, dewdrop: 25 },
                damageMod: 2.0, rangeMod: 1.1, fireRateMod: 0.6, eff: true,
                swarmCount: 6, pierce: 2,
                desc: '大量蜜蜂穿透多个敌人，但过度采集影响授粉'
            }
        ],
        noteTitle: '蜜蜂：生态基石',
        noteContent: '蜜蜂为全球约75%的粮食作物授粉！一只工蜂一生只能酿造1/12茶匙蜂蜜，却飞行近900公里。然而过去30年里，蜜蜂数量下降了约40%。保护蜜蜂就是保护我们的食物来源。'
    },
    
    swift_return: {
        id: 'swift_return', name: '雨燕归巢', icon: '🦅', category: 'animal',
        cost: { chlorophyll: 70, dewdrop: 20 },
        damage: 22, range: 170, fireRate: 900,
        desc: '拦截飞行敌人，叼走敌方掉落物减少敌人资源获取。',
        antiAir: true, stealResource: true, stealChance: 0.2,
        projectileSpeed: 380, projectileColor: '#bcaaa4', projectileSize: 5,
        canHitFlyingOnly: false, // 可打地面但优先飞行的设计
        flyingPriority: true,
        upgrades: [
            {
                name: '生态强化·候鸟领航',
                icon: '🕊️', cost: { chlorophyll: 105, dewdrop: 55 },
                damageMod: 1.4, rangeMod: 1.5, fireRateMod: 0.85, eco: true,
                scoutReveal: true, revealRange: 200,
                desc: '扩大视野范围，暴露隐形敌人'
            },
            {
                name: '高效净化·猎鹰俯冲',
                icon: '⚡', cost: { chlorophyll: 85, dewdrop: 35 },
                damageMod: 2.2, rangeMod: 1.15, fireRateMod: 0.72, eff: true,
                critChance: 0.25, critMult: 2.5,
                desc: '精准俯冲造成暴击，但惊扰其他鸟类栖息'
            }
        ],
        noteTitle: '雨燕：天空的舞者',
        noteContent: '雨燕是世界上飞得最快的鸟类之一，时速可达353公里。它们可以在空中连续飞行10个月不着陆！雨燕是天然害虫控制者，每天可吃掉相当于自身体重1/3的昆虫。'
    },
    
    glow_mushroom: {
        id: 'glow_mushroom', name: '夜光蘑菇', icon: '🍄', category: 'animal',
        cost: { chlorophyll: 60, dewdrop: 15 },
        damage: 15, range: 110, fireRate: 1000,
        desc: '夜间自动强化，范围照明暴露隐形敌人。',
        nightBonus: 1.8, revealStealth: true, revealRange: 130,
        projectileSpeed: 200, projectileColor: '#ce93d8', projectileSize: 6,
        aoeRadius: 48,
        upgrades: [
            {
                name: '生态强化·菌丝网络',
                icon: '🕸️', cost: { chlorophyll: 90, dewdrop: 50 },
                damageMod: 1.35, rangeMod: 1.4, fireRateMod: 0.88, eco: true,
                myceliumNetwork: true, networkShareDmg: 0.2, networkRange: 150,
                desc: '菌丝网络连接所有蘑菇塔，共享部分伤害输出'
            },
            {
                name: '高效净化·孢子云爆',
                icon: '☁️', cost: { chlorophyll: 70, dewdrop: 30 },
                damageMod: 1.9, rangeMod: 1.15, fireRateMod: 0.78, eff: true,
                sporeCloudAoe: 80, sporeDamage: 5, sporeSlow: 0.2,
                desc: '释放大范围孢子云减速并伤害敌人，孢子可能影响有益微生物'
            }
        ],
        noteTitle: '真菌：地下英雄',
        noteContent: '真菌是地球最重要的分解者！一茶匙健康土壤中含有数十亿真菌细胞。菌丝网络被称为"木网"，可将信息在森林中传递。没有真菌，生态系统将在数周内崩溃。'
    },
    
    // ---- 再生工业系（中后期解锁）----
    plastic_melter: {
        id: 'plastic_melter', name: '塑料熔炼塔', icon: '♻️', category: 'industrial',
        cost: { chlorophyll: 100, dewdrop: 50 },
        damage: 28, range: 120, fireRate: 1300,
        desc: '发射回收塑料弹丸，对塑料魔有暴击和额外掉落。',
        vsPlasticMult: 2.5, plasticCritChance: 0.35, extraDropOnPlasticKill: true,
        unlockWave: 5,
        projectileSpeed: 270, projectileColor: '#b0bec5', projectileSize: 8,
        upgrades: [
            {
                name: '生态强化·循环之心',
                icon: '♻️', cost: { chlorophyll: 140, dewdrop: 90 },
                damageMod: 1.4, rangeMod: 1.2, fireRateMod: 0.85, eco: true,
                recyclePassive: true, recyclePercent: 0.08,
                desc: '被动回收战斗产生的废料，每击杀获得额外少量资源'
            },
            {
                name: '高效净化·熔融射线',
                icon: '🔶', cost: { chlorophyll: 110, dewdrop: 55 },
                damageMod: 2.3, rangeMod: 1.1, fireRateMod: 0.72, eff: true,
                meltArmor: true, armorShred: 0.15,
                desc: '高温射线削减敌人护甲，但熔炼过程释放微量有毒气体'
            }
        ],
        noteTitle: '塑料回收的现实',
        noteContent: '全球每年生产超4亿吨塑料，仅不到10%被回收。制造1吨原生塑料排放约6吨CO2，而回收塑料可减少70%能耗。一个普通塑料袋需400年以上才能自然降解。'
    },
    
    compost_fermentor: {
        id: 'compost_fermentor', name: '堆肥发酵罐', icon: '🫙', category: 'industrial',
        cost: { chlorophyll: 85, dewdrop: 40 },
        damage: 8, range: 90, fireRate: 2500,
        desc: '释放沼气云造成持续AOE伤害，死亡后产生养分强化周围植物塔。',
        aoeRadius: 65, dotDamage: 5, dotDuration: 4000, dotTick: 500,
        deathBuff: true, deathBuffAtkSpd: 0.3, deathBuffRange: 80, deathBuffDuration: 8000,
        unlockWave: 5,
        projectileSpeed: 120, projectileColor: '#8bc34a', projectileSize: 10,
        upgrades: [
            {
                name: '生态强化·沃土馈赠',
                icon: '🌾', cost: { chlorophyll: 120, dewdrop: 75 },
                damageMod: 1.2, rangeMod: 1.4, fireRateMod: 0.92, eco: true,
                soilBoost: true, soilBoostDmg: 0.2, soilBoostDuration: 10000,
                desc: '死亡后留下肥沃土壤，使周围植物塔伤害提升更久更强'
            },
            {
                name: '高效净化·剧毒沼气',
                icon: '☢️', cost: { chlorophyll: 95, dewdrop: 45 },
                damageMod: 2.2, rangeMod: 1.2, fireRateMod: 0.75, eff: true,
                toxicCloud: true, toxicDot: 8, toxicSlow: 0.25,
                desc: '剧毒沼气大幅增强伤害与减速效果，但严重污染土壤'
            }
        ],
        noteTitle: '堆肥：变废为宝',
        noteContent: '堆肥将有机废物转化为养分丰富的土壤改良剂！家庭堆肥可减少约30%的生活垃圾。1吨厨余垃圾经堆肥后可替代约0.2吨化学肥料，避免化肥造成的土壤板结和水体富营养化。'
    },

    // ---- 全新塔型 ---- 
    
    electric_eel: {
        id: 'electric_eel', name: '电鳗发射台', icon: '⚡', category: 'animal',
        cost: { chlorophyll: 75, dewdrop: 20 },
        damage: 15, range: 130, fireRate: 1500,
        desc: '发射高压电弧，连锁攻击3个目标，水域传导增伤50%。',
        requireWater: true,
        chainLightning: true, chainCount: 3, chainFalloff: 0.6,
        projectileSpeed: 500, projectileColor: '#00e5ff', projectileSize: 4,
        vsWaterBonus: 1.5,
        upgrades: [
            {
                name: '生态强化·电脉冲场',
                icon: '🌊', cost: { chlorophyll: 100, dewdrop: 60 },
                damageMod: 1.4, rangeMod: 1.3, eco: true,
                chainCount: 5, stunOnChain: true, stunDuration: 800,
                desc: '电弧增到5目标，命中时短暂眩晕敌人'
            },
            {
                name: '高效净化·高压电网',
                icon: '🔌', cost: { chlorophyll: 85, dewdrop: 35 },
                damageMod: 2.2, rangeMod: 1.1, fireRateMod: 0.85, eff: true,
                chainCount: 6, chainFalloff: 0.7,
                desc: '更高电压穿透更多目标，但会电离周围空气'
            }
        ],
        noteTitle: '电鳗：活体发电机',
        noteContent: '电鳗能产生高达860伏特的电压，足以击倒一匹马！它们通过特殊的电细胞产生电流。电流在淡水中传播效率高，这就是为什么电鳗在水中"攻击力"更强。'
    },

    algae_purifier: {
        id: 'algae_purifier', name: '藻类净化塔', icon: '🫧', category: 'plant',
        cost: { chlorophyll: 45, dewdrop: 10 },
        damage: 0, range: 100, fireRate: 3000,
        desc: '不攻击敌人，每3秒自动吸收周围枯萎地块，转化为🍃资源。吸附枯萎越多产量越高。',
        noAttack: true,
        purifyRange: 80, purifyRate: 0.05, purifyReward: 3,
        projectileSpeed: 0, projectileColor: '#a5d6a7', projectileSize: 0,
        upgrades: [
            {
                name: '生态强化·绿藻共生',
                icon: '🟢', cost: { chlorophyll: 60, dewdrop: 35 },
                purifyRate: 0.08, purifyReward: 5, eco: true,
                auraRange: 100, auraType: 'gen_dewdrop', dewdropGenAmount: 1, genInterval: 6000,
                desc: '加速吸附并定期产出💧露珠'
            },
            {
                name: '高效净化·超藻暴发',
                icon: '🔬', cost: { chlorophyll: 50, dewdrop: 20 },
                purifyRate: 0.12, purifyReward: 8, eff: true,
                desc: '超强吸附力快速净化土地但因过度生长消耗更多养分'
            }
        ],
        noteTitle: '藻类：地球的肺',
        noteContent: '全球50%以上的氧气由藻类产生！微藻吸收CO2的能力是树木的10倍。某些藻类还能吸收重金属，用于废水净化。每培养1公斤微藻可固定约1.8公斤CO2。'
    },

    gravity_trap: {
        id: 'gravity_trap', name: '引力陷阱', icon: '🪐', category: 'energy',
        cost: { chlorophyll: 95, dewdrop: 35 },
        damage: 12, range: 160, fireRate: 2000,
        desc: '创造引力区域，将周围敌人缓慢拉向中心并持续伤害。陷阱持续5秒。',
        gravityPull: true, pullStrength: 8, gravityRadius: 100,
        dotDamage: 8, dotInterval: 500,
        projectileSpeed: 100, projectileColor: '#e040fb', projectileSize: 10,
        upgrades: [
            {
                name: '生态强化·时空涟漪',
                icon: '🌀', cost: { chlorophyll: 120, dewdrop: 70 },
                damageMod: 1.5, rangeMod: 1.3, eco: true,
                gravityRadius: 140, pullStrength: 12,
                desc: '扩大引力范围，吸附所有敌人到一点'
            },
            {
                name: '高效净化·奇点聚爆',
                icon: '💥', cost: { chlorophyll: 100, dewdrop: 40 },
                damageMod: 2.5, fireRateMod: 0.8, eff: true,
                gravityExplode: true, explodeDamage: 80, gravityRadius: 120,
                desc: '陷阱结束时引发奇点爆炸造成范围伤害'
            }
        ],
        noteTitle: '引力：宇宙的胶水',
        noteContent: '引力是四种基本力中最弱却最远的。一个微型黑洞的质量相当于一座山却只有质子大小。引力波在2015年首次被探测到，开启了天文学的新时代。'
    },

    frost_emitter: {
        id: 'frost_emitter', name: '霜冻射线', icon: '❄️', category: 'energy',
        cost: { chlorophyll: 80, dewdrop: 25 },
        damage: 8, range: 140, fireRate: 600,
        desc: '持续冰冻射线，每次攻击叠加减速。叠加3次后冰冻敌人2秒。',
        frostStack: true, maxFrostStacks: 3, frostFreezeDuration: 2000,
        slowAmount: 0.25, slowDuration: 3000,
        projectileSpeed: 350, projectileColor: '#80deea', projectileSize: 5,
        upgrades: [
            {
                name: '生态强化·永冻领域',
                icon: '🧊', cost: { chlorophyll: 100, dewdrop: 60 },
                damageMod: 1.3, rangeMod: 1.2, eco: true,
                maxFrostStacks: 5, frostFreezeDuration: 3000,
                auraType: 'speed_aura', speedBonus: 0.1, auraRange: 100,
                desc: '更强冻住敌人并让周围塔获得微幅攻速加成'
            },
            {
                name: '高效净化·绝对零度',
                icon: '💠', cost: { chlorophyll: 90, dewdrop: 35 },
                damageMod: 2.5, fireRateMod: 0.85, eff: true,
                frostFreezeDuration: 3000, frostExplode: true, explodeDamage: 40,
                desc: '冰冻结束时造成碎裂伤害但极寒可能冻伤植物塔'
            }
        ],
        noteTitle: '冰：变化中的危机',
        noteContent: '北极海冰面积每10年减少约13%。格陵兰冰盖每年融化约2800亿吨。如果全部融化，全球海平面将上升约7米。保护极地不仅是生态问题，更是人类的生存问题。'
    }
};

// ==================== 敌人定义 ====================
const ENEMY_DEFS = {
    fog_cloud: {
        id: 'fog_cloud', name: '灰雾团', icon: '🌫️', type: 'fog',
        hp: 40, speed: 3.0, reward: { chlorophyll: 8, dewdrop: 1 },
        color: '#9e9e9e', radius: 14,
        desc: '空气污染化身，移动缓慢，致盲周围的防御塔使其攻击落空。',
        ability: 'blind', blindRadius: 60, blindChance: 0.3,
        noteTitle: '雾霾的危害',
        noteContent: 'PM2.5颗粒物直径小于2.5微米，可直接进入肺泡甚至血液。世界卫生组织估计，全球每年约700万人因空气污染过早死亡。减少化石燃料使用是治理雾霾的根本途径。'
    },
    
    oil_crawler: {
        id: 'oil_crawler', name: '油污爬行者', icon: '🛢️', type: 'oil',
        hp: 70, speed: 2.0, reward: { chlorophyll: 12, dewdrop: 2 },
        color: '#3e2723', radius: 16,
        desc: '石油污染怪物，经过地块会再次污染地面，死后留下油渍减速友方。',
        ability: 'pollute_ground', polluteRadius: 35,
        deathEffect: 'oil_puddle', oilPuddleRadius: 40, oilPuddleSlow: 0.3, oilPuddleDuration: 5000,
        noteTitle: '石油污染',
        noteContent: '一升石油可污染100万升饮用水！海洋石油泄漏会在海面形成油膜阻止氧气交换，导致海洋生物大面积死亡。1989年埃克森·瓦尔迪兹号泄漏了3.7万吨原油，影响持续至今。'
    },
    
    plastic_beast: {
        id: 'plastic_beast', name: '塑料缝合兽', icon: '🥤', type: 'plastic',
        hp: 160, speed: 1.5, reward: { chlorophyll: 20, dewdrop: 5 },
        color: '#90a4ae', radius: 19,
        desc: '白色污染集合体，血量高，物理抗性强，死亡分裂成小塑料粒。',
        physResist: 0.35,
        ability: 'split', splitCount: 3, splitEnemy: 'plastic_shard',
        noteTitle: '白色污染危机',
        noteContent: '全球已生产超过83亿吨塑料，其中63%成为废弃物。微塑料已遍布从珠峰到马里亚纳海沟的所有角落。每人每周平均摄入约5克微塑料，相当于一张银行卡的重量。'
    },
    
    poacher_mech: {
        id: 'poacher_mech', name: '偷猎机甲', icon: '🤖', type: 'mech',
        hp: 55, speed: 4.0, reward: { chlorophyll: 15, dewdrop: 4 },
        color: '#f44336', radius: 15,
        desc: '盗猎行为机械化产物，高速移动，优先攻击动物伙伴系防御塔。',
        ability: 'target_animal', animalTargetPriority: true,
        noteTitle: '非法盗猎',
        noteContent: '每年约有3万头非洲象被盗猎者杀害取象牙。犀牛、老虎等物种因偷猎濒临灭绝。野生动物非法贸易是全球第四大非法交易，年价值高达200亿美元。'
    },
    
    acid_rain_cloud: {
        id: 'acid_rain_cloud', name: '酸雨云', icon: '☁️', type: 'acid',
        hp: 45, speed: 2.5, reward: { chlorophyll: 14, dewdrop: 3 },
        color: '#ffc107', radius: 16,
        isFlying: true,
        desc: '酸雨化形，飞行单位，造成AOE腐蚀伤害降低塔防耐久。',
        ability: 'acid_aoe', acidRadius: 50, acidDamage: 3, acidTick: 1000,
        noteTitle: '酸雨之殇',
        noteContent: '酸雨pH值低于5.6，主要由二氧化硫和氮氧化物形成。欧洲中部曾出现pH值低至2.6的极端酸雨（比醋还酸）。酸雨导致湖泊酸化、森林枯萎、建筑物腐蚀，每年造成数百亿美元损失。'
    },
    
    defiler_troll: {
        id: 'defiler_troll', name: '砍伐者巨魔', icon: '🪓', type: 'defiler',
        hp: 220, speed: 1.2, reward: { chlorophyll: 30, dewdrop: 8 },
        color: '#5d4037', radius: 21,
        desc: '滥砍滥伐的恶灵，高攻近战，直接攻击摧毁植物系防御塔。',
        ability: 'attack_towers', attackDamage: 25, attackRange: 40, targetPlantTowers: true,
        noteTitle: '消失的森林',
        noteContent: '地球每年失去约1000万公顷森林，面积相当于一个冰岛。亚马逊雨林提供了全球20%的氧气，被称为"地球之肺"。按当前速率，2050年前热带雨林可能从地表消失。'
    },
    
    nuclear_worm: {
        id: 'nuclear_worm', name: '核废料蠕虫', icon: '☢️', type: 'boss',
        hp: 800, speed: 1.0, reward: { chlorophyll: 100, dewdrop: 40 },
        color: '#b71c1c', radius: 28,
        isBoss: true,
        desc: '核污染终极BOSS，持续辐射伤害周围所有单位，必须用多层净化链应对。',
        ability: 'radiation', radiationRadius: 90, radiationDamage: 5, radiationTick: 500,
        noteTitle: '核废料的千年难题',
        noteContent: '核废料中的钚-239半衰期长达2.4万年，人类文明史不过数千年。全球累积已有超过36万吨高放射性核废料待处理。深地质处置是目前最可行的方案，但仍面临技术与伦理挑战。'
    },
    
    // 分裂子单位
    plastic_shard: {
        id: 'plastic_shard', name: '小塑料粒', icon: '🔵', type: 'plastic',
        hp: 25, speed: 3.0, reward: { chlorophyll: 4, dewdrop: 1 },
        color: '#b0bec5', radius: 9,
        desc: '塑料缝合兽分裂出的碎片',
        isFragment: true,
    },

    // ====== 新增敌人 ======

    e_waste_golem: {
        id: 'e_waste_golem', name: '电子垃圾傀儡', icon: '💻', type: 'mech',
        hp: 350, speed: 1.0, reward: { chlorophyll: 35, dewdrop: 10 },
        color: '#4e342e', radius: 22,
        desc: '废弃电子元件聚合体，高血量，每次攻击污染周围地块并给塔附加"锈蚀"减攻速。',
        isBoss: true,
        ability: 'rust_aura', rustRadius: 70, rustSlow: 0.2, rustDamage: 5, rustDuration: 3000,
        noteTitle: '电子垃圾危机',
        noteContent: '全球每年产生超过5000万吨电子垃圾，其中仅20%被正规回收。一台废弃手机含有的金、银、铜等金属足够提炼出价值约1美元的材料。电子垃圾中的铅和汞如不妥善处理会严重污染土壤。'
    },

    smog_serpent: {
        id: 'smog_serpent', name: '烟霾巨蟒', icon: '🐉', type: 'fog',
        hp: 120, speed: 2.5, reward: { chlorophyll: 18, dewdrop: 5 },
        color: '#616161', radius: 18,
        isFlying: true,
        desc: '工业废气凝聚的飞行怪物，移动路径留下持续雾团，减速并伤害经过的友方。',
        ability: 'toxic_trail', trailDuration: 3000, trailDamage: 3, trailSlow: 0.3, trailInterval: 500,
        noteTitle: '工业废气的危害',
        noteContent: '工业废气中含有大量二氧化硫、氮氧化物和PM2.5颗粒物。这些物质不仅危害人体健康，还会形成酸雨、破坏臭氧层。中国目前正在推行"超低排放"政策，要求燃煤电厂污染物排放达到天然气水平。'
    },

    microbe_swarm: {
        id: 'microbe_swarm', name: '微生物群', icon: '🦠', type: 'trash',
        hp: 15, speed: 5.0, reward: { chlorophyll: 3, dewdrop: 1 },
        color: '#e91e63', radius: 6,
        desc: '极微小污染物聚合体，速度极快，死亡分裂2个更小的微生物。',
        isFragment: true,
        ability: 'micro_split', splitCount: 2, splitEnemy: 'microbe_mite',
        noteTitle: '微塑料污染',
        noteContent: '微塑料是直径小于5毫米的塑料碎片，已经出现在全球各个角落——从马里亚纳海沟到珠穆朗玛峰。每人每周可能摄入约5克微塑料，相当于一张信用卡的重量。'
    },

    microbe_mite: {
        id: 'microbe_mite', name: '微尘螨', icon: '🔬', type: 'trash',
        hp: 5, speed: 6.0, reward: { chlorophyll: 1, dewdrop: 0 },
        color: '#f48fb1', radius: 4,
        desc: '微生物群分裂出的更小微粒',
        isFragment: true,
    }
};

// ==================== 关卡定义 ====================
const LEVELS = [
    {
        id: 1, name: '第一章：迷雾初现', subtitle: '雾中森林 - 入门教学',
        theme: 'forest',
        waves: [
            // Wave 1: 教学 - 少量灰雾团
            { enemies: [{ type: 'fog_cloud', count: 5, interval: 1100 }], delay: 0 },
            // Wave 2: 灰雾 + 油污
            { enemies: [{ type: 'fog_cloud', count: 8, interval: 900 }, { type: 'oil_crawler', count: 3, interval: 2200 }], delay: 0 },
            // Wave 3: 更多敌人+引入偷猎机甲
            { enemies: [{ type: 'fog_cloud', count: 10, interval: 800 }, { type: 'oil_crawler', count: 5, interval: 1800 }, { type: 'poacher_mech', count: 1, interval: 0 }], delay: 0 },
            // Wave 4: 塑料兽+酸雨云
            { enemies: [{ type: 'fog_cloud', count: 8, interval: 750 }, { type: 'oil_crawler', count: 4, interval: 2000 }, { type: 'plastic_beast', count: 2, interval: 4000 }, { type: 'acid_rain_cloud', count: 2, interval: 3000 }], delay: 0 },
            // Wave 5: 大波次 + Boss级
            { enemies: [{ type: 'fog_cloud', count: 12, interval: 600 }, { type: 'oil_crawler', count: 6, interval: 1500 }, { type: 'plastic_beast', count: 3, interval: 3500 }, { type: 'poacher_mech', count: 3, interval: 2800 }, { type: 'defiler_troll', count: 1, interval: 0 }], delay: 0 },
        ],
        startingGold: 180, startingDewdrop: 35,
        // 地图布局 (0=路径, 1=可建造, 2=枯萎地块, 3=水源, 4=地热, 5=核心, 6=出生点)
        // 蛇形路径：出生点(左)→右→下→右→下→右(核心)
        mapData: [
            [6,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,1,1,2,2,2,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,2,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,2,2,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,2,2,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,5],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        pathCoords: null, // 由JS计算
        stars: { hp: [15, 18, 20], green: [40, 65, 85], recycle: [20, 40, 60] }
    },
    {
        id: 2, name: '第二章：哭泣的海岸', subtitle: '海岸防线',
        theme: 'coast',
        waves: [
            { enemies: [{ type: 'oil_crawler', count: 8, interval: 1300 }, { type: 'fog_cloud', count: 6, interval: 1000 }], delay: 0 },
            { enemies: [{ type: 'oil_crawler', count: 10, interval: 1100 }, { type: 'plastic_beast', count: 3, interval: 3800 }, { type: 'fog_cloud', count: 7, interval: 900 }], delay: 0 },
            { enemies: [{ type: 'acid_rain_cloud', count: 5, interval: 2800 }, { type: 'poacher_mech', count: 4, interval: 2200 }, { type: 'oil_crawler', count: 8, interval: 1000 }, { type: 'fog_cloud', count: 6, interval: 850 }], delay: 0 },
            { enemies: [{ type: 'plastic_beast', count: 4, interval: 3200 }, { type: 'acid_rain_cloud', count: 7, interval: 2000 }, { type: 'oil_crawler', count: 10, interval: 900 }, { type: 'poacher_mech', count: 3, interval: 2500 }], delay: 0 },
            { enemies: [{ type: 'defiler_troll', count: 2, interval: 7000 }, { type: 'plastic_beast', count: 5, interval: 2800 }, { type: 'acid_rain_cloud', count: 8, interval: 1800 }, { type: 'poacher_mech', count: 5, interval: 2000 }, { type: 'oil_crawler', count: 10, interval: 800 }], delay: 0 },
        ],
        startingGold: 200, startingDewdrop: 45,
        // 蛇形路径绕水域：出生点(左)→右→下→左→下→右(核心) 带水域
        mapData: [
            [6,0,0,0,0,0,1,1,1,1,1,1,3,3,3,1,1,1,1,1,1,1],
            [1,1,1,1,1,0,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1],
            [1,2,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,2,2,1,1,1,1,1],
            [1,1,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1],
            [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [12, 16, 20], green: [45, 70, 88], recycle: [25, 45, 65] }
    },
    {
        id: 3, name: '第三章：缺氧都市', subtitle: '城市废墟',
        theme: 'urban',
        waves: [
            { enemies: [{ type: 'poacher_mech', count: 7, interval: 1800 }, { type: 'acid_rain_cloud', count: 5, interval: 2200 }, { type: 'fog_cloud', count: 6, interval: 900 }], delay: 0 },
            { enemies: [{ type: 'defiler_troll', count: 2, interval: 6000 }, { type: 'poacher_mech', count: 8, interval: 1600 }, { type: 'acid_rain_cloud', count: 7, interval: 2000 }, { type: 'plastic_beast', count: 3, interval: 3200 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 1, interval: 0 }, { type: 'plastic_beast', count: 5, interval: 3000 }, { type: 'defiler_troll', count: 3, interval: 5000 }, { type: 'poacher_mech', count: 7, interval: 1600 }, { type: 'acid_rain_cloud', count: 6, interval: 2000 }], delay: 0 },
            { enemies: [{ type: 'plastic_beast', count: 6, interval: 2500 }, { type: 'acid_rain_cloud', count: 10, interval: 1500 }, { type: 'defiler_troll', count: 3, interval: 4500 }, { type: 'poacher_mech', count: 8, interval: 1400 }, { type: 'oil_crawler', count: 8, interval: 1000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 2, interval: 15000 }, { type: 'defiler_troll', count: 4, interval: 4000 }, { type: 'plastic_beast', count: 8, interval: 2000 }, { type: 'acid_rain_cloud', count: 12, interval: 1400 }, { type: 'poacher_mech', count: 10, interval: 1300 }, { type: 'oil_crawler', count: 8, interval: 900 }], delay: 0 },
        ],
        startingGold: 250, startingDewdrop: 55,
        // 复杂蛇形路径：出生点→右→下→左→下→右→下→左→下→右(核心)
        mapData: [
            [6,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,2,2,1,1,2,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1],
            [1,1,2,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,2,1,1,1,1,1,1,1,1,1,0,1,1,1,1,2,2,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,5],
            [1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        stars: { hp: [10, 15, 20], green: [50, 75, 90], recycle: [30, 50, 70] }
    },
    {
        id: 4, name: '第四章：钢铁废土', subtitle: '工业废墟 - 高级挑战',
        theme: 'urban',
        waves: [
            { enemies: [{ type: 'oil_crawler', count: 10, interval: 1000 }, { type: 'fog_cloud', count: 8, interval: 800 }, { type: 'e_waste_golem', count: 1, interval: 0 }], delay: 0 },
            { enemies: [{ type: 'plastic_beast', count: 5, interval: 3000 }, { type: 'smog_serpent', count: 3, interval: 2500 }, { type: 'acid_rain_cloud', count: 8, interval: 1800 }, { type: 'fog_cloud', count: 10, interval: 700 }], delay: 0 },
            { enemies: [{ type: 'defiler_troll', count: 3, interval: 5000 }, { type: 'e_waste_golem', count: 2, interval: 6000 }, { type: 'plastic_beast', count: 6, interval: 2500 }, { type: 'smog_serpent', count: 5, interval: 2000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 1, interval: 0 }, { type: 'microbe_swarm', count: 15, interval: 400 }, { type: 'defiler_troll', count: 4, interval: 4000 }, { type: 'plastic_beast', count: 8, interval: 2000 }, { type: 'e_waste_golem', count: 3, interval: 5000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 2, interval: 12000 }, { type: 'e_waste_golem', count: 5, interval: 4000 }, { type: 'microbe_swarm', count: 25, interval: 300 }, { type: 'smog_serpent', count: 8, interval: 1800 }, { type: 'defiler_troll', count: 5, interval: 3500 }], delay: 0 },
        ],
        startingGold: 300, startingDewdrop: 70,
        // 路径：S形快速路线
        mapData: [
            [6,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,2,2,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [8, 14, 20], green: [55, 80, 92], recycle: [35, 55, 75] }
    },
    {
        id: 5, name: '第五章：极寒冰原', subtitle: '冰封战场 - 生存考验',
        theme: 'forest',
        waves: [
            { enemies: [{ type: 'microbe_swarm', count: 20, interval: 400 }, { type: 'smog_serpent', count: 5, interval: 2000 }, { type: 'poacher_mech', count: 5, interval: 2000 }], delay: 0 },
            { enemies: [{ type: 'e_waste_golem', count: 3, interval: 5000 }, { type: 'microbe_swarm', count: 30, interval: 300 }, { type: 'acid_rain_cloud', count: 12, interval: 1400 }, { type: 'defiler_troll', count: 4, interval: 4500 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 2, interval: 10000 }, { type: 'smog_serpent', count: 10, interval: 1500 }, { type: 'e_waste_golem', count: 5, interval: 4000 }, { type: 'microbe_swarm', count: 40, interval: 250 }, { type: 'defiler_troll', count: 6, interval: 3000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 3, interval: 8000 }, { type: 'microbe_swarm', count: 50, interval: 200 }, { type: 'smog_serpent', count: 15, interval: 1200 }, { type: 'e_waste_golem', count: 8, interval: 3500 }, { type: 'acid_rain_cloud', count: 15, interval: 1000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 4, interval: 10000 }, { type: 'smog_serpent', count: 20, interval: 1000 }, { type: 'e_waste_golem', count: 10, interval: 3000 }, { type: 'microbe_swarm', count: 60, interval: 150 }, { type: 'defiler_troll', count: 10, interval: 2500 }], delay: 0 },
        ],
        startingGold: 350, startingDewdrop: 90,
        // 路径：纵向蛇形
        mapData: [
            [6,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [2,2,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,0],
            [1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,0],
            [1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [5, 12, 20], green: [60, 82, 95], recycle: [40, 60, 80] }
    },
    {
        id: 6, name: '第六章：最终净化', subtitle: '终极之战 - 生态复兴',
        theme: 'urban',
        waves: [
            { enemies: [{ type: 'fog_cloud', count: 20, interval: 400 }, { type: 'e_waste_golem', count: 5, interval: 4000 }, { type: 'microbe_swarm', count: 30, interval: 300 }, { type: 'smog_serpent', count: 8, interval: 1500 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 3, interval: 8000 }, { type: 'microbe_swarm', count: 50, interval: 200 }, { type: 'e_waste_golem', count: 8, interval: 3000 }, { type: 'smog_serpent', count: 15, interval: 1000 }, { type: 'acid_rain_cloud', count: 20, interval: 800 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 5, interval: 6000 }, { type: 'microbe_swarm', count: 70, interval: 150 }, { type: 'e_waste_golem', count: 12, interval: 2500 }, { type: 'smog_serpent', count: 20, interval: 800 }, { type: 'defiler_troll', count: 10, interval: 2000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 8, interval: 5000 }, { type: 'microbe_swarm', count: 100, interval: 100 }, { type: 'e_waste_golem', count: 15, interval: 2000 }, { type: 'smog_serpent', count: 30, interval: 600 }, { type: 'defiler_troll', count: 12, interval: 1800 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 10, interval: 4000 }, { type: 'microbe_swarm', count: 120, interval: 80 }, { type: 'e_waste_golem', count: 20, interval: 1500 }, { type: 'smog_serpent', count: 40, interval: 500 }, { type: 'defiler_troll', count: 15, interval: 1500 }], delay: 0 },
        ],
        startingGold: 400, startingDewdrop: 120,
        // 路径：全图蜿蜒
        mapData: [
            [6,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [2,2,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,0],
            [1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,0],
            [1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [3, 10, 20], green: [70, 88, 98], recycle: [50, 70, 90] }
    },
    {
        id: 7, name: '第七章：深渊之底', subtitle: '海底深渊 - 极限生存',
        theme: 'coast',
        waves: [
            { enemies: [{ type: 'microbe_swarm', count: 40, interval: 200 }, { type: 'smog_serpent', count: 15, interval: 1200 }, { type: 'e_waste_golem', count: 5, interval: 4000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 4, interval: 6000 }, { type: 'microbe_swarm', count: 60, interval: 150 }, { type: 'acid_rain_cloud', count: 25, interval: 800 }, { type: 'defiler_troll', count: 10, interval: 2000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 6, interval: 5000 }, { type: 'microbe_swarm', count: 80, interval: 120 }, { type: 'e_waste_golem', count: 10, interval: 3000 }, { type: 'smog_serpent', count: 25, interval: 800 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 10, interval: 4000 }, { type: 'microbe_swarm', count: 120, interval: 80 }, { type: 'e_waste_golem', count: 15, interval: 2000 }, { type: 'defiler_troll', count: 15, interval: 1500 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 15, interval: 3000 }, { type: 'microbe_swarm', count: 200, interval: 50 }, { type: 'e_waste_golem', count: 20, interval: 1500 }, { type: 'smog_serpent', count: 40, interval: 500 }, { type: 'defiler_troll', count: 20, interval: 1000 }], delay: 0 },
        ],
        startingGold: 500, startingDewdrop: 150,
        mapData: [
            [6,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,3,3,3,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,2,2,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [1, 8, 20], green: [75, 90, 99], recycle: [60, 80, 95] }
    },
    {
        id: 8, name: '第八章：废土终局', subtitle: '污染深渊 - 最后的净化',
        theme: 'urban',
        waves: [
            { enemies: [{ type: 'nuclear_worm', count: 8, interval: 4000 }, { type: 'microbe_swarm', count: 80, interval: 100 }, { type: 'e_waste_golem', count: 12, interval: 2500 }, { type: 'smog_serpent', count: 30, interval: 600 }, { type: 'defiler_troll', count: 15, interval: 1500 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 12, interval: 3500 }, { type: 'microbe_swarm', count: 150, interval: 60 }, { type: 'e_waste_golem', count: 18, interval: 2000 }, { type: 'smog_serpent', count: 40, interval: 400 }, { type: 'poacher_mech', count: 30, interval: 800 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 20, interval: 2500 }, { type: 'microbe_swarm', count: 250, interval: 30 }, { type: 'e_waste_golem', count: 25, interval: 1500 }, { type: 'smog_serpent', count: 50, interval: 300 }, { type: 'plastic_beast', count: 30, interval: 1000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 30, interval: 2000 }, { type: 'microbe_swarm', count: 350, interval: 20 }, { type: 'e_waste_golem', count: 30, interval: 1200 }, { type: 'defiler_troll', count: 25, interval: 1000 }, { type: 'smog_serpent', count: 60, interval: 200 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 40, interval: 1500 }, { type: 'microbe_swarm', count: 500, interval: 10 }, { type: 'e_waste_golem', count: 40, interval: 1000 }, { type: 'smog_serpent', count: 80, interval: 100 }, { type: 'defiler_troll', count: 30, interval: 800 }], delay: 0 },
        ],
        startingGold: 600, startingDewdrop: 200,
        mapData: [
            [6,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0],
            [2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
            [1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [1, 5, 20], green: [80, 95, 100], recycle: [70, 85, 98] }
    },
    {
        id: 9, name: '第九章：新世界', subtitle: '终极之战 - 生态复兴',
        theme: 'forest',
        waves: [
            { enemies: [{ type: 'nuclear_worm', count: 15, interval: 3000 }, { type: 'microbe_swarm', count: 150, interval: 50 }, { type: 'e_waste_golem', count: 20, interval: 2000 }, { type: 'smog_serpent', count: 50, interval: 400 }, { type: 'defiler_troll', count: 20, interval: 1000 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 25, interval: 2000 }, { type: 'microbe_swarm', count: 300, interval: 25 }, { type: 'e_waste_golem', count: 30, interval: 1500 }, { type: 'smog_serpent', count: 80, interval: 200 }, { type: 'plastic_beast', count: 40, interval: 800 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 40, interval: 1500 }, { type: 'microbe_swarm', count: 500, interval: 15 }, { type: 'e_waste_golem', count: 50, interval: 1000 }, { type: 'smog_serpent', count: 120, interval: 100 }, { type: 'defiler_troll', count: 40, interval: 600 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 60, interval: 1000 }, { type: 'microbe_swarm', count: 800, interval: 8 }, { type: 'e_waste_golem', count: 80, interval: 800 }, { type: 'smog_serpent', count: 200, interval: 50 }, { type: 'defiler_troll', count: 60, interval: 400 }], delay: 0 },
            { enemies: [{ type: 'nuclear_worm', count: 100, interval: 800 }, { type: 'microbe_swarm', count: 1200, interval: 5 }, { type: 'e_waste_golem', count: 100, interval: 600 }, { type: 'smog_serpent', count: 300, interval: 30 }, { type: 'defiler_troll', count: 80, interval: 300 }], delay: 0 },
        ],
        startingGold: 800, startingDewdrop: 300,
        mapData: [
            [6,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [2,2,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0],
            [1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5],
        ],
        stars: { hp: [1, 3, 20], green: [85, 98, 100], recycle: [80, 90, 99] }
    }
];

// ==================== 科技树 ==================== 
const TECH_TREE = [
    { id: 'organic farming', name: '有机农业', icon: '🌾', cost: 5, maxLevel: 3, effect: 'plant_cost_reduce', value: [0.08, 0.15, 0.25], desc: '植物塔造价降低' },
    { id: 'clean_energy', name: '清洁能源推广', icon: '⚡', cost: 6, maxLevel: 3, effect: 'energy_start_charge', value: [10, 20, 35], desc: '能源系塔初始充能增加%' },
    { id: 'plastic_ban', name: '禁塑令', icon: '🚫', cost: 8, maxLevel: 2, effect: 'vs_plastic_damage', value: [0.15, 0.30], desc: '对塑料类敌人伤害提升' },
    { id: 'habitat', name: '栖息地修复', icon: '🦋', cost: 7, maxLevel: 2, effect: 'animal_partner_count', value: [1, 2], desc: '动物塔伙伴数量+1' },
    { id: 'rain_collect', name: '雨水收集', icon: '🌧️', cost: 10, maxLevel: 1, effect: 'free_purify_rain', value: [true], desc: '关卡开始赠送一次性全图净化降雨' },
    { id: 'citizen_science', name: '公民科学', icon: '🔬', cost: 5, maxLevel: 3, effect: 'knowledge_bonus', value: [0.05, 0.10, 0.18], desc: '战斗中获得额外资源奖励%' },
];

// ==================== 增益植物（净化后随机生成）====================
const BONUS_PLANTS = {
    sunflower: { name: '向日葵', icon: '🌻', effect: 'speed_aura', value: 0.2, range: 100, color: '#ffeb3b', desc: '加速光环，提升范围内塔攻速' },
    morning_dew: { name: '晨露草', icon: '💎', effect: 'gen_dewdrop', value: 1, interval: 8000, color: '#e0f7fa', desc: '周期性产生纯净露珠' },
    healing_herb: { name: '疗愈草', icon: '🌿', effect: 'heal_towers', value: 2, interval: 4000, range: 90, color: '#69f0ae', desc: '缓慢修复周围塔的耐久' },
    butterfly_bush: { name: '蝶引花', icon: '🦋', effect: 'crit_aura', value: 0.1, range: 120, color: '#f8bbd9', desc: '轻微提升范围内塔的暴击率' },
};
