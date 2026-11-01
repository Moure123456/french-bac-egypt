/* ===== dialogues.js — «مسرح الحوارات» التفاعلي لقسم Dialogues =====
   يقرأ data/dialogues.json ويبني: بطاقات حوارات، فقاعات محادثة (ترجمة/نطق/IPA/كلمة بكلمة)، تشغيل صوتي بأصوات مختلفة،
   تمثيل دور بالميكروفون، واختبار حوار. يعمل داخل #dlg-root فقط ويُبقي العرض القديم كخيار. */
(function () {
  'use strict';
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () { try { boot(); } catch (e) { try { console.error('[dialogues]', e); } catch (_) {} } });

  function boot() {
    var SEC = document.getElementById('dialogues'), ROOT = document.getElementById('dlg-root');
    if (!SEC || !ROOT) return;
    var OLD = SEC.querySelector('.body');
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018`´]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function sim(a, b) { var m = a.length, n = b.length, d = [], i, j; if (!m || !n) return 0; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 1; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return 1 - d[m][n] / Math.max(m, n); }
    function boost(s) { if (window.__bqSplash && window.__bqSplash.boost) window.__bqSplash.boost(s * 1000); }

    /* ---------- الصوت ---------- */
    var AC = null, TOK = 0;
    function tn(f, t0, d, type, v) { try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (!AC) return; if (AC.state === 'suspended') AC.resume(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {} }
    function sOk() { tn(660, 0, 0.12, 'triangle', 0.15); tn(990, 0.1, 0.2, 'triangle', 0.15); }
    function sBad() { tn(220, 0, 0.25, 'sawtooth', 0.09); }
    function sWin() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tn(f, i * 0.12, 0.3, 'triangle', 0.15); }); }
    function stopSpeech() { TOK++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
    // نطق فرنسي مع طبقة صوت مختلفة لكل متحدّث؛ يستدعي done مرة واحدة فقط
    function speak(text, rate, pitch, done) {
      var fin = false, t0 = Date.now(), min = 800 + String(text).length * 40; function end() { if (fin) return; fin = true; var w = min - (Date.now() - t0); if (done) { if (w > 0) setTimeout(done, w); else done(); } }
      try {
        if (!window.speechSynthesis) { setTimeout(end, 600); return; } speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text)); u.lang = 'fr-FR'; u.rate = rate || 0.9; u.pitch = pitch || 1; u.onend = u.onerror = end; speechSynthesis.speak(u);
        setTimeout(end, 1800 + String(text).length * (rate && rate < 0.7 ? 190 : 120));
      } catch (e) { end(); }
    }
    function heard(target, cb) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { cb(null, ''); return null; }
      var r = new SR(); r.lang = 'fr-FR'; r.maxAlternatives = 3;
      r.onresult = function (e) { var t = norm(target), best = 0, h = ''; for (var i = 0; i < e.results[0].length; i++) { var x = e.results[0][i].transcript, s = sim(norm(x), t); if (s > best) { best = s; h = x; } } cb(best, h); };
      r.onerror = function () { cb(-1, ''); }; try { r.start(); } catch (e) { cb(-1, ''); } return r;
    }

    /* ---------- البيانات والتقدم ---------- */
    var D = null, ST = store('bq_dlg') || { xp: 0, done: {}, fav: [], tg: { ar: 1, pr: 0, ipa: 0 } };
    function save() { store('bq_dlg', ST); }
    function addXp(n) { ST.xp += n; save(); hero(); }
    function lvl() { var x = ST.xp; return x >= 800 ? '🏆 نجم المسرح' : x >= 400 ? '🎬 ممثل محترف' : x >= 150 ? '🎭 ممثل واعد' : x >= 40 ? '📘 متحدّث' : '🌱 مبتدئ'; }
    var LV = { '1sec': '1 ثانوي', '2sec': '2 ثانوي', '3sec': '3 ثانوي' };
    var ICONS = [[/pr[ée]sent/, '👋'], [/chemin/, '🧭'], [/v[êe]tement/, '👗'], [/restaurant/, '🍽️'], [/sport/, '⚽'], [/classe/, '🏫'], [/m[ée]decin/, '🩺'], [/inviter|t[ée]l[ée]phone/, '📞'], [/salut/, '🙌'], [/loisir/, '🎨'], [/projet|entretien/, '💼'], [/biblioth/, '📚'], [/courses/, '🛒'], [/m[ée]t[ée]o/, '⛅'], [/pharmacie/, '💊'], [/voyage/, '🧳'], [/gare/, '🚉'], [/rendez/, '📅'], [/sentiment/, '❤️'], [/gourmand/, '🍰'], [/[ée]colog/, '🌱'], [/inventeur/, '💡']];
    function icon(d) { var t = (d.id + ' ' + d.title_fr).toLowerCase(); for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(t)) return ICONS[i][1]; return '💬'; }
    var COLS = ['#2563eb', '#db2777', '#0d9488', '#ea580c', '#7c3aed', '#16a34a', '#ca8a04'];
    function colOf(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return COLS[h % COLS.length]; }
    function dlg(id) { return D.dialogues.filter(function (x) { return x.id === id; })[0]; }
    var PITCH = [1.18, 0.82, 1.0, 1.3];
    function pitchOf(d, who) { var i = 0; d.speakers.forEach(function (s, k) { if (s.name === who) i = k; }); return PITCH[i % PITCH.length]; }

    /* ---------- التنسيق (بادئة dgx- لتجنّب أي تعارض مع ملفات الموقع) ---------- */
    var st = document.createElement('style');
    st.textContent = '.dgx{color:#1f2937}.dgx *{box-sizing:border-box}.dgx button{font-family:inherit;cursor:pointer}' +
      '.dgx-hero{position:relative;overflow:hidden;border-radius:22px;padding:16px;color:#fff;text-align:center;background:linear-gradient(135deg,#7c2d12,#be185d 45%,#7c3aed 80%,#1d4ed8);background-size:220% 220%;animation:dgxBg 10s ease infinite;box-shadow:0 10px 28px rgba(190,24,93,.38);margin-bottom:12px}@keyframes dgxBg{50%{background-position:100% 50%}}' +
      '.dgx-hero h3{margin:2px 0 0;font-size:1.3rem}.dgx-hero p{margin:4px 0 8px;font-size:.82rem;opacity:.92}.dgx-curt{display:flex;justify-content:space-between;font-size:1.6rem;opacity:.9;margin-bottom:-6px}.dgx-stats{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.dgx-stats span{background:rgba(255,255,255,.2);border-radius:14px;padding:5px 11px;font-size:.78rem;font-weight:800}' +
      '.dgx-in{width:100%;border:2px solid #d6e2f0;border-radius:14px;padding:11px 14px;font-family:inherit;font-size:1rem;margin-bottom:8px}.dgx-in:focus{outline:0;border-color:#be185d}' +
      '.dgx-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}.dgx-chips button{flex:none;border:1px solid #d6e2f0;background:#fff;border-radius:20px;padding:8px 14px;font-weight:800;font-size:.82rem;color:#374151}.dgx-chips button.on{background:linear-gradient(135deg,#be185d,#7c3aed);color:#fff;border-color:transparent}' +
      '.dgx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:380px){.dgx-grid{grid-template-columns:1fr}}.dgx-card{position:relative;text-align:center;background:#fff;border:1px solid #e5e7eb;border-top:5px solid var(--c);border-radius:18px;padding:12px 8px;box-shadow:0 4px 12px rgba(0,0,0,.07);animation:dgxIn .35s both;transition:.15s}.dgx-card:active{transform:scale(.97)}@keyframes dgxIn{from{opacity:0;transform:translateY(12px)}}' +
      '.dgx-card i{display:block;font-style:normal;font-size:2.2rem}.dgx-card b{display:block;color:#111827;font-size:.92rem;margin:4px 0 0;direction:ltr}.dgx-card span{display:block;color:#6b7280;font-size:.8rem}.dgx-card small{display:inline-block;margin-top:6px;border-radius:10px;padding:2px 9px;background:var(--c);color:#fff;font-weight:800;font-size:.7rem}.dgx-card em{position:absolute;top:6px;left:8px;font-style:normal;font-size:.9rem}' +
      '.dgx-top{display:flex;align-items:center;gap:8px;margin-bottom:10px}.dgx-back{border:0;border-radius:12px;padding:9px 13px;background:#f3e8ff;font-weight:800;color:#6b21a8}.dgx-top h4{flex:1;margin:0;color:#9d174d;font-size:1.02rem;direction:ltr;text-align:left}.dgx-fav{border:0;background:none;font-size:1.5rem}' +
      '.dgx-ctx{background:linear-gradient(135deg,#fff7ed,#fdf2f8);border:1px solid #fbcfe8;border-radius:16px;padding:10px 12px;margin-bottom:10px;font-size:.88rem;line-height:1.8}.dgx-sp{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.dgx-sp span{display:flex;align-items:center;gap:5px;background:#fff;border-radius:14px;padding:3px 10px 3px 4px;font-size:.75rem;font-weight:700;border:1px solid #e5e7eb}.dgx-av{width:26px;height:26px;border-radius:50%;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:.8rem;background:var(--c)}' +
      '.dgx-modes{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px}.dgx-modes button{flex:none;border:0;border-radius:16px;padding:10px 13px;font-weight:800;font-size:.82rem;background:#f3f4f6;color:#374151}.dgx-modes button.on{background:linear-gradient(135deg,#be185d,#7c3aed);color:#fff;box-shadow:0 6px 14px rgba(190,24,93,.35)}' +
      '.dgx-tg{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.dgx-tg button{border:1px solid #d1d5db;background:#fff;border-radius:16px;padding:6px 12px;font-size:.78rem;font-weight:800;color:#4b5563}.dgx-tg button.on{background:#fde68a;border-color:#f59e0b;color:#78350f}' +
      '.dgx-chat{background:linear-gradient(180deg,#fdf2f8,#eef2ff);border-radius:20px;padding:12px 10px;border:1px solid #e9d5ff}.dgx-row{display:flex;gap:7px;margin-bottom:12px;align-items:flex-end;animation:dgxIn .4s both}.dgx-row.me{flex-direction:row-reverse}.dgx-row .dgx-av{width:34px;height:34px;flex:none;font-size:1rem}' +
      '.dgx-bub{position:relative;max-width:82%;background:#fff;border-radius:18px 18px 18px 4px;padding:9px 11px;box-shadow:0 3px 8px rgba(0,0,0,.08);border:2px solid transparent;transition:.2s}.dgx-row.me .dgx-bub{border-radius:18px 18px 4px 18px;background:#fdf2f8}.dgx-bub.pl{border-color:#f59e0b;background:#fffbeb;transform:scale(1.02);box-shadow:0 8px 18px rgba(245,158,11,.35)}.dgx-bub.you{border-color:#be185d;background:#fff1f2}' +
      '.dgx-who{font-size:.7rem;font-weight:900;color:var(--c);margin-bottom:2px;direction:ltr;text-align:left}.dgx-fr{font-size:1.02rem;font-weight:700;line-height:1.7;direction:ltr;text-align:left;color:#111827}.dgx-w{border-radius:6px;padding:0 1px;cursor:pointer}.dgx-w:active,.dgx-w.hl{background:#fde68a}' +
      '.dgx-ar{margin-top:4px;font-size:.88rem;color:#374151;line-height:1.7;border-top:1px dashed #e5e7eb;padding-top:4px}.dgx-pr{margin-top:3px;font-size:.84rem;color:#6d28d9;line-height:1.7}.dgx-ipa{margin-top:3px;font-size:.8rem;color:#0f766e;direction:ltr;text-align:left}' +
      '.dgx-bb{display:flex;gap:5px;margin-top:6px}.dgx-bb button{width:32px;height:32px;border-radius:50%;border:0;background:#f3e8ff;font-size:.9rem}.dgx-bb button.rec{background:#fecaca;animation:dgxP 1s infinite}@keyframes dgxP{50%{transform:scale(1.15)}}.dgx-fb{font-size:.78rem;margin-top:4px}' +
      '.dgx-bar{position:sticky;bottom:8px;z-index:3;display:flex;gap:8px;justify-content:center;margin-top:12px}.dgx-btn{border:0;border-radius:22px;padding:12px 20px;font-weight:900;background:linear-gradient(135deg,#be185d,#7c3aed);color:#fff;box-shadow:0 6px 16px rgba(124,58,237,.4)}.dgx-btn.y{background:linear-gradient(135deg,#fde047,#fb923c);color:#7c2d12}.dgx-btn.g{background:#f3f4f6;color:#374151;box-shadow:none}' +
      '.dgx-play{background:linear-gradient(135deg,#312e81,#6d28d9);border-radius:22px;padding:14px;color:#fff;text-align:center;box-shadow:0 10px 26px rgba(49,46,129,.4)}.dgx-q{font-size:1.1rem;font-weight:800;direction:ltr;margin:10px 0;line-height:1.7}.dgx-q u{text-decoration:none;display:inline-block;min-width:60px;border-bottom:3px dashed #fde047;color:#fde047}.dgx-opts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.dgx-opts.one{grid-template-columns:1fr}.dgx-opt{border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.15);color:#fff;border-radius:16px;padding:13px 6px;font-weight:800;font-size:.95rem;word-break:break-word}.dgx-opt.ok{background:#16a34a}.dgx-opt.no{background:#dc2626}' +
      '.dgx-end{font-size:2.4rem;letter-spacing:6px}.dgx-note{font-size:.78rem;color:#6b7280;text-align:center;margin:8px 0}.dgx-prog{height:9px;border-radius:6px;background:#e5e7eb;overflow:hidden;margin:6px 0}.dgx-prog i{display:block;height:100%;background:linear-gradient(90deg,#f472b6,#a78bfa);transition:width .4s}';
    document.head.appendChild(st);

    /* ---------- الحالة والعرض ---------- */
    var V = { view: 'home', f: 'all', q: '', id: null, mode: 'read' }, PLAY = null, RP = null, QZ = null, rec = null;
    function hero() {
      var h = $('#dgx-hero'); if (!h || !D) return; var n = D.dialogues.length, dn = Object.keys(ST.done).filter(function (k) { return !!dlg(k); }).length;
      h.innerHTML = '<div class="dgx-hero"><div class="dgx-curt"><span>🎭</span><span>🎭</span></div><h3>مسرح الحوارات</h3><div style="direction:ltr;font-weight:800;opacity:.92;letter-spacing:1px">Théâtre de dialogues</div><p>اسمع، مثّل، وتحدّث الفرنسية كما في الحياة الحقيقية</p><div class="dgx-stats"><span>' + lvl() + '</span><span>✨ ' + ST.xp + ' XP</span><span>🎬 ' + dn + ' / ' + n + ' حوار</span></div></div>';
    }
    function mount() {
      ROOT.innerHTML = '<div class="dgx"><div id="dgx-hero"></div><div id="dgx-view"></div></div>'; hero(); render();
    }
    function render() {
      stopSpeech(); PLAY = null; var v = $('#dgx-view'); if (!D) return; if (OLD) OLD.style.display = V.view === 'old' ? '' : 'none';
      if (V.view === 'home') v.innerHTML = vHome(); else if (V.view === 'old') v.innerHTML = '<div class="dgx-note">📘 العرض الكلاسيكي — كما كان.</div><div class="dgx-bar" style="position:static"><button type="button" class="dgx-btn g" data-act="home">⬅ العودة للمسرح</button></div>'; else v.innerHTML = vDlg();
      if (V.view === 'dlg') stageInit();
    }
    function filtered() {
      var q = norm(V.q);
      return D.dialogues.filter(function (d) {
        var ok = V.f === 'all' || (V.f === 'fav' ? ST.fav.indexOf(d.id) > -1 : V.f === 'done' ? !!ST.done[d.id] : d.level === V.f);
        return ok && (!q || norm(d.title_fr).indexOf(q) > -1 || d.title_ar.indexOf(V.q) > -1);
      });
    }
    function vHome() {
      var fs = [['all', '🌍 الكل'], ['1sec', '1 ثانوي'], ['2sec', '2 ثانوي'], ['3sec', '3 ثانوي'], ['fav', '⭐ المفضلة'], ['done', '✅ أتممتها']];
      var l = filtered();
      return '<input class="dgx-in" id="dgx-q" type="search" placeholder="🔎 ابحث عن حوار…" value="' + esc(V.q) + '"><div class="dgx-chips">' + fs.map(function (f) { return '<button type="button" data-f="' + f[0] + '" class="' + (V.f === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
        '<div class="dgx-note">' + l.length + ' حوار — اختر حوارًا لتبدأ</div><div class="dgx-grid" id="dgx-gr">' + l.map(cardHTML).join('') + '</div>' +
        '<div class="dgx-bar" style="position:static"><button type="button" class="dgx-btn g" data-act="old">📘 العرض الكلاسيكي</button></div>';
    }
    function cardHTML(d, i) {
      var c = { '1sec': '#16a34a', '2sec': '#ea580c', '3sec': '#be185d' }[d.level] || '#7c3aed', dn = ST.done[d.id], fv = ST.fav.indexOf(d.id) > -1;
      return '<button type="button" class="dgx-card" data-open="' + esc(d.id) + '" style="--c:' + c + ';animation-delay:' + Math.min(i, 10) * 40 + 'ms">' + (dn ? '<em>' + '⭐'.repeat(dn.s || 1) + '</em>' : '') + (fv ? '<em style="left:auto;right:8px">❤️</em>' : '') + '<i>' + icon(d) + '</i><b>' + esc(d.title_fr) + '</b><span>' + esc(d.title_ar) + '</span><small>' + (LV[d.level] || '') + ' · ' + d.lines.length + ' جمل</small></button>';
    }

    /* ---------- صفحة الحوار ---------- */
    function tg(k, label) { return '<button type="button" data-tg="' + k + '" class="' + (ST.tg[k] ? 'on' : '') + '">' + label + '</button>'; }
    function words(t) { return String(t).split(/(\s+)/).map(function (w) { return /\S/.test(w) ? '<span class="dgx-w" data-w="' + esc(w.replace(/[^\wÀ-ÿ’']/g, '')) + '">' + esc(w) + '</span>' : w; }).join(''); }
    function bubble(d, l, i, me) {
      var c = colOf(l.who), s = d.speakers.filter(function (x) { return x.name === l.who; })[0];
      return '<div class="dgx-row' + (me ? ' me' : '') + '" data-i="' + i + '" style="--c:' + c + ';animation-delay:' + Math.min(i, 8) * 60 + 'ms"><div class="dgx-av">' + esc(l.who.replace(/^(Le|La|L’|L\')\s*/i, '').charAt(0).toUpperCase()) + '</div><div class="dgx-bub"><div class="dgx-who">' + esc(l.who) + (s ? ' · ' + esc(s.role_ar) : '') + '</div><div class="dgx-fr">' + words(l.fr) + '</div>' +
        '<div class="dgx-ar" data-k="ar"' + (ST.tg.ar ? '' : ' hidden') + '>' + esc(l.ar) + '</div><div class="dgx-pr" data-k="pr"' + (ST.tg.pr ? '' : ' hidden') + '>🔤 ' + esc(l.pron_ar) + '</div><div class="dgx-ipa" data-k="ipa"' + (ST.tg.ipa ? '' : ' hidden') + '>/' + esc(l.ipa) + '/</div>' +
        '<div class="dgx-bb"><button type="button" data-a="say" data-i="' + i + '">🔊</button><button type="button" data-a="slow" data-i="' + i + '">🐢</button><button type="button" data-a="mic" data-i="' + i + '">🎤</button></div><div class="dgx-fb"></div></div></div>';
    }
    function vDlg() {
      var d = dlg(V.id), fv = ST.fav.indexOf(d.id) > -1;
      var modes = [['read', '📖 قراءة'], ['listen', '▶️ استمع'], ['role', '🎭 مثّل الدور'], ['quiz', '🧩 اختبر نفسك']];
      return '<div class="dgx-top"><button type="button" class="dgx-back" data-act="home">→ الحوارات</button><h4>' + icon(d) + ' ' + esc(d.title_fr) + '</h4><button type="button" class="dgx-fav" data-act="fav">' + (fv ? '❤️' : '🤍') + '</button></div>' +
        '<div class="dgx-ctx"><b>🎬 الموقف:</b> ' + esc(d.context_ar) + '<div class="dgx-sp">' + d.speakers.map(function (s) { return '<span style="--c:' + colOf(s.name) + '"><i class="dgx-av" style="font-style:normal">' + esc(s.name.replace(/^(Le|La|L’|L\')\s*/i, '').charAt(0).toUpperCase()) + '</i>' + esc(s.name) + ' · ' + esc(s.role_ar) + '</span>'; }).join('') + '</div></div>' +
        '<div class="dgx-modes">' + modes.map(function (m) { return '<button type="button" data-m="' + m[0] + '" class="' + (V.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div><div id="dgx-stage"></div>';
    }
    function stageInit() {
      var d = dlg(V.id), s = $('#dgx-stage'); RP = null; QZ = null;
      if (V.mode === 'read' || V.mode === 'listen') {
        s.innerHTML = '<div class="dgx-tg">' + tg('ar', '🇪🇬 الترجمة') + tg('pr', '🔤 النطق بالعربي') + tg('ipa', '/IPA/') + '</div>' + (V.mode === 'read' ? '<div class="dgx-note">💡 اضغط على أي كلمة فرنسية لسماعها وحدها</div>' : '') + '<div class="dgx-chat" id="dgx-chat">' + d.lines.map(function (l, i) { return bubble(d, l, i, d.speakers[0].name !== l.who); }).join('') + '</div>' +
          (V.mode === 'listen' ? '<div class="dgx-bar"><button type="button" class="dgx-btn y" data-act="play" id="dgx-pl">▶️ شغّل الحوار كاملًا</button></div>' : '<div class="dgx-bar"><button type="button" class="dgx-btn" data-act="done">✅ أنهيت القراءة (+5 XP)</button></div>');
      } else if (V.mode === 'role') roleHome(); else quizStart();
    }

    /* ---------- التشغيل الصوتي الكامل ---------- */
    function playAll() {
      var d = dlg(V.id), btn = $('#dgx-pl'); if (PLAY) { stopSpeech(); PLAY = null; $$('.dgx-bub.pl').forEach(function (b) { b.classList.remove('pl'); }); if (btn) btn.textContent = '▶️ شغّل الحوار كاملًا'; return; }
      var my = ++TOK; PLAY = { t: my }; btn.textContent = '⏹ إيقاف'; var i = 0;
      (function step() {
        if (!PLAY || PLAY.t !== my) return; $$('.dgx-bub.pl').forEach(function (b) { b.classList.remove('pl'); });
        if (i >= d.lines.length) { PLAY = null; btn.textContent = '▶️ شغّل الحوار كاملًا'; finish(1, 'تم الاستماع'); return; }
        var l = d.lines[i], row = $('.dgx-row[data-i="' + i + '"]'); i++; if (row) { $('.dgx-bub', row).classList.add('pl'); try { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
        speak(l.fr, 0.9, pitchOf(d, l.who), function () { setTimeout(step, 450); });
      })();
    }

    /* ---------- تمثيل الدور ---------- */
    function roleHome() {
      var d = dlg(V.id), s = $('#dgx-stage');
      s.innerHTML = '<div class="dgx-play"><div style="font-size:2.4rem">🎭</div><h3 style="margin:2px 0">مثّل الدور</h3><p style="font-size:.85rem;opacity:.92">اختر الشخصية التي ستمثّلها، وسيتحدّث التطبيق بدور الطرف الآخر. اقرأ جملك بصوت عالٍ!</p><div class="dgx-opts one">' +
        d.speakers.map(function (sp) { return '<button type="button" class="dgx-opt" data-me="' + esc(sp.name) + '">أنا ' + esc(sp.name) + ' — ' + esc(sp.role_ar) + '</button>'; }).join('') + '</div></div>';
    }
    function roleStart(me) {
      var d = dlg(V.id), s = $('#dgx-stage'); RP = { me: me, i: 0, ok: 0, n: 0, tok: ++TOK }; s.innerHTML = '<div class="dgx-chat" id="dgx-chat"></div><div id="dgx-rpc" class="dgx-note"></div>'; rpNext();
    }
    function rpNext() {
      var d = dlg(V.id), chat = $('#dgx-chat'), c = $('#dgx-rpc'); if (!RP) return;
      if (RP.i >= d.lines.length) { var avg = RP.n ? Math.round(RP.ok / RP.n) : 100, st3 = avg >= 80 ? 3 : avg >= 55 ? 2 : 1; sWin(); chat.insertAdjacentHTML('afterend', '<div class="dgx-play" style="margin-top:12px"><div class="dgx-end">' + '⭐'.repeat(st3) + '☆'.repeat(3 - st3) + '</div><h3>أحسنت يا ممثل! 🎬</h3><p>' + (RP.n ? 'دقة نطقك: ' + avg + '%' : 'أتممت الحوار') + ' · ✨ +15 XP ⚡</p><button type="button" class="dgx-btn y" data-act="role2">🔁 أعد بدور آخر</button></div>'); c.textContent = ''; finish(st3, 'مثّلت الحوار', 15, 30); RP = null; return; }
      var l = d.lines[RP.i], mine = l.who === RP.me; chat.insertAdjacentHTML('beforeend', bubble(d, l, RP.i, d.speakers[0].name !== l.who)); var row = $('.dgx-row[data-i="' + RP.i + '"]', chat), b = $('.dgx-bub', row);
      $$('[data-k]', row).forEach(function (x) { x.hidden = !ST.tg[x.dataset.k]; });
      try { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      if (!mine) { b.classList.add('pl'); c.textContent = '🎧 اسمع…'; var my = RP.tok; speak(l.fr, 0.9, pitchOf(d, l.who), function () { if (RP && RP.tok === my) { b.classList.remove('pl'); RP.i++; setTimeout(rpNext, 350); } }); }
      else { b.classList.add('you'); c.innerHTML = '🎤 دورك! اقرأ الجملة بصوت عالٍ ثم اضغط 🎤 للتقييم<div style="margin-top:8px"><button type="button" class="dgx-btn" data-act="rpskip">التالي ➜</button></div>'; }
    }

    /* ---------- اختبار الحوار ---------- */
    function allWords(excl) { var o = {}; D.dialogues.forEach(function (d) { d.lines.forEach(function (l) { l.fr.split(/\s+/).forEach(function (w) { var c = w.replace(/[^\wÀ-ÿ’']/g, ''); if (c.length >= 4 && excl.indexOf(c.toLowerCase()) < 0) o[c.toLowerCase()] = 1; }); }); }); return Object.keys(o); }
    function quizStart() {
      var d = dlg(V.id), qs = [];
      d.lines.forEach(function (l, i) {
        var ws = l.fr.split(/\s+/).map(function (w) { return w.replace(/[^\wÀ-ÿ’']/g, ''); }).filter(function (w) { return w.length >= 4; });
        if (ws.length) { var w = ws[Math.floor(Math.random() * ws.length)]; var dist = shuffle(allWords([w.toLowerCase()])).slice(0, 3); qs.push({ t: 'cloze', l: l, w: w, opts: shuffle([w.toLowerCase()].concat(dist)) }); }
        var oth = shuffle(D.dialogues.reduce(function (a, x) { return a.concat(x.lines); }, []).filter(function (x) { return x.ar !== l.ar; })).slice(0, 2).map(function (x) { return x.ar; });
        qs.push({ t: 'mean', l: l, opts: shuffle([l.ar].concat(oth)) });
      });
      QZ = { qs: shuffle(qs).slice(0, 6), i: 0, ok: 0 }; quizQ();
    }
    function quizQ() {
      var s = $('#dgx-stage'); if (!QZ) return;
      if (QZ.i >= QZ.qs.length) { var p = Math.round(QZ.ok * 100 / QZ.qs.length), st3 = p >= 85 ? 3 : p >= 60 ? 2 : p > 0 ? 1 : 0; sWin(); s.innerHTML = '<div class="dgx-play"><div class="dgx-end">' + '⭐'.repeat(st3) + '☆'.repeat(3 - st3) + '</div><h3 dir="ltr">' + QZ.ok + ' / ' + QZ.qs.length + '</h3><p>✨ +' + QZ.ok * 5 + ' XP</p><button type="button" class="dgx-btn y" data-act="quiz2">🔁 جولة جديدة</button></div>'; if (p >= 60) finish(st3, 'اجتزت الاختبار', 0, 0); QZ = null; return; }
      var q = QZ.qs[QZ.i], h = '<div class="dgx-play"><div style="display:flex;justify-content:space-between;font-weight:800"><span>' + (QZ.i + 1) + ' / ' + QZ.qs.length + '</span><span>✅ ' + QZ.ok + '</span></div>';
      if (q.t === 'cloze') { var ix = q.l.fr.indexOf(q.w), blank = esc(q.l.fr.slice(0, ix)) + '<u>&nbsp;&nbsp;&nbsp;&nbsp;</u>' + esc(q.l.fr.slice(ix + q.w.length)); h += '<div style="opacity:.9;margin-top:8px">أكمل الجملة:</div><div class="dgx-q">' + blank + '</div><div style="font-size:.85rem;opacity:.85">' + esc(q.l.ar) + '</div><div class="dgx-opts">' + q.opts.map(function (o, k) { return '<button type="button" class="dgx-opt" data-qo="' + k + '" style="direction:ltr">' + esc(o) + '</button>'; }).join('') + '</div>'; }
      else h += '<div style="opacity:.9;margin-top:8px">ما معنى هذه الجملة؟</div><div class="dgx-q">' + esc(q.l.fr) + '</div><button type="button" class="dgx-btn y" data-qs="1">🔊 اسمعها</button><div class="dgx-opts one">' + q.opts.map(function (o, k) { return '<button type="button" class="dgx-opt" data-qo="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      s.innerHTML = h + '<div id="dgx-qm" style="min-height:30px;margin-top:8px;font-weight:800"></div></div>'; QZ.lock = false;
    }
    function quizAns(k) {
      if (!QZ || QZ.lock) return; QZ.lock = true; var q = QZ.qs[QZ.i], right = q.t === 'cloze' ? q.w.toLowerCase() : q.l.ar, ok = q.opts[k] === right;
      $$('.dgx-opt').forEach(function (b, i) { if (q.opts[i] === right) b.classList.add('ok'); else if (i === k) b.classList.add('no'); });
      if (ok) { QZ.ok++; sOk(); addXp(5); boost(8); } else sBad(); $('#dgx-qm').textContent = ok ? '🎉 أحسنت!' : '❌ الصواب موضّح بالأخضر';
      setTimeout(function () { if (QZ) { QZ.i++; quizQ(); } }, ok ? 900 : 1900);
    }
    function finish(stars, msg, xp, bst) {
      var d = dlg(V.id), first = !ST.done[d.id]; if (!ST.done[d.id] || (ST.done[d.id].s || 0) < stars) ST.done[d.id] = { s: stars }; if (first) ST.xp += 10; if (xp) ST.xp += xp; save(); if (first) boost(15); if (bst) boost(bst); hero();
    }

    /* ---------- الأحداث ---------- */
    function onClick(e) {
      var t = e.target, x;
      if ((x = t.closest('[data-open]'))) { V.view = 'dlg'; V.id = x.dataset.open; V.mode = 'read'; render(); window.scrollTo(0, 0); return; }
      if ((x = t.closest('[data-f]'))) { V.f = x.dataset.f; render(); return; }
      if ((x = t.closest('[data-m]'))) { V.mode = x.dataset.m; $$('.dgx-modes button').forEach(function (b) { b.classList.toggle('on', b === x); }); stopSpeech(); PLAY = null; stageInit(); return; }
      if ((x = t.closest('[data-tg]'))) { var k = x.dataset.tg; ST.tg[k] = ST.tg[k] ? 0 : 1; save(); x.classList.toggle('on', !!ST.tg[k]); $$('[data-k="' + k + '"]').forEach(function (el) { el.hidden = !ST.tg[k]; }); return; }
      if ((x = t.closest('[data-me]'))) { roleStart(x.dataset.me); return; }
      if ((x = t.closest('[data-qo]'))) { quizAns(+x.dataset.qo); return; }
      if (t.closest('[data-qs]') && QZ) { speak(QZ.qs[QZ.i].l.fr, 0.85, 1); return; }
      if ((x = t.closest('[data-act]'))) { var a = x.dataset.act; var d = V.id ? dlg(V.id) : null;
        if (a === 'home') { V.view = 'home'; render(); } else if (a === 'old') { V.view = 'old'; render(); }
        else if (a === 'fav') { var i = ST.fav.indexOf(d.id); if (i > -1) ST.fav.splice(i, 1); else ST.fav.push(d.id); save(); x.textContent = i > -1 ? '🤍' : '❤️'; }
        else if (a === 'play') playAll(); else if (a === 'done') { finish(1, 'قراءة', 5, 0); x.textContent = '✅ تم! +5 XP'; sOk(); }
        else if (a === 'role2') { stageInit(); } else if (a === 'quiz2') quizStart(); else if (a === 'rpskip' && RP) { RP.i++; $$('.dgx-bub.you').forEach(function (b) { b.classList.remove('you'); }); rpNext(); }
        return; }
      if ((x = t.closest('.dgx-w'))) { speak(x.dataset.w, 0.8, 1); x.classList.add('hl'); setTimeout(function () { x.classList.remove('hl'); }, 700); return; }
      if ((x = t.closest('.dgx-bb [data-a]'))) { var dd = dlg(V.id), l = dd.lines[+x.dataset.i], ac = x.dataset.a;
        if (ac === 'say') speak(l.fr, 0.9, pitchOf(dd, l.who)); else if (ac === 'slow') speak(l.fr, 0.5, pitchOf(dd, l.who));
        else if (ac === 'mic') { var fb = $('.dgx-fb', x.closest('.dgx-bub')); if (rec) { try { rec.abort(); } catch (z) {} } x.classList.add('rec'); fb.textContent = 'تكلّم الآن… 🎙️';
          rec = heard(l.fr, function (sc, h) { x.classList.remove('rec'); if (sc === null) { fb.textContent = '🎤 المتصفح لا يدعم التعرف على الصوت (جرّب Chrome).'; return; } if (sc < 0) { fb.textContent = '⚠️ لم أسمعك جيدًا، أعد المحاولة.'; return; } var p = Math.round(sc * 100); fb.innerHTML = (p >= 80 ? '🎉 ممتاز' : p >= 55 ? '👍 قريب جدًا' : '🔁 حاول مجددًا') + ' · ' + p + '%'; if (RP && RP.me === l.who && RP.i === +x.dataset.i) { RP.ok += p; RP.n++; } if (p >= 80) { sOk(); addXp(3); } }); } }
    }
    ROOT.addEventListener('click', onClick);
    ROOT.addEventListener('input', function (e) { if (e.target.id === 'dgx-q') { V.q = e.target.value; var g = $('#dgx-gr'); if (g) { var l = filtered(); g.innerHTML = l.map(cardHTML).join(''); $('.dgx-note', ROOT).textContent = l.length + ' حوار — اختر حوارًا لتبدأ'; } } });
    new MutationObserver(function () { if (!SEC.classList.contains('on')) { stopSpeech(); PLAY = null; var b = $('#dgx-pl'); if (b) b.textContent = '▶️ شغّل الحوار كاملًا'; } }).observe(SEC, { attributes: true, attributeFilter: ['class'] });

    /* ---------- التحميل ---------- */
    function cands(file) { var base = location.pathname.replace(/[^/]*$/, ''); var l = ['./data/' + file, 'data/' + file, base + 'data/' + file, '/data/' + file], h = location.hostname; if (/\.github\.io$/.test(h)) { var u = h.split('.')[0], p = location.pathname.split('/').filter(Boolean), r = (p.length && !/\.html?$/i.test(p[0])) ? p[0] : (u + '.github.io'); l.push('https://cdn.jsdelivr.net/gh/' + u + '/' + r + '@main/data/' + file); } return l.filter(function (c, i) { return l.indexOf(c) === i; }); }
    function getJson(file) { var c = cands(file), i = 0; function nx() { if (i >= c.length) return Promise.resolve(null); return fetch(c[i++] + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { return JSON.parse(t.replace(/^\uFEFF/, '')); }).catch(nx); } return nx(); }
    ROOT.innerHTML = '<div class="empty">⏳ جارٍ تجهيز المسرح…</div>'; if (OLD) OLD.style.display = 'none';
    getJson('dialogues.json').then(function (d) {
      if (!d || !Array.isArray(d.dialogues) || !d.dialogues.length) { ROOT.innerHTML = ''; if (OLD) OLD.style.display = ''; return; }
      D = d; if (!ST.tg) ST.tg = { ar: 1, pr: 0, ipa: 0 }; mount();
    });
  }
})();
