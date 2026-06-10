// ==================== 剧情系统（优化版）====================
const STORY = {
    // 角色配置
    characters: {
        '生命之树': { icon: '🌳', color: '#7cfc00', desc: '大地意志' },
        '系统':      { icon: '💻', color: '#4fc3f7', desc: '生态监控' },
        '???':       { icon: '❓', color: '#ffd54f', desc: '神秘声音' },
    },

    // ====== 每个关卡的开场剧情 ======
    levelIntros: [
        // 关卡0（第一章）：已在序章中覆盖，这里为空
        [],
        
        // 关卡1（第二章）开场
        [
            { speaker: '生命之树', text: '做得很好...我能感受到空气中的毒素在减少。', delay: 500 },
            { speaker: '生命之树', text: '但污染源还在。我感知到沿海区域——石油泄漏正在毒害海洋生物。', delay: 2500 },
            { speaker: '系统', text: '检测到海岸线污染：油污爬行者、酸雨云。水域环境需要特殊的净化塔。', delay: 2500 },
            { speaker: '生命之树', text: '去吧，守护者。海岸线需要你。睡莲和电鳗在水中能发挥更强力量。', delay: 2500 },
        ],
        
        // 关卡2（第三章）开场
        [
            { speaker: '生命之树', text: '海岸正在恢复...我能感觉到潮汐重新变得清澈。', delay: 500 },
            { speaker: '生命之树', text: '但城市废墟中的污染更加复杂。塑料、重金属、电子垃圾交缠在一起。', delay: 2500 },
            { speaker: '系统', text: '警告：检测到「塑料缝合兽」和「偷猎机甲」——它们是塑料污染和非法采矿的产物。', delay: 2500 },
            { speaker: '生命之树', text: '在城市中，你需要更强大的净化科技。再生工业系的塔已经解锁。', delay: 2500 },
            { speaker: '系统', text: '提示：塑料熔炼塔对塑料类敌人有高额特攻。堆肥发酵罐提供持续范围毒雾。', delay: 2500 },
        ],
        
        // 关卡3（第四章）开场
        [
            { speaker: '生命之树', text: '城市...终于安静了。我第一次感觉到真正的希望。', delay: 500 },
            { speaker: '系统', text: '警报！检测到大规模污染物聚合反应——「电子垃圾傀儡」正在工业区形成！', delay: 2500 },
            { speaker: '生命之树', text: '那是人类丢弃的电子废料…被污染的能量激活了。它会在行进中锈蚀你的防御塔。', delay: 2500 },
            { speaker: '系统', text: '新防御塔已可用：电鳗发射台（水域连锁闪电）、引力陷阱（拉扯聚集敌人）。', delay: 2500 },
        ],
        
        // 关卡4（第五章）开场
        [
            { speaker: '生命之树', text: '你正在一步步净化这个世界...但我感到了寒意。', delay: 500 },
            { speaker: '系统', text: '气候系统紊乱导致极地冰层异常融化——被冰封万年的放射性物质正在释放。', delay: 2500 },
            { speaker: '生命之树', text: '微生物群...它们是微塑料和工业化学物质结合的产物，极小、极快、极多。', delay: 2500 },
            { speaker: '系统', text: '注意：微生物群速度快、数量多，会分裂。霜冻射线可有效减速冰封它们。', delay: 2500 },
        ],
        
        // 关卡5（第六章）开场
        [
            { speaker: '生命之树', text: '你来了...这可能是我们最后的对话。', delay: 500 },
            { speaker: '生命之树', text: '污染源的核心——所有的毒素、废料、辐射都在向最终聚集地集结。', delay: 2500 },
            { speaker: '系统', text: '终极污染聚合体：核废料蠕虫、电子垃圾傀儡、烟霾巨蟒…数以百计。', delay: 2500 },
            { speaker: '生命之树', text: '我所有的力量都已耗尽。这一战之后，要么重生，要么毁灭。', delay: 2500 },
            { speaker: '生命之树', text: '守护者...感谢你走到这里。不管结果如何，你都已经改变了这个世界。', delay: 3000 },
        ],
        
        // 关卡6（第七章）开场
        [
            { speaker: '系统', text: '六章净化完成。但深渊之底还有更可怕的污染源...', delay: 500 },
            { speaker: '生命之树', text: '那是人类百年倾倒的所有废料的汇集地。海底深渊中的毒泥正慢慢上涌。', delay: 3000 },
            { speaker: '生命之树', text: '如果那里爆发，前六章的努力将前功尽弃。', delay: 2500 },
            { speaker: '系统', text: '警告：深渊之底污染密度是地表10倍。必须阻止它上浮！', delay: 2500 },
        ],
        
        // 关卡7（第八章）开场
        [
            { speaker: '系统', text: '深渊暂时控制了...但所有污染源都在向一个点聚集。', delay: 500 },
            { speaker: '生命之树', text: '这是最后的反击。污染意识在凝聚它所有的力量。', delay: 2500 },
            { speaker: '生命之树', text: '废土终局——它想在被彻底净化前毁灭核心。', delay: 2500 },
            { speaker: '系统', text: '倒计时开始。建造最高效的防御网络。合理利用抽塔系统获取免费塔。', delay: 2500 },
        ],
        
        // 关卡8（第九章）开场
        [
            { speaker: '生命之树', text: '守护者...我最后的意识正在消散。', delay: 500 },
            { speaker: '系统', text: '终极污染聚合体正在突破所有防线——这是最后的战斗。', delay: 2500 },
            { speaker: '生命之树', text: '我所有的力量都给你...这一击之后，要么净世，要么沉沦。', delay: 2500 },
            { speaker: '生命之树', text: '感谢你，守护者。无论结果如何...你已是传奇。', delay: 3000 },
            { speaker: '系统', text: '最终净化 · 开始', delay: 1000 },
        ],
    ],
    
    // ====== 序章（仅第一次进游戏触发）=====
    prologue: [
        { speaker: '系统', text: '公元2042年，地球生态彻底崩溃...', delay: 500 },
        { speaker: '系统', text: '大气污染、塑料泛滥、核废料泄露——人类文明的代价将大地化为废土。', delay: 2000 },
        { speaker: '系统', text: '最后的希望：重启「生命之树」生态净化系统。', delay: 2000 },
        { speaker: '???', text: '你来了，守护者。', delay: 1500 },
        { speaker: '生命之树', text: '我是这片土地最后的意识。污染军团正向核心逼近——一旦我倒下，生态复苏将再无可能。', delay: 3000 },
        { speaker: '生命之树', text: '建造净化塔，阻挡污染。让绿色重新覆盖这片大地。', delay: 2500 },
        { speaker: '系统', text: '战斗吧，守护者。每一场胜利都让大地更接近复苏。', delay: 1500 },
    ],
    
    // ====== 胜利结局 ======
    ending: {
        victory: [
            { speaker: '生命之树', text: '看...绿色正在回归。', delay: 500 },
            { speaker: '系统', text: '空气净化指数：优。水质：纯净。土壤：开始恢复活性。', delay: 2500 },
            { speaker: '生命之树', text: '2042年，人类几乎毁灭了地球。但总有像你这样的人...愿意战斗到最后。', delay: 3000 },
            { speaker: '生命之树', text: '这不是结束，守护者。这是一个新的开始。', delay: 2000 },
            { speaker: '系统', text: '全剧终 · 感谢你成为生态守护者', delay: 2000 },
        ],
        defeat: [
            { speaker: '生命之树', text: '守护者...不要放弃...', delay: 500 },
            { speaker: '生命之树', text: '只要还有一线生机，生态就能重建。重新来过吧。', delay: 2500 },
            { speaker: '系统', text: '失败并非终点。每一场战斗都在为这个世界争取时间。', delay: 2500 },
        ]
    },
    
    // ====== 播放控制 ======
    _currentIndex: 0,
    _timer: null,
    _onEnd: null,
    _totalLines: 0,
    
    // 获取角色配置
    _charConf(name) {
        return this.characters[name] || { icon: '💬', color: '#c8e6c9', desc: '' };
    },
    
    // 播放一段故事
    play(storyData, containerId, onEnd) {
        this._currentIndex = 0;
        this._totalLines = storyData.length;
        this._onEnd = onEnd;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        container.classList.remove('hidden');
        
        // 顶部栏：语音 + 跳过按钮
        const headerEl = document.createElement('div');
        headerEl.className = 'story-header';
        
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'story-ctrl-btn';
        voiceBtn.textContent = typeof VOICE !== 'undefined' && VOICE._enabled ? '🔊 语音' : '🔇 静音';
        voiceBtn.addEventListener('click', () => {
            if (typeof VOICE !== 'undefined') {
                const on = VOICE.toggle();
                voiceBtn.textContent = on ? '🔊 语音' : '🔇 静音';
                if (!on) VOICE.stop();
            }
        });
        headerEl.appendChild(voiceBtn);
        
        // 进度提示
        const progressEl = document.createElement('div');
        progressEl.className = 'story-progress';
        headerEl.appendChild(progressEl);
        
        const skipBtn = document.createElement('button');
        skipBtn.className = 'story-ctrl-btn story-skip-btn';
        skipBtn.textContent = '跳过 ▸';
        skipBtn.addEventListener('click', () => {
            if (typeof VOICE !== 'undefined') VOICE.stop();
            if (this._timer) clearTimeout(this._timer);
            container.classList.add('hidden');
            if (this._onEnd) this._onEnd();
        });
        headerEl.appendChild(skipBtn);
        
        container.appendChild(headerEl);
        
        // 对话框容器
        const dialogBox = document.createElement('div');
        dialogBox.className = 'story-dialog';
        container.appendChild(dialogBox);
        
        // 底部点击提示
        const hintEl = document.createElement('div');
        hintEl.className = 'story-hint';
        hintEl.textContent = '点击继续 ▶';
        container.appendChild(hintEl);
        
        this._showNext(storyData, dialogBox, progressEl, container);
    },
    
    _showNext(storyData, dialogBox, progressEl, container) {
        if (this._currentIndex >= storyData.length) {
            container.classList.add('hidden');
            if (this._onEnd) this._onEnd();
            return;
        }
        
        const line = storyData[this._currentIndex];
        const total = this._totalLines;
        const current = this._currentIndex + 1;
        
        // 更新进度
        progressEl.innerHTML = `<span class="sp-dot">●</span> ${current}/${total}`;
        
        let charIdx = 0;
        
        if (typeof VOICE !== 'undefined') {
            VOICE.speak(line.speaker, line.text);
        }
        
        // 角色配置
        const ch = this._charConf(line.speaker);
        
        // 构建对话卡片
        dialogBox.innerHTML = '';
        dialogBox.style.animation = 'none';
        void dialogBox.offsetHeight;
        dialogBox.style.animation = 'storyFadeIn 0.45s ease';
        
        // 角色头部
        const charHeader = document.createElement('div');
        charHeader.className = 'story-char-header';
        charHeader.innerHTML = `
            <span class="story-char-icon" style="color:${ch.color}">${ch.icon}</span>
            <span class="story-char-name" style="color:${ch.color}">${line.speaker}</span>
            <span class="story-char-desc">${ch.desc}</span>
        `;
        dialogBox.appendChild(charHeader);
        
        // 说话内容
        const textSpan = document.createElement('div');
        textSpan.className = 'story-line';
        dialogBox.appendChild(textSpan);
        
        // 打字机效果
        const typeChar = () => {
            if (charIdx < line.text.length) {
                textSpan.textContent += line.text[charIdx];
                charIdx++;
                this._timer = setTimeout(typeChar, 28);
            } else {
                // 打字完成，添加闪烁光标
                textSpan.classList.add('story-line-done');
                this._timer = setTimeout(() => {
                    this._currentIndex++;
                    this._showNext(storyData, dialogBox, progressEl, container);
                }, line.delay || 1500);
            }
        };
        
        typeChar();
        
        // 点击推进
        const clickNext = () => {
            if (typeof VOICE !== 'undefined') VOICE.stop();
            if (this._timer) clearTimeout(this._timer);
            if (charIdx < line.text.length) {
                textSpan.textContent = line.text;
                charIdx = line.text.length;
                textSpan.classList.add('story-line-done');
                this._timer = setTimeout(() => {
                    this._currentIndex++;
                    this._showNext(storyData, dialogBox, progressEl, container);
                }, (line.delay || 1500) * 0.5);
            } else {
                this._currentIndex++;
                this._showNext(storyData, dialogBox, progressEl, container);
            }
        };
        const oldClick = dialogBox._clickHandler;
        if (oldClick) dialogBox.removeEventListener('click', oldClick);
        dialogBox.addEventListener('click', clickNext);
        dialogBox._clickHandler = clickNext;
    }
};
