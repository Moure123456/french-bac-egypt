/**
 * نظام محادثة الطلاب والتسجيل الصوتي والصور (Le Français Au Bac)
 * يدعم الكتابة، الإيموجي، إرفاق الصور، التسجيل الصوتي، وعداد الرسائل الجديدة.
 */

const firebaseConfig = {
    apiKey: "AIzaSyAoFJex9rrYUgyyEUtw9TV9rhriFVyag8Y",
    authDomain: "frenchbacchat.firebaseapp.com",
    databaseURL: "https://frenchbacchat-default-rtdb.firebaseio.com",
    projectId: "frenchbacchat",
    storageBucket: "frenchbacchat.firebasestorage.app",
    messagingSenderId: "692488273461",
    appId: "1:692488273461:web:efa14361a054f3287d3b7c",
    measurementId: "G-RZKJ18LPS2"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const storage = firebase.storage();

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let lastReadTimestamp = localStorage.getItem("last_read_chat") || 0;
let totalUnreadCount = 0;

document.addEventListener("DOMContentLoaded", function () {
    setupChatUI();
    loadMessages();
});

// تجهيز واجهة الشات وتفعيل الأزرار الجديدة
function setupChatUI() {
    const chatContainer = document.getElementById("chat-messages-container");
    if (!chatContainer) return;

    const inputAreaHTML = `
        <div id="student-chat-box" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            <!-- شريط عداد الرسائل الجديدة -->
            <div id="chat-header-bar" style="display: flex; justify-content: space-between; align-items: center; background: #eef2f7; padding: 6px 12px; border-radius: 6px; font-size: 13px;">
                <span>💬 شات الطلاب التفاعلي</span>
                <button id="unread-badge-btn" onclick="scrollToNewMessages()" style="background: #d9534f; color: white; border: none; padding: 3px 8px; border-radius: 12px; font-size: 11px; cursor: pointer; display: none;">
                    رسائل جديدة (<span id="unread-count">0</span>)
                </button>
            </div>

            <!-- صندوق عرض الرسائل -->
            <div id="messages-list" style="height: 320px; overflow-y: auto; background: #f9f9f9; padding: 12px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; color: #888; font-size: 13px;">جاري تحميل المحادثات...</div>
            </div>
            
            <!-- قائمة الإيموجي السريعة -->
            <div id="emoji-picker" style="display: none; gap: 5px; background: #fff; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                <span onclick="insertEmoji('😊')" style="cursor: pointer;">😊</span>
                <span onclick="insertEmoji('🇫🇷')" style="cursor: pointer;">🇫🇷</span>
                <span onclick="insertEmoji('👍')" style="cursor: pointer;">👍</span>
                <span onclick="insertEmoji('🔥')" style="cursor: pointer;">🔥</span>
                <span onclick="insertEmoji('❤️')" style="cursor: pointer;">❤️</span>
                <span onclick="insertEmoji('👏')" style="cursor: pointer;">👏</span>
                <span onclick="insertEmoji('💡')" style="cursor: pointer;">💡</span>
                <span onclick="insertEmoji('⭐')" style="cursor: pointer;">⭐</span>
            </div>

            <!-- شريط الإدخال والأزرار -->
            <div style="display: flex; gap: 6px; align-items: center; background: #fff; padding: 6px; border-radius: 8px; border: 1px solid #ccc;">
                <input type="text" id="student-name-input" placeholder="اسمك..." style="width: 22%; padding: 7px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
                <input type="text" id="student-msg-input" placeholder="اكتب رسالة..." style="flex: 1; padding: 7px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
                
                <!-- أيقونة الإيموجي -->
                <button type="button" id="toggle-emoji-btn" style="background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; border-radius: 6px; cursor: pointer;" title="التعبيرات">😊</button>
                
                <!-- أيقونة رفع الصور (Attach File) -->
                <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                <button type="button" id="attach-img-btn" style="background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; border-radius: 6px; cursor: pointer;" title="إرفاق صورة">🖼️</button>

                <button id="send-text-btn" style="background: #0055A5; color: white; border: none; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">إرسال</button>
                <button id="record-audio-btn" style="background: #d9534f; color: white; border: none; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-size: 13px;" title="تسجيل صوت">🎙️</button>
            </div>
            <div id="record-status" style="font-size: 11px; color: red; text-align: right; display: none; font-weight: bold;">🔴 جاري التسجيل الان... اضغط ⏹️ للإرسال</div>
        </div>
    `;

    chatContainer.innerHTML = inputAreaHTML;

    // الأحداث
    document.getElementById("send-text-btn").addEventListener("click", sendTextMessage);
    document.getElementById("record-audio-btn").addEventListener("click", toggleAudioRecording);
    
    // تفعيل إظهار وإخفاء قائمة التعبيرات
    document.getElementById("toggle-emoji-btn").addEventListener("click", () => {
        const picker = document.getElementById("emoji-picker");
        picker.style.display = picker.style.display === "flex" ? "none" : "flex";
    });

    // تفعيل زر إرفاق الصور
    document.getElementById("attach-img-btn").addEventListener("click", () => {
        document.getElementById("image-file-input").click();
    });

    document.getElementById("image-file-input").addEventListener("change", handleImageUpload);
}

// إدراج التعبير في خانة النص
function insertEmoji(emoji) {
    const msgInput = document.getElementById("student-msg-input");
    msgInput.value += emoji;
    msgInput.focus();
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

// رفع وإرسال صورة مرفقة
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const nameInput = document.getElementById("student-name-input").value.trim() || "طالب";
    const fileName = `img_${Date.now()}_${file.name}`;
    const storageRef = storage.ref(`chat_images/${fileName}`);

    const recordStatus = document.getElementById("record-status");
    recordStatus.innerText = "⏳ جاري رفع الصورة المرفقة...";
    recordStatus.style.display = "block";

    storageRef.put(file).then(snapshot => {
        snapshot.ref.getDownloadURL().then(downloadURL => {
            const newMessageRef = db.ref("chat_messages").push();
            newMessageRef.set({
                sender: nameInput,
                imageUrl: downloadURL,
                type: "image",
                timestamp: Date.now()
            });
            recordStatus.style.display = "none";
            event.target.value = ""; // إعادة تعيين الحقل
        });
    }).catch(err => {
        alert("حدث خطأ أثناء رفع الصورة.");
        recordStatus.style.display = "none";
    });
}

// التسجيل الصوتي
async function toggleAudioRecording() {
    const recordBtn = document.getElementById("record-audio-btn");
    const recordStatus = document.getElementById("record-status");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
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
            alert("يرجى السماح باستخدام الميكروفون.");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.innerText = "🎙️";
        recordBtn.style.background = "#d9534f";
        recordStatus.style.display = "none";
    }
}

