const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let currentUser = null;
let currentRole = null; 

function openAdminLogin() {
    const selectedName = "عامر معيض القحطاني";
    const password = prompt(`أدخل الرقم السري للـمدير (${selectedName}):`);
    
    if (password === "202020") {
        currentUser = selectedName;
        currentRole = 'admin';
        alert("مرحباً بك يا عميد. تم تسجيل الدخول لصلاحيات المدير بنجاح.");
        loadAdminDashboard();
    } else {
        alert("الرقم السري غير صحيح.");
    }
}

async function fetchTripSchedule() {
    try {
        const tripsContainer = document.getElementById('trips-schedule-container');
        if (!tripsContainer) return;

        const tripsData = [
            { person: "باسل أبو سيف", dateH: "1447/04/10", dateG: "2026/10/12", status: "مؤكد" },
            { person: "مشبب الشهري", dateH: "1447/04/24", dateG: "2026/10/26", status: "اعتذار" }
        ];

        let html = '<ul class="trip-list">';
        tripsData.forEach(trip => {
            html += `
                <li class="trip-card">
                    <strong>المسؤول:</strong> ${trip.person} <br>
                    <strong>التاريخ:</strong> ${trip.dateH} هـ (${trip.dateG} م) <br>
                    <strong>الحالة:</strong> <span class="${trip.status === 'مؤكد' ? 'text-success' : 'text-danger'}">${trip.status}</span>
                </li>
            `;
        });
        html += '</ul>';
        tripsContainer.innerHTML = html;
    } catch (error) {
        console.error("خطأ في جلب سرى الطلعات:", error);
    }
}

async function updateWeatherWidget() {
    const tempElement = document.getElementById('weather-temp');
    if (!tempElement) return;
    
    let temp = 24; 
    tempElement.innerText = `${temp}°C`;
    
    if (temp < 20) {
        tempElement.style.color = '#3498db'; 
    } else if (temp <= 30) {
        tempElement.style.color = '#2ecc71'; 
    } else {
        tempElement.style.color = '#e74c3c'; 
    }
}

function loadAdminDashboard() {
    console.log("تم تحميل لوحة المدير بنجاح. الصلاحيات متاحة.");
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTripSchedule();
    updateWeatherWidget();
});
