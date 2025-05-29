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
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Güvenlik için gerekli sabitler
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret';

// Logger yapılandırması
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Güvenlik middleware'leri
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS yapılandırması
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına limit
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
});

// Session yapılandırması
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
    }
}));

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization
app.use(mongoSanitize()); // NoSQL injection koruması
app.use(xss()); // XSS koruması
app.use(hpp()); // HTTP Parameter Pollution koruması

// API rate limiting
app.use('/api', apiLimiter);

// JWT doğrulama middleware'i
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
};

// Deprem verisi doğrulama fonksiyonu
const validateDepremData = (data) => {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['tarih', 'saat', 'enlem', 'boylam', 'derinlik', 'buyukluk', 'yer', 'sehir'];
    for (const field of requiredFields) {
        if (!data[field]) return false;
    }

    // Sayısal değerlerin kontrolü
    if (isNaN(parseFloat(data.enlem)) || isNaN(parseFloat(data.boylam)) || 
        isNaN(parseFloat(data.derinlik)) || isNaN(parseFloat(data.buyukluk))) {
        return false;
    }

    return true;
};

// Request timeout ve retry mekanizması
const requestWithRetry = async (url, options = {}, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                timeout: 5000
            });
            return response;
        } catch (error) {
            logger.error(`Request attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

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
    try {
        const depremler = [];
        const response = await requestWithRetry("http://www.koeri.boun.edu.tr/scripts/lst0.asp");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const responseText = $("pre").text();
        const result = responseText.split("\n").slice(6);

        for (const element of result) {
            const depremBilgi = element.split(" ").filter(item => item.length > 0);
            
            if (depremBilgi.length < 10) continue;

            const deprem = new Deprem(
                depremBilgi[0],
                depremBilgi[1],
                depremBilgi[2],
                depremBilgi[3],
                depremBilgi[4],
                depremBilgi[6],
                depremBilgi[8],
                depremBilgi[9]
            );

            if (validateDepremData(deprem)) {
                depremler.push(deprem);
            }
        }

        logger.info(`Deprem verisi başarıyla alındı. Toplam: ${depremler.length}`);
        return depremler;
    } catch (error) {
        logger.error('Deprem verisi alınırken hata oluştu:', error);
        throw error;
    }
}

// Ana sayfa
app.get("/", function (req, res) {
    res.render("index.ejs");
});

// API endpoint'leri
app.get('/api/v1/depremler', [
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

// Socket.IO güvenlik
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decoded;
        next();
    });
});

io.on('connection', function (socket) {
    logger.info(`User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Bir hata oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, function () {
    logger.info(`Server running on port ${PORT}`);
});