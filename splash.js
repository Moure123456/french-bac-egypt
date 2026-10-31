/* ===== splash.js — واجهة الترحيب + عدّاد الجلسة + جوائز تفاعلية =====
   أضف في index.html قبل </body> السطر:  <script src="splash.js"></script>
   للتجربة السريعة: افتح الموقع بـ ?speed=300 (كل ثانية = 5 دقائق). */
(function () {
  'use strict';
  function ready(f) { if (document.body) f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[splash]', e); } catch (_) {} } });

  function boot() {
    if (document.getElementById('bqs-root')) return;
    var SPEED = Math.max(1, +(new URLSearchParams(location.search).get('speed')) || 1), MIN = 60000;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function clock(ms) { var s = Math.floor(ms / 1000); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }

    /* ---------- الجوائز ---------- */
    var PR = [
      { id: 'rooster', at: 30, ic: '🐓', fr: 'Le Coq Magnifique', ar: 'الديك الزاهي الألوان', say: 'Cocorico ! Félicitations, champion !', ay: 'مبروك يا بطل', tap: 'Cocorico !', col: '#f97316', art: rooster, snd: sRooster },
      { id: 'lion', at: 60, ic: '🦁', fr: 'Le Roi Lion', ar: 'الأسد الملك', say: 'Quel courage ! Tu es un lion !', ay: 'مبروك يا أسد', tap: 'Roaaar !', col: '#f59e0b', art: lion, snd: sLion },
      { id: 'whale', at: 90, ic: '🐋', fr: 'La Baleine Bleue', ar: 'الحوت الأزرق', say: 'Bravo ! Tu plonges dans le français !', ay: 'مبروك', tap: 'Splash !', col: '#0ea5e9', art: whale, snd: sWhale },
      { id: 'pharaoh', at: 120, ic: '👑', fr: 'Le Pharaon d\'Or', ar: 'مجسّم الفرعون المصري', say: 'Félicitations ! Tu es un pharaon du français !', ay: 'مبروك يا فرعون', tap: 'Gloire à l\'Égypte !', col: '#eab308', art: pharaoh, snd: sPharaoh },
      { id: 'napoleon', at: 150, ic: '🎩', fr: 'Napoléon Bonaparte', ar: 'مجسّم نابليون بونابرت', say: 'Vive la France ! Victoire !', ay: 'مبروك', tap: 'Vive la France !', col: '#2563eb', art: napoleon, snd: sNapoleon },
      { id: 'money', at: 180, ic: '💵', fr: 'Billet de 50 livres', ar: 'ورقة الخمسين جنيهًا', say: 'Magnifique ! Tu as gagné cinquante livres !', ay: 'مبروك', tap: 'Cha-ching !', col: '#16a34a', art: money, snd: sMoney }
    ];

    /* ---------- رسومات SVG ---------- */
    function ellipses(n, f) { var o = ''; for (var i = 0; i < n; i++) o += f(i); return o; }
    function rooster() {
      var cols = ['#16a34a', '#0ea5e9', '#7c3aed', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7'];
      return '<svg viewBox="0 0 200 200"><defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>' +
        ellipses(7, function (i) { return '<ellipse cx="62" cy="68" rx="9" ry="46" fill="' + cols[i] + '" transform="rotate(' + (-62 + i * 11) + ' 62 120)"/><circle cx="62" cy="26" r="6" fill="#fff" opacity=".7" transform="rotate(' + (-62 + i * 11) + ' 62 120)"/>'; }) +
        '<ellipse cx="108" cy="126" rx="44" ry="34" fill="url(#rb)"/><ellipse cx="130" cy="100" rx="20" ry="32" fill="url(#rb)"/><circle cx="140" cy="76" r="22" fill="#f59e0b"/>' +
        '<ellipse cx="102" cy="126" rx="28" ry="17" fill="#15803d" transform="rotate(-18 102 126)"/><ellipse cx="102" cy="128" rx="20" ry="9" fill="#4ade80" transform="rotate(-18 102 126)"/>' +
        '<circle cx="130" cy="54" r="7" fill="#ef4444"/><circle cx="141" cy="50" r="8" fill="#ef4444"/><circle cx="152" cy="55" r="7" fill="#ef4444"/>' +
        '<polygon points="159,76 182,85 159,93" fill="#fde047" stroke="#ca8a04" stroke-width="2"/><ellipse cx="158" cy="102" rx="5" ry="10" fill="#dc2626"/>' +
        '<circle cx="148" cy="73" r="5" fill="#fff"/><circle cx="149.5" cy="73" r="2.6" fill="#111"/>' +
        '<path d="M100 158v26M118 158v26M92 186h18M110 186h18" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/></svg>';
    }
    function lion() {
      return '<svg viewBox="0 0 200 200"><defs><radialGradient id="lf"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs>' +
        ellipses(16, function (i) { return '<ellipse cx="100" cy="50" rx="17" ry="32" fill="' + (i % 2 ? '#b45309' : '#ea580c') + '" transform="rotate(' + (i * 22.5) + ' 100 105)"/>'; }) +
        '<circle cx="70" cy="72" r="12" fill="#f59e0b"/><circle cx="130" cy="72" r="12" fill="#f59e0b"/><circle cx="70" cy="72" r="6" fill="#fda4af"/><circle cx="130" cy="72" r="6" fill="#fda4af"/>' +
        '<circle cx="100" cy="106" r="42" fill="url(#lf)"/><ellipse cx="100" cy="124" rx="21" ry="15" fill="#fef3c7"/>' +
        '<ellipse cx="84" cy="98" rx="6" ry="7" fill="#1f2937"/><ellipse cx="116" cy="98" rx="6" ry="7" fill="#1f2937"/><circle cx="86" cy="95" r="2.2" fill="#fff"/><circle cx="118" cy="95" r="2.2" fill="#fff"/>' +
        '<path d="M74 86q10-8 20-2M126 86q-10-8-20-2" stroke="#92400e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M92 112h16l-8 9z" fill="#7c2d12"/>' +
        '<path d="M100 121v8M100 129q-9 8-17 1M100 129q9 8 17 1" stroke="#7c2d12" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="88" cy="124" r="1.6" fill="#92400e"/><circle cx="94" cy="127" r="1.6" fill="#92400e"/><circle cx="112" cy="124" r="1.6" fill="#92400e"/><circle cx="106" cy="127" r="1.6" fill="#92400e"/></svg>';
    }
    function whale() {
      return '<svg viewBox="0 0 200 200"><defs><linearGradient id="wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs>' +
        '<path d="M110 62q-6-22 6-34M122 62q8-24-4-36" stroke="#7dd3fc" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="104" cy="28" r="4" fill="#bae6fd"/><circle cx="126" cy="24" r="3.5" fill="#bae6fd"/><circle cx="116" cy="16" r="3" fill="#e0f2fe"/>' +
        '<path d="M34 128C10 122 6 96 14 76 32 84 44 100 48 116ZM34 132C10 140 6 158 16 172 32 164 44 150 50 138Z" fill="#1d4ed8"/>' +
        '<path d="M26 126C26 82 74 56 128 66C166 74 188 98 188 126C188 156 152 176 104 176C56 176 26 160 26 126Z" fill="url(#wb)"/>' +
        '<path d="M34 138C66 166 146 172 184 140C180 164 148 180 104 180C64 180 40 166 34 138Z" fill="#bae6fd"/>' +
        '<path d="M96 134q18 26 44 20q-10-14-44-20Z" fill="#1e40af"/><circle cx="154" cy="106" r="7" fill="#fff"/><circle cx="156" cy="106" r="3.6" fill="#0f172a"/>' +
        '<path d="M150 128q16 8 30-4" stroke="#0c4a6e" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="52" cy="62" r="6" fill="#bae6fd" opacity=".8"/><circle cx="40" cy="44" r="4" fill="#bae6fd" opacity=".7"/><circle cx="64" cy="40" r="3" fill="#e0f2fe" opacity=".8"/></svg>';
    }
    function pharaoh() {
      var shape = 'M64 34Q100 10 136 34L160 62L174 178L130 178L128 112L72 112L70 178L26 178L40 62Z';
      return '<svg viewBox="0 0 200 200"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#ca8a04"/></linearGradient><clipPath id="pc"><path d="' + shape + '"/></clipPath></defs>' +
        '<path d="' + shape + '" fill="url(#pg)"/><g clip-path="url(#pc)">' + ellipses(11, function (i) { return '<rect x="0" y="' + (30 + i * 14) + '" width="200" height="6" fill="#1d4ed8"/>'; }) + '</g><path d="' + shape + '" fill="none" stroke="#a16207" stroke-width="3"/>' +
        '<ellipse cx="100" cy="98" rx="30" ry="40" fill="#fcd34d" stroke="#a16207" stroke-width="2"/><rect x="70" y="52" width="60" height="8" rx="3" fill="#1d4ed8"/><circle cx="100" cy="46" r="6" fill="#ef4444"/><path d="M100 36q-8 6 0 14q8-8 0-14Z" fill="#16a34a"/>' +
        '<path d="M78 88q9-8 19 0q-10 6-19 0ZM103 88q9-8 19 0q-10 6-19 0Z" fill="#111827"/><path d="M74 90L62 94M126 90L138 94" stroke="#111827" stroke-width="3"/><path d="M78 80q10-6 20-1M102 79q10-5 20 1" stroke="#1d4ed8" stroke-width="3" fill="none"/>' +
        '<path d="M100 92v16q-5 3 0 4" stroke="#a16207" stroke-width="2.5" fill="none"/><path d="M89 122q11 6 22 0" stroke="#92400e" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
        '<rect x="93" y="136" width="14" height="36" rx="5" fill="#1d4ed8" stroke="#a16207" stroke-width="2"/>' +
        '<path d="M62 150Q100 205 138 150" fill="none" stroke="#0ea5e9" stroke-width="9"/><path d="M68 152Q100 198 132 152" fill="none" stroke="#ef4444" stroke-width="6"/><path d="M74 153Q100 190 126 153" fill="none" stroke="#fde047" stroke-width="5"/></svg>';
    }
    function napoleon() {
      return '<svg viewBox="0 0 200 200"><defs><linearGradient id="nb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e40af"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs>' +
        '<path d="M40 200L52 152Q100 182 148 152L160 200Z" fill="url(#nb)"/><path d="M80 160L100 188L120 160Q100 170 80 160Z" fill="#f8fafc"/><path d="M52 152Q100 182 148 152L140 146Q100 168 60 146Z" fill="#dc2626"/>' +
        '<path d="M60 190L150 160" stroke="#f8fafc" stroke-width="7"/><ellipse cx="46" cy="158" rx="16" ry="8" fill="#fbbf24" transform="rotate(-18 46 158)"/><ellipse cx="154" cy="158" rx="16" ry="8" fill="#fbbf24" transform="rotate(18 154 158)"/>' +
        '<path d="M120 176l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#fde047" stroke="#a16207"/>' +
        '<ellipse cx="100" cy="112" rx="34" ry="40" fill="#f5cfa0"/><ellipse cx="68" cy="108" rx="7" ry="11" fill="#7c4a1d"/><ellipse cx="132" cy="108" rx="7" ry="11" fill="#7c4a1d"/>' +
        '<path d="M70 94q30-12 60 0" stroke="#7c4a1d" stroke-width="6" fill="none"/><path d="M80 104q8-5 16 0M104 104q8-5 16 0" stroke="#3b2a1a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="88" cy="108" r="3" fill="#1f2937"/><circle cx="112" cy="108" r="3" fill="#1f2937"/><path d="M100 110v14q-4 2 0 3" stroke="#b9855a" stroke-width="2.5" fill="none"/><path d="M90 138q10 5 20 0" stroke="#9a3412" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M14 80Q100 -6 186 80Q168 102 140 90Q100 70 60 90Q32 102 14 80Z" fill="#0f172a" stroke="#fbbf24" stroke-width="3"/><circle cx="100" cy="64" r="11" fill="#dc2626"/><circle cx="100" cy="64" r="7" fill="#f8fafc"/><circle cx="100" cy="64" r="3.6" fill="#1d4ed8"/></svg>';
    }
    function money() {
      return '<svg viewBox="0 34 200 132"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d28d9"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#0d9488"/></linearGradient></defs>' +
        '<g transform="rotate(-6 100 100)"><rect x="8" y="46" width="184" height="108" rx="9" fill="url(#mg)" stroke="#fde047" stroke-width="3"/><rect x="16" y="54" width="168" height="92" rx="6" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<circle cx="52" cy="100" r="30" fill="#fde047" opacity=".9"/><path d="M52 76l-18 34h36Z" fill="#a16207"/><path d="M40 110h24l-6-10h-12Z" fill="#fef08a"/><circle cx="52" cy="92" r="4" fill="#1e3a8a"/>' +
        '<text x="124" y="104" text-anchor="middle" font-size="46" font-weight="900" fill="#fef9c3" stroke="#a16207" stroke-width="1.5" font-family="Arial,sans-serif">50</text>' +
        '<text x="124" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="#fef9c3" font-family="Arial,sans-serif">خمسون جنيهًا</text><text x="124" y="70" text-anchor="middle" font-size="10" fill="#fef9c3" font-family="Arial,sans-serif">EGYPTIAN POUNDS</text>' +
        '<text x="24" y="140" font-size="10" font-weight="700" fill="#fef9c3" font-family="Arial,sans-serif">50</text><text x="176" y="68" text-anchor="end" font-size="10" font-weight="700" fill="#fef9c3" font-family="Arial,sans-serif">50</text></g></svg>';
    }

    /* ---------- الصوت (توليف مباشر بدون ملفات) ---------- */
    var AC = null;
    function ac() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) { try { AC = new C(); } catch (e) {} } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function tone(f, t0, d, type, v, f2) {
      var a = ac(); if (!a) return; var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.2, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05);
    }
    function noise(t0, d, v, fc) {
      var a = ac(); if (!a) return; var n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
      for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); fl.type = 'lowpass'; fl.frequency.value = fc || 800; g.gain.value = v || 0.2;
      s.buffer = b; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(a.currentTime + t0);
    }
    function sRooster() { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.25, 'triangle', 0.2); }); tone(520, 0.6, 0.45, 'sawtooth', 0.11, 1100); tone(1000, 1.1, 0.4, 'sawtooth', 0.1, 600); tone(700, 1.55, 0.5, 'sawtooth', 0.09, 1200); [784, 988, 1175].forEach(function (f) { tone(f, 2.1, 0.8, 'triangle', 0.14); }); }
    function sLion() { tone(150, 0, 1.2, 'sawtooth', 0.28, 55); noise(0, 1.2, 0.3, 450); [262, 330, 392, 523].forEach(function (f, i) { tone(f, 1.2 + i * 0.22, 0.4, 'sawtooth', 0.12); }); tone(523, 2.1, 0.9, 'sawtooth', 0.13); }
    function sWhale() { tone(180, 0, 1.7, 'sine', 0.3, 430); tone(430, 1.6, 1.5, 'sine', 0.26, 250); tone(190, 0.1, 1.7, 'sine', 0.12, 450); [880, 1175, 1568, 1760].forEach(function (f, i) { tone(f, 2.5 + i * 0.18, 0.7, 'sine', 0.12); }); }
    function sPharaoh() { var sc = [293.7, 311.1, 370, 392, 440, 466.2, 523.3, 587.3], m = [0, 1, 2, 3, 4, 5, 6, 7, 6, 4, 3, 2, 1, 0]; m.forEach(function (n, i) { tone(sc[n], i * 0.2, 0.28, 'triangle', 0.17); }); [0, 0.6, 1.2, 1.8, 2.4].forEach(function (t) { tone(130, t, 0.25, 'sine', 0.4, 50); }); [587.3, 740, 880].forEach(function (f) { tone(f, 2.8, 1, 'triangle', 0.12); }); }
    function sNapoleon() { var n = [392, 392, 523, 659, 784, 659, 784, 1047], d = [0, 0.18, 0.36, 0.72, 0.9, 1.26, 1.44, 1.8]; n.forEach(function (f, i) { tone(f, d[i], 0.3, 'sawtooth', 0.1); tone(f, d[i], 0.3, 'square', 0.05); }); [0, 0.36, 0.72, 1.08, 1.44, 1.8].forEach(function (t) { noise(t, 0.12, 0.25, 3000); }); }
    function sMoney() { [0, 0.1, 0.2, 0.3, 0.4].forEach(function (t, i) { tone(1568 + i * 180, t, 0.2, 'triangle', 0.17); }); tone(1318, 0.65, 0.12, 'square', 0.08); tone(1976, 0.77, 0.9, 'triangle', 0.22); for (var i = 0; i < 9; i++) tone(2400 + Math.random() * 1500, 1 + i * 0.08, 0.1, 'sine', 0.06); }
    function speak(t, l) { try { if (!window.speechSynthesis) return; var u = new SpeechSynthesisUtterance(t); u.lang = l; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) {} }

    /* ---------- الجسيمات (كونفيتي وشرر وفقاعات) ---------- */
    var cv = document.createElement('canvas'), cx = cv.getContext('2d'), parts = [], raf = 0;
    cv.id = 'bqs-cv'; document.body.appendChild(cv);
    function fit() { cv.width = innerWidth; cv.height = innerHeight; } fit(); addEventListener('resize', fit);
    function spawn(x, y, n, o) {
      o = o || {};
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, sp = (o.speed || 6) * (0.3 + Math.random());
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0), g: o.g == null ? 0.18 : o.g, life: 0, max: (o.life || 70) * (0.6 + Math.random() * 0.8),
          s: (o.size || 8) * (0.6 + Math.random() * 0.9), ch: o.chars ? o.chars[Math.floor(Math.random() * o.chars.length)] : null,
          c: o.colors ? o.colors[Math.floor(Math.random() * o.colors.length)] : 'hsl(' + Math.floor(Math.random() * 360) + ',95%,62%)', r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function loop() {
      cx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter(function (p) { return p.life < p.max; });
      parts.forEach(function (p) {
        p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; var al = Math.max(0, 1 - p.life / p.max);
        cx.save(); cx.globalAlpha = al; cx.translate(p.x, p.y); cx.rotate(p.r);
        if (p.ch) { cx.font = p.s * 2 + 'px serif'; cx.textAlign = 'center'; cx.fillText(p.ch, 0, 0); }
        else { cx.fillStyle = p.c; cx.shadowColor = p.c; cx.shadowBlur = 8; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
        cx.restore();
      });
      raf = parts.length ? requestAnimationFrame(loop) : 0;
    }
    function burst(x, y) { spawn(x, y, 46, { speed: 11, g: 0.24, life: 70, size: 8 }); spawn(x, y, 6, { speed: 7, g: 0.1, chars: ['⭐', '✨', '🎉', '🇫🇷', '🇪🇬'], size: 9, life: 100 }); }

    /* ---------- الأنماط ---------- */
    var st = document.createElement('style');
    st.textContent = '#bqs-cv{position:fixed;inset:0;z-index:100003;pointer-events:none}' +
      '#bqs-root,#bqs-root *,#bqs-rew,#bqs-rew *,#bqs-gal,#bqs-gal *,#bqs-chip{box-sizing:border-box}' +
      '#bqs-root{position:fixed;inset:0;z-index:100000;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;font-family:inherit;background:linear-gradient(135deg,#0b1f5c,#1d4ed8 35%,#7c3aed 65%,#be123c);background-size:300% 300%;animation:bqsBg 14s ease infinite;transition:opacity .7s,transform .7s}' +
      '#bqs-root.out{opacity:0;transform:scale(1.35);pointer-events:none}@keyframes bqsBg{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}' +
      '.bqs-orb{position:absolute;border-radius:50%;filter:blur(40px);opacity:.55;animation:bqsF 9s ease-in-out infinite}.bqs-orb.a{width:260px;height:260px;background:#22d3ee;top:-60px;left:-60px}.bqs-orb.b{width:300px;height:300px;background:#f43f5e;bottom:-90px;right:-70px;animation-delay:-4s}.bqs-orb.c{width:200px;height:200px;background:#facc15;top:40%;left:55%;animation-delay:-2s}' +
      '@keyframes bqsF{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.2)}}' +
      '.bqs-scene{position:absolute;bottom:0;left:0;right:0;height:34%;pointer-events:none}.bqs-scene svg{position:absolute;bottom:0;width:100%;height:100%;transition:transform .2s}' +
      '.bqs-in{position:relative;z-index:2;padding:18px;width:100%;max-width:440px}.bqs-logo{font-size:64px;animation:bqsPop 2.4s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgba(0,0,0,.4))}@keyframes bqsPop{0%,100%{transform:scale(1) rotate(-4deg)}50%{transform:scale(1.15) rotate(5deg)}}' +
      '.bqs-h1{margin:
