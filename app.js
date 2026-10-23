/* ===== Le Français Au Bac — app.js (النسخة الكاملة، بدون grammar-builtin.js) ===== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasArabic = t => /[\u0600-\u06FF]/.test(t);
  const hasLetters = t => /[A-Za-zÀ-ÿ\u0600-\u06FF]/.test(t);
  const norm = s => String(s || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0640]/g, '')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  /* حاوية المحتوى داخل القسم (تحفظ عنوان القسم) */
  const bodyOf = id => {
    const sec = document.getElementById(id);
    return sec ? (sec.querySelector('.body') || sec) : null;
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ---------- النطق الصوتي (TTS) ---------- */
  const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  let voices = [];
  let activeBtn = null;

  function refreshVoices() { try { voices = synth.getVoices() || []; } catch (e) { voices = []; } }
  if (synth) {
    refreshVoices();
    try { synth.onvoiceschanged = refreshVoices; } catch (e) {}
  }

  function pickVoice(lang) {
    const l = lang.toLowerCase(), p = l.slice(0, 2);
    return voices.find(v => v.lang.replace('_', '-').toLowerCase() === l) ||
           voices.find(v => v.lang.toLowerCase().startsWith(p)) || null;
  }

  function clearActive() {
    if (activeBtn) { activeBtn.classList.remove('speaking'); activeBtn = null; }
  }

  function chunkText(text, max = 180) {
    const sentences = text.match(/[^.!?؟…;؛]+[.!?؟…;؛]*/g) || [text];
    const out = []; let cur = '';
    sentences.forEach(s => {
      s = s.trim(); if (!s) return;
      if ((cur + ' ' + s).length > max && cur) { out.push(cur); cur = s; }
      else cur = cur ? cur + ' ' + s : s;
    });
    if (cur) out.push(cur);
    return out;
  }

  function buildUtterances(clean, forcedLang) {
    const segs = forcedLang
      ? [clean]
      : (clean.match(/[\u0600-\u06FF\s\d.,،؟!:؛()«»\-]+|[^\u0600-\u06FF]+/g) || [clean]);
    const list = [];
    segs.forEach(seg => {
      if (!seg.trim() || !hasLetters(seg)) return;
      const lang = forcedLang || (hasArabic(seg) ? 'ar-SA' : 'fr-FR');
      chunkText(seg.trim()).forEach(part => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = lang; u.rate = lang === 'fr-FR' ? 0.9 : 0.95; u.pitch = 1; u.volume = 1;
        const v = pickVoice(lang); if (v) u.voice = v;
        list.push(u);
      });
    });
    return list;
  }

  function speak(text, lang, btn) {
    try {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { toast('المتصفح لا يدعم النطق الصوتي'); return; }
      const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      const wasBusy = synth.speaking || synth.pending;
      const sameBtn = btn && btn === activeBtn;
      synth.cancel();
      clearActive();
      if (sameBtn) return; // ضغطة ثانية = إيقاف

      const go = () => {
        try {
          const utts = buildUtterances(clean, lang);
          if (!utts.length) return;
          if (btn) { activeBtn = btn; btn.classList.add('speaking'); }
          utts.forEach((u, i) => {
            u.onerror = () => { clearActive(); try { synth.cancel(); } catch (e) {} };
            if (i === utts.length - 1) u.onend = () => clearActive();
            synth.speak(u);
          });
        } catch (e) { clearActive(); }
      };
      wasBusy ? setTimeout(go, 70) : go();
    } catch (e) {
      clearActive();
      try { synth && synth.cancel(); } catch (_) {}
    }
  }
  window.speakText = speak;
  window.addEventListener('pagehide', () => { try { synth && synth.cancel(); } catch (e) {} });

  /* ---------- جلب البيانات (مسارات نسبية مع محاولات بديلة) ---------- */
  const FILES = {
    curriculum: './data/curriculum.json', grammar: './data/grammar.json',
    phonetics: './data/phonetics.json', dictionary: './data/dictionary.json',
    dialogues: './data/dialogues.json', tales: './data/tales.json',
    stories: './data/stories.json', exams: './data/exams.json'
  };
  const DATA = {};

  async function loadJSON(url) {
    const name = url.split('/').pop();
    const base = location.pathname.replace(/[^/]*$/, '');
    const cands = [...new Set([url, 'data/' + name, name, base + 'data/' + name, base + name])];
    for (const c of cands) {
      try {
        const r = await fetch(c, { cache: 'no-cache' });
        if (!r.ok) continue;
        return await r.json();
      } catch (e) {}
    }
    return null;
  }

  async function loadAll() {
    await Promise.all(Object.entries(FILES).map(async ([k, u]) => { DATA[k] = await loadJSON(u); }));
    // عرض القواعد فور جلب البيانات
    renderGrammar(DATA.grammar);
  }

  /* ---------- أدوات مرنة لقراءة أي بنية JSON ---------- */
  const TITLE_KEYS = ['title_ar', 'title', 'title_fr', 'titre', 'name_ar', 'name', 'rule_ar', 'rule', 'topic', 'lesson', 'heading', 'question', 'word', 'fr'];
  const LABELS = {
    fr: 'Français', ar: 'عربي', translation: 'الترجمة', translation_ar: 'الترجمة',
    example: 'مثال', examples: 'أمثلة', explanation: 'الشرح', explanation_ar: 'الشرح', answer: 'الإجابة',
    question: 'السؤال', why: 'لماذا؟', rule: 'القاعدة', text: 'النص', level: 'المستوى'
  };

  function walkObjs(n, cb, seen = new Set()) {
    if (!n || typeof n !== 'object' || seen.has(n)) return;
    seen.add(n);
    if (!Array.isArray(n)) cb(n);
    (Array.isArray(n) ? n : Object.values(n)).forEach(x => walkObjs(x, cb, seen));
  }
  function findByKey(root, re) {
    let res = null;
    walkObjs(root, o => {
      if (res) return;
      for (const k of Object.keys(o)) if (re.test(k) && o[k] && typeof o[k] === 'object') { res = o[k]; return; }
    });
    return res;
  }
  function pickTitle(o) {
    const vals = TITLE_KEYS.filter(k => typeof o[k] === 'string' && o[k].trim()).slice(0, 2).map(k => o[k].trim());
    return [...new Set(vals)].join(' — ');
  }

  /* ---------- العرض العام ---------- */
  const speakBtn = t => hasLetters(String(t))
    ? `<button class="spk" type="button" data-say="${esc(encodeURIComponent(String(t)))}" aria-label="استمع">🔊</button>` : '';

  function render(n, depth = 0) {
    if (n == null || n === '') return '';
    if (typeof n !== 'object') return `<p class="line">${esc(n)}${speakBtn(n)}</p>`;
    if (Array.isArray(n)) {
      if (n.every(x => typeof x !== 'object'))
        return `<ul class="plain">${n.map(x => `<li>${esc(x)}${speakBtn(x)}</li>`).join('')}</ul>`;
      return n.map(x => render(x, depth)).join('');
    }
    const tkeys = TITLE_KEYS.filter(k => typeof n[k] === 'string' && n[k].trim()).slice(0, 2);
    const title = pickTitle(n);
    let body = '';
    Object.entries(n).forEach(([k, v]) => {
      if (tkeys.includes(k) || v == null || v === '') return;
      const label = LABELS[k] || k;
      if (typeof v !== 'object') {
        body += `<div class="kv" data-k="${esc(k)}"><b>${esc(label)}</b><span>${esc(v)}</span>${speakBtn(v)}</div>`;
      } else {
        body += `<div class="sub" data-k="${esc(k)}"><h5>${esc(label)}</h5>${render(v, depth + 1)}</div>`;
      }
    });
    if (!title) return `<div class="blk">${body}</div>`;
    return `<details class="node d${Math.min(depth, 3)}"${depth === 0 ? ' open' : ''}><summary>${esc(title)}</summary><div class="inner">${body}</div></details>`;
  }

  function topEntries(data) {
    let d = data;
    for (let i = 0; i < 2; i++) {
      if (Array.isArray(d) || !d || typeof d !== 'object') break;
      const ks = Object.keys(d);
      if (ks.length === 1 && typeof d[ks[0]] === 'object') d = d[ks[0]]; else break;
    }
    if (Array.isArray(d)) return d.map((x, i) => ({ label: (x && typeof x === 'object' && pickTitle(x)) || '#' + (i + 1), node: x }));
    if (d && typeof d === 'object') return Object.entries(d).map(([k, v]) => ({
      label: (v && typeof v === 'object' && !Array.isArray(v) && pickTitle(v)) || LABELS[k] || k, node: v
    }));
    return [{ label: '', node: d }];
  }

  function emptyMsg(el, msg) { el.innerHTML = `<div class="empty">${msg}</div>`; }

  function filterNodes(area, q) {
    const nq = norm(q);
    $$('details.node', area).forEach(d => {
      const ok = !nq || norm(d.textContent).includes(nq);
      d.style.display = ok ? '' : 'none';
      if (nq && ok) d.open = true;
    });
  }

  function mountGeneric(id, data, opts = {}) {
    const el = bodyOf(id); if (!el) return;
    if (!data) return emptyMsg(el, 'المحتوى غير متاح حالياً.');
    const entries = topEntries(data);
    const useTabs = entries.length > 1 && entries.length <= 8;
    el.innerHTML = `
      <div class="tools">
        <input type="search" class="search" placeholder="🔎 ابحث داخل القسم..." aria-label="بحث">
        ${opts.arToggle ? '<button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>' : ''}
      </div>
      ${useTabs ? '<div class="tabs"></div>' : ''}
      <div class="area"></div>`;
    const area = $('.area', el), search = $('.search', el);
    const show = i => {
      area.innerHTML = useTabs
        ? `<div class="card">${render(entries[i].node, 0)}</div>`
        : entries.map(e => `<div class="card">${render(e.node, 0)}</div>`).join('');
      if (search.value) filterNodes(area, search.value);
    };
    if (useTabs) {
      const tabs = $('.tabs', el);
      tabs.innerHTML = entries.map((e, i) => `<button type="button" class="tab${i === 0 ? ' on' : ''}" data-i="${i}">${esc(e.label)}</button>`).join('');
      tabs.addEventListener('click', ev => {
        const b = ev.target.closest('.tab'); if (!b) return;
        $$('.tab', tabs).forEach(x => x.classList.remove('on')); b.classList.add('on');
        show(+b.dataset.i);
      });
    }
    show(0);
    search.addEventListener('input', () => filterNodes(area, search.value));
    const tg = $('.btn-toggle-ar', el);
    if (tg) tg.addEventListener('click', () => el.classList.toggle('ar-hidden'));
  }

  /* ---------- القواعد: تسطيح grammar.json ثم عرض كل قاعدة في كارت ---------- */
  const RULE_TITLE = ['title_fr', 'title', 'title_ar', 'rule', 'name', 'topic'];
  const RULE_BODY = ['explanation_ar', 'explanation', 'examples', 'example'];

  function isRule(o) {
    return RULE_TITLE.some(k => typeof o[k] === 'string' && o[k].trim()) &&
           RULE_BODY.some(k => o[k] != null && o[k] !== '');
  }

  // يمشي داخل أي عمق (levels / units / rules / مصفوفات) ويجمع القواعد في مصفوفة واحدة
  function flattenGrammar(data) {
    const out = [];
    const seen = new Set();
    const visit = (node, level) => {
      if (!node || typeof node !== 'object' || seen.has(node)) return;
      seen.add(node);
      if (Array.isArray(node)) { node.forEach(x => visit(x, level)); return; }
      const lv = node.level || node.level_ar || level;
      if (isRule(node)) { out.push({ ...node, _level: node.level || level || '' }); return; }
      Object.entries(node).forEach(([k, v]) => {
        if (v && typeof v === 'object') {
          // اسم المفتاح مثل 1sec / 2sec / 3sec يُعتبر اسم المستوى
          const isLevelKey = /sec|level|niveau|مستوى|ثانوي/i.test(k) && !/^(rules|examples|levels)$/i.test(k);
          visit(v, isLevelKey ? k : lv);
        }
      });
    };
    visit(data, '');
    return out;
  }

  function renderGrammar(data) {
    const el = bodyOf('grammar'); if (!el) return;
    const rules = flattenGrammar(data);
    if (!rules.length) {
      return emptyMsg(el, 'تعذّر تحميل قواعد اللغة. تأكد من وجود الملف data/grammar.json داخل مجلد data بنفس الاسم.');
    }

    const sayBtn = t => (t && /[A-Za-zÀ-ÿ]/.test(t))
      ? `<button class="spk" type="button" data-lang="fr-FR" data-say="${esc(encodeURIComponent(String(t)))}" aria-label="استمع بالفرنسية">🔊</button>` : '';

    const exampleHTML = ex => {
      if (ex == null || ex === '') return '';
      if (typeof ex === 'string') return `<div class="ex"><div class="ex-fr" dir="ltr">${esc(ex)} ${sayBtn(ex)}</div></div>`;
      const fr = ex.fr || ex.french || ex.example || ex.text || '';
      const ar = ex.ar || ex.arabic || ex.translation || ex.translation_ar || '';
      if (!fr && !ar) return '';
      return `<div class="ex"><div class="ex-fr" dir="ltr">${esc(fr)} ${sayBtn(fr)}</div>${ar ? `<div class="ex-ar" data-k="ar">${esc(ar)}</div>` : ''}</div>`;
    };

    const cardHTML = r => {
      const tFr = r.title_fr || r.title || '';
      const tAr = r.title_ar || '';
      const expl = r.explanation_ar || r.explanation || '';
      const raw = r.examples != null ? r.examples : r.example;
      const exs = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      return `<div class="card gcard">
        <h3 class="g-title">
          ${tAr ? `<span>${esc(tAr)}</span>` : ''}
          ${tFr ? `<span class="g-fr" dir="ltr">${esc(tFr)}</span> ${sayBtn(tFr)}` : ''}
          ${r._level ? `<em class="lvl">${esc(r._level)}</em>` : ''}
        </h3>
        ${expl ? `<p class="gexp">${esc(expl)}</p>` : ''}
        ${exs.length ? `<h5 class="gh">أمثلة</h5>${exs.map(exampleHTML).join('')}` : ''}
      </div>`;
    };

    el.innerHTML = `
      <div class="tools">
        <input type="search" class="search g-search" placeholder="🔎 ابحث في القواعد..." aria-label="بحث">
        <button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>
      </div>
      <div class="count">${rules.length} قاعدة</div>
      <div class="g-area">${rules.map(cardHTML).join('')}</div>`;

    const q = el.querySelector('.g-search');
    q.addEventListener('input', () => {
      const v = norm(q.value);
      el.querySelectorAll('.gcard').forEach(c => { c.style.display = (!v || norm(c.textContent).includes(v)) ? '' : 'none'; });
    });
    el.querySelector('.btn-toggle-ar').addEventListener('click', () => el.classList.toggle('ar-hidden'));
  }

  /* ---------- القاموس (استخراج تلقائي عند غياب الملف) ---------- */
  const FR_K = ['fr', 'french', 'word', 'mot', 'francais', 'français'];
  const AR_K = ['ar', 'arabic', 'meaning', 'translation', 'translation_ar', 'arabic_meaning'];
  function pairsFrom(root) {
    const out = [];
    if (!root) return out;
    if (!Array.isArray(root) && typeof root === 'object' && Object.values(root).every(v => typeof v === 'string')) {
      Object.entries(root).forEach(([f, a]) => out.push({ fr: f, ar: a, ex: '' }));
      return out;
    }
    walkObjs(root, o => {
      const f = FR_K.map(k => o[k]).find(v => typeof v === 'string' && v.trim());
      const a = AR_K.map(k => o[k]).find(v => typeof v === 'string' && v.trim());
      if (f && a && f.length <= 60 && !hasArabic(f)) out.push({ fr: f.trim(), ar: a.trim(), ex: o.example || o.exemple || '' });
    });
    return out;
  }
  function mountDictionary() {
    const el = bodyOf('dictionary'); if (!el) return;
    let words = pairsFrom(DATA.dictionary);
    if (!words.length) words = pairsFrom(findByKey(DATA.curriculum, /dict|vocab|mots|words/i));
    if (!words.length) words = pairsFrom(findByKey(DATA.grammar, /dict|vocab|mots|words/i));
    if (!words.length) words = pairsFrom(DATA.curriculum).concat(pairsFrom(DATA.grammar));
    const seen = new Set();
    words = words.filter(w => { const k = w.fr.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
                 .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));
    if (!words.length) return emptyMsg(el, 'لا توجد كلمات متاحة حالياً.');
    el.innerHTML = `<div class="tools"><input type="search" class="search" placeholder="🔎 ابحث بالفرنسية أو بالعربية..." aria-label="بحث"></div>
      <div class="count"></div><div class="area dict-list"></div>`;
    const area = $('.area', el), cnt = $('.count', el), search = $('.search', el);
    const draw = () => {
      const q = norm(search.value);
      const list = words.filter(w => !q || norm(w.fr).includes(q) || norm(w.ar).includes(q));
      cnt.textContent = `${list.length} كلمة`;
      area.innerHTML = list.slice(0, 200).map(w => `
        <div class="word"><div class="w-fr" dir="ltr">${esc(w.fr)}</div><div class="w-ar">${esc(w.ar)}</div>
        <button class="spk" type="button" data-say="${esc(encodeURIComponent(w.fr))}" data-lang="fr-FR" aria-label="استمع">🔊</button>
        ${w.ex ? `<div class="w-ex" dir="ltr">${esc(w.ex)}</div>` : ''}</div>`).join('') ||
        '<div class="empty">لا توجد نتائج.</div>';
    };
    search.addEventListener('input', draw); draw();
  }

  /* ---------- الشات الذكي المحلي (بدون أي API خارجي) ---------- */
  let INDEX = null;
  const STOP = new Set(['ما', 'هو', 'هي', 'شرح', 'اشرح', 'لي', 'عن', 'في', 'من', 'هل', 'ايه', 'يعني', 'كيف', 'ازاي', 'لو', 'سمحت',
    'what', 'est', 'que', 'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'en', 'ce', 'qu', 'quoi', 'comment', 'explique', 'moi']);

  function leaves(o, depth = 0, out = []) {
    if (out.length >= 12 || depth > 3) return out;
    Object.entries(o).forEach(([k, v]) => {
      if (out.length >= 12 || TITLE_KEYS.slice(0, 2).includes(k)) return;
      if (typeof v === 'string' && v.trim()) out.push(v.trim());
      else if (Array.isArray(v)) v.forEach(x => {
        if (typeof x === 'string') out.length < 12 && out.push(x);
        else if (x && typeof x === 'object') leaves(x, depth + 1, out);
      });
      else if (v && typeof v === 'object') leaves(v, depth + 1, out);
    });
    return out;
  }
  function buildIndex() {
    INDEX = [];
    [['المنهج', DATA.curriculum], ['القواعد', DATA.grammar], ['الصوتيات', DATA.phonetics]].forEach(([src, root]) => {
      walkObjs(root, o => {
        const title = pickTitle(o); if (!title) return;
        const lines = leaves(o); if (!lines.length) return;
        INDEX.push({ src, title, lines, th: norm(title), hay: norm(title + ' ' + lines.join(' ')) });
      });
    });
  }
  function localAnswer(q) {
    if (/^(مرحبا|السلام|اهلا|أهلا|bonjour|salut|hello|hi)/i.test(q.trim()))
      return '<p>مرحباً بك! 👋 اسألني عن أي درس أو قاعدة أو نطق في منهج اللغة الفرنسية، مثل: <b>passé composé</b> أو <b>الضمائر</b> أو <b>أحرف الأنف</b>.</p>';
    if (!INDEX) buildIndex();
    const toks = norm(q).split(' ').map(t => t.replace(/^ال/, '')).filter(t => t.length > 1 && !STOP.has(t));
    if (!toks.length || !INDEX.length)
      return '<p>اكتب اسم الدرس أو القاعدة التي تريد شرحها بالعربية أو الفرنسية.</p>';
    const scored = INDEX.map(e => {
      let s = 0, hit = 0;
      toks.forEach(t => { if (e.th.includes(t)) { s += 3; hit++; } else if (e.hay.includes(t)) { s += 1; hit++; } });
      if (hit === toks.length) s += 2;
      return { e, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    if (!scored.length)
      return '<p>لم أجد شرحاً مطابقاً في المنهج. جرّب كلمات أخرى، مثل اسم القاعدة أو الفعل أو عنوان الدرس.</p>';
    return scored.map(({ e }) => {
      const say = e.title + '. ' + e.lines.slice(0, 4).join('. ');
      return `<div class="ans"><div class="ans-h">📘 ${esc(e.title)} <small>(${e.src})</small>${speakBtn(say)}</div>
        <ul>${e.lines.slice(0, 6).map(l => `<li>${esc(l.length > 260 ? l.slice(0, 260) + '…' : l)}</li>`).join('')}</ul></div>`;
    }).join('');
  }
  function mountChat() {
    const form = $('#chat-form'), input = $('#chat-input'), log = $('#chat-log');
    if (!form) return;
    const add = (cls, html) => {
      const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html;
      log.appendChild(d); log.scrollTop = log.scrollHeight;
    };
    add('bot', '<p>أهلاً! أنا مساعدك في اللغة الفرنسية 🇫🇷 أبحث لك مباشرة داخل شرح المنهج والقواعد. اكتب سؤالك بالعربية أو الفرنسية.</p>');
    const ask = q => {
      q = q.trim(); if (!q) return;
      add('user', `<p>${esc(q)}</p>`);
      let html; try { html = localAnswer(q); } catch (e) { html = '<p>حدث خطأ بسيط، حاول إعادة صياغة السؤال.</p>'; }
      setTimeout(() => add('bot', html), 150);
    };
    form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
    $$('.chip').forEach(c => c.addEventListener('click', () => ask(c.textContent)));
  }

  /* ---------- التنقل ---------- */
  function go(id) {
    const sec = $('#' + id) ? id : 'lessons';
    $$('.sec').forEach(s => s.classList.toggle('on', s.id === sec));
    $$('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === sec));
    try { synth && synth.cancel(); } catch (e) {}
    clearActive();
    document.body.classList.remove('menu-open');
    window.scrollTo({ top: 0 });
  }

  /* ---------- PWA ---------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    const b = $('#install-btn'); if (b) b.hidden = false;
  });
  function setupInstall() {
    const b = $('#install-btn'); if (!b) return;
    b.addEventListener('click', async () => {
      if (!deferredPrompt) { toast('من قائمة المتصفح اختر: إضافة إلى الشاشة الرئيسية'); return; }
      deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null; b.hidden = true;
    });
    if (/^https?:$/.test(location.protocol) && 'serviceWorker' in navigator)
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

  /* ---------- التشغيل ---------- */
  document.addEventListener('click', e => {
    const s = e.target.closest('.spk');
    if (s) { speak(decodeURIComponent(s.dataset.say || ''), s.dataset.lang || null, s); return; }
    const n = e.target.closest('[data-nav]');
    if (n) go(n.dataset.nav);
    if (e.target.closest('#menu-btn')) document.body.classList.toggle('menu-open');
    if (e.target.id === 'scrim') document.body.classList.remove('menu-open');
  });

  document.addEventListener('DOMContentLoaded', async () => {
    setupInstall();
    mountChat();
    go((location.hash || '').replace('#', '') || 'lessons');

    await loadAll(); // يجلب كل الملفات ثم يعرض القواعد داخلياً عبر renderGrammar

    mountGeneric('lessons', DATA.curriculum);
    mountGeneric('phonetics', DATA.phonetics);
    mountGeneric('exams', DATA.exams);
    mountDictionary();
    mountGeneric('dialogues', DATA.dialogues || findByKey(DATA.curriculum, /dialog/i), { arToggle: true });
    mountGeneric('tales', DATA.stories || DATA.tales || findByKey(DATA.curriculum, /stor|tale|conte/i), { arToggle: true });
    buildIndex();
  });
})();
