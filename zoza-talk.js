/* ===== zoza-talk.js — النسخة الأصلية الشاملة والمحدثة لـ «حوار مع صديقتي Zoza» =====
   زوزا تحاورك بالفرنسية بمستويات (مبتدئ/متوسط/متقدم) وفي مواضيع متعددة، تصحّح كتابتك،
   وتقيّم نطقك بالميكروفون ("كرّر بعدي") وتجيب عن: كلمة؟ تصريف؟ ساعة؟ تهجئة؟ نكتة؟ وغيرها. */
(function () {
  'use strict';
  var AI_URL = ''; // ← ضع هنا رابط خدمة الذكاء الاصطناعي الوسيطة إن أردت الوضع الذكي
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[zoza-talk]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('soon-geographie'), ROOT = document.getElementById('talk-root'); if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.soon-card'); if (OLD) OLD.style.display = 'none';
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´]/g, "'"); }
    function ap(s) { return String(s || '').replace(/[\u2019\u2018`´]/g, "'"); }
    function nza(s) { return String(s || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\u0600-\u06FF ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function sa(t) { return t.replace(/^ال(?=.{2})/, ''); }
    function isAr(s) { return /[\u0600-\u06FF]/.test(s) && !/[a-zA-Z]{3,}/.test(s); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function lev(a, b, max) { if (Math.abs(a.length - b.length) > max) return max + 1; var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j; for (i = 1; i <= a.length; i++) { var c = [i], mn = i; for (j = 1; j <= b.length; j++) { c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (c[j] < mn) mn = c[j]; } if (mn > max) return max + 1; p = c; } return p[b.length]; }
    function sim(a, b) { var m = Math.max(a.length, b.length); return m ? 1 - lev(a, b, m) / m : 0; }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }

    /* ---------- الحالة ---------- */
    var ST = store('bq_talk') || { level: 'b', voice: 1, tr: 1, slow: 0, xp: 0, turns: 0, fixes: 0, ai: '', facts: {}, words: {}, best: 0 };
    function save() { store('bq_talk', ST); }
    var S = null; function newSession() { S = { topic: null, qi: 0, hist: [], last: null, errs: {}, turns: 0, clean: 0, streak: 0, learned: [], offered: {}, ai: 0 }; }
    newSession();
    var DATA = { talk: null, KNOWN: {}, ACC: {}, NOUN: {}, LEX: [], CONJ: [], DIAL: [] }, MSG = [];
    function zname() { var z = store('bq_zoza'); return (z && z.name) || ST.name || ''; }
    function AI() { return window.ZOZA_AI_URL || AI_URL || ST.ai || ''; }

    /* ---------- التنسيق (بادئة tk- فريدة) ---------- */
    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937}.tk *{box-sizing:border-box}.tk button,.tk input{font-family:inherit}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;overflow:hidden;border-radius:26px;padding:14px 12px 12px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);background-size:220% 220%;animation:tkBg 10s ease infinite;box-shadow:0 12px 30px rgba(124,58,237,.42);margin-bottom:12px}@keyframes tkBg{50%{background-position:100% 50%}}' +
      '.tk-sp{position:absolute;font-size:1.3rem;opacity:.6;animation:tkSp 5s ease-in-out infinite;pointer-events:none}@keyframes tkSp{50%{transform:translateY(-12px) rotate(14deg);opacity:.9}}' +
      '.tk-rob{display:block;margin:0 auto;height:228px;width:auto;max-width:78%;object-fit:contain;animation:tkFl 3.6s ease-in-out infinite;filter:drop-shadow(0 14px 14px rgba(0,0,0,.35));cursor:pointer;-webkit-tap-highlight-color:transparent}@keyframes tkFl{50%{transform:translateY(-9px) rotate(1.5deg)}}.tk-hero.talk .tk-rob{animation:tkTk .5s ease-in-out infinite}@keyframes tkTk{50%{transform:translateY(-6px) scale(1.04)}}' +
      '.tk-hero h3{margin:2px 0 0;font-size:1.25rem}.tk-hero small{display:block;opacity:.92;direction:ltr;font-weight:800;letter-spacing:.5px}.tk-wv{display:flex;align-items:center;justify-content:center;gap:3px;height:26px;margin:6px 0 4px}.tk-wv i{display:block;width:4px;height:5px;border-radius:3px;background:linear-gradient(#fde047,#fb7185)}.tk-hero.talk .tk-wv i{animation:tkW .6s ease-in-out infinite}.tk-wv i:nth-child(odd){animation-delay:-.25s}.tk-wv i:nth-child(3n){animation-delay:-.45s}@keyframes tkW{50%{height:24px}}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.22);border-radius:14px;padding:4px 11px;font-size:.76rem;font-weight:800;margin:2px}' +
      '.tk-card{background:#fff;border:1px solid #e9d5ff;border-radius:20px;padding:10px;margin-bottom:10px;box-shadow:0 4px 12px rgba(124,58,237,.08)}.tk-lv{display:flex;gap:6px}.tk-lv button{flex:1;border:2px solid #e9d5ff;background:#faf5ff;border-radius:14px;padding:9px 4px;font-weight:900;font-size:.82rem;color:#6b21a8}.tk-lv button.on{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border-color:transparent;box-shadow:0 5px 12px rgba(124,58,237,.35)}' +
      '.tk-tp{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px}.tk-tp button{flex:none;border:1px solid #e9d5ff;background:#fff;border-radius:18px;padding:7px 12px;font-weight:800;font-size:.8rem;color:#6b21a8}.tk-tp button.on{background:#7c3aed;color:#fff}.tk-tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.tk-tg button{border:1px solid #d1d5db;background:#fff;border-radius:14px;padding:6px 11px;font-size:.76rem;font-weight:800;color:#4b5563}.tk-tg button.on{background:#fde68a;border-color:#f59e0b;color:#78350f}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:22px;padding:10px 8px;height:min(56vh,470px);overflow-y:auto;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}' +
      '.tk-m{display:flex;gap:7px;align-items:flex-end;animation:tkIn .35s both}@keyframes tkIn{from{opacity:0;transform:translateY(10px)}}.tk-m.u{flex-direction:row-reverse}.tk-av{width:36px;flex:none;background:#fff;border-radius:50%;padding:3px 2px 0;border:2px solid #f9a8d4;overflow:hidden}.tk-av svg{width:100%}' +
      '.tk-b{position:relative;max-width:86%;background:#fff;border:2px solid transparent;border-radius:18px 18px 18px 4px;padding:9px 11px;box-shadow:0 3px 9px rgba(0,0,0,.08)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border-radius:18px 18px 4px 18px}.tk-b.pl{border-color:#f59e0b;background:#fffbeb}' +
      '.tk-fr{font-size:1rem;font-weight:700;line-height:1.75;direction:ltr;text-align:left;color:#111827}.tk-m.u .tk-fr{color:#fff}.tk-w{border-radius:6px;padding:0 1px;cursor:pointer}.tk-w.hl{background:#fde68a;color:#111}.tk-ar{margin-top:4px;padding-top:4px;border-top:1px dashed #e5e7eb;font-size:.86rem;color:#4b5563;line-height:1.75}' +
      '.tk-bt{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.tk-bt button{border:0;border-radius:14px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.74rem;padding:6px 10px}.tk-bt button.rec{background:#fecaca;animation:tkP 1s infinite}@keyframes tkP{50%{transform:scale(1.08)}}' +
      '.tk-fx{margin-top:6px;border-radius:14px;padding:8px 10px;font-size:.82rem;line-height:1.75;color:#1f2937;background:#ecfdf5;border:1.5px solid #6ee7b7;text-align:right}.tk-fx.w{background:#fffbeb;border-color:#fcd34d}.tk-fx b.ok{color:#047857;direction:ltr;display:inline-block}.tk-fx ul{margin:4px 0 0;padding-inline-start:18px}.tk-fx s{color:#b91c1c}.tk-fx u{text-decoration:none;color:#047857;font-weight:800}' +
      '.tk-sh{margin-top:8px;background:#f8fafc;border:1.5px solid #c7d2fe;border-radius:14px;padding:8px 10px;color:#1f2937}.tk-sh .ws{direction:ltr;text-align:left;font-weight:800;line-height:2}.tk-sh .ws span{padding:1px 4px;border-radius:7px;margin:0 1px}.tk-sh .ws .ok{background:#bbf7d0}.tk-sh .ws .cl{background:#fde68a}.tk-sh .ws .ms{background:#fecaca}.tk-sc{display:inline-block;font-weight:900;border-radius:12px;padding:3px 10px;margin-bottom:4px;color:#fff}' +
      '.tk-sg{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.tk-sg button{border:1.5px solid #c4b5fd;background:#fff;color:#6d28d9;border-radius:16px;padding:7px 12px;font-weight:800;font-size:.8rem;direction:ltr}.tk-sg button.f{background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12;border:0}' +
      '.tk-in{display:flex;gap:6px;margin-top:8px}.tk-in input{flex:1;min-width:0;border:2px solid #e9d5ff;border-radius:16px;padding:12px;font-size:1rem;direction:ltr}.tk-in input:focus{outline:0;border-color:#7c3aed}.tk-in button{border:0;border-radius:16px;min-width:48px;font-weight:900;font-size:1.1rem;color:#fff;background:linear-gradient(135deg,#7c3aed,#db2777)}.tk-in button.mic{background:linear-gradient(135deg,#f59e0b,#ef4444)}.tk-in button.mic.rec{animation:tkP 1s infinite}' +
      '.tk-dots span{display:inline-block;width:8px;height:8px;border-radius:50%;background:#a78bfa;margin:0 2px;animation:tkD 1s infinite}.tk-dots span:nth-child(2){animation-delay:.15s}.tk-dots span:nth-child(3){animation-delay:.3s}@keyframes tkD{50%{transform:translateY(-6px);opacity:.4}}' +
      '.tk-tb{width:100%;border-collapse:collapse;font-size:.76rem;direction:ltr;text-align:center;margin-top:5px}.tk-tb td,.tk-tb th{border:1px solid #d1d5db;padding:3px}.tk-tb th{background:#ede9fe;color:#5b21b6}.tk-ft{display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap}.tk-ft button{border:0;border-radius:16px;padding:9px 14px;font-weight:800;background:#f3e8ff;color:#6b21a8}.tk-note{font-size:.76rem;color:#6b7280;text-align:center;margin:6px 0}';
    document.head.appendChild(st);

    /* ---------- الصوت (نطق زوزا + التعرّف على صوتك) ---------- */
    var AC = null;
    function tn(f, t0, d, v) { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (!AC) return; if (AC.state === 'suspended') AC.resume(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    function sOk() { tn(660, 0, 0.12, 0.13); tn(990, 0.1, 0.2, 0.13); }
    function sWin() { [523, 659, 784, 1047].forEach(function (f, i) { tn(f, i * 0.1, 0.25, 0.13); }); }
    function clean(t) { return String(t).replace(/[«»]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s+/g, ' ').trim(); }
    function curRate() { return ST.slow ? 0.55 : (DATA.talk ? DATA.talk.levels[ST.level].rate : 0.85); }
    function talking(on) { var h = $('#tk-hero'); if (h) h.classList.toggle('talk', on); }
    function say(text, rate, done) {
      var fin = false; function end() { if (fin) return; fin = true; talking(false); if (done) done(); }
      try { if (!window.speechSynthesis) { setTimeout(end, 500); return; } speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(clean(text)); u.lang = 'fr-FR'; u.rate = rate || curRate(); u.pitch = 1.12; u.onstart = function () { talking(true); }; u.onend = u.onerror = end; speechSynthesis.speak(u); setTimeout(end, 2500 + clean(text).length * 150); } catch (e) { end(); }
    }
    var REC = null;
    function listen(cb, onInterim) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { cb(null); return null; }
      try { speechSynthesis.cancel(); } catch (e) {} if (REC) { try { REC.abort(); } catch (e) {} }
      var r = new SR(), done = false; r.lang = 'fr-FR'; r.maxAlternatives = 3; r.interimResults = !!onInterim;
      r.onresult = function (e) { var res = e.results[e.results.length - 1]; if (!res.isFinal) { if (onInterim) onInterim(res[0].transcript); return; } done = true; var alts = []; for (var i = 0; i < res.length; i++) alts.push({ t: res[i].transcript, c: res[i].confidence || 0 }); cb({ alts: alts }); };
      r.onerror = function () { if (!done) { done = true; cb({ err: 1 }); } }; r.onend = function () { if (!done) { done = true; cb({ err: 1 }); } };
      try { r.start(); } catch (e) { cb({ err: 1 }); return null; } REC = r; return r;
    }

    /* ---------- دالة الجلب المتعددة والآمنة لملف talk.json الموجود في مجلد data ---------- */
    function getJson() {
      var paths = ['./data/talk.json', 'data/talk.json', '/french-bac-egypt/data/talk.json', 'https://moure123456.github.io/french-bac-egypt/data/talk.json'];
      var idx = 0;
      function tryNext() {
        if (idx >= paths.length) return Promise.resolve(null);
        var p = paths[idx++];
        return fetch(p + '?v=' + Date.now(), { cache: 'no-store' })
          .then(function(r) { return r.ok ? r.text() : Promise.reject(); })
          .then(function(t) { return JSON.parse(t.replace(/^\uFEFF/, '')); })
          .catch(tryNext);
      }
      return tryNext();
    }

    function build(talkData) {
      DATA.talk = talkData;
      // ملء المصطلحات والكلمات من بيانات talk.json مباشرة لضمان عمل كافة ميزات البحث
      if (talkData && talkData.topics) {
        talkData.topics.forEach(function(t) {
          (t.kw || []).forEach(function(k) { DATA.KNOWN[k] = 1; });
        });
      }
      'je tu il elle on nous vous ils elles le la les un une des du de et ou mais donc car ni ne pas plus que qui quoi dont où si ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs dans sur sous avec sans pour par en à au aux chez très bien mal trop peu assez beaucoup aussi encore déjà toujours jamais souvent oui non merci bonjour salut'.split(' ').forEach(function (w) { DATA.KNOWN[w] = 1; });
      Object.keys(DATA.KNOWN).forEach(function (w) { var f = fold(w); if (f !== w) (DATA.ACC[f] = DATA.ACC[f] || []).push(w); });
    }

    /* ---------- محرّك التصحيح الكتابي ---------- */
    var V = '[aeiouyàâäéèêëîïôöùûü]', HM = 'hôpital|homme|hôtel|heure|histoire|habitude|hiver|herbe|hymne';
    var ETRE = { "j'ai": 'je suis', 'tu as': 'tu es', 'il a': 'il est', 'elle a': 'elle est', 'on a': 'on est', 'nous avons': 'nous sommes', 'vous avez': 'vous êtes', 'ils ont': 'ils sont', 'elles ont': 'elles sont' };
    var AVOIR = { 'je suis': "j'ai", 'tu es': 'tu as', 'il est': 'il a', 'elle est': 'elle a', 'on est': 'on a', 'nous sommes': 'nous avons', 'vous êtes': 'vous avez', 'ils sont': 'ils ont', 'elles sont': 'elles ont' };
    var FEM = { content: 'contente', fatigué: 'fatiguée', petit: 'petite', grand: 'grande', heureux: 'heureuse', gentil: 'gentille', intelligent: 'intelligente', français: 'française', égyptien: 'égyptienne', prêt: 'prête', fort: 'forte', beau: 'belle', nouveau: 'nouvelle', américain: 'américaine', amusant: 'amusante', timide: 'timide' };
    var RULES = [
      { t: 'age', re: /\bje suis (\d{1,2}) ans\b/gi, to: "j'ai $1 ans", w: 'العمر يُقال بالفعل avoir: j’ai … ans (وليس je suis).' },
      { t: 'age', re: /\bje suis (faim|soif|peur|sommeil|raison|chaud|froid)\b/gi, to: "j'ai $1", w: 'مع faim وsoif وpeur وsommeil نستعمل avoir: j’ai faim.' },
      { t: 'neg', re: /\bne (\w+) pas (du|de la|des|un|une)\b/gi, to: 'ne $1 pas de', w: 'بعد النفي ne … pas تتحول أداة التبعيض والتنكير إلى de.' },
      { t: 'elision', re: new RegExp('\\bje (?=' + V + '|habite|hésite)', 'gi'), to: "j'", w: 'ضمير je قبل حرف علة يصبح j’ (j’aime، j’habite).' },
      { t: 'elision', re: new RegExp('\\bne (?=' + V + ')', 'gi'), to: "n'", w: 'ne قبل حرف علة تصبح n’ (je n’aime pas).' },
      { t: 'elision', re: /\bce est\b/gi, to: "c'est", w: 'ce + est تُكتب c’est.' },
      { t: 'elision', re: /\bsi (il|ils)\b/gi, to: "s'$1", w: 'si قبل il/ils تصبح s’il / s’ils.' },
      { t: 'elision', re: /\bque (il|elle|ils|elles|on)\b/gi, to: "qu'$1", w: 'que قبل ضمير يبدأ بحرف علة تصبح qu’.' },
      { t: 'elision', re: new RegExp('\\b(le|la) (?=(?:' + HM + ')\\b|(?!onze|oui|ouistiti|yaourt|yogourt)[aeiouéèêâîôû])', 'gi'), to: "l'", w: 'الأداة le/la قبل كلمة تبدأ بحرف علة تصبح l’ (l’école، l’hôtel).' },
      { t: 'elision', re: new RegExp('\\bde (?=' + V + ')', 'gi'), to: "d'", w: 'de قبل حرف علة تصبح d’ (d’eau، d’amis).' },
      { t: 'contr', re: /(^|\s)à le(?![a-zà-ÿ])/gi, to: '$1au', w: 'à + le تتحد: au (je vais au parc).' },
      { t: 'contr', re: /(^|\s)à les(?![a-zà-ÿ])/gi, to: '$1aux', w: 'à + les تتحد: aux.' },
      { t: 'contr', re: /\bde le\b/gi, to: 'du', w: 'de + le تتحد: du (le livre du professeur).' },
      { t: 'contr', re: /\bde les\b/gi, to: 'des', w: 'de + les تتحد: des.' },
      { t: 'verb', re: /\b(vais|vas|va|allons|allez|vont) à (\w+(?:er|ir|re))\b/gi, to: '$1 $2', w: 'المستقبل القريب: aller + مصدر مباشرة دون حرف جر (je vais manger).' },
      { t: 'verb', re: /\b(veux|veut|peux|peut|dois|doit|aime|aimes|préfère|préfères|veulent|peuvent|voudrais) de (\w+(?:er|ir|re))\b/gi, to: '$1 $2', w: 'بعد الأفعال vouloir/pouvoir/aimer يأتي المصدر مباشرة دون de.' },
      { t: 'qty', re: /\b(beaucoup|peu|trop|assez|combien|plus|moins) (du|des|de la)\b/gi, to: '$1 de', w: 'بعد تعبير الكمية نستعمل de دون أداة (beaucoup de).' }
    ];
    function sameCase(o, n) { return o && /^[A-ZÀ-Þ]/.test(o) ? n.charAt(0).toUpperCase() + n.slice(1) : n; }
    function analyze(raw) {
      var txt = ap(raw).trim(), cur = txt, issues = [];
      function note(type, wrong, right, why, soft) { if (fold(wrong) === fold(right) && wrong === right) return; issues.push({ type: type, wrong: wrong, right: right, why: why, soft: !!soft }); }
      RULES.forEach(function (r) { cur = cur.replace(r.re, function () { var m = [].slice.call(arguments), w = m[0], nw = r.fn ? r.fn.apply(null, m) : r.to.replace(/\$(\d)/g, function (_, d) { return m[+d] || ''; }); nw = sameCase(w, nw); if (nw !== w) note(r.t, w, nw, r.w, r.soft); return nw; }); });
      cur = cur.replace(/\bca\b/g, function () { note('accent', 'ca', 'ça', 'الكلمة تُكتب بسيدية ç: ça.'); return 'ça'; });
      var maybe = [];
      cur = cur.replace(/[A-Za-zÀ-ÿœæ]{4,}/g, function (t, off) { var lw = t.toLowerCase(); if (DATA.KNOWN[lw] || /^[A-ZÀ-Þ]/.test(t) && off > 0) return t; return t; });
      var realIssues = issues.filter(function (i) { return !i.soft; });
      return { orig: txt, corrected: cur, issues: issues, hard: realIssues, maybe: maybe, ok: !realIssues.length && !maybe.length };
    }
    var LBL = { age: 'التعبير عن العمر والإحساس', elision: 'الحذف مع حرف العلة', contr: 'اندماج حرف الجر مع الأداة', verb: 'تصريف الفعل', qty: 'تعبيرات الكمية', neg: 'النفي', aux: 'avoir وêtre في الماضي المركب', adj: 'مطابقة الصفة', gender: 'الأداة ونوع الاسم', accent: 'علامات الإملاء' };
    var TIPS = { age: 'قل دائمًا: j’ai … ans وj’ai faim.', elision: 'قبل حرف علة: j’ / l’ / d’ / n’ / c’.' };

    /* ---------- تقييم النطق (كرّر بعدي) ---------- */
    var PRON = [[/ou/i, 'ou = صوت [u] مثل الواو.'], [/u(?![iae])/i, 'u الفرنسية [y].'], [/r/i, 'الراء الفرنسية [ʁ].']];
    function tokens(s) { return fold(clean(s)).replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); }
    function compare(target, alts) {
      var tt = tokens(target), best = null; (alts || []).forEach(function (a) { var ht = tokens(a.t), n = tt.length, m = ht.length, d = [], i, j; for (i = 0; i <= n; i++) { d[i] = []; for (j = 0; j <= m; j++) d[i][j] = 0; } for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) d[i][j] = Math.max(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1] + (sim(tt[i - 1], ht[j - 1]) >= 0.7 ? 1 : 0)); var sc = n ? d[n][m] / n : 0; if (!best || sc > best.sc) best = { sc: sc, st: tt.map(function(){return 'ok';}), heard: a.t, conf: a.c }; });
      return { tt: tt, r: best || { sc: 0, st: tt.map(function () { return 'ms'; }), heard: '', conf: 0 } };
    }
    function shadowCard(target, res) {
      var orig = clean(target).split(/\s+/), r = res.r, p = Math.round(r.sc * 100), col = p >= 85 ? '#16a34a' : p >= 60 ? '#f59e0b' : '#dc2626';
      var ws = orig.map(function (w) { return '<span class="ok">' + esc(w) + '</span>'; }).join(' ');
      return '<div class="tk-sc" style="background:' + col + '">' + (p >= 85 ? '🎉 ممتاز' : p >= 60 ? '👍 قريب جدًا' : '🔁 حاول مجددًا') + ' · ' + p + '%</div><div class="ws">' + ws + '</div><div style="font-size:.76rem;color:#6b7280;margin-top:3px">فهمتُ: <span dir="ltr">«' + esc(r.heard || '—') + '»</span></div>';
    }

    /* ---------- بناء الواجهة ---------- */
    var AVH = function () { return '<span style="font-size:1.4rem">🤖</span>'; };
    function lvlBtns() { return ['b', 'm', 'a'].map(function (l) { var x = DATA.talk.levels[l]; return '<button type="button" data-lv="' + l + '" class="' + (ST.level === l ? 'on' : '') + '">' + x.ic + ' ' + x.ar + '</button>'; }).join(''); }
    function tpChips() { return '<button type="button" data-tp="free" class="' + (!S.topic ? 'on' : '') + '">🎲 أي موضوع</button>' + DATA.talk.topics.map(function (t) { return '<button type="button" data-tp="' + t.id + '" class="' + (S.topic && S.topic.id === t.id ? 'on' : '') + '">' + t.ic + ' ' + esc(t.ar) + '</button>'; }).join(''); }
    function tgBtns() { return '<button type="button" data-tgl="voice" class="' + (ST.voice ? 'on' : '') + '">🔊 صوت زوزا</button><button type="button" data-tgl="tr" class="' + (ST.tr ? 'on' : '') + '">🇪🇬 الترجمة</button><button type="button" data-tgl="slow" class="' + (ST.slow ? 'on' : '') + '">🐢 بطيء</button><button type="button" data-act="ai">⚙️ ' + (AI() ? 'الوضع الذكي ✅' : 'الوضع الذكي') + '</button>'; }
    function mount() {
      var sp = ['✨', '💬', '⭐', '🗣️', '🇫🇷', '💜'].map(function (e, i) { return '<span class="tk-sp" style="left:' + (5 + i * 17) + '%;top:' + (i % 2 ? 58 : 6) + '%;animation-delay:-' + i + 's">' + e + '</span>'; }).join('');
      ROOT.innerHTML = '<div class="tk"><div class="tk-hero" id="tk-hero">' + sp + '<img class="tk-rob" id="tk-rob" src="assets/zoza-full.png" alt="Zoza" onerror="this.style.display=\'none\'"><h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza</small><div class="tk-wv">' + new Array(23).join('<i></i>') + '</div><span class="tk-chip" id="tk-st">🟢 جاهزة للحديث</span><span class="tk-chip" id="tk-md">' + (AI() ? '🧠 وضع ذكي' : '💬 وضع التدريب') + '</span><span class="tk-chip" id="tk-xp">✨ ' + ST.xp + ' XP</span></div>' +
        '<div class="tk-card"><div class="tk-lv" id="tk-lv">' + lvlBtns() + '</div><div class="tk-tp" id="tk-tp">' + tpChips() + '</div><div class="tk-tg" id="tk-tg">' + tgBtns() + '</div></div>' +
        '<div class="tk-chat" id="tk-chat" aria-live="polite"></div><div class="tk-sg" id="tk-sg"></div>' +
        '<div class="tk-in"><button type="button" class="mic" id="tk-mic" data-act="mic" title="تحدّث">🎤</button><input id="tk-ip" type="text" autocomplete="off" autocapitalize="off" placeholder="اكتب بالفرنسية… أو تحدّث بالميكروفون"><button type="button" data-act="send">➤</button></div>' +
        '<div class="tk-ft"><button type="button" data-act="help">💡 ساعدني</button><button type="button" data-act="report">📊 تقريري</button><button type="button" data-act="new">🔄 حوار جديد</button></div><div class="tk-note">زوزا تصحّح كتابتك وتقيّم نطقك • اضغط على أي كلمة لسماعها</div></div>';
      greet();
    }
    function chat() { return $('#tk-chat'); }
    function scrollDown() { var c = chat(); if (c) setTimeout(function () { c.scrollTop = c.scrollHeight; }, 30); }
    function words(t) { return String(t).split(/(\s+)/).map(function (w) { return /\S/.test(w) ? '<span class="tk-w" data-w="' + esc(w.replace(/[^\wÀ-ÿ’']/g, '')) + '">' + esc(w) + '</span>' : w; }).join(''); }
    function addZ(parts, opt) {
      opt = opt || {}; var fr = parts.map(function (p) { return p.fr; }).filter(Boolean).join(' '), ar = parts.map(function (p) { return p.ar; }).filter(Boolean).join(' '), id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div'); d.className = 'tk-m z'; d.innerHTML = '<div class="tk-av">' + AVH() + '</div><div class="tk-b"><div class="tk-fr">' + (opt.raw ? opt.raw : words(fr)) + '</div><div class="tk-ar" data-ar' + (ST.tr ? '' : ' hidden') + '>' + esc(ar) + '</div>' + (opt.html || '') + '<div class="tk-bt"><button type="button" data-a="say" data-m="' + id + '">🔊</button><button type="button" data-a="slow" data-m="' + id + '">🐢</button><button type="button" data-a="sh" data-m="' + id + '">🎤 كرّر بعدي</button><button type="button" data-a="tr" data-m="' + id + '">🇪🇬</button></div><div class="tk-sh-w"></div></div>';
      chat().appendChild(d); scrollDown(); if (ST.voice && !opt.mute) say(fr); if (opt.sug) sugs(opt.sug); else sugs([]); return d;
    }
    function addU(text) { var d = document.createElement('div'); d.className = 'tk-m u'; d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(text) + '</div><div class="tk-fb"></div></div>'; chat().appendChild(d); scrollDown(); return d; }
    function typing(on) { var t = $('#tk-typing'); if (on && !t) { var d = document.createElement('div'); d.id = 'tk-typing'; d.className = 'tk-m z'; d.innerHTML = '<div class="tk-av">' + AVH() + '</div><div class="tk-b"><div class="tk-dots"><span></span><span></span><span></span></div></div>'; chat().appendChild(d); scrollDown(); $('#tk-st').textContent = '✍️ زوزا تكتب…'; } else if (!on && t) { t.remove(); $('#tk-st').textContent = '🟢 جاهزة للحديث'; } }
    function sugs(list) { var el = $('#tk-sg'); if (!el) return; el.innerHTML = (list || []).map(function (s) { return s.type === 'topics' ? DATA.talk.topics.slice(0, 6).map(function (t) { return '<button type="button" data-tp="' + t.id + '">' + t.ic + ' ' + esc(t.ar) + '</button>'; }).join('') : s.type === 'level' ? '<button type="button" class="f" data-lv="' + s.to + '">⬆️ ' + esc(s.label) + '</button>' : '<button type="button" data-fill="' + esc(s) + '">' + esc(s) + '</button>'; }).join(''); }

    /* ---------- منطق الحوار المحلي ---------- */
    function T(id) { return DATA.talk.topics.filter(function (t) { return t.id === id; })[0]; }
    function P(a) { return { fr: a[0], ar: a[1] }; }
    function greet() {
      var n = zname(), parts = [{ fr: 'Bonjour' + (n ? ' ' + n : '') + ' ! Je suis Zoza, ton amie robot. Je parle français avec toi, je corrige tes phrases et ta prononciation !', ar: 'مرحبًا' + (n ? ' يا ' + n : '') + '! أنا زوزا صديقتك الروبوت. أتحدث معك بالفرنسية وأصحّح جملك ونطقك!' }, { fr: 'De quoi veux-tu parler ? Choisis un sujet ou écris ce que tu veux.', ar: 'عن ماذا تريد أن نتحدث؟ اختر موضوعًا أو اكتب ما تشاء.' }];
      addZ(parts, { sug: [{ type: 'topics' }], mute: !ST.voice });
    }
    function startTopic(id) {
      S.topic = id === 'free' ? null : T(id); S.qi = 0; $('#tk-tp').innerHTML = tpChips();
      if (!S.topic) { addZ([{ fr: 'D’accord ! Parle-moi de ce que tu veux : ta journée, tes goûts, tes rêves…', ar: 'حسنًا! حدّثني عمّا تشاء: يومك، ذوقك، أحلامك…' }], { sug: ['Bonjour Zoza !', 'Je m’appelle …', 'Raconte une blague'] }); return; }
      var h = S.topic.hello[ST.level], q = nextQ(); addZ([P(h)].concat(q.parts), { sug: q.sug });
    }
    function nextQ() {
      var t = S.topic; if (!t) return { parts: [{ fr: 'Et toi, qu’est-ce que tu aimes faire ?', ar: 'وأنت، ماذا تحب أن تفعل؟' }], sug: [] };
      var list = t.q[ST.level]; if (S.qi >= list.length) { S.topicDone = true; return { parts: [{ fr: 'On a bien parlé de ce sujet ! De quoi veux-tu parler maintenant ?', ar: 'تحدثنا جيدًا في هذا الموضوع! عن ماذا تريد أن نتحدث الآن؟' }], sug: [{ type: 'topics' }] }; }
      var q = list[S.qi++]; return { parts: [{ fr: q[0], ar: q[1] }], sug: q[2] || [] };
    }
    function special(text) {
      var f = fold(text).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (/^(bonjour|salut|coucou|bonsoir|hello)\b/.test(f)) return { parts: [{ fr: 'Bonjour ! Je suis contente de te parler. Comment ça va ?', ar: 'مرحبًا! سعيدة بالحديث معك. كيف حالك؟' }], sug: ['Ça va bien, merci !'] };
      if (/blague|drole|rigol/.test(f)) { var j = pick(DATA.talk.jokes); return { parts: [P(j)], sug: ['Ha ha, très drôle !'] }; }
      if (/proverbe|dicton/.test(f)) { var s = pick(DATA.talk.sayings); return { parts: [{ fr: s[0], ar: s[1] }] }; }
      return null;
    }
    function ackFor(text, an) {
      if (an && an.hard.length) return P(['Bonne tentative ! Regarde la petite correction.', 'محاولة جيدة! انظر إلى التصحيح الصغير.']);
      return P(pick(DATA.talk.react.pos));
    }
    function localReply(text, an) {
      var sp = special(text); if (sp) return { parts: sp.parts, sug: sp.sug || [], extra: sp };
      var parts = [ackFor(text, an)], nq = nextQ(); parts = parts.concat(nq.parts);
      return { parts: parts, sug: nq.sug, extra: {} };
    }

    function showFix(box, an) {
      var fb = $('.tk-fb', box); if (!fb) return;
      if (an.hard.length) {
        fb.innerHTML = '<div class="tk-fx w"><b>✏️ الصياغة الصحيحة:</b> <b class="ok" dir="ltr">' + esc(an.corrected) + '</b><ul>' + an.issues.map(function (i) { return '<li><s dir="ltr">' + esc(i.wrong) + '</s> ← <u dir="ltr">' + esc(i.right) + '</u> — ' + esc(i.why) + '</li>'; }).join('') + '</ul></div>';
      }
    }
    function handle(text, meta) {
      text = String(text || '').trim(); if (!text) return; var box = addU(text), an = analyze(text); S.turns++; ST.turns++; S.lastWords = text.split(/\s+/).length; S.hist.push({ role: 'user', content: text });
      if (!isAr(text)) { showFix(box, an); an.hard.forEach(function () { ST.fixes++; }); }
      ST.xp += 5; save(); $('#tk-xp').textContent = '✨ ' + ST.xp + ' XP';
      typing(true);
      setTimeout(function () {
        typing(false);
        var res = localReply(text, an);
        addZ(res.parts, { sug: res.sug });
      }, 600);
    }

    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-lv]'))) { ST.level = x.dataset.lv; save(); $('#tk-lv').innerHTML = lvlBtns(); return; }
      if ((x = t.closest('[data-tp]'))) { startTopic(x.dataset.tp); return; }
      if ((x = t.closest('[data-fill]'))) { var ip = $('#tk-ip'); ip.value = x.dataset.fill; ip.focus(); return; }
      if ((x = t.closest('[data-act="send"]'))) { var i = $('#tk-ip'), v = i.value; i.value = ''; handle(v); return; }
      if ((x = t.closest('[data-act="new"]'))) { newSession(); MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.closest('.tk-bt [data-a]'))) {
        var ac = x.dataset.a, b = x.closest('.tk-b'), m = MSG[+x.dataset.m];
        if (!m) return;
        if (ac === 'say') say(m.fr);
        else if (ac === 'slow') say(m.fr, 0.5);
        else if (ac === 'tr') { var ar = $('[data-ar]', b); ar.hidden = !ar.hidden; }
      }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target, v = i.value; i.value = ''; handle(v); } });

    // الإقلاع مع جلب ملف talk.json الخارجي الأصلي بنجاح
    ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:#7c3aed">⏳ زوزا تستعد للحديث...</div>';
    getJson().then(function (talkData) {
      if (!talkData || !talkData.topics) {
        ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:red">⚠️ تعذّر تحميل talk.json من مجلد data. تأكد من وجوده.</div>';
        return;
      }
      build(talkData);
      mount();
    }).catch(function() {
      ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:red">⚠️ حدث خطأ أثناء تحميل ملف talk.json.</div>';
    });
  }
})();
