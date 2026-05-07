import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000', 10);
const API_URL = process.env.API_URL || 'https://gps.eainfospa.cl/api/0/last';

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("ERROR: Debes configurar TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el archivo .env");
  process.exit(1);
}

// Funciones matemáticas para Geozonas
function toRad(value) {
    return value * Math.PI / 180;
}

// Distancia de Haversine (en metros)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Ray-casting para detectar si un punto está en un polígono
function isPointInPolygon(point, polygon) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Definición de las Geozonas
const ZONAS = [
    {
        nombre: "Casa Villarrica",
        tipo: "poligono",
        coordenadas: [
            [-39.301071560206765, -72.13109388410716], 
            [-39.30094270013873, -72.13167443376919],
            [-39.301142288736976, -72.13174209063587],
            [-39.301276745426705, -72.13118333817616]
        ]
    },
    {
        nombre: "LINK",
        tipo: "poligono",
        coordenadas: [
            [-39.29224271334056, -72.22035904953707], 
            [-39.29180463267189, -72.2209410469356],
            [-39.29222740762126, -72.2214622614752],
            [-39.292636366618474, -72.22076639359462]
        ]
    },
    {
        nombre: "Casa Pastores",
        tipo: "circulo",
        centro: [-39.2957, -72.3095],
        radio: 50 // metros
    },
    {
        nombre: "Casa Suegros",
        tipo: "poligono",
        coordenadas: [
            [-39.27943088879638, -72.23605462970889], 
            [-39.27932811132069, -72.23618970174],
            [-39.279382240125535, -72.23625420109593],
            [-39.279493495928385, -72.23608846476654]
        ]
    },
    {
        nombre: "CAH",
        tipo: "poligono",
        coordenadas: [
            [-39.29101307400173, -72.2259796852233], 
            [-39.29018518392449, -72.22726826154994],
            [-39.29103356903594, -72.22829208189005],
            [-39.291286161063994, -72.22798037780153],
            [-39.29165359383031, -72.22844444032053],
            [-39.29190545469998, -72.22852588130993],
            [-39.292411274230815, -72.22931353184902],
            [-39.29287903258098, -72.22879519212238],
            [-39.29205717501899, -72.22784851877874],
            [-39.29165190821916, -72.2275123320466],
            [-39.29239720319361, -72.22627248895935]
        ]
    }
];

const emojis = {
  "JoseLuis": "🤖",
  "joaquin": "🦖",
  "CeluJosefa": "🦄",
  "AutoFamiliar": "🚙"
};

// Memoria de dónde estaba cada dispositivo
const state = {};

async function sendTelegramMessage(text) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: text
        });
        console.log(`[Telegram Enviado] ${text}`);
    } catch (err) {
        console.error("[Error Telegram]", err.message);
    }
}

async function checkLocations() {
    try {
        const res = await axios.get(API_URL);
        const data = res.data;

        for (const disp of data) {
            const id = disp.topic;
            const nombre = disp.topic.split('/').pop();
            const emoji = emojis[nombre] || "📱";
            const currentZones = [];

            // Comprobar en qué zonas está actualmente
            for (const zona of ZONAS) {
                if (zona.tipo === 'poligono') {
                    if (isPointInPolygon([disp.lat, disp.lon], zona.coordenadas)) {
                        currentZones.push(zona.nombre);
                    }
                } else if (zona.tipo === 'circulo') {
                    const dist = getDistance(disp.lat, disp.lon, zona.centro[0], zona.centro[1]);
                    if (dist <= zona.radio) {
                        currentZones.push(zona.nombre);
                    }
                }
            }

            if (!state[id]) {
                state[id] = [];
            }
            const previousZones = state[id];

            // Detectar entradas
            for (const z of currentZones) {
                if (!previousZones.includes(z)) {
                    await sendTelegramMessage(`📍 ${emoji} ${nombre} ha entrado a: ${z}`);
                }
            }

            // Detectar salidas
            for (const z of previousZones) {
                if (!currentZones.includes(z)) {
                    await sendTelegramMessage(`👋 ${emoji} ${nombre} ha salido de: ${z}`);
                }
            }

            // Actualizar memoria
            state[id] = currentZones;
        }
    } catch (err) {
        console.error("[Error API]", err.message);
    }
}

console.log("🚀 Bot de Monitoreo GPS Iniciado...");
checkLocations();
setInterval(checkLocations, POLL_INTERVAL);
