// src/js/core/AppController.js

import store from '../store/index.js';
import { actionTypes } from '../store/actionTypes.js';
import { bootstrapApp } from './bootstrap.js';
import { bindEventListeners, unbindEventListeners } from './eventManager.js';
import { syncStateToUI } from './uiSync.js';
import { showNotification } from '../components/NotificationService.js';
import { getStateFromURL } from '../services/urlService.js';
import { initializeTheme } from '../ui/ThemeToggle.js';
import { TIMINGS } from '../utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';
import { fetchAllPlants, loadFaqData } from '../services/plantService.js';
import { processAllPlants } from '../services/plantLogic.js';
import * as favoriteActions from '../features/favorites/favoritesActions.js';
import { openPlantModal } from '../features/plants/plantsActions.js';
import { openFaq } from '../features/faq/faqActions.js';

export class AppController {
    #dom;
    #components;
    #isInitialized = false;

    constructor() {
        this.#dom = null;
        this.#components = null;
    }

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

    async #loadCoreData() {
        store.dispatch({ type: actionTypes.SET_IS_LOADING, payload: true });
        
        const rawPlantsData = await fetchAllPlants(); 
        const processedPlants = processAllPlants(rawPlantsData);
        const allTags = processedPlants.flatMap((p) => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        
        store.dispatch({
            type: actionTypes.SET_INITIAL_DATA,
            payload: {
                plants: processedPlants,
                uniqueTags: uniqueTags,
            }
        });

        favoriteActions.loadFavorites();
    }

    async #initializeStateFromURL() {
        const initialState = getStateFromURL();
        
        if (initialState.query) {
            store.dispatch({ type: actionTypes.SET_QUERY, payload: initialState.query });
        }
        if (initialState.sortOrder) {
            store.dispatch({ type: actionTypes.SET_SORT_ORDER, payload: initialState.sortOrder });
        }
        if (initialState.activeTags) {
            store.dispatch({ type: actionTypes.SET_ACTIVE_TAGS, payload: initialState.activeTags });
        }

        if (initialState.modalPlantId) {
            await store.dispatch(openPlantModal(initialState.modalPlantId));
        }

        if (initialState.isFaqOpen) {
           await store.dispatch(openFaq());
        }
    }

    async init() {
        try {
            initializeGlobalErrorHandler();
            const { dom, components } = bootstrapApp();
            this.#dom = dom;
            this.#components = components;

            initializeTheme();
            bindEventListeners(this.#dom);
            syncStateToUI(this.#dom, this.#components);

            await this.#runIntroAnimation();
            await this.#loadCoreData();
            await this.#initializeStateFromURL();

            showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
            this.#isInitialized = true;
        } catch (err) {
            handleError(err, 'inițializarea aplicației');
        }
    }

    destroy() {
        if (this.#isInitialized && this.#dom) {
            unbindEventListeners(this.#dom);
            console.log("Aplicația a fost curățată.");
        }
    }
}