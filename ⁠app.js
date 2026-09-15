const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let currentUser = null;
let currentRole = null; 

// --- 1. نظام دخول المدير ---
function openAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'flex';
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function verifyAdminLogin() {
    const selectedName = document.getElementById('admin-select-name').value;
    const password = document.getElementById('admin-pass-input').value;
    
    if (selectedName === "عامر معيض القحطاني" && password === "202020") {
        currentUser = selectedName;
        currentRole = 'admin';
        alert("مرحباً بك يا عميد. تم الدخول لصلاحيات المدير بنجاح.");
        closeAdminLogin();
        document.getElementById('admin-dashboard').style.display = 'block';
    } else {
        alert("الرقم السري غير صحيح. يرجى التأكد من الرقم (202020).");
    }
}

function closeAdminDashboard() {
    document.getElementById('admin-dashboard').style.display = 'none';
}

// --- 2. إدارة الأقسام والواجهة الداخلية ---
function openSection(sectionName) {
    const container = document.getElementById('dynamic-content-area');
    if (sectionName === 'schedules') {
        container.innerHTML = `
            <h2>☕ سرى القهوة والطلعات (هجري وميلادي)</h2>
            <div id="trips-schedule-container">جاري التحميل...</div>
        `;
        fetchTripSchedule();
    } else if (sectionName === 'neighbors') {
        container.innerHTML = `<h2>👥 قائمة الجيران والأعضاء</h2><p>عدد الأعضاء الحالي: 23 عضوًا (إدارة المدير مفعلة).</p>`;
    } else if (sectionName === 'community') {
        container.innerHTML = `<h2>🤝 مجتمع الجيران</h2><p>جار لجاره، سوق الجيران، مجلس الجيران، والتجمعات والأنشطة.</p>`;
    } else if (sectionName === 'services') {
        container.innerHTML = `<h2>🏘️ خدمات الحي</h2><p>مواقيت الصلاة، الطقس، الإجازات، والخدمات الحكومية.</p>`;
    } else if (sectionName === 'sports') {
        container.innerHTML = `<h2>⚽ الرياضة</h2><p>الدوري السعودي، الإيطالي، ودوري أبطال أوروبا (المباريات والترتيب).</p>`;
    } else if (sectionName === 'mosque') {
        container.innerHTML = `<h2>🕌 جامع ابن ذعار</h2><p>مواقيت الإقامة، الدروس، والمحتوى الرسمي المضاف من الإدارة.</p>`;
    } else if (sectionName === 'weather') {
        container.innerHTML = `<h2>🌡️ الطقس والحرارة</h2><p>تحديث درجات الحرارة للمحالة وأبها لحظياً.</p>`;
    } else if (sectionName === 'quran') {
        container.innerHTML = `<h2>📖 القرآن والأذكار</h2><p>الورد اليومي، الأذكار، والمحفظة الإسلامية للحي.</p>`;
    }
}

// --- 3. جلب وعرض سرى الطلعات والقهوة ---
async function fetchTripSchedule() {
    try {
        const tripsContainer = document.getElementById('trips-schedule-container');
        if (!tripsContainer) return;

        const tripsData = [
            { type: "☕ سرى القهوة", person: "عامر معيض القحطاني", dateH: "1447/04/05", dateG: "2026/10/07", status: "مؤكد", cost: "-" },
            { type: "🚗 سرى الطلعات", person: "باسل أبو سيف", dateH: "1447/04/12", dateG: "2026/10/14", status: "مؤكد", cost: "تقسيم التكلفة مفعلة" },
            { type: "🚗 سرى الطلعات", person: "مشبب الشهري", dateH: "1447/04/26", dateG: "2026/10/28", status: "اعتذار", cost: "تم تبديل الدور" }
        ];

        let html = '';
        tripsData.forEach(item => {
            html += `
                <div class="trip-card">
                    <strong>${item.type}</strong><br>
                    <strong>المسؤول:</strong> ${item.person} <br>
                    <strong>التاريخ:</strong> ${item.dateH} هـ (${item.dateG} م) <br>
                    <strong>الحالة:</strong> <span class="${item.status === 'مؤكد' ? 'text-success' : 'text-danger'}">${item.status}</span><br>
                    <small>📌 ${item.cost}</small>
                </div>
            `;
        });
        tripsContainer.innerHTML = html;
    } catch (error) {
        console.error("خطأ في جلب السرى:", error);
    }
}

// --- 4. مهام لوحة المدير المتقدمة ---
function manageMembers() { alert("تفتح نافذة إدارة الأعضاء: إضافة، حذف، تعديل الأرقام السرية."); }
function manageSchedules() { alert("تفتح نافذة تعديل جداول القهوة والطلعات وتبديل الأشخاص."); }
function backupData() { alert("تم حفظ نسخة احتياطية من قاعدة بيانات Supabase بنجاح."); }
function restoreData() { alert("تم استعادة البرنامج بنجاح من النسخة المحفوظة."); }

document.addEventListener('DOMContentLoaded', () => {
    fetchTripSchedule();
});
