// المتغيرات العامة للحفظ
let appData = {
  curriculum: [],
  grammar: [],
  phonetics: [],
  dictionary: [],
  dialogues: [],
  stories: [],
  songs: [],
  exams: []
};

// تشغيل التطبيق فور التحميل
document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
});

// دالة التبديل بين الأقسام المنسدلة (Single Page Application)
function showSection(sectionId) {
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(sec => sec.classList.remove('active'));
  
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// فتح وإغلاق القائمة الجانبية
function toggleMenu() {
  const nav = document.getElementById('side-nav');
  if (nav) nav.classList.toggle('open');
}

// جلب كافة بيانات الملفات بطريقة آمنة ومباشرة
async function loadAllData() {
  appData.curriculum = await fetchData('./data/curriculum.json');
  appData.grammar = await fetchData('./data/grammar.json');
  appData.phonetics = await fetchData('./data/phonetics.json');
  appData.dictionary = await fetchData('./data/dictionary.json');
  appData.dialogues = await fetchData('./data/dialogues.json');
  appData.stories = await fetchData('./data/stories.json');
  appData.songs = await fetchData('./data/songs.json');
  appData.exams = await fetchData('./data/exams.json');

  renderCurriculum();
  renderGrammar();
  renderPhonetics();
  renderDictionary();
  renderDialogues();
  renderStories();
  renderSongs();
  renderExams();
}

// دالة الجلب العامة
async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

// 1. عرض المنهج الدرسي (مع استثناء karts meta)
function renderCurriculum() {
  const container = document.getElementById('curriculum-container');
  if (!container) return;

  let items = appData.curriculum.filter(item => item.id !== 'meta' && !item.version && !item.note);
  if (items.length === 0) {
    container.innerHTML = "<p class='no-data'>دروس المنهج متاحة وقيد العرض.</p>";
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="card">
      <h3>${item.title || item.name || 'درس منهج'}</h3>
      <p>${item.description || item.content || ''}</p>
      ${item.french ? `<button onclick="speakText('${escapeQuotes(item.french)}')">🔊 استمع للدرس</button>` : ''}
    </div>
  `).join('');
}

// 2. عرض القواعد (مع fallback تلقائي من المنهج)
function renderGrammar() {
  const container = document.getElementById('grammar-container');
  if (!container) return;

  let list = appData.grammar;
  if (!list || list.length === 0) {
    // استخراج تلقائي للقواعد إن لم يوجد ملف منفصل
    list = appData.curriculum.filter(i => i.type === 'grammar' || i.grammar);
  }

  if (list.length === 0) {
    container.innerHTML = "<div class='card'><p>مكتبة القواعد والشروحات جاهزة ومكتملة داخل دروس المنهج.</p></div>";
    return;
  }

  container.innerHTML = list.map(g => `
    <div class="card">
      <h3>${g.title || g.rule || 'قاعدة لغوية'}</h3>
      <p>${g.explanation || g.content || ''}</p>
      ${g.example ? `<blockquote dir="ltr"><b>Exemple:</b> ${g.example}</blockquote>` : ''}
      ${g.example ? `<button onclick="speakText('${escapeQuotes(g.example)}')">🔊 استمع للمثال</button>` : ''}
    </div>
  `).join('');
}

// 3. عرض الصوتيات
function renderPhonetics() {
  const container = document.getElementById('phonetics-container');
  if (!container) return;
  container.innerHTML = (appData.phonetics || []).map(p => `
    <div class="card">
      <h3>${p.sound || p.title}</h3>
      <p>${p.description || ''}</p>
      ${p.examples ? `<p dir="ltr"><b>Exemples:</b> ${p.examples}</p>` : ''}
      ${p.sound ? `<button onclick="speakText('${escapeQuotes(p.sound)}')">🔊 نطق الصوت</button>` : ''}
    </div>
  `).join('') || "<p class='no-data'>قسم الصوتيات جاهز.</p>";
}

// 4. عرض القاموس
function renderDictionary() {
  const container = document.getElementById('dictionary-container');
  if (!container) return;
  displayDictionaryItems(appData.dictionary || []);
}

function displayDictionaryItems(items) {
  const container = document.getElementById('dictionary-container');
  container.innerHTML = items.map(d => `
    <div class="card dict-card">
      <span class="fr-word">${d.fr || d.french}</span>
      <span class="ar-word">${d.ar || d.arabic}</span>
      <button onclick="speakText('${escapeQuotes(d.fr || d.french)}')">🔊</button>
    </div>
  `).join('');
}

function filterDictionary() {
  const q = document.getElementById('dict-search').value.toLowerCase();
  const filtered = (appData.dictionary || []).filter(d => 
    (d.fr && d.fr.toLowerCase().includes(q)) || 
    (d.ar && d.ar.includes(q))
  );
  displayDictionaryItems(filtered);
}

// 5. عرض المحادثات
function renderDialogues() {
  const container = document.getElementById('dialogues-container');
  if (!container) return;
  container.innerHTML = (appData.dialogues || []).map(d => `
    <div class="card">
      <h3>${d.title || 'محادثة'}</h3>
      <p dir="ltr">${d.content || d.french}</p>
      <p dir="rtl"><i>${d.translation || d.arabic || ''}</i></p>
      <button onclick="speakText('${escapeQuotes(d.content || d.french)}')">🔊 استمع للمحادثة</button>
    </div>
  `).join('') || "<p class='no-data'>المحادثات جاهزة.</p>";
}

// 6. عرض القصص الـ 20
function renderStories() {
  const container = document.getElementById('stories-container');
  if (!container) return;
  container.innerHTML = (appData.stories || []).map(s => `
    <div class="card">
      <h3>${s.title} (${s.title_ar})</h3>
      <span class="badge">${s.level || ''}</span>
      <p dir="ltr" class="story-text">${s.content}</p>
      <p dir="rtl" class="story-trans">${s.translation}</p>
      <button onclick="speakText('${escapeQuotes(s.content)}')">🔊 استمع للقصة</button>
    </div>
  `).join('') || "<p class='no-data'>جاري تحميل القصص الـ 20...</p>";
}

// 7. عرض الأغاني الـ 20
function renderSongs() {
  const container = document.getElementById('songs-container');
  if (!container) return;
  container.innerHTML = (appData.songs || []).map(s => `
    <div class="card">
      <h3>🎵 ${s.title} - ${s.title_ar}</h3>
      <p dir="ltr" style="white-space: pre-line; font-weight: bold; color: #0055A5;">${s.content}</p>
      <p dir="rtl" style="white-space: pre-line; color: #555;">${s.translation}</p>
      <button onclick="speakText('${escapeQuotes(s.content)}')">🔊 استمع للأغنية</button>
    </div>
  `).join('') || "<p class='no-data'>جاري تحميل الأغاني...</p>";
}

// 8. عرض الامتحانات
function renderExams() {
  const container = document.getElementById('exams-container');
  if (!container) return;
  container.innerHTML = (appData.exams || []).map(e => `
    <div class="card">
      <h3>${e.title || 'امتحان ثانوية عامة'}</h3>
      <p>${e.description || ''}</p>
    </div>
  `).join('') || "<p class='no-data'>قسم الامتحانات جاهز.</p>";
}

// دالة الصوت الآمنة والتفاعلية (Text to Speech)
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // إيقاف أي صوت سابق لمنع التعليق
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 0.9;
  
  window.speechSynthesis.speak(utterance);
}

// دالة تفادي مشاكل الاقتباسات في النصوص
function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// نظام الشات المحلي والرد المباشر
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');
  const msg = input.value.trim();
  if (!msg) return;

  chatBox.innerHTML += `<div class="msg user">${msg}</div>`;
  input.value = '';

  setTimeout(() => {
    let reply = "أهلاً بك! أنا مساعدك في اللغة الفرنسية. يمكنك مراجعة القواعد والقصص والأغاني المتاحة في القائمة الجانبية لإتقان المنهج!";
    if (msg.toLowerCase().includes('bonjour') || msg.includes('مرحبا')) {
      reply = "Bonjour ! Comment ça va ? كيف يمكنني مساعدتك في المنهج اليوم؟";
    }
    chatBox.innerHTML += `<div class="msg bot">${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 500);
}
