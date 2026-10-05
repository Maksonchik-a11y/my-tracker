// Уникальное имя канала для вашей школы
const CHANNEL_NAME = "school_geo_tracker_channel_2026"; 
let map, marker, isMapInit = false;

// Функция обновления карты (общая)
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

// --- КОД ДЛЯ ТЕЛЕФОНА (ЗАПУСКАЕТСЯ НА INDEX.HTML) ---
const startBtn = document.getElementById('start-btn');
const statusDiv = document.getElementById('status');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        statusDiv.innerHTML = "<em>Запуск датчиков GPS...</em>";
        startBtn.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition((position) => {
                const lat = position.coords.latitude;   
                const lng = position.coords.longitude;  

                statusDiv.innerHTML = `
                    <p style="color: green; font-weight: bold; margin-top:0;">Режим: ТЕЛЕФОН (Трансляция GPS)</p>
                    <b>Широта:</b> ${lat.toFixed(6)} | <b>Долгота:</b> ${lng.toFixed(6)} <br>
                    <span style="font-size: 13px; color: #666;">Данные передаются на компьютер...</span>
                `;
                updateMap(lat, lng);

                // Отправка в сеть
                if (window.PubNub) {
                    window.pubnubClient.publish({
                        channel: CHANNEL_NAME,
                        message: { lat: lat, lng: lng }
                    });
                }
            }, () => {
                statusDiv.innerHTML = "<b style='color: red;'>Ошибка GPS. Проверьте геопозицию.</b>";
                startBtn.disabled = false;
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        }
    });

    // Подгружаем сеть для телефона
    const script = document.createElement('script');
    script.src = "https://pubnub.com";
    script.onload = () => {
        window.pubnubClient = new PubNub({
            subscribeKey: "sub-c-52221d12-bf0e-11e5-8a8b-0619f8945a4b",
            publishKey: "pub-c-49339396-8eb5-430c-99d9-b9f470559f51",
            uuid: "phone_target"
        });
    };
    document.head.appendChild(script);
}

// --- КОД ДЛЯ КОМПЬЮТЕРА (ЗАПУСКАЕТСЯ НА MONITOR.HTML) ---
const monitorStatus = document.getElementById('monitor-status');
if (monitorStatus) {
    const script = document.createElement('script');
    script.src = "https://pubnub.com";
    script.onload = () => {
        const pubnub = new PubNub({
            subscribeKey: "sub-c-52221d12-bf0e-11e5-8a8b-0619f8945a4b",
            publishKey: "pub-c-49339396-8eb5-430c-99d9-b9f470559f51",
            uuid: "computer_monitor"
        });

        pubnub.addListener({
            message: function(event) {
                const data = event.message;
                monitorStatus.innerHTML = `
                    <p style="color: red; font-weight: bold; margin-top:0;">● СИГНАЛ ТЕЛЕФОНА ПОЙМАН</p>
                    <b>Координаты цели:</b> ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}
                `;
                updateMap(data.lat, data.lng);
            }
        });
        pubnub.subscribe({ channels: [CHANNEL_NAME] });
    };
    document.head.appendChild(script);
}
