/* ===== zoza-talk.js — النسخة المحلية المتقدمة والذكية بدون أخطاء اتصال ===== */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { console.error('[zoza-talk]', e); } });

  function boot() {
    var SEC = document.getElementById('soon-geographie'), ROOT = document.getElementById('talk-root'); if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.soon-card'); if (OLD) OLD.style.display = 'none';
    var $ = function (s, r) { return (r || document).querySelector(s); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }

    var ST = store('bq_talk') || { level: 'b', voice: 1, tr: 1, xp: 0 };
    function save() { store('bq_talk', ST); }

    // تصميم الواجهة وصورة زوزا المتحركة والحركات التفاعلية
    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937;font-family:inherit}.tk *{box-sizing:border-box}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;border-radius:24px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);box-shadow:0 8px 20px rgba(124,58,237,.3);margin-bottom:12px}' +
      '.tk-rob{display:block;margin:0 auto 8px;height:100px;width:100px;object-fit:cover;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:zozaMove 3.5s ease-in-out infinite;background:#fff}' +
      '@keyframes zozaMove{0%,100%{transform:translate(0,0) rotate(0deg) scale(1);} 25%{transform:translate(-5px,-4px) rotate(-3deg) scale(1.03);} 50%{transform:translate(5px,4px) rotate(3deg) scale(0.98);} 75%{transform:translate(-3px,4px) rotate(-2deg) scale(1.02);}}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.25);border-radius:12px;padding:4px 10px;font-size:.75rem;font-weight:800;margin:2px}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:20px;padding:10px;height:min(50vh,400px);overflow-y:auto;display:flex;flex-direction:column;gap:10px}' +
      '.tk-m{display:flex;gap:7px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:34px;height:34px;flex:none;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #f9a8d4;font-size:1.1rem}' +
      '.tk-b{max-width:84%;background:#fff;border-radius:16px;padding:10px;box-shadow:0 2px 6px rgba(0,0,0,.06)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:.98rem;font-weight:700;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:4px;padding-top:4px;border-top:1px dashed #e5e7eb;font-size:.84rem;color:#4b5563}' +
      '.tk-bt{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.tk-bt button{border:0;border-radius:12px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.72rem;padding:5px 9px}' +
      '.tk-in{display:flex;gap:6px;margin-top:6px}.tk-in input{flex:1;min-width:0;border:2px solid #e9d5ff;border-radius:14px;padding:10px;font-size:.95rem;direction:ltr}.tk-in input:focus{outline:0;border-color:#7c3aed}' +
      '.tk-in button{border:0;border-radius:14px;min-width:44px;font-weight:900;color:#fff;background:linear-gradient(135deg,#7c3aed,#db2777)}' +
      '.tk-in button.mic{background:linear-gradient(135deg,#f59e0b,#ef4444)}' +
      '.tk-in button.mic.rec{animation:tkP 1s infinite}@keyframes tkP{50%{transform:scale(1.08)}}' +
      '.tk-ft{display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap}.tk-ft button{border:0;border-radius:14px;padding:8px 12px;font-weight:800;background:#f3e8ff;color:#6b21a8}';
    document.head.appendChild(st);

    function say(text) { try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {} }

    var MSG = [];
    function mount() {
      ROOT.innerHTML = '<div class="tk">' +
        '<div class="tk-hero">' +
          '<img class="tk-rob" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" alt="Zoza">' +
          '<h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza</small><br>' +
          '<span class="tk-chip">🟢 حوار ذكي ومباشر</span><span class="tk-chip">✨ ' + ST.xp + ' XP</span>' +
        '</div>' +
        '<div class="tk-chat" id="tk-chat"></div>' +
        '<div class="tk-in">' +
          '<button type="button" class="mic" id="tk-mic" data-act="mic" title="تحدث بالميكروفون">🎤</button>' +
          '<input id="tk-ip" type="text" placeholder="تحدث مع زوزا بأي سؤال بالفرنسية…">' +
          '<button type="button" data-act="send">➤</button>' +
        '</div>' +
        '<div class="tk-ft"><button type="button" data-act="new">🔄 حوار جديد</button></div>' +
      '</div>';
      greet();
    }

    function chat() { return $('#tk-chat'); }
    function scrollDown() { var c = chat(); if (c) c.scrollTop = c.scrollHeight; }

    function addZ(fr, ar) {
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div'); d.className = 'tk-m z';
      d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div><div class="tk-bt"><button type="button" data-a="say" data-m="' + id + '">🔊 اسمع</button></div></div>';
      chat().appendChild(d); scrollDown(); if (ST.voice) say(fr);
    }

    function addU(text) {
      var d = document.createElement('div'); d.className = 'tk-m u';
      d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(text) + '</div></div>';
      chat().appendChild(d); scrollDown();
    }

    function greet() {
      addZ('Bonjour ! Je suis Zoza. De quoi veux-tu qu’on discute aujourd’hui ?', 'مرحبًا! أنا زوزا. عن ماذا تريد أن نتناقش اليوم؟');
    }

    // محرك الذكاء الحواري المحلي المتقدم (يجيب على أي سؤال ويطرح سؤالاً مضاداً)
    function getAdvancedReply(userText) {
      var t = userText.toLowerCase().trim();
      
      if (t.includes('comment ça va') || t.includes('ça va') || t.includes('comment vas')) {
        return { fr: 'Ça va super bien, merci ! Et toi, comment se passe ta journée ?', ar: 'أنا بخير تماماً شكراً لك! وأنت، كيف تمر يومك؟' };
      }
      if (t.includes('t’appelles') || t.includes('appelles comment') || t.includes('nom') || t.includes('qui es')) {
        return { fr: 'Je m’appelle Zoza, ton amie et professeure de français. Et toi, quel est ton nom ?', ar: 'اسمي زوزا، صديقتك ومعلمتك للفرنسية. وأنت، ما اسمك؟' };
      }
      if (t.includes('quel âge') || t.includes('age') || t.includes('tous') || t.includes('ans')) {
        return { fr: 'Je suis un robot virtuel, je n’ai pas d’âge ! Et toi, quel âge as-tu ?', ar: 'أنا روبوت افتراضي، ليس لدي عمر! وأنت، كم عمرك؟' };
      }
      if (t.includes('où habites') || t.includes('habites-tu') || t.includes('habites tu') || t.includes('vis')) {
        return { fr: 'J’habite dans ton site web et dans ton cœur ! Et toi, où habites-tu en Égypte ?', ar: 'أسكن في موقعك الإلكتروني وفي قلبك! وأنت، أين تسكن في مصر؟' };
      }
      if (t.includes('où tu travailles') || t.includes('tu travailles où') || t.includes('travilles') || t.includes('métier')) {
        return { fr: 'Je travaille ici avec toi pour t’aider à réussir ton bac. Tu aimes l’école ?', ar: 'أعمل هنا معك لأساعدك في النجاح في البكالوريا. هل تحب المدرسة؟' };
      }
      if (t.includes('bonjour') || t.includes('salut')) {
        return { fr: 'Salut ! C’est un plaisir de te parler. De quoi veux-tu qu’on parle ?', ar: 'أهلاً! إنه من دواعي سروري التحدث معك. عن ماذا تريد أن نتحدث؟' };
      }
      if (t.includes('pourquoi')) {
        return { fr: 'C’est une question très intelligente ! Qu’en penses-tu toi-même ?', ar: 'إنه سؤال ذكي جداً! ما رأيك أنت بنفسك؟' };
      }
      if (t.includes('merci')) {
        return { fr: 'De rien ! C’est toujours un plaisir de t’aider. Tu as une autre question ?', ar: 'عفوًا! إنه دائماً من دواعي سروري مساعدتك. هل لديك سؤال آخر؟' };
      }
      if (t.includes('sport') || t.includes('football') || t.includes('match')) {
        return { fr: 'Le sport est formidable ! Quel est ton sport préféré ?', ar: 'الرياضة شيء رائع! ما هي رياضتك المفضلة؟' };
      }
      if (t.includes('manger') || t.includes('nourriture') || t.includes('plat') || t.includes('faim')) {
        return { fr: 'La cuisine est délicieuse ! Quel est ton plat préféré ?', ar: 'الطعام لذيذ! ما هو طبقك المفضل؟' };
      }

      // رد تفاعلي ذكي يفتح حواراً مفتوحاً لأي جملة أخرى يدخلها الطالب
      return { fr: 'C’est très intéressant ce que tu dis : « ' + userText + ' ». Peux-شي me donner plus de détails ?', ar: 'هذا أمر ممتع للغاية ما تقوله. هل يمكنك إعطائي تفاصيل أكثر؟' };
    }

    function handle(text) {
      text = String(text || '').trim(); if (!text) return;
      addU(text);
      ST.xp += 3; save();
      
      setTimeout(function () {
        var reply = getAdvancedReply(text);
        addZ(reply.fr, reply.ar);
      }, 500);
    }

    function listenSpeech(btn) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت مباشرة، استخدم متصفح كروم.'); return; }
      var r = new SR(); r.lang = 'fr-FR';
      btn.classList.add('rec');
      r.onresult = function(e) {
        btn.classList.remove('rec');
        var txt = e.results[0][0].transcript;
        var ip = $('#tk-ip'); if (ip) ip.value = txt;
        handle(txt);
      };
      r.onerror = function() { btn.classList.remove('rec'); };
      r.onend = function() { btn.classList.remove('rec'); };
      try { r.start(); } catch(e) { btn.classList.remove('rec'); }
    }

    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-act="send"]'))) { var i = $('#tk-ip'); if(i) { handle(i.value); i.value = ''; } return; }
      if ((x = t.closest('[data-act="mic"]'))) { listenSpeech(x); return; }
      if ((x = t.closest('[data-act="new"]'))) { MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.closest('[data-a="say"]'))) { var m = MSG[+x.dataset.m]; if (m) say(m.fr); return; }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target; handle(i.value); i.value = ''; } });

    mount();
  }
})();
