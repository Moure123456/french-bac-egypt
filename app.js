/* ===== Le Français Au Bac — app.js (النسخة الكاملة + قواعد مدمجة احتياطية) ===== */
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

  /* ---------- القواعد المدمجة (احتياطي يُستخدم فقط إذا فشل جلب grammar.json) ---------- */
  const R = (title_fr, title_ar, explanation_ar, examples) => ({ title_fr, title_ar, explanation_ar, examples: examples.map(([fr, ar]) => ({ fr, ar })) });
  const FALLBACK_GRAMMAR = {
    levels: {
      '1sec': {
        rules: [
          R('Les articles', 'أدوات التعريف والتنكير',
            'المعرّفة: le (مذكر) / la (مؤنث) / l\' (قبل حرف متحرك) / les (جمع). غير المعرّفة: un / une / des. الجزئية: du / de la / de l\' / des. الاندماج: à + le = au ، à + les = aux ، de + le = du ، de + les = des.',
            [['Le garçon est ici.', 'الولد هنا.'], ['J\'ai un livre et une gomme.', 'عندي كتاب وممحاة.'], ['Je vais au cinéma.', 'أذهب إلى السينما.']]),
          R('Être et Avoir au présent', 'الفعلان المساعدان être و avoir',
            'être: je suis, tu es, il est, nous sommes, vous êtes, ils sont. avoir: j\'ai, tu as, il a, nous avons, vous avez, ils ont. يُستخدمان وحدهما أو كمساعدين في الأزمنة المركبة.',
            [['Je suis étudiant.', 'أنا طالب.'], ['Elle est égyptienne.', 'هي مصرية.'], ['Nous avons un examen demain.', 'عندنا امتحان غداً.']]),
          R('Le présent de l\'indicatif', 'المضارع (الحاضر)',
            'المجموعة الأولى (-er): -e, -es, -e, -ons, -ez, -ent مثل parler. المجموعة الثانية (-ir): -is, -is, -it, -issons, -issez, -issent مثل finir. أفعال شاذة مهمة: aller, faire, prendre, venir, pouvoir, vouloir.',
            [['Je parle français.', 'أتكلم الفرنسية.'], ['Nous finissons le travail.', 'ننهي العمل.'], ['Ils vont à l\'école.', 'هم يذهبون إلى المدرسة.']]),
          R('La négation', 'النفي',
            'النفي الأساسي ne ... pas يحيط بالفعل، وتصبح ne ← n\' قبل حرف متحرك. بعد النفي: un / une / des / du ← de. أدوات أخرى: ne ... jamais (أبداً) ، ne ... plus (لم يعد) ، ne ... rien (لا شيء) ، ne ... personne (لا أحد).',
            [['Je ne mange pas de viande.', 'لا آكل لحماً.'], ['Il n\'a jamais menti.', 'لم يكذب أبداً.'], ['Elle ne travaille plus.', 'لم تعد تعمل.']]),
          R('Le féminin des adjectifs', 'تأنيث الصفات',
            'القاعدة العامة: نضيف e للمذكر. -er ← -ère ، -eux ← -euse ، -if ← -ive ، -on ← -onne ، -el ← -elle. صفات مثل jeune و rapide لا تتغير لأنها تنتهي بـ e. والصفة تتوافق مع الاسم نوعاً وعدداً.',
            [['Un élève sérieux, une élève sérieuse.', 'تلميذ مجتهد، تلميذة مجتهدة.'], ['Mon amie est contente.', 'صديقتي سعيدة.']]),
          R('Le pluriel des noms', 'جمع الأسماء',
            'القاعدة العامة: نضيف s. الأسماء المنتهية بـ -s, -x, -z لا تتغير. -au / -eau / -eu ← + x. -al ← -aux. -ou ← + s إلا: bijou, chou, genou, caillou, hibou, joujou, pou ← + x.',
            [['un livre, des livres', 'كتاب، كتب.'], ['un cheval, des chevaux', 'حصان، خيول.'], ['un bijou, des bijoux', 'جوهرة، مجوهرات.']])
        ]
      },
      '2sec': {
        rules: [
          R('Le passé composé', 'الماضي المركب',
            'يعبّر عن حدث انتهى في الماضي. التكوين: مساعد (avoir أو être) في المضارع + اسم المفعول. مع être: أفعال الحركة (aller, venir, partir, arriver, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, devenir) والانعكاسية، ويتوافق اسم المفعول مع الفاعل. اسم المفعول: -er ← é ، -ir ← i ، والشواذ: eu, été, fait, pris, vu, dit, mis.',
            [['J\'ai mangé une pomme.', 'أكلتُ تفاحة.'], ['Elle est allée à l\'école.', 'ذهبت إلى المدرسة.'], ['Nous sommes arrivés tôt.', 'وصلنا مبكرين.']]),
          R('L\'imparfait', 'الماضي الناقص (المستمر)',
            'للعادات في الماضي والوصف والأحداث المستمرة. القاعدة: جذر nous في المضارع (بدون -ons) + النهايات -ais, -ais, -ait, -ions, -iez, -aient. الاستثناء: être ← j\'étais.',
            [['Quand j\'étais petit, je jouais au parc.', 'عندما كنت صغيراً كنت ألعب في الحديقة.'], ['Il faisait beau.', 'كان الجو جميلاً.']]),
          R('Le futur simple', 'المستقبل البسيط',
            'القاعدة: المصدر (infinitif) + النهايات -ai, -as, -a, -ons, -ez, -ont. جذور شاذة: être ← ser- ، avoir ← aur- ، aller ← ir- ، faire ← fer- ، venir ← viendr- ، pouvoir ← pourr- ، voir ← verr-. المستقبل القريب: aller + مصدر.',
            [['Demain, j\'irai au Caire.', 'غداً سأذهب إلى القاهرة.'], ['Je vais étudier ce soir.', 'سأذاكر هذا المساء.']]),
          R('L\'interrogation', 'الاستفهام',
            'ثلاث طرق: بالتنغيم (Tu viens ؟) ، بعبارة Est-ce que ، أو بقلب الفاعل (Viens-tu ؟). أدوات الاستفهام: qui (من) ، que (ماذا) ، où (أين) ، quand (متى) ، comment (كيف) ، pourquoi (لماذا) ، combien (كم).',
            [['Où habites-tu ?', 'أين تسكن؟'], ['Pourquoi est-ce que tu pleures ?', 'لماذا تبكي؟'], ['Combien coûte ce livre ?', 'كم يكلف هذا الكتاب؟']]),
          R('Les pronoms COD et COI', 'ضمائر المفعول به',
            'تحل محل الاسم لتجنب التكرار وتوضع قبل الفعل. COD: le, la, l\', les. COI (مع à): lui, leur. y تحل محل à + مكان أو شيء، و en تحل محل de + شيء أو كمية.',
            [['Je regarde le film. Je le regarde.', 'أشاهد الفيلم. أشاهده.'], ['Elle écrit à Paul. Elle lui écrit.', 'تكتب لبول. تكتب له.'], ['J\'y vais. J\'en mange.', 'أذهب إلى هناك. آكل منه.']]),
          R('Le comparatif et le superlatif', 'المقارنة والتفضيل',
            'plus ... que (أكثر من) ، moins ... que (أقل من) ، aussi ... que (مثل). التفضيل: le / la / les + plus / moins + صفة. حالات خاصة: bon ← meilleur ، bien ← mieux.',
            [['Marie est plus grande que Pau
