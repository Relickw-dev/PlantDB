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
 * O clasă dedicată pentru a gestiona sistemul de tooltip-uri.
 * Încapsulează logica și elementul DOM, eliminând dependențele globale.
 */
class TooltipService {
    #tooltipElement;
    #currentTarget = null;

    constructor(elementId) {
        this.#tooltipElement = document.getElementById(elementId);
        if (!this.#tooltipElement) {
            console.warn(`Elementul pentru tooltip #${elementId} nu a fost găsit.`);
            return;
        }
        // Folosim funcții "arrow" pentru a păstra contextul 'this' corect
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
    }

    _position() {
        if (!this.#currentTarget || !this.#tooltipElement) return;

        const targetRect = this.#currentTarget.getBoundingClientRect();
        const tooltipRect = this.#tooltipElement.getBoundingClientRect();
        const margin = 10;

        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Prevenim ieșirea din ecran
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }
        if (top < margin) { // Dacă nu încape sus, îl punem jos
            top = targetRect.bottom + margin;
        }

        this.#tooltipElement.style.top = `${top}px`;
        this.#tooltipElement.style.left = `${left}px`;
    }

    show(e) {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        this.#currentTarget = target;
        this.#tooltipElement.textContent = this.#currentTarget.getAttribute('data-tooltip');
        this.#tooltipElement.classList.add('visible');
        this.#tooltipElement.setAttribute('aria-hidden', 'false');
        this._position();
    }

    hide() {
        if (!this.#currentTarget) return;
        this.#currentTarget = null;
        this.#tooltipElement.classList.remove('visible');
        this.#tooltipElement.setAttribute('aria-hidden', 'true');
    }

    // Metode pentru a atașa și detașa evenimentele
    attach() {
        if (!this.#tooltipElement) return;
        document.body.addEventListener('mouseover', this.show);
        document.body.addEventListener('mouseout', this.hide);
        window.addEventListener('scroll', this.hide, { capture: true });
    }

    detach() {
        if (!this.#tooltipElement) return;
        document.body.removeEventListener('mouseover', this.show);
        document.body.removeEventListener('mouseout', this.hide);
        window.removeEventListener('scroll', this.hide, { capture: true });
    }
}


/**
 * Gestionează animația de intro la încărcarea aplicației.
 * @returns {Promise<void>}
 */
function runIntroAnimation() {
    return new Promise((resolve) => {
        const intro = document.getElementById("intro");
        const container = document.querySelector(".container");
        if (!intro || !container) {
            return resolve();
        }

        const onAnimationEnd = () => {
            intro.classList.add('hidden');
            // Folosim transitionend pentru a ne asigura că tranzitia de opacitate s-a terminat
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
    let tooltipService;
    let eventListenersBound = false;

    try {
        // --- Pasul 1: Inițializează și preia elementele DOM și componentele ---
        const { dom, components } = bootstrapApp();
        initializeGlobalErrorHandler();

        // --- Pasul 2: Inițializează funcționalități independente ---
        initializeTheme();
        tooltipService = new TooltipService('app-tooltip');
        tooltipService.attach();

        // --- Pasul 3: Atașează toți event listener-ii ---
        bindEventListeners(dom);
        eventListenersBound = true;

        // --- Pasul 4: Conectează managerul de stare la UI ---
        const setInitialized = syncStateToUI(dom, components);

        // --- Pasul 5: Rulează animația de intro ---
        await runIntroAnimation();

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
     * NOU: Funcție de cleanup.
     * Detașează toți listener-ii globali pentru a preveni memory leaks.
     */
    return {
        destroy: () => {
            if (eventListenersBound) {
                const { dom } = bootstrapApp(); // Re-preluăm DOM-ul pentru a fi siguri
                unbindEventListeners(dom);
            }
            if (tooltipService) {
                tooltipService.detach();
            }
            console.log("Aplicația a fost curățată.");
        }
    };
}

// --- Pornirea aplicației ---
let appInstance;
window.addEventListener("load", async () => {
    appInstance = await main();
});

// Pentru depanare sau scenarii avansate, poți apela `appInstance.destroy()` din consolă.