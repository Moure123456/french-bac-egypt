/* ===== bac.js — قسم «منهج الثانوية» التفاعلي (1ère / 2ème / 3ème Sec) =====
   يقرأ data/bac_1sec.json و data/bac_2sec.json و data/bac_3sec.json
   ويعرض: الوحدات ← (مفردات، قواعد، Document 1، Document 2، تدريبات) + 5 امتحانات لكل صف.
   لا يغيّر أي ملف آخر؛ يعمل فقط داخل #bac-content-container. النطق عبر زر .spk الموجود في app.js */
(function () {
  'use strict';
  try { boot(); } catch (e) { try { console.error('[bac]', e); } catch (_) {} }

  function boot() {
    var SEC = document.getElementById('bac');
    var ROOT = document.getElementById('bac-content-container');
    if (!SEC || !ROOT) return;

    var YEARS = [
      { id: '1sec', fr: '1ère Sec', ar: 'الصف الأول الثانوي', color: '#0055A5', file: 'bac_1sec.json' },
      { id: '2sec', fr: '2ème Sec', ar: 'الصف الثاني الثانوي', color: '#7b3fe4', file: 'bac_2sec.json' },
      { id: '3sec', fr: '3ème Sec', ar: 'الصف الثالث الثانوي', color: '#d6336c', file: 'bac_3sec.json' }
    ];
    var D = {}, started = false, QREG = {};
    var S = { view: 'home', year: null, tab: 'units', unit: null, part: 'vocab', exam: null, teacher: false, showAr: {} };
    var EX = null, timer = null;

    /* ---------- أدوات ---------- */
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(s) {
      return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9\u0600-\u06FF' ]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function store(k, v) {
      try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
      return null;
    }
    function fmt(sec) { sec = Math.max(0, sec | 0); var m = Math.floor(sec / 60), r = sec % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
    function spk(t) {
      var c = String(t || '').replace(/\s+/g, ' ').trim();
      if (!c) return '';
      return '<button class="spk" type="button" data-lang="fr-FR" data-say="' + esc(encodeURIComponent(c)) + '" aria-label="استمع بالفرنسية">🔊</button>';
    }
    function paras(t) { return String(t || '').split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }
    function isTeacher() { try { return localStorage.getItem('section_unlocked_bac') === 'true'; } catch (e) { return false; } }
    function yearOf(id) { return YEARS.filter(function (y) { return y.id === id; })[0]; }
    function toast(m) { var t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2200); }

    /* ---------- التحميل (مسارات بديلة + تشخيص دقيق لسبب الفشل) ---------- */
    function candidates(file) {
      var parts = location.pathname.split('/').filter(Boolean);
      var base = location.pathname.replace(/[^/]*$/, '');
      var list = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file, '../data/' + file, './' + file, base + file];
      var host = location.hostname;
      if (/\.github\.io$/.test(host)) {
        var user = host.split('.')[0];
        var repo = (parts.length && !/\.html?$/i.test(parts[0])) ? parts[0] : (user + '.github.io');
        list.push('https://cdn.jsdelivr.net/gh/' + user + '/' + repo + '@main/data/' + file);
        list.push('https://raw.githubusercontent.com/' + user + '/' + repo + '/main/data/' + file);
      }
      var seen = {};
      return list.filter(function (c) { if (seen[c]) return false; seen[c] = 1; return true; });
    }
    function loadYear(y) {
      if (D[y.id] && !D[y.id]._missing) return Promise.resolve(D[y.id]);
      var c = candidates(y.file), i = 0, log = [];
      function next() {
        if (i >= c.length) return Promise.resolve(null);
        var url = c[i++];
        return fetch(url + (url.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now(), { cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) { log.push(url + ' → HTTP ' + r.status); return next(); }
            return r.text().then(function (t) {
              var obj;
              try { obj = JSON.parse(t.replace(/^\uFEFF/, '')); }
              catch (e) { log.push(url + ' → ملف JSON تالف أو ناقص (' + e.message + ') — أعد نسخ الملف كاملًا'); return next(); }
              if (!obj || !Array.isArray(obj.units)) { log.push(url + ' → بنية الملف غير صحيحة (لا يوجد units)'); return next(); }
              return obj;
            });
          })
          .catch(function (e) { log.push(url + ' → ' + (e && e.message ? e.message : 'خطأ شبكة')); return next(); });
      }
      return next().then(function (d) {
        D[y.id] = d || { units: [], exams: [], _missing: true, _log: log };
        return D[y.id];
      });
    }

    /* ---------- التقدم ---------- */
    function unitDone(yid, uid) { return Object.keys(store('bq_u_' + yid + '_' + uid) || {}).length; }
    function unitTotal(u) {
      var n = 0;
      (u.lessons || []).forEach(function (l) {
        (l.documents || []).forEach(function (d) { n += (d.questions || []).filter(gradable).length; });
        n += (l.exercises || []).filter(gradable).length;
      });
      return n;
    }
    function gradable(q) { return q.type !== 'open'; }
    function bestExam(yid, eid) { return store('bq_x_' + yid + '_' + eid); }
    function markDone(key) {
      var p = key.split('|'); var k = 'bq_u_' + p[0] + '_' + p[1];
      var o = store(k) || {}; o[key] = 1; store(k, o);
    }

    /* ---------- الأسئلة ---------- */
    function ansText(q) { return Array.isArray(q.answer) ? q.answer[0] : q.answer; }
    function keyHTML(q) {
      return '<div class="bq-key">✔ الإجابة: <b dir="ltr">' + esc(ansText(q)) + '</b>' + (q.explain_ar ? '<br>' + esc(q.explain_ar) : '') + '</div>';
    }
    function qHTML(q, key, n, examMode) {
      QREG[key] = q;
      var h = '<div class="bq-q" data-key="' + esc(key) + '"><div class="bq-qt"><span class="bq-n">' + n + '</span><span class="bq-fr" dir="ltr">' + esc(q.q) + '</span>' + (examMode ? '' : spk(q.q.replace(/_+/g, ' ... '))) + '</div>';
      if (q.type === 'choice') {
        h += '<div class="bq-opts">' + (q.options || []).map(function (o, i) {
          return '<button type="button" class="bq-opt" data-act="opt" data-i="' + i + '" dir="ltr">' + esc(o) + '</button>';
        }).join('') + '</div>';
      } else if (q.type === 'open') {
        h += '<textarea class="bq-ta" rows="3" placeholder="اكتب إجابتك هنا…" dir="ltr"></textarea>' +
          (examMode ? '' : '<button type="button" class="bq-btn sm" data-act="model">عرض الإجابة النموذجية</button>');
      } else {
        h += '<div class="bq-row"><input class="bq-in" type="text" dir="ltr" autocomplete="off" placeholder="اكتب الإجابة…">' +
          (examMode ? '' : '<button type="button" class="bq-btn sm" data-act="check">تحقق</button>') + '</div>';
      }
      h += '<div class="bq-fb"></div>';
      if (!examMode && S.teacher) h += keyHTML(q);
      return h + '</div>';
    }
    function isRight(q, val) {
      if (q.type === 'choice') return norm(val) === norm(q.answer);
      var list = Array.isArray(q.answer) ? q.answer : [q.answer];
      return list.some(function (a) { return norm(a) === norm(val); });
    }
    function fb(card, ok, q) {
      var f = card.querySelector('.bq-fb');
      f.className = 'bq-fb ' + (ok ? 'ok' : 'no');
      f.innerHTML = (ok ? '🎉 إجابة صحيحة!' : '❌ إجابة غير صحيحة. الصواب: <b dir="ltr">' + esc(ansText(q)) + '</b>') + (q.explain_ar ? '<div class="bq-ex">💡 ' + esc(q.explain_ar) + '</div>' : '');
    }
    function lockCard(card) { card.classList.add('done'); card.querySelectorAll('button.bq-opt,.bq-in').forEach(function (e) { e.disabled = true; }); }
    function onOpt(btn) {
      var card = btn.closest('.bq-q'), key = card.dataset.key, q = QREG[key];
      if (!q || card.classList.contains('done')) return;
      var ok = norm(q.options[+btn.dataset.i]) === norm(q.answer);
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) card.querySelectorAll('.bq-opt').forEach(function (b) { if (norm(b.textContent) === norm(q.answer)) b.classList.add('right'); });
      lockCard(card); fb(card, ok, q); if (ok) { markDone(key); refreshBar(); }
    }
    function onCheck(btn) {
      var card = btn.closest('.bq-q'), key = card.dataset.key, q = QREG[key], inp = card.querySelector('.bq-in');
      if (!q || card.classList.contains('done') || !inp.value.trim()) { if (inp) inp.focus(); return; }
      var ok = isRight(q, inp.value);
      inp.classList.add(ok ? 'right' : 'wrong'); lockCard(card); fb(card, ok, q);
      if (ok) { markDone(key); refreshBar(); }
    }
    function refreshBar() {
      var b = ROOT.querySelector('.bq-bar'); if (!b || S.view !== 'unit') return;
      var u = curUnit(); if (!u) return;
      var t = unitTotal(u), d = unitDone(S.year, u.id), pct = t ? Math.round(d * 100 / t) : 0;
      b.querySelector('i').style.width = pct + '%'; b.querySelector('span').textContent = d + ' / ' + t + ' (' + pct + '%)';
    }
    function curUnit() { var d = D[S.year]; return d && (d.units || []).filter(function (u) { return u.id === S.unit; })[0]; }

    /* ---------- الشاشات ---------- */
    var INTRO = '<div class="bq-intro"><h3>🇫🇷 منهج اللغة الفرنسية للثانوية العامة في مصر</h3>' +
      '<p>يعتمد المنهج على كتاب <b>Club @dos plus</b> ويتدرّج عبر ثلاث سنوات: <b>1ère Sec</b> لتأسيس اللغة (التعريف بالنفس، الأسرة، المدرسة)، ثم <b>2ème Sec</b> لتوسيع المفردات والأزمنة (الرياضة، الطعام، السفر)، ثم <b>3ème Sec</b> للتمكّن والتدريب على نظام الامتحان الوزاري (القطع، القواعد، التعبير الكتابي).</p>' +
      '<ul><li>📖 في كل وحدة: مفردات، قواعد، <b>قطعتا فهم (Documents)</b> مع تصحيح فوري، وتدريبات محلولة.</li>' +
      '<li>📝 في كل صف: <b>5 امتحانات</b> بنظام الأسئلة الوزارية بمؤقّت وتصحيح تلقائي وتقرير بالأخطاء.</li>' +
      '<li>🔊 اضغط على أي زر صوت لسماع النطق الفرنسي.</li></ul>' +
      '<p class="bq-note">النصوص والتدريبات هنا مُعدّة على غرار أسلوب الكتاب، وليست نسخًا حرفية منه.</p></div>';

    function homeHTML() {
      var h = INTRO + '<div class="bq-years">';
      YEARS.forEach(function (y) {
        var d = D[y.id], nu = d && d.units ? d.units.length : 4;
        h += '<button type="button" class="bq-year" data-act="year" data-y="' + y.id + '" style="--c:' + y.color + '"><b>' + y.fr + '</b><span>' + y.ar + '</span><small>' + nu + ' وحدات • 5 امتحانات</small></button>';
      });
      return h + '</div>';
    }
    function topBar(title, backAct, extra) {
      return '<div class="bq-top"><button type="button" class="bq-back" data-act="' + backAct + '">→ رجوع</button><h4>' + title + '</h4>' + (extra || '') + '</div>';
    }
    function teacherBtn() {
      return isTeacher() ? '<button type="button" class="bq-btn sm' + (S.teacher ? ' on' : '') + '" data-act="teacher">👨‍🏫 وضع المعلم: ' + (S.teacher ? 'إيقاف' : 'تشغيل') + '</button>' : '';
    }
    function yearHTML() {
      var y = yearOf(S.year), d = D[S.year] || {}, h = topBar(y.fr + ' — ' + y.ar, 'back-home');
      h += '<div class="bq-tabs"><button type="button" data-act="tab" data-t="units" class="' + (S.tab === 'units' ? 'on' : '') + '">📚 الوحدات</button><button type="button" data-act="tab" data-t="exams" class="' + (S.tab === 'exams' ? 'on' : '') + '">📝 الامتحانات (5)</button></div>';
      if (d._missing) h += '<div class="bq-warn">تعذّر تحميل ملف data/' + esc(y.file) + '<br><small>تأكد أن الملف مرفوع باسمه الصحيح داخل مجلد data في المستودع، وأنه ملصوق كاملًا.</small><br><button type="button" class="bq-btn sm" data-act="retry-year">🔄 إعادة المحاولة</button>' +
          '<details style="margin-top:8px;text-align:left" dir="ltr"><summary>تفاصيل الخطأ</summary><div style="font-size:.72rem;word-break:break-all;line-height:1.6">' + (d._log || []).map(esc).join('<br>') + '</div></details></div>';
      if (S.tab === 'units') {
        var us = d.units || []; for (var i = us.length; i < 4; i++) us = us.concat([{ id: 'x' + i, title_fr: 'Unité ' + (i + 1), soon: true }]);
        h += '<div class="bq-grid">' + us.map(function (u) {
          if (u.soon || !(u.lessons || []).length) return '<div class="bq-card soon"><b>' + esc(u.title_fr) + '</b><span>' + esc(u.title_ar || '') + '</span><em>⏳ قيد الإعداد</em></div>';
          var t = unitTotal(u), dn = unitDone(S.year, u.id), pct = t ? Math.round(dn * 100 / t) : 0;
          return '<button type="button" class="bq-card" data-act="unit" data-u="' + esc(u.id) + '" style="--c:' + y.color + '"><b dir="ltr">' + esc(u.title_fr) + '</b><span>' + esc(u.title_ar || '') + '</span><div class="bq-mini"><i style="width:' + pct + '%"></i></div><small>' + dn + ' / ' + t + ' تمرين صحيح</small></button>';
        }).join('') + '</div>';
      } else {
        var es = d.exams || []; for (var j = es.length; j < 5; j++) es = es.concat([{ id: 'x' + j, title_ar: 'امتحان ' + (j + 1), soon: true }]);
        h += '<div class="bq-grid">' + es.map(function (e, k) {
          if (e.soon) return '<div class="bq-card soon"><b>Examen ' + (k + 1) + '</b><span>' + esc(e.title_ar) + '</span><em>⏳ قيد الإعداد</em></div>';
          var b = bestExam(S.year, e.id);
          return '<button type="button" class="bq-card" data-act="exam" data-e="' + esc(e.id) + '" style="--c:' + y.color + '"><b>Examen ' + (k + 1) + '</b><span>' + esc(e.title_ar) + '</span><small>⏱ ' + (e.duration_min || 30) + ' د • ' + (e.questions || []).length + ' سؤال' + (b ? ' • أفضل نتيجة: ' + b.pct + '%' : '') + '</small></button>';
        }).join('') + '</div>';
      }
      return h;
    }
    var PARTS = [['vocab', '🔤 المفردات'], ['grammar', '✍️ القواعد'], ['doc0', '📄 Document 1'], ['doc1', '📄 Document 2'], ['ex', '🧩 التدريبات']];
    function unitHTML() {
      var u = curUnit(), l = (u.lessons || [])[0] || {}, y = yearOf(S.year);
      var t = unitTotal(u), dn = unitDone(S.year, u.id), pct = t ? Math.round(dn * 100 / t) : 0;
      var h = topBar('<span dir="ltr">' + esc(u.title_fr) + '</span>', 'back-year', teacherBtn());
      h += '<div class="bq-bar"><div><i style="width:' + pct + '%;background:' + y.color + '"></i></div><span>' + dn + ' / ' + t + ' (' + pct + '%)</span></div>';
      h += '<div class="bq-tabs sm">' + PARTS.map(function (p) { return '<button type="button" data-act="part" data-p="' + p[0] + '" class="' + (S.part === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>';
      var key = S.year + '|' + u.id + '|';
      if (S.part === 'vocab') {
        h += '<div class="bq-words">' + (l.vocab || []).map(function (w) {
          return '<div class="bq-word"><div dir="ltr"><b>' + esc(w.fr) + '</b> ' + spk(w.fr) + '</div><span>' + esc(w.ar) + '</span>' + (w.ex ? '<small dir="ltr">' + esc(w.ex) + '</small>' : '') + '</div>';
        }).join('') + '</div>';
      } else if (S.part === 'grammar') {
        h += (l.grammar || []).map(function (g) {
          return '<div class="bq-gram"><h5 dir="ltr">' + esc(g.title_fr) + ' <small>' + esc(g.title_ar || '') + '</small></h5><p>' + esc(g.explanation_ar) + '</p>' +
            '<ul dir="ltr">' + (g.examples || []).map(function (e) { return '<li>' + esc(e) + ' ' + spk(e) + '</li>'; }).join('') + '</ul></div>';
        }).join('') || '<div class="bq-warn">لا توجد قواعد بعد.</div>';
      } else if (S.part === 'doc0' || S.part === 'doc1') {
        var di = S.part === 'doc1' ? 1 : 0, doc = (l.documents || [])[di];
        if (!doc) h += '<div class="bq-warn">لم يُضف هذا الـ Document بعد.</div>';
        else {
          var sk = S.year + u.id + di;
          h += '<div class="bq-doc"><h5 dir="ltr">' + esc(doc.title_fr) + ' ' + spk(doc.text_fr.replace(/\n/g, ' ')) + '</h5><div class="bq-fr" dir="ltr">' + paras(doc.text_fr) + '</div>' +
            '<button type="button" class="bq-btn sm" data-act="ar" data-k="' + sk + '">' + (S.showAr[sk] ? 'إخفاء الترجمة' : 'إظهار الترجمة العربية') + '</button>' +
            (S.showAr[sk] ? '<div class="bq-ar">' + paras(doc.text_ar) + '</div>' : '') + '</div>' +
            '<h5 class="bq-sub">أسئلة الفهم (Compréhension)</h5>' + (doc.questions || []).map(function (q, i) { return qHTML(q, key + 'd' + di + 'q' + i, i + 1); }).join('');
        }
      } else {
        h += '<h5 class="bq-sub">حلول تدريبات الكتاب (تفاعلية)</h5>' + (l.exercises || []).map(function (q, i) { return qHTML(q, key + 'x' + i, i + 1); }).join('');
      }
      return h;
    }

    /* ---------- الامتحانات ---------- */
    function curExam() { var d = D[S.year]; return d && (d.exams || []).filter(function (e) { return e.id === S.exam; })[0]; }
    function examHTML() {
      var e = curExam(), y = yearOf(S.year);
      var h = topBar(esc(e.title_ar), 'back-exams') + '<div class="bq-timer"><span id="bq-clock">⏱ ' + fmt(EX.left) + '</span><button type="button" class="bq-btn" data-act="finish">إنهاء وتصحيح</button></div>';
      if (e.passage_fr) h += '<div class="bq-doc"><h5 dir="ltr">' + esc(e.passage_title || 'Texte') + ' ' + spk(e.passage_fr.replace(/\n/g, ' ')) + '</h5><div class="bq-fr" dir="ltr">' + paras(e.passage_fr) + '</div></div>';
      h += (e.questions || []).map(function (q, i) { return (q.section && (i === 0 || e.questions[i - 1].section !== q.section) ? '<h5 class="bq-sub">' + esc(q.section) + '</h5>' : '') + qHTML(q, 'ex|' + e.id + '|' + i, i + 1, true); }).join('');
      return h + '<button type="button" class="bq-btn big" data-act="finish" style="background:' + y.color + '">إنهاء وتصحيح الامتحان</button>';
    }
    function startExam(id) {
      S.exam = id; S.view = 'exam'; var e = curExam(); if (!e) return;
      EX = { left: (e.duration_min || 30) * 60, ans: {} };
      clearInterval(timer);
      timer = setInterval(function () {
        EX.left--; var c = document.getElementById('bq-clock'); if (c) c.textContent = '⏱ ' + fmt(EX.left);
        if (EX.left <= 0) finishExam(true);
      }, 1000);
      render();
    }
    function readAnswer(card, q) {
      if (q.type === 'choice') { var s = card.querySelector('.bq-opt.sel'); return s ? s.textContent : ''; }
      if (q.type === 'open') return (card.querySelector('.bq-ta') || {}).value || '';
      return (card.querySelector('.bq-in') || {}).value || '';
    }
    function finishExam(timeout) {
      clearInterval(timer);
      var e = curExam(), cards = ROOT.querySelectorAll('.bq-q'), got = 0, tot = 0, rep = [];
      (e.questions || []).forEach(function (q, i) {
        var val = readAnswer(cards[i], q), m = q.marks || 2;
        if (q.type === 'open') { rep.push({ q: q, i: i, val: val, open: true }); return; }
        tot += m; var ok = val && isRight(q, val); if (ok) got += m;
        rep.push({ q: q, i: i, val: val, ok: !!ok, m: m });
      });
      var pct = tot ? Math.round(got * 100 / tot) : 0;
      var prev = bestExam(S.year, e.id); if (!prev || pct > prev.pct) store('bq_x_' + S.year + '_' + e.id, { pct: pct, got: got, tot: tot });
      var label = pct >= 85 ? '🏆 ممتاز' : pct >= 65 ? '👏 جيد جدًا' : pct >= 50 ? '🙂 مقبول — راجع أخطاءك' : '📚 تحتاج إلى مراجعة';
      var wrong = rep.filter(function (r) { return !r.ok && !r.open; }), open = rep.filter(function (r) { return r.open; });
      var h = topBar('نتيجة ' + esc(e.title_ar), 'back-exams') + '<div class="bq-result"><div class="bq-score">' + got + ' / ' + tot + '</div><div>' + pct + '% — ' + label + (timeout ? '<br><small>انتهى الوقت</small>' : '') + '</div></div>';
      h += '<h5 class="bq-sub">تقرير الأخطاء (' + wrong.length + ')</h5>' + (wrong.length ? wrong.map(function (r) {
        return '<div class="bq-q done"><div class="bq-qt"><span class="bq-n">' + (r.i + 1) + '</span><span class="bq-fr" dir="ltr">' + esc(r.q.q) + '</span></div><div class="bq-fb no">إجابتك: <b dir="ltr">' + esc(r.val || '— لم تجب —') + '</b><br>الصواب: <b dir="ltr">' + esc(ansText(r.q)) + '</b>' + (r.q.explain_ar ? '<div class="bq-ex">💡 ' + esc(r.q.explain_ar) + '</div>' : '') + '</div></div>';
      }).join('') : '<div class="bq-fb ok">🎉 لا توجد أخطاء!</div>');
      if (open.length) h += '<h5 class="bq-sub">التعبير الكتابي (قارن بالنموذج)</h5>' + open.map(function (r) {
        return '<div class="bq-q done"><div class="bq-qt"><span class="bq-fr" dir="ltr">' + esc(r.q.q) + '</span></div><div class="bq-fb ok"><b>إجابتك:</b> <span dir="ltr">' + esc(r.val || '—') + '</span><div class="bq-ex" dir="ltr">✔ Modèle : ' + esc(ansText(r.q)) + '</div></div></div>';
      }).join('');
      h += '<button type="button" class="bq-btn big" data-act="retry">🔁 إعادة الامتحان</button>';
      ROOT.innerHTML = '<div class="bq">' + h + '</div>'; window.scrollTo(0, 0);
    }

    /* ---------- العرض ---------- */
    function render() {
      QREG = {};
      var h = S.view === 'home' ? homeHTML() : S.view === 'year' ? yearHTML() : S.view === 'unit' ? unitHTML() : examHTML();
      ROOT.innerHTML = '<div class="bq">' + h + '</div>';
      if (S.view !== 'exam') clearInterval(timer);
    }
    function go(view, extra) { for (var k in extra) S[k] = extra[k]; S.view = view; render(); window.scrollTo(0, 0); }

    /* ---------- النقرات ---------- */
    ROOT.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act]'); if (!t) return;
      var a = t.dataset.act;
      if (a === 'year') { var y = yearOf(t.dataset.y); ROOT.innerHTML = '<div class="bq"><div class="bq-warn">جارٍ التحميل…</div></div>'; loadYear(y).then(function () { go('year', { year: y.id, tab: 'units' }); }); }
      else if (a === 'retry-year') { var yy = yearOf(S.year); delete D[yy.id]; ROOT.innerHTML = '<div class="bq"><div class="bq-warn">جارٍ إعادة المحاولة…</div></div>'; loadYear(yy).then(function () { go('year', {}); }); }
      else if (a === 'back-home') go('home', {});
      else if (a === 'back-year') go('year', {});
      else if (a === 'tab') go('year', { tab: t.dataset.t });
      else if (a === 'unit') go('unit', { unit: t.dataset.u, part: 'vocab' });
      else if (a === 'part') go('unit', { part: t.dataset.p });
      else if (a === 'back-exams') go('year', { tab: 'exams' });
      else if (a === 'exam') startExam(t.dataset.e);
      else if (a === 'retry') startExam(S.exam);
      else if (a === 'finish') { if (confirm('هل تريد إنهاء الامتحان وعرض النتيجة؟')) finishExam(false); }
      else if (a === 'ar') { S.showAr[t.dataset.k] = !S.showAr[t.dataset.k]; var sy = window.scrollY; render(); window.scrollTo(0, sy); }
      else if (a === 'teacher') { S.teacher = !S.teacher; var sy2 = window.scrollY; render(); window.scrollTo(0, sy2); }
      else if (a === 'opt') { if (S.view === 'exam') { var c = t.closest('.bq-q'); c.querySelectorAll('.bq-opt').forEach(function (b) { b.classList.remove('sel'); }); t.classList.add('sel'); } else onOpt(t); }
      else if (a === 'check') onCheck(t);
      else if (a === 'model') { var card = t.closest('.bq-q'), q = QREG[card.dataset.key]; var f = card.querySelector('.bq-fb'); f.className = 'bq-fb ok'; f.innerHTML = '<span dir="ltr">✔ Modèle : ' + esc(ansText(q)) + '</span>' + (q.explain_ar ? '<div class="bq-ex">💡 ' + esc(q.explain_ar) + '</div>' : ''); }
    });
    ROOT.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.classList.contains('bq-in') && S.view !== 'exam') { var b = ev.target.closest('.bq-q').querySelector('[data-act="check"]'); if (b) onCheck(b); }
    });

    /* ---------- التركيب ---------- */
    function css() {
      if (document.getElementById('bq-css')) return;
      var s = document.createElement('style'); s.id = 'bq-css';
      s.textContent = '.bq{padding:4px 2px;color:#1b2a3a}.bq h3,.bq h4,.bq h5{margin:0}' +
        '.bq-intro{background:linear-gradient(135deg,#eaf2fc,#fff);border:1px solid #cfe0f5;border-right:5px solid #0055A5;border-radius:14px;padding:14px;margin-bottom:14px;line-height:1.9;font-size:.92rem}.bq-intro h3{color:#0055A5;font-size:1.05rem;margin-bottom:6px}.bq-intro ul{padding-inline-start:18px;margin:6px 0}.bq-note{color:#6b7a89;font-size:.8rem}' +
        '.bq-years{display:grid;gap:10px}.bq-year{border:0;border-radius:16px;padding:16px;color:#fff;background:linear-gradient(135deg,var(--c),#0a2a55);text-align:right;cursor:pointer;display:flex;flex-direction:column;gap:2px;box-shadow:0 4px 12px rgba(0,0,0,.18);font-family:inherit}.bq-year b{font-size:1.25rem}.bq-year span{font-size:.95rem}.bq-year small{opacity:.85}.bq-year:active{transform:scale(.98)}' +
        '.bq-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}.bq-top h4{flex:1;color:#0055A5;font-size:1rem}.bq-back{border:0;background:#e8eef6;border-radius:10px;padding:8px 12px;cursor:pointer;font-family:inherit;font-weight:700}' +
        '.bq-tabs{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto}.bq-tabs button{flex:1;white-space:nowrap;border:0;border-radius:10px;padding:10px 12px;background:#e8eef6;font-family:inherit;font-weight:700;cursor:pointer;color:#33475b}.bq-tabs.sm button{flex:none;font-size:.82rem;padding:8px 10px}.bq-tabs button.on{background:#0055A5;color:#fff}' +
        '.bq-grid{display:grid;gap:10px}.bq-card{display:flex;flex-direction:column;gap:4px;text-align:right;background:#fff;border:1px solid #d6e2f0;border-right:5px solid var(--c,#9aa);border-radius:14px;padding:14px;cursor:pointer;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.05)}.bq-card b{color:#0055A5;font-size:1rem;text-align:left}.bq-card span{color:#5d6b7a;font-size:.85rem}.bq-card small{color:#5d6b7a}.bq-card.soon{opacity:.6;border-right-color:#b8c2cc;cursor:default}.bq-card em{font-style:normal;color:#8a6d00;font-size:.85rem}.bq-mini{height:6px;background:#e8eef6;border-radius:4px;overflow:hidden}.bq-mini i{display:block;height:100%;background:#2dd36f}' +
        '.bq-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.8rem;color:#5d6b7a}.bq-bar div{flex:1;height:8px;background:#e8eef6;border-radius:5px;overflow:hidden}.bq-bar i{display:block;height:100%}' +
        '.bq-words{display:grid;gap:8px}.bq-word{background:#fff;border:1px solid #d6e2f0;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}.bq-word b{color:#0055A5}.bq-word small{color:#6b7a89}' +
        '.bq-gram,.bq-doc{background:#fff;border:1px solid #d6e2f0;border-radius:14px;padding:14px;margin-bottom:12px;line-height:1.9}.bq-gram h5,.bq-doc h5{color:#0055A5;margin-bottom:6px}.bq-gram small{color:#5d6b7a;font-weight:400}.bq-gram ul{padding-inline-start:18px}.bq-fr{text-align:left}.bq-fr p{margin:4px 0}.bq-ar{background:#f5f9ff;border-radius:10px;padding:8px 12px;margin-top:8px}.bq-ar p{margin:4px 0}' +
        '.bq-sub{color:#0055A5;margin:14px 0 8px;border-bottom:2px solid #d6e2f0;padding-bottom:4px}' +
        '.bq-q{background:#fff;border:1px solid #d6e2f0;border-radius:14px;padding:12px;margin-bottom:10px}.bq-qt{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-weight:600}.bq-n{background:#0055A5;color:#fff;border-radius:50%;min-width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:.8rem}' +
        '.bq-opts{display:grid;gap:6px}.bq-opt{border:2px solid #d6e2f0;background:#f8fbff;border-radius:10px;padding:10px;text-align:left;font-family:inherit;font-size:.95rem;cursor:pointer}.bq-opt.sel{border-color:#0055A5;background:#e3efff}.bq-opt.right{border-color:#1e9e5a;background:#e4f7ec}.bq-opt.wrong{border-color:#dc3545;background:#fdeaec}' +
        '.bq-row{display:flex;gap:6px}.bq-in,.bq-ta{flex:1;width:100%;box-sizing:border-box;border:2px solid #d6e2f0;border-radius:10px;padding:10px;font-family:inherit;font-size:.95rem}.bq-in.right{border-color:#1e9e5a}.bq-in.wrong{border-color:#dc3545}' +
        '.bq-btn{border:0;border-radius:10px;padding:10px 14px;background:#0055A5;color:#fff;font-family:inherit;font-weight:700;cursor:pointer}.bq-btn.sm{padding:7px 12px;font-size:.82rem;margin-top:6px}.bq-btn.on{background:#1e9e5a}.bq-btn.big{width:100%;margin-top:10px;padding:14px;font-size:1rem}' +
        '.bq-fb{margin-top:8px;border-radius:10px;font-size:.88rem;line-height:1.7}.bq-fb.ok{background:#e4f7ec;padding:8px 10px}.bq-fb.no{background:#fdeaec;padding:8px 10px}.bq-ex{margin-top:4px;color:#33475b}.bq-key{margin-top:8px;background:#fff8e1;border:1px dashed #e0b400;border-radius:10px;padding:8px 10px;font-size:.85rem}' +
        '.bq-timer{display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5;background:#fff;border:1px solid #d6e2f0;border-radius:12px;padding:8px 12px;margin-bottom:10px}#bq-clock{font-weight:800;color:#dc3545;font-size:1.1rem}' +
        '.bq-result{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#eaf2fc,#fff);border:1px solid #cfe0f5;border-radius:14px;padding:14px;margin-bottom:10px}.bq-score{font-size:1.8rem;font-weight:800;color:#0055A5}' +
        '.bq-warn{background:#fff8e1;border:1px dashed #e0b400;border-radius:10px;padding:12px;margin:10px 0;text-align:center}';
      document.head.appendChild(s);
    }
    function mount() {
      if (started) return; started = true; css();
      S.teacher = false; render();
    }
    function check() { if (!started && SEC.classList.contains('on')) mount(); }
    new MutationObserver(check).observe(SEC, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-nav="bac"]')) setTimeout(check, 50); });
    check();
  }
})();
