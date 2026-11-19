/* ===== progress.js — «رحلتي»: تقدّم موحّد + سلسلة يومية + هدف + شارات + دفتر الأخطاء =====
   يقرأ بيانات بقية الأقسام من الجهاز (bq_quiz / bq_chn / bq_known / ag_learned / bq_zoza / bq_prizes)
   دون تعديلها، ويحفظ تقدّمه في bq_prog. يعمل داخل #progress-root فقط.
   واجهة الربط (اختيارية) لتسجيل أخطاء الاختبار:  window.__bqProgress.mistake({fr,ar}) / .correct({fr,ar}) */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[progress]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('progress'), ROOT = document.getElementById('progress-root');
    if (!SEC || !ROOT) return;
    function $(s, r) { return (r || ROOT).querySelector(s); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function dkey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function toast(m, ms) { var t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, ms || 3000); }
    function say(t) { try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).replace(/\([^)]*\)/g, '')); u.lang = 'fr-FR'; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {} }
    function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

    /* ---------- الحالة المحفوظة ---------- */
    var KEY = 'bq_prog';
    var P = J(KEY, null);
    if (!P || typeof P !== 'object') P = {};
    P.days = P.days || {}; P.badges = P.badges || {}; P.mistakes = P.mistakes || {};
    P.goal = P.goal || 10; P.mastered = P.mastered || 0; P.bestStreak = P.bestStreak || 0; P.snap = P.snap || null;
    function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
    function day(k) { k = k || dkey(); return P.days[k] || (P.days[k] = { s: 0, x: 0 }); }

    /* ---------- قراءة تقدّم بقية الأقسام ---------- */
    function readStats() {
      var quiz = J('bq_quiz', {}) || {}, chn = J('bq_chn', {}) || {}, known = J('bq_known', []), arg = J('ag_learned', []), zz = J('bq_zoza', {}) || {}, pr = J('bq_prizes', {}) || {};
      var s = {
        quizPts: +quiz.pts || 0, quizBest: +quiz.best || 0, quizPlayed: +quiz.played || 0,
        songXp: +chn.xp || 0, songsDone: Object.keys(chn.done || {}).length, listenMin: Math.round((+chn.sec || 0) / 60),
        known: Array.isArray(known) ? known.length : 0, argot: Array.isArray(arg) ? arg.length : 0,
        zozaOk: +zz.ok || 0, zozaAsked: +zz.asked || 0, prizes: Object.keys(pr).length
      };
      s.xp = s.quizPts + s.songXp + s.known * 3 + s.argot * 2 + s.zozaOk * 4 + s.prizes * 20 + P.mastered * 5;
      return s;
    }
    var LV = [0, 50, 150, 300, 500, 800, 1200, 1800, 2600, 3600, 5000, 7000];
    var LN = ['🌱 بذرة', '🐣 كتكوت', '📘 متعلّم', '🎒 تلميذ نشيط', '⭐ ماهر', '🎧 مستمع', '🗣️ متحدّث', '🔥 محترف', '👑 خبير', '🏆 بطل', '🦁 أسد الفرنسية', '🐓 ديك البكالوريا'];
    function levelOf(xp) { var i = 0; for (var k = 0; k < LV.length; k++) if (xp >= LV[k]) i = k; return i; }

    /* ---------- السلسلة والهدف ---------- */
    function active(k) { var d = P.days[k]; return !!(d && (d.s >= 120 || d.x > 0)); }
    function streak() { var n = 0, d = new Date(); if (!active(dkey(d))) d.setDate(d.getDate() - 1); while (active(dkey(d)) && n < 1000) { n++; d.setDate(d.getDate() - 1); } return n; }
    function goalDays() { var n = 0; Object.keys(P.days).forEach(function (k) { if (P.days[k].s >= P.goal * 60) n++; }); return n; }

    /* ---------- الشارات ---------- */
    var BADGES = [
      ['first', '🚀', 'أول خطوة', 'اجمع 10 نقاط خبرة', function (s) { return s.xp >= 10; }],
      ['str3', '🔥', 'ثلاثة أيام متتالية', 'ادرس 3 أيام بلا انقطاع', function () { return P.bestStreak >= 3; }],
      ['str7', '🌟', 'أسبوع كامل', 'ادرس 7 أيام متتالية', function () { return P.bestStreak >= 7; }],
      ['str30', '🏅', 'شهر من الالتزام', 'ادرس 30 يومًا متتالية', function () { return P.bestStreak >= 30; }],
      ['w50', '📖', '50 كلمة', 'احفظ 50 كلمة في قاموس الحياة', function (s) { return s.known >= 50; }],
      ['w200', '📚', '200 كلمة', 'احفظ 200 كلمة', function (s) { return s.known >= 200; }],
      ['w500', '🎓', '500 كلمة', 'احفظ 500 كلمة', function (s) { return s.known >= 500; }],
      ['songs10', '🎵', 'محب الأغاني', 'استمع إلى 10 أغانٍ كاملة', function (s) { return s.songsDone >= 10; }],
      ['songs50', '🎤', 'نجم الأغاني', 'استمع إلى 50 أغنية كاملة', function (s) { return s.songsDone >= 50; }],
      ['argot30', '😎', 'ابن الشارع الفرنسي', 'تعلّم 30 جملة عامية', function (s) { return s.argot >= 30; }],
      ['quiz500', '🎮', 'بطل التحدّي', 'اجمع 500 نقطة في اختبر نفسك', function (s) { return s.quizPts >= 500; }],
      ['goal7', '🎯', 'محقق الأهداف', 'حقّق هدفك اليومي 7 مرات', function () { return goalDays() >= 7; }],
      ['mast10', '🧠', 'قاهر الأخطاء', 'أتقن 10 كلمات من دفتر أخطائك', function () { return P.mastered >= 10; }],
      ['zoza10', '🤖', 'صديق زوزا', 'اسأل زوزا 10 أسئلة', function (s) { return s.zozaAsked >= 10; }],
      ['lvl5', '👑', 'المستوى الخامس', 'اصعد إلى المستوى الخامس', function (s) { return levelOf(s.xp) >= 4; }]
    ];
    function checkBadges(s) {
      var got = false;
      BADGES.forEach(function (b) { if (!P.badges[b[0]] && b[4](s)) { P.badges[b[0]] = dkey(); got = true; toast('🏅 شارة جديدة: ' + b[1] + ' ' + b[2], 3800); } });
      return got;
    }

    /* ---------- واجهة ربط دفتر الأخطاء ---------- */
    var API = {
      mistake: function (w) {
        if (!w || !w.fr) return; var k = norm(w.fr), m = P.mistakes[k] || (P.mistakes[k] = { fr: w.fr, ar: w.ar || '', c: 0, n: 0, t: 0 });
        m.n++; m.c = 0; m.t = Date.now(); if (w.ar) m.ar = w.ar; save();
      },
      correct: function (w) {
        if (!w || !w.fr) return; var k = norm(w.fr), m = P.mistakes[k]; if (!m) return;
        m.c++; if (m.c >= 3) { delete P.mistakes[k]; P.mastered++; toast('🧠 أتقنت كلمة «' + w.fr + '» وخرجت من دفتر أخطائك'); } save();
      },
      touch: function () { lastAct = Date.now(); }
    };
    window.__bqProgress = API;

    /* ---------- تتبّع النشاط والوقت ---------- */
    var lastAct = Date.now(), lastRender = 0, dirty = false;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true, capture: true }); });
    window.addEventListener('scroll', function () { lastAct = Date.now(); }, { passive: true, capture: true });

    function tick() {
      var now = Date.now();
      if (!document.hidden && now - lastAct < 45000) { day().s += 5; dirty = true; }
      var st = readStats();
      if (P.snap && typeof P.snap.xp === 'number') { var dx = st.xp - P.snap.xp; if (dx > 0) { day().x += dx; dirty = true; } }
      if (!P.snap || P.snap.xp !== st.xp) { P.snap = { xp: st.xp }; dirty = true; }
      var sk = streak(); if (sk > P.bestStreak) { P.bestStreak = sk; dirty = true; }
      if (checkBadges(st)) dirty = true;
      if (dirty) { save(); dirty = false; }
      if (SEC.classList.contains('on') && !R && now - lastRender > 14000) render();
    }
    setInterval(tick, 5000);

    /* ---------- تنسيق ---------- */
    var st = document.createElement('style');
    st.textContent = '.pg{direction:rtl;color:#1b2a3a}.pg *{box-sizing:border-box}.pg button,.pg select{font-family:inherit}' +
      '.pg-hero{border-radius:24px;padding:16px;color:#fff;background:linear-gradient(135deg,#1e1b4b,#4338ca 45%,#db2777 85%,#f97316);box-shadow:0 10px 28px rgba(67,56,202,.4);margin-bottom:12px}' +
      '.pg-top{display:flex;align-items:center;gap:12px}.pg-ring{flex:none;width:92px;height:92px;position:relative}.pg-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.pg-ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.05rem;line-height:1.2}.pg-ring small{font-size:.62rem;opacity:.9;font-weight:600}' +
      '.pg-lv{flex:1;min-width:0}.pg-lv h3{margin:0;font-size:1.15rem}.pg-lv div{font-size:.8rem;opacity:.95;margin-top:2px}.pg-bar{height:10px;border-radius:8px;background:rgba(255,255,255,.25);overflow:hidden;margin:8px 0 2px}.pg-bar i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#fde047,#fb923c);transition:width .5s}' +
      '.pg-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pg-chips span{background:rgba(255,255,255,.2);border-radius:14px;padding:6px 12px;font-size:.85rem;font-weight:800}' +
      '.pg-card{background:#fff;border:1px solid #d6e2f0;border-radius:18px;padding:12px;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,0,0,.05)}.pg-card h4{margin:0 0 8px;font-size:1rem;color:#0055A5}' +
      '.pg-wk{display:flex;gap:6px;align-items:flex-end;height:110px;direction:ltr}.pg-wk div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:.65rem;color:#5d6b7a}.pg-wk i{display:block;width:70%;min-height:3px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#7c3aed,#0055A5)}.pg-wk i.t{background:linear-gradient(180deg,#fb923c,#f43f5e)}.pg-wk b{font-size:.68rem;color:#1b2a3a;margin-bottom:2px}' +
      '.pg-st{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.pg-st div{background:#f1f5f9;border-radius:14px;padding:8px 4px;text-align:center}.pg-st b{display:block;font-size:1.2rem;color:#0055A5}.pg-st small{font-size:.7rem;color:#5d6b7a}' +
      '.pg-bd{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.pg-b{border-radius:14px;padding:8px 4px;text-align:center;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b}.pg-b i{display:block;font-style:normal;font-size:1.7rem}.pg-b b{display:block;font-size:.72rem;color:#7c2d12;line-height:1.3}.pg-b small{font-size:.62rem;color:#92400e}.pg-b.lk{background:#f1f5f9;border-color:#e2e8f0}.pg-b.lk i{filter:grayscale(1);opacity:.45}.pg-b.lk b{color:#64748b}.pg-b.lk small{color:#94a3b8}' +
      '.pg-set{display:flex;align-items:center;gap:8px;font-size:.88rem}.pg-set select{border:2px solid #d6e2f0;border-radius:12px;padding:6px 10px;font-size:.95rem;background:#fff}' +
      '.pg-btn{border:0;border-radius:22px;padding:11px 20px;font-weight:900;color:#7c2d12;background:linear-gradient(135deg,#fde047,#fb923c);cursor:pointer;font-size:.95rem}.pg-btn.g{background:#e8eef6;color:#33475b}' +
      '.pg-mw{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px dashed #d6e2f0;padding:7px 0}.pg-mw:first-of-type{border-top:0}.pg-mw .t{flex:1;min-width:0}.pg-mw b{display:block;direction:ltr;text-align:left;color:#0055A5}.pg-mw span{font-size:.85rem;color:#5d6b7a}.pg-mw button{width:34px;height:34px;border:0;border-radius:50%;background:#eef2ff;cursor:pointer}' +
      '.pg-rv{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:14px;color:#fff;box-shadow:0 10px 28px rgba(49,46,129,.45)}.pg-rv .q{text-align:center;font-size:1.8rem;font-weight:900;direction:ltr;margin:10px 0 14px;word-break:break-word}.pg-ro{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pg-ro button{border:2px solid rgba(255,255,255,.3);border-radius:14px;padding:13px 6px;background:rgba(255,255,255,.13);color:#fff;font-weight:800;font-size:1rem;cursor:pointer}.pg-ro button.ok{background:#16a34a;border-color:#bbf7d0}.pg-ro button.no{background:#dc2626;border-color:#fecaca}' +
      '.pg-hd{display:flex;justify-content:space-between;font-weight:800;font-size:.88rem;margin-bottom:6px}.pg-empty{text-align:center;color:#5d6b7a;padding:10px;line-height:1.9;font-size:.9rem}';
    document.head.appendChild(st);

    /* ---------- العرض ---------- */
    var R = null, POOL = null;
    function wkChart() {
      var out = '', max = 5, i, d, k, m, arr = [];
      for (i = 6; i >= 0; i--) { d = new Date(); d.setDate(d.getDate() - i); k = dkey(d); m = Math.round(((P.days[k] && P.days[k].s) || 0) / 60); arr.push([d, m, i === 0]); if (m > max) max = m; }
      arr.forEach(function (a) {
        var lbl = ''; try { lbl = a[0].toLocaleDateString('ar-EG', { weekday: 'short' }); } catch (e) { lbl = ''; }
        out += '<div><b>' + (a[1] || '') + '</b><i class="' + (a[2] ? 't' : '') + '" style="height:' + Math.max(3, a[1] / max * 78) + 'px"></i><span>' + esc(lbl) + '</span></div>';
      });
      return out;
    }
    function render() {
      if (R) return; lastRender = Date.now();
      var s = readStats(), xp = s.xp, li = levelOf(xp), nx = LV[li + 1], base = LV[li], pct = nx ? Math.round((xp - base) * 100 / (nx - base)) : 100;
      var sk = streak(), d = day(), mins = Math.floor(d.s / 60), gp = Math.min(100, Math.round(d.s * 100 / (P.goal * 60))), circ = 2 * Math.PI * 40;
      var mk = Object.keys(P.mistakes), nb = Object.keys(P.badges).length;
      var h = '<div class="pg"><div class="pg-hero"><div class="pg-top"><div class="pg-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fde047" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + (circ * (1 - gp / 100)).toFixed(1) + '"/></svg><b>' + mins + '<small>من ' + P.goal + ' د</small></b></div>' +
        '<div class="pg-lv"><h3>' + LN[li] + '</h3><div>المستوى ' + (li + 1) + ' · ' + xp + ' نقطة خبرة</div><div class="pg-bar"><i style="width:' + pct + '%"></i></div><div style="font-size:.72rem">' + (nx ? 'باقي ' + (nx - xp) + ' نقطة للمستوى التالي' : '🏆 وصلت لأعلى مستوى!') + '</div></div></div>' +
        '<div class="pg-chips"><span>🔥 سلسلة ' + sk + ' يوم</span><span>🏅 ' + nb + ' / ' + BADGES.length + ' شارة</span><span>' + (gp >= 100 ? '✅ حقّقت هدف اليوم' : '🎯 هدف اليوم ' + gp + '%') + '</span></div></div>' +
        '<div class="pg-card"><h4>📅 نشاطك آخر 7 أيام (بالدقائق)</h4><div class="pg-wk">' + wkChart() + '</div></div>' +
        '<div class="pg-card"><h4>📊 إنجازاتك</h4><div class="pg-st"><div><b>' + s.known + '</b><small>كلمة محفوظة</small></div><div><b>' + s.songsDone + '</b><small>أغنية مكتملة</small></div><div><b>' + s.argot + '</b><small>جملة عامية</small></div><div><b>' + s.quizPts + '</b><small>نقاط التحدّي</small></div><div><b>' + P.bestStreak + '</b><small>أطول سلسلة</small></div><div><b>' + P.mastered + '</b><small>أخطاء أتقنتها</small></div></div></div>' +
        '<div class="pg-card"><h4>🧠 دفتر أخطائي <small style="color:#5d6b7a;font-weight:600">(' + mk.length + ' كلمة)</small></h4>';
      if (!mk.length) h += '<div class="pg-empty">لا توجد أخطاء مسجّلة 🎉<br>الكلمات التي تخطئ فيها في «اختبر نفسك» تظهر هنا لتراجعها.</div>';
      else {
        h += '<div style="text-align:center;margin-bottom:8px"><button type="button" class="pg-btn" data-pg="rev">🎯 راجع أخطائي الآن</button></div>';
        h += mk.sort(function (a, b) { return P.mistakes[b].t - P.mistakes[a].t; }).slice(0, 12).map(function (k) {
          var m = P.mistakes[k]; return '<div class="pg-mw"><div class="t"><b>' + esc(m.fr) + '</b><span>' + esc(m.ar) + ' · أخطأت ' + m.n + ' مرة · ' + m.c + '/3</span></div><button type="button" data-pg="say" data-k="' + esc(k) + '">🔊</button><button type="button" data-pg="del" data-k="' + esc(k) + '">✕</button></div>';
        }).join('');
        if (mk.length > 12) h += '<div class="pg-empty">…و' + (mk.length - 12) + ' كلمات أخرى</div>';
      }
      h += '</div><div class="pg-card"><h4>🏅 شاراتك</h4><div class="pg-bd">' + BADGES.map(function (b) {
        var on = !!P.badges[b[0]]; return '<div class="pg-b' + (on ? '' : ' lk') + '"><i>' + b[1] + '</i><b>' + esc(b[2]) + '</b><small>' + (on ? '✓ ' + esc(P.badges[b[0]]) : esc(b[3])) + '</small></div>';
      }).join('') + '</div></div>' +
        '<div class="pg-card"><h4>⚙️ هدفك اليومي</h4><div class="pg-set">أدرس <select data-pg="goal">' + [5, 10, 15, 20, 30].map(function (n) { return '<option value="' + n + '"' + (n === P.goal ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select> دقيقة يوميًا</div></div></div>';
      ROOT.innerHTML = h;
    }

    /* ---------- مراجعة الأخطاء ---------- */
    function cands(file) { var b = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, b + 'data/' + file, '/data/' + file]; return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now()).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    function loadPool() {
      if (POOL) return Promise.resolve(POOL);
      return getJson('words.json').then(function (d) {
        var o = []; if (d && d.categories) d.categories.forEach(function (c) { (c.words || []).forEach(function (w) { if (w[1]) o.push(w[1]); }); });
        POOL = o.length >= 8 ? o : ['الكتاب', 'القلم', 'المنزل', 'الماء', 'الخبز', 'المدرسة', 'الصديق', 'الشمس', 'القمر', 'السيارة']; return POOL;
      }).catch(function () { POOL = ['الكتاب', 'القلم', 'المنزل', 'الماء', 'الخبز', 'المدرسة', 'الصديق', 'الشمس']; return POOL; });
    }
    function mkOpts(m, all) {
      var others = shuffle(all.filter(function (a) { return a && a !== m.ar; })).slice(0, 3); return shuffle([m.ar].concat(others));
    }
    function startReview() {
      var keys = shuffle(Object.keys(P.mistakes)).slice(0, 10); if (!keys.length) return;
      loadPool().then(function (pool) {
        var ars = Object.keys(P.mistakes).map(function (k) { return P.mistakes[k].ar; }).concat(pool);
        R = { q: keys.map(function (k) { var m = P.mistakes[k]; return { k: k, m: m, o: mkOpts(m, ars) }; }), i: 0, ok: 0, lock: false };
        showQ();
      });
    }
    function showQ() {
      if (!R) return;
      if (R.i >= R.q.length) {
        ROOT.innerHTML = '<div class="pg"><div class="pg-rv" style="text-align:center"><div style="font-size:2.4rem">' + (R.ok >= R.q.length * 0.8 ? '🏆' : '💪') + '</div><h3 style="margin:4px 0">انتهت المراجعة</h3><p>✅ ' + R.ok + ' / ' + R.q.length + ' إجابة صحيحة</p><p style="font-size:.85rem;opacity:.9">أجب صوابًا 3 مرات متتالية على كلمة لتخرج من دفتر أخطائك.</p><button type="button" class="pg-btn" data-pg="rexit">العودة لرحلتي</button></div></div>'; return;
      }
      var q = R.q[R.i];
      ROOT.innerHTML = '<div class="pg"><div class="pg-rv"><div class="pg-hd"><span>' + (R.i + 1) + ' / ' + R.q.length + '</span><span>✅ ' + R.ok + '</span></div><div style="text-align:center;font-size:.8rem;opacity:.9">ما معنى هذه الكلمة؟</div><div class="q">' + esc(q.m.fr) + '</div><div style="text-align:center;margin-bottom:10px"><button type="button" class="pg-btn g" data-pg="rsay">🔊 اسمع</button></div><div class="pg-ro">' +
        q.o.map(function (o, i) { return '<button type="button" data-pg="opt" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div><div style="text-align:center;margin-top:10px"><button type="button" class="pg-btn g" data-pg="rexit" style="font-size:.8rem;padding:6px 14px">خروج</button></div></div></div>';
      setTimeout(function () { if (R) say(q.m.fr); }, 250);
    }
    function answer(i) {
      if (!R || R.lock) return; R.lock = true; var q = R.q[R.i], ok = q.o[i] === q.m.ar, btns = ROOT.querySelectorAll('[data-pg="opt"]');
      [].forEach.call(btns, function (b, k) { if (q.o[k] === q.m.ar) b.className = 'ok'; else if (k === i) b.className = 'no'; b.disabled = true; });
      if (ok) { R.ok++; API.correct(q.m); } else API.mistake(q.m);
      setTimeout(function () { if (R) { R.i++; R.lock = false; showQ(); } }, ok ? 800 : 1700);
    }

    ROOT.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pg]'); if (!b) return; var a = b.getAttribute('data-pg'), k = b.getAttribute('data-k');
      if (a === 'rev') startReview();
      else if (a === 'rexit') { R = null; render(); }
      else if (a === 'opt') answer(+b.getAttribute('data-i'));
      else if (a === 'rsay' && R) say(R.q[R.i].m.fr);
      else if (a === 'say' && P.mistakes[k]) say(P.mistakes[k].fr);
      else if (a === 'del' && P.mistakes[k]) { delete P.mistakes[k]; save(); render(); }
    });
    ROOT.addEventListener('change', function (e) { var s = e.target; if (s.getAttribute && s.getAttribute('data-pg') === 'goal') { P.goal = +s.value || 10; save(); render(); } });
    new MutationObserver(function () { if (SEC.classList.contains('on') && !R) { lastAct = Date.now(); render(); } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });

    tick(); render();
  }
})();
