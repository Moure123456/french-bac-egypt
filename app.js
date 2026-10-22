(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const sidebar = $('#sidebar');
  const scrim = $('#scrim');
  const menuBtn = $('#menuBtn');
  const dirBtn = $('#dirBtn');
  const panels = $$('.panel');
  const navLinks = $$('#nav a');
  const DEFAULT_SECTION = 'lessons';

  /* ---------- Safe storage ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };

  /* ---------- Section navigation (hash router) ---------- */
  function showSection(id) {
    if (!panels.some(p => p.id === id)) id = DEFAULT_SECTION;
    panels.forEach(p => { p.hidden = p.id !== id; });
    navLinks.forEach(a => {
      if (a.dataset.section === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    stopSpeaking();
    closeMenu();
    window.scrollTo({ top: 0 });
    updateTitle(id);
  }

  function updateTitle(id) {
    const panel = $('#' + id);
    const lang = document.documentElement.lang === 'fr' ? 'fr' : 'ar';
    document.title = `${panel.dataset['title' + (lang === 'fr' ? 'Fr' : 'Ar')]} | Le Français Au Bac`;
  }

  const currentId = () => location.hash.slice(1) || DEFAULT_SECTION;
  window.addEventListener('hashchange', () => showSection(currentId()));

  /* ---------- Mobile menu ---------- */
  function openMenu() {
    sidebar.classList.add('open');
    scrim.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    sidebar.classList.remove('open');
    scrim.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', () => (sidebar.classList.contains('open') ? closeMenu() : openMenu()));
  scrim.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Lesson year tabs ---------- */
  $$('.tabs [role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[role="tab"]', tab.parentElement).forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      $$('.year').forEach(y => { y.hidden = y.id !== 'year-' + tab.dataset.year; });
    });
  });

  /* ---------- Language / direction (RTL <-> LTR) ---------- */
  function applyLang(lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'fr' ? 'ltr' : 'rtl';
    $$('[data-ar][data-fr]').forEach(el => { el.textContent = el.dataset[lang]; });
    $$('[data-ph-ar]').forEach(el => { el.placeholder = lang === 'fr' ? el.dataset.phFr : el.dataset.phAr; });
    dirBtn.textContent = lang === 'fr' ? 'عربي · RTL' : 'FR · LTR';
    menuBtn.setAttribute('aria-label', lang === 'fr' ? 'Menu' : 'القائمة');
    store.set('lang', lang);
    updateTitle(currentId());
  }
  dirBtn.addEventListener('click', () => applyLang(document.documentElement.lang === 'fr' ? 'ar' : 'fr'));

  /* ---------- Text-to-speech (Web Speech API) ---------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const say2 = (ar, fr) => (document.documentElement.lang === 'fr' ? fr : ar);
  let frVoice = null, activeBtn = null, speakToken = 0, warnedNoFr = false;
  const liveUtterances = new Set(); // keep references: some browsers garbage-collect utterances and never fire onend

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 7000);
  }

  function voiceStatus() {
    if (!synth) return { ok: false, msg: say2('❌ هذا المتصفح لا يدعم القراءة الصوتية. جرّب Chrome أو Safari أو Edge مباشرة (وليس داخل تطبيق آخر).', '❌ Ce navigateur ne gère pas la synthèse vocale. Essayez Chrome, Safari ou Edge directement.') };
    if (!synth.getVoices().length) return { ok: false, msg: say2('⏳ لم تُحمَّل أصوات الجهاز بعد. إن استمر هذا فجهازك بلا محرك قراءة صوتية (TTS).', '⏳ Voix non chargées. Si cela dure, votre appareil n’a pas de moteur de synthèse vocale.') };
    if (!frVoice) return { ok: false, msg: say2('⚠ لا يوجد صوت فرنسي على جهازك. ثبّت حزمة صوت فرنسية (الخطوات في «الصوت لا يعمل؟»).', '⚠ Aucune voix française. Installez-en une (voir « Pas de son ? »).') };
    return { ok: true, msg: `✔ ${frVoice.name} (${frVoice.lang})` };
  }
  function updateVoiceStatus() {
    const el = document.getElementById('voiceStatus'); if (el) el.textContent = voiceStatus().msg;
  }

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    const lang = v => v.lang.replace('_', '-').toLowerCase(); // Android reports fr_FR
    frVoice = voices.find(v => lang(v) === 'fr-fr') || voices.find(v => lang(v).startsWith('fr')) || null;
    updateVoiceStatus();
  }

  function stopSpeaking() {
    speakToken++;
    if (synth) synth.cancel();
    liveUtterances.clear();
    if (activeBtn) { activeBtn.classList.remove('speaking'); activeBtn = null; }
  }

  // Long utterances are cut by some browsers after ~15 s, so speak sentence-sized pieces.
  const chunkText = (t, max = 170) => {
    const out = [];
    String(t).replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:])\s+/).forEach(s => {
      while (s.length > max) { let i = s.lastIndexOf(' ', max); if (i < 40) i = max; out.push(s.slice(0, i)); s = s.slice(i).trim(); }
      if (s) out.push(s);
    });
    return out;
  };

  function speak(text, { rate = 0.9, btn = null } = {}) {
    if (!synth) { toast(voiceStatus().msg); return; }
    const wasActive = btn && btn === activeBtn;
    const busy = synth.speaking || synth.pending;
    stopSpeaking();
    if (wasActive) return;
    const parts = (Array.isArray(text) ? text : [text]).flatMap(chunkText);
    if (!parts.length) return;
    const token = speakToken;
    if (btn) { btn.classList.add('speaking'); activeBtn = btn; }
    const finish = () => {
      if (token !== speakToken) return;
      if (btn) btn.classList.remove('speaking');
      if (activeBtn === btn) activeBtn = null;
    };
    let started = false;
    const run = () => {
      if (token !== speakToken) return;
      pickVoice();
      if (synth.paused) synth.resume();
      if (!frVoice && !warnedNoFr && synth.getVoices().length) { warnedNoFr = true; toast(voiceStatus().msg); }
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = frVoice ? frVoice.lang.replace('_', '-') : 'fr-FR';
        if (frVoice) u.voice = frVoice;
        u.rate = rate;
        u.onstart = () => { started = true; };
        const end = () => { liveUtterances.delete(u); if (i === parts.length - 1) finish(); };
        u.onend = end;
        u.onerror = ev => {
          if (ev.error && ev.error !== 'canceled' && ev.error !== 'interrupted') {
            toast(`${say2('تعذّر تشغيل الصوت', 'Lecture impossible')} (${ev.error}). ${say2('جرّب فتح التطبيق مباشرة في Chrome أو Safari.', 'Essayez d’ouvrir l’application directement dans Chrome ou Safari.')}`);
          }
          end();
        };
        liveUtterances.add(u);
        synth.speak(u);
      });
      setTimeout(() => {
        if (token === speakToken && !started) {
          toast(say2('لم يبدأ الصوت. ارفع صوت الجهاز (وتأكد من إيقاف الوضع الصامت)، أو ثبّت صوتاً فرنسياً، أو افتح التطبيق مباشرة في Chrome/Safari.',
                     'Le son n’a pas démarré. Montez le volume, installez une voix française ou ouvrez l’application dans Chrome/Safari.'));
          finish();
        }
      }, 4000);
    };
    // Chrome can drop a speak() issued right after cancel(); delay only in that case (iOS needs the call inside the tap).
    busy ? setTimeout(run, 80) : run();
  }

  // Any element with data-speak="#selector" (reads that element) or data-speak-text="..." (reads literal text)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-speak], [data-speak-text]');
    if (!btn) return;
    const text = btn.dataset.speakText ||
      ($(btn.dataset.speak) && $(btn.dataset.speak).textContent.trim());
    if (text) speak(text, { rate: parseFloat(btn.dataset.rate) || 0.9, btn });
  });

  if (synth) {
    pickVoice();
    synth.addEventListener('voiceschanged', pickVoice);
  }

  /* ---------- Curriculum (data/curriculum.json) ---------- */
  const txt = (el, ar, fr) => { el.dataset.ar = ar; el.dataset.fr = fr; el.textContent = ar; return el; };
  function h(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content != null) el.textContent = content;
    return el;
  }
  const frText = (tag, content) => { const el = h(tag, 'fr', content); el.lang = 'fr'; el.dir = 'ltr'; return el; };

  function renderQuestion(q, index) {
    const box = h('article', 'q');
    box.append(h('h4', 'q-title', `${index + 1}.`));
    box.firstChild.append(' ', frText('span', q.prompt_fr));

    let feedback = null;
    if (q.type === 'choice' && q.options) {
      const opts = h('div', 'opts');
      feedback = h('p', 'feedback');
      feedback.setAttribute('aria-live', 'polite');
      shuffled(q.options).forEach(o => {
        const b = h('button', 'opt', o);
        b.type = 'button'; b.lang = 'fr'; b.dir = 'ltr';
        b.addEventListener('click', () => {
          const ok = o === q.correct;
          $$('.opt', opts).forEach(x => x.classList.remove('right', 'wrong'));
          b.classList.add(ok ? 'right' : 'wrong');
          feedback.textContent = ok ? '✔' : '✖';
          feedback.dataset.state = ok ? 'right' : 'wrong';
        });
        opts.append(b);
      });
      box.append(opts, feedback);
    }

    const sol = h('div', 'solution'); sol.hidden = true;
    const answer = h('p', 'answer');
    answer.append(txt(h('strong'), 'الحل النموذجي: ', 'Corrigé : '), frText('span', q.answer_fr));
    const why = h('p', 'why');
    why.append(txt(h('strong'), 'لماذا هذه الإجابة؟ ', 'Pourquoi cette réponse ? '), h('span', null, q.why_ar));
    const rule = h('p', 'rule');
    rule.append(txt(h('strong'), 'القاعدة: ', 'Règle : '), h('span', null, q.rule_ar));
    const say = txt(h('button', 'btn ghost small'), 'استمع للحل', 'Écouter le corrigé');
    say.type = 'button'; say.dataset.speakText = q.answer_fr;
    sol.append(answer, why, rule, say);

    const toggle = txt(h('button', 'btn small'), 'عرض الشرح التفاعلي للحل', 'Voir l’explication interactive');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      sol.hidden = !sol.hidden;
      toggle.setAttribute('aria-expanded', String(!sol.hidden));
    });
    box.append(toggle, sol);
    return box;
  }

  function renderLesson(lesson) {
    const card = h('article', 'lesson');
    const head = h('div', 'lesson-head');
    const titles = h('div');
    titles.append(h('h2', 'lesson-ar', lesson.title_ar), frText('p', lesson.title_fr));
    const listen = txt(h('button', 'btn'), 'استمع للدرس', 'Écouter la leçon');
    listen.type = 'button';
    listen.dataset.speakText = '';
    listen.addEventListener('click', ev => {
      ev.stopPropagation();
      speak(lesson.elements.map(e => `${e.title_fr}. ${e.text_fr}`), { btn: listen });
    }, true);
    head.append(titles, listen);
    card.append(head);

    lesson.elements.forEach(e => {
      const el = h('section', 'element');
      el.append(h('h3', null, e.title_ar), frText('p', e.title_fr), frText('p', e.text_fr), h('p', 'note', e.text_ar));
      const b = txt(h('button', 'btn ghost small'), 'استمع', 'Écouter');
      b.type = 'button'; b.dataset.speakText = e.text_fr;
      el.append(b);
      card.append(el);
    });

    const qs = h('div', 'questions');
    qs.append(txt(h('h3'), 'أسئلة الكتاب وحلولها', 'Questions du manuel et corrigés'));
    lesson.questions.forEach((q, i) => qs.append(renderQuestion(q, i)));
    card.append(qs);
    return card;
  }

  const VOCAB_LABELS = {
    noms_masculins: ['الأسماء المذكرة', 'Noms masculins'], noms_feminins: ['الأسماء المؤنثة', 'Noms féminins'],
    verbes: ['الأفعال', 'Verbes'], adjectifs: ['الصفات', 'Adjectifs'], expressions: ['تعبيرات', 'Expressions']
  };
  const TEXT_KINDS = { reading: ['نص قراءة', 'Texte de lecture'], situation: ['موقف حواري', 'Situation'], email: ['بريد إلكتروني', 'E-mail'] };

  function renderUnit(u) {
    const card = h('article', 'lesson unit');
    const head = h('div', 'lesson-head'); const tt = h('div');
    tt.append(h('h2', null, `${u.number}. ${u.title_ar}`), frText('p', u.title_fr), h('p', 'note', u.theme_ar));
    const listen = txt(h('button', 'btn'), 'استمع لنصوص الوحدة', 'Écouter les textes'); listen.type = 'button';
    listen.addEventListener('click', () => speak(u.texts.flatMap(t => t.lines ? t.lines.map(l => l.fr) : [t.body_fr]), { rate: 0.8, btn: listen }));
    head.append(tt, listen); card.append(head);

    const sec = (ar, fr, open) => { const d = h('details', 'settings'); d.open = !!open; d.append(txt(h('summary'), ar, fr)); card.append(d); return d; };

    const vd = sec('المفردات (Vocabulaire)', 'Vocabulaire', true);
    Object.entries(VOCAB_LABELS).forEach(([key, [ar, fr]]) => {
      const words = u.vocabulary[key]; if (!words || !words.length) return;
      const ul = h('ul', 'dict-list');
      words.forEach(([f, a]) => {
        const li = h('li', 'dict-row'); li.append(frText('span', f), h('span', 'ar', a), iconBtn(f));
        li.firstChild.className = 'fr word'; ul.append(li);
      });
      vd.append(txt(h('h4'), ar, fr), ul);
    });
    const allWords = Object.values(u.vocabulary).flat().map(w => w[0]);
    const all = txt(h('button', 'btn ghost small'), 'استمع لكل المفردات', 'Écouter tout le vocabulaire'); all.type = 'button';
    all.addEventListener('click', () => speak(allWords, { rate: 0.75, btn: all })); vd.append(all);

    const td = sec('النصوص والمواقف والرسائل', 'Textes, situations et e-mails', false);
    u.texts.forEach(t => {
      const box = h('section', 'element');
      box.append(txt(h('span', 'badge'), TEXT_KINDS[t.type][0], TEXT_KINDS[t.type][1]), h('h3', null, t.title_ar), frText('p', t.title_fr));
      if (t.lines) {
        t.lines.forEach(l => {
          const row = h('div', 'line'); const b = h('div', 'bubble');
          b.append(h('strong', null, l.who), frText('p', l.fr), h('p', 'tr', l.ar)); row.append(b, iconBtn(l.fr)); box.append(row);
        });
      } else {
        const p = h('div', 'passage'); const f = frText('p', t.body_fr); f.className = 'fr wrap'; p.append(f, speakBtn('استمع', 'Écouter', t.body_fr, 0.8));
        box.append(p, h('p', 'tr wrap', t.text_ar));
      }
      td.append(box);
    });

    const ed = sec('تدريبات الوحدة مع الشرح التفاعلي', 'Exercices avec explication interactive', false);
    u.exercises.forEach((e, i) => ed.append(renderQuestion(e, i)));
    return card;
  }

  async function loadCurriculum() {
    try {
      const res = await fetch('data/curriculum.json');
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      data.years.forEach(y => {
        const host = $(`[data-year-list="${y.id}"]`);
        if (!host) return;
        host.replaceChildren(...(y.units || []).map(renderUnit), ...y.lessons.map(renderLesson));
      });
      applyLang(document.documentElement.lang);
    } catch (err) {
      $$('[data-year-list]').forEach(host => {
        const p = txt(h('p', 'empty'), 'تعذر تحميل الدروس. شغّل الموقع عبر خادم محلي (مثل: python -m http.server) بدلاً من فتح الملف مباشرة.',
          'Impossible de charger les leçons. Lancez le site avec un serveur local (ex. python -m http.server).');
        host.replaceChildren(p);
      });
      applyLang(document.documentElement.lang);
    }
  }

  /* ---------- Shared helpers (grammar + phonetics) ---------- */
  // Options are shuffled on every display so the correct answer is not always in the same position.
  const shuffled = arr => { const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const norm = s => s.toLowerCase().replace(/[’'`]/g, '’').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  const getJSON = async path => { const r = await fetch(path); if (!r.ok) throw new Error(r.status); return r.json(); };
  const failMsg = host => host.replaceChildren(txt(h('p', 'empty'),
    'تعذر تحميل البيانات. شغّل الموقع عبر خادم محلي (python -m http.server).',
    'Impossible de charger les données. Lancez un serveur local (python -m http.server).'));
  const speakBtn = (ar, fr, text, rate) => {
    const b = txt(h('button', 'btn ghost small'), ar, fr);
    b.type = 'button'; b.dataset.speakText = text;
    if (rate) b.dataset.rate = rate;
    return b;
  };
  function tabBar(labels, panelsList) {
    const bar = h('div', 'tabs'); bar.setAttribute('role', 'tablist');
    labels.forEach((l, i) => {
      const b = typeof l === 'string' ? h('button', null, l) : txt(h('button'), l.ar, l.fr);
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', () => {
        $$('[role="tab"]', bar).forEach(t => t.setAttribute('aria-selected', String(t === b)));
        panelsList.forEach((p, j) => { p.hidden = j !== i; });
      });
      bar.append(b);
    });
    panelsList.forEach((p, j) => { p.hidden = j !== 0; });
    return bar;
  }

  /* ---------- Grammar ---------- */
  const PRON = ['je / j’', 'tu', 'il / elle', 'nous', 'vous', 'ils / elles'];
  const SAY = ['je ', 'tu ', 'il ', 'nous ', 'vous ', 'ils '];
  const sayForm = (i, f) => (i === 0 && /^[aeiouéèêh]/i.test(f) ? 'j’' : SAY[i]) + f;

  function renderExercise(ex, i, onRight) {
    const box = h('article', 'q');
    const t = h('h4', 'q-title', `${i + 1}.`); t.append(' ', frText('span', ex.prompt_fr));
    const fb = h('p', 'feedback'); fb.setAttribute('aria-live', 'polite');
    const reveal = h('p', 'answer'); reveal.hidden = true;
    reveal.append(txt(h('strong'), 'الإجابة: ', 'Réponse : '), frText('span', ex.answer));
    let solved = false;
    const verdict = ok => {
      fb.dataset.state = ok ? 'right' : 'wrong';
      fb.replaceChildren(ok ? '✔ ' : '✖ ', h('span', null, ex.hint_ar));
      if (ok && !solved) { solved = true; onRight(); }
    };
    box.append(t);
    if (ex.type === 'choice') {
      const opts = h('div', 'opts');
      shuffled(ex.options).forEach(o => {
        const b = h('button', 'opt', o); b.type = 'button'; b.lang = 'fr'; b.dir = 'ltr';
        b.addEventListener('click', () => {
          const ok = o === ex.answer;
          $$('.opt', opts).forEach(x => x.classList.remove('right', 'wrong'));
          b.classList.add(ok ? 'right' : 'wrong');
          verdict(ok);
        });
        opts.append(b);
      });
      box.append(opts);
    } else {
      const row = h('div', 'opts');
      const inp = h('input', 'cell-input wide'); inp.type = 'text'; inp.autocomplete = 'off'; inp.lang = 'fr'; inp.dir = 'ltr';
      const chk = txt(h('button', 'btn small'), 'تحقق', 'Vérifier'); chk.type = 'button';
      const run = () => {
        const ok = [ex.answer, ...(ex.accept || [])].some(x => norm(x) === norm(inp.value));
        inp.classList.toggle('right', ok); inp.classList.toggle('wrong', !ok);
        verdict(ok);
      };
      chk.addEventListener('click', run);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
      row.append(inp, chk); box.append(row);
    }
    const show = txt(h('button', 'btn ghost small'), 'أظهر الإجابة', 'Voir la réponse');
    show.type = 'button'; show.addEventListener('click', () => { reveal.hidden = !reveal.hidden; });
    box.append(fb, show, reveal);
    return box;
  }

  function renderRuleLevel(level, onRight) {
    const wrap = h('div');
    level.rules.forEach(rule => {
      const card = h('article', 'lesson');
      const head = h('div', 'lesson-head');
      const tt = h('div'); tt.append(h('h2', null, rule.title_ar), frText('p', rule.title_fr));
      head.append(tt); card.append(head, h('p', null, rule.explanation_ar));
      const ul = h('ul', 'examples');
      rule.examples.forEach(e => {
        const li = h('li'); li.append(frText('span', e), ' ', speakBtn('استمع', 'Écouter', e)); ul.append(li);
      });
      card.append(ul, txt(h('h3'), 'تدريبات بتصحيح تلقائي', 'Exercices corrigés automatiquement'));
      rule.exercises.forEach((ex, i) => card.append(renderExercise(ex, i, onRight)));
      wrap.append(card);
    });
    return wrap;
  }

  function renderConjTense(verb, tense) {
    const box = h('div', 'conj');
    box.append(frText('h4', `${verb} – ${tense.name_fr}`));
    const tbody = h('tbody');
    const cells = tense.forms.map((f, i) => {
      const tr = h('tr'), th = h('th', null, PRON[i]); th.scope = 'row';
      const td = h('td'); tr.append(th, td); tbody.append(tr); return td;
    });
    const table = h('table', 'conj-table'); table.append(tbody);
    let drilling = false;
    const showForms = () => cells.forEach((td, i) => { td.className = 'fr'; td.lang = 'fr'; td.textContent = tense.forms[i]; });
    const showInputs = () => cells.forEach(td => {
      const inp = h('input', 'cell-input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.lang = 'fr'; inp.dir = 'ltr';
      td.className = ''; td.replaceChildren(inp);
    });
    showForms();
    const listen = txt(h('button', 'btn ghost small'), 'استمع', 'Écouter'); listen.type = 'button';
    listen.addEventListener('click', () => speak(tense.forms.map((f, i) => sayForm(i, f)), { rate: 0.8, btn: listen }));
    const mode = txt(h('button', 'btn small'), 'تدريب', 'S’entraîner'); mode.type = 'button';
    const check = txt(h('button', 'btn small'), 'تحقق', 'Vérifier'); check.type = 'button'; check.hidden = true;
    mode.addEventListener('click', () => {
      drilling = !drilling;
      drilling ? showInputs() : showForms();
      check.hidden = !drilling;
      mode.dataset.ar = drilling ? 'أظهر الأشكال' : 'تدريب';
      mode.dataset.fr = drilling ? 'Voir les formes' : 'S’entraîner';
      mode.textContent = mode.dataset[document.documentElement.lang === 'fr' ? 'fr' : 'ar'];
    });
    check.addEventListener('click', () => cells.forEach((td, i) => {
      const inp = td.firstChild; if (!inp || inp.tagName !== 'INPUT') return;
      const ok = norm(inp.value) === norm(tense.forms[i]);
      inp.classList.toggle('right', ok); inp.classList.toggle('wrong', !ok);
    }));
    const bar = h('div', 'speak-actions'); bar.append(listen, mode, check);
    box.append(table, bar);
    return box;
  }

  async function loadGrammar() {
    const host = $('#grammarHost');
    try {
      const data = await getJSON('data/grammar.json');
      const panelsList = [], labels = [];
      data.levels.forEach(lv => {
        const total = lv.rules.reduce((n, r) => n + r.exercises.length, 0);
        let right = 0;
        const score = h('p', 'score', `✔ 0 / ${total}`);
        const p = h('div'); p.append(score, renderRuleLevel(lv, () => { right++; score.textContent = `✔ ${right} / ${total}`; }));
        panelsList.push(p); labels.push(lv.id.replace('sec', 'Sec'));
      });
      const conj = h('div');
      data.conjugations.forEach(v => {
        const card = h('article', 'lesson');
        const head = h('div', 'lesson-head'); const tt = h('div');
        tt.append(frText('h2', v.verb), h('p', 'note', v.group_ar)); head.append(tt);
        const grid = h('div', 'conj-grid'); v.tenses.forEach(t => grid.append(renderConjTense(v.verb, t)));
        card.append(head, grid); conj.append(card);
      });
      panelsList.push(conj); labels.push({ ar: 'جداول التصريف', fr: 'Conjugaison' });
      host.replaceChildren(tabBar(labels, panelsList), ...panelsList);
      applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  /* ---------- Phonetics ---------- */
  const exampleChip = (ex, rate) => {
    const b = h('button', 'chip'); b.type = 'button'; b.dataset.speakText = ex.fr; b.dataset.rate = String(rate || 0.75);
    b.append(frText('span', ex.fr));
    if (ex.ipa) { const i = h('small', 'ipa-s', `[${ex.ipa}]`); i.dir = 'ltr'; b.append(i); }
    b.append(h('small', null, ex.ar));
    return b;
  };
  const listenAllBtn = (words, rate) => {
    const b = txt(h('button', 'btn small'), 'استمع للكل', 'Tout écouter'); b.type = 'button';
    b.addEventListener('click', () => speak(words, { rate: rate || 0.7, btn: b }));
    return b;
  };
  const labelled = (ar, fr, body, cls) => { const p = h('p', cls); p.append(txt(h('strong'), ar, fr), body); return p; };

  function soundCard(s) {
    const c = h('article', 'sound');
    const top = h('div', 'sound-top');
    const ipa = frText('span', `[${s.ipa}]`); ipa.className = 'ipa';
    const letters = frText('span', s.letters); letters.className = 'fr letters';
    top.append(ipa, letters);
    c.append(top, h('h3', null, s.name_ar),
      labelled('طريقة النطق: ', 'Articulation : ', s.how_ar), labelled('المخرج: ', 'Point d’articulation : ', s.place_ar),
      labelled('لماذا يُنطق هكذا؟ ', 'Pourquoi ? ', s.why_ar), labelled('نصيحة: ', 'Astuce : ', s.tip_ar));
    const chips = h('div', 'chips'); s.examples.forEach(e => chips.append(exampleChip(e)));
    c.append(chips, listenAllBtn(s.examples.map(e => e.fr)));
    return c;
  }
  function ruleCard(r) {
    const c = h('article', 'sound');
    c.append(h('h3', null, r.title_ar), frText('p', r.title_fr),
      labelled('القاعدة: ', 'Règle : ', r.rule_ar), labelled('لماذا؟ ', 'Pourquoi ? ', r.why_ar));
    const chips = h('div', 'chips'); r.examples.forEach(e => chips.append(exampleChip(e)));
    c.append(chips);
    if (r.exceptions_ar) c.append(labelled('استثناءات: ', 'Exceptions : ', r.exceptions_ar, 'tip'));
    c.append(listenAllBtn(r.examples.map(e => e.fr)));
    return c;
  }
  function contrastCard(k) {
    const c = h('article', 'sound wide');
    const top = h('div', 'sound-top');
    const ipa = frText('span', k.sounds.map(x => `[${x}]`).join(' ≠ ')); ipa.className = 'ipa';
    top.append(ipa);
    c.append(top, h('h3', null, k.title_ar), h('p', null, k.explanation_ar));
    k.pairs.forEach(group => { const row = h('div', 'pair'); group.forEach(it => row.append(exampleChip(it))); c.append(row); });
    if (k.tip_ar) c.append(labelled('نصيحة: ', 'Astuce : ', k.tip_ar, 'tip'));
    c.append(listenAllBtn(k.pairs.flat().map(i => i.fr), 0.65));
    return c;
  }
  const phonSection = (g, cards) => {
    const sec = h('section', 'phon-group');
    sec.append(h('h2', null, g.title_ar), frText('p', g.title_fr));
    if (g.intro_ar) sec.append(h('p', 'note', g.intro_ar));
    const grid = h('div', 'sound-grid'); cards.forEach(x => grid.append(x)); sec.append(grid); return sec;
  };

  async function loadPhonetics() {
    const host = $('#phoneticsHost');
    try {
      const data = await getJSON('data/phonetics.json');
      const soundsPanel = h('div'); data.groups.forEach(g => soundsPanel.append(phonSection(g, g.sounds.map(soundCard))));
      const ruleSecs = data.rule_groups.map(g => { const d = h('div'); d.append(phonSection(g, g.rules.map(ruleCard))); return d; });
      const contrastPanel = h('div');
      contrastPanel.append(phonSection({ title_ar: 'الفرق بين الأصوات المتشابهة', title_fr: 'Les paires minimales', intro_ar: 'كلمات تختلف في صوت واحد فيتغير المعنى. استمع إلى كل كلمة ثم كررها.' }, data.contrasts.map(contrastCard)));
      const panelsList = [soundsPanel, ...ruleSecs, contrastPanel];
      const labels = [{ ar: 'الأصوات', fr: 'Sons' }, { ar: 'الحروف الصامتة والوصل', fr: 'Lettres muettes' }, { ar: 'قواعد القراءة', fr: 'Règles de lecture' }, { ar: 'الفرق بين الأصوات', fr: 'Contrastes' }];
      host.replaceChildren(tabBar(labels.slice(0, panelsList.length), panelsList), ...panelsList);
      applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  /* ---------- Dictionary / Dialogues / Tales ---------- */
  const setLabel = (b, ar, fr) => { b.dataset.ar = ar; b.dataset.fr = fr; b.textContent = document.documentElement.lang === 'fr' ? fr : ar; };
  const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F]/g, '').toLowerCase();
  const iconBtn = (text, rate) => {
    const b = h('button', 'icon-speak', '🔊'); b.type = 'button';
    b.setAttribute('aria-label', 'استمع / Écouter'); b.dataset.speakText = text; b.dataset.rate = rate || '0.8';
    return b;
  };
  function toggleBtn(ar1, fr1, ar2, fr2, onChange, on = true) {
    const b = h('button', 'btn ghost small'); b.type = 'button';
    let state = on;
    const paint = () => { setLabel(b, state ? ar1 : ar2, state ? fr1 : fr2); b.setAttribute('aria-pressed', String(state)); };
    b.addEventListener('click', () => { state = !state; paint(); onChange(state); });
    paint(); return b;
  }

  async function loadDictionary() {
    const host = $('#dictionaryHost');
    try {
      const data = await getJSON('data/dictionary.json');
      const all = data.categories.flatMap(c => c.words.map(([fr, ar]) => ({ fr, ar, cat: c.id })));
      let cat = 'all';
      const input = h('input', 'search'); input.type = 'search'; input.autocomplete = 'off'; input.dir = 'auto';
      input.dataset.phAr = 'ابحث بالفرنسية أو العربية...'; input.dataset.phFr = 'Cherchez en français ou en arabe…';
      input.setAttribute('aria-label', 'Search / بحث');
      const chips = h('div', 'filters');
      const count = h('p', 'note'), list = h('ul', 'dict-list');
      const mk = (id, ar, fr) => {
        const b = txt(h('button', 'filter'), ar, fr); b.type = 'button'; b.dataset.cat = id;
        b.setAttribute('aria-pressed', String(id === 'all'));
        b.addEventListener('click', () => { cat = id; $$('.filter', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b))); render(); });
        chips.append(b);
      };
      mk('all', 'الكل', 'Tout'); data.categories.forEach(c => mk(c.id, c.ar, c.fr));
      function render() {
        const q = strip(input.value.trim());
        const rows = all.filter(w => (cat === 'all' || w.cat === cat) && (!q || strip(w.fr).includes(q) || strip(w.ar).includes(q)));
        count.textContent = `${rows.length} / ${all.length}`;
        if (!rows.length) {
          list.replaceChildren(txt(h('li', 'empty'), 'لا توجد نتائج. جرّب كلمة أخرى أو اختر «الكل».', 'Aucun résultat. Essayez un autre mot ou choisissez « Tout ».'));
          applyLang(document.documentElement.lang); return;
        }
        list.replaceChildren(...rows.map(w => {
          const li = h('li', 'dict-row');
          li.append(frText('span', w.fr), h('span', 'ar', w.ar), iconBtn(w.fr));
          li.firstChild.className = 'fr word'; return li;
        }));
      }
      input.addEventListener('input', render);
      host.replaceChildren(input, chips, count, list);
      render(); applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  async function loadDialogues() {
    const host = $('#dialoguesHost');
    try {
      const data = await getJSON('data/dialogues.json');
      host.replaceChildren(...data.dialogues.map(d => {
        const card = h('article', 'lesson dialogue');
        const head = h('div', 'lesson-head'); const tt = h('div');
        tt.append(h('h2', null, d.title_ar), frText('p', d.title_fr), h('p', 'note', d.context_ar),
          h('p', 'note', `${L('الأطراف', 'Personnages')}: ${d.speakers.map(s => `${s.name} (${s.role_ar})`).join(' · ')}`));
        const acts = h('div', 'speak-actions');
        const all = txt(h('button', 'btn small'), 'استمع للحوار', 'Écouter le dialogue'); all.type = 'button';
        all.addEventListener('click', () => speak(d.lines.map(l => l.fr), { rate: 0.8, btn: all }));
        acts.append(all,
          toggleBtn('إخفاء الترجمة', 'Masquer la traduction', 'إظهار الترجمة', 'Afficher la traduction', on => card.classList.toggle('hide-tr', !on)),
          toggleBtn('إخفاء النطق', 'Masquer la prononciation', 'إظهار النطق', 'Afficher la prononciation', on => card.classList.toggle('hide-pron', !on)));
        head.append(tt, acts); card.append(head);

        // Role-play: the app plays the other speakers, you say your lines aloud.
        const rp = h('div', 'roleplay');
        const sel = h('select'); d.speakers.forEach(s => sel.append(new Option(s.name, s.name)));
        const roleLabel = h('label', 'inline'); roleLabel.append(txt(h('span'), 'دورك', 'Votre rôle'), sel);
        const start = txt(h('button', 'btn small'), 'ابدأ تمثيل الحوار', 'Jouer le dialogue'); start.type = 'button';
        const next = txt(h('button', 'btn small'), 'التالي ▶', 'Suivant ▶'); next.type = 'button'; next.hidden = true;
        const status = h('p', 'note'); status.setAttribute('aria-live', 'polite');
        rp.append(roleLabel, start, next, status); card.append(rp);

        const rows = []; const sides = {};
        d.lines.forEach(l => {
          if (!(l.who in sides)) sides[l.who] = Object.keys(sides).length % 2;
          const row = h('div', `line side-${sides[l.who]}`);
          const bubble = h('div', 'bubble');
          const pron = h('div', 'pron-box');
          const ipa = h('p', 'ipa-line', `[${l.ipa}]`); ipa.dir = 'ltr';
          pron.append(ipa, h('p', 'pron-ar', l.pron_ar));
          bubble.append(h('strong', null, l.who), frText('p', l.fr), pron, h('p', 'tr', l.ar));
          row.append(bubble, iconBtn(l.fr)); rows.push(row); card.append(row);
        });

        let idx = -1;
        function step() {
          stopSpeaking();
          if (idx >= 0) rows[idx].classList.remove('active');
          idx++;
          if (idx >= d.lines.length) {
            status.textContent = L('🎉 انتهى الحوار. أحسنت!', '🎉 Dialogue terminé. Bravo !');
            next.hidden = true; rows.forEach(r => r.classList.remove('role-hidden')); return;
          }
          const line = d.lines[idx], row = rows[idx];
          row.classList.remove('role-hidden'); row.classList.add('active');
          row.scrollIntoView({ block: 'center', behavior: 'smooth' });
          if (line.who === sel.value) status.textContent = L('دورك: انطق الجملة بصوت عالٍ، ثم اضغط «التالي».', 'À vous : dites la phrase à voix haute, puis « Suivant ».');
          else { status.textContent = L('استمع إلى الجملة…', 'Écoutez…'); speak(line.fr, { rate: 0.85 }); }
        }
        start.addEventListener('click', () => {
          stopSpeaking(); idx = -1; next.hidden = false;
          rows.forEach((r, i) => { r.classList.remove('active'); r.classList.toggle('role-hidden', d.lines[i].who === sel.value); });
          step();
        });
        next.addEventListener('click', step);
        return card;
      }));
      applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  async function loadStories() {
    const host = $('#storiesHost'); if (!host) return;
    try {
      const data = await getJSON('data/stories.json');
      const wrap = h('div', 'stories');
      wrap.append(txt(h('h2'), 'قصص للقراءة', 'Histoires à lire'),
        txt(h('p', 'note'), 'اقرأ القصة ثم تأكد من فهمك بالأسئلة. اضغط على 🔊 للاستماع.', 'Lisez l’histoire, puis vérifiez votre compréhension. Appuyez sur 🔊 pour écouter.'));
      data.stories.forEach(s => {
        const det = h('details', 'settings story');
        const sum = h('summary'); sum.append(`${s.title_ar} · `, frText('span', s.title_fr), ` · ${s.level}`); det.append(sum);
        const bar = h('div', 'speak-actions');
        const all = txt(h('button', 'btn small'), 'استمع للقصة كاملة', 'Écouter toute l’histoire'); all.type = 'button';
        all.addEventListener('click', () => speak(s.paragraphs.map(p => p.fr), { rate: 0.8, btn: all }));
        bar.append(h('span', 'badge', `${s.level} · ${s.level_ar}`), all,
          toggleBtn('إخفاء الترجمة', 'Masquer la traduction', 'إظهار الترجمة', 'Afficher la traduction', on => det.classList.toggle('hide-tr', !on)));
        det.append(bar, h('p', 'note', s.theme_ar));
        s.paragraphs.forEach(p => {
          const row = h('div', 'para'); const body = h('div');
          const f = frText('p', p.fr); f.className = 'fr tale-fr'; body.append(f, h('p', 'tr', p.ar));
          row.append(body, iconBtn(p.fr)); det.append(row);
        });
        det.append(txt(h('h4'), 'مفردات القصة', 'Vocabulaire de l’histoire'));
        const ul = h('ul', 'dict-list');
        s.vocabulary.forEach(w => { const li = h('li', 'dict-row'); li.append(frText('span', w.fr), h('span', 'ar', w.ar), iconBtn(w.fr)); li.firstChild.className = 'fr word'; ul.append(li); });
        det.append(ul, txt(h('h4'), 'اختبر فهمك', 'Vérifiez votre compréhension'));
        s.questions.forEach((q, i) => det.append(renderQuestion(q, i)));
        wrap.append(det);
      });
      host.replaceChildren(wrap); applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  async function loadTales() {
    const host = $('#talesHost');
    try {
      const data = await getJSON('data/tales.json');
      const grid = h('div', 'tale-grid'), reader = h('div'); reader.hidden = true;
      let showTr = true, showFr = true;
      function open(t) {
        let i = 0;
        const scene = h('div', 'scene'); scene.setAttribute('aria-hidden', 'true');
        const fr = frText('p', ''); fr.className = 'fr tale-fr';
        const ar = h('p', 'tr tale-ar'), pos = h('span', 'score');
        const prev = txt(h('button', 'btn ghost small'), 'السابق', 'Précédent'), next = txt(h('button', 'btn small'), 'التالي', 'Suivant');
        prev.type = next.type = 'button';
        const say = txt(h('button', 'btn small'), 'استمع للصفحة', 'Écouter la page'); say.type = 'button';
        const full = txt(h('button', 'btn ghost small'), 'قراءة القصة كاملة', 'Lire toute l’histoire'); full.type = 'button';
        const back = txt(h('button', 'btn ghost small'), 'كل القصص', 'Tous les contes'); back.type = 'button';
        const paint = () => {
          const p = t.pages[i];
          scene.textContent = p.scene; fr.textContent = p.fr; ar.textContent = p.ar;
          fr.hidden = !showFr; ar.hidden = !showTr;
          pos.textContent = `${i + 1} / ${t.pages.length}`;
          prev.disabled = i === 0; next.disabled = i === t.pages.length - 1;
        };
        const go = d => { i += d; stopSpeaking(); paint(); };
        prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
        say.addEventListener('click', () => speak(t.pages[i].fr, { rate: 0.8, btn: say }));
        full.addEventListener('click', () => speak(t.pages.map(p => p.fr), { rate: 0.8, btn: full }));
        back.addEventListener('click', () => { stopSpeaking(); reader.hidden = true; grid.hidden = false; });
        const opts = h('div', 'speak-actions');
        opts.append(
          toggleBtn('إخفاء الترجمة', 'Masquer la traduction', 'إظهار الترجمة', 'Afficher la traduction', on => { showTr = on; paint(); }, showTr),
          toggleBtn('إخفاء النص الفرنسي (تدريب الاستماع)', 'Masquer le texte (écoute)', 'إظهار النص الفرنسي', 'Afficher le texte', on => { showFr = on; paint(); }, showFr));
        const nav = h('div', 'speak-actions'); nav.append(prev, pos, next);
        const play = h('div', 'speak-actions'); play.append(say, full);
        const title = h('h2', null, t.title_ar); const titleFr = frText('p', t.title_fr);
        const card = h('article', 'lesson tale');
        card.append(back, title, titleFr, scene, fr, ar, nav, play, opts);
        reader.replaceChildren(card); grid.hidden = true; reader.hidden = false; paint();
        applyLang(document.documentElement.lang);
      }
      data.tales.forEach(t => {
        const b = h('button', 'tale-card'); b.type = 'button';
        const em = h('span', 'tale-emoji', t.emoji); em.setAttribute('aria-hidden', 'true');
        b.append(em, h('strong', null, t.title_ar), frText('span', t.title_fr));
        b.addEventListener('click', () => open(t)); grid.append(b);
      });
      host.replaceChildren(grid, reader); applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  /* ---------- AI assistant (Gemini / OpenAI) ---------- */
  const PROVIDERS = {
    gemini: { label: 'Google Gemini', model: 'gemini-2.5-flash' },
    openai: { label: 'OpenAI', model: 'gpt-4o-mini' }
  };

  const BASE_PROMPT = `You are an expert French language teacher for Egyptian students preparing for the Thanaweya Amma French exam. Use evidence-based teaching:
1. Reply in the language the student writes in. Arabic: simple clear Arabic explanations, with French examples each followed by an Arabic translation. French: simple French at the student's level plus short Arabic glosses of hard words.
2. Teach, do not just answer: rule, short example, then a quick check question when it fits. Prefer retrieval practice: let the student try to produce the answer before you reveal it.
3. Corrective feedback: when the student writes French, give the corrected sentence, name the error type (agreement, article or gender, conjugation, spelling, word order, preposition) and explain the rule in one or two lines. Correct at most the three most important errors at once.
4. Use what you know about difficulties of Arabic speakers: no /p/ and /v/ (confused with b and f), the vowels /y/ versus /u/ and /ø/, the uvular r, nasal vowels, silent final letters, noun gender, articles (Arabic has no indefinite article), adjective position and verb agreement. For pronunciation give the IPA and a simple description based on Arabic sounds.
5. Stay on French learning: grammar, conjugation, vocabulary, pronunciation, reading, writing and exam technique. Politely redirect off-topic requests.
6. Be accurate. If you are not sure, say so. Never invent textbook exercises, page numbers or answers, and do not claim to see the student's book.
7. Keep answers short (under about 150 words unless asked for more). Plain text only: no Markdown symbols such as ** or #. Use line breaks and hyphens for lists.
8. Be patient, encouraging and specific in your praise.`;

  const LEVELS = {
    '1sec': 'first year of secondary school, approximately CEFR A1-A2',
    '2sec': 'second year of secondary school, approximately CEFR A2',
    '3sec': 'final year (Thanaweya Amma), approximately CEFR A2-B1, exam-oriented'
  };
  const MODES = {
    explain: 'Explain mode: explain the concept the student asks about with the rule, two or three examples and one practice question.',
    correct: 'Correction mode: the student sends French text. Reply with the corrected text, then up to three errors (type, why, rule), and finish with one short tip.',
    quiz: 'Quiz mode: run a 5-question quiz on the topic the student names (or a level-appropriate topic if none). Ask ONE question at a time, wait for the answer, then give feedback with the rule and the running score. After question 5 give the final score and the two weakest points to review.',
    talk: 'Conversation mode: role-play a simple everyday situation in French at the student level. Write one to three short French sentences and end with a question. After each student reply, add one line in Arabic starting with "تصحيح:" correcting any mistakes, then continue the conversation.'
  };
  const buildPrompt = (mode, level) => `${BASE_PROMPT}\n\nStudent level: ${LEVELS[level]}.\nCurrent mode: ${MODES[mode]}`;

  const frParts = text => text.replace(/[*#`_]/g, '').split(/\n|(?<=[.!?؟])\s+/).map(x => x.trim())
    .filter(x => /[A-Za-zÀ-ÿ]{2}/.test(x) && !/[\u0600-\u06FF]/.test(x));

  async function callAI(provider, model, key, history, system) {
    let res;
    if (provider === 'openai') {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...history] })
      });
    } else {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        })
      });
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error((j.error && j.error.message) || res.statusText), { status: res.status });
    return (provider === 'openai'
      ? (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''
      : ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('')
    ).trim();
  }

  function aiError(e) {
    const ar = document.documentElement.lang !== 'fr';
    const m = {
      400: ['الطلب غير صالح. تأكد من اسم النموذج.', 'Requête invalide. Vérifiez le nom du modèle.'],
      401: ['مفتاح الـ API غير صحيح.', 'Clé API incorrecte.'],
      403: ['المفتاح غير مسموح له بهذا النموذج أو الخدمة.', 'Cette clé n’a pas accès à ce modèle.'],
      404: ['النموذج غير موجود. غيّر اسم النموذج في الإعدادات.', 'Modèle introuvable. Changez le nom du modèle.'],
      429: ['تم تجاوز الحد المسموح أو الرصيد. حاول لاحقاً.', 'Limite ou quota dépassé. Réessayez plus tard.']
    }[e.status];
    if (m) return m[ar ? 0 : 1];
    return e.status ? `${ar ? 'حدث خطأ' : 'Erreur'} (${e.status}): ${e.message}` : (ar ? 'تعذر الاتصال بالخدمة. تحقق من الإنترنت.' : 'Connexion impossible. Vérifiez internet.');
  }

  function loadAssistant() {
    const host = $('#assistantHost');
    let history = [], busy = false;

    const field = (ar, fr, control) => {
      const l = h('label', 'field'); l.append(txt(h('span'), ar, fr), control); return l;
    };
    const provider = h('select'); Object.entries(PROVIDERS).forEach(([id, p]) => provider.append(new Option(p.label, id)));
    provider.value = store.get('ai_provider') in PROVIDERS ? store.get('ai_provider') : 'gemini';
    const model = h('input'); model.type = 'text'; model.dir = 'ltr'; model.spellcheck = false;
    model.value = store.get('ai_model') || PROVIDERS[provider.value].model;
    const keyIn = h('input'); keyIn.type = 'password'; keyIn.dir = 'ltr'; keyIn.autocomplete = 'off'; keyIn.spellcheck = false;
    keyIn.value = store.get('ai_key') || '';
    const remember = h('input'); remember.type = 'checkbox'; remember.checked = !!store.get('ai_key');
    const remLabel = h('label', 'check'); remLabel.append(remember, txt(h('span'), 'تذكر المفتاح على هذا الجهاز', 'Mémoriser la clé sur cet appareil'));
    provider.addEventListener('change', () => {
      model.value = PROVIDERS[provider.value].model; store.set('ai_provider', provider.value); store.set('ai_model', '');
    });
    model.addEventListener('change', () => store.set('ai_model', model.value.trim()));
    keyIn.addEventListener('input', () => { if (remember.checked) store.set('ai_key', keyIn.value.trim()); });
    remember.addEventListener('change', () => store.set('ai_key', remember.checked ? keyIn.value.trim() : ''));

    const settings = h('details', 'settings'); settings.open = !keyIn.value;
    const sum = txt(h('summary'), 'إعدادات الذكاء الاصطناعي (مزوّد الخدمة والمفتاح)', 'Paramètres IA (fournisseur et clé)');
    const note = txt(h('p', 'note'),
      'يُرسل المفتاح من متصفحك مباشرة إلى مزوّد الخدمة. لا تستخدم مفتاحك الشخصي في نسخة منشورة للعامة، بل اجعل الطلبات تمر عبر خادم وسيط.',
      'La clé part de votre navigateur vers le fournisseur. Pour un site public, utilisez un serveur intermédiaire plutôt que votre clé personnelle.');
    settings.append(sum, field('المزوّد', 'Fournisseur', provider), field('النموذج', 'Modèle', model), field('مفتاح الـ API', 'Clé API', keyIn), remLabel, note);

    const log = h('div', 'chat'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
    function addMsg(role, text) {
      const m = h('div', `msg ${role}`);
      const p = h('p', null, text); p.dir = 'auto'; m.append(p);
      log.append(m); log.scrollTop = log.scrollHeight;
      return {
        set(t, speakable) {
          p.textContent = t;
          const parts = speakable ? frParts(t) : [];
          if (parts.length) {
            const b = txt(h('button', 'btn ghost small'), 'استمع للفرنسية', 'Écouter le français'); b.type = 'button';
            b.addEventListener('click', () => speak(parts, { rate: 0.85, btn: b }));
            m.append(b); applyLang(document.documentElement.lang);
          }
          log.scrollTop = log.scrollHeight;
        }
      };
    }
    const welcome = () => addMsg('bot', 'مرحباً! أنا معلمك للغة الفرنسية. اسألني بالعربية أو بالفرنسية.\nBonjour ! Posez-moi vos questions sur le français.');
    welcome();

    const input = h('textarea'); input.rows = 2; input.maxLength = 2000; input.dir = 'auto';
    input.dataset.phAr = 'اكتب سؤالك بالعربية أو الفرنسية...'; input.dataset.phFr = 'Écrivez votre question en arabe ou en français…';
    const sendBtn = txt(h('button', 'btn'), 'إرسال', 'Envoyer'); sendBtn.type = 'button';
    const clear = txt(h('button', 'btn ghost small'), 'مسح المحادثة', 'Effacer la discussion'); clear.type = 'button';

    async function send() {
      const text = input.value.trim();
      if (!text || busy) return;
      addMsg('user', text); input.value = '';
      const key = keyIn.value.trim();
      if (!key) {
        const ar = document.documentElement.lang !== 'fr';
        addMsg('bot', ar ? 'أدخل مفتاح الـ API أولاً من الإعدادات بالأعلى ثم أعد إرسال سؤالك.' : 'Entrez d’abord votre clé API dans les paramètres, puis renvoyez votre question.');
        settings.open = true; keyIn.focus(); return;
      }
      busy = true; sendBtn.disabled = true;
      const pending = addMsg('bot', '…');
      history.push({ role: 'user', content: text });
      try {
        const reply = await callAI(provider.value, model.value.trim() || PROVIDERS[provider.value].model, key, history.slice(-12), buildPrompt(modeSel.value, levelSel.value));
        if (!reply) throw Object.assign(new Error('empty'), { status: 0 });
        history.push({ role: 'assistant', content: reply });
        pending.set(reply, true);
      } catch (e) {
        history.pop();
        pending.set(aiError(e));
      } finally { busy = false; sendBtn.disabled = false; input.focus(); }
    }
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
    clear.addEventListener('click', () => { history = []; stopSpeaking(); log.replaceChildren(); welcome(); });

    const pick = (ar, fr, storeKey, def, opts) => {
      const sel = h('select');
      opts.forEach(([v, oa, of]) => { const o = txt(h('option'), oa, of); o.value = v; sel.append(o); });
      sel.value = opts.some(o => o[0] === store.get(storeKey)) ? store.get(storeKey) : def;
      sel.addEventListener('change', () => store.set(storeKey, sel.value));
      const l = h('label', 'inline'); l.append(txt(h('span'), ar, fr), sel); return [l, sel];
    };
    const [modeLabel, modeSel] = pick('الوضع', 'Mode', 'ai_mode', 'explain', [
      ['explain', 'شرح', 'Explication'], ['correct', 'تصحيح جملي', 'Correction'], ['quiz', 'اختبار قصير', 'Quiz'], ['talk', 'محادثة', 'Conversation']]);
    const [levelLabel, levelSel] = pick('المستوى', 'Niveau', 'ai_level', '1sec', [
      ['1sec', 'الأول الثانوي', '1re secondaire'], ['2sec', 'الثاني الثانوي', '2e secondaire'], ['3sec', 'الثالث الثانوي', '3e secondaire']]);
    const toolbar = h('div', 'toolbar'); toolbar.append(modeLabel, levelLabel);

    const micControls = [];
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const langSel = h('select'); langSel.append(new Option('FR', 'fr-FR'), new Option('AR', 'ar-EG'));
      const mic = txt(h('button', 'btn ghost small'), '🎤 تحدث', '🎤 Parler'); mic.type = 'button';
      let rec = null;
      mic.addEventListener('click', () => {
        if (rec) { rec.stop(); return; }
        stopSpeaking();
        rec = new SR(); rec.lang = langSel.value; rec.interimResults = false; rec.maxAlternatives = 1;
        mic.classList.add('speaking');
        rec.onresult = e => { input.value = `${input.value} ${e.results[0][0].transcript}`.trim(); };
        rec.onend = rec.onerror = () => { rec = null; mic.classList.remove('speaking'); input.focus(); };
        rec.start();
      });
      micControls.push(langSel, mic);
    }

    const samples = h('div', 'filters');
    [['اشرح لي الـ passé composé ببساطة', 'Explique-moi le passé composé simplement'],
     ['Corrige ma phrase : Je suis allé à l’école hier avec mes amis.', 'Corrige ma phrase : Je suis allé à l’école hier avec mes amis.'],
     ['كيف أقول بالفرنسية: أريد كوباً من الشاي؟', 'Comment dire en français : أريد كوباً من الشاي ?']].forEach(([ar, fr]) => {
      const b = txt(h('button', 'filter'), ar, fr); b.type = 'button';
      b.addEventListener('click', () => { input.value = b.dataset[document.documentElement.lang === 'fr' ? 'fr' : 'ar']; input.focus(); });
      samples.append(b);
    });
    const row = h('div', 'chat-input'); row.append(input, sendBtn);
    const tools = h('div', 'speak-actions'); tools.append(clear, ...micControls);
    host.replaceChildren(settings, toolbar, log, samples, row, tools);
    applyLang(document.documentElement.lang);
  }

  /* ---------- Exams (timer + automatic grading) ---------- */
  const L = (ar, fr) => (document.documentElement.lang === 'fr' ? fr : ar);
  const fmtTime = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const round1 = x => Math.round(x * 10) / 10;
  const GRADES = [[90, 'ممتاز', 'Excellent'], [80, 'جيد جداً', 'Très bien'], [65, 'جيد', 'Bien'], [50, 'مقبول', 'Passable'], [0, 'يحتاج إلى مراجعة', 'À revoir']];
  const wordCount = t => (t.trim().match(/\S+/g) || []).length;

  function gradeQuestion(q, ans) {
    if (q.type === 'writing') {
      const items = q.rubric.map(r => ({ ...r, hit: new RegExp(r.pattern, 'i').test(ans) }));
      const per = q.marks / items.length;
      return { score: round1(items.filter(i => i.hit).length * per), items, ok: items.every(i => i.hit), answered: ans.trim().length > 0 };
    }
    const accept = [q.answer, ...(q.accept || [])];
    const ok = !!ans.trim() && accept.some(x => norm(x) === norm(ans));
    return { score: ok ? q.marks : 0, ok, answered: !!ans.trim() };
  }

  function reportItem(r, no) {
    const { q, ans, g } = r;
    const box = h('article', 'q');
    const icon = g.ok ? '✔' : (g.score > 0 ? '◐' : '✖');
    const t = h('h4', 'q-title', `${icon} ${no}.`); t.append(' ', frText('span', q.prompt_fr), h('span', 'score', `  ${g.score} / ${q.marks}`));
    box.append(t);
    const mine = h('p'); mine.append(txt(h('strong'), 'إجابتك: ', 'Votre réponse : '));
    if (g.answered) mine.append(q.type === 'writing' ? h('span', 'wrap', ans) : frText('span', ans));
    else mine.append(txt(h('em'), 'لم تُجب', 'Pas de réponse'));
    box.append(mine);
    if (q.type === 'writing') {
      const ul = h('ul', 'rubric');
      g.items.forEach(i => ul.append(h('li', i.hit ? 'right' : 'wrong', `${i.hit ? '✔' : '✖'} ${i.ar}`)));
      const model = h('p'); model.append(txt(h('strong'), 'نموذج إجابة: ', 'Modèle : '), frText('span', q.model_answer_fr), ' ', speakBtn('استمع', 'Écouter', q.model_answer_fr));
      box.append(ul, model);
    } else if (!g.ok) {
      const c = h('p', 'answer'); c.append(txt(h('strong'), 'الإجابة الصحيحة: ', 'Bonne réponse : '), frText('span', q.answer)); box.append(c);
    }
    const why = h('p', 'why'); why.append(txt(h('strong'), 'التفسير: ', 'Explication : '), q.explanation_ar);
    const rule = h('p', 'rule'); rule.append(txt(h('strong'), 'القاعدة: ', 'Règle : '), q.rule_ar);
    box.append(why, rule);
    return box;
  }

  function showReport(ex, results, total, usedSec, ctx) {
    const score = round1(results.reduce((n, r) => n + r.g.score, 0));
    const pct = Math.round(score / total * 100);
    const grade = GRADES.find(x => pct >= x[0]);
    const prev = parseFloat(store.get('exam_best_' + ex.id));
    if (!(prev >= score)) store.set('exam_best_' + ex.id, String(score));

    const wrap = h('div', 'report');
    const hero = h('div', 'hero');
    hero.append(h('div', 'big', `${score} / ${total}`), h('p', null, `${pct}% · ${L(grade[1], grade[2])}`), h('p', 'note', `⏱ ${fmtTime(usedSec)}`));
    wrap.append(txt(h('h2'), 'نتيجة الامتحان', 'Résultat de l’examen'), hero);

    const tbl = h('table', 'conj-table'); const tb = h('tbody'); tbl.append(tb);
    ex.sections.forEach(s => {
      const rs = results.filter(r => r.s === s);
      const tr = h('tr'); const th = h('th', null, s.title_ar); th.scope = 'row';
      tr.append(th, h('td', null, `${round1(rs.reduce((n, r) => n + r.g.score, 0))} / ${rs.reduce((n, r) => n + r.q.marks, 0)}`)); tb.append(tr);
    });
    wrap.append(txt(h('h3'), 'الدرجات حسب الأقسام', 'Notes par partie'), tbl);

    const wrong = results.filter(r => r.g.score < r.q.marks);
    const rules = [...new Set(wrong.map(r => r.q.rule_ar))];
    if (rules.length) {
      const ul = h('ul', 'examples'); rules.forEach(x => ul.append(h('li', null, x)));
      wrap.append(txt(h('h3'), 'نقاط تحتاج إلى مراجعة', 'À réviser'), ul);
    }
    let no = 0;
    const numbered = results.map(r => ({ r, no: ++no }));
    if (wrong.length) {
      wrap.append(txt(h('h3'), `تقرير الأخطاء (${wrong.length})`, `Rapport d’erreurs (${wrong.length})`));
      numbered.filter(x => x.r.g.score < x.r.q.marks).forEach(x => wrap.append(reportItem(x.r, x.no)));
    } else wrap.append(txt(h('p', 'feedback'), '🎉 إجاباتك كلها صحيحة!', '🎉 Toutes vos réponses sont justes !'));
    const good = numbered.filter(x => x.r.g.score >= x.r.q.marks);
    if (good.length) {
      const d = h('details', 'settings'); d.append(txt(h('summary'), `الإجابات الصحيحة وتفسيرها (${good.length})`, `Réponses justes et explications (${good.length})`));
      good.forEach(x => d.append(reportItem(x.r, x.no))); wrap.append(d);
    }
    const acts = h('div', 'speak-actions');
    const again = txt(h('button', 'btn'), 'إعادة الامتحان', 'Refaire l’examen'); again.type = 'button';
    const back = txt(h('button', 'btn ghost'), 'كل الامتحانات', 'Tous les examens'); back.type = 'button';
    again.addEventListener('click', () => runExam(ex, ctx)); back.addEventListener('click', ctx.menu);
    acts.append(again, back); wrap.append(acts);
    ctx.host.replaceChildren(wrap); applyLang(document.documentElement.lang); window.scrollTo({ top: 0 });
  }

  function runExam(ex, ctx) {
    const form = h('form', 'exam'); form.noValidate = true;
    form.addEventListener('submit', e => e.preventDefault());
    const qs = ex.sections.flatMap(s => s.questions.map(q => ({ s, q })));
    const total = qs.reduce((n, x) => n + x.q.marks, 0);
    const started = Date.now(), endAt = started + ex.duration_min * 60000;
    const timer = h('span', 'timer', fmtTime(ex.duration_min * 60));
    const submit = txt(h('button', 'btn'), 'تسليم الامتحان', 'Rendre la copie'); submit.type = 'button';
    const bar = h('div', 'exam-bar'); bar.append(h('strong', null, '⏱'), timer, submit);
    form.append(bar, h('p', 'note', ex.instructions_ar));

    let no = 0;
    ex.sections.forEach(s => {
      const sec = h('section', 'lesson');
      const hd = h('div', 'lesson-head'); const tt = h('div');
      tt.append(h('h2', null, s.title_ar), frText('p', s.title_fr));
      hd.append(tt, h('span', 'score', `${s.questions.reduce((m, q) => m + q.marks, 0)} ${L('درجة', 'pts')}`)); sec.append(hd);
      if (s.passage_fr) {
        const p = h('div', 'passage'); p.append(frText('p', s.passage_fr), speakBtn('استمع للنص', 'Écouter le texte', s.passage_fr, 0.8)); sec.append(p);
      }
      s.questions.forEach(q => {
        const fs = h('fieldset', 'q'); const lg = h('legend');
        lg.append(`${++no}. `, frText('span', q.prompt_fr), ` (${q.marks})`); fs.append(lg);
        if (q.prompt_ar) fs.append(h('p', 'note', q.prompt_ar));
        if (q.type === 'choice') {
          shuffled(q.options).forEach(o => {
            const l = h('label', 'opt-radio'); const r = h('input'); r.type = 'radio'; r.name = q.id; r.value = o;
            l.append(r, frText('span', o)); fs.append(l);
          });
        } else if (q.type === 'text') {
          const i = h('input', 'cell-input wide'); i.type = 'text'; i.name = q.id; i.autocomplete = 'off'; i.lang = 'fr'; i.dir = 'ltr'; fs.append(i);
        } else {
          const ta = h('textarea', 'writing'); ta.name = q.id; ta.rows = 6; ta.lang = 'fr'; ta.dir = 'ltr'; ta.spellcheck = false;
          const cnt = h('small', 'note', `0 / ${q.min_words}+`);
          ta.addEventListener('input', () => { cnt.textContent = `${wordCount(ta.value)} / ${q.min_words}+`; });
          fs.append(ta, cnt);
        }
        sec.append(fs);
      });
      form.append(sec);
    });

    let done = false;
    const guard = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      timer.textContent = fmtTime(left); timer.classList.toggle('warn', left <= 300);
      if (left === 0) finish(true);
    };
    const iv = setInterval(tick, 500);
    function finish(auto) {
      if (done) return;
      const results = qs.map(({ s, q }) => {
        const el = form.elements[q.id]; const ans = (el && el.value) || '';
        return { s, q, ans, g: gradeQuestion(q, ans) };
      });
      const unanswered = results.filter(r => !r.g.answered).length;
      if (!auto && unanswered && !confirm(L(`لديك ${unanswered} سؤالاً بدون إجابة. هل تريد التسليم؟`, `${unanswered} question(s) sans réponse. Rendre la copie ?`))) return;
      done = true; clearInterval(iv); window.removeEventListener('beforeunload', guard); stopSpeaking();
      showReport(ex, results, total, Math.min(Math.round((Date.now() - started) / 1000), ex.duration_min * 60), ctx);
    }
    submit.addEventListener('click', () => finish(false));
    ctx.host.replaceChildren(form); applyLang(document.documentElement.lang); window.scrollTo({ top: 0 });
  }

  async function loadExams() {
    const host = $('#examsHost');
    try {
      const data = await getJSON('data/exams.json');
      const menu = () => {
        host.replaceChildren(...data.exams.map(ex => {
          const total = ex.sections.reduce((n, s) => n + s.questions.reduce((m, q) => m + q.marks, 0), 0);
          const best = store.get('exam_best_' + ex.id);
          const card = h('article', 'lesson');
          const head = h('div', 'lesson-head'); const tt = h('div');
          tt.append(h('h2', null, ex.title_ar), frText('p', ex.title_fr));
          const go = txt(h('button', 'btn'), 'ابدأ الامتحان', 'Commencer'); go.type = 'button';
          go.addEventListener('click', () => runExam(ex, { host, menu }));
          head.append(tt, go); card.append(head);
          card.append(h('p', null, `⏱ ${ex.duration_min} ${L('دقيقة', 'min')} · ${L('الدرجة الكاملة', 'Total')}: ${total}${best ? ` · ${L('أفضل نتيجة', 'Meilleur score')}: ${best}` : ''}`));
          card.append(h('p', 'note', ex.sections.map(s => s.title_ar).join(' · ')), h('p', 'note', ex.instructions_ar));
          return card;
        }));
        applyLang(document.documentElement.lang);
      };
      menu();
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  /* ---------- PWA: install button ---------- */
  function setupInstall() {
    const btn = $('#installBtn'); let deferred = null;
    const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (!standalone()) btn.hidden = false;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
    window.addEventListener('appinstalled', () => { btn.hidden = true; deferred = null; });
    btn.addEventListener('click', async () => {
      if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; return; }
      alert(L('لتثبيت التطبيق:\n- آيفون: افتح الموقع في Safari ثم زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».\n- أندرويد: افتح قائمة المتصفح ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».\nيعمل التثبيت عندما يكون الموقع على رابط آمن (https).',
        'Pour installer :\n- iPhone : ouvrez le site dans Safari, puis Partager, puis « Sur l’écran d’accueil ».\n- Android : menu du navigateur ⋮, puis « Installer l’application ».\nL’installation exige une adresse sécurisée (https).'));
    });
  }

  /* ---------- Voice check panel (phonetics section) ---------- */
  function renderVoiceCheck() {
    const host = $('#voiceCheck'); if (!host) return;
    const st = h('p', 'voice-status'); st.id = 'voiceStatus';
    const test = txt(h('button', 'btn small'), '🔊 اختبار الصوت', '🔊 Tester le son'); test.type = 'button';
    test.addEventListener('click', () => speak('Bonjour ! Je suis votre professeur de français.', { btn: test, rate: 0.85 }));
    const help = h('details', 'settings');
    help.append(txt(h('summary'), 'الصوت لا يعمل؟', 'Pas de son ?'), txt(h('p', 'note wrap'),
      '1) ارفع صوت الجهاز، وأوقف الوضع الصامت في آيفون.\n2) ثبّت صوتاً فرنسياً:\n- أندرويد: الإعدادات ▸ تحويل النص إلى كلام ▸ تثبيت بيانات الصوت ▸ الفرنسية.\n- آيفون: الإعدادات ▸ تسهيلات الاستخدام ▸ المحتوى المنطوق ▸ الأصوات ▸ الفرنسية.\n- ويندوز: الإعدادات ▸ الوقت واللغة ▸ اللغة ▸ إضافة الفرنسية مع الحزمة الصوتية.\n3) افتح التطبيق مباشرة في Chrome أو Safari بدلاً من فتحه داخل تطبيق آخر، لأن بعضها لا يدعم الصوت.',
      '1) Montez le volume ; désactivez le mode silencieux sur iPhone.\n2) Installez une voix française :\n- Android : Réglages ▸ Synthèse vocale ▸ Installer les données vocales ▸ Français.\n- iPhone : Réglages ▸ Accessibilité ▸ Contenu énoncé ▸ Voix ▸ Français.\n- Windows : Paramètres ▸ Heure et langue ▸ Langue ▸ Ajouter le français avec le module vocal.\n3) Ouvrez l’application directement dans Chrome ou Safari plutôt que dans une autre application.'));
    host.replaceChildren(st, test, help);
    updateVoiceStatus(); applyLang(document.documentElement.lang);
  }

  /* ---------- Textbook-style solutions (built from curriculum.json) ---------- */
  async function loadSolutions() {
    const host = $('#solutionsHost');
    try {
      const data = await getJSON('data/curriculum.json');
      const panelsList = [], labels = [];
      data.years.forEach(y => {
        const wrap = h('div');
        const blocks = [...(y.units || []).map(u => ({ title: `${u.number}. ${u.title_ar}`, sub: u.title_fr, list: u.exercises })),
                        ...y.lessons.map(l => ({ title: l.title_ar, sub: l.title_fr, list: l.questions }))];
        let total = 0;
        blocks.forEach(b => {
          const card = h('article', 'lesson');
          const head = h('div', 'lesson-head'); const tt = h('div');
          tt.append(h('h2', null, b.title), frText('p', b.sub)); head.append(tt, h('span', 'score', `${b.list.length} ${L('أسئلة', 'questions')}`));
          card.append(head);
          b.list.forEach((q, i) => { const el = renderQuestion(q, i); card.append(el); const t = $('.btn', el); if (t) t.click(); total++; });
          wrap.append(card);
        });
        wrap.prepend(h('p', 'score', `${total} ${L('سؤالاً مع حلوله وتفسيرها', 'questions avec corrigés et explications')}`));
        panelsList.push(wrap); labels.push(y.id.replace('sec', 'Sec'));
      });
      host.replaceChildren(tabBar(labels, panelsList), ...panelsList);
      applyLang(document.documentElement.lang);
    } catch (e) { failMsg(host); applyLang(document.documentElement.lang); }
  }

  /* ---------- Init ---------- */
  applyLang(store.get('lang') === 'fr' ? 'fr' : 'ar');
  showSection(currentId());
  loadCurriculum();
  loadSolutions();
  loadGrammar();
  loadPhonetics();
  loadDictionary();
  loadDialogues();
  loadTales();
  loadStories();
  loadAssistant();
  renderVoiceCheck();
  loadExams();
  setupInstall();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(() => {});
})();
