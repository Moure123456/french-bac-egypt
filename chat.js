/**
 * نظام محادثة الطلاب والتسجيل الصوتي (Le Français Au Bac)
 * يدعم الكتابة، تسجيل الصوت المباشر من الموبايل، وعرض الصوتيات.
 */

// 1. إعدادات Firebase (يمكنك استبدال هذه البيانات بإعدادات مشروعك في Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyYOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    databaseURL: "https://your-app-default-rtdb.firebaseio.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};

// تهيئة الخدمة
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const storage = firebase.storage();

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

document.addEventListener("DOMContentLoaded", function () {
    setupChatUI();
    loadMessages();
});

// تجهيز واجهة الشات وتفعيل أزرار التسجيل والكتابة
function setupChatUI() {
    const chatContainer = document.getElementById("chat-messages-container");
    if (!chatContainer) return;

    // تصميم واجهة إدخال الرسائل والتسجيل
    const inputAreaHTML = `
        <div id="student-chat-box" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
            <div id="messages-list" style="height: 350px; overflow-y: auto; background: #f9f9f9; padding: 12px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; color: #888; font-size: 13px;">جاري تحميل المحادثات...</div>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center; background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
                <input type="text" id="student-name-input" placeholder="اسمك..." style="width: 25%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
                <input type="text" id="student-msg-input" placeholder="اكتب رسالة هنا..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
                
                <button id="send-text-btn" style="background: #0055A5; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">إرسال</button>
                <button id="record-audio-btn" style="background: #d9534f; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;" title="تسجيل صوت">🎙️</button>
            </div>
            <div id="record-status" style="font-size: 12px; color: red; text-align: right; display: none; font-weight: bold;">🔴 جاري التسجيل الان... اضغط ⏹️ للإرسال</div>
        </div>
    `;

    chatContainer.innerHTML = inputAreaHTML;

    // زر إرسال النص
    document.getElementById("send-text-btn").addEventListener("click", sendTextMessage);
    
    // زر تسجيل الصوت
    document.getElementById("record-audio-btn").addEventListener("click", toggleAudioRecording);
}

// إرسال رسالة نصية
function sendTextMessage() {
    const nameInput = document.getElementById("student-name-input").value.trim() || "طالب";
    const msgInput = document.getElementById("student-msg-input");
    const text = msgInput.value.trim();

    if (!text) return;

    const newMessageRef = db.ref("chat_messages").push();
    newMessageRef.set({
        sender: nameInput,
        text: text,
        type: "text",
        timestamp: Date.now()
    });

    msgInput.value = "";
}

// التحكم في بداية ونهاية التسجيل الصوتي
async function toggleAudioRecording() {
    const recordBtn = document.getElementById("record-audio-btn");
    const recordStatus = document.getElementById("record-status");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                uploadAndSendAudio(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;
            recordBtn.innerText = "⏹️";
            recordBtn.style.background = "#28a745";
            recordStatus.style.display = "block";
        } catch (err) {
            alert("يرجى السماح باستخدام المايكروفون لتسجيل الصوت.");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.innerText = "🎙️";
        recordBtn.style.background = "#d9534f";
        recordStatus.style.display = "none";
    }
}

// رفع المقطع الصوتي إلى Firebase Storage وإرسال رابطه
function uploadAndSendAudio(blob) {
    const nameInput = document.getElementById("student-name-input").value.trim() || "طالب";
    const fileName = `voice_${Date.now()}.mp3`;
    const storageRef = storage.ref(`voice_messages/${fileName}`);

    const recordStatus = document.getElementById("record-status");
    recordStatus.innerText = "⏳ جاري رفع المقطع الصوتي...";
    recordStatus.style.display = "block";

    storageRef.put(blob).then(snapshot => {
        snapshot.ref.getDownloadURL().then(downloadURL => {
            const newMessageRef = db.ref("chat_messages").push();
            newMessageRef.set({
                sender: nameInput,
                audioUrl: downloadURL,
                type: "audio",
                timestamp: Date.now()
            });
            recordStatus.style.display = "none";
            recordStatus.innerText = "🔴 جاري التسجيل الان... اضغط ⏹️ للإرسال";
        });
    }).catch(err => {
        alert("حدث خطأ أثناء رفع التسجيل الصوتي.");
        recordStatus.style.display = "none";
    });
}

// تحميل وعرض الرسائل لحظياً
function loadMessages() {
    db.ref("chat_messages").limitToLast(50).on("value", snapshot => {
        const messagesList = document.getElementById("messages-list");
        if (!messagesList) return;

        messagesList.innerHTML = "";
        const data = snapshot.val();

        if (!data) {
            messagesList.innerHTML = '<div style="text-align: center; color: #888; font-size: 13px;">لا توجد رسائل بعد. كن أول من يراسل! 🇫🇷</div>';
            return;
        }

        Object.keys(data).forEach(key => {
            const msg = data[key];
            const msgDiv = document.createElement("div");
            msgDiv.style.cssText = "background: #fff; padding: 8px 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 80%; align-self: flex-start;";

            let contentHTML = `<strong style="color: #0055A5; font-size: 12px; display: block; margin-bottom: 3px;">${msg.sender}</strong>`;

            if (msg.type === "text") {
                contentHTML += `<span style="font-size: 14px; color: #333;">${msg.text}</span>`;
            } else if (msg.type === "audio") {
                contentHTML += `<audio controls style="height: 35px; width: 220px; margin-top: 5px;"><source src="${msg.audioUrl}" type="audio/mp3"></audio>`;
            }

            msgDiv.innerHTML = contentHTML;
            messagesList.appendChild(msgDiv);
        });

        // التمرير التلقائي لآخر رسالة
        messagesList.scrollTop = messagesList.scrollHeight;
    });
}
