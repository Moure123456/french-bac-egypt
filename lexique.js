/* ===== lexique.js — «اختبر نفسك» (Le Défi) + تبويب «كلمات» في القاموس =====
   يعمل داخل #quiz-root (قسم lessons) و #dict-root (قسم dictionary) فقط.
   يقرأ data/words.json + مفردات data/bac_*.json. كل إجابة صحيحة تسرّع عدّاد جوائز splash.js. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[lexique]', e); } catch (_) {} } });

  function boot() {
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9\u0600-\u06FF' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function clean(s) { return String(s).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); }
    function noArt(s) { return s.replace(/^(?:l'|le |la |les |un |une |des )/i, ''); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }

    /* ---------- الصوت ---------- */
    function say(t, rate) { try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(clean(t)); u.lang = 'fr-FR'; u.rate = rate || 0.9; speechSynthesis.speak(u); } catch (e) {} }
    var AC = null;
    function tn(f, t0, d, type, v) { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (!AC) return; if (AC.state === 'suspended') AC.resume(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    function sOk(c) { tn(660 + Math.min(c, 8) * 40, 0, 0.12, 'triangle', 0.16); tn(990 + Math.min(c, 8) * 40, 0.1, 0.2, 'triangle', 0.16); }
    function sBad() { tn(220, 0, 0.25, 'sawtooth', 0.1); tn(150, 0.15, 0.3, 'sawtooth', 0.1); }
    function sWin() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tn(f, i * 0.12, 0.3, 'triangle', 0.16); }); }
    function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }

    /* ---------- تحميل الكلمات ---------- */
    var W = [], CATS = [], P = null, LX = [], LCATS = [], LP = null;
    var FB = [['Bonjour', 'صباح الخير', 'Bonjour !', 'صباح الخير!'], ['Merci', 'شكرًا', 'Merci !', 'شكرًا!'], ['le livre', 'الكتاب', '', ''], ['le stylo', 'القلم', '', ''], ['la classe', 'الفصل', '', ''], ['le pain', 'الخبز', '', ''], ['l\'eau', 'الماء', '', ''], ['la maison', 'المنزل', '', '']];
    function cands(file) {
      var base = location.pathname.replace(/[^/]*$/, '');
      var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file];
      var h = location.hostname;
      if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); }
      return l.filter(function (c, i) { return l.indexOf(c) === i; });
    }
    function getJson(file) {
      var c = cands(file), i = 0;
      function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); }
      return nx();
    }
    function loadWords() {
      if (P) return P;
      P = Promise.all([getJson('words.json'), getJson('bac_1sec.json'), getJson('bac_2sec.json'), getJson('bac_3sec.json')]).then(function (r) {
        var seen = {};
        function add(o) { var k = norm(clean(o.fr)); if (!k || seen[k]) return; seen[k] = 1; o.id = k; W.push(o); }
        if (r[0] && r[0].categories) r[0].categories.forEach(function (c) { CATS.push({ id: c.id, ic: c.ic, ar: c.ar }); c.words.forEach(function (w) { add({ fr: w[0], ar: w[1], ex: w[2] || '', exAr: w[3] || '', cat: c.id }); }); });
        var yl = ['1ère Sec', '2ème Sec', '3ème Sec'], cur = false;
        [1, 2, 3].forEach(function (n) { var d = r[n]; if (!d || !d.units) return; d.units.forEach(function (u) { (u.lessons || []).forEach(function (l) { (l.vocab || []).forEach(function (v) { if (!v.fr || /[≠…]/.test(v.fr)) return; cur = true; add({ fr: v.fr, ar: v.ar, ex: v.ex || '', exAr: '', cat: 'curr', yr: yl[n - 1] }); }); }); }); });
        if (cur) CATS.push({ id: 'curr', ic: '📚', ar: 'كلمات المنهج' });
        if (W.length < 8) { FB.forEach(function (w) { add({ fr: w[0], ar: w[1], ex: w[2], exAr: w[3], cat: 'gen' }); }); CATS.push({ id: 'gen', ic: '🌟', ar: 'كلمات أساسية' }); }
        return W;
      });
      return P;
    }
    function favs() { return store('bq_fav') || []; }
    function icOf(id) { var c = CATS.concat(LCATS).filter(function (x) { return x.id === id; })[0]; return c ? c.ic : '🌟'; }

    /* ---------- التنسيق ---------- */
    var st = document.createElement('style');
    st.textContent = '.lx{color:#1b2a3a}.lx *{box-sizing:border-box}.lx button{font-family:inherit;cursor:pointer}' +
      '#lessons .body .tabs{display:none!important}.lx-tabs{display:flex;gap:8px;margin:0 0 12px}.lx-tabs button{flex:1;border:0;border-radius:14px;padding:12px;font-weight:800;font-size:.95rem;background:#e8eef6;color:#33475b;transition:.2s}.lx-tabs button.on{background:linear-gradient(135deg,#0055A5,#7c3aed);color:#fff;box-shadow:0 6px 16px rgba(0,85,165,.35);transform:translateY(-1px)}' +
      '.lx-wod{border-radius:20px;padding:16px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#0055A5,#7c3aed,#db2777);background-size:200% 200%;animation:lxBg 8s ease infinite;box-shadow:0 8px 24px rgba(124,58,237,.35);text-align:center}@keyframes lxBg{50%{background-position:100% 50%}}' +
      '.lx-wod small{opacity:.85}.lx-wod .f{font-size:2rem;font-weight:900;margin:4px 0;direction:ltr}.lx-wod .a{font-size:1.1rem}' +
      '.lx-in{width:100%;border:2px solid #d6e2f0;border-radius:14px;padding:12px 14px;font-family:inherit;font-size:1rem;margin-bottom:8px}.lx-in:focus{outline:0;border-color:#7c3aed}' +
      '.lx-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px}.lx-chips button{flex:none;border:0;border-radius:20px;padding:8px 13px;background:#fff;border:1px solid #d6e2f0;font-weight:700;font-size:.82rem;color:#33475b}.lx-chips button.on{background:#7c3aed;color:#fff;border-color:#7c3aed}' +
      '.lx-count{font-size:.8rem;color:#5d6b7a;margin:2px 0 8px}.lx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:380px){.lx-grid{grid-template-columns:1fr}}' +
      '.lx-card{background:#fff;border:1px solid #d6e2f0;border-top:4px solid var(--c,#7c3aed);border-radius:16px;padding:10px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.06);animation:lxIn .35s both}@keyframes lxIn{from{opacity:0;transform:translateY(10px)}}' +
      '.lx-top{display:flex;justify-content:space-between;align-items:center}.lx-top span{font-size:1.2rem}.lx-fav{border:0;background:none;font-size:1.25rem;padding:0}' +
      '.lx-fr{font-size:1.25rem;font-weight:900;color:#0055A5;direction:ltr;margin:4px 0 2px;word-break:break-word}.lx-ar{color:#5d6b7a;font-size:.92rem;min-height:1.4em}' +
      '.lx-acts{display:flex;justify-content:center;gap:6px;margin-top:8px}.lx-acts button{width:38px;height:38px;border-radius:50%;border:0;background:#eef2ff;font-size:1.05rem;transition:.15s}.lx-acts button:active{transform:scale(.88)}.lx-acts button.rec{background:#fecaca;animation:lxPulse 1s infinite}@keyframes lxPulse{50%{transform:scale(1.15)}}' +
      '.lx-fb{font-size:.8rem;margin-top:6px;min-height:0}.lx-exb{margin-top:8px;background:#f5f3ff;border-radius:12px;padding:8px;font-size:.85rem;text-align:left;direction:ltr}.lx-exb small{display:block;color:#5d6b7a;direction:rtl;text-align:right}' +
      '.lx-more{display:block;margin:12px auto;border:0;border-radius:20px;padding:10px 24px;background:linear-gradient(135deg,#0055A5,#7c3aed);color:#fff;font-weight:800}' +
      '#dictionary .word{border-radius:14px!important;border-right:4px solid #7c3aed!important;transition:.15s}#dictionary .word:active{transform:scale(.99)}' +
      /* اللعبة */
      '.lx-hero{border-radius:22px;padding:18px;color:#fff;text-align:center;background:linear-gradient(135deg,#1e1b4b,#4338ca 50%,#be185d);box-shadow:0 10px 30px rgba(67,56,202,.4);margin-bottom:12px;position:relative;overflow:hidden}.lx-hero:before{content:"";position:absolute;inset:-40%;background:repeating-conic-gradient(rgba(255,255,255,.07) 0 10deg,transparent 10deg 20deg);animation:lxSp 30s linear infinite}@keyframes lxSp{to{transform:rotate(360deg)}}.lx-hero>*{position:relative}' +
      '.lx-hero h3{margin:0;font-size:1.4rem}.lx-stats{display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap}.lx-stats span{background:rgba(255,255,255,.18);border-radius:14px;padding:6px 12px;font-size:.82rem;font-weight:800}' +
      '.lx-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.lx-mode{border:0;border-radius:18px;padding:16px 8px;color:#fff;font-weight:900;font-size:.95rem;box-shadow:0 6px 16px rgba(0,0,0,.2);transition:.15s;line-height:1.5}.lx-mode:active{transform:scale(.95)}.lx-mode i{display:block;font-style:normal;font-size:2rem}.lx-mode small{display:block;font-weight:600;opacity:.9;font-size:.72rem}' +
      '.lx-play{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:14px;color:#fff;min-height:380px;box-shadow:0 10px 28px rgba(49,46,129,.45)}.lx-play.shake{animation:lxSh .4s}@keyframes lxSh{25%,75%{transform:translateX(-8px)}50%{transform:translateX(8px)}}' +
      '.lx-hud{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:.9rem;margin-bottom:8px}.lx-hud b{background:rgba(255,255,255,.18);border-radius:12px;padding:4px 10px}.lx-bar{height:10px;border-radius:6px;background:rgba(255,255,255,.2);overflow:hidden;margin-bottom:12px}.lx-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#34d399,#fde047,#fb7185);transition:width .1s linear}' +
      '.lx-q{text-align:center;margin:8px 0 14px}.lx-q .big{font-size:2.1rem;font-weight:900;direction:ltr;text-shadow:0 0 18px rgba(253,224,71,.6);word-break:break-word}.lx-q .big.ar{direction:rtl}.lx-q .hint{opacity:.85;font-size:.85rem;margin-top:6px;direction:ltr;letter-spacing:3px}' +
      '.lx-q button.sp{border:0;border-radius:50%;width:64px;height:64px;font-size:1.8rem;background:linear-gradient(135deg,#fde047,#fb923c);box-shadow:0 0 24px rgba(253,224,71,.7);animation:lxPulse 1.4s infinite;margin:4px}' +
      '.lx-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lx-opt{border:2px solid rgba(255,255,255,.25);border-radius:16px;padding:14px 6px;background:rgba(255,255,255,.12);color:#fff;font-weight:800;font-size:1rem;transition:.15s;word-break:break-word}.lx-opt:active{transform:scale(.96)}.lx-opt.ok{background:#16a34a;border-color:#bbf7d0;animation:lxPop .4s}.lx-opt.no{background:#dc2626;border-color:#fecaca}@keyframes lxPop{50%{transform:scale(1.08)}}' +
      '.lx-type{display:flex;gap:8px}.lx-type input{flex:1;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;border-radius:14px;padding:12px;font-size:1.1rem;direction:ltr;font-family:inherit}.lx-type input::placeholder{color:rgba(255,255,255,.6)}.lx-type button{border:0;border-radius:14px;padding:0 18px;background:linear-gradient(135deg,#fde047,#fb923c);font-weight:900;color:#7c2d12}' +
      '.lx-msg{min-height:44px;text-align:center;font-weight:800;margin-top:12px;font-size:.95rem}.lx-fl{position:fixed;z-index:100004;pointer-events:none;font-weight:900;font-size:1.3rem;color:#fde047;text-shadow:0 2px 8px #000;animation:lxFl 1.1s forwards}@keyframes lxFl{to{transform:translateY(-70px);opacity:0}}' +
      '.lx-end{text-align:center;padding:10px}.lx-end .stars{font-size:2.6rem;letter-spacing:6px}.lx-end .sc{font-size:2.4rem;font-weight:900;color:#fde047}.lx-end p{margin:6px 0}.lx-btn{border:0;border-radius:24px;padding:12px 22px;margin:6px;font-weight:900;background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}.lx-btn.g{background:rgba(255,255,255,.18);color:#fff}' +
      '.lx-pool{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.lx-pool button{flex:none;border:0;border-radius:20px;padding:7px 12px;background:#fff;border:1px solid #d6e2f0;font-weight:700;font-size:.8rem}.lx-pool button.on{background:#4338ca;color:#fff;border-color:#4338ca}';
    st.textContent += '.lx-lh{background:linear-gradient(135deg,#065f46,#0d9488 50%,#2563eb)}.lx-lh h3{margin:0;font-size:1.3rem}.lx-prog{height:12px;border-radius:8px;background:rgba(255,255,255,.25);overflow:hidden;margin:10px 0 4px}.lx-prog i{display:block;height:100%;background:linear-gradient(90deg,#fde047,#fb923c,#f43f5e);border-radius:8px;transition:width .5s}.lx-hb{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.lx-hb button{border:0;border-radius:14px;padding:10px 4px;font-weight:800;font-size:.85rem;background:rgba(255,255,255,.2);color:#fff;transition:.15s}.lx-hb button:active{transform:scale(.95)}' +
      '.lx-letters{display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:4px}.lx-letters button{flex:none;min-width:34px;height:34px;border-radius:10px;border:1px solid #d6e2f0;background:#fff;font-weight:800;color:#0055A5}.lx-letters button.on{background:#0055A5;color:#fff}' +
      '.lx-cgrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);gap:8px;overflow-x:auto;padding:4px 2px 10px;margin-bottom:4px}.lx-ct{width:96px;border:0;border-radius:16px;padding:8px 4px;background:#fff;border:2px solid #e2e8f0;text-align:center;transition:.15s}.lx-ct i{display:block;font-style:normal;font-size:1.5rem}.lx-ct b{display:block;font-size:.72rem;color:#1b2a3a;line-height:1.3;min-height:2.2em}.lx-ct small{font-size:.66rem;color:#5d6b7a}.lx-ct.on{border-color:var(--c);background:var(--c);box-shadow:0 6px 14px rgba(0,0,0,.2)}.lx-ct.on b,.lx-ct.on small{color:#fff}' +
      '.lx-row{background:#fff;border:1px solid #e2e8f0;border-right:5px solid #cbd5e1;border-radius:14px;padding:8px 10px;margin-bottom:8px;transition:.2s}.lx-row.kn{border-right-color:#16a34a;background:#f0fdf4}.lx-row.pl{border-right-color:#f59e0b;background:#fffbeb;transform:scale(1.02);box-shadow:0 6px 16px rgba(245,158,11,.35)}.lx-row .rw{display:flex;align-items:center;justify-content:space-between;gap:8px}.lx-row .t b{display:block;color:#0055A5;font-size:1.05rem;direction:ltr;text-align:left}.lx-row .t span{color:#5d6b7a;font-size:.88rem}.lx-row .b{display:flex;gap:4px;flex:none}.lx-row .b button{width:34px;height:34px;border-radius:50%;border:0;background:#eef2ff;font-size:.95rem}.lx-row .b button.rec{background:#fecaca;animation:lxPulse 1s infinite}.lx-row .b button.on{background:#bbf7d0}' +
      '.lx-fcbox{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:14px;color:#fff;text-align:center;margin-top:10px;box-shadow:0 10px 28px rgba(49,46,129,.45)}.lx-fch{display:flex;justify-content:space-between;font-weight:800;margin-bottom:10px}.lx-fcw{perspective:900px;height:210px;margin-bottom:12px}.lx-fc{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .55s;cursor:pointer}.lx-fc.flip{transform:rotateY(180deg)}.lx-fcf{position:absolute;inset:0;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;padding:10px}.lx-fcf.f{background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}.lx-fcf.b{background:linear-gradient(135deg,#34d399,#0ea5e9);color:#064e3b;transform:rotateY(180deg)}.lx-fcf .big{font-size:2rem;font-weight:900;word-break:break-word}.lx-fcf small{opacity:.8}.lx-fcf button{border:0;border-radius:50%;width:48px;height:48px;font-size:1.3rem;background:rgba(255,255,255,.55)}';
    document.head.appendChild(st);

    /* =================== القاموس: تبويب كلمات =================== */
    var DS = $('#dictionary'), DR = $('#dict-root'), builtW = false;
    var WS = { cat: 'all', q: '', n: 40 };
    function sim(a, b) { var m = a.length, n = b.length, d = [], i, j; if (!m || !n) return 0; for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 1; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return 1 - d[m][n] / Math.max(m, n); }
    function colOf(cat) { var k = ['#0055A5', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#ca8a04', '#4f46e5', '#dc2626', '#0d9488', '#9333ea']; var i = Math.max(0, CATS.map(function (c) { return c.id; }).indexOf(cat)); return k[i % k.length]; }
    function cardHTML(w, i) {
      var f = favs().indexOf(w.id) > -1;
      return '<div class="lx-card" data-id="' + esc(w.id) + '" style="--c:' + colOf(w.cat) + ';animation-delay:' + Math.min(i, 12) * 30 + 'ms"><div class="lx-top"><span>' + icOf(w.cat) + '</span><button type="button" class="lx-fav" data-a="fav">' + (f ? '⭐' : '☆') + '</button></div>' +
        '<div class="lx-fr">' + esc(w.fr) + '</div><div class="lx-ar">' + esc(w.ar) + '</div>' + (w.yr ? '<small style="color:#7c3aed">' + esc(w.yr) + '</small>' : '') +
        '<div class="lx-acts"><button type="button" data-a="say" title="نطق">🔊</button><button type="button" data-a="slow" title="نطق بطيء">🐢</button><button type="button" data-a="mic" title="جرّب نطقك">🎤</button>' + (w.ex ? '<button type="button" data-a="ex" title="جملة">💡</button>' : '') + '</div>' +
        '<div class="lx-fb"></div>' + (w.ex ? '<div class="lx-exb" hidden>' + esc(w.ex) + ' <button type="button" data-a="exsay" style="border:0;background:none">🔊</button>' + (w.exAr ? '<small>' + esc(w.exAr) + '</small>' : '') + '</div>' : '') + '</div>';
    }
    function paintWords() {
      var f = favs(), q = norm(WS.q);
      var list = W.filter(function (w) { return (WS.cat === 'all' || (WS.cat === 'fav' ? f.indexOf(w.id) > -1 : w.cat === WS.cat)) && (!q || norm(w.fr).indexOf(q) > -1 || norm(w.ar).indexOf(q) > -1 || w.ar.indexOf(WS.q) > -1); });
      $('.lx-count', DR).textContent = list.length + ' كلمة' + (WS.cat === 'fav' && !list.length ? ' — اضغط ☆ لإضافة كلمات إلى المفضلة' : '');
      $('.lx-grid', DR).innerHTML = list.slice(0, WS.n).map(cardHTML).join('');
      var more = $('.lx-more', DR); more.style.display = list.length > WS.n ? 'block' : 'none';
    }
    function buildWords() {
      var box = $('#lx-words', DR); box.innerHTML = '<div class="lx-count">⏳ جارٍ تحميل القاموس…</div>';
      loadWords().then(function () {
        var day = Math.floor(Date.now() / 86400000), w = W[day % W.length];
        box.innerHTML = '<div class="lx-wod" data-id="' + esc(w.id) + '"><small>✨ كلمة اليوم · Mot du jour</small><div class="f">' + esc(w.fr) + '</div><div class="a">' + esc(w.ar) + '</div><div class="lx-acts"><button type="button" data-a="say">🔊</button><button type="button" data-a="slow">🐢</button><button type="button" data-a="mic">🎤</button></div><div class="lx-fb"></div></div>' +
          '<input class="lx-in" type="search" placeholder="🔎 ابحث بالفرنسية أو بالعربية…"><div class="lx-chips"><button type="button" class="on" data-c="all">🌍 الكل</button><button type="button" data-c="fav">⭐ المفضلة</button>' +
          CATS.map(function (c) { return '<button type="button" data-c="' + c.id + '">' + c.ic + ' ' + esc(c.ar) + '</button>'; }).join('') + '</div><div class="lx-count"></div><div class="lx-grid"></div><button type="button" class="lx-more">عرض المزيد ⬇</button>';
        builtW = true; paintWords();
      });
    }
    function wordOf(el) { var c = el.closest('[data-id]'); var id = c && c.dataset.id; return { card: c, w: W.filter(function (x) { return x.id === id; })[0] }; }
    function mic(card, w) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition, fb = $('.lx-fb', card), btn = $('[data-a="mic"]', card);
      if (!SR) { fb.textContent = '🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome).'; return; }
      var r = new SR(); r.lang = 'fr-FR'; r.maxAlternatives = 3; fb.textContent = 'تكلّم الآن… 🎙️'; btn.classList.add('rec');
      r.onresult = function (e) {
        var t = clean(w.fr).toLowerCase(), best = 0, heard = '';
        for (var i = 0; i < e.results[0].length; i++) { var h = norm(e.results[0][i].transcript); var s = Math.max(sim(h, norm(t)), sim(h, norm(noArt(t)))); if (s > best) { best = s; heard = e.results[0][i].transcript; } }
        fb.innerHTML = (best >= 0.85 ? '🎉 ممتاز! نطقك رائع' : best >= 0.6 ? '👍 قريب جدًا، أعد المحاولة' : '🔁 حاول مرة أخرى') + ' <small dir="ltr">(' + esc(heard) + ')</small>'; if (best >= 0.85) { sOk(3); buzz(30); }
      };
      r.onerror = function () { fb.textContent = '⚠️ لم أسمعك جيدًا، أعد المحاولة.'; };
      r.onend = function () { btn.classList.remove('rec'); };
      try { r.start(); } catch (e) { btn.classList.remove('rec'); }
    }
    function dictInit() {
      if (!DS || !DR) return;
      var body = $('.body', DS);
      DR.innerHTML = '<div class="lx"><div class="lx-tabs"><button type="button" class="on" data-t="phr">💬 معجم الجمل</button><button type="button" data-t="wrd">📖 كلمات</button></div><div id="lx-words" style="display:none"></div></div>';
      DR.addEventListener('click', function (e) {
        var t = e.target.closest('.lx-tabs button');
        if (t) {
          $$('.lx-tabs button', DR).forEach(function (b) { b.classList.toggle('on', b === t); });
          var wr = t.dataset.t === 'wrd'; if (body) body.style.display = wr ? 'none' : ''; $('#lx-words', DR).style.display = wr ? '' : 'none'; if (wr && !builtW) buildWords(); return;
        }
        var ch = e.target.closest('.lx-chips button');
        if (ch) { WS.cat = ch.dataset.c; WS.n = 40; $$('.lx-chips button', DR).forEach(function (b) { b.classList.toggle('on', b === ch); }); paintWords(); return; }
        if (e.target.closest('.lx-more')) { WS.n += 40; paintWords(); return; }
        var a = e.target.closest('[data-a]'); if (!a) return;
        var o = wordOf(a), w = o.w; if (!w) return;
        if (a.dataset.a === 'say') say(w.fr); else if (a.dataset.a === 'slow') say(w.fr, 0.5);
        else if (a.dataset.a === 'mic') mic(o.card, w);
        else if (a.dataset.a === 'ex') { var x = $('.lx-exb', o.card); x.hidden = !x.hidden; if (!x.hidden) say(w.ex); }
        else if (a.dataset.a === 'exsay') say(w.ex);
        else if (a.dataset.a === 'fav') { var f = favs(), i = f.indexOf(w.id); if (i > -1) f.splice(i, 1); else f.push(w.id); store('bq_fav', f); a.textContent = i > -1 ? '☆' : '⭐'; if (WS.cat === 'fav') paintWords(); }
      });
      DR.addEventListener('input', function (e) { if (e.target.classList.contains('lx-in')) { WS.q = e.target.value; WS.n = 40; paintWords(); } });
    }

    /* =================== اللعبة: اختبر نفسك =================== */
    var QS = $('#lessons'), QR = $('#quiz-root');
    var MODES = [
      { id: 'fr2ar', ic: '⚡', t: 'سباق الكلمات', s: 'فرنسي ← عربي', c: 'linear-gradient(135deg,#0ea5e9,#2563eb)' },
      { id: 'ar2fr', ic: '🇫🇷', t: 'من العربية', s: 'اختر الكلمة الفرنسية', c: 'linear-gradient(135deg,#ec4899,#be185d)' },
      { id: 'listen', ic: '🎧', t: 'اسمع واختر', s: 'تدريب الاستماع', c: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
      { id: 'type', ic: '✍️', t: 'اكتب الكلمة', s: 'تحدّي الإملاء', c: 'linear-gradient(135deg,#10b981,#047857)' }];
    var RANKS = [[0, '🌱 مبتدئ'], [200, '📘 متعلّم'], [600, '⭐ ماهر'], [1200, '🔥 محترف'], [2500, '👑 خبير'], [5000, '🏆 أسطورة']];
    var G = null, tmr = null, pool = 'all', GR = null, LR = null, lexBuilt = false, FC = null, LST = null, LS = { cat: 'all', q: '', l: '', n: 50 };
    function stats() { return store('bq_quiz') || { pts: 0, best: 0, played: 0 }; }
    function rank(p) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (p >= x[0]) r = x[1]; }); return r; }
    function QA() { var seen = {}, out = []; W.concat(LX).forEach(function (w) { if (!seen[w.id]) { seen[w.id] = 1; out.push(w); } }); return out; }
    function stopT() { clearInterval(tmr); tmr = null; }
    function poolList() { var f = favs(); var l = QA().filter(function (w) { return pool === 'all' || (pool === 'fav' ? f.indexOf(w.id) > -1 : w.cat === pool); }); return l; }
    function home() {
      stopT(); G = null; var s = stats(), el = window.__bqSplash && window.__bqSplash.elapsed ? Math.floor(window.__bqSplash.elapsed() / 60000) : null;
      GR.innerHTML = '<div class="lx"><div class="lx-hero"><div style="font-size:2.6rem">🎮</div><h3>اختبر نفسك · Le Défi</h3><div style="opacity:.9;font-size:.9rem;margin-top:4px">كل إجابة صحيحة تكسبك نقاطًا وتسرّع جوائزك ⚡🐓🦁🐋</div>' +
        '<div class="lx-stats"><span>' + rank(s.pts) + '</span><span>🏅 ' + s.pts + ' نقطة</span><span>🔥 أفضل سلسلة ' + s.best + '</span>' + (el != null ? '<span>⏱ جلستك ' + el + ' د</span>' : '') + '</div></div>' +
        '<div style="font-weight:800;margin:6px 0 4px">اختر مجموعة الكلمات:</div><div class="lx-pool" id="lx-pool"><span style="font-size:.8rem;color:#5d6b7a">⏳ جارٍ التحميل…</span></div>' +
        '<div class="lx-modes">' + MODES.map(function (m) { return '<button type="button" class="lx-mode" data-m="' + m.id + '" style="background:' + m.c + '"><i>' + m.ic + '</i>' + m.t + '<small>' + m.s + '</small></button>'; }).join('') + '</div></div>';
      Promise.all([loadWords(), loadLex()]).then(function () { var f = favs().length; var el2 = $('#lx-pool'); if (!el2) return; el2.innerHTML = '<button type="button" data-p="all" class="' + (pool === 'all' ? 'on' : '') + '">🌍 الكل (' + QA().length + ')</button>' + (f ? '<button type="button" data-p="fav" class="' + (pool === 'fav' ? 'on' : '') + '">⭐ مفضلتي (' + f + ')</button>' : '') + CATS.concat(LCATS).map(function (c) { return '<button type="button" data-p="' + c.id + '" class="' + (pool === c.id ? 'on' : '') + '">' + c.ic + ' ' + esc(c.ar) + '</button>'; }).join(''); });
    }
    function mkQ(w, mode, list) {
      var key = mode === 'ar2fr' || mode === 'listen' ? 'fr' : 'ar', others = shuffle(list.filter(function (x) { return x.id !== w.id && x[key] !== w[key]; }));
      if (others.length < 3) others = shuffle(QA().filter(function (x) { return x.id !== w.id && x[key] !== w[key]; }));
      var opts = shuffle([w[key]].concat(others.slice(0, 3).map(function (x) { return x[key]; })));
      return { w: w, opts: opts, key: key };
    }
    function start(mode) {
      var list = poolList(); if (list.length < 4) list = QA(); if (QA().length < 4) { GR.innerHTML = '<div class="lx"><div class="lx-hero">لا توجد كلمات كافية بعد.</div></div>'; return; }
      var qs = shuffle(list).slice(0, 10).map(function (w) { return mkQ(w, mode, list); });
      G = { mode: mode, qs: qs, i: 0, pts: 0, ok: 0, streak: 0, best: 0, boost: 0, locked: false };
      GR.innerHTML = '<div class="lx"><div class="lx-play" id="lx-play"></div></div>'; ask();
    }
    function ask() {
      if (G.i >= G.qs.length) return end();
      var q = G.qs[G.i], m = G.mode, w = q.w, tl = m === 'type' ? 25 : 10, h = '';
      G.locked = false; G.t = tl; G.tl = tl;
      h += '<div class="lx-hud"><b>' + (G.i + 1) + ' / ' + G.qs.length + '</b><b>🏅 ' + G.pts + '</b><b>' + (G.streak > 1 ? '🔥 ×' + G.streak : '🎯') + '</b></div><div class="lx-bar"><i id="lx-bar"></i></div><div class="lx-q">';
      if (m === 'fr2ar') h += '<div class="big">' + esc(w.fr) + '</div><button type="button" class="sp" data-s="1" style="width:46px;height:46px;font-size:1.2rem;animation:none">🔊</button>';
      else if (m === 'ar2fr') h += '<div class="big ar">' + esc(w.ar) + '</div>';
      else if (m === 'listen') h += '<div style="opacity:.9">ماذا سمعت؟</div><button type="button" class="sp" data-s="1">🔊</button><button type="button" class="sp" data-s="slow" style="width:44px;height:44px;font-size:1.1rem;animation:none">🐢</button>';
      else { var c = clean(w.fr); h += '<div class="big ar">' + esc(w.ar) + '</div><div class="hint">' + esc(c.charAt(0)) + ' ' + c.slice(1).replace(/[^ ]/g, '_ ') + '</div>'; }
      h += '</div>';
      if (m === 'type') h += '<div class="lx-type"><input id="lx-ti" type="text" autocomplete="off" autocapitalize="off" placeholder="اكتب بالفرنسية…"><button type="button" data-ck="1">تحقق</button></div>';
      else h += '<div class="lx-opts">' + q.opts.map(function (o, i) { return '<button type="button" class="lx-opt" data-o="' + i + '" dir="' + (q.key === 'ar' ? 'rtl' : 'ltr') + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      h += '<div class="lx-msg" id="lx-msg"></div>';
      $('#lx-play').innerHTML = h;
      if (m === 'listen' || m === 'fr2ar') setTimeout(function () { say(w.fr); }, 250);
      if (m === 'type') { var ti = $('#lx-ti'); if (ti) ti.focus(); }
      stopT(); tmr = setInterval(function () {
        if (!QS.classList.contains('on') || GR.style.display === 'none' || !G || G.locked) return;
        G.t -= 0.1; var b = $('#lx-bar'); if (b) b.style.width = Math.max(0, G.t / G.tl * 100) + '%';
        if (G.t <= 0) answer(false, true);
      }, 100);
    }
    function fl(txt, el) { var r = (el || $('#lx-play')).getBoundingClientRect(), d = document.createElement('div'); d.className = 'lx-fl'; d.textContent = txt; d.style.left = (r.left + r.width / 2 - 40) + 'px'; d.style.top = (r.top + 40) + 'px'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1150); }
    function answer(ok, timeout, idx) {
      if (!G || G.locked) return; G.locked = true; stopT();
      var q = G.qs[G.i], w = q.w, msg = $('#lx-msg'), play = $('#lx-play');
      $$('.lx-opt', play).forEach(function (b, i) { if (q.opts[i] === w[q.key]) b.classList.add('ok'); else if (i === idx) b.classList.add('no'); b.disabled = true; });
      if (ok) {
        G.streak++; G.best = Math.max(G.best, G.streak); G.ok++;
        var pts = 10 + Math.min(G.streak, 10) * 2 + Math.round(G.t / G.tl * 10), sec = 12 + 4 * Math.min(G.streak, 6);
        G.pts += pts; G.boost += sec; sOk(G.streak); buzz(20);
        if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(sec * 1000);
        fl('+' + pts + ' 🏅  ⚡' + sec + 'ث'); msg.innerHTML = ['🎉 أحسنت!', '🔥 رائع!', '🚀 مذهل!', '👑 أسطوري!'][Math.min(3, Math.floor(G.streak / 3))] + (G.streak > 2 ? ' سلسلة ×' + G.streak : '');
      } else {
        G.streak = 0; sBad(); buzz([60, 40, 60]); play.classList.remove('shake'); void play.offsetWidth; play.classList.add('shake');
        msg.innerHTML = (timeout ? '⏰ انتهى الوقت! ' : '❌ ') + 'الصواب: <span dir="ltr">' + esc(clean(w.fr)) + '</span> = ' + esc(w.ar);
      }
      if (G.mode !== 'fr2ar') say(w.fr);
      setTimeout(function () { if (G) { G.i++; ask(); } }, ok ? 900 : 2000);
    }
    function end() {
      stopT(); var s = stats(), n = G.qs.length, stars = G.ok >= 9 ? 3 : G.ok >= 7 ? 2 : G.ok >= 5 ? 1 : 0;
      s.pts += G.pts; s.best = Math.max(s.best, G.best); s.played++; store('bq_quiz', s); sWin();
      $('#lx-play').innerHTML = '<div class="lx-end"><div class="stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div><div class="sc">' + G.pts + ' 🏅</div><p>✅ ' + G.ok + ' / ' + n + ' إجابة صحيحة · 🔥 أفضل سلسلة ' + G.best + '</p>' +
        '<p>⚡ سرّعت جوائزك بمقدار <b>' + (G.boost / 60).toFixed(1) + '</b> دقيقة</p><p>' + rank(s.pts) + ' — إجمالي ' + s.pts + ' نقطة</p>' +
        '<button type="button" class="lx-btn" data-again="' + G.mode + '">🔁 العب مجددًا</button><button type="button" class="lx-btn g" data-home="1">🏠 القائمة</button></div>';
      G = null;
    }
    function showDict(n) {
      var b = $('.body', QS); if (!b) return; var t = $$('.tabs .tab', b).filter(function (x) { return x.textContent.indexOf('قاموس') > -1; })[0];
      if (t) { if (!t.classList.contains('on')) t.click(); } else if ((n || 0) < 30) setTimeout(function () { showDict((n || 0) + 1); }, 300);
    }
    function qInit() {
      if (!QS || !QR) return;
      QR.innerHTML = '<div class="lx"><div class="lx-tabs"><button type="button" class="on" data-qt="game">🎮 اختبر نفسك</button><button type="button" data-qt="dict">📖 قاموس المنهج</button></div><div id="lx-game"></div><div id="lx-lex" style="display:none"></div></div>';
      GR = $('#lx-game', QR); LR = $('#lx-lex', QR);
      QR.addEventListener('click', function (e) {
        var qt = e.target.closest('[data-qt]');
        if (qt) { var dm = qt.dataset.qt === 'dict', body = $('.body', QS); $$('.lx-tabs button', QR).forEach(function (b) { b.classList.toggle('on', b === qt); }); GR.style.display = dm ? 'none' : ''; $('#lx-lex').style.display = 'none'; if (body) body.style.display = 'none'; stopListen(); if (dm) openLex(body); return; }
        var m = e.target.closest('[data-m]'), p = e.target.closest('[data-p]'), o = e.target.closest('[data-o]'), sp = e.target.closest('[data-s]');
        if (m) { start(m.dataset.m); return; }
        if (p) { pool = p.dataset.p; $$('#lx-pool button').forEach(function (b) { b.classList.toggle('on', b === p); }); return; }
        if (e.target.closest('[data-home]')) { home(); return; }
        var ag = e.target.closest('[data-again]'); if (ag) { start(ag.dataset.again); return; }
        if (sp && G) { say(G.qs[G.i].w.fr, sp.dataset.s === 'slow' ? 0.5 : 0.9); return; }
        if (o && G && !G.locked) { var q = G.qs[G.i], i = +o.dataset.o; answer(q.opts[i] === q.w[q.key], false, i); return; }
        if (e.target.closest('[data-ck]') && G && !G.locked) checkType();
      });
      QR.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'lx-ti' && G && !G.locked) checkType(); });
      function checkType() {
        var v = norm($('#lx-ti').value), t = norm(clean(G.qs[G.i].w.fr)); if (!v) return;
        answer(v === t || v === norm(noArt(t)), false);
      }
      new MutationObserver(function () { if (!QS.classList.contains('on')) { stopT(); stopListen(); if (G) home(); } else if (!G) home(); }).observe(QS, { attributes: true, attributeFilter: ['class'] });
      home();
    }

    /* =================== قاموس الحياة (1000+ كلمة): بحث، فئات، بطاقات، استماع، تتبّع التعلّم =================== */
    var PAL = ['#0055A5', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#ca8a04', '#4f46e5', '#dc2626', '#0d9488'];
    function known() { return store('bq_known') || []; }
    function lw(id) { for (var i = 0; i < LX.length; i++) if (LX[i].id === id) return LX[i]; return null; }
    function loadLex() {
      if (LP) return LP;
      LP = getJson('lexicon.json').then(function (d) {
        if (!d || !d.categories) return LX; var seen = {};
        d.categories.forEach(function (c) { LCATS.push({ id: 'x_' + c.id, ic: c.ic, ar: c.ar }); c.words.forEach(function (w) { var k = norm(clean(w[0])); if (seen[k] && seen[k] !== w[0].toLowerCase()) k += '_2'; seen[k] = w[0].toLowerCase(); LX.push({ id: k, fr: w[0], ar: w[1], ex: '', exAr: '', cat: 'x_' + c.id }); }); });
        return LX;
      });
      return LP;
    }
    function letterOf(w) { return norm(noArt(clean(w.fr))).charAt(0).toUpperCase(); }
    function lxList() {
      var k = known(), f = favs(), q = norm(LS.q);
      return LX.filter(function (w) {
        var ok = LS.cat === 'all' || (LS.cat === 'fav' ? f.indexOf(w.id) > -1 : LS.cat === 'known' ? k.indexOf(w.id) > -1 : LS.cat === 'todo' ? k.indexOf(w.id) < 0 : w.cat === LS.cat);
        if (!ok) return false; if (LS.l && letterOf(w) !== LS.l) return false;
        return !q || norm(w.fr).indexOf(q) > -1 || w.ar.indexOf(LS.q) > -1;
      });
    }
    function lxHero() {
      var kn = known().filter(function (id) { return !!lw(id); }).length, n = LX.length, p = n ? Math.round(kn * 100 / n) : 0;
      var lv = p >= 90 ? '🏆 أسطورة' : p >= 60 ? '👑 خبير' : p >= 30 ? '⭐ ماهر' : p >= 10 ? '📘 متعلّم' : '🌱 مبتدئ';
      $('#lx-lh', LR).innerHTML = '<div class="lx-hero lx-lh"><div style="font-size:2.3rem">📖</div><h3>قاموس الحياة · ' + n + ' كلمة</h3><div style="font-size:.85rem;opacity:.95">كلمات فرنسية بترجمتها العربية ونطقها الصوتي في ' + LCATS.length + ' مجالًا</div>' +
        '<div class="lx-prog"><i style="width:' + p + '%"></i></div><div style="font-weight:800;font-size:.9rem">✅ تعلّمت ' + kn + ' من ' + n + ' (' + p + '%) · ' + lv + '</div>' +
        '<div class="lx-hb"><button type="button" data-lx="rand">🎲 تحدّي 10 كلمات</button><button type="button" data-lx="cards">🃏 بطاقات الحفظ</button><button type="button" data-lx="listen">🎧 استماع</button><button type="button" data-lx="play">🎮 اختبرني</button></div></div>';
    }
    function lxCats() {
      var k = known(), f = favs(), cnt = {}, kc = {};
      LX.forEach(function (w) { cnt[w.cat] = (cnt[w.cat] || 0) + 1; if (k.indexOf(w.id) > -1) kc[w.cat] = (kc[w.cat] || 0) + 1; });
      var kn = LX.filter(function (w) { return k.indexOf(w.id) > -1; }).length, fv = LX.filter(function (w) { return f.indexOf(w.id) > -1; }).length;
      var tiles = [['all', '🌍', 'الكل', LX.length + ' كلمة'], ['fav', '⭐', 'المفضلة', fv + ' كلمة'], ['known', '✅', 'تعلّمتها', kn + ' كلمة'], ['todo', '📌', 'لم أتعلمها', (LX.length - kn) + ' كلمة']].concat(LCATS.map(function (c) { return [c.id, c.ic, c.ar, (kc[c.id] || 0) + ' / ' + (cnt[c.id] || 0)]; }));
      $('#lx-cg', LR).innerHTML = tiles.map(function (t, i) { return '<button type="button" class="lx-ct' + (LS.cat === t[0] ? ' on' : '') + '" data-c2="' + t[0] + '" style="--c:' + PAL[i % PAL.length] + '"><i>' + t[1] + '</i><b>' + esc(t[2]) + '</b><small>' + t[3] + '</small></button>'; }).join('');
    }
    function rowHTML(w) {
      var kn = known().indexOf(w.id) > -1, fv = favs().indexOf(w.id) > -1;
      return '<div class="lx-row' + (kn ? ' kn' : '') + '" data-id="' + esc(w.id) + '"><div class="rw"><div class="t"><b>' + esc(w.fr) + '</b><span>' + esc(w.ar) + '</span></div><div class="b"><button type="button" data-a="say" title="نطق">🔊</button><button type="button" data-a="slow" title="نطق بطيء">🐢</button><button type="button" data-a="mic" title="جرّب نطقك">🎤</button><button type="button" data-a="kn" class="' + (kn ? 'on' : '') + '" title="تعلّمتها">✅</button><button type="button" data-a="fav">' + (fv ? '⭐' : '☆') + '</button></div></div><div class="lx-fb"></div></div>';
    }
    function lxRows() {
      var l = lxList(); $('#lx-lc', LR).textContent = l.length + ' كلمة' + (LS.cat === 'fav' && !l.length ? ' — اضغط ☆ لإضافة كلمات' : '');
      $('#lx-rows', LR).innerHTML = l.slice(0, LS.n).map(rowHTML).join(''); $('#lx-lm', LR).style.display = l.length > LS.n ? 'block' : 'none';
    }
    function lxAll() { lxHero(); lxCats(); lxRows(); }
    function buildLex() {
      var ls = {}; LX.forEach(function (w) { ls[letterOf(w)] = 1; });
      LR.innerHTML = '<div id="lx-lh"></div><input class="lx-in" type="search" id="lx-lq" placeholder="🔎 ابحث بالفرنسية أو العربية في ' + LX.length + ' كلمة…"><div class="lx-letters" id="lx-lt"><button type="button" class="on" data-l="">الكل</button>' +
        Object.keys(ls).filter(function (x) { return /[A-Z]/.test(x); }).sort().map(function (x) { return '<button type="button" data-l="' + x + '">' + x + '</button>'; }).join('') + '</div><div class="lx-cgrid" id="lx-cg"></div><div class="lx-count" id="lx-lc"></div><div id="lx-rows"></div><button type="button" class="lx-more" id="lx-lm">عرض المزيد ⬇</button><div id="lx-fcw"></div>';
      lexBuilt = true; lxAll();
    }
    function openLex(body) {
      LR.style.display = ''; if (lexBuilt) return; LR.innerHTML = '<div class="lx-count">⏳ جارٍ تحميل القاموس…</div>';
      loadLex().then(function () { if (!LX.length) { LR.style.display = 'none'; if (body) body.style.display = ''; showDict(0); return; } buildLex(); });
    }
    function newKnown(id) { var k = known(); if (k.indexOf(id) > -1) return false; k.push(id); store('bq_known', k); if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(10000); return true; }
    function stopListen() { LST = null; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} if (LR) { var b = $('[data-lx="listen"]', LR); if (b) b.textContent = '🎧 استماع'; $$('.lx-row.pl', LR).forEach(function (x) { x.classList.remove('pl'); }); } }
    function listen() {
      if (LST) { stopListen(); return; } var list = lxList().slice(0, LS.n); if (!list.length) return; LST = { on: 1 }; $('[data-lx="listen"]', LR).textContent = '⏹ إيقاف'; var i = 0;
      (function step() {
        if (!LST || i >= list.length) { stopListen(); return; } var w = list[i++], r = $('.lx-row[data-id="' + w.id + '"]', LR);
        $$('.lx-row.pl', LR).forEach(function (x) { x.classList.remove('pl'); }); if (r) { r.classList.add('pl'); try { r.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
        try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(clean(w.fr)); u.lang = 'fr-FR'; u.rate = 0.85; u.onend = u.onerror = function () { setTimeout(step, 700); }; speechSynthesis.speak(u); } catch (e) { stopListen(); }
      })();
    }
    function fcStart(list, n) {
      var k = known(); var deck = shuffle(list).sort(function (a, b) { return (k.indexOf(a.id) > -1) - (k.indexOf(b.id) > -1); }).slice(0, n); if (!deck.length) return;
      FC = { deck: deck, i: 0, ok: 0, later: 0 }; stopListen(); fcShow();
    }
    function fcShow() {
      var box = $('#lx-fcw', LR); if (!FC) { box.innerHTML = ''; return; }
      if (FC.i >= FC.deck.length) { box.innerHTML = '<div class="lx-fcbox"><div style="font-size:2.4rem">🎉</div><h3 style="margin:4px 0">أحسنت!</h3><p>✅ حفظت ' + FC.ok + ' · 🔁 للمراجعة ' + FC.later + '</p><button type="button" class="lx-btn" data-fc="exit">إغلاق</button></div>'; sWin(); return; }
      var w = FC.deck[FC.i];
      box.innerHTML = '<div class="lx-fcbox"><div class="lx-fch"><span>' + (FC.i + 1) + ' / ' + FC.deck.length + '</span><span>✅ ' + FC.ok + '</span></div><div class="lx-fcw"><div class="lx-fc" id="lx-fc" data-fc="flip"><div class="lx-fcf f"><div class="big" dir="ltr">' + esc(w.fr) + '</div><button type="button" data-fc="say">🔊</button><small>اضغط على البطاقة لرؤية المعنى 👆</small></div><div class="lx-fcf b"><div class="big">' + esc(w.ar) + '</div><div dir="ltr" style="font-weight:800">' + esc(w.fr) + '</div></div></div></div><div><button type="button" class="lx-btn g" data-fc="later">🔁 لاحقًا</button><button type="button" class="lx-btn" data-fc="know">✅ عرفتها</button></div><button type="button" class="lx-btn g" data-fc="exit" style="font-size:.8rem;padding:6px 14px">خروج</button></div>';
      box.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { if (FC) say(w.fr); }, 350);
    }
    function lexInit() {
      if (!LR) return;
      LR.addEventListener('click', function (e) {
        var fcb = e.target.closest('[data-fc]');
        if (fcb && FC) { var a = fcb.dataset.fc, w = FC.deck[FC.i];
          if (a === 'flip') $('#lx-fc', LR).classList.toggle('flip'); else if (a === 'say') { e.stopPropagation(); say(w.fr); }
          else if (a === 'know') { newKnown(w.id); FC.ok++; FC.i++; sOk(2); fcShow(); lxHero(); lxCats(); } else if (a === 'later') { FC.later++; FC.i++; fcShow(); }
          else if (a === 'exit') { FC = null; fcShow(); lxAll(); } return; }
        var lxb = e.target.closest('[data-lx]');
        if (lxb) { var m = lxb.dataset.lx;
          if (m === 'rand') fcStart(LX, 10); else if (m === 'cards') fcStart(lxList(), 20); else if (m === 'listen') listen();
          else if (m === 'play') { pool = (LS.cat === 'all' || LS.cat === 'fav' || /^x_/.test(LS.cat)) ? LS.cat : 'all'; var gt = $('[data-qt="game"]', QR); if (gt) gt.click(); home(); }
          return; }
        var c2 = e.target.closest('[data-c2]'); if (c2) { stopListen(); LS.cat = c2.dataset.c2; LS.n = 50; lxCats(); lxRows(); return; }
        var lt = e.target.closest('[data-l]'); if (lt) { stopListen(); LS.l = lt.dataset.l; LS.n = 50; $$('#lx-lt button', LR).forEach(function (b) { b.classList.toggle('on', b === lt); }); lxRows(); return; }
        if (e.target.closest('#lx-lm')) { LS.n += 50; lxRows(); return; }
        var bt = e.target.closest('.lx-row [data-a]'); if (!bt) return; var row = bt.closest('.lx-row'), w2 = lw(row.dataset.id); if (!w2) return; var ac2 = bt.dataset.a;
        if (ac2 === 'say') say(w2.fr); else if (ac2 === 'slow') say(w2.fr, 0.5); else if (ac2 === 'mic') mic(row, w2);
        else if (ac2 === 'kn') { var k = known(), i = k.indexOf(w2.id); if (i > -1) { k.splice(i, 1); store('bq_known', k); } else { newKnown(w2.id); sOk(1); } row.classList.toggle('kn', i < 0); bt.classList.toggle('on', i < 0); lxHero(); lxCats(); }
        else if (ac2 === 'fav') { var f = favs(), j = f.indexOf(w2.id); if (j > -1) f.splice(j, 1); else f.push(w2.id); store('bq_fav', f); bt.textContent = j > -1 ? '☆' : '⭐'; lxCats(); if (LS.cat === 'fav') lxRows(); }
      });
      LR.addEventListener('input', function (e) { if (e.target.id === 'lx-lq') { LS.q = e.target.value; LS.n = 50; lxRows(); } });
    }

    dictInit(); qInit(); lexInit();
  }
})();
