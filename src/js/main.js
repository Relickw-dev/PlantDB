// src/js/main.js

// --- Importuri ---
import * as actions from './core/actions.js';
import { bootstrapApp } from './core/bootstrap.js';
import { bindEventListeners, unbindEventListeners } from './core/eventManager.js';
import { syncStateToUI } from './core/uiSync.js';
import { showNotification } from './components/NotificationService.js';
import { getStateFromURL } from './services/urlService.js';
import { initializeTheme } from './components/ThemeToggle.js';
import { TIMINGS } from './utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './core/errorHandler.js';


/**
 * Gestionează animația de intro la încărcarea aplicației.
 * @param {HTMLElement} intro - Elementul intro.
 * @param {HTMLElement} container - Containerul principal al aplicației.
 * @returns {Promise<void>}
 */
function runIntroAnimation(intro, container) {
    return new Promise((resolve) => {
        if (!intro || !container) {
            return resolve();
        }

        // Se asigură că elementul este eliminat după ce animația și tranziția s-au terminat.
        const onAnimationEnd = () => {
            intro.classList.add('hidden');
            intro.addEventListener('transitionend', () => intro.remove(), { once: true });
            resolve();
        };
        
        setTimeout(() => {
            intro.classList.add("out");
            container.classList.add("loaded");
            intro.addEventListener('animationend', onAnimationEnd, { once: true });
        }, TIMINGS.INTRO_DELAY);
    });
}

/**
 * Funcția principală care inițializează întreaga aplicație.
 * @returns {Object} Un obiect cu o funcție `destroy` pentru cleanup.
 */
async function main() {
    let dom; // Stocăm referințele DOM pentru a le folosi în `destroy`
    let eventListenersBound = false;

    try {
        // --- Pasul 1: Inițializează și preia elementele DOM și componentele ---
        const { dom: domElements, components } = bootstrapApp();
        dom = domElements; // Salvăm referințele
        initializeGlobalErrorHandler();

        // --- Pasul 2: Inițializează funcționalități independente ---
        initializeTheme();

        // --- Pasul 3: Atașează toți event listener-ii ---
        bindEventListeners(dom);
        eventListenersBound = true;

        // --- Pasul 4: Conectează managerul de stare la UI ---
        const setInitialized = syncStateToUI(dom, components);

        // --- Pasul 5: Rulează animația de intro ---
        await runIntroAnimation(dom.intro, dom.appContainer);

        // --- Pasul 6: Încarcă datele și configurează starea din URL ---
        await actions.loadInitialData();
        actions.loadFavorites();
        const initialState = getStateFromURL();
        await actions.initialize(initialState);

        // --- Pasul 7: Marchează aplicația ca fiind complet inițializată ---
        showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
        setInitialized(true);

    } catch (err) {
        handleError(err, 'inițializarea aplicației');
    }
    
    /**
     * Funcție de cleanup.
     * Detașează toți listener-ii globali pentru a preveni memory leaks.
     */
    return {
        destroy: () => {
            if (eventListenersBound && dom) {
                unbindEventListeners(dom); // Folosim referințele `dom` deja existente
            }
            console.log("Aplicația a fost curățată.");
        }
    };
}

// --- Pornirea aplicației ---
window.addEventListener("load", async () => {
    const appInstance = await main();
    // Expunem instanța pe window pentru depanare, într-un mod explicit
    window.plantApp = appInstance;
});