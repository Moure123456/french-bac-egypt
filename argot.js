/* ===== argot.js — «العامية الفرنسية» (L'Argot) =====
   ملف مستقل: يحلّ محل بطاقة «المحتوى قيد الإعداد…» تلقائيًا.
   يبحث عن #argot-root أولًا، وإلا يبحث عن البطاقة داخل قسم العامية/Argot ويستبدلها.
   5 تبويبات: التعبيرات · قواعد النطق · الحوارات · اختصارات الرسائل · التمارين.
   النطق: Web Speech API بالفرنسية (fr-FR) فقط. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[argot]', e); } catch (_) {} } });

  function boot() {
    if (window.__argotLoaded) return; window.__argotLoaded = true;

    /* ---------- أدوات ---------- */
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´']/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

    /* ---------- الصوت (فرنسي فقط) ---------- */
    var frVoice = null;
    function pickVoice() {
      try {
        var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
        frVoice = vs.filter(function (v) { return /^fr(-|_)FR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
      } catch (e) {}
    }
    try { if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } } catch (e) {}
    function say(t, rate) {
      try {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(t).replace(/\([^)]*\)/g, '').replace(/[…]/g, '...').replace(/\s*\/\s*/g, ', ').replace(/\s+/g, ' ').trim());
        u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = rate || 0.9;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
    var AC = null;
    function tn(f, t0, d, type, v) { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (!AC) return; if (AC.state === 'suspended') AC.resume(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    function sOk() { tn(660, 0, 0.12, 'triangle', 0.15); tn(990, 0.1, 0.2, 'triangle', 0.15); }
    function sBad() { tn(220, 0, 0.25, 'sawtooth', 0.09); tn(150, 0.15, 0.3, 'sawtooth', 0.09); }
    function sWin() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tn(f, i * 0.12, 0.3, 'triangle', 0.15); }); }
    function boost(ms) { try { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(ms); } catch (e) {} }
    function sp(t, cls) { return '<button type="button" class="ag-sp' + (cls ? ' ' + cls : '') + '" data-say="' + esc(t) + '" aria-label="نطق">🔊</button>'; }

    /* ======================= المحتوى ======================= */

    /* القسم 1: [لا تقل (رسمي), قل (عامية), المعنى] */
    var EXPR = [
      { id: 'greet', ic: '👋', ar: 'التحيات', c: '#0055A5', items: [
        ['Bonjour, comment allez-vous ?', 'Salut ! Ça va ?', 'مرحبًا! كيف حالك؟'],
        ['Quelles sont les nouvelles ?', 'Quoi de neuf ?', 'ما الجديد؟'],
        ['Comment vas-tu ?', 'Ça roule ?', 'هل الأمور ماشية؟'],
        ['À bientôt.', 'À plus !', 'أراك قريبًا!'],
        ['Au revoir.', 'Ciao ! / Bye !', 'مع السلامة!'],
        ['Je suis content de te voir.', 'Ça fait plaisir de te voir !', 'سعيد برؤيتك!']] },
      { id: 'agree', ic: '👍', ar: 'الموافقة والرفض', c: '#16a34a', items: [
        ['Oui.', 'Ouais.', 'نعم (عامية)'],
        ['Absolument.', 'Carrément !', 'بالتأكيد!'],
        ['D\'accord.', 'D\'acc.', 'موافق'],
        ['Non.', 'Nan.', 'لا (عامية)'],
        ['Certainement pas.', 'Pas question !', 'مستحيل! لا أبدًا!'],
        ['Je n\'y crois pas.', 'Mon œil !', 'لا أصدّق ذلك! (كلام فارغ)'],
        ['Tout à fait.', 'Grave !', 'تمامًا! جدًّا!']] },
      { id: 'feel', ic: '😄', ar: 'المشاعر', c: '#db2777', items: [
        ['Je suis très fatigué.', 'Je suis crevé.', 'أنا مُنهَك'],
        ['Je n\'ai pas envie.', 'J\'ai la flemme.', 'أنا كسلان / ليس لدي رغبة'],
        ['J\'adore ça.', 'Je kiffe !', 'أنا أعشق ذلك'],
        ['Cela m\'ennuie.', 'Ça me saoule.', 'هذا يزعجني / أُصبت بالملل'],
        ['Je suis en pleine forme.', 'J\'ai la pêche !', 'أنا بكامل نشاطي'],
        ['J\'ai peur.', 'Je flippe.', 'أنا خائف'],
        ['C\'est incroyable !', 'C\'est ouf !', 'هذا جنون! لا يُصدَّق!'],
        ['Je suis déçu.', 'Je suis dég\'.', 'أنا محبَط']] },
      { id: 'work', ic: '💼', ar: 'العمل والمال', c: '#ea580c', items: [
        ['Travailler', 'Bosser', 'يعمل'],
        ['Le travail', 'Le boulot', 'الوظيفة / الشغل'],
        ['L\'argent', 'Le fric / Les thunes', 'المال'],
        ['Je n\'ai pas d\'argent.', 'Je suis fauché.', 'أنا مفلس'],
        ['C\'est très cher.', 'Ça coûte un bras !', 'هذا غالٍ جدًّا'],
        ['Ce n\'est pas bon marché.', 'C\'est pas donné.', 'السعر ليس رخيصًا'],
        ['Mon directeur', 'Mon patron', 'مديري / رئيسي في العمل']] },
      { id: 'daily', ic: '🏙️', ar: 'مواقف يومية', c: '#7c3aed', items: [
        ['Manger', 'Bouffer', 'يأكل'],
        ['La voiture', 'La bagnole', 'السيارة'],
        ['Un homme / Une femme', 'Un mec / Une meuf', 'رجل / امرأة (عامية)'],
        ['Un ami', 'Un pote', 'صديق'],
        ['Partir', 'Se casser', 'يرحل / يغادر'],
        ['Une chose', 'Un truc', 'شيء'],
        ['Tu as compris ?', 'Pigé ?', 'فهمت؟'],
        ['Le lycée', 'Le bahut', 'المدرسة الثانوية'],
        ['C\'est mauvais.', 'Ça craint.', 'هذا سيّئ']] }
    ];

    /* القسم 2: القواعد */
    var RULES = [
      { ic: '✂️', t: 'حذف النفي (Ne)', c: '#dc2626',
        d: 'في الكلام اليومي نحذف <b>ne / n\'</b> وننفي بـ <b>pas / rien / jamais</b> فقط.',
        ex: [['Je ne sais pas.', 'Je sais pas.', 'لا أعرف'], ['Ce n\'est pas grave.', 'C\'est pas grave.', 'لا بأس'], ['Il n\'y a pas de problème.', 'Y\'a pas de problème.', 'لا توجد مشكلة'], ['Je n\'ai rien dit.', 'J\'ai rien dit.', 'لم أقل شيئًا'], ['Il ne vient jamais.', 'Il vient jamais.', 'هو لا يأتي أبدًا']],
        tip: '⚠️ في الامتحان والكتابة الرسمية: لا تحذف <b>ne</b> أبدًا!' },
      { ic: '🔗', t: 'اختصار الضمائر (J\' / T\'es / I\')', c: '#7c3aed',
        d: 'ننطق الضمائر سريعًا فتُدمَج مع الفعل: <b>je → j\' / ch\'</b> ، <b>tu → t\'</b> ، <b>il → i\'</b>.',
        ex: [['Je suis fatigué.', 'J\'suis fatigué. / Chuis fatigué.', 'أنا متعب'], ['Tu es sympa.', 'T\'es sympa.', 'أنت لطيف'], ['Tu as faim ?', 'T\'as faim ?', 'هل أنت جائع؟'], ['Il faut partir.', 'I\' faut partir.', 'يجب أن نرحل'], ['Je ne sais pas.', 'Chais pas.', 'لا أدري'], ['Il y a un souci.', 'Y\'a un souci.', 'هناك مشكلة']],
        tip: '💡 الاختصار يحدث في النطق أكثر من الكتابة؛ اسمعه بالزر 🔊 وكرّر.' },
      { ic: '👥', t: 'استخدام On بدل Nous', c: '#0d9488',
        d: 'في الحديث اليومي نستعمل <b>on</b> بمعنى <b>nous</b> (نحن) ويُصرَّف الفعل مثل <b>il</b>.',
        ex: [['Nous allons au cinéma.', 'On va au ciné.', 'نحن ذاهبون إلى السينما'], ['Nous mangeons ensemble.', 'On mange ensemble.', 'نأكل معًا'], ['Allons-y !', 'On y va !', 'هيّا بنا!'], ['Nous sommes prêts.', 'On est prêts.', 'نحن مستعدون'], ['Nous avons fini.', 'On a fini.', 'لقد انتهينا']],
        tip: '📌 on + فعل المفرد: <i>on va, on est, on a, on fait</i> — لا تقل «on allons» ❌.' }
    ];

    /* القسم 3: الحوارات [المتحدث, الفرنسية, العربية] */
    var DIAL = [
      { ic: '☀️', t: 'لقاء صباحي', c: '#f59e0b', lines: [
        ['Karim', 'Salut Léa ! Ça va ?', 'مرحبًا ليا! كيف الحال؟'],
        ['Léa', 'Ouais, ça va. Et toi ? T\'as l\'air crevé.', 'نعم بخير. وأنت؟ تبدو منهكًا.'],
        ['Karim', 'Grave ! J\'ai pas dormi de la nuit.', 'جدًّا! لم أنم طوال الليل.'],
        ['Léa', 'Ah bon ? Pourquoi ?', 'حقًّا؟ لماذا؟'],
        ['Karim', 'J\'ai bossé sur mon exposé. Chuis dég\', il est pas fini.', 'كنت أعمل على عرضي. أنا محبط، لم ينتهِ بعد.'],
        ['Léa', 'Tkt, on va t\'aider. À plus !', 'لا تقلق، سنساعدك. إلى اللقاء!']],
        notes: ['<b>T\'as l\'air crevé</b> = Tu as l\'air fatigué (حذف u).', '<b>pas dormi</b> بدون ne.', '<b>On va t\'aider</b> = Nous allons t\'aider.'] },
      { ic: '🎬', t: 'التخطيط للخروج', c: '#0ea5e9', lines: [
        ['Sami', 'Alors, on fait quoi ce soir ?', 'إذن، ماذا سنفعل الليلة؟'],
        ['Nour', 'J\'sais pas… T\'as envie d\'aller au ciné ?', 'لا أدري… هل ترغب بالذهاب إلى السينما؟'],
        ['Sami', 'Carrément ! Mais j\'ai pas beaucoup de fric.', 'بالتأكيد! لكن ليس معي مال كثير.'],
        ['Nour', 'C\'est pas grave, c\'est pas donné mais y\'a une réduc pour les étudiants.', 'لا بأس، ليس رخيصًا لكن هناك خصم للطلاب.'],
        ['Sami', 'Cool ! On y va avec les potes ?', 'رائع! هل نذهب مع الأصدقاء؟'],
        ['Nour', 'Ouais, on se retrouve à huit heures.', 'نعم، نلتقي في الثامنة.']],
        notes: ['<b>J\'sais pas</b> = Je ne sais pas.', '<b>le fric</b> = l\'argent ، <b>les potes</b> = les amis.', '<b>une réduc</b> = une réduction (اختصار الكلمات).'] },
      { ic: '📚', t: 'مشكلة دراسية', c: '#db2777', lines: [
        ['Adam', 'Franchement, j\'ai rien compris au cours de maths.', 'بصراحة، لم أفهم شيئًا من درس الرياضيات.'],
        ['Inès', 'Moi non plus ! Le prof va trop vite, ça me saoule.', 'ولا أنا! الأستاذ سريع جدًّا، هذا يزعجني.'],
        ['Adam', 'Et l\'examen est demain. Je flippe.', 'والامتحان غدًا. أنا خائف.'],
        ['Inès', 'Y\'a pas de panique. On révise ensemble ce soir ?', 'لا داعي للهلع. هل نراجع معًا الليلة؟'],
        ['Adam', 'D\'acc ! T\'es la meilleure !', 'موافق! أنتِ الأفضل!'],
        ['Inès', 'Pigé ? On commence à sept heures. Pas de retard !', 'مفهوم؟ نبدأ في السابعة. بدون تأخير!']],
        notes: ['<b>j\'ai rien compris</b> = je n\'ai rien compris.', '<b>le prof</b> = le professeur ، <b>les maths</b> = les mathématiques.', '<b>Y\'a pas de panique</b> = Il n\'y a pas de panique.'] }
    ];

    /* القسم 4: اختصارات الرسائل [اختصار, الأصل, المعنى] */
    var SMS = [
      ['Bjr', 'Bonjour', 'صباح الخير / مرحبًا'], ['Slt', 'Salut', 'أهلًا'], ['Cc', 'Coucou', 'هاي!'],
      ['Tkt', 'T\'inquiète pas', 'لا تقلق'], ['Mdr', 'Mort de rire', 'أموت من الضحك (LOL)'], ['Ptdr', 'Pété de rire', 'أنفجر ضحكًا'],
      ['Stp', 'S\'il te plaît', 'من فضلك'], ['Pk', 'Pourquoi', 'لماذا'], ['Pcq', 'Parce que', 'لأن'],
      ['Jsp', 'Je sais pas', 'لا أعرف'], ['Dsl', 'Désolé(e)', 'آسف'], ['Bcp', 'Beaucoup', 'كثيرًا'],
      ['Tjrs', 'Toujours', 'دائمًا'], ['Qd', 'Quand', 'متى'], ['Rdv', 'Rendez-vous', 'موعد'],
      ['A+', 'À plus', 'أراك لاحقًا'], ['Mtn', 'Maintenant', 'الآن'], ['Biz', 'Bisous', 'قبلات / تحياتي'],
      ['2m1', 'Demain', 'غدًا'], ['Cad', 'C\'est-à-dire', 'أي أن'], ['Tt', 'Tout', 'كل'], ['Svp', 'S\'il vous plaît', 'من فضلكم']];
    var CHAT = [
      ['Inès', 'Slt ! Tu viens 2m1 ?', 'Salut ! Tu viens demain ?', 'مرحبًا! هل ستأتي غدًا؟', 0],
      ['Adam', 'Bjr ! Pk ? Y\'a quoi ?', 'Bonjour ! Pourquoi ? Qu\'est-ce qu\'il y a ?', 'صباح الخير! لماذا؟ ما الأمر؟', 1],
      ['Inès', 'Rdv chez moi pr réviser. Stp !', 'Rendez-vous chez moi pour réviser. S\'il te plaît !', 'موعد عندي للمراجعة. من فضلك!', 0],
      ['Adam', 'Mdr ok, tkt j\'viens 😂', 'Mort de rire, d\'accord, ne t\'inquiète pas, je viens.', 'هههه حسنًا، لا تقلقي، سآتي.', 1],
      ['Inès', 'Merci bcp ! A+', 'Merci beaucoup ! À plus !', 'شكرًا جزيلًا! أراك لاحقًا!', 0]];

    /* القسم 5: التمارين */
    var QS = [
      { t: 'tr', q: 'Je ne sais pas.', ans: ['j sais pas', 'je sais pas', 'chais pas', 'j sai pas'], ok: 'J\'sais pas.', exp: 'نحذف «ne» ونُدمج je → j\'.' },
      { t: 'tr', q: 'Il n\'y a pas de problème.', ans: ['y a pas de probleme', 'ya pas de probleme', 'il y a pas de probleme'], ok: 'Y\'a pas de problème.', exp: 'Il n\'y a → Y\'a.' },
      { t: 'tr', q: 'Nous allons au cinéma.', ans: ['on va au cinema', 'on va au cine'], ok: 'On va au cinéma.', exp: 'on + va (فعل المفرد).' },
      { t: 'tr', q: 'Tu es fatigué.', ans: ['t es fatigue', 'tes fatigue'], ok: 'T\'es fatigué.', exp: 'Tu es → T\'es.' },
      { t: 'tr', q: 'Ce n\'est pas grave.', ans: ['c est pas grave', 'c pas grave', 'cest pas grave'], ok: 'C\'est pas grave.', exp: 'نحذف «n\'» فقط.' },
      { t: 'tr', q: 'Je n\'ai rien dit.', ans: ['j ai rien dit', 'jai rien dit'], ok: 'J\'ai rien dit.', exp: 'حذف ne مع بقاء rien.' },
      { t: 'mcq', q: 'ماذا تعني «Tkt» ؟', opts: ['Ne t\'inquiète pas', 'À tout à l\'heure', 'Merci beaucoup', 'Je ne sais pas'], a: 0, exp: 'Tkt = T\'inquiète pas.' },
      { t: 'mcq', q: '«Mdr» تعني:', opts: ['Merci de répondre', 'Mort de rire', 'Mon dernier rendez-vous', 'Mais de rien'], a: 1, exp: 'Mdr = Mort de rire (LOL).' },
      { t: 'mcq', q: '«Bouffer» في العامية تعني:', opts: ['Dormir', 'Courir', 'Manger', 'Parler'], a: 2, exp: 'Bouffer = manger.' },
      { t: 'mcq', q: '«Le fric» هو:', opts: ['Le frigo', 'L\'argent', 'Le froid', 'Le frère'], a: 1, exp: 'Le fric = l\'argent.' },
      { t: 'mcq', q: 'أي جملة عامية (familière)؟', opts: ['Je ne suis pas d\'accord.', 'Il n\'y a aucun problème.', 'T\'es sérieux ? C\'est ouf !', 'Nous sommes très contents.'], a: 2, exp: 'T\'es + C\'est ouf = أسلوب عامي.' },
      { t: 'mcq', q: '«Bjr» تعني:', opts: ['Bonsoir', 'Bonjour', 'Bon retour', 'Bientôt'], a: 1, exp: 'Bjr = Bonjour.' },
      { t: 'mcq', q: 'قل بالعامية: «Je suis très fatigué»', opts: ['Je suis crevé.', 'Je suis fauché.', 'J\'ai la pêche.', 'Je kiffe.'], a: 0, exp: 'Crevé = منهك. (fauché = مفلس، la pêche = نشيط)' },
      { t: 'mcq', q: '«Un pote» هو:', opts: ['Un professeur', 'Un ami', 'Un voisin', 'Un cadeau'], a: 1, exp: 'Un pote = un ami.' }
    ];

    /* ======================= التنسيق ======================= */
    var st = document.createElement('style');
    st.textContent =
      '.ag{color:#1b2a3a;direction:rtl;font-family:inherit}.ag *{box-sizing:border-box}.ag button{font-family:inherit;cursor:pointer}' +
      '.ag-hero{border-radius:22px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#1e1b4b,#4338ca 50%,#be185d);box-shadow:0 10px 30px rgba(67,56,202,.35);margin-bottom:12px}.ag-hero h3{margin:2px 0;font-size:1.35rem}.ag-hero p{margin:4px 0 0;font-size:.85rem;opacity:.92}' +
      '.ag-tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ag-tabs::-webkit-scrollbar{display:none}' +
      '.ag-tabs button{flex:none;border:0;border-radius:14px;padding:10px 13px;font-weight:800;font-size:.85rem;background:#e8eef6;color:#33475b;transition:.2s;white-space:nowrap}.ag-tabs button.on{background:linear-gradient(135deg,#0055A5,#7c3aed);color:#fff;box-shadow:0 6px 16px rgba(0,85,165,.35);transform:translateY(-1px)}' +
      '.ag-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:4px;scrollbar-width:none}.ag-chips::-webkit-scrollbar{display:none}.ag-chips button{flex:none;border:1px solid #d6e2f0;border-radius:20px;padding:8px 13px;background:#fff;font-weight:700;font-size:.82rem;color:#33475b}.ag-chips button.on{background:var(--c,#7c3aed);border-color:var(--c,#7c3aed);color:#fff}' +
      '.ag-sp{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:#eef2ff;font-size:1rem;transition:.15s;padding:0}.ag-sp:active{transform:scale(.88)}.ag-sp.sm{width:30px;height:30px;font-size:.85rem}.ag-sp.pl{background:#fde047}' +
      '.ag-card{background:#fff;border:1px solid #d6e2f0;border-top:4px solid var(--c,#7c3aed);border-radius:16px;padding:12px;margin-bottom:10px;box-shadow:0 3px 10px rgba(0,0,0,.06);animation:agIn .3s both}@keyframes agIn{from{opacity:0;transform:translateY(8px)}}' +
      '.ag-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.ag-row .tx{flex:1;min-width:0}' +
      '.ag-no{font-size:.92rem;color:#8a97a6;text-decoration:line-through;text-decoration-color:#dc2626;direction:ltr;text-align:left;word-break:break-word}.ag-no b{color:#dc2626;text-decoration:none;display:inline-block;margin-inline-end:4px;font-size:.75rem}' +
      '.ag-yes{font-size:1.15rem;font-weight:900;color:#0055A5;direction:ltr;text-align:left;word-break:break-word;margin:3px 0}.ag-yes b{color:#16a34a;font-size:.75rem;display:inline-block;margin-inline-end:4px}' +
      '.ag-ar{color:#5d6b7a;font-size:.9rem;margin-top:2px}' +
      '.ag-hd{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;margin-bottom:6px}.ag-hd i{font-style:normal;font-size:1.5rem}' +
      '.ag-p{margin:4px 0 8px;line-height:1.8;font-size:.92rem}.ag-tip{background:#fff7ed;border-right:4px solid #f59e0b;border-radius:12px;padding:8px 10px;font-size:.85rem;margin-top:8px;line-height:1.7}' +
      '.ag-ex{border-top:1px dashed #d6e2f0;padding:8px 0}.ag-ex:first-of-type{border-top:0}' +
      '.ag-d{display:flex;flex-direction:column;gap:8px;margin:8px 0}.ag-b{max-width:92%;border-radius:16px;padding:8px 10px;position:relative}.ag-b.l{align-self:flex-start;background:#eef2ff;border-bottom-left-radius:4px}.ag-b.r{align-self:flex-end;background:#dcfce7;border-bottom-right-radius:4px}' +
      '.ag-b small{display:block;font-weight:800;color:#7c3aed;margin-bottom:2px;direction:ltr;text-align:left}.ag-b .f{direction:ltr;text-align:left;font-weight:700;color:#0b3d75;line-height:1.5}.ag-b .a{font-size:.85rem;color:#5d6b7a;margin-top:3px}' +
      '.ag-b .bt{display:flex;align-items:flex-start;gap:6px}.ag-b .bt>div{flex:1;min-width:0}' +
      '.ag-notes{margin:8px 0 0;padding:0 18px 0 0;font-size:.85rem;line-height:1.9;color:#33475b}' +
      '.ag-tbl{width:100%;border-collapse:collapse;font-size:.88rem;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.06)}.ag-tbl th{background:#0055A5;color:#fff;padding:8px 6px;font-size:.8rem}.ag-tbl td{padding:8px 6px;border-top:1px solid #e2e8f0;vertical-align:middle}.ag-tbl tr:nth-child(even) td{background:#f8fafc}.ag-tbl .ab{font-weight:900;color:#be185d;direction:ltr;text-align:left;white-space:nowrap}.ag-tbl .fu{direction:ltr;text-align:left;color:#0055A5;font-weight:700}' +
      '.ag-chat{background:#e5ddd5;border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:6px}.ag-m{max-width:86%;border-radius:12px;padding:6px 10px;font-size:.92rem;direction:ltr;text-align:left;box-shadow:0 1px 2px rgba(0,0,0,.15)}.ag-m.me{align-self:flex-end;background:#d9fdd3}.ag-m.ot{align-self:flex-start;background:#fff}.ag-m b{display:block;font-size:.72rem;color:#7c3aed}.ag-m .dc{display:none;border-top:1px dashed #cbd5e1;margin-top:5px;padding-top:4px;font-size:.8rem;color:#475569}.ag-m .dc div{direction:rtl;text-align:right;margin-top:2px}.ag-m.open .dc{display:block}.ag-m .rw{display:flex;align-items:flex-end;gap:6px}.ag-m .rw span{flex:1;font-weight:600;cursor:pointer}' +
      '.ag-btn{border:0;border-radius:24px;padding:11px 22px;margin:5px;font-weight:900;background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12;font-size:.95rem}.ag-btn.g{background:#e8eef6;color:#33475b}.ag-btn:disabled{opacity:.5}' +
      '.ag-ex-box{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:14px;color:#fff;box-shadow:0 10px 28px rgba(49,46,129,.4)}.ag-hud{display:flex;justify-content:space-between;font-weight:800;font-size:.88rem;margin-bottom:8px}.ag-hud b{background:rgba(255,255,255,.18);border-radius:12px;padding:4px 10px}.ag-bar{height:8px;border-radius:6px;background:rgba(255,255,255,.2);overflow:hidden;margin-bottom:12px}.ag-bar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#fde047);transition:width .3s}' +
      '.ag-qt{text-align:center;margin:6px 0 12px}.ag-qt .lbl{font-size:.82rem;opacity:.85}.ag-qt .big{font-size:1.5rem;font-weight:900;margin-top:4px;word-break:break-word}.ag-qt .big.fr{direction:ltr}' +
      '.ag-opts{display:grid;grid-template-columns:1fr;gap:8px}.ag-opt{border:2px solid rgba(255,255,255,.28);border-radius:14px;padding:12px 8px;background:rgba(255,255,255,.12);color:#fff;font-weight:800;font-size:.98rem;transition:.15s;direction:ltr;word-break:break-word}.ag-opt:active{transform:scale(.97)}.ag-opt.ok{background:#16a34a;border-color:#bbf7d0}.ag-opt.no{background:#dc2626;border-color:#fecaca}' +
      '.ag-type{display:flex;gap:8px}.ag-type input{flex:1;min-width:0;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;border-radius:14px;padding:12px;font-size:1.05rem;direction:ltr;font-family:inherit}.ag-type input::placeholder{color:rgba(255,255,255,.6)}.ag-type button{border:0;border-radius:14px;padding:0 16px;background:linear-gradient(135deg,#fde047,#fb923c);font-weight:900;color:#7c2d12}' +
      '.ag-msg{min-height:48px;text-align:center;font-weight:800;margin-top:12px;font-size:.92rem;line-height:1.7}.ag-msg small{display:block;font-weight:600;opacity:.9}' +
      '.ag-end{text-align:center;padding:6px}.ag-end .stars{font-size:2.4rem;letter-spacing:6px}.ag-end .sc{font-size:2.2rem;font-weight:900;color:#fde047}' +
      '.ag-rev{background:rgba(255,255,255,.12);border-radius:14px;padding:8px 10px;margin:6px 0;text-align:right;font-size:.85rem;line-height:1.7}.ag-rev .fr{direction:ltr;text-align:left;font-weight:800}';
    document.head.appendChild(st);

    /* ======================= العرض ======================= */
    var S = { tab: 'expr', cat: 'greet', rule: 0, dial: 0, ex: null };
    var TABS = [['expr', '💬 التعبيرات'], ['rules', '🗣️ قواعد النطق'], ['dial', '🎭 الحوارات'], ['sms', '📱 الرسائل'], ['ex', '🎯 التمارين']];
    var ROOT = null;

    function vExpr() {
      var cat = EXPR.filter(function (c) { return c.id === S.cat; })[0] || EXPR[0];
      var h = '<div class="ag-chips">' + EXPR.map(function (c) { return '<button type="button" class="' + (c.id === cat.id ? 'on' : '') + '" data-cat="' + c.id + '" style="--c:' + c.c + '">' + c.ic + ' ' + c.ar + '</button>'; }).join('') + '</div>';
      h += '<div style="font-size:.8rem;color:#5d6b7a;margin:0 0 8px">✅ قُل (عامية) · ❌ لا تقل (رسمي) — اضغط 🔊 للاستماع</div>';
      h += cat.items.map(function (it, i) {
        return '<div class="ag-card" style="--c:' + cat.c + ';animation-delay:' + Math.min(i, 10) * 30 + 'ms">' +
          '<div class="ag-row"><div class="tx"><div class="ag-yes"><b>✅ قُل</b>' + esc(it[1]) + '</div></div>' + sp(it[1]) + '</div>' +
          '<div class="ag-row"><div class="tx"><div class="ag-no"><b>❌ لا تقل</b>' + esc(it[0]) + '</div></div>' + sp(it[0], 'sm') + '</div>' +
          '<div class="ag-ar">🔸 ' + esc(it[2]) + '</div></div>';
      }).join('');
      return h;
    }
    function vRules() {
      var r = RULES[S.rule] || RULES[0];
      var h = '<div class="ag-chips">' + RULES.map(function (x, i) { return '<button type="button" class="' + (i === S.rule ? 'on' : '') + '" data-rule="' + i + '" style="--c:' + x.c + '">' + x.ic + ' ' + x.t.split(' (')[0] + '</button>'; }).join('') + '</div>';
      h += '<div class="ag-card" style="--c:' + r.c + '"><div class="ag-hd"><i>' + r.ic + '</i>' + esc(r.t) + '</div><div class="ag-p">' + r.d + '</div>';
      h += r.ex.map(function (e) {
        return '<div class="ag-ex"><div class="ag-row"><div class="tx"><div class="ag-no"><b>❌</b>' + esc(e[0]) + '</div><div class="ag-yes"><b>✅</b>' + esc(e[1]) + '</div></div>' + sp(e[1]) + '</div><div class="ag-ar">🔸 ' + esc(e[2]) + '</div></div>';
      }).join('');
      h += '<div class="ag-tip">' + r.tip + '</div></div>';
      h += '<div style="text-align:center"><button type="button" class="ag-btn g" data-rule="' + ((S.rule + 1) % RULES.length) + '">القاعدة التالية ⬅</button></div>';
      return h;
    }
    function vDial() {
      var d = DIAL[S.dial] || DIAL[0];
      var h = '<div class="ag-chips">' + DIAL.map(function (x, i) { return '<button type="button" class="' + (i === S.dial ? 'on' : '') + '" data-dial="' + i + '" style="--c:' + x.c + '">' + x.ic + ' ' + x.t + '</button>'; }).join('') + '</div>';
      h += '<div class="ag-card" style="--c:' + d.c + '"><div class="ag-hd"><i>' + d.ic + '</i>' + esc(d.t) + '</div><div class="ag-d">';
      var first = d.lines[0][0];
      h += d.lines.map(function (l) {
        return '<div class="ag-b ' + (l[0] === first ? 'l' : 'r') + '"><small>' + esc(l[0]) + '</small><div class="bt"><div><div class="f">' + esc(l[1]) + '</div><div class="a">' + esc(l[2]) + '</div></div>' + sp(l[1], 'sm') + '</div></div>';
      }).join('');
      h += '</div><div style="text-align:center"><button type="button" class="ag-btn" data-playd="1">▶ استمع للحوار كاملًا</button></div>';
      h += '<div class="ag-tip"><b>📝 شرح:</b><ul class="ag-notes">' + d.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul></div></div>';
      return h;
    }
    function vSms() {
      var h = '<div class="ag-card" style="--c:#0891b2"><div class="ag-hd"><i>📱</i>اختصارات الرسائل (SMS Slang)</div><div style="overflow-x:auto"><table class="ag-tbl"><thead><tr><th>الاختصار</th><th>الأصل</th><th>المعنى</th><th></th></tr></thead><tbody>';
      h += SMS.map(function (r) { return '<tr><td class="ab">' + esc(r[0]) + '</td><td class="fu">' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + sp(r[1], 'sm') + '</td></tr>'; }).join('');
      h += '</tbody></table></div></div>';
      h += '<div class="ag-card" style="--c:#16a34a"><div class="ag-hd"><i>💬</i>محادثة واتساب مصغّرة</div><div style="font-size:.8rem;color:#5d6b7a;margin-bottom:6px">اضغط على الرسالة لرؤية الفرنسية الكاملة والترجمة</div><div class="ag-chat">';
      h += CHAT.map(function (m) {
        return '<div class="ag-m ' + (m[4] ? 'me' : 'ot') + '"><b>' + esc(m[0]) + '</b><div class="rw"><span data-tg="1">' + esc(m[1]) + '</span>' + sp(m[2], 'sm') + '</div><div class="dc">' + esc(m[2]) + '<div>' + esc(m[3]) + '</div></div></div>';
      }).join('');
      h += '</div></div>';
      return h;
    }
    function vEx() {
      var E = S.ex;
      if (!E) {
        return '<div class="ag-hero" style="background:linear-gradient(135deg,#065f46,#0d9488 50%,#2563eb)"><div style="font-size:2.4rem">🎯</div><h3>تمارين تفاعلية</h3><p>تحويل جمل واختيار من متعدد — تصحيح تلقائي ونتيجة فورية</p></div>' +
          '<div style="text-align:center"><button type="button" class="ag-btn" data-start="10">🚀 ابدأ (10 أسئلة)</button><button type="button" class="ag-btn g" data-start="' + QS.length + '">📚 كل الأسئلة (' + QS.length + ')</button></div>';
      }
      if (E.i >= E.list.length) {
        var stars = E.ok / E.list.length >= 0.9 ? 3 : E.ok / E.list.length >= 0.7 ? 2 : E.ok / E.list.length >= 0.5 ? 1 : 0;
        var msg = stars === 3 ? '🏆 ممتاز! أنت تتكلم كالفرنسيين' : stars === 2 ? '👏 رائع! استمر' : stars === 1 ? '👍 جيد، راجع الأخطاء' : '💪 لا بأس، حاول مرة أخرى';
        return '<div class="ag-ex-box"><div class="ag-end"><div class="stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div><div class="sc">' + E.ok + ' / ' + E.list.length + '</div><p>' + msg + '</p><p style="font-size:.85rem">النسبة: ' + Math.round(E.ok * 100 / E.list.length) + '%</p></div>' +
          (E.wrong.length ? '<div style="font-weight:800;margin:6px 0">📝 راجع أخطاءك:</div>' + E.wrong.map(function (w) { return '<div class="ag-rev"><div>' + (w.t === 'tr' ? 'حوّل: ' : '') + '<span class="fr">' + esc(w.q) + '</span></div><div>✅ <span class="fr">' + esc(w.t === 'tr' ? w.ok : w.opts[w.a]) + '</span></div><div style="opacity:.85">' + esc(w.exp) + '</div></div>'; }).join('') : '') +
          '<div style="text-align:center;margin-top:8px"><button type="button" class="ag-btn" data-start="' + E.list.length + '">🔁 أعد المحاولة</button><button type="button" class="ag-btn g" data-start="0">🏠 القائمة</button></div></div>';
      }
      var q = E.list[E.i], h = '<div class="ag-ex-box"><div class="ag-hud"><b>' + (E.i + 1) + ' / ' + E.list.length + '</b><b>✅ ' + E.ok + '</b></div><div class="ag-bar"><i style="width:' + (E.i / E.list.length * 100) + '%"></i></div><div class="ag-qt">';
      if (q.t === 'tr') h += '<div class="lbl">حوّل إلى العامية (Langage familier):</div><div class="big fr">' + esc(q.q) + '</div><div style="margin-top:6px">' + sp(q.q, 'sm') + '</div></div><div class="ag-type"><input id="ag-in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="اكتب بالفرنسية…"' + (E.done ? ' disabled' : '') + '><button type="button" data-chk="1"' + (E.done ? ' disabled' : '') + '>تحقق</button></div>';
      else h += '<div class="big">' + esc(q.q) + '</div></div><div class="ag-opts">' + q.opts.map(function (o, i) { return '<button type="button" class="ag-opt' + (E.done ? (i === q.a ? ' ok' : i === E.pick ? ' no' : '') : '') + '" data-opt="' + i + '"' + (E.done ? ' disabled' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>';
      h += '<div class="ag-msg">' + (E.fb || '') + '</div>';
      if (E.done) h += '<div style="text-align:center"><button type="button" class="ag-btn" data-next="1">' + (E.i + 1 >= E.list.length ? '🏁 النتيجة' : 'التالي ➡') + '</button></div>';
      h += '</div>';
      return h;
    }

    function render(keepFocus) {
      var body = { expr: vExpr, rules: vRules, dial: vDial, sms: vSms, ex: vEx }[S.tab]();
      ROOT.innerHTML = '<div class="ag"><div class="ag-hero"><div style="font-size:2.2rem">🗣️</div><h3>العامية الفرنسية · L\'Argot</h3><p>تكلّم كما يتكلم الفرنسيون في حياتهم اليومية 🇫🇷</p></div>' +
        '<div class="ag-tabs">' + TABS.map(function (t) { return '<button type="button" data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="ag-body">' + body + '</div>' +
        '<div class="ag-tip" style="margin-top:12px">ℹ️ العامية للمحادثة والرسائل فقط — في الامتحان استخدم الفرنسية الرسمية.</div></div>';
      if (S.tab === 'ex' && S.ex && S.ex.list[S.ex.i] && S.ex.list[S.ex.i].t === 'tr' && !S.ex.done) { var inp = $('#ag-in', ROOT); if (inp && keepFocus !== false) { try { inp.focus(); } catch (e) {} } }
    }

    /* ======================= التمارين ======================= */
    function startEx(n) {
      if (!n) { S.ex = null; render(); return; }
      var list = shuffle(QS).slice(0, n).map(function (q) { var c = {}; for (var k in q) c[k] = q[k]; if (c.t === 'mcq') { var right = c.opts[c.a]; c.opts = shuffle(c.opts); c.a = c.opts.indexOf(right); } return c; });
      S.ex = { list: list, i: 0, ok: 0, wrong: [], done: false, fb: '', pick: -1 };
      render();
    }
    function finish(ok, q, pick) {
      var E = S.ex; if (!E || E.done) return; E.done = true; E.pick = pick;
      if (ok) { E.ok++; sOk(); boost(10000); E.fb = '🎉 أحسنت!<small>' + esc(q.exp) + '</small>'; }
      else { sBad(); E.wrong.push(q); E.fb = '❌ الصواب: <span dir="ltr">' + esc(q.t === 'tr' ? q.ok : q.opts[q.a]) + '</span><small>' + esc(q.exp) + '</small>'; }
      render(false);
      if (q.t === 'tr') say(q.ok); else say(q.opts[q.a]);
    }
    function checkTr() {
      var E = S.ex, q = E && E.list[E.i], inp = $('#ag-in', ROOT); if (!q || E.done || !inp) return;
      var v = norm(inp.value); if (!v) return;
      finish(q.ans.indexOf(v) > -1, q, -1);
    }

    /* ======================= الأحداث ======================= */
    var dlgTimer = null;
    function playDialog() {
      var d = DIAL[S.dial], i = 0; if (!d || !window.speechSynthesis) return;
      var btn = $('[data-playd]', ROOT); if (dlgTimer) { dlgTimer = null; try { speechSynthesis.cancel(); } catch (e) {} if (btn) btn.textContent = '▶ استمع للحوار كاملًا'; return; }
      dlgTimer = 1; if (btn) btn.textContent = '⏹ إيقاف';
      (function step() {
        if (!dlgTimer || i >= d.lines.length) { dlgTimer = null; var b = $('[data-playd]', ROOT); if (b) b.textContent = '▶ استمع للحوار كاملًا'; return; }
        try {
          speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(d.lines[i++][1]); u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = 0.9;
          u.onend = u.onerror = function () { setTimeout(step, 400); };
          speechSynthesis.speak(u);
        } catch (e) { dlgTimer = null; }
      })();
    }
    function stopAll() { dlgTimer = null; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

    function bind() {
      ROOT.addEventListener('click', function (e) {
        var t = e.target, b;
        if ((b = t.closest('[data-say]'))) { e.stopPropagation(); say(b.getAttribute('data-say')); return; }
        if ((b = t.closest('[data-tab]'))) { stopAll(); S.tab = b.dataset.tab; render(); return; }
        if ((b = t.closest('[data-cat]'))) { S.cat = b.dataset.cat; render(); return; }
        if ((b = t.closest('[data-rule]'))) { S.rule = +b.dataset.rule; render(); return; }
        if ((b = t.closest('[data-dial]'))) { stopAll(); S.dial = +b.dataset.dial; render(); return; }
        if (t.closest('[data-playd]')) { playDialog(); return; }
        if ((b = t.closest('[data-tg]'))) { var m = b.closest('.ag-m'); if (m) m.classList.toggle('open'); return; }
        if ((b = t.closest('[data-start]'))) { startEx(+b.dataset.start); return; }
        if (t.closest('[data-chk]')) { checkTr(); return; }
        if ((b = t.closest('[data-opt]'))) { var E = S.ex, i = +b.dataset.opt; if (E && !E.done) { var q = E.list[E.i]; finish(i === q.a, q, i); } return; }
        if (t.closest('[data-next]')) { var E2 = S.ex; if (E2) { E2.i++; E2.done = false; E2.fb = ''; E2.pick = -1; if (E2.i >= E2.list.length) sWin(); render(); } return; }
      });
      ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'ag-in') checkTr(); });
    }

    /* ======================= الإقلاع والتركيب ======================= */
    function mount(el) {
      if (ROOT) return; ROOT = el; ROOT.setAttribute('data-argot', '1'); bind(); render();
    }
    function findCard() {
      var all = $$('body *'), i, el;
      for (i = 0; i < all.length; i++) {
        el = all[i]; if (el.children.length > 0 || el.closest('script,style')) continue;
        if ((el.textContent || '').indexOf('قيد الإعداد') > -1) {
          var host = el.closest('[id*="argot" i],[data-section*="argot" i],[id*="slang" i]');
          if (!host) { var s = el.closest('section,.section,.page,.view'); if (s && /argot|العامية/i.test((s.id || '') + ' ' + (s.textContent || '').slice(0, 400))) host = s; }
          if (host) return { leaf: el, host: host };
        }
      }
      return null;
    }
    function tryMount() {
      if (ROOT) return true;
      var r = document.getElementById('argot-root') || $('[data-argot-root]');
      if (r) { mount(r); return true; }
      var f = findCard();
      if (f) {
        var card = f.leaf, p = card;
        while (p.parentElement && p.parentElement !== f.host && p.parentElement !== document.body) { if (/card|empty|soon|placeholder|box/i.test(p.className || '')) break; p = p.parentElement; }
        var holder = document.createElement('div'); holder.id = 'argot-root';
        if (p.parentNode) { p.parentNode.insertBefore(holder, p); p.style.display = 'none'; }
        mount(holder); return true;
      }
      return false;
    }
    if (!tryMount()) {
      var n = 0, iv = setInterval(function () { if (tryMount() || ++n > 40) clearInterval(iv); }, 500);
      try { new MutationObserver(function () { if (tryMount()) this.disconnect(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
  }
})();
