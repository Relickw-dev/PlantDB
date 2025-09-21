// server.js
require('dotenv').config();
require('express-async-errors'); // Important: trebuie să fie la început

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const plantRoutes = require('./routes/plants');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware de Securitate și Utilitare ---
app.use(helmet()); // Adaugă headere de securitate (XSS protection, etc.)
app.use(cors()); // Permite cereri de la alte origini (frontend)
app.use(express.json()); // Parsează body-urile JSON

// --- Middleware pentru Rate Limiting ---
// Protejează împotriva atacurilor de tip brute-force sau a abuzului de API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: 150, // Limitează fiecare IP la 150 de cereri în intervalul specificat
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Prea multe cereri de la acest IP, te rugăm să încerci din nou după 15 minute.',
});
app.use('/api/', limiter); // Aplică limitarea doar pe rutele de API

// --- Rutele aplicației ---
app.use('/api/plants', plantRoutes);

// Pagină de start a serverului
app.get('/', (req, res) => {
    res.send('👋 Serverul pentru baza de date de plante este funcțional!');
});

// --- Middleware Centralizat pentru Gestionarea Erorilor ---
// Orice eroare aruncată în rutele async va fi prinsă aici
app.use((err, req, res, next) => {
    console.error(err.stack); // Loghează eroarea completă în consolă pentru debugging
    res.status(500).json({ message: 'A apărut o eroare neașteptată pe server.' });
});

app.listen(port, () => {
    console.log(`🚀 Serverul a pornit pe http://localhost:${port}`);
    console.log(`👉 Testează lista de plante: http://localhost:${port}/api/plants`);
    console.log(`👉 Testează o plantă specifică: http://localhost:${port}/api/plants/1`);
});