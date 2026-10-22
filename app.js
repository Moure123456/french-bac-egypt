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
        
        if (data && data.length > 0) {
            renderApp(data);
        } else {
            contentDiv.innerHTML = "<h2 style='text-align:center; padding:50px; color:#2c3e50;'>جاري تحميل المنهج... الرجاء إضافة الدروس.</h2>";
        }
    } catch (error) {
        console.error("Error loading curriculum:", error);
        contentDiv.innerHTML = `
            <div style="text-align:center; padding:40px; font-family:sans-serif;">
                <h1 style="color:#e74c3c;">Le Français Au Bac 🇫🇷</h1>
                <p style="font-size:18px;">مرحباً بك في التطبيق التعليمي!</p>
                <div style="background:#f8f9fa; border:1px solid #ddd; padding:20px; border-radius:10px; display:inline-block; text-align:right;">
                    <h3>الوحدة الأولى:</h3>
                    <p><strong>Unité 1: Le club de ma classe</strong></p>
                    <ul>
                        <li>Un élève : تلميذ</li>
                        <li>Un copain : صديق</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

function renderApp(data) {
    const app = document.getElementById("app") || document.body;
    let html = `<header style="background:#2c3e50; color:white; padding:15px; text-align:center;">
                    <h1>Le Français Au Bac 🇫🇷</h1>
                </header>
                <main style="padding:20px; max-width:800px; margin:auto; font-family:sans-serif;">`;
    
    data.forEach(item => {
        html += `<div style="background:white; border-radius:8px; padding:15px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color:#2980b9;">${item.unit || item.title}</h2>`;
        if (item.lessons) {
            item.lessons.forEach(lesson => {
                html += `<h3>${lesson.title}</h3><p>${lesson.content || ''}</p>`;
                if (lesson.vocabulary) {
                    html += `<ul>`;
                    lesson.vocabulary.forEach(v => {
                        html += `<li><strong>${v.fr}</strong> : ${v.ar}</li>`;
                    });
                    html += `</ul>`;
                }
            });
        }
        html += `</div>`;
    });
    
    html += `</main>`;
    app.innerHTML = html;
}

