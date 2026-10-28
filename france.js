/* ===== france.js — قسم «فرنسا المعاصرة» التفاعلي (La France moderne) =====
   يقرأ data/france_modern.json ويعرضه بطاقات مصوّرة مع نطق فرنسي وخريطة تفاعلية واختبارات.
   لا يغيّر أي ملف آخر؛ يعمل فقط داخل قسم soon-contemporaine. */
(function () {
  'use strict';
  try { boot(); } catch (e) { try { console.error('[france]', e); } catch (_) {} }

  function boot() {
    var SEC = document.getElementById('soon-contemporaine');
    if (!SEC) return;

    var AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    var FILES = ['./data/france_modern.json', 'data/france_modern.json', '/data/france_modern.json'];
    var root = null, DATA = null, started = false, MS = {};

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
    // زر النطق المعتمد في المشروع (.spk) — يعالجه app.js بصوت fr-FR وسرعة 0.9، ولا يظهر إلا للنص الفرنسي الصافي
    function spk(t) {
      t = String(t || '').trim();
      if (!t || AR.test(t)) return '';
      return '<button class="spk" type="button" data-lang="fr-FR" data-say="' + esc(encodeURIComponent(t)) + '" aria-label="استمع بالفرنسية">🔊</button>';
    }

    /* ---------- التصميم ---------- */
    var CSS = '' +
      '.fm{display:flex;flex-direction:column;gap:14px;font-family:inherit}.fm [hidden]{display:none!important}' +
      '.fm-hero{background:linear-gradient(135deg,#0b3d91,#0055A4 55%,#0a7ad6);color:#fff;border-radius:22px;padding:0 0 16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,60,140,.25)}' +
      '.fm-flag{display:flex;height:10px}.fm-flag i{flex:1}.fm-flag i:nth-child(1){background:#0055A4}.fm-flag i:nth-child(2){background:#fff}.fm-flag i:nth-child(3){background:#EF4135}' +
      '.fm-hero h3{margin:14px 16px 4px;font-size:1.5rem;text-align:left}.fm-hero p{margin:0 16px;line-height:1.9;font-size:.93rem;opacity:.96}' +
      '.fm-hs{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 16px 0;font-size:.85rem;flex-wrap:wrap}' +
      '.fm-tg{border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.16);color:#fff;border-radius:999px;padding:5px 14px;font-family:inherit;cursor:pointer}' +
      '.fm-card{background:#fff;border:1px solid #d5deea;border-radius:22px;overflow:hidden;box-shadow:0 4px 16px rgba(0,40,100,.09);border-top:5px solid var(--c)}' +
      '.fm-img{position:relative;height:200px;background:linear-gradient(135deg,var(--c),#16233b);display:flex;align-items:center;justify-content:center;overflow:hidden}' +
      '.fm-img img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s}' +
      '.fm-img.ok img{opacity:1}.fm-img::after{content:"";position:absolute;left:0;right:0;bottom:0;height:60%;background:linear-gradient(transparent,rgba(0,0,0,.55))}' +
      '.fm-img.noimg::before{content:attr(data-em);font-size:5rem;opacity:.9}' +
      '.fm-em{position:absolute;z-index:2;bottom:10px;right:12px;font-size:2rem;background:rgba(255,255,255,.92);border-radius:14px;padding:2px 10px}' +
      '.fm-num{position:absolute;z-index:2;top:10px;left:12px;background:var(--c);color:#fff;border-radius:999px;padding:2px 12px;font-weight:800;font-size:.85rem}' +
      '.fm-cr{position:absolute;z-index:2;bottom:8px;left:12px;color:rgba(255,255,255,.85);font-size:.68rem;direction:ltr}' +
      '.fm-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:8px}' +
      '.fm-ta{margin:0;color:#14213d;font-size:1.15rem;line-height:1.7}' +
      '.fm-tf{color:var(--c);font-weight:700;font-style:italic;text-align:left;line-height:1.7}' +
      '.fm-more{align-self:flex-start;border:2px solid var(--c);background:#fff;color:var(--c);border-radius:999px;padding:6px 16px;font-family:inherit;font-weight:800;cursor:pointer}' +
      '.fm-det{display:flex;flex-direction:column;gap:12px;margin-top:4px}' +
      '.fm-ar{margin:0;line-height:2;font-size:.97rem;color:#27324a}' +
      '.fm.hide-ar .fm-art{display:none}' +
      '.fm-fr{background:#f4f9ff;border-inline-start:4px solid var(--c);border-radius:12px;padding:12px;font-family:Georgia,"Times New Roman",serif;font-size:1.02rem;line-height:1.95;text-align:left}' +
      '.fm-fr p{margin:0 0 6px}' +
      '.fm-facts{display:grid;gap:8px}.fm-fact{background:#fff;border:1px solid #e3eaf4;border-radius:12px;padding:8px 12px}' +
      '.fm-ff{text-align:left;font-weight:700;line-height:1.8}.fm-fa{color:#556;font-size:.88rem;margin-top:2px}' +
      '.fm-ml{display:flex;gap:8px}.fm-lb{flex:1;border:2px solid #d5deea;background:#fff;border-radius:12px;padding:8px;font-family:inherit;font-weight:800;cursor:pointer;color:inherit}.fm-lb.on{background:var(--c);border-color:var(--c);color:#fff}' +
      '.fm-svg{width:100%;height:auto;background:linear-gradient(#eaf4ff,#d8eafb);border-radius:16px;border:1px solid #cfe0f3;margin-top:8px;display:block}' +
      '.fm-lbl{font-size:11px;font-weight:700;fill:#14213d;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}' +
      '.fm-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px}.fm-ch{flex:0 0 auto;border:1px solid #d5deea;background:#fff;border-radius:999px;padding:5px 12px;font-family:inherit;cursor:pointer;color:inherit;direction:ltr}.fm-ch.on{background:#0055A4;border-color:#0055A4;color:#fff}' +
      '.fm-info{background:#fff;border:1px solid #e3eaf4;border-radius:14px;padding:10px 12px;line-height:1.9}.fm-info small{color:#667;margin-inline-start:6px}' +
      '.fm-quiz{background:linear-gradient(180deg,#fff8e1,#fff);border:2px dashed #f0c14b;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}' +
      '.fm-qt{font-weight:800;color:#8a6500}.fm-qq{text-align:left;font-weight:700;line-height:1.8}' +
      '.fm-opts{display:flex;flex-direction:column;gap:8px}' +
      '.fm-opt{border:2px solid #d5deea;background:#fff;border-radius:12px;padding:10px 12px;font-family:inherit;font-size:1rem;cursor:pointer;text-align:left;color:inherit;transition:.15s}' +
      '.fm-opt:active{transform:scale(.98)}.fm-opt.ok{background:#dff5e8;border-color:#1b9e5b;color:#0d6b3b;animation:fmpop .35s}.fm-opt.bad{background:#fde3e3;border-color:#d63a3a;color:#a11d1d;animation:fmsk .4s}' +
      '.fm-fb{border-radius:12px;padding:8px 12px;line-height:1.8}.fm-fb.good{background:#dff5e8;color:#0d6b3b}.fm-fb.bad{background:#fde3e3;color:#a11d1d}' +
      '.fm-msg{background:#fff8e1;border:2px dashed #f0c14b;border-radius:16px;padding:16px;line-height:2;text-align:center}' +
      '@keyframes fmpop{0%{transform:scale(.95)}50%{transform:scale(1.05)}100%{transform:scale(1)}}@keyframes fmsk{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}';

    /* ---------- الصور: رابط الملف ← ثم ويكيبيديا تلقائياً ← ثم رمز بديل ---------- */
    function wikiImages(title) {
      return fetch('https://fr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title))
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (j) {
          var list = [], t = j.thumbnail && j.thumbnail.source, o = j.originalimage && j.originalimage.source;
          if (t) { list.push(t.replace(/\/\d+px-/, '/960px-')); list.push(t); }
          if (o) list.push(o);
          return list;
        });
    }
    function loadImage(card, it) {
      var img = $('img', card), box = $('.fm-img', card);
      if (!img || !box) return;
      var queue = [], wikiTried = false;
      function next() {
        if (queue.length) { img.src = queue.shift(); return; }
        if (!wikiTried && it.wiki) {
          wikiTried = true;
          wikiImages(it.wiki).then(function (l) { queue = l; next(); }).catch(function () { box.classList.add('noimg'); });
          return;
        }
        box.classList.add('noimg');
      }
      img.onload = function () { box.classList.add('ok'); box.classList.remove('noimg'); };
      img.onerror = next;
      if (it.image) queue.push(it.image);
      next();
    }

    /* ---------- الخريطة ---------- */
    function proj(p) { return [(p[0] + 5.6) * 27.2, (51.4 - p[1]) * 40]; }
    function pt(p) { var q = proj(p); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }
    function infoHTML(it, st) {
      if (st.sel < 0) return '<div class="fm-info">👆 اضغط على ' + (st.layer === 'cities' ? 'مدينة' : 'نهر') + ' في الخريطة لتعرف المزيد</div>';
      if (st.layer === 'cities') {
        var c = (it.cities || [])[st.sel];
        if (!c) return '';
        return '<div class="fm-info"><b>' + esc(c.n) + '</b><small dir="ltr">' + esc(c.region) + '</small><div class="fm-ff" dir="ltr">' + esc(c.fr) + spk(c.fr) + '</div><div class="fm-fa fm-art">' + esc(c.ar) + '</div></div>';
      }
      var r = (it.rivers || [])[st.sel];
      if (!r) return '';
      return '<div class="fm-info"><b style="color:' + esc(r.color) + '">' + esc(r.n) + '</b><small>' + esc(r.km) + ' km</small><div class="fm-ff" dir="ltr">' + esc(r.fr) + spk(r.fr) + '</div><div class="fm-fa fm-art">' + esc(r.ar) + '</div></div>';
    }
    function mapInner(it) {
      var st = MS[it.id] || (MS[it.id] = { layer: 'cities', sel: -1 });
      var cities = it.cities || [], rivers = it.rivers || [];
      var h = '<div class="fm-ml"><button type="button" class="fm-lb' + (st.layer === 'cities' ? ' on' : '') + '" data-ml="cities">🏙️ المدن</button><button type="button" class="fm-lb' + (st.layer === 'rivers' ? ' on' : '') + '" data-ml="rivers">🌊 الأنهار</button></div>';
      var s = '<svg viewBox="0 0 392 380" class="fm-svg" role="img" aria-label="خريطة فرنسا"><defs><linearGradient id="fmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfeeff"/></linearGradient></defs>' +
        '<path d="M' + (it.outline || []).map(pt).join(' L') + ' Z" fill="url(#fmg)" stroke="#0055A4" stroke-width="2.5" stroke-linejoin="round"/>';
      if (st.layer === 'rivers') {
        rivers.forEach(function (r, i) {
          var pts = r.pts.map(pt).join(' '), on = st.sel === i, dim = st.sel >= 0 && !on;
          s += '<polyline points="' + pts + '" fill="none" stroke="' + esc(r.color) + '" stroke-width="' + (on ? 6 : 3.5) + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + (dim ? 0.3 : 1) + '"/>' +
            '<polyline points="' + pts + '" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" data-fr="' + i + '"/>';
          var m = proj(r.pts[Math.floor(r.pts.length / 2)]);
          s += '<text class="fm-lbl" x="' + (m[0] + 8).toFixed(1) + '" y="' + (m[1] - 4).toFixed(1) + '">' + esc(r.n) + '</text>';
        });
      } else {
        cities.forEach(function (c, i) {
          var p = proj([c.lon, c.lat]), on = st.sel === i;
          s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (on ? 9 : 6) + '" fill="' + (on ? '#EF4135' : '#d63a3a') + '" stroke="#fff" stroke-width="2.5"/>' +
            '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="16" fill="transparent" data-fc="' + i + '"/>' +
            '<text class="fm-lbl" x="' + (p[0] + 10).toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '">' + esc(c.n) + '</text>';
        });
      }
      h += s + '</svg>';
      var list = st.layer === 'cities' ? cities : rivers;
      h += '<div class="fm-chips">' + list.map(function (x, i) {
        return '<button type="button" class="fm-ch' + (i === st.sel ? ' on' : '') + '" data-mc="' + i + '">' + esc(x.n) + '</button>';
      }).join('') + '</div>' + infoHTML(it, st);
      return h;
    }

    /* ---------- الاختبار المصغّر ---------- */
    function quizHTML(it) {
      var q = it.quiz;
      if (!q || !q.options) return '';
      return '<div class="fm-quiz"><div class="fm-qt">🎯 اختبر معلوماتك</div><div class="fm-qq" dir="ltr">' + esc(q.q) + spk(q.q) + '</div><div class="fm-opts">' +
        q.options.map(function (o, i) { return '<button type="button" class="fm-opt" data-o="' + i + '">' + esc(o) + '</button>'; }).join('') +
        '</div><div class="fm-fb" hidden></div></div>';
    }
    function solved() {
      var n = 0, t = 0;
      ((DATA && DATA.items) || []).forEach(function (it) { if (it.quiz) { t++; if (store('fm_q_' + it.id) === '1') n++; } });
      return [n, t];
    }
    function statText() { var s = solved(); return '⭐ إجاباتك الصحيحة: ' + s[0] + ' / ' + s[1]; }

    /* ---------- البطاقات ---------- */
    function cardHTML(it, i) {
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      var h = '<article class="fm-card" data-id="' + esc(it.id) + '" style="--c:' + esc(it.color || '#0055A4') + '">' +
        '<div class="fm-img" data-em="' + esc(it.emoji || '🇫🇷') + '"><img alt="' + esc(it.title_fr) + '" decoding="async"><span class="fm-em">' + esc(it.emoji || '🇫🇷') + '</span><span class="fm-num">' + n + '</span><span class="fm-cr">' + esc(it.credit || '') + '</span></div>' +
        '<div class="fm-body"><h3 class="fm-ta">' + esc(it.title_ar) + '</h3><div class="fm-tf" dir="ltr"><span>' + esc(it.title_fr) + '</span>' + spk(it.title_fr) + '</div>' +
        '<button type="button" class="fm-more" data-more="1">اقرأ المزيد ▾</button><div class="fm-det" hidden>' +
        '<p class="fm-ar fm-art">' + esc(it.text_ar) + '</p>' +
        '<div class="fm-fr" dir="ltr"><p>' + esc(it.text_fr) + '</p>' + spk(it.text_fr) + '</div>';
      if (it.type === 'map') h += '<div class="fm-map">' + mapInner(it) + '</div>';
      if (it.facts && it.facts.length) {
        h += '<div class="fm-facts">' + it.facts.map(function (f) {
          return '<div class="fm-fact"><div class="fm-ff" dir="ltr">' + esc(f.fr) + spk(f.fr) + '</div><div class="fm-fa fm-art">' + esc(f.ar) + '</div></div>';
        }).join('') + '</div>';
      }
      return h + quizHTML(it) + '</div></div></article>';
    }
    function heroHTML() {
      var m = (DATA && DATA.meta) || {};
      return '<div class="fm-hero"><div class="fm-flag"><i></i><i></i><i></i></div><h3 dir="ltr">' + esc(m.title_fr || 'La France moderne') + '</h3>' +
        '<p>رحلة مصوّرة في أبرز معالم فرنسا المعاصرة: اقرأ بالعربية والفرنسية، واستمع للنطق، واكتشف الخريطة والأنهار، ثم اختبر معلوماتك.</p>' +
        '<div class="fm-hs"><span id="fm-stat">' + statText() + '</span><button type="button" class="fm-tg" data-ar="1">' + (root.classList.contains('hide-ar') ? '👁️ إظهار العربية' : '🙈 إخفاء العربية') + '</button></div></div>';
    }
    function render() {
      var items = (DATA && DATA.items) || [];
      if (!items.length) {
        root.innerHTML = '<div class="fm-msg">⚠️ لم يُعثر على محتوى القسم.<br>تأكد أن الملف <b dir="ltr">data/france_modern.json</b> موجود ويحتوي بيانات صحيحة.</div>';
        return;
      }
      root.innerHTML = heroHTML() + items.map(cardHTML).join('');
      $$('.fm-card', root).forEach(function (card, i) { loadImage(card, items[i]); });
    }
    function findItem(card) {
      var id = card && card.getAttribute('data-id'), l = (DATA && DATA.items) || [], i;
      for (i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
      return null;
    }

    /* ---------- الأحداث ---------- */
    function onClick(e) {
      var t = e.target, b, card = t.closest('.fm-card'), it = findItem(card);
      if ((b = t.closest('[data-ar]'))) {
        var hide = root.classList.toggle('hide-ar');
        store('fm_ar', hide ? '1' : '');
        b.textContent = hide ? '👁️ إظهار العربية' : '🙈 إخفاء العربية';
        return;
      }
      if (!it) return;
      if ((b = t.closest('[data-more]'))) {
        var det = $('.fm-det', card), open = det.hidden;
        det.hidden = !open;
        b.textContent = open ? 'إخفاء ▴' : 'اقرأ المزيد ▾';
        return;
      }
      if ((b = t.closest('.fm-opt'))) {
        if (b.disabled) return;
        var q = it.quiz, oi = +b.getAttribute('data-o'), ok = oi === q.a;
        $$('.fm-opt', card).forEach(function (x, i) { x.disabled = true; if (i === q.a) x.classList.add('ok'); else if (i === oi) x.classList.add('bad'); });
        var fb = $('.fm-fb', card);
        fb.className = 'fm-fb ' + (ok ? 'good' : 'bad');
        fb.innerHTML = (ok ? '✅ إجابة صحيحة! ' : '❌ الإجابة الصحيحة: <b dir="ltr">' + esc(q.options[q.a]) + '</b> ') + '<span class="fm-art">' + esc(q.ar || '') + '</span>';
        fb.hidden = false;
        if (ok && store('fm_q_' + it.id) !== '1') store('fm_q_' + it.id, '1');
        else if (!ok && !store('fm_q_' + it.id)) store('fm_q_' + it.id, '0');
        var st = $('#fm-stat', root);
        if (st) st.textContent = statText();
        return;
      }
      var m = MS[it.id] || (MS[it.id] = { layer: 'cities', sel: -1 });
      var changed = false;
      if ((b = t.closest('[data-ml]'))) { m.layer = b.getAttribute('data-ml'); m.sel = -1; changed = true; }
      else if ((b = t.closest('[data-fc]'))) { m.layer = 'cities'; m.sel = +b.getAttribute('data-fc'); changed = true; }
      else if ((b = t.closest('[data-fr]'))) { m.layer = 'rivers'; m.sel = +b.getAttribute('data-fr'); changed = true; }
      else if ((b = t.closest('[data-mc]'))) { m.sel = +b.getAttribute('data-mc'); changed = true; }
      if (changed) { var box = $('.fm-map', card); if (box) box.innerHTML = mapInner(it); }
    }

    /* ---------- التحميل ---------- */
    function load() {
      var i = 0;
      function next() {
        if (i >= FILES.length) return Promise.resolve(null);
        return fetch(FILES[i++] + '?v=' + Date.now())
          .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
          .then(function (t) { t = t.replace(/^\uFEFF/, '').trim(); if (!t) return Promise.reject(); return JSON.parse(t); })
          .catch(next);
      }
      return next();
    }
    function mount() {
      if (started) return;
      started = true;
      if (!document.getElementById('fm-css')) {
        var st = document.createElement('style');
        st.id = 'fm-css';
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      $$('.soon-card', SEC).forEach(function (x) { x.style.display = 'none'; });
      root = document.createElement('div');
      root.className = 'fm' + (store('fm_ar') === '1' ? ' hide-ar' : '');
      root.innerHTML = '<div class="fm-msg">⏳ جاري تحميل المحتوى...</div>';
      SEC.appendChild(root);
      root.addEventListener('click', onClick);
      load().then(function (d) { DATA = d; render(); }).catch(function () { DATA = null; render(); });
    }
    function check() { if (!started && SEC.classList.contains('on')) mount(); }

    if (window.__FM_TEST) window.__FM_TEST = { cardHTML: cardHTML, mapInner: mapInner, setData: function (d) { DATA = d; root = { classList: { contains: function () { return false; } } }; }, heroHTML: heroHTML };
    if (window.MutationObserver) new MutationObserver(check).observe(SEC, { attributes: true, attributeFilter: ['class'] });
    check();
  }
})();
