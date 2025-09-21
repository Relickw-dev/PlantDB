// src/js/core/actions.js

import { getState, updateState } from './state.js';
import { loadAndProcessPlantsData, loadFaqData, fetchPlantDetails } from '../services/plantService.js';
import { showNotification } from '../components/NotificationService.js';
import { TIMINGS, NAVIGATION, COPY_STATUS, SORT_KEYS } from '../utils/constants.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import * as favoriteService from '../services/favoriteService.js';
import { handleError } from './errorHandler.js';


let copyStatusTimeoutId = null;

// --- NOU: Funcții Helper & Gestionarea Erorilor ---

/**
 * Încarcă detaliile complete pentru o plantă și actualizează cache-ul de plante din state.
 * @param {number} plantId - ID-ul plantei de încărcat.
 * @returns {Promise<object|null>} Obiectul plantei cu detalii complete sau null dacă apare o eroare.
 */
async function loadAndCachePlantDetails(plantId) {
    const { plants } = getState();
    let plantData = plants.find((p) => p.id == plantId);

    // Verificăm dacă detaliile sunt deja încărcate
    if (plantData && plantData.care_guide) {
        return plantData;
    }
    
    try {
        const detailedData = await fetchPlantDetails(plantId);
        plantData = { ...plantData, ...detailedData };

        // Actualizăm array-ul de plante cu noile detalii
        const updatedPlants = plants.map(p => p.id === plantId ? plantData : p);
        updateState({ plants: updatedPlants }); // Actualizăm cache-ul global

        return plantData;
    } catch (error) {
        handleError(error, `încărcarea detaliilor pentru planta #${plantId}`);
        return null;
    }
}

/**
 * Calculează plantele adiacente (precedentă/următoare) pentru navigație.
 * @param {object} plant - Planta curentă.
 * @param {object} state - Starea curentă a aplicației.
 * @returns {{prev: object, next: object}}
 */
function getAdjacentPlants(plant, state) {
    if (!plant) return { prev: null, next: null };

    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        state.plants, state.query, state.activeTags,
        state.sortOrder, state.favoritesFilterActive, state.favoriteIds
    );
    
    if (visiblePlants.length < 2) return { prev: plant, next: plant };
    
    const currentIndex = visiblePlants.findIndex(p => p.id == plant.id);
    if (currentIndex === -1) return { prev: plant, next: plant };
    
    const prev = visiblePlants.at(currentIndex - 1);
    const next = visiblePlants[(currentIndex + 1) % visiblePlants.length];
    
    return { prev, next };
}

/**
 * Recalculează navigația pentru modal atunci când filtrele se schimbă.
 * @param {object} currentState - Starea curentă.
 * @param {object} newFilterState - Modificările de filtru propuse.
 * @returns {object} Starea finală, incluzând navigația actualizată.
 */
function getStateWithUpdatedNav(currentState, newFilterState) {
    const potentialNextState = { ...currentState, ...newFilterState };
    if (!potentialNextState.modalPlant) {
        return potentialNextState;
    }
    
    const { prev, next } = getAdjacentPlants(potentialNextState.modalPlant.current, potentialNextState);

    return { ...potentialNextState, modalPlant: { ...potentialNextState.modalPlant, prev, next } };
}


// --- Acțiuni Publice ---

/**
 * Încarcă datele inițiale ale aplicației (lista de plante și tag-uri).
 */
