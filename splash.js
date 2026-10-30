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
      '.bqs-h1{margin:6px 0 2px;font-size:2.1rem;font-weight:900;background:linear-gradient(90deg,#fff,#fde047,#fb7185,#67e8f9,#fff);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:bqsShine 4s linear infinite}@keyframes bqsShine{to{background-position:300% 0}}' +
      '.bqs-h2{font-size:1.25rem;font-weight:800;margin:2px 0 8px;min-height:1.7em}.bqs-sub{white-space:pre-line;font-size:.95rem;opacity:.95;line-height:1.7;margin-bottom:12px}' +
      '.bqs-clock{display:inline-flex;gap:8px;direction:ltr;margin:6px 0 10px}.bqs-clock div{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.4);backdrop-filter:blur(8px);border-radius:14px;padding:8px 12px;min-width:70px;box-shadow:0 0 22px rgba(255,255,255,.2)}.bqs-clock b{display:block;font-size:2rem;font-variant-numeric:tabular-nums;text-shadow:0 0 14px #fde047}.bqs-clock small{font-size:.65rem;opacity:.85}' +
      '.bqs-bar{height:12px;background:rgba(255,255,255,.2);border-radius:8px;overflow:hidden;margin:4px 0}.bqs-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#fde047,#fb923c,#f43f5e);border-radius:8px;box-shadow:0 0 12px #fde047;transition:width .4s}.bqs-nx{font-size:.85rem;margin-bottom:8px}' +
      '.bqs-road{display:flex;justify-content:center;gap:6px;margin:6px 0 14px;direction:ltr}.bqs-road span{width:46px;padding:5px 0;border-radius:12px;background:rgba(255,255,255,.14);font-size:1.4rem;line-height:1.1;filter:grayscale(1);opacity:.7}.bqs-road span small{display:block;font-size:.58rem}.bqs-road span.on{filter:none;opacity:1;background:rgba(253,224,71,.35);box-shadow:0 0 14px #fde047}' +
      '.bqs-go{border:0;border-radius:40px;padding:15px 34px;font-size:1.15rem;font-weight:900;font-family:inherit;color:#7c2d12;background:linear-gradient(135deg,#fde047,#fb923c);cursor:pointer;box-shadow:0 8px 28px rgba(251,146,60,.6);animation:bqsPulse 1.6s ease-in-out infinite}@keyframes bqsPulse{50%{transform:scale(1.07);box-shadow:0 8px 40px rgba(253,224,71,.9)}}' +
      '#bqs-chip{position:fixed;left:12px;bottom:84px;z-index:99990;width:64px;height:64px;border-radius:50%;border:0;cursor:pointer;display:none;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.4)}#bqs-chip.on{display:flex}#bqs-chip::before{content:"";position:absolute;inset:4px;border-radius:50%;background:#0b1f5c}#bqs-chip span{position:relative;font-size:1.25rem;line-height:1}#bqs-chip small{position:relative;font-size:.62rem;font-variant-numeric:tabular-nums;direction:ltr}' +
      '#bqs-rew{position:fixed;inset:0;z-index:100001;display:none;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(30,27,75,.88),rgba(0,0,0,.95));color:#fff;text-align:center;overflow:hidden}#bqs-rew.on{display:flex;animation:bqsIn .5s}@keyframes bqsIn{from{opacity:0;transform:scale(.8)}}' +
      '#bqs-rew .rays{position:absolute;width:150vmax;height:150vmax;background:repeating-conic-gradient(rgba(253,224,71,.22) 0 8deg,transparent 8deg 20deg);animation:bqsSpin 24s linear infinite;-webkit-mask:radial-gradient(circle,#000 0,transparent 55%);mask:radial-gradient(circle,#000 0,transparent 55%)}@keyframes bqsSpin{to{transform:rotate(360deg)}}' +
      '#bqs-rew .box{position:relative;padding:14px;width:100%;max-width:420px}.rt{font-size:1.3rem;font-weight:900;color:#fde047;text-shadow:0 0 18px #f59e0b;animation:bqsPop 2s infinite}.stage{perspective:800px;margin:6px auto;width:min(66vw,270px);height:min(66vw,270px);position:relative;touch-action:none;cursor:grab}' +
      '.obj{width:100%;height:100%;transform-style:preserve-3d;transition:transform .15s}.obj .fl{width:100%;height:100%;animation:bqsFloat 3.4s ease-in-out infinite;filter:drop-shadow(0 18px 24px rgba(0,0,0,.55)) drop-shadow(0 0 22px var(--g))}.obj svg{width:100%;height:100%}@keyframes bqsFloat{50%{transform:translateY(-14px) rotateZ(2deg)}}' +
      '.shd{width:60%;height:16px;margin:-6px auto 0;border-radius:50%;background:radial-gradient(rgba(0,0,0,.6),transparent 70%);animation:bqsSh 3.4s ease-in-out infinite}@keyframes bqsSh{50%{transform:scale(.8);opacity:.6}}' +
      '.say{position:absolute;left:50%;top:6%;transform:translateX(-50%);background:#fff;color:#7c2d12;font-weight:900;padding:6px 14px;border-radius:16px;white-space:nowrap;pointer-events:none;animation:bqsSay 1.2s forwards;z-index:3}@keyframes bqsSay{0%{opacity:0;transform:translate(-50%,10px) scale(.5)}20%{opacity:1;transform:translate(-50%,0) scale(1.1)}100%{opacity:0;transform:translate(-50%,-50px)}}' +
      '.shake{animation:bqsShake .5s}@keyframes bqsShake{20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}.spin{animation:bqsSpin1 .9s}@keyframes bqsSpin1{to{transform:rotateY(360deg)}}' +
      '#bqs-rew h2{margin:8px 0 0;font-size:1.5rem;color:#fff}#bqs-rew h3{margin:2px 0;font-size:1.1rem;color:#fde68a}#bqs-rew p{margin:4px 0 10px;font-size:.8rem;opacity:.8}.bqs-b{border:0;border-radius:30px;padding:11px 22px;margin:3px;font-family:inherit;font-weight:800;font-size:1rem;cursor:pointer;background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}.bqs-b.g{background:rgba(255,255,255,.18);color:#fff}' +
      '#bqs-gal{position:fixed;inset:0;z-index:100002;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6)}#bqs-gal.on{display:flex}#bqs-gal .pn{background:linear-gradient(160deg,#1e1b4b,#312e81);color:#fff;width:100%;max-width:520px;max-height:84vh;overflow:auto;border-radius:24px 24px 0 0;padding:16px;animation:bqsUp .4s}@keyframes bqsUp{from{transform:translateY(100%)}}' +
      '.gr{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.gc{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);border-radius:16px;padding:8px;text-align:center;cursor:pointer;font-family:inherit;color:#fff}.gc.lk{opacity:.55;cursor:default}.gc .th{width:72px;height:72px;margin:0 auto}.gc .th svg{width:100%;height:100%}.gc.lk .th{filter:grayscale(1) brightness(.4);font-size:42px;line-height:72px}.gc b{display:block;font-size:.82rem}.gc small{font-size:.7rem;opacity:.85}';
    document.head.appendChild(st);

    /* ---------- واجهة الترحيب ---------- */
    var root = document.createElement('div'); root.id = 'bqs-root';
    root.innerHTML = '<i class="bqs-orb a"></i><i class="bqs-orb b"></i><i class="bqs-orb c"></i>' +
      '<div class="bqs-scene"><svg id="bqs-s1" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice"><path d="M0 140L90 78 170 140Z" fill="#fbbf24" opacity=".55"/><path d="M110 140L215 50 320 140Z" fill="#f59e0b" opacity=".7"/><path d="M270 140L340 90 410 140Z" fill="#fbbf24" opacity=".5"/><rect y="132" width="400" height="8" fill="#92400e" opacity=".6"/></svg>' +
      '<svg id="bqs-s2" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice"><path d="M52 140L58 88 62 56 64 30 66 56 70 88 76 140Z" fill="#0f172a" opacity=".85"/><path d="M58 88h12M62 56h6" stroke="#fde047" stroke-width="1.6"/><circle cx="64" cy="26" r="2.4" fill="#fde047"/></svg></div>' +
      '<div class="bqs-in"><div class="bqs-logo">🇫🇷</div><div class="bqs-h1">Le Français Au Bac</div><div class="bqs-h2" id="bqs-ty"></div>' +
      '<div class="bqs-sub" id="bqs-tip"></div><div class="bqs-clock"><div><b id="bqs-h">00</b><small>heures · ساعة</small></div><div><b id="bqs-m">00</b><small>minutes · دقيقة</small></div><div><b id="bqs-s">00</b><small>secondes · ثانية</small></div></div>' +
      '<div class="bqs-bar"><i id="bqs-pb"></i></div><div class="bqs-nx" id="bqs-nx"></div><div class="bqs-road" id="bqs-road"></div>' +
      '<button class="bqs-go" id="bqs-go" type="button">Commencer ✨ ابدأ الرحلة</button></div>';
    document.body.appendChild(root);
    var road = $('#bqs-road'); road.innerHTML = PR.map(function (p) { return '<span data-id="' + p.id + '">' + p.ic + '<small>' + p.at + 'د</small></span>'; }).join('');

    var greet = 'Bienvenue, champion ! أهلًا بك يا بطل الفرنسية', gi = 0, tipI = 0;
    var tips = ['كل دقيقة تقضيها هنا تقرّبك من جائزة 🎁\nChaque minute compte !', 'ابقَ 30 دقيقة لتكسب الديك الزاهي 🐓\nReste 30 minutes !', 'تعلّم بمتعة\nApprends en t\'amusant !', 'المجسّمات تتحرك — المسها واسحبها ✨\nTouche et fais tourner !'];
    var tyT = setInterval(function () { $('#bqs-ty').textContent = greet.slice(0, ++gi); if (gi >= greet.length) clearInterval(tyT); }, 55);
    function tip() { $('#bqs-tip').textContent = tips[tipI++ % tips.length]; } tip(); setInterval(tip, 4200);
    root.addEventListener('pointermove', function (e) {
      var dx = (e.clientX / innerWidth - 0.5) * 2; $('#bqs-s1').style.transform = 'translateX(' + (dx * -14) + 'px)'; $('#bqs-s2').style.transform = 'translateX(' + (dx * 22) + 'px)';
      if (Math.random() < 0.5) spawn(e.clientX, e.clientY, 2, { speed: 2, g: 0.04, life: 40, size: 6, colors: ['#fde047', '#67e8f9', '#fb7185', '#fff'] });
    });
    root.addEventListener('click', function (e) { spawn(e.clientX, e.clientY, 26, { speed: 7, g: 0.1, life: 60, size: 8 }); });
    $('#bqs-go').addEventListener('click', function (e) {
      e.stopPropagation(); ac(); tone(523, 0, 0.15, 'triangle', 0.15); tone(784, 0.1, 0.25, 'triangle', 0.15); tone(1047, 0.2, 0.4, 'triangle', 0.15);
      burst(innerWidth / 2, innerHeight * 0.6); root.classList.add('out'); setTimeout(function () { root.style.display = 'none'; chip.classList.add('on'); flush(); }, 700);
    });

    /* ---------- العدّاد ---------- */
    var elapsed = 0, last = performance.now(), shown = {}, queue = [], open = false;
    var chip = document.createElement('button'); chip.id = 'bqs-chip'; chip.type = 'button'; chip.innerHTML = '<span id="bqs-ci">🎁</span><small id="bqs-ct">00:00</small>'; document.body.appendChild(chip);
    var col = store('bq_prizes') || {};
    function tick() {
      var now = performance.now(), dt = now - last; last = now;
      if (document.hidden) return;              // يتوقف العدّاد عند مغادرة التطبيق
      elapsed += Math.min(dt, 1000) * SPEED;
      var t = clock(elapsed), s = Math.floor(elapsed / 1000);
      $('#bqs-h').textContent = pad(Math.floor(s / 3600)); $('#bqs-m').textContent = pad(Math.floor(s / 60) % 60); $('#bqs-s').textContent = pad(s % 60);
      var nx = null, prev = 0; for (var i = 0; i < PR.length; i++) { if (PR[i].at * MIN > elapsed) { nx = PR[i]; break; } prev = PR[i].at * MIN; }
      var pct = nx ? Math.min(100, (elapsed - prev) / (nx.at * MIN - prev) * 100) : 100;
      $('#bqs-pb').style.width = pct + '%'; $('#bqs-nx').textContent = nx ? 'الجائزة القادمة ' + nx.ic + ' ' + nx.ar + ' بعد ' + Math.max(0, Math.ceil((nx.at * MIN - elapsed) / 60000)) + ' دقيقة' : '🏆 جمعت كل الجوائز! أنت أسطورة';
      chip.style.background = 'conic-gradient(' + (nx ? nx.col : '#22c55e') + ' ' + pct + '%,rgba(255,255,255,.25) 0)'; $('#bqs-ci').textContent = nx ? nx.ic : '🏆'; $('#bqs-ct').textContent = t.slice(t.charAt(0) === '0' && t.charAt(1) === '0' ? 3 : 0);
      [].forEach.call(road.children, function (sp, k) { sp.classList.toggle('on', elapsed >= PR[k].at * MIN); });
      PR.forEach(function (p) { if (elapsed >= p.at * MIN && !shown[p.id]) { shown[p.id] = 1; queue.push(p); } });
      flush();
    }
    setInterval(tick, 250);

    /* ---------- مشهد الجائزة التفاعلي ---------- */
    var rew = document.createElement('div'); rew.id = 'bqs-rew';
    rew.innerHTML = '<div class="rays"></div><div class="box"><div class="rt">🎉 Félicitations ! مبروك 🎉</div><div class="stage" id="bqs-st"><div class="obj" id="bqs-ob"><div class="fl" id="bqs-fl"></div></div></div><div class="shd"></div><h2 id="bqs-t1"></h2><h3 id="bqs-t2"></h3><p>اضغط على المجسّم أو اسحبه لتدويره 🔄</p><button class="bqs-b g" id="bqs-rp" type="button">🔊 أعد التهنئة</button><button class="bqs-b" id="bqs-ok" type="button">متابعة التعلّم ➜</button></div>';
    document.body.appendChild(rew);
    var cur = null, rx = 0, ry = 0, drag = null, moved = 0;
    function flush() { if (open || !queue.length || root.style.display !== 'none') return; show(queue.shift()); }
    function show(p) {
      open = true; cur = p; rx = 0; ry = 0; $('#bqs-ob').style.transform = ''; $('#bqs-fl').innerHTML = p.art(); $('#bqs-st').style.setProperty('--g', p.col); $('#bqs-fl').style.setProperty('--g', p.col);
      $('#bqs-t1').textContent = p.fr; $('#bqs-t2').textContent = p.ar; rew.classList.add('on'); col[p.id] = new Date().toISOString().slice(0, 10); store('bq_prizes', col);
      var r = rew.getBoundingClientRect(); setTimeout(function () { burst(innerWidth / 2, innerHeight * 0.4); }, 150); setTimeout(function () { burst(innerWidth * 0.25, innerHeight * 0.3); burst(innerWidth * 0.75, innerHeight * 0.3); }, 700);
      cel(p);
    }
    function cel(p) { try { p.snd(); } catch (e) {} setTimeout(function () { speak(p.say, 'fr-FR'); setTimeout(function () { speak(p.ay, 'ar-SA'); }, 400); }, 900); }
    function react(p) {
      var st2 = $('#bqs-st'), r = st2.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, b = document.createElement('div'); b.className = 'say'; b.textContent = p.tap; st2.appendChild(b); setTimeout(function () { b.remove(); }, 1300);
      var fl = $('#bqs-fl'); fl.classList.remove('shake'); void fl.offsetWidth;
      if (p.id === 'rooster') { spawn(x, y, 22, { speed: 7, g: 0.1, chars: ['🪶'], life: 90 }); tone(520, 0, 0.45, 'sawtooth', 0.12, 1100); tone(1000, 0.4, 0.4, 'sawtooth', 0.1, 600); fl.classList.add('shake'); }
      if (p.id === 'lion') { spawn(x, y, 40, { speed: 9, g: 0.05, colors: ['#f97316', '#fde047', '#ef4444'], life: 40 }); tone(150, 0, 0.8, 'sawtooth', 0.25, 55); noise(0, 0.8, 0.25, 450); fl.classList.add('shake'); }
      if (p.id === 'whale') { spawn(x, y - 40, 36, { speed: 5, g: -0.08, chars: ['🫧', '💧'], life: 100 }); tone(200, 0, 1, 'sine', 0.25, 400); }
      if (p.id === 'pharaoh') { spawn(x, y, 50, { speed: 7, g: 0.04, colors: ['#fde047', '#f59e0b', '#fff7ae'], life: 80 }); spawn(x, y, 10, { speed: 6, g: 0.03, chars: ['☥', '✦'], life: 90 }); tone(293.7, 0, 0.3, 'triangle', 0.2); tone(440, 0.15, 0.5, 'triangle', 0.2); fl.classList.add('spin'); setTimeout(function () { fl.classList.remove('spin'); }, 950); }
      if (p.id === 'napoleon') { spawn(x, y, 14, { speed: 8, g: 0.12, chars: ['🇫🇷', '⚜️'], life: 100 }); [392, 523, 659, 784].forEach(function (f, i) { tone(f, i * 0.1, 0.25, 'sawtooth', 0.1); }); speak('Vive la France !', 'fr-FR'); }
      if (p.id === 'money') { for (var i = 0; i < 4; i++) spawn(Math.random() * innerWidth, -10, 6, { speed: 1, vy: 3, g: 0.08, chars: ['💵', '🪙'], life: 160 }); tone(1976, 0, 0.5, 'triangle', 0.2); tone(2637, 0.1, 0.5, 'triangle', 0.15); }
    }
    var stg = $('#bqs-st');
    stg.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, rx: rx, ry: ry }; moved = 0; stg.setPointerCapture(e.pointerId); });
    stg.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); ry = drag.ry + dx * 0.9; rx = Math.max(-40, Math.min(40, drag.rx - dy * 0.5)); $('#bqs-ob').style.transform = 'rotateY(' + ry + 'deg) rotateX(' + rx + 'deg)'; });
    stg.addEventListener('pointerup', function () { if (drag && moved < 8 && cur) react(cur); drag = null; $('#bqs-ob').style.transform = 'rotateY(' + (ry % 360 ? 0 : 0) + 'deg)'; ry = 0; rx = 0; });
    $('#bqs-rp').addEventListener('click', function () { if (cur) cel(cur); });
    $('#bqs-ok').addEventListener('click', function () { rew.classList.remove('on'); open = false; setTimeout(flush, 400); });

    /* ---------- معرض الجوائز ---------- */
    var gal = document.createElement('div'); gal.id = 'bqs-gal'; document.body.appendChild(gal);
    chip.addEventListener('click', function () {
      gal.innerHTML = '<div class="pn"><h3 style="margin:0">🏆 جوائزي · Mes récompenses</h3><div style="font-size:.8rem;opacity:.85">⏱ وقت هذه الجلسة: <b style="direction:ltr;display:inline-block">' + clock(elapsed) + '</b></div><div class="gr">' +
        PR.map(function (p) { var ok = elapsed >= p.at * MIN || col[p.id]; return '<button type="button" class="gc ' + (ok ? '' : 'lk') + '" data-id="' + p.id + '"><div class="th">' + (ok ? p.art() : '🔒') + '</div><b>' + p.ar + '</b><small>' + (ok ? (shown[p.id] ? 'اضغط للمشاهدة 🎬' : 'مكتسبة سابقًا ✓') : 'بعد ' + p.at + ' دقيقة') + '</small></button>'; }).join('') + '</div><button class="bqs-b" id="bqs-gx" type="button" style="width:100%">إغلاق</button></div>';
      gal.classList.add('on');
    });
    gal.addEventListener('click', function (e) {
      if (e.target === gal || e.target.id === 'bqs-gx') { gal.classList.remove('on'); return; }
      var c = e.target.closest('.gc'); if (!c || c.classList.contains('lk')) return;
      var p = PR.filter(function (x) { return x.id === c.dataset.id; })[0]; gal.classList.remove('on'); ac(); show(p);
    });
    document.addEventListener('visibilitychange', function () { last = performance.now(); });
    window.__bqSplash = { elapsed: function () { return elapsed; }, prizes: PR.length };
  }
})();
