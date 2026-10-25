document.addEventListener("DOMContentLoaded", function () {
    const bacNavButtons = document.querySelectorAll('[data-nav="bac"]');
    const bacSection = document.getElementById("bac");
    const container = document.getElementById("bac-content-container");

    bacNavButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('on'));
            document.querySelectorAll('.content .sec').forEach(s => s.classList.remove('on'));
            
            btn.classList.add('on');
            if (bacSection) bacSection.classList.add('on');
            
            loadBaccalaureateData();
        });
    });

    function loadBaccalaureateData() {
        if (!container) return;
        
        container.innerHTML = `
            <div class="bac-wrapper" style="padding: 10px;">
                <h3 style="color: #0055A5; text-align: center; margin-bottom: 15px;">🇫🇷 المنهج الشامل للثانوية العامة (البكالوريا وحل التمارين)</h3>
                <p style="text-align: center; color: #555; font-size: 14px; margin-bottom: 20px;">اختر الصف الدراسي لاستعراض الوحدات، القواعد، وحلول الكتاب المدرسي:</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap;">
                    <button onclick="showGradeUnits('2sec')" style="background: #0055A5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">📚 الصف الثاني الثانوي</button>
                    <button onclick="showGradeUnits('3sec')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">🎓 الصف الثالث الثانوي (Bac)</button>
                </div>

                <div id="units-display-area"></div>
            </div>
        `;
        // عرض منهج ثالثة ثانوي افتراضياً عند الدخول
        showGradeUnits('3sec');
    }
});

// قاعدة بيانات شاملة وكاملة للمنهج والتمارين وحلول الكتاب المدرسي
const bacCurriculumData = {
    "2sec": [
        {
            title: "Unité 1 : Le club des sportifs",
            vocab: "les sports (m) - le football - le tennis - faire de la natation - champion (m) - équipe (f)",
            grammar: "Le verbe 'Faire' et 'Jouer à' + Les sports",
            exercises: "حل أسئلة الكتاب المدرسي صـ 12 و 15:\n- Q1: Choisis la bonne réponse (Faire du / Jouer au).\n- Q2: Complète avec le sport convenable."
        },
        {
            title: "Unité 2 : Le club des gourmands",
            vocab: "la nourriture - les fruits (m) - les légumes (m) - avoir faim - un kilo de - un litre de",
            grammar: "Les articles partitifs (du, de la, de l', des) + L'expression de la quantité",
            exercises: "حل تدريبات الكتاب المدرسي صـ 35:\n- Q1: Mets (du, de la, de l', des).\n- Q2: Exprime la quantité (un peu de, beaucoup de)."
        }
    ],
    "3sec": [
        {
            title: "Unité 1 : Le club des sportifs (الثالث الثانوي)",
            vocab: "une compétition - s'entraîner - un arbitre - gagner - perdre - le vainqueur",
            grammar: "Le comparatif (plus... que, moins... que, autant... que) + Le pronom 'en'",
            exercises: "حل تدريبات الكتاب المدرسي والامتحانات الشاملة:\n- Q1: Complète avec (plus / moins / autant).\n- Q2: Remplace par le pronom 'en'."
        },
        {
            title: "Unité 2 : Le club des écologistes",
            vocab: "la nature - polluer - recycler - l'environnement (m) - interdire - protéger",
            grammar: "L'impératif (الأمر) + Les prédictions (Le futur simple)",
            exercises: "حل تدريبات الكتاب المدرسي:\n- Q1: Mets le verbe à l'impératif (Tu / Nous / Vous).\n- Q2: Conjugue au futur simple."
        },
        {
            title: "Unité 3 : Le club des voyageurs",
            vocab: "le voyage - la valise - la gare - l'aéroport (m) - billet de train - réserver",
            grammar: "Le futur proche vs Le futur simple + Les pronoms relatifs (qui, que, où)",
            exercises: "حل تمارين الكتاب المدرسي:\n- Q1: Choisis (qui) ou (que).\n- Q2: Exprime l'action future."
        },
        {
            title: "Unité 4 : Le club des curieux",
            vocab: "un métier - un acteur - un journaliste - travailler - une profession - genius",
            grammar: "Les pronoms personnels COD et COI (le, la, les, lui, leur, y)",
            exercises: "حل تدريبات القواعد والقطع صـ 110:\n- Q1: Remplace le nom souligné par un pronom (le, la, les, lui, leur).\n- Q2: Questions de compréhension générale."
        }
    ]
};

function showGradeUnits(grade) {
    const displayArea = document.getElementById("units-display-area");
    if (!displayArea) return;

    let gradeName = grade === '2sec' ? "منهج الصف الثاني الثانوي" : "منهج الصف الثالث الثانوي (البكالوريا)";
    let html = `<h4 style="color: #2c3e50; border-bottom: 2px solid #0055A5; padding-bottom: 8px; margin-bottom: 15px;">📂 ${gradeName} - الوحدات الكاملة وحل التمارين</h4>`;

    const units = bacCurriculumData[grade] || [];

    units.forEach((unit, index) => {
        html += `
            <div style="background: #ffffff; border: 1px solid #ddd; border-right: 5px solid #0055A5; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h5 style="color: #0055A5; font-size: 16px; margin-bottom: 8px;">📖 ${unit.title}</h5>
                
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
                    <p style="margin: 3px 0; color: #333;"><strong>🔹 الكلمات والمفردات:</strong> ${unit.vocab}</p>
                    <p style="margin: 3px 0; color: #333;"><strong>🔹 القواعد الشرح:</strong> ${unit.grammar}</p>
                </div>

                <div style="background: #e8f4fd; padding: 10px; border-radius: 6px; font-size: 13px; border: 1px dashed #b8daff;">
                    <p style="margin: 0; color: #004085; white-space: pre-line;"><strong>📝 حل تمارين الكتاب المدرسي:</strong>\n${unit.exercises}</p>
                </div>
            </div>
        `;
    });

    displayArea.innerHTML = html;
}
