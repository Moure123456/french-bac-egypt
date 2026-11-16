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
    var $= function (s, r) { return (r \vert{}\vert{} document).querySelector(s); },$$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
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
      '.chn-gr{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:360px){.chn-gr{grid-template-columns:1fr}}.chn-tk{position:relative;border:0;border-radius:20px;padding:14px 8px 12px;color:#fff;text-align:center;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 8px 18px rgba(0,0,0,.2);transition:.18s;animation:chnIn .4s both;overflow:hidden}.chn-tk:active{transform:scale(.95)}.chn-tk.cur{box-shadow:0 0 0 4px #fde047,0 10px 22px rgba(0,0,0,.3)}@keyframes chnIn{from{opacity:0;transform:translateY(14px) scale(.
