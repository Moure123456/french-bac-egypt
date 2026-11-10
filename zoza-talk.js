/* ===== zoza-talk.js — «حوار مع صديقتي Zoza» ===== */
(function () {
  'use strict';
  var AI_URL = ''; 
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { console.error('[zoza-talk]', e); } });

  function boot() {
    var SEC = document.getElementById('soon-geographie'), ROOT = document.getElementById('talk-root'); 
    if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.soon-card'); if (OLD) OLD.style.display = 'none';
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }

    var ST = store('bq_talk') || { level: 'b', voice: 1, xp: 0 };
    function save() { store('bq_talk', ST); }
    var S = { topic: null, qi: 0 };
    var DATA = { talk: null }, MSG = [];

    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937}.tk *{box-sizing:border-box}.tk button,.tk input{font-family:inherit}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;overflow:hidden;border-radius:26px;padding:14px 12px 12px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);margin-bottom:12px}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.22);border-radius:14px;padding:4px 11px;font-size:.76rem;font-weight:800;margin:2px}' +
      '.tk-card{background:#fff;border:1px solid #e9d5ff;border-radius:20px;padding:10px;margin-bottom:10px}.tk-lv{display:flex;gap:6px}.tk-lv button{flex:1;border:2px solid #e9d5ff;background:#faf5ff;border-radius:14px;padding:9px 4px;font-weight:900;font-size:.82rem;color:#6b21a8}.tk-lv button.on{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-tp{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px}.tk-tp button{flex:none;border:1px solid #e9d5ff;background:#fff;border-radius:18px;padding:7px 12px;font-weight:800;font-size:.8rem;color:#6b21a8}.tk-tp button.on{background:#7c3aed;color:#fff}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:22px;padding:10px 8px;height:min(56vh,470px);overflow-y:auto;display:flex;flex-direction:column;gap:10px}' +
      '.tk-m{display:flex;gap:7px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:36px;flex:none;background:#fff;border-radius:50%;padding:3px 2px 0;border:2px solid #f9a8d4;text-align:center}' +
      '.tk-b{max-width:86%;background:#fff;border-radius:18px;padding:9px 11px;box-shadow:0 3px 9px rgba(0,0,0,.08)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:1rem;font-weight:700;line-height:1.75;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:4px;padding-top:4px;border-top:1px dashed #e5e7eb;font-size:.86rem;color:#4b5563}' +
      '.tk-bt{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.tk-bt button{border:0;border-radius:14px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.74rem;padding:6px 10px}' +
      '.tk-sg{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.tk-sg button{border:1.5px solid #c4b5fd;background:#fff;color:#6d28d9;border-radius:16px;padding:7px 12px;font-weight:800;font-size:.8rem;direction:ltr}' +
      '.tk-in{display:flex;gap:6px;margin-top:8px}.tk-in input{flex:1;min-width:0;border:2px solid #e9d5ff;border-radius:16px;padding:12px;font-size:1rem;direction:ltr}.tk-in input:focus{outline:0;border-color:#7c3aed}' +
      '.tk-in button{border:0;border-radius:16px;min-width:48px;font-weight:900;color:#fff;background:linear-gradient(135deg,#7c3aed,#db2777)}' +
      '.tk-ft{display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap}.tk-ft button{border:0;border-radius:16px;padding:9px 14px;font-weight:800;background:#f3e8ff;color:#6b21a8}';
    document.head.appendChild(st);

    function say(text) {
      try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {}
    }

    // دالة جلب آمنة ومحصنة تتوافق مع جيت هوب بيمجرد رفعها
    function getJson() {
      var paths = ['./data/talk.json', 'data/talk.json', '/french-bac-egypt/data/talk.json'];
      var idx = 0;
      function tryNext() {
        if (idx >= paths.length) return Promise.resolve(null);
        var p = paths[idx++];
        return fetch(p + '?v=' + Date.now())
          .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
          .catch(tryNext);
      }
      return tryNext();
    }

    var LEVEL_NAMES = { b: { ic: '🌱', ar: 'مبتدئ' }, m: { ic: '🌿', ar: 'متوسط' }, a: { ic: '🌳', ar: 'متقدم' } };
    function lvlBtns() { 
      return ['b', 'm', 'a'].map(function (l) { 
        var x = LEVEL_NAMES[l]; 
        return '<button type="button" data-lv="' + l + '" class="' + (ST.level === l ? 'on' : '') + '">' + x.ic + ' ' + x.ar + '</button>'; 
      }).join(''); 
    }
    
    function tpChips() { 
      return '<button type="button" data-tp="free" class="' + (!S.topic ? 'on' : '') + '">🎲 أي موضوع</button>' + 
        (DATA.talk.topics || []).map(function (t) { return '<button type="button" data-tp="' + t.id + '" class="' + (S.topic && S.topic.id === t.id ? 'on' : '') + '">' + (t.ic || '💬') + ' ' + esc(t.ar) + '</button>'; }).join(''); 
    }
    
    function mount() {
      ROOT.innerHTML = '<div class="tk"><div class="tk-hero">' +
        '<h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza</small><br>' +
        '<span class="tk-chip">🟢 جاهزة للحديث</span><span class="tk-chip">✨ ' + ST.xp + ' XP</span></div>' +
        '<div class="tk-card"><div class="tk-lv" id="tk-lv">' + lvlBtns() + '</div><div class="tk-tp" id="tk-tp">' + tpChips() + '</div></div>' +
        '<div class="tk-chat" id="tk-chat"></div><div class="tk-sg" id="tk-sg"></div>' +
        '<div class="tk-in"><input id="tk-ip" type="text" placeholder="اكتب بالفرنسية…"><button type="button" data-act="send">➤</button></div>' +
        '<div class="tk-ft"><button type="button" data-act="new">🔄 حوار جديد</button></div></div>';
      greet();
    }

    function chat() { return $('#tk-chat'); }
    function scrollDown() { var c = chat(); if (c) c.scrollTop = c.scrollHeight; }
    
    function addZ(fr, ar, sug) {
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div'); d.className = 'tk-m z';
      d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div><div class="tk-bt"><button type="button" data-a="say" data-m="' + id + '">🔊</button></div></div>';
      chat().appendChild(d); scrollDown(); if (ST.voice) say(fr);
      var sg = $('#tk-sg');
      if (sg) {
        sg.innerHTML = (sug || []).map(function(s){ return '<button type="button" data-fill="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');
      }
    }
    
    function addU(text) {
      var d = document.createElement('div'); d.className = 'tk-m u';
      d.innerHTML = '<div class="tk-b"><div class="tk-fr">' + esc(text) + '</div></div>';
      chat().appendChild(d); scrollDown();
    }

    function T(id) { return (DATA.talk.topics || []).filter(function (t) { return t.id === id; })[0]; }
    function greet() {
      addZ('Bonjour ! Je suis Zoza. De quoi veux-tu parler ?', 'مرحبًا! أنا زوزا. عن ماذا تريد أن نتحدث؟', ['Bonjour Zoza !', 'Je m’appelle…', 'Raconte une blague']);
    }
    
    function startTopic(id) {
      S.topic = id === 'free' ? null : T(id); S.qi = 0; 
      var tpEl = $('#tk-tp'); if (tpEl) tpEl.innerHTML = tpChips();
      if (!S.topic) { addZ('Parle-moi de ce que tu veux !', 'حدّثني عمّا تشاء!', ['Bonjour !', 'J’aime le français']); return; }
      var h = S.topic.hello && S.topic.hello[ST.level] ? S.topic.hello[ST.level] : ['Bonjour !', 'مرحبًا!'];
      var q = S.topic.q && S.topic.q[ST.level] && S.topic.q[ST.level][0] ? S.topic.q[ST.level][0] : ['Comment ça va ?', 'كيف حالك؟', []];
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

    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-lv]'))) { ST.level = x.dataset.lv; save(); var lvEl = $('#tk-lv'); if (lvEl) lvEl.innerHTML = lvlBtns(); return; }
      if ((x = t.closest('[data-tp]'))) { startTopic(x.dataset.tp); return; }
      if ((x = t.closest('[data-fill]'))) { var ip = $('#tk-ip'); if(ip) { ip.value = x.dataset.fill; ip.focus(); } return; }
      if ((x = t.closest('[data-act="send"]'))) { var i = $('#tk-ip'); if(i) { handle(i.value); i.value = ''; } return; }
      if ((x = t.closest('[data-act="new"]'))) { S = { topic: null, qi: 0 }; MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.closest('[data-a="say"]'))) { var m = MSG[+x.dataset.m]; if (m) say(m.fr); return; }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target; handle(i.value); i.value = ''; } });

    ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:#7c3aed">⏳ جاري تحميل زوزا...</div>';
    
    getJson().then(function (talkData) {
      if (!talkData || !talkData.topics) {
        ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:red">⚠️ تعذّر تحميل talk.json — تأكد من وجوده داخل مجلد data ومساره الصحيح.</div>';
        return;
      }
      DATA.talk = talkData;
      mount();
    }).catch(function() {
      ROOT.innerHTML = '<div style="text-align:center;padding:20px;color:red">⚠️ حدث خطأ أثناء الاتصال وجلب الملفات.</div>';
    });
  }
})();
