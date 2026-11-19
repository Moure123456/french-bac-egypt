/* ===== live.js — «لقاء فيديو مباشر» داخل قسم شات الطلاب =====
   • المعلم يبدأ لقاءً (برمز المعلم) فتُنشأ غرفة عشوائية على Jitsi Meet (مجاني، بلا حساب) وتُنشر للجميع.
   • الطلاب يرون شريط «🔴 لقاء مباشر الآن» وينضمون بضغطة واحدة (أو برمز/رابط يدوي).
   • المزامنة عبر Firebase Realtime Database المحمّل في الصفحة؛ وإن تعذّرت يبقى النسخ/واتساب للمشاركة اليدوية.
   يعمل داخل #student-chat فقط ولا يغيّر أي ملف آخر. */
(function () {
  'use strict';
  var HOST_PIN = '0519';                 /* رمز المعلم لبدء اللقاء — عدّله كما تشاء */
  var JITSI = 'https://meet.jit.si/';
  var PATH = 'live_room';                /* مسار الغرفة الحالية في Firebase */
  var MAX_AGE = 3 * 3600 * 1000;         /* اللقاء يُعتبر منتهيًا بعد 3 ساعات */

  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[live]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('student-chat'); if (!SEC || document.getElementById('lv-box')) return;
    function $(s, r) { return (r || document).querySelector(s); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function toast(m, ms) { var t = document.getElementById('toast'); if (!t) { alert(m); return; } t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, ms || 2600); }
    function getName() {
      try { var n = localStorage.getItem('bq_live_name'); if (n) return n; var z = JSON.parse(localStorage.getItem('bq_zoza') || 'null'); if (z && z.name) return z.name; } catch (e) {}
      return '';
    }
    function saveName(n) { try { localStorage.setItem('bq_live_name', n); } catch (e) {} }
    function cleanRoom(s) { return String(s || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60); }
    function roomFrom(txt) {   /* يقبل رمز الغرفة أو الرابط الكامل */
      txt = String(txt || '').trim(); if (!txt) return '';
      var m = txt.match(/meet\.jit\.si\/([^\/?#\s]+)/i); return cleanRoom(m ? m[1] : txt);
    }
    function rand(n) {
      var a = 'abcdefghjkmnpqrstuvwxyz23456789', o = '';
      try { var u = new Uint8Array(n); crypto.getRandomValues(u); for (var i = 0; i < n; i++) o += a[u[i] % a.length]; } catch (e) { for (var j = 0; j < n; j++) o += a[Math.floor(Math.random() * a.length)]; }
      return o;
    }
    function urlOf(room, name) {
      var h = '#config.subject=' + encodeURIComponent(JSON.stringify('Le Français Au Bac')) + (name ? '&userInfo.displayName=' + encodeURIComponent(JSON.stringify(name)) : '');
      return JITSI + room + h;
    }
    function plainUrl(room) { return JITSI + room; }

    /* ---------- التنسيق ---------- */
    var st = document.createElement('style');
    st.textContent = '#lv-box{direction:rtl;margin:0 0 14px}#lv-box *{box-sizing:border-box}#lv-box button,#lv-box input{font-family:inherit}' +
      '.lv{border-radius:22px;padding:14px;color:#fff;background:linear-gradient(135deg,#7f1d1d,#be123c 45%,#7c3aed);box-shadow:0 10px 28px rgba(190,18,60,.35)}' +
      '.lv-h{font-size:1.15rem;font-weight:900;margin-bottom:2px}.lv-s{font-size:.8rem;opacity:.92;margin-bottom:10px;line-height:1.7}' +
      '.lv-now{border-radius:16px;padding:10px;margin-bottom:10px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.3);line-height:1.8;font-size:.9rem}.lv-now b{color:#fde047}.lv-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#f43f5e;box-shadow:0 0 0 0 rgba(244,63,94,.8);animation:lvP 1.4s infinite;margin-left:6px}@keyframes lvP{70%{box-shadow:0 0 0 10px rgba(244,63,94,0)}}' +
      '.lv input{width:100%;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;border-radius:14px;padding:11px 12px;font-size:1rem;margin-bottom:8px}.lv input::placeholder{color:rgba(255,255,255,.65)}.lv input:focus{outline:0;border-color:#fde047}' +
      '.lv-r{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.lv-r button{flex:1;min-width:120px;border:0;border-radius:16px;padding:12px 8px;font-weight:900;font-size:.92rem;color:#7c2d12;background:linear-gradient(135deg,#fde047,#fb923c);cursor:pointer;transition:.15s}.lv-r button:active{transform:scale(.95)}.lv-r button.g{background:rgba(255,255,255,.2);color:#fff}.lv-r button.w{background:#22c55e;color:#fff}.lv-r button.x{background:#fecaca;color:#7f1d1d}' +
      '.lv details{margin-top:6px;font-size:.85rem}.lv summary{cursor:pointer;font-weight:800;padding:4px 0}.lv-n{font-size:.74rem;opacity:.85;margin-top:8px;line-height:1.7}';
    document.head.appendChild(st);

    /* ---------- الواجهة ---------- */
    var box = document.createElement('div'); box.id = 'lv-box';
    box.innerHTML = '<div class="lv"><div class="lv-h">🎥 لقاء فيديو مباشر</div><div class="lv-s">حصص ومراجعات بالصوت والصورة مع معلمك وزملائك. مجاني بلا تسجيل.</div>' +
      '<div id="lv-now"></div><input id="lv-nm" type="text" maxlength="25" placeholder="اسمك الذي يظهر في اللقاء" autocomplete="off" value="' + esc(getName()) + '">' +
      '<div class="lv-r"><button type="button" data-lv="host">🎬 بدء لقاء (للمعلم)</button><button type="button" class="g" data-lv="join">🔴 انضمام للقاء الحالي</button></div>' +
      '<details><summary>🔗 انضمام برمز الغرفة أو الرابط</summary><div style="margin-top:6px"><input id="lv-code" type="text" dir="ltr" placeholder="الصق الرابط أو رمز الغرفة" autocomplete="off"><div class="lv-r"><button type="button" class="g" data-lv="code">انضم</button></div></div></details>' +
      '<div class="lv-n">⚠️ لا تشارك رابط اللقاء مع غرباء. سيطلب المتصفح إذن الكاميرا والميكروفون. على الهاتف قد يقترح تطبيق Jitsi Meet — يمكنك تثبيته أو المتابعة من المتصفح.</div></div>';
    var h2 = $('h2', SEC); if (h2 && h2.nextSibling) SEC.insertBefore(box, h2.nextSibling); else SEC.insertBefore(box, SEC.firstChild);

    /* ---------- الحالة والمزامنة (Firebase) ---------- */
    var cur = null, listening = false, mine = '', syncOk = null;
    try { mine = localStorage.getItem('bq_live_host') || ''; } catch (e) {}
    function db() { try { if (window.firebase && firebase.apps && firebase.apps.length) return firebase.database(); } catch (e) {} return null; }
    function fresh() { return cur && cur.room && (Date.now() - (cur.ts || 0)) < MAX_AGE; }
    function ago(ts) { var m = Math.max(0, Math.round((Date.now() - ts) / 60000)); return m < 1 ? 'الآن' : m < 60 ? 'منذ ' + m + ' دقيقة' : 'منذ ' + Math.floor(m / 60) + ' ساعة'; }
    function renderNow() {
      var el = $('#lv-now'); if (!el) return;
      if (fresh()) {
        var isMine = mine && mine === cur.room;
        el.innerHTML = '<div class="lv-now"><span class="lv-dot"></span><b>لقاء مباشر الآن</b> — ' + esc(cur.name || 'المعلم') + ' <small>(' + ago(cur.ts) + ')</small>' +
          '<div class="lv-r" style="margin:8px 0 0"><button type="button" data-lv="join">▶ انضم الآن</button><button type="button" class="g" data-lv="copy">📋 نسخ الرابط</button><button type="button" class="w" data-lv="wa">واتساب</button>' + (isMine ? '<button type="button" class="x" data-lv="end">⏹ إنهاء</button>' : '') + '</div></div>';
      } else {
        el.innerHTML = '<div class="lv-now" style="opacity:.85">لا يوجد لقاء مباشر حاليًا' + (syncOk === false ? ' <small>(تعذّرت المزامنة — شارك الرابط يدويًا)</small>' : '') + '</div>';
      }
    }
    function listen() {
      if (listening) return true; var d = db(); if (!d) return false;
      try {
        d.ref(PATH).on('value', function (s) { cur = s.val(); syncOk = true; renderNow(); }, function () { syncOk = false; renderNow(); });
        listening = true; return true;
      } catch (e) { syncOk = false; return false; }
    }
    var tries = 0, iv = setInterval(function () { if (listen() || ++tries > 90) clearInterval(iv); }, 1000);
    new MutationObserver(function () { if (SEC.classList.contains('on')) { listen(); renderNow(); } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });
    setInterval(renderNow, 30000);
    renderNow();

    /* ---------- الأفعال ---------- */
    function myName() { var n = ($('#lv-nm') && $('#lv-nm').value || '').trim().slice(0, 25); if (n) saveName(n); return n; }
    function openRoom(room) {
      var a = document.createElement('a'); a.href = urlOf(room, myName()); a.target = '_blank'; a.rel = 'noopener'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
    }
    function copyText(t) {
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(function () { toast('✅ تم نسخ الرابط'); }, function () { prompt('انسخ الرابط:', t); }); return; } } catch (e) {}
      prompt('انسخ الرابط:', t);
    }
    function host() {
      var pin = prompt('🔐 أدخل رمز المعلم لبدء اللقاء'); if (pin === null) return;
      if (String(pin).trim() !== HOST_PIN) { toast('❌ الرمز غير صحيح'); return; }
      var nm = myName() || 'المعلم', room = 'FrBac-' + rand(8); mine = room;
      try { localStorage.setItem('bq_live_host', room); } catch (e) {}
      cur = { room: room, name: nm, ts: Date.now() }; renderNow();
      var d = db();
      if (d) { try { d.ref(PATH).set(cur).catch(function () { syncOk = false; renderNow(); toast('تعذّرت المزامنة مع الطلاب — شارك الرابط عبر واتساب', 4000); }); } catch (e) { syncOk = false; } }
      else { toast('المزامنة غير متاحة الآن — شارك الرابط عبر واتساب', 4000); }
      openRoom(room);
    }
    function endLive() {
      var d = db(); if (d) { try { d.ref(PATH).remove(); } catch (e) {} } cur = null; mine = ''; try { localStorage.removeItem('bq_live_host'); } catch (e) {} renderNow(); toast('تم إنهاء اللقاء');
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lv]'); if (!b) return; var a = b.dataset.lv;
      if (a === 'host') host();
      else if (a === 'join') { if (fresh()) openRoom(cur.room); else toast('لا يوجد لقاء مباشر حاليًا — اطلب من معلمك رابط اللقاء'); }
      else if (a === 'code') { var r = roomFrom($('#lv-code').value); if (r.length < 4) { toast('اكتب رمز الغرفة أو الصق الرابط'); return; } openRoom(r); }
      else if (a === 'copy' && fresh()) copyText(plainUrl(cur.room));
      else if (a === 'wa' && fresh()) { var msg = '🎥 لقاء مباشر الآن في تطبيق Le Français Au Bac\n' + plainUrl(cur.room); window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }
      else if (a === 'end') { if (confirm('إنهاء اللقاء للجميع؟')) endLive(); }
    });
  }
})();
