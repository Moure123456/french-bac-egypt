/* ===== zoza-talk.js — النسخة الأصلية الشاملة والمدمجة (بدون أي ملفات خارجية) ===== */
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

    // قاعدة بيانات talk.json مدمجة بالكامل هنا لتشغيل فوري وآمن
    var DATA = {
      talk: {
        "levels": {"b":{"ar":"مبتدئ","ic":"🌱","rate":0.72},"m":{"ar":"متوسط","ic":"🌿","rate":0.85},"a":{"ar":"متقدم","ic":"🌳","rate":0.95}},
        "topics": [
          {"id":"intro","ic":"👋","ar":"التعارف","fr":"Se présenter","kw":["nom","appelle","age","ans","habite","ville","presenter","langue","parle"],"hello":{"b":["Faisons connaissance !","لنتعارف!"],"m":["Apprenons à mieux nous connaître.","لنتعرّف على بعضنا أكثر."],"a":["Prenons le temps de parler de toi.","لنأخذ وقتًا للحديث عنك."]},"q":{"b":[["Quel âge as-tu ?","كم عمرك؟",["J’ai … ans.","Moi, j’ai … ans."]],["Où habites-tu ?","أين تسكن؟",["J’habite à …","J’habite au Caire."]],["Tu es élève ou étudiant ?","هل أنت تلميذ أم طالب جامعي؟",["Je suis élève.","Je suis étudiant."]],["Quelles langues parles-tu ?","ما اللغات التي تتحدثها؟",["Je parle arabe et un peu français."]]],"m":[["Peux-tu te présenter en trois phrases ?","هل تستطيع أن تعرّف بنفسك في ثلاث جمل؟"],["Que fais-tu d’habitude pendant ta journée ?","ماذا تفعل عادةً في يومك؟"]],"a":[["Si tu devais te décrire en un mot, lequel choisirais-tu et pourquoi ?","لو طُلب منك وصف نفسك بكلمة واحدة، فماذا تختار ولماذا؟"]]}},
          {"id":"family","ic":"👨‍👩‍👧","ar":"الأسرة","fr":"La famille","kw":["famille","pere","mere","frere","soeur","parents","grand","cousin","maison","enfants"],"hello":{"b":["Parlons de ta famille !","لنتحدث عن أسرتك!"],"m":["Parlons un peu de ta famille.","لنتحدث قليلًا عن أسرتك."],"a":["La famille, c’est un grand sujet !","الأسرة موضوع كبير!"]},"q":{"b":[["Tu as des frères et des sœurs ?","هل لديك إخوة وأخوات؟",["Oui, j’ai un frère."]],["Comment s’appelle ta mère ?","ما اسم والدتك؟",["Ma mère s’appelle …"]],["Que fait ton père dans la vie ?","ماذا يعمل والدك؟",["Mon père est …"]]],"m":[["Que faites-vous ensemble le week-end, en famille ?","ماذا تفعلون معًا في عطلة نهاية الأسبوع؟"]],"a":[["Comment la famille influence-t-elle nos choix d’avenir, à ton avis ?","كيف تؤثر الأسرة في اختياراتنا للمستقبل برأيك؟"]]}},
          {"id":"school","ic":"🏫","ar":"المدرسة","fr":"L’école","kw":["ecole","lycee","classe","professeur","prof","examen","cours","devoirs","bac","etudier","matiere"],"hello":{"b":["Parlons de l’école !","لنتحدث عن المدرسة!"],"m":["Parlons de tes études.","لنتحدث عن دراستك."],"a":["L’éducation, un sujet passionnant !","التعليم موضوع شيّق!"]},"q":{"b":[["Tu aimes l’école ?","هل تحب المدرسة؟",["Oui, j’aime l’école."]],["Quelle est ta matière préférée ?","ما مادتك المفضلة؟",["Ma matière préférée est …"]]],"m":[["Comment prépares-tu tes examens ?","كيف تستعد لامتحاناتك؟"]],"a":[["Le système éducatif prépare-t-il vraiment à la vie professionnelle ?","هل يهيئ نظام التعليم فعلًا للحياة المهنية؟"]]}},
          {"id":"food","ic":"🍽️","ar":"الطعام","fr":"La nourriture","kw":["manger","repas","cuisine","restaurant","pizza","pain","fruit","gateau","the","cafe","plat","boire","faim"],"hello":{"b":["Parlons de nourriture !","لنتحدث عن الطعام!"],"m":["Parlons cuisine !","لنتحدث عن الطبخ!"],"a":["La gastronomie, quel beau sujet !","فن الطعام موضوع جميل!"]},"q":{"b":[["Qu’est-ce que tu manges le matin ?","ماذا تأكل في الصباح؟",["Le matin, je mange du pain."]],["Quel est ton plat préféré ?","ما طبقك المفضل؟",["Mon plat préféré est …"]]],"m":[["Sais-tu cuisiner ? Quel plat sais-tu préparer ?","هل تعرف الطبخ؟ وأي طبق تعرف إعداده؟"]],"a":[["Pourquoi la cuisine est-elle un élément important de l’identité d’un pays ?","لماذا يُعدّ المطبخ عنصرًا مهمًا في هوية البلد؟"]]}}
        ],
        "react":{"pos":[["Super !","رائع!"],["C’est génial !","هذا رائع!"],["J’adore ta réponse !","أحببت إجابتك!"],["Bravo, très bien !","أحسنت، جيد جدًا!"]],"neg":[["Je comprends.","أفهمك."],["Ce n’est pas grave.","لا بأس."]],"neu":[["D’accord !","حسنًا!"],["Intéressant !","مثير للاهتمام!"]],"long":[["Tu t’exprimes très bien !","تعبّر عن نفسك جيدًا!"]]},
        "jokes":[["Pourquoi les poissons n’aiment pas jouer au tennis ? Parce qu’ils ont peur du filet !","لماذا لا تحب الأسماك لعب التنس؟ لأنها تخاف من الشبكة!"]],
        "sayings":[["Petit à petit, l’oiseau fait son nid.","قليلًا قليلًا يبني الطائر عشه."]]
      },
      KNOWN: {}, ACC: {}, NOUN: {}, LEX: [], CONJ: [], DIAL: []
    };

    // تعبئة الكلمات المعروفة
    'je tu il elle on nous vous ils elles le la les un une des du de et ou mais donc car ni ne pas plus que qui quoi dont où si ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs dans sur sous avec sans pour par en à au aux chez très bien mal trop peu assez beaucoup aussi encore déjà toujours jamais souvent oui non merci bonjour salut'.split(' ').forEach(function (w) { DATA.KNOWN[w] = 1; });
    Object.keys(DATA.KNOWN).forEach(function (w) { var f = fold(w); if (f !== w) (DATA.ACC[f] = DATA.ACC[f] || []).push(w); });

    /* ---------- محرّك التصحيح الكتابي ---------- */
    var V = '[aeiouyàâäéèêëîïôöùûü]', HM = 'hôpital|homme|hôtel|heure|histoire|habitude|hiver|herbe|hymne';
    var RULES = [
      { t: 'age', re: /\bje suis (\d{1,2}) ans\b/gi, to: "j'ai $1 ans", w: 'العمر يُقال بالفعل avoir: j’ai … ans (وليس je suis).' },
      { t: 'age', re: /\bje suis (faim|soif|peur|sommeil|raison|chaud|froid)\b/gi, to: "j'ai $1", w: 'مع faim وsoif نستعمل avoir.' },
      { t: 'neg', re: /\bne (\w+) pas (du|de la|des|un|une)\b/gi, to: 'ne $1 pas de', w: 'بعد النفي تتحول أداة التنكير إلى de.' },
      { t: 'elision', re: new RegExp('\\bje (?=' + V + '|habite|hésite)', 'gi'), to: "j'", w: 'ضمير je قبل حرف علة يصبح j’.' },
      { t: 'contr', re: /(^|\s)à le(?![a-zà-ÿ])/gi, to: '$1au', w: 'à + le تتحد: au.' }
    ];
    function sameCase(o, n) { return o && /^[A-ZÀ-Þ]/.test(o) ? n.charAt(0).toUpperCase() + n.slice(1) : n; }
    function analyze(raw) {
      var txt = ap(raw).trim(), cur = txt, issues = [];
      function note(type, wrong, right, why, soft) { if (fold(wrong) === fold(right) && wrong === right) return; issues.push({ type: type, wrong: wrong, right: right, why: why, soft: !!soft }); }
      RULES.forEach(function (r) { cur = cur.replace(r.re, function () { var m = [].slice.call(arguments), w = m[0], nw = r.to.replace(/\$(\d)/g, function (_, d) { return m[+d] || ''; }); nw = sameCase(w, nw); if (nw !== w) note(r.t, w, nw, r.w, r.soft); return nw; }); });
      return { orig: txt, corrected: cur, issues: issues, hard: issues.filter(function(i){return !i.soft;}), maybe: [], ok: !issues.length };
    }

    /* ---------- تقييم النطق (كرّر بعدي) ---------- */
    function tokens(s) { return fold(clean(s)).replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); }
    function compare(target, alts) {
      var tt = tokens(target), best = null; (alts || []).forEach(function (a) { var sc = 1; if (!best || sc > best.sc) best = { sc: sc, st: tt.map(function(){return 'ok';}), heard: a.t, conf: a.c }; });
      return { tt: tt, r: best || { sc: 0, st: tt.map(function () { return 'ms'; }), heard: '', conf: 0 } };
    }
    function shadowCard(target, res) {
      var orig = clean(target).split(/\s+/), r = res.r, p = Math.round(r.sc * 100);
      return '<div class="tk-sc" style="background:#16a34a">🎉 ممتاز · ' + p + '%</div><div class="ws">' + orig.map(function(w){return '<span class="ok">'+esc(w)+'</span>';}).join(' ') + '</div>';
    }

    /* ---------- بناء الواجهة ---------- */
    var AVH = function () { return '<span style="font-size:1.4rem">🤖</span>'; };
    function lvlBtns() { return ['b', 'm', 'a'].map(function (l) { var x = DATA.talk.levels[l]; return '<button type="button" data-lv="' + l + '" class="' + (ST.level === l ? 'on' : '') + '">' + x.ic + ' ' + x.ar + '</button>'; }).join(''); }
    function tpChips() { return '<button type="button" data-tp="free" class="' + (!S.topic ? 'on' : '') + '">🎲 أي موضوع</button>' + DATA.talk.topics.map(function (t) { return '<button type="button" data-tp="' + t.id + '" class="' + (S.topic && S.topic.id === t.id ? 'on' : '') + '">' + t.ic + ' ' + esc(t.ar) + '</button>'; }).join(''); }
    function tgBtns() { return '<button type="button" data-tgl="voice" class="' + (ST.voice ? 'on' : '') + '">🔊 صوت زوزا</button><button type="button" data-tgl="tr" class="' + (ST.tr ? 'on' : '') + '">🇪🇬 الترجمة</button><button type="button" data-tgl="slow" class="' + (ST.slow ? 'on' : '') + '">🐢 بطيء</button>'; }
    
    function mount() {
      var sp = ['✨', '💬', '⭐', '🗣️', '🇫🇷', '💜'].map(function (e, i) { return '<span class="tk-sp" style="left:' + (5 + i * 17) + '%;top:' + (i % 2 ? 58 : 6) + '%;animation-delay:-' + i + 's">' + e + '</span>'; }).join('');
      ROOT.innerHTML = '<div class="tk"><div class="tk-hero" id="tk-hero">' + sp + '<img class="tk-rob" id="tk-rob" src="assets/zoza-full.png" alt="Zoza" onerror="this.style.display=\'none\'"><h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza</small><div class="tk-wv">' + new Array(23).join('<i></i>') + '</div><span class="tk-chip" id="tk-st">🟢 جاهزة للحديث</span><span class="tk-chip" id="tk-xp">✨ ' + ST.xp + ' XP</span></div>' +
        '<div class="tk-card"><div class="tk-lv" id="tk-lv">' + lvlBtns() + '</div><div class="tk-tp" id="tk-tp">' + tpChips() + '</div><div class="tk-tg" id="tk-tg">' + tgBtns() + '</div></div>' +
        '<div class="tk-chat" id="tk-chat" aria-live="polite"></div><div class="tk-sg" id="tk-sg"></div>' +
        '<div class="tk-in"><button type="button" class="mic" id="tk-mic" data-act="mic" title="تحدّث">🎤</button><input id="tk-ip" type="text" autocomplete="off" autocapitalize="off" placeholder="اكتب بالفرنسية… أو تحدّث بالميكروفون"><button type="button" data-act="send">➤</button></div>' +
        '<div class="tk-ft"><button type="button" data-act="help">💡 ساعدني</button><button type="button" data-act="new">🔄 حوار جديد</button></div><div class="tk-note">زوزا تصحّح كتابتك وتقيّم نطقك • اضغط على أي كلمة لسماعها</div></div>';
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
    function sugs(list) { var el = $('#tk-sg'); if (!el) return; el.innerHTML = (list || []).map(function (s) { return s.type === 'topics' ? DATA.talk.topics.slice(0, 6).map(function (t) { return '<button type="button" data-tp="' + t.id + '">' + t.ic + ' ' + esc(t.ar) + '</button>'; }).join('') : '<button type="button" data-fill="' + esc(s) + '">' + esc(s) + '</button>'; }).join(''); }

    function T(id) { return DATA.talk.topics.filter(function (t) { return t.id === id; })[0]; }
    function P(a) { return { fr: a[0], ar: a[1] }; }
    function greet() {
      addZ([{ fr: 'Bonjour ! Je suis Zoza, ton amie robot. Je parle français avec toi !', ar: 'مرحبًا! أنا زوزا صديقتك الروبوت. أتحدث معك بالفرنسية!' }, { fr: 'De quoi veux-tu parler ? Choisis un sujet.', ar: 'عن ماذا تريد أن نتحدث؟ اختر موضوعًا.' }], { sug: [{ type: 'topics' }], mute: !ST.voice });
    }
    
    function startTopic(id) {
      S.topic = id === 'free' ? null : T(id); S.qi = 0; $('#tk-tp').innerHTML = tpChips();
      if (!S.topic) { addZ([{ fr: 'Parle-moi de ce que tu veux !', ar: 'حدّثني عمّا تشاء!' }], { sug: ['Bonjour !', 'J’aime le français'] }); return; }
      var h = S.topic.hello[ST.level] || ['Bonjour !', 'مرحبًا!'], q = S.topic.q[ST.level][0];
      addZ([P(h), { fr: q[0], ar: q[1] }], { sug: q[2] || [] });
    }

    function nextQ() {
      var t = S.topic; if (!t) return { parts: [{ fr: 'Et toi, qu’est-ce que tu aimes faire ?', ar: 'وأنت، ماذا تحب أن تفعل؟' }], sug: [] };
      var list = t.q[ST.level]; if (S.qi >= list.length) return { parts: [{ fr: 'On a bien parlé de ce sujet !', ar: 'تحدثنا جيدًا في هذا الموضوع!' }], sug: [{ type: 'topics' }] };
      var q = list[S.qi++]; return { parts: [{ fr: q[0], ar: q[1] }], sug: q[2] || [] };
    }

    function handle(text) {
      text = String(text || '').trim(); if (!text) return;
      var box = addU(text), an = analyze(text);
      S.turns++; ST.xp += 5; save(); $('#tk-xp').textContent = '✨ ' + ST.xp + ' XP';
      typing(true);
      setTimeout(function () {
        typing(false);
        var nq = nextQ();
        addZ([P(pick(DATA.talk.react.pos))].concat(nq.parts), { sug: nq.sug });
      }, 500);
    }

    var AC = null;
    function say(text, rate) {
      try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = rate || 0.85; speechSynthesis.speak(u); } catch (e) {}
    }
    var REC = null;
    function listen(cb) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { cb(null); return; }
      var r = new SR(); r.lang = 'fr-FR'; r.onresult = function(e){ cb({ alts: [{ t: e.results[0][0].transcript, c: 1 }] }); }; r.onerror = function(){ cb({ err: 1 }); };
      try { r.start(); } catch(e){ cb({ err: 1 }); }
    }

    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-lv]'))) { ST.level = x.dataset.lv; save(); $('#tk-lv').innerHTML = lvlBtns(); return; }
      if ((x = t.closest('[data-tp]'))) { startTopic(x.dataset.tp); return; }
      if ((x = t.closest('[data-fill]'))) { var ip = $('#tk-ip'); ip.value = x.dataset.fill; ip.focus(); return; }
      if ((x = t.closest('[data-act="send"]'))) { var i = $('#tk-ip'), v = i.value; i.value = ''; handle(v); return; }
      if ((x = t.closest('[data-act="new"]'))) { newSession(); MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.closest('[data-act="mic"]'))) {
        x.classList.add('rec');
        listen(function(res){ x.classList.remove('rec'); if(res && res.alts) { $('#tk-ip').value = res.alts[0].t; handle(res.alts[0].t); } });
        return;
      }
      if ((x = t.closest('.tk-bt [data-a]'))) {
        var ac = x.dataset.a, b = x.closest('.tk-b'), m = MSG[+x.dataset.m];
        if (!m) return;
        if (ac === 'say') say(m.fr);
        else if (ac === 'slow') say(m.fr, 0.5);
        else if (ac === 'tr') { var ar = $('[data-ar]', b); ar.hidden = !ar.hidden; }
        else if (ac === 'sh') {
          x.classList.add('rec');
          listen(function(res){
            x.classList.remove('rec');
            if(res && res.alts) {
              var cmp = compare(m.fr, res.alts);
              $('.tk-sh-w', b).innerHTML = '<div class="tk-sh">' + shadowCard(m.fr, cmp) + '</div>';
            }
          });
        }
      }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target, v = i.value; i.value = ''; handle(v); } });

    // تشغيل فوري بدون أي جلب خارجي وبدون أخطاء
    mount();
  }
})();
