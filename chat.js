/* ===== chat.js — شات الطلاب المباشر (نسخة متقدمة) =====
   نص + رسائل صوتية + صور + إيموجي + تفاعلات + رد على رسالة + مؤشر الكتابة
   + عدد المتصلين + إشعارات. يعمل على Firebase Realtime Database الحالية. */
(function () {
  'use strict';
  if (window.__cxStarted) return;
  window.__cxStarted = true;

  var CFG = {
    apiKey: 'AIzaSyAoFJex9rrYUgyyEUtw9TV9rhriFVyag8Y',
    authDomain: 'frenchbacchat.firebaseapp.com',
    databaseURL: 'https://frenchbacchat-default-rtdb.firebaseio.com',
    projectId: 'frenchbacchat',
    storageBucket: 'frenchbacchat.firebasestorage.app',
    messagingSenderId: '692488273461',
    appId: '1:692488273461:web:efa14361a054f3287d3b7c'
  };
  var REACT = [['like', '👍'], ['love', '❤️'], ['haha', '😂'], ['wow', '😮'], ['sad', '😢'], ['clap', '👏']];
  var EMO = [
    ['😀', '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😍 🥰 😘 😋 😎 🤩 🥳 🤔 😮 😢 😭 😡 🤗 😴 🙃 😇 🤓 😬 😱'],
    ['👍', '👍 👎 👏 🙌 🙏 💪 ✌️ 👌 🤝 👋 ✍️ 👀 🧠 💡 🔥 ⭐ ✨ 🎉 🏆 🎯'],
    ['❤️', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💯 ✅ ❌ ❓ ❗ 💬 🎵'],
    ['📚', '📚 📖 ✏️ 📝 🎓 🇫🇷 🥐 🥖 🧀 🍷 🗼 🚆 ☕ 🌍 🕐 🏫']
  ];
  var MAX_B64 = 400000, MAX_REC = 90;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }
  ready(function () {
    try { boot(); } catch (e) { try { console.error('[chat]', e); } catch (_) {} }
  });

  function boot() {
    var box = document.getElementById('chat-messages-container');
    if (!box) return;
    if (typeof firebase === 'undefined' || !firebase.database) {
      box.innerHTML = '<div style="padding:14px">تعذّر تحميل خدمة الشات. تأكد من الاتصال بالإنترنت.</div>';
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    var db = firebase.database();
    var TS = firebase.database.ServerValue.TIMESTAMP;

    /* ---------- أدوات ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function store(k, v) {
      try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) {}
      return '';
    }
    function hash(s) { var h = 0, i; s = String(s); for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function color(seed) { return 'hsl(' + (hash(seed) % 360) + ',55%,38%)'; }
    function initial(n) { n = String(n || '').trim(); return n ? Array.from(n)[0].toUpperCase() : '؟'; }
    function fmtT(s) { s = Math.max(0, Math.round(s || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
    function timeStr(ts) { try { return new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
    function dayLabel(ts) {
      var d = new Date(ts);
      if (d.toDateString() === new Date().toDateString()) return 'اليوم';
      if (d.toDateString() === new Date(Date.now() - 864e5).toDateString()) return 'أمس';
      try { return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }); } catch (e) { return d.toDateString(); }
    }
    function linkify(h) { return h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
    var EMO_RE = null;
    try { EMO_RE = new RegExp('^(?:\\p{Extended_Pictographic}|\\u200d|\\ufe0f|\\s)+$', 'u'); } catch (e) {}
    function isBig(t) { return !!(EMO_RE && t && t.length <= 12 && EMO_RE.test(t)); }
    function isAdmin() {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf('section_unlocked_') === 0 && localStorage.getItem(k) === 'true') return true;
        }
      } catch (e) {}
      return false;
    }

    /* ---------- الحالة ---------- */
    var ME = { uid: store('cx_uid'), name: store('cx_name') };
    if (!ME.uid) { ME.uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); store('cx_uid', ME.uid); }
    var sndOn = store('cx_snd') !== 'off';
    var msgs = {}, voices = {}, imgCache = {};
    var lastDay = '', ready0 = false, unread = 0, newCount = 0, reply = null, lastSend = 0, rec = null;

    /* ---------- الواجهة ---------- */
    var CSS = '' +
      '.cx{display:flex;flex-direction:column;background:#fff;border:1px solid #d5deea;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(0,40,100,.1);position:relative;font-family:inherit}' +
      '.cx [hidden]{display:none!important}' +
      '.cx-head{background:linear-gradient(135deg,#0055A5,#0a7ad6);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px}' +
      '.cx-head small{display:block;font-size:.75rem;opacity:.92}' +
      '.cx-ic{border:0;background:transparent;font-size:1.25rem;cursor:pointer;padding:6px 8px;border-radius:10px;color:inherit;font-family:inherit}' +
      '.cx-head .cx-ic{color:#fff}.cx-me{font-size:.85rem!important;background:rgba(255,255,255,.18)!important}' +
      '.cx-list{height:min(62vh,520px);overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:6px;background:#eef3fa;background-image:radial-gradient(#dbe5f3 1px,transparent 1px);background-size:18px 18px;-webkit-overflow-scrolling:touch}' +
      '.cx-empty{margin:auto;color:#667;text-align:center;padding:16px;line-height:1.9}' +
      '.cx-day{align-self:center;background:rgba(0,40,100,.12);color:#334;border-radius:999px;padding:2px 12px;font-size:.75rem;margin:4px 0}' +
      '.cx-row{display:flex;gap:6px;align-items:flex-end;max-width:90%}' +
      '.cx-row.mine{margin-inline-end:auto}.cx-row.other{margin-inline-start:auto;flex-direction:row-reverse}' +
      '.cx-av{flex:0 0 30px;height:30px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem}' +
      '.cx-bub{position:relative;background:#fff;border:1px solid #e1e8f2;border-radius:16px;padding:7px 10px 5px;word-break:break-word;min-width:64px;box-shadow:0 1px 2px rgba(0,0,0,.05);color:#223}' +
      '.cx-row.mine .cx-bub{background:linear-gradient(135deg,#0a7ad6,#0055A5);color:#fff;border-color:#0055A5}' +
      '.cx-bub.big{background:transparent!important;border:0!important;box-shadow:none!important;color:inherit}' +
      '.cx-bub.big .cx-text{font-size:2.4rem;line-height:1.3}' +
      '.cx-flash{animation:cxfl 1.2s ease}@keyframes cxfl{0%,60%{box-shadow:0 0 0 4px rgba(229,72,61,.5)}100%{box-shadow:none}}' +
      '.cx-who{font-weight:700;font-size:.78rem;margin-bottom:1px}' +
      '.cx-quote{display:flex;flex-direction:column;border-inline-start:3px solid #e5483d;background:rgba(0,0,0,.08);border-radius:8px;padding:3px 8px;margin-bottom:4px;font-size:.78rem;cursor:pointer}' +
      '.cx-text{white-space:pre-wrap;line-height:1.65;font-size:.95rem}.cx-text a{color:inherit;text-decoration:underline}' +
      '.cx-meta{display:flex;align-items:center;gap:6px;font-size:.68rem;opacity:.8;margin-top:2px}' +
      '.cx-act{display:flex;gap:2px;margin-inline-start:auto}.cx-act button{border:0;background:none;color:inherit;cursor:pointer;font-size:.85rem;padding:0 4px;opacity:.85}' +
      '.cx-rp{display:flex;gap:4px;margin-top:4px;background:#fff;border:1px solid #d5deea;border-radius:999px;padding:3px 8px;width:max-content;max-width:100%;overflow-x:auto}' +
      '.cx-rp button{border:0;background:none;font-size:1.35rem;cursor:pointer;padding:0 3px}' +
      '.cx-rx{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}.cx-rx:empty{display:none}' +
      '.cx-chip{border:1px solid #d5deea;background:#fff;color:#223;border-radius:999px;padding:0 8px;font-size:.82rem;cursor:pointer;font-family:inherit}.cx-chip.on{background:#dff0ff;border-color:#0a7ad6}' +
      '.cx-voice{display:flex;align-items:center;gap:8px;min-width:215px}' +
      '.cx-pl{flex:0 0 36px;height:36px;border-radius:50%;border:0;background:#0055A5;color:#fff;cursor:pointer;font-size:1rem}.cx-row.mine .cx-pl{background:#fff;color:#0055A5}' +
      '.cx-wave{flex:1;display:flex;align-items:center;gap:2px;height:30px}.cx-wave i{flex:1;background:currentColor;opacity:.3;border-radius:2px;min-width:2px}.cx-wave i.on{opacity:1}' +
      '.cx-vt{font-size:.75rem;font-variant-numeric:tabular-nums}' +
      '.cx-sp{border:1px solid currentColor;background:transparent;color:inherit;border-radius:8px;font-size:.7rem;padding:1px 5px;cursor:pointer;opacity:.85}' +
      '.cx-imgw{min-width:140px;min-height:90px;border-radius:12px;overflow:hidden;background:rgba(0,0,0,.07);display:flex;align-items:center;justify-content:center}' +
      '.cx-imgw img{display:block;max-width:100%;max-height:260px;cursor:zoom-in}' +
      '.cx-typing{padding:3px 14px;font-size:.78rem;color:#556;background:#fff}' +
      '.cx-reply{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#fff;border-top:1px solid #e1e8f2;border-inline-start:4px solid #e5483d;padding:6px 10px;font-size:.85rem}' +
      '.cx-reply span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-reply button{border:0;background:none;cursor:pointer;font-size:1rem}' +
      '.cx-emo{border-top:1px solid #e1e8f2;background:#fff;padding:6px}' +
      '.cx-etabs{display:flex;gap:4px;margin-bottom:4px}.cx-etabs button{border:1px solid #d5deea;background:#fff;border-radius:10px;font-size:1.2rem;padding:2px 10px;cursor:pointer}.cx-etabs button.on{background:#dff0ff;border-color:#0a7ad6}' +
      '.cx-eg{display:flex;flex-wrap:wrap;gap:2px;max-height:130px;overflow-y:auto}.cx-eg button{border:0;background:none;font-size:1.5rem;cursor:pointer;padding:2px 4px}' +
      '.cx-comp,.cx-name,.cx-rec{display:flex;align-items:center;gap:6px;padding:8px;background:#fff;border-top:1px solid #e1e8f2}' +
      '.cx-in,.cx-nin{flex:1;min-width:0;font-size:16px;padding:10px 14px;border:1px solid #d5deea;border-radius:999px;background:#f6f8fb;font-family:inherit}' +
      '.cx-main,.cx-nok,.cx-rs{flex:0 0 44px;height:44px;border-radius:50%;border:0;background:#0055A5;color:#fff;font-size:1.2rem;cursor:pointer}' +
      '.cx-nok{border-radius:999px;flex:0 0 auto;padding:0 18px;font-size:1rem;font-family:inherit;font-weight:700}' +
      '.cx-rc{border:1px solid #d5deea;background:#fff;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:1.1rem}' +
      '.cx-dot{color:#e5483d;animation:cxbl 1s infinite}@keyframes cxbl{50%{opacity:.2}}' +
      '.cx-rt{font-weight:800;font-variant-numeric:tabular-nums;min-width:40px}' +
      '.cx-lv{flex:1;display:flex;align-items:center;gap:2px;height:34px}.cx-lv i{flex:1;background:#0a7ad6;border-radius:2px;height:12%;min-width:2px;transition:height .08s}' +
      '.cx-down{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);background:#0055A5;color:#fff;border:0;border-radius:999px;padding:6px 14px;font-family:inherit;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25);z-index:5}' +
      '.cx-toast{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(20,30,50,.92);color:#fff;border-radius:12px;padding:8px 14px;font-size:.85rem;z-index:6;max-width:90%;text-align:center}' +
      '.cx-lb{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.85);z-index:99997;display:flex;align-items:center;justify-content:center;padding:12px}.cx-lb img{max-width:100%;max-height:100%;border-radius:10px}';

    if (!document.getElementById('cx-css')) {
      var st = document.createElement('style');
      st.id = 'cx-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    box.innerHTML =
      '<div class="cx">' +
      '<div class="cx-head"><div><b>💬 شات الطلاب المباشر</b><small class="cx-online">🟢 ...</small></div>' +
      '<div><button type="button" class="cx-ic cx-snd" aria-label="إشعارات الصوت">' + (sndOn ? '🔔' : '🔕') + '</button>' +
      '<button type="button" class="cx-ic cx-me"></button></div></div>' +
      '<div class="cx-list" role="log" aria-live="polite"><div class="cx-empty">جارٍ تحميل الرسائل...</div></div>' +
      '<button type="button" class="cx-down" hidden></button>' +
      '<div class="cx-typing" hidden></div>' +
      '<div class="cx-reply" hidden><span dir="auto"></span><button type="button" class="cx-rcl" aria-label="إلغاء الرد">✖</button></div>' +
      '<div class="cx-emo" hidden><div class="cx-etabs"></div><div class="cx-eg"></div></div>' +
      '<div class="cx-name" hidden><input type="text" class="cx-nin" maxlength="20" placeholder="اكتب اسمك لتبدأ المشاركة" autocomplete="nickname"><button type="button" class="cx-nok">ابدأ</button></div>' +
      '<div class="cx-comp" hidden><button type="button" class="cx-ic cx-emb" aria-label="إيموجي">😊</button>' +
      '<input type="text" class="cx-in" maxlength="500" placeholder="اكتب رسالة..." autocomplete="off" enterkeyhint="send">' +
      '<button type="button" class="cx-ic cx-imb" aria-label="إرسال صورة">📷</button><input type="file" class="cx-file" accept="image/*" hidden>' +
      '<button type="button" class="cx-main" aria-label="إرسال">🎙️</button></div>' +
      '<div class="cx-rec" hidden><button type="button" class="cx-rc cx-rcancel" aria-label="إلغاء">🗑</button><span class="cx-dot">●</span><span class="cx-rt">0:00</span>' +
      '<div class="cx-lv">' + new Array(25).join('<i></i>') + '</div><button type="button" class="cx-rs cx-rsend" aria-label="إرسال التسجيل">➤</button></div>' +
      '<div class="cx-toast" hidden></div></div>';

    var root = $('.cx', box), list = $('.cx-list', root), inp = $('.cx-in', root), mainBtn = $('.cx-main', root);
    var sec = document.getElementById('student-chat');

    var toastT = null;
    function toast(t) {
      var el = $('.cx-toast', root);
      el.textContent = t;
      el.hidden = false;
      clearTimeout(toastT);
      toastT = setTimeout(function () { el.hidden = true; }, 2600);
    }
    function nearBottom() { return list.scrollHeight - list.scrollTop - list.clientHeight < 120; }
    function toBottom(smooth) {
      try { list.scrollTo({ top: list.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) { list.scrollTop = list.scrollHeight; }
    }
    function chatVisible() { return !!(sec && sec.classList.contains('on') && !document.hidden); }

    /* ---------- الاسم ---------- */
    function applyName() {
      var has = !!ME.name;
      $('.cx-name', root).hidden = has;
      $('.cx-comp', root).hidden = !has || !!rec;
      $('.cx-me', root).textContent = has ? '👤 ' + ME.name : '👤';
    }
    function showName() {
      $('.cx-nin', root).value = ME.name;
      $('.cx-name', root).hidden = false;
      $('.cx-comp', root).hidden = true;
    }
    function saveName() {
      var v = ($('.cx-nin', root).value || '').replace(/\s+/g, ' ').trim().slice(0, 20);
      if (!v) { toast('اكتب اسمك أولاً'); return; }
      ME.name = v;
      store('cx_name', v);
      applyName();
      try { db.ref('chat_presence/' + ME.uid).set({ n: ME.name }); } catch (e) {}
    }
    applyName();

    /* ---------- بناء الرسائل ---------- */
    function rxHTML(m) {
      var rx = (m && m.reactions && typeof m.reactions === 'object') ? m.reactions : {};
      return REACT.map(function (p) {
        var o = rx[p[0]], n = o ? Object.keys(o).length : 0;
        if (!n) return '';
        return '<button type="button" class="cx-chip' + (o[ME.uid] ? ' on' : '') + '" data-r="' + p[0] + '">' + p[1] + ' ' + n + '</button>';
      }).join('');
    }
    function waveHTML(id) {
      var h = '', i;
      for (i = 0; i < 28; i++) h += '<i style="height:' + (25 + (hash(id + i) % 70)) + '%"></i>';
      return h;
    }
    function buildMsg(id, m) {
      var mine = !!(m.uid && m.uid === ME.uid);
      var type = m.type || 'text';
      var big = type === 'text' && isBig(m.text);
      var ts = Number(m.timestamp) || Date.now();
      var row = document.createElement('div');
      row.className = 'cx-row ' + (mine ? 'mine' : 'other');
      row.setAttribute('data-id', id);
      var h = '';
      var seed = m.uid || m.sender || '';
      if (!mine) h += '<div class="cx-av" style="background:' + color(seed) + '">' + esc(initial(m.sender)) + '</div>';
      h += '<div class="cx-bub' + (big ? ' big' : '') + '">';
      if (!mine) h += '<div class="cx-who" style="color:' + color(seed) + '">' + esc(m.sender || 'طالب') + '</div>';
      if (m.replyTo && typeof m.replyTo === 'object') {
        h += '<div class="cx-quote" data-go="' + esc(m.replyTo.id || '') + '"><b>' + esc(m.replyTo.name || '') + '</b><span dir="auto">' + esc(m.replyTo.text || '') + '</span></div>';
      }
      if (type === 'voice') {
        h += '<div class="cx-voice"><button type="button" class="cx-pl" data-a="play" aria-label="تشغيل">▶</button><div class="cx-wave">' + waveHTML(id) + '</div><span class="cx-vt">' + fmtT(m.dur) + '</span><button type="button" class="cx-sp" data-a="speed">1×</button></div>';
      } else if (type === 'image') {
        h += '<div class="cx-imgw" data-i="' + esc(id) + '">⏳</div>';
      } else {
        h += '<div class="cx-text" dir="auto">' + linkify(esc(m.text)) + '</div>';
      }
      h += '<div class="cx-meta"><span>' + esc(timeStr(ts)) + '</span><span class="cx-act"><button type="button" data-a="reply" aria-label="رد">↩</button><button type="button" data-a="react" aria-label="تفاعل">😊</button>' +
        ((mine || isAdmin()) ? '<button type="button" data-a="del" aria-label="حذف">🗑</button>' : '') + '</span></div>';
      h += '<div class="cx-rp" hidden>' + REACT.map(function (p) { return '<button type="button" data-r="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>';
      h += '<div class="cx-rx">' + rxHTML(m) + '</div></div>';
      row.innerHTML = h;
      return row;
    }
    function setImg(w, d) {
      var wasNear = nearBottom();
      w.innerHTML = '';
      var im = new Image();
      im.alt = 'صورة';
      im.onload = function () { if (wasNear) toBottom(false); };
      im.src = d;
      w.appendChild(im);
    }
    function loadMedia(id, m) {
      if ((m.type || 'text') !== 'image') return;
      var w = $('[data-i="' + id + '"]', list);
      if (!w) return;
      if (imgCache[id]) { setImg(w, imgCache[id]); return; }
      db.ref('chat_media/' + id).once('value').then(function (s) {
        var d = s.val() && s.val().d;
        if (d) { imgCache[id] = d; setImg(w, d); } else w.textContent = '🖼️ غير متاحة';
      }).catch(function () { w.textContent = '🖼️ تعذّر التحميل'; });
    }

    /* ---------- الإشعارات ---------- */
    var AC2 = null;
    root.addEventListener('pointerdown', function () {
      if (!AC2) { var C = window.AudioContext || window.webkitAudioContext; if (C) { try { AC2 = new C(); } catch (e) {} } }
    });
    function ping() {
      if (!sndOn || !AC2) return;
      try {
        if (AC2.state === 'suspended') AC2.resume();
        var o = AC2.createOscillator(), g = AC2.createGain(), t = AC2.currentTime;
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(1175, t + 0.09);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g);
        g.connect(AC2.destination);
        o.start(t);
        o.stop(t + 0.3);
      } catch (e) {}
    }
    var navBtn = document.querySelector('[data-nav="student-chat"]'), badge = null;
    function setBadge() {
      if (!navBtn) return;
      if (!badge) {
        badge = document.createElement('span');
        badge.style.cssText = 'background:#e5483d;color:#fff;border-radius:999px;padding:1px 7px;font-size:12px;margin-inline-start:6px;display:none;vertical-align:middle';
        navBtn.appendChild(badge);
      }
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.style.display = unread ? 'inline-block' : 'none';
    }
    function showDown() {
      var b = $('.cx-down', root);
      b.textContent = '⬇ ' + newCount + ' رسالة جديدة';
      b.hidden = false;
    }
    function onShow() {
      if (!chatVisible()) return;
      unread = 0;
      setBadge();
      newCount = 0;
      $('.cx-down', root).hidden = true;
      setTimeout(function () { toBottom(false); }, 60);
    }
    if (sec && window.MutationObserver) new MutationObserver(onShow).observe(sec, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', onShow);
    list.addEventListener('scroll', function () { if (nearBottom()) { newCount = 0; $('.cx-down', root).hidden = true; } });

    /* ---------- استقبال الرسائل ---------- */
    function onAdded(id, m) {
      if (!m || msgs[id]) return;
      msgs[id] = m;
      var empty = $('.cx-empty', list);
      if (empty) empty.parentNode.removeChild(empty);
      var ts = Number(m.timestamp) || Date.now(), dk = new Date(ts).toDateString(), near = nearBottom();
      if (dk !== lastDay) {
        lastDay = dk;
        var d = document.createElement('div');
        d.className = 'cx-day';
        d.textContent = dayLabel(ts);
        list.appendChild(d);
      }
      list.appendChild(buildMsg(id, m));
      loadMedia(id, m);
      var mine = !!(m.uid && m.uid === ME.uid);
      if (ready0) {
        if (mine || near) toBottom(true); else { newCount++; showDown(); }
        if (!mine) { if (chatVisible()) ping(); else { unread++; setBadge(); } }
      }
      while (list.children.length > 300) list.removeChild(list.firstChild);
    }
    var q = db.ref('chat_messages').limitToLast(60);
    q.on('child_added', function (s) { onAdded(s.key, s.val()); });
    q.on('child_changed', function (s) {
      var m = s.val(), row = $('[data-id="' + s.key + '"]', list);
      msgs[s.key] = m;
      if (row) { var rx = $('.cx-rx', row); if (rx) rx.innerHTML = rxHTML(m); }
    });
    q.on('child_removed', function (s) {
      var id = s.key;
      // قد يكون خروجاً من نافذة آخر 60 رسالة وليس حذفاً: نتأكد قبل الإزالة
      db.ref('chat_messages/' + id).once('value').then(function (x) {
        if (x.exists()) return;
        var row = $('[data-id="' + id + '"]', list);
        if (row && row.parentNode) row.parentNode.removeChild(row);
        delete msgs[id];
      });
    });
    q.once('value').then(function () {
      ready0 = true;
      if (!Object.keys(msgs).length) list.innerHTML = '<div class="cx-empty">لا توجد رسائل بعد.<br>كن أول من يكتب 👋</div>';
      toBottom(false);
    }).catch(function () {
      list.innerHTML = '<div class="cx-empty">تعذّر تحميل الرسائل. تأكد من قواعد قاعدة البيانات والاتصال.</div>';
    });

    /* ---------- الإرسال ---------- */
    function send(o) {
      if (!ME.name) { showName(); return Promise.resolve(false); }
      var now = Date.now();
      if (now - lastSend < 1000) { toast('انتظر لحظة قبل إرسال رسالة أخرى'); return Promise.resolve(false); }
      lastSend = now;
      var msg = { uid: ME.uid, sender: ME.name, timestamp: TS }, k;
      for (k in o.msg) msg[k] = o.msg[k];
      if (reply) msg.replyTo = reply;
      var ref = db.ref('chat_messages').push();
      var pre = o.node ? db.ref(o.node + '/' + ref.key).set({ d: o.blob }) : Promise.resolve();
      return pre.then(function () { return ref.set(msg); }).then(function () {
        clearReply();
        return true;
      }).catch(function (e) {
        try { console.error('[chat-send]', e); } catch (_) {}
        toast('تعذّر الإرسال. تأكد من الاتصال والصلاحيات.');
        return false;
      });
    }
    function sendText() {
      var t = (inp.value || '').trim().slice(0, 500);
      if (!t) return;
      send({ msg: { type: 'text', text: t } }).then(function (ok) { if (ok) { inp.value = ''; updateMain(); stopTyping(); } });
    }
    function updateMain() { mainBtn.textContent = inp.value.trim() ? '➤' : '🎙️'; }

    function setReply(id) {
      var m = msgs[id];
      if (!m) return;
      var t = m.text ? String(m.text).slice(0, 60) : (m.type === 'voice' ? '🎤 رسالة صوتية' : '📷 صورة');
      reply = { id: id, name: String(m.sender || 'طالب').slice(0, 20), text: t };
      var bar = $('.cx-reply', root);
      $('span', bar).textContent = '↩ ' + reply.name + ': ' + t;
      bar.hidden = false;
      try { inp.focus(); } catch (e) {}
    }
    function clearReply() { reply = null; $('.cx-reply', root).hidden = true; }
    function jump(id) {
      var row = $('[data-id="' + id + '"]', list);
      if (!row) { toast('الرسالة الأصلية قديمة'); return; }
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var b = $('.cx-bub', row);
      b.classList.remove('cx-flash');
      void b.offsetWidth;
      b.classList.add('cx-flash');
    }
    function toggleReact(id, key) {
      var m = msgs[id];
      if (!m) return;
      var has = !!(m.reactions && m.reactions[key] && m.reactions[key][ME.uid]);
      var ref = db.ref('chat_messages/' + id + '/reactions/' + key + '/' + ME.uid);
      (has ? ref.remove() : ref.set(true)).catch(function () { toast('تعذّر إضافة التفاعل'); });
    }
    function delMsg(id) {
      if (!confirm('حذف هذه الرسالة؟')) return;
      db.ref('chat_messages/' + id).remove();
      db.ref('chat_audio/' + id).remove();
      db.ref('chat_media/' + id).remove();
    }

    /* ---------- الرسائل الصوتية: تشغيل ---------- */
    function paint(bars, p) { bars.forEach(function (b, i) { b.classList.toggle('on', i / bars.length < p); }); }
    function stopOthers(id) {
      Object.keys(voices).forEach(function (k) { if (k !== id && voices[k].a && !voices[k].a.paused) voices[k].a.pause(); });
    }
    function playVoice(id, row) {
      var v = voices[id] || (voices[id] = { a: null, speed: 1, loading: false });
      var btn = $('.cx-pl', row), bars = $$('.cx-wave i', row), vt = $('.cx-vt', row), dur = Number(msgs[id] && msgs[id].dur) || 0;
      if (v.a) { if (v.a.paused) { stopOthers(id); v.a.play(); } else v.a.pause(); return; }
      if (v.loading) return;
      v.loading = true;
      btn.textContent = '⏳';
      db.ref('chat_audio/' + id).once('value').then(function (s) {
        v.loading = false;
        var d = s.val() && s.val().d;
        if (!d) { btn.textContent = '▶'; toast('الرسالة الصوتية غير متاحة'); return; }
        var a = new Audio(d);
        v.a = a;
        a.playbackRate = v.speed;
        stopOthers(id);
        a.onplay = function () { btn.textContent = '⏸'; };
        a.onpause = function () { btn.textContent = '▶'; };
        a.ontimeupdate = function () { paint(bars, dur ? Math.min(1, a.currentTime / dur) : 0); vt.textContent = fmtT(a.currentTime); };
        a.onended = function () { btn.textContent = '▶'; paint(bars, 0); vt.textContent = fmtT(dur); };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { btn.textContent = '▶'; });
      }).catch(function () { v.loading = false; btn.textContent = '▶'; toast('تعذّر تحميل الرسالة الصوتية'); });
    }
    function cycleSpeed(id, b) {
      var v = voices[id] || (voices[id] = { a: null, speed: 1, loading: false });
      v.speed = v.speed === 1 ? 1.5 : (v.speed === 1.5 ? 2 : 1);
      if (v.a) v.a.playbackRate = v.speed;
      b.textContent = v.speed + '×';
    }

    /* ---------- التسجيل الصوتي ---------- */
    function pickMime() {
      var c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'], i;
      if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return '';
      for (i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i];
      return '';
    }
    function recUI(on) {
      $('.cx-rec', root).hidden = !on;
      $('.cx-comp', root).hidden = on || !ME.name;
    }
    function recStart() {
      if (rec) return;
      if (!ME.name) { showName(); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { toast('المتصفح لا يدعم التسجيل الصوتي'); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var mime = pickMime(), opts = { audioBitsPerSecond: 20000 }, mr;
        if (mime) opts.mimeType = mime;
        try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
        var r = { mr: mr, stream: stream, chunks: [], t0: Date.now(), cancel: false, dur: 0, timer: null, raf: 0, ctx: null };
        mr.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
        mr.onstop = function () { recFinish(r); };
        mr.start();
        rec = r;
        recUI(true);
        $('.cx-rt', root).textContent = '0:00';
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) {
            r.ctx = new AC();
            var an = r.ctx.createAnalyser();
            an.fftSize = 64;
            r.ctx.createMediaStreamSource(stream).connect(an);
            var data = new Uint8Array(an.frequencyBinCount), bars = $$('.cx-lv i', root);
            (function loop() {
              if (rec !== r) return;
              an.getByteFrequencyData(data);
              bars.forEach(function (b, i) { b.style.height = (12 + (data[i % data.length] / 255) * 88) + '%'; });
              r.raf = requestAnimationFrame(loop);
            })();
          }
        } catch (e) {}
        r.timer = setInterval(function () {
          var s = Math.round((Date.now() - r.t0) / 1000);
          $('.cx-rt', root).textContent = fmtT(s);
          if (s >= MAX_REC) recStop(false);
        }, 250);
      }).catch(function () { toast('اسمح باستخدام الميكروفون من إعدادات المتصفح'); });
    }
    function recStop(cancel) {
      var r = rec;
      if (!r) return;
      rec = null;
      r.cancel = !!cancel;
      r.dur = Math.round((Date.now() - r.t0) / 1000);
      clearInterval(r.timer);
      try { cancelAnimationFrame(r.raf); } catch (e) {}
      try { if (r.ctx) r.ctx.close(); } catch (e) {}
      recUI(false);
      try { r.mr.stop(); } catch (e) { recFinish(r); }
    }
    function recFinish(r) {
      try { r.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      if (r.cancel || !r.chunks.length) return;
      if (r.dur < 1) { toast('التسجيل قصير جداً'); return; }
      var fr = new FileReader();
      fr.onload = function () {
        var d = String(fr.result || '');
        if (!d || d.length > MAX_B64) { toast('التسجيل طويل جداً، اجعله أقصر'); return; }
        send({ msg: { type: 'voice', dur: r.dur }, node: 'chat_audio', blob: d });
      };
      fr.onerror = function () { toast('تعذّر قراءة التسجيل'); };
      fr.readAsDataURL(new Blob(r.chunks, { type: r.mr.mimeType || 'audio/webm' }));
    }

    /* ---------- الصور ---------- */
    function compress(file) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () {
          var im = new Image();
          im.onload = function () {
            var tries = [[720, 0.62], [600, 0.5], [480, 0.42]], i;
            for (i = 0; i < tries.length; i++) {
              var sc = Math.min(1, tries[i][0] / Math.max(im.width, im.height));
              var c = document.createElement('canvas');
              c.width = Math.max(1, Math.round(im.width * sc));
              c.height = Math.max(1, Math.round(im.height * sc));
              c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
              var d = c.toDataURL('image/jpeg', tries[i][1]);
              if (d.length < MAX_B64) return res(d);
            }
            rej();
          };
          im.onerror = rej;
          im.src = fr.result;
        };
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    }
    function lightbox(src) {
      var d = document.createElement('div');
      d.className = 'cx-lb';
      var im = new Image();
      im.src = src;
      d.appendChild(im);
      d.addEventListener('click', function () { if (d.parentNode) d.parentNode.removeChild(d); });
      document.body.appendChild(d);
    }

    /* ---------- الإيموجي ---------- */
    function drawEmo(i) {
      $$('.cx-etabs button', root).forEach(function (b, k) { b.classList.toggle('on', k === i); });
      $('.cx-eg', root).innerHTML = EMO[i][1].split(' ').map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('');
    }
    $('.cx-etabs', root).innerHTML = EMO.map(function (c, i) { return '<button type="button" data-t="' + i + '">' + c[0] + '</button>'; }).join('');
    drawEmo(0);
    function insertEmo(e) {
      var s = inp.selectionStart, t = inp.selectionEnd, v = inp.value;
      if (typeof s !== 'number') { inp.value = v + e; } else { inp.value = v.slice(0, s) + e + v.slice(t); inp.selectionStart = inp.selectionEnd = s + e.length; }
      updateMain();
      try { inp.focus(); } catch (x) {}
    }

    /* ---------- الكتابة والتواجد ---------- */
    var typRef = db.ref('chat_typing/' + ME.uid), typTimer = null, lastTyp = 0;
    function stopTyping() { lastTyp = 0; clearTimeout(typTimer); try { typRef.remove(); } catch (e) {} }
    inp.addEventListener('input', function () {
      updateMain();
      if (!ME.name || !inp.value.trim()) return;
      var now = Date.now();
      if (now - lastTyp > 2500) {
        lastTyp = now;
        try { typRef.set({ n: ME.name }); typRef.onDisconnect().remove(); } catch (e) {}
      }
      clearTimeout(typTimer);
      typTimer = setTimeout(stopTyping, 3000);
    });
    db.ref('chat_typing').on('value', function (s) {
      var names = [];
      s.forEach(function (c) { if (c.key !== ME.uid && c.val() && c.val().n) names.push(c.val().n); });
      var el = $('.cx-typing', root);
      if (!names.length) { el.hidden = true; return; }
      el.textContent = '✍️ ' + (names.length === 1 ? names[0] + ' يكتب...' : names[0] + ' و' + (names.length - 1) + ' آخرون يكتبون...');
      el.hidden = false;
    });
    var prRef = db.ref('chat_presence/' + ME.uid);
    db.ref('.info/connected').on('value', function (s) {
      if (s.val() === true) {
        prRef.onDisconnect().remove().then(function () { prRef.set({ n: ME.name || '' }); });
      }
    });
    db.ref('chat_presence').on('value', function (s) {
      $('.cx-online', root).textContent = '🟢 ' + s.numChildren() + ' متصل الآن';
    });

    /* ---------- الأحداث ---------- */
    list.addEventListener('click', function (e) {
      var t = e.target, b, row = t.closest('.cx-row'), id = row ? row.getAttribute('data-id') : null;
      if ((b = t.closest('[data-a]')) && id) {
        var a = b.getAttribute('data-a');
        if (a === 'reply') setReply(id);
        else if (a === 'react') { var rp = $('.cx-rp', row); rp.hidden = !rp.hidden; }
        else if (a === 'del') delMsg(id);
        else if (a === 'play') playVoice(id, row);
        else if (a === 'speed') cycleSpeed(id, b);
        return;
      }
      if ((b = t.closest('[data-r]')) && id) {
        toggleReact(id, b.getAttribute('data-r'));
        var rp2 = $('.cx-rp', row);
        if (rp2) rp2.hidden = true;
        return;
      }
      if ((b = t.closest('.cx-quote'))) { jump(b.getAttribute('data-go')); return; }
      if ((b = t.closest('.cx-imgw img'))) lightbox(b.src);
    });
    root.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('.cx-main'))) { if (inp.value.trim()) sendText(); else recStart(); return; }
      if ((b = t.closest('.cx-rsend'))) { recStop(false); return; }
      if ((b = t.closest('.cx-rcancel'))) { recStop(true); return; }
      if ((b = t.closest('.cx-emb'))) { var em = $('.cx-emo', root); em.hidden = !em.hidden; return; }
      if ((b = t.closest('[data-t]')) && b.closest('.cx-etabs')) { drawEmo(+b.getAttribute('data-t')); return; }
      if ((b = t.closest('[data-e]'))) { insertEmo(b.getAttribute('data-e')); return; }
      if ((b = t.closest('.cx-imb'))) { if (!ME.name) { showName(); return; } $('.cx-file', root).click(); return; }
      if ((b = t.closest('.cx-rcl'))) { clearReply(); return; }
      if ((b = t.closest('.cx-nok'))) { saveName(); return; }
      if ((b = t.closest('.cx-me'))) { showName(); return; }
      if ((b = t.closest('.cx-down'))) { toBottom(true); return; }
      if ((b = t.closest('.cx-snd'))) {
        sndOn = !sndOn;
        store('cx_snd', sndOn ? 'on' : 'off');
        b.textContent = sndOn ? '🔔' : '🔕';
      }
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendText(); } });
    $('.cx-nin', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveName(); } });
    $('.cx-file', root).addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('اختر صورة فقط'); return; }
      toast('جاري تجهيز الصورة...');
      compress(f).then(function (d) { send({ msg: { type: 'image' }, node: 'chat_media', blob: d }); })
        .catch(function () { toast('تعذّر تجهيز الصورة'); });
    });
    window.addEventListener('pagehide', function () { try { typRef.remove(); } catch (e) {} });
  }
})();
