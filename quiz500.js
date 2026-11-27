/* ===== 500 سؤال وإجابة — quiz500.js ===== */
(function () {
'use strict';

// كل سطر: جملة فيها * مكان الفراغ | الصحيح | خطأ | خطأ
var CATS = [
['Grammaire', '✍️', '#0055A5', `
Je * égyptien.|suis|es|est
Tu * quinze ans.|as|a|ai
Nous * à l’école.|allons|allez|vont
Vous * français.|parlez|parlons|parlent
Ils * leurs devoirs.|font|fait|faisons
Elle * au lycée.|va|vas|vont
Les élèves * en classe.|sont|est|sommes
Je * un livre.|lis|lit|lisent
Nous * du pain.|mangeons|mangez|mangent
Ils * prendre le train.|veulent|veut|voulons
Tu * venir avec moi.|peux|peut|pouvez
Il * partir maintenant.|doit|dois|devez
C’est * école moderne.|une|un|des
Paris est * capitale de la France.|la|le|les
Je bois * lait.|du|de la|des
Elle mange * confiture.|de la|du|des
Je ne bois pas * café.|de|du|le
Nous allons * cinéma.|au|à la|aux
Il parle * élèves.|aux|au|à la
C’est le livre * professeur.|du|de la|des
J’habite * France.|en|au|à
Il habite * Caire.|au|en|à la
Elle va * Alexandrie.|à|en|au
C’est mon frère, * s’appelle Ali.|il|elle|ils
Voici ma mère, * est médecin.|elle|il|elles
* amie Nadia est gentille.|Mon|Ma|Mes
Il aime * parents.|ses|son|sa
* fille est ma sœur.|Cette|Ce|Cet
* homme est ingénieur.|Cet|Ce|Cette
La maison est * .|blanche|blanc|blancs
C’est une * voiture.|nouvelle|nouveau|nouvel
Elle est très * .|heureuse|heureux|heureuses
* âge as-tu ?|Quel|Quelle|Quels
* heure est-il ?|Quelle|Quel|Quels
* habites-tu ? À Louxor.|Où|Quand|Combien
* coûte ce stylo ?|Combien|Comment|Où
* vas-tu ? Très bien.|Comment|Combien|Qui
Je * aime pas le froid.|n’|ne|non
Hier, j’ * visité le musée.|ai|suis|as
Hier, elle * allée au parc.|est|a|es
Nous avons * le repas.|fini|finir|finis
Il a * un gâteau.|fait|faire|faisons
Demain, je * voyager.|vais|vas|va
L’année prochaine, il * à Paris.|ira|allait|est allé
Quand j’étais petit, je * au ballon.|jouais|jouerai|joue demain
* attention !|Fais|Fait|Faisez
Je me * à sept heures.|lève|lèves|lèvent
Paul est plus grand * Marc.|que|de|à
Tu vas à l’école ? Oui, j’ * vais.|y|en|le
Des pommes ? J’ * prends deux.|en|y|les
Le garçon * parle est mon ami.|qui|que|où
Le film * je regarde est beau.|que|qui|où
`],
['Phonétique', '🗣️', '#7b2cbf', `
Dans « beau », « eau » se prononce comme la lettre * .|o|u|a
Dans « lait », « ai » se prononce comme la lettre * .|è|a|i
Dans « moi », « oi » se prononce * .|wa|oï|o
Dans « jour », « ou » se prononce avec le son * .|ou|o|u
Dans « photo », « ph » se prononce comme la lettre * .|f|p|v
Dans « chat », « ch » se prononce comme en anglais * .|sh|k|tch
Dans « garçon », « ç » se prononce comme la lettre * .|s|k|g
Dans « café », « c » se prononce comme la lettre * .|k|s|ch
Dans « cinéma », le premier « c » se prononce comme la lettre * .|s|k|g
Dans « gare », « g » se prononce comme dans le mot * .|gomme|girafe|genou
Dans « girafe », « g » se prononce comme la lettre * .|j|k|f
La lettre « h » dans « hôtel » est * .|muette|prononcée|nasale
Dans « petit », la consonne finale « t » est * .|muette|prononcée|doublée
Dans « sac », la consonne finale « c » est * .|prononcée|muette|nasale
Dans « rose », « s » entre deux voyelles se prononce * .|z|s|ch
Dans « poisson », « ss » se prononce * .|s|z|ch
Dans « maison », « ai » se prononce comme la lettre * .|è|a|i
Le son nasal de « pain » est le même que dans * .|main|pont|banc
Le son nasal de « bon » est le même que dans * .|nom|vin|dent
Le son nasal de « blanc » est le même que dans * .|enfant|maison|matin
Le mot « tu » contient le même son que * .|rue|roue|rôti
Le mot « nous » rime avec * .|vous|nu|nos
Le mot « deux » rime avec * .|bleu|dos|du
Le mot « père » rime avec * .|mère|peur|pour
Dans « les amis », la liaison se prononce avec le son * .|z|t|s dur
Dans « un petit ami », la liaison se prononce avec le son * .|t|z|d
Dans « fille », « ill » se prononce avec le son * .|y|l|j
Dans « ville », « ill » se prononce avec le son * .|l|y|g
Dans « montagne », « gn » se prononce comme dans * .|ligne|langue|gomme
Dans « nez », la terminaison « ez » se prononce comme * .|é|ez|e muet
L’accent de la lettre « é » s’appelle l’accent * .|aigu|grave|circonflexe
L’accent de la lettre « è » s’appelle l’accent * .|grave|aigu|circonflexe
L’accent de la lettre « ê » s’appelle l’accent * .|circonflexe|grave|aigu
Le signe sous la lettre « ç » s’appelle la * .|cédille|virgule|liaison
Dans « Noël », le signe sur le « e » s’appelle le * .|tréma|tiret|point
`],
['La nourriture', '🥖', '#d97706', `
Le matin, les Français mangent souvent un * au beurre.|croissant|couscous|riz
On achète le pain à la * .|boulangerie|pharmacie|librairie
La * est un pain long très célèbre en France.|baguette|brioche|crêpe
Le camembert est un * .|fromage|fruit|légume
La pomme est un * .|fruit|poisson|légume
La carotte est un * .|légume|fruit|fromage
La ratatouille est un plat de * .|légumes|poissons|fruits secs
À la Chandeleur, on mange des * .|crêpes|huîtres|pizzas
`],
['Les boissons', '☕', '#92400e', `
Le matin, on boit souvent un café au * .|lait|sel|poivre
Quand on a soif, on boit de l’ * .|eau|huile|assiette
Le jus d’orange est fait avec des * .|oranges|tomates|poires
On boit le café dans une * .|tasse|fourchette|assiette
On sert l’eau dans un * .|verre|couteau|plat
Le thé est une boisson souvent * .|chaude|solide|salée
La limonade est une boisson * .|fraîche|brûlante|salée
Au café, on commande au * .|serveur|facteur|pilote
`],
['La maison', '🏠', '#0f766e', `
On prépare les repas dans la * .|cuisine|chambre|salle de bains
On dort dans la * .|chambre|cuisine|cave
On prend une douche dans la * .|salle de bains|salle à manger|cuisine
On reçoit les invités dans le * .|salon|garage|grenier
On gare la voiture dans le * .|garage|balcon|couloir
On conserve les aliments au * .|réfrigérateur|lit|miroir
Pour entrer dans la maison, on ouvre la * .|porte|chaise|lampe
Les livres sont rangés dans la * .|bibliothèque|baignoire|poêle
`],
['Le jardin et les parcs', '🌳', '#15803d', `
Dans le jardin, on plante des * .|fleurs|chaises électriques|avions
Le jardinier * les plantes.|arrose|repasse|conduit
La rose est une * .|fleur|ville|boisson
Au parc, on s’assoit sur un * .|banc|toit|four
Le jardin du Luxembourg se trouve à * .|Paris|Marseille|Lyon
Disneyland Paris est un parc d’ * .|attractions|animaux sauvages|usines
Le parc national des Calanques est près de * .|Marseille|Lille|Strasbourg
Les enfants font de la balançoire au * .|parc|bureau|supermarché
`],
['La femme et l’homme', '👫', '#be185d', `
La mère de mon père est ma * .|grand-mère|tante|cousine
Le frère de ma mère est mon * .|oncle|neveu|grand-père
La fille de mes parents est ma * .|sœur|tante|mère
Le féminin de « acteur » est * .|actrice|acteuse|acteure d’homme
Le féminin de « boulanger » est * .|boulangère|boulangeuse|boulangine
Le féminin de « vendeur » est * .|vendeuse|vendrice|vendère
Pour saluer un homme, on dit : bonjour * .|Monsieur|Madame|Mademoiselle
En France, les femmes et les hommes ont le droit de * .|vote|voler les autres|ignorer la loi
`],
['La nature et les planètes', '🪐', '#1e3a8a', `
Le lion est un animal * .|sauvage|domestique|marin
Le chat est un animal * .|domestique|marin|disparu
L’hirondelle est un * .|oiseau|poisson|insecte
Le symbole animal de la France est le * .|coq|chameau|panda
La Terre tourne autour du * .|Soleil|Mars|Lune
La * est le satellite naturel de la Terre.|Lune|Vénus|comète
La planète la plus proche du Soleil est * .|Mercure|Jupiter|Neptune
La plus grande planète du système solaire est * .|Jupiter|Mars|Vénus
`],
['Animaux et oiseaux', '🦜', '#4d7c0f', `
La vache nous donne du * .|lait|miel|vin
L’abeille produit le * .|miel|lait|sel
Le mouton nous donne la * .|laine|soie|pierre
Le poisson vit dans l’ * .|eau|sable|feu
Le chien * .|aboie|miaule|chante
Le chat * .|miaule|aboie|rugit
L’aigle est un * .|oiseau|reptile|poisson
La baleine vit dans la * .|mer|forêt|montagne
`],
['Villes, fleuves et lacs', '🗼', '#b91c1c', `
La capitale de la France est * .|Paris|Lyon|Nice
La * traverse Paris.|Seine|Loire|Garonne
Le plus long fleuve de France est la * .|Loire|Seine|Marne
Lyon est traversée par la Saône et le * .|Rhône|Nil|Rhin
Bordeaux est située sur la * .|Garonne|Seine|Loire
Strasbourg est près du * .|Rhin|Rhône|Tarn
Le plus grand lac naturel entièrement en France est le lac du * .|Bourget|Léman|Nasser
Marseille est un grand port sur la mer * .|Méditerranée|Rouge|Baltique
`],
['Fêtes et occasions', '🎉', '#c2410c', `
La fête nationale française est le * juillet.|14|1er|25
Noël se fête le 25 * .|décembre|janvier|mars
Le Jour de l’an est le 1er * .|janvier|mai|septembre
La fête du Travail est le 1er * .|mai|avril|juin
La fête de la Musique est le 21 * .|juin|juillet|août
À Pâques, les enfants cherchent des * en chocolat.|œufs|bateaux|livres
La Saint-Valentin est la fête des * .|amoureux|pompiers|marins
Pour un anniversaire, on dit : joyeux * !|anniversaire|appétit|voyage
`],
['À l’aéroport', '✈️', '#0369a1', `
Le plus grand aéroport de Paris est * .|Charles-de-Gaulle|Heathrow|Fiumicino
Pour voyager à l’étranger, il faut un * .|passeport|cahier|menu
Avant de monter dans l’avion, on montre la carte d’ * .|embarquement|anniversaire|étudiant en cuisine
L’avion est conduit par le * .|pilote|boulanger|jardinier
On enregistre les * au comptoir.|bagages|nuages|arbres
L’avion décolle de la * .|piste|cuisine|rivière
À l’arrivée, on passe à la * .|douane|boulangerie|piscine
Dans l’avion, il faut attacher sa * .|ceinture|cravate|montre
`],
['L’hôpital et les maladies', '🏥', '#dc2626', `
Quand on est malade, on va chez le * .|médecin|facteur|boulanger
On achète les médicaments à la * .|pharmacie|boulangerie|librairie
Le médecin écrit une * .|ordonnance|recette de gâteau|carte postale
Quand on a de la fièvre, la température du corps * .|monte|baisse|disparaît
Si on a mal aux dents, on va chez le * .|dentiste|coiffeur|pilote
En cas d’urgence, une * transporte le malade.|ambulance|bicyclette|péniche
La grippe est une * .|maladie|boisson|profession
L’ * aide le médecin et soigne les malades.|infirmière|architecte|hôtesse
`],
['L’école', '🏫', '#4338ca', `
Les élèves étudient en * .|classe|cuisine|gare
Le professeur écrit sur le * .|tableau|lit|trottoir
On met les livres dans le * .|cartable|réfrigérateur|four
On écrit avec un * .|stylo|couteau|peigne
On emprunte des livres à la * .|bibliothèque|boulangerie|piscine
Pendant la * , les élèves jouent dans la cour.|récréation|dictée|leçon
En France, l’examen à la fin du lycée est le * .|baccalauréat|passeport|permis de conduire
Le * dirige un lycée.|proviseur|pharmacien|serveur
`],
['Le commissariat de police', '👮', '#1e40af', `
Les policiers travaillent au * .|commissariat|restaurant|cinéma
En cas de vol, on porte * .|plainte|un gâteau|des lunettes de ski
En France, le numéro d’urgence de la police est le * .|17|15|18
L’ * de police dirige l’enquête.|inspecteur|infirmier|jardinier
La police arrête le * .|voleur|témoin|passant
La personne qui a vu l’accident est un * .|témoin|voleur|médecin légiste absent
Au feu rouge, il faut * .|s’arrêter|accélérer|klaxonner et passer
Pour conduire, il faut un * de conduire.|permis|menu|billet
`]
];

var TYPES = { c: 'اختر من بين القوسين', t: 'صح وخطأ', f: 'أكمل الناقص' };
var Q = [];
CATS.forEach(function (cat, ci) {
  cat[3].trim().split('\n').forEach(function (line, li) {
    var p = line.split('|');
    ['c', 't', 'f'].forEach(function (type) {
      Q.push({ id: ci + '-' + li + type, cat: ci, type: type, s: p[0], a: p[1], w: [p[2], p[3]], n: li });
    });
  });
});

var KEY = 'q500_progress', done = {};
try { done = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function fill(s, w) { return s.replace('*', w).replace(/ ([.,])/, '$1').replace(/([’']) /, '$1'); }
// زر النطق يستخدم نظام النطق الفرنسي الموجود في app.js
function spk(t) { return '<button type="button" class="spk" data-say="' + encodeURIComponent(t) + '" aria-label="استمع بالفرنسية">🔊</button>'; }

var css = '#quiz500 .q5-hero{background:linear-gradient(90deg,#0055A5 0 33%,#fff 33% 66%,#ef4135 66%);padding:4px;border-radius:18px;margin-bottom:14px}' +
'.q5-hero>div{background:#0a2a52;color:#fff;border-radius:15px;padding:18px;text-align:center}.q5-hero strong{font-size:2rem;display:block}' +
'.q5-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}' +
'.q5-cat{border:0;border-bottom:6px solid var(--c);background:#fff;color:#172033;border-radius:16px 16px 8px 8px;padding:14px 8px;cursor:pointer;font:700 .95rem inherit;box-shadow:0 2px 10px #0002}' +
'.q5-cat i{display:block;font-style:normal;font-size:2rem}.q5-cat small{display:block;color:var(--c);margin-top:4px}' +
'.q5-bar{height:6px;background:#8883;border-radius:9px;margin-top:8px;overflow:hidden}.q5-bar b{display:block;height:100%;background:var(--c)}' +
'.q5-card{background:#fff;color:#172033;border-top:8px solid var(--c);border-radius:18px;padding:18px;box-shadow:0 3px 14px #0002}' +
'.q5-s{direction:ltr;text-align:left;font-size:1.2rem;font-weight:700;line-height:1.8;margin:14px 0}' +
'.q5-ops{display:flex;flex-wrap:wrap;gap:8px;direction:ltr}.q5-b{border:2px solid #0055A5;background:#fff;color:#0055A5;border-radius:12px;padding:9px 16px;font:700 1rem inherit;cursor:pointer}' +
'.q5-b.ok{background:#15803d;border-color:#15803d;color:#fff}.q5-b.no{background:#b91c1c;border-color:#b91c1c;color:#fff}' +
'.q5-in{flex:1;min-width:150px;padding:10px;border:2px solid #cbd5e1;border-radius:12px;font-size:1.05rem}.q5-fb{margin:14px 0;font-weight:700;line-height:1.9}';

var sec, view = { cat: -1, type: 'all', i: 0, score: 0, tried: 0 };

function home() {
  view.cat = -1;
  var total = Object.keys(done).length;
  sec.querySelector('.q5-root').innerHTML =
    '<div class="q5-hero"><div><strong>' + Q.length + ' سؤال وإجابة</strong>أجبت صحيحاً عن ' + total + '</div></div><div class="q5-grid">' +
    CATS.map(function (c, ci) {
      var list = Q.filter(function (q) { return q.cat === ci; });
      var ok = list.filter(function (q) { return done[q.id]; }).length;
      return '<button type="button" class="q5-cat" data-c="' + ci + '" style="--c:' + c[2] + '"><i>' + c[1] + '</i><span dir="ltr">' + c[0] + '</span><small>' + ok + ' / ' + list.length + '</small><div class="q5-bar"><b style="width:' + (ok / list.length * 100) + '%"></b></div></button>';
    }).join('') + '</div>';
}

function pool() {
  return Q.filter(function (q) { return q.cat === view.cat && (view.type === 'all' || q.type === view.type); });
}

function show() {
  var list = pool(), q = list[view.i], c = CATS[view.cat], body = '', text, truth;
  var head = '<p><button type="button" class="q5-b" data-act="home">كل الأقسام</button></p><div class="tabs">' +
    ['all', 'c', 't', 'f'].map(function (t) { return '<button type="button" class="tab' + (view.type === t ? ' on' : '') + '" data-t="' + t + '">' + (TYPES[t] || 'الكل') + '</button>'; }).join('') + '</div>';
  if (!q) {
    sec.querySelector('.q5-root').innerHTML = head + '<div class="q5-card" style="--c:' + c[2] + '"><h3>🏆 انتهت الأسئلة</h3><p>نتيجتك: ' + view.score + ' من ' + view.tried + '</p><button type="button" class="q5-b" data-act="again">أعد المحاولة</button></div>';
    return;
  }
  if (q.type === 'c') {
    var ops = q.w.slice();
    ops.splice(q.n % 3, 0, q.a);
    text = q.s.replace('*', '( ' + ops.join(' – ') + ' )');
    body = ops.map(function (o) { return '<button type="button" class="q5-b" data-v="' + esc(o) + '">' + esc(o) + '</button>'; }).join('');
  } else if (q.type === 't') {
    truth = q.n % 2 === 0;
    text = fill(q.s, truth ? q.a : q.w[0]);
    body = '<button type="button" class="q5-b" data-v="V" data-r="' + (truth ? 'V' : 'F') + '">Vrai ✓</button><button type="button" class="q5-b" data-v="F" data-r="' + (truth ? 'V' : 'F') + '">Faux ✗</button>';
  } else {
    text = q.s.replace('*', '______');
    body = '<input class="q5-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(q.a.charAt(0)) + '..."><button type="button" class="q5-b" data-act="check">تحقق</button><div>' +
      'é è ê à ç ù î ô œ ’'.split(' ').map(function (k) { return '<button type="button" class="q5-b" data-k="' + k + '">' + k + '</button>'; }).join(' ') + '</div>';
  }
  var say = q.type === 'c' ? q.s.replace('*', '...') + ' ' + [q.a].concat(q.w).sort().join(', ') : text;
  sec.querySelector('.q5-root').innerHTML = head + '<div class="q5-card" style="--c:' + c[2] + '"><div>' + c[1] + ' ' + (view.i + 1) + ' / ' + list.length + ' — ' + TYPES[q.type] + '</div>' +
    '<div class="q5-s">' + esc(text) + ' ' + spk(say) + '</div><div class="q5-ops">' + body + '</div><div class="q5-fb" aria-live="polite"></div></div>';
}

function norm(s) { return String(s).toLowerCase().replace(/['‘]/g, '’').replace(/\s+/g, ' ').trim(); }

function finish(ok) {
  var q = pool()[view.i];
  view.tried++;
  if (ok) { view.score++; done[q.id] = 1; } else delete done[q.id];
  save();
  Array.prototype.forEach.call(sec.querySelectorAll('.q5-ops button, .q5-in'), function (el) { el.disabled = true; });
  var full = fill(q.s, q.a);
  sec.querySelector('.q5-fb').innerHTML = (ok ? '✅ أحسنت!' : '❌ حاول أن تتذكر الإجابة:') +
    '<div dir="ltr">' + esc(full) + ' ' + spk(full) + '</div><button type="button" class="q5-b" data-act="next">السؤال التالي</button>';
}

function onClick(e) {
  var b = e.target.closest('button');
  if (!b || b.classList.contains('spk')) return;
  var d = b.dataset, input = sec.querySelector('.q5-in');
  if (d.c !== undefined) { view = { cat: +d.c, type: 'all', i: 0, score: 0, tried: 0 }; show(); }
  else if (d.t) { view.type = d.t; view.i = view.score = view.tried = 0; show(); }
  else if (d.act === 'home') home();
  else if (d.act === 'next') { view.i++; show(); }
  else if (d.act === 'again') { view.i = view.score = view.tried = 0; show(); }
  else if (d.k) { input.value += d.k; input.focus(); }
  else if (d.act === 'check') {
    if (!input.value.trim()) return;
    finish(norm(input.value) === norm(pool()[view.i].a));
  } else if (d.v !== undefined) {
    var right = d.r || pool()[view.i].a;
    b.classList.add(d.v === right ? 'ok' : 'no');
    finish(d.v === right);
  }
}

function init() {
  var nav = document.querySelector('.sidebar'), main = document.querySelector('main.content');
  if (!nav || !main || document.getElementById('quiz500')) return;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-nav', 'quiz500');
  btn.textContent = '❓ 500 سؤال وإجابة';
  nav.insertBefore(btn, nav.querySelector('[data-nav="progress"]'));
  sec = document.createElement('section');
  sec.id = 'quiz500';
  sec.className = 'sec';
  sec.innerHTML = '<h2>❓ 500 سؤال وإجابة</h2><div class="q5-root"></div>';
  main.appendChild(sec);
  sec.addEventListener('click', onClick);
  sec.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('q5-in')) sec.querySelector('[data-act="check"]').click();
  });
  home();
  // إضافة القفل بنفس نظام باقي الأقسام
  if (typeof protectedSections !== 'undefined' && typeof ensureLocks === 'function') {
    protectedSections.push('quiz500');
    ensureLocks();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
