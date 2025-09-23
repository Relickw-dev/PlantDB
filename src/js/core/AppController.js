// src/js/core/AppController.js
import { createStore } from '../store/createStore.js';
import { createRootReducer } from '../store/rootReducer.js';
import { actionTypes } from '../store/actionTypes.js';
import { bootstrapApp } from './bootstrap.js';
import { bindEventListeners, unbindEventListeners } from './eventManager.js';
import { syncStateToUI } from './uiSync.js';
import { showNotification } from '../components/NotificationService.js';
import { getStateFromURL } from '../services/urlService.js';
import { initializeTheme } from '../ui/ThemeToggle.js';
import { TIMINGS, DEFAULT_STATE } from '../utils/constants.js'; // Am adăugat DEFAULT_STATE
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';
import { fetchAllPlants } from '../services/plantService.js';
import { processAllPlants } from '../services/plantLogic.js';
import { openPlantModal } from '../features/plants/plantsActions.js';
import { openFaq } from '../features/faq/faqActions.js';
import { loadFavorites } from '../features/favorites/favoritesActions.js'; // Adăugat pentru a încărca favoritele

export class AppController {
    #features;
    #store;
    #dom;
    #components;
    #isInitialized = false;

    constructor(features) {
        this.#features = features;
        this.#dom = null;
        this.#components = {};
        this.#store = null;
    }

    async init() {
        try {
            initializeGlobalErrorHandler();
            const { dom, components: baseComponents } = bootstrapApp();
            this.#dom = dom;
            this.#components = { ...baseComponents };

            const rootReducer = createRootReducer(this.#features);
            // Inițializăm store-ul cu starea implicită
            this.#store = createStore(DEFAULT_STATE, rootReducer);

            this.#features.forEach(feature => {
                if (feature.initComponents) {
                    const featureComponents = feature.initComponents(this.#dom, this.#store);
                    this.#components = { ...this.#components, ...featureComponents };
                }
            });

            initializeTheme();
            bindEventListeners(this.#dom, this.#store);
            this.#features.forEach(feature => {
                if (feature.bindEvents) {
                    feature.bindEvents(this.#dom, this.#store);
                }
            });
            // Pasăm store-ul către funcția de sincronizare
            syncStateToUI(this.#dom, this.#components, this.#store);

            // Încărcăm favoritele salvate la pornire
            this.#store.dispatch(loadFavorites());

            await this.#runIntroAnimation();
            await this.#loadCoreData();
            await this.#initializeStateFromURL();

            showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
            this.#isInitialized = true;

        } catch (err) {
            handleError(err, 'inițializarea aplicației');
        }
    }
    
    #runIntroAnimation() {
        return new Promise((resolve) => {
            if (!this.#dom.intro) return resolve();
            setTimeout(() => {
                this.#dom.intro.classList.add("out");
                this.#dom.appContainer.classList.add("loaded");
                this.#dom.intro.addEventListener('animationend', () => {
                    this.#dom.intro.remove();
                    resolve();
                }, { once: true });
            }, TIMINGS.INTRO_DELAY);
        });
    }

    async #loadCoreData() {
        this.#store.dispatch({ type: actionTypes.SET_IS_LOADING, payload: true });
        const rawPlantsData = await fetchAllPlants();
        const processedPlants = processAllPlants(rawPlantsData);
        const uniqueTags = [...new Set(processedPlants.flatMap(p => p.tags || []))].sort();
        this.#store.dispatch({
            type: actionTypes.SET_INITIAL_DATA,
            payload: { plants: processedPlants, uniqueTags }
        });
    }

    async #initializeStateFromURL() {
        const initialState = getStateFromURL();
        if (initialState.query) this.#store.dispatch({ type: actionTypes.SET_QUERY, payload: initialState.query });
        if (initialState.sortOrder) this.#store.dispatch({ type: actionTypes.SET_SORT_ORDER, payload: initialState.sortOrder });
        if (initialState.activeTags) this.#store.dispatch({ type: actionTypes.SET_ACTIVE_TAGS, payload: initialState.activeTags });
        if (initialState.modalPlantId) await this.#store.dispatch(openPlantModal(initialState.modalPlantId));
        if (initialState.isFaqOpen) await this.#store.dispatch(openFaq());
    }

    destroy() {
        if (this.#isInitialized) {
            unbindEventListeners();
            console.log("Aplicația a fost curățată.");
        }
    }
}