/* ===== floaters.js — زر إخفاء/إظهار الأيقونات العائمة (زوزا + الجائزة/الديك + فقاعة الترحيب) =====
   يوضع الزر في الشريط العلوي بجوار «Le Français Au Bac». الحالة تُحفظ في الجهاز.
   يعمل بدون تعديل zoza.js أو splash.js: يكتشف العناصر العائمة تلقائيًا ويضع عليها وسمًا. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[floaters]', e); } catch (_) {} } });

  function boot() {
    var KEY = 'floaters_hidden';
    var root = document.documentElement;
    function load() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
    function save(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }

    /* ---- تنسيق ---- */
    var st = document.createElement('style');
    st.textContent =
      'html.fl-off [data-fl="1"]{display:none!important}' +
      '#fl-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;margin-inline:8px;padding:0;border:0;border-radius:50%;' +
      'background:rgba(255,255,255,.22);color:#fff;font-size:1.05rem;line-height:1;cursor:pointer;vertical-align:middle;-webkit-tap-highlight-color:transparent;' +
      'box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .15s,background .2s}' +
      '#fl-toggle:active{transform:scale(.88)}#fl-toggle.off{background:#fde047;color:#7c2d12}';
    document.head.appendChild(st);

    /* ---- اكتشاف العناصر العائمة ---- */
    var SKIP = '.topbar,.sidebar,.scrim,#toast,#master-pin-modal,.french-flag-bg,.site-footer,.lx-fl,#fl-toggle,script,style,link';
    var HINT = '[id*="zoza" i],[class*="zoza" i],[id*="splash" i],[class*="splash" i],[id*="reward" i],[class*="reward" i],[id*="prize" i],[class*="prize" i],[id*="mascot" i],[class*="mascot" i]';
    function topMost(el) { var p = el.parentElement; while (p && p !== document.body) { if (p.getAttribute('data-fl') === '1') return false; p = p.parentElement; } return true; }
    function isFloater(el) {
      if (!el || el.nodeType !== 1 || el.matches(SKIP) || el.closest(SKIP)) return false;
      var cs = getComputedStyle(el); if (cs.position !== 'fixed') return false;
      var r = el.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      if (r.width > vw * 0.9 && r.height > 120) return false;      /* طبقات كاملة الشاشة/نوافذ */
      if (r.width >= vw * 0.98 && r.height >= vh * 0.5) return false;
      if (el.querySelector('input,textarea,select,form')) return false; /* لا نُخفي حقول الإدخال */
      return true;
    }
    var EXPLICIT = '#zz-fab,#zz-bub,#zz-pn,#bqs-chip'; /* زوزا (الأيقونة + الفقاعة + المحادثة) + أيقونة الجوائز/الديك */
    function tag() {
      var i, el, list;
      list = document.querySelectorAll(EXPLICIT);
      for (i = 0; i < list.length; i++) list[i].setAttribute('data-fl', '1');
      list = document.body.children;
      for (i = 0; i < list.length; i++) { el = list[i]; if (el.getAttribute('data-fl') !== '1' && isFloater(el)) el.setAttribute('data-fl', '1'); }
      list = document.querySelectorAll(HINT);
      for (i = 0; i < list.length; i++) {
        el = list[i]; if (el.getAttribute('data-fl') === '1' || el.matches(SKIP) || el.closest(SKIP)) continue;
        var cs = getComputedStyle(el);
        if (cs.position === 'fixed' && topMost(el) && isFloater(el)) el.setAttribute('data-fl', '1');
      }
    }

    /* ---- الزر ---- */
    var btn = null;
    function paint() {
      var off = root.classList.contains('fl-off');
      btn.classList.toggle('off', off);
      btn.textContent = off ? '🐓' : '🙈';
      var lbl = off ? 'إظهار الأيقونات العائمة' : 'إخفاء الأيقونات العائمة';
      btn.title = lbl; btn.setAttribute('aria-label', lbl);
    }
    function mountBtn() {
      if (btn && document.body.contains(btn)) return true;
      var h1 = document.querySelector('.topbar h1'), bar = document.querySelector('.topbar');
      if (!bar) return false;
      btn = document.getElementById('fl-toggle') || document.createElement('button');
      btn.id = 'fl-toggle'; btn.type = 'button';
      if (h1) h1.appendChild(btn); else bar.appendChild(btn);
      btn.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        tag();
        var off = !root.classList.contains('fl-off');
        root.classList.toggle('fl-off', off); save(off); paint();
        if (off) {
          try { var pn = document.getElementById('zz-pn'), bb = document.getElementById('zz-bub'); if (pn) pn.classList.remove('on'); if (bb) bb.classList.remove('on'); } catch (x) {}
          try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (x) {}
        }
      };
      paint(); return true;
    }

    if (load()) root.classList.add('fl-off');
    mountBtn(); tag();

    /* عناصر تُنشأ لاحقًا (زوزا، عدّاد الجوائز، الفقاعات) */
    var pend = null;
    function sched() { if (pend) return; pend = setTimeout(function () { pend = null; mountBtn(); tag(); }, 250); }
    try { new MutationObserver(sched).observe(document.body, { childList: true }); } catch (e) {}
    var n = 0, iv = setInterval(function () { mountBtn(); tag(); if (++n > 20) clearInterval(iv); }, 1000);
    window.addEventListener('load', function () { mountBtn(); tag(); });
  }
})();
