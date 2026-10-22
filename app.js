document.addEventListener("DOMContentLoaded", () => {
    console.log("App initialized");
    loadCurriculum();
});

async function loadCurriculum() {
    const contentDiv = document.getElementById("app") || document.body;
    try {
        const response = await fetch("data/curriculum.json");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
            renderApp(data);
        } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            renderApp([data]);
        } else {
            contentDiv.innerHTML = "<h2 style='text-align:center; padding:50px; color:#2c3e50;'>جاري تحميل المنهج... الرجاء إضافة الدروس.</h2>";
        }
    } catch (error) {
        console.error("Error loading curriculum:", error);
        contentDiv.innerHTML = "<h2 style='text-align:center; padding:50px; color:#e74c3c;'>حدث خطأ في تحميل ملف البيانات. تأكد من صحة الملف.</h2>";
    }
}

function renderApp(data) {
    const app = document.getElementById("app") || document.body;
    let html = `<header style="background:#1e3c72; color:white; padding:20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="margin:0;">Le Français Au Bac 🇫🇷</h1>
                    <p style="margin:5px 0 0 0; opacity:0.9;">منهج اللغة الفرنسية للثانوية العامة</p>
                </header>
                <main style="padding:20px; max-width:900px; margin:auto; font-family:system-ui, -apple-system, sans-serif;">`;
    
    data.forEach((item, index) => {
        const title = item.unit || item.title || item.unitTitle || `الوحدة ${index + 1}`;
        const grade = item.grade ? `<span style="background:#e74c3c; color:white; padding:3px 8px; border-radius:12px; font-size:12px; margin-left:10px;">${item.grade}</span>` : '';
        
        html += `<div style="background:white; border-radius:12px; padding:20px; margin-bottom:20px; border:1px solid #e1e8ed; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color:#2c3e50; border-bottom:2px solid #3498db; padding-bottom:10px; margin-top:0;">${title} ${grade}</h2>`;
        
        // عرض الدروس والنصوص
        if (item.lessons && Array.isArray(item.lessons)) {
            item.lessons.forEach(lesson => {
                html += `<div style="margin-top:15px; background:#f8f9fa; padding:15px; border-radius:8px;">
                            <h3 style="color:#2980b9; margin-top:0;">${lesson.title || lesson.lessonTitle || 'درس'}</h3>`;
                if (lesson.content) html += `<p style="line-height:1.6;">${lesson.content}</p>`;
                
                // الكلمات والمفردات
                if (lesson.vocabulary && Array.isArray(lesson.vocabulary)) {
                    html += `<h4 style="color:#27ae60;">المفردات والكلمات:</h4><ul style="list-style:none; padding-right:0;">`;
                    lesson.vocabulary.forEach(v => {
                        const fr = v.fr || v.french || v.word || '';
                        const ar = v.ar || v.arabic || v.meaning || '';
                        html += `<li style="padding:5px 0; border-bottom:1px dashed #eee;"><strong>${fr}</strong> : ${ar}</li>`;
                    });
                    html += `</ul>`;
                }
                html += `</div>`;
            });
        } else if (item.vocabulary && Array.isArray(item.vocabulary)) {
            html += `<h3 style="color:#27ae60;">المفردات الأساسية:</h3><ul style="list-style:none; padding-right:0;">`;
            item.vocabulary.forEach(v => {
                const fr = v.fr || v.french || v.word || '';
                const ar = v.ar || v.arabic || v.meaning || '';
                html += `<li style="padding:5px 0; border-bottom:1px dashed #eee;"><strong>${fr}</strong> : ${ar}</li>`;
            });
            html += `</ul>`;
        }
        
        html += `</div>`;
    });
    
    html += `</main>`;
    app.innerHTML = html;
}
