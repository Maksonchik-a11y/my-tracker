const startBtn = document.getElementById('start-btn');
const statusDiv = document.getElementById('status');

let map;       // Переменная для хранения карты
let marker;    // Переменная для маркера (точки) на карте
let isMapInit = false; // Флаг: создана ли уже карта

// Настройки точности GPS
const gpsOptions = {
    enableHighAccuracy: true, // Использовать аппаратный GPS для максимальной точности
    timeout: 10000,           // Максимальное время ожидания спутников — 10 секунд
    maximumAge: 0             // Не использовать старые (кэшированные) координаты
};

// Функция, которая вызывается при успешном получении координат
function successPosition(position) {
    const lat = position.coords.latitude;   // Широта
    const lng = position.coords.longitude;  // Долгота
    const accuracy = position.coords.accuracy; // Точность в метрах

    // Обновляем текст на экране
    statusDiv.innerHTML = `
        <p style="color: green; font-weight: bold; margin-top:0;">Доступ получен! Идет слежение:</p>
        <b>Широта:</b> ${lat.toFixed(6)} <br>
        <b>Долгота:</b> ${lng.toFixed(6)} <br>
        <span style="font-size: 13px; color: #666;">Погрешность: ~${Math.round(accuracy)} метров</span>
    `;

    // Если карта еще не была создана, инициализируем её
    if (!isMapInit) {
        // Создаем карту и центрируем её на полученных координатах (зум 16)
        map = L.map('map').setView([lat, lng], 16);

        // Загружаем бесплатные карты OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Ставим маркер на карту
        marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup("Вы находитесь здесь").openPopup();

        isMapInit = true; // Запоминаем, что карта создана
    } else {
        // Если карта уже есть, просто плавно перемещаем её центр и маркер за пользователем
        map.setView([lat, lng], map.getZoom());
        marker.setLatLng([lat, lng]);
    }
}

// Функция обработки ошибок (если что-то пошло не так)
function errorPosition(error) {
    startBtn.disabled = false; // Возвращаем кнопку в рабочее состояние
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            statusDiv.innerHTML = "<b style='color: red;'>Ошибка: Пользователь отклонил запрос на доступ к GPS.</b><br>Браузер заблокировал получение данных в целях конфиденциальности.";
            break;
        case error.POSITION_UNAVAILABLE:
            statusDiv.innerHTML = "<b style='color: red;'>Ошибка: Данные GPS недоступны.</b><br>Проверьте, включена ли геолокация в настройках самого телефона.";
            break;
        case error.TIMEOUT:
            statusDiv.innerHTML = "<b style='color: red;'>Ошибка: Время ожидания истекло.</b><br>Не удалось поймать сигнал спутников за 10 секунд.";
            break;
        default:
            statusDiv.innerHTML = "<b style='color: red;'>Произошла неизвестная ошибка при работе с датчиком.</b>";
    }
}

// Вешаем событие клика на кнопку
startBtn.addEventListener('click', () => {
    statusDiv.innerHTML = "<em>Запрос системных прав и поиск спутников...</em>";
    startBtn.disabled = true; // Отключаем кнопку, чтобы пользователь не кликал многократно
    
    // Проверяем, поддерживает ли браузер геолокацию
    if (navigator.geolocation) {
        // watchPosition следит в реальном времени. Если вы пойдете — точка на карте двинется.
        navigator.geolocation.watchPosition(successPosition, errorPosition, gpsOptions);
    } else {
        statusDiv.innerHTML = "<b style='color: red;'>Ваш браузер слишком старый и не поддерживает Geolocation API.</b>";
    }
});
