// src/js/main.js
import { AppController } from './core/AppController.js';
import { loadFeatures } from './core/featureLoader.js';

/**
 * Punctul de intrare principal al aplicației.
 * Acum este complet asincron pentru a permite încărcarea modulelor.
 */
async function startApp() {
    // 1. Încarcă dinamic toate modulele disponibile
    const features = await loadFeatures();

    // 2. Creează și pornește controller-ul, transmițând modulele
    const app = new AppController(features);
    await app.init();
    
    // Expunere pentru depanare
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.plantApp = app;
    }

    return app;
}

// --- Pornirea aplicației ---
window.addEventListener("load", startApp);