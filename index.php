<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Türkiye Deprem Takip Sistemi</title>
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-3HXXT7Q4TZ"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-3HXXT7Q4TZ');
    </script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body class="bg-gray-100 font-sans">
    <!-- Navbar -->
    <nav class="bg-white shadow-lg h-16">
        <div class="max-w-full mx-auto px-4 h-full">
            <div class="flex justify-between items-center h-full">
                <div class="flex items-center">
                    <h1 class="text-xl font-bold text-gray-800">Türkiye Deprem Takip Sistemi</h1>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="flex flex-col lg:flex-row h-[calc(100vh-104px)]">
        <!-- Harita - Mobil ve Tablet için üstte -->
        <div class="w-full lg:w-1/2 p-4 order-1 lg:order-2">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                <div id="map" class="rounded-lg h-full"></div>
            </div>
        </div>

        <!-- Deprem Listesi - Mobil ve Tablet için altta -->
        <div class="w-full lg:w-1/2 p-4 order-2 lg:order-1 overflow-hidden flex flex-col">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
                <div class="p-4 border-b flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-900">Son Depremler</h2>
                    <div class="text-sm text-gray-500">
                        Güncelleme: <span id="countdown">60</span> saniye
                    </div>
                </div>
                
                <!-- Filtreleme -->
                <div class="p-4 border-b bg-gray-50">
                    <!-- Desktop için filtreleme -->
                    <div class="hidden md:flex flex-wrap gap-4">
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Minimum Büyüklük</label>
                            <select id="minMagnitude" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                                <option value="0">Tümü</option>
                                <option value="3">3.0+</option>
                                <option value="4">4.0+</option>
                                <option value="5">5.0+</option>
                            </select>
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                            <select id="cityFilter" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                                <option value="">Tümü</option>
                            </select>
                        </div>
                    </div>

                    <!-- Mobil için hızlı filtreler -->
                    <div class="md:hidden flex items-center justify-between">
                        <h3 class="text-sm font-medium text-gray-700">Son Depremler</h3>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500">Güncelleme:</span>
                            <span id="countdown" class="text-xs font-medium text-blue-600">60</span>
                            <span class="text-xs text-gray-500">sn</span>
                        </div>
                    </div>
                </div>

                <!-- Deprem Tablosu -->
                <div class="flex-1 overflow-auto custom-scrollbar">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih/Saat</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Büyüklük</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Derinlik</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yer</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şehir</th>
                                </tr>
                            </thead>
                            <tbody id="quakeList" class="bg-white divide-y divide-gray-200">
                                <!-- JavaScript ile doldurulacak -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t">
        <div class="max-w-full mx-auto px-4 py-2">
            <div class="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                <p class="text-sm text-gray-500 text-center md:text-left">
                    &copy; 2025 Hüseyin Atılgan | Açık Kaynak Proje
                </p>
                <div class="text-center md:text-right">
                    <p class="text-xs text-gray-500">
                        Bu uygulama açık kaynak bir projedir. Ticari amaçla kullanılamaz. 
                        Veriler Kandilli Rasathanesi'nden alınmaktadır.
                    </p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html> 