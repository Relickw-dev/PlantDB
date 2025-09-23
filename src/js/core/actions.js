// src/js/core/actions.js

import { getState, updateState } from './state.js';
import { loadFaqData, fetchPlantDetails } from '../services/plantService.js';
import { showNotification } from '../components/NotificationService.js';
import { TIMINGS, NAVIGATION, COPY_STATUS, SORT_KEYS } from '../utils/constants.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { getAdjacentPlants } from '../services/plantLogic.js';
import * as favoriteService from '../services/favoriteService.js';
import { handleError } from './errorHandler.js';


let copyStatusTimeoutId = null;

// --- Funcție centralizată pentru gestionarea stării modalelor ---
function setModalState(plantData = null, isFaqOpen = false) {
    const newState = {
        modalPlant: plantData,
        isFaqOpen: isFaqOpen,
    };

    if (plantData) {
        newState.isFaqOpen = false;
    }
    if (isFaqOpen) {
        newState.modalPlant = null;
    }

    updateState(newState);
}

// --- Funcții Helper & Gestionarea Erorilor ---
async function loadPlantDetails(plantId) {
    const { plants } = getState();
    const plantSummary = plants.find((p) => p.id == plantId);

    if (!plantSummary) {
        handleError(new Error(`Planta cu ID #${plantId} nu a fost găsită în lista inițială.`), 'încărcarea detaliilor');
        return null;
    }
    
    try {
        const detailedData = await fetchPlantDetails(plantId);
        return { ...plantSummary, ...detailedData };
    } catch (error) {
        handleError(error, `încărcarea detaliilor pentru planta #${plantId}`);
        return null;
    }
}

function getStateWithUpdatedNav(currentState, newFilterState) {
    const potentialNextState = { ...currentState, ...newFilterState };
    if (!potentialNextState.modalPlant) {
        return potentialNextState;
    }
    
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        potentialNextState.plants, potentialNextState.query, potentialNextState.activeTags,
        potentialNextState.sortOrder, potentialNextState.favoritesFilterActive, potentialNextState.favoriteIds
    );
    const { prev, next } = getAdjacentPlants(potentialNextState.modalPlant.current, visiblePlants);

    return { ...potentialNextState, modalPlant: { ...potentialNextState.modalPlant, prev, next } };
}


// --- Acțiuni Publice ---
export function search(query) {
    updateState(getStateWithUpdatedNav(getState(), { query }));
}

export function changeSortOrder(order) {
    updateState(getStateWithUpdatedNav(getState(), { sortOrder: order }));
}

export function selectTag(tag) {
    const { activeTags } = getState();
    let newTags;
    
    if (tag === "") {
        newTags = [];
    } else {
        newTags = [...activeTags];
        const tagIndex = newTags.indexOf(tag);
        tagIndex > -1 ? newTags.splice(tagIndex, 1) : newTags.push(tag);
    }

    updateState(getStateWithUpdatedNav(getState(), { activeTags: newTags }));
}

export function resetFilters() {
    const resetState = {
        query: "",
        sortOrder: SORT_KEYS.AZ,
        activeTags: [],
        favoritesFilterActive: false
    };
    updateState(getStateWithUpdatedNav(getState(), resetState));
}

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

export async function openPlantModal(plantId) {
    const current = await loadPlantDetails(plantId);
    if (!current) return;

    const state = getState();
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        state.plants, state.query, state.activeTags,
        state.sortOrder, state.favoritesFilterActive, state.favoriteIds
    );
    const { prev, next } = getAdjacentPlants(current, visiblePlants);
    
    setModalState({ current, prev, next });
}

export function closeModal() {
    setModalState(null);
}

export async function navigateModal(direction) {
    const state = getState();
    if (!state.modalPlant?.current) return;

    const targetPlant = direction === NAVIGATION.NEXT ? state.modalPlant.next : state.modalPlant.prev;
    if (!targetPlant || targetPlant.id === state.modalPlant.current.id) return;

    await openPlantModal(targetPlant.id);
}

export async function openFaqModal() {
    const { isFaqDataLoaded, isFaqLoadFailed } = getState();
    
    if (isFaqLoadFailed) {
        showNotification("Conținutul FAQ nu este disponibil.", { type: "error" });
        return;
    }
    
    if (isFaqDataLoaded) {
        setModalState(null, true);
        return;
    }
    
    try {
        const faqData = await loadFaqData();
        updateState({ faqData, isFaqDataLoaded: true });
        setModalState(null, true);
    } catch (err) {
        handleError(err, "încărcarea datelor FAQ");
        updateState({ isFaqLoadFailed: true });
    }
}

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

export async function sharePlantDetails() {
    const plant = getState().modalPlant?.current;
    if (!plant) return;

    const shareData = {
        title: plant.name,
        text: `Uite ce plantă interesantă am găsit: ${plant.name}!`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showNotification("Link-ul a fost copiat în clipboard!", { type: 'success' });
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            handleError(err, "partajarea detaliilor");
        }
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