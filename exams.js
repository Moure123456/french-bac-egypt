/* ===== exams.js — امتحانات تفاعلية لـ Le Français Au Bac =====
   مؤقت + تصحيح فوري (أخضر/أحمر) + صوت انتهاء الوقت + 5 نماذج للصف الأول الثانوي
   يعمل مع data/exams.json الحالي (passage_fr / rule_ar) ولا يغيّر أي ملف آخر. */
(function () {
  'use strict';
  try { init(); } catch (e) { try { console.error('[exams]', e); } catch (_) {} }

  function init() {
    var SEC = document.getElementById('exams');
    if (!SEC) return;

    var LV = { '1sec': 'الصف الأول الثانوي', '2sec': 'الصف الثاني الثانوي', '3sec': 'الصف الثالث الثانوي' };
    var AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    var IPA = /[\u0250-\u02AF\u0303\u02C8\u02CC\u00F8\u014B]/;
    var LAT = /[A-Za-z\u00C0-\u00FF\u0152\u0153]/;

    var root = null, EX = [], filter = 'all', run = null, started = false;
    var soundOn = store('ex_sound') !== 'off';

    /* ---------- أدوات ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function store(k, v) {
      try {
        if (v === undefined) return localStorage.getItem(k) || '';
        localStorage.setItem(k, v);
      } catch (e) {}
      return '';
    }
    function nrm(s) {
      return String(s == null ? '' : s).toLowerCase().replace(/[\u2019\u2018`\u00B4]/g, "'")
        .replace(/\s+/g, ' ').replace(/\s*([?!.:,;])/g, '$1').replace(/[?!.,;:]+$/, '').trim();
    }
    function plain(s) { return nrm(s).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function fmt(sec) {
      sec = Math.max(0, Math.ceil(sec));
      var m = Math.floor(sec / 60), s = sec % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function strOf(o, keys) {
      for (var i = 0; i < keys.length; i++) {
        var v = o[keys[i]];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    }

    /* ---------- الأصوات (بدون ملفات: WebAudio) ---------- */
    var AC = null;
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
        g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g);
        g.connect(c.destination);
        o.start(t);
        o.stop(t + d + 0.05);
      } catch (e) {}
    }
    function sfx(name) {
      if (!soundOn) return;
      var i, r;
      if (name === 'ok') { tone(660, 0, 0.12); tone(880, 0.12, 0.2); }
      else if (name === 'bad') { tone(220, 0, 0.3, 'sawtooth', 0.14); }
      else if (name === 'warn') { tone(988, 0, 0.15, 'square', 0.15); tone(988, 0.25, 0.15, 'square', 0.15); }
      else if (name === 'win') { [523, 659, 784, 1046].forEach(function (f, k) { tone(f, k * 0.14, 0.22); }); }
      else if (name === 'lose') { [392, 330, 262].forEach(function (f, k) { tone(f, k * 0.18, 0.25, 'triangle'); }); }
      else if (name === 'alarm') {
        for (r = 0; r < 3; r++) for (i = 0; i < 4; i++) tone(i % 2 ? 988 : 1319, r * 1.1 + i * 0.22, 0.18, 'square', 0.22);
        try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) {}
        setTimeout(function () {
          try {
            if (window.speechSynthesis && soundOn) {
              var u = new SpeechSynthesisUtterance('انتهى الوقت');
              u.lang = 'ar-SA';
              u.rate = 0.95;
              window.speechSynthesis.speak(u);
            }
          } catch (e) {}
        }, 3400);
      }
    }

    /* ---------- نطق الفرنسية (للأسئلة والنصوص الفرنسية الصريحة فقط) ---------- */
    function frOnly(t) {
      var s = String(t || '');
      if (AR.test(s)) return '';
      s = s.replace(/_{2,}/g, ' ... ').replace(/\[[^\]\n]*\]/g, ' ')
        .split(/\s+/).filter(function (w) { return w && !IPA.test(w); }).join(' ').trim();
      return LAT.test(s) ? s : '';
    }
    function sayBtn(t) {
      var c = frOnly(t);
      return c ? '<button type="button" class="ex-say" data-say="' + esc(encodeURIComponent(c)) + '" aria-label="استمع بالفرنسية">🔊</button>' : '';
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

    /* ---------- النماذج الجديدة: الصف الأول الثانوي (سهلة) ---------- */
    function C(p, o, a, x) { return { type: 'choice', marks: 2, prompt_fr: p, options: o, answer: a, explanation_ar: x }; }
    function T(p, a, x) { return { type: 'text', marks: 2, prompt_fr: p, answer: a, explanation_ar: x }; }
    function mk(n, ar, fr, txt, txtAr, qa, qg, qv) {
      return {
        id: 'easy-1sec-' + n, level: '1sec', title_ar: ar, title_fr: fr, duration_min: 30,
        instructions_ar: 'الدرجة الكاملة 20 (كل سؤال درجتان). اقرأ النص جيداً ثم أجب. الوقت 30 دقيقة.',
        sections: [
          { title_ar: 'قطعة الفهم', title_fr: 'Compréhension', text: txt, text_ar: txtAr, questions: qa },
          { title_ar: 'القواعد', title_fr: 'Grammaire', questions: qg },
          { title_ar: 'المفردات', title_fr: 'Vocabulaire', questions: qv }
        ]
      };
    }
    var BUILTIN = [
      mk(1, 'نموذج سهل (1): التعارف والعائلة', 'Modèle facile n° 1 : Se présenter et la famille',
        "Bonjour ! Je m'appelle Sara. J'ai quinze ans et j'habite au Caire avec ma famille. Mon père est médecin et ma mère est professeur. J'ai un frère, Omar, et une sœur, Mona. Nous aimons passer le week-end chez notre grand-mère à Alexandrie.",
        'مرحباً! اسمي سارة. عمري خمسة عشر عاماً وأسكن في القاهرة مع عائلتي. أبي طبيب وأمي مدرّسة. لدي أخ اسمه عمر وأخت اسمها منى. نحب قضاء عطلة نهاية الأسبوع عند جدتنا في الإسكندرية.',
        [C('Comment s\'appelle la jeune fille ?', ['Mona', 'Sara', 'Omar', 'Nour'], 'Sara', 'النص يبدأ بـ « Je m\'appelle Sara » أي اسمها سارة.'),
         C('Quel âge a Sara ?', ['Treize ans', 'Quatorze ans', 'Quinze ans', 'Seize ans'], 'Quinze ans', '« J\'ai quinze ans » = عمري خمسة عشر عاماً.'),
         C('Quelle est la profession du père de Sara ?', ['Médecin', 'Professeur', 'Ingénieur', 'Avocat'], 'Médecin', '« Mon père est médecin » = أبي طبيب.'),
         C('Où la famille passe-t-elle le week-end ?', ['Au Caire', 'Chez la grand-mère à Alexandrie', 'À la mer', 'À l\'école'], 'Chez la grand-mère à Alexandrie', '« Nous aimons passer le week-end chez notre grand-mère à Alexandrie ».')],
        [T('Complétez avec le verbe être : Nous ____ égyptiens.', 'sommes', 'تصريف être: je suis, tu es, il est, nous sommes, vous êtes, ils sont.'),
         C('J\'___ un frère et une sœur.', ['ai', 'suis', 'as', 'a'], 'ai', 'avoir مع je: j\'ai (نحذف e قبل حرف متحرك).'),
         C('Sara présente sa famille : « Voici ___ mère. »', ['ma', 'mon', 'mes', 'leur'], 'ma', 'الصفة الملكية للمؤنث المفرد (المتكلم): ma mère. وللمذكر: mon père.')],
        [C('Le frère de ma mère est mon ___.', ['oncle', 'cousin', 'neveu', 'grand-père'], 'oncle', 'أخو الأم = oncle (خال).'),
         T('Traduisez en français : جدّة', ['grand-mère', 'grand mère', 'la grand-mère', 'ma grand-mère'], 'جدّة = grand-mère.'),
         C('Choisissez la bonne phrase :', ['Elle s\'appelle Mona.', 'Elle m\'appelle Mona.', 'Elle t\'appelle Mona.', 'Elle nous appelle Mona.'], 'Elle s\'appelle Mona.', 'الفعل المنعكس s\'appeler: ضمير الانعكاس يتبع الفاعل (elle → se).')]),
      mk(2, 'نموذج سهل (2): الحياة اليومية والمدرسة', 'Modèle facile n° 2 : La vie quotidienne et l\'école',
        "Tous les matins, Karim se réveille à sept heures. Il prend son petit déjeuner, puis il va à l'école à pied. Les cours commencent à huit heures et finissent à deux heures. À midi, Karim mange un sandwich avec ses amis. Après l'école, il fait ses devoirs et il joue au football.",
        'كل صباح يستيقظ كريم في السابعة. يتناول إفطاره ثم يذهب إلى المدرسة سيراً على الأقدام. تبدأ الحصص في الثامنة وتنتهي في الثانية. وعند الظهر يأكل كريم شطيرة مع أصدقائه. بعد المدرسة يؤدي واجباته ويلعب كرة القدم.',
        [C('À quelle heure Karim se réveille-t-il ?', ['À six heures', 'À sept heures', 'À huit heures', 'À deux heures'], 'À sept heures', '« Karim se réveille à sept heures ».'),
         C('Comment Karim va-t-il à l\'école ?', ['En bus', 'À pied', 'En voiture', 'À vélo'], 'À pied', '« il va à l\'école à pied » = سيراً على الأقدام.'),
         C('À quelle heure les cours finissent-ils ?', ['À midi', 'À une heure', 'À deux heures', 'À huit heures'], 'À deux heures', '« Les cours commencent à huit heures et finissent à deux heures ».'),
         C('Que fait Karim après l\'école ?', ['Il dort', 'Il voyage', 'Il fait ses devoirs et joue au football', 'Il travaille'], 'Il fait ses devoirs et joue au football', '« il fait ses devoirs et il joue au football ».')],
        [C('Tu ___ à sept heures. (se lever)', ['te lèves', 'se lève', 'me lève', 'nous levons'], 'te lèves', 'الفعل المنعكس se lever مع tu: tu te lèves.'),
         T('Complétez avec « va » ou « vont » : Les élèves ____ à l\'école.', 'vont', 'الفاعل جمع (ils) فنقول: ils vont. aller: je vais, tu vas, il va, nous allons, vous allez, ils vont.'),
         C('Il est huit heures et demie, c\'est :', ['8 h 15', '8 h 30', '8 h 45', '8 h 50'], '8 h 30', 'et demie = ونصف = 30 دقيقة.')],
        [C('On écrit sur le tableau avec ___.', ['une craie', 'une fourchette', 'un oreiller', 'une chaise'], 'une craie', 'نكتب على السبورة بالطباشير (une craie).'),
         T('Traduisez en français : كتاب', ['livre', 'un livre', 'le livre'], 'كتاب = livre (un livre).'),
         C('Le contraire de « commencer » est :', ['finir', 'ouvrir', 'partir', 'entrer'], 'finir', 'عكس commencer (يبدأ) هو finir (ينتهي).')]),
      mk(3, 'نموذج سهل (3): الطعام والتسوّق', 'Modèle facile n° 3 : La nourriture et les courses',
        "Aujourd'hui, Mme Nadia va au marché. Elle achète un kilo de tomates, deux kilos de pommes de terre, une bouteille d'huile et du fromage. Elle n'achète pas de viande parce qu'elle prépare un repas végétarien. Elle paie cinquante livres.",
        'اليوم تذهب السيدة نادية إلى السوق. تشتري كيلو من الطماطم وكيلوين من البطاطس وزجاجة زيت وبعض الجبن. لا تشتري لحماً لأنها تعدّ وجبة نباتية. تدفع خمسين جنيهاً.',
        [C('Où va Mme Nadia ?', ['Au marché', 'À la mosquée', 'À l\'hôpital', 'Au cinéma'], 'Au marché', '« Mme Nadia va au marché ».'),
         C('Combien de kilos de pommes de terre achète-t-elle ?', ['Un', 'Deux', 'Trois', 'Cinq'], 'Deux', '« deux kilos de pommes de terre ».'),
         C('Pourquoi n\'achète-t-elle pas de viande ?', ['Elle n\'a pas d\'argent', 'Elle prépare un repas végétarien', 'Le boucher est fermé', 'Elle déteste le marché'], 'Elle prépare un repas végétarien', '« parce qu\'elle prépare un repas végétarien ».'),
         C('Combien paie-t-elle ?', ['Vingt livres', 'Trente livres', 'Cinquante livres', 'Cent livres'], 'Cinquante livres', '« Elle paie cinquante livres ».')],
        [C('Je mange ___ pain.', ['du', 'de la', 'des', 'les'], 'du', 'pain اسم مذكر مفرد: du pain (du = de + le).'),
         C('Elle boit ___ eau.', ['de l\'', 'du', 'des', 'un'], 'de l\'', 'eau تبدأ بحرف متحرك فنستخدم de l\' : de l\'eau.'),
         T('Il n\'y a pas ___ lait. (de / du)', ['de', 'd\''], 'بعد النفي (ne ... pas) يتحول du / de la / des إلى de أو d\' : Il n\'y a pas de lait.')],
        [C('Un fruit :', ['une pomme', 'une carotte', 'un poulet', 'un fromage'], 'une pomme', 'التفاحة (une pomme) فاكهة، أما الجزر (une carotte) فخضار.'),
         T('Traduisez en français : ماء', ['eau', 'l\'eau', 'de l\'eau'], 'ماء = eau.'),
         C('Le petit déjeuner est le repas du ___.', ['matin', 'soir', 'midi', 'minuit'], 'matin', 'وجبة الإفطار petit déjeuner هي وجبة الصباح (matin).')]),
      mk(4, 'نموذج سهل (4): المدينة والاتجاهات', 'Modèle facile n° 4 : La ville et les directions',
        "Mariam visite Lyon. Elle cherche la pharmacie. Elle demande son chemin à une dame. La dame dit : « Allez tout droit, puis tournez à gauche. La pharmacie est à côté de la boulangerie. » Mariam dit : « Merci beaucoup, madame ! »",
        'تزور مريم مدينة ليون. تبحث عن الصيدلية. تسأل سيدة عن الطريق. تقول السيدة: «اذهبي على الطريق مستقيماً ثم انعطفي يساراً. الصيدلية بجوار المخبز.» تقول مريم: «شكراً جزيلاً يا سيدتي!»',
        [C('Que cherche Mariam ?', ['La gare', 'La pharmacie', 'L\'école', 'La banque'], 'La pharmacie', '« Elle cherche la pharmacie ».'),
         C('Mariam demande son chemin à ___.', ['un policier', 'une dame', 'un enfant', 'son ami'], 'une dame', '« Elle demande son chemin à une dame ».'),
         C('Où est la pharmacie ?', ['En face de la poste', 'À côté de la boulangerie', 'Derrière l\'école', 'Loin d\'ici'], 'À côté de la boulangerie', '« La pharmacie est à côté de la boulangerie ».'),
         C('Pour arriver à la pharmacie, Mariam doit tourner ___.', ['à droite', 'à gauche', 'en arrière', 'deux fois'], 'à gauche', '« tournez à gauche » = انعطفي يساراً.')],
        [C('Le musée est ___ la banque et la poste.', ['entre', 'sur', 'chez', 'vers'], 'entre', 'entre ... et ... = بين ... و ...'),
         C('___ à droite, s\'il vous plaît. (tourner)', ['Tournez', 'Tournes', 'Tourner', 'Tournons'], 'Tournez', 'الأمر مع vous: Tournez (ينتهي بـ ez).'),
         T('Complétez : Je vais ___ poste. (au / à la)', ['à la', 'a la'], 'poste اسم مؤنث: à + la = à la. (أما المذكر: à + le = au).')],
        [C('On prend le train à ___.', ['la gare', 'la poste', 'l\'hôpital', 'la mosquée'], 'la gare', 'نركب القطار من المحطة (la gare).'),
         T('Traduisez en français : شارع', ['rue', 'la rue', 'une rue'], 'شارع = rue.'),
         C('Le contraire de « loin » est :', ['près', 'tard', 'grand', 'droit'], 'près', 'عكس loin (بعيد) هو près (قريب).')]),
      mk(5, 'نموذج سهل (5): الهوايات والطقس والملابس', 'Modèle facile n° 5 : Les loisirs, le temps et les vêtements',
        "En été, il fait chaud en Égypte. Nada et ses amies vont à la plage. Elles portent un maillot de bain, des lunettes de soleil et un chapeau. Elles nagent, elles jouent au volley et elles mangent des glaces. En hiver, elles préfèrent rester à la maison et lire des livres.",
        'في الصيف يكون الجو حاراً في مصر. تذهب ندى وصديقاتها إلى الشاطئ. يرتدين ملابس السباحة ونظارات شمسية وقبعة. يسبحن ويلعبن الكرة الطائرة ويأكلن الآيس كريم. وفي الشتاء يفضلن البقاء في المنزل وقراءة الكتب.',
        [C('Quel temps fait-il en été en Égypte ?', ['Il fait froid', 'Il pleut', 'Il fait chaud', 'Il neige'], 'Il fait chaud', '« En été, il fait chaud en Égypte ».'),
         C('Où vont Nada et ses amies ?', ['À la montagne', 'À la plage', 'Au cinéma', 'À l\'école'], 'À la plage', '« vont à la plage » = يذهبن إلى الشاطئ.'),
         C('Que portent-elles ?', ['Un manteau', 'Un maillot de bain, des lunettes de soleil et un chapeau', 'Un pull', 'Des bottes'], 'Un maillot de bain, des lunettes de soleil et un chapeau', 'النص: « un maillot de bain, des lunettes de soleil et un chapeau ».'),
         C('Que font-elles en hiver ?', ['Elles nagent', 'Elles voyagent', 'Elles restent à la maison et lisent', 'Elles jouent au volley'], 'Elles restent à la maison et lisent', '« elles préfèrent rester à la maison et lire des livres ».')],
        [C('J\'aime ___ au football.', ['jouer', 'joue', 'joues', 'jouez'], 'jouer', 'بعد الفعل aimer نستعمل المصدر: J\'aime jouer.'),
         C('Demain, nous ___ visiter le musée. (aller)', ['allons', 'allez', 'vont', 'vais'], 'allons', 'المستقبل القريب: aller + مصدر. مع nous: nous allons.'),
         T('Complétez : Il ___ froid en hiver. (faire)', 'fait', 'للتعبير عن الطقس: il fait froid / il fait chaud (faire مع il = fait).')],
        [C('En hiver, on porte ___.', ['un manteau', 'un maillot de bain', 'des sandales', 'un short'], 'un manteau', 'في الشتاء نرتدي معطفاً (un manteau).'),
         T('Traduisez en français : مطر', ['pluie', 'la pluie'], 'مطر = pluie (la pluie).'),
         C('Un sport d\'équipe :', ['le football', 'la natation', 'le yoga', 'le ski'], 'le football', 'كرة القدم (le football) رياضة جماعية.')])
    ];

    /* ---------- قراءة الامتحانات من data/exams.json (أي بنية مألوفة) ---------- */
    function loadExams() {
      var c = ['./data/exams.json', 'data/exams.json', '/data/exams.json'], i = 0;
      function next() {
        if (i >= c.length) return Promise.resolve(null);
        return fetch(c[i++]).then(function (r) { return r.ok ? r.text() : Promise.reject(); })
          .then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); })
          .catch(next);
      }
      return next();
    }
    function findExams(n, out, seen) {
      if (!n || typeof n !== 'object' || seen.indexOf(n) !== -1) return;
      seen.push(n);
      if (Array.isArray(n)) {
        if (n.length && n.every(function (x) { return x && typeof x === 'object' && (Array.isArray(x.sections) || Array.isArray(x.parts) || Array.isArray(x.questions)); })) {
          n.forEach(function (x) { out.push(x); });
          return;
        }
        n.forEach(function (x) { findExams(x, out, seen); });
        return;
      }
      if (Array.isArray(n.sections) && !out.length && n.sections.length && n.sections[0] && Array.isArray(n.sections[0].questions) && (n.id || n.title_ar)) { out.push(n); return; }
      Object.keys(n).forEach(function (k) { if (k !== 'meta') findExams(n[k], out, seen); });
    }
    function normQ(q) {
      var opts = q.options || q.choices;
      opts = Array.isArray(opts) ? opts.map(String) : [];
      var ans = q.answer !== undefined ? q.answer : (q.correct !== undefined ? q.correct : q.solution);
      var has = !(ans === undefined || ans === null || ans === '');
      var type = opts.length ? 'choice' : (has ? 'text' : 'open');
      if (type === 'choice' && has) {
        if (typeof ans === 'number' && opts[ans] !== undefined) ans = opts[ans];
        else if (typeof ans === 'string' && /^[A-Da-d]$/.test(ans.trim()) && !opts.some(function (o) { return nrm(o) === nrm(ans); })) {
          var ix = 'abcd'.indexOf(ans.trim().toLowerCase());
          if (opts[ix] !== undefined) ans = opts[ix];
        }
      }
      var list = !has ? [] : (Array.isArray(ans) ? ans.map(String) : (type === 'text' ? String(ans).split('|').map(function (x) { return x.trim(); }) : [String(ans)]));
      return {
        type: type, marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        prompt: strOf(q, ['prompt_fr', 'prompt', 'question', 'q', 'text']),
        promptAr: strOf(q, ['prompt_ar', 'instruction_ar']),
        opts: opts, answers: list,
        exp: strOf(q, ['explanation_ar', 'explanation', 'why_ar', 'why', 'hint_ar', 'hint']),
        rule: strOf(q, ['rule_ar', 'rule']), state: null
      };
    }
    function normExam(e, i) {
      var raw = e.sections || e.parts || [];
      if (!raw.length && Array.isArray(e.questions)) raw = [{ questions: e.questions }];
      var secs = raw.map(function (s) {
        var qs = s.questions || s.items || s.exercises || [];
        return {
          tAr: strOf(s, ['title_ar', 'name_ar']), tFr: strOf(s, ['title_fr', 'title', 'name']),
          text: strOf(s, ['passage_fr', 'text', 'passage', 'text_fr', 'reading', 'content', 'document']),
          textAr: strOf(s, ['text_ar', 'translation_ar', 'passage_ar']),
          qs: qs.filter(function (o) { return o && typeof o === 'object'; }).map(normQ)
        };
      }).filter(function (s) { return s.qs.length; });
      var tAr = strOf(e, ['title_ar', 'name_ar']), tFr = strOf(e, ['title_fr', 'title', 'name']);
      if (!tAr && AR.test(tFr)) { tAr = tFr; tFr = ''; }
      var lvl = String(e.level || e.year || '');
      var all = []; secs.forEach(function (s) { s.qs.forEach(function (q) { all.push(q); }); });
      var scored = all.filter(function (q) { return q.type !== 'open'; });
      return {
        id: String(e.id || ('exam-' + i)), level: lvl, tAr: tAr || ('نموذج امتحان ' + (i + 1)), tFr: tFr,
        dur: Number(e.duration_min) > 0 ? Number(e.duration_min) : 30, instr: strOf(e, ['instructions_ar', 'instructions']),
        secs: secs, count: all.length,
        total: scored.reduce(function (a, q) { return a + q.marks; }, 0)
      };
    }

    /* ---------- التصميم ---------- */
    var CSS = '' +
      '.ex-wrap{display:flex;flex-direction:column;gap:12px}' +
      '.ex-wrap [hidden]{display:none!important}' +
      '.ex-intro{background:linear-gradient(135deg,#0055A5,#0a7ad6);color:#fff;border-radius:16px;padding:14px;line-height:1.9;font-size:.95rem}' +
      '.ex-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}' +
      '.ex-chip{flex:0 0 auto;border:1px solid #d5deea;background:#fff;border-radius:999px;padding:7px 14px;font-family:inherit;cursor:pointer;white-space:nowrap;color:inherit}' +
      '.ex-chip.on{background:#0055A5;color:#fff;border-color:#0055A5}' +
      '.ex-card{background:#fff;border:1px solid #d5deea;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 2px 8px rgba(0,40,100,.06)}' +
      '.ex-ct b{display:block;color:#0055A5;font-size:1.05rem;line-height:1.6}' +
      '.ex-ct small{color:#667;display:block;margin-top:2px}' +
      '.ex-meta{display:flex;flex-wrap:wrap;gap:6px}' +
      '.ex-pill{background:#eef5ff;color:#0055A5;border-radius:999px;padding:3px 10px;font-size:.8rem}' +
      '.ex-best{font-size:.85rem;color:#1b9e5b;font-weight:700}' +
      '.ex-btn{border:0;background:#0055A5;color:#fff;border-radius:12px;padding:11px 16px;font-weight:700;font-family:inherit;cursor:pointer;font-size:1rem}' +
      '.ex-btn.alt{background:#fff;color:#0055A5;border:2px solid #0055A5}' +
      '.ex-bar{position:sticky;top:var(--ex-top,0);z-index:30;background:#fff;border:1px solid #d5deea;border-radius:14px;padding:8px 10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between;box-shadow:0 3px 10px rgba(0,0,0,.12)}' +
      '.ex-timer{font-weight:800;font-size:1.3rem;color:#0055A5;font-variant-numeric:tabular-nums}' +
      '.ex-bar.warn .ex-timer{color:#d63a3a;animation:exbl 1s infinite}' +
      '@keyframes exbl{50%{opacity:.45}}' +
      '.ex-prog{font-size:.85rem;color:#556}' +
      '.ex-small{border:1px solid #d5deea;background:#fff;border-radius:10px;padding:6px 10px;font-family:inherit;cursor:pointer;font-size:.85rem;color:inherit}' +
      '.ex-small.red{background:#d63a3a;color:#fff;border-color:#d63a3a}' +
      '.ex-pb{flex-basis:100%;height:6px;background:#e6ecf5;border-radius:999px;overflow:hidden}' +
      '.ex-pb i{display:block;height:100%;width:0;background:#1b9e5b;transition:width .3s}' +
      '.ex-title{margin:0;color:#0055A5;line-height:1.6}' +
      '.ex-instr{background:#fff8e1;border-radius:12px;padding:10px 12px;font-size:.92rem;line-height:1.8}' +
      '.ex-sech{margin:6px 0 0;color:#d63a3a;font-size:1.05rem}' +
      '.ex-pass{background:#f4f9ff;border-inline-start:4px solid #0055A5;border-radius:12px;padding:12px;line-height:1.95;direction:ltr;text-align:left;font-size:1.02rem}' +
      '.ex-tr{font-size:.9rem;color:#445;direction:rtl;text-align:right;line-height:1.9;margin-top:8px}' +
      '.ex-tr summary{cursor:pointer;color:#0055A5;font-weight:700}' +
      '.ex-q{background:#fff;border:2px solid #e3eaf4;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;transition:border-color .2s,background .2s}' +
      '.ex-q.st-ok{border-color:#1b9e5b;background:#f1fbf5}' +
      '.ex-q.st-bad{border-color:#d63a3a;background:#fff4f4}' +
      '.ex-q.st-skip{border-color:#e0a800;background:#fffaf0}' +
      '.ex-q.st-view{border-color:#0055A5}' +
      '.ex-qh{display:flex;justify-content:space-between;align-items:center}' +
      '.ex-num{background:#0055A5;color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700}' +
      '.ex-mk{font-size:.78rem;background:#fff4d6;color:#8a6500;border-radius:999px;padding:2px 10px}' +
      '.ex-prompt{font-weight:700;line-height:1.8}' +
      '.ex-pa{color:#556;font-size:.88rem}' +
      '.ex-say{background:#eef5ff;border:1px solid #b8d5ff;border-radius:50%;width:28px;height:28px;font-size:14px;margin-inline:8px;cursor:pointer;padding:0;vertical-align:middle}' +
      '.ex-opts{display:flex;flex-direction:column;gap:8px}' +
      '.ex-opt{display:flex;align-items:center;gap:10px;text-align:start;width:100%;border:2px solid #d5deea;background:#fff;border-radius:12px;padding:11px 12px;font-family:inherit;font-size:1rem;cursor:pointer;transition:.15s;color:inherit}' +
      '.ex-opt:active{transform:scale(.98)}' +
      '.ex-opt i{font-style:normal;flex:0 0 26px;height:26px;border-radius:50%;background:#eef5ff;color:#0055A5;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem}' +
      '.ex-opt.ok{background:#dff5e8;border-color:#1b9e5b;color:#0d6b3b;animation:expop .35s}' +
      '.ex-opt.bad{background:#fde3e3;border-color:#d63a3a;color:#a11d1d;animation:exsk .4s}' +
      '.ex-opt.ok i{background:#1b9e5b;color:#fff}.ex-opt.bad i{background:#d63a3a;color:#fff}' +
      '.ex-opt:disabled{cursor:default}' +
      '.ex-txt{display:flex;gap:8px}' +
      '.ex-input,.ex-area{flex:1;min-width:0;font-size:16px;padding:10px 12px;border:2px solid #d5deea;border-radius:12px;font-family:inherit;background:#fff}' +
      '.ex-area{min-height:90px;width:100%;box-sizing:border-box}' +
      '.ex-input.ok{border-color:#1b9e5b;background:#dff5e8}.ex-input.bad{border-color:#d63a3a;background:#fde3e3}' +
      '.ex-fb{border-radius:12px;padding:9px 12px;line-height:1.8;font-size:.95rem}' +
      '.ex-fb.ok{background:#dff5e8;color:#0d6b3b}.ex-fb.bad{background:#fde3e3;color:#a11d1d}.ex-fb.skip{background:#fff1cc;color:#7a5800}.ex-fb.view{background:#e6f0ff;color:#0b3d7a}' +
      '.ex-exp{margin-top:4px;color:#334;background:rgba(255,255,255,.75);border-radius:8px;padding:6px 8px}' +
      '.ex-res{background:#fff;border:2px solid #0055A5;border-radius:18px;padding:16px;text-align:center;display:flex;flex-direction:column;gap:10px;scroll-margin-top:calc(var(--ex-top,0px) + 80px)}' +
      '.ex-ring{--c:#1b9e5b;--p:0;width:110px;height:110px;border-radius:50%;background:conic-gradient(var(--c) calc(var(--p)*1%),#e6ecf5 0);margin:auto;position:relative}' +
      '.ex-ring::after{content:attr(data-t);position:absolute;inset:10px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.4rem;color:#0055A5}' +
      '.ex-stats{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-weight:700}' +
      '.ex-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}' +
      '.ex-ovl{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.65);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px}' +
      '.ex-ovb{background:#fff;border-radius:18px;padding:24px;text-align:center;max-width:320px;animation:expop .4s}' +
      '.ex-bell{font-size:56px;animation:exring .6s infinite}' +
      '@keyframes expop{0%{transform:scale(.96)}50%{transform:scale(1.04)}100%{transform:scale(1)}}' +
      '@keyframes exsk{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
      '@keyframes exring{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}';

    /* ---------- قائمة النماذج ---------- */
    function bestOf(id) {
      try { var b = JSON.parse(store('ex_best_' + id)); return b && typeof b.pct === 'number' ? b : null; } catch (e) { return null; }
    }
    function cardHTML(e) {
      var b = bestOf(e.id);
      return '<div class="ex-card"><div class="ex-ct"><b dir="auto">' + esc(e.tAr) + '</b>' + (e.tFr ? '<small dir="auto">' + esc(e.tFr) + '</small>' : '') + '</div>' +
        '<div class="ex-meta"><span class="ex-pill">⏱ ' + e.dur + ' دقيقة</span><span class="ex-pill">📝 ' + e.count + ' سؤال</span><span class="ex-pill">🎯 ' + e.total + ' درجة</span>' +
        (e.level ? '<span class="ex-pill">' + esc(LV[e.level] || e.level) + '</span>' : '') + '</div>' +
        (b ? '<div class="ex-best">🏆 أفضل نتيجة: ' + b.sc + ' / ' + b.tot + ' (' + b.pct + '%)</div>' : '') +
        '<button type="button" class="ex-btn" data-start="' + EX.indexOf(e) + '">▶ ابدأ الامتحان</button></div>';
    }
    function renderList() {
      var levels = [];
      EX.forEach(function (e) { if (e.level && levels.indexOf(e.level) === -1) levels.push(e.level); });
      levels.sort();
      var tabs = '<button type="button" class="ex-chip' + (filter === 'all' ? ' on' : '') + '" data-f="all">الكل (' + EX.length + ')</button>' +
        levels.map(function (l) {
          return '<button type="button" class="ex-chip' + (filter === l ? ' on' : '') + '" data-f="' + esc(l) + '">' + esc(LV[l] || l) + '</button>';
        }).join('');
      var list = EX.filter(function (e) { return filter === 'all' || e.level === filter; });
      root.innerHTML = '<div class="ex-intro">📝 امتحانات تفاعلية بمؤقت حقيقي. أجب عن الأسئلة بنفسك، وستُصحَّح كل إجابة فوراً: <b>🟩 أخضر</b> للصحيح و<b>🟥 أحمر</b> للخطأ، مع شرح الحل للتعلّم. عند انتهاء الوقت يصدر تنبيه صوتي.</div>' +
        '<div class="ex-chips">' + tabs + '</div>' +
        (list.length ? list.map(cardHTML).join('') : '<div class="ex-card">لا توجد نماذج في هذا المستوى.</div>');
    }

    /* ---------- صفحة الامتحان ---------- */
    function qHTML(q, n, gi) {
      var h = '<div class="ex-q" data-qi="' + gi + '"><div class="ex-qh"><span class="ex-num">' + n + '</span>' +
        (q.type !== 'open' ? '<span class="ex-mk">' + q.marks + ' درجة</span>' : '<span class="ex-mk">تدريب حر</span>') + '</div>' +
        '<div class="ex-prompt" dir="auto">' + esc(q.prompt) + sayBtn(q.prompt) + '</div>' +
        (q.promptAr ? '<div class="ex-pa" dir="auto">' + esc(q.promptAr) + '</div>' : '');
      if (q.type === 'choice') {
        h += '<div class="ex-opts">' + q.opts.map(function (o, i) {
          return '<button type="button" class="ex-opt" data-oi="' + i + '"><i>' + 'ABCDEFGH'.charAt(i) + '</i><span dir="auto">' + esc(o) + '</span></button>';
        }).join('') + '</div>';
      } else if (q.type === 'text') {
        h += '<div class="ex-txt"><input type="text" class="ex-input" dir="ltr" placeholder="اكتب إجابتك بالفرنسية" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="ex-btn ex-check">تحقق</button></div>';
      } else {
        h += '<textarea class="ex-area" dir="auto" placeholder="اكتب إجابتك هنا..."></textarea><button type="button" class="ex-btn alt ex-show">عرض الإجابة النموذجية</button>';
      }
      return h + '<div class="ex-fb" hidden></div></div>';
    }
    function renderExam() {
      var e = run.e, gi = 0, n = 0;
      var body = e.secs.map(function (s) {
        var h = '';
        var t = (s.tAr && s.tFr) ? s.tAr + ' — ' + s.tFr : (s.tAr || s.tFr);
        if (t) h += '<h4 class="ex-sech" dir="auto">' + esc(t) + '</h4>';
        if (s.text) {
          h += '<div class="ex-pass">' + esc(s.text) + sayBtn(s.text) +
            (s.textAr ? '<details class="ex-tr"><summary>عرض الترجمة العربية</summary>' + esc(s.textAr) + '</details>' : '') + '</div>';
        }
        s.qs.forEach(function (q) { run.qs.push(q); h += qHTML(q, ++n, gi++); });
        return h;
      }).join('');
      root.innerHTML = '<div class="ex-bar"><button type="button" class="ex-small ex-back">← القائمة</button>' +
        '<span class="ex-timer">⏱ <span class="ex-time">' + fmt(e.dur * 60) + '</span></span>' +
        '<span class="ex-prog">0 / ' + e.count + '</span>' +
        '<button type="button" class="ex-small ex-snd">' + (soundOn ? '🔊' : '🔇') + '</button>' +
        '<button type="button" class="ex-small red ex-finish">إنهاء</button>' +
        '<div class="ex-pb"><i></i></div></div>' +
        '<h3 class="ex-title" dir="auto">' + esc(e.tAr) + (e.tFr ? '<br><small>' + esc(e.tFr) + '</small>' : '') + '</h3>' +
        (e.instr ? '<div class="ex-instr" dir="auto">📋 ' + esc(e.instr) + '</div>' : '') +
        '<div class="ex-res" hidden></div>' + body;
    }
    function updateProg() {
      if (!run) return;
      var d = run.qs.filter(function (q) { return q.state; }).length;
      var p = $('.ex-prog', root), pb = $('.ex-pb i', root);
      if (p) p.textContent = d + ' / ' + run.qs.length;
      if (pb) pb.style.width = (run.qs.length ? Math.round(d * 100 / run.qs.length) : 0) + '%';
    }
    function showFb(card, q, kind, note) {
      var f = $('.ex-fb', card), ans = q.answers[0] || '', h;
      if (kind === 'ok') h = '✅ أحسنت! إجابة صحيحة' + (note || '');
      else if (kind === 'bad') h = '❌ إجابة خاطئة. الإجابة الصحيحة: <b dir="auto">' + esc(ans) + '</b>';
      else if (kind === 'skip') h = '⏭️ لم تُجب. الإجابة الصحيحة: <b dir="auto">' + esc(ans) + '</b>';
      else h = ans ? '📖 الإجابة النموذجية: <b dir="auto">' + esc(ans) + '</b>' : '📖 الحل:';
      if (q.exp) h += '<div class="ex-exp" dir="auto">💡 ' + esc(q.exp) + '</div>';
      if (q.rule) h += '<div class="ex-exp" dir="auto">📌 القاعدة: ' + esc(q.rule) + '</div>';
      f.className = 'ex-fb ' + kind;
      f.innerHTML = h;
      f.hidden = false;
      card.classList.add('st-' + kind);
    }
    function lock(card) {
      $$('button.ex-opt,input.ex-input,textarea.ex-area,button.ex-check,button.ex-show', card).forEach(function (x) { x.disabled = true; });
    }
    function ctx(el) {
      var card = el.closest('.ex-q');
      if (!card || !run || run.done) return null;
      var q = run.qs[+card.getAttribute('data-qi')];
      return q && !q.state ? { card: card, q: q } : null;
    }
    function pickOpt(btn) {
      var c = ctx(btn);
      if (!c) return;
      var oi = +btn.getAttribute('data-oi');
      var same = function (v) { return c.q.answers.some(function (a) { return nrm(a) === nrm(v); }); };
      var ok = same(c.q.opts[oi]);
      c.q.state = ok ? 'ok' : 'bad';
      $$('button.ex-opt', c.card).forEach(function (b, i) {
        b.disabled = true;
        if (same(c.q.opts[i])) b.classList.add('ok'); else if (i === oi) b.classList.add('bad');
      });
      showFb(c.card, c.q, c.q.state);
      sfx(ok ? 'ok' : 'bad');
      updateProg();
    }
    function checkText(btn) {
      var c = ctx(btn);
      if (!c) return;
      var inp = $('.ex-input', c.card), v = inp.value;
      if (!v.trim()) { inp.focus(); return; }
      var ok = c.q.answers.some(function (a) { return nrm(a) === nrm(v); }), note = '';
      if (!ok && c.q.answers.some(function (a) { return plain(a) === plain(v); })) {
        ok = true;
        note = ' <small>(انتبه إلى الحروف المُعلَّمة، الكتابة الصحيحة: ' + esc(c.q.answers[0]) + ')</small>';
      }
      c.q.state = ok ? 'ok' : 'bad';
      inp.classList.add(ok ? 'ok' : 'bad');
      lock(c.card);
      showFb(c.card, c.q, c.q.state, note);
      sfx(ok ? 'ok' : 'bad');
      updateProg();
    }
    function showOpen(btn) {
      var c = ctx(btn);
      if (!c) return;
      c.q.state = 'view';
      lock(c.card);
      showFb(c.card, c.q, 'view');
      updateProg();
    }

    /* ---------- المؤقت والنتيجة ---------- */
    function clearRun() {
      if (run && run.timer) clearInterval(run.timer);
      run = null;
      var o = $('.ex-ovl'); if (o && o.parentNode) o.parentNode.removeChild(o);
    }
    function tick() {
      if (!run || run.done) return;
      var left = run.deadline - Date.now(), total = run.e.dur * 60000;
      var t = $('.ex-time', root), bar = $('.ex-bar', root);
      if (t) t.textContent = fmt(left / 1000);
      if (bar) { if (left <= Math.min(300000, total * 0.2)) bar.classList.add('warn'); else bar.classList.remove('warn'); }
      if (!run.warned && left <= 60000 && total > 120000) { run.warned = true; sfx('warn'); }
      if (left <= 0) finish(true);
    }
    function start(i) {
      var e = EX[i];
      if (!e) return;
      ac();
      clearRun();
      e.secs.forEach(function (s) { s.qs.forEach(function (q) { q.state = null; }); });
      run = { e: e, qs: [], t0: Date.now(), deadline: Date.now() + e.dur * 60000, done: false, warned: false, timer: null };
      renderExam();
      run.timer = setInterval(tick, 500);
      tick();
      try { window.scrollTo(0, 0); } catch (x) {}
    }
    function finish(timeout) {
      if (!run || run.done) return;
      run.done = true;
      clearInterval(run.timer);
      var ok = 0, bad = 0, skip = 0, sc = 0, tot = 0;
      run.qs.forEach(function (q, gi) {
        var card = $('[data-qi="' + gi + '"]', root);
        if (!q.state) {
          q.state = q.type === 'open' ? 'view' : 'skip';
          if (card) { lock(card); showFb(card, q, q.state); }
        }
        if (q.type === 'open') return;
        tot += q.marks;
        if (q.state === 'ok') { ok++; sc += q.marks; } else if (q.state === 'bad') bad++; else skip++;
      });
      updateProg();
      var pct = tot ? Math.round(sc * 100 / tot) : 0;
      var el = Math.min(Date.now(), run.deadline) - run.t0;
      var b = bestOf(run.e.id);
      if (!b || pct > b.pct) store('ex_best_' + run.e.id, JSON.stringify({ sc: sc, tot: tot, pct: pct }));
      var msg = pct >= 90 ? 'ممتاز! 🌟' : pct >= 75 ? 'جيد جداً 👏' : pct >= 50 ? 'جيد، واصل التقدم 👍' : 'تحتاج إلى مراجعة 📚';
      var color = pct >= 75 ? '#1b9e5b' : pct >= 50 ? '#e0a800' : '#d63a3a';
      var res = $('.ex-res', root);
      if (res) {
        res.innerHTML = '<h3 style="margin:0;color:#0055A5">' + (timeout ? '⏰ انتهى الوقت! ' : '') + 'نتيجتك</h3>' +
          '<div class="ex-ring" style="--p:' + pct + ';--c:' + color + '" data-t="' + pct + '%"></div>' +
          '<div style="font-size:1.1rem;font-weight:800">' + sc + ' / ' + tot + ' درجة — ' + msg + '</div>' +
          '<div class="ex-stats"><span style="color:#1b9e5b">✅ ' + ok + '</span><span style="color:#d63a3a">❌ ' + bad + '</span><span style="color:#b07d00">⏭️ ' + skip + '</span><span style="color:#556">⏱ ' + fmt(el / 1000) + '</span></div>' +
          '<div style="font-size:.9rem;color:#556">راجع الإجابات والشروحات بالأسفل 👇</div>' +
          '<div class="ex-acts"><button type="button" class="ex-btn" data-again="1">🔁 أعد المحاولة</button><button type="button" class="ex-btn alt ex-back">📋 القائمة</button></div>';
        res.hidden = false;
      }
      var fb = $('.ex-finish', root); if (fb) fb.disabled = true;
      if (timeout) { sfx('alarm'); overlay(); } else { sfx(pct >= 50 ? 'win' : 'lose'); if (res && res.scrollIntoView) res.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
    function overlay() {
      var d = document.createElement('div');
      d.className = 'ex-ovl';
      d.innerHTML = '<div class="ex-ovb"><div class="ex-bell">⏰</div><h3 style="color:#d63a3a">انتهى الوقت!</h3><p>تم إنهاء الامتحان وعرض الحلول. شاهد نتيجتك بالأسفل.</p><button type="button" class="ex-btn ex-ovok">عرض النتيجة</button></div>';
      document.body.appendChild(d);
      d.addEventListener('click', function (ev) {
        if (ev.target.closest('.ex-ovok') || ev.target === d) {
          if (d.parentNode) d.parentNode.removeChild(d);
          try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (x) {}
          var r = $('.ex-res', root);
          if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    /* ---------- الأحداث ---------- */
    function onClick(e) {
      var t = e.target, b;
      if ((b = t.closest('.ex-say'))) { speakFr(decodeURIComponent(b.getAttribute('data-say') || '')); return; }
      if ((b = t.closest('.ex-opt'))) { pickOpt(b); return; }
      if ((b = t.closest('.ex-check'))) { checkText(b); return; }
      if ((b = t.closest('.ex-show'))) { showOpen(b); return; }
      if ((b = t.closest('[data-start]'))) { start(+b.getAttribute('data-start')); return; }
      if ((b = t.closest('[data-f]'))) { filter = b.getAttribute('data-f'); renderList(); return; }
      if ((b = t.closest('[data-again]'))) { start(EX.indexOf(run.e)); return; }
      if ((b = t.closest('.ex-snd'))) {
        soundOn = !soundOn;
        store('ex_sound', soundOn ? 'on' : 'off');
        b.textContent = soundOn ? '🔊' : '🔇';
        return;
      }
      if ((b = t.closest('.ex-finish'))) {
        if (!run || run.done) return;
        var left = run.qs.filter(function (q) { return !q.state; }).length;
        if (!left || confirm('لم تُجب عن ' + left + ' سؤال. هل تريد إنهاء الامتحان الآن؟')) finish(false);
        return;
      }
      if ((b = t.closest('.ex-back'))) {
        if (run && !run.done && !confirm('سيتم إلغاء الامتحان الحالي. هل أنت متأكد؟')) return;
        clearRun();
        renderList();
        try { window.scrollTo(0, 0); } catch (x) {}
      }
    }

    /* ---------- التشغيل عند فتح القسم لأول مرة ---------- */
    function mount() {
      if (started) return;
      started = true;
      if (!document.getElementById('ex-css')) {
        var st = document.createElement('style');
        st.id = 'ex-css';
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      // إخفاء العرض القديم للقسم (بدون حذفه)
      $$('.body', SEC).forEach(function (x) { x.style.display = 'none'; });
      root = document.createElement('div');
      root.className = 'ex-wrap';
      SEC.appendChild(root);
      try {
        var tb = document.querySelector('.topbar');
        var pos = tb ? window.getComputedStyle(tb).position : '';
        root.style.setProperty('--ex-top', (pos === 'fixed' || pos === 'sticky') ? (tb.offsetHeight + 4) + 'px' : '0px');
      } catch (x) {}
      root.addEventListener('click', onClick);
      root.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('ex-input')) {
          e.preventDefault();
          var c = e.target.closest('.ex-q'), btn = c ? $('.ex-check', c) : null;
          if (btn) checkText(btn);
        }
      });
      root.innerHTML = '<div class="ex-intro">جاري تحميل الامتحانات...</div>';
      loadExams().then(function (data) {
        var found = [];
        if (data) findExams(data, found, []);
        EX = found.map(normExam).concat(BUILTIN.map(function (x, i) { return normExam(x, 100 + i); }))
          .filter(function (e) { return e.count > 0; });
        // الامتحانات الأصلية أولاً ثم النماذج الجديدة؛ ترتيب المستويات في التبويبات
        renderList();
      }).catch(function () {
        EX = BUILTIN.map(function (x, i) { return normExam(x, 100 + i); });
        renderList();
      });
    }
    function check() { if (!started && SEC.classList.contains('on')) mount(); }
    if (window.MutationObserver) new MutationObserver(check).observe(SEC, { attributes: true, attributeFilter: ['class'] });
    check();
  }
})();
