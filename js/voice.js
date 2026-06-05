// ==================== 语音系统（Web Speech API TTS） ====================
const VOICE = {
    _enabled: true,
    _speaking: false,
    _voices: [],
    _voicesLoaded: false,
    _bestChinese: null,
    _bestMale: null,
    _bestFemale: null,
    
    toggle() {
        this._enabled = !this._enabled;
        if (!this._enabled) this.stop();
        return this._enabled;
    },
    
    stop() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this._speaking = false;
    },
    
    // 加载并分类所有可用语音
    _loadVoices() {
        if (!window.speechSynthesis || this._voicesLoaded) return;
        this._voices = window.speechSynthesis.getVoices();
        if (this._voices.length === 0) return;
        this._voicesLoaded = true;
        
        // 按语言和音色分类
        for (const v of this._voices) {
            // 最佳中文语音
            if (v.lang.startsWith('zh')) {
                if (!this._bestChinese || 
                    v.name.includes('Natural') || 
                    v.name.includes('Premium') ||
                    v.name.includes('Siri') ||
                    (v.lang === 'zh-CN' && !this._bestChinese.lang.startsWith('zh'))) {
                    this._bestChinese = v;
                }
                // 区分男女声
                if (v.name.includes('Female') || v.name.includes('女') || v.name.includes('Mei') || v.name.includes('Ting') || v.name.includes('Huihui'))
                    this._bestFemale = v;
                else if (v.name.includes('Male') || v.name.includes('男') || v.name.includes('Han'))
                    this._bestMale = v;
            }
        }
        
        // 如果没有中文女声，用英文女声代替
        if (!this._bestFemale) {
            this._bestFemale = this._voices.find(v => v.name.includes('Samantha') || v.name.includes('Female'));
        }
        // 如果没有中文男声，用英文男声
        if (!this._bestMale) {
            this._bestMale = this._voices.find(v => v.name.includes('Daniel') || v.name.includes('Male'));
        }
    },
    
    // 获取角色对应的语音
    _getVoiceFor(speaker) {
        this._loadVoices();
        
        switch (speaker) {
            case '生命之树':
                // 深沉男声或默认中文
                return this._bestMale || this._bestChinese || null;
            case '系统':
            case '???':
                // 中性女声或默认中文
                return this._bestFemale || this._bestChinese || null;
            default:
                return this._bestChinese || null;
        }
    },
    
    // 根据不同角色朗读
    speak(speaker, text, onEnd) {
        if (!this._enabled || !window.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }
        
        // 停止当前语音
        this.stop();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.voice = this._getVoiceFor(speaker);
        
        // 不同角色不同的语音参数
        switch (speaker) {
            case '系统':
                utterance.rate = 0.85;    // 正常稍慢
                utterance.pitch = 1.1;    // 稍高(偏中性)
                utterance.volume = 0.85;
                break;
            case '生命之树':
                utterance.rate = 0.7;     // 沉稳缓慢
                utterance.pitch = 0.75;   // 低沉(男性化)
                utterance.volume = 0.95;
                break;
            case '???':
                utterance.rate = 0.8;
                utterance.pitch = 0.95;
                utterance.volume = 0.75;
                break;
            default:
                utterance.rate = 0.85;
                utterance.pitch = 1;
                utterance.volume = 0.85;
        }
        
        this._speaking = true;
        utterance.onend = () => {
            this._speaking = false;
            if (onEnd) onEnd();
        };
        utterance.onerror = () => {
            this._speaking = false;
            if (onEnd) onEnd();
        };
        
        window.speechSynthesis.speak(utterance);
    },
    
    isSpeaking() {
        return this._speaking || (window.speechSynthesis && window.speechSynthesis.speaking);
    }
};

// 预加载语音列表
if (window.speechSynthesis) {
    // 立即获取(可能为空)
    window.speechSynthesis.getVoices();
    // 延迟再获取(保证加载完成)
    setTimeout(() => {
        VOICE._voicesLoaded = false;
        VOICE._loadVoices();
        console.log('[Voice] Loaded', VOICE._voices.length, 'voices');
    }, 300);
    // 某些浏览器需要更久的延迟
    setTimeout(() => {
        if (!VOICE._voicesLoaded) {
            VOICE._voicesLoaded = false;
            VOICE._loadVoices();
        }
    }, 1000);
}
