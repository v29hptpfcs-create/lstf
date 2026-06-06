// ==================== 2D 模型系统（SVG Sprite） ====================

const MODELS = {
    // ====== 防御塔 ======
    towers: {
        fern_cannon: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="118" rx="30" ry="8" fill="#5d4037" opacity="0.7"/>
            <rect x="52" y="95" width="36" height="26" rx="6" fill="#6d4c41"/>
            <rect x="56" y="98" width="28" height="20" rx="4" fill="#795548"/>
            <path d="M70,90 Q50,75 42,55" stroke="#2e7d32" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <ellipse cx="46" cy="62" rx="7" ry="4" fill="#388e3c" transform="rotate(-40,46,62)"/>
            <ellipse cx="50" cy="72" rx="6" ry="3.5" fill="#43a047" transform="rotate(-35,50,72)"/>
            <ellipse cx="53" cy="81" rx="5" ry="3" fill="#4caf50" transform="rotate(-25,53,81)"/>
            <path d="M70,90 Q90,75 98,55" stroke="#2e7d32" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <ellipse cx="94" cy="62" rx="7" ry="4" fill="#388e3c" transform="rotate(40,94,62)"/>
            <ellipse cx="90" cy="72" rx="6" ry="3.5" fill="#43a047" transform="rotate(35,90,72)"/>
            <ellipse cx="87" cy="81" rx="5" ry="3" fill="#4caf50" transform="rotate(25,87,81)"/>
            <path d="M70,90 Q70,68 70,48" stroke="#1b5e20" stroke-width="2.5" fill="none"/>
            <ellipse cx="70" cy="55" rx="5" ry="9" fill="#388e3c"/>
            <path d="M70,90 Q65,80 60,95" stroke="#1b5e20" stroke-width="2" fill="none"/>
            <ellipse cx="62" cy="92" rx="6" ry="3" fill="#4caf50" transform="rotate(20,62,92)"/>
            <rect x="66" y="70" width="8" height="28" rx="4" fill="#1565c0"/>
            <circle cx="70" cy="68" r="7" fill="#1976d2"/>
            <circle cx="70" cy="68" r="4" fill="#42a5f5"/>
            <circle cx="70" cy="68" r="2" fill="#e3f2fd"/>
        </svg>`,

        lily_platform: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="115" rx="40" ry="9" fill="#0d47a1" opacity="0.5"/>
            <ellipse cx="70" cy="115" rx="30" ry="6" fill="#1565c0" opacity="0.6"/>
            <path d="M70,110 L40,98 Q35,85 50,80 Q63,76 70,90 Q77,76 90,80 Q105,85 100,98 Z" fill="#2e7d32"/>
            <path d="M68,110 L70,100 L72,110" fill="#0a1f0a"/>
            <line x1="70" y1="100" x2="70" y2="72" stroke="#388e3c" stroke-width="3"/>
            <ellipse cx="70" cy="58" rx="7" ry="12" fill="#f48fb1"/>
            <ellipse cx="70" cy="58" rx="7" ry="12" fill="#f06292" transform="rotate(72,70,72)"/>
            <ellipse cx="70" cy="58" rx="7" ry="12" fill="#f48fb1" transform="rotate(144,70,72)"/>
            <ellipse cx="70" cy="58" rx="7" ry="12" fill="#f06292" transform="rotate(216,70,72)"/>
            <ellipse cx="70" cy="58" rx="7" ry="12" fill="#f48fb1" transform="rotate(288,70,72)"/>
            <circle cx="70" cy="72" r="8" fill="#ffcc02"/>
            <circle cx="70" cy="72" r="5" fill="#ffd54f"/>
            <circle cx="70" cy="72" r="3" fill="#fff176"/>
        </svg>`,

        willow_sentry: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <rect x="63" y="60" width="14" height="60" rx="5" fill="#5d4037"/>
            <rect x="65" y="62" width="10" height="56" rx="4" fill="#795548"/>
            <path d="M70,80 Q55,90 50,115" stroke="#81c784" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M70,78 Q58,88 55,112" stroke="#66bb6a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M70,82 Q84,92 88,116" stroke="#81c784" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M70,76 Q82,86 85,110" stroke="#66bb6a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q62,85 60,108" stroke="#a5d6a7" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M70,74 Q78,84 80,106" stroke="#a5d6a7" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <rect x="54" y="38" width="32" height="28" rx="4" fill="#4e342e"/>
            <rect x="56" y="40" width="28" height="24" rx="3" fill="#6d4c41"/>
            <rect x="58" y="48" width="8" height="8" rx="2" fill="#1a1a1a"/>
            <rect x="74" y="48" width="8" height="8" rx="2" fill="#1a1a1a"/>
            <rect x="67" y="22" width="6" height="20" rx="3" fill="#546e7a"/>
            <rect x="65" y="18" width="10" height="8" rx="4" fill="#78909c"/>
        </svg>`,

        algae_purifier: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="122" rx="22" ry="6" fill="#455a64"/>
            <rect x="60" y="110" width="20" height="14" rx="3" fill="#546e7a"/>
            <circle cx="70" cy="75" r="38" fill="none" stroke="#80cbc4" stroke-width="2" opacity="0.6"/>
            <circle cx="70" cy="75" r="36" fill="#002b2b" opacity="0.85"/>
            <ellipse cx="56" cy="58" rx="10" ry="7" fill="white" opacity="0.12"/>
            <circle cx="70" cy="65" r="8" fill="#00c853" opacity="0.9"/>
            <circle cx="55" cy="78" r="7" fill="#00e676" opacity="0.85"/>
            <circle cx="85" cy="78" r="7" fill="#00c853" opacity="0.85"/>
            <circle cx="63" cy="90" r="6" fill="#69f0ae" opacity="0.8"/>
            <circle cx="78" cy="90" r="6" fill="#00e676" opacity="0.8"/>
            <ellipse cx="70" cy="40" rx="20" ry="8" fill="#37474f"/>
            <ellipse cx="70" cy="38" rx="18" ry="6" fill="#546e7a"/>
            <circle cx="70" cy="33" r="5" fill="#455a64"/>
        </svg>`,

        wind_vortex: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="122" rx="28" ry="7" fill="#37474f"/>
            <rect x="57" y="105" width="26" height="20" rx="5" fill="#455a64"/>
            <circle cx="70" cy="75" r="42" fill="none" stroke="#e0e0e0" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.3"/>
            <circle cx="70" cy="75" r="34" fill="none" stroke="#b0bec5" stroke-width="2" stroke-dasharray="8 4" opacity="0.4"/>
            <circle cx="70" cy="75" r="26" fill="none" stroke="#90a4ae" stroke-width="2.5" stroke-dasharray="10 4" opacity="0.5"/>
            <circle cx="70" cy="75" r="8" fill="#546e7a"/>
            <circle cx="70" cy="75" r="5" fill="#78909c"/>
            <path d="M70,75 Q80,55 68,38" stroke="#b0bec5" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q80,55 68,38" stroke="#eceff1" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q90,82 108,73" stroke="#b0bec5" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q90,82 108,73" stroke="#eceff1" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q50,92 38,80" stroke="#b0bec5" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M70,75 Q50,92 38,80" stroke="#eceff1" stroke-width="2" fill="none" stroke-linecap="round"/>
            <circle cx="70" cy="75" r="5" fill="#cfd8dc"/>
        </svg>`,

        solar_matrix: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <line x1="70" y1="110" x2="40" y2="125" stroke="#546e7a" stroke-width="3"/>
            <line x1="70" y1="110" x2="100" y2="125" stroke="#546e7a" stroke-width="3"/>
            <line x1="70" y1="110" x2="70" y2="125" stroke="#546e7a" stroke-width="4"/>
            <ellipse cx="70" cy="124" rx="22" ry="5" fill="#455a64"/>
            <rect x="28" y="42" width="84" height="72" rx="6" fill="#1565c0"/>
            <rect x="30" y="44" width="80" height="68" rx="5" fill="#1976d2"/>
            <line x1="48" y1="44" x2="48" y2="112" stroke="#1565c0" stroke-width="1.5"/>
            <line x1="70" y1="44" x2="70" y2="112" stroke="#1565c0" stroke-width="1.5"/>
            <line x1="92" y1="44" x2="92" y2="112" stroke="#1565c0" stroke-width="1.5"/>
            <line x1="30" y1="62" x2="110" y2="62" stroke="#1565c0" stroke-width="1.5"/>
            <line x1="30" y1="80" x2="110" y2="80" stroke="#1565c0" stroke-width="1.5"/>
            <line x1="30" y1="98" x2="110" y2="98" stroke="#1565c0" stroke-width="1.5"/>
            <rect x="32" y="46" width="14" height="14" rx="2" fill="#42a5f5" opacity="0.6"/>
            <rect x="54" y="46" width="14" height="14" rx="2" fill="#1e88e5" opacity="0.5"/>
            <rect x="76" y="46" width="14" height="14" rx="2" fill="#42a5f5" opacity="0.6"/>
            <rect x="98" y="46" width="10" height="14" rx="2" fill="#1e88e5" opacity="0.5"/>
        </svg>`,

        geothermal_fissure: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="120" rx="38" ry="10" fill="#212121"/>
            <path d="M32,120 Q35,90 50,80 Q60,74 70,80 Q80,74 90,80 Q105,90 108,120 Z" fill="#1a1a1a"/>
            <path d="M36,120 Q38,95 50,86 Q60,80 70,86 Q80,80 90,86 Q102,95 104,120 Z" fill="#263238"/>
            <path d="M60,115 L65,95 L62,82 L68,68 L70,55 L72,68 L78,82 L75,95 L80,115" stroke="#ff6d00" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M62,105 L68,88 L72,88 L78,105" fill="#bf360c" opacity="0.8"/>
            <rect x="66" y="30" width="8" height="28" rx="4" fill="#b71c1c"/>
            <circle cx="70" cy="28" r="7" fill="#c62828"/>
            <circle cx="70" cy="28" r="4" fill="#ef5350"/>
        </svg>`,

        gravity_trap: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="55" fill="none" stroke="#7c4dff" stroke-width="1" opacity="0.3"/>
            <circle cx="70" cy="70" r="44" fill="none" stroke="#651fff" stroke-width="1.5" opacity="0.5"/>
            <line x1="70" y1="70" x2="70" y2="30" stroke="#b39ddb" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="110" y2="70" stroke="#b39ddb" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="70" y2="110" stroke="#b39ddb" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="30" y2="70" stroke="#b39ddb" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="98" y2="42" stroke="#9575cd" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="42" y2="98" stroke="#9575cd" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="98" y2="98" stroke="#9575cd" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="70" y1="70" x2="42" y2="42" stroke="#9575cd" stroke-width="1" stroke-dasharray="3 3"/>
            <radialGradient id="gc" cx="50%" cy="50%">
                <stop offset="0%" stop-color="#7c4dff"/>
                <stop offset="60%" stop-color="#3d5afe"/>
                <stop offset="100%" stop-color="#1a237e"/>
            </radialGradient>
            <circle cx="70" cy="70" r="24" fill="url(#gc)"/>
            <circle cx="70" cy="70" r="16" fill="#7c4dff" opacity="0.6"/>
            <circle cx="70" cy="70" r="10" fill="#b388ff"/>
            <circle cx="70" cy="70" r="5" fill="white" opacity="0.8"/>
        </svg>`,

        frost_emitter: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <polygon points="70,110 95,97 95,71 70,58 45,71 45,97" fill="#0d47a1" stroke="#80deea" stroke-width="2"/>
            <polygon points="70,106 91,95 91,73 70,62 49,73 49,95" fill="#1565c0"/>
            <line x1="70" y1="62" x2="70" y2="110" stroke="#80deea" stroke-width="0.8" opacity="0.5"/>
            <line x1="45" y1="71" x2="95" y2="97" stroke="#80deea" stroke-width="0.8" opacity="0.5"/>
            <line x1="95" y1="71" x2="45" y2="97" stroke="#80deea" stroke-width="0.8" opacity="0.5"/>
            <circle cx="70" cy="84" r="16" fill="#01579b"/>
            <circle cx="70" cy="84" r="12" fill="#0288d1"/>
            <circle cx="70" cy="84" r="8" fill="#29b6f6"/>
            <circle cx="70" cy="84" r="4" fill="#e1f5fe"/>
            <polygon points="70,40 62,68 78,68" fill="#80deea" opacity="0.8"/>
            <polygon points="70,40 64,68 76,68" fill="#e1f5fe" opacity="0.5"/>
            <line x1="70" y1="40" x2="70" y2="16" stroke="#80deea" stroke-width="4" opacity="0.9" stroke-linecap="round"/>
            <line x1="70" y1="40" x2="70" y2="16" stroke="white" stroke-width="2" opacity="0.5"/>
        </svg>`,

        bee_thrower: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <polygon points="70,120 100,103 100,69 70,52 40,69 40,103" fill="#f57f17" stroke="#f9a825" stroke-width="2"/>
            <polygon points="70,108 84,100 84,84 70,76 56,84 56,100" fill="#e65100" stroke="#ff8f00" stroke-width="1"/>
            <polygon points="70,76 79,71 79,61 70,56 61,61 61,71" fill="#e65100" stroke="#ff8f00" stroke-width="1"/>
            <polygon points="55,108 64,103 64,93 55,88 46,93 46,103" fill="#e65100" stroke="#ff8f00" stroke-width="1" opacity="0.7"/>
            <polygon points="85,108 94,103 94,93 85,88 76,93 76,103" fill="#e65100" stroke="#ff8f00" stroke-width="1" opacity="0.7"/>
            <circle cx="70" cy="92" r="5" fill="#bf360c"/>
            <ellipse cx="60" cy="50" rx="7" ry="5" fill="#fdd835"/>
            <line x1="56" y1="50" x2="57" y2="50" stroke="#212121" stroke-width="1.5"/>
            <line x1="58" y1="50" x2="59" y2="50" stroke="#212121" stroke-width="1.5"/>
            <line x1="60" y1="50" x2="61" y2="50" stroke="#212121" stroke-width="1.5"/>
            <ellipse cx="58" cy="46" rx="5" ry="3" fill="white" opacity="0.7" transform="rotate(-20,58,46)"/>
            <ellipse cx="62" cy="46" rx="5" ry="3" fill="white" opacity="0.7" transform="rotate(20,62,46)"/>
            <ellipse cx="82" cy="45" rx="6" ry="4.5" fill="#fdd835"/>
            <line x1="78" y1="45" x2="79" y2="45" stroke="#212121" stroke-width="1.5"/>
            <line x1="80" y1="45" x2="81" y2="45" stroke="#212121" stroke-width="1.5"/>
            <ellipse cx="80" cy="42" rx="4" ry="2.5" fill="white" opacity="0.7"/>
        </svg>`,

        swift_return: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="100" rx="38" ry="16" fill="#4e342e"/>
            <path d="M32,100 Q35,86 50,82 Q60,80 70,84 Q80,80 90,82 Q105,86 108,100 Q90,115 70,116 Q50,115 32,100 Z" fill="#5d4037"/>
            <path d="M40,95 Q55,88 70,90 Q85,88 100,95" stroke="#3e2723" stroke-width="2" fill="none"/>
            <path d="M38,102 Q53,96 70,98 Q87,96 102,102" stroke="#3e2723" stroke-width="2" fill="none"/>
            <path d="M42,108 Q55,104 70,106 Q85,104 98,108" stroke="#3e2723" stroke-width="2" fill="none"/>
            <path d="M20,80 Q40,75 55,82" stroke="#795548" stroke-width="3" fill="none"/>
            <path d="M120,78 Q100,74 85,82" stroke="#795548" stroke-width="3" fill="none"/>
            <ellipse cx="70" cy="58" rx="12" ry="6" fill="#37474f"/>
            <ellipse cx="70" cy="58" rx="9" ry="4" fill="#546e7a"/>
            <path d="M62,58 Q50,50 40,55" stroke="#37474f" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M78,58 Q90,50 100,55" stroke="#37474f" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M70,64 L64,75 M70,64 L76,75" stroke="#37474f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <circle cx="76" cy="56" r="2" fill="#ff7043"/>
            <circle cx="76" cy="56" r="1" fill="black"/>
            <path d="M80,57 L84,56" stroke="#ffb74d" stroke-width="1.5" fill="none"/>
        </svg>`,

        glow_mushroom: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <rect x="62" y="85" width="16" height="36" rx="7" fill="#d7ccc8"/>
            <rect x="64" y="87" width="12" height="32" rx="6" fill="#efebe9"/>
            <ellipse cx="70" cy="92" rx="28" ry="10" fill="#7b1fa2"/>
            <path d="M42,92 Q44,60 70,50 Q96,60 98,92 Z" fill="#8e24aa"/>
            <path d="M46,92 Q48,64 70,54 Q92,64 94,92 Z" fill="#9c27b0"/>
            <circle cx="60" cy="72" r="6" fill="white" opacity="0.85"/>
            <circle cx="80" cy="68" r="5" fill="white" opacity="0.85"/>
            <circle cx="70" cy="62" r="4" fill="white" opacity="0.8"/>
            <circle cx="52" cy="82" r="3.5" fill="white" opacity="0.7"/>
            <circle cx="88" cy="80" r="3" fill="white" opacity="0.7"/>
            <circle cx="55" cy="50" r="2.5" fill="#e040fb" opacity="0.9"/>
            <circle cx="70" cy="46" r="2" fill="#ea80fc" opacity="0.8"/>
            <circle cx="85" cy="52" r="2.5" fill="#e040fb" opacity="0.9"/>
        </svg>`,

        electric_eel: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="118" rx="38" ry="10" fill="#01579b" opacity="0.7"/>
            <ellipse cx="70" cy="114" rx="34" ry="7" fill="#0277bd" opacity="0.8"/>
            <path d="M40,110 Q50,95 60,90 Q70,85 75,75 Q80,65 90,60 Q100,55 105,45" stroke="#80cbc4" stroke-width="10" fill="none" stroke-linecap="round"/>
            <path d="M40,110 Q50,95 60,90 Q70,85 75,75 Q80,65 90,60 Q100,55 105,45" stroke="#00e5ff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
            <ellipse cx="108" cy="42" rx="12" ry="8" fill="#00897b" transform="rotate(-30,108,42)"/>
            <ellipse cx="108" cy="42" rx="10" ry="6" fill="#00acc1" transform="rotate(-30,108,42)"/>
            <circle cx="112" cy="38" r="3.5" fill="#00e5ff"/>
            <circle cx="112" cy="38" r="2" fill="white"/>
            <path d="M70,70 L78,58 L72,55 L80,43" stroke="#ffeb3b" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>
            <path d="M55,88 L60,76 L56,74 L62,62" stroke="#ffee58" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/>
        </svg>`,

        plastic_melter: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="124" rx="30" ry="7" fill="#37474f"/>
            <rect x="44" y="55" width="52" height="70" rx="6" fill="#455a64"/>
            <rect x="46" y="57" width="48" height="66" rx="5" fill="#546e7a"/>
            <rect x="54" y="68" width="32" height="24" rx="4" fill="#e65100"/>
            <rect x="56" y="70" width="28" height="20" rx="3" fill="#ff8f00"/>
            <path d="M65,88 Q67,78 70,75 Q73,78 75,88" fill="#ffab40" opacity="0.8"/>
            <path d="M66,88 Q68,80 70,77 Q72,80 74,88" fill="#ff6d00" opacity="0.9"/>
            <rect x="52" y="40" width="8" height="20" rx="3" fill="#37474f"/>
            <rect x="80" y="35" width="8" height="25" rx="3" fill="#37474f"/>
            <rect x="48" y="50" width="44" height="10" rx="3" fill="#37474f"/>
            <circle cx="65" cy="100" r="6" fill="#37474f"/>
            <circle cx="65" cy="100" r="4" fill="#263238"/>
            <line x1="65" y1="100" x2="67" y2="97" stroke="#ff5722" stroke-width="1.5"/>
            <circle cx="76" cy="100" r="4" fill="#263238"/>
            <line x1="76" y1="100" x2="78" y2="97" stroke="#ff5722" stroke-width="1.5"/>
        </svg>`,

        compost_fermentor: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="122" rx="26" ry="6" fill="#33691e"/>
            <ellipse cx="70" cy="70" rx="36" ry="50" fill="#558b2f"/>
            <ellipse cx="70" cy="70" rx="34" ry="48" fill="#689f38"/>
            <rect x="85" y="45" width="10" height="55" rx="4" fill="#1a1a1a" opacity="0.6"/>
            <rect x="87" y="47" width="6" height="51" rx="3" fill="#a5d6a7" opacity="0.4"/>
            <rect x="87" y="72" width="6" height="26" rx="2" fill="#7cb342"/>
            <path d="M36,55 Q70,50 104,55" stroke="#558b2f" stroke-width="1.5" fill="none"/>
            <path d="M34,70 Q70,65 106,70" stroke="#558b2f" stroke-width="1.5" fill="none"/>
            <path d="M36,85 Q70,80 104,85" stroke="#558b2f" stroke-width="1.5" fill="none"/>
            <path d="M38,100 Q70,96 102,100" stroke="#558b2f" stroke-width="1.5" fill="none"/>
            <path d="M34,60 L18,60 L18,80 L28,80" stroke="#33691e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M106,70 L118,70 L118,88 L106,88" stroke="#33691e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="70" cy="22" rx="36" ry="10" fill="#33691e"/>
            <ellipse cx="70" cy="20" rx="32" ry="8" fill="#558b2f"/>
            <rect x="64" y="14" width="12" height="10" rx="4" fill="#2e7d32"/>
            <rect x="48" y="60" width="28" height="20" rx="3" fill="#1b5e20" opacity="0.8"/>
            <line x1="52" y1="65" x2="72" y2="65" stroke="#66bb6a" stroke-width="1"/>
            <line x1="52" y1="70" x2="72" y2="70" stroke="#66bb6a" stroke-width="1"/>
            <line x1="52" y1="75" x2="66" y2="75" stroke="#66bb6a" stroke-width="1"/>
        </svg>`
    },

    enemies: {
        fog_cloud: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <path d="M30,90 Q30,72 42,68 Q44,56 56,55 Q58,44 70,44 Q82,44 84,55 Q96,56 98,68 Q110,72 110,90 Q110,105 70,108 Q30,105 30,90 Z" fill="#bdbdbd" opacity="0.85"/>
            <circle cx="48" cy="66" r="14" fill="#e0e0e0" opacity="0.8"/>
            <circle cx="70" cy="52" r="18" fill="#eeeeee" opacity="0.8"/>
            <circle cx="92" cy="66" r="14" fill="#e0e0e0" opacity="0.8"/>
            <circle cx="35" cy="85" r="12" fill="#d6d6d6" opacity="0.7"/>
            <circle cx="105" cy="85" r="12" fill="#d6d6d6" opacity="0.7"/>
            <ellipse cx="57" cy="78" rx="10" ry="8" fill="#9e9e9e"/>
            <ellipse cx="83" cy="78" rx="10" ry="8" fill="#9e9e9e"/>
            <ellipse cx="58" cy="78" rx="5" ry="6" fill="white" opacity="0.8"/>
            <ellipse cx="84" cy="78" rx="5" ry="6" fill="white" opacity="0.8"/>
            <circle cx="59" cy="77" r="2" fill="#616161"/>
            <circle cx="85" cy="77" r="2" fill="#616161"/>
        </svg>`,

        oil_crawler: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="70" cy="118" rx="35" ry="6" fill="#1a0a00" opacity="0.6"/>
            <path d="M70,30 Q95,45 98,75 Q100,100 70,108 Q40,100 42,75 Q45,45 70,30 Z" fill="#3e2723"/>
            <ellipse cx="58" cy="55" rx="12" ry="18" fill="#4e342e" opacity="0.5" transform="rotate(-15,58,55)"/>
            <ellipse cx="54" cy="50" rx="6" ry="10" fill="#6d4c41" opacity="0.6" transform="rotate(-15,54,50)"/>
            <path d="M50,65 Q35,55 25,60" stroke="#3e2723" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M45,80 Q28,78 20,85" stroke="#3e2723" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M50,95 Q32,96 25,105" stroke="#3e2723" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="62" cy="68" r="7" fill="#1a1a1a"/>
            <circle cx="78" cy="68" r="7" fill="#1a1a1a"/>
            <circle cx="63" cy="67" r="3.5" fill="#ff6d00" opacity="0.8"/>
            <circle cx="79" cy="67" r="3.5" fill="#ff6d00" opacity="0.8"/>
            <circle cx="64" cy="66" r="1.5" fill="white"/>
            <circle cx="80" cy="66" r="1.5" fill="white"/>
        </svg>`,

        plastic_beast: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <path d="M40,50 L50,40 L55,50 L60,38 L65,50 L70,36 L75,50 L80,38 L85,50 L90,40 L100,50 L100,95 L90,105 L80,100 L70,108 L60,100 L50,105 L40,95 Z" fill="#1565c0"/>
            <path d="M43,52 L52,43 L56,52 L62,42 L66,52 L70,40 L74,52 L80,42 L84,52 L88,43 L97,52 L97,93 L88,103 L78,98 L70,106 L62,98 L52,103 L43,93 Z" fill="#1976d2"/>
            <line x1="70" y1="40" x2="70" y2="108" stroke="white" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
            <line x1="43" y1="72" x2="97" y2="72" stroke="white" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
            <circle cx="57" cy="62" r="13" fill="white"/>
            <circle cx="83" cy="62" r="13" fill="white"/>
            <circle cx="57" cy="62" r="9" fill="#1565c0"/>
            <circle cx="83" cy="62" r="9" fill="#1565c0"/>
            <circle cx="58" cy="61" r="4" fill="black"/>
            <circle cx="84" cy="61" r="4" fill="black"/>
            <path d="M52,86 Q70,96 88,86" fill="#0d47a1" stroke="white" stroke-width="1.5"/>
            <rect x="57" y="86" width="5" height="5" fill="white"/>
            <rect x="65" y="87" width="5" height="4" fill="white"/>
            <rect x="73" y="87" width="5" height="4" fill="white"/>
            <rect x="81" y="86" width="5" height="5" fill="white"/>
        </svg>`,

        plastic_shard: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <path d="M70,35 L85,50 L95,42 L92,60 L105,68 L90,75 L95,90 L78,85 L75,100 L60,90 L45,98 L48,80 L35,73 L50,65 L44,48 L60,55 Z" fill="#1565c0"/>
            <path d="M70,38 L83,52 L92,45 L89,62 L101,69 L88,76 L92,88 L77,83 L73,97 L59,88 L46,95 L49,78 L38,72 L52,65 L47,50 L62,57 Z" fill="#1976d2"/>
            <path d="M70,38 L83,52 Z" stroke="white" stroke-width="3" opacity="0.7"/>
            <path d="M88,60 L101,69 Z" stroke="white" stroke-width="2.5" opacity="0.5"/>
        </svg>`,

        poacher_mech: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <rect x="22" y="100" width="40" height="16" rx="7" fill="#424242"/>
            <rect x="78" y="100" width="40" height="16" rx="7" fill="#424242"/>
            <circle cx="30" cy="108" r="7" fill="#212121"/>
            <circle cx="30" cy="108" r="4" fill="#424242"/>
            <circle cx="54" cy="108" r="7" fill="#212121"/>
            <circle cx="54" cy="108" r="4" fill="#424242"/>
            <circle cx="86" cy="108" r="7" fill="#212121"/>
            <circle cx="86" cy="108" r="4" fill="#424242"/>
            <circle cx="110" cy="108" r="7" fill="#212121"/>
            <circle cx="110" cy="108" r="4" fill="#424242"/>
            <rect x="30" y="65" width="80" height="40" rx="5" fill="#546e7a"/>
            <rect x="33" y="68" width="74" height="34" rx="4" fill="#607d8b"/>
            <rect x="48" y="48" width="44" height="24" rx="5" fill="#1565c0"/>
            <rect x="50" y="50" width="40" height="20" rx="4" fill="#1976d2"/>
            <rect x="54" y="53" width="16" height="12" rx="3" fill="#29b6f6" opacity="0.9"/>
            <rect x="74" y="53" width="12" height="12" rx="3" fill="#29b6f6" opacity="0.7"/>
            <rect x="22" y="68" width="12" height="5" rx="2" fill="#455a64"/>
            <rect x="14" y="62" width="12" height="5" rx="2" fill="#455a64" transform="rotate(-20,14,62)"/>
            <path d="M10,60 L5,55 L12,54" stroke="#546e7a" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M10,60 L5,65 L12,66" stroke="#546e7a" stroke-width="3" fill="none" stroke-linecap="round"/>
            <rect x="106" y="68" width="12" height="5" rx="2" fill="#455a64"/>
            <line x1="70" y1="48" x2="70" y2="34" stroke="#78909c" stroke-width="2"/>
            <circle cx="70" cy="32" r="3" fill="#ef5350"/>
            <rect x="90" y="60" width="6" height="10" rx="2" fill="#37474f"/>
        </svg>`,

        acid_rain_cloud: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <path d="M22,85 Q20,65 35,60 Q38,48 52,46 Q56,36 70,36 Q84,36 88,46 Q102,48 105,60 Q120,65 118,85 Q115,100 70,100 Q25,100 22,85 Z" fill="#37474f"/>
            <circle cx="45" cy="63" r="18" fill="#455a64"/>
            <circle cx="70" cy="48" r="22" fill="#546e7a"/>
            <circle cx="95" cy="63" r="18" fill="#455a64"/>
            <path d="M40,65 Q44,58 52,58 Q60,55 70,55 Q80,55 88,58 Q96,58 100,65" fill="none" stroke="#c6ff00" stroke-width="1.5" opacity="0.5"/>
            <ellipse cx="70" cy="60" rx="22" ry="8" fill="#aeea00" opacity="0.08"/>
            <path d="M55,85 L62,70 L58,70 L65,55" stroke="#c6ff00" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8"/>
        </svg>`,

        defiler_troll: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <rect x="50" y="100" width="14" height="28" rx="6" fill="#2e7d32"/>
            <rect x="76" y="100" width="14" height="28" rx="6" fill="#2e7d32"/>
            <rect x="38" y="55" width="64" height="52" rx="10" fill="#1b5e20"/>
            <rect x="40" y="57" width="60" height="48" rx="9" fill="#2e7d32"/>
            <rect x="18" y="60" width="22" height="12" rx="6" fill="#2e7d32"/>
            <rect x="100" y="60" width="22" height="12" rx="6" fill="#2e7d32"/>
            <ellipse cx="70" cy="42" rx="26" ry="22" fill="#2e7d32"/>
            <ellipse cx="70" cy="42" rx="24" ry="20" fill="#388e3c"/>
            <path d="M50,28 Q44,14 48,8 Q55,18 54,28" fill="#1b5e20"/>
            <path d="M90,28 Q96,14 92,8 Q85,18 86,28" fill="#1b5e20"/>
            <ellipse cx="60" cy="40" rx="8" ry="6" fill="#b71c1c"/>
            <ellipse cx="80" cy="40" rx="8" ry="6" fill="#b71c1c"/>
            <circle cx="61" cy="40" r="3.5" fill="#d32f2f"/>
            <circle cx="81" cy="40" r="3.5" fill="#d32f2f"/>
            <path d="M58,52 Q70,58 82,52" fill="#1b5e20"/>
            <path d="M50,58 L44,40 L52,52" fill="#1b5e20"/>
            <path d="M70,56 L70,34 L75,50" fill="#1b5e20"/>
            <path d="M90,58 L96,40 L88,52" fill="#1b5e20"/>
            <rect x="13" y="56" width="6" height="30" rx="2" fill="#795548"/>
            <path d="M8,55 L20,52 L20,66 Z" fill="#78909c"/>
            <path d="M8,68 L20,72 L20,58 Z" fill="#90a4ae"/>
        </svg>`,

        nuclear_worm: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="106" cy="98" rx="13" ry="11" fill="#4a148c"/>
            <ellipse cx="106" cy="98" rx="11" ry="9" fill="#6a1b9a"/>
            <path d="M100,95 L108,90 M104,104 L110,96" stroke="#e040fb" stroke-width="1.2" opacity="0.7"/>
            <ellipse cx="85" cy="88" rx="15" ry="13" fill="#4a148c"/>
            <ellipse cx="85" cy="88" rx="13" ry="11" fill="#6a1b9a"/>
            <ellipse cx="62" cy="80" rx="17" ry="14" fill="#4a148c"/>
            <ellipse cx="62" cy="80" rx="15" ry="12" fill="#6a1b9a"/>
            <ellipse cx="40" cy="70" rx="22" ry="18" fill="#4a148c"/>
            <ellipse cx="40" cy="70" rx="20" ry="16" fill="#7b1fa2"/>
            <ellipse cx="26" cy="70" rx="12" ry="10" fill="#6a1b9a"/>
            <circle cx="21" cy="68" r="3" fill="#9c27b0"/>
            <circle cx="21" cy="73" r="2.5" fill="#9c27b0"/>
            <circle cx="38" cy="62" r="5" fill="#ffee58"/>
            <circle cx="48" cy="60" r="4" fill="#fff176"/>
            <circle cx="43" cy="70" r="4.5" fill="#ffee58"/>
            <circle cx="38" cy="62" r="2.5" fill="white"/>
            <circle cx="48" cy="60" r="2" fill="white"/>
            <circle cx="43" cy="70" r="2.2" fill="white"/>
        </svg>`,

        e_waste_golem: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <rect x="42" y="108" width="22" height="22" rx="3" fill="#263238"/>
            <rect x="76" y="108" width="22" height="22" rx="3" fill="#263238"/>
            <rect x="32" y="62" width="76" height="50" rx="5" fill="#263238"/>
            <rect x="34" y="64" width="72" height="46" rx="4" fill="#37474f"/>
            <path d="M38,70 L60,70 L60,78 L80,78 L80,70 L102,70" stroke="#29b6f6" stroke-width="1.2" fill="none" opacity="0.5"/>
            <path d="M38,85 L50,85 L50,95 L90,95 L90,85 L102,85" stroke="#29b6f6" stroke-width="1.2" fill="none" opacity="0.5"/>
            <rect x="42" y="75" width="14" height="7" rx="2" fill="#e53935"/>
            <rect x="66" y="75" width="14" height="7" rx="2" fill="#fb8c00"/>
            <rect x="42" y="88" width="14" height="7" rx="2" fill="#43a047"/>
            <rect x="66" y="88" width="14" height="7" rx="2" fill="#1e88e5"/>
            <rect x="38" y="30" width="64" height="36" rx="4" fill="#263238"/>
            <rect x="40" y="32" width="60" height="32" rx="3" fill="#37474f"/>
            <circle cx="70" cy="48" r="12" fill="#b71c1c"/>
            <circle cx="70" cy="48" r="9" fill="#c62828"/>
            <circle cx="70" cy="48" r="6" fill="#ef5350"/>
            <circle cx="70" cy="48" r="3" fill="white"/>
            <line x1="58" y1="32" x2="52" y2="18" stroke="#546e7a" stroke-width="2"/>
            <circle cx="51" cy="16" r="3" fill="#29b6f6"/>
            <line x1="82" y1="32" x2="88" y2="18" stroke="#546e7a" stroke-width="2"/>
            <circle cx="89" cy="16" r="3" fill="#29b6f6"/>
        </svg>`,

        smog_serpent: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <ellipse cx="102" cy="105" rx="14" ry="10" fill="#78909c" opacity="0.75"/>
            <ellipse cx="102" cy="105" rx="12" ry="8" fill="#90a4ae" opacity="0.8"/>
            <ellipse cx="70" cy="80" rx="18" ry="12" fill="#78909c" opacity="0.8"/>
            <ellipse cx="70" cy="80" rx="16" ry="10" fill="#90a4ae" opacity="0.85"/>
            <ellipse cx="38" cy="65" rx="18" ry="13" fill="#78909c" opacity="0.85"/>
            <ellipse cx="38" cy="65" rx="16" ry="11" fill="#9e9e9e" opacity="0.9"/>
            <path d="M102,105 Q85,90 70,80 Q55,70 38,65" stroke="#90a4ae" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.6"/>
            <ellipse cx="22" cy="58" rx="20" ry="14" fill="#78909c"/>
            <ellipse cx="22" cy="58" rx="18" ry="12" fill="#9e9e9e"/>
            <circle cx="16" cy="54" r="5" fill="#f9a825"/>
            <circle cx="28" cy="54" r="5" fill="#f9a825"/>
            <circle cx="17" cy="53" r="1.5" fill="black"/>
            <circle cx="29" cy="53" r="1.5" fill="black"/>
            <path d="M10,62 L4,58 M10,62 L4,66" stroke="#a5d6a7" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`,

        microbe_swarm: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="42" fill="none" stroke="#f48fb1" stroke-width="2" opacity="0.4"/>
            <circle cx="70" cy="70" r="36" fill="#f8bbd0" opacity="0.12"/>
            <circle cx="70" cy="42" r="10" fill="#e91e63"/>
            <circle cx="70" cy="42" r="7" fill="#f48fb1"/>
            <circle cx="70" cy="42" r="9" fill="#e91e63"/>
            <circle cx="70" cy="42" r="6.5" fill="#f48fb1"/>
            <circle cx="70" cy="42" r="10" fill="#e91e63"/>
            <circle cx="70" cy="42" r="7" fill="#f48fb1"/>
            <circle cx="70" cy="42" r="8.5" fill="#e91e63"/>
            <circle cx="70" cy="42" r="6" fill="#f48fb1"/>
            <circle cx="70" cy="42" r="9.5" fill="#e91e63"/>
            <circle cx="70" cy="42" r="6.5" fill="#f48fb1"/>
            <circle cx="70" cy="70" r="8" fill="#e91e63" opacity="0.5"/>
            <circle cx="70" cy="70" r="4" fill="#f48fb1" opacity="0.7"/>
        </svg>`,

        microbe_mite: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="28" fill="#e91e63"/>
            <circle cx="70" cy="70" r="24" fill="#f06292"/>
            <ellipse cx="62" cy="62" rx="8" ry="6" fill="#f48fb1" opacity="0.6"/>
            <path d="M54,52 Q44,36 38,28" stroke="#e91e63" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="36" cy="26" r="4" fill="#f48fb1"/>
            <path d="M86,52 Q96,36 102,28" stroke="#e91e63" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="104" cy="26" r="4" fill="#f48fb1"/>
            <circle cx="62" cy="66" r="6" fill="white"/>
            <circle cx="78" cy="66" r="6" fill="white"/>
            <circle cx="63" cy="66" r="3" fill="#880e4f"/>
            <circle cx="79" cy="66" r="3" fill="#880e4f"/>
            <path d="M62,78 Q70,82 78,78" stroke="#880e4f" stroke-width="2" fill="none"/>
        </svg>`
    }
};

// ==================== Sprite 管理器 ====================
const SpriteManager = {
    _cache: {},

    // 初始化所有精灵
    init() {
        this._loadAll('towers', MODELS.towers);
        this._loadAll('enemies', MODELS.enemies);
    },

    _loadAll(category, models) {
        for (const [id, svg] of Object.entries(models)) {
            this._load(id, category, svg);
        }
    },

    _load(id, category, svg) {
        const key = `${category}_${id}`;
        // 克隆SVG以确保独立
        let svgContent = svg;
        // 为每个精灵生成唯一ID避免SVG渐变ID冲突
        const uid = `m${Date.now()}${Math.random().toString(36).slice(2,6)}`;
        svgContent = svgContent.replace(/url\(#/g, `url(#${uid}_`);
        svgContent = svgContent.replace(/id="/g, `id="${uid}_`);

        const encoded = encodeURIComponent(svgContent);
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

        const img = new Image();
        img.src = dataUrl;
        this._cache[key] = img;
    },

    get(id, category = 'towers') {
        const key = `${category}_${id}`;
        return this._cache[key] || null;
    },

    // 在canvas上绘制精灵
    draw(ctx, id, category, x, y, size, rotation = 0) {
        const img = this.get(id, category);
        if (!img || !img.complete || img.naturalWidth === 0) {
            // fallback: 绘制简单的圆形
            ctx.fillStyle = category === 'enemies' ? '#f44336' : '#4caf50';
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const s = size || 50;
        ctx.save();
        if (rotation) {
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.drawImage(img, -s / 2, -s / 2, s, s);
        } else {
            ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
        }
        ctx.restore();
    }
};

// 页面加载完成后初始化精灵
if (typeof document !== 'undefined') {
    if (document.readyState === 'complete') {
        SpriteManager.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => SpriteManager.init());
    }
}
