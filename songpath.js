/* ===== songpath.js — يوجّه ملفات song_N.mp3 إلى data/songs/ + ينشئ قائمة الأغاني إن غاب data/songs.json =====
   يوضع قبل chansons.js. لا يغيّر أي ملف آخر، ويعمل مهما كانت طريقة كتابة المسار في الكود. */
(function () {
  'use strict';
  var RE = /(^|\/)(song_\d+\.mp3)/i;
  function fix(u) {
    try {
      if (typeof u !== 'string' || u.indexOf('data/songs/') > -1 || !RE.test(u)) return u;
      return u.replace(RE, function (_, a, b) { return a + 'data/songs/' + b; });
    } catch (e) { return u; }
  }
  try {
    var d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (d && d.set) Object.defineProperty(HTMLMediaElement.prototype, 'src', { get: d.get, set: function (v) { d.set.call(this, fix(v)); }, configurable: true, enumerable: d.enumerable });
  } catch (e) {}
  try {
    var sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) {
      if (typeof n === 'string' && n.toLowerCase() === 'src' && (this instanceof HTMLMediaElement || this instanceof HTMLSourceElement)) v = fix(v);
      return sa.call(this, n, v);
    };
  } catch (e) {}
  try {
    var A = window.Audio;
    if (A) { window.Audio = function (u) { var a = new A(); if (u !== undefined) a.src = fix(u); return a; }; window.Audio.prototype = A.prototype; }
  } catch (e) {}
  /* قائمة الأغاني الاحتياطية: إن لم يوجد data/songs.json يُنشأ تلقائيًا (song_1 … song_N) */
  var TOTAL = 50;
  function fallbackList() { var a = []; for (var i = 1; i <= TOTAL; i++) a.push({ file: 'song_' + i + '.mp3', title: 'Chanson ' + i }); return a; }
  function isList(u) { return typeof u === 'string' && /(^|\/)songs\.json(\?|#|$)/i.test(u); }
  try {
    var f = window.fetch;
    if (f) window.fetch = function (i, o) {
      var u = typeof i === 'string' ? fix(i) : i, self = this;
      var p = f.call(self, u, o);
      if (!isList(u)) return p;
      return p.then(function (r) {
        if (r && r.ok) return r;
        return new Response(JSON.stringify(fallbackList()), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }, function () {
        return new Response(JSON.stringify(fallbackList()), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
    };
  } catch (e) {}
  try {
    function scan(n) {
      if (!n || n.nodeType !== 1) return;
      var l = (n.matches && n.matches('audio[src],source[src]') ? [n] : []).concat([].slice.call(n.querySelectorAll ? n.querySelectorAll('audio[src],source[src]') : []));
      l.forEach(function (el) { var s = el.getAttribute('src'), g = fix(s); if (g !== s) el.setAttribute('src', g); });
    }
    new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, scan); }); }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