export async function loadInitialData() {
    try {
        updateState({ isLoading: true });
        const plantsData = await loadAndProcessPlantsData();
        const allTags = plantsData.flatMap((p) => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        updateState({ plants: plantsData, allUniqueTags: uniqueTags, isLoading: false });
    } catch (err) {
        handleError(err, "încărcarea datelor inițiale");
        updateState({ isLoading: false, hasError: true });
    }
}

/**
 * Inițializează starea aplicației pe baza parametrilor din URL.
 * @param {object} [initialState={}] - Starea extrasă din URL.
 */
export async function initialize(initialState = {}) {
    let modalData = null;
    let faqState = {};

    if (initialState.modalPlantId) {
        const current = await loadAndCachePlantDetails(initialState.modalPlantId);
        if (current) {
            const stateWithPlant = { ...getState(), ...initialState, modalPlant: { current } };
            const { prev, next } = getAdjacentPlants(current, stateWithPlant);
            modalData = { current, prev, next };
        }
    }

    if (initialState.isFaqOpen) {
        const faqData = await loadFaqData();
        if(faqData) {
            faqState = { faqData, isFaqDataLoaded: true };
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
 * Actualizează interogarea de căutare.
 * @param {string} query - Textul căutat.
 */
export function search(query) {
    updateState(getStateWithUpdatedNav(getState(), { query }));
}

/**
 * Schimbă ordinea de sortare a plantelor.
 * @param {string} order - Noua cheie de sortare.
 */
export function changeSortOrder(order) {
    updateState(getStateWithUpdatedNav(getState(), { sortOrder: order }));
}

/**
 * Adaugă, elimină sau resetează tag-urile active.
 * @param {string} tag - Tag-ul selectat.
 */
export function selectTag(tag) {
    const { activeTags } = getState();
    let newTags;
    
    if (tag === "") { // Resetare tag-uri
        newTags = [];
    } else {
        newTags = [...activeTags];
        const tagIndex = newTags.indexOf(tag);
        tagIndex > -1 ? newTags.splice(tagIndex, 1) : newTags.push(tag);
    }

    updateState(getStateWithUpdatedNav(getState(), { activeTags: newTags }));
}

/**
 * Resetează toate filtrele la starea implicită.
 */
export function resetFilters() {
    const resetState = {
        query: "",
        sortOrder: SORT_KEYS.AZ,
        activeTags: [],
        favoritesFilterActive: false
    };
    updateState(getStateWithUpdatedNav(getState(), resetState));
}

/**
 * Deschide modalul pentru o plantă aleatorie din setul vizibil.
 */
export function selectRandomPlant() {
    const state = getState();
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        state.plants, state.query, state.activeTags, state.sortOrder, state.favoritesFilterActive, state.favoriteIds
    );

    if (visiblePlants.length === 0) {
        showNotification("Nu s-au găsit plante conform filtrelor tale.", { type: "info" });
        return;
    }
    
    const randomPlant = visiblePlants[Math.floor(Math.random() * visiblePlants.length)];
    openPlantModal(randomPlant.id);
}

/**
 * Deschide modalul pentru o plantă specifică.
 * @param {number} plantId - ID-ul plantei.
 */
export async function openPlantModal(plantId) {
    const current = await loadAndCachePlantDetails(plantId);
    if (!current) return; // Eroarea a fost deja gestionată

    const state = getState();
    const { prev, next } = getAdjacentPlants(current, state);
    
    updateState({
        modalPlant: { current, prev, next },
        isFaqOpen: false
    });
}

/**
 * Închide modalul plantei.
 */
export function closeModal() {
    updateState({ modalPlant: null });
}

/**
 * Navighează la planta următoare sau precedentă în modal.
 * @param {'next'|'prev'} direction - Direcția de navigare.
 */
export async function navigateModal(direction) {
    const state = getState();
    if (!state.modalPlant?.current) return;

    const targetPlant = direction === NAVIGATION.NEXT ? state.modalPlant.next : state.modalPlant.prev;
    if (!targetPlant || targetPlant.id === state.modalPlant.current.id) return;

    // Reutilizăm logica de deschidere, care va încărca și detaliile dacă este necesar
    await openPlantModal(targetPlant.id);
}


// --- Acțiuni FAQ & Utilitare ---

export async function openFaqModal() {
    const { isFaqDataLoaded, isFaqLoadFailed } = getState();
    
    if (isFaqLoadFailed) {
        showNotification("Conținutul FAQ nu este disponibil.", { type: "error" });
        return;
    }
    
    if (isFaqDataLoaded) {
        updateState({ isFaqOpen: true, modalPlant: null });
        return;
    }
    
    try {
        const faqData = await loadFaqData();
        updateState({ faqData, isFaqDataLoaded: true, isFaqOpen: true, modalPlant: null });
    } catch (err) {
        handleError(err, "încărcarea datelor FAQ");
        updateState({ isFaqLoadFailed: true });
    }
}

export function closeFaqModal() {
    updateState({ isFaqOpen: false });
}

export async function copyPlantDetails() {
    clearTimeout(copyStatusTimeoutId);
    const plant = getState().modalPlant?.current;
    if (!plant) return;

    const textToCopy = [
        `${plant.name} (${plant.latin})`, `Taguri: ${(plant.tags || []).join(", ")}`,
        `Dificultate: ${plant.difficulty}`, `Toxicitate: 🐱 ${plant.toxicity?.cats}, 🐶 ${plant.toxicity?.dogs}`
    ].join('\n');

    try {
        await navigator.clipboard.writeText(textToCopy);
        updateState({ copyStatus: COPY_STATUS.SUCCESS });
    } catch (err) {
        handleError(err, "copierea detaliilor");
        updateState({ copyStatus: COPY_STATUS.ERROR });
    } finally {
        copyStatusTimeoutId = setTimeout(() => {
            if (getState().copyStatus !== COPY_STATUS.IDLE) {
                updateState({ copyStatus: COPY_STATUS.IDLE });
            }
        }, TIMINGS.COPY_RESET_DELAY);
    }
}


// --- Acțiuni Favorite ---

export function loadFavorites() {
    updateState({ favoriteIds: favoriteService.getFavorites() });
}

export function toggleFavorite(plantId) {
    const { favoriteIds } = getState();
    const newFavorites = favoriteIds.includes(plantId)
        ? favoriteService.removeFavorite(plantId)
        : favoriteService.addFavorite(plantId);
    updateState({ favoriteIds: newFavorites });
}

export function toggleFavoritesFilter() {
    const { favoritesFilterActive } = getState();
    updateState(getStateWithUpdatedNav(getState(), { favoritesFilterActive: !favoritesFilterActive }));
}