// --- Importuri ---
// Importăm acțiunile care modifică starea
import * as actions from './core/actions.js';

// Importăm modulele specializate create în urma refactorizării
import { bootstrapApp } from './core/bootstrap.js';
import { bindEventListeners } from './core/eventManager.js';
import { syncStateToUI } from './core/uiSync.js';

// Importăm utilitare și servicii necesare pentru inițializare
import { showNotification } from './components/NotificationService.js';
import { getStateFromURL } from './services/urlService.js';
import { initializeTheme } from './components/ThemeToggle.js';
import { TIMINGS } from './utils/constants.js';

/**
 * Gestionează animația de intro la încărcarea aplicației.
 * @returns {Promise<void>}
 */
function runIntroAnimation() {
    return new Promise((resolve) => {
        const intro = document.getElementById("intro");
        const container = document.querySelector(".container");
        if (!intro || !container) {
            resolve();
            return;
        }
        setTimeout(() => {
            intro.classList.add("out");
            container.classList.add("loaded");
            intro.addEventListener('animationend', () => {
                intro.classList.add('hidden');
                intro.addEventListener('transitionend', () => {
                    intro.remove();
                    resolve();
                }, { once: true });
            }, { once: true });
        }, TIMINGS.INTRO_DELAY);
    });
}

/**
 * Inițializează sistemul global de tooltip-uri inteligente.
 */
function initializeSmartTooltips() {
    const tooltipElement = document.getElementById('app-tooltip');
    if (!tooltipElement) return;

    let currentTarget = null;

    const positionTooltip = () => {
        if (!currentTarget) return;
        const targetRect = currentTarget.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const margin = 10;
        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }
        if (top < margin) top = targetRect.bottom + margin;
        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.left = `${left}px`;
    };
    
    const showTooltip = (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        currentTarget = target;
        tooltipElement.textContent = target.getAttribute('data-tooltip');
        tooltipElement.classList.add('visible');
        tooltipElement.setAttribute('aria-hidden', 'false');
        positionTooltip();
    };

    const hideTooltip = () => {
        currentTarget = null;
        tooltipElement.classList.remove('visible');
        tooltipElement.setAttribute('aria-hidden', 'true');
    };

    document.body.addEventListener('mouseover', showTooltip);
    document.body.addEventListener('mouseout', hideTooltip);
    window.addEventListener('scroll', hideTooltip, true);
}


/**
 * Funcția principală care inițializează întreaga aplicație.
 */
async function main() {
    try {
        // Pasul 1: Inițializează și preia elementele DOM și componentele
        const { dom, components } = bootstrapApp();

        // Pasul 2: Inițializează funcționalități independente
        initializeTheme();
        initializeSmartTooltips();

        // Pasul 3: Atașează toți event listener-ii
        bindEventListeners(dom);

        // Pasul 4: Conectează managerul de stare la UI
        const setInitialized = syncStateToUI(dom, components);

        // Pasul 5: Rulează animația de intro
        await runIntroAnimation();

        // Pasul 6: Încarcă datele inițiale și configurează starea din URL
        await actions.loadInitialData();
        actions.loadFavorites();
        const initialState = getStateFromURL();
        await actions.initialize(initialState);

        // Pasul 7: Marchează aplicația ca fiind complet inițializată
        showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
        setInitialized(true);

    } catch (err) {
        console.error("A apărut o eroare CRITICĂ la inițializarea aplicației:", err);
        showNotification(
            err.message || "Aplicația nu a putut porni. Te rugăm să reîncarci pagina.",
            { type: "error", duration: 0, dismissible: true }
        );
        const intro = document.getElementById("intro");
        if (intro) intro.remove();
    }
}

// Pornirea aplicației după ce pagina s-a încărcat complet
window.addEventListener("load", main);