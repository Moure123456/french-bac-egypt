/* ===== zoza-talk.js — «حوار مع صديقتي Zoza» =====
   زوزا تحاورك بالفرنسية بمستويات (مبتدئ/متوسط/متقدم) وفي مواضيع متعددة، تصحّح كتابتك (إملاء، أدوات، تصريف، حذف...)،
   وتقيّم نطقك بالميكروفون ("كرّر بعدي") وتجيب عن: كلمة؟ تصريف؟ ساعة؟ تهجئة؟ نكتة؟ وغيرها — دون إنترنت.
   وضع ذكي اختياري: اضبط AI_URL (أو من ⚙️) على خدمة وسيطة (zoza-worker.js) لحوار حرّ في أي موضوع.
   يعمل داخل #talk-root فقط ولا يؤثر على أي قسم آخر. */
(function () {
  'use strict';
  var AI_URL = ''; // ← ضع هنا رابط خدمة الذكاء الاصطناعي الوسيطة إن أردت الوضع الذكي (اتركه فارغًا للوضع المحلي)
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

    /* ---------- تحميل البيانات وبناء المعارف ---------- */
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    function addTokens(t) { (ap(t).toLowerCase().match(/[a-zà-ÿœæ]+/g) || []).forEach(function (w) { DATA.KNOWN[w] = 1; }); }
    function build(r) {
      DATA.talk = r[0]; var fm = {}, lexSeen = {};
      function addW(fr, ar) { var m = fr.match(/^(le|la|un|une) (.+)$/i), core = fr.replace(/^(l'|le |la |les |un |une |des )/i, ''); addTokens(fr); var k = fold(core); if (!lexSeen[k]) { lexSeen[k] = 1; DATA.LEX.push({ fr: fr, ar: ar, k: k, a: nza(ar).split(' ').map(sa).join(' ') }); } if (m) { var g = /^(le|un)$/i.test(m[1]) ? 'm' : 'f', n = fold(m[2]); if (fm[n] && fm[n] !== g) fm[n] = 'x'; else fm[n] = g; } }
      if (r[1] && r[1].categories) r[1].categories.forEach(function (c) { c.words.forEach(function (w) { addW(w[0], w[1]); }); });
      if (r[2] && r[2].categories) r[2].categories.forEach(function (c) { c.words.forEach(function (w) { addW(w[0], w[1]); addTokens(w[2] || ''); }); });
      Object.keys(fm).forEach(function (n) { if (fm[n] !== 'x') DATA.NOUN[n] = fm[n]; });
      if (r[3] && r[3].dialogues) r[3].dialogues.forEach(function (d) { d.lines.forEach(function (l) { addTokens(l.fr); DATA.DIAL.push(l); }); });
      if (r[4]) { (r[4].stories || []).concat(r[4].songs || []).forEach(function (s) { addTokens(s.content); }); }
      if (r[5] && r[5].levels) { r[5].levels.forEach(function (l) { (l.rules || []).forEach(function (x) { (x.examples || []).forEach(addTokens); }); }); (r[5].conjugations || []).forEach(function (c) { var t = (c.tenses || []).filter(function (x) { return /pr[ée]sent/i.test(x.name_fr); })[0] || (c.tenses || [])[0]; if (t) DATA.CONJ.push({ verb: c.verb, forms: t.forms, c: c }); (c.tenses || []).forEach(function (x) { (x.forms || []).forEach(addTokens); }); addTokens(c.verb); }); }
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
      { t: 'qty', re: /\b(beaucoup|peu|trop|assez|combien|plus|moins) (du|des|de la)\b/gi, to: '$1 de', w: 'بعد تعبير الكمية نستعمل de دون أداة (beaucoup de).' },
      { t: 'neg', re: new RegExp("\\b(je|tu|il|elle|on|nous|vous|ils|elles|j') ?(suis|es|est|sommes|êtes|sont|ai|as|a|avons|avez|ont|vais|vas|va|allons|allez|vont|veux|veut|peux|peut|aime|aimes|aiment|sais|sait|connais|parle|parles|mange|bois|fais|fait|comprends|comprend|voudrais|dois|doit) pas\\b", 'gi'), fn: function (m, p, v) { var sp = p === "j'" ? "j'" : p + ' '; return /^[aeiouyhàâéèê]/i.test(v) && p !== "j'" ? p + " n'" + v + ' pas' : (p === "j'" ? "je n'" + v + ' pas' : sp + 'ne ' + v + ' pas'); }, w: 'النفي في الكتابة بجزأين: ne … pas (حذف ne مقبول في الكلام العامي فقط).', soft: 1 }
    ];
    function sameCase(o, n) { return o && /^[A-ZÀ-Þ]/.test(o) ? n.charAt(0).toUpperCase() + n.slice(1) : n; }
    function analyze(raw) {
      var txt = ap(raw).trim(), cur = txt, issues = [];
      function note(type, wrong, right, why, soft) { if (fold(wrong) === fold(right) && wrong === right) return; issues.push({ type: type, wrong: wrong, right: right, why: why, soft: !!soft }); }
      RULES.forEach(function (r) { cur = cur.replace(r.re, function () { var m = [].slice.call(arguments), w = m[0], nw = r.fn ? r.fn.apply(null, m) : r.to.replace(/\$(\d)/g, function (_, d) { return m[+d] || ''; }); nw = sameCase(w, nw); if (nw !== w) note(r.t, w, nw, r.w, r.soft); return nw; }); });
      // اختيار المساعد avoir/être
      cur = cur.replace(/\b(j'ai|tu as|il a|elle a|on a|nous avons|vous avez|ils ont|elles ont) (allé|allée|allés|allées|venu|venue|arrivé|arrivée|arrivés|parti|partie|partis|rentré|rentrée|sorti|resté|restée|tombé|né|née|monté|descendu|entré|retourné)(?![a-zà-ÿ])/gi, function (w, a, p) { var nw = sameCase(w, ETRE[a.toLowerCase()] + ' ' + p); note('aux', w, nw, 'أفعال الحركة (aller, venir, arriver, partir, rentrer…) تأخذ être في الماضي المركب.'); return nw; });
      cur = cur.replace(/\b(je suis|tu es|il est|elle est|on est|nous sommes|vous êtes|ils sont|elles sont) (mangé|bu|vu|pris|dit|lu|écrit|joué|regardé|compris|étudié|appris|eu|été|travaillé|parlé|écouté)(?![a-zà-ÿ])/gi, function (w, a, p) { var nw = sameCase(w, AVOIR[a.toLowerCase()] + ' ' + p); note('aux', w, nw, 'معظم الأفعال تأخذ avoir في الماضي المركب (j’ai mangé).'); return nw; });
      // مطابقة الصفة مع elle
      cur = cur.replace(/\belle est ([a-zà-ÿ]+)(?![a-zà-ÿ])/gi, function (w, a) { var f = FEM[a.toLowerCase()]; if (f && f !== a.toLowerCase()) { var nw = 'elle est ' + f; note('adj', w, sameCase(w, nw), 'الفاعل مؤنث فتتبعه الصفة: ' + f + '.'); return sameCase(w, nw); } return w; });
      // أداة/نوع الاسم من قاموس الكلمات
      cur = cur.replace(/\b(un|une|le|la|ce|cette|mon|ma|ton|ta|son|sa) ([a-zà-ÿ]+)(?![a-zà-ÿ])/gi, function (w, art, n) { var g = DATA.NOUN[fold(n)], a = art.toLowerCase(); if (!g) return w; var vow = /^[aeiouyàâéèêîôû]/i.test(n), fem = { un: 'une', le: 'la', ce: 'cette', mon: 'ma', ton: 'ta', son: 'sa' }, mas = { une: 'un', la: 'le', cette: 'ce', ma: 'mon', ta: 'ton', sa: 'son' }, nw = null; if (g === 'f' && fem[a]) { if (vow && /^(mon|ton|son|le)$/.test(a)) return w; nw = fem[a] + ' ' + n; } else if (g === 'm' && mas[a]) { if (vow && /^(ma|ta|sa|la)$/.test(a)) return w; nw = mas[a] + ' ' + n; } if (nw) { nw = sameCase(w, nw); note('gender', w, nw, n + ' كلمة ' + (g === 'f' ? 'مؤنثة' : 'مذكّرة') + ': ' + nw + '.'); return nw; } return w; });
      // تصريف الأفعال مع الضمائر (المضارع)
      var PI = { 'je': 0, "j'": 0, 'tu': 1, 'il': 2, 'elle': 2, 'on': 2, 'nous': 3, 'vous': 4, 'ils': 5, 'elles': 5 };
      cur = cur.replace(/\b(je|j'|tu|il|elle|on|nous|vous|ils|elles)\s*([a-zà-ÿ]+)(?![a-zà-ÿ])/gi, function (w, p, v) {
        var pk = p.toLowerCase(), pi = PI[pk], vl = v.toLowerCase(), hit = null; if (pi === undefined) return w;
        DATA.CONJ.some(function (c) { var f = c.forms.map(function (x) { return String(x).toLowerCase().replace(/^(j'|je |tu |il\/elle |il |elle |nous |vous |ils\/elles |ils )/, ''); }); if (f[pi] === vl) { hit = 'ok'; return true; } if (vl === c.verb.toLowerCase() && !/^(veux|peux|dois|vais|vas|va|allons|allez|vont)$/i.test('')) { hit = { c: c, f: f }; return true; } var idx = f.indexOf(vl); if (idx > -1 && idx !== pi && f.filter(function (x) { return x === f[idx]; }).length === 1 && f[pi] !== f[idx]) { hit = { c: c, f: f, bad: 1 }; return true; } return false; });
        if (hit && hit !== 'ok') { var right = hit.f[pi], sep = pk === "j'" || (pk === 'je' && right === undefined) ? '' : ' '; if (!right) return w; var nw = sameCase(w, (pk === "j'" ? "j'" : p) + (pk === "j'" ? '' : ' ') + right); if (pk === 'je' && /^[aeiouyàâéèêîôû]/i.test(right)) nw = sameCase(w, "j'" + right); note('verb', w, nw, hit.bad ? 'الفعل ' + hit.c.verb + ' مع ' + p + ' يُصرَّف: ' + right + '.' : 'بعد الضمير ' + p + ' لا نستعمل المصدر بل الفعل المصرَّف: ' + right + '.'); return nw; } return w; });
      cur = cur.replace(/\bca\b/g, function () { note('accent', 'ca', 'ça', 'الكلمة تُكتب بسيدية ç: ça.'); return 'ça'; });
      // الإملاء: علامات التشكيل (ثقة عالية) + تنبيه إملائي محتمل
      var maybe = [], first = true;
      cur = cur.replace(/[A-Za-zÀ-ÿœæ]{4,}/g, function (t, off) { var lw = t.toLowerCase(); if (DATA.KNOWN[lw] || /^[A-ZÀ-Þ]/.test(t) && off > 0) return t; var base = lw.replace(/(s|x|es|e|ent|er|ez|ons|ais|ait|é|ée|és)$/, ''); if (base.length >= 3 && (DATA.KNOWN[base] || DATA.KNOWN[base + 'e'] || DATA.KNOWN[base + 'er'])) return t; var f = fold(lw), a = DATA.ACC[f]; if (a && a.length === 1) { var nw = sameCase(t, a[0]); note('accent', t, nw, 'الكلمة تُكتب بعلامات: ' + a[0] + '.'); return nw; } if (lw.length <= 14) { var best = null, bd = lw.length >= 8 ? 2 : 1, cnt = 0; Object.keys(DATA.KNOWN).forEach(function (k) { if (Math.abs(k.length - lw.length) > 1 || k[0] !== lw[0]) return; var d = lev(lw, k, bd); if (d <= bd) { if (d < bd || !best) { best = k; bd = d; cnt = 1; } else cnt++; } }); if (best && cnt === 1) maybe.push({ wrong: t, right: best }); } return t; });
      var realIssues = issues.filter(function (i) { return !i.soft; });
      return { orig: txt, corrected: cur, issues: issues, hard: realIssues, maybe: maybe, ok: !realIssues.length && !maybe.length };
    }
    var LBL = { age: 'التعبير عن العمر والإحساس', elision: 'الحذف مع حرف العلة', contr: 'اندماج حرف الجر مع الأداة', verb: 'تصريف الفعل', qty: 'تعبيرات الكمية', neg: 'النفي', aux: 'avoir وêtre في الماضي المركب', adj: 'مطابقة الصفة', gender: 'الأداة ونوع الاسم', accent: 'علامات الإملاء' };
    var TIPS = { age: 'قل دائمًا: j’ai … ans وj’ai faim.', elision: 'قبل حرف علة: j’ / l’ / d’ / n’ / c’.', contr: 'à+le=au ، à+les=aux ، de+le=du ، de+les=des.', verb: 'راجع تصريف المضارع في قسم Grammaire أو اسألني: «conjugue aller».', qty: 'beaucoup de / un peu de بدون أداة.', neg: 'ne … pas حول الفعل.', aux: 'أفعال الحركة مع être والباقي مع avoir.', adj: 'مع الفاعل المؤنث أضف e للصفة.', gender: 'احفظ الاسم مع أداته: la maison، le livre.', accent: 'انتبه إلى é è ê à ù ç.' };

    /* ---------- تقييم النطق (كرّر بعدي) ---------- */
    var PRON = [[/ou/i, 'ou = صوت [u] مثل الواو، لا تنطقها «أو».'], [/u(?![iae])/i, 'u الفرنسية [y]: ضمّ شفتيك كما تقول «و» وانطق «إي».'], [/r/i, 'الراء الفرنسية [ʁ] من الحلق بخفة، لا تُدحرج اللسان.'], [/(on|om)(?![aeiouyhnm])/i, 'on = أنف [ɔ̃]: الصوت يمرّ من الأنف ولا تنطق n.'], [/(an|am|en|em)(?![aeiouyhnm])/i, 'an/en = [ɑ̃] أنفية واسعة.'], [/(in|ain|ein|im)(?![aeiouyhnm])/i, 'in/ain = [ɛ̃] أنفية.'], [/eau|au/i, 'au / eau = [o] مغلقة.'], [/oi/i, 'oi = [wa] مثل «وا».'], [/ch/i, 'ch = [ʃ] مثل «ش».'], [/(^|[^s])j|g(e|i)/i, 'j وge = [ʒ] مثل الجيم الخفيفة في «جاراج».'], [/gn/i, 'gn = [ɲ] مثل «ني».'], [/ill/i, 'ill غالبًا [j] مثل «ي».'], [/qu/i, 'qu = [k] والـ u صامتة.'], [/ç/i, 'ç = [s].'], [/tion/i, 'tion = [sjɔ̃] مثل «سيون» أنفية.'], [/^h/i, 'h في بداية الكلمة صامتة.'], [/(s|t|d|x|z|p|g)$/i, 'الحرف الأخير غالبًا صامت.'], [/e$/i, 'e الأخيرة صامتة.'], [/(é|ez$|er$)/i, 'é / er / ez = [e] مغلقة (إي).'], [/è|ê|ai|ei/i, 'è / ai = [ɛ] مفتوحة.'], [/eu|œu/i, 'eu = [ø] شفتان مستديرتان وانطق «إي».']];
    function tokens(s) { return fold(clean(s)).replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); }
    function compare(target, alts) {
      var tt = tokens(target), best = null; (alts || []).forEach(function (a) { var ht = tokens(a.t), n = tt.length, m = ht.length, d = [], i, j; for (i = 0; i <= n; i++) { d[i] = []; for (j = 0; j <= m; j++) d[i][j] = 0; } for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) d[i][j] = Math.max(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1] + (sim(tt[i - 1], ht[j - 1]) >= 0.7 ? 1 : 0)); var st = [], k, used = []; for (k = 0; k < n; k++) { var bs = 0, bj = -1; for (j = 0; j < m; j++) { var s = sim(tt[k], ht[j]); if (s > bs && used.indexOf(j) < 0) { bs = s; bj = j; } } if (bs >= 0.999) { st.push('ok'); used.push(bj); } else if (bs >= 0.7) { st.push('cl'); used.push(bj); } else st.push('ms'); } var sc = n ? st.reduce(function (a, x) { return a + (x === 'ok' ? 1 : x === 'cl' ? 0.6 : 0); }, 0) / n : 0; if (!best || sc > best.sc) best = { sc: sc, st: st, heard: a.t, conf: a.c }; });
      return { tt: tt, r: best || { sc: 0, st: tt.map(function () { return 'ms'; }), heard: '', conf: 0 } };
    }
    function shadowCard(target, res) {
      var orig = clean(target).split(/\s+/), r = res.r, p = Math.round(r.sc * 100), col = p >= 85 ? '#16a34a' : p >= 60 ? '#f59e0b' : '#dc2626', tips = [];
      var ws = orig.map(function (w, i) { var s = r.st[i] || 'ms'; if (s !== 'ok' && tips.length < 3) { var tp = PRON.filter(function (x) { return x[0].test(fold(w)) || x[0].test(w); }).slice(0, 1); if (tp.length) tips.push('<b dir="ltr">' + esc(w.replace(/[.,!?]/g, '')) + '</b>: ' + esc(tp[0][1])); } return '<span class="' + s + '">' + esc(w) + '</span>'; }).join(' ');
      return '<div class="tk-sc" style="background:' + col + '">' + (p >= 85 ? '🎉 ممتاز' : p >= 60 ? '👍 قريب جدًا' : '🔁 حاول مجددًا') + ' · ' + p + '%</div><div class="ws">' + ws + '</div><div style="font-size:.76rem;color:#6b7280;margin-top:3px">فهمتُ: <span dir="ltr">«' + esc(r.heard || '—') + '»</span> · 🟩 صحيح 🟨 قريب 🟥 لم أسمعه</div>' + (tips.length ? '<ul style="margin:5px 0 0;padding-inline-start:18px;font-size:.78rem;line-height:1.7">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' : '');
    }

    /* ---------- بناء الواجهة ---------- */
    var AVH = function () { return (window.__zozaHead ? window.__zozaHead('') : '<span style="font-size:1.4rem">🤖</span>'); };
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
      var n = zname(), parts = [{ fr: 'Bonjour' + (n ? ' ' + n : '') + ' ! Je suis Zoza, ton amie robot. Je parle français avec toi, je corrige tes phrases et ton prononciation !'.replace('ton prononciation', 'ta prononciation'), ar: 'مرحبًا' + (n ? ' يا ' + n : '') + '! أنا زوزا صديقتك الروبوت. أتحدث معك بالفرنسية وأصحّح جملك ونطقك!' }, { fr: 'De quoi veux-tu parler ? Choisis un sujet ou écris ce que tu veux.', ar: 'عن ماذا تريد أن نتحدث؟ اختر موضوعًا أو اكتب ما تشاء.' }];
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
    function frNum(n) { return String(n); }
    var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    function lookup(q) {
      var res = [], tq;
      if (isAr(q)) { tq = nza(q).split(' ').map(sa).filter(function (x) { return x.length >= 2; }); DATA.LEX.forEach(function (w) { if (res.length < 3 && tq.some(function (t) { return w.a.split(' ').indexOf(t) > -1; })) res.push(w); }); }
      else { var k = fold(q).replace(/^(l'|le |la |les |un |une |des )/, '').replace(/[^a-z' ]/g, '').trim(); DATA.LEX.forEach(function (w) { if (res.length < 3 && k.length >= 2 && (w.k === k || (k.length >= 4 && w.k.indexOf(k) === 0))) res.push(w); }); }
      return res;
    }
    function special(text, an) {
      var f = fold(text).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(), m, now = new Date();
      if (/^(bonjour|salut|coucou|bonsoir|hello)\b/.test(f) && f.split(' ').length <= 4) return { parts: [{ fr: 'Bonjour ! Je suis contente de te parler. Comment ça va ?', ar: 'مرحبًا! سعيدة بالحديث معك. كيف حالك؟' }], sug: ['Ça va bien, merci !', 'Ça va mal.'] };
      if (/(comment (ca )?va|ca va\b|tu vas bien|comment vas tu|comment allez vous)/.test(f) && /\?|comment|tu vas/.test(text) ) return { parts: [{ fr: 'Je vais très bien, merci ! Mes circuits sont en pleine forme. Et toi ?', ar: 'أنا بخير شكرًا! دوائري في أحسن حال. وأنت؟' }], sug: ['Moi aussi, ça va bien.', 'Je suis un peu fatigué.'] };
      if (/(comment tu t appelles|tu t appelles comment|ton nom|qui es tu)/.test(f)) return { parts: [{ fr: 'Je m’appelle Zoza ! Je suis une petite robot-prof qui adore le français.', ar: 'اسمي زوزا! أنا روبوت معلّمة صغيرة تعشق الفرنسية.' }] };
      if (/(quel age as tu|ton age|tu as quel age)/.test(f)) return { parts: [{ fr: 'Je suis née dans un téléphone, alors j’ai l’âge de l’application ! Et toi, tu as quel âge ?', ar: 'وُلدتُ داخل هاتف، فعمري بعمر التطبيق! وأنت كم عمرك؟' }] };
      if (/(ou habites tu|tu habites ou|ou vis tu)/.test(f)) return { parts: [{ fr: 'J’habite dans ton téléphone. C’est petit mais très confortable !', ar: 'أسكن في هاتفك. صغير لكنه مريح جدًا!' }] };
      if (/quelle heure/.test(f)) { var hh = now.getHours(), mm = now.getMinutes(); return { parts: [{ fr: 'Il est ' + hh + ' heures' + (mm ? ' ' + mm : '') + '.', ar: 'الساعة الآن ' + hh + ':' + (mm < 10 ? '0' : '') + mm + '.' }] }; }
      if (/(quel jour|quelle date|on est quel|quel est la date)/.test(f)) return { parts: [{ fr: 'Aujourd’hui, nous sommes ' + DAYS[now.getDay()] + ' ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear() + '.', ar: 'اليوم هو ' + DAYS_AR[now.getDay()] + ' ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear() + '.' }] };
      if (/(quel temps fait il|la meteo|il fait beau)/.test(f)) return { parts: [{ fr: 'Je n’ai pas de fenêtre, mais regarde le ciel ! Il fait beau chez toi ?', ar: 'ليس لدي نافذة، لكن انظر إلى السماء! هل الطقس جميل عندك؟' }] };
      if (/blague|drole|rigol/.test(f)) { var j = pick(DATA.talk.jokes); return { parts: [P(j)], sug: ['Ha ha, très drôle !', 'Encore une blague !'] }; }
      if (/(proverbe|dicton|citation)/.test(f)) { var s = pick(DATA.talk.sayings); return { parts: [{ fr: s[0], ar: s[1] }], sug: ['C’est joli !'] }; }
      if (/virelangue/.test(f)) { var v = pick(DATA.talk.twisters); return { parts: [{ fr: v[0], ar: v[1] + ' — اضغط «🎤 كرّر بعدي» لتجرّب نطقها!' }] }; }
      if (/^(merci|merci beaucoup)\b/.test(f)) return { parts: [{ fr: 'De rien ! C’est un plaisir de parler avec toi.', ar: 'عفوًا! يسعدني الحديث معك.' }] };
      if (/(au revoir|bonne nuit|a bientot|a demain|bye)/.test(f)) return { parts: [{ fr: 'Au revoir ! Tu as très bien travaillé aujourd’hui. À bientôt !', ar: 'إلى اللقاء! عملتَ جيدًا اليوم. إلى اللقاء قريبًا!' }], bye: 1 };
      if (/(je ne comprends pas|repete|repetez|plus lentement|pardon\s*$|tu peux repeter)/.test(f) && S.last) { return { parts: [{ fr: S.last.fr, ar: 'سأكرر ببطء: ' + S.last.ar }], slow: 1 }; }
      if (/^(aide|help|que sais tu faire|tu peux faire quoi|qu est ce que tu sais faire)/.test(f)) return { parts: [{ fr: 'Je peux discuter avec toi, corriger tes phrases, expliquer des mots, conjuguer des verbes et épeler. Demande-moi !', ar: 'أستطيع الحديث معك وتصحيح جملك وشرح الكلمات وتصريف الأفعال والتهجئة. اسألني!' }], sug: ['Comment dit-on « maison » ?', 'Conjugue aller', 'Épelle bonjour'] };
      if ((m = f.match(/^(?:epelle|epeler|comment s ecrit|comment ecrire)\s+(?:le mot\s+)?([a-z']+)/))) { var w = m[1]; return { parts: [{ fr: w + ' : ' + w.toUpperCase().split('').join(' - '), ar: 'تهجئة كلمة ' + w }], spell: w }; }
      if ((m = f.match(/^(?:conjugue|conjuguer|conjugaison de|conjugaison)\s+(?:le verbe\s+)?([a-z]+)/))) { var vb = m[1], c = DATA.CONJ.filter(function (x) { return fold(x.verb) === vb || fold(x.verb) === 'se ' + vb; })[0]; if (!c) return { parts: [{ fr: 'Je ne connais pas encore ce verbe. Essaie : être, avoir, aller, faire, parler…', ar: 'لا أعرف هذا الفعل بعد. جرّب: être, avoir, aller, faire, parler…' }] }; var tn = c.c.tenses, pr = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles']; var tb = '<table class="tk-tb"><tr><th></th>' + tn.map(function (t) { return '<th>' + esc(t.name_fr) + '</th>'; }).join('') + '</tr>' + pr.map(function (p, i) { return '<tr><th>' + p + '</th>' + tn.map(function (t) { return '<td>' + esc(t.forms[i] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; return { parts: [{ fr: 'Voici la conjugaison de « ' + c.verb + ' » :', ar: 'هذا تصريف الفعل ' + c.verb + ':' }], html: tb, say: pr.map(function (p, i) { return p.split('/')[0] + ' ' + tn[0].forms[i]; }).join(', ') }; }
      if ((m = f.match(/(?:comment dit on|comment dire|que veut dire|ca veut dire quoi|que signifie|traduis|traduire)\s+(.+)/))) { var rest = text.replace(/^.*?(?:dit-on|dit on|dire|veut dire|signifie|traduis|traduire)\s+/i, '').replace(/[«»"?]/g, '').trim(), r = lookup(rest); if (!r.length) return { parts: [{ fr: 'Hmm, je ne trouve pas ce mot dans ma tête de robot. Essaie un autre mot !', ar: 'لم أجد هذه الكلمة عندي. جرّب كلمة أخرى!' }] }; return wordReply(r, isAr(rest)); }
      if (isAr(text)) { var r2 = lookup(text); var tq = nza(text).split(' ').map(sa).filter(function (x) { return x.length >= 2; }), bestL = null, bs = 0; DATA.DIAL.forEach(function (l) { var al = nza(l.ar).split(' ').map(sa), ov = tq.filter(function (t) { return al.indexOf(t) > -1; }).length; if (ov > bs) { bs = ov; bestL = l; } }); var pr2 = []; if (r2.length) pr2.push({ fr: 'Mots utiles : ' + r2.map(function (w) { return w.fr; }).join(', ') + '.', ar: 'كلمات مفيدة: ' + r2.map(function (w) { return w.fr + ' = ' + w.ar; }).join('، ') + '.' }); if (bestL && bs >= 2) pr2.push({ fr: 'Une phrase proche : « ' + bestL.fr + ' »', ar: 'جملة قريبة المعنى: «' + bestL.fr + '» = ' + bestL.ar }); if (!pr2.length) pr2.push({ fr: 'Je n’ai pas trouvé la traduction exacte. Essaie avec des mots plus simples.', ar: 'لم أجد الترجمة بدقة. جرّب بكلمات أبسط.' }); pr2.push({ fr: 'Maintenant, essaie de dire ta phrase en français !', ar: 'والآن حاول أن تقول جملتك بالفرنسية!' }); return { parts: pr2, learn: r2 }; }
      if ((m = f.match(/combien (?:font|fait) (\d+)\s*(plus|\+|moins|-|fois|x|\*|divise par|\/)\s*(\d+)/))) { var a = +m[1], b = +m[3], o = m[2], rs = /plus|\+/.test(o) ? a + b : /moins|-/.test(o) ? a - b : /fois|x|\*/.test(o) ? a * b : (b ? Math.round(a / b * 100) / 100 : '∞'); return { parts: [{ fr: a + ' ' + o + ' ' + b + ' font ' + rs + ' !', ar: 'الناتج: ' + rs }] }; }
      return null;
    }
    function wordReply(r, fromAr) {
      r.forEach(function (w) { if (!ST.words[w.fr]) { ST.words[w.fr] = 1; S.learned.push(w); } }); save();
      var parts = r.map(function (w) { return fromAr ? { fr: 'On dit : « ' + w.fr + ' »', ar: 'نقول بالفرنسية: «' + w.fr + '» (' + w.ar + ')' } : { fr: '« ' + w.fr + ' » veut dire : ' + w.ar, ar: 'كلمة «' + w.fr + '» تعني: ' + w.ar }; }); parts.push({ fr: 'Peux-tu faire une phrase avec ce mot ?', ar: 'هل تستطيع تكوين جملة بهذه الكلمة؟' });
      return { parts: parts, learn: r, sug: [r[0].fr.replace(/^(le|la|l’|l'|un|une) /i, '').length ? 'J’aime … ' : ''].filter(Boolean) };
    }
    function extract(text) {
      var t = ap(text).toLowerCase(), out = {}, m;
      if ((m = t.match(/(?:je m'appelle|mon nom est|moi c'est)\s+([a-zà-ÿ'-]{2,20})/))) out.name = m[1].charAt(0).toUpperCase() + m[1].slice(1);
      if ((m = t.match(/j'ai\s+(\d{1,2})\s+ans/))) out.age = m[1];
      if ((m = t.match(/j'habite\s+(?:à|au|en|dans)\s+(?:la\s+|le\s+|l')?([a-zà-ÿ' -]{2,24})/))) out.city = m[1].trim().split(' ')[0].replace(/[.,!?]$/, '');
      if ((m = t.match(/(?:j'aime|j'adore|je préfère)\s+(?:le |la |les |l'|un |une |du |de la |des )?([a-zà-ÿ' -]{3,26})/))) out.like = m[1].trim().replace(/[.,!?]$/, '');
      return out;
    }
    function factReact(fc) {
      if (fc.name) { ST.facts.name = fc.name; return { fr: 'Enchantée, ' + fc.name + ' ! Quel joli prénom.', ar: 'تشرفتُ بمعرفتك يا ' + fc.name + '! اسم جميل.' }; }
      if (fc.age) { ST.facts.age = fc.age; return { fr: fc.age + ' ans, c’est un bel âge pour apprendre !', ar: fc.age + ' عامًا سنٌّ جميلة للتعلّم!' }; }
      if (fc.city) { ST.facts.city = fc.city; return { fr: fc.city.charAt(0).toUpperCase() + fc.city.slice(1) + ', ça doit être une belle ville !', ar: 'لا بد أنها مدينة جميلة!' }; }
      if (fc.like) { ST.facts.like = fc.like; return { fr: 'Tu aimes ça ? Moi, j’adore apprendre avec toi !', ar: 'تحب ذلك؟ أما أنا فأعشق التعلّم معك!' }; }
      return null;
    }
    function ackFor(text, an, fc) {
      var f = fold(text); if (an && an.hard.length && !fc) return P(['Bonne tentative ! Regarde la petite correction.', 'محاولة جيدة! انظر إلى التصحيح الصغير.']);
      var fr = factReact(fc); if (fr) return fr; var n = f.split(/\s+/).length, neg = /(n'aime pas|deteste|triste|non\b|pas |fatigue|mal\b|difficile|ennuy)/.test(f), pos = /(j'aime|j'adore|super|genial|content|heureux|oui|bien|passion|prefere|magnifique|excellent)/.test(f);
      if (n >= 7 && (!an || an.ok)) return P(pick(DATA.talk.react.long)); return P(pick(neg && !pos ? DATA.talk.react.neg : pos ? DATA.talk.react.pos : DATA.talk.react.neu));
    }
    function detectTopic(text) { var f = fold(text), toks = f.split(/[^a-z]+/); var best = null, bs = 0; DATA.talk.topics.forEach(function (t) { var sc = t.kw.filter(function (k) { return toks.indexOf(k) > -1; }).length; if (sc > bs) { bs = sc; best = t; } }); return best; }
    function localReply(text, an) {
      var fc = extract(text); Object.keys(fc).forEach(function (k) { S.facts = S.facts || {}; S.facts[k] = fc[k]; });
      var sp = special(text, an); var parts = [], sug = [], extra = {};
      if (sp) { parts = sp.parts; sug = sp.sug || []; extra = sp; if (sp.learn) sp.learn.forEach(function (w) { if (!ST.words[w.fr]) { ST.words[w.fr] = 1; S.learned.push(w); } }); if (!sug.length && S.topic && !sp.bye && !sp.slow && !sp.learn && !sp.spell && !sp.say && !sp.html) { var q = nextQ(); parts = parts.concat(q.parts); sug = q.sug; } return { parts: parts, sug: sug, extra: extra }; }
      var tp = detectTopic(text); if (tp && (!S.topic || (tp.id !== S.topic.id && !S.topic.kw.some(function (k) { return fold(text).split(/[^a-z]+/).indexOf(k) > -1; })))) { S.topic = tp; S.qi = 0; $('#tk-tp').innerHTML = tpChips(); var q1 = nextQ(); return { parts: [ackFor(text, an, fc), { fr: 'Tu parles de ce thème ! Parlons-en : ' + tp.fr + '.', ar: 'تتحدث عن موضوع ' + tp.ar + '! لنتحدث عنه.' }].concat(q1.parts), sug: q1.sug, extra: {} }; }
      parts.push(ackFor(text, an, fc)); var nq = nextQ(); parts = parts.concat(nq.parts); sug = nq.sug;
      if (!S.topic) { parts = [parts[0], { fr: pick(['Raconte-moi plus !', 'Pourquoi ? Dis-m’en plus !', 'Et ensuite ?']), ar: 'احكِ لي المزيد!' }]; sug = [{ type: 'topics' }]; }
      return { parts: parts, sug: sug, extra: {} };
    }

    /* ---------- معالجة رسالة الطالب ---------- */
    function showFix(box, an) {
      var fb = $('.tk-fb', box); if (!fb) return; var hard = an.hard, soft = an.issues.filter(function (i) { return i.soft; }), words = (S.lastWords || 0);
      if (hard.length || soft.length) {
        fb.innerHTML = '<div class="tk-fx w"><b>✏️ الصياغة الصحيحة:</b> <b class="ok" dir="ltr">' + esc(an.corrected) + '</b><ul>' + an.issues.map(function (i) { return '<li><s dir="ltr">' + esc(i.wrong) + '</s> ← <u dir="ltr">' + esc(i.right) + '</u> — ' + esc(i.why) + '</li>'; }).join('') + '</ul><div class="tk-bt" style="margin-top:6px"><button type="button" data-a="sayfix" data-t="' + esc(an.corrected) + '">🔊 اسمع الصحيحة</button><button type="button" data-a="shfix" data-t="' + esc(an.corrected) + '">🎤 كرّرها</button></div><div class="tk-sh-w"></div></div>';
      } else if (an.maybe.length) {
        fb.innerHTML = '<div class="tk-fx w">🔎 <b>تنبيه إملائي محتمل:</b> ' + an.maybe.slice(0, 2).map(function (m) { return '<s dir="ltr">' + esc(m.wrong) + '</s> ← <u dir="ltr">' + esc(m.right) + '</u> ؟'; }).join('، ') + ' <small>(تجاهله إن كانت كلمتك صحيحة)</small></div>';
      } else if (an.orig.split(/\s+/).length >= 3) fb.innerHTML = '<div class="tk-fx">✅ جملة سليمة! أحسنت.</div>';
    }
    function handle(text, meta) {
      text = String(text || '').trim(); if (!text) return; var box = addU(text), an = analyze(text); S.turns++; ST.turns++; S.lastWords = text.split(/\s+/).length; S.hist.push({ role: 'user', content: text });
      if (!isAr(text)) { showFix(box, an); an.hard.forEach(function (i) { S.errs[i.type] = (S.errs[i.type] || 0) + 1; ST.fixes++; }); }
      if (meta && meta.conf != null && meta.conf < 0.6 && !isAr(text)) { var fb = $('.tk-fb', box); fb.insertAdjacentHTML('beforeend', '<div class="tk-fx w">🎤 ثقة التعرّف ' + Math.round(meta.conf * 100) + '% — ربما نطقتَ بعض الكلمات بغير وضوح. اضغط «🎤 كرّرها» أو اسمع النطق الصحيح وقلّد.<div class="tk-bt" style="margin-top:6px"><button type="button" data-a="sayfix" data-t="' + esc(an.corrected) + '">🔊 اسمع النطق</button><button type="button" data-a="shfix" data-t="' + esc(an.corrected) + '">🎤 كرّرها</button></div><div class="tk-sh-w"></div></div>'); }
      var good = !isAr(text) && an.hard.length === 0 && S.lastWords >= 3; if (good) { S.clean++; S.streak++; ST.xp += 5; boost(8); } else { S.streak = 0; ST.xp += 2; } save(); $('#tk-xp').textContent = '✨ ' + ST.xp + ' XP';
      typing(true);
      var delay = 500 + Math.min(900, text.length * 12);
      var render = function (res) {
        typing(false); S.hist.push({ role: 'assistant', content: res.parts.map(function (p) { return p.fr; }).join(' ') });
        var ex = res.extra || {}, el = addZ(res.parts, { html: ex.html, sug: res.sug, mute: ex.spell || ex.say }); S.last = { fr: res.parts.map(function (p) { return p.fr; }).join(' '), ar: res.parts.map(function (p) { return p.ar; }).join(' ') }; if (ex.slow && ST.voice) say(S.last.fr, 0.5);
        if (ex.spell && ST.voice) say(ex.spell.split('').join(', '), 0.5); if (ex.say && ST.voice) say(ex.say, 0.7);
        if (ex.bye) setTimeout(report, 900);
        var up = (ST.level === 'b' && S.streak >= 3 && !S.offered.m) ? 'm' : (ST.level === 'm' && S.streak >= 4 && !S.offered.a) ? 'a' : null;
        if (up) { S.offered[up] = 1; var lv = DATA.talk.levels[up]; setTimeout(function () { addZ([{ fr: 'Tu t’exprimes très bien ! Veux-tu essayer le niveau suivant ?', ar: 'تعبّر عن نفسك جيدًا! هل تريد تجربة المستوى التالي؟' }], { html: '<div class="tk-bt" style="margin-top:8px"><button type="button" data-lv="' + up + '" style="background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12">⬆️ انتقل إلى مستوى ' + lv.ar + '</button></div>', mute: !ST.voice }); }, 1400); }
      };
      var url = AI();
      if (url) {
        askAI(url, text).then(function (r) { setTimeout(function () { aiRender(r, box, an, render); }, 100); }).catch(function () { setTimeout(function () { render(localReply(text, an)); if (!S.ai) { S.ai = 1; addNote('تعذّر الاتصال بالخدمة الذكية فاستخدمتُ وضع التدريب المحلي.'); } }, 200); });
      } else setTimeout(function () { render(localReply(text, an)); }, delay);
    }
    function addNote(t) { var d = document.createElement('div'); d.className = 'tk-note'; d.textContent = t; chat().appendChild(d); scrollDown(); }

    /* ---------- الوضع الذكي (خدمة وسيطة اختيارية) ---------- */
    function askAI(url, text) {
      var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined, body: JSON.stringify({ level: ST.level, topic: S.topic ? S.topic.fr : '', name: zname() || ST.facts.name || '', facts: ST.facts, history: S.hist.slice(-12), message: text }) }).then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('http'); return r.json(); });
    }
    function aiRender(r, box, an, render) {
      var corr = r.corrections || [];
      if (corr.length) { var fb = $('.tk-fb', box); fb.innerHTML = '<div class="tk-fx w"><b>✏️ ملاحظات زوزا:</b><ul>' + corr.map(function (c) { return '<li><s dir="ltr">' + esc(c.wrong) + '</s> ← <u dir="ltr">' + esc(c.right) + '</u> — ' + esc(c.why_ar || '') + '</li>'; }).join('') + '</ul></div>'; (r.corrections || []).forEach(function (c) { S.errs.ai = (S.errs.ai || 0) + 1; }); }
      var parts = [{ fr: r.reply_fr || '', ar: r.reply_ar || '' }]; if (r.tip_ar) parts.push({ fr: '', ar: '💡 ' + r.tip_ar });
      (r.new_words || []).forEach(function (w) { if (w.fr && !ST.words[w.fr]) { ST.words[w.fr] = 1; S.learned.push(w); } });
      render({ parts: parts, sug: r.suggestions_fr || [], extra: {} });
    }

    /* ---------- التقرير ---------- */
    function report() {
      var errs = Object.keys(S.errs).sort(function (a, b) { return S.errs[b] - S.errs[a]; }), pct = S.turns ? Math.round(S.clean * 100 / S.turns) : 0;
      var h = '<div class="tk-fx"><b>📊 تقرير زوزا</b><br>💬 عدد رسائلك: ' + S.turns + ' · ✅ جمل سليمة: ' + S.clean + ' (' + pct + '%) · ✨ ' + ST.xp + ' XP' + (errs.length ? '<br><b>أكثر نقاط الضعف:</b><ul>' + errs.slice(0, 3).map(function (e) { return '<li>' + esc(LBL[e] || 'ملاحظات أخرى') + ' (' + S.errs[e] + ') — ' + esc(TIPS[e] || '') + '</li>'; }).join('') + '</ul>' : '<br>🎉 لا أخطاء مهمة، استمر!') + (S.learned.length ? '<br><b>كلمات تعلّمتها:</b> ' + S.learned.slice(0, 8).map(function (w) { return '<span dir="ltr">' + esc(w.fr) + '</span> (' + esc(w.ar) + ')'; }).join('، ') : '') + '</div>';
      addZ([{ fr: S.turns ? 'Voici ton bilan, bravo pour tes efforts !' : 'Commençons à parler, puis je te ferai un bilan !', ar: S.turns ? 'هذا تقييمك، أحسنت على مجهودك!' : 'لنبدأ الحديث ثم أعدّ لك تقريرًا!' }], { html: h, mute: !ST.voice }); sWin();
    }
    function help() {
      var t = S.topic, base = ['Je m’appelle …', 'J’aime …', 'Je voudrais …', 'Je pense que …', 'Peux-tu répéter, s’il te plaît ?'];
      if (t) { var ws = t.kw.slice(0, 4).map(function (k) { var r = DATA.LEX.filter(function (w) { return w.k === k; })[0]; return r ? r.fr + ' = ' + r.ar : k; }); addZ([{ fr: 'Voici quelques idées pour répondre !', ar: 'هذه بعض الأفكار للإجابة! ' + (ws.length ? 'كلمات مفيدة: ' + ws.join('، ') : '') }], { sug: base, mute: !ST.voice }); } else addZ([{ fr: 'Voici des phrases pour commencer !', ar: 'هذه جمل تساعدك على البدء!' }], { sug: base, mute: !ST.voice });
    }
    function setAI() {
      var cur = ST.ai || '', v = window.prompt('الوضع الذكي: ألصق رابط خدمة zoza-worker الوسيطة (يبدأ بـ https://). اتركه فارغًا لاستخدام وضع التدريب المحلي.', cur);
      if (v === null) return; ST.ai = String(v).trim(); save(); $('#tk-tg').innerHTML = tgBtns(); $('#tk-md').textContent = AI() ? '🧠 وضع ذكي' : '💬 وضع التدريب'; addNote(AI() ? 'تم تفعيل الوضع الذكي ✅' : 'تم إيقاف الوضع الذكي — وضع التدريب المحلي يعمل.');
    }

    /* ---------- الأحداث ---------- */
    function shadow(target, holder, btn) {
      holder.innerHTML = '<div class="tk-sh"><div class="ws" dir="ltr">' + esc(clean(target)) + '</div><div style="font-size:.78rem;color:#6b7280">🎙️ اقرأ الجملة بصوت واضح…</div></div>'; if (btn) btn.classList.add('rec');
      var r = listen(function (res) { if (btn) btn.classList.remove('rec'); if (res === null) { holder.innerHTML = '<div class="tk-sh">🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome على أندرويد).</div>'; return; } if (res.err) { holder.innerHTML = '<div class="tk-sh">⚠️ لم أسمعك جيدًا، أعد المحاولة.</div>'; return; } var cmp = compare(target, res.alts); holder.innerHTML = '<div class="tk-sh">' + shadowCard(target, cmp) + '</div>'; var p = Math.round(cmp.r.sc * 100); if (p >= 85) { sOk(); ST.xp += 10; boost(15); save(); $('#tk-xp').textContent = '✨ ' + ST.xp + ' XP'; } scrollDown(); });
      if (r === null && btn) btn.classList.remove('rec');
    }
    function micTalk(btn) {
      btn.classList.add('rec'); var ip = $('#tk-ip'), old = ip.placeholder; ip.placeholder = '🎙️ تحدّث الآن…';
      var r = listen(function (res) { btn.classList.remove('rec'); ip.placeholder = old; if (res === null) { addNote('🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome على أندرويد).'); return; } if (res.err) { addNote('⚠️ لم أسمعك جيدًا، حاول مرة أخرى.'); return; } var a = res.alts[0]; ip.value = ''; handle(a.t, { conf: a.c, voice: 1 }); }, function (t) { ip.value = t; });
      if (r === null) { btn.classList.remove('rec'); ip.placeholder = old; }
    }
    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if (t.closest('#tk-rob')) { var h = $('#tk-hero'); addZ([{ fr: 'Coucou ! Prête à parler français ? Choisis un sujet !', ar: 'مرحبًا! جاهز للحديث بالفرنسية؟ اختر موضوعًا!' }], { sug: [{ type: 'topics' }] }); return; }
      if ((x = t.closest('[data-lv]'))) { ST.level = x.dataset.lv; save(); $('#tk-lv').innerHTML = lvlBtns(); var L = DATA.talk.levels[ST.level]; addNote('تم اختيار المستوى: ' + L.ic + ' ' + L.ar); if (S.topic) { S.qi = 0; var q = nextQ(); addZ([{ fr: 'D’accord, changeons de niveau !', ar: 'حسنًا، لنغيّر المستوى!' }].concat(q.parts), { sug: q.sug }); } return; }
      if ((x = t.closest('[data-tp]'))) { startTopic(x.dataset.tp); return; }
      if ((x = t.closest('[data-tgl]'))) { var k = x.dataset.tgl; ST[k] = ST[k] ? 0 : 1; save(); x.classList.toggle('on', !!ST[k]); if (k === 'tr') $$('[data-ar]', ROOT).forEach(function (el) { el.hidden = !ST.tr; }); if (k === 'voice' && !ST.voice) { try { speechSynthesis.cancel(); } catch (z) {} } return; }
      if ((x = t.closest('[data-fill]'))) { var ip = $('#tk-ip'); ip.value = x.dataset.fill.replace(/…/g, '').replace(/\s+$/, '') + (/…/.test(x.dataset.fill) ? ' ' : ''); ip.focus(); return; }
      if ((x = t.closest('.tk-w'))) { say(x.dataset.w, 0.7); x.classList.add('hl'); setTimeout(function () { x.classList.remove('hl'); }, 700); return; }
      if ((x = t.closest('[data-act]'))) { var a = x.dataset.act; if (a === 'send') { var i = $('#tk-ip'), v = i.value; i.value = ''; handle(v); } else if (a === 'mic') micTalk(x); else if (a === 'help') help(); else if (a === 'report') report(); else if (a === 'ai') setAI(); else if (a === 'new') { newSession(); MSG = []; chat().innerHTML = ''; $('#tk-tp').innerHTML = tpChips(); greet(); } return; }
      if ((x = t.closest('.tk-bt [data-a]'))) { var ac = x.dataset.a, b = x.closest('.tk-b'); if (ac === 'sayfix' || ac === 'shfix') { var tg = x.dataset.t; if (ac === 'sayfix') say(tg, 0.7); else shadow(tg, x.closest('.tk-fx').querySelector('.tk-sh-w'), x); return; } var m = MSG[+x.dataset.m]; if (!m) return; if (ac === 'say') { $$('.tk-b.pl', ROOT).forEach(function (el) { el.classList.remove('pl'); }); b.classList.add('pl'); say(m.fr, null, function () { b.classList.remove('pl'); }); } else if (ac === 'slow') say(m.fr, 0.5); else if (ac === 'tr') { var ar = $('[data-ar]', b); ar.hidden = !ar.hidden; } else if (ac === 'sh') { var sentence = m.fr.replace(/([.!?]+)\s+/g, '$1\u0001').split('\u0001')[0]; var tgt = m.fr.split(/\s+/).length > 14 ? sentence : m.fr; shadow(tgt, $('.tk-sh-w', b), x); } return; }
    });
    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target, v = i.value; i.value = ''; handle(v); } });
    new MutationObserver(function () { if (!SEC.classList.contains('on')) { try { speechSynthesis.cancel(); } catch (e) {} talking(false); if (REC) { try { REC.abort(); } catch (e) {} } } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });

    /* ---------- الإقلاع ---------- */
    ROOT.innerHTML = '<div class="empty">⏳ زوزا تستعد للحديث…</div>';
    Promise.all([getJson('talk.json'), getJson('lexicon.json'), getJson('words.json'), getJson('dialogues.json'), getJson('stories.json'), getJson('grammar.json')]).then(function (r) {
      if (!r[0] || !r[0].topics) { ROOT.innerHTML = '<div class="empty" style="text-align:center;padding:20px">⚠️ تعذّر تحميل data/talk.json — تأكد من رفعه في مجلد data.</div>'; return; }
      build(r); mount();
    });
  }
})();
