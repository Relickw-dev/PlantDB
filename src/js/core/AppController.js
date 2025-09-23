// src/js/core/AppController.js

import { bootstrapApp } from './bootstrap.js';
import { bindEventListeners, unbindEventListeners } from './eventManager.js';
import { syncStateToUI } from './uiSync.js';
import { showNotification } from '../components/NotificationService.js';
import { getStateFromURL } from '../services/urlService.js';
import { initializeTheme } from '../ui/ThemeToggle.js';
import { TIMINGS, SORT_KEYS } from '../utils/constants.js';
import { handleError, initializeGlobalErrorHandler } from './errorHandler.js';
import { getState, updateState } from './state.js';
import { fetchAllPlants, loadFaqData, fetchPlantDetails } from '../services/plantService.js';
// CORECTAT: Am separat importurile pe fișierele corecte
import { processAllPlants, getAdjacentPlants } from '../services/plantLogic.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import * as favoriteService from '../services/favoriteService.js';


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
     * Încarcă și procesează datele esențiale.
     * @private
     */
    async #loadCoreData() {
        updateState({ isLoading: true });
        
        const rawPlantsData = await fetchAllPlants(); 
        const processedPlants = processAllPlants(rawPlantsData);

        const allTags = processedPlants.flatMap((p) => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        const favoriteIds = favoriteService.getFavorites();
        
        updateState({
            plants: processedPlants,
            allUniqueTags: uniqueTags,
            favoriteIds,
            isLoading: false
        });
    }

    /**
     * Inițializează starea aplicației pe baza parametrilor din URL.
     * @private
     */
    async #initializeStateFromURL() {
        const initialState = getStateFromURL();
        let modalData = null;
        let faqState = {};

        if (initialState.modalPlantId) {
            // Aici folosim fetchPlantDetails, care nu necesită procesare suplimentară
            const current = await fetchPlantDetails(initialState.modalPlantId);
            if (current) {
                const state = getState();
                const visiblePlants = getMemoizedSortedAndFilteredPlants(
                    state.plants, initialState.query || "", initialState.activeTags || [],
                    initialState.sortOrder || SORT_KEYS.AZ, state.favoritesFilterActive, state.favoriteIds
                );
                const { prev, next } = getAdjacentPlants(current, visiblePlants);
                modalData = { current, prev, next };
            }
        }

        if (initialState.isFaqOpen) {
            try {
                const faqData = await loadFaqData();
                if (faqData) {
                    faqState = { faqData, isFaqDataLoaded: true };
                }
            } catch(err) {
                handleError(err, 'încărcarea datelor FAQ din URL');
            }
        }

        updateState({
            query: initialState.query || "",
            sortOrder: initialState.sortOrder || SORT_KEYS.AZ,
            activeTags: initialState.activeTags || [],
            modalPlant: modalData,
            isFaqOpen: !!faqState.faqData && initialState.isFaqOpen,
            ...faqState
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

            // Pasul 3: Inițializează funcționalități independente
            initializeTheme();

            // Pasul 4: Atașează toți event listener-ii
            bindEventListeners(this.#dom);

            // Pasul 5: Conectează managerul de stare la UI
            const setInitialized = syncStateToUI(this.#dom, this.#components);

            // Pasul 6: Rulează animația de intro
            await this.#runIntroAnimation();

            // Pasul 7: Încarcă datele esențiale și configurează starea din URL
            await this.#loadCoreData();
            await this.#initializeStateFromURL();

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