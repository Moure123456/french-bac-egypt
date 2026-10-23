/* =====================================================================
   Le Français Au Bac — app.js
   - يعمل بالمسارات النسبية ./data/*.json (لا يحتاج أي أوامر خادم محلي)
   - الصوت المحلي عبر Web Speech API (فرنسي + عربي)
   - الأغاني، القواعد (مع استخراج تلقائي من المنهج)، حجب كروت meta
   ===================================================================== */
(() => {
  'use strict';

  /* ---------- أدوات عامة ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  const AR_RE = /[\u0600-\u06FF]/;
  const isObj = (v) => v !== null && typeof v === 'object';
  const hasVal = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length);
  const pick = (o, ...keys) => { for (const k of keys) if (o && hasVal(o[k])) return o[k]; return undefined; };
  const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ---------- حجب كروت meta والملاحظات الإدارية ---------- */
  const META_KEY_RE = /^_?(meta|metadata|admin|admin_?notes?|notes?_?admin|internal|internal_?notes?|_?comment|_?comments|readme|schema|version|generated_?by)$/i;
  const isMetaKey = (k) => META_KEY_RE.test(String(k));
  const isMetaItem = (x) => isObj(x) && !Array.isArray(x) &&
    ['type', 'id', 'name', 'key', 'title', 'section', 'kind']
      .some((k) => typeof x[k] === 'string' && /^_?meta(data)?$/i.test(x[k].trim()));

  function clean(node) {
    if (Array.isArray(node)) return node.filter((x) => !isMetaItem(x)).map(clean);
    if (isObj(node)) {
      const out = {};
      for (const [k, v] of Object.entries(node)) if (!isMetaKey(k)) out[k] = clean(v);
      return out;
    }
    return node;
  }

  function unwrap(data) {
    let d = data, guard = 0;
    while (isObj(d) && !Array.isArray(d) && guard++ < 4) {
      const keys = Object.keys(d);
      if (keys.length === 1 && isObj(d[keys[0]])) { d = d[keys[0]]; continue; }
      const arrKeys = keys.filter((k) => Array.isArray(d[k]));
      if (arrKeys.length === 1 && keys.every((k) => k === arrKeys[0] || !isObj(d[k]))) { d = d[arrKeys[0]]; continue; }
      break;
    }
    return d;
  }

  /* ---------- تحميل البيانات (مسارات نسبية) ---------- */
  const CACHE = {};
  async function loadJSON(name, alts = []) {
    if (name in CACHE) return CACHE[name];
    const files = [name, ...alts];
    for (const f of files) {
      try {
        const res = await fetch(`./data/${f}.json`, { cache: 'no-cache' });
        if (res.ok) { return (CACHE[name] = clean(await res.json())); }
      } catch (_) { /* جرّب المسار التالي */ }
    }
    const embedded = window.APP_DATA && (window.APP_DATA[name] || alts.map((a) => window.APP_DATA[a]).find(Boolean));
    return (CACHE[name] = embedded ? clean(embedded) : null);
  }

  /* =====================================================================
     الصوت المحلي (Web Speech API)
     ===================================================================== */
  const TTS = { voices: [] };
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

  function refreshVoices() { if (synth) TTS.voices = synth.getVoices() || []; }
  if (synth) {
    refreshVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', refreshVoices);
    else synth.onvoiceschanged = refreshVoices;
  }

  function pickVoice(lang) {
    const base = lang.slice(0, 2).toLowerCase();
    const same = (v) => v.lang.replace('_', '-').toLowerCase();
    return TTS.voices.find((v) => same(v) === lang.toLowerCase()) ||
           TTS.voices.find((v) => same(v).startsWith(base));
  }

  function chunkText(text, max = 170) {
    const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?؟…\n]+[.!?؟…]*/g) || [String(text)];
    const out = []; let cur = '';
    for (const p of parts) {
      if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; }
      cur += p + ' ';
    }
    if (cur.trim()) out.push(cur.trim());
    return out.flatMap((c) => c.length > max ? c.match(new RegExp(`.{1,${max}}(\\s|$)`, 'g')) : [c]);
  }

  function speak(text, lang = 'fr-FR', rate = 0.9) {
    if (!synth) { toast('المتصفح لا يدعم النطق الصوتي، جرّب Chrome أو Safari'); return; }
    const clean = String(text || '').trim();
    if (!clean) return;
    refreshVoices();
    synth.cancel();
    setTimeout(() => {
      if (synth.resume) synth.resume();
      const voice = pickVoice(lang);
      if (!voice && lang.startsWith('fr')) toast('لم يتم العثور على صوت فرنسي على الجهاز، سيتم استخدام الصوت الافتراضي');
      chunkText(clean).forEach((c) => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = lang; u.rate = rate; u.pitch = 1; u.volume = 1;
        if (voice) u.voice = voice;
        synth.speak(u);
      });
    }, 60);
  }

  // فتح الصوت على iOS/Safari عند أول لمسة
  document.addEventListener('pointerdown', function unlock() {
    if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); }
    document.removeEventListener('pointerdown', unlock);
  }, { once: true });

  const speakBtn = (text, lang = 'fr-FR') =>
    `<button class="speak-btn" type="button" data-speak="${esc(text)}" data-lang="${lang}" title="استمع">🔊</button>`;

  /* =====================================================================
     عارض عام للبيانات (يتكيّف مع أي شكل JSON)
     ===================================================================== */
  const CTX = { solutions: false };
  const TITLE_KEYS = ['title', 'titre', 'title_fr', 'name', 'lesson', 'unit', 'heading', 'topic', 'label', 'rule_title'];
  const TITLE_AR_KEYS = ['title_ar', 'titleAr', 'arabic_title', 'titre_ar', 'name_ar'];
  const PAIR_FR = ['fr', 'french', 'francais', 'français', 'text_fr', 'word', 'mot', 'text', 'phrase', 'line'];
  const PAIR_AR = ['ar', 'arabic', 'arabe', 'text_ar', 'translation', 'traduction', 'meaning', 'translation_ar'];
  const SPEAKER_KEYS = ['speaker', 'role', 'personnage', 'who'];
  const LABELS = {
    explanation: 'الشرح', examples: 'أمثلة', example: 'مثال', exercises: 'تمارين', rule: 'القاعدة', rules: 'القواعد',
    answer: 'الإجابة', model_answer: 'الإجابة النموذجية', question: 'السؤال', questions: 'الأسئلة', level: 'المستوى',
    text: 'النص', translation: 'الترجمة', vocabulary: 'المفردات', conjugation: 'التصريف', note: 'ملاحظة', notes: 'ملاحظات',
    tip: 'نصيحة', sounds: 'الأصوات', pronunciation: 'النطق', description: 'الوصف'
  };
  const SOLUTION_KEY_RE = /(interactive|explication|explanation_ar|why|شرح)/i;

  function line(s) {
    const str = String(s);
    const ar = AR_RE.test(str);
    return `<p class="line" dir="auto"><span class="t">${esc(str)}</span>${!ar && str.trim().length > 1 ? ' ' + speakBtn(str) : ''}</p>`;
  }

  function matcher(o) {
    const opts = o.options || o.choices || [];
    const ans = pick(o, 'answer', 'correct', 'correctAnswer', 'correct_answer', 'réponse', 'solution');
    return (opt, i) => {
      if (typeof ans === 'number') return (ans >= opts.length ? i + 1 === ans : i === ans);
      if (typeof ans === 'string') {
        if (/^[A-Da-d]$/.test(ans.trim()) && !opts.some((x) => norm(x) === norm(ans))) return 'abcd'.indexOf(ans.trim().toLowerCase()) === i;
        return norm(opt) === norm(ans);
      }
      return false;
    };
  }
  const isQuiz = (o) => (o.question || o.q) && Array.isArray(o.options || o.choices);

  function renderQuiz(o) {
    const q = o.question || o.q;
    const opts = o.options || o.choices;
    const f = matcher(o);
    const expl = pick(o, 'explanation', 'explication', 'why', 'rationale', 'شرح');
    return `<div class="quiz"><p class="q" dir="auto">${esc(q)} ${AR_RE.test(q) ? '' : speakBtn(q)}</p>
      <div class="opts">${opts.map((op, i) => `<button type="button" class="opt" data-ok="${f(op, i) ? 1 : 0}">${esc(op)}</button>`).join('')}</div>
      ${expl ? `<div class="explain" hidden>${renderAny(expl, 3)}</div>` : ''}</div>`;
  }

  function renderPair(o, frKey, arKey, keys) {
    const sp = SPEAKER_KEYS.find((k) => typeof o[k] === 'string');
    const extra = keys.filter((k) => ![frKey, arKey, sp].includes(k)).map((k) => `<small class="extra">${esc(LABELS[k] || k)}: ${esc(o[k])}</small>`).join(' ');
    return `<div class="pair">
      <div class="fr" dir="auto">${sp ? `<b class="spk">${esc(o[sp])}:</b> ` : ''}<span class="t">${esc(o[frKey])}</span> ${speakBtn(o[frKey])}</div>
      <div class="ar-tr" dir="rtl">${esc(o[arKey])}</div>${extra}</div>`;
  }

  function renderAny(v, depth = 0) {
    if (!hasVal(v)) return '';
    if (!isObj(v)) return line(v);
    if (Array.isArray(v)) {
      const items = v.filter((x) => !isMetaItem(x));
      if (items.every((x) => !isObj(x))) return `<ul class="plain">${items.map((x) => `<li>${line(x)}</li>`).join('')}</ul>`;
      return items.map((x, i) => renderCard(x, depth + 1, i)).join('');
    }
    return renderCard(v, depth, 0);
  }

  function renderCard(o, depth, i = 0) {
    if (!isObj(o)) return line(o);
    if (Array.isArray(o)) return renderAny(o, depth + 1);
    if (isQuiz(o)) return renderQuiz(o);

    const keys = Object.keys(o).filter((k) => !isMetaKey(k) && hasVal(o[k]));
    const flat = keys.every((k) => !isObj(o[k]));
    const titleKey = TITLE_KEYS.find((k) => typeof o[k] === 'string' && o[k]);
    const frKey = PAIR_FR.find((k) => typeof o[k] === 'string');
    const arKey = PAIR_AR.find((k) => typeof o[k] === 'string');
    if (!titleKey && frKey && arKey && flat) return renderPair(o, frKey, arKey, keys);

    const titleArKey = TITLE_AR_KEYS.find((k) => typeof o[k] === 'string' && o[k]);
    const title = titleKey ? o[titleKey] : '';
    const titleAr = titleArKey ? o[titleArKey] : '';
    const body = keys.filter((k) => k !== titleKey && k !== titleArKey).map((k) => {
      const label = LABELS[k] || (/^\d+$/.test(k) ? '' : k);
      const val = o[k];
      if (CTX.solutions && SOLUTION_KEY_RE.test(k)) {
        return `<div class="field"><button type="button" class="btn small" data-toggle>عرض الشرح التفاعلي للحل</button><div class="hidden-box" hidden>${renderAny(val, depth + 1)}</div></div>`;
      }
      return `<div class="field">${label ? `<h5>${esc(label)}</h5>` : ''}${renderAny(val, depth + 1)}</div>`;
    }).join('');

    const head = title || titleAr || `#${i + 1}`;
    return `<details class="node d${Math.min(depth, 3)}"${depth === 0 ? ' open' : ''}>
      <summary><span class="t" dir="auto">${esc(head)}</span>${titleAr && title ? `<span class="t-ar"> — ${esc(titleAr)}</span>` : ''}
      <button type="button" class="btn small listen" data-listen>🔊 استمع للدرس</button></summary>${body}</details>`;
  }

  function renderRoot(data) {
    data = unwrap(data);
    if (Array.isArray(data)) return renderAny(data, 0);
    if (isObj(data)) {
      return Object.entries(data).filter(([k, v]) => !isMetaKey(k) && hasVal(v)).map(([k, v]) =>
        `<details class="node year" open><summary><span class="t">${esc(k)}</span></summary>${renderAny(v, 1)}</details>`).join('');
    }
    return renderAny(data);
  }

  const emptyMsg = 'سيتم إضافة المحتوى قريباً بإذن الله.';

  /* =====================================================================
     الأقسام
     ===================================================================== */

  /* ---- دروس الكتاب والحلول ---- */
  async function initLessons() {
    const data = await loadJSON('curriculum');
    CTX.solutions = true;
    $('#lessonsBox').innerHTML = data ? renderRoot(data) : `<p class="empty">${emptyMsg}</p>`;
    CTX.solutions = false;
  }

  /* ---- القواعد: grammar.json ثم الاستخراج التلقائي من المنهج ---- */
  const BUILTIN_GRAMMAR = [
    { title: 'Le présent — être / avoir (يكون / يملك)', explanation: 'الفعلان الأساسيان في الفرنسية ويستخدمان في تكوين الأزمنة المركبة.',
      examples: [{ fr: 'Je suis étudiant.', ar: 'أنا طالب.' }, { fr: "Nous avons un examen demain.", ar: 'لدينا امتحان غدًا.' }] },
    { title: 'Les articles (أدوات التعريف والتنكير)', explanation: 'le / la / les للمعرّف، un / une / des للمنكّر.',
      examples: [{ fr: 'Le livre est sur la table.', ar: 'الكتاب على الطاولة.' }, { fr: 'Une fille et des garçons.', ar: 'بنت وأولاد.' }] },
    { title: 'La négation (النفي)', explanation: 'ne + فعل + pas.',
      examples: [{ fr: 'Je ne parle pas arabe.', ar: 'أنا لا أتحدث العربية.' }] }
  ];

  function collectGrammar(node, out = [], seen = new Set(), ctxTitle = '') {
    if (Array.isArray(node)) { node.forEach((n) => collectGrammar(n, out, seen, ctxTitle)); return out; }
    if (!isObj(node)) return out;
    const t = pick(node, ...TITLE_KEYS, ...TITLE_AR_KEYS) || ctxTitle;
    for (const [k, v] of Object.entries(node)) {
      if (/gramm|rule|règle|regle|قاعد/i.test(k) && hasVal(v)) {
        const sig = JSON.stringify(v).slice(0, 200);
        if (!seen.has(sig)) { seen.add(sig); out.push({ title: typeof t === 'string' && t ? t : String(k), content: v }); }
      } else if (isObj(v)) collectGrammar(v, out, seen, typeof t === 'string' ? t : ctxTitle);
    }
    return out;
  }

  async function initGrammar() {
    let data = await loadJSON('grammar');
    let html = data ? renderRoot(data) : '';
    if (!html.trim()) {
      const curr = await loadJSON('curriculum');
      const found = curr ? collectGrammar(curr) : [];
      html = renderAny(found.length ? found : BUILTIN_GRAMMAR, 0);
    }
    $('#grammarBox').innerHTML = html;
  }

  /* ---- الصوتيات ---- */
  async function initPhonetics() {
    const data = await loadJSON('phonetics');
    $('#phoneticsBox').innerHTML = data ? renderRoot(data) : `<p class="empty">${emptyMsg}</p>`;
  }

  /* ---- القاموس المصغر ---- */
  function flattenDict(node, out = []) {
    if (Array.isArray(node)) { node.forEach((n) => flattenDict(n, out)); return out; }
    if (!isObj(node)) return out;
    const fr = PAIR_FR.find((k) => typeof node[k] === 'string');
    const ar = PAIR_AR.find((k) => typeof node[k] === 'string');
    if (fr && ar) { out.push({ fr: node[fr], ar: node[ar], extra: pick(node, 'pron', 'phonetic', 'type', 'pos') }); return out; }
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') out.push({ fr: k, ar: v });
      else flattenDict(v, out);
    }
    return out;
  }

  async function initDictionary() {
    const data = await loadJSON('dictionary');
    const rows = data ? flattenDict(unwrap(data)) : [];
    const box = $('#dictionaryBox');
    if (!rows.length) { box.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    const draw = (q = '') => {
      const n = norm(q);
      const list = rows.filter((r) => !n || norm(r.fr).includes(n) || norm(r.ar).includes(n));
      box.innerHTML = list.length
        ? `<div class="dict-grid">${list.map((r) => `<div class="dict-row"><span class="fr" dir="ltr">${esc(r.fr)}</span> ${speakBtn(r.fr)}
            <span class="ar" dir="rtl">${esc(r.ar)}</span>${r.extra ? `<small>${esc(r.extra)}</small>` : ''}</div>`).join('')}</div>`
        : '<p class="empty">لا توجد نتائج مطابقة.</p>';
    };
    draw();
    $('#dictSearch').addEventListener('input', (e) => draw(e.target.value));
  }

  /* ---- المحادثات والقصص ---- */
  async function initDialogues() {
    const data = await loadJSON('dialogues');
    $('#dialoguesBox').innerHTML = data ? renderRoot(data) : `<p class="empty">${emptyMsg}</p>`;
  }
  async function initTales() {
    const data = await loadJSON('stories', ['tales', 'contes']);
    $('#talesBox').innerHTML = data ? renderRoot(data) : `<p class="empty">${emptyMsg}</p>`;
  }

  /* ---- الأغاني: ./data/songs.json ---- */
  function toLines(v) {
    if (typeof v === 'string') return v.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (Array.isArray(v)) return v.flatMap((x) => (typeof x === 'string' ? [x] : isObj(x) ? [x] : []));
    return [];
  }

  function normSong(s, i) {
    const title = pick(s, 'title', 'title_fr', 'titre', 'name', 'titleFr') || `Chanson ${i + 1}`;
    const titleAr = pick(s, 'title_ar', 'titleAr', 'arabic_title', 'titre_ar');
    let frLines = [];
    const rawFr = pick(s, 'lyrics', 'lines', 'verses', 'paroles', 'text', 'content', 'fr');
    const flat = [];
    (Array.isArray(rawFr) ? rawFr : toLines(rawFr)).forEach((x) => {
      if (isObj(x) && Array.isArray(x.lines || x.verses)) toLines(x.lines || x.verses).forEach((y) => flat.push(y));
      else flat.push(x);
    });
    frLines = flat.map((x) => (isObj(x)
      ? { fr: pick(x, 'fr', 'french', 'text', 'line', 'text_fr') || '', ar: pick(x, 'ar', 'arabic', 'translation', 'text_ar', 'translation_ar') || '' }
      : { fr: String(x), ar: '' }));
    const trRaw = pick(s, 'translation_ar', 'translation', 'arabic', 'traduction', 'lyrics_ar', 'ar');
    if (trRaw && frLines.some((l) => !l.ar)) {
      const tr = toLines(trRaw).map((x) => (isObj(x) ? pick(x, 'ar', 'arabic', 'text') || '' : x));
      frLines.forEach((l, idx) => { if (!l.ar && tr[idx]) l.ar = tr[idx]; });
    }
    return { title, titleAr, lines: frLines.filter((l) => l.fr), level: pick(s, 'level', 'niveau'), note: pick(s, 'description', 'theme') };
  }

  async function initSongs() {
    const data = await loadJSON('songs', ['chansons']);
    const box = $('#songsBox');
    let list = data ? unwrap(data) : null;
    if (isObj(list) && !Array.isArray(list)) list = Object.values(list).filter(isObj);
    list = (Array.isArray(list) ? list : []).filter((s) => isObj(s) && !isMetaItem(s)).map(normSong).filter((s) => s.lines.length);
    if (!list.length) { box.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    box.innerHTML = `<p class="muted">عدد الأغاني: ${list.length}</p>` + list.map((s, i) => {
      const full = s.lines.map((l) => l.fr).join('. ');
      return `<details class="node song"><summary><span class="t">${i + 1}. ${esc(s.title)}</span>${s.titleAr ? `<span class="t-ar"> — ${esc(s.titleAr)}</span>` : ''}</summary>
        ${s.level ? `<small class="muted">${esc(s.level)}</small>` : ''}
        <button type="button" class="btn small" data-speak="${esc(full)}" data-lang="fr-FR">🔊 استمع للأغنية كاملة</button>
        <div class="song-lines">${s.lines.map((l) => `<div class="pair"><div class="fr" dir="ltr">${esc(l.fr)} ${speakBtn(l.fr)}</div>
          ${l.ar ? `<div class="ar-tr" dir="rtl">${esc(l.ar)}</div>` : ''}</div>`).join('')}</div></details>`;
    }).join('');
  }

  /* ---- امتحانات الثانوية العامة ---- */
  const EXAM = { timer: null, questions: [] };

  function examList(data) {
    let d = unwrap(data);
    if (isObj(d) && !Array.isArray(d)) d = Object.values(d).filter(isObj);
    return Array.isArray(d) ? d.filter((x) => isObj(x) && !isMetaItem(x)) : [];
  }

  async function initExams() {
    const data = await loadJSON('exams');
    const box = $('#examsBox');
    const exams = data ? examList(data) : [];
    if (!exams.length) { box.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    box.innerHTML = '<div class="exam-list">' + exams.map((e, i) => `<button type="button" class="btn primary" data-exam="${i}">
      ${esc(pick(e, 'title', 'titre', 'name') || 'Examen ' + (i + 1))}</button>`).join('') + '</div><div id="examArea"></div>';
    box.onclick = (ev) => {
      const b = ev.target.closest('[data-exam]');
      if (b) startExam(exams[+b.dataset.exam]);
    };
  }

  function walkExam(node, depth = 0) {
    if (Array.isArray(node)) return node.filter((x) => !isMetaItem(x)).map((n) => walkExam(n, depth + 1)).join('');
    if (!isObj(node)) return node === '' || node == null ? '' : line(node);
    if ((node.question || node.q) && !isMetaItem(node)) {
      const idx = EXAM.questions.length; EXAM.questions.push(node);
      const q = node.question || node.q;
      const opts = node.options || node.choices;
      return `<div class="exam-q" data-i="${idx}"><p class="q" dir="auto"><b>${idx + 1}.</b> ${esc(q)} ${AR_RE.test(q) ? '' : speakBtn(q)}</p>
        ${Array.isArray(opts)
          ? opts.map((op, k) => `<label class="exam-opt"><input type="radio" name="q${idx}" value="${k}"> <span dir="auto">${esc(op)}</span></label>`).join('')
          : `<textarea class="open-ans" rows="3" placeholder="اكتب إجابتك..."></textarea>`}
        <div class="exam-fb" hidden></div></div>`;
    }
    return Object.entries(node).filter(([k, v]) => !isMetaKey(k) && hasVal(v) && !/^(duration|time|minutes|id)$/i.test(k)).map(([k, v]) => {
      if (typeof v === 'string') {
        const isHead = TITLE_KEYS.includes(k) || TITLE_AR_KEYS.includes(k);
        return isHead ? `<h4 dir="auto">${esc(v)}</h4>` : `<div class="passage">${LABELS[k] ? `<h5>${esc(LABELS[k])}</h5>` : ''}${line(v)}</div>`;
      }
      return walkExam(v, depth + 1);
    }).join('');
  }

  function startExam(exam) {
    clearInterval(EXAM.timer);
    EXAM.questions = [];
    const area = $('#examArea');
    const body = walkExam(exam);
    const minutes = Number(pick(exam, 'duration', 'time', 'minutes')) || 60;
    area.innerHTML = `<div class="exam-bar"><span>⏱️ الوقت المتبقي: <b id="examClock"></b></span>
      <button type="button" class="btn primary" id="examFinish">إنهاء وتصحيح ✅</button></div>
      <div class="exam-body">${body}</div><div id="examResult"></div>`;
    area.scrollIntoView({ behavior: 'smooth' });
    let left = minutes * 60;
    const clock = $('#examClock');
    const tick = () => {
      const m = String(Math.floor(left / 60)).padStart(2, '0'), s = String(left % 60).padStart(2, '0');
      clock.textContent = `${m}:${s}`;
      if (left-- <= 0) { clearInterval(EXAM.timer); finishExam(); }
    };
    tick(); EXAM.timer = setInterval(tick, 1000);
    $('#examFinish').onclick = finishExam;
  }

  function finishExam() {
    clearInterval(EXAM.timer);
    let total = 0, correct = 0; const report = [];
    EXAM.questions.forEach((q, idx) => {
      const holder = $(`.exam-q[data-i="${idx}"]`);
      if (!holder) return;
      const fb = $('.exam-fb', holder);
      const opts = q.options || q.choices;
      const expl = pick(q, 'explanation', 'explication', 'why', 'rationale');
      if (Array.isArray(opts)) {
        total++;
        const f = matcher(q);
        const chosen = $(`input[name="q${idx}"]:checked`, holder);
        const ci = opts.findIndex((o, k) => f(o, k));
        const ok = chosen && +chosen.value === ci;
        if (ok) correct++;
        else report.push(`<li><b>سؤال ${idx + 1}:</b> الإجابة الصحيحة: <span dir="auto">${esc(opts[ci] ?? '—')}</span></li>`);
        fb.className = 'exam-fb ' + (ok ? 'ok' : 'bad');
        fb.innerHTML = (ok ? '✅ إجابة صحيحة' : `❌ الإجابة الصحيحة: <b dir="auto">${esc(opts[ci] ?? '—')}</b>`) + (expl ? `<div>${renderAny(expl, 3)}</div>` : '');
      } else {
        const model = pick(q, 'model_answer', 'answer', 'solution', 'réponse');
        fb.className = 'exam-fb model';
        fb.innerHTML = `<b>الإجابة النموذجية:</b> ${model ? renderAny(model, 3) : '—'}${expl ? `<div>${renderAny(expl, 3)}</div>` : ''}`;
      }
      fb.hidden = false;
      $$('input', holder).forEach((i) => { i.disabled = true; });
    });
    const pct = total ? Math.round((correct / total) * 100) : 0;
    $('#examResult').innerHTML = `<div class="result-card"><h3>النتيجة النهائية: ${correct} / ${total} (${pct}%)</h3>
      ${report.length ? `<h4>تقرير الأخطاء</h4><ul>${report.join('')}</ul>` : '<p>🎉 ممتاز! لا توجد أخطاء في الأسئلة الاختيارية.</p>'}
      <small class="muted">الأسئلة المقالية: قارن إجابتك بالإجابة النموذجية الظاهرة أسفل كل سؤال.</small></div>`;
    $('#examResult').scrollIntoView({ behavior: 'smooth' });
    const btn = $('#examFinish'); if (btn) btn.disabled = true;
  }

  /* ---- المساعد الذكي (دردشة) ---- */
  const CHAT = { history: [] };
  const SYSTEM_PROMPT = 'You are an expert French language teacher for Egyptian Thanaweya Amma students. ' +
    'Answer in clear, simple Arabic (the student may write Arabic or French), give French examples with Arabic translation, ' +
    'explain grammar rules step by step, correct mistakes kindly, and keep answers concise.';

  function initAssistant() {
    const keyEl = $('#aiKey'), provEl = $('#aiProvider');
    try {
      keyEl.value = localStorage.getItem('lfab_key') || '';
      provEl.value = localStorage.getItem('lfab_provider') || 'gemini';
    } catch (_) { /* التخزين غير متاح */ }
    $('#aiSaveKey').onclick = () => {
      try { localStorage.setItem('lfab_key', keyEl.value.trim()); localStorage.setItem('lfab_provider', provEl.value); toast('تم حفظ المفتاح على جهازك فقط'); }
      catch (_) { toast('تعذر حفظ المفتاح'); }
    };
    $('#chatSend').onclick = sendChat;
    $('#chatText').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  }

  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = esc(text).replace(/\n/g, '<br>') + (who === 'bot' ? ' ' + speakBtn(text.replace(/[\u0600-\u06FF]+/g, ' '), 'fr-FR') : '');
    $('#chatLog').appendChild(d);
    $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
    return d;
  }

  async function sendChat() {
    const input = $('#chatText'), text = input.value.trim();
    if (!text) return;
    const key = $('#aiKey').value.trim(), provider = $('#aiProvider').value;
    if (!key) { toast('من فضلك أدخل مفتاح API أولاً'); return; }
    input.value = '';
    addMsg(text, 'user');
    CHAT.history.push({ role: 'user', text });
    const wait = addMsg('...', 'bot');
    try {
      let reply = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: CHAT.history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
          })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error?.message || res.statusText);
        reply = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...CHAT.history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))]
          })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error?.message || res.statusText);
        reply = j.choices?.[0]?.message?.content || '';
      }
      wait.remove();
      CHAT.history.push({ role: 'bot', text: reply });
      addMsg(reply || '—', 'bot');
    } catch (err) {
      wait.remove();
      CHAT.history.pop();
      addMsg('تعذر الاتصال بالمساعد: ' + err.message, 'bot');
    }
  }

  /* =====================================================================
     التنقل بين الأقسام
     ===================================================================== */
  const LOADERS = {
    lessons: initLessons, grammar: initGrammar, phonetics: initPhonetics, dictionary: initDictionary,
    dialogues: initDialogues, tales: initTales, songs: initSongs, exams: initExams, assistant: initAssistant
  };
  const loaded = {};

  function showSection(id) {
    if (!LOADERS[id]) id = 'lessons';
    $$('.section').forEach((s) => s.classList.toggle('active', s.id === 'sec-' + id));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.section === id));
    if (!loaded[id]) { loaded[id] = true; LOADERS[id](); }
    $('#sidebar').classList.remove('open');
    if (synth) synth.cancel();
    try { history.replaceState(null, '', '#' + id); } catch (_) { /* تجاهل */ }
    window.scrollTo({ top: 0 });
  }

  /* ---------- مستمعات الأحداث العامة ---------- */
  document.addEventListener('click', (e) => {
    const sp = e.target.closest('[data-speak]');
    if (sp) { e.preventDefault(); e.stopPropagation(); speak(sp.dataset.speak, sp.dataset.lang || 'fr-FR'); return; }

    const ls = e.target.closest('[data-listen]');
    if (ls) {
      e.preventDefault(); e.stopPropagation();
      const node = ls.closest('details');
      const seen = new Set(), parts = [];
      $$('[data-speak]', node).forEach((b) => { const t = b.dataset.speak; if (!seen.has(t)) { seen.add(t); parts.push(t); } });
      const text = parts.join('. ').slice(0, 2500);
      text ? speak(text, 'fr-FR') : toast('لا يوجد نص فرنسي للاستماع');
      return;
    }

    const tg = e.target.closest('[data-toggle]');
    if (tg) { const box = tg.nextElementSibling; if (box) box.hidden = !box.hidden; return; }

    const opt = e.target.closest('.quiz .opt');
    if (opt) {
      const quiz = opt.closest('.quiz');
      if (quiz.dataset.done) return;
      quiz.dataset.done = '1';
      $$('.opt', quiz).forEach((o) => { if (o.dataset.ok === '1') o.classList.add('correct'); });
      if (opt.dataset.ok !== '1') opt.classList.add('wrong');
      const ex = $('.explain', quiz); if (ex) ex.hidden = false;
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    $$('.nav-btn').forEach((b) => b.addEventListener('click', () => showSection(b.dataset.section)));
    $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#toggleArBtn').addEventListener('click', () => $('#sec-dialogues').classList.toggle('hide-ar'));

    // زر تثبيت التطبيق
    let deferred = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
    $('#installBtn').addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').hidden = true;
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }

    showSection((location.hash || '#lessons').slice(1));
  });

  /* ---------- أنماط مساندة للعناصر الجديدة (لا تتعارض مع styles.css) ---------- */
  const css = `
    .speak-btn{border:0;background:#e8f0ff;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:15px;vertical-align:middle}
    .speak-btn:active{transform:scale(.92)}
    details.node{border:1px solid #d6dff0;border-radius:12px;margin:10px 0;padding:8px 12px;background:rgba(255,255,255,.92)}
    details.node>summary{cursor:pointer;font-weight:700;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .btn.small{font-size:13px;padding:4px 10px}
    .pair{padding:6px 0;border-bottom:1px dashed #dde4f3}
    .pair .ar-tr{color:#b3262d;font-size:.95em}
    #sec-dialogues.hide-ar .ar-tr{display:none}
    .dict-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
    .dict-row{background:#fff;border:1px solid #e1e7f5;border-radius:10px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .dict-row .ar{flex-basis:100%;color:#0b3d91}
    .quiz{background:#f7f9ff;border-radius:10px;padding:10px;margin:8px 0}
    .opt{display:block;width:100%;text-align:start;margin:4px 0;padding:8px;border:1px solid #c9d4ee;border-radius:8px;background:#fff;cursor:pointer}
    .opt.correct{background:#d9f5df;border-color:#2e9e4f}.opt.wrong{background:#fde0e0;border-color:#d33}
    .exam-bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;background:#0b3d91;color:#fff;padding:8px 12px;border-radius:10px}
    .exam-q{background:#fff;border:1px solid #dde4f3;border-radius:10px;padding:10px;margin:10px 0}
    .exam-opt{display:block;padding:4px 0}.open-ans{width:100%}
    .exam-fb.ok{color:#1b7a3a}.exam-fb.bad{color:#b3262d}.exam-fb.model{color:#0b3d91}
    .result-card{background:#fffbe6;border:2px solid #f0c040;border-radius:12px;padding:12px;margin-top:12px}
    .chat-log{max-height:55vh;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:8px}
    .msg{padding:8px 12px;border-radius:12px;max-width:90%;line-height:1.7}
    .msg.user{background:#dbe8ff;align-self:flex-start}.msg.bot{background:#fff;border:1px solid #e1e7f5;align-self:flex-end}
    .chat-settings,.chat-input{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
    .chat-input textarea,.chat-settings input{flex:1;min-width:140px}
    .search-input{width:100%;padding:10px;border-radius:10px;border:1px solid #c9d4ee;margin-bottom:10px}
    .empty,.loading,.muted{color:#667}
    .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 16px;border-radius:10px;z-index:99;max-width:90vw}
    .site-footer{text-align:center;padding:16px;margin-top:20px}
    .wa-link{display:inline-block;background:#25d366;color:#fff;padding:8px 16px;border-radius:24px;text-decoration:none;font-weight:700}
  `;
  const style = document.createElement('style');
  style.id = 'extra-css';
  style.textContent = css;
  document.head.prepend(style);
})();
