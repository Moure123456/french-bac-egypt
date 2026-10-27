/**
 * نظام محادثة الطلاب المبسط والمستقر
 */
document.addEventListener("DOMContentLoaded", function () {
    initSimpleChat();
    
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.getAttribute('data-nav') === 'student-chat') {
                setTimeout(initSimpleChat, 150);
            }
        });
    });
});

function initSimpleChat() {
    const chatContainer = document.getElementById("chat-messages-container");
    if (!chatContainer) return;
    
    if (document.getElementById("student-chat-box")) return;

    // تهيئة Firebase محلياً داخل الدالة لضمان عدم حدوث تضارب
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
    const storage = firebase.storage();

    chatContainer.innerHTML = `
        <div id="student-chat-box" style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px; width: 100%; font-family: Tahoma, sans-serif;">
            <div style="background: #eef2f7; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #0055A5;">
                💬 شات الطلاب التفاعلي
            </div>

            <div id="messages-list" style="height: 280px; overflow-y: auto; background: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 8px;">
                <div style="text-align: center; color: #888; font-size: 13px;">جاري تحميل المحادثات...</div>
            </div>

            <div style="display: flex; gap: 6px; align-items: center; background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
                <input type="text" id="student-name-input" placeholder="اسمك..." style="width: 25%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
                <input type="text" id="student-msg-input" placeholder="اكتب رسالة..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
                <button id="send-text-btn" style="background: #0055A5; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">إرسال</button>
            </div>
        </div>
    `;

    const msgInput = document.getElementById("student-msg-input");
    const nameInput = document.getElementById("student-name-input");
    const messagesList = document.getElementById("messages-list");

    document.getElementById("send-text-btn").onclick = function() {
        const text = msgInput.value.trim();
        const sender = nameInput.value.trim() || "طالب";
        if (!text) return;

        db.ref("chat_messages").push({
            sender: sender,
            text: text,
            timestamp: Date.now()
        });
        msgInput.value = "";
    };

    msgInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            document.getElementById("send-text-btn").click();
        }
    });

    db.ref("chat_messages").limitToLast(50).on("value", snapshot => {
        messagesList.innerHTML = "";
        const data = snapshot.val();

        if (!data) {
            messagesList.innerHTML = '<div style="text-align: center; color: #888; font-size: 13px;">لا توجد رسائل بعد. كن أول من يراسل! 🇫🇷</div>';
            return;
        }

        Object.keys(data).forEach(key => {
            const msg = data[key];
            const msgDiv = document.createElement("div");
            msgDiv.style.cssText = "background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; max-width: 85%; align-self: flex-start;";
            msgDiv.innerHTML = `<strong style="color: #0055A5; font-size: 12px; display: block; margin-bottom: 2px;">${msg.sender}</strong><span style="font-size: 13px; color: #333; word-break: break-all;">${msg.text}</span>`;
            messagesList.appendChild(msgDiv);
        });

        messagesList.scrollTop = messagesList.scrollHeight;
    });
}
