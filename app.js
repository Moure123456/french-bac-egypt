/* ===== Le Français Au Bac — app.js (نسخة نظيفة) ===== */
(function () {
  'use strict';

  /* ---------- أدوات أساسية ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hasArabic(t) { return /[\u0600-\u06FF]/.test(t); }
  function hasLetters(t) { return /[A-Za-z\u00C0-\u00FF\u0600-\u06FF]/.test(t); }

  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f\u064B-\u065F\u0640]/g, '')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function bodyOf(id) {
    var sec = document.getElementById(id);
    if (!sec) return null;
    return sec.querySelector('.body') || sec;
  }

  function emptyMsg(el, msg) {
    el.innerHTML = '<div class="empty">' + msg + '</div>';
  }

  function safe(name, fn) {
    try { fn(); } catch (e) {
      try { console.error('[' + name + ']', e); } catch (_) {}
    }
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2500);
  }

  /* ---------- النطق الصوتي (TTS) ---------- */
  var synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  var voices = [];
  var activeBtn = null;

  function refreshVoices() {
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
  }
  if (synth) {
    refreshVoices();
    try { synth.onvoiceschanged = refreshVoices; } catch (e) {}
  }

  function pickVoice(lang) {
    var l = lang.toLowerCase();
    var p = l.slice(0, 2);
    var i;
    for (i = 0; i < voices.length; i++) {
      if (voices[i].lang.replace('_', '-').toLowerCase() === l) return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      if (voices[i].lang.toLowerCase().indexOf(p) === 0) return voices[i];
    }
    return null;
  }

  function clearActive() {
    if (activeBtn) {
      activeBtn.classList.remove('speaking');
      activeBtn = null;
    }
  }

  function chunkText(text, max) {
    max = max || 180;
    var sentences = text.match(/[^.!?\u061F\u2026;\u061B]+[.!?\u061F\u2026;\u061B]*/g) || [text];
    var out = [];
    var cur = '';
    sentences.forEach(function (s) {
      s = s.trim();
      if (!s) return;
      if ((cur + ' ' + s).length > max && cur) {
        out.push(cur);
        cur = s;
      } else {
        cur = cur ? cur + ' ' + s : s;
      }
    });
    if (cur) out.push(cur);
    return out;
  }

  function buildUtterances(clean, forcedLang) {
    var segs = forcedLang
      ? [clean]
      : (clean.match(/[\u0600-\u06FF\s\d.,\u060C\u061F!:\u061B()\u00AB\u00BB\-]+|[^\u0600-\u06FF]+/g) || [clean]);
    var list = [];
    segs.forEach(function (seg) {
      if (!seg.trim() || !hasLetters(seg)) return;
      var lang = forcedLang || (hasArabic(seg) ? 'ar-SA' : 'fr-FR');
      chunkText(seg.trim()).forEach(function (part) {
        var u = new SpeechSynthesisUtterance(part);
        u.lang = lang;
        u.rate = (lang === 'fr-FR') ? 0.9 : 0.95;
        u.pitch = 1;
        u.volume = 1;
        var v = pickVoice(lang);
        if (v) u.voice = v;
        list.push(u);
      });
    });
    return list;
  }

  function speak(text, lang, btn) {
    try {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        toast('المتصفح لا يدعم النطق الصوتي');
        return;
      }
      var clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      var wasBusy = synth.speaking || synth.pending;
      var sameBtn = btn && btn === activeBtn;
      synth.cancel();
      clearActive();
      if (sameBtn) return;

      var run = function () {
        try {
          var utts = buildUtterances(clean, lang);
          if (!utts.length) return;
          if (btn) {
            activeBtn = btn;
            btn.classList.add('speaking');
          }
          utts.forEach(function (u, i) {
            u.onerror = function () {
              clearActive();
              try { synth.cancel(); } catch (e) {}
            };
            if (i === utts.length - 1) u.onend = function () { clearActive(); };
            synth.speak(u);
          });
        } catch (e) {
          clearActive();
        }
      };

      if (wasBusy) setTimeout(run, 70); else run();
    } catch (e) {
      clearActive();
      try { if (synth) synth.cancel(); } catch (_) {}
    }
  }
  window.speakText = speak;
  window.addEventListener('pagehide', function () {
    try { if (synth) synth.cancel(); } catch (e) {}
  });

  /* ---------- جلب البيانات ---------- */
  var FILES = {
    curriculum: './data/curriculum.json',
    grammar: './data/grammar.json',
    phonetics: './data/phonetics.json',
    dictionary: './data/dictionary.json',
    dialogues: './data/dialogues.json',
    tales: './data/tales.json',
    stories: './data/stories.json',
    songs: './data/songs.json',
    exams: './data/exams.json'
  };
  var DATA = {};

  function loadJSON(url) {
    var name = url.split('/').pop();
    var cands = [url, 'data/' + name];
    var i = 0;
    function next() {
      if (i >= cands.length) return Promise.resolve(null);
      var c = cands[i++];
      return fetch(c, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) return next();
          return r.json().catch(function () { return next(); });
        })
        .catch(function () { return next(); });
    }
    return next();
  }

  function loadAll() {
    var keys = Object.keys(FILES);
    return Promise.all(keys.map(function (k) {
      return loadJSON(FILES[k]).then(function (d) { DATA[k] = d; });
    })).then(function () {
      safe('grammar', function () {
        DATA.grammarRules = flattenGrammar(DATA.grammar);
        renderGrammar(DATA.grammarRules);
      });
    });
  }

  /* ---------- أدوات قراءة JSON ---------- */
  var TITLE_KEYS = ['title_ar', 'title', 'title_fr', 'titre', 'name_ar', 'name', 'rule_ar', 'rule', 'topic', 'lesson', 'heading', 'question', 'word', 'fr'];
  var LABELS = {
    fr: 'Français', ar: 'عربي', translation: 'الترجمة', translation_ar: 'الترجمة',
    example: 'مثال', examples: 'أمثلة', explanation: 'الشرح', explanation_ar: 'الشرح',
    answer: 'الإجابة', question: 'السؤال', why: 'لماذا؟', rule: 'القاعدة',
    text: 'النص', level: 'المستوى'
  };

  function walkObjs(n, cb, seen) {
    seen = seen || [];
    if (!n || typeof n !== 'object') return;
    if (seen.indexOf(n) !== -1) return;
    seen.push(n);
    var arr = Array.isArray(n);
    if (!arr) cb(n);
    var kids = arr ? n : Object.keys(n).map(function (k) { return n[k]; });
    kids.forEach(function (x) { walkObjs(x, cb, seen); });
  }

  function findByKey(root, re) {
    var res = null;
    walkObjs(root, function (o) {
      if (res) return;
      Object.keys(o).forEach(function (k) {
        if (!res && re.test(k) && o[k] && typeof o[k] === 'object') res = o[k];
      });
    });
    return res;
  }

  function pickTitle(o) {
    var vals = [];
    TITLE_KEYS.forEach(function (k) {
      if (typeof o[k] === 'string' && o[k].trim()) vals.push(o[k].trim());
    });
    vals = vals.slice(0, 2);
    var uniq = [];
    vals.forEach(function (v) { if (uniq.indexOf(v) === -1) uniq.push(v); });
    return uniq.join(' — ');
  }

  /* ---------- العرض العام ---------- */
  function speakBtn(t) {
    t = String(t);
    if (!hasLetters(t)) return '';
    return '<button class="spk" type="button" data-say="' + esc(encodeURIComponent(t)) + '" aria-label="استمع">🔊</button>';
  }

  function render(n, depth) {
    depth = depth || 0;
    if (n === null || n === undefined || n === '') return '';
    if (typeof n !== 'object') {
      return '<p class="line">' + esc(n) + speakBtn(n) + '</p>';
    }
    if (Array.isArray(n)) {
      var allPrim = n.every(function (x) { return typeof x !== 'object'; });
      if (allPrim) {
        return '<ul class="plain">' + n.map(function (x) {
          return '<li>' + esc(x) + speakBtn(x) + '</li>';
        }).join('') + '</ul>';
      }
      return n.map(function (x) { return render(x, depth); }).join('');
    }
    var tkeys = TITLE_KEYS.filter(function (k) {
      return typeof n[k] === 'string' && n[k].trim();
    }).slice(0, 2);
    var title = pickTitle(n);
    var body = '';
    Object.keys(n).forEach(function (k) {
      var v = n[k];
      if (tkeys.indexOf(k) !== -1 || v === null || v === undefined || v === '') return;
      var label = LABELS[k] || k;
      if (typeof v !== 'object') {
        body += '<div class="kv" data-k="' + esc(k) + '"><b>' + esc(label) + '</b><span>' + esc(v) + '</span>' + speakBtn(v) + '</div>';
      } else {
        body += '<div class="sub" data-k="' + esc(k) + '"><h5>' + esc(label) + '</h5>' + render(v, depth + 1) + '</div>';
      }
    });
    if (!title) return '<div class="blk">' + body + '</div>';
    return '<details class="node d' + Math.min(depth, 3) + '"' + (depth === 0 ? ' open' : '') + '><summary>' + esc(title) + '</summary><div class="inner">' + body + '</div></details>';
  }

  function topEntries(data) {
    var d = data;
    var i;
    for (i = 0; i < 2; i++) {
      if (Array.isArray(d) || !d || typeof d !== 'object') break;
      var ks = Object.keys(d);
      if (ks.length === 1 && d[ks[0]] && typeof d[ks[0]] === 'object') d = d[ks[0]]; else break;
    }
    if (Array.isArray(d)) {
      return d.map(function (x, idx) {
        var lbl = (x && typeof x === 'object' && pickTitle(x)) || ('#' + (idx + 1));
        return { label: lbl, node: x };
      });
    }
    if (d && typeof d === 'object') {
      return Object.keys(d).map(function (k) {
        var v = d[k];
        var lbl = (v && typeof v === 'object' && !Array.isArray(v) && pickTitle(v)) || LABELS[k] || k;
        return { label: lbl, node: v };
      });
    }
    return [{ label: '', node: d }];
  }

  function filterNodes(area, q) {
    var nq = norm(q);
    $$('details.node', area).forEach(function (d) {
      var ok = !nq || norm(d.textContent).indexOf(nq) !== -1;
      d.style.display = ok ? '' : 'none';
      if (nq && ok) d.open = true;
    });
  }

  function mountGeneric(id, data, opts) {
    opts = opts || {};
    var el = bodyOf(id);
    if (!el) return;
    if (!data) { emptyMsg(el, 'المحتوى غير متاح حالياً.'); return; }
    var entries = topEntries(data);
    var useTabs = entries.length > 1 && entries.length <= 8;
    el.innerHTML =
      '<div class="tools">' +
        '<input type="search" class="search" placeholder="🔎 ابحث داخل القسم..." aria-label="بحث">' +
        (opts.arToggle ? '<button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>' : '') +
      '</div>' +
      (useTabs ? '<div class="tabs"></div>' : '') +
      '<div class="area"></div>';
    var area = $('.area', el);
    var search = $('.search', el);

    function show(i) {
      if (useTabs) {
        area.innerHTML = '<div class="card">' + render(entries[i].node, 0) + '</div>';
      } else {
        area.innerHTML = entries.map(function (e) {
          return '<div class="card">' + render(e.node, 0) + '</div>';
        }).join('');
      }
      if (search.value) filterNodes(area, search.value);
    }

    if (useTabs) {
      var tabs = $('.tabs', el);
      tabs.innerHTML = entries.map(function (e, i) {
        return '<button type="button" class="tab' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' + esc(e.label) + '</button>';
      }).join('');
      tabs.addEventListener('click', function (ev) {
        var b = ev.target.closest('.tab');
        if (!b) return;
        $$('.tab', tabs).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        show(Number(b.dataset.i));
      });
    }
    show(0);
    search.addEventListener('input', function () { filterNodes(area, search.value); });
    var tg = $('.btn-toggle-ar', el);
    if (tg) tg.addEventListener('click', function () { el.classList.toggle('ar-hidden'); });
  }

  /* ---------- القواعد: تسطيح بسيط وآمن ثم عرض ---------- */
  var RULE_TITLE = ['title_fr', 'title', 'title_ar', 'rule', 'name', 'topic'];
  var RULE_BODY = ['explanation_ar', 'explanation', 'examples', 'example'];

  function isRule(o) {
    var hasTitle = RULE_TITLE.some(function (k) {
      return typeof o[k] === 'string' && o[k].trim();
    });
    var hasBody = RULE_BODY.some(function (k) {
      return o[k] !== undefined && o[k] !== null && o[k] !== '';
    });
    return hasTitle && hasBody;
  }

  function flattenGrammar(data) {
    var out = [];
    try {
      if (!data) return out;
      var seen = [];
      var visit = function (node, level) {
        if (!node || typeof node !== 'object') return;
        if (seen.indexOf(node) !== -1) return;
        seen.push(node);
        if (Array.isArray(node)) {
          node.forEach(function (x) { visit(x, level); });
          return;
        }
        var lv = node.level || node.level_ar || level;
        if (isRule(node)) {
          var copy = {};
          Object.keys(node).forEach(function (k) { copy[k] = node[k]; });
          copy._level = node.level || level || '';
          out.push(copy);
          return;
        }
        Object.keys(node).forEach(function (k) {
          var v = node[k];
          if (v && typeof v === 'object') {
            var isLevelKey = /sec|level|niveau/i.test(k) && !/^(rules|examples|levels)$/i.test(k);
            visit(v, isLevelKey ? k : lv);
          }
        });
      };
      visit(data, '');
    } catch (e) {
      try { console.error('[flattenGrammar]', e); } catch (_) {}
    }
    return out;
  }

  function sayFr(t) {
    t = String(t || '');
    if (!/[A-Za-z\u00C0-\u00FF]/.test(t)) return '';
    return '<button class="spk" type="button" data-lang="fr-FR" data-say="' + esc(encodeURIComponent(t)) + '" aria-label="استمع بالفرنسية">🔊</button>';
  }

  function exampleHTML(ex) {
    if (ex === null || ex === undefined || ex === '') return '';
    if (typeof ex === 'string') {
      return '<div class="ex"><div class="ex-fr" dir="ltr">' + esc(ex) + ' ' + sayFr(ex) + '</div></div>';
    }
    var fr = ex.fr || ex.french || ex.example || ex.text || '';
    var ar = ex.ar || ex.arabic || ex.translation || ex.translation_ar || '';
    if (!fr && !ar) return '';
    return '<div class="ex"><div class="ex-fr" dir="ltr">' + esc(fr) + ' ' + sayFr(fr) + '</div>' +
      (ar ? '<div class="ex-ar" data-k="ar">' + esc(ar) + '</div>' : '') + '</div>';
  }

  function grammarCard(r) {
    var tFr = r.title_fr || r.title || '';
    var tAr = r.title_ar || '';
    var expl = r.explanation_ar || r.explanation || '';
    var raw = (r.examples !== undefined && r.examples !== null) ? r.examples : r.example;
    var exs = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    var h = '<div class="card gcard"><h3 class="g-title">';
    if (tAr) h += '<span>' + esc(tAr) + '</span>';
    if (tFr) h += '<span class="g-fr" dir="ltr">' + esc(tFr) + '</span> ' + sayFr(tFr);
    if (r._level) h += '<em class="lvl">' + esc(r._level) + '</em>';
    h += '</h3>';
    if (expl) h += '<p class="gexp">' + esc(expl) + '</p>';
    if (exs.length) h += '<h5 class="gh">أمثلة</h5>' + exs.map(exampleHTML).join('');
    h += '</div>';
    return h;
  }

  function renderGrammar(rules) {
    var el = bodyOf('grammar');
    if (!el) return;
    if (!rules || !rules.length) {
      emptyMsg(el, 'تعذّر تحميل ملف القواعد ./data/grammar.json — تأكد من وجوده داخل مجلد data بنفس الاسم.');
      return;
    }
    el.innerHTML =
      '<div class="tools">' +
        '<input type="search" class="search g-search" placeholder="🔎 ابحث في القواعد..." aria-label="بحث">' +
        '<button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>' +
      '</div>' +
      '<div class="count">' + rules.length + ' قاعدة</div>' +
      '<div class="g-area">' + rules.map(grammarCard).join('') + '</div>';

    var q = $('.g-search', el);
    q.addEventListener('input', function () {
      var v = norm(q.value);
      $$('.gcard', el).forEach(function (c) {
        c.style.display = (!v || norm(c.textContent).indexOf(v) !== -1) ? '' : 'none';
      });
    });
    $('.btn-toggle-ar', el).addEventListener('click', function () {
      el.classList.toggle('ar-hidden');
    });
  }

  /* ---------- القاموس ---------- */
  var FR_K = ['fr', 'french', 'word', 'mot', 'francais'];
  var AR_K = ['ar', 'arabic', 'meaning', 'translation', 'translation_ar', 'arabic_meaning'];

  function firstString(o, keys) {
    var i;
    for (i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  }

  function pairsFrom(root) {
    var out = [];
    if (!root) return out;
    if (!Array.isArray(root) && typeof root === 'object') {
      var vals = Object.keys(root).map(function (k) { return root[k]; });
      var allStr = vals.length > 0 && vals.every(function (v) { return typeof v === 'string'; });
      if (allStr) {
        Object.keys(root).forEach(function (f) { out.push({ fr: f, ar: root[f], ex: '' }); });
        return out;
      }
    }
    walkObjs(root, function (o) {
      var f = firstString(o, FR_K);
      var a = firstString(o, AR_K);
      if (f && a && f.length <= 60 && !hasArabic(f)) {
        out.push({ fr: f.trim(), ar: a.trim(), ex: o.example || o.exemple || '' });
      }
    });
    return out;
  }

  function mountDictionary() {
    var el = bodyOf('dictionary');
    if (!el) return;
    var words = pairsFrom(DATA.dictionary);
    if (!words.length) words = pairsFrom(findByKey(DATA.curriculum, /dict|vocab|mots|words/i));
    if (!words.length) words = pairsFrom(DATA.curriculum).concat(pairsFrom(DATA.grammarRules));
    var seen = {};
    words = words.filter(function (w) {
      var k = w.fr.toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) { return a.fr.localeCompare(b.fr, 'fr'); });
    if (!words.length) { emptyMsg(el, 'لا توجد كلمات متاحة حالياً.'); return; }

    el.innerHTML =
      '<div class="tools"><input type="search" class="search" placeholder="🔎 ابحث بالفرنسية أو بالعربية..." aria-label="بحث"></div>' +
      '<div class="count"></div><div class="area dict-list"></div>';
    var area = $('.area', el);
    var cnt = $('.count', el);
    var search = $('.search', el);

    function draw() {
      var q = norm(search.value);
      var list = words.filter(function (w) {
        return !q || norm(w.fr).indexOf(q) !== -1 || norm(w.ar).indexOf(q) !== -1;
      });
      cnt.textContent = list.length + ' كلمة';
      if (!list.length) { area.innerHTML = '<div class="empty">لا توجد نتائج.</div>'; return; }
      area.innerHTML = list.slice(0, 200).map(function (w) {
        return '<div class="word"><div class="w-fr" dir="ltr">' + esc(w.fr) + '</div>' +
          '<div class="w-ar">' + esc(w.ar) + '</div>' +
          '<button class="spk" type="button" data-say="' + esc(encodeURIComponent(w.fr)) + '" data-lang="fr-FR" aria-label="استمع">🔊</button>' +
          (w.ex ? '<div class="w-ex" dir="ltr">' + esc(w.ex) + '</div>' : '') + '</div>';
      }).join('');
    }
    search.addEventListener('input', draw);
    draw();
  }

  /* ---------- الشات الذكي المحلي ---------- */
  var INDEX = null;
  var STOP = ['ما', 'هو', 'هي', 'شرح', 'اشرح', 'لي', 'عن', 'في', 'من', 'هل', 'ايه', 'يعني', 'كيف', 'ازاي', 'لو', 'سمحت',
    'what', 'est', 'que', 'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'en', 'ce', 'qu', 'quoi', 'comment', 'explique', 'moi'];

  function leaves(o, depth, out) {
    depth = depth || 0;
    out = out || [];
    if (out.length >= 12 || depth > 3) return out;
    Object.keys(o).forEach(function (k) {
      if (out.length >= 12 || k === '_level' || k === TITLE_KEYS[0] || k === TITLE_KEYS[1]) return;
      var v = o[k];
      if (typeof v === 'string' && v.trim()) {
        out.push(v.trim());
      } else if (Array.isArray(v)) {
        v.forEach(function (x) {
          if (typeof x === 'string') { if (out.length < 12) out.push(x); }
          else if (x && typeof x === 'object') leaves(x, depth + 1, out);
        });
      } else if (v && typeof v === 'object') {
        leaves(v, depth + 1, out);
      }
    });
    return out;
  }

  function buildIndex() {
    INDEX = [];
    var sources = [['المنهج', DATA.curriculum], ['القواعد', DATA.grammarRules], ['الصوتيات', DATA.phonetics]];
    sources.forEach(function (pair) {
      walkObjs(pair[1], function (o) {
        var title = pickTitle(o);
        if (!title) return;
        var lines = leaves(o);
        if (!lines.length) return;
        INDEX.push({
          src: pair[0], title: title, lines: lines,
          th: norm(title), hay: norm(title + ' ' + lines.join(' '))
        });
      });
    });
  }

  function localAnswer(q) {
    if (/^(مرحبا|السلام|اهلا|أهلا|bonjour|salut|hello|hi)/i.test(q.trim())) {
      return '<p>مرحباً بك! 👋 اسألني عن أي درس أو قاعدة أو نطق في منهج اللغة الفرنسية، مثل: <b>passé composé</b> أو <b>الضمائر</b>.</p>';
    }
    if (!INDEX) buildIndex();
    var toks = norm(q).split(' ').map(function (t) { return t.replace(/^ال/, ''); })
      .filter(function (t) { return t.length > 1 && STOP.indexOf(t) === -1; });
    if (!toks.length || !INDEX.length) {
      return '<p>اكتب اسم الدرس أو القاعدة التي تريد شرحها بالعربية أو الفرنسية.</p>';
    }
    var scored = INDEX.map(function (e) {
      var s = 0, hit = 0;
      toks.forEach(function (t) {
        if (e.th.indexOf(t) !== -1) { s += 3; hit++; }
        else if (e.hay.indexOf(t) !== -1) { s += 1; hit++; }
      });
      if (hit === toks.length) s += 2;
      return { e: e, s: s };
    }).filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 3);
    if (!scored.length) {
      return '<p>لم أجد شرحاً مطابقاً في المنهج. جرّب كلمات أخرى، مثل اسم القاعدة أو الفعل أو عنوان الدرس.</p>';
    }
    return scored.map(function (x) {
      var e = x.e;
      var say = e.title + '. ' + e.lines.slice(0, 4).join('. ');
      return '<div class="ans"><div class="ans-h">📘 ' + esc(e.title) + ' <small>(' + e.src + ')</small>' + speakBtn(say) + '</div><ul>' +
        e.lines.slice(0, 6).map(function (l) {
          return '<li>' + esc(l.length > 260 ? l.slice(0, 260) + '…' : l) + '</li>';
        }).join('') + '</ul></div>';
    }).join('');
  }

  function mountChat() {
    var form = $('#chat-form');
    var input = $('#chat-input');
    var log = $('#chat-log');
    if (!form || !input || !log) return;

    function add(cls, html) {
      var d = document.createElement('div');
      d.className = 'msg ' + cls;
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    add('bot', '<p>أهلاً! أنا مساعدك في اللغة الفرنسية 🇫🇷 أبحث لك مباشرة داخل شرح المنهج والقواعد. اكتب سؤالك بالعربية أو الفرنسية.</p>');

    function ask(q) {
      q = q.trim();
      if (!q) return;
      add('user', '<p>' + esc(q) + '</p>');
      var html;
      try { html = localAnswer(q); } catch (e) { html = '<p>حدث خطأ بسيط، حاول إعادة صياغة السؤال.</p>'; }
      setTimeout(function () { add('bot', html); }, 150);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value);
      input.value = '';
    });
    $$('.chip').forEach(function (c) {
      c.addEventListener('click', function () { ask(c.textContent); });
    });
  }

  /* ---------- التنقل ---------- */
  function go(id) {
    var sec = $('#' + id) ? id : 'lessons';
    $$('.sec').forEach(function (s) { s.classList.toggle('on', s.id === sec); });
    $$('[data-nav]').forEach(function (b) { b.classList.toggle('on', b.dataset.nav === sec); });
    try { if (synth) synth.cancel(); } catch (e) {}
    clearActive();
    document.body.classList.remove('menu-open');
    window.scrollTo(0, 0);
  }

  /* ---------- PWA ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var b = $('#install-btn');
    if (b) b.hidden = false;
  });

  function setupInstall() {
    var b = $('#install-btn');
    if (b) {
      b.addEventListener('click', function () {
        if (!deferredPrompt) {
          toast('من قائمة المتصفح اختر: إضافة إلى الشاشة الرئيسية');
          return;
        }
        deferredPrompt.prompt();
        deferredPrompt = null;
        b.hidden = true;
      });
    }
    if (/^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(function () {});
    }
  }

  /* ---------- النقرات العامة ---------- */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.spk');
    if (s) {
      speak(decodeURIComponent(s.dataset.say || ''), s.dataset.lang || null, s);
      return;
    }
    var n = e.target.closest('[data-nav]');
    if (n) go(n.dataset.nav);
    if (e.target.closest('#menu-btn')) document.body.classList.toggle('menu-open');
    if (e.target.id === 'scrim') document.body.classList.remove('menu-open');
  });

  /* ---------- التشغيل ---------- */
  function start() {
    safe('install', setupInstall);
    safe('chat', mountChat);
    safe('nav', function () { go((location.hash || '').replace('#', '') || 'lessons'); });

    loadAll().then(function () {
      safe('lessons', function () { mountGeneric('lessons', DATA.curriculum); });
      safe('phonetics', function () { mountGeneric('phonetics', DATA.phonetics); });
      safe('exams', function () { mountGeneric('exams', DATA.exams); });
      safe('dictionary', mountDictionary);
      safe('dialogues', function () {
        mountGeneric('dialogues', DATA.dialogues || findByKey(DATA.curriculum, /dialog/i), { arToggle: true });
      });
      safe('tales', function () {
        mountGeneric('tales', DATA.stories || DATA.tales || findByKey(DATA.curriculum, /stor|tale|conte/i), { arToggle: true });
      });
      safe('songs', function () {
        mountGeneric('songs', DATA.songs || findByKey(DATA.curriculum, /song|chanson/i), { arToggle: true });
      });
      safe('index', buildIndex);
    }).catch(function (e) {
      try { console.error('[start]', e); } catch (_) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
