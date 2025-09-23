// src/js/main.js

import { AppController } from './core/AppController.js';

/**
 * Punctul de intrare principal al aplicației.
 * Creează și pornește controller-ul.
 */
async function startApp() {
    const app = new AppController();
    await app.init();
    
    // Expunem instanța pe window pentru depanare, într-un mod explicit.
    // Aceasta se va întâmpla doar dacă aplicația rulează local.
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.plantApp = app;
    }

    return app;
}

// --- Pornirea aplicației ---
window.addEventListener("load", startApp);