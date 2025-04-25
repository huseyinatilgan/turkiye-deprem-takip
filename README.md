# Türkiye Deprem Takip Sistemi

Bu proje, Türkiye'deki deprem verilerini gerçek zamanlı olarak takip etmek ve görselleştirmek için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- Kandilli Rasathanesi'nden gerçek zamanlı deprem verileri
- Harita üzerinde deprem konumlarını görselleştirme
- Deprem verilerini filtreleme (büyüklük, şehir, tarih vb.)
- Responsive tasarım
- API endpoints ile veri erişimi

## Teknolojiler

- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Backend: Node.js, Express.js
- Harita: Leaflet.js
- Template Engine: EJS
- Güvenlik: Helmet, Rate Limiting, Input Validation

## Veri Kaynağı

Bu uygulama, Boğaziçi Üniversitesi Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü'nün resmi web sitesinden (http://www.koeri.boun.edu.tr/scripts/lst0.asp) veri çekmektedir. Veriler, web scraping yöntemi ile alınmakta ve gerçek zamanlı olarak güncellenmektedir.

### Veri Çekme Süreci

1. Kandilli Rasathanesi'nin web sitesine HTTP isteği yapılır
2. Gelen HTML içeriği parse edilir
3. Deprem verileri ayrıştırılır ve yapılandırılır
4. Veriler JSON formatında API üzerinden sunulur

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/huseyinatilgan/turkiye-deprem-takip.git
cd turkiye-deprem-takip
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun:
```bash
cp .env.example .env
```

4. Uygulamayı başlatın:
```bash
npm start
```

## API Kullanımı

### Deprem Verilerini Getirme

```http
GET /api
```

#### Query Parametreleri

- `tarih`: Belirli bir tarihteki depremleri filtreleme
- `min`: Minimum büyüklük
- `max`: Maksimum büyüklük
- `sehir`: Şehir bazlı filtreleme

## Güvenlik

- CORS koruması
- Rate limiting
- Input validasyonu
- Helmet güvenlik başlıkları
- JWT authentication
- Winston logging

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Yasal Uyarı

Bu uygulama açık kaynak bir projedir. Ticari amaçla kullanılamaz. Veriler Kandilli Rasathanesi'nden alınmaktadır. Kullanımdan doğabilecek hiçbir sorumluluk kabul edilmemektedir.

## İletişim

Hüseyin Atılgan - [@huseyinatilgan](https://x.com/hsynatilgan)

Proje Linki: [https://github.com/huseyinatilgan/turkiye-deprem-takip](https://github.com/huseyinatilgan/turkiye-deprem-takip)