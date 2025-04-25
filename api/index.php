<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Hata raporlamayı aç
error_reporting(E_ALL);
ini_set('display_errors', 0); // Hata mesajlarını JSON olarak döndüreceğiz

try {
    // allow_url_fopen kontrolü
    if (!ini_get('allow_url_fopen')) {
        // CURL alternatifi
        if (!function_exists('curl_init')) {
            throw new Exception('Sunucuda CURL veya allow_url_fopen desteği bulunmuyor.');
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'http://www.koeri.boun.edu.tr/scripts/lst0.asp');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $html = curl_exec($ch);
        
        if (curl_errno($ch)) {
            throw new Exception('CURL Hatası: ' . curl_error($ch));
        }
        
        curl_close($ch);
    } else {
        // file_get_contents ile dene
        $ctx = stream_context_create(['http' => ['timeout' => 30]]);
        $html = file_get_contents('http://www.koeri.boun.edu.tr/scripts/lst0.asp', false, $ctx);
    }
    
    if ($html === false) {
        throw new Exception('Kandilli Rasathanesi\'nden veri çekilemedi. Lütfen daha sonra tekrar deneyin.');
    }

    // Veriyi UTF-8'e çevir
    $html = mb_convert_encoding($html, 'UTF-8', 'ISO-8859-9');
    
    // Pre tag içindeki veriyi al
    preg_match('/<pre>(.*?)<\/pre>/s', $html, $matches);
    
    if (empty($matches[1])) {
        throw new Exception('Veri formatı uygun değil. Kaynak siteden veri formatı değişmiş olabilir.');
    }

    $data = $matches[1];
    $lines = explode("\n", $data);
    
    // İlk 6 satırı atla
    $lines = array_slice($lines, 6);
    
    $earthquakes = [];
    
    foreach ($lines as $line) {
        if (empty(trim($line))) continue;
        
        $parts = preg_split('/\s+/', trim($line));
        
        if (count($parts) < 9) continue;
        
        $earthquake = [
            'tarih' => $parts[0],
            'saat' => $parts[1],
            'enlem' => $parts[2],
            'boylam' => $parts[3],
            'derinlik' => $parts[4],
            'buyukluk' => $parts[6],
            'yer' => $parts[8],
            'sehir' => isset($parts[9]) ? $parts[9] : null
        ];
        
        $earthquakes[] = $earthquake;
    }
    
    // Filtreleme işlemleri
    if (isset($_GET['min'])) {
        $min = floatval($_GET['min']);
        $earthquakes = array_filter($earthquakes, function($eq) use ($min) {
            return floatval($eq['buyukluk']) >= $min;
        });
    }
    
    if (isset($_GET['max'])) {
        $max = floatval($_GET['max']);
        $earthquakes = array_filter($earthquakes, function($eq) use ($max) {
            return floatval($eq['buyukluk']) <= $max;
        });
    }
    
    if (isset($_GET['sehir'])) {
        $sehir = $_GET['sehir'];
        $earthquakes = array_filter($earthquakes, function($eq) use ($sehir) {
            return $eq['sehir'] === $sehir;
        });
    }
    
    if (isset($_GET['tarih'])) {
        $tarih = $_GET['tarih'];
        $earthquakes = array_filter($earthquakes, function($eq) use ($tarih) {
            return $eq['tarih'] === $tarih;
        });
    }
    
    echo json_encode(array_values($earthquakes), JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => [
            'allow_url_fopen' => ini_get('allow_url_fopen') ? 'Açık' : 'Kapalı',
            'curl_enabled' => function_exists('curl_init') ? 'Var' : 'Yok',
            'php_version' => PHP_VERSION
        ]
    ], JSON_UNESCAPED_UNICODE);
} 