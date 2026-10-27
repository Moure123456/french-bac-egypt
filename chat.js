/**
 * شات الطلاب المباشر
 */
(function() {
    function loadChat() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AIzaSyAoFJex9rrYUgyyEUtw9TV9rhriFVyag8Y",
                authDomain: "frenchbacchat.firebaseapp.com",
                databaseURL: "https://frenchbacchat-default-rtdb.firebaseio.com",
                projectId: "frenchbacchat",
                storageBucket: "frenchbacchat.firebasestorage.app",
                messagingSenderId: "692488273461",
                appId: "1:692488273461:web:efa14361a054f3287d3b7c"
            });
        }

        const db = firebase.database();

        container.innerHTML = `
            <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ccc; font-family: Tahoma, sans-serif;">
                <h3 style="color: #0055A5; margin-top: 0; font-size: 15px;">💬 شات الطلاب المباشر</h3>
                <div id="simple-msg-list" style="height: 220px; overflow-y: auto; background: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 10px;">
                    <div style="color: #666; font-size: 13px;">جارٍ تحميل الرسائل...</div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <input type="text" id="simple-name" placeholder="اسمك..." style="width: 25%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    <input type="text" id="simple-text" placeholder="اكتب رسالتك..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    <button id="simple-send" style="background: #0055A5; color: white; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">إرسال</button>
                </div>
            </div>
        `;

        const textInput = document.getElementById("simple-text");
        const nameInput = document.getElementById("simple-name");
        const msgList = document.getElementById("simple-msg-list");

        document.getElementById("simple-send").onclick = function() {
            const txt = textInput.value.trim();
            const usr = nameInput.value.trim() || "طالب";
            if (!txt) return;

            db.ref("chat_messages").push({
                sender: usr,
                text: txt,
                timestamp: Date.now()
            });
            textInput.value = "";
        };

        textInput.onkeypress = function(e) {
            if (e.key === "Enter") document.getElementById("simple-send").click();
        };

        db.ref("chat_messages").limitToLast(30).on("value", snapshot => {
            msgList.innerHTML = "";
            const data = snapshot.val();
            if (!data) {
                msgList.innerHTML = '<div style="color: #888; font-size: 13px;">لا توجد رسائل بعد.</div>';
                return;
            }

            Object.keys(data).forEach(k => {
                const m = data[k];
                const div = document.createElement("div");
                div.style.cssText = "margin-bottom: 8px; padding: 6px 10px; background: #fff; border-radius: 4px; border: 1px solid #eee;";
                div.innerHTML = `<strong style="color: #0055A5; font-size: 12px;">${m.sender}:</strong> <span style="font-size: 13px; color: #333;">${m.text}</span>`;
                msgList.appendChild(div);
            });
            msgList.scrollTop = msgList.scrollHeight;
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(loadChat, 200);
    } else {
        window.addEventListener("DOMContentLoaded", loadChat);
    }
    
    // محاولة تشغيل إضافية عند الضغط على زر الشات في القائمة
    window.addEventListener("click", function(e) {
        if (e.target.closest('[data-nav="student-chat"]')) {
            setTimeout(loadChat, 150);
        }
    });
})();
