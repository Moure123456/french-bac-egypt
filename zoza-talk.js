/* ===== zoza-talk.js — النسخة النهائية المنسقة مع صورة زوزا والحوار الصوتي المباشر ===== */
(function () {
  'use strict';
  var AI_URL = '';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[zoza-talk]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('soon-geographie'), ROOT = document.getElementById('talk-root'); if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.soon-card'); if (OLD) OLD.style.display = 'none';
    var $ = function (s, r) { return (r || document).querySelector(s); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }

    var ST = store('bq_talk') || { level: 'b', voice: 1, tr: 1, xp: 0 };
    function save() { store('bq_talk', ST); }
    var S = { topic: null, qi: 0 };

    // قاعدة البيانات المدمجة للمواضيع
    var DATA = {
      talk: {
        "levels": {"b":{"ar":"مبتدئ","ic":"🌱","rate":0.72},"m":{"ar":"متوسط","ic":"🌿","rate":0.85},"a":{"ar":"متقدم","ic":"🌳","rate":0.95}},
        "topics": [
          {"id":"intro","ic":"👋","ar":"التعارف","fr":"Se présenter","hello":{"b":["Faisons connaissance !","لنتعارف!"]},"q":{"b":[["Quel âge as-tu ?","كم عمرك؟",["J’ai … ans."]],["Où habites-tu ?","أين تسكن؟",["J’habite à …"]]]}},
          {"id":"family","ic":"👨‍👩‍👧","ar":"الأسرة","fr":"La famille","hello":{"b":["Parlons de ta famille !","لنتحدث عن أسرتك!"]},"q":{"b":[["Tu as des frères et des sœurs ?","هل لديك إخوة وأخوات؟",["Oui, j’ai un frère."]]]} },
          {"id":"school","ic":"🏫","ar":"المدرسة","fr":"L’école","hello":{"b":["Parlons de l’école !","لنتحدث عن المدرسة!"]},"q":{"b":[["Tu aimes l’école ?","هل تحب المدرسة؟",["Oui, j’aime l’école."]]]} },
          {"id":"food","ic":"🍽️","ar":"الطعام","fr":"La nourriture","hello":{"b":["Parlons de nourriture !","لنتحدث عن الطعام!"]},"q":{"b":[["Quel est ton plat préféré ?","ما طبقك المفضل؟",["Mon plat préféré est …"]]]}}
        ]
      }
    };

    // تصميم CSS منسق وجميل يظهر البطاقة وصورة زوزا والأزرار بشكل احترافي
    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937;font-family:inherit}.tk *{box-sizing:border-box}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;border-radius:24px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);box-shadow:0 8px 20px rgba(124,58,237,.3);margin-bottom:12px}' +
      '.tk-rob{display:block;margin:0 auto 8px;height:110px;width:110px;object-fit:cover;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.2)}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.25);border-radius:12px;padding:4px 10px;font-size:.75rem;font-weight:800;margin:2px}' +
      '.tk-card{background:#fff;border:1px solid #e9d5ff;border-radius:18px;padding:10px;margin-bottom:10px}' +
      '.tk-lv{display:flex;gap:6px;margin-bottom:6px}.tk-lv button{flex:1;border:2px solid #e9d5ff;background:#faf5ff;border-radius:12px;padding:8px 4px;font-weight:900;font-size:.8rem;color:#6b21a8}' +
      '.tk-lv button.on{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border-color:transparent}' +
      '.tk-tp{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.tk-tp button{flex:none;border:1px solid #e9d5ff;background:#fff;border-radius:16px;padding:6px 12px;font-weight:800;font-size:.78rem;color:#6b21a8}' +
      '.tk-tp button.on{background:#7c3aed;color:#fff}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:20px;padding:10px;height:min(50vh,400px);overflow-y:auto;display:flex;flex-direction:column;gap:10px}' +
      '.tk-m{display:flex;gap:7px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:34px;height:34px;flex:none;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #f9a8d4;font-size:1.1rem}' +
      '.tk-b{max-width:84%;background:#fff;border-radius:16px;padding:10px;box-shadow:0 2px 6px rgba(0,0,0,.06)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:.98rem;font-weight:700;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:4px;padding-top:4px;border-top:1px dashed #e5e7eb;font-size:.84rem;color:#4b5563}' +
      '.tk-bt{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.tk-bt button{border:0;border-radius:12px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.72rem;padding:5px 9px}' +
      '.tk-sg{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.tk-sg button{border:1.5px solid #c4b5fd;background:#fff;color:#6d28d9;border-radius:14px;padding:6px 10px;font-weight:800;font-size:.78rem;direction:ltr}' +
      '.tk-in{display:flex;gap:6px;margin-top:6px}.tk-in input{flex:1;min-width:0;border:2px solid #e9d5ff;border-radius:14px;padding:10px;font-size:.95rem;direction:ltr}.tk-in input:focus{outline:0;border-color:#7c3aed}' +
      '.tk-in button{border:0;border-radius:14px;min-width:44px;font-weight:900;color:#fff;background:linear-gradient(135deg,#7c3aed,#db2777)}' +
      '.tk-in button.mic{background:linear-gradient(135deg,#f59e0b,#ef4444)}' +
      '.tk-in button.mic.rec{animation:tkP 1s infinite}@keyframes tkP{50%{transform:scale(1.08)}}' +
      '.tk-ft{display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap}.tk-ft button{border:0;border-radius:14px;padding:8px 12px;font-weight:800;background:#f3e8ff;color:#6b21a8}';
    document.head.appendChild(st);

    function say(text) { try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {} }

    function lvlBtns() { return ['b', 'm', 'a'].map(function (l) { var x = DATA.talk.levels[l]; return '<button type="button" data-lv="' + l + '" class="' + (ST.level === l ? 'on' : '') + '">' + x.ic + ' ' + x.ar + '</button>'; }).join(''); }
    function tpChips() { return '<button type="button" data-tp="free" class="' + (!S.topic ? 'on' : '') + '">🎲 أي موضوع</button>' + DATA.talk.topics.map(function (t) { return '<button type="button" data-tp="' + t.id + '" class="' + (S.topic && S.topic.id === t.id ? 'on' : '') + '">' + t.ic + ' ' + esc(t.ar) + '</button>'; }).join(''); }

    var MSG = [];
    function mount() {
      ROOT.innerHTML = '<div class="tk">' +
        '<div class="tk-hero">' +
          '<img class="tk-rob" src="assets/zoza-full.png" alt="Zoza" onerror="this.src=\'https://i.imgur.com/8Km9tWW.png\'">' +
          '<h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza</small><br>' +
          '<span class="tk-chip">🟢 جاهزة للحديث المباشر</span><span class="tk-chip">✨ ' + ST.xp + ' XP</span>' +
        '</div>' +
        '<div class="tk-card">' +
          '<div class="tk-lv" id="tk-lv">' + lvlBtns() + '</div>' +
          '<div class="tk-tp" id="tk-tp">' + tpChips() + '</div>' +
        '</div>' +
        '<div class="tk-chat" id="tk-chat"></div>' +
        '<div class="tk-sg" id="tk-sg"></div>' +
        '<div class="tk-in">' +
          '<button type="button" class="mic" id="tk-mic" data-act="mic" title="تحدث لصديقتك زوزا">🎤</button>' +
          '<input id="tk-ip" type="text" placeholder="اكتب بالفرنسية أو تحدث بالميكروفون…">' +
          '<button type="button" data-act="send">➤</button>' +
        '</div>' +
        '<div class="tk-ft"><button type="button" data-act="new">🔄 حوار جديد</button></div>' +
      '</div>';
      greet();
    }

    function chat() { return $('#tk-chat'); }
    function scrollDown() { var c = chat(); if (c) c.scrollTop = c.scrollHeight; }

    function addZ(fr, ar, sug) {
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div'); d.className = 'tk-m z';
      d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div><div class="tk-bt"><button type="button" data-a="say" data-m="' + id + '">🔊 اسمع</button></div></div>';
      chat().appendChild(d); scrollDown(); if (ST.voice) say(fr);
      var sg = $('#tk-sg');
      if (sg) { sg.innerHTML = (sug || []).map(function(s){ return '<button type="button" data-fill="' + esc(s) + '">' + esc(s) + '</button>'; }).join(''); }
    }

    function addU(text) {
      var d = document.createElement('div'); d.className = 'tk-m u';
      d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(text) + '</div></div>';
      chat().appendChild(d); scrollDown();
    }

    function T(id) { return DATA.talk.topics.filter(function (t) { return t.id === id; })[0]; }
    function greet() {
      addZ('Bonjour ! Je suis Zoza. De quoi veux-tu parler ?', 'مرحبًا! أنا زوزا. عن ماذا تريد أن نتحدث؟', ['Bonjour Zoza !', 'Je m’appelle…', 'Raconte une blague']);
    }

    function startTopic(id) {
      S.topic = id === 'free' ? null : T(id); S.qi = 0; 
      var tpEl = $('#tk-tp'); if (tpEl) tpEl.innerHTML = tpChips();
      if (!S.topic) { addZ('Parle-moi de ce que tu veux !', 'حدّثني عمّا تشاء!', ['Bonjour !', 'J’aime le français']); return; }
      var h = S.topic.hello[ST.level] || ['Bonjour !', 'مرحبًا!'];
      var q = S.topic.q[ST.level] && S.topic.q[ST.level][0] ? S.topic.q[ST.level][0] : ['Comment ça va ?', 'كيف حالك؟', []];
      addZ(h[0] + ' ' + q[0], h[1] + ' - ' + q[1], q[2] || []);
    }

    function handle(text) {
      text = String(text || '').trim(); if (!text) return;
      addU(text);
      ST.xp += 2; save();
      setTimeout(function () {
        addZ('C’est très bien ! Continue à pratiquer.', 'ممتاز جداً! استمر في التدريب.', ['Oui, bien sûr !', 'Merci Zoza']);
      }, 500);
    }

    // تفعيل الميكروفون الحقيقي للحوار الصوتي المباشر
    function listenSpeech(btn) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت مباشرة، يجدر استخدام متصفح كروم.'); return; }
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
      if ((x = t.closest('[data-lv]'))) { ST.level = x.dataset.lv; save(); var lvEl = $('#tk-lv'); if (lvEl) lvEl.innerHTML = lvlBtns(); return; }
      if ((x = t.closest('[data-tp]'))) { startTopic(x.dataset.tp); return; }
      if ((x = t.closest('[data-fill]'))) { var ip = $('#tk-ip'); if(ip) { ip.value = x.dataset.fill; ip.focus(); } return; }
      if ((x = t.closest('[data-act="send"]'))) { var i = $('#tk-ip'); if(i) { handle(i.value); i.value = ''; } return; }
      if ((x = t.closest('[data-act="mic"]'))) { listenSpeech(x); return; }
      if ((x = t.closest('[data-act="new"]'))) { S = { topic: null, qi: 0 }; MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.closest('[data-a="say"]'))) { var m = MSG[+x.dataset.m]; if (m) say(m.fr); return; }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target; handle(i.value); i.value = ''; } });

    mount();
  }
})();
