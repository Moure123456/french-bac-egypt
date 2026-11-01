/* ===== chansons.js — «مسرح الأغاني الفرنسية» (بديل songs.js) =====
   مشغّل واحد احترافي (قرص دوّار + مؤثر بصري حي + تحكّم كامل) وشبكة أغلفة ملونة لكل أغاني data/songs.json،
   مع أهداف استماع يومية ونقاط تسرّع جوائز splash.js. يعمل داخل #chn-root فقط. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[chansons]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('soon-chansons'), ROOT = document.getElementById('chn-root');
    if (!SEC || !ROOT) return;
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }
    function today() { return new Date().toISOString().slice(0, 10); }

    /* ---------- البيانات والتقدم ---------- */
    var SONGS = [], ST = store('bq_chn') || { xp: 0, sec: 0, day: { d: '', s: 0, g: 0 }, fav: [], rate: {}, done: {} };
    function save() { store('bq_chn', ST); }
    var GOAL = 600;
    var PAL = [['#f43f5e', '#fb923c'], ['#8b5cf6', '#ec4899'], ['#06b6d4', '#3b82f6'], ['#10b981', '#84cc16'], ['#f59e0b', '#ef4444'], ['#6366f1', '#22d3ee'], ['#d946ef', '#f97316'], ['#14b8a6', '#a3e635']];
    var EMO = ['🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎷', '🪕', '🎧', '🎼', '🌈', '🌟', '🎶', '🪗', '🔔'];
    function pal(i) { return PAL[i % PAL.length]; }
    function numOf(s) { var m = String(s.file).match(/(\d+)/); return m ? +m[1] : 0; }
    function level() { var x = ST.xp; return x >= 500 ? '🏆 نجم الاستماع' : x >= 250 ? '🎤 مغنٍّ ماهر' : x >= 100 ? '🎧 مستمع متحمّس' : x >= 20 ? '🎵 هاوي موسيقى' : '🌱 مبتدئ'; }
    function dayState() { if (ST.day.d !== today()) { ST.day = { d: today(), s: 0, g: 0 }; save(); } return ST.day; }

    /* ---------- التنسيق (بادئة chn- فريدة) ---------- */
    var st = document.createElement('style');
    st.textContent = '.chn{color:#1f2937}.chn *{box-sizing:border-box}.chn button{font-family:inherit;cursor:pointer}' +
      '.chn-hero{position:relative;overflow:hidden;border-radius:24px;padding:16px 14px;color:#fff;text-align:center;background:linear-gradient(135deg,#1e1b4b,#7c3aed 45%,#db2777 80%,#f97316);background-size:220% 220%;animation:chnBg 9s ease infinite;box-shadow:0 10px 28px rgba(124,58,237,.42);margin-bottom:12px}@keyframes chnBg{50%{background-position:100% 50%}}' +
      '.chn-hero h3{margin:2px 0 0;font-size:1.3rem;position:relative}.chn-hero p{margin:4px 0 8px;font-size:.82rem;opacity:.95;position:relative}.chn-nt{position:absolute;font-size:1.6rem;opacity:.55;animation:chnNt 5s ease-in-out infinite;pointer-events:none}@keyframes chnNt{0%{transform:translateY(20px) rotate(-10deg);opacity:0}30%{opacity:.7}100%{transform:translateY(-70px) rotate(14deg);opacity:0}}' +
      '.chn-st{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;position:relative}.chn-st span{background:rgba(255,255,255,.22);border-radius:14px;padding:5px 11px;font-size:.78rem;font-weight:800}.chn-goal{position:relative;margin:10px 4px 0}.chn-goal div{height:12px;border-radius:8px;background:rgba(255,255,255,.25);overflow:hidden}.chn-goal i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#fde047,#fb923c,#f43f5e);box-shadow:0 0 12px #fde047;transition:width .5s}.chn-goal small{display:block;margin-top:3px;font-size:.74rem;font-weight:800}' +
      '.chn-pl{position:relative;border-radius:26px;padding:16px 12px 14px;color:#fff;text-align:center;background:linear-gradient(160deg,#0f0a2e,var(--a) 140%);box-shadow:0 14px 34px rgba(0,0,0,.35);margin-bottom:14px;overflow:hidden;transition:background .6s}.chn-pl:before{content:"";position:absolute;width:260px;height:260px;border-radius:50%;left:50%;top:-40px;transform:translateX(-50%);background:radial-gradient(var(--b),transparent 68%);opacity:.5;filter:blur(8px);pointer-events:none}' +
      '.chn-dw{position:relative;width:210px;height:210px;margin:6px auto 4px}.chn-disc{position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle,#0b0b10 0 2px,#1b1b24 2px 4px);box-shadow:0 0 0 5px rgba(255,255,255,.08),0 16px 34px rgba(0,0,0,.6),0 0 40px var(--b);animation:chnSp 5s linear infinite;animation-play-state:paused}.chn-pl.play .chn-disc{animation-play-state:running}@keyframes chnSp{to{transform:rotate(360deg)}}' +
      '.chn-disc:before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(rgba(255,255,255,.14),transparent 20%,rgba(255,255,255,.1) 45%,transparent 70%,rgba(255,255,255,.14))}.chn-lb{position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:linear-gradient(135deg,var(--a),var(--b));display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:2.1rem;box-shadow:inset 0 0 0 4px rgba(255,255,255,.35)}.chn-lb small{font-size:.7rem;font-weight:900;margin-top:-4px}.chn-lb:after{content:"";position:absolute;width:12px;height:12px;border-radius:50%;background:#0f0a2e;box-shadow:0 0 0 3px rgba(255,255,255,.5)}' +
      '.chn-arm{position:absolute;right:-18px;top:-6px;width:8px;height:120px;background:linear-gradient(#e5e7eb,#9ca3af);border-radius:6px;transform-origin:50% 8px;transform:rotate(-24deg);transition:transform .8s cubic-bezier(.4,1.4,.5,1);box-shadow:0 4px 10px rgba(0,0,0,.4)}.chn-arm:after{content:"";position:absolute;bottom:-6px;left:-5px;width:18px;height:14px;border-radius:4px;background:#f87171}.chn-pl.play .chn-arm{transform:rotate(8deg)}' +
      '.chn-ti{font-size:1.15rem;font-weight:900;margin:6px 0 0;position:relative}.chn-su{font-size:.78rem;opacity:.85;position:relative}.chn-cv{display:block;margin:8px auto 4px;width:100%;height:56px;position:relative}' +
      '.chn-pg{position:relative;display:flex;align-items:center;gap:8px;direction:ltr;font-size:.78rem;font-weight:800;margin:4px 6px}.chn-pg input{flex:1;-webkit-appearance:none;appearance:none;height:8px;border-radius:6px;background:rgba(255,255,255,.25);outline:0}.chn-pg input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fde047;box-shadow:0 0 12px #fde047;border:0}.chn-pg input::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fde047;border:0}' +
      '.chn-cl{direction:ltr;position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0}.chn-cl button{border:0;border-radius:50%;width:44px;height:44px;background:rgba(255,255,255,.16);color:#fff;font-size:1.15rem;transition:.15s}.chn-cl button:active{transform:scale(.88)}.chn-cl button.on{background:#fde047;color:#7c2d12}.chn-cl button.big{width:68px;height:68px;font-size:1.8rem;background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12;box-shadow:0 0 26px rgba(253,224,71,.65)}' +
      '.chn-ex{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}.chn-ex button{border:0;border-radius:16px;padding:7px 12px;background:rgba(255,255,255,.16);color:#fff;font-weight:800;font-size:.78rem}.chn-ex button.on{background:#fde047;color:#7c2d12}.chn-stars button{font-size:1.2rem;padding:2px 3px;background:none}' +
      '.chn-fl{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:6px}.chn-fl button{flex:none;border:1px solid #e9d5ff;background:#fff;border-radius:20px;padding:8px 14px;font-weight:800;font-size:.82rem;color:#6b21a8}.chn-fl button.on{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;border-color:transparent}.chn-in{width:100%;border:2px solid #e9d5ff;border-radius:14px;padding:11px 14px;font-family:inherit;font-size:1rem;margin-bottom:8px}.chn-in:focus{outline:0;border-color:#7c3aed}' +
      '.chn-gr{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:360px){.chn-gr{grid-template-columns:1fr}}.chn-tk{position:relative;border:0;border-radius:20px;padding:14px 8px 12px;color:#fff;text-align:center;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 8px 18px rgba(0,0,0,.2);transition:.18s;animation:chnIn .4s both;overflow:hidden}.chn-tk:active{transform:scale(.95)}.chn-tk.cur{box-shadow:0 0 0 4px #fde047,0 10px 22px rgba(0,0,0,.3)}@keyframes chnIn{from{opacity:0;transform:translateY(14px) scale(.96)}}' +
      '.chn-tk i{display:block;font-style:normal;font-size:2.3rem;filter:drop-shadow(0 5px 5px rgba(0,0,0,.3));animation:chnBob 3s ease-in-out infinite}@keyframes chnBob{50%{transform:translateY(-6px) rotate(6deg)}}.chn-tk b{display:block;font-size:.88rem;margin-top:2px}.chn-tk span{font-size:.72rem;opacity:.92}.chn-tk em{position:absolute;top:6px;left:8px;font-style:normal;font-size:.85rem}.chn-eq{display:none;position:absolute;bottom:6px;left:8px;gap:2px;align-items:flex-end;height:16px}.chn-tk.cur.play .chn-eq{display:flex}.chn-eq u{display:block;width:3px;background:#fff;border-radius:2px;animation:chnEq .6s ease-in-out infinite}.chn-eq u:nth-child(2){animation-delay:-.2s}.chn-eq u:nth-child(3){animation-delay:-.4s}@keyframes chnEq{0%,100%{height:4px}50%{height:16px}}.chn-nt2{font-size:.78rem;color:#6b7280;text-align:center;margin:8px 0}';
    document.head.appendChild(st);

    /* ---------- المشغّل ---------- */
    var A = new Audio(), AC = null, AN = null, SRC = null, cur = -1, shuf = false, rep = 0, V = { f: 'all', q: '' }, tick = 0, order = [], raf = 0, tmpSec = 0;
    A.preload = 'none';
    function setupAnalyser() { if (AN) return; try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; AC = new C(); SRC = AC.createMediaElementSource(A); AN = AC.createAnalyser(); AN.fftSize = 128; SRC.connect(AN); AN.connect(AC.destination); } catch (e) { AN = null; } }
    function hero() {
      var h = $('#chn-hd'); if (!h) return; var d = dayState(), p = Math.min(100, Math.round(d.s * 100 / GOAL)), nts = ['🎵', '🎶', '🎼', '🎤', '🎸', '🥁'];
      h.innerHTML = '<div class="chn-hero">' + nts.map(function (n, i) { return '<span class="chn-nt" style="left:' + (8 + i * 16) + '%;bottom:6%;animation-delay:-' + i * 0.9 + 's">' + n + '</span>'; }).join('') + '<div style="font-size:2.3rem;position:relative">🎧</div><h3>مسرح الأغاني الفرنسية</h3><div style="direction:ltr;font-weight:800;opacity:.95;position:relative">Chansons françaises</div><p>استمع، تفاعل، وحسّن أذنك الفرنسية مع الموسيقى</p>' +
        '<div class="chn-st"><span>' + level() + '</span><span>✨ ' + ST.xp + ' XP</span><span>🎶 ' + Object.keys(ST.done).length + ' / ' + SONGS.length + '</span></div><div class="chn-goal"><div><i style="width:' + p + '%"></i></div><small>🎯 هدف اليوم: ' + Math.floor(d.s / 60) + ' / ' + (GOAL / 60) + ' دقائق استماع' + (d.g ? ' ✅ حقّقته!' : '') + '</small></div></div>';
    }
    function playerHTML() {
      return '<div class="chn-pl" id="chn-pl" style="--a:#1e1b4b;--b:#7c3aed"><div class="chn-dw"><div class="chn-disc"></div><div class="chn-lb" id="chn-lb">🎵<small>—</small></div><div class="chn-arm"></div></div><div class="chn-ti" id="chn-ti">اختر أغنية لتبدأ 🎶</div><div class="chn-su" id="chn-su">اضغط على أي غلاف بالأسفل</div><canvas class="chn-cv" id="chn-cv" height="56"></canvas>' +
        '<div class="chn-pg"><span id="chn-t0">0:00</span><input type="range" id="chn-rg" min="0" max="1000" value="0"><span id="chn-t1">0:00</span></div>' +
        '<div class="chn-cl"><button type="button" data-c="shuf" id="chn-sh" title="عشوائي">🔀</button><button type="button" data-c="prev">⏮</button><button type="button" data-c="play" class="big" id="chn-pp">▶️</button><button type="button" data-c="next">⏭</button><button type="button" data-c="rep" id="chn-rp" title="تكرار">🔁</button></div>' +
        '<div class="chn-ex"><button type="button" data-c="b10">⏪ 10ث</button><button type="button" data-c="f10">10ث ⏩</button><button type="button" data-c="spd" id="chn-sp">⚡ 1×</button><button type="button" data-c="fav" id="chn-fv">🤍</button></div><div class="chn-ex chn-stars" id="chn-sr"></div></div>';
    }
    function mount() {
      ROOT.innerHTML = '<div class="chn"><div id="chn-hd"></div>' + playerHTML() + '<input class="chn-in" id="chn-q" type="search" placeholder="🔎 ابحث برقم الأغنية…"><div class="chn-fl" id="chn-fl"></div><div class="chn-nt2" id="chn-nt"></div><div class="chn-gr" id="chn-gr"></div></div>'; hero(); filters(); grid(); drawLoop();
    }
    function filters() { var fs = [['all', '🌍 الكل'], ['fav', '❤️ المفضلة'], ['done', '✅ استمعت'], ['new', '🆕 جديدة']]; $('#chn-fl').innerHTML = fs.map(function (f) { return '<button type="button" data-f="' + f[0] + '" class="' + (V.f === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join(''); }
    function list() { var q = V.q.trim(); return SONGS.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { var ok = V.f === 'all' || (V.f === 'fav' ? ST.fav.indexOf(x.s.file) > -1 : V.f === 'done' ? !!ST.done[x.s.file] : !ST.done[x.s.file]); return ok && (!q || String(numOf(x.s)).indexOf(q) > -1 || x.s.title.toLowerCase().indexOf(q.toLowerCase()) > -1); }); }
    function grid() {
      var l = list(); $('#chn-nt').textContent = l.length + ' أغنية'; $('#chn-gr').innerHTML = l.map(function (x, k) {
        var p = pal(x.i), n = numOf(x.s), fv = ST.fav.indexOf(x.s.file) > -1, dn = ST.done[x.s.file], rt = ST.rate[x.s.file];
        return '<button type="button" class="chn-tk' + (x.i === cur ? ' cur' + (!A.paused ? ' play' : '') : '') + '" data-i="' + x.i + '" style="--a:' + p[0] + ';--b:' + p[1] + ';animation-delay:' + Math.min(k, 10) * 40 + 'ms">' + (dn ? '<em>✅</em>' : '') + (fv ? '<em style="left:auto;right:8px">❤️</em>' : '') + '<i>' + EMO[x.i % EMO.length] + '</i><b>Chanson ' + n + '</b><span>' + (rt ? '⭐'.repeat(rt) : 'Song ' + n) + '</span><div class="chn-eq"><u></u><u></u><u></u></div></button>';
      }).join('');
    }
    function stars() { var s = SONGS[cur], r = s ? ST.rate[s.file] || 0 : 0; $('#chn-sr').innerHTML = [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-r="' + n + '">' + (n <= r ? '⭐' : '☆') + '</button>'; }).join(''); }
    function select(i, autoplay) {
      var s = SONGS[i]; if (!s) return; cur = i; var p = pal(i), n = numOf(s), pl = $('#chn-pl');
      pl.style.setProperty('--a', p[0]); pl.style.setProperty('--b', p[1]); $('#chn-lb').innerHTML = EMO[i % EMO.length] + '<small>' + n + '</small>'; $('#chn-ti').textContent = 'Chanson ' + n; $('#chn-su').textContent = 'Song ' + n + ' · Le Français Au Bac';
      A.src = new URL(s.file, document.baseURI).href; A.playbackRate = SPD[spi]; $('#chn-fv').textContent = ST.fav.indexOf(s.file) > -1 ? '❤️' : '🤍'; stars(); grid();
      try { if (navigator.mediaSession) { navigator.mediaSession.metadata = new MediaMetadata({ title: 'Chanson ' + n, artist: 'Le Français Au Bac' }); } } catch (e) {}
      if (autoplay) play(); try { pl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
    }
    function play() { setupAnalyser(); try { if (AC && AC.state === 'suspended') AC.resume(); } catch (e) {} var pr = A.play(); if (pr && pr.catch) pr.catch(function () { var t = document.getElementById('toast'); if (t) { t.textContent = 'تعذّر تشغيل هذا الملف 🎵'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2200); } }); }
    function nextIdx(d) { if (!SONGS.length) return -1; if (shuf) { var o = shuffle(SONGS.map(function (s, i) { return i; }).filter(function (i) { return i !== cur; })); return o.length ? o[0] : cur; } return (cur + d + SONGS.length) % SONGS.length; }
    var SPD = [1, 0.75, 1.25, 1.5], spi = 0;
    A.addEventListener('play', function () { $('#chn-pl').classList.add('play'); $('#chn-pp').textContent = '⏸'; grid(); });
    A.addEventListener('pause', function () { $('#chn-pl').classList.remove('play'); $('#chn-pp').textContent = '▶️'; grid(); });
    A.addEventListener('loadedmetadata', function () { $('#chn-t1').textContent = fmt(A.duration); });
    A.addEventListener('timeupdate', function () {
      if (!A.duration) return; $('#chn-rg').value = Math.round(A.currentTime * 1000 / A.duration); $('#chn-t0').textContent = fmt(A.currentTime); $('#chn-t1').textContent = fmt(A.duration);
    });
    A.addEventListener('ended', function () {
      var s = SONGS[cur]; if (s && !ST.done[s.file]) { ST.done[s.file] = 1; ST.xp += 5; save(); boost(10); hero(); }
      if (rep === 2) { A.currentTime = 0; play(); } else if (rep === 1 || shuf || cur < SONGS.length - 1) select(nextIdx(1), true); else { grid(); }
    });
    // احتساب وقت الاستماع الفعلي: كل 30 ثانية = نقاط + تسريع للجوائز
    setInterval(function () {
      if (A.paused || A.ended || !SEC.classList.contains('on')) return; var d = dayState(); d.s++; ST.sec++; tmpSec++;
      if (tmpSec >= 30) { tmpSec = 0; ST.xp += 2; boost(10); }
      if (!d.g && d.s >= GOAL) { d.g = 1; ST.xp += 40; boost(60); var t = document.getElementById('toast'); if (t) { t.textContent = '🎉 حققت هدف اليوم! +40 XP'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2600); } }
      save(); if (d.s % 5 === 0 || d.g === 1 && d.s === GOAL) hero();
    }, 1000);
    // المؤثر البصري الحي
    function drawLoop() {
      var cv = $('#chn-cv'); if (!cv) return; var g = cv.getContext('2d'); cancelAnimationFrame(raf);
      (function frame() {
        raf = requestAnimationFrame(frame); if (!SEC.classList.contains('on')) return; var w = cv.clientWidth || 300, h = 56; if (cv.width !== w) cv.width = w; g.clearRect(0, 0, w, h);
        var n = 32, bw = w / n, data = null, p = pal(Math.max(cur, 0)), t = Date.now() / 260;
        if (AN && !A.paused) { data = new Uint8Array(AN.frequencyBinCount); AN.getByteFrequencyData(data); }
        var grd = g.createLinearGradient(0, h, 0, 0); grd.addColorStop(0, p[0]); grd.addColorStop(1, '#fde047'); g.fillStyle = grd;
        for (var i = 0; i < n; i++) { var v; if (data) v = data[Math.floor(i * data.length / n * 0.8)] / 255; else if (!A.paused) v = 0.25 + 0.5 * Math.abs(Math.sin(t + i * 0.55)) * (0.6 + 0.4 * Math.sin(t * 0.7 + i)); else v = 0.06 + 0.04 * Math.sin(t * 0.5 + i); var bh = Math.max(3, v * h); g.fillRect(i * bw + 2, h - bh, bw - 4, bh); }
      })();
    }
    /* ---------- الأحداث ---------- */
    ROOT.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-i]'))) { var i = +x.dataset.i; if (i === cur) { if (A.paused) play(); else A.pause(); } else select(i, true); return; }
      if ((x = t.closest('[data-f]'))) { V.f = x.dataset.f; filters(); grid(); return; }
      if ((x = t.closest('[data-r]'))) { var s = SONGS[cur]; if (!s) return; var first = !ST.rate[s.file]; ST.rate[s.file] = +x.dataset.r; if (first) { ST.xp += 3; } save(); stars(); grid(); hero(); return; }
      if ((x = t.closest('[data-c]'))) { var c = x.dataset.c;
        if (c === 'play') { if (cur < 0) select(0, true); else if (A.paused) play(); else A.pause(); }
        else if (c === 'next') select(nextIdx(1), true); else if (c === 'prev') { if (A.currentTime > 4) A.currentTime = 0; else select(nextIdx(-1), true); }
        else if (c === 'b10') A.currentTime = Math.max(0, A.currentTime - 10); else if (c === 'f10') A.currentTime = Math.min(A.duration || 1e9, A.currentTime + 10);
        else if (c === 'shuf') { shuf = !shuf; x.classList.toggle('on', shuf); }
        else if (c === 'rep') { rep = (rep + 1) % 3; x.classList.toggle('on', rep > 0); x.textContent = rep === 2 ? '🔂' : '🔁'; }
        else if (c === 'spd') { spi = (spi + 1) % SPD.length; A.playbackRate = SPD[spi]; x.textContent = '⚡ ' + SPD[spi] + '×'; x.classList.toggle('on', spi > 0); }
        else if (c === 'fav') { var sg = SONGS[cur]; if (!sg) return; var k = ST.fav.indexOf(sg.file); if (k > -1) ST.fav.splice(k, 1); else ST.fav.push(sg.file); save(); x.textContent = k > -1 ? '🤍' : '❤️'; grid(); }
      }
    });
    ROOT.addEventListener('input', function (e) { if (e.target.id === 'chn-rg') { if (A.duration) A.currentTime = e.target.value / 1000 * A.duration; } else if (e.target.id === 'chn-q') { V.q = e.target.value; grid(); } });
    new MutationObserver(function () { if (!SEC.classList.contains('on') && !A.paused) A.pause(); }).observe(SEC, { attributes: true, attributeFilter: ['class'] });
    try { if (navigator.mediaSession) { navigator.mediaSession.setActionHandler('play', function () { play(); }); navigator.mediaSession.setActionHandler('pause', function () { A.pause(); }); navigator.mediaSession.setActionHandler('nexttrack', function () { select(nextIdx(1), true); }); navigator.mediaSession.setActionHandler('previoustrack', function () { select(nextIdx(-1), true); }); } } catch (e) {}

    /* ---------- التحميل ---------- */
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    ROOT.innerHTML = '<div class="empty">⏳ جارٍ تجهيز مسرح الأغاني…</div>';
    getJson('songs.json').then(function (d) {
      var arr = Array.isArray(d) ? d : (d && Array.isArray(d.songs) ? d.songs : null);
      if (!arr || !arr.length) { ROOT.innerHTML = '<div class="empty" style="text-align:center;padding:20px">⚠️ تعذّر تحميل data/songs.json — تأكد من رفعه في مجلد data.</div>'; return; }
      SONGS = arr.filter(function (s) { return s && s.file; }); mount();
    });
  }
})();
