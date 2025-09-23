// src/js/core/AppController.js

import * as actions from './actions.js';
import { bootstrapApp } from './bootstrap.js';
import { bindEventListeners, unbindEventListeners } from './eventManager.js';
import { syncStateToUI } from './uiSync.js';
import { showNotification } from '../components/NotificationService.js';
import { getStateFromURL } from '../services/urlService.js';
import { initializeTheme } from '../components/ThemeToggle.js';
import { TIMINGS } from '../utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';

/**
 * Orchestrează întregul ciclu de viață al aplicației, de la inițializare la distrugere.
 */
export class AppController {
    #dom;
    #components;
    #isInitialized = false;

    constructor() {
        this.#dom = null;
        this.#components = null;
    }

    /**
     * Gestionează animația de intro la încărcarea aplicației.
     * @private
     */
    #runIntroAnimation() {
        return new Promise((resolve) => {
            if (!this.#dom.intro || !this.#dom.appContainer) {
                return resolve();
            }

            const onAnimationEnd = () => {
                this.#dom.intro.classList.add('hidden');
                this.#dom.intro.addEventListener('transitionend', () => this.#dom.intro.remove(), { once: true });
                resolve();
            };
            
            setTimeout(() => {
                this.#dom.intro.classList.add("out");
                this.#dom.appContainer.classList.add("loaded");
                this.#dom.intro.addEventListener('animationend', onAnimationEnd, { once: true });
            }, TIMINGS.INTRO_DELAY);
        });
    }

    /**
     * Inițializează întreaga aplicație pas cu pas.
     */
    async init() {
        try {
            // Pasul 1: Inițializează handler-ul global de erori
            initializeGlobalErrorHandler();

            // Pasul 2: Bootstrap - preia elementele DOM și inițializează componentele
            const { dom, components } = bootstrapApp();
            this.#dom = dom;
            this.#components = components;

            // Pasul 3: Inițializează funcționalități independente (ex: tema)
            initializeTheme();

            // Pasul 4: Atașează toți event listener-ii
            bindEventListeners(this.#dom);

            // Pasul 5: Conectează managerul de stare la UI
            const setInitialized = syncStateToUI(this.#dom, this.#components);

            // Pasul 6: Rulează animația de intro
            await this.#runIntroAnimation();

            // Pasul 7: Încarcă datele esențiale și configurează starea din URL
            await actions.loadInitialData();
            actions.loadFavorites();
            const initialState = getStateFromURL();
            await actions.initialize(initialState);

            // Pasul 8: Marchează aplicația ca fiind complet inițializată
            showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
            setInitialized(true);
            this.#isInitialized = true;

        } catch (err) {
            handleError(err, 'inițializarea aplicației');
        }
    }

    /**
     * Curăță resursele și event listener-ii.
     */
    destroy() {
        if (this.#isInitialized && this.#dom) {
            unbindEventListeners(this.#dom);
            console.log("Aplicația a fost curățată.");
        }
    }
}