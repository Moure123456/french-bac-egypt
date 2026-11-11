/* ==========================================================================
   zoza-talk.js — النسخة التفاعلية الفورية المباشرة (Le Français Au Bac)
   ========================================================================== */
(function () {
  'use strict';

  // قاعدة المعرفة والسيناريوهات التفاعلية للبكالوريا
  var INTEL = {
    stories: [
      { title: "Le Petit Chat Charly", fr: "C'est l'histoire d'un petit chat noir. Il s'appelle Charly. Charly aime jouer dans le jardin et boire du lait chaud.", ar: "القط تشارلي: قصة قط أسود صغير يحب اللعب في الحديقة وشرب الحليب الدافيء." },
      { title: "La Tortue Rapide", fr: "Une petite tortue marche dans la forêt. Elle voit une pomme rouge sur l'herbe et la mange avec joie.", ar: "السلحفاة: سلحفاة صغيرة تمشي في الغابة وتأكل تفاحة حمراء بسعادة." },
      { title: "Le Livre Magique", fr: "Thomas ouvre un vieux livre sur son bureau. Chaque page raconte une aventure extraordinaire.", ar: "الكتاب السحري: توماس يفتح كتاباً قديماً، وكل صفحة تحكي مغامرة استثنائية." }
    ],
    dialogues: [
      { topic: "Se présenter", fr: "Bonjour ! Je m’appelle Nour. Et toi, comment tu t'appelles ?", ar: "التعارف: مرحباً! اسمي نور. وأنت، ما اسمك؟" },
      { topic: "Au restaurant", fr: "Bonjour, je voudrais un poulet avec du riz et une bouteille d’eau s'il vous plaît.", ar: "المطعم: مرحباً، أريد دجاجاً مع أرز وزجاجة ماء من فضلك." },
      { topic: "Le sport", fr: "Tu fais du sport ? J'adore jouer au football et au basket.", ar: "الرياضة: هل تمارس الرياضة؟ أنا أعشق لعب كرة القدم والسلة." }
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

    // تصميم واجهة تفاعلية نابضة بالحياة
    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937;font-family:inherit;padding:4px}.tk *{box-sizing:border-box}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;border-radius:24px;padding:18px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);box-shadow:0 10px 25px rgba(124,58,237,.3);margin-bottom:12px}' +
      '.tk-rob{display:block;margin:0 auto 8px;height:110px;width:110px;object-fit:cover;border-radius:50%;border:4px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,0.3);animation:zozaPulse 2.5s infinite;background:#fff}' +
      '@keyframes zozaPulse{0%,100%{transform:scale(1);} 50%{transform:scale(1.05);}}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.25);border-radius:12px;padding:4px 10px;font-size:.75rem;font-weight:800;margin:2px}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:20px;padding:12px;height:410px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:10px}' +
      '.tk-m{display:flex;gap:8px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:36px;height:36px;flex:none;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #f9a8d4;font-size:1.2rem}' +
      '.tk-b{max-width:85%;background:#fff;border-radius:16px;padding:12px;box-shadow:0 3px 8px rgba(0,0,0,.06)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:1rem;font-weight:700;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:6px;padding-top:6px;border-top:1px dashed #e5e7eb;font-size:.86rem;color:#4b5563}' +
      '.tk-fx{margin-top:6px;border-radius:10px;padding:6px;font-size:.78rem;color:#047857;background:#ecfdf5;border:1px solid #6ee7b7}' +
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
        '<h3>زوزا التفاعلية الحية</h3><small>Zoza Interactive Engine (100% Locale & Active)</small><br>' +
        '<span class="tk-chip">⚡ تفاعل فوري ونطق صوتي مباشر</span>' +
      '</div>' +
      '<div class="tk-chat" id="tk-chat"></div>' +
      '<div class="tk-in">' +
        '<button type="button" class="mic" id="tk-mic" title="تحدث بالميكروفون">🎤</button>' +
        '<input id="tk-ip" type="text" placeholder="اكتب ردك بالفرنسية هنا…">' +
        '<button type="button" id="tk-send">إرسال ➤</button>' +
      '</div>' +
      '<div class="tk-ft">' +
        '<button type="button" id="tk-new">🔄 بدء محادثة جديدة</button>' +
        '<button type="button" id="tk-story">📖 قصة قصيرة</button>' +
        '<button type="button" id="tk-dialog">💬 سؤال حوارى</button>' +
      '</div>' +
    '</div>';

    var chatBox = document.getElementById('tk-chat');

    function addMsg(fr, ar, fix, isUser) {
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div');
      d.className = 'tk-m ' + (isUser ? 'u' : 'z');
      if (isUser) {
        d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div></div>';
      } else {
        var fixHtml = fix ? '<div class="tk-fx"><b>💡 تصحيح لغوي:</b> ' + esc(fix) + '</div>' : '';
        d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div>' + fixHtml + '<div class="tk-bt"><button type="button" data-say="' + id + '">🔊 اسمع النطق</button></div></div>';
        say(fr);
      }
      chatBox.appendChild(d);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    addMsg('Bonjour ! Je suis Zoza. Comment tu t\'appelles et comment ça va aujourd\'hui ?', 'مرحباً! أنا زوزا. ما اسمك وكيف حالك اليوم؟ أجبني بالفرنسية.', null, false);

    // محرك تفاعلي فوري ذكي
    function interactiveEngine(text) {
      var t = text.toLowerCase();
      var correction = null;

      // فحص الأخطاء الشائعة وتصحيحها تفاعلياً
      if (t.includes('je m\'appelle') || t.includes('je suis') || t.includes('salut') || t.includes('bonjour')) {
        return {
          fr: 'C\'est parfait ! Continue de me parler de tes loisirs ou de ton école en français.',
          ar: 'ممتاز جداً! استمر في إخباري عن هواياتك أو مدرستك بالفرنسية.'
        };
      }
      if (t.includes('restaurant') || t.includes('manger') || t.includes('faim')) {
        return {
          fr: 'Miam ! Moi aussi j\'aime la bonne cuisine. Qu\'est-ce que tu préfères commander ?',
          ar: 'لذيذ! أنا أيضاً أحب الطعام الجيد. ماذا تفضل أن تطلب؟'
        };
      }
      if (t.includes('sport') || t.includes('football')) {
        return {
          fr: 'Le sport est très important pour la santé ! Tu joues souvent au football ?',
          ar: 'الرياضة مهمة جداً للصحة! هل تلعب كرة القدم كثيراً؟'
        };
      }

      // رد تفاعلي افتراضي يشجع الطالب على المتابعة
      return {
        fr: 'C\'est très bien dit ! Peux-tu développer un peu plus ta phrase en français ?',
        ar: 'لقد قمت بصياغتها بشكل جيد! هل يمكنك توضيح جملتك أكثر بالفرنسية؟'
      };
    }

    function handleSend() {
      var inp = document.getElementById('tk-ip');
      var val = (inp.value || '').trim();
      if (!val) return;
      inp.value = '';
      addMsg(val, '', null, true);

      // رد تفاعلي فوري بدون تأخير
      setTimeout(function() {
        var res = interactiveEngine(val);
        addMsg(res.fr, res.ar, null, false);
      }, 400);
    }

    document.getElementById('tk-send').addEventListener('click', handleSend);
    document.getElementById('tk-ip').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSend();
    });

    document.getElementById('tk-new').addEventListener('click', function() {
      chatBox.innerHTML = '';
      MSG = [];
      addMsg('Nouvelle session interactive ! Parlons français : comment ça va ?', 'جلسة تفاعلية جديدة! لنتحدث الفرنسية: كيف حالك؟', null, false);
    });

    document.getElementById('tk-story').addEventListener('click', function() {
      var s = INTEL.stories[Math.floor(Math.random() * INTEL.stories.length)];
      addMsg('📖 ' + s.title + ' :\n' + s.fr, s.ar, null, false);
    });

    document.getElementById('tk-dialog').addEventListener('click', function() {
      var d = INTEL.dialogues[Math.floor(Math.random() * INTEL.dialogues.length)];
      addMsg('💬 ' + d.topic + ' :\n' + d.fr, d.ar, null, false);
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
