/* ===== contes.js — «مكتبة الحكايات السحرية» لقسم Contes (الحكايات + الأغاني) =====
   يقرأ data/stories.json (stories + songs) ويبني: أغلفة كتب ملونة، مشاهد متحركة تفاعلية، ملصقات تظهر مع كل جملة،
   سرد صوتي، غناء كاريوكي مع موسيقى صندوق الموسيقى، واختبار لكل حكاية. يعمل داخل #cnt-root فقط ويُبقي العرض القديم كخيار. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[contes]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('tales'), ROOT = document.getElementById('cnt-root');
    if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.body');
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function nw(w) { return String(w || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function norm(s) { return nw(s).replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }

    /* ---------- الأصوات ---------- */
    var AC = null, MUTE = false, TOK = 0, MB = null;
    function ctx() { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; }
    function tn(f, t0, d, type, v, f2) { try { if (MUTE || !ctx()) return; var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    var PENT = [523, 587, 659, 784, 880, 1047, 1175];
    function sparkle() { var n = 3; for (var i = 0; i < n; i++) tn(PENT[Math.floor(Math.random() * PENT.length)] * (Math.random() < 0.3 ? 2 : 1), i * 0.07, 0.18, 'triangle', 0.1); }
    function whoosh() { tn(300, 0, 0.25, 'sine', 0.06, 900); }
    function sWin() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tn(f, i * 0.12, 0.3, 'triangle', 0.14); }); }
    function sOk() { tn(660, 0, 0.12, 'triangle', 0.14); tn(990, 0.1, 0.2, 'triangle', 0.14); }
    function sBad() { tn(220, 0, 0.25, 'sawtooth', 0.08); }
    var SND = {
      cat: function () { tn(750, 0, 0.35, 'sine', 0.14, 480); tn(500, 0.4, 0.3, 'sine', 0.1, 420); },
      dog: function () { tn(200, 0, 0.14, 'square', 0.1, 150); tn(210, 0.22, 0.14, 'square', 0.1, 150); },
      bird: function () { for (var i = 0; i < 5; i++) tn(2600 + (i % 2) * 700, i * 0.1, 0.07, 'sine', 0.08); },
      water: function () { for (var i = 0; i < 4; i++) tn(380 + i * 120, i * 0.1, 0.12, 'sine', 0.1, 900); },
      car: function () { tn(330, 0, 0.35, 'square', 0.06); tn(392, 0, 0.35, 'square', 0.06); },
      train: function () { tn(700, 0, 0.7, 'sine', 0.1, 900); tn(700, 0.75, 0.5, 'sine', 0.1, 900); },
      soft: function () { sparkle(); }
    };
    var KIND = { '🐱': 'cat', '🐶': 'dog', '🐦': 'bird', '🐔': 'bird', '🐟': 'water', '🐠': 'water', '🐋': 'water', '🐊': 'water', '⛵': 'water', '🚢': 'water', '🚗': 'car', '🚆': 'train' };
    function speak(text, rate, pitch, done) {
      var fin = false, t0 = Date.now(), min = 800 + String(text).length * 40; function end() { if (fin) return; fin = true; var w = min - (Date.now() - t0); if (done) { if (w > 0) setTimeout(done, w); else done(); } }
      try { if (!window.speechSynthesis) { setTimeout(end, 700); return; } speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(text)); u.lang = 'fr-FR'; u.rate = rate || 0.85; u.pitch = pitch || 1.1; u.onend = u.onerror = end; speechSynthesis.speak(u); setTimeout(end, 2200 + String(text).length * (rate && rate < 0.7 ? 190 : 125)); } catch (e) { end(); }
    }
    function stopAll() { TOK++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} musicBox(false); }
    // صندوق الموسيقى (خلفية ناعمة للأغاني)
    function musicBox(on) { if (MB) { clearInterval(MB); MB = null; } if (!on || MUTE) return; var i = 3; MB = setInterval(function () { i = Math.max(0, Math.min(PENT.length - 1, i + (Math.floor(Math.random() * 3) - 1))); tn(PENT[i] / 2, 0, 0.5, 'sine', 0.05); if (Math.random() < 0.4) tn(PENT[i], 0.12, 0.35, 'triangle', 0.03); }, 480); }

    /* ---------- معجم الصور (كلمة فرنسية ← إيموجي) ---------- */
    var LEX = { chat: '🐱', chien: '🐶', tortue: '🐢', oiseau: '🐦', oiseaux: '🐦', papillon: '🦋', pomme: '🍎', poisson: '🐟', poissons: '🐟', etoile: '⭐', soleil: '☀️', lune: '🌙', lapin: '🐰', arbre: '🌳', chene: '🌳', fleur: '🌸', fleurs: '🌸', livre: '📖', ballon: '🎈', voiture: '🚗', train: '🚆', ourson: '🧸', ours: '🐻', peluche: '🧸', maison: '🏠', maisonnette: '🏠', garcon: '👦', fille: '👧', marche: '🛒', musee: '🏛️', horloge: '🕰️', foret: '🌲', forets: '🌲', bois: '🌲', herbe: '🌱', jardin: '🌷', lait: '🥛', pain: '🍞', carotte: '🥕', carottes: '🥕', nuage: '☁️', ciel: '☁️', pluie: '🌧️', pleut: '🌧️', vent: '💨', eau: '💧', riviere: '🌊', ruisseau: '🏞️', bateau: '⛵', navire: '🚢', pont: '🌉', loup: '🐺', souris: '🐭', crocodile: '🐊', crocodiles: '🐊', poule: '🐔', cerf: '🦌', escargot: '🐌', alouette: '🐦', sapin: '🎄', danse: '💃', dansons: '💃', chanson: '🎵', musique: '🎶', nuit: '🌙', jour: '☀️', matin: '🌅', soir: '🌆', abeille: '🐝', abeilles: '🐝', nectar: '🍯', lampe: '💡', lumiere: '💡', matines: '🔔', sonnent: '🔔', famille: '👨‍👩‍👧', bebe: '👶', papa: '👨', maman: '👩', pere: '👨', mere: '👩', frere: '👦', ecole: '🏫', cahier: '📒', dessiner: '🎨', mer: '🌊', mers: '🌊', nemo: '🐠', energie: '⚡', numerique: '💻', porte: '🚪', table: '🍽️', cuisine: '🍳', doigt: '☝️', coeur: '❤️', fete: '🎉', neige: '❄️', couleurs: '🌈', voyage: '🧳', gare: '🚉', recette: '📜', dodo: '😴', dors: '😴', dormez: '😴', chou: '🥬', choux: '🥬', moulin: '🌾', meunier: '👨‍🌾', bergere: '👩‍🌾', mouton: '🐑', capucine: '🌼', chaleur: '🔥', tunnels: '🚇', secret: '🤫', secrets: '🤫', aventure: '🗺️', pays: '🌍', monde: '🌍', enfants: '🧒', enfant: '🧒', animaux: '🐾', furet: '🐾', escargots: '🐌', petit: '🐣', ailes: '🪽', cadeau: '🎁', etoiles: '⭐', pirouette: '🌀', nager: '🏊', nagent: '🐟', vole: '🕊️', saute: '🐇', sauter: '🐇' };
    function emojisIn(t) { var m = String(t).match(/[A-Za-zÀ-ÿ]+/g) || [], out = []; m.forEach(function (w) { var k = nw(w), e = LEX[k] || LEX[k.replace(/s$/, '')]; if (e && out.indexOf(e) < 0) out.push(e); }); return out; }
    function heroOf(it) { var e = emojisIn(it.title).filter(function (x) { return x !== '🐣'; }); if (e.length) return e[0]; e = emojisIn(it.content).filter(function (x) { return x !== '🐣'; }); return e.length ? e[0] : (it.id.indexOf('song') === 0 ? '🎵' : '📖'); }
    function themeOf(it) { var t = norm(it.title + ' ' + it.content); if (/lune|etoile|nuit|dodo|berceuse|dors|dormez/.test(t)) return 'night'; if (/poisson|bateau|navire|mer |mers|eau|crocodile|riviere/.test(t)) return 'sea'; if (/bois|foret|arbre|loup|sapin|chene/.test(t)) return 'forest'; if (/train|gare|voiture|marche|musee|numerique|energie/.test(t)) return 'city'; return 'meadow'; }
    var DECO = {
      night: ['🌙', '✨', '⭐', '✨', '⭐', '☁️', '✨'], sea: ['🫧', '🫧', '🫧', '🐠', '🫧', '🌊', '☁️'], forest: ['🍃', '🍃', '🌲', '🦋', '🍂', '☁️', '🍃'], city: ['☁️', '☁️', '🏙️', '✨', '🌤️', '☁️'], meadow: ['☁️', '☀️', '🦋', '🌼', '☁️', '🐝', '✨']
    };
    var COVERS = ['linear-gradient(135deg,#f472b6,#fb923c)', 'linear-gradient(135deg,#38bdf8,#6366f1)', 'linear-gradient(135deg,#34d399,#0ea5e9)', 'linear-gradient(135deg,#fbbf24,#ef4444)', 'linear-gradient(135deg,#a78bfa,#ec4899)', 'linear-gradient(135deg,#2dd4bf,#84cc16)'];

    /* ---------- البيانات والتقدم ---------- */
    var D = null, ST = store('bq_cnt') || { xp: 0, read: {}, sung: {}, fav: [] };
    function save() { store('bq_cnt', ST); }
    function lvl() { var x = ST.xp; return x >= 600 ? '🦉 حكيم الحكايات' : x >= 300 ? '🧙 ساحر القصص' : x >= 120 ? '🧚 صديق الجنيات' : x >= 30 ? '🐣 قارئ صغير' : '🌱 مبتدئ'; }
    function lvOf(it) { var l = it.level || ''; return /D[ée]butant/i.test(l) ? 'b' : /Interm/i.test(l) ? 'm' : /Avanc/i.test(l) ? 'a' : 's'; }
    var LVN = { b: '🌱 مبتدئ', m: '🌿 متوسط', a: '🌳 متقدم', s: '🎵 أغنية' };
    function items(kind) { return D[kind] || []; }
    function find(id) { var all = items('stories').concat(items('songs')); return all.filter(function (x) { return x.id === id; })[0]; }
    function sents(it) { var t = String(it.content).trim(); return (it.id.indexOf('song') === 0 ? t.split(/\n+/) : t.replace(/([.!?…]+)\s+/g, '$1\u0001').split('\u0001')).filter(function (s) { return s.trim(); }); }
    function trans(it) { var t = String(it.translation || '').trim(); return it.id.indexOf('song') === 0 ? t.split(/\n+/) : t.replace(/([.!؟?…]+)\s+/g, '$1\u0001').split('\u0001'); }

    /* ---------- التنسيق (بادئة cnt- فريدة) ---------- */
    var st = document.createElement('style');
    st.textContent = '.cnt{color:#1f2937}.cnt *{box-sizing:border-box}.cnt button{font-family:inherit;cursor:pointer}' +
      '.cnt-hero{position:relative;overflow:hidden;border-radius:24px;padding:16px 14px 14px;color:#fff;text-align:center;background:linear-gradient(135deg,#7c3aed,#ec4899 50%,#f59e0b);background-size:220% 220%;animation:cntBg 9s ease infinite;box-shadow:0 10px 28px rgba(236,72,153,.38);margin-bottom:12px}@keyframes cntBg{50%{background-position:100% 50%}}' +
      '.cnt-hero h3{margin:2px 0 0;font-size:1.3rem}.cnt-hero p{margin:4px 0 8px;font-size:.82rem;opacity:.95}.cnt-fl{position:absolute;font-size:1.5rem;opacity:.55;animation:cntFl 6s ease-in-out infinite;pointer-events:none}@keyframes cntFl{50%{transform:translateY(-14px) rotate(12deg)}}' +
      '.cnt-stats{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;position:relative}.cnt-stats span{background:rgba(255,255,255,.25);border-radius:14px;padding:5px 11px;font-size:.78rem;font-weight:800}' +
      '.cnt-tabs{display:flex;gap:8px;margin-bottom:8px}.cnt-tabs button{flex:1;border:0;border-radius:16px;padding:12px;font-weight:900;font-size:.92rem;background:#fdf2f8;color:#9d174d;transition:.2s}.cnt-tabs button.on{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;box-shadow:0 6px 16px rgba(124,58,237,.38);transform:translateY(-1px)}' +
      '.cnt-in{width:100%;border:2px solid #fbcfe8;border-radius:14px;padding:11px 14px;font-family:inherit;font-size:1rem;margin-bottom:8px}.cnt-in:focus{outline:0;border-color:#7c3aed}.cnt-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}.cnt-chips button{flex:none;border:1px solid #fbcfe8;background:#fff;border-radius:20px;padding:7px 13px;font-weight:800;font-size:.8rem;color:#9d174d}.cnt-chips button.on{background:#7c3aed;color:#fff;border-color:#7c3aed}' +
      '.cnt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:360px){.cnt-grid{grid-template-columns:1fr}}.cnt-book{position:relative;border:0;border-radius:6px 18px 18px 6px;padding:14px 8px 12px;color:#fff;text-align:center;box-shadow:6px 8px 16px rgba(0,0,0,.22),inset 6px 0 0 rgba(0,0,0,.18);transition:.18s;animation:cntIn .4s both;min-height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}.cnt-book:active{transform:scale(.95) rotate(-1deg)}@keyframes cntIn{from{opacity:0;transform:translateY(14px) rotate(2deg)}}' +
      '.cnt-book i{font-style:normal;font-size:3rem;filter:drop-shadow(0 6px 6px rgba(0,0,0,.3));animation:cntBob 3s ease-in-out infinite}@keyframes cntBob{50%{transform:translateY(-6px) rotate(4deg)}}.cnt-book b{font-size:.9rem;direction:ltr;line-height:1.3;text-shadow:0 2px 6px rgba(0,0,0,.35)}.cnt-book span{font-size:.78rem;opacity:.95}.cnt-book small{margin-top:4px;background:rgba(255,255,255,.28);border-radius:10px;padding:2px 9px;font-weight:800;font-size:.68rem}.cnt-book em{position:absolute;top:6px;left:10px;font-style:normal;font-size:.8rem}' +
      '.cnt-top{display:flex;align-items:center;gap:8px;margin-bottom:10px}.cnt-back{border:0;border-radius:12px;padding:9px 13px;background:#f3e8ff;font-weight:800;color:#6b21a8}.cnt-top h4{flex:1;margin:0;color:#9d174d;font-size:1rem;direction:ltr;text-align:left}.cnt-mute{border:0;background:none;font-size:1.4rem}' +
      '.cnt-scene{position:relative;height:210px;border-radius:24px;overflow:hidden;margin-bottom:10px;box-shadow:0 10px 24px rgba(0,0,0,.2);transition:background .6s}.cnt-scene.meadow{background:linear-gradient(#7dd3fc,#bae6fd 60%,#bbf7d0)}.cnt-scene.night{background:linear-gradient(#1e1b4b,#4338ca 70%,#7c3aed)}.cnt-scene.sea{background:linear-gradient(#bae6fd,#38bdf8 45%,#0369a1)}.cnt-scene.forest{background:linear-gradient(#bbf7d0,#4ade80 55%,#166534)}.cnt-scene.city{background:linear-gradient(#fde68a,#fdba74 55%,#fb7185)}' +
      '.cnt-dc{position:absolute;pointer-events:none;animation:cntDr linear infinite}@keyframes cntDr{from{transform:translateX(-30px)}to{transform:translateX(420px)}}.cnt-dc.tw{animation:cntTw 2.4s ease-in-out infinite}@keyframes cntTw{50%{opacity:.25;transform:scale(1.4)}}.cnt-dc.up{animation:cntUp 6s linear infinite}@keyframes cntUp{from{transform:translateY(40px);opacity:0}20%{opacity:.9}to{transform:translateY(-230px);opacity:0}}.cnt-dc.dn{animation:cntDn 7s linear infinite}@keyframes cntDn{from{transform:translateY(-30px) rotate(0)}to{transform:translateY(240px) rotate(260deg)}}' +
      '.cnt-gr{position:absolute;left:0;right:0;bottom:0;height:34px;background:linear-gradient(rgba(34,197,94,.9),#15803d);border-radius:50% 50% 0 0/14px 14px 0 0}.cnt-scene.sea .cnt-gr{background:linear-gradient(rgba(14,116,144,.5),#0c4a6e)}.cnt-scene.night .cnt-gr{background:linear-gradient(#3730a3,#1e1b4b)}' +
      '.cnt-main{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font-size:5.4rem;line-height:1;cursor:pointer;animation:cntBob 3s ease-in-out infinite;filter:drop-shadow(0 10px 8px rgba(0,0,0,.3));user-select:none;-webkit-tap-highlight-color:transparent}.cnt-main.jp{animation:cntJp .7s}@keyframes cntJp{30%{transform:translateX(-50%) translateY(-60px) rotate(-14deg) scale(1.25)}60%{transform:translateX(-50%) translateY(-10px) rotate(10deg)}}' +
      '.cnt-stk{position:absolute;left:0;right:0;bottom:6px;display:flex;justify-content:center;gap:10px;pointer-events:none}.cnt-stk span{font-size:2rem;animation:cntPop .5s both;filter:drop-shadow(0 4px 4px rgba(0,0,0,.3))}@keyframes cntPop{from{transform:scale(0) rotate(-40deg)}60%{transform:scale(1.35)}}.cnt-pt{position:absolute;pointer-events:none;font-size:1.5rem;animation:cntPt 1.2s ease-out forwards}@keyframes cntPt{to{transform:translate(var(--dx),var(--dy)) scale(1.4) rotate(160deg);opacity:0}}' +
      '.cnt-ctl{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.cnt-ctl button{border:1px solid #fbcfe8;background:#fff;border-radius:16px;padding:8px 13px;font-size:.8rem;font-weight:800;color:#9d174d}.cnt-ctl button.on{background:#fde68a;border-color:#f59e0b;color:#78350f}.cnt-ctl button.go{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:0}' +
      '.cnt-page{background:#fff;border:2px solid transparent;border-radius:18px;padding:11px 12px;margin-bottom:9px;box-shadow:0 4px 12px rgba(0,0,0,.07);transition:.25s;animation:cntIn .4s both}.cnt-page.pl{border-color:#f59e0b;background:#fffbeb;transform:scale(1.02);box-shadow:0 10px 22px rgba(245,158,11,.35)}.cnt-fr{font-size:1.1rem;font-weight:700;line-height:1.9;direction:ltr;text-align:left;color:#111827}.cnt-w{border-radius:6px;padding:0 1px;cursor:pointer}.cnt-w.hl{background:#fde68a}.cnt-ar{margin-top:5px;padding-top:5px;border-top:1px dashed #e5e7eb;font-size:.9rem;color:#4b5563;line-height:1.8}.cnt-sk{margin-top:4px;font-size:1.2rem;letter-spacing:4px}' +
      '.cnt-bar{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap}.cnt-btn{border:0;border-radius:22px;padding:12px 20px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;box-shadow:0 6px 16px rgba(124,58,237,.4)}.cnt-btn.y{background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}.cnt-btn.g{background:#f3f4f6;color:#374151;box-shadow:none}' +
      '.cnt-qz{background:linear-gradient(135deg,#4c1d95,#be185d);border-radius:22px;padding:14px;color:#fff;text-align:center;box-shadow:0 10px 26px rgba(76,29,149,.4);margin-top:10px}.cnt-q{font-size:1.08rem;font-weight:800;direction:ltr;margin:10px 0;line-height:1.7}.cnt-q u{text-decoration:none;display:inline-block;min-width:60px;border-bottom:3px dashed #fde047;color:#fde047}.cnt-op{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:8px}.cnt-op.one{grid-template-columns:1fr}.cnt-o{border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.16);color:#fff;border-radius:16px;padding:13px 6px;font-weight:800;font-size:.95rem;word-break:break-word}.cnt-o.ok{background:#16a34a}.cnt-o.no{background:#dc2626}.cnt-end{font-size:2.4rem;letter-spacing:6px}.cnt-note{font-size:.78rem;color:#6b7280;text-align:center;margin:8px 0}';
    document.head.appendChild(st);

    /* ---------- الحالة ---------- */
    var V = { view: 'home', kind: 'stories', f: 'all', q: '', id: null, ar: 1 }, NAR = null, QZ = null;
    function hero() {
      var h = $('#cnt-hd'); if (!h || !D) return; var fl = ['🧚', '⭐', '🦋', '🌈', '✨', '🎈'];
      h.innerHTML = '<div class="cnt-hero">' + fl.map(function (e, i) { return '<span class="cnt-fl" style="left:' + (6 + i * 17) + '%;top:' + (i % 2 ? 62 : 6) + '%;animation-delay:-' + i + 's">' + e + '</span>'; }).join('') + '<div style="font-size:2.4rem;position:relative">📚</div><h3 style="position:relative">مكتبة الحكايات السحرية</h3><div style="direction:ltr;font-weight:800;opacity:.95;position:relative">Bibliothèque magique</div><p style="position:relative">اقرأ، استمع، وغنِّ مع الحكايات والأغاني الفرنسية</p><div class="cnt-stats"><span>' + lvl() + '</span><span>✨ ' + ST.xp + ' XP</span><span>📖 ' + Object.keys(ST.read).length + ' / ' + items('stories').length + '</span><span>🎵 ' + Object.keys(ST.sung).length + ' / ' + items('songs').length + '</span></div></div>';
    }
    function mount() { ROOT.innerHTML = '<div class="cnt"><div id="cnt-hd"></div><div id="cnt-vw"></div></div>'; hero(); render(); }
    function render() {
      stopAll(); NAR = null; QZ = null; var v = $('#cnt-vw'); if (!D) return; if (OLD) OLD.style.display = V.view === 'old' ? '' : 'none';
      if (V.view === 'home') v.innerHTML = vHome(); else if (V.view === 'old') v.innerHTML = '<div class="cnt-note">📘 العرض الكلاسيكي — كما كان.</div><div class="cnt-bar"><button type="button" class="cnt-btn g" data-act="home">⬅ العودة للمكتبة</button></div>'; else { v.innerHTML = vRead(); sceneInit(); }
    }
    function list() {
      var q = norm(V.q); return items(V.kind).filter(function (x) { var ok = V.f === 'all' || (V.f === 'fav' ? ST.fav.indexOf(x.id) > -1 : V.f === 'done' ? !!(ST.read[x.id] || ST.sung[x.id]) : lvOf(x) === V.f); return ok && (!q || norm(x.title).indexOf(q) > -1 || x.title_ar.indexOf(V.q) > -1); });
    }
    function vHome() {
      var fs = V.kind === 'stories' ? [['all', '🌍 الكل'], ['b', '🌱 مبتدئ'], ['m', '🌿 متوسط'], ['a', '🌳 متقدم'], ['fav', '⭐ مفضلة'], ['done', '✅ قرأتها']] : [['all', '🌍 الكل'], ['fav', '⭐ مفضلة'], ['done', '✅ غنّيتها']];
      var l = list();
      return '<div class="cnt-tabs"><button type="button" data-k="stories" class="' + (V.kind === 'stories' ? 'on' : '') + '">📚 الحكايات (' + items('stories').length + ')</button><button type="button" data-k="songs" class="' + (V.kind === 'songs' ? 'on' : '') + '">🎵 الأغاني (' + items('songs').length + ')</button></div>' +
        '<input class="cnt-in" id="cnt-q" type="search" placeholder="🔎 ابحث…" value="' + esc(V.q) + '"><div class="cnt-chips">' + fs.map(function (f) { return '<button type="button" data-f="' + f[0] + '" class="' + (V.f === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div><div class="cnt-grid" id="cnt-gr">' + l.map(cardHTML).join('') + '</div>' +
        '<div class="cnt-bar"><button type="button" class="cnt-btn g" data-act="old">📘 العرض الكلاسيكي</button></div>';
    }
    function cardHTML(it, i) {
      var done = ST.read[it.id] || ST.sung[it.id], fv = ST.fav.indexOf(it.id) > -1;
      return '<button type="button" class="cnt-book" data-open="' + esc(it.id) + '" style="background:' + COVERS[i % COVERS.length] + ';animation-delay:' + Math.min(i, 10) * 45 + 'ms">' + (done ? '<em>' + '⭐'.repeat(done.s || 1) + '</em>' : '') + (fv ? '<em style="left:auto;right:10px">❤️</em>' : '') + '<i>' + heroOf(it) + '</i><b>' + esc(it.title) + '</b><span>' + esc(it.title_ar) + '</span><small>' + LVN[V.kind === 'songs' ? 's' : lvOf(it)] + '</small></button>';
    }

    /* ---------- صفحة القراءة / الغناء ---------- */
    function scene(it) {
      var th = themeOf(it), dec = DECO[th], isUp = th === 'sea', h = '';
      dec.forEach(function (e, i) { var cls = e === '☁️' || e === '🌤️' ? '' : (e === '✨' || e === '⭐' || e === '🌙') ? ' tw' : (isUp ? ' up' : (e === '🍃' || e === '🍂') ? ' dn' : ' tw'); var style = 'left:' + (6 + (i * 37) % 86) + '%;top:' + (6 + (i * 23) % 52) + '%;font-size:' + (1 + (i % 3) * 0.5) + 'rem;'; if (!cls) style += 'animation-duration:' + (18 + i * 5) + 's;animation-delay:-' + (i * 4) + 's;left:0'; if (cls) style += 'animation-delay:-' + (i * 1.3) + 's'; h += '<span class="cnt-dc' + cls + '" style="' + style + '">' + e + '</span>'; });
      return '<div class="cnt-scene ' + th + '" id="cnt-sc">' + h + '<div class="cnt-gr"></div><div class="cnt-main" id="cnt-mn" role="button">' + heroOf(it) + '</div><div class="cnt-stk" id="cnt-sk"></div></div>';
    }
    function words(t) { return String(t).split(/(\s+)/).map(function (w) { return /\S/.test(w) ? '<span class="cnt-w" data-w="' + esc(w.replace(/[^\wÀ-ÿ’']/g, '')) + '">' + esc(w) + '</span>' : w; }).join(''); }
    function vRead() {
      var it = find(V.id), isSong = it.id.indexOf('song') === 0, S = sents(it), T = trans(it), fv = ST.fav.indexOf(it.id) > -1;
      return '<div class="cnt-top"><button type="button" class="cnt-back" data-act="home">→ المكتبة</button><h4>' + esc(it.title) + '</h4><button type="button" class="cnt-mute" data-act="mute">' + (MUTE ? '🔇' : '🔊') + '</button><button type="button" class="cnt-mute" data-act="fav">' + (fv ? '❤️' : '🤍') + '</button></div>' + scene(it) +
        '<div class="cnt-ctl"><button type="button" class="go" data-act="narr" id="cnt-nb">' + (isSong ? '🎤 غنِّ معي' : '▶️ اقرأ لي القصة') + '</button><button type="button" data-act="tr" class="' + (V.ar ? 'on' : '') + '">🇪🇬 الترجمة</button>' + (isSong ? '<button type="button" data-act="mb" id="cnt-mb" class="on">🎼 موسيقى</button>' : '') + '<button type="button" data-act="slow" id="cnt-sl">🐢 بطيء</button></div>' +
        '<div id="cnt-pgs">' + S.map(function (s, i) { return '<div class="cnt-page" data-i="' + i + '" style="animation-delay:' + i * 70 + 'ms"><div class="cnt-fr">' + words(s) + '</div><div class="cnt-ar" data-ar' + (V.ar ? '' : ' hidden') + '>' + esc(T[i] || '') + '</div><div class="cnt-sk">' + emojisIn(s).slice(0, 5).join(' ') + '</div></div>'; }).join('') + '</div>' +
        '<div class="cnt-bar"><button type="button" class="cnt-btn y" data-act="quiz">🧩 اختبرني</button></div><div id="cnt-qz"></div>';
    }
    var SLOW = false, MBON = true;
    function sceneInit() { SLOW = false; MBON = true; }
    function pop(emojis, n) {
      var sc = $('#cnt-sc'); if (!sc) return; var r = sc.getBoundingClientRect(), cx = r.width / 2, cy = r.height * 0.55;
      for (var i = 0; i < n; i++) { var p = document.createElement('span'); p.className = 'cnt-pt'; p.textContent = emojis[i % emojis.length]; p.style.left = cx + 'px'; p.style.top = cy + 'px'; p.style.setProperty('--dx', ((Math.random() - 0.5) * r.width * 0.9) + 'px'); p.style.setProperty('--dy', (-60 - Math.random() * 120) + 'px'); sc.appendChild(p); setTimeout(function (el) { return function () { el.remove(); }; }(p), 1300); }
    }
    function tapHero() { var it = find(V.id), m = $('#cnt-mn'), e = heroOf(it); if (!m) return; m.classList.remove('jp'); void m.offsetWidth; m.classList.add('jp'); (SND[KIND[e]] || SND.soft)(); pop(['✨', '⭐', e, '💫'], 8); }
    function showStickers(i) { var it = find(V.id), S = sents(it), sk = $('#cnt-sk'); if (!sk) return; var em = emojisIn(S[i] || '').slice(0, 4); sk.innerHTML = em.map(function (e, k) { return '<span style="animation-delay:' + k * 120 + 'ms">' + e + '</span>'; }).join(''); if (em.length) { sparkle(); pop(em, 6); } }
    function narrate() {
      var it = find(V.id), isSong = it.id.indexOf('song') === 0, S = sents(it), b = $('#cnt-nb');
      if (NAR) { stopAll(); NAR = null; $$('.cnt-page.pl').forEach(function (x) { x.classList.remove('pl'); }); b.textContent = isSong ? '🎤 غنِّ معي' : '▶️ اقرأ لي القصة'; return; }
      var my = ++TOK; NAR = { t: my }; b.textContent = '⏹ إيقاف'; var i = 0; if (isSong) musicBox(MBON);
      (function step() {
        if (!NAR || NAR.t !== my) return; $$('.cnt-page.pl').forEach(function (x) { x.classList.remove('pl'); });
        if (i >= S.length) { NAR = null; musicBox(false); b.textContent = isSong ? '🎤 غنِّ معي' : '▶️ اقرأ لي القصة'; sWin(); pop(['🎉', '⭐', '🎈', '✨'], 14); mark(isSong, 1, 5, 10); return; }
        var pg = $('.cnt-page[data-i="' + i + '"]'); if (pg) { pg.classList.add('pl'); try { pg.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} } showStickers(i); var m = $('#cnt-mn'); if (m) { m.classList.remove('jp'); void m.offsetWidth; m.classList.add('jp'); }
        speak(S[i], SLOW ? 0.55 : (isSong ? 0.78 : 0.85), isSong ? 1.3 : 1.12, function () { i++; setTimeout(step, isSong ? 250 : 500); });
      })();
    }
    function mark(isSong, stars, xp, bst) {
      var it = find(V.id), bag = isSong ? ST.sung : ST.read, first = !bag[it.id]; if (!bag[it.id] || (bag[it.id].s || 0) < stars) bag[it.id] = { s: stars }; ST.xp += xp + (first ? 10 : 0); save(); if (first) boost(15); if (bst) boost(bst); hero();
    }

    /* ---------- الاختبار ---------- */
    function allSents(kind) { var o = []; items(kind).forEach(function (it) { var S = sents(it), T = trans(it); S.forEach(function (s, i) { o.push({ s: s, t: T[i] || '' }); }); }); return o; }
    function pool(kind) { var o = {}; items(kind).forEach(function (it) { (it.content.match(/[A-Za-zÀ-ÿ]{4,}/g) || []).forEach(function (w) { o[w.toLowerCase()] = 1; }); }); return Object.keys(o); }
    function quizStart() {
      var it = find(V.id), kind = it.id.indexOf('song') === 0 ? 'songs' : 'stories', S = sents(it), T = trans(it), qs = [], AS = allSents(kind), PW = pool(kind);
      S.forEach(function (s, i) {
        var ws = (s.match(/[A-Za-zÀ-ÿ]{4,}/g) || []); if (ws.length) { var w = ws[Math.floor(Math.random() * ws.length)]; qs.push({ t: 'c', s: s, w: w, tr: T[i] || '', o: shuffle([w.toLowerCase()].concat(shuffle(PW.filter(function (x) { return x !== w.toLowerCase(); })).slice(0, 3))) }); }
        if (T[i]) qs.push({ t: 'm', s: s, a: T[i], o: shuffle([T[i]].concat(shuffle(AS.filter(function (x) { return x.t && x.t !== T[i]; })).slice(0, 2).map(function (x) { return x.t; }))) });
      });
      QZ = { qs: shuffle(qs).slice(0, 5), i: 0, ok: 0 }; quizQ();
    }
    function quizQ() {
      var box = $('#cnt-qz'); if (!QZ || !box) return; box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (QZ.i >= QZ.qs.length) { var p = Math.round(QZ.ok * 100 / QZ.qs.length), s3 = p >= 85 ? 3 : p >= 60 ? 2 : 1; sWin(); pop(['🎉', '⭐', '🎈'], 14); var isS = find(V.id).id.indexOf('song') === 0; box.innerHTML = '<div class="cnt-qz"><div class="cnt-end">' + '⭐'.repeat(s3) + '☆'.repeat(3 - s3) + '</div><h3 dir="ltr">' + QZ.ok + ' / ' + QZ.qs.length + '</h3><p>✨ +' + QZ.ok * 5 + ' XP</p><button type="button" class="cnt-btn y" data-act="quiz">🔁 مرة أخرى</button></div>'; if (p >= 60) mark(isS, s3, 0, 0); QZ = null; return; }
      var q = QZ.qs[QZ.i], h = '<div class="cnt-qz"><div style="display:flex;justify-content:space-between;font-weight:800"><span>' + (QZ.i + 1) + ' / ' + QZ.qs.length + '</span><span>✅ ' + QZ.ok + '</span></div>';
      if (q.t === 'c') { var ix = q.s.indexOf(q.w); h += '<div style="opacity:.9;margin-top:8px">أكمل الجملة:</div><div class="cnt-q">' + esc(q.s.slice(0, ix)) + '<u>&nbsp;&nbsp;&nbsp;&nbsp;</u>' + esc(q.s.slice(ix + q.w.length)) + '</div><div style="font-size:.85rem;opacity:.9">' + esc(q.tr) + '</div><div class="cnt-op">' + q.o.map(function (o, k) { return '<button type="button" class="cnt-o" data-qo="' + k + '" style="direction:ltr">' + esc(o) + '</button>'; }).join('') + '</div>'; }
      else h += '<div style="opacity:.9;margin-top:8px">ما معنى هذه الجملة؟</div><div class="cnt-q">' + esc(q.s) + '</div><button type="button" class="cnt-btn y" data-qs="1">🔊 اسمعها</button><div class="cnt-op one">' + q.o.map(function (o, k) { return '<button type="button" class="cnt-o" data-qo="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      box.innerHTML = h + '<div id="cnt-qm" style="min-height:28px;margin-top:8px;font-weight:800"></div></div>'; QZ.lock = false;
    }
    function quizAns(k) {
      if (!QZ || QZ.lock) return; QZ.lock = true; var q = QZ.qs[QZ.i], right = q.t === 'c' ? q.w.toLowerCase() : q.a, ok = q.o[k] === right;
      $$('.cnt-o').forEach(function (b, i) { if (q.o[i] === right) b.classList.add('ok'); else if (i === k) b.classList.add('no'); });
      if (ok) { QZ.ok++; sOk(); ST.xp += 5; save(); boost(8); hero(); pop(['⭐', '✨'], 6); } else sBad(); $('#cnt-qm').textContent = ok ? '🎉 أحسنت!' : '❌ الصواب بالأخضر';
      setTimeout(function () { if (QZ) { QZ.i++; quizQ(); } }, ok ? 900 : 1900);
    }

    /* ---------- الأحداث ---------- */
    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if (t.closest('#cnt-mn')) { tapHero(); return; }
      if ((x = t.closest('[data-open]'))) { V.view = 'read'; V.id = x.dataset.open; render(); window.scrollTo(0, 0); whoosh(); return; }
      if ((x = t.closest('[data-k]'))) { V.kind = x.dataset.k; V.f = 'all'; V.q = ''; render(); return; }
      if ((x = t.closest('[data-f]'))) { V.f = x.dataset.f; render(); return; }
      if ((x = t.closest('[data-qo]'))) { quizAns(+x.dataset.qo); return; }
      if (t.closest('[data-qs]') && QZ) { speak(QZ.qs[QZ.i].s, 0.85, 1.05); return; }
      if ((x = t.closest('.cnt-w'))) { var w = x.dataset.w, em = LEX[nw(w)] || LEX[nw(w).replace(/s$/, '')]; speak(w, 0.8, 1.1); x.classList.add('hl'); setTimeout(function () { x.classList.remove('hl'); }, 700); if (em) { var sk = $('#cnt-sk'); if (sk) sk.innerHTML = '<span>' + em + '</span>'; sparkle(); pop([em, '✨'], 6); } return; }
      if ((x = t.closest('[data-act]'))) { var a = x.dataset.act;
        if (a === 'home') { V.view = 'home'; render(); } else if (a === 'old') { V.view = 'old'; render(); }
        else if (a === 'narr') narrate(); else if (a === 'quiz') quizStart();
        else if (a === 'tr') { V.ar = V.ar ? 0 : 1; x.classList.toggle('on', !!V.ar); $$('[data-ar]').forEach(function (el) { el.hidden = !V.ar; }); }
        else if (a === 'slow') { SLOW = !SLOW; x.classList.toggle('on', SLOW); }
        else if (a === 'mb') { MBON = !MBON; x.classList.toggle('on', MBON); if (NAR) musicBox(MBON); }
        else if (a === 'mute') { MUTE = !MUTE; x.textContent = MUTE ? '🔇' : '🔊'; if (MUTE) musicBox(false); }
        else if (a === 'fav') { var it = find(V.id), i = ST.fav.indexOf(it.id); if (i > -1) ST.fav.splice(i, 1); else ST.fav.push(it.id); save(); x.textContent = i > -1 ? '🤍' : '❤️'; }
      }
    });
    ROOT.addEventListener('input', function (e) { if (e.target.id === 'cnt-q') { V.q = e.target.value; var g = $('#cnt-gr'); if (g) g.innerHTML = list().map(cardHTML).join(''); } });
    new MutationObserver(function () { if (!SEC.classList.contains('on')) { stopAll(); NAR = null; var b = $('#cnt-nb'); if (b) b.textContent = find(V.id) && find(V.id).id.indexOf('song') === 0 ? '🎤 غنِّ معي' : '▶️ اقرأ لي القصة'; $$('.cnt-page.pl').forEach(function (p) { p.classList.remove('pl'); }); } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });

    /* ---------- التحميل ---------- */
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    ROOT.innerHTML = '<div class="empty">⏳ جارٍ فتح مكتبة الحكايات…</div>'; if (OLD) OLD.style.display = 'none';
    getJson('stories.json').then(function (d) {
      if (!d || !Array.isArray(d.stories) || !Array.isArray(d.songs)) { ROOT.innerHTML = ''; if (OLD) OLD.style.display = ''; return; }
      D = d; mount();
    });
  }
})();
