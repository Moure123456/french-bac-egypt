/* ==========================================================================
   zoza-talk.js — النسخة الشاملة والجاهزة للنسخ (Le Français Au Bac)
   ========================================================================== */
(function () {
  'use strict';
  var AI_URL = 'https://zoza-worker.moure123456.workers.dev';

  var MASTER_KNOWLEDGE = {
    meta: { version: "5.1.0", author: "محمود السويدى (مسيو محمود)", project: "Le français au bac" },
    dialogues: [
      { id: "presentation", level: "1sec", title: "Se présenter", fr: "Bonjour ! Je m’appelle Nour. Et toi ? - Moi, c’est Thomas. Je suis français et j'habite à Paris.", ar: "التعارف: مرحباً! اسمي نور. وأنت؟ - أنا توما. أنا فرنسي وأسكن في باريس." },
      { id: "chemin", level: "1sec", title: "Demander son chemin", fr: "Excusez-moi, où est la gare ? - Allez tout droit, puis tournez à gauche. C'est à cinq minutes à pied.", ar: "الاتجاهات: عفواً، أين المحطة؟ - اذهب مباشرة ثم انعطف يساراً. تبعد خمس دقائق سيراً." },
      { id: "vetements", level: "2sec", title: "Acheter des vêtements", fr: "Je cherche une robe pour une fête. Quelle taille faites-vous ? - Je fais du 38. Vous l'avez en bleu ?", ar: "الملابس: أبحث عن فستان لحفلة. ما مقاسك؟ - مقاسي 38. هل لديكم باللون الأزرق؟" },
      { id: "restaurant", level: "2sec", title: "Au restaurant", fr: "Voici la carte. - Pour moi, un poulet avec du riz et une bouteille d’eau, s’il vous plaît.", ar: "المطعم: تفضلوا القائمة. - بالنسبة لي دجاج مع أرز وزجاجة ماء من فضلك." },
      { id: "sport", level: "2sec", title: "Parler du sport", fr: "Tu fais du sport ? - Oui, je joue au basket deux fois par semaine et j'adore le football.", ar: "الرياضة: هل تمارس الرياضة؟ - نعم، ألعب السلة مرتين أسبوعياً وأعشق كرة القدم." },
      { id: "classe", level: "3sec", title: "En classe", fr: "Je n’ai pas compris l’exercice. Il faut mettre le verbe au passé composé.", ar: "في الفصل: لم أفهم التمرين. يجب وضع الفعل في الماضي المركب." },
      { id: "medecin", level: "3sec", title: "Chez le médecin", fr: "Qu'est-ce qui ne va pas ? - J’ai mal à la gorge, je tousse et j'ai de la fièvre.", ar: "عند الطبيب: ما المشكلة؟ - أشعر بألم في الحلق، أسعل ولدي حمى." }
    ],
    stories: [
      { id: "s1", title: "Le Petit Chat Charly", level: "Débutant", fr: "C'est l'histoire d'un petit chat noir. Il s'appelle Charly. Charly aime jouer dans le jardin et boire du lait chaud.", ar: "القط تشارلي: قصة قط أسود صغير يحب اللعب في الحديقة وشرب الحليب الدافيء." },
      { id: "s2", title: "La Tortue Rapide", level: "Débutant", fr: "Une petite tortue marche dans la forêt. Elle voit une pomme rouge sur l'herbe et la mange avec joie.", ar: "السلحفاة: سلحفاة صغيرة تمشي في الغابة وتأكل تفاحة حمراء بسعادة." },
      { id: "s3", title: "Le Livre Magique", level: "Intermédiaire", fr: "Thomas ouvre un vieux livre sur son bureau. Chaque page raconte une aventure extraordinaire dans des pays lointains.", ar: "الكتاب السحري: توماس يفتح كتاباً قديماً، وكل صفحة تحكي مغامرة في بلاد بعيدة." },
      { id: "s4", title: "Un Voyage en Train", level: "Intermédiaire", fr: "Le train quitte la gare avec un grand sifflement. Il traverse les champs verts et les tunnels sombres à toute vitesse.", ar: "رحلة بالقطار: يغادر القطار المحطة بصفير عالٍ، يعبر الحقول والأنفاق بسرعة فائقة." },
      { id: "s5", title: "L'Importance des Forêts", level: "Avancé", fr: "Les forêts jouent un rôle crucial dans le maintien de l'équilibre écologique de notre planète.", ar: "أهمية الغابات: تلعب الغابات دوراً حيوياً في الحفاظ على التوازن البيئي لكوكبنا." }
    ],
    dictionary: [
      { fr: "le livre", ar: "الكتاب" }, { fr: "le stylo", ar: "القلم" }, { fr: "la classe", ar: "الفصل" },
      { fr: "la maison", ar: "المنزل" }, { fr: "l'eau", ar: "الماء" }, { fr: "le pain", ar: "الخبز" },
      { fr: "la gare", ar: "المحطة" }, { fr: "la pharmacie", ar: "الصيدلية" }, { fr: "le sport", ar: "الرياضة" }
    ]
  };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var ROOT = document.getElementById('talk-root') || document.getElementById('soon-geographie');
    if (!ROOT) {
      ROOT = document.createElement('div');
      ROOT.id = 'talk-root';
      var main = document.querySelector('main') || document.body;
      main.insertBefore(ROOT, main.firstChild);
    }
    ROOT.style.display = 'block';

    var oldCard = ROOT.querySelector('.soon-card');
    if (oldCard) oldCard.style.display = 'none';

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937;font-family:inherit;padding:4px}.tk *{box-sizing:border-box}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;border-radius:24px;padding:18px;color:#fff;text-align:center;background:linear-gradient(135deg,#1e1b4b,#4338ca 50%,#be185d);box-shadow:0 10px 25px rgba(67,56,202,.4);margin-bottom:12px}' +
      '.tk-rob{display:block;margin:0 auto 8px;height:110px;width:110px;object-fit:cover;border-radius:50%;border:4px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,0.3);animation:zozaPulse 3s infinite;background:#fff}' +
      '@keyframes zozaPulse{0%,100%{transform:scale(1);} 50%{transform:scale(1.04);}}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.25);border-radius:12px;padding:4px 10px;font-size:.75rem;font-weight:800;margin:2px}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:20px;padding:12px;height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:10px}' +
      '.tk-m{display:flex;gap:8px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:36px;height:36px;flex:none;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #f9a8d4;font-size:1.2rem}' +
      '.tk-b{max-width:85%;background:#fff;border-radius:16px;padding:12px;box-shadow:0 3px 8px rgba(0,0,0,.06)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:1rem;font-weight:700;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:6px;padding-top:6px;border-top:1px dashed #e5e7eb;font-size:.86rem;color:#4b5563}' +
      '.tk-bt{margin-top:6px}.tk-bt button{border:0;border-radius:10px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.72rem;padding:5px 10px}' +
      '.tk-in{display:flex;gap:6px}.tk-in input{flex:1;border:2px solid #e9d5ff;border-radius:14px;padding:12px;font-size:1rem;direction:ltr}.tk-in input:focus{outline:0;border-color:#7c3aed}' +
      '.tk-in button{border:0;border-radius:14px;padding:0 20px;font-weight:900;color:#fff;background:linear-gradient(135deg,#7c3aed,#db2777)}' +
      '.tk-in button.mic{background:linear-gradient(135deg,#f59e0b,#ef4444)}' +
      '.tk-ft{display:flex;justify-content:center;gap:6px;margin-top:8px;flex-wrap:wrap}.tk-ft button{border:0;border-radius:12px;padding:8px 14px;font-weight:800;background:#f3e8ff;color:#6b21a8;font-size:.8rem}';
    document.head.appendChild(st);

    function say(text) {
      try {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR';
        u.rate = 0.85;
        speechSynthesis.speak(u);
      } catch (e) {}
    }

    var MSG = [];
    ROOT.innerHTML = '<div class="tk">' +
      '<div class="tk-hero">' +
        '<img class="tk-rob" src="https://raw.githubusercontent.com/Moure123456/french-bac-egypt/main/zoza-pink.png" alt="Zoza" onerror="this.src=\'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80\'">' +
        '<h3>زوزا المعلمة الشاملة الحية</h3><small>Le Moteur Master de Zoza (Baccalauréat)</small><br>' +
        '<span class="tk-chip">🧠 قاعدة بيانات متكاملة مدمجة</span>' +
      '</div>' +
      '<div class="tk-chat" id="tk-chat"></div>' +
      '<div class="tk-in">' +
        '<button type="button" class="mic" id="tk-mic" title="تحدث بالميكروفون">🎤</button>' +
        '<input id="tk-ip" type="text" placeholder="اسأل زوزا عن أي قاعدة، قصة، أو حوار…">' +
        '<button type="button" id="tk-send">➤</button>' +
      '</div>' +
      '<div class="tk-ft">' +
        '<button type="button" id="tk-new">🔄 بدء محادثة جديدة</button>' +
        '<button type="button" id="tk-story">📖 قصة منهجية</button>' +
        '<button type="button" id="tk-dialog">💬 حوار وزارى</button>' +
        '<button type="button" id="tk-dict">📚 بنك الكلمات</button>' +
      '</div>' +
    '</div>';

    var chatBox = document.getElementById('tk-chat');

    function addMsg(fr, ar, isUser) {
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div');
      d.className = 'tk-m ' + (isUser ? 'u' : 'z');
      if (isUser) {
        d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div></div>';
      } else {
        d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div><div class="tk-bt"><button type="button" data-say="' + id + '">🔊 اسمع النطق</button></div></div>';
        say(fr);
      }
      chatBox.appendChild(d);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    addMsg('Bonjour ! Je suis Zoza, ton système intelligent et complet du Bac. Je suis prête à t\'enseigner.', 'مرحباً! أنا زوزا، نظامك الذكي والشامل للبكالوريا. أنا مستعدة لتدريبك بكل احترافية.', false);

    function masterEngine(text) {
      var t = text.toLowerCase();
      if (t.includes('restaurant') || t.includes('manger') || t.includes('طعام')) {
        var d = MASTER_KNOWLEDGE.dialogues[3];
        return { fr: d.fr, ar: 'قاعدة المطعم: ' + d.ar };
      }
      if (t.includes('sport') || t.includes('رياضة')) {
        var d = MASTER_KNOWLEDGE.dialogues[4];
        return { fr: d.fr, ar: 'قاعدة الرياضة: ' + d.ar };
      }
      if (t.includes('chat') || t.includes('tortue') || t.includes('story') || t.includes('قصة') || t.includes('قط')) {
        var s = MASTER_KNOWLEDGE.stories[Math.floor(Math.random() * MASTER_KNOWLEDGE.stories.length)];
        return { fr: '📖 ' + s.title + ' : ' + s.fr, ar: s.ar };
      }
      if (t.includes('chemin') || t.includes('gare') || t.includes('اتجاهات')) {
        var d = MASTER_KNOWLEDGE.dialogues[1];
        return { fr: d.fr, ar: 'قاعدة الاتجاهات: ' + d.ar };
      }
      return { fr: 'C’est une question pertinente sur « ' + text + ' ». Appliquons-la au programme du Bac !', ar: 'هذه مسألة رائعة حول « ' + text + ' ». دعنا نطبقها بقواعد البكالوريا!' };
    }

    function handleSend() {
      var inp = document.getElementById('tk-ip');
      var val = (inp.value || '').trim();
      if (!val) return;
      inp.value = '';
      addMsg(val, '', true);

      fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: val })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.reply_fr) {
          addMsg(data.reply_fr, data.reply_ar, false);
        } else {
          var r = masterEngine(val);
          addMsg(r.fr, r.ar, false);
        }
      })
      .catch(function() {
        var r = masterEngine(val);
        addMsg(r.fr, r.ar, false);
      });
    }

    document.getElementById('tk-send').addEventListener('click', handleSend);
    document.getElementById('tk-ip').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSend();
    });

    document.getElementById('tk-new').addEventListener('click', function() {
      chatBox.innerHTML = '';
      MSG = [];
      addMsg('Nouveau système initialisé ! Que souhaites-tu étudier ?', 'تم تهيئة النظام الجديد! ماذا تريد أن ندرس الآن؟', false);
    });

    document.getElementById('tk-story').addEventListener('click', function() {
      var s = MASTER_KNOWLEDGE.stories[Math.floor(Math.random() * MASTER_KNOWLEDGE.stories.length)];
      addMsg('📖 ' + s.title + ' :\n' + s.fr, s.ar, false);
    });

    document.getElementById('tk-dialog').addEventListener('click', function() {
      var d = MASTER_KNOWLEDGE.dialogues[Math.floor(Math.random() * MASTER_KNOWLEDGE.dialogues.length)];
      addMsg('💬 ' + d.title + ' :\n' + d.fr, d.ar, false);
    });

    document.getElementById('tk-dict').addEventListener('click', function() {
      var w = MASTER_KNOWLEDGE.dictionary[Math.floor(Math.random() * MASTER_KNOWLEDGE.dictionary.length)];
      addMsg('📚 Lexique Master : ' + w.fr, 'المعنى بالعربية: ' + w.ar, false);
    });

    chatBox.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-say]');
      if (btn) {
        var m = MSG[+btn.dataset.say];
        if (m) say(m.fr);
      }
    });

    document.getElementById('tk-mic').addEventListener('click', function() {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('المتصفح لا يدعم الميكروفون المباشر'); return; }
      var r = new SR();
      r.lang = 'fr-FR';
      r.onresult = function(e) {
        var txt = e.results[0][0].transcript;
        document.getElementById('tk-ip').value = txt;
        handleSend();
      };
      r.start();
    });
  });
})();