// رفع الصوت
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
        });
    }).catch(err => {
        alert("خطأ في رفع الصوت.");
        recordStatus.style.display = "none";
    });
}

// تحميل وعرض الرسائل وتتبع الرسائل الجديدة
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

        totalUnreadCount = 0;
        const keys = Object.keys(data);

        keys.forEach(key => {
            const msg = data[key];
            const isNew = msg.timestamp > Number(lastReadTimestamp);
            if (isNew) totalUnreadCount++;

            const msgDiv = document.createElement("div");
            // الرسائل الجديدة تظهر بلون خلفية مميز مختلف عن المقروءة
            const bgColor = isNew ? "#fffde7" : "#fff";
            const borderColor = isNew ? "2px solid #fbc02d" : "1px solid #ddd";

            msgDiv.style.cssText = `background: ${bgColor}; padding: 8px 12px; border-radius: 8px; border: ${borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 80%; align-self: flex-start;`;

            let contentHTML = `<strong style="color: #0055A5; font-size: 12px; display: block; margin-bottom: 3px;">${msg.sender} ${isNew ? '<span style="color:red; font-size:10px;">(جديد)</span>' : ''}</strong>`;

            if (msg.type === "text") {
                contentHTML += `<span style="font-size: 13px; color: #333; word-break: break-all;">${msg.text}</span>`;
            } else if (msg.type === "audio") {
                contentHTML += `<audio controls style="height: 32px; width: 200px; margin-top: 4px;"><source src="${msg.audioUrl}" type="audio/mp3"></audio>`;
            } else if (msg.type === "image") {
                contentHTML += `<img src="${msg.imageUrl}" style="max-width: 180px; border-radius: 6px; margin-top: 4px; display: block;">`;
            }

            msgDiv.innerHTML = contentHTML;
            messagesList.appendChild(msgDiv);
        });

        // تحديث عداد شريط الرسائل الجديدة
        const badgeBtn = document.getElementById("unread-badge-btn");
        const countSpan = document.getElementById("unread-count");
        if (totalUnreadCount > 0) {
            countSpan.innerText = totalUnreadCount;
            badgeBtn.style.display = "inline-block";
        } else {
            badgeBtn.style.display = "none";
        }

        messagesList.scrollTop = messagesList.scrollHeight;
    });
}

// عند الضغط على زر العداد، يتم تحديث وقت القراءة وإزالة التمييز
function scrollToNewMessages() {
    lastReadTimestamp = Date.now();
    localStorage.setItem("last_read_chat", lastReadTimestamp);
    loadMessages();
}
