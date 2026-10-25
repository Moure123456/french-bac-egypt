Document.addEventListener("DOMContentLoaded", function () {
    const songsNavBtn = document.querySelector('[data-nav="soon-chansons"]');
    const songsContainer = document.getElementById("songs-content-container");

    if (songsNavBtn) {
        songsNavBtn.addEventListener("click", function () {
            loadSongsData();
        });
    }

    function loadSongsData() {
        if (!songsContainer) return;

        songsContainer.innerHTML = `<div class="empty">جارٍ تحميل الأغاني والمقاطع الصوتية... 🎵</div>`;

        fetch('data/songs.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("تعسّر تحميل ملف songs.json");
                }
                return response.json();
            })
            .then(songs => {
                if (!songs || songs.length === 0) {
                    songsContainer.innerHTML = `<div class="empty">لا توجد أغاني مضافة حالياً.</div>`;
                    return;
                }

                let html = `
                    <div class="songs-wrapper" style="padding: 10px;">
                        <p style="text-align: center; color: #555; margin-bottom: 20px; font-weight: bold;">
                            استمع إلى الأغاني والمقاطع الصوتية الفرنسية لتحسين مهارة الاستماع والنطق 🎧🇫🇷
                        </p>
                        <div class="songs-list" style="display: flex; flex-direction: column; gap: 15px;">
                `;

                songs.forEach((song) => {
                    html += `
                        <div class="song-card" style="background: #fff; border: 1px solid #e0e0e0; border-right: 5px solid #0055A5; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                            <h4 style="color: #0055A5; font-size: 16px; margin-bottom: 10px;">🎶 ${song.title}</h4>
                            <audio controls preload="none" style="width: 100%;">
                                <source src="${song.file}" type="audio/mpeg">
                                متصفحك لا يدعم تشغيل الملفات الصوتية.
                            </audio>
                        </div>
                    `;
                });

                html += `</div></div>`;
                songsContainer.innerHTML = html;
            })
            .catch(error => {
                console.error("خطأ في تحميل الأغاني:", error);
                songsContainer.innerHTML = `<p style="color: red; text-align: center;">عذراً، حدث خطأ أثناء تحميل الأغاني. تأكد من صحة مسارات الملفات.</p>`;
            });
    }
});
