/* ===== phonetique.js — «مختبر الصوتيات» التفاعلي لقسم Phonétique =====
   يقرأ data/phonetics.json (الأصوات، قواعد القراءة، الأصوات المتقاربة) ويبني: مختبرًا للأصوات، خريطة للفم،
   قواعد القراءة، تدريب الأذن، Virelangues، ويُبقي المرجع القديم كتبويب. يعمل داخل #phon-root فقط. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[phonetique]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('phonetics'), ROOT = document.getElementById('phon-root');
    if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.body');
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function sim(a, b) { var m = a.length, n = b.length, d = [], i, j; if (!m || !n) return 0; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 1; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return 1 - d[m][n] / Math.max(m, n); }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }

    /* ---------- الصوت ---------- */
    var AC = null;
    function tn(f, t0, d, type, v) { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (!AC) return; if (AC.state === 'suspended') AC.resume(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    function sOk() { tn(660, 0, 0.12, 'triangle', 0.15); tn(990, 0.1, 0.2, 'triangle', 0.15); }
    function sBad() { tn(220, 0, 0.25, 'sawtooth', 0.09); }
    function sWin() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tn(f, i * 0.12, 0.3, 'triangle', 0.15); }); }
    function fx(on) { $$('.plb-wave').forEach(function (w) { w.classList.toggle('on', on); }); }
    function say(t, rate) {
      try {
        if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).replace(/\([^)]*\)/g, '')); u.lang = 'fr-FR'; u.rate = rate || 0.9;
        u.onstart = function () { fx(true); }; u.onend = u.onerror = function () { fx(false); }; speechSynthesis.speak(u); setTimeout(function () { fx(false); }, 6000);
      } catch (e) {}
    }
    function heard(target, cb) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { cb(null, null); return null; }
      var r = new SR(); r.lang = 'fr-FR'; r.maxAlternatives = 3;
      r.onresult = function (e) { var t = norm(target), best = 0, h = ''; for (var i = 0; i < e.results[0].length; i++) { var x = e.results[0][i].transcript, s = sim(norm(x), t); if (s > best) { best = s; h = x; } } cb(best, h); };
      r.onerror = function () { cb(-1, ''); }; try { r.start(); } catch (e) { cb(-1, ''); } return r;
    }

    /* ---------- البيانات والتقدم ---------- */
    var D = null, ST = store('bq_ph') || { xp: 0, m: [], ear: [0, 0], tw: {} };
    var GC = { vowels: ['#0ea5e9', '#2563eb'], semivowels: ['#10b981', '#047857'], consonants: ['#f59e0b', '#dc2626'], nasals: ['#a855f7', '#db2777'] };
    function save() { store('bq_ph', ST); }
    function addXp(n) { ST.xp += n; save(); header(); }
    function level() { var x = ST.xp; return x >= 1500 ? '🏆 خبير صوتيات' : x >= 700 ? '👑 محترف' : x >= 300 ? '🔥 ماهر' : x >= 100 ? '📘 متعلّم' : '🌱 مبتدئ'; }
    function allSounds() { var o = []; D.groups.forEach(function (g) { g.sounds.forEach(function (s) { o.push({ s: s, g: g }); }); }); return o; }
    function find(ipa) { var a = allSounds().filter(function (x) { return x.s.ipa === ipa; })[0]; return a || null; }
    var TW = [
      ['Les chaussettes de l\'archiduchesse sont-elles sèches, archi-sèches ?', 'هل جوارب الأرشيدوقة جافة، جافة جدًا؟', 'ʃ · s'],
      ['Un chasseur sachant chasser doit savoir chasser sans son chien.', 'صيّاد يعرف الصيد يجب أن يعرف الصيد بدون كلبه.', 'ʃ · s'],
      ['Si six scies scient six cyprès, six cents scies scient six cents cyprès.', 'إن نشرت ست مناشير ست أشجار سرو فست مئة منشار تنشر ست مئة شجرة.', 's'],
      ['Trois tortues trottaient sur un trottoir très étroit.', 'ثلاث سلاحف كانت تمشي على رصيف ضيق جدًا.', 'ʁ · t'],
      ['Ton thé t\'a-t-il ôté ta toux ?', 'هل أزال شايك سعالك؟', 't'],
      ['Les poules du couvent couvent.', 'دجاجات الدير تحتضن البيض.', 'u · k'],
      ['Je veux et j\'exige d\'exquises excuses.', 'أريد وأطلب اعتذارات رائعة.', 'ɛ · z'],
      ['Papier, panier, piano.', 'ورق، سلة، بيانو.', 'p']];

    /* ---------- التنسيق ---------- */
    var st = document.createElement('style');
    st.textContent = '.plb{color:#1b2a3a}.plb *{box-sizing:border-box}.plb button{font-family:inherit;cursor:pointer}' +
      '.plb-hero{position:relative;overflow:hidden;border-radius:22px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#0f172a,#1d4ed8 45%,#7c3aed 75%,#db2777);background-size:200% 200%;animation:plbBg 10s ease infinite;box-shadow:0 10px 28px rgba(29,78,216,.4);margin-bottom:12px}@keyframes plbBg{50%{background-position:100% 50%}}' +
      '.plb-hero h3{margin:2px 0 0;font-size:1.3rem}.plb-hero p{margin:4px 0 8px;font-size:.82rem;opacity:.9}.plb-stats{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.plb-stats span{background:rgba(255,255,255,.18);border-radius:14px;padding:5px 11px;font-size:.78rem;font-weight:800}' +
      '.plb-wave{display:flex;align-items:center;justify-content:center;gap:3px;height:34px;margin:8px 0}.plb-wave i{display:block;width:4px;height:6px;border-radius:3px;background:linear-gradient(#fde047,#fb7185);transition:height .2s}.plb-wave.on i{animation:plbW .7s ease-in-out infinite}.plb-wave i:nth-child(odd){height:11px}.plb-wave i:nth-child(4n){height:18px}.plb-wave i:nth-child(7n){height:8px}.plb-wave i:nth-child(3n){animation-delay:-.2s}.plb-wave i:nth-child(3n+1){animation-delay:-.45s}.plb-wave i:nth-child(5n){animation-duration:.5s}@keyframes plbW{0%,100%{height:6px}50%{height:30px}}' +
      '.plb-tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:6px}.plb-tabs button{flex:none;border:0;border-radius:16px;padding:10px 13px;font-weight:800;font-size:.82rem;background:#e8eef6;color:#33475b;transition:.2s}.plb-tabs button.on{background:linear-gradient(135deg,#0055A5,#7c3aed);color:#fff;box-shadow:0 6px 14px rgba(0,85,165,.35);transform:translateY(-1px)}' +
      '.plb-card{background:#fff;border:1px solid #d6e2f0;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,0,0,.05);animation:plbIn .35s both}@keyframes plbIn{from{opacity:0;transform:translateY(10px)}}.plb-card h4{margin:0 0 6px;color:#0055A5}' +
      '.plb-gh{display:flex;align-items:center;gap:8px;margin:14px 0 6px;font-weight:900;color:#1b2a3a}.plb-gh i{width:10px;height:22px;border-radius:5px;background:var(--g)}.plb-gi{font-size:.82rem;color:#5d6b7a;margin:0 0 8px;line-height:1.7}' +
      '.plb-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.plb-tile{position:relative;border:0;border-radius:18px;aspect-ratio:1;color:#fff;font-size:1.5rem;font-weight:900;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 5px 12px rgba(0,0,0,.2);transition:.15s;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}.plb-tile small{font-size:.58rem;font-weight:700;opacity:.9}.plb-tile:active{transform:scale(.9)}.plb-tile.m:after{content:"✓";position:absolute;top:3px;left:6px;font-size:.8rem;color:#fde047}' +
      '.plb-sheet{position:fixed;inset:0;z-index:99996;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center}.plb-sheet.on{display:flex}.plb-sp{background:#fff;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:26px 26px 0 0;animation:plbUp .35s}@keyframes plbUp{from{transform:translateY(100%)}}' +
      '.plb-sh{color:#fff;text-align:center;padding:16px 14px 10px;background:linear-gradient(135deg,var(--a),var(--b));border-radius:26px 26px 0 0}.plb-big{font-size:3.6rem;font-weight:900;line-height:1.1;text-shadow:0 0 22px rgba(255,255,255,.7)}.plb-sh .plb-tag{display:inline-block;background:rgba(0,0,0,.28);color:#fff;border-radius:12px;padding:3px 11px;font-size:.8rem;font-weight:800;margin:2px}' +
      '.plb-sb{padding:12px 14px 18px}.plb-kv{background:#f5f8ff;border-radius:14px;padding:9px 12px;margin-bottom:8px;font-size:.88rem;line-height:1.8}.plb-kv b{display:block;color:#0055A5;font-size:.78rem}' +
      '.plb-ex{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:8px 10px;margin-bottom:7px}.plb-ex.pl{background:#fffbeb;border-color:#f59e0b}.plb-ex .t b{display:block;color:#0055A5;font-size:1.05rem;direction:ltr;text-align:left}.plb-ex .t em{font-style:normal;color:#7c3aed;font-size:.85rem;direction:ltr;display:block;text-align:left}.plb-ex .t span{color:#5d6b7a;font-size:.82rem}' +
      '.plb-b{display:flex;gap:5px;flex:none}.plb-b button{width:36px;height:36px;border-radius:50%;border:0;background:#eef2ff;font-size:.95rem}.plb-b button:active{transform:scale(.88)}.plb-b button.rec{background:#fecaca;animation:plbP 1s infinite}@keyframes plbP{50%{transform:scale(1.15)}}.plb-fb{font-size:.8rem;margin:2px 4px 6px;min-height:0}' +
      '.plb-btn{border:0;border-radius:22px;padding:11px 20px;font-weight:900;margin:4px;background:linear-gradient(135deg,#0055A5,#7c3aed);color:#fff}.plb-btn.g{background:#e8eef6;color:#33475b}.plb-btn.y{background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}' +
      '.plb-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.plb-act{border:0;border-radius:18px;padding:14px 6px;color:#fff;font-weight:900;font-size:.9rem;line-height:1.5;box-shadow:0 6px 14px rgba(0,0,0,.18)}.plb-act i{display:block;font-style:normal;font-size:1.7rem}' +
      '.plb-bar{height:9px;border-radius:6px;background:#e8eef6;overflow:hidden;margin:3px 0 8px}.plb-bar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#0ea5e9);border-radius:6px;transition:width .5s}' +
      '.plb-map{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}.plb-chart{width:100%;max-width:330px}.plb-dot{cursor:pointer;transition:.15s}.plb-dot:active{transform:scale(.9)}.plb-dot.sel circle{stroke:#fde047;stroke-width:4;filter:drop-shadow(0 0 7px #f59e0b)}' +
      '.plb-lips{width:130px;height:120px;position:relative;margin:0 auto}.plb-lp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:radial-gradient(#7f1d1d,#be123c);border:7px solid #fb7185;border-radius:50%;transition:all .45s cubic-bezier(.3,1.5,.5,1);overflow:hidden}.plb-lp:after{content:"";position:absolute;left:12%;right:12%;top:0;height:22%;background:#fff;border-radius:0 0 8px 8px;opacity:.95}.plb-lp:before{content:"";position:absolute;left:var(--tx,50%);bottom:-18%;width:46%;height:60%;background:#f87171;border-radius:50%;transform:translateX(-50%);transition:.45s}' +
      '.plb-rule{background:#fff;border:1px solid #d6e2f0;border-right:5px solid #7c3aed;border-radius:16px;margin-bottom:10px;overflow:hidden}.plb-rule>button{width:100%;text-align:right;border:0;background:none;padding:12px;font-weight:800;color:#0055A5;display:flex;justify-content:space-between;gap:8px}.plb-rule .bd{display:none;padding:0 12px 12px}.plb-rule.open .bd{display:block}.plb-rule.open>button span{transform:rotate(90deg)}.plb-rule>button span{transition:.2s}' +
      '.plb-play{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:16px;color:#fff;text-align:center;box-shadow:0 10px 28px rgba(49,46,129,.45)}.plb-sp1{border:0;width:88px;height:88px;border-radius:50%;font-size:2.4rem;background:linear-gradient(135deg,#fde047,#fb923c);box-shadow:0 0 30px rgba(253,224,71,.7);animation:plbP 1.6s infinite;margin:8px}.plb-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.plb-opt{border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.14);color:#fff;border-radius:16px;padding:16px 6px;font-weight:900;font-size:1.1rem;direction:ltr}.plb-opt.ok{background:#16a34a}.plb-opt.no{background:#dc2626}' +
      '.plb-tw{font-size:1.05rem;font-weight:800;color:#0055A5;direction:ltr;text-align:left;line-height:1.7}.plb-pct{height:12px;border-radius:8px;background:#e8eef6;overflow:hidden;margin-top:6px}.plb-pct i{display:block;height:100%;background:linear-gradient(90deg,#fb7185,#fde047,#34d399);width:0;transition:width .6s}' +
      '.plb-pairs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}.plb-pair{border:1px solid #e2e8f0;border-radius:12px;padding:6px;text-align:center;background:#fff}.plb-pair b{display:block;direction:ltr;color:#0055A5}.plb-pair small{color:#7c3aed;direction:ltr;display:block}';
    document.head.appendChild(st);

    /* ---------- الهيكل ---------- */
    var TABS = [['home', '🏠 المختبر'], ['sounds', '🔊 الأصوات'], ['map', '🗺️ خريطة النطق'], ['rules', '🧩 قواعد القراءة'], ['ear', '🎧 تدريب الأذن'], ['twist', '🌀 Virelangues'], ['ref', '📘 المرجع الكامل']];
    var tab = 'home', sheet = null, MAP = { v: 'i' }, EAR = null, rec = null;
    function wave() { return '<div class="plb-wave">' + new Array(25).join('<i></i>') + '</div>'; }
    function header() {
      var h = $('#plb-hdr'); if (!h || !D) return; var tot = allSounds().length;
      h.innerHTML = '<div class="plb-hero"><div style="font-size:2.2rem">🔬</div><h3>مختبر الصوتيات</h3><div style="direction:ltr;font-weight:800;opacity:.9;letter-spacing:1px">Labo de phonétique</div><p>اسمع، قلّد، وقارن — تعلّم النطق الفرنسي خطوة بخطوة</p>' + wave() +
        '<div class="plb-stats"><span>' + level() + '</span><span>✨ ' + ST.xp + ' XP</span><span>🎯 ' + ST.m.length + ' / ' + tot + ' صوت</span><span>🎧 ' + (ST.ear[1] ? Math.round(ST.ear[0] * 100 / ST.ear[1]) : 0) + '% دقة الأذن</span></div></div>';
    }
    function mount() {
      ROOT.innerHTML = '<div class="plb"><div id="plb-hdr"></div><div class="plb-tabs" id="plb-tabs">' + TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="plb-view"></div></div><div class="plb-sheet" id="plb-sheet"></div>';
      header(); view();
    }
    function tileHTML(x) { var c = GC[x.g.id] || GC.vowels; return '<button type="button" class="plb-tile' + (ST.m.indexOf(x.s.ipa) > -1 ? ' m' : '') + '" data-s="' + esc(x.s.ipa) + '" style="--a:' + c[0] + ';--b:' + c[1] + '">' + esc(x.s.ipa) + '<small>' + esc(x.s.letters.split(',')[0]) + '</small></button>'; }
    function exRow(e, extra) { return '<div class="plb-ex"><div class="t"><b>' + esc(e.fr) + '</b><em>[' + esc(e.ipa) + ']</em><span>' + esc(e.ar) + '</span></div><div class="plb-b"><button type="button" data-a="say" data-w="' + esc(e.fr) + '">🔊</button><button type="button" data-a="slow" data-w="' + esc(e.fr) + '">🐢</button><button type="button" data-a="mic" data-w="' + esc(e.fr) + '">🎤</button></div></div><div class="plb-fb"></div>'; }

    /* ---------- العروض ---------- */
    function view() {
      var v = $('#plb-view'); if (!D) return; if (OLD) OLD.style.display = tab === 'ref' ? '' : 'none'; if (tab !== 'ear') EAR = null;
      if (tab === 'home') v.innerHTML = vHome(); else if (tab === 'sounds') v.innerHTML = vSounds(); else if (tab === 'map') { v.innerHTML = vMap(); lips(); } else if (tab === 'rules') v.innerHTML = vRules();
      else if (tab === 'ear') v.innerHTML = EAR ? vEarQ() : vEarHome(); else if (tab === 'twist') v.innerHTML = vTwist(); else v.innerHTML = '<div class="plb-gi" style="text-align:center">📘 المرجع الكامل للصوتيات — كما كان، بكل أقسامه.</div>';
    }
    function vHome() {
      var all = allSounds(), day = Math.floor(Date.now() / 86400000), t = all[day % all.length], nx = all.filter(function (x) { return ST.m.indexOf(x.s.ipa) < 0; })[0];
      var c = GC[t.g.id] || GC.vowels;
      return '<div class="plb-card" style="border-top:5px solid ' + c[0] + '"><h4>✨ صوت اليوم · Son du jour</h4><div style="display:flex;gap:12px;align-items:center"><button type="button" class="plb-tile" data-s="' + esc(t.s.ipa) + '" style="--a:' + c[0] + ';--b:' + c[1] + ';width:92px;flex:none">' + esc(t.s.ipa) + '<small>' + esc(t.s.letters) + '</small></button><div style="flex:1;font-size:.88rem;line-height:1.8"><b>' + esc(t.s.name_ar) + '</b><br>' + esc(t.s.tip_ar) + '</div></div></div>' +
        '<div class="plb-acts"><button type="button" class="plb-act" data-go="sounds" style="background:linear-gradient(135deg,#0ea5e9,#2563eb)"><i>🔊</i>استكشف الأصوات</button>' +
        '<button type="button" class="plb-act" data-go="map" style="background:linear-gradient(135deg,#10b981,#047857)"><i>🗺️</i>خريطة الفم</button>' +
        '<button type="button" class="plb-act" data-go="ear" style="background:linear-gradient(135deg,#f59e0b,#dc2626)"><i>🎧</i>درّب أذنك</button>' +
        '<button type="button" class="plb-act" data-go="twist" style="background:linear-gradient(135deg,#a855f7,#db2777)"><i>🌀</i>Virelangues</button></div>' +
        (nx ? '<div class="plb-card"><h4>🚀 صوتك التالي</h4><button type="button" class="plb-btn y" data-s="' + esc(nx.s.ipa) + '">ابدأ بالصوت [' + esc(nx.s.ipa) + ']</button></div>' : '<div class="plb-card"><h4>🏆 أتقنت كل الأصوات!</h4></div>') +
        '<div class="plb-card"><h4>📊 تقدّمك في المجموعات</h4>' + D.groups.map(function (g) { var m = g.sounds.filter(function (s) { return ST.m.indexOf(s.ipa) > -1; }).length; return '<div style="font-size:.82rem;font-weight:800">' + esc(g.title_ar) + ' <span style="color:#5d6b7a">' + m + '/' + g.sounds.length + '</span></div><div class="plb-bar"><i style="width:' + Math.round(m * 100 / g.sounds.length) + '%"></i></div>'; }).join('') + '</div>';
    }
    function vSounds() {
      return D.groups.map(function (g) { var c = GC[g.id] || GC.vowels; return '<div class="plb-gh" style="--g:' + c[0] + '"><i></i>' + esc(g.title_ar) + '<span style="font-weight:600;color:#5d6b7a;font-size:.8rem"> · ' + esc(g.title_fr) + '</span></div><p class="plb-gi">' + esc(g.intro_ar) + '</p><div class="plb-tiles">' + g.sounds.map(function (s) { return tileHTML({ s: s, g: g }); }).join('') + '</div>'; }).join('');
    }
    var VOW = { i: [0, 0, 0], y: [0.12, 0, 1], u: [1, 0, 1], e: [0.1, 0.33, 0], 'ø': [0.24, 0.33, 1], o: [0.9, 0.33, 1], 'ɛ': [0.2, 0.66, 0], 'œ': [0.32, 0.66, 1], 'ɔ': [0.85, 0.66, 1], a: [0.3, 1, 0], 'ə': [0.5, 0.5, 1] };
    function pos(v) { var L = 30 + v[1] * 70, R = 270; return [L + v[0] * (R - L), 28 + v[1] * 150]; }
    function vMap() {
      var dots = Object.keys(VOW).map(function (k) { var p = pos(VOW[k]), r = VOW[k][2]; return '<g class="plb-dot' + (k === MAP.v ? ' sel' : '') + '" data-v="' + esc(k) + '" transform="translate(' + p[0] + ',' + p[1] + ')"><circle r="17" fill="' + (r ? '#7c3aed' : '#fff') + '" stroke="' + (r ? '#4c1d95' : '#0055A5') + '" stroke-width="2.5"/><text text-anchor="middle" y="6" font-size="17" font-weight="900" fill="' + (r ? '#fff' : '#0055A5') + '">' + k + '</text></g>'; }).join('');
      var nas = D.groups.filter(function (g) { return g.id === 'nasals'; })[0];
      return '<div class="plb-card"><h4>🗺️ خريطة المتحركات: أين يكون اللسان؟</h4><p class="plb-gi">اضغط على أي صوت: ستسمعه، وسترى شكل الشفتين وموضع اللسان. الدوائر البنفسجية = شفاه مستديرة، والبيضاء = شفاه ممدودة.</p><div class="plb-map"><svg class="plb-chart" viewBox="0 0 300 210"><polygon points="30,28 270,28 270,178 100,178" fill="#eef2ff" stroke="#c7d2fe" stroke-width="3"/><line x1="64" y1="78" x2="270" y2="78" stroke="#c7d2fe" stroke-dasharray="4"/><line x1="82" y1="128" x2="270" y2="128" stroke="#c7d2fe" stroke-dasharray="4"/><text x="34" y="18" font-size="11" fill="#5d6b7a" font-weight="700">أمامي</text><text x="238" y="18" font-size="11" fill="#5d6b7a" font-weight="700">خلفي</text><text x="2" y="195" font-size="10" fill="#5d6b7a">مغلق ↑ · مفتوح ↓</text>' + dots + '</svg>' +
        '<div><div class="plb-lips"><div class="plb-lp" id="plb-lp"></div></div><div style="text-align:center;font-size:.75rem;color:#5d6b7a">شكل الشفتين</div></div></div><div id="plb-minfo"></div></div>' +
        (nas ? '<div class="plb-card"><h4>👃 المتحركات الأنفية</h4><p class="plb-gi">يخرج الهواء من الأنف والفم معًا. اضغط للسماع:</p><div class="plb-tiles">' + nas.sounds.map(function (s) { return tileHTML({ s: s, g: nas }); }).join('') + '</div></div>' : '');
    }
    function lips() {
      var k = MAP.v, v = VOW[k] || [0.5, 0.5, 0], lp = $('#plb-lp'), x = find(k); if (!lp) return;
      var w = v[2] ? 38 : 86, h = 14 + v[1] * 52 + (v[2] ? 10 : 0); lp.style.width = w + 'px'; lp.style.height = h + 'px'; lp.style.setProperty('--tx', (20 + v[0] * 60) + '%');
      $$('.plb-dot').forEach(function (d) { d.classList.toggle('sel', d.dataset.v === k); });
      var mi = $('#plb-minfo'); if (mi && x) mi.innerHTML = '<div class="plb-kv"><b>' + esc(x.s.name_ar) + ' · [' + esc(k) + ']</b>' + esc(x.s.how_ar) + '<br>' + esc(x.s.place_ar) + '</div><button type="button" class="plb-btn" data-s="' + esc(k) + '">📖 التفاصيل والأمثلة</button>';
    }
    function vRules() {
      return D.rule_groups.map(function (g) {
        return '<div class="plb-gh" style="--g:#7c3aed"><i></i>' + esc(g.title_ar) + '</div><p class="plb-gi">' + esc(g.intro_ar) + '</p>' + g.rules.map(function (r) {
          return '<div class="plb-rule"><button type="button" data-rl="1">' + esc(r.title_ar) + '<span>◀</span></button><div class="bd"><div class="plb-kv"><b>القاعدة</b>' + esc(r.rule_ar) + '</div>' + (r.why_ar ? '<div class="plb-kv"><b>لماذا؟</b>' + esc(r.why_ar) + '</div>' : '') + (r.exceptions_ar ? '<div class="plb-kv" style="background:#fff7ed"><b style="color:#ea580c">استثناء</b>' + esc(r.exceptions_ar) + '</div>' : '') + r.examples.map(exRow).join('') + '</div></div>';
        }).join('');
      }).join('');
    }
    function vEarHome() {
      return '<div class="plb-play"><div style="font-size:2.4rem">🎧</div><h3 style="margin:2px 0">درّب أذنك</h3><p style="font-size:.85rem;opacity:.9">ستسمع كلمة واحدة من زوج كلمات متقاربة، واختر ما سمعت. كل إجابة صحيحة تسرّع جوائزك ⚡</p><button type="button" class="plb-btn y" data-ear="all">🎲 تحدٍّ عشوائي (10 أسئلة)</button></div>' +
        '<div class="plb-gh" style="--g:#f59e0b"><i></i>اختر فرقًا صوتيًا للتدريب</div>' + D.contrasts.map(function (c) { return '<div class="plb-card"><h4>' + esc(c.title_ar) + '</h4><p class="plb-gi">' + esc(c.explanation_ar) + '</p><div class="plb-pairs">' + c.pairs.slice(0, 2).map(function (p) { return p.map(function (w) { return '<div class="plb-pair"><b>' + esc(w.fr) + '</b><small>[' + esc(w.ipa) + ']</small>' + esc(w.ar) + '</div>'; }).join(''); }).join('') + '</div><div style="margin-top:8px;text-align:center"><button type="button" class="plb-btn" data-ear="' + esc(c.id) + '">🎧 تدرّب</button><button type="button" class="plb-btn g" data-say2="' + esc(c.id) + '">🔊 اسمع الأزواج</button></div></div>'; }).join('');
    }
    function earStart(id) {
      var pool = []; D.contrasts.forEach(function (c) { if (id === 'all' || c.id === id) c.pairs.forEach(function (p) { pool.push(p); }); });
      var qs = shuffle(pool).slice(0, 10).map(function (p) { var i = Math.round(Math.random()); return { p: p, t: i }; }); EAR = { qs: qs, i: 0, ok: 0, locked: false }; view(); setTimeout(earPlay, 350);
    }
    function earPlay() { if (EAR && EAR.i < EAR.qs.length) { var q = EAR.qs[EAR.i]; say(q.p[q.t].fr, 0.8); } }
    function vEarQ() {
      if (EAR.i >= EAR.qs.length) { var s = EAR.ok >= 9 ? 3 : EAR.ok >= 7 ? 2 : EAR.ok >= 5 ? 1 : 0; sWin(); return '<div class="plb-play"><div style="font-size:2.6rem;letter-spacing:6px">' + '⭐'.repeat(s) + '☆'.repeat(3 - s) + '</div><h3>' + EAR.ok + ' / ' + EAR.qs.length + ' إجابة صحيحة</h3><p>✨ +' + EAR.ok * 4 + ' XP</p><button type="button" class="plb-btn y" data-ear="all">🔁 جولة جديدة</button><button type="button" class="plb-btn g" data-go="ear" style="background:rgba(255,255,255,.2);color:#fff">القائمة</button></div>'; }
      var q = EAR.qs[EAR.i]; EAR.locked = false;
      return '<div class="plb-play"><div style="display:flex;justify-content:space-between;font-weight:800"><span>' + (EAR.i + 1) + ' / ' + EAR.qs.length + '</span><span>✅ ' + EAR.ok + '</span></div>' + wave() + '<div>ماذا سمعت؟</div><button type="button" class="plb-sp1" data-earp="1">🔊</button><div><button type="button" class="plb-btn g" data-earp="slow" style="background:rgba(255,255,255,.2);color:#fff">🐢 أبطأ</button></div><div class="plb-opts">' +
        q.p.map(function (w, i) { return '<button type="button" class="plb-opt" data-eo="' + i + '">' + esc(w.fr) + '</button>'; }).join('') + '</div><div id="plb-em" style="min-height:46px;margin-top:10px;font-weight:800"></div></div>';
    }
    function earAnswer(i, btn) {
      if (!EAR || EAR.locked) return; EAR.locked = true; var q = EAR.qs[EAR.i], ok = i === q.t, o = $$('.plb-opt');
      o.forEach(function (b, k) { if (k === q.t) b.classList.add('ok'); else if (k === i) b.classList.add('no'); });
      ST.ear[1]++; if (ok) { EAR.ok++; ST.ear[0]++; ST.xp += 4; sOk(); boost(8); } else sBad(); save(); header();
      $('#plb-em').innerHTML = (ok ? '🎉 صحيح! ' : '❌ ') + q.p.map(function (w) { return '<span dir="ltr">' + esc(w.fr) + ' [' + esc(w.ipa) + ']</span> = ' + esc(w.ar); }).join(' · ');
      setTimeout(function () { if (EAR) { EAR.i++; view(); if (EAR && EAR.i < EAR.qs.length) setTimeout(earPlay, 300); } }, ok ? 1500 : 2800);
    }
    function vTwist() {
      return '<div class="plb-card" style="background:linear-gradient(135deg,#faf5ff,#fff)"><h4>🌀 Virelangues — ألسنة تتحدّى لسانك</h4><p class="plb-gi">اسمع الجملة بسرعة بطيئة ثم أسرع، ثم جرّب بنفسك بالميكروفون (Chrome). نسبة 70% فأكثر تكسبك نقاطًا!</p></div>' +
        TW.map(function (t, i) { var b = ST.tw[i] || 0; return '<div class="plb-card" data-tw="' + i + '"><div class="plb-tw">' + esc(t[0]) + '</div><div style="font-size:.82rem;color:#5d6b7a;margin:4px 0">' + esc(t[1]) + ' · <b style="color:#7c3aed">[' + esc(t[2]) + ']</b></div><div class="plb-b" style="justify-content:center;gap:8px;margin:6px 0"><button type="button" data-a="tw" data-r="0.55">🐢</button><button type="button" data-a="tw" data-r="0.9">🔊</button><button type="button" data-a="tw" data-r="1.3">⚡</button><button type="button" data-a="twmic">🎤</button></div><div class="plb-pct"><i style="width:' + b + '%"></i></div><div class="plb-fb">أفضل نتيجة: ' + b + '%</div></div>'; }).join('');
    }

    /* ---------- النافذة السفلية للصوت ---------- */
    function openSheet(ipa) {
      var x = find(ipa); if (!x) return; sheet = x; var c = GC[x.g.id] || GC.vowels, sh = $('#plb-sheet'), m = ST.m.indexOf(ipa) > -1, s = x.s;
      sh.innerHTML = '<div class="plb-sp"><div class="plb-sh" style="--a:' + c[0] + ';--b:' + c[1] + '"><div class="plb-big">[' + esc(ipa) + ']</div><div><span class="plb-tag">' + esc(s.name_ar) + '</span><span class="plb-tag">الحروف: ' + esc(s.letters) + '</span></div>' + wave() + '</div><div class="plb-sb">' +
        '<div class="plb-kv"><b>👄 كيف تنطقه؟</b>' + esc(s.how_ar) + '</div><div class="plb-kv"><b>👅 موضع اللسان</b>' + esc(s.place_ar) + '</div><div class="plb-kv"><b>❓ لماذا؟</b>' + esc(s.why_ar) + '</div><div class="plb-kv" style="background:#fffbeb"><b style="color:#b45309">💡 نصيحة</b>' + esc(s.tip_ar) + '</div>' +
        '<div style="font-weight:900;margin:10px 0 6px">أمثلة — اسمع ثم قلّد:</div>' + s.examples.map(exRow).join('') +
        '<div style="text-align:center;margin-top:10px"><button type="button" class="plb-btn y" data-mas="' + esc(ipa) + '">' + (m ? '✅ أتقنته' : '✅ أتقنت هذا الصوت') + '</button><button type="button" class="plb-btn g" data-nx="1">التالي ➜</button><button type="button" class="plb-btn g" data-cl="1">إغلاق</button></div></div></div>';
      sh.classList.add('on'); setTimeout(function () { say(s.examples[0].fr); }, 300);
    }
    function closeSheet() { $('#plb-sheet').classList.remove('on'); sheet = null; try { speechSynthesis.cancel(); } catch (e) {} fx(false); }

    /* ---------- الأحداث ---------- */
    function onClick(e) {
      var t = e.target;
      if (t.id === 'plb-sheet') { closeSheet(); return; }
      var tb = t.closest('#plb-tabs [data-t]'); if (tb) { tab = tb.dataset.t; $$('#plb-tabs button').forEach(function (b) { b.classList.toggle('on', b === tb); }); view(); return; }
      var go = t.closest('[data-go]'); if (go) { tab = go.dataset.go; $$('#plb-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === tab); }); view(); return; }
      var ts = t.closest('[data-s]'); if (ts) { openSheet(ts.dataset.s); return; }
      var dv = t.closest('[data-v]'); if (dv) { MAP.v = dv.dataset.v; lips(); var x = find(MAP.v); if (x) say(x.s.examples[0].fr); return; }
      var rl = t.closest('[data-rl]'); if (rl) { rl.parentNode.classList.toggle('open'); return; }
      var er = t.closest('[data-ear]'); if (er) { earStart(er.dataset.ear); return; }
      var ep = t.closest('[data-earp]'); if (ep && EAR) { var q = EAR.qs[EAR.i]; say(q.p[q.t].fr, ep.dataset.earp === 'slow' ? 0.5 : 0.8); return; }
      var eo = t.closest('[data-eo]'); if (eo) { earAnswer(+eo.dataset.eo, eo); return; }
      var s2 = t.closest('[data-say2]'); if (s2) { var c = D.contrasts.filter(function (z) { return z.id === s2.dataset.say2; })[0]; if (c) { var l = []; c.pairs.slice(0, 3).forEach(function (p) { p.forEach(function (w) { l.push(w.fr); }); }); say(l.join(', . '), 0.7); } return; }
      var ms = t.closest('[data-mas]'); if (ms) { var ip = ms.dataset.mas; if (ST.m.indexOf(ip) < 0) { ST.m.push(ip); ST.xp += 10; save(); boost(20); sWin(); header(); ms.textContent = '✅ أتقنته (+10 XP ⚡)'; if (tab === 'sounds') view(); } return; }
      if (t.closest('[data-nx]') && sheet) { var al = allSounds(), i = al.map(function (z) { return z.s.ipa; }).indexOf(sheet.s.ipa); openSheet(al[(i + 1) % al.length].s.ipa); return; }
      if (t.closest('[data-cl]')) { closeSheet(); if (tab === 'sounds' || tab === 'home') view(); return; }
      var a = t.closest('[data-a]'); if (!a) return; var w = a.dataset.w, ac = a.dataset.a;
      if (ac === 'say') say(w); else if (ac === 'slow') say(w, 0.5);
      else if (ac === 'mic') { var row = a.closest('.plb-ex'), fb = row.nextElementSibling; if (rec) { try { rec.abort(); } catch (z) {} } a.classList.add('rec'); fb.textContent = 'تكلّم الآن… 🎙️';
        rec = heard(w, function (sc, h) { a.classList.remove('rec'); if (sc === null) { fb.textContent = '🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome).'; return; } if (sc < 0) { fb.textContent = '⚠️ لم أسمعك جيدًا، أعد المحاولة.'; return; } var p = Math.round(sc * 100); fb.innerHTML = (p >= 85 ? '🎉 ممتاز' : p >= 60 ? '👍 قريب جدًا' : '🔁 حاول مجددًا') + ' · ' + p + '% <small dir="ltr">(' + esc(h) + ')</small>'; if (p >= 85) { sOk(); addXp(2); } }); }
      else if (ac === 'tw') { var card = a.closest('[data-tw]'); say(TW[+card.dataset.tw][0], +a.dataset.r); }
      else if (ac === 'twmic') { var cd = a.closest('[data-tw]'), idx = +cd.dataset.tw, f2 = $('.plb-fb', cd); a.classList.add('rec'); f2.textContent = 'تكلّم الآن… 🎙️';
        rec = heard(TW[idx][0], function (sc, h) { a.classList.remove('rec'); if (sc === null) { f2.textContent = '🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome).'; return; } if (sc < 0) { f2.textContent = '⚠️ لم أسمعك جيدًا، أعد المحاولة.'; return; } var p = Math.round(sc * 100); $('.plb-pct i', cd).style.width = p + '%'; if (p > (ST.tw[idx] || 0)) { ST.tw[idx] = p; save(); } f2.innerHTML = (p >= 70 ? '🎉 رائع! +5 XP ⚡' : '🔁 حاول مجددًا') + ' · ' + p + '% — أفضل: ' + ST.tw[idx] + '%'; if (p >= 70) { sOk(); addXp(5); boost(15); } }); }
    }
    ROOT.addEventListener('click', onClick);
    new MutationObserver(function () { if (!SEC.classList.contains('on')) { closeSheet(); try { speechSynthesis.cancel(); } catch (e) {} } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });

    /* ---------- التحميل ---------- */
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    ROOT.innerHTML = '<div class="empty">⏳ جارٍ تجهيز مختبر الصوتيات…</div>'; if (OLD) OLD.style.display = 'none';
    getJson('phonetics.json').then(function (d) {
      if (!d || !d.groups || !d.rule_groups || !d.contrasts) { ROOT.innerHTML = ''; if (OLD) OLD.style.display = ''; return; }
      D = d; mount();
    });
  }
})();
