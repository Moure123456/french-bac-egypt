/* ===== zoza-talk.js — النسخة النهائية مع صورة زوزا الأصلية والوضع الذكي ===== */
(function () {
  'use strict';
  // رابط الـ Worker الخاص بك
  var AI_URL = 'https://zoza-worker.moure123456.workers.dev';

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
    var S = { level: 'b', hist: [] };

    // تصميم الواجهة مع ربط صورة زوزا الأصلية (zoza-pink.png) والحركة التفاعلية
    var st = document.createElement('style');
    st.textContent = '.tk{color:#1f2937;font-family:inherit}.tk *{box-sizing:border-box}.tk button{cursor:pointer}' +
      '.tk-hero{position:relative;border-radius:24px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#be185d,#7c3aed 55%,#4338ca);box-shadow:0 8px 20px rgba(124,58,237,.3);margin-bottom:12px}' +
      '.tk-rob{display:block;margin:0 auto 8px;height:110px;width:110px;object-fit:cover;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:zozaMove 3.5s ease-in-out infinite;background:#fff}' +
      '@keyframes zozaMove{0%,100%{transform:translate(0,0) rotate(0deg) scale(1);} 25%{transform:translate(-5px,-4px) rotate(-3deg) scale(1.03);} 50%{transform:translate(5px,4px) rotate(3deg) scale(0.98);} 75%{transform:translate(-3px,4px) rotate(-2deg) scale(1.02);}}' +
      '.tk-chip{display:inline-block;background:rgba(255,255,255,.25);border-radius:12px;padding:4px 10px;font-size:.75rem;font-weight:800;margin:2px}' +
      '.tk-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border:1px solid #e9d5ff;border-radius:20px;padding:10px;height:min(50vh,400px);overflow-y:auto;display:flex;flex-direction:column;gap:10px}' +
      '.tk-m{display:flex;gap:7px;align-items:flex-end}.tk-m.u{flex-direction:row-reverse}.tk-av{width:34px;height:34px;flex:none;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #f9a8d4;font-size:1.1rem}' +
      '.tk-b{max-width:84%;background:#fff;border-radius:16px;padding:10px;box-shadow:0 2px 6px rgba(0,0,0,.06)}.tk-m.u .tk-b{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}' +
      '.tk-fr{font-size:.98rem;font-weight:700;direction:ltr;text-align:left}.tk-m.u .tk-fr{color:#fff}.tk-ar{margin-top:4px;padding-top:4px;border-top:1px dashed #e5e7eb;font-size:.84rem;color:#4b5563}' +
      '.tk-bt{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.tk-bt button{border:0;border-radius:12px;background:#f3e8ff;color:#6b21a8;font-weight:800;font-size:.72rem;padding:5px 9px}' +
      '.tk-fx{margin-top:6px;border-radius:12px;padding:6px 8px;font-size:.78rem;color:#047857;background:#ecfdf5;border:1px solid #6ee7b7}' +
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
          // استخدام صورة زوزا الأصلية zoza-pink.png الموجودة بجوار index
          '<img class="tk-rob" src="zoza-pink.png" alt="Zoza">' +
          '<h3>حوار مع صديقتي Zoza</h3><small>Discute avec Zoza (Mode IA)</small><br>' +
          '<span class="tk-chip">🧠 حوار ذكي مع زوزا</span><span class="tk-chip">✨ ' + ST.xp + ' XP</span>' +
        '</div>' +
        '<div class="tk-chat" id="tk-chat"></div>' +
        '<div class="tk-in">' +
          '<button type="button" class="mic" id="tk-mic" data-act="mic" title="تحدث بالميكروفون">🎤</button>' +
          '<input id="tk-ip" type="text" placeholder="تحدث مع زوزا في أي موضوع بالفرنسية…">' +
          '<button type="button" data-act="send">➤</button>' +
        '</div>' +
        '<div class="tk-ft"><button type="button" data-act="new">🔄 حوار جديد</button></div>' +
      '</div>';
      greet();
    }

    function chat() { return $('#tk-chat'); }
    function scrollDown() { var c = chat(); if (c) c.scrollTop = c.scrollHeight; }

    function addZ(fr, ar, opt) {
      opt = opt || {};
      var id = MSG.push({ fr: fr, ar: ar }) - 1;
      var d = document.createElement('div'); d.className = 'tk-m z';
      var fixHtml = opt.fix ? '<div class="tk-fx"><b>✏️ تصحيح:</b> <span dir="ltr">' + esc(opt.fix.wrong) + '</span> ← <b dir="ltr">' + esc(opt.fix.right) + '</b><br>' + esc(opt.fix.why_ar) + '</div>' : '';
      d.innerHTML = '<div class="tk-av">🤖</div><div class="tk-b"><div class="tk-fr">' + esc(fr) + '</div><div class="tk-ar">' + esc(ar) + '</div>' + fixHtml + '<div class="tk-bt"><button type="button" data-a="say" data-m="' + id + '">🔊 اسمع</button></div></div>';
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

    // محرك احتياطي ذكي للطوارئ يضمن استمرار الحوار الفوري بدون انقطاع
    function getFallbackReply(text) {
      return {
        fr: 'C’est une excellente remarque : « ' + text + ' ». Peux-tu m’en dire plus ?',
        ar: 'هذه ملاحظة ممتازة: « ' + text + ' ». هل يمكنك إخباري بالمزيد؟'
      };
    }

    function askAI(text) {
      S.hist.push({ role: 'user', content: text });
      
      fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: S.level, message: text, history: S.hist })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(function(data) {
        if (data.reply_fr) {
          S.hist.push({ role: 'assistant', content: data.reply_fr });
          var correction = (data.corrections && data.corrections[0]) ? data.corrections[0] : null;
          addZ(data.reply_fr, data.reply_ar, { fix: correction });
          ST.xp += 5; save();
        } else {
          var fb = getFallbackReply(text);
          addZ(fb.fr, fb.ar);
        }
      })
      .catch(function(err) {
        console.warn('Fallback active:', err);
        var fb = getFallbackReply(text);
        addZ(fb.fr, fb.ar);
      });
    }

    function handle(text) {
      text = String(text || '').trim(); if (!text) return;
      addU(text);
      askAI(text);
    }

    function listenSpeech(btn) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت مباشرة.'); return; }
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
      if ((x = t.closest('[data-act="new"]'))) { S.hist = []; MSG = []; chat().innerHTML = ''; greet(); return; }
      if ((x = t.exports || t.closest('[data-a="say"]'))) { var m = MSG[+x.dataset.m]; if (m) say(m.fr); return; }
    });

    ROOT.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tk-ip') { var i = e.target; handle(i.value); i.value = ''; } });

    mount();
  }
})();
