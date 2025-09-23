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
import { TIMINGS } from '../utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';
import { fetchAllPlants } from '../services/plantService.js';
import { processAllPlants } from '../services/plantLogic.js';
// Acțiunile specifice vor fi importate dinamic sau nu vor mai fi necesare aici
import { openPlantModal } from '../features/plants/plantsActions.js';
import { openFaq } from '../features/faq/faqActions.js';
import * as favoriteActions from '../features/favorites/favoritesActions.js';

export class AppController {
    #features;
    #store;
    #dom;
    #components;
    #isInitialized = false;

    constructor(features) {
        this.#features = features;
        this.#dom = null;
        this.#components = {}; // Va fi populat dinamic
        this.#store = null;
    }

    async init() {
        try {
            // 1. Inițializează mecanismele de bază
            initializeGlobalErrorHandler();
            const { dom, components: baseComponents } = bootstrapApp();
            this.#dom = dom;
            this.#components = { ...baseComponents };

            // 2. Construiește dinamic store-ul și componentele pe baza modulelor încărcate
            const rootReducer = createRootReducer(this.#features);
            // Starea inițială este acum goală; fiecare reducer își va aduce propria stare inițială
            this.#store = createStore({}, rootReducer); 

            this.#features.forEach(feature => {
                if (feature.initComponents) {
                    const featureComponents = feature.initComponents(this.#dom, this.#store);
                    this.#components = { ...this.#components, ...featureComponents };
                }
            });

            // 3. Conectează evenimentele și sincronizarea cu UI
            initializeTheme(); // Tema poate rămâne o funcționalitate de bază
            
            // Leagă evenimentele de bază și cele din module
            bindEventListeners(this.#dom, this.#store); // eventManager primește store-ul
            this.#features.forEach(feature => {
                if (feature.bindEvents) {
                    feature.bindEvents(this.#dom, this.#store);
                }
            });

            // Pornește sincronizarea UI cu starea din store
            syncStateToUI(this.#dom, this.#components, this.#store);

            // 4. Rulează secvența de pornire a aplicației
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
        this.#store.dispatch({ type: actionTypes.SET_IS_LOADING, payload: true });
        
        const rawPlantsData = await fetchAllPlants(); 
        const processedPlants = processAllPlants(rawPlantsData);
        const allTags = processedPlants.flatMap((p) => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        
        this.#store.dispatch({
            type: actionTypes.SET_INITIAL_DATA,
            payload: {
                plants: processedPlants,
                uniqueTags: uniqueTags,
            }
        });

        // Favoritele sunt un feature, deci acțiunea e apelată direct
        favoriteActions.loadFavorites();
    }

    async #initializeStateFromURL() {
        const initialState = getStateFromURL();
        
        if (initialState.query) {
            this.#store.dispatch({ type: actionTypes.SET_QUERY, payload: initialState.query });
        }
        if (initialState.sortOrder) {
            this.#store.dispatch({ type: actionTypes.SET_SORT_ORDER, payload: initialState.sortOrder });
        }
        if (initialState.activeTags) {
            this.#store.dispatch({ type: actionTypes.SET_ACTIVE_TAGS, payload: initialState.activeTags });
        }

        // Deschiderea modalelor trebuie să fie gestionată prin dispatch
        if (initialState.modalPlantId) {
            await this.#store.dispatch(openPlantModal(initialState.modalPlantId));
        }

        if (initialState.isFaqOpen) {
           await this.#store.dispatch(openFaq());
        }
    }

    destroy() {
        if (this.#isInitialized && this.#dom) {
            // Aici ar trebui adaptat și unbindEventListeners pentru a primi și features
            unbindEventListeners(this.#dom);
            console.log("Aplicația a fost curățată.");
        }
    }
}