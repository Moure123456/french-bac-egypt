/* ===== phrase.js — زر «la phrase en français» داخل قسم Grammaire =====
   دروس تفاعلية لبناء الجملة الفرنسية: الفاعل والفعل والمفعول والأزمنة وغيرها
   + مختبر أزمنة + أنشطة ضغط وترتيب + اختبارات بنجوم. لا يغيّر أي ملف آخر. */
(function () {
  'use strict';
  try { boot(); } catch (e) { try { console.error('[phrase]', e); } catch (_) {} }

  function boot() {
    var SEC = document.getElementById('grammar');
    if (!SEC) return;

    /* ---------- أدوات ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function store(k, v) {
      try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) {}
      return '';
    }
    function shuffle(a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    var AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    var IPA = /[\u0250-\u02AF\u0303\u02C8\u02CC\u00F8\u014B]/;
    var LAT = /[A-Za-z\u00C0-\u00FF\u0152\u0153]/;
    var LCH = /[A-Za-z\u00C0-\u00FF\u0152\u0153]+(?:['\u2019\-\s\u2026]+[A-Za-z\u00C0-\u00FF\u0152\u0153]+)*/g;
    // نص عربي مع مقاطع فرنسية معزولة الاتجاه + **غامق**
    function rich(raw) {
      raw = String(raw == null ? '' : raw);
      var out = '', last = 0, m;
      LCH.lastIndex = 0;
      while ((m = LCH.exec(raw))) {
        out += esc(raw.slice(last, m.index)) + '<bdi dir="ltr">' + esc(m[0]) + '</bdi>';
        last = m.index + m[0].length;
      }
      out += esc(raw.slice(last));
      return out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    }
    function frOnly(t) {
      var s = String(t || '');
      if (AR.test(s)) return '';
      s = s.replace(/_{2,}/g, ' ... ').replace(/\[[^\]\n]*\]/g, ' ')
        .split(/\s+/).filter(function (w) { return w && !IPA.test(w); }).join(' ').trim();
      return LAT.test(s) ? s : '';
    }
    function sayBtn(t) {
      var c = frOnly(t);
      return c ? '<button type="button" class="ph-say" data-say="' + esc(encodeURIComponent(c)) + '" aria-label="استمع بالفرنسية">🔊</button>' : '';
    }
    function speakFr(text) {
      try {
        var sy = window.speechSynthesis;
        if (!sy || typeof SpeechSynthesisUtterance === 'undefined') return;
        sy.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR';
        u.rate = 0.9;
        var v = (sy.getVoices() || []).filter(function (x) { return /^fr/i.test(x.lang); })[0];
        if (v) u.voice = v;
        sy.speak(u);
      } catch (e) {}
    }
    var AC = null, sndOn = store('ph_snd') !== 'off';
    function ac() {
      try {
        if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
        if (AC && AC.state === 'suspended') AC.resume();
      } catch (e) {}
      return AC;
    }
    function tone(f, t0, d, type, vol) {
      var c = ac();
      if (!c) return;
      try {
        var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
        o.type = type || 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g);
        g.connect(c.destination);
        o.start(t);
        o.stop(t + d + 0.05);
      } catch (e) {}
    }
    function sfx(n) {
      if (!sndOn) return;
      if (n === 'ok') { tone(660, 0, 0.12); tone(880, 0.12, 0.2); }
      else if (n === 'bad') tone(220, 0, 0.3, 'sawtooth', 0.13);
      else if (n === 'win') [523, 659, 784, 1046].forEach(function (f, k) { tone(f, k * 0.14, 0.22); });
    }

    /* ---------- الأدوار والألوان ---------- */
    var ROLES = {
      s: ['الفاعل', 'Sujet', '#0a7ad6'], v: ['الفعل', 'Verbe', '#d63a3a'], a: ['الفعل المساعد', 'Auxiliaire', '#e8710a'],
      o: ['المفعول المباشر', 'COD', '#1b9e5b'], i: ['المفعول غير المباشر', 'COI', '#7b4bd1'],
      c: ['ظرف / تكملة', 'Complément circonstanciel', '#a9780a'], d: ['أداة / محدِّد', 'Déterminant', '#0e8f9a'],
      p: ['حرف جر', 'Préposition', '#5b6b8c'], n: ['نفي', 'Négation', '#b5179e'], q: ['أداة استفهام', 'Mot interrogatif', '#00897b'],
      k: ['جملة الشرط (si)', 'Condition', '#c2185b'], r: ['جملة النتيجة', 'Résultat', '#d63a3a']
    };
    var HINT = {
      s: 'نسأل عنه بـ Qui ? (من يفعل؟)', v: 'نسأل: ماذا يفعل؟ ويتغير حسب الفاعل والزمن', a: 'فعل مساعد (avoir / être / aller) يساعد في تكوين الزمن',
      o: "المفعول المباشر يأتي بعد الفعل مباشرة بلا حرف جر، ونسأل عنه بـ Qui ? / Quoi ?", i: 'المفعول غير المباشر يأتي بعد حرف جر (غالباً à)، ونسأل عنه بـ À qui ? / À quoi ?',
      c: 'ظرف أو تكملة تجيب عن: Où ? Quand ? Comment ? Pourquoi ?', d: 'أداة تسبق الاسم وتحدد جنسه وعدده', p: 'حرف جر يربط الكلمات (à, de, par, dans...)',
      n: 'أداة نفي: ne ... pas / jamais / plus / rien / personne', q: 'أداة استفهام تفتح السؤال', k: 'جملة تبدأ بـ si وتذكر الشرط', r: 'جملة تذكر نتيجة الشرط'
    };
    function legendHTML(keys) {
      return '<div class="ph-leg">' + keys.map(function (k) {
        return '<span class="ph-lg"><i style="background:' + ROLES[k][2] + '"></i>' + esc(ROLES[k][0]) + '</span>';
      }).join('') + '</div>';
    }

    /* ---------- ترميز الجمل: [نص|دور|سؤال|جملة السؤال] ---------- */
    function parse(m) {
      var out = [], re = /\[([^\]]+)\]|([^\[]+)/g, x;
      while ((x = re.exec(m))) {
        if (x[1]) { var p = x[1].split('|'); out.push({ t: p[0], r: p[1] || '', q: p[2] || '', qf: p[3] || '' }); }
        else out.push({ t: x[2], r: '' });
      }
      return out;
    }
    function plainOf(m) { return parse(m).map(function (s) { return s.t; }).join(''); }
    function segStyle(r) { var c = ROLES[r] ? ROLES[r][2] : '#333'; return 'color:' + c + ';border-color:' + c + ';background:' + c + '1a'; }
    // mode: '' عرض | 'tap' للأداة | 'quiz' محايد بلا ألوان
    function mkHTML(m, mode) {
      return parse(m).map(function (s, i) {
        if (!s.r) return esc(s.t);
        if (mode === 'tap') return '<button type="button" class="ph-seg" style="' + segStyle(s.r) + '" data-tg="' + i + '">' + esc(s.t) + '</button>';
        if (mode === 'quiz') return '<button type="button" class="ph-seg neutral" data-qg="' + i + '">' + esc(s.t) + '</button>';
        return '<span class="ph-seg" style="' + segStyle(s.r) + '" data-r="' + s.r + '">' + esc(s.t) + '</span>';
      }).join('');
    }

    /* ---------- بيانات الأفعال ---------- */
    function ER(inf, ar, ct, cr) {
      var st = inf.slice(0, -2), ge = /ger$/.test(inf);
      return {
        inf: inf, ar: ar, g: 1, pp: st + 'é', aux: 'avoir', fs: inf, pr: st + (ge ? 'eant' : 'ant'), comp: { t: ct, r: cr },
        pres: [st + 'e', st + 'es', st + 'e', st + (ge ? 'eons' : 'ons'), st + 'ez', st + 'ent'],
        ps: ge ? [st + 'eai', st + 'eas', st + 'ea', st + 'eâmes', st + 'eâtes', st + 'èrent'] : [st + 'ai', st + 'as', st + 'a', st + 'âmes', st + 'âtes', st + 'èrent']
      };
    }
    function IR(inf, ar, ct, cr) {
      var st = inf.slice(0, -2);
      return {
        inf: inf, ar: ar, g: 2, pp: st + 'i', aux: 'avoir', fs: inf, pr: st + 'issant', comp: { t: ct, r: cr },
        pres: [st + 'is', st + 'is', st + 'it', st + 'issons', st + 'issez', st + 'issent'],
        ps: [st + 'is', st + 'is', st + 'it', st + 'îmes', st + 'îtes', st + 'irent']
      };
    }
    function IRR(inf, ar, pres, pp, aux, fs, ps, pr, ct, cr) {
      return { inf: inf, ar: ar, g: 3, pres: pres.split(' '), pp: pp, aux: aux, fs: fs, ps: ps.split(' '), pr: pr, comp: { t: ct, r: cr } };
    }
    var VERBS = [
      ER('parler', 'يتكلم', 'français', 'o'), ER('manger', 'يأكل', 'une pomme', 'o'), ER('aimer', 'يحب', 'la musique', 'o'),
      ER('étudier', 'يدرس', 'le français', 'o'), ER('regarder', 'يشاهد', 'un film', 'o'),
      IR('finir', 'ينهي', 'le travail', 'o'), IR('choisir', 'يختار', 'un livre', 'o'), IR('réussir', 'ينجح', "à l'examen", 'i'),
      IRR('être', 'يكون', 'suis es est sommes êtes sont', 'été', 'avoir', 'ser', 'fus fus fut fûmes fûtes furent', 'étant', 'à Paris', 'c'),
      IRR('avoir', 'يملك', 'ai as a avons avez ont', 'eu', 'avoir', 'aur', 'eus eus eut eûmes eûtes eurent', 'ayant', 'un livre', 'o'),
      IRR('aller', 'يذهب', 'vais vas va allons allez vont', 'allé', 'être', 'ir', 'allai allas alla allâmes allâtes allèrent', 'allant', "à l'école", 'c'),
      IRR('faire', 'يفعل', 'fais fais fait faisons faites font', 'fait', 'avoir', 'fer', 'fis fis fit fîmes fîtes firent', 'faisant', 'les devoirs', 'o'),
      IRR('prendre', 'يأخذ', 'prends prends prend prenons prenez prennent', 'pris', 'avoir', 'prendr', 'pris pris prit prîmes prîtes prirent', 'prenant', 'le bus', 'o'),
      IRR('venir', 'يأتي', 'viens viens vient venons venez viennent', 'venu', 'être', 'viendr', 'vins vins vint vînmes vîntes vinrent', 'venant', 'de Paris', 'c'),
      IRR('partir', 'يرحل', 'pars pars part partons partez partent', 'parti', 'être', 'partir', 'partis partis partit partîmes partîtes partirent', 'partant', 'en vacances', 'c'),
      IRR('dire', 'يقول', 'dis dis dit disons dites disent', 'dit', 'avoir', 'dir', 'dis dis dit dîmes dîtes dirent', 'disant', 'la vérité', 'o'),
      IRR('voir', 'يرى', 'vois vois voit voyons voyez voient', 'vu', 'avoir', 'verr', 'vis vis vit vîmes vîtes virent', 'voyant', 'le film', 'o'),
      IRR('écrire', 'يكتب', 'écris écris écrit écrivons écrivez écrivent', 'écrit', 'avoir', 'écrir', 'écrivis écrivis écrivit écrivîmes écrivîtes écrivirent', 'écrivant', 'une lettre', 'o'),
      IRR('lire', 'يقرأ', 'lis lis lit lisons lisez lisent', 'lu', 'avoir', 'lir', 'lus lus lut lûmes lûtes lurent', 'lisant', 'un livre', 'o'),
      IRR('mettre', 'يضع', 'mets mets met mettons mettez mettent', 'mis', 'avoir', 'mettr', 'mis mis mit mîmes mîtes mirent', 'mettant', 'la table', 'o')
    ];
    var VMAP = {};
    VERBS.forEach(function (v) { VMAP[v.inf] = v; });
    var SUBJ = [
      { k: 'je', i: 0, ag: '' }, { k: 'tu', i: 1, ag: '' }, { k: 'il', i: 2, ag: '' }, { k: 'elle', i: 2, ag: 'e' },
      { k: 'nous', i: 3, ag: 's' }, { k: 'vous', i: 4, ag: 's' }, { k: 'ils', i: 5, ag: 's' }, { k: 'elles', i: 5, ag: 'es' }
    ];
    var AUX = {
      'avoir': { pres: 'ai as a avons avez ont'.split(' '), imp: 'avais avais avait avions aviez avaient'.split(' '), ps: 'eus eus eut eûmes eûtes eurent'.split(' ') },
      'être': { pres: 'suis es est sommes êtes sont'.split(' '), imp: 'étais étais était étions étiez étaient'.split(' '), ps: 'fus fus fut fûmes fûtes furent'.split(' ') }
    };
    var ALLER = 'vais vas va allons allez vont'.split(' ');
    var FEND = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
    var VOW = /^[aeiouyh\u00E0\u00E2\u00E4\u00E9\u00E8\u00EA\u00EB\u00EE\u00EF\u00F4\u00F6\u00F9\u00FB\u00FC]/i;
    var ADV = { pres: 'maintenant', proche: 'demain', simple: "l'année prochaine", pc: 'hier', ps: 'ce jour-là' };
    var TENSES = {
      pres: { ar: 'المضارع', fr: 'Présent', tl: 'présent', f: 'الفاعل + الفعل المصرَّف حسب المجموعة' },
      proche: { ar: 'المستقبل القريب', fr: 'Futur proche', tl: 'f. proche', f: 'aller (في المضارع) + المصدر' },
      simple: { ar: 'المستقبل البسيط', fr: 'Futur simple', tl: 'f. simple', f: 'جذر المستقبل + ai · as · a · ons · ez · ont' },
      pc: { ar: 'الماضي المركب', fr: 'Passé composé', tl: 'p. composé', f: 'avoir / être (مضارع) + اسم المفعول' },
      ps: { ar: 'الماضي البسيط', fr: 'Passé simple', tl: 'p. simple', f: 'جذر الفعل + نهايات الماضي البسيط (للسرد)' },
      pqp: { ar: 'الماضي التام', fr: 'Plus-que-parfait', tl: 'pqp', f: 'avoir / être (imparfait) + اسم المفعول' },
      pa: { ar: 'الماضي الأتم', fr: 'Passé antérieur', tl: 'p. antérieur', f: 'avoir / être (passé simple) + اسم المفعول' }
    };
    var TORDER = ['pa', 'pqp', 'ps', 'pc', 'pres', 'proche', 'simple'];

    // يبني الجملة بالترميز مع تلوين الأدوار؛ short = الفاعل + الفعل فقط (للجدول)
    function compose(V, T, S, short) {
      var toks = [];
      function add(t, r, ns) { toks.push({ t: t, r: r, ns: !!ns }); }
      function subj(next) { if (S.k === 'je' && VOW.test(next)) add("j'", 's', true); else add(S.k, 's'); }
      var pp = V.pp + (V.aux === 'être' ? S.ag : '');
      var f, au;
      if (T === 'pres') { f = V.pres[S.i]; subj(f); add(f, 'v'); }
      else if (T === 'proche') { f = ALLER[S.i]; subj(f); add(f, 'a'); add(V.inf, 'v'); }
      else if (T === 'simple') { f = V.fs + FEND[S.i]; subj(f); add(f, 'v'); }
      else if (T === 'pc') { au = AUX[V.aux].pres[S.i]; subj(au); add(au, 'a'); add(pp, 'v'); }
      else if (T === 'ps') { f = V.ps[S.i]; subj(f); add(f, 'v'); }
      else if (T === 'pqp') { au = AUX[V.aux].imp[S.i]; subj(au); add(au, 'a'); if (!short) add('déjà', 'c'); add(pp, 'v'); }
      else if (T === 'pa') {
        au = AUX[V.aux].ps[S.i];
        if (!short) { if (/^(il|elle|ils|elles)$/.test(S.k)) add("Dès qu'", 'c', true); else add('Dès que', 'c'); }
        subj(au); add(au, 'a'); add(pp, 'v');
      }
      if (!short) {
        add(V.comp.t, V.comp.r);
        if (ADV[T]) add(ADV[T], 'c');
        if (T === 'pa') {
          toks[toks.length - 1].ns = true;
          add(',', '', false);
          var P = VMAP.partir, pf = P.ps[S.i];
          subj(pf);
          add(pf, 'v');
        }
        toks[toks.length - 1].ns = true;
        add('.', '', true);
      }
      toks[0].t = toks[0].t.charAt(0).toUpperCase() + toks[0].t.slice(1);
      var m = '';
      toks.forEach(function (k, i) {
        m += (k.r ? '[' + k.t + '|' + k.r + ']' : k.t) + ((k.ns || i === toks.length - 1) ? '' : ' ');
      });
      return m;
    }

    /* ---------- الأسماء لأنشطة الأدوات والصفات وحروف الجر ---------- */
    var NOUNS = [
      { w: 'livre', g: 'm', v: false, ar: 'كتاب' }, { w: 'table', g: 'f', v: false, ar: 'طاولة' }, { w: 'garçon', g: 'm', v: false, ar: 'ولد' },
      { w: 'fille', g: 'f', v: false, ar: 'بنت' }, { w: 'ami', g: 'm', v: true, ar: 'صديق' }, { w: 'amie', g: 'f', v: true, ar: 'صديقة' },
      { w: 'école', g: 'f', v: true, ar: 'مدرسة' }, { w: 'arbre', g: 'm', v: true, ar: 'شجرة' }, { w: 'stylo', g: 'm', v: false, ar: 'قلم' },
      { w: 'histoire', g: 'f', v: true, ar: 'قصة' }
    ];
    function artItems() {
      return NOUNS.map(function (n) {
        var d = n.v ? "l'" : (n.g === 'm' ? 'le ' : 'la '), u = n.g === 'm' ? 'un' : 'une';
        var d1 = n.v ? ["l'", ''] : [n.g === 'm' ? 'le' : 'la', ' '];
        return {
          label: n.w, note: n.w + ' = ' + n.ar + ' (' + (n.g === 'm' ? 'مذكر' : 'مؤنث') + (n.v ? ' - يبدأ بحرف متحرك ← l\' ' : '') + ')',
          sents: [
            { tag: 'معرفة (مفرد)', m: '[' + d1[0] + '|d]' + d1[1] + n.w },
            { tag: 'نكرة (مفرد)', m: '[' + u + '|d] ' + n.w },
            { tag: 'معرفة (جمع)', m: '[les|d] ' + n.w + 's' },
            { tag: 'نكرة (جمع)', m: '[des|d] ' + n.w + 's' }
          ]
        };
      });
    }
    var OWN = ['je', 'tu', 'il / elle', 'nous', 'vous', 'ils / elles'];
    function possForm(o, n, pl) {
      if (pl) return ['mes', 'tes', 'ses', 'nos', 'vos', 'leurs'][o];
      if (o <= 2) { var b = ['mon', 'ton', 'son'][o], f = ['ma', 'ta', 'sa'][o]; return n.g === 'm' ? b : (n.v ? b : f); }
      return ['', '', '', 'notre', 'votre', 'leur'][o];
    }
    function detItems() {
      return NOUNS.map(function (n) {
        var dem = n.g === 'f' ? 'cette' : (n.v ? 'cet' : 'ce');
        var s = [{ tag: 'إشارة (مفرد)', m: '[' + dem + '|d] ' + n.w }, { tag: 'إشارة (جمع)', m: '[ces|d] ' + n.w + 's' }];
        OWN.forEach(function (ow, o) { s.push({ tag: 'ملكية: ' + ow, m: '[' + possForm(o, n, false) + '|d] ' + n.w }); });
        s.push({ tag: 'ملكية جمع: je', m: '[mes|d] ' + n.w + 's' });
        s.push({ tag: 'ملكية جمع: nous', m: '[nos|d] ' + n.w + 's' });
        return { label: n.w, note: n.w + ' = ' + n.ar + ' (' + (n.g === 'm' ? 'مذكر' : 'مؤنث') + (n.v ? ' - يبدأ بحرف متحرك' : '') + '). الأداة تتبع الشيء المملوك لا المالك.', sents: s };
      });
    }
    var PLACES = [
      { w: 'cinéma', g: 'm' }, { w: 'marché', g: 'm' }, { w: 'parc', g: 'm' }, { w: 'école', g: 'f', v: true }, { w: 'hôpital', g: 'm', v: true },
      { w: 'maison', g: 'f' }, { w: 'gare', g: 'f' }, { w: 'bibliothèque', g: 'f' }, { w: 'États-Unis', g: 'p' }
    ];
    function contr(prep, p) {
      if (p.g === 'p') return [prep === 'à' ? 'aux' : 'des', ' '];
      if (p.v) return [prep + " l'", ''];
      if (p.g === 'm') return [prep === 'à' ? 'au' : 'du', ' '];
      return [prep + ' la', ' '];
    }
    function prepItems() {
      return PLACES.map(function (p) {
        var a = contr('à', p), d = contr('de', p);
        return {
          label: p.w, note: 'à + le = au · à + les = aux · de + le = du · de + les = des',
          sents: [
            { tag: 'à (إلى / في)', m: 'Je vais [' + a[0] + '|p]' + a[1] + p.w + '.' },
            { tag: 'de (من / عن)', m: 'Je viens [' + d[0] + '|p]' + d[1] + p.w + '.' }
          ]
        };
      });
    }
    function partItems() {
      return VERBS.map(function (v) {
        var gl = v.g === 1 ? 'المجموعة الأولى' : (v.g === 2 ? 'المجموعة الثانية' : 'المجموعة الثالثة');
        return {
          label: v.inf, note: v.inf + ' = ' + v.ar + ' — ' + gl,
          sents: [
            { tag: 'اسم الفاعل (participe présent)', m: '[' + v.pr + '|v]' },
            { tag: 'gérondif (أثناء)', m: '[en|p] [' + v.pr + '|v]' },
            { tag: 'اسم المفعول (participe passé)', m: '[' + v.pp + '|v]' }
          ]
        };
      });
    }
    /* ---------- الدروس ---------- */
    function Q(p, o, a, x) { return { k: 'q', p: p, o: o, a: a, x: x || '' }; }
    function TP(m, r) { return { k: 't', m: m, r: r }; }
    function OR(s, ar) { return { k: 'o', s: s, ar: ar || '' }; }
    var GR3 = ['المجموعة الأولى', 'المجموعة الثانية', 'المجموعة الثالثة', 'لا شيء مما سبق'];
    var TYP4 = ['خبرية', 'استفهامية', 'أمرية', 'تعجبية'];

    var LESSONS = [
      {
        id: 'l1', ic: '🧱', ar: 'بنية الجملة', fr: 'La structure de la phrase', col: '#0a7ad6',
        blocks: [
          ['h', 'ثلاثة عناصر أساسية'],
          ['t', 'الجملة الفرنسية البسيطة تُبنى غالباً هكذا: **الفاعل** (من يفعل؟) ثم **الفعل** (ماذا يفعل؟) ثم **المفعول** أو التكملة (ماذا؟ أين؟ متى؟). الترتيب ثابت تقريباً، بعكس العربية التي تبدأ غالباً بالفعل.'],
          ['x', '[Sara|s] [mange|v] [une pomme|o].', 'سارة تأكل تفاحة.'],
          ['x', '[Les élèves|s] [lisent|v] [un livre|o] [à la bibliothèque|c].', 'التلاميذ يقرؤون كتاباً في المكتبة.'],
          ['tip', 'سؤال سريع: اسأل **Qui ?** للفاعل، **Quoi ?** للمفعول المباشر، و**Où ? / Quand ?** للظرف.'],
          ['w', 'tap', {
            title: '👆 اضغط على كل كلمة ملوّنة لتعرف دورها', items: [
              { m: '[Sara|s] [mange|v] [une pomme|o] [à la cantine|c].', ar: 'سارة تأكل تفاحة في المقصف.' },
              { m: '[Les élèves|s] [lisent|v] [un livre|o] [le matin|c].', ar: 'التلاميذ يقرؤون كتاباً في الصباح.' },
              { m: '[Nous|s] [parlons|v] [à notre professeur|i].', ar: 'نتحدث إلى معلمنا.' },
              { m: '[Elle|s] [a|a] [mangé|v] [une pomme|o].', ar: 'هي أكلت تفاحة.' }
            ]
          }]
        ],
        quiz: [
          TP('[Sara|s] [mange|v] [une pomme|o].', 's'), TP('[Sara|s] [mange|v] [une pomme|o].', 'v'),
          TP('[Les enfants|s] [regardent|v] [un film|o] [le soir|c].', 'o'), TP('[Les enfants|s] [regardent|v] [un film|o] [le soir|c].', 'c'),
          Q('في الجملة « Marie chante une chanson » ما الفعل؟', ['Marie', 'chante', 'une chanson', 'une'], 1, 'chante هو الفعل، وMarie فاعل، وune chanson مفعول.'),
          OR('Le professeur explique la leçon.', 'المعلم يشرح الدرس')
        ]
      },
      {
        id: 'l2', ic: '👤', ar: 'الفاعل: الاسم والضمير والأدوات', fr: 'Le sujet : nom, pronom, déterminants', col: '#0e8f9a',
        blocks: [
          ['h', 'الفاعل: اسم أو ضمير'],
          ['t', 'الفاعل هو من يقوم بالفعل. قد يكون **اسماً** (Marie, les élèves) أو **ضميراً** يحل محل الاسم حتى لا نكرر الكلام.'],
          ['x', '[Marie|s] [chante|v].', 'ماري تغني.'],
          ['x', '[Elle|s] [chante|v].', 'هي تغني.'],
          ['tb', ['الضمير', 'المعنى', 'يحل محل'], [['je', 'أنا', 'المتكلم'], ['tu', 'أنتَ / أنتِ', 'المخاطب (صديق)'], ['il', 'هو', 'اسم مذكر مفرد: Paul'], ['elle', 'هي', 'اسم مؤنث مفرد: Marie'], ['on', 'نحن / الناس', 'عام'], ['nous', 'نحن', 'أنا + غيري'], ['vous', 'أنتم / حضرتك', 'جمع أو احتراماً'], ['ils', 'هم', 'جمع مذكر أو مختلط'], ['elles', 'هنّ', 'جمع مؤنث فقط']], [0]],
          ['tip', 'Marie et Paul = **ils** (يكفي وجود مذكر واحد). Marie et Sara = **elles**.'],
          ['h', 'الأدوات: المعرفة والنكرة'],
          ['t', '**المعرفة** نتكلم بها عن شيء معروف ومحدد، و**النكرة** عن شيء غير محدد أو نذكره لأول مرة. و**التبعيض** لكمية غير محددة.'],
          ['tb', ['النوع', 'مذكر', 'مؤنث', 'جمع'], [['معرفة (définis)', 'le', 'la', 'les'], ['نكرة (indéfinis)', 'un', 'une', 'des'], ['تبعيض (partitifs)', 'du', 'de la', 'des']], [1, 2, 3]],
          ['tip', "قبل حرف متحرك أو h صامتة تصبح le / la ← **l'** مثل l'école و l'ami."],
          ['w', 'chips', { title: '🎛️ اختر اسماً لترى أدواته', make: 'art' }]
        ],
        quiz: [
          Q('___ livre est sur la table. (كتاب محدد)', ['Le', 'La', 'Les', 'Un'], 0, 'livre مذكر مفرد ومعروف فنستخدم le.'),
          Q('___ école est grande.', ['La', 'Le', "L'", 'Les'], 2, "école مؤنثة لكنها تبدأ بحرف متحرك فنكتب l'école."),
          Q('Marie et Sara = ؟', ['ils', 'elles', 'elle', 'nous'], 1, 'جمع مؤنث فقط ← elles.'),
          Q('Paul et Marie = ؟', ['elles', 'ils', 'il', 'vous'], 1, 'يكفي وجود مذكر واحد ← ils.'),
          Q("J'ai ___ ami. (غير محدد)", ['un', 'une', 'des', 'le'], 0, 'ami مذكر مفرد نكرة ← un ami.'),
          TP('[Le chat|s] [dort|v] [sur le canapé|c].', 's')
        ]
      },
      {
        id: 'l3', ic: '⚙️', ar: 'الفعل: المجموعات الثلاث', fr: 'Le verbe : les trois groupes', col: '#d63a3a',
        blocks: [
          ['h', 'ثلاث مجموعات للأفعال'],
          ['t', 'كل فعل فرنسي ينتمي إلى مجموعة حسب نهاية المصدر، ولكل مجموعة طريقة تصريف. **الفعل يتغير حسب الفاعل والزمن.**'],
          ['tb', ['المجموعة', 'النهاية', 'أمثلة', 'ملاحظة'], [['الأولى', '-er', 'parler, manger, aimer', 'الأكثر شيوعاً وتصريفها منتظم. الاستثناء: aller'], ['الثانية', '-ir مع -issons', 'finir, choisir, réussir', 'تأخذ -iss- في الجمع: nous finissons'], ['الثالثة', 'باقي الأفعال', 'être, avoir, aller, faire, prendre, venir, partir', 'غير منتظمة وتُحفظ']], [2]],
          ['tb', ['الفاعل', 'الأولى: parler', 'الثانية: finir'], [['je', 'parle', 'finis'], ['tu', 'parles', 'finis'], ['il / elle', 'parle', 'finit'], ['nous', 'parlons', 'finissons'], ['vous', 'parlez', 'finissez'], ['ils / elles', 'parlent', 'finissent']], [1, 2]],
          ['tip', 'ابدأ دائماً بالفاعل ثم صرّف الفعل. جرّب المختبر بالأسفل مع أفعال من المجموعات الثلاث.'],
          ['w', 'lab', { tenses: ['pres'] }]
        ],
        quiz: [
          Q('parler من المجموعة...', GR3, 0, 'ينتهي بـ -er فهو من المجموعة الأولى.'),
          Q('finir من المجموعة...', GR3, 1, 'ينتهي بـ -ir ويصرّف nous finissons.'),
          Q('aller من المجموعة...', GR3, 2, 'استثناء: ينتهي بـ er لكنه من الثالثة.'),
          Q('Nous ___ le travail. (finir)', ['finons', 'finissons', 'finirons', 'finisson'], 1, 'المجموعة الثانية: nous finissons.'),
          Q('Ils ___ français. (parler)', ['parlons', 'parlent', 'parlez', 'parle'], 1, 'ils مع المجموعة الأولى ← -ent.'),
          Q('Tu ___ un livre. (choisir)', ['choisis', 'choisit', 'choisisses', 'choisissons'], 0, 'tu مع المجموعة الثانية ← -is.')
        ]
      },
      {
        id: 'l4', ic: '🚀', ar: 'الحاضر والمستقبل', fr: 'Présent · futur proche · futur simple', col: '#1b9e5b',
        blocks: [
          ['h', 'المضارع (Le présent)'],
          ['t', 'نستعمله لما يحدث **الآن**، وللحقائق والعادات. الصيغة: الفاعل + الفعل المصرَّف.'],
          ['x', '[Je|s] [mange|v] [une pomme|o] [maintenant|c].', 'أنا آكل تفاحة الآن.'],
          ['h', 'المستقبل القريب (Le futur proche)'],
          ['t', 'لحدث **سيحدث قريباً** ونحن متأكدون منه. الصيغة: **aller** في المضارع + **المصدر**.'],
          ['x', '[Je|s] [vais|a] [manger|v] [une pomme|o] [demain|c].', 'سآكل تفاحة غداً.'],
          ['h', 'المستقبل البسيط (Le futur simple)'],
          ['t', 'لحدث في المستقبل قريباً كان أو بعيداً. الصيغة: **المصدر** + نهايات: ai – as – a – ons – ez – ont (وفي -re نحذف e).'],
          ['x', '[Je|s] [mangerai|v] [une pomme|o] [l\'année prochaine|c].', 'سآكل تفاحة العام القادم.'],
          ['tb', ['الفاعل', 'النهاية', 'parler', 'finir'], [['je', '-ai', 'parlerai', 'finirai'], ['tu', '-as', 'parleras', 'finiras'], ['il / elle', '-a', 'parlera', 'finira'], ['nous', '-ons', 'parlerons', 'finirons'], ['vous', '-ez', 'parlerez', 'finirez'], ['ils / elles', '-ont', 'parleront', 'finiront']], [2, 3]],
          ['tip', 'جذور شاذة مهمة: être ← **ser-** · avoir ← **aur-** · aller ← **ir-** · faire ← **fer-** · venir ← **viendr-** · voir ← **verr-**.'],
          ['w', 'lab', { tenses: ['pres', 'proche', 'simple'] }]
        ],
        quiz: [
          Q('Je ___ une pomme maintenant.', ['mange', 'mangerai', 'ai mangé', 'vais manger'], 0, 'maintenant = الآن ← المضارع.'),
          Q('Demain, nous ___ visiter le musée. (futur proche)', ['visitons', 'allons visiter', 'avons visité', 'visitions'], 1, 'المستقبل القريب = aller + المصدر.'),
          Q("Elle ___ à Paris l'année prochaine. (aller)", ['va', 'ira', 'allait', 'est allée'], 1, 'جذر aller في المستقبل البسيط: ir- + a.'),
          Q('Tu ___ tes devoirs demain. (finir, futur simple)', ['finiras', 'finis', 'finissais', 'as fini'], 0, 'المصدر finir + as.'),
          OR('Je vais manger une pomme.', 'سآكل تفاحة'),
          TP('[Nous|s] [allons|a] [partir|v] [demain|c].', 'a')
        ]
      },
      {
        id: 'l5', ic: '⏪', ar: 'الأزمنة الماضية', fr: 'Passé composé · simple · plus-que-parfait · antérieur', col: '#7b4bd1',
        blocks: [
          ['h', 'الماضي المركب (Le passé composé)'],
          ['t', 'لحدث **انتهى** في الماضي. الصيغة: **avoir أو être** في المضارع + **اسم المفعول** (participe passé).'],
          ['x', "[J'|s][ai|a] [mangé|v] [une pomme|o] [hier|c].", 'أكلتُ تفاحة أمس.'],
          ['tip', 'مع **être**: أفعال الحركة (aller, venir, partir, arriver, entrer, sortir, monter, descendre, rester, tomber...) والأفعال الانعكاسية، ويتفق اسم المفعول مع الفاعل.'],
          ['x', "[Elle|s] [est|a] [allée|v] [à l'école|c] [hier|c].", 'ذهبت إلى المدرسة أمس.'],
          ['h', 'الماضي البسيط (Le passé simple)'],
          ['t', 'للسرد في **القصص والكتب** ونادراً في الكلام. يعبّر عن حدث انتهى. الصيغة: جذر الفعل + نهايات خاصة.'],
          ['tb', ['الفاعل', 'parler', 'finir', 'prendre'], [['je', 'parlai', 'finis', 'pris'], ['tu', 'parlas', 'finis', 'pris'], ['il / elle', 'parla', 'finit', 'prit'], ['nous', 'parlâmes', 'finîmes', 'prîmes'], ['vous', 'parlâtes', 'finîtes', 'prîtes'], ['ils / elles', 'parlèrent', 'finirent', 'prirent']], [1, 2, 3]],
          ['x', '[Il|s] [mangea|v] [une pomme|o] [puis|c] [il|s] [partit|v].', 'أكل تفاحة ثم رحل.'],
          ['h', 'الماضي التام (Le plus-que-parfait)'],
          ['t', 'لحدث وقع **قبل حدث ماضٍ آخر**. الصيغة: **avoir / être في الـ imparfait** + اسم المفعول.'],
          ['x', '[Quand je suis arrivé|c], [elle|s] [avait|a] [déjà|c] [mangé|v].', 'عندما وصلتُ كانت قد أكلت بالفعل.'],
          ['h', 'الماضي الأتم (Le passé antérieur)'],
          ['t', 'لحدث وقع **قبل حدث بصيغة الماضي البسيط**، ويأتي بعد dès que / quand / lorsque / aussitôt que. الصيغة: **avoir / être في الماضي البسيط** + اسم المفعول. أدبي.'],
          ['x', "[Dès qu'|c][il|s] [eut|a] [mangé|v], [il|s] [partit|v].", 'حالما أكل رحل.'],
          ['tb', ['الزمن', 'الصيغة', 'مثال'], [['passé composé', 'avoir/être (présent) + pp', "J'ai mangé"], ['passé simple', 'نهايات خاصة', 'Il mangea'], ['plus-que-parfait', 'avoir/être (imparfait) + pp', 'Il avait mangé'], ['passé antérieur', 'avoir/être (passé simple) + pp', 'Il eut mangé']], [0, 2]],
          ['w', 'lab', { tenses: ['pc', 'ps', 'pqp', 'pa'] }]
        ],
        quiz: [
          Q("Hier, j'___ un film. (regarder)", ['regarde', 'ai regardé', 'regarderai', 'avais regardé'], 1, 'حدث انتهى أمس ← passé composé.'),
          Q("Elle ___ à l'école hier. (aller)", ['a allé', 'est allée', 'allait', 'va'], 1, 'aller يأخذ être ويتفق مع الفاعل المؤنث.'),
          Q('Il ___ une lettre puis il partit. (écrire, passé simple)', ['écrit', 'écrivit', 'a écrit', 'écrira'], 1, 'الماضي البسيط لـ écrire مع il: écrivit.'),
          Q('Quand je suis arrivé, il ___ déjà mangé.', ['a', 'avait', 'eut', 'aura'], 1, 'حدث سابق لحدث ماضٍ ← plus-que-parfait: avait mangé.'),
          Q("Dès qu'il ___ fini, il partit.", ['a', 'avait', 'eut', 'aura'], 2, 'قبل passé simple نستعمل passé antérieur: eut fini.'),
          OR("Elle est allée à l'école.", 'ذهبت إلى المدرسة')
        ]
      },
      {
        id: 'l6', ic: '🎯', ar: 'المفعول المباشر وغير المباشر', fr: 'COD et COI', col: '#1b9e5b',
        blocks: [
          ['h', 'المفعول المباشر (COD)'],
          ['t', 'يأتي **مباشرة** بعد الفعل بدون حرف جر. نسأل بعد الفعل: **Qui ? / Quoi ?**'],
          ['x', '[Je|s] [mange|v] [la pomme|o].', 'آكل التفاحة.'],
          ['h', 'المفعول غير المباشر (COI)'],
          ['t', 'يأتي بعد حرف جر (غالباً **à**). نسأل: **À qui ? / À quoi ?**'],
          ['x', '[Je|s] [parle|v] [à Marie|i].', 'أتحدث إلى ماري.'],
          ['h', 'استبدالهما بضمير'],
          ['tb', ['', 'أنا', 'أنت', 'هو / هي', 'نحن', 'أنتم', 'هم'], [['COD', 'me', 'te', "le / la / l'", 'nous', 'vous', 'les'], ['COI', 'me', 'te', 'lui', 'nous', 'vous', 'leur']], [1, 2, 3, 4, 5, 6]],
          ['tip', "يوضع الضمير **قبل الفعل**: Je la mange · Je lui parle. وفي passé composé قبل المساعد: Je l'ai mangée."],
          ['tip', 'نستعمل **y** بدل (à + مكان) و**en** بدل (de + شيء أو كمية).'],
          ['w', 'chips', {
            title: '🔁 اختر جملة وشاهد الاستبدال', items: [
              { label: 'COD مؤنث', note: 'la pomme = COD مؤنث مفرد ← la', sents: [{ tag: 'قبل', m: '[Je|s] [mange|v] [la pomme|o].' }, { tag: 'بعد', m: '[Je|s] [la|o] [mange|v].' }] },
              { label: 'COD جمع', note: 'les enfants = COD جمع ← les', sents: [{ tag: 'قبل', m: '[Nous|s] [regardons|v] [les enfants|o].' }, { tag: 'بعد', m: '[Nous|s] [les|o] [regardons|v].' }] },
              { label: 'COD مذكر', note: 'Paul = COD مذكر مفرد ← le', sents: [{ tag: 'قبل', m: '[Tu|s] [vois|v] [Paul|o].' }, { tag: 'بعد', m: '[Tu|s] [le|o] [vois|v].' }] },
              { label: 'COI مفرد', note: 'à Marie = COI ← lui', sents: [{ tag: 'قبل', m: '[Je|s] [parle|v] [à Marie|i].' }, { tag: 'بعد', m: '[Je|s] [lui|i] [parle|v].' }] },
              { label: 'COI جمع', note: 'aux amis = COI جمع ← leur', sents: [{ tag: 'قبل', m: '[Elle|s] [téléphone|v] [aux amis|i].' }, { tag: 'بعد', m: '[Elle|s] [leur|i] [téléphone|v].' }] },
              { label: 'COD + COI', note: 'نضع COD أولاً ثم COI: le lui', sents: [{ tag: 'قبل', m: '[Il|s] [donne|v] [le livre|o] [à Paul|i].' }, { tag: 'بعد', m: '[Il|s] [le|o] [lui|i] [donne|v].' }] },
              { label: 'y', note: 'y بدل (à + مكان)', sents: [{ tag: 'قبل', m: "[Je|s] [vais|v] [à l'école|c]." }, { tag: 'بعد', m: "[J'|s][y|c] [vais|v]." }] },
              { label: 'en', note: 'en بدل (de + شيء أو كمية)', sents: [{ tag: 'قبل', m: '[Il|s] [mange|v] [du pain|o].' }, { tag: 'بعد', m: '[Il|s] [en|o] [mange|v].' }] }
            ]
          }]
        ],
        quiz: [
          TP('[Je|s] [mange|v] [une pomme|o].', 'o'), TP('[Je|s] [parle|v] [à Marie|i].', 'i'),
          Q('Je vois Paul. ← Je ___ vois.', ['le', 'lui', 'la', 'leur'], 0, 'Paul COD مذكر ← le.'),
          Q('Je parle à Paul. ← Je ___ parle.', ['le', 'lui', 'y', 'en'], 1, 'à Paul COI ← lui.'),
          Q('Elle regarde les fleurs. ← Elle ___ regarde.', ['les', 'leur', 'lui', 'la'], 0, 'les fleurs COD جمع ← les.'),
          Q("Tu vas à Paris ? Oui, j'___ vais.", ['y', 'en', 'le', 'lui'], 0, 'y بدل à + مكان.')
        ]
      },
      {
        id: 'l7', ic: '🏷️', ar: 'صفات الإشارة والملكية', fr: 'Adjectifs démonstratifs et possessifs', col: '#0e8f9a',
        blocks: [
          ['h', 'صفات الإشارة (Adjectifs démonstratifs)'],
          ['t', 'نشير بها إلى شيء: هذا / هذه / هؤلاء. تتبع **جنس الاسم وعدده**.'],
          ['tb', ['الحالة', 'الأداة', 'مثال'], [['مذكر مفرد', 'ce', 'ce livre'], ['مذكر مفرد قبل حرف متحرك أو h', 'cet', 'cet ami'], ['مؤنث مفرد', 'cette', 'cette table'], ['جمع', 'ces', 'ces élèves']], [1, 2]],
          ['tip', 'أضف **-ci** للقريب و**-là** للبعيد: ce livre-ci / ce livre-là.'],
          ['h', 'صفات الملكية (Adjectifs possessifs)'],
          ['t', 'تدل على المالك، وتتبع **جنس وعدد الشيء المملوك** وليس المالك.'],
          ['tb', ['المالك', 'مذكر', 'مؤنث', 'جمع'], [['je', 'mon', 'ma', 'mes'], ['tu', 'ton', 'ta', 'tes'], ['il / elle', 'son', 'sa', 'ses'], ['nous', 'notre', 'notre', 'nos'], ['vous', 'votre', 'votre', 'vos'], ['ils / elles', 'leur', 'leur', 'leurs']], [1, 2, 3]],
          ['tip', 'قبل مؤنث يبدأ بحرف متحرك نستعمل mon / ton / son: **mon amie · ton école**.'],
          ['w', 'chips', { title: '🎛️ اختر اسماً لترى الإشارة والملكية', make: 'det' }]
        ],
        quiz: [
          Q('___ livre est intéressant. (هذا)', ['Ce', 'Cet', 'Cette', 'Ces'], 0, 'livre مذكر ويبدأ بحرف ساكن ← ce.'),
          Q('___ ami est gentil. (هذا)', ['Ce', 'Cet', 'Cette', 'Ces'], 1, 'ami مذكر يبدأ بحرف متحرك ← cet.'),
          Q('___ fleurs sont belles. (هذه)', ['Ce', 'Cette', 'Ces', 'Cet'], 2, 'fleurs جمع ← ces.'),
          Q('Marie aime ___ mère. (أمها)', ['son', 'sa', 'ses', 'leur'], 1, 'mère مؤنث مفرد ← sa (تتبع الشيء المملوك).'),
          Q('Je cherche ___ amie. (صديقتي)', ['ma', 'mon', 'mes', 'ta'], 1, 'amie مؤنث يبدأ بحرف متحرك ← mon amie.'),
          Q('Nous aimons ___ professeur. (معلمنا)', ['notre', 'nos', 'votre', 'leur'], 0, 'professeur مفرد والمالك nous ← notre.')
        ]
      },
      {
        id: 'l8', ic: '🧭', ar: 'حروف الجر', fr: 'Les prépositions', col: '#5b6b8c',
        blocks: [
          ['h', 'حروف الجر (Les prépositions)'],
          ['t', 'تربط الفعل أو الاسم بتكملة، وتدل على **المكان** أو **الزمان** أو **الوسيلة**.'],
          ['tb', ['النوع', 'حروف الجر'], [['المكان', 'à (في/إلى) · dans (داخل) · sur (فوق) · sous (تحت) · devant (أمام) · derrière (خلف) · entre (بين) · chez (عند) · près de (قرب) · loin de (بعيد عن) · en face de (مقابل) · à côté de (بجوار)'], ['الزمان', 'à (الساعة) · en (الشهر/السنة) · dans (بعد مدة) · depuis (منذ) · pendant (خلال) · avant (قبل) · après (بعد)'], ['أخرى', 'avec (مع) · sans (بدون) · pour (من أجل) · par (بواسطة) · de (من/عن) · en (بـ: en bus)']]],
          ['h', 'اندماج حرف الجر مع الأداة'],
          ['tb', ['القاعدة', 'النتيجة', 'مثال'], [['à + le', 'au', 'au cinéma'], ['à + les', 'aux', 'aux États-Unis'], ['de + le', 'du', 'du livre'], ['de + les', 'des', 'des élèves'], ["à + la / l'", "à la / à l'", "à la maison / à l'école"]], [1, 2]],
          ['tip', 'الدول: **en** France (مؤنث) · **au** Maroc (مذكر) · **aux** États-Unis (جمع) · **à** Paris (مدينة).'],
          ['w', 'chips', { title: '🎛️ اختر مكاناً لترى اندماج à و de', make: 'prep' }]
        ],
        quiz: [
          Q('Je vais ___ cinéma.', ['à le', 'au', 'à la', 'aux'], 1, 'à + le = au.'),
          Q("Elle revient ___ école.", ['de la', 'du', "de l'", 'des'], 2, "école تبدأ بحرف متحرك ← de l'école."),
          Q('Le livre est ___ la table. (فوق)', ['sous', 'sur', 'chez', 'entre'], 1, 'sur = فوق.'),
          Q("J'habite ___ France.", ['au', 'à', 'en', 'aux'], 2, 'France مؤنث ← en France.'),
          Q('Nous parlons ___ professeurs.', ['du', 'des', 'de la', 'au'], 1, 'de + les = des.'),
          Q('Il arrive ___ huit heures.', ['à', 'en', 'dans', 'depuis'], 0, 'للساعة نستعمل à.')
        ]
      },
      {
        id: 'l9', ic: '🔤', ar: 'اسم الفاعل واسم المفعول', fr: 'Participe présent et participe passé', col: '#c2185b',
        blocks: [
          ['h', 'اسم الفاعل: Participe présent'],
          ['t', 'يدل على الفعل **أثناء حدوثه**. يُصاغ من **nous** في المضارع: نحذف -ons ونضيف **-ant**.'],
          ['tb', ['المصدر', 'nous (مضارع)', 'participe présent'], [['parler', 'parlons', 'parlant'], ['finir', 'finissons', 'finissant'], ['faire', 'faisons', 'faisant'], ['prendre', 'prenons', 'prenant'], ['être / avoir / savoir', '—', 'étant / ayant / sachant']], [0, 1, 2]],
          ['t', 'مع **en** يصبح **gérondif** ويعبّر عن حدثين متزامنين أو عن الطريقة: **en mangeant** (أثناء الأكل).'],
          ['x', '[Il|s] [mange|v] [en lisant|c].', 'هو يأكل وهو يقرأ.'],
          ['h', 'اسم المفعول: Participe passé'],
          ['t', 'نستعمله في الماضي المركب والمبني للمجهول، وقد يعمل **صفة**.'],
          ['tb', ['المجموعة', 'النهاية', 'مثال'], [['الأولى', '-é', 'parlé, mangé'], ['الثانية', '-i', 'fini, choisi'], ['الثالثة', 'متنوعة', 'été, eu, allé, fait, pris, dit, vu, mis, écrit, lu, venu']], [2]],
          ['tip', 'كصفة يتفق في الجنس والعدد: **une porte fermée · des fenêtres ouvertes**.'],
          ['w', 'chips', { title: '🎛️ اختر فعلاً لترى المشتقات', make: 'part' }]
        ],
        quiz: [
          Q('parlons ← participe présent؟', ['parlant', 'parlé', 'parlait', 'parlera'], 0, 'نحذف -ons ونضيف -ant.'),
          Q('finir ← participe présent؟', ['finant', 'finissant', 'fini', 'finit'], 1, 'من nous finissons ← finissant.'),
          Q('Il écoute la musique en ___ . (marcher)', ['marchant', 'marché', 'marche', 'marcher'], 0, 'بعد en نستعمل participe présent.'),
          Q('Participe passé de prendre؟', ['prendu', 'pris', 'prenant', 'prit'], 1, 'pris (شاذ).'),
          Q('Participe passé de finir؟', ['finit', 'fini', 'finissant', 'finu'], 1, 'المجموعة الثانية ← -i.'),
          Q('une porte ___ (fermer)', ['fermé', 'fermée', 'fermés', 'fermant'], 1, 'كصفة لمؤنث مفرد ← fermée.')
        ]
      },
      {
        id: 'l10', ic: '⏰', ar: 'ظروف الزمان والمكان', fr: 'Adverbes de temps et de lieu', col: '#a9780a',
        blocks: [
          ['h', 'ظروف الزمان (Adverbes de temps)'],
          ['tb', ['الظرف', 'المعنى'], [["aujourd'hui", 'اليوم'], ['hier', 'أمس'], ['demain', 'غداً'], ['maintenant', 'الآن'], ['bientôt', 'قريباً'], ['déjà', 'بالفعل'], ['toujours', 'دائماً'], ['souvent', 'غالباً'], ['parfois', 'أحياناً'], ['jamais', 'أبداً'], ['tôt', 'مبكراً'], ['tard', 'متأخراً']], [0]],
          ['h', 'ظروف المكان (Adverbes de lieu)'],
          ['tb', ['الظرف', 'المعنى'], [['ici', 'هنا'], ['là', 'هناك'], ['partout', 'في كل مكان'], ['ailleurs', 'في مكان آخر'], ['loin', 'بعيداً'], ['près', 'قريباً'], ['dehors', 'خارجاً'], ['dedans', 'داخلاً'], ['en haut', 'بالأعلى'], ['en bas', 'بالأسفل']], [0]],
          ['tip', 'الظرف **لا يتغير**: لا مذكر ولا مؤنث ولا جمع.'],
          ['x', '[Nous|s] [habitons|v] [ici|c].', 'نسكن هنا.'],
          ['h', 'الظرف يكشف الزمن'],
          ['tb', ['الظرف', 'الزمن المناسب', 'مثال'], [['maintenant, en ce moment', 'présent', 'Je mange maintenant.'], ['demain, bientôt', 'futur proche', 'Je vais partir demain.'], ["l'année prochaine, un jour", 'futur simple', "Je partirai l'année prochaine."], ['hier, la semaine dernière', 'passé composé', 'Je suis parti hier.'], ['déjà (قبل حدث ماضٍ)', 'plus-que-parfait', 'Il avait déjà mangé.']], [0, 2]],
          ['w', 'chips', {
            title: '🕒 اختر ظرفاً لترى زمنه ومثاله', items: [
              { label: 'maintenant', note: 'الزمن: المضارع (présent)', sents: [{ m: '[Je|s] [mange|v] [une pomme|o] [maintenant|c].', ar: 'أنا آكل تفاحة الآن.' }] },
              { label: 'demain', note: 'الزمن: المستقبل القريب (futur proche)', sents: [{ m: '[Je|s] [vais|a] [partir|v] [demain|c].', ar: 'سأرحل غداً.' }] },
              { label: 'bientôt', note: 'الزمن: المستقبل القريب (futur proche)', sents: [{ m: '[Nous|s] [allons|a] [arriver|v] [bientôt|c].', ar: 'سنصل قريباً.' }] },
              { label: "l'année prochaine", note: 'الزمن: المستقبل البسيط (futur simple)', sents: [{ m: "[Elle|s] [voyagera|v] [l'année prochaine|c].", ar: 'ستسافر العام القادم.' }] },
              { label: 'un jour', note: 'الزمن: المستقبل البسيط (futur simple)', sents: [{ m: '[Tu|s] [réussiras|v] [un jour|c].', ar: 'ستنجح يوماً ما.' }] },
              { label: 'hier', note: 'الزمن: الماضي المركب (passé composé)', sents: [{ m: '[Il|s] [est|a] [parti|v] [hier|c].', ar: 'رحل أمس.' }] },
              { label: 'la semaine dernière', note: 'الزمن: الماضي المركب (passé composé)', sents: [{ m: "[J'|s][ai|a] [vu|v] [ce film|o] [la semaine dernière|c].", ar: 'شاهدت هذا الفيلم الأسبوع الماضي.' }] },
              { label: 'déjà', note: 'مع الماضي التام (plus-que-parfait) لحدث سبق حدثاً ماضياً', sents: [{ m: '[Elle|s] [avait|a] [déjà|c] [mangé|v].', ar: 'كانت قد أكلت بالفعل.' }] },
              { label: 'toujours', note: 'تدل على عادة: المضارع', sents: [{ m: "[Il|s] [arrive|v] [toujours|c] [à l'heure|c].", ar: 'هو يصل دائماً في الموعد.' }] },
              { label: 'ici / là-bas', note: 'ظرفا مكان لا يتغيران', sents: [{ m: '[Nous|s] [habitons|v] [ici|c].', ar: 'نسكن هنا.' }, { m: '[Il|s] [travaille|v] [là-bas|c].', ar: 'هو يعمل هناك.' }] }
            ]
          }]
        ],
        quiz: [
          Q('Hier, je ___ au cinéma.', ['vais', 'suis allé', 'irai', 'allais'], 1, 'hier ← passé composé.'),
          Q('Demain, nous ___ partir.', ['partons', 'allons', 'sommes partis', 'partions'], 1, 'allons partir: مستقبل قريب. (الإجابة aller المساعد)'),
          Q("L'année prochaine, elle ___ en France.", ['va', 'ira', 'est allée', 'allait'], 1, 'l\'année prochaine ← futur simple.'),
          Q('الظرف « ici » معناه...', ['هناك', 'هنا', 'بعيداً', 'أمام'], 1, 'ici = هنا.'),
          Q('أي ظرف يدل على الزمن؟', ['partout', 'bientôt', 'dehors', 'loin'], 1, 'bientôt = قريباً (ظرف زمان).'),
          TP('[Je|s] [vais|v] [là-bas|c] [demain|c].', 'c')
        ]
      },
      {
        id: 'l11', ic: '🔄', ar: 'المبني للمعلوم والمجهول', fr: 'La voix active et la voix passive', col: '#7b4bd1',
        blocks: [
          ['h', 'المعلوم والمجهول'],
          ['t', 'في **المعلوم** الفاعل هو من يقوم بالفعل. في **المجهول** يصبح المفعول به فاعلاً ويتلقى الفعل، ونذكر الفاعل الحقيقي بعد **par**.'],
          ['tb', ['الصيغة', 'التركيب'], [['معلوم (active)', 'Sujet + verbe + COD'], ['مجهول (passive)', 'COD + être (بنفس الزمن) + participe passé + par + sujet']]],
          ['tip', 'اسم المفعول يتفق مع الفاعل الجديد: **La leçon est expliquée · Les livres sont lus**.'],
          ['tip', 'نحذف (par + الفاعل) إذا كان مجهولاً: La porte a été ouverte.'],
          ['w', 'chips', {
            title: '🔁 اختر زمناً وشاهد التحويل (لاحظ تبادل الألوان)', items: [
              { label: 'présent', note: 'être في المضارع + participe passé', sents: [{ tag: 'معلوم', m: '[Le professeur|s] [explique|v] [la leçon|o].', ar: 'المعلم يشرح الدرس.' }, { tag: 'مجهول', m: '[La leçon|o] [est expliquée|v] [par|p] [le professeur|s].', ar: 'الدرس يُشرح من قبل المعلم.' }] },
              { label: 'passé composé', note: 'avoir (مضارع) + été + participe passé', sents: [{ tag: 'معلوم', m: '[Marie|s] [a préparé|v] [le repas|o].', ar: 'ماري أعدّت الوجبة.' }, { tag: 'مجهول', m: '[Le repas|o] [a été préparé|v] [par|p] [Marie|s].', ar: 'الوجبة أُعدّت من قبل ماري.' }] },
              { label: 'futur simple', note: 'être في المستقبل البسيط + participe passé', sents: [{ tag: 'معلوم', m: '[Le directeur|s] [ouvrira|v] [la porte|o].', ar: 'المدير سيفتح الباب.' }, { tag: 'مجهول', m: '[La porte|o] [sera ouverte|v] [par|p] [le directeur|s].', ar: 'الباب سيُفتح من قبل المدير.' }] },
              { label: 'futur proche', note: 'va + être + participe passé', sents: [{ tag: 'معلوم', m: '[Paul|s] [va écrire|v] [une lettre|o].', ar: 'بول سيكتب رسالة.' }, { tag: 'مجهول', m: '[Une lettre|o] [va être écrite|v] [par|p] [Paul|s].', ar: 'الرسالة ستُكتب من قبل بول.' }] },
              { label: 'plus-que-parfait', note: 'avait + été + participe passé', sents: [{ tag: 'معلوم', m: '[Les élèves|s] [avaient lu|v] [les livres|o].', ar: 'التلاميذ كانوا قد قرؤوا الكتب.' }, { tag: 'مجهول', m: '[Les livres|o] [avaient été lus|v] [par|p] [les élèves|s].', ar: 'الكتب كانت قد قُرئت من قبل التلاميذ.' }] }
            ]
          }]
        ],
        quiz: [
          Q('La leçon ___ par le professeur. (expliquer, présent)', ['explique', 'est expliquée', 'a expliqué', 'sera expliqué'], 1, 'être (مضارع) + participe passé متفق مع leçon.'),
          Q('Les livres ___ lus par les élèves. (présent)', ['sont', 'ont', 'est', 'sera'], 0, 'les livres جمع ← sont lus.'),
          Q('Le repas a ___ préparé par Marie.', ['été', 'était', 'eu', 'est'], 0, 'passé composé المجهول: a été préparé.'),
          TP('[La porte|o] [est ouverte|v] [par|p] [le directeur|s].', 's'),
          OR('La leçon est expliquée par le professeur.', 'الدرس يُشرح من قبل المعلم'),
          Q('المعلوم: Marie ferme la fenêtre. المجهول:', ['La fenêtre est fermée par Marie.', 'La fenêtre ferme Marie.', 'Marie est fermée par la fenêtre.', 'La fenêtre fermait par Marie.'], 0, 'COD يصبح فاعلاً + être + participe passé + par.')
        ]
      },
      {
        id: 'l12', ic: '📝', ar: 'أنواع الجمل والنفي', fr: 'Les types de phrases et la négation', col: '#b5179e',
        blocks: [
          ['h', 'أنواع الجمل (Les types de phrases)'],
          ['tb', ['النوع', 'العلامة', 'مثال'], [['خبرية (déclarative)', 'نقطة .', 'Il mange une pomme.'], ['استفهامية (interrogative)', 'علامة ؟', 'Tu manges une pomme ?'], ['أمرية (impérative)', 'نقطة أو !', 'Mange une pomme !'], ['تعجبية (exclamative)', 'علامة !', 'Quelle belle pomme !']], [2]],
          ['h', 'الإثبات والنفي'],
          ['t', 'النفي يحيط بالفعل المصرَّف: **ne … pas**. وفي الزمن المركب يحيط بالمساعد: ne + avoir/être + pas + participe passé.'],
          ['tip', 'بعد النفي تتحول النكرة والتبعيض إلى **de**: J\'ai un livre ← Je n\'ai pas **de** livre. أما المعرفة فتبقى: Je n\'aime pas **le** café.'],
          ['tip', 'نفي الأمر: Ne mange pas ! · Ne parlez jamais !'],
          ['w', 'chips', {
            title: '🚫 اختر جملة وشاهد صور النفي', items: [
              { label: 'Elle parle français', note: 'ne + فعل + pas / jamais / plus', sents: [{ tag: 'إثبات', m: '[Elle|s] [parle|v] [français|o].' }, { tag: 'ne … pas', m: '[Elle|s] [ne|n] [parle|v] [pas|n] [français|o].' }, { tag: 'ne … jamais', m: '[Elle|s] [ne|n] [parle|v] [jamais|n] [français|o].' }, { tag: 'ne … plus', m: '[Elle|s] [ne|n] [parle|v] [plus|n] [français|o].' }] },
              { label: 'Nous avons mangé', note: 'في الزمن المركب: ne + المساعد + pas + اسم المفعول', sents: [{ tag: 'إثبات', m: '[Nous|s] [avons|a] [mangé|v].' }, { tag: 'ne … pas', m: "[Nous|s] [n'|n][avons|a] [pas|n] [mangé|v]." }, { tag: 'ne … jamais', m: "[Nous|s] [n'|n][avons|a] [jamais|n] [mangé|v]." }, { tag: 'ne … rien', m: "[Nous|s] [n'|n][avons|a] [rien|n] [mangé|v]." }] },
              { label: 'Il mange du pain', note: 'بعد النفي du / de la / des ← de', sents: [{ tag: 'إثبات', m: '[Il|s] [mange|v] [du pain|o].' }, { tag: 'ne … pas', m: '[Il|s] [ne|n] [mange|v] [pas|n] [de pain|o].' }, { tag: 'ne … plus', m: '[Il|s] [ne|n] [mange|v] [plus|n] [de pain|o].' }] },
              { label: "Je vois quelqu'un", note: 'ne … personne للنفي عن الأشخاص', sents: [{ tag: 'إثبات', m: "[Je|s] [vois|v] [quelqu'un|o]." }, { tag: 'ne … personne', m: '[Je|s] [ne|n] [vois|v] [personne|n].' }] }
            ]
          }]
        ],
        quiz: [
          Q('« Quelle belle journée ! » جملة...', TYP4, 3, 'تعبّر عن انفعال ← تعجبية.'),
          Q('« Ferme la porte ! » جملة...', TYP4, 2, 'فعل أمر ← أمرية.'),
          Q('Je mange du pain. ← Je ne mange pas ___ pain.', ['du', 'de', 'de la', 'des'], 1, 'بعد النفي نستعمل de.'),
          Q('Il a mangé. (نفي)', ["Il n'a pas mangé.", 'Il ne a pas mangé.', 'Il a pas mangé.', "Il n'a mangé pas."], 0, 'ne ← n\' قبل a، وpas بين المساعد واسم المفعول.'),
          Q('Elle ne parle ___ français. (لم تعد)', ['plus', 'jamais', 'rien', 'personne'], 0, 'ne ... plus = لم يعد.'),
          OR('Je ne mange pas de pomme.', 'لا آكل تفاحة')
        ]
      },
      {
        id: 'l13', ic: '❓', ar: 'أدوات الاستفهام', fr: 'Les mots interrogatifs', col: '#00897b',
        blocks: [
          ['h', 'ثلاث طرق للسؤال'],
          ['tb', ['الطريقة', 'مثال', 'المستوى'], [['النبرة (intonation)', 'Tu manges une pomme ?', 'شفهي'], ['est-ce que', 'Est-ce que tu manges une pomme ?', 'عادي'], ['القلب (inversion)', 'Manges-tu une pomme ?', 'رسمي / كتابي']], [1]],
          ['h', 'أدوات الاستفهام'],
          ['tb', ['الأداة', 'المعنى', 'مثال'], [['Qui', 'من', 'Qui parle ?'], ["Que / Qu'est-ce que", 'ماذا', "Qu'est-ce que tu manges ?"], ['Quoi', 'ماذا (بعد حرف جر / عامي)', 'Tu manges quoi ?'], ['Où', 'أين', 'Où habites-tu ?'], ['Quand', 'متى', 'Quand pars-tu ?'], ['Comment', 'كيف', 'Comment vas-tu ?'], ['Pourquoi', 'لماذا', 'Pourquoi pleures-tu ?'], ['Combien (de)', 'كم', 'Combien de livres ?'], ['Quel / Quelle / Quels / Quelles', 'أي / ما', 'Quelle heure est-il ?'], ['Lequel / Laquelle', 'أيّهما', 'Lequel préfères-tu ?']], [0, 2]],
          ['tip', 'الجواب يتبع السؤال: Pourquoi ← Parce que… · Combien ← عدد · Où ← مكان · Quand ← زمن.'],
          ['w', 'tap', {
            title: '🎤 اضغط على أي جزء من الجملة لتعرف السؤال الذي يسأل عنه', items: [
              { m: '[Marie|s|Qui|Qui mange une pomme ?] [mange|v] [une pomme|o|Qu\'est-ce que|Qu\'est-ce que Marie mange ?] [à la cantine|c|Où|Où est-ce que Marie mange une pomme ?].', ar: 'ماري تأكل تفاحة في المقصف.' },
              { m: '[Sara|s|Qui|Qui habite à Paris ?] [habite|v] [à Paris|c|Où|Où est-ce que Sara habite ?] [depuis deux ans|c|Depuis combien de temps|Depuis combien de temps est-ce que Sara habite à Paris ?].', ar: 'سارة تسكن في باريس منذ سنتين.' },
              { m: '[Les élèves|s|Qui|Qui étudie le français le soir ?] [étudient|v] [le français|o|Que|Qu\'est-ce que les élèves étudient le soir ?] [le soir|c|Quand|Quand est-ce que les élèves étudient le français ?].', ar: 'التلاميذ يدرسون الفرنسية في المساء.' },
              { m: '[Paul|s|Qui|Qui prend le train ?] [prend|v] [le train|o|Que|Qu\'est-ce que Paul prend ?] [pour aller à Lyon|c|Pourquoi|Pourquoi est-ce que Paul prend le train ?].', ar: 'بول يركب القطار ليذهب إلى ليون.' },
              { m: '[Nadia|s|Qui|Qui achète trois livres ?] [achète|v] [trois livres|o|Combien de livres|Combien de livres est-ce que Nadia achète ?] [en ville|c|Où|Où est-ce que Nadia achète trois livres ?].', ar: 'نادية تشتري ثلاثة كتب في المدينة.' },
              { m: '[Il|s|Qui|Qui parle lentement ?] [parle|v] [lentement|c|Comment|Comment est-ce qu\'il parle ?].', ar: 'هو يتكلم ببطء.' }
            ]
          }]
        ],
        quiz: [
          Q('___ habites-tu ? — À Paris.', ['Où', 'Quand', 'Comment', 'Qui'], 0, 'الجواب مكان ← Où.'),
          Q('___ pars-tu ? — Demain.', ['Où', 'Quand', 'Pourquoi', 'Comment'], 1, 'الجواب زمن ← Quand.'),
          Q('___ pleures-tu ? — Parce que je suis triste.', ['Pourquoi', 'Combien', 'Qui', 'Quand'], 0, 'الجواب بـ parce que ← Pourquoi.'),
          Q('___ heure est-il ?', ['Quel', 'Quelle', 'Quels', 'Quelles'], 1, 'heure مؤنث مفرد ← Quelle.'),
          Q('Tu aimes le café ? (بالقلب)', ['Aimes-tu le café ?', 'Est-ce tu aimes le café ?', 'Tu aimes-tu le café ?', 'Aimez tu le café ?'], 0, 'القلب: الفعل ثم الضمير بشرطة.'),
          OR('Où est-ce que tu habites ?', 'أين تسكن؟')
        ]
      },
      {
        id: 'l14', ic: '🔀', ar: 'قاعدة si الشرطية', fr: 'Le système « si »', col: '#c2185b',
        blocks: [
          ['h', 'قاعدة si الشرطية'],
          ['t', 'جملة الشرط تبدأ بـ **si** (إذا / لو). الزمن في جملة si يحدد الزمن في جملة النتيجة.'],
          ['tb', ['النوع', 'جملة si', 'جملة النتيجة', 'المعنى'], [['محتمل', 'présent', 'futur simple', 'شرط ممكن الحدوث'], ['غير محتمل (الحاضر)', 'imparfait', 'conditionnel présent', 'شرط خيالي في الحاضر'], ['مستحيل (الماضي)', 'plus-que-parfait', 'conditionnel passé', 'شرط لم يتحقق في الماضي']], [1, 2]],
          ['t', '**conditionnel présent** = جذر المستقبل + نهايات الـ imparfait (-ais · -ais · -ait · -ions · -iez · -aient). و**conditionnel passé** = avoir/être في conditionnel + اسم المفعول.'],
          ['tip', 'لا نضع المستقبل ولا الشرطي بعد **si** أبداً: ✗ Si tu étudieras ← ✓ Si tu étudies.'],
          ['tip', "si + il / ils ← **s'il / s'ils**. ولا يُختصر مع elle."],
          ['w', 'chips', {
            title: '🧩 اختر موقفاً وشاهد الأنواع الثلاثة', items: [
              { label: 'étudier / réussir', note: 'لاحظ تغيّر الأزمنة بين جملة si وجملة النتيجة', sents: [{ tag: '1: si + présent ← futur', m: '[Si tu étudies|k], [tu réussiras|r].' }, { tag: '2: si + imparfait ← conditionnel', m: '[Si tu étudiais|k], [tu réussirais|r].' }, { tag: '3: si + pqp ← conditionnel passé', m: '[Si tu avais étudié|k], [tu aurais réussi|r].' }] },
              { label: 'pleuvoir / rester', note: "si + il ← s'il", sents: [{ tag: '1: si + présent ← futur', m: "[S'il pleut|k], [nous resterons à la maison|r]." }, { tag: '2: si + imparfait ← conditionnel', m: "[S'il pleuvait|k], [nous resterions à la maison|r]." }, { tag: '3: si + pqp ← conditionnel passé', m: "[S'il avait plu|k], [nous serions restés à la maison|r]." }] },
              { label: 'avoir de l\'argent / voyager', note: 'avoir في الأزمنة الثلاثة', sents: [{ tag: '1: si + présent ← futur', m: "[Si j'ai de l'argent|k], [je voyagerai|r]." }, { tag: '2: si + imparfait ← conditionnel', m: "[Si j'avais de l'argent|k], [je voyagerais|r]." }, { tag: '3: si + pqp ← conditionnel passé', m: "[Si j'avais eu de l'argent|k], [j'aurais voyagé|r]." }] },
              { label: 'se lever tôt / arriver', note: 'فعل انعكاسي: s\'était levée / serait arrivée (اتفاق مع elle)', sents: [{ tag: '1: si + présent ← futur', m: "[Si elle se lève tôt|k], [elle arrivera à l'heure|r]." }, { tag: '2: si + imparfait ← conditionnel', m: "[Si elle se levait tôt|k], [elle arriverait à l'heure|r]." }, { tag: '3: si + pqp ← conditionnel passé', m: "[Si elle s'était levée tôt|k], [elle serait arrivée à l'heure|r]." }] }
            ]
          }]
        ],
        quiz: [
          Q('Si tu ___, tu réussiras. (étudier)', ['étudies', 'étudieras', 'étudiais', 'as étudié'], 0, 'si + présent ← futur simple.'),
          Q("Si j'avais de l'argent, j'___ une voiture. (acheter)", ['achète', 'achèterai', 'achèterais', 'aurais acheté'], 2, 'si + imparfait ← conditionnel présent.'),
          Q('Si elle avait étudié, elle ___ réussi.', ['réussira', 'réussirait', 'aurait', 'aura'], 2, 'si + plus-que-parfait ← conditionnel passé: aurait réussi.'),
          Q('Si nous ___ en retard, le professeur sera fâché. (arriver)', ['arrivons', 'arriverons', 'arrivions', 'arriverions'], 0, 'بعد si في المحتمل نستعمل المضارع.'),
          Q('أي جملة صحيحة؟', ['Si tu viendras, je serai content.', 'Si tu viens, je serai content.', 'Si tu viendrais, je serai content.', 'Si tu viens, je serais content.'], 1, 'si + présent ← futur، ولا مستقبل بعد si.'),
          OR('Si tu étudies, tu réussiras.', 'إن درست ستنجح')
        ]
      }
    ];

    /* ---------- الحالة والعرض ---------- */
    var W = {}, quiz = null, panel = null, view = '';
    function stars(id) { return Number(store('ph_s_' + id)) || 0; }
    function starsStr(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
    function totalStars() { var t = 0; LESSONS.forEach(function (L) { t += stars(L.id); }); return t; }

    function tableHTML(b) {
      var sp = b[3] || [];
      var h = '<div class="ph-tw"><table class="ph-tb"><thead><tr>' + b[1].map(function (x) { return '<th>' + rich(x) + '</th>'; }).join('') + '</tr></thead><tbody>';
      b[2].forEach(function (r) {
        h += '<tr>' + r.map(function (c, ci) { return '<td>' + rich(c) + (sp.indexOf(ci) !== -1 ? sayBtn(c) : '') + '</td>'; }).join('') + '</tr>';
      });
      return h + '</tbody></table></div>';
    }
    function chipsInner(w) {
      var x = w.items[w.sel];
      var h = '<div class="ph-wt">' + rich(w.cfg.title || '') + '</div><div class="ph-chips">' + w.items.map(function (it, i) {
        return '<button type="button" class="ph-chip' + (i === w.sel ? ' on' : '') + '" data-wc="' + i + '">' + esc(it.label) + '</button>';
      }).join('') + '</div><div class="ph-wb">';
      x.sents.forEach(function (se) {
        h += '<div class="ph-row">' + (se.tag ? '<span class="ph-tag">' + rich(se.tag) + '</span>' : '') +
          '<div class="ph-sent" dir="ltr">' + mkHTML(se.m) + sayBtn(plainOf(se.m)) + '</div>' + (se.ar ? '<div class="ph-ar">' + rich(se.ar) + '</div>' : '') + '</div>';
      });
      if (x.note) h += '<div class="ph-note">📌 ' + rich(x.note) + '</div>';
      return h + '</div>';
    }
    function tapInfo(w) {
      var s = parse(w.items[w.si].m)[w.seg];
      if (!s || !s.r) return '👆 اضغط على أي كلمة ملوّنة لتعرف دورها';
      var R = ROLES[s.r], h = '<b style="color:' + R[2] + '">' + esc(R[0]) + ' (' + esc(R[1]) + ')</b><br>' + rich(HINT[s.r] || '');
      if (s.q) h += '<br>❓ السؤال عن هذا الجزء: <b dir="ltr" style="color:#00897b">' + esc(s.q) + '</b>' + (s.qf ? '<div class="ph-qf" dir="ltr">' + esc(s.qf) + sayBtn(s.qf) + '</div>' : '');
      return h;
    }
    function tapInner(w) {
      var it = w.items[w.si];
      return '<div class="ph-wt">' + rich(w.cfg.title) + '</div><div class="ph-chips">' + w.items.map(function (x, i) {
        return '<button type="button" class="ph-chip' + (i === w.si ? ' on' : '') + '" data-ts="' + i + '">' + (i + 1) + '</button>';
      }).join('') + '</div><div class="ph-wb"><div class="ph-sent big" dir="ltr">' + mkHTML(it.m, 'tap') + sayBtn(plainOf(it.m)) + '</div>' +
        (it.ar ? '<div class="ph-ar">' + rich(it.ar) + '</div>' : '') + '<div class="ph-info">' + tapInfo(w) + '</div></div>';
    }
    function timelineHTML(T) {
      return '<div class="ph-tl" dir="ltr"><div class="ph-tlb"></div>' + TORDER.map(function (t) {
        return '<div class="ph-tld' + (t === T ? ' on' : '') + '"><i></i><span>' + TENSES[t].tl + '</span></div>';
      }).join('') + '</div><div class="ph-tlc" dir="ltr"><span>الماضي</span><span>الحاضر</span><span>المستقبل</span></div>';
    }
    function labInner(w) {
      var V = VERBS[w.v], S = SUBJ[w.s], T = w.t, m = compose(V, T, S);
      var h = '<div class="ph-wt">🧪 مختبر الأزمنة: اختر الفعل والفاعل والزمن</div>';
      h += '<div class="ph-lbl">الفعل</div><div class="ph-chips">' + VERBS.map(function (v, i) { return '<button type="button" class="ph-chip' + (i === w.v ? ' on' : '') + '" data-lv="' + i + '">' + esc(v.inf) + '</button>'; }).join('') + '</div>';
      h += '<div class="ph-lbl">الفاعل</div><div class="ph-chips">' + SUBJ.map(function (s, i) { return '<button type="button" class="ph-chip' + (i === w.s ? ' on' : '') + '" data-ls="' + i + '">' + s.k + '</button>'; }).join('') + '</div>';
      h += '<div class="ph-lbl">الزمن</div><div class="ph-chips">' + w.tenses.map(function (t) { return '<button type="button" class="ph-chip' + (t === T ? ' on' : '') + '" data-lt="' + t + '">' + esc(TENSES[t].fr) + '</button>'; }).join('') + '</div>';
      h += '<div class="ph-out"><div class="ph-tname">' + esc(TENSES[T].ar) + ' — <span dir="ltr">' + esc(TENSES[T].fr) + '</span></div>' +
        '<div class="ph-sent big" dir="ltr">' + mkHTML(m) + sayBtn(plainOf(m)) + '</div>' +
        '<div class="ph-ar">' + esc(V.inf) + ' = ' + esc(V.ar) + ' · ' + (V.g === 1 ? 'المجموعة الأولى' : V.g === 2 ? 'المجموعة الثانية' : 'المجموعة الثالثة') + '</div>' +
        '<div class="ph-formula">🧩 الصيغة: ' + rich(TENSES[T].f) + '</div>' + legendHTML(['s', 'a', 'v', 'o', 'c']) + timelineHTML(T);
      h += '<div class="ph-tw"><table class="ph-tb"><tbody>';
      [0, 1, 2, 4, 5, 6].forEach(function (si) {
        var s = SUBJ[si];
        h += '<tr class="' + (s.i === S.i ? 'hl' : '') + '"><td dir="ltr">' + esc(compose(V, T, s, true)) + '</td></tr>';
      });
      h += '</tbody></table></div>';
      if (V.aux === 'être' && /pc|pqp|pa/.test(T)) h += '<div class="ph-note">📌 مع أفعال être يتفق اسم المفعول مع الفاعل: elle est allée · elles sont allées · nous sommes allés.</div>';
      return h + '</div>';
    }
    function widgetInner(w) {
      if (w.type === 'chips') return chipsInner(w);
      if (w.type === 'tap') return tapInner(w);
      return labInner(w);
    }
    function widgetHTML(type, cfg, wid) {
      var w = { type: type, cfg: cfg || {}, sel: 0, si: 0, seg: -1, v: 0, s: 3, t: 'pres', tenses: (cfg && cfg.tenses) || ['pres'] };
      if (type === 'chips') {
        var mk = cfg.make;
        w.items = mk === 'art' ? artItems() : mk === 'det' ? detItems() : mk === 'prep' ? prepItems() : mk === 'part' ? partItems() : cfg.items;
      } else if (type === 'tap') w.items = cfg.items;
      else { w.t = w.tenses[0]; }
      W[wid] = w;
      return '<div class="ph-w" data-wid="' + wid + '">' + widgetInner(w) + '</div>';
    }
    function blockHTML(b, lid, bi) {
      var k = b[0];
      if (k === 'h') return '<h4 class="ph-h">' + rich(b[1]) + '</h4>';
      if (k === 't') return '<p class="ph-p">' + rich(b[1]) + '</p>';
      if (k === 'tip') return '<div class="ph-tip">💡 ' + rich(b[1]) + '</div>';
      if (k === 'x') return '<div class="ph-ex"><div class="ph-sent" dir="ltr">' + mkHTML(b[1]) + sayBtn(plainOf(b[1])) + '</div>' + (b[2] ? '<div class="ph-ar">' + rich(b[2]) + '</div>' : '') + '<div class="ph-cap" hidden></div></div>';
      if (k === 'tb') return tableHTML(b);
      if (k === 'w') return widgetHTML(b[1], b[2], lid + '-' + bi);
      return '';
    }
    function lessonHTML(i) {
      var L = LESSONS[i];
      var h = '<div class="ph-top"><button type="button" class="ph-back" data-home="1">← كل الدروس</button><span class="ph-lnum">' + (i + 1) + ' / ' + LESSONS.length + '</span></div>';
      h += '<div class="ph-lhead" style="--c:' + L.col + '"><div class="ph-ci">' + L.ic + '</div><div><div class="ph-lt">' + esc(L.ar) + '</div><div class="ph-lf" dir="ltr">' + esc(L.fr) + '</div></div></div>';
      h += legendHTML(['s', 'v', 'o', 'i', 'c', 'd']);
      L.blocks.forEach(function (b, bi) { h += blockHTML(b, L.id, bi); });
      h += '<button type="button" class="ph-btn big" data-quiz="' + i + '" style="--c:' + L.col + '">🎯 ابدأ التدريب (' + L.quiz.length + ' أسئلة)</button>';
      return h;
    }
    function homeHTML() {
      var ts = totalStars(), max = LESSONS.length * 3, pct = Math.round(ts * 100 / max);
      var h = '<div class="ph-hero"><h3 dir="ltr">La phrase en français</h3><p>رحلة تفاعلية لبناء الجملة الفرنسية خطوة بخطوة: الفاعل والفعل والمفعول والأزمنة وأكثر. تعلّم، جرّب، ثم اختبر نفسك واجمع النجوم ⭐</p>' +
        '<div class="ph-pb"><i style="width:' + pct + '%"></i></div><div class="ph-hs"><span>⭐ ' + ts + ' / ' + max + '</span><span>' + pct + '%</span><button type="button" class="ph-snd" data-snd="1">' + (sndOn ? '🔊 الأصوات' : '🔇 الأصوات') + '</button></div></div>';
      h += '<div class="ph-hd">🎨 ألوان أجزاء الجملة</div>' + legendHTML(['s', 'v', 'a', 'o', 'i', 'c', 'd', 'p', 'n', 'q']);
      h += '<div class="ph-hd">📚 اختر درساً</div><div class="ph-grid">' + LESSONS.map(function (L, i) {
        return '<button type="button" class="ph-card" data-open="' + i + '" style="--c:' + L.col + '"><span class="ph-ci">' + L.ic + '</span><span class="ph-cn">الدرس ' + (i + 1) + '</span>' +
          '<span class="ph-ct">' + esc(L.ar) + '</span><span class="ph-cf">' + esc(L.fr) + '</span><span class="ph-st">' + starsStr(stars(L.id)) + '</span></button>';
      }).join('') + '</div>';
      return h;
    }
    function scrollTop() {
      try { var y = panel.getBoundingClientRect().top + window.pageYOffset - 130; window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (e) {}
    }
    function showHome() { view = 'home'; W = {}; panel.innerHTML = homeHTML(); scrollTop(); }
    function showLesson(i) { view = 'lesson'; W = {}; quiz = null; panel.innerHTML = lessonHTML(i); panel.setAttribute('data-li', i); scrollTop(); }

    /* ---------- الاختبار ---------- */
    function prep(q) {
      var c = {}, k;
      for (k in q) c[k] = q[k];
      c.done = false;
      if (q.k === 'q') {
        var idx = shuffle(q.o.map(function (_, i) { return i; }));
        c.o = idx.map(function (i) { return q.o[i]; });
        c.a = idx.indexOf(q.a);
      } else if (q.k === 'o') {
        var words = q.s.split(' '), sh = shuffle(words), tries = 0;
        while (sh.join(' ') === words.join(' ') && tries++ < 5) sh = shuffle(words);
        c.words = words;
        c.pool = sh.map(function (w, i) { return { w: w, i: i, used: false }; });
        c.ans = [];
      }
      return c;
    }
    function startQuiz(li) {
      quiz = { li: li, qs: LESSONS[li].quiz.map(prep), i: 0, score: 0 };
      view = 'quiz';
      renderQuiz();
      scrollTop();
    }
    function orderHTML(q) {
      return '<div class="ph-oa" dir="ltr">' + (q.ans.length ? q.ans.map(function (p, ai) { return '<button type="button" class="ph-ow" data-oa="' + ai + '">' + esc(p.w) + '</button>'; }).join('') : '<span class="ph-ph">اضغط الكلمات بالترتيب الصحيح</span>') + '</div>' +
        '<div class="ph-op" dir="ltr">' + q.pool.map(function (p, pi) { return '<button type="button" class="ph-ow' + (p.used ? ' used' : '') + '" data-ow="' + pi + '"' + (p.used ? ' disabled' : '') + '>' + esc(p.w) + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="ph-btn" data-ocheck="1"' + (q.ans.length === q.words.length ? '' : ' disabled') + '>تحقق ✔</button>';
    }
    function renderQuiz() {
      var Z = quiz, q = Z.qs[Z.i], L = LESSONS[Z.li];
      var h = '<div class="ph-top"><button type="button" class="ph-back" data-lesson="' + Z.li + '">← الدرس</button><span>سؤال ' + (Z.i + 1) + ' / ' + Z.qs.length + '</span><span>⭐ ' + Z.score + '</span></div>' +
        '<div class="ph-pb2"><i style="width:' + Math.round(Z.i * 100 / Z.qs.length) + '%;background:' + L.col + '"></i></div><div class="ph-qc" style="--c:' + L.col + '">';
      if (q.k === 'q') {
        h += '<div class="ph-qp" dir="auto">' + rich(q.p) + sayBtn(q.p) + '</div><div class="ph-opts">' + q.o.map(function (o, i) {
          return '<button type="button" class="ph-opt" data-opt="' + i + '"><i>' + 'ABCD'.charAt(i) + '</i><span dir="auto">' + esc(o) + '</span></button>';
        }).join('') + '</div>';
      } else if (q.k === 't') {
        h += '<div class="ph-qp">👆 اضغط على: <b style="color:' + ROLES[q.r][2] + '">' + esc(ROLES[q.r][0]) + ' (' + esc(ROLES[q.r][1]) + ')</b></div><div class="ph-sent big" dir="ltr">' + mkHTML(q.m, 'quiz') + '</div>';
      } else {
        h += '<div class="ph-qp">🧩 رتّب الكلمات لتكوين جملة صحيحة' + (q.ar ? ': <span class="ph-ar-i">' + rich(q.ar) + '</span>' : '') + '</div><div class="ph-ob">' + orderHTML(q) + '</div>';
      }
      h += '<div class="ph-fb" hidden></div><button type="button" class="ph-btn ph-next" data-next="1" hidden>' + (Z.i === Z.qs.length - 1 ? 'عرض النتيجة 🏁' : 'التالي ➜') + '</button></div>';
      panel.innerHTML = h;
    }
    function feedback(ok, html) {
      var f = $('.ph-fb', panel);
      f.className = 'ph-fb ' + (ok ? 'good' : 'bad');
      f.innerHTML = (ok ? '✅ ' : '❌ ') + html;
      f.hidden = false;
      $('.ph-next', panel).hidden = false;
      if (ok) quiz.score++;
      sfx(ok ? 'ok' : 'bad');
    }
    function answerOpt(btn) {
      var q = quiz.qs[quiz.i];
      if (q.done) return;
      q.done = true;
      var oi = +btn.getAttribute('data-opt'), ok = oi === q.a;
      $$('.ph-opt', panel).forEach(function (b, i) { b.disabled = true; if (i === q.a) b.classList.add('ok'); else if (i === oi) b.classList.add('bad'); });
      feedback(ok, ok ? 'إجابة صحيحة! ' + rich(q.x) : 'الإجابة الصحيحة: <b dir="auto">' + esc(q.o[q.a]) + '</b><br>' + rich(q.x));
    }
    function answerSeg(btn) {
      var q = quiz.qs[quiz.i];
      if (q.done) return;
      q.done = true;
      var segs = parse(q.m), gi = +btn.getAttribute('data-qg'), ok = segs[gi].r === q.r;
      $$('.ph-seg', panel).forEach(function (b) {
        var s = segs[+b.getAttribute('data-qg')];
        b.classList.remove('neutral');
        b.setAttribute('style', segStyle(s.r));
        b.disabled = true;
        if (s.r === q.r) b.classList.add('ok');
      });
      if (!ok) btn.classList.add('bad');
      feedback(ok, ok ? 'صحيح! هذا هو ' + esc(ROLES[q.r][0]) + '.' : 'الصحيح هو المميَّز بالأخضر: ' + esc(ROLES[q.r][0]) + '.<br>' + rich(HINT[q.r]));
    }
    function pickWord(pi) {
      var q = quiz.qs[quiz.i];
      if (q.done || q.pool[pi].used) return;
      q.pool[pi].used = true;
      q.ans.push(q.pool[pi]);
      $('.ph-ob', panel).innerHTML = orderHTML(q);
    }
    function dropWord(ai) {
      var q = quiz.qs[quiz.i];
      if (q.done) return;
      var p = q.ans.splice(ai, 1)[0];
      p.used = false;
      $('.ph-ob', panel).innerHTML = orderHTML(q);
    }
    function checkOrder() {
      var q = quiz.qs[quiz.i];
      if (q.done || q.ans.length !== q.words.length) return;
      q.done = true;
      var ok = q.ans.map(function (p) { return p.w; }).join(' ') === q.words.join(' ');
      $$('.ph-ob button', panel).forEach(function (b) { b.disabled = true; });
      $$('.ph-oa .ph-ow', panel).forEach(function (b) { b.classList.add(ok ? 'ok' : 'bad'); });
      feedback(ok, ok ? 'جملة صحيحة! ' + sayBtn(q.s) : 'الجملة الصحيحة: <b dir="ltr">' + esc(q.s) + '</b> ' + sayBtn(q.s));
    }
    function finishQuiz() {
      var Z = quiz, L = LESSONS[Z.li], n = Z.qs.length, pct = Z.score / n;
      var st = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0.2 ? 1 : 0;
      if (st > stars(L.id)) store('ph_s_' + L.id, String(st));
      sfx(st >= 2 ? 'win' : 'bad');
      var msg = st === 3 ? 'ممتاز! أتقنت الدرس 🌟' : st === 2 ? 'جيد جداً، قريب من الإتقان 👏' : st === 1 ? 'بداية جيدة، راجع الدرس وأعد المحاولة 📚' : 'راجع الدرس بهدوء ثم حاول مجدداً 💪';
      view = 'result';
      panel.innerHTML = '<div class="ph-res" style="--c:' + L.col + '"><div class="ph-big">' + L.ic + '</div><h3>' + esc(L.ar) + '</h3>' +
        '<div class="ph-rst">' + starsStr(st) + '</div><div class="ph-rsc">' + Z.score + ' / ' + n + '</div><p>' + msg + '</p>' +
        '<div class="ph-acts"><button type="button" class="ph-btn" data-quiz="' + Z.li + '">🔁 أعد الاختبار</button>' +
        '<button type="button" class="ph-btn alt" data-lesson="' + Z.li + '">📖 راجع الدرس</button>' +
        (Z.li < LESSONS.length - 1 ? '<button type="button" class="ph-btn alt" data-open="' + (Z.li + 1) + '">➜ الدرس التالي</button>' : '') +
        '<button type="button" class="ph-btn alt" data-home="1">🏠 كل الدروس</button></div></div>';
      scrollTop();
    }

    /* ---------- الأحداث ---------- */
    function rerender(wid) {
      var w = W[wid], el = $('[data-wid="' + wid + '"]', panel);
      if (w && el) el.innerHTML = widgetInner(w);
    }
    function onClick(e) {
      var t = e.target, b, wrap;
      if ((b = t.closest('.ph-say'))) { speakFr(decodeURIComponent(b.getAttribute('data-say') || '')); return; }
      if ((b = t.closest('[data-snd]'))) { sndOn = !sndOn; store('ph_snd', sndOn ? 'on' : 'off'); b.textContent = sndOn ? '🔊 الأصوات' : '🔇 الأصوات'; ac(); return; }
      if ((b = t.closest('[data-open]'))) { showLesson(+b.getAttribute('data-open')); return; }
      if ((b = t.closest('[data-lesson]'))) { showLesson(+b.getAttribute('data-lesson')); return; }
      if ((b = t.closest('[data-home]'))) { showHome(); return; }
      if ((b = t.closest('[data-quiz]'))) { ac(); startQuiz(+b.getAttribute('data-quiz')); return; }
      if ((b = t.closest('[data-opt]'))) { answerOpt(b); return; }
      if ((b = t.closest('[data-qg]'))) { answerSeg(b); return; }
      if ((b = t.closest('[data-ow]'))) { pickWord(+b.getAttribute('data-ow')); return; }
      if ((b = t.closest('[data-oa]'))) { dropWord(+b.getAttribute('data-oa')); return; }
      if ((b = t.closest('[data-ocheck]'))) { checkOrder(); return; }
      if ((b = t.closest('[data-next]'))) {
        if (quiz.i < quiz.qs.length - 1) { quiz.i++; renderQuiz(); scrollTop(); } else finishQuiz();
        return;
      }
      wrap = t.closest('[data-wid]');
      if (wrap) {
        var wid = wrap.getAttribute('data-wid'), w = W[wid];
        if (!w) return;
        if ((b = t.closest('[data-wc]'))) { w.sel = +b.getAttribute('data-wc'); rerender(wid); return; }
        if ((b = t.closest('[data-ts]'))) { w.si = +b.getAttribute('data-ts'); w.seg = -1; rerender(wid); return; }
        if ((b = t.closest('[data-tg]'))) { w.seg = +b.getAttribute('data-tg'); rerender(wid); return; }
        if ((b = t.closest('[data-lv]'))) { w.v = +b.getAttribute('data-lv'); rerender(wid); return; }
        if ((b = t.closest('[data-ls]'))) { w.s = +b.getAttribute('data-ls'); rerender(wid); return; }
        if ((b = t.closest('[data-lt]'))) { w.t = b.getAttribute('data-lt'); rerender(wid); return; }
      }
      if ((b = t.closest('.ph-ex .ph-seg'))) {
        var ex = b.closest('.ph-ex'), cap = $('.ph-cap', ex), R = ROLES[b.getAttribute('data-r')];
        if (R && cap) { cap.innerHTML = '<b style="color:' + R[2] + '">' + esc(R[0]) + ' (' + esc(R[1]) + ')</b> — ' + rich(HINT[b.getAttribute('data-r')] || ''); cap.hidden = false; }
      }
    }

    /* ---------- الحقن داخل قسم Grammaire ---------- */
    var CSS = '' +
      '.ph-tab{background:linear-gradient(135deg,#7b4bd1,#0a7ad6)!important;color:#fff!important;border-color:transparent!important;font-weight:800}' +
      '.ph{display:flex;flex-direction:column;gap:12px;font-family:inherit}.ph [hidden]{display:none!important}' +
      '.ph-hero{background:linear-gradient(135deg,#0055A5 0%,#0a7ad6 55%,#7b4bd1 100%);color:#fff;border-radius:20px;padding:18px}' +
      '.ph-hero h3{margin:0 0 6px;font-size:1.4rem;text-align:left}.ph-hero p{margin:0;opacity:.95;line-height:1.9;font-size:.92rem}' +
      '.ph-pb{height:10px;background:rgba(255,255,255,.25);border-radius:999px;overflow:hidden;margin-top:12px}.ph-pb i{display:block;height:100%;background:linear-gradient(90deg,#ffd54a,#ffb300);border-radius:999px;transition:width .4s}' +
      '.ph-hs{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:.85rem;gap:8px}' +
      '.ph-snd{border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.15);color:#fff;border-radius:999px;padding:3px 10px;font-family:inherit;cursor:pointer}' +
      '.ph-hd{font-weight:800;color:#0055A5;margin-top:4px}' +
      '.ph-leg{display:flex;flex-wrap:wrap;gap:6px}.ph-lg{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid #d5deea;border-radius:999px;padding:3px 10px;font-size:.78rem}.ph-lg i{width:10px;height:10px;border-radius:50%;display:inline-block}' +
      '.ph-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(min-width:700px){.ph-grid{grid-template-columns:repeat(3,1fr)}}' +
      '.ph-card{background:#fff;border:1px solid #d5deea;border-top:5px solid var(--c,#0a7ad6);border-radius:16px;padding:12px;text-align:start;cursor:pointer;display:flex;flex-direction:column;gap:3px;font-family:inherit;transition:transform .15s;box-shadow:0 2px 8px rgba(0,40,100,.06);color:inherit}' +
      '.ph-card:active{transform:scale(.97)}.ph-ci{font-size:1.9rem;line-height:1.2}.ph-cn{font-size:.72rem;color:#778}.ph-ct{font-weight:800;color:#223;line-height:1.5;font-size:.93rem}.ph-cf{font-size:.75rem;color:#667;direction:ltr;text-align:left}.ph-st{color:#f5a623;letter-spacing:2px;font-size:1.05rem}' +
      '.ph-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.88rem;color:#556}' +
      '.ph-back{border:1px solid #d5deea;background:#fff;border-radius:999px;padding:6px 14px;font-family:inherit;cursor:pointer;color:#0055A5;font-weight:700}' +
      '.ph-lhead{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #d5deea;border-inline-start:6px solid var(--c);border-radius:16px;padding:12px}' +
      '.ph-lt{font-weight:800;color:#223;font-size:1.05rem;line-height:1.5}.ph-lf{font-size:.82rem;color:#667;text-align:left}' +
      '.ph-h{margin:8px 0 0;color:#0055A5;font-size:1.05rem;border-bottom:2px solid #e3eaf4;padding-bottom:4px}' +
      '.ph-p{margin:0;line-height:2;font-size:.97rem}' +
      '.ph-tip{background:#fff8e1;border-radius:12px;padding:10px 12px;line-height:1.9;font-size:.92rem}' +
      '.ph-ex,.ph-row{background:#fff;border:1px solid #e3eaf4;border-radius:14px;padding:10px 12px}' +
      '.ph-sent{font-size:1.08rem;line-height:2.2;text-align:left}.ph-sent.big{font-size:1.2rem;padding:6px 0}' +
      '.ph-seg{display:inline-block;border:0;border-bottom:3px solid;border-radius:8px;padding:0 6px;margin:0 1px;font-family:inherit;font-size:inherit;line-height:1.7;font-weight:700}' +
      'button.ph-seg{cursor:pointer;transition:transform .12s}button.ph-seg:active{transform:scale(.94)}' +
      '.ph-seg.neutral{background:#eef2f8;color:#223;border-color:#b9c6da}.ph-seg.ok{box-shadow:0 0 0 3px #1b9e5b;animation:phpop .35s}.ph-seg.bad{box-shadow:0 0 0 3px #d63a3a;animation:phsk .4s}' +
      '.ph-ar{color:#556;font-size:.88rem;line-height:1.8}.ph-ar-i{font-weight:700;color:#0055A5}' +
      '.ph-cap{margin-top:6px;background:#f4f9ff;border-radius:10px;padding:6px 10px;font-size:.88rem;line-height:1.8}' +
      '.ph-say{background:#eef5ff;border:1px solid #b8d5ff;border-radius:50%;width:28px;height:28px;font-size:14px;margin-inline:8px;cursor:pointer;padding:0;vertical-align:middle}' +
      '.ph-tw{overflow-x:auto;border:1px solid #e3eaf4;border-radius:12px;background:#fff}' +
      '.ph-tb{border-collapse:collapse;width:100%;font-size:.9rem}.ph-tb th{background:#eef5ff;color:#0055A5;padding:7px 8px;white-space:nowrap}.ph-tb td{padding:7px 8px;border-top:1px solid #edf1f7;line-height:1.7}' +
      '.ph-tb tr.hl td{background:#fff3cd;font-weight:700}' +
      '.ph-w{background:linear-gradient(180deg,#f4f9ff,#fff);border:2px dashed #b8d5ff;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}' +
      '.ph-wt{font-weight:800;color:#0055A5}.ph-lbl{font-size:.8rem;color:#778;margin-top:2px}' +
      '.ph-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}' +
      '.ph-chip{flex:0 0 auto;border:1px solid #d5deea;background:#fff;border-radius:999px;padding:6px 14px;font-family:inherit;cursor:pointer;white-space:nowrap;color:inherit;direction:ltr}' +
      '.ph-chip.on{background:#0055A5;color:#fff;border-color:#0055A5}' +
      '.ph-wb{display:flex;flex-direction:column;gap:8px}.ph-tag{display:inline-block;background:#eef5ff;color:#0055A5;border-radius:999px;padding:2px 10px;font-size:.76rem;font-weight:700;margin-bottom:2px}' +
      '.ph-note,.ph-info,.ph-formula{background:#fff;border:1px solid #e3eaf4;border-radius:12px;padding:8px 12px;line-height:1.9;font-size:.9rem}.ph-qf{margin-top:4px;font-weight:700;color:#00695c;text-align:left}' +
      '.ph-out{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #e3eaf4;border-radius:14px;padding:10px 12px}.ph-tname{font-weight:800;color:#7b4bd1}' +
      '.ph-tl{display:flex;justify-content:space-between;position:relative;padding-top:6px}.ph-tlb{position:absolute;top:13px;left:2%;right:2%;height:3px;background:linear-gradient(90deg,#b9c6da,#0a7ad6,#1b9e5b)}' +
      '.ph-tld{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:.58rem;text-align:center;color:#778}.ph-tld i{width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #b9c6da;z-index:1}' +
      '.ph-tld.on{color:#d63a3a;font-weight:800}.ph-tld.on i{background:#d63a3a;border-color:#d63a3a;transform:scale(1.5);box-shadow:0 0 0 4px rgba(214,58,58,.2)}' +
      '.ph-tlc{display:flex;justify-content:space-between;font-size:.72rem;color:#556;font-weight:700}' +
      '.ph-btn{border:0;background:var(--c,#0055A5);color:#fff;border-radius:14px;padding:12px 18px;font-weight:800;font-family:inherit;cursor:pointer;font-size:1rem}.ph-btn.big{padding:14px 18px;font-size:1.05rem}' +
      '.ph-btn.alt{background:#fff;color:var(--c,#0055A5);border:2px solid var(--c,#0055A5)}.ph-btn:disabled{opacity:.45;cursor:default}' +
      '.ph-pb2{height:8px;background:#e6ecf5;border-radius:999px;overflow:hidden}.ph-pb2 i{display:block;height:100%;transition:width .3s}' +
      '.ph-qc{background:#fff;border:2px solid #e3eaf4;border-top:6px solid var(--c);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:12px}' +
      '.ph-qp{font-weight:800;line-height:1.9;font-size:1.02rem}' +
      '.ph-opts{display:flex;flex-direction:column;gap:8px}' +
      '.ph-opt{display:flex;align-items:center;gap:10px;text-align:start;width:100%;border:2px solid #d5deea;background:#fff;border-radius:12px;padding:11px 12px;font-family:inherit;font-size:1rem;cursor:pointer;color:inherit;transition:.15s}' +
      '.ph-opt:active{transform:scale(.98)}.ph-opt i{font-style:normal;flex:0 0 26px;height:26px;border-radius:50%;background:#eef5ff;color:#0055A5;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem}' +
      '.ph-opt.ok{background:#dff5e8;border-color:#1b9e5b;color:#0d6b3b;animation:phpop .35s}.ph-opt.bad{background:#fde3e3;border-color:#d63a3a;color:#a11d1d;animation:phsk .4s}' +
      '.ph-opt.ok i{background:#1b9e5b;color:#fff}.ph-opt.bad i{background:#d63a3a;color:#fff}.ph-opt:disabled{cursor:default}' +
      '.ph-oa{min-height:56px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#f4f9ff;border:2px dashed #b8d5ff;border-radius:12px;padding:8px}.ph-ph{color:#889;font-size:.85rem}' +
      '.ph-op{display:flex;flex-wrap:wrap;gap:6px}.ph-ow{border:2px solid #0055A5;background:#fff;color:#0055A5;border-radius:10px;padding:7px 12px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer}.ph-ow.used{opacity:.25}' +
      '.ph-ow.ok{background:#dff5e8;border-color:#1b9e5b;color:#0d6b3b}.ph-ow.bad{background:#fde3e3;border-color:#d63a3a;color:#a11d1d}' +
      '.ph-fb{border-radius:12px;padding:10px 12px;line-height:1.9}.ph-fb.good{background:#dff5e8;color:#0d6b3b}.ph-fb.bad{background:#fde3e3;color:#a11d1d}' +
      '.ph-res{background:#fff;border:2px solid var(--c);border-radius:20px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}.ph-big{font-size:3rem}' +
      '.ph-rst{font-size:2.4rem;color:#f5a623;letter-spacing:6px;animation:phpop .6s}.ph-rsc{font-size:1.5rem;font-weight:800;color:var(--c)}.ph-acts{display:flex;flex-direction:column;gap:8px;width:100%}' +
      '@keyframes phpop{0%{transform:scale(.9)}50%{transform:scale(1.08)}100%{transform:scale(1)}}@keyframes phsk{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}';

    function bodyEl() { return $('.body', SEC) || SEC; }
    function tabsEl() { return $('.g-tabs', SEC); }
    function setLegacyHidden(h) {
      var el = bodyEl();
      ['.tools', '.count', '.g-area'].forEach(function (s) { var x = $(s, el); if (x) x.style.display = h ? 'none' : ''; });
    }
    function activate(btn) {
      $$('.tab', tabsEl()).forEach(function (x) { x.classList.remove('on'); });
      btn.classList.add('on');
      setLegacyHidden(true);
      panel.hidden = false;
      if (!view) showHome();
    }
    function deactivate() {
      if (!panel) return;
      panel.hidden = true;
      setLegacyHidden(false);
    }
    function inject() {
      var tabs = tabsEl();
      if (!tabs || $('.ph-tab', tabs)) return;
      if (!document.getElementById('ph-css')) {
        var st = document.createElement('style');
        st.id = 'ph-css';
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab ph-tab';
      btn.setAttribute('dir', 'ltr');
      btn.textContent = '✨ la phrase en français';
      btn.addEventListener('click', function (e) { e.stopPropagation(); activate(btn); });
      tabs.insertBefore(btn, tabs.firstChild);
      // أي تبويب آخر يُعيد عرض القواعد العادية
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.tab');
        if (b && !b.classList.contains('ph-tab')) deactivate();
      });
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'ph';
        panel.id = 'ph-panel';
        panel.hidden = true;
        panel.addEventListener('click', onClick);
      }
      bodyEl().appendChild(panel);
    }

    if (window.__PH_TEST) window.__PH_TEST = { compose: compose, VERBS: VERBS, SUBJ: SUBJ, LESSONS: LESSONS, lessonHTML: lessonHTML, prep: prep, parse: parse, rich: rich, TENSES: TENSES };

    function start() {
      inject();
      var body = $('.body', SEC);
      if (body && window.MutationObserver) new MutationObserver(function () { inject(); }).observe(body, { childList: true });
    }
    start();
    var tries = 0, iv = setInterval(function () { inject(); if (++tries > 40 || $('.ph-tab', SEC)) clearInterval(iv); }, 500);
  }
})();
