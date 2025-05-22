// Harita başlatma
const map = L.map('map').setView([39.0, 35.9], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let allQuakes = []; // Tüm deprem verilerini saklayacak
let markers = []; // Tüm işaretçileri saklayacak
let updateInterval; // Güncelleme interval'ı

// Sayaç ve güncelleme fonksiyonları
let countdown = 60;
const countdownElement = document.getElementById('countdown');

function updateCountdown() {
    countdown--;
    countdownElement.textContent = countdown;
    
    if (countdown <= 0) {
        countdown = 60;
        fetchEarthquakes();
    }
}

// Her saniye sayacı güncelle
function startUpdateTimer() {
    clearInterval(updateInterval);
    updateInterval = setInterval(updateCountdown, 1000);
}

// Deprem verilerini çek
function fetchEarthquakes() {
    // API yolunu tam olarak belirt
    const currentPath = window.location.pathname.replace(/\/[^/]*$/, '');
    const apiUrl = window.location.origin + currentPath + '/api/index.php';
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(`${data.error}\n\nTeknik Detaylar:\n${JSON.stringify(data.details, null, 2)}`);
            }
            allQuakes = data;
            
            // Mobil görünümde direkt tüm depremleri göster
            if (window.innerWidth < 768) {
                updateQuakeList(allQuakes);
                updateMap(allQuakes);
            } else {
                // Desktop görünümde filtreleme yap
                updateMap();
                updateQuakeList();
                updateCityFilter();
            }
        })
        .catch(error => {
            console.error('Veri güncellenirken hata oluştu:', error);
            const quakeList = document.getElementById('quakeList');
            quakeList.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center">
                        <div class="text-red-600 mb-2">
                            Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                        </div>
                        <div class="text-sm text-gray-500 whitespace-pre-wrap">
                            ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        });
}

function updateMap(filteredData = allQuakes) {
    // Mevcut işaretçileri temizle
    markers.forEach(marker => marker.remove());
    markers = [];

    // Yeni işaretçileri ekle
    filteredData.forEach(deprem => {
        const marker = L.circleMarker([deprem.enlem, deprem.boylam], {
            radius: deprem.buyukluk * 2,
            fillColor: getColorByMagnitude(deprem.buyukluk),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });

        marker.bindPopup(`
            <div class="p-2">
                <div class="font-bold text-lg mb-2">${deprem.buyukluk} Büyüklüğünde Deprem</div>
                <div class="text-sm">
                    <p><strong>Yer:</strong> ${deprem.yer}</p>
                    <p><strong>Tarih:</strong> ${deprem.tarih}</p>
                    <p><strong>Saat:</strong> ${deprem.saat}</p>
                    <p><strong>Derinlik:</strong> ${deprem.derinlik} km</p>
                </div>
            </div>
        `);

        marker.addTo(map);
        markers.push(marker);
    });
}

function updateQuakeList(filteredData = allQuakes) {
    const quakeList = document.getElementById('quakeList');
    quakeList.innerHTML = '';

    filteredData.forEach(deprem => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${deprem.tarih} ${deprem.saat}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBgColorClass(deprem.buyukluk)}">
                    ${deprem.buyukluk}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${deprem.derinlik} km</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${deprem.yer}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${deprem.sehir || '-'}</td>
        `;

        // Satıra tıklandığında haritada o noktaya zoom yap
        row.addEventListener('click', () => {
            map.setView([deprem.enlem, deprem.boylam], 8, {
                animate: true,
                duration: 1
            });
            markers.forEach(marker => {
                if (marker.getLatLng().lat === parseFloat(deprem.enlem) && 
                    marker.getLatLng().lng === parseFloat(deprem.boylam)) {
                    marker.openPopup();
                }
            });
        });

        quakeList.appendChild(row);
    });
}

// Şehir filtreleme butonlarını oluştur
function updateCityFilter() {
    const cities = [...new Set(allQuakes.map(quake => quake.sehir).filter(Boolean))];
    const cityFilter = document.getElementById('cityFilter');
    const cityButtons = document.getElementById('cityButtons');
    
    // Desktop için dropdown
    if (cityFilter) {
        cityFilter.innerHTML = '<option value="">Tümü</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
    
    // Mobil için butonlar
    if (cityButtons) {
        cityButtons.innerHTML = `
            <button class="filter-btn active px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800" data-value="">Tümü</button>
            ${cities.map(city => `
                <button class="filter-btn px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800" data-value="${city}">${city}</button>
            `).join('')}
        `;
    }
}

function getBgColorClass(magnitude) {
    if (magnitude >= 5.0) return 'bg-red-100 text-red-800';
    if (magnitude >= 4.0) return 'bg-orange-100 text-orange-800';
    if (magnitude >= 3.0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

function getColorByMagnitude(magnitude) {
    if (magnitude >= 5.0) return '#FF0000';
    if (magnitude >= 4.0) return '#FFA500';
    if (magnitude >= 3.0) return '#FFFF00';
    return '#00FF00';
}

// Filtreleme fonksiyonu
function filterQuakes() {
    const minMagnitude = document.getElementById('minMagnitude')?.value || 
                        document.querySelector('.filter-btn.active[data-value]')?.dataset.value || '0';
    const selectedCity = document.getElementById('cityFilter')?.value || 
                        document.querySelector('.filter-btn.active[data-city]')?.dataset.city || '';
    
    const filteredQuakes = allQuakes.filter(quake => {
        const magnitude = parseFloat(quake.buyukluk);
        const city = quake.sehir;
        
        return magnitude >= parseFloat(minMagnitude) && 
               (!selectedCity || city === selectedCity);
    });
    
    updateQuakeList(filteredQuakes);
    updateMap(filteredQuakes);
}

// Filtre butonları için event listener
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('filter-btn')) {
        // Aynı gruptaki diğer butonları pasif yap
        const buttonGroup = e.target.closest('.flex-wrap');
        buttonGroup.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-100', 'text-blue-800');
            btn.classList.add('bg-gray-100', 'text-gray-800');
        });
        
        // Tıklanan butonu aktif yap
        e.target.classList.add('active', 'bg-blue-100', 'text-blue-800');
        e.target.classList.remove('bg-gray-100', 'text-gray-800');
        
        // Filtrelemeyi güncelle
        filterQuakes();
    }
});

// Sayfa görünürlük kontrolü
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        countdown = 1; // Hemen güncelleme yapması için
        startUpdateTimer();
        fetchEarthquakes();
    }
});

// Pencere boyutu değiştiğinde
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        // Mobil görünüme geçildiğinde
        updateQuakeList(allQuakes);
        updateMap(allQuakes);
    } else {
        // Desktop görünüme geçildiğinde
        updateMap();
        updateQuakeList();
        updateCityFilter();
    }
});

// İlk yükleme
startUpdateTimer();
fetchEarthquakes(); 