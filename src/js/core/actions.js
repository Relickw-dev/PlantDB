// src/js/core/actions.js

import { getState, updateState } from './state.js';
import { loadAndProcessPlantsData, loadFaqData, fetchPlantDetails } from '../services/plantService.js';
import { showNotification } from '../components/NotificationService.js';
import { TIMINGS, NAVIGATION, COPY_STATUS, SORT_KEYS } from '../utils/constants.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { getAdjacentPlants } from '../services/plantLogic.js';
import * as favoriteService from '../services/favoriteService.js';
import { handleError } from './errorHandler.js';


let copyStatusTimeoutId = null;

// --- NOU: Funcție centralizată pentru gestionarea stării modalelor ---
/**
 * O funcție privată care actualizează starea pentru ambele modale,
 * asigurând că doar unul poate fi activ la un moment dat.
 * @param {object|null} plantData - Obiectul pentru modalul plantei sau null.
 * @param {boolean} isFaqOpen - Starea de vizibilitate pentru modalul FAQ.
 */
function setModalState(plantData = null, isFaqOpen = false) {
    const newState = {
        modalPlant: plantData,
        isFaqOpen: isFaqOpen,
    };

    // Asigură exclusivitatea: dacă un modal se deschide, celălalt se închide.
    if (plantData) {
        newState.isFaqOpen = false;
    }
    if (isFaqOpen) {
        newState.modalPlant = null;
    }

    updateState(newState);
}

// --- Funcții Helper & Gestionarea Erorilor ---

/**
 * Încarcă detaliile complete pentru o plantă.
 * NU mai modifică starea globală a listei de plante.
 * @param {number} plantId - ID-ul plantei de încărcat.
 * @returns {Promise<object|null>} Obiectul plantei cu detalii complete sau null dacă apare o eroare.
 */
async function loadPlantDetails(plantId) {
    const { plants } = getState();
    const plantSummary = plants.find((p) => p.id == plantId);

    // Verificăm dacă planta de bază există
    if (!plantSummary) {
        handleError(new Error(`Planta cu ID #${plantId} nu a fost găsită în lista inițială.`), 'încărcarea detaliilor');
        return null;
    }
    
    try {
        const detailedData = await fetchPlantDetails(plantId);
        // Combinăm datele de bază cu cele detaliate
        return { ...plantSummary, ...detailedData };
    } catch (error) {
        handleError(error, `încărcarea detaliilor pentru planta #${plantId}`);
        return null;
    }
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
    
    // Obținem lista vizibilă de plante pe baza noii stări
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        potentialNextState.plants, potentialNextState.query, potentialNextState.activeTags,
        potentialNextState.sortOrder, potentialNextState.favoritesFilterActive, potentialNextState.favoriteIds
    );
    const { prev, next } = getAdjacentPlants(potentialNextState.modalPlant.current, visiblePlants);

    return { ...potentialNextState, modalPlant: { ...potentialNextState.modalPlant, prev, next } };
}


// --- Acțiuni Publice (Restul fișierului rămâne similar, dar cu logica de navigație actualizată) ---

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
        const current = await loadPlantDetails(initialState.modalPlantId);
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
 * MODIFICAT: Deschide modalul pentru o plantă specifică folosind noul helper.
 */
export async function openPlantModal(plantId) {
    const current = await loadPlantDetails(plantId);
    if (!current) return; // Eroarea a fost deja gestionată

    const state = getState();
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        state.plants, state.query, state.activeTags,
        state.sortOrder, state.favoritesFilterActive, state.favoriteIds
    );
    const { prev, next } = getAdjacentPlants(current, visiblePlants);
    
    // Apelăm funcția centralizată
    setModalState({ current, prev, next });
}

/**
 * MODIFICAT: Închide modalul plantei folosind noul helper.
 */
export function closeModal() {
    setModalState(null);
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

    await openPlantModal(targetPlant.id);
}


// --- Acțiuni FAQ & Utilitare ---

/**
 * MODIFICAT: Deschide modalul FAQ folosind noul helper.
 */
export async function openFaqModal() {
    const { isFaqDataLoaded, isFaqLoadFailed } = getState();
    
    if (isFaqLoadFailed) {
        showNotification("Conținutul FAQ nu este disponibil.", { type: "error" });
        return;
    }
    
    if (isFaqDataLoaded) {
        // Apelăm funcția centralizată
        setModalState(null, true);
        return;
    }
    
    try {
        const faqData = await loadFaqData();
        updateState({ faqData, isFaqDataLoaded: true }); // Încărcăm datele
        setModalState(null, true); // Apoi deschidem modalul
    } catch (err) {
        handleError(err, "încărcarea datelor FAQ");
        updateState({ isFaqLoadFailed: true });
    }
}

/**
 * MODIFICAT: Închide modalul FAQ folosind noul helper.
 */
export function closeFaqModal() {
    setModalState(null, false);
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