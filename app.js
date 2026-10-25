/* ===== Le Français Au Bac — app.js ===== */
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

  // نطاقات الحروف العربية (بما فيها پ وڤ)، والرموز الصوتية IPA، والحروف اللاتينية
  var ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var ARABIC_RE_G = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
  var IPA_RE = /[\u0250-\u02AF\u0303\u02C8\u02CC\u00F8\u014B]/;
  var LATIN_RE = /[A-Za-z\u00C0-\u00FF\u0152\u0153]/;

  function hasArabic(t) { return ARABIC_RE.test(t); }

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

  /* ---------- تنظيف النص قبل النطق: فرنسي صافٍ فقط ---------- */
  function cleanFrench(t) {
    var s = String(t === null || t === undefined ? '' : t);
    // وسوم HTML
    s = s.replace(/<[^>]*>/g, ' ');
    // الرموز الصوتية المائلة بين شرطات /.../ (مع إبقاء التواريخ والكسور مثل /05/)
    s = s.replace(/\/(?=\S)[^\/\n]*?\S\//g, function (m) {
      return /^\/[\d\s]*\/$/.test(m) ? m : ' ';
    });
    // رموز صوتية بين أقواس مربعة [..]
    s = s.replace(/\[[^\]\n]*\]/g, function (m) { return IPA_RE.test(m) ? ' ' : m; });
    // حذف كل الحروف العربية
    s = s.replace(ARABIC_RE_G, ' ');
    // حذف أي كلمة بقيت فيها رموز صوتية IPA
    s = s.split(/\s+/).filter(function (w) { return w && !IPA_RE.test(w); }).join(' ');
    // الفراغات والأسهم والرموز
    s = s.replace(/_{2,}/g, ' ... ')
      .replace(/[\u2192\u2190\u2260]/g, ', ')
      .replace(/[*#~^|]/g, ' ');
    s = s.replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  // نص فرنسي صافٍ صالح للنطق، أو نص فارغ إن كان عربياً أو مختلطاً أو رموزاً صوتية
  function frText(t) {
    if (t === null || t === undefined) return '';
    var s = String(t);
    if (ARABIC_RE.test(s)) return '';
    var c = cleanFrench(s);
    return LATIN_RE.test(c) ? c : '';
  }

  /* ---------- النطق الصوتي (TTS): الفرنسية فقط fr-FR ---------- */
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

  function pickFrenchVoice() {
    var i;
    for (i = 0; i < voices.length; i++) {
      if (voices[i].lang.replace('_', '-').toLowerCase() === 'fr-fr') return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      if (voices[i].lang.toLowerCase().indexOf('fr') === 0) return voices[i];
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

  function buildUtterances(clean) {
    var list = [];
    var v = pickFrenchVoice();
    chunkText(clean).forEach(function (part) {
      var u = new SpeechSynthesisUtterance(part);
      u.lang = 'fr-FR';
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = 1;
      if (v) u.voice = v;
      list.push(u);
    });
    return list;
  }

  // المعامل الثاني (lang) يُهمَل عمداً: اللغة دائماً fr-FR والنص فرنسي فقط
  function speak(text, lang, btn) {
    try {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        toast('المتصفح لا يدعم النطق الصوتي');
        return;
      }
      var clean = cleanFrench(text);
      if (!clean || !LATIN_RE.test(clean)) {
        toast('لا يوجد نص فرنسي للنطق');
        return;
      }

      var wasBusy = synth.speaking || synth.pending;
      var sameBtn = btn && btn === activeBtn;
      synth.cancel();
      clearActive();
      if (sameBtn) return;

      var run = function () {
        try {
          var utts = buildUtterances(clean);
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

  /* ---------- جلب البيانات: الملفات الموجودة فعلياً + songs.json ---------- */
  var DATA = {};
  var LOADLOG = [];

  // مسارات بديلة للملف الواحد
  function dataCandidates(url) {
    var name = url.split('/').pop();
    var parts = location.pathname.split('/').filter(Boolean);
    var base = location.pathname.replace(/[^/]*$/, '');
    var list = [
      url,                       // ./data/x.json
      'data/' + name,
      '/data/' + name,
      base + 'data/' + name,
      '../data/' + name,
      name,                      // الملف بجانب index.html
      base + name
    ];
    // مسار احتياطي أخير عبر jsDelivr من المستودع نفسه (يعمل إن كان الملف داخل المستودع)
    var host = location.hostname;
    if (/\.github\.io$/.test(host)) {
      var user = host.split('.')[0];
      var repo = (parts.length && !/\.html?$/i.test(parts[0])) ? parts[0] : (user + '.github.io');
      list.push('https://cdn.jsdelivr.net/gh/' + user + '/' + repo + '@main/data/' + name);
    }
    var seen = {};
    return list.filter(function (c) {
      if (seen[c]) return false;
      seen[c] = true;
      return true;
    });
  }

  // جلب مع كسر الكاش وتجربة كل المسارات
  function fetchJson(url) {
    var name = url.split('/').pop();
    var cands = dataCandidates(url);
    var i = 0;
    function next() {
      if (i >= cands.length) return Promise.resolve(null);
      var c = cands[i++];
      var bust = c + (c.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      return fetch(bust, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) { LOADLOG.push(name + ' @ ' + c + ' → HTTP ' + r.status); return next(); }
          return r.text().then(function (t) {
            try { return JSON.parse(t.replace(/^\uFEFF/, '')); }
            catch (e) { LOADLOG.push(name + ' @ ' + c + ' → JSON غير صالح'); return next(); }
          });
        })
        .catch(function (e) { LOADLOG.push(name + ' @ ' + c + ' → ' + e.message); return next(); });
    }
    return next();
  }

  function loadAllData() {
    return Promise.all([
      fetchJson('./data/curriculum.json'),
      fetchJson('./data/grammar.json'),
      fetchJson('./data/phonetics.json'),
      fetchJson('./data/dialogues.json'),
      fetchJson('./data/stories.json'),
      fetchJson('./data/exams.json'),
      fetchJson('./data/songs.json')
    ]).then(function (res) {
      DATA.curriculum = res[0];
      DATA.grammar = res[1];
      DATA.phonetics = res[2];
      DATA.dialogues = res[3];
      DATA.stories = res[4];
      DATA.exams = res[5];
      DATA.songs = res[6];

      safe('grammar', function () {
        DATA.grammarRules = flattenGrammar(DATA.grammar);
        DATA.conjugations = getConjugations(DATA.grammar);
        renderGrammar(DATA.grammarRules, DATA.conjugations);
      });
    });
  }

  /* ---------- أدوات قراءة JSON ---------- */
  var TITLE_KEYS = ['title_ar', 'title', 'title_fr', 'titre', 'name_ar', 'name', 'rule_ar', 'rule', 'topic', 'lesson', 'heading', 'question', 'word', 'fr'];
  var LABELS = {
    fr: 'Français', ar: 'عربي', translation: 'الترجمة', translation_ar: 'الترجمة',
    example: 'مثال', examples: 'أمثلة', explanation: 'الشرح', explanation_ar: 'الشرح',
    answer: 'الإجابة', question: 'السؤال', why: 'لماذا؟', rule: 'القاعدة',
    text: 'النص', level: 'المستوى',
    meta: 'معلومات القسم', years: 'الصفوف الدراسية', exams: 'نماذج الامتحانات',
    dialogues: 'الحوارات', groups: 'الأصوات', rule_groups: 'قواعد القراءة والنطق',
    contrasts: 'المقارنة بين الأصوات', songs: 'الأغاني', title: 'العنوان', note: 'ملاحظة',
    phonetic: 'النطق الصوتي', image_alt: 'وصف الصورة'
  };

  // مفاتيح لا يُنطق محتواها أبداً (معرّفات، رموز صوتية، أسماء متحدثين، صور ...)
  var NOSPEAK = ['id', 'level', 'type', 'who', 'name', 'role', 'role_ar', 'number', 'version',
    'ipa', 'phonetic', 'pron_ar', 'pron', 'letters', 'sounds', 'symbols', 'duration_min',
    'marks', 'image', 'image_alt', 'speakers'];

  // مفاتيح تُستثنى من القاموس والبحث الذكي (بيانات تعريفية ورموز صوتية صرفة)
  var SKIP_KEYS = ['meta', 'phonetic'];

  function walkObjs(n, cb, seen, skip) {
    seen = seen || [];
    if (!n || typeof n !== 'object') return;
    if (seen.indexOf(n) !== -1) return;
    seen.push(n);
    var arr = Array.isArray(n);
    if (!arr) cb(n);
    var kids = arr ? n : Object.keys(n).filter(function (k) {
      return !skip || skip.indexOf(k) === -1;
    }).map(function (k) { return n[k]; });
    kids.forEach(function (x) { walkObjs(x, cb, seen, skip); });
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
  // زر الصوت: يظهر فقط للنص الفرنسي الصافي، ويحمل النص الفرنسي المنظّف
  function speakBtn(t) {
    var c = frText(t);
    if (!c) return '';
    return '<button class="spk" type="button" data-lang="fr-FR" data-say="' + esc(encodeURIComponent(c)) + '" aria-label="استمع بالفرنسية">🔊</button>';
  }

  /* ---------- أدوات قسم الصوتيات (Phonétique): نطق الحرف/المقطع الفرنسي الصافي ---------- */
  // تنظيف نص صوتي: يحذف الأقواس المربعة [...] والكلمات العربية الشارحة (مثل "صوت")
  // ولا يُخفي الزر لمجرد وجود رموز IPA أو شرح عربي حول النص
  function cleanPhon(t) {
    var s = String(t === null || t === undefined ? '' : t);
    s = s.replace(/\[[^\]\n]*\]/g, ' ');
    s = s.replace(ARABIC_RE_G, ' ');
    s = s.replace(/[+=<>\u2192\u2190\u2260]/g, ' ');
    s = s.split(/\s+/).filter(function (w) { return w && !IPA_RE.test(w); }).join(' ');
    s = s.replace(/\s+,/g, ',').replace(/,(\s*,)+/g, ',').replace(/\s+/g, ' ');
    s = s.replace(/^[\s,;:.\-]+/, '').replace(/[\s,;:\-]+$/, '').trim();
    return s;
  }

  function phText(t) {
    var c = cleanPhon(t);
    return LATIN_RE.test(c) ? c : '';
  }

  function phBtn(t) {
    var c = phText(t);
    if (!c) return '';
    return '<button class="spk" type="button" data-lang="fr-FR" data-say="' + esc(encodeURIComponent(c)) + '" aria-label="استمع بالفرنسية">🔊</button>';
  }

  // أول حرف/مقطع من قائمة الحروف: "é, er, ez, et" ← "é"
  function phFirstToken(letters) {
    var c = cleanPhon(letters);
    if (!c) return '';
    return c.split(/\s*,\s*/)[0];
  }

  var PH_LABELS = {
    intro_ar: 'مقدمة', how_ar: 'طريقة النطق', place_ar: 'مكان النطق', why_ar: 'السبب',
    tip_ar: 'نصيحة', rule_ar: 'القاعدة', exceptions_ar: 'استثناءات', explanation_ar: 'الشرح'
  };

  function phRow(key, text) {
    if (!text) return '';
    return '<div class="kv" data-k="' + esc(key) + '"><b>' + esc(PH_LABELS[key] || key) + '</b><span>' + esc(text) + '</span></div>';
  }

  function phExampleHTML(ex) {
    if (!ex || typeof ex !== 'object') return '';
    var fr = ex.fr || '';
    var ar = ex.ar || '';
    if (!fr && !ar) return '';
    var ipa = ex.ipa ? '<span dir="ltr" style="color:var(--muted);font-weight:400;margin-inline-start:6px;">[' + esc(ex.ipa) + ']</span>' : '';
    return '<div class="ex"><div class="ex-fr" dir="ltr">' + esc(fr) + ipa + ' ' + phBtn(fr) + '</div>' +
      (ar ? '<div class="ex-ar" data-k="ar">' + esc(ar) + '</div>' : '') + '</div>';
  }

  function phExamples(list) {
    if (!Array.isArray(list) || !list.length) return '';
    return '<h5 class="gh">أمثلة</h5>' + list.map(phExampleHTML).join('');
  }

  function phSoundHTML(s) {
    var ipa = s.ipa ? ' — [' + s.ipa + ']' : '';
    var title = (s.name_ar || s.ipa || '') + ipa;
    var letters = s.letters || '';
    var first = phFirstToken(letters);
    if (!first && s.ipa && !IPA_RE.test(s.ipa)) first = s.ipa;
    var h = '<details class="node d1"><summary>' + phBtn(first) + ' ' + esc(title) + '</summary><div class="inner">';
    if (letters) {
      h += '<div class="kv" data-k="letters"><b>الحروف</b><span dir="ltr">' + esc(letters) + '</span>' + phBtn(letters) + '</div>';
    }
    h += phRow('how_ar', s.how_ar) + phRow('place_ar', s.place_ar) + phRow('why_ar', s.why_ar) + phRow('tip_ar', s.tip_ar);
    h += phExamples(s.examples);
    return h + '</div></details>';
  }

  function phGroupHTML(g) {
    var title = pickTitle(g) || g.id || '';
    var h = '<details class="node d0" open><summary>' + esc(title) + '</summary><div class="inner">';
    h += phRow('intro_ar', g.intro_ar);
    h += (g.sounds || []).map(phSoundHTML).join('');
    return h + '</div></details>';
  }

  function phRuleHTML(r) {
    var title = pickTitle(r) || r.id || '';
    var h = '<details class="node d1"><summary>' + phBtn(r.title_fr) + ' ' + esc(title) + '</summary><div class="inner">';
    h += phRow('rule_ar', r.rule_ar) + phRow('why_ar', r.why_ar) + phRow('exceptions_ar', r.exceptions_ar);
    h += phExamples(r.examples);
    return h + '</div></details>';
  }

  function phRuleGroupHTML(g) {
    var title = pickTitle(g) || g.id || '';
    var h = '<details class="node d0" open><summary>' + esc(title) + '</summary><div class="inner">';
    h += phRow('intro_ar', g.intro_ar);
    h += (g.rules || []).map(phRuleHTML).join('');
    return h + '</div></details>';
  }

  function phContrastHTML(c) {
    var title = c.title_ar || c.title_fr || c.id || '';
    var sounds = Array.isArray(c.sounds) ? c.sounds.map(function (x) { return '[' + x + ']'; }).join('  ≠  ') : '';
    var h = '<details class="node d1"><summary>' + esc(title) + '</summary><div class="inner">';
    if (sounds) h += '<div class="kv" data-k="sounds"><b>الأصوات</b><span dir="ltr">' + esc(sounds) + '</span></div>';
    h += phRow('explanation_ar', c.explanation_ar);
    (c.pairs || []).forEach(function (pair) {
      if (!Array.isArray(pair)) return;
      h += '<div class="blk" style="border-top:1px dashed var(--line);margin-top:6px;padding-top:6px;">' + pair.map(phExampleHTML).join('') + '</div>';
    });
    h += phRow('tip_ar', c.tip_ar);
    return h + '</div></details>';
  }

  // عارض قسم الصوتيات: يرجع للعارض العام تلقائياً إن حدث أي خطأ
  function renderPhoneticsNode(node, key) {
    try {
      if (key === 'groups' && Array.isArray(node)) return node.map(phGroupHTML).join('');
      if (key === 'rule_groups' && Array.isArray(node)) return node.map(phRuleGroupHTML).join('');
      if (key === 'contrasts' && Array.isArray(node)) return node.map(phContrastHTML).join('');
    } catch (e) {
      try { console.error('[renderPhoneticsNode]', e); } catch (_) {}
    }
    return render(node, 0);
  }

  function render(n, depth, noSpeak) {
    depth = depth || 0;
    if (n === null || n === undefined || n === '') return '';
    var sp = function (t) { return noSpeak ? '' : speakBtn(t); };
    if (typeof n !== 'object') {
      return '<p class="line">' + esc(n) + sp(n) + '</p>';
    }
    if (Array.isArray(n)) {
      var allPrim = n.every(function (x) { return typeof x !== 'object'; });
      if (allPrim) {
        return '<ul class="plain">' + n.map(function (x) {
          return '<li>' + esc(x) + sp(x) + '</li>';
        }).join('') + '</ul>';
      }
      return n.map(function (x) { return render(x, depth, noSpeak); }).join('');
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
      var ns = noSpeak || NOSPEAK.indexOf(k) !== -1;
      if (typeof v !== 'object') {
        if (k === 'image') {
          var altO = (n.image_alt && typeof n.image_alt === 'object') ? n.image_alt : {};
          body += '<img src="' + esc(v) + '" alt="' + esc(altO.fr || '') + '" loading="lazy" style="display:block;max-width:100%;border-radius:14px;margin:10px auto;" onerror="this.style.display=\'none\'">';
        } else {
          body += '<div class="kv" data-k="' + esc(k) + '"><b>' + esc(label) + '</b><span>' + esc(v) + '</span>' + (ns ? '' : speakBtn(v)) + '</div>';
        }
      } else {
        body += '<div class="sub" data-k="' + esc(k) + '"><h5>' + esc(label) + '</h5>' + render(v, depth + 1, ns) + '</div>';
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
        return { label: lbl, node: v, key: k };
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
    // تبويبات إضافية اختيارية (مثل قاموس المنهج المصغر داخل الدروس)
    if (opts.extraTabs) {
      opts.extraTabs.forEach(function (t) { if (t) entries.push(t); });
    }
    var renderNode = opts.renderNode || function (n) { return render(n, 0); };
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
    var curIdx = 0;

    function show(i) {
      curIdx = i;
      var e = entries[i];
      if (e && e.custom) {
        area.innerHTML = '';
        e.custom(area, search.value);
        return;
      }
      if (useTabs) {
        area.innerHTML = '<div class="card">' + renderNode(e.node, e.key) + '</div>';
      } else {
        area.innerHTML = entries.filter(function (x) { return !x.custom; }).map(function (x) {
          return '<div class="card">' + renderNode(x.node, x.key) + '</div>';
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
    search.addEventListener('input', function () {
      var e = entries[curIdx];
      if (e && e.custom) {
        if (e.onSearch) e.onSearch(search.value);
        return;
      }
      filterNodes(area, search.value);
    });
    var tg = $('.btn-toggle-ar', el);
    if (tg) tg.addEventListener('click', function () { el.classList.toggle('ar-hidden'); });
  }

  /* ---------- قاموس المنهج المصغّر (تبويب داخل دروس الكتاب والحلول) ---------- */
  // يجمع مفردات كل الوحدات (vocabulary) في الصفوف الأول والثاني والثالث الثانوي
  function curriculumWords() {
    var map = {};
    var list = [];
    var seen = [];
    (function visit(node, year) {
      if (!node || typeof node !== 'object' || seen.indexOf(node) !== -1) return;
      seen.push(node);
      if (Array.isArray(node)) {
        node.forEach(function (x) { visit(x, year); });
        return;
      }
      var y = (typeof node.id === 'string' && /^[0-9]sec$/i.test(node.id)) ? node.id.toLowerCase() : year;
      var v = node.vocabulary;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.keys(v).forEach(function (cat) {
          var arr = v[cat];
          if (!Array.isArray(arr)) return;
          arr.forEach(function (p) {
            if (!(Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string')) return;
            var fr = p[0].trim();
            var ar = p[1].trim();
            if (!fr || !ar || hasArabic(fr)) return;
            var k = fr.toLowerCase();
            var it = map[k];
            if (!it) { it = map[k] = { fr: fr, ar: ar, cat: cat, years: [] }; list.push(it); }
            if (y && it.years.indexOf(y) === -1) it.years.push(y);
          });
        });
      }
      Object.keys(node).forEach(function (k) {
        if (k === 'meta' || k === 'vocabulary') return;
        var c = node[k];
        if (c && typeof c === 'object') visit(c, y);
      });
    })(DATA.curriculum, '');
    return list;
  }

  // الكلمة الرئيسية للترتيب الأبجدي: نتجاهل الأداة (le/la/l’/les/un/une) وضمير الانعكاس (se/s’)
  function dictHead(it) {
    var h = it.fr.replace(/^[«"“\s\u2026]+/, '');
    if (/^noms/.test(it.cat)) h = h.replace(/^(?:l[\u2019']|(?:les|le|la|une|un|des)\s+)/i, '');
    else if (it.cat === 'verbes') h = h.replace(/^(?:s[\u2019']|se\s+)/i, '');
    return h;
  }

  function buildMiniDictTab() {
    var raw = curriculumWords();
    if (!raw.length) return null;
    var words = raw.map(function (it) {
      var base = norm(dictHead(it));
      return {
        fr: it.fr,
        ar: it.ar,
        years: it.years.slice().sort(),
        base: base,
        letter: /^[a-z]/.test(base) ? base.charAt(0).toUpperCase() : '#'
      };
    }).sort(function (a, b) {
      if (a.base < b.base) return -1;
      if (a.base > b.base) return 1;
      return a.fr < b.fr ? -1 : (a.fr > b.fr ? 1 : 0);
    });
    var state = null;

    function yearLabel(y) { return LEVEL_NAMES[y] || y; }

    function paint() {
      if (!state) return;
      var q = norm(state.query);
      var list = words.filter(function (w) {
        var yOk = state.year === 'all' || w.years.indexOf(state.year) !== -1;
        return yOk && (!q || norm(w.fr).indexOf(q) !== -1 || norm(w.ar).indexOf(q) !== -1);
      });
      state.count.textContent = list.length + ' كلمة';
      if (!list.length) {
        state.bar.innerHTML = '';
        state.list.innerHTML = '<div class="empty">لا توجد نتائج.</div>';
        return;
      }
      var groups = [];
      var idx = {};
      list.forEach(function (w) {
        if (idx[w.letter] === undefined) { idx[w.letter] = groups.length; groups.push({ letter: w.letter, items: [] }); }
        groups[idx[w.letter]].items.push(w);
      });
      state.bar.innerHTML = groups.map(function (g) {
        return '<button type="button" class="md-jump" data-l="' + esc(g.letter) + '" style="border:1px solid var(--line);background:#fff;color:var(--blue);border-radius:8px;padding:4px 10px;font-weight:700;cursor:pointer;font-family:inherit;">' + esc(g.letter) + '</button>';
      }).join('');
      state.list.innerHTML = groups.map(function (g) {
        return '<h4 data-md-letter="' + esc(g.letter) + '" style="margin:16px 0 6px;color:var(--red);border-bottom:2px solid var(--line);padding-bottom:4px;font-size:1.1rem;scroll-margin-top:70px;">' + esc(g.letter) + '</h4>' +
          '<div class="dict-list">' + g.items.map(function (w) {
            var say = w.fr.replace(/\s*\/\s*/g, ', ');
            return '<div class="word"><div class="w-fr" dir="ltr">' + esc(w.fr) + '</div>' +
              '<div class="w-ar">' + esc(w.ar) + '</div>' +
              speakBtn(say) +
              '<div class="w-ex" style="text-align:right;font-style:normal;">' + esc(w.years.map(yearLabel).join(' · ')) + '</div></div>';
          }).join('') + '</div>';
      }).join('');
    }

    return {
      label: '📖 قاموس المنهج',
      custom: function (area, q) {
        var years = [];
        words.forEach(function (w) {
          w.years.forEach(function (y) { if (years.indexOf(y) === -1) years.push(y); });
        });
        years.sort();
        area.innerHTML =
          '<div class="md-years" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;">' +
            '<button type="button" class="tab on" data-y="all">الكل</button>' +
            years.map(function (y) {
              return '<button type="button" class="tab" data-y="' + esc(y) + '">' + esc(yearLabel(y)) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="count md-count"></div>' +
          '<div class="md-bar" style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 10px;"></div>' +
          '<div class="md-list"></div>';
        state = {
          year: 'all',
          query: q || '',
          count: area.querySelector('.md-count'),
          bar: area.querySelector('.md-bar'),
          list: area.querySelector('.md-list')
        };
        area.querySelector('.md-years').addEventListener('click', function (ev) {
          var b = ev.target.closest('.tab');
          if (!b) return;
          $$('.md-years .tab', area).forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          state.year = b.getAttribute('data-y');
          paint();
        });
        state.bar.addEventListener('click', function (ev) {
          var b = ev.target.closest('.md-jump');
          if (!b) return;
          var h = state.list.querySelector('[data-md-letter="' + b.getAttribute('data-l') + '"]');
          if (h && h.scrollIntoView) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        paint();
      },
      onSearch: function (q) {
        if (state) { state.query = q; paint(); }
      }
    };
  }

  /* ---------- قسم الأغاني: data/songs.json ---------- */
  function mountSongs() {
    var sec = document.getElementById('songs') || document.getElementById('soon-chansons');
    if (!sec) return;
    // إن لم يوجد الملف تبقى بطاقة "قيد الإعداد" كما هي
    if (!DATA.songs) return;
    var body = sec.querySelector('.body');
    if (!body) {
      var card = sec.querySelector('.soon-card');
      body = document.createElement('div');
      body.className = 'body';
      if (card && card.parentNode) card.parentNode.replaceChild(body, card);
      else sec.appendChild(body);
    }
    mountGeneric(sec.id, DATA.songs, { arToggle: true });
  }

  /* ---------- القواعد: تسطيح + تمارين + تصريف ---------- */
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
        // حاوية مستوى: كائن له id ومصفوفة rules
        var lv = node.level || node.level_ar || ((Array.isArray(node.rules) && node.id) ? node.id : '') || level;
        if (isRule(node)) {
          var copy = {};
          Object.keys(node).forEach(function (k) { copy[k] = node[k]; });
          copy._level = node.level || level || '';
          out.push(copy);
          return;
        }
        Object.keys(node).forEach(function (k) {
          var v = node[k];
          if (k === 'conjugations' || k === 'meta') return;
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

  function getConjugations(data) {
    try {
      if (!data) return [];
      if (Array.isArray(data.conjugations)) return data.conjugations;
      var f = findByKey(data, /conjug/i);
      return Array.isArray(f) ? f : [];
    } catch (e) { return []; }
  }

  // زر نطق فرنسي للعناوين والأمثلة والتمارين (النص الفرنسي فقط)
  function sayFr(t) {
    return speakBtn(t);
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

  function exerciseHTML(x, idx) {
    var prompt = x.prompt_fr || x.prompt || x.question || '';
    var ans = (x.answer !== undefined && x.answer !== null) ? String(x.answer) : '';
    var hint = x.hint_ar || x.hint || '';
    var isChoice = Array.isArray(x.options) && x.options.length > 0 && x.type !== 'text';
    var h = '<div class="exo" data-ans="' + esc(encodeURIComponent(ans)) + '" data-hint="' + esc(encodeURIComponent(hint)) + '">';
    h += '<div class="exo-q" dir="ltr"><b>' + (idx + 1) + '.</b> ' + esc(prompt) + ' ' + sayFr(prompt) + '</div>';
    if (isChoice) {
      h += '<div class="opts" dir="ltr">' + x.options.map(function (o) {
        return '<button type="button" class="opt" data-v="' + esc(encodeURIComponent(String(o))) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      h += '<div class="txt"><input type="text" class="exo-in" dir="ltr" autocomplete="off" autocapitalize="off" placeholder="اكتب الإجابة"><button type="button" class="chk">تحقق</button></div>';
    }
    h += '<div class="fb"></div></div>';
    return h;
  }

  function grammarCard(r) {
    var tFr = r.title_fr || r.title || '';
    var tAr = r.title_ar || '';
    var expl = r.explanation_ar || r.explanation || '';
    var raw = (r.examples !== undefined && r.examples !== null) ? r.examples : r.example;
    var exs = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    var exos = Array.isArray(r.exercises) ? r.exercises : [];
    var h = '<div class="card gcard"><h3 class="g-title">';
    if (tAr) h += '<span>' + esc(tAr) + '</span>';
    if (tFr) h += '<span class="g-fr" dir="ltr">' + esc(tFr) + '</span> ' + sayFr(tFr);
    if (r._level) h += '<em class="lvl">' + esc(r._level) + '</em>';
    h += '</h3>';
    // الشرح العربي يبقى كما هو، بدون زر صوت (الصوت للفرنسية فقط)
    if (expl) h += '<p class="gexp">' + esc(expl) + '</p>';
    if (exs.length) h += '<h5 class="gh">أمثلة</h5>' + exs.map(exampleHTML).join('');
    if (exos.length) {
      h += '<h5 class="gh">تدريبات <span class="gscore"></span> <button type="button" class="reset-ex">↺ إعادة</button></h5>' +
        exos.map(exerciseHTML).join('');
    }
    h += '</div>';
    return h;
  }

  /* ---------- التصحيح التلقائي ---------- */
  function normAns(s) {
    return String(s || '').toLowerCase()
      .replace(/[\u2019\u2018`\u00B4]/g, "'")
      .replace(/\s+/g, ' ')
      .replace(/\s*([?!.:,;])/g, '$1')
      .replace(/[?!.]+$/, '')
      .trim();
  }

  function updateScore(card) {
    if (!card) return;
    var all = $$('.exo', card);
    var done = all.filter(function (e) { return e.getAttribute('data-done'); }).length;
    var ok = all.filter(function (e) { return e.getAttribute('data-ok'); }).length;
    var el = $('.gscore', card);
    if (!el) return;
    if (!done) { el.textContent = ''; return; }
    el.textContent = '(' + ok + ' / ' + all.length + ')' + (done === all.length && ok === all.length ? ' 🎉' : '');
  }

  function finishExo(exo, ok) {
    exo.setAttribute('data-done', '1');
    if (ok) exo.setAttribute('data-ok', '1');
    var ans = decodeURIComponent(exo.getAttribute('data-ans') || '');
    var hint = decodeURIComponent(exo.getAttribute('data-hint') || '');
    var fb = $('.fb', exo);
    fb.className = 'fb ' + (ok ? 'good' : 'bad');
    fb.innerHTML = (ok ? '✅ إجابة صحيحة' : '❌ الإجابة الصحيحة: <b dir="ltr">' + esc(ans) + '</b>') +
      (hint ? '<div class="hint">💡 ' + esc(hint) + '</div>' : '');
    updateScore(exo.closest('.gcard'));
  }

  function answerChoice(btn) {
    var exo = btn.closest('.exo');
    if (!exo || exo.getAttribute('data-done')) return;
    var v = decodeURIComponent(btn.getAttribute('data-v') || '');
    var ans = decodeURIComponent(exo.getAttribute('data-ans') || '');
    $$('.opt', exo).forEach(function (b) {
      b.disabled = true;
      var bv = decodeURIComponent(b.getAttribute('data-v') || '');
      if (bv === ans) b.classList.add('ok');
      else if (b === btn) b.classList.add('bad');
    });
    finishExo(exo, v === ans);
  }

  function answerText(btn) {
    var exo = btn.closest('.exo');
    if (!exo || exo.getAttribute('data-done')) return;
    var inp = $('.exo-in', exo);
    if (!inp || !inp.value.trim()) { toast('اكتب إجابتك أولاً'); return; }
    var ans = decodeURIComponent(exo.getAttribute('data-ans') || '');
    inp.disabled = true;
    btn.disabled = true;
    finishExo(exo, normAns(inp.value) === normAns(ans));
  }

  function resetCard(btn) {
    var card = btn.closest('.gcard');
    if (!card) return;
    $$('.exo', card).forEach(function (exo) {
      exo.removeAttribute('data-done');
      exo.removeAttribute('data-ok');
      var fb = $('.fb', exo);
      fb.className = 'fb';
      fb.innerHTML = '';
      $$('.opt', exo).forEach(function (b) {
        b.disabled = false;
        b.classList.remove('ok');
        b.classList.remove('bad');
      });
      var inp = $('.exo-in', exo);
      if (inp) { inp.value = ''; inp.disabled = false; }
      var c = $('.chk', exo);
      if (c) c.disabled = false;
    });
    updateScore(card);
  }

  /* ---------- جداول التصريف ---------- */
  var PRON_D = ['je', 'tu', 'il / elle', 'nous', 'vous', 'ils / elles'];
  var PRON_S = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

  function pronForm(i, form, sub, forSpeech) {
    var pr = forSpeech ? PRON_S[i] : PRON_D[i];
    var vowel = /^[aeiouyh\u00E0\u00E2\u00E4\u00E9\u00E8\u00EA\u00EB\u00EE\u00EF\u00F4\u00F6\u00F9\u00FB\u00FC]/i.test(form);
    if (i === 0) {
      if (sub) return (vowel ? "que j'" : 'que je ') + form;
      return (vowel ? "j'" : 'je ') + form;
    }
    if (sub) {
      if (i === 2) return forSpeech ? "qu'il " + form : "qu'il / elle " + form;
      if (i === 5) return forSpeech ? "qu'ils " + form : "qu'ils / elles " + form;
      return 'que ' + pr + ' ' + form;
    }
    return pr + ' ' + form;
  }

  function conjHTML(c) {
    var h = '<details class="node d0"><summary>' + esc(c.verb) + ' <small>' + esc(c.group_ar || '') + '</small></summary><div class="inner">';
    (c.tenses || []).forEach(function (t) {
      var sub = /subjonctif/i.test(t.name_fr || '');
      h += '<table class="gtable"><caption dir="ltr">' + esc(t.name_fr || '') + '</caption>';
      (t.forms || []).forEach(function (f, i) {
        h += '<tr><td dir="ltr">' + esc(pronForm(i, f, sub, false)) + '</td><td>' + sayFr(pronForm(i, f, sub, true)) + '</td></tr>';
      });
      h += '</table>';
    });
    h += '</div></details>';
    return h;
  }

  var LEVEL_NAMES = { '1sec': '1 ثانوي', '2sec': '2 ثانوي', '3sec': '3 ثانوي' };

  function renderGrammar(rules, conj) {
    var el = bodyOf('grammar');
    if (!el) return;
    conj = conj || [];
    if ((!rules || !rules.length) && !conj.length) {
      var why;
      if (DATA.grammar) {
        why = 'تم تحميل الملف لكن لم أجد قواعد بداخله. المفاتيح الرئيسية: ' + Object.keys(DATA.grammar).join(', ');
        emptyMsg(el, esc(why));
      } else {
        var logs = LOADLOG.filter(function (l) { return l.indexOf('grammar.json') === 0; });
        why = '<div>تعذّر تحميل ./data/grammar.json</div>' +
          (logs.length
            ? '<div dir="ltr" style="text-align:left;font-size:.8rem;margin-top:8px;word-break:break-all;">' + logs.map(esc).join('<br>') + '</div>'
            : '<div>سبب غير معروف</div>');
        emptyMsg(el, why);
      }
      return;
    }
    rules = rules || [];

    var items = rules.map(function (r) {
      return { r: r, hay: norm(JSON.stringify(r)) };
    });
    var levels = [];
    rules.forEach(function (r) {
      if (r._level && levels.indexOf(r._level) === -1) levels.push(r._level);
    });

    var tabsHtml = '<button type="button" class="tab on" data-lv="all">الكل</button>' +
      levels.map(function (l) {
        return '<button type="button" class="tab" data-lv="' + esc(l) + '">' + esc(LEVEL_NAMES[l] || l) + '</button>';
      }).join('') +
      (conj.length ? '<button type="button" class="tab" data-lv="conj">التصريف</button>' : '');

    el.innerHTML =
      '<div class="tools">' +
        '<input type="search" class="search g-search" placeholder="🔎 ابحث في القواعد..." aria-label="بحث">' +
        '<button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>' +
      '</div>' +
      '<div class="tabs g-tabs">' + tabsHtml + '</div>' +
      '<div class="count"></div>' +
      '<div class="g-area"></div>';

    var search = $('.g-search', el);
    var area = $('.g-area', el);
    var cnt = $('.count', el);
    var cur = 'all';

    function draw() {
      var q = norm(search.value);
      if (cur === 'conj') {
        var cl = conj.filter(function (c) { return !q || norm(c.verb).indexOf(q) !== -1; });
        cnt.textContent = cl.length + ' فعل';
        area.innerHTML = cl.length ? '<div class="card">' + cl.map(conjHTML).join('') + '</div>' : '<div class="empty">لا توجد نتائج.</div>';
        return;
      }
      var list = items.filter(function (it) {
        var lvOk = (cur === 'all') || it.r._level === cur;
        return lvOk && (!q || it.hay.indexOf(q) !== -1);
      });
      cnt.textContent = list.length + ' قاعدة';
      area.innerHTML = list.length ? list.map(function (it) { return grammarCard(it.r); }).join('') : '<div class="empty">لا توجد نتائج.</div>';
    }

    $('.g-tabs', el).addEventListener('click', function (ev) {
      var b = ev.target.closest('.tab');
      if (!b) return;
      $$('.g-tabs .tab', el).forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      cur = b.getAttribute('data-lv');
      draw();
    });
    search.addEventListener('input', draw);
    $('.btn-toggle-ar', el).addEventListener('click', function () {
      el.classList.toggle('ar-hidden');
    });
    draw();
  }

  /* ---------- القاموس: بدون meta ولا الرموز الصوتية ---------- */
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

  // كلمة صالحة للقاموس: فرنسية صافية (لا رموز IPA ولا عربية) ومعناها عربي
  function validWord(f, a) {
    if (!f || !a) return false;
    f = f.trim();
    if (f.length > 60) return false;
    if (hasArabic(f)) return false;
    if (IPA_RE.test(f)) return false;
    if (/^\/.*\/$/.test(f)) return false;
    return hasArabic(a);
  }

  // أزواج الكائنات التي فيها fr وar، مع تجاهل meta وphonetic تماماً
  function pairsFrom(root) {
    var out = [];
    if (!root) return out;
    walkObjs(root, function (o) {
      var f = firstString(o, FR_K);
      var a = firstString(o, AR_K);
      if (validWord(f, a)) {
        out.push({ fr: f.trim(), ar: a.trim(), ex: o.example || o.exemple || '' });
      }
    }, null, SKIP_KEYS);
    return out;
  }

  // مفردات الوحدات: vocabulary = { فئة: [[فرنسي، عربي], ...] }
  function vocabPairs(root) {
    var out = [];
    if (!root) return out;
    walkObjs(root, function (o) {
      var v = o.vocabulary;
      if (!v || typeof v !== 'object' || Array.isArray(v)) return;
      Object.keys(v).forEach(function (cat) {
        var arr = v[cat];
        if (!Array.isArray(arr)) return;
        arr.forEach(function (p) {
          if (Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string' && validWord(p[0], p[1])) {
            out.push({ fr: p[0].trim(), ar: p[1].trim(), ex: '' });
          }
        });
      });
    }, null, SKIP_KEYS);
    return out;
  }

  function mountDictionary() {
    var el = bodyOf('dictionary');
    if (!el) return;
    var words = vocabPairs(DATA.curriculum)
      .concat(pairsFrom(DATA.curriculum))
      .concat(pairsFrom(DATA.dialogues));
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
          speakBtn(w.fr) +
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
      if (out.length >= 12 || k === '_level' || k === 'id' || k === 'exercises' ||
          k === 'meta' || k === 'phonetic' || k === TITLE_KEYS[0] || k === TITLE_KEYS[1]) return;
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
      }, null, SKIP_KEYS);
    });
    (DATA.conjugations || []).forEach(function (c) {
      var lines = (c.tenses || []).map(function (t) {
        return t.name_fr + ': ' + (t.forms || []).join(', ');
      });
      if (!lines.length) return;
      var title = 'تصريف ' + c.verb;
      INDEX.push({
        src: 'التصريف', title: title, lines: lines,
        th: norm(title), hay: norm(title + ' ' + lines.join(' '))
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
      // الصوت للأسطر الفرنسية الصافية فقط
      var frLines = e.lines.filter(function (l) { return frText(l); }).slice(0, 3);
      var say = frLines.join('. ');
      return '<div class="ans"><div class="ans-h">📘 ' + esc(e.title) + ' <small>(' + e.src + ')</small>' + (say ? speakBtn(say) : '') + '</div><ul>' +
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

  /* ---------- PWA: إلغاء الـ service worker القديم ومسح مخزنه ---------- */
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
      if (window.caches) {
        caches.keys().then(function (ks) {
          ks.forEach(function (k) { caches.delete(k); });
        }).catch(function () {});
      }
    }
  }

  /* ---------- النقرات العامة ---------- */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.spk');
    if (s) {
      if (s.closest('summary')) e.preventDefault();
      speak(decodeURIComponent(s.dataset.say || ''), 'fr-FR', s);
      return;
    }
    var opt = e.target.closest('.opt');
    if (opt) { answerChoice(opt); return; }
    var chk = e.target.closest('.chk');
    if (chk) { answerText(chk); return; }
    var rs = e.target.closest('.reset-ex');
    if (rs) { resetCard(rs); return; }
    var n = e.target.closest('[data-nav]');
    if (n) go(n.dataset.nav);
    if (e.target.closest('#menu-btn')) document.body.classList.toggle('menu-open');
    if (e.target.id === 'scrim') document.body.classList.remove('menu-open');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('exo-in')) {
      var exo = e.target.closest('.exo');
      var c = exo ? $('.chk', exo) : null;
      if (c) answerText(c);
    }
  });

  /* ---------- التشغيل ---------- */
  function start() {
    safe('install', setupInstall);
    safe('chat', mountChat);
    safe('nav', function () { go((location.hash || '').replace('#', '') || 'lessons'); });

    loadAllData().then(function () {
      safe('lessons', function () {
        mountGeneric('lessons', DATA.curriculum, { extraTabs: [buildMiniDictTab()] });
      });
      safe('phonetics', function () {
        mountGeneric('phonetics', DATA.phonetics, { renderNode: renderPhoneticsNode });
      });
      safe('exams', function () { mountGeneric('exams', DATA.exams); });
      safe('dictionary', mountDictionary);
      safe('dialogues', function () {
        mountGeneric('dialogues', DATA.dialogues, { arToggle: true });
      });
      safe('tales', function () {
        mountGeneric('tales', DATA.stories, { arToggle: true });
      });
      safe('songs', mountSongs);
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
