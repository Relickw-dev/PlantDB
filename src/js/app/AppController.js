// src/js/app/AppController.js
import { createStore } from '../shared/store/createStore.js';
import { createRootReducer } from '../shared/store/rootReducer.js';
import { actionTypes } from '../shared/store/actionTypes.js';
import { bootstrapApp } from './bootstrap.js';
// ELIMINAT: import { bindEventListeners, unbindEventListeners } from './eventManager.js';
import { showNotification } from '../shared/components/NotificationService.js';
import { getStateFromURL, updateURLFromState } from '../shared/services/urlService.js';
import { initializeTheme } from '../features/theme/services/themeService.js';
import { TIMINGS, DEFAULT_STATE } from '../shared/utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';
import { fetchAllPlants } from '../features/plants/services/plantService.js';
import { processAllPlants } from '../features/plants/services/plantLogic.js';
import { openPlantModal } from '../features/plants/plantsActions.js';
import { openFaq } from '../features/faq/faqActions.js';
import { loadFavorites } from '../features/favorites/favoritesActions.js';
import { debounce } from '../shared/utils/helpers.js';

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
            this.#store = createStore(DEFAULT_STATE, rootReducer);

            this.#features.forEach(feature => {
                if (feature.initComponents) {
                    const featureComponents = feature.initComponents(this.#dom, this.#store);
                    this.#components = { ...this.#components, ...featureComponents };
                }
            });

            initializeTheme();
            // ELIMINAT: bindEventListeners(this.#dom, this.#store);

            // Fiecare modul își leagă acum propriile evenimente, inclusiv cele globale.
            this.#features.forEach(feature => {
                if (feature.bindEvents) {
                    feature.bindEvents(this.#dom, this.#store);
                }
            });

            this.#store.dispatch(loadFavorites());

            await this.#runIntroAnimation();
            await this.#loadCoreData();
            await this.#initializeStateFromURL();
            
            this.#setupUISync();

            showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
            this.#isInitialized = true;

        } catch (err) {
            handleError(err, 'inițializarea aplicației');
        }
    }

    #setupUISync() {
        const debouncedUpdateURL = debounce(updateURLFromState, 300);

        const updateUI = (currentState, oldState) => {
            this.#features.forEach(feature => {
                if (feature.syncUI) {
                    feature.syncUI({
                        dom: this.#dom,
                        components: this.#components,
                        state: currentState,
                        oldState: oldState
                    });
                }
            });
            debouncedUpdateURL(currentState);
        };

        this.#store.subscribe(updateUI);
        updateUI(this.#store.getState(), {});
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
        // Nu mai este necesar unbindEventListeners, dar păstrăm metoda destroy
        // pentru posibile curățări viitoare.
        if (this.#isInitialized) {
            console.log("Aplicația a fost curățată.");
        }
    }
}