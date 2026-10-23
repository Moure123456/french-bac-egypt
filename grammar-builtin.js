/* ===== قواعد مدمجة: شرح + ترجمة + نطق ===== */
(function () {
  'use strict';
  const T = (c, rows) => ({ c, rows });
  const G = [
    { title: "Les articles", title_ar: "أدوات التعريف والتنكير", level: "1Sec",
      explain: "الاسم في الفرنسية مذكر أو مؤنث، وتسبقه أداة تدل على نوعه وعدده.",
      points: [
        "المعرّفة: le (مذكر) / la (مؤنث) / l' (قبل حرف متحرك أو h) / les (جمع).",
        "غير المعرّفة: un (مذكر) / une (مؤنث) / des (جمع).",
        "الجزئية (كمية غير محددة): du / de la / de l' / des.",
        "الاندماج: à + le = au ، à + les = aux ، de + le = du ، de + les = des."
      ],
      examples: [
        { fr: "Le garçon est ici.", ar: "الولد هنا." },
        { fr: "La table est grande.", ar: "الطاولة كبيرة." },
        { fr: "J'ai un livre et une gomme.", ar: "عندي كتاب وممحاة." },
        { fr: "Je mange du pain et de la salade.", ar: "آكل خبزاً وسلطة." },
        { fr: "Je vais au cinéma.", ar: "أذهب إلى السينما." }
      ] },

    { title: "Être et Avoir au présent", title_ar: "الفعلان المساعدان être و avoir", level: "1Sec",
      explain: "فعلان أساسيان يُستخدمان وحدهما أو كمساعدين في الأزمنة المركبة. يجب حفظهما.",
      tables: [
        T("être (يكون)", [["je", "suis"], ["tu", "es"], ["il / elle", "est"], ["nous", "sommes"], ["vous", "êtes"], ["ils / elles", "sont"]]),
        T("avoir (يملك)", [["j'", "ai"], ["tu", "as"], ["il / elle", "a"], ["nous", "avons"], ["vous", "avez"], ["ils / elles", "ont"]])
      ],
      examples: [
        { fr: "Je suis étudiant.", ar: "أنا طالب." },
        { fr: "Elle est égyptienne.", ar: "هي مصرية." },
        { fr: "Nous avons un examen demain.", ar: "عندنا امتحان غداً." },
        { fr: "Ils ont dix-sept ans.", ar: "عمرهم سبعة عشر عاماً." }
      ] },

    { title: "Le présent de l'indicatif", title_ar: "المضارع (الحاضر)", level: "1Sec",
      explain: "أفعال المجموعة الأولى تنتهي بـ -er (parler)، وأفعال المجموعة الثانية تنتهي بـ -ir (finir). يُحذف المصدر وتُضاف النهايات.",
      points: [
        "المجموعة 1: -e, -es, -e, -ons, -ez, -ent.",
        "المجموعة 2: -is, -is, -it, -issons, -issez, -issent.",
        "أفعال شاذة مهمة: aller, faire, prendre, venir, pouvoir, vouloir."
      ],
      tables: [
        T("parler (يتكلم)", [["je", "parle"], ["tu", "parles"], ["il / elle", "parle"], ["nous", "parlons"], ["vous", "parlez"], ["ils / elles", "parlent"]]),
        T("finir (ينهي)", [["je", "finis"], ["tu", "finis"], ["il / elle", "finit"], ["nous", "finissons"], ["vous", "finissez"], ["ils / elles", "finissent"]])
      ],
      examples: [
        { fr: "Je parle français.", ar: "أتكلم الفرنسية." },
        { fr: "Nous finissons le travail.", ar: "ننهي العمل." },
        { fr: "Ils vont à l'école.", ar: "هم يذهبون إلى المدرسة." }
      ] },

    { title: "Le passé composé", title_ar: "الماضي المركب", level: "2Sec",
      explain: "يعبّر عن حدث انتهى في الماضي. يتكوّن من: مساعد (avoir أو être) في المضارع + اسم المفعول (participe passé).",
      points: [
        "مع avoir: أغلب الأفعال (J'ai mangé).",
        "مع être: أفعال الحركة (aller, venir, partir, arriver, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, retourner, devenir) والأفعال الانعكاسية.",
        "مع être يتوافق اسم المفعول مع الفاعل في النوع والعدد: elle est allée / ils sont allés.",
        "اسم المفعول: -er ← é (parlé) ، -ir ← i (fini) ، وأشهر الشواذ: eu, été, fait, pris, vu, dit, mis."
      ],
      tables: [T("aller (يذهب)", [["je", "suis allé(e)"], ["tu", "es allé(e)"], ["il / elle", "est allé(e)"], ["nous", "sommes allé(e)s"], ["vous", "êtes allé(e)(s)"], ["ils / elles", "sont allé(e)s"]])],
      examples: [
        { fr: "J'ai mangé une pomme.", ar: "أكلتُ تفاحة." },
        { fr: "Elle est allée à l'école.", ar: "ذهبت إلى المدرسة." },
        { fr: "Nous sommes arrivés tôt.", ar: "وصلنا مبكرين." },
        { fr: "Ils ont fini leurs devoirs.", ar: "أنهوا واجباتهم." }
      ] },

    { title: "L'imparfait", title_ar: "الماضي الناقص (المستمر)", level: "2Sec",
      explain: "يُستخدم للعادات في الماضي، والوصف، والأحداث المستمرة. القاعدة: جذر nous في المضارع (بدون -ons) + النهايات.",
      points: [
        "النهايات: -ais, -ais, -ait, -ions, -iez, -aient.",
        "مثال التكوين: nous parlons ← parl- ← je parlais.",
        "الاستثناء الوحيد في الجذر: être ← ét- (j'étais)."
      ],
      tables: [T("parler", [["je", "parlais"], ["tu", "parlais"], ["il / elle", "parlait"], ["nous", "parlions"], ["vous", "parliez"], ["ils / elles", "parlaient"]])],
      examples: [
        { fr: "Quand j'étais petit, je jouais au parc.", ar: "عندما كنت صغيراً كنت ألعب في الحديقة." },
        { fr: "Il faisait beau.", ar: "كان الجو جميلاً." },
        { fr: "Nous habitions au Caire.", ar: "كنا نسكن في القاهرة." }
      ] },

    { title: "Le futur simple", title_ar: "المستقبل البسيط", level: "2Sec",
      explain: "يعبّر عن حدث سيقع. القاعدة: المصدر (infinitif) + النهايات.",
      points: [
        "النهايات: -ai, -as, -a, -ons, -ez, -ont.",
        "الجذور الشاذة: être ← ser- ، avoir ← aur- ، aller ← ir- ، faire ← fer- ، venir ← viendr- ، pouvoir ← pourr- ، voir ← verr-.",
        "المستقبل القريب: aller + مصدر (Je vais étudier)."
      ],
      tables: [T("parler", [["je", "parlerai"], ["tu", "parleras"], ["il / elle", "parlera"], ["nous", "parlerons"], ["vous", "parlerez"], ["ils / elles", "parleront"]])],
      examples: [
        { fr: "Demain, j'irai au Caire.", ar: "غداً سأذهب إلى القاهرة." },
        { fr: "Nous finirons à midi.", ar: "سننتهي ظهراً." },
        { fr: "Je vais étudier ce soir.", ar: "سأذاكر هذا المساء." }
      ] },

    { title: "Le féminin des adjectifs", title_ar: "تأنيث الصفات", level: "1Sec",
      explain: "القاعدة العامة: نضيف e للمذكر لنحصل على المؤنث، والصفة تتوافق مع الاسم نوعاً وعدداً.",
      points: [
        "-er ← -ère: premier ← première.",
        "-eux ← -euse: heureux ← heureuse.",
        "-if ← -ive: actif ← active.",
        "-on / -el ← -onne / -elle: bon ← bonne ، cruel ← cruelle.",
        "صفات لا تتغير لأنها تنتهي بـ e: jeune, rapide, facile."
      ],
      examples: [
        { fr: "Un élève sérieux, une élève sérieuse.", ar: "تلميذ مجتهد، تلميذة مجتهدة." },
        { fr: "Mon ami est content, mon amie est contente.", ar: "صديقي سعيد، صديقتي سعيدة." },
        { fr: "C'est une bonne idée.", ar: "هذه فكرة جيدة." }
      ] },

    { title: "Le pluriel des noms", title_ar: "جمع الأسماء", level: "1Sec",
      explain: "القاعدة العامة: نضيف s في آخر الاسم المفرد.",
      points: [
        "الأسماء المنتهية بـ -s, -x, -z لا تتغير: un prix ← des prix.",
        "-au, -eau, -eu ← + x: un gâteau ← des gâteaux.",
        "-al ← -aux: un cheval ← des chevaux ، un journal ← des journaux.",
        "-ou ← + s، إلا: bijou, chou, genou, caillou, hibou, joujou, pou ← + x."
      ],
      examples: [
        { fr: "un livre, des livres", ar: "كتاب، كتب." },
        { fr: "un cheval, des chevaux", ar: "حصان، خيول." },
        { fr: "un bijou, des bijoux", ar: "جوهرة، مجوهرات." }
      ] },

    { title: "La négation", title_ar: "النفي", level: "1Sec",
      explain: "النفي الأساسي: ne ... pas يحيطان بالفعل. وتصبح ne ← n' قبل حرف متحرك.",
      points: [
        "في الماضي المركب: يحيط النفي بالفعل المساعد: Je n'ai pas mangé.",
        "بعد النفي: un / une / des / du ← de (d'): Je ne mange pas de viande.",
        "أدوات أخرى: ne ... jamais (أبداً) ، ne ... plus (لم يعد) ، ne ... rien (لا شيء) ، ne ... personne (لا أحد)."
      ],
      examples: [
        { fr: "Je ne mange pas de viande.", ar: "لا آكل لحماً." },
        { fr: "Il n'a jamais menti.", ar: "لم يكذب أبداً." },
        { fr: "Elle ne travaille plus.", ar: "لم تعد تعمل." },
        { fr: "Nous n'avons rien vu.", ar: "لم نرَ شيئاً." }
      ] },

    { title: "Les adjectifs possessifs", title_ar: "صفات الملكية", level: "1Sec",
      explain: "تتوافق مع الشيء المملوك (وليس المالك) في النوع والعدد.",
      points: ["ma / ta / sa تصبح mon / ton / son قبل حرف متحرك: mon amie."],
      tables: [T("المذكر / المؤنث / الجمع", [["je", "mon / ma / mes"], ["tu", "ton / ta / tes"], ["il / elle", "son / sa / ses"], ["nous", "notre / notre / nos"], ["vous", "votre / votre / vos"], ["ils / elles", "leur / leur / leurs"]])],
      examples: [
        { fr: "Mon père travaille ici.", ar: "أبي يعمل هنا." },
        { fr: "Ses amis sont gentils.", ar: "أصدقاؤه لطفاء." },
        { fr: "Notre école est grande.", ar: "مدرستنا كبيرة." }
      ] },

    { title: "L'interrogation", title_ar: "الاستفهام", level: "2Sec",
      explain: "ثلاث طرق لطرح السؤال، وأدوات استفهام للسؤال عن معلومة.",
      points: [
        "التنغيم: Tu viens ؟ — عبارة: Est-ce que tu viens ؟ — القلب: Viens-tu ؟",
        "أدوات الاستفهام: qui (من) ، que / qu'est-ce que (ماذا) ، où (أين) ، quand (متى) ، comment (كيف) ، pourquoi (لماذا) ، combien (كم)."
      ],
      examples: [
        { fr: "Où habites-tu ?", ar: "أين تسكن؟" },
        { fr: "Pourquoi est-ce que tu pleures ?", ar: "لماذا تبكي؟" },
        { fr: "Combien coûte ce livre ?", ar: "كم يكلف هذا الكتاب؟" },
        { fr: "Quand arrive-t-il ?", ar: "متى يصل؟" }
      ] },

    { title: "Les pronoms COD, COI, y et en", title_ar: "ضمائر المفعول به و y و en", level: "2Sec",
      explain: "تحل الضمائر محل الاسم لتجنب التكرار، وتوضع قبل الفعل.",
      points: [
        "COD (مفعول مباشر): le, la, l', les.",
        "COI (مفعول بحرف جر à): lui, leur.",
        "y تحل محل à + مكان/شيء ، en تحل محل de + شيء أو كمية."
      ],
      examples: [
        { fr: "Je regarde le film. Je le regarde.", ar: "أشاهد الفيلم. أشاهده." },
        { fr: "Elle écrit à Paul. Elle lui écrit.", ar: "تكتب لبول. تكتب له." },
        { fr: "Je donne le livre aux élèves. Je leur donne le livre.", ar: "أعطي الكتاب للتلاميذ. أعطيهم الكتاب." },
        { fr: "J'y vais. J'en mange.", ar: "أذهب إلى هناك. آكل منه." }
      ] },

    { title: "Le comparatif et le superlatif", title_ar: "المقارنة والتفضيل", level: "2Sec",
      explain: "للمقارنة بين شيئين أو لتحديد الأعلى أو الأدنى في مجموعة.",
      points: [
        "plus ... que (أكثر من) ، moins ... que (أقل من) ، aussi ... que (مثل).",
        "التفضيل: le / la / les + plus / moins + صفة.",
        "حالات خاصة: bon ← meilleur ، bien ← mieux."
      ],
      examples: [
        { fr: "Marie est plus grande que Paul.", ar: "ماري أطول من بول." },
        { fr: "Ce livre est aussi intéressant que celui-là.", ar: "هذا الكتاب ممتع مثل ذاك." },
        { fr: "C'est le meilleur élève de la classe.", ar: "هو أفضل تلميذ في الفصل." }
      ] },

    { title: "Les pronoms relatifs", title_ar: "الضمائر الموصولة", level: "3Sec",
      explain: "تربط جملتين وتحل محل اسم مذكور سابقاً.",
      points: [
        "qui: تحل محل الفاعل.",
        "que (qu'): تحل محل المفعول به.",
        "où: للمكان والزمان.",
        "dont: تحل محل de + اسم."
      ],
      examples: [
        { fr: "L'homme qui parle est mon père.", ar: "الرجل الذي يتحدث هو أبي." },
        { fr: "Le livre que je lis est intéressant.", ar: "الكتاب الذي أقرؤه ممتع." },
        { fr: "La ville où j'habite est belle.", ar: "المدينة التي أسكن فيها جميلة." },
        { fr: "Voici le professeur dont je parle.", ar: "هذا هو المعلم الذي أتحدث عنه." }
      ] },

    { title: "Le conditionnel et l'hypothèse avec « si »", title_ar: "الشرط والمضارع الشرطي", level: "3Sec",
      explain: "المضارع الشرطي = جذر المستقبل + نهايات الماضي الناقص. ويُستخدم للتمني والشرط غير المحقق.",
      points: [
        "Si + présent ← futur: الشرط محتمل.",
        "Si + imparfait ← conditionnel présent: الشرط غير محقق في الحاضر.",
        "Si + plus-que-parfait ← conditionnel passé: شرط مستحيل في الماضي."
      ],
      tables: [T("parler", [["je", "parlerais"], ["tu", "parlerais"], ["il / elle", "parlerait"], ["nous", "parlerions"], ["vous", "parleriez"], ["ils / elles", "parleraient"]])],
      examples: [
        { fr: "Si tu étudies, tu réussiras.", ar: "إن ذاكرت فستنجح." },
        { fr: "Si j'avais de l'argent, j'achèterais une voiture.", ar: "لو كان عندي مال لاشتريت سيارة." },
        { fr: "Si j'avais su, je serais venu.", ar: "لو كنت أعلم لجئت." }
      ] },

    { title: "Le subjonctif présent", title_ar: "المضارع الالتزامي", level: "3Sec",
      explain: "يُستخدم بعد التعبيرات التي تدل على الضرورة أو الرغبة أو الشك أو العاطفة. التكوين: جذر ils + النهايات.",
      points: [
        "النهايات: -e, -es, -e, -ions, -iez, -ent.",
        "بعد: il faut que, vouloir que, pour que, bien que, avant que, il est possible que.",
        "الشواذ: être ← que je sois ، avoir ← que j'aie ، aller ← que j'aille ، faire ← que je fasse."
      ],
      tables: [T("parler", [["que je", "parle"], ["que tu", "parles"], ["qu'il / qu'elle", "parle"], ["que nous", "parlions"], ["que vous", "parliez"], ["qu'ils / qu'elles", "parlent"]])],
      examples: [
        { fr: "Il faut que tu étudies.", ar: "يجب أن تذاكر." },
        { fr: "Je veux que tu viennes.", ar: "أريدك أن تأتي." },
        { fr: "Bien qu'il soit malade, il travaille.", ar: "رغم أنه مريض فهو يعمل." }
      ] },

    { title: "La voix passive", title_ar: "المبني للمجهول", level: "3Sec",
      explain: "يُنقل المفعول به ليصبح فاعلاً. التكوين: être (بنفس زمن الجملة المعلومة) + اسم المفعول متوافقاً مع الفاعل + par / de + الفاعل الأصلي.",
      points: [
        "Le professeur explique la leçon ← La leçon est expliquée par le professeur.",
        "الفاعل الأصلي (complément d'agent) يمكن حذفه."
      ],
      examples: [
        { fr: "La leçon est expliquée par le professeur.", ar: "الدرس يُشرح بواسطة المعلم." },
        { fr: "Le voleur a été arrêté par la police.", ar: "قُبض على اللص بواسطة الشرطة." },
        { fr: "Les devoirs seront corrigés demain.", ar: "ستُصحَّح الواجبات غداً." }
      ] }
  ];
  window.BUILTIN_GRAMMAR = G;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sp = (t, l) => `<button class="spk" type="button" data-say="${esc(encodeURIComponent(t))}"${l ? ` data-lang="${l}"` : ''} aria-label="استمع">🔊</button>`;

  function topic(g, i) {
    let h = `<details class="node d0 gtopic"${i === 0 ? ' open' : ''}><summary>${esc(g.title_ar)} — <span dir="ltr">${esc(g.title)}</span> <em class="lvl">${esc(g.level)}</em></summary><div class="inner">`;
    h += `<p class="gexp">${esc(g.explain)} ${sp(g.explain, 'ar-SA')}</p>`;
    if (g.points) h += `<ul class="plain">${g.points.map(p => `<li>${esc(p)} ${sp(p)}</li>`).join('')}</ul>`;
    (g.tables || []).forEach(t => {
      h += `<table class="gtable"><caption>${esc(t.c)}</caption>` + t.rows.map(r =>
        `<tr>${r.map(c => `<td dir="ltr">${esc(c)}</td>`).join('')}<td>${sp(r.join(' '), 'fr-FR')}</td></tr>`).join('') + '</table>';
    });
    h += '<h5 class="gh">أمثلة مترجمة</h5>' + g.examples.map(e =>
      `<div class="ex"><div class="ex-fr" dir="ltr">${esc(e.fr)} ${sp(e.fr, 'fr-FR')}</div><div class="ex-ar" data-k="ar">${esc(e.ar)}</div></div>`).join('');
    return h + '</div></details>';
  }

  window.mountBuiltinGrammar = function (id) {
    const sec = document.getElementById(id); if (!sec) return;
    const el = sec.querySelector('.body') || sec;
    el.innerHTML = `
      <div class="tools">
        <input type="search" class="search g-search" placeholder="🔎 ابحث في القواعد..." aria-label="بحث">
        <button type="button" class="btn-toggle-ar">إظهار / إخفاء الترجمة العربية</button>
      </div>
      <div class="g-area">${G.map(topic).join('')}</div>
      <div id="grammar-extra"></div>`;
    const q = el.querySelector('.g-search');
    q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase();
      el.querySelectorAll('.gtopic').forEach(d => {
        const ok = !v || d.textContent.toLowerCase().includes(v);
        d.style.display = ok ? '' : 'none';
        if (v && ok) d.open = true;
      });
    });
    el.querySelector('.btn-toggle-ar').addEventListener('click', () => el.classList.toggle('ar-hidden'));
  };
})();
