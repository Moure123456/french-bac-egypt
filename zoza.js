/* ===== zoza.js — «زوزا» المرشد الودود داخل التطبيق =====
   روبوت صغير يرحّب بالمتعلم باسمه، يعرّفه بالأقسام (جولة)، ويشرح أي قاعدة أو فعل أو كلمة أو صوت يطلبه، مع تمرين سريع.
   يعمل كطبقة عائمة مستقلة: لا يغيّر أي قسم ولا أي ملف، ويقرأ البيانات فقط (grammar / phonetics / lexicon / words). */
(function () {
  'use strict';
  function ready(f) { if (document.body) f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[zoza]', e); } catch (_) {} } });

  function boot() {
    if (document.getElementById('zz-fab')) return;
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    // تطبيع عربي/فرنسي للمقارنة
    function sa(t) { return t.replace(/^ال(?=.{2})/, ''); }
    function nz(s) { return String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9'\u0600-\u06FF ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }

    /* ---------- الحالة ---------- */
    var ST = store('bq_zoza') || { name: '', color: 'blue', voice: 1, tips: 1, seen: {}, asked: 0, ok: 0 };
    function save() { store('bq_zoza', ST); }
    var COLORS = { blue: ['#2563eb', '#60a5fa'], teal: ['#0d9488', '#5eead4'], pink: ['#db2777', '#f9a8d4'] };
    function nm() { return ST.name || 'صديقي'; }

    /* ---------- رسم رأس زوزا (SVG نقي قابل للتحريك) ---------- */
    var HID = 0;
    function head(cls) {
      var k = ++HID;
      return '<svg class="zz-head ' + (cls || '') + ' mood-smile" viewBox="0 0 200 184" aria-hidden="true"><defs>' +
        '<linearGradient id="zs' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe7f6"/></linearGradient>' +
        '<linearGradient id="zv' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#05070f"/></linearGradient>' +
        '<radialGradient id="ze' + k + '" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#cffafe"/><stop offset=".45" stop-color="#22d3ee"/><stop offset="1" stop-color="#06b6d4"/></radialGradient>' +
        '<filter id="zg' + k + '" x="-80%" y="-300%" width="260%" height="700%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
        '<ellipse cx="100" cy="176" rx="52" ry="6" fill="rgba(0,0,0,.18)"/>' +
        '<g class="zz-ant"><rect x="96.5" y="12" width="7" height="22" rx="3.5" fill="#cbd5e1"/><circle cx="100" cy="10" r="10" fill="var(--zc)" filter="url(#zg' + k + ')"/><circle cx="96.5" cy="6.5" r="3.2" fill="#fff" opacity=".8"/></g>' +
        '<ellipse cx="21" cy="104" rx="19" ry="33" fill="var(--zc)"/><ellipse cx="25" cy="104" rx="11" ry="23" fill="var(--zc2)"/><path d="M14 86 Q12 100 17 114" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '<ellipse cx="179" cy="104" rx="19" ry="33" fill="var(--zc)"/><ellipse cx="175" cy="104" rx="11" ry="23" fill="var(--zc2)"/><path d="M186 86 Q188 100 183 114" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '<rect x="24" y="26" width="152" height="144" rx="68" fill="url(#zs' + k + ')" stroke="#c9d6ea" stroke-width="2.5"/>' +
        '<path d="M52 40 Q100 22 148 40" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>' +
        '<rect x="38" y="46" width="124" height="98" rx="46" fill="url(#zv' + k + ')"/>' +
        '<path d="M54 64 Q72 52 98 54" stroke="rgba(255,255,255,.4)" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
        '<g class="zz-eyes"><g class="zz-eye"><ellipse cx="74" cy="88" rx="14" ry="18" fill="url(#ze' + k + ')" filter="url(#zg' + k + ')"/><ellipse cx="69" cy="80" rx="4.5" ry="6" fill="#fff" opacity=".95"/></g>' +
        '<g class="zz-eye"><ellipse cx="126" cy="88" rx="14" ry="18" fill="url(#ze' + k + ')" filter="url(#zg' + k + ')"/><ellipse cx="121" cy="80" rx="4.5" ry="6" fill="#fff" opacity=".95"/></g></g>' +
        '<ellipse cx="58" cy="116" rx="9" ry="5" fill="#f9a8d4" opacity=".5"/><ellipse cx="142" cy="116" rx="9" ry="5" fill="#f9a8d4" opacity=".5"/>' +
        '<g class="zz-m"><path class="m-smile" d="M86 114 Q100 128 114 114" stroke="#22d3ee" stroke-width="5.5" fill="none" stroke-linecap="round" filter="url(#zg' + k + ')"/>' +
        '<g class="m-open"><path d="M84 108 Q100 140 116 108 Z" fill="#22d3ee" filter="url(#zg' + k + ')"/><path d="M93 123 Q100 130 107 123 Q100 119 93 123Z" fill="#f472b6"/></g>' +
        '<ellipse class="m-think" cx="100" cy="119" rx="6.5" ry="7.5" fill="none" stroke="#22d3ee" stroke-width="4.5" filter="url(#zg' + k + ')"/></g></svg>';
    }

    /* ---------- التنسيق (بادئة zz- فريدة) ---------- */
    var st = document.createElement('style');
    st.textContent = ':root{--zc:#2563eb;--zc2:#60a5fa}.zz-head{display:block;width:100%;height:auto;overflow:visible}.zz-head .zz-eyes{transform:translate(var(--ex,0px),var(--ey,0px));transition:transform .15s}.zz-head .zz-eye{transform-box:fill-box;transform-origin:center;animation:zzBl 4.6s infinite}.zz-head .zz-eye:nth-child(2){animation-delay:.02s}@keyframes zzBl{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}' +
      '.zz-head .zz-ant{transform-box:fill-box;transform-origin:50% 100%;animation:zzAn 3.2s ease-in-out infinite}@keyframes zzAn{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}.zz-m>*{display:none}.mood-smile .m-smile,.mood-happy .m-open,.mood-think .m-think{display:block}.mood-happy .zz-ant{animation-duration:.6s}' +
      '#zz-fab{position:fixed;right:12px;bottom:86px;z-index:99985;width:74px;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;animation:zzFl 3.6s ease-in-out infinite;filter:drop-shadow(0 8px 10px rgba(0,0,0,.28))}@keyframes zzFl{50%{transform:translateY(-7px)}}#zz-fab.jp{animation:zzJp .6s}@keyframes zzJp{30%{transform:translateY(-26px) rotate(-6deg) scale(1.1)}65%{transform:translateY(-4px) rotate(5deg)}}#zz-fab .zz-dot{position:absolute;top:2px;left:-2px;width:16px;height:16px;border-radius:50%;background:#f43f5e;border:2px solid #fff;animation:zzPu 1.3s infinite}@keyframes zzPu{50%{transform:scale(1.3)}}' +
      '#zz-bub{position:fixed;right:92px;bottom:104px;z-index:99985;max-width:min(250px,64vw);background:#fff;color:#1f2937;border:2.5px solid var(--zc);border-radius:18px 18px 4px 18px;padding:9px 12px;font-size:.85rem;line-height:1.7;font-weight:700;box-shadow:0 10px 24px rgba(0,0,0,.22);display:none;animation:zzPop .35s}#zz-bub.on{display:block}@keyframes zzPop{from{transform:scale(.6) translateY(10px);opacity:0}}#zz-bub button{margin-top:6px;margin-inline-end:5px;border:0;border-radius:12px;padding:5px 11px;font-family:inherit;font-weight:800;font-size:.78rem;background:var(--zc);color:#fff;cursor:pointer}#zz-bub button.g{background:#e5e7eb;color:#374151}' +
      '#zz-pn{position:fixed;right:10px;bottom:88px;z-index:99997;width:min(94vw,410px);max-height:min(76vh,600px);display:none;flex-direction:column;background:#f8fafc;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.4);color:#1f2937;border:2px solid var(--zc)}#zz-pn.on{display:flex;animation:zzUp .35s}@keyframes zzUp{from{transform:translateY(40px) scale(.95);opacity:0}}#zz-pn *{box-sizing:border-box}#zz-pn button,#zz-pn input{font-family:inherit}' +
      '.zz-hd{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(135deg,var(--zc),var(--zc2));color:#fff}.zz-hd .zz-av{width:46px;flex:none;background:#fff;border-radius:50%;padding:4px 3px 0}.zz-hd b{display:block;font-size:1rem}.zz-hd small{opacity:.92;font-size:.72rem}.zz-hd>div{flex:1}.zz-hd button{border:0;background:rgba(255,255,255,.22);color:#fff;border-radius:50%;width:34px;height:34px;font-size:1rem;cursor:pointer}' +
      '.zz-bd{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:9px;min-height:180px}.zz-m1{display:flex;gap:7px;align-items:flex-start;animation:zzIn .3s both}.zz-m1.me{flex-direction:row-reverse}@keyframes zzIn{from{opacity:0;transform:translateY(8px)}}.zz-m1 .zz-av{width:32px;flex:none;background:#fff;border-radius:50%;padding:3px 2px 0;border:1.5px solid #e2e8f0}.zz-b{max-width:88%;background:#fff;border:1.5px solid #e2e8f0;border-radius:4px 16px 16px 16px;padding:9px 11px;font-size:.88rem;line-height:1.8}.zz-m1.me .zz-b{background:var(--zc);color:#fff;border-color:var(--zc);border-radius:16px 4px 16px 16px}' +
      '.zz-cd{margin-top:6px;background:#f1f5f9;border-radius:12px;padding:8px 10px}.zz-cd h5{margin:0 0 4px;color:var(--zc);font-size:.92rem}.zz-fr{direction:ltr;text-align:left;font-weight:800;color:#0f172a}.zz-ex{display:flex;align-items:center;gap:6px;justify-content:space-between;direction:ltr;background:#fff;border-radius:10px;padding:5px 8px;margin-top:5px;font-weight:700;font-size:.86rem}.zz-sp{border:0;background:#e0e7ff;border-radius:50%;width:30px;height:30px;cursor:pointer;flex:none}' +
      '.zz-tb{width:100%;border-collapse:collapse;font-size:.74rem;direction:ltr;text-align:center;margin-top:4px}.zz-tb td,.zz-tb th{border:1px solid #cbd5e1;padding:3px 2px}.zz-tb th{background:#e0e7ff;color:#1e3a8a}' +
      '.zz-ch{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.zz-ch button{border:1.5px solid var(--zc);background:#fff;color:var(--zc);border-radius:16px;padding:5px 11px;font-weight:800;font-size:.76rem;cursor:pointer}.zz-ch button.f{background:var(--zc);color:#fff}' +
      '.zz-q{margin-top:6px;background:#fffbeb;border:1.5px dashed #f59e0b;border-radius:12px;padding:8px 10px}.zz-q .p{font-weight:800;direction:ltr;text-align:left;margin-bottom:6px}.zz-op{display:grid;grid-template-columns:1fr 1fr;gap:6px}.zz-op button{border:1.5px solid #fcd34d;background:#fff;border-radius:10px;padding:8px;font-weight:800;direction:ltr;cursor:pointer}.zz-op button.ok{background:#16a34a;color:#fff;border-color:#16a34a}.zz-op button.no{background:#dc2626;color:#fff;border-color:#dc2626}.zz-tx{display:flex;gap:6px}.zz-tx input{flex:1;border:1.5px solid #fcd34d;border-radius:10px;padding:8px;direction:ltr}.zz-tx button{border:0;border-radius:10px;background:var(--zc);color:#fff;font-weight:800;padding:0 12px;cursor:pointer}' +
      '.zz-in{display:flex;gap:6px;padding:8px;border-top:1px solid #e2e8f0;background:#fff}.zz-in input{flex:1;border:2px solid #e2e8f0;border-radius:14px;padding:10px 12px;font-size:.92rem;min-width:0}.zz-in input:focus{outline:0;border-color:var(--zc)}.zz-in button{border:0;border-radius:14px;background:linear-gradient(135deg,var(--zc),var(--zc2));color:#fff;font-weight:900;padding:0 14px;cursor:pointer}' +
      '.zz-wel{padding:14px;text-align:center}.zz-wel .zz-big{width:110px;margin:0 auto 4px}.zz-wel h3{margin:4px 0;color:var(--zc)}.zz-wel input{width:100%;border:2px solid var(--zc);border-radius:14px;padding:12px;font-size:1.05rem;text-align:center;margin:8px 0}.zz-cols{display:flex;justify-content:center;gap:12px;margin:6px 0 10px}.zz-cols button{width:38px;height:38px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #cbd5e1;cursor:pointer}.zz-cols button.on{box-shadow:0 0 0 3px #111827}.zz-go{border:0;border-radius:22px;padding:12px 26px;font-weight:900;font-size:1rem;color:#fff;background:linear-gradient(135deg,var(--zc),var(--zc2));cursor:pointer}' +
      '.zz-hl{position:relative;z-index:1;animation:zzRing 1.2s ease-in-out 3}@keyframes zzRing{50%{box-shadow:0 0 0 6px rgba(251,191,36,.9),0 0 22px rgba(251,191,36,.8)}}';
    document.head.appendChild(st);

    function theme() { var c = COLORS[ST.color] || COLORS.blue; document.documentElement.style.setProperty('--zc', c[0]); document.documentElement.style.setProperty('--zc2', c[1]); }
    theme();

    /* ---------- العناصر العائمة ---------- */
    var fab = document.createElement('button'); fab.id = 'zz-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'زوزا المرشد'); fab.innerHTML = head('') + '<span class="zz-dot" id="zz-dot" style="display:none"></span>'; document.body.appendChild(fab);
    var bub = document.createElement('div'); bub.id = 'zz-bub'; document.body.appendChild(bub);
    var pn = document.createElement('div'); pn.id = 'zz-pn'; document.body.appendChild(pn);
    function setMood(m, ms) { $$('.zz-head').forEach(function (h) { h.setAttribute('class', h.getAttribute('class').replace(/mood-\w+/, 'mood-' + m)); }); if (ms) setTimeout(function () { setMood('smile'); }, ms); }
    function jump() { fab.classList.remove('jp'); void fab.offsetWidth; fab.classList.add('jp'); }
    // العينان تتبعان إصبع/مؤشر المتعلم
    var raf = 0; document.addEventListener('pointermove', function (e) { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; $$('.zz-head').forEach(function (h) { var r = h.getBoundingClientRect(); if (!r.width) return; var dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight; h.style.setProperty('--ex', Math.max(-5, Math.min(5, dx * 18)) + 'px'); h.style.setProperty('--ey', Math.max(-4, Math.min(4, dy * 14)) + 'px'); }); }); });

    /* ---------- النطق (جمل فرنسية فقط) ---------- */
    function say(t) { try { if (!ST.voice || !window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).replace(/\([^)]*\)/g, '')); u.lang = 'fr-FR'; u.rate = 0.9; u.pitch = 1.15; speechSynthesis.speak(u); } catch (e) {} }
    function sayAlways(t) { var v = ST.voice; ST.voice = 1; say(t); ST.voice = v; }

    /* ---------- الفقاعة (نصائح قصيرة) ---------- */
    var bubT = 0;
    function tip(html, ms, btns) {
      clearTimeout(bubT); bub.innerHTML = html + (btns || ''); bub.classList.add('on'); setMood('happy', 1600); jump();
      if (ms !== 0) bubT = setTimeout(function () { bub.classList.remove('on'); }, ms || 7000);
    }
    function hideTip() { clearTimeout(bubT); bub.classList.remove('on'); }

    /* ---------- بيانات المعرفة (تُحمَّل عند أول سؤال) ---------- */
    var KB = null, KBP = null;
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    function loadKB() {
      if (KBP) return KBP;
      KBP = Promise.all([getJson('grammar.json'), getJson('phonetics.json'), getJson('lexicon.json'), getJson('words.json')]).then(function (r) {
        KB = { rules: [], conj: [], sounds: [], prules: [], words: [] }; var LVN = { '1sec': '1 ثانوي', '2sec': '2 ثانوي', '3sec': '3 ثانوي' };
        if (r[0] && r[0].levels) { r[0].levels.forEach(function (l) { (l.rules || []).forEach(function (x) { x.lv = LVN[l.id] || ''; x.key = nz(x.title_fr + ' ' + x.title_ar + ' ' + x.id); KB.rules.push(x); }); }); KB.conj = r[0].conjugations || []; }
        if (r[1]) { (r[1].groups || []).forEach(function (g) { (g.sounds || []).forEach(function (s) { KB.sounds.push(s); }); }); (r[1].rule_groups || []).forEach(function (g) { (g.rules || []).forEach(function (x) { x.key = nz(x.title_fr + ' ' + x.title_ar); KB.prules.push(x); }); }); }
        var seen = {}; function addW(fr, ar, ex, exAr) { var k = nz(fr); if (!k || seen[k]) return; seen[k] = 1; KB.words.push({ fr: fr, ar: ar, ex: ex || '', exAr: exAr || '', k: k.replace(/^(l'|le |la |les |un |une |des )/, ''), a: nz(ar).split(' ').map(sa).join(' ') }); }
        if (r[3] && r[3].categories) r[3].categories.forEach(function (c) { c.words.forEach(function (w) { addW(w[0], w[1], w[2], w[3]); }); });
        if (r[2] && r[2].categories) r[2].categories.forEach(function (c) { c.words.forEach(function (w) { addW(w[0], w[1]); }); });
        return KB;
      });
      return KBP;
    }
    var STOP = nz('اشرح لي اشرحي ما هو هي ماذا كيف ازاي يعني معني ماهي ماهو قاعده قواعد عن في من على الي الى اريد عايز ممكن لو سمحت ايه شرح تعلم اعرف نطق حرف صوت كلمه فعل تصريف صرف').split(' ');
    var SYN = { جمع: 'pluriel', مونث: 'feminin', مؤنث: 'feminin', نفي: 'negative', سوال: 'interrogation', سؤال: 'interrogation', ماضي: 'passe', مستقبل: 'futur', امر: 'imperatif', ضمائر: 'pronoms', ضمير: 'pronoms', صفات: 'adjectifs', صفه: 'adjectifs', ملكيه: 'possessifs', اشاره: 'demonstratifs', مقارنه: 'comparatif', شرط: 'si', شرطيه: 'conditionnel', مجهول: 'passive', سبب: 'cause', هدف: 'but' };
    function tokens(q) { var t = nz(q).split(' ').filter(function (x) { return (x.length >= 2 || /^[a-z]$/.test(x)) && STOP.indexOf(x) < 0; }), out = t.slice(); t.forEach(function (x) { var s = SYN[x]; if (s) out.push(nz(s)); }); return out; }
    function search(q) {
      var raw = nz(q), tk = tokens(q), res = { conj: null, rules: [], sound: null, prule: null, words: [] };
      // أفعال
      KB.conj.forEach(function (c) { var v = nz(c.verb); if (!res.conj && tk.some(function (t) { return t === v || t === 'se ' + v; })) res.conj = c; });
      // قواعد
      var rtk = tk.filter(function (t) { return t.length >= 3 || /[\u0600-\u06FF]/.test(t); }); KB.rules.forEach(function (r) { var s = 0; rtk.forEach(function (t) { if (r.key.indexOf(t) > -1) s += 2; }); if (raw.length > 3 && r.key.indexOf(raw) > -1) s += 5; if (s) res.rules.push({ r: r, s: s }); });
      res.rules.sort(function (a, b) { return b.s - a.s; }); res.rules = res.rules.slice(0, 3);
      // أصوات وقواعد نطق
      if (/نطق|صوت|حرف|prononc|son\b/.test(raw) || tk.length === 1 && tk[0].length <= 3) {
        KB.sounds.forEach(function (s) { if (!res.sound && tk.some(function (t) { return nz(s.letters).split(' ').indexOf(t) > -1 || nz(s.ipa) === t; })) res.sound = s; });
        if (!res.sound) KB.prules.forEach(function (p) { if (!res.prule && rtk.some(function (t) { return p.key.indexOf(t) > -1; })) res.prule = p; });
      }
      // كلمات
      if (tk.length && tk.length <= 3) KB.words.forEach(function (w) { if (res.words.length < 3 && tk.some(function (t) { return t === w.k || (t.length >= 3 && w.a.split(' ').indexOf(sa(t)) > -1); })) res.words.push(w); });
      return res;
    }

    /* ---------- بطاقات الرد ---------- */
    function exRow(t) { return '<div class="zz-ex"><span>' + esc(t) + '</span><button type="button" class="zz-sp" data-say="' + esc(t) + '">🔊</button></div>'; }
    function ruleCard(r) {
      return '<div class="zz-cd" data-rid="' + esc(r.id) + '"><h5>📘 ' + esc(r.title_ar) + '</h5><div class="zz-fr" style="font-size:.8rem;opacity:.75">' + esc(r.title_fr) + (r.lv ? ' · ' + r.lv : '') + '</div><div style="margin-top:4px">' + esc(r.explanation_ar) + '</div>' + (r.examples || []).slice(0, 3).map(exRow).join('') +
        ((r.exercises || []).length ? '<div class="zz-ch"><button type="button" class="f" data-ex="' + esc(r.id) + '">🧩 تمرين سريع</button></div>' : '') + '</div>';
    }
    var PRON = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];
    function conjCard(c) {
      return '<div class="zz-cd"><h5>🔤 تصريف الفعل ' + esc(c.verb) + ' <small style="color:#64748b">(' + esc(c.group_ar || '') + ')</small></h5><div style="overflow-x:auto"><table class="zz-tb"><tr><th></th>' + c.tenses.map(function (t) { return '<th>' + esc(t.name_fr) + '</th>'; }).join('') + '</tr>' +
        PRON.map(function (p, i) { return '<tr><th>' + p + '</th>' + c.tenses.map(function (t) { return '<td>' + esc(t.forms[i] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div><div class="zz-ch"><button type="button" data-say="' + esc(c.tenses[0].forms.map(function (f, i) { return ['je', 'tu', 'il', 'nous', 'vous', 'ils'][i] + ' ' + f; }).join(', ')) + '">🔊 اسمع المضارع</button></div></div>';
    }
    function soundCard(s) { return '<div class="zz-cd"><h5>🗣️ ' + esc(s.name_ar) + ' [' + esc(s.ipa) + ']</h5><div style="font-size:.8rem;opacity:.8">الحروف: ' + esc(s.letters) + '</div><div style="margin-top:4px">' + esc(s.how_ar) + '<br>' + esc(s.tip_ar) + '</div>' + (s.examples || []).slice(0, 3).map(function (e) { return '<div class="zz-ex"><span>' + esc(e.fr) + ' <small style="color:#7c3aed">[' + esc(e.ipa) + ']</small></span><button type="button" class="zz-sp" data-say="' + esc(e.fr) + '">🔊</button></div>'; }).join('') + '</div>'; }
    function pruleCard(p) { return '<div class="zz-cd"><h5>🧩 ' + esc(p.title_ar) + '</h5><div>' + esc(p.rule_ar) + '</div>' + (p.examples || []).slice(0, 3).map(function (e) { return '<div class="zz-ex"><span>' + esc(e.fr) + ' <small style="color:#7c3aed">[' + esc(e.ipa) + ']</small></span><button type="button" class="zz-sp" data-say="' + esc(e.fr) + '">🔊</button></div>'; }).join('') + '</div>'; }
    function wordCard(w) { return '<div class="zz-cd"><h5>📖 كلمة</h5><div class="zz-ex"><span style="font-size:1.05rem">' + esc(w.fr) + '</span><button type="button" class="zz-sp" data-say="' + esc(w.fr) + '">🔊</button></div><div style="margin-top:4px;font-weight:800">' + esc(w.ar) + '</div>' + (w.ex ? exRow(w.ex) + '<div style="font-size:.8rem;color:#475569">' + esc(w.exAr) + '</div>' : '') + '</div>'; }

    /* ---------- المحادثة ---------- */
    var EXI = {}, EXQ = null;
    function msg(html, me) { var b = $('#zz-bd'); if (!b) return; var d = document.createElement('div'); d.className = 'zz-m1' + (me ? ' me' : ''); d.innerHTML = (me ? '' : '<div class="zz-av">' + head('') + '</div>') + '<div class="zz-b">' + html + '</div>'; b.appendChild(d); b.scrollTop = b.scrollHeight; return d; }
    var SUG = ['الماضي المركب', 'صرّف avoir', 'ضمائر المفعول', 'maison', 'نطق حرف r', 'الأمر'];
    function chips(list) { return '<div class="zz-ch">' + list.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>'; }
    function ask(q) {
      q = String(q || '').trim(); if (!q) return; ST.asked++; save(); msg(esc(q), true); setMood('think'); var wait = msg('⏳ لحظة، أبحث لك…');
      loadKB().then(function (kb) {
        setTimeout(function () {
          if (wait) wait.remove(); var res = kb ? search(q) : null, out = '', any = false;
          if (!kb) { msg('لم أستطع تحميل بياناتي الآن 😅 تأكد من الاتصال بالإنترنت وجرّب مرة أخرى.'); setMood('smile'); return; }
          if (res.conj) { out += 'هذا تصريف <b>' + esc(res.conj.verb) + '</b> يا ' + esc(nm()) + ' 👇' + conjCard(res.conj); any = true; }
          else if (res.rules.length) { var top = res.rules[0].r; out += 'سأشرحها لك ببساطة يا ' + esc(nm()) + ' 😊' + ruleCard(top); any = true; if (res.rules.length > 1) out += '<div style="margin-top:6px;font-size:.8rem">ربما تقصد أيضًا:</div>' + chips(res.rules.slice(1).map(function (x) { return x.r.title_ar; })); }
          else if (res.sound) { out += 'تعال نسمع هذا الصوت معًا 🎧' + soundCard(res.sound); any = true; }
          else if (res.prule) { out += 'هذه قاعدة نطق مهمة 🗣️' + pruleCard(res.prule); any = true; }
          else if (res.words.length) { out += res.words.map(wordCard).join(''); any = true; }
          if (!any) out = 'لم أجد هذا بالضبط يا ' + esc(nm()) + ' 🤔 جرّب كلمة أبسط، أو اكتب اسم القاعدة (مثل: الماضي المركب) أو الفعل (صرّف être) أو كلمة فرنسية، أو اختر من هنا:' + chips(shuffle(SUG).slice(0, 4));
          msg(out); setMood(any ? 'happy' : 'smile', 1800); if (any) jump();
        }, 450);
      });
    }
    function startEx(id) {
      loadKB().then(function (kb) {
        var r = kb.rules.filter(function (x) { return x.id === id; })[0]; if (!r || !(r.exercises || []).length) return; var i = (EXI[id] = ((EXI[id] === undefined ? -1 : EXI[id]) + 1) % r.exercises.length), e = r.exercises[i]; EXQ = { r: r, e: e };
        var h = '<div class="zz-q"><div style="font-size:.78rem;color:#92400e;font-weight:800">🧩 تمرين ' + (i + 1) + ' من ' + r.exercises.length + '</div><div class="p">' + esc(e.prompt_fr) + '</div>';
        if (e.type === 'choice') h += '<div class="zz-op">' + (e.options || []).map(function (o, k) { return '<button type="button" data-o="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div>'; else h += '<div class="zz-tx"><input type="text" autocomplete="off" autocapitalize="off" placeholder="اكتب الإجابة…"><button type="button" data-ck="1">تحقق</button></div>';
        msg('هيا نجرّب يا ' + esc(nm()) + '! 💪' + h + '<div class="zz-fbk" style="margin-top:6px;font-weight:700"></div>');
      });
    }
    function judge(box, ok, e) {
      var fb = $('.zz-fbk', box); fb.innerHTML = (ok ? '🎉 ممتاز يا ' + esc(nm()) + '! إجابة صحيحة.' : '😊 لا بأس، تعلّم من الخطأ. الصواب: <b dir="ltr">' + esc(Array.isArray(e.answer) ? e.answer[0] : e.answer) + '</b>') + '<br><span style="font-weight:600;color:#475569">' + esc(e.hint_ar || '') + '</span><div class="zz-ch"><button type="button" class="f" data-ex="' + esc(EXQ.r.id) + '">➜ تمرين آخر</button></div>';
      if (ok) { ST.ok++; save(); boost(8); setMood('happy', 1800); jump(); } else setMood('smile');
    }

    /* ---------- اللوحة ---------- */
    function panelHead() { return '<div class="zz-hd"><div class="zz-av">' + head('') + '</div><div><b>زوزا · Zoza</b><small>مرشدك الودود يا ' + esc(nm()) + '</small></div><button type="button" data-a="tour" title="جولة">🧭</button><button type="button" data-a="set" title="إعدادات">⚙️</button><button type="button" data-a="close" title="إغلاق">✕</button></div>'; }
    function openPanel() { hideTip(); pn.classList.add('on'); $('#zz-dot').style.display = 'none'; if (!ST.name) welcome(); else chat(); }
    function closePanel() { pn.classList.remove('on'); }
    function welcome() {
      pn.innerHTML = '<div class="zz-hd"><div style="flex:1"><b>أهلًا بك! 🎉</b></div><button type="button" data-a="close">✕</button></div><div class="zz-wel"><div class="zz-big">' + head('') + '</div><h3>أنا زوزا! 🤖✨</h3><div style="font-size:.88rem;line-height:1.8">مرشدك الودود في رحلة تعلّم الفرنسية.<br>سأتجول معك بين الأقسام وأشرح لك أي قاعدة تحتاجها.<br><b>ما اسمك؟</b></div><input id="zz-nm" type="text" maxlength="20" placeholder="اكتب اسمك هنا…" autocomplete="off"><div style="font-size:.78rem;color:#64748b">اختر لوني المفضل:</div><div class="zz-cols">' + Object.keys(COLORS).map(function (c) { return '<button type="button" data-col="' + c + '" class="' + (ST.color === c ? 'on' : '') + '" style="background:' + COLORS[c][0] + '" aria-label="' + c + '"></button>'; }).join('') + '</div><button type="button" class="zz-go" data-a="start">هيا بنا! 🚀</button></div>';
      setTimeout(function () { var i = $('#zz-nm'); if (i) i.focus(); }, 250);
    }
    function chat() {
      pn.innerHTML = panelHead() + '<div class="zz-bd" id="zz-bd"></div><div class="zz-in"><input id="zz-q" type="text" placeholder="اسألني عن قاعدة أو فعل أو كلمة…" autocomplete="off"><button type="button" data-a="send">إرسال</button></div>';
      var hr = new Date().getHours(), g = hr < 12 ? 'صباح الخير' : hr < 18 ? 'أهلًا' : 'مساء الخير';
      msg(g + ' يا <b>' + esc(nm()) + '</b>! 👋 أنا زوزا. اسألني عن <b>قاعدة</b> (الماضي المركب)، أو <b>فعل</b> (صرّف avoir)، أو <b>كلمة</b> (maison)، أو <b>نطق</b> (حرف r). أو ابدأ بـ<b>جولة</b> نتعرّف فيها على الأقسام 🧭' + chips(SUG.concat(['🧭 جولة'])));
    }
    function settings() {
      var b = $('#zz-bd'); msg('<b>⚙️ إعداداتي</b><div class="zz-ch"><button type="button" data-a="name">✏️ غيّر اسمي</button><button type="button" data-a="voice">' + (ST.voice ? '🔊 صوتي: يعمل' : '🔇 صوتي: متوقف') + '</button><button type="button" data-a="tips">' + (ST.tips ? '💡 النصائح: تعمل' : '💡 النصائح: متوقفة') + '</button></div><div style="margin-top:8px;font-size:.78rem">لوني:</div><div class="zz-cols" style="justify-content:flex-start">' + Object.keys(COLORS).map(function (c) { return '<button type="button" data-col2="' + c + '" class="' + (ST.color === c ? 'on' : '') + '" style="background:' + COLORS[c][0] + '"></button>'; }).join('') + '</div>');
    }

    /* ---------- الجولة بين الأقسام ---------- */
    var SECS = [['lessons', '🎮', 'اختبر نفسك', 'هنا نلعب ونختبر كلماتنا بسرعة! كل إجابة صحيحة تكسبك نقاطًا وتسرّع جوائزك ⚡ وهناك زر «قاموس المنهج» فيه أكثر من ألف كلمة.', 0], ['bac', '🎓', 'منهج الثانوية', 'وحدات ودروس وامتحانات لصفك: 1ère و2ème و3ème Sec. اختر صفك وابدأ الوحدة الأولى ✨', 1], ['grammar', '✍️', 'Grammaire', 'القواعد ببساطة: لكل قاعدة شرح وأمثلة وتمارين محلولة. وإن أردت شرحًا أسرع فاسألني أنا!', 1], ['phonetics', '🗣️', 'Phonétique', 'مختبر الأصوات: اسمع وقلّد، وجرّب خريطة الفم وتدريب الأذن والـ Virelangues 😄', 1], ['dictionary', '📖', 'Dictionnaire', 'معجم الجمل وقاموس الكلمات المنطوقة: ابحث واستمع وأضف المفضلة ⭐', 0], ['dialogues', '💬', 'Dialogues', 'مسرح الحوارات: اقرأ، استمع، ومثّل الدور مع التطبيق بصوتك 🎭', 0], ['tales', '🧚', 'Contes', 'حكايات وأغانٍ بمشاهد متحركة وصور وأصوات، تقرأها وتسمعها وتختبر نفسك فيها 📚', 0], ['exams', '📝', 'امتحانات الثانوية', 'نماذج امتحانات بمؤقت وتصحيح فوري وتقرير بالأخطاء، لتتدرب كما في الامتحان الحقيقي 💪', 1], ['soon-chansons', '🎵', 'الأغاني الفرنسية', 'مشغّل أغانٍ بقرص دوّار وهدف يومي للاستماع. الموسيقى تحسّن أذنك الفرنسية 🎧', 1], ['chat', '🤖', 'المساعد الذكي', 'اسأله أسئلة أطول عن الفرنسية. وأنا هنا أيضًا للأسئلة السريعة 😉', 0], ['student-chat', '💬', 'شات الطلاب', 'تواصل مع زملائك بلطف واحترام، فالتعلم مع الأصدقاء أجمل 🤝', 0]];
    var TR = null;
    function unlocked(id) { try { return localStorage.getItem('section_unlocked_' + id) === 'true'; } catch (e) { return false; } }
    function tourStep(i) {
      if (i < 0) i = 0; if (i >= SECS.length) { endTour(true); return; } TR = i; var s = SECS[i], locked = s[4] && !unlocked(s[0]), btn = $('[data-nav="' + s[0] + '"]');
      if (!locked && btn) { try { btn.click(); } catch (e) {} } else if (btn) { btn.classList.add('zz-hl'); setTimeout(function () { btn.classList.remove('zz-hl'); }, 3800); }
      closePanel(); tip('<b>' + s[1] + ' ' + s[2] + '</b> <small>(' + (i + 1) + '/' + SECS.length + ')</small><br>' + esc(s[3]) + (locked ? '<br>🔐 يفتحه معلمك بالرقم السري.' : ''), 0, '<div><button type="button" data-t="next">' + (i === SECS.length - 1 ? '🏁 إنهاء' : 'التالي ➜') + '</button>' + (i > 0 ? '<button type="button" class="g" data-t="prev">⬅</button>' : '') + '<button type="button" class="g" data-t="stop">إيقاف</button></div>');
    }
    function startTour() { closePanel(); tip('هيا يا ' + esc(nm()) + '! 🚀 سنتجول معًا بين الأقسام…', 2200); setTimeout(function () { tourStep(0); }, 1500); }
    function endTour(done) { TR = null; if (done) { tip('أحسنت يا ' + esc(nm()) + '! 🎉 صرت تعرف التطبيق. اضغط عليّ في أي وقت لأشرح لك قاعدة أو كلمة 💙', 8000); sayAlways('Bravo !'); } else hideTip(); }

    /* ---------- نصائح تلقائية عند دخول قسم + معلومات ممتعة ---------- */
    var FACTS = ['هل تعلم؟ الفرنسية تُنطق في 29 دولة حول العالم 🌍', 'هل تعلم؟ كلمة «bonjour» تعني حرفيًا «يومٌ جيد» ☀️', 'نصيحة: اسمع الأغاني الفرنسية 5 دقائق يوميًا تتحسن أذنك بسرعة 🎧', 'هل تعلم؟ حروف كثيرة في آخر الكلمة الفرنسية لا تُنطق، مثل s وt وd 🤫', 'نصيحة: كرّر الجملة بصوت عالٍ ثلاث مرات فتثبت في ذاكرتك 💪', 'هل تعلم؟ أبراج باريس الشهير اسمه «la tour Eiffel» 🗼', 'نصيحة: تعلّم 5 كلمات جديدة كل يوم، وبعد شهر ستعرف 150 كلمة! 📚', 'هل تعلم؟ كلمة «merci» تُقال في كل موقف جميل 🙏'];
    var SEC_TIPS = {}; SECS.forEach(function (s) { SEC_TIPS[s[0]] = s; });
    var lastSec = '';
    function watchSections() {
      new MutationObserver(function () {
        var on = $('.sec.on'); if (!on || on.id === lastSec) return; lastSec = on.id; if (!ST.name || !ST.tips || TR !== null || pn.classList.contains('on')) return;
        var s = SEC_TIPS[on.id], today = new Date().toISOString().slice(0, 10); if (!s || ST.seen[on.id] === today) return; if (document.getElementById('bqs-root') && $('#bqs-root').style.display !== 'none') return;
        ST.seen[on.id] = today; save(); setTimeout(function () { if (lastSec === on.id && !pn.classList.contains('on') && TR === null) tip(s[1] + ' <b>' + esc(s[2]) + '</b><br>' + esc(s[3]), 8000); }, 900);
      }).observe(document.querySelector('main') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
    setInterval(function () { if (document.hidden || !ST.name || !ST.tips || pn.classList.contains('on') || TR !== null || bub.classList.contains('on')) return; if (Math.random() < 0.5) tip(FACTS[Math.floor(Math.random() * FACTS.length)], 8000); }, 240000);

    /* ---------- الأحداث ---------- */
    fab.addEventListener('click', function () { if (pn.classList.contains('on')) closePanel(); else openPanel(); });
    bub.addEventListener('click', function (e) {
      var t = e.target.closest('[data-t]'); if (t) { var a = t.dataset.t; if (a === 'open') { hideTip(); openPanel(); } else if (a === 'next') tourStep((TR === null ? -1 : TR) + 1); else if (a === 'prev') tourStep(TR - 1); else endTour(false); return; }
      if (!e.target.closest('button')) { hideTip(); openPanel(); }
    });
    pn.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-col]'))) { ST.color = x.dataset.col; save(); theme(); $$('.zz-cols button', pn).forEach(function (b) { b.classList.toggle('on', b === x); }); return; }
      if ((x = t.closest('[data-col2]'))) { ST.color = x.dataset.col2; save(); theme(); $$('.zz-cols button', pn).forEach(function (b) { b.classList.toggle('on', b === x); }); return; }
      if ((x = t.closest('[data-say]'))) { sayAlways(x.dataset.say); setMood('happy', 1200); return; }
      if ((x = t.closest('[data-q]'))) { var q = x.dataset.q; if (q.indexOf('جولة') > -1) startTour(); else ask(q); return; }
      if ((x = t.closest('[data-ex]'))) { startEx(x.dataset.ex); return; }
      if ((x = t.closest('[data-o]')) && EXQ) { var box = x.closest('.zz-q').parentNode, e2 = EXQ.e, k = +x.dataset.o, ok = e2.options[k] === e2.answer; $$('.zz-op button', box).forEach(function (b, i) { b.disabled = true; if (e2.options[i] === e2.answer) b.classList.add('ok'); else if (i === k) b.classList.add('no'); }); judge(box, ok, e2); return; }
      if ((x = t.closest('[data-ck]')) && EXQ) { var bx = x.closest('.zz-q').parentNode, inp = $('input', bx), v = nz(inp.value), ans = Array.isArray(EXQ.e.answer) ? EXQ.e.answer : [EXQ.e.answer]; if (!v) return; inp.disabled = true; x.disabled = true; judge(bx, ans.some(function (a) { return nz(a) === v; }), EXQ.e); return; }
      if ((x = t.closest('[data-a]'))) { var a = x.dataset.a;
        if (a === 'close') closePanel(); else if (a === 'tour') startTour(); else if (a === 'set') settings();
        else if (a === 'send') { var i = $('#zz-q'); if (i && i.value.trim()) { var v2 = i.value; i.value = ''; ask(v2); } }
        else if (a === 'start') { var n = $('#zz-nm'), val = (n.value || '').trim().slice(0, 20); if (!val) { n.focus(); n.style.borderColor = '#dc2626'; return; } ST.name = val; save(); chat(); sayAlways('Bonjour !'); setMood('happy', 2000); jump(); setTimeout(function () { msg('تشرّفت بمعرفتك يا <b>' + esc(nm()) + '</b>! 🥳 تحب أعمل لك جولة سريعة بين الأقسام؟<div class="zz-ch"><button type="button" class="f" data-q="🧭 جولة">نعم، هيا! 🧭</button><button type="button" data-a="later">لاحقًا</button></div>'); }, 500); }
        else if (a === 'later') msg('تمام يا ' + esc(nm()) + '! اسألني متى شئت 💙');
        else if (a === 'name') { ST.name = ''; save(); welcome(); }
        else if (a === 'voice') { ST.voice = ST.voice ? 0 : 1; save(); x.textContent = ST.voice ? '🔊 صوتي: يعمل' : '🔇 صوتي: متوقف'; }
        else if (a === 'tips') { ST.tips = ST.tips ? 0 : 1; save(); x.textContent = ST.tips ? '💡 النصائح: تعمل' : '💡 النصائح: متوقفة'; }
      }
    });
    pn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (e.target.id === 'zz-q') { var i = e.target, v = i.value; if (v.trim()) { i.value = ''; ask(v); } } else if (e.target.id === 'zz-nm') { var b = $('[data-a="start"]', pn); if (b) b.click(); } else if (e.target.closest && e.target.closest('.zz-tx')) { var c = $('[data-ck]', e.target.closest('.zz-tx')); if (c) c.click(); } } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

    /* ---------- البدء: بعد انتهاء شاشة الترحيب ---------- */
    function afterSplash(f) { var n = 0, iv = setInterval(function () { var r = document.getElementById('bqs-root'); if (!r || r.style.display === 'none' || ++n > 120) { clearInterval(iv); setTimeout(f, 700); } }, 500); }
    afterSplash(function () {
      watchSections();
      if (!ST.name) { $('#zz-dot').style.display = 'block'; tip('أهلًا! أنا <b>زوزا</b> 🤖 مرشدك في تعلّم الفرنسية. اضغط عليّ لنتعرّف!', 0, '<div><button type="button" data-t="open">نتعرّف 👋</button></div>'); }
      else tip('أهلًا يا <b>' + esc(nm()) + '</b>! 👋 سعيد برؤيتك مجددًا. اضغط عليّ إن احتجت شرح قاعدة أو كلمة 💙', 6000);
    });
    window.__zoza = { say: tip, open: openPanel, ask: function (q) { openPanel(); ask(q); } };
  }
})();
