/* ===== premium.js — اشتراكات الأقسام المدفوعة (Grammaire · Phonétique · Zoza · العامية) =====
   • كل طالب يفتح القسم المدفوع بـ«كود اشتراك» خاص (مدة محددة + عدد أجهزة محدود) بدل الرقم السري المشترك.
   • التحقق من جهة الخادم: محتوى الأقسام المدفوعة يُحمَّل من Firebase ولا يُقرأ إلا لمن عنده اشتراك ساري (قواعد Firebase).
   • المعلم يدخل بالبريد وكلمة السر، فتظهر «لوحة المعلم»: إنشاء الأكواد، متابعتها وإلغاؤها، ورفع محتوى الأقسام.
   واجهة للأقسام الأخرى:  window.__bqPremium.get('argot') → Promise بالمحتوى. */
(function () {
  'use strict';
  /* ===== إعدادات يجب أن تطابق قواعد Firebase ===== */
  var ADMIN_EMAIL = 'admin@francaisbac.app';          /* بريد المعلم (حروف صغيرة) — نفسه في قواعد Firebase */
  var WA = '201040294647';                             /* واتساب الاشتراك */
  var PREMIUM = { 'grammar': 'Grammaire', 'phonetics': 'Phonétique', 'soon-geographie': 'حوار مع صديقتي Zoza', 'soon-argot': 'العامية الفرنسية' };
  var CFG = { apiKey: 'AIzaSyAoFJex9rrYUgyyEUtw9TV9rhriFVyag8Y', authDomain: 'frenchbacchat.firebaseapp.com', databaseURL: 'https://frenchbacchat-default-rtdb.firebaseio.com', projectId: 'frenchbacchat', storageBucket: 'frenchbacchat.firebasestorage.app', messagingSenderId: '692488273461', appId: '1:692488273461:web:efa14361a054f3287d3b7c' };

  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[premium]', e); } catch (_) {} } });

  function boot() {
    function $(s, r) { return (r || document).querySelector(s); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
    function toast(m, ms) { var t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, ms || 3000); }
    function cleanCode(v) { return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); }
    function fmtCode(c) { return c ? c.slice(0, 5) + '-' + c.slice(5) : ''; }
    function rndCode() {
      var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '', i;
      try { var u = new Uint8Array(10); crypto.getRandomValues(u); for (i = 0; i < 10; i++) o += a[u[i] % a.length]; } catch (e) { for (i = 0; i < 10; i++) o += a[Math.floor(Math.random() * a.length)]; }
      return o;
    }
    function dstr(ms) { try { return new Date(ms).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return String(new Date(ms).toDateString()); } }

    /* ---------- الحالة ---------- */
    var U = null, ADMIN = false, LIC = null, OFF = 0, MEM = {}, readyDone = false, readyCbs = [];
    var LK = 'bq_lic';
    (function () { var c = J(LK, null); if (c && +c.exp > Date.now()) LIC = { code: c.code, exp: +c.exp, uid: c.uid }; })();
    function sNow() { return Date.now() + OFF; }
    function saveLic() { try { if (LIC) localStorage.setItem(LK, JSON.stringify({ code: LIC.code, exp: LIC.exp, uid: U ? U.uid : (LIC.uid || '') })); else localStorage.removeItem(LK); } catch (e) {} }
    function purge() { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('bq_pc_') === 0) localStorage.removeItem(k); }); } catch (e) {} MEM = {}; }
    function hasAccess() { return !!(ADMIN || (LIC && LIC.exp > Date.now())); }
    function fb() {
      try { if (!window.firebase || !firebase.database) return null; if (!firebase.apps.length) firebase.initializeApp(CFG); return firebase; } catch (e) { return null; }
    }
    function db() { var f = fb(); return f ? f.database() : null; }
    function auth() { var f = fb(); return f && f.auth ? f.auth() : null; }
    function notify() { try { window.dispatchEvent(new CustomEvent('bq-premium', { detail: { access: hasAccess(), admin: ADMIN } })); } catch (e) {} }

    function whenReady() {
      return new Promise(function (res) { if (readyDone) return res(); readyCbs.push(res); setTimeout(res, 9000); });
    }
    function setReady() { if (readyDone) return; readyDone = true; readyCbs.forEach(function (f) { try { f(); } catch (e) {} }); readyCbs = []; }

    /* ---------- المصادقة والترخيص ---------- */
    function refreshLicense() {
      if (!U) return Promise.resolve();
      if (ADMIN) return Promise.resolve();
      return db().ref('licenses/' + U.uid).once('value').then(function (s) {
        var v = s.val();
        if (v && +v.exp > sNow()) { LIC = { code: v.code, exp: +v.exp, uid: U.uid }; saveLic(); }
        else { LIC = null; saveLic(); purge(); }
      }).catch(function () { /* بدون إنترنت: نُبقي الترخيص المحفوظ */ });
    }
    function onUser(u) {
      U = u; ADMIN = !!(u && u.email && String(u.email).toLowerCase() === ADMIN_EMAIL);
      if (ADMIN) { LIC = null; }
      refreshLicense().then(function () { setReady(); updateUI(); notify(); });
    }
    var a0 = auth();
    if (a0) {
      try { db().ref('.info/serverTimeOffset').on('value', function (s) { OFF = +s.val() || 0; }); } catch (e) {}
      a0.onAuthStateChanged(function (u) {
        if (u) onUser(u);
        else a0.signInAnonymously().catch(function () { setReady(); updateUI(); });
      });
    } else { setReady(); }

    /* ---------- واجهات برمجية ---------- */
    function activate(raw) {
      var code = cleanCode(raw), d = db();
      if (code.length !== 10) return Promise.reject('الكود يتكون من 10 رموز (حروف وأرقام)');
      if (!d || !U) return Promise.reject('جارٍ الاتصال بالخدمة… أعد المحاولة بعد لحظات');
      return d.ref('codes/' + code).once('value').then(function (s) {
        var c = s.val(); if (!c) throw 'كود غير صحيح';
        var reg = !!(c.devices && c.devices[U.uid]), n = +c.n || 0, max = +c.max || 1, now = sNow(), exp = +c.exp || 0, up = {};
        if (!reg && n >= max) throw 'استُخدم هذا الكود على الحد الأقصى من الأجهزة (' + max + ')';
        if (!exp) { exp = now + (+c.days || 30) * 86400000; up['codes/' + code + '/exp'] = exp; }
        if (exp <= now) throw 'انتهت صلاحية هذا الاشتراك';
        if (!reg) { up['codes/' + code + '/devices/' + U.uid] = true; up['codes/' + code + '/n'] = n + 1; }
        up['licenses/' + U.uid] = { code: code, exp: exp, at: firebase.database.ServerValue.TIMESTAMP };
        return d.ref().update(up).then(function () { LIC = { code: code, exp: exp, uid: U.uid }; saveLic(); updateUI(); notify(); return exp; });
      }).catch(function (e) {
        if (typeof e === 'string') throw e;
        throw (e && (e.code === 'PERMISSION_DENIED' || /permission/i.test(String(e.message || e)))) ? 'تعذّر التفعيل: قواعد Firebase لم تُضبط بعد (تواصل مع المعلم)' : 'تعذّر الاتصال، تأكد من الإنترنت';
      });
    }
    function getContent(section) {
      return whenReady().then(function () {
        if (!hasAccess()) return Promise.reject('locked');
        var key = 'bq_pc_' + section;
        if (MEM[section]) return MEM[section];
        var cached = null; try { cached = JSON.parse(localStorage.getItem(key)); } catch (e) {}
        var fetchP = function () {
          var d = db(); if (!d) return Promise.reject('offline');
          return d.ref('premium/' + section).once('value').then(function (s) {
            var v = s.val(); if (v == null) return Promise.reject('empty');
            MEM[section] = v; try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} return v;
          }).catch(function (e) {
            if (e && (e.code === 'PERMISSION_DENIED' || /permission/i.test(String(e.message || '')))) { LIC = null; saveLic(); purge(); updateUI(); notify(); return Promise.reject('locked'); }
            return Promise.reject(e);
          });
        };
        if (cached) { MEM[section] = cached; fetchP().catch(function () {}); return cached; }
        return fetchP();
      });
    }

    /* ---------- أدوات المعلم ---------- */
    function needAdmin() { if (!ADMIN || !db()) return Promise.reject('هذه الأداة للمعلم فقط'); return null; }
    function genCodes(count, days, max, note) {
      var bad = needAdmin(); if (bad) return bad; var up = {}, out = [], i, ts = firebase.database.ServerValue.TIMESTAMP;
      for (i = 0; i < count; i++) { var c = rndCode(); out.push(c); up['codes/' + c] = { days: days, max: max, n: 0, note: String(note || '').slice(0, 40), created: ts }; }
      return db().ref().update(up).then(function () { return out; });
    }
    function listCodes() {
      var bad = needAdmin(); if (bad) return bad;
      return db().ref('codes').once('value').then(function (s) {
        var v = s.val() || {}; return Object.keys(v).map(function (k) { var c = v[k]; c.code = k; return c; }).sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
      });
    }
    function revoke(code) {
      var bad = needAdmin(); if (bad) return bad; var d = db();
      return d.ref('codes/' + code).once('value').then(function (s) {
        var c = s.val() || {}, up = {}; up['codes/' + code] = null; Object.keys(c.devices || {}).forEach(function (u) { up['licenses/' + u] = null; });
        return d.ref().update(up);
      });
    }
    function upload(section, obj) {
      var bad = needAdmin(); if (bad) return bad;
      if (!/^[a-z0-9_-]{2,30}$/i.test(section)) return Promise.reject('اسم القسم غير صالح');
      return db().ref('premium/' + section).set(obj).then(function () { delete MEM[section]; try { localStorage.removeItem('bq_pc_' + section); } catch (e) {} return true; });
    }
    function signIn(email, pass) {
      var a = auth(); if (!a) return Promise.reject('الخدمة غير متاحة');
      return a.signInWithEmailAndPassword(String(email || '').trim(), String(pass || '')).catch(function () { throw 'بيانات الدخول غير صحيحة'; });
    }
    function signOutAdmin() { var a = auth(); if (a) { ADMIN = false; return a.signOut(); } }

    window.__bqPremium = {
      has: hasAccess, admin: function () { return ADMIN; }, get: getContent, activate: activate, require: function (id) { showPaywall(id); },
      gen: genCodes, list: listCodes, revoke: revoke, upload: upload, signIn: signIn, signOut: signOutAdmin, status: function () { return { access: hasAccess(), admin: ADMIN, exp: LIC && LIC.exp, uid: U && U.uid }; }
    };

    /* ---------- التنسيق ---------- */
    var st = document.createElement('style');
    st.textContent = '.pm-b{display:inline-block;margin-right:6px;font-size:.9em}' +
      '#pm-ov{position:fixed;inset:0;z-index:100010;background:rgba(10,10,30,.78);display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:inherit}#pm-ov *{box-sizing:border-box}' +
      '.pm-box{background:#fff;border-radius:24px;width:100%;max-width:400px;max-height:92vh;overflow:auto;padding:20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#1b2a3a;position:relative}' +
      '.pm-x{position:absolute;top:10px;left:10px;border:0;background:#eef2ff;border-radius:50%;width:34px;height:34px;font-size:1rem;cursor:pointer}' +
      '.pm-gem{font-size:3rem;margin:0}.pm-box h3{margin:4px 0;color:#4338ca;font-size:1.25rem}.pm-box p{margin:6px 0 12px;font-size:.88rem;line-height:1.8;color:#475569}' +
      '.pm-in{width:100%;border:2px solid #d6e2f0;border-radius:14px;padding:13px;font-size:1.15rem;text-align:center;letter-spacing:3px;margin-bottom:8px;text-transform:uppercase;font-family:inherit}.pm-in.tx{letter-spacing:0;text-transform:none;font-size:1rem;direction:ltr}.pm-in:focus{outline:0;border-color:#7c3aed}' +
      '.pm-btn{display:block;width:100%;border:0;border-radius:16px;padding:13px;font-weight:900;font-size:1rem;cursor:pointer;margin-top:8px;font-family:inherit;background:linear-gradient(135deg,#4338ca,#7c3aed);color:#fff}.pm-btn.w{background:#22c55e}.pm-btn.g{background:#e8eef6;color:#33475b;font-size:.85rem;padding:9px}.pm-btn:disabled{opacity:.6}' +
      '.pm-msg{min-height:22px;margin-top:8px;font-weight:800;font-size:.85rem;line-height:1.7}.pm-msg.ok{color:#16a34a}.pm-msg.no{color:#dc2626}' +
      '.tc{direction:rtl;color:#1b2a3a}.tc *{box-sizing:border-box}.tc button,.tc input,.tc select,.tc textarea{font-family:inherit}.tc-card{background:#fff;border:1px solid #d6e2f0;border-radius:18px;padding:12px;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,0,0,.05)}.tc-card h4{margin:0 0 8px;color:#4338ca}' +
      '.tc-r{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.tc-r>*{flex:1;min-width:110px}.tc select,.tc input[type=text]{width:100%;border:2px solid #d6e2f0;border-radius:12px;padding:10px;font-size:.95rem;background:#fff}.tc textarea{width:100%;height:120px;border:2px solid #d6e2f0;border-radius:12px;padding:8px;font-family:monospace;direction:ltr;font-size:.9rem}' +
      '.tc-b{border:0;border-radius:14px;padding:11px 16px;font-weight:900;color:#fff;background:linear-gradient(135deg,#4338ca,#7c3aed);cursor:pointer}.tc-b.g{background:#e8eef6;color:#33475b}.tc-b.r{background:#fecaca;color:#7f1d1d;padding:6px 10px;font-size:.8rem}.tc-b.w{background:#22c55e}' +
      '.tc-it{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px dashed #d6e2f0;padding:8px 0;font-size:.85rem}.tc-it b{direction:ltr;display:block;color:#0055A5;letter-spacing:1px}.tc-it small{color:#64748b}.tc-m{font-weight:800;font-size:.85rem;margin-top:6px;line-height:1.7}';
    document.head.appendChild(st);

    /* ---------- شارات القائمة ---------- */
    function updateUI() {
      var access = hasAccess();
      Object.keys(PREMIUM).forEach(function (id) {
        var btn = $('[data-nav="' + id + '"]'); if (!btn) return; var b = $('.pm-b', btn);
        if (access) { if (b) b.remove(); }
        else if (!b) { b = document.createElement('span'); b.className = 'pm-b'; b.textContent = '💎'; btn.appendChild(b); }
      });
      var tb = $('[data-nav="teacher"]'); if (tb) tb.hidden = !ADMIN;
      if (ADMIN) renderTeacher();
      var ov = $('#pm-ov'); if (ov && access && !ov.getAttribute('data-admin')) { closePaywall(); }
    }

    /* ---------- شاشة الاشتراك ---------- */
    var wantSec = '';
    function closePaywall(back) { var ov = $('#pm-ov'); if (ov) ov.remove(); if (back) { var h = $('[data-nav="lessons"]'); if (h) h.click(); } }
    function showPaywall(id) {
      wantSec = id || wantSec; var old = $('#pm-ov'); if (old) old.remove();
      var ov = document.createElement('div'); ov.id = 'pm-ov';
      var name = PREMIUM[wantSec] || 'هذا القسم';
      var msg = encodeURIComponent('السلام عليكم، أريد الاشتراك في تطبيق Le Français Au Bac (قسم ' + name + ')');
      ov.innerHTML = '<div class="pm-box"><button type="button" class="pm-x" data-pm="close" aria-label="إغلاق">✕</button><div class="pm-gem">💎</div><h3>قسم للمشتركين</h3><p><b>' + esc(name) + '</b><br>أدخل كود الاشتراك الخاص بك لفتح الأقسام المدفوعة.</p>' +
        '<input class="pm-in" id="pm-code" type="text" dir="ltr" placeholder="XXXXX-XXXXX" maxlength="11" autocomplete="off" autocapitalize="characters"><button type="button" class="pm-btn" data-pm="act">🔓 تفعيل الاشتراك</button>' +
        '<a class="pm-btn w" style="text-decoration:none" href="https://wa.me/' + WA + '?text=' + msg + '" target="_blank" rel="noopener">💬 اشترك عبر واتساب</a>' +
        '<div class="pm-msg" id="pm-msg"></div><button type="button" class="pm-btn g" data-pm="adm">🔐 دخول المعلم</button></div>';
      document.body.appendChild(ov);
      setTimeout(function () { var i = $('#pm-code'); if (i) i.focus(); }, 200);
    }
    function pmMsg(t, ok) { var m = $('#pm-msg'); if (m) { m.textContent = t; m.className = 'pm-msg ' + (ok ? 'ok' : 'no'); } }
    function adminForm() {
      var box = $('.pm-box'); if (!box) return; var ov = $('#pm-ov'); if (ov) ov.setAttribute('data-admin', '1');
      box.innerHTML = '<button type="button" class="pm-x" data-pm="close" aria-label="إغلاق">✕</button><div class="pm-gem">🔐</div><h3>دخول المعلم</h3><p>للمعلم فقط: يفتح لك كل الأقسام ولوحة إنشاء الأكواد.</p>' +
        '<input class="pm-in tx" id="pm-em" type="text" dir="ltr" placeholder="البريد الإلكتروني" autocomplete="username" autocapitalize="off"><input class="pm-in tx" id="pm-pw" type="password" dir="ltr" placeholder="كلمة السر" autocomplete="current-password">' +
        '<button type="button" class="pm-btn" data-pm="login">دخول</button><div class="pm-msg" id="pm-msg"></div>';
    }
    document.addEventListener('click', function (e) {
      var t = e.target, b = t.closest ? t.closest('[data-pm]') : null;
      if (b && document.getElementById('pm-ov') && document.getElementById('pm-ov').contains(b)) {
        var a = b.getAttribute('data-pm');
        if (a === 'close') closePaywall(!hasAccess() && wantSec);
        else if (a === 'act') {
          var inp = $('#pm-code'); b.disabled = true; pmMsg('⏳ جارٍ التحقق…', true);
          activate(inp && inp.value).then(function (exp) { pmMsg('✅ تم التفعيل! ينتهي اشتراكك في ' + dstr(exp), true); var sec = wantSec; setTimeout(function () { closePaywall(); var nb = sec && $('[data-nav="' + sec + '"]'); if (nb) nb.click(); }, 1100); })
            .catch(function (er) { b.disabled = false; pmMsg('❌ ' + er, false); });
        } else if (a === 'adm') adminForm();
        else if (a === 'login') { b.disabled = true; pmMsg('⏳ جارٍ الدخول…', true); signIn($('#pm-em').value, $('#pm-pw').value).then(function () { pmMsg('✅ أهلًا بالمعلم', true); var sec = wantSec; setTimeout(function () { closePaywall(); var nb = sec && $('[data-nav="' + sec + '"]'); if (nb) nb.click(); }, 700); }).catch(function (er) { b.disabled = false; pmMsg('❌ ' + er, false); }); }
        return;
      }
      var nav = t.closest ? t.closest('[data-nav]') : null; if (!nav) return;
      var id = nav.getAttribute('data-nav');
      if (id === 'teacher' && !ADMIN) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (PREMIUM[id] && !hasAccess()) { e.preventDefault(); e.stopImmediatePropagation(); showPaywall(id); }
    }, true);

    /* حماية إضافية: إن فُتح قسم مدفوع بأي طريقة بلا اشتراك */
    Object.keys(PREMIUM).forEach(function (id) {
      var sec = document.getElementById(id); if (!sec || !window.MutationObserver) return;
      new MutationObserver(function () { if (sec.classList.contains('on') && !hasAccess() && !$('#pm-ov')) showPaywall(id); }).observe(sec, { attributes: true, attributeFilter: ['class'] });
    });

    /* ---------- لوحة المعلم ---------- */
    var TS = document.getElementById('teacher'), TR = document.getElementById('teacher-root'), lastCodes = '', tmsg = '';
    function renderTeacher() {
      if (!TR) return;
      var h = '<div class="tc"><div class="tc-card"><h4>🔑 إنشاء أكواد اشتراك</h4><div class="tc-r"><div><small>العدد</small><select id="tc-n">' + [1, 5, 10, 20, 50].map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select></div>' +
        '<div><small>المدة</small><select id="tc-d"><option value="30">شهر (30)</option><option value="90">3 أشهر</option><option value="180">6 أشهر</option><option value="365">سنة</option></select></div><div><small>الأجهزة</small><select id="tc-x"><option>1</option><option selected>2</option><option>3</option></select></div></div>' +
        '<input type="text" id="tc-note" placeholder="ملاحظة (اسم الطالب — اختياري)" maxlength="40" style="margin-bottom:8px"><button type="button" class="tc-b" data-tc="gen">➕ إنشاء الأكواد</button>' +
        (lastCodes ? '<textarea id="tc-out" readonly>' + esc(lastCodes) + '</textarea><div class="tc-r"><button type="button" class="tc-b g" data-tc="copy">📋 نسخ الكل</button><button type="button" class="tc-b w" data-tc="wa">مشاركة واتساب</button></div>' : '') + '</div>' +
        '<div class="tc-card"><h4>📋 الأكواد والمشتركون</h4><button type="button" class="tc-b g" data-tc="list">🔄 تحديث القائمة</button><div id="tc-list" style="margin-top:8px"></div></div>' +
        '<div class="tc-card"><h4>📤 رفع محتوى قسم مدفوع</h4><div class="tc-r"><select id="tc-s"><option value="argot">العامية الفرنسية</option><option value="grammar">Grammaire</option><option value="phonetics">Phonétique</option><option value="zoza">حوار مع صديقتي Zoza</option></select></div>' +
        '<input type="file" id="tc-f" accept=".json,application/json" style="margin-bottom:8px;width:100%"><button type="button" class="tc-b" data-tc="up">⬆ رفع الملف</button></div>' +
        (tmsg ? '<div class="tc-m">' + esc(tmsg) + '</div>' : '') + '<div class="tc-card"><button type="button" class="tc-b g" data-tc="out">🚪 تسجيل خروج المعلم</button></div></div>';
      var keep = $('#tc-note') ? $('#tc-note').value : ''; TR.innerHTML = h; if (keep && $('#tc-note')) $('#tc-note').value = keep;
    }
    function tm(t) { tmsg = t; renderTeacher(); }
    if (TR) {
      TR.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tc]'); if (!b) return; var a = b.getAttribute('data-tc');
        if (a === 'gen') {
          var n = +$('#tc-n').value, d = +$('#tc-d').value, x = +$('#tc-x').value, note = $('#tc-note').value;
          tm('⏳ جارٍ الإنشاء…'); genCodes(n, d, x, note).then(function (codes) { lastCodes = codes.map(fmtCode).join('\n'); tmsg = '✅ تم إنشاء ' + codes.length + ' كود. انسخها وأرسلها للطلاب.'; renderTeacher(); }).catch(function (er) { tm('❌ ' + (er && er.message ? er.message : er)); });
        } else if (a === 'copy') { try { navigator.clipboard.writeText(lastCodes).then(function () { toast('✅ تم النسخ'); }); } catch (er) { prompt('انسخ الأكواد:', lastCodes); } }
        else if (a === 'wa') { window.open('https://wa.me/?text=' + encodeURIComponent('أكواد اشتراك Le Français Au Bac:\n' + lastCodes), '_blank', 'noopener'); }
        else if (a === 'list') {
          var box = $('#tc-list'); box.textContent = '⏳ جارٍ التحميل…';
          listCodes().then(function (arr) {
            if (!arr.length) { box.textContent = 'لا توجد أكواد بعد'; return; }
            box.innerHTML = arr.slice(0, 80).map(function (c) {
              var used = +c.n || 0, st2 = c.exp ? (c.exp > Date.now() ? '✅ ساري حتى ' + dstr(c.exp) : '⛔ منتهٍ') : '🆕 غير مستخدم';
              return '<div class="tc-it"><div><b>' + fmtCode(c.code) + '</b><small>' + esc(c.note || '—') + ' · ' + (c.days || 0) + ' يوم · أجهزة ' + used + '/' + (c.max || 1) + ' · ' + st2 + '</small></div><button type="button" class="tc-b r" data-tc="rev" data-c="' + esc(c.code) + '">إلغاء</button></div>';
            }).join('');
          }).catch(function (er) { box.textContent = '❌ ' + (er && er.message ? er.message : er); });
        } else if (a === 'rev') { var c = b.getAttribute('data-c'); if (confirm('إلغاء الكود ' + fmtCode(c) + ' وقطع اشتراك أجهزته؟')) revoke(c).then(function () { tm('✅ تم إلغاء الكود'); }).catch(function (er) { tm('❌ ' + (er && er.message ? er.message : er)); }); }
        else if (a === 'up') {
          var f = $('#tc-f').files && $('#tc-f').files[0], sec = $('#tc-s').value; if (!f) { tm('اختر ملف JSON أولًا'); return; }
          var fr = new FileReader(); fr.onload = function () {
            var obj; try { obj = JSON.parse(String(fr.result).replace(/^\uFEFF/, '')); } catch (er) { tm('❌ الملف ليس JSON صالحًا'); return; }
            tm('⏳ جارٍ الرفع…'); upload(sec, obj).then(function () { tm('✅ تم رفع محتوى «' + sec + '»'); }).catch(function (er) { tm('❌ ' + (er && er.message ? er.message : er)); });
          }; fr.readAsText(f);
        } else if (a === 'out') { signOutAdmin(); tm('تم تسجيل الخروج'); var hb = $('[data-nav="lessons"]'); if (hb) hb.click(); }
      });
    }
    updateUI();
  }
})();
