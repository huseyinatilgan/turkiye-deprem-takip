require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const ejs = require('ejs');
const request = require("request");
const cheerio = require("cheerio");

// Logger yapılandırması
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/app.log' }),
        new winston.transports.Console()
    ]
});

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api', limiter);

class Deprem {
    constructor(tarih, saat, enlem, boylam, derinlik, buyukluk, yer, sehir) {
        this.tarih = tarih;
        this.saat = saat;
        this.enlem = enlem;
        this.boylam = boylam;
        this.derinlik = derinlik;
        this.buyukluk = buyukluk;
        this.yer = yer;
        this.sehir = sehir;
    }
}

app.engine('.ejs', ejs.__express);
app.set('views', __dirname + '/views/');

async function getirDepremler() {
    var depremler = [];
    request("http://www.koeri.boun.edu.tr/scripts/lst0.asp", (error, response, html) => {
        if (!error && response.statusCode == 200) {

            const $ = cheerio.load(html);

            /* Burada Toplu Olarak Html'den Gelen Veri Geldi */
            const response = $("pre").text();

            /* Gelen Verileri Satır Satır Ayırma Ve İlk Baştaki 6 Satırı Silme İşlemi */
            var result = response.split("\n");
            result = result.splice(6, result.length + 1);

            /* Her Bir Satiri Dolasma Islemi */
            result.forEach(element => {
                var depremString = element.split(" ");
                var depremBilgi = [];
                for (var i = 0; i < depremString.length; i++) {
                    if (depremString[i].length > 0) {
                        depremBilgi.push(depremString[i]);
                    }
                }

                var tarih = depremBilgi[0];
                var saat = depremBilgi[1];
                var enlem = depremBilgi[2];
                var boylam = depremBilgi[3];
                var derinlik = depremBilgi[4];
                var buyukluk = depremBilgi[6];
                var yer = depremBilgi[8];
                var sehir = depremBilgi[9];

                var deprem = new Deprem(tarih, saat, enlem, boylam, derinlik, buyukluk, yer, sehir);
                depremler.push(deprem);
            });

            console.log("Deprem Tarama Islemi Tamamlandi. Deprem Sayisi : " + depremler.length);
        }
    });
    return depremler;
}

// 10 saniyede 1 islem yapma
// setInterval(getirDepremler, 10000);

app.get("/", function (req, res) {
    res.render("index.ejs");
});

/* Api Sayfasi */
app.get('/api', [
    body('tarih').optional().isDate(),
    body('min').optional().isFloat({ min: 0, max: 10 }),
    body('max').optional().isFloat({ min: 0, max: 10 }),
    body('sehir').optional().isString().trim().escape()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const depremler = await getirDepremler();
        
        // Filtreleme işlemleri
        let filteredDepremler = [...depremler];

        if (req.query.tarih) {
            filteredDepremler = filteredDepremler.filter(x => x.tarih === req.query.tarih);
        }

        if (req.query.min) {
            filteredDepremler = filteredDepremler.filter(x => parseFloat(x.buyukluk) >= parseFloat(req.query.min));
        }

        if (req.query.max) {
            filteredDepremler = filteredDepremler.filter(x => parseFloat(x.buyukluk) <= parseFloat(req.query.max));
        }

        if (req.query.sehir) {
            filteredDepremler = filteredDepremler.filter(x => x.sehir === req.query.sehir);
        }

        logger.info(`API request successful. Filtered ${filteredDepremler.length} earthquakes`);
        res.json(filteredDepremler);
    } catch (error) {
        logger.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

io.on('connection', function (socket) {
    console.log('User connected');
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, function () {
    console.log('The app is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Bir hata oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});