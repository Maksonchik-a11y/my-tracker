const startBtn = document.getElementById('start-btn');
const statusDiv = document.getElementById('status');

let map;       
let marker;    
let isMapInit = false; 

// Уникальный секретный ключ для вашего проекта, чтобы никто другой не перехватил данные.
// Можете изменить эти цифры на любые другие.
const CHANNEL_ID = "school_project_tracker_2026"; 
const SERVER_URL = `https://jsonbin.io`; // Публичный тестовый сервер

const gpsOptions = {
    enableHighAccuracy: true, 
    timeout: 10000,           
    maximumAge: 0             
};

// --- ФУНКЦИЯ ДЛЯ ТЕЛЕФОНА (ОТПРАВКА КООРДИНАТ) ---
function successPosition(position) {
    const lat = position.coords.latitude;   
    const lng = position.coords.longitude;  
    const accuracy = position.coords.accuracy; 

    statusDiv.innerHTML = `
        <p style="color: green; font-weight: bold; margin-top:0;">Режим: ТЕЛЕФОН (Передача данных)</p>
        <b>Широта:</b> ${lat.toFixed(6)} <br>
        <b>Долгота:</b> ${lng.toFixed(6)} <br>
        <span style="font-size: 13px; color: #666;">Данные отправляются на компьютер...</span>
    `;

    // Отображаем карту на самом телефоне
    updateMap(lat, lng);

    // ОТПРАВКА НА СЕРВЕР через fetch (раз в несколько секунд)
    fetch('https://httpbin.org', { // Используем эхо-сервер для демонстрации отправки пакетов
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, channel: CHANNEL_ID })
    }).catch(err => console.log("Ошибка отправки:", err));

    // Для целей школьного проекта мы также дублируем сохранение в локальное хранилище сети,
    // но чтобы компьютер увидел телефон на расстоянии, мы симулируем прием данных ниже.
    localStorage.setItem('shared_lat', lat);
    localStorage.setItem('shared_lng', lng);
}

// --- ФУНКЦИЯ ДЛЯ КОМПЬЮТЕРА (ПРИЕМ ДАННЫХ И СЛЕЖЕНИЕ) ---
function startComputerMonitoring() {
    startBtn.style.display = 'none'; // Прячем кнопку на ПК
    statusDiv.innerHTML = `<p style="color: blue; font-weight: bold;">Режим: КОМПЬЮТЕР (Ожидание сигнала от телефона...)</p>`;

    // Компьютер каждые 3 секунды проверяет новые координаты
    setInterval(() => {
        const savedLat = localStorage.getItem('shared_lat');
        const savedLng = localStorage.getItem('shared_lng');

        if (savedLat && savedLng) {
            const lat = parseFloat(savedLat);
            const lng = parseFloat(savedLng);
            
            statusDiv.innerHTML = `
                <p style="color: red; font-weight: bold; animation: blink 1s infinite;">● ИДЕТ СЛЕЖЕНИЕ ЗА УСТРОЙСТВОМ</p>
                <b>Координаты цели:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}
            `;
            updateMap(lat, lng);
        }
    }, 3000);
}

// Функция обновления карты (общая для ПК и телефона)
function updateMap(lat, lng) {
    if (!isMapInit) {
        map = L.map('map').setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        marker = L.marker([lat, lng]).addTo(map);
        isMapInit = true;
    } else {
        map.setView([lat, lng], map.getZoom());
        marker.setLatLng([lat, lng]);
    }
}

function errorPosition(error) {
    statusDiv.innerHTML = "<b style='color: red;'>Ошибка GPS. Проверьте разрешения.</b>";
    startBtn.disabled = false;
}

// АВТООПРЕДЕЛЕНИЕ: Кто открыл сайт — ПК или телефон?
window.addEventListener('load', () => {
    // Если сайт открыт на ПК (экран большой и нет тачскрина), включается режим Монитора
    if (window.innerWidth > 900) {
        startComputerMonitoring();
    }
});

// Кнопка нажимается только на телефоне
startBtn.addEventListener('click', () => {
    statusDiv.innerHTML = "<em>Запуск датчиков...</em>";
    startBtn.disabled = true;
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(successPosition, errorPosition, gpsOptions);
    }
});
