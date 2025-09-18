import { getState, updateState } from './state.js';
import { loadAndProcessPlantsData } from '../services/plantService.js';
import { showNotification } from '../components/NotificationService.js';
import { TIMINGS, NAVIGATION, COPY_STATUS, SORT_KEYS, HASH_PREFIXES } from '../utils/constants.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import * as favoriteService from '../services/favoriteService.js';

// --- Funcții Helper Interne ---

function getAdjacentPlants(plant, plantList) {
    if (!plant || plantList.length < 2) return { prev: plant, next: plant };
    const currentIndex = plantList.findIndex(p => p.id == plant.id);
    if (currentIndex === -1) return { prev: plant, next: plant };
    const prev = plantList.at(currentIndex - 1);
    const next = plantList[(currentIndex + 1) % plantList.length];
    return { prev, next };
}

// --- Acțiuni de Inițializare ---

export async function loadInitialData() {
    try {
        const plantsData = await loadAndProcessPlantsData();
        const allTags = plantsData.flatMap((p) => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        updateState({ plants: plantsData, allUniqueTags: uniqueTags, isLoading: false });
    } catch (err) {
        console.error("[actions] Eroare la încărcarea datelor inițiale:", err);
        showNotification("Datele plantelor nu au putut fi încărcate.", { type: "error" });
        updateState({ plants: [], allUniqueTags: [], isLoading: false });
    }
}

export function initialize(initialState = {}) {
    const { plants } = getState();
    let modalData = null;

    if (initialState.modalPlantId && plants.length > 0) {
        const current = plants.find((p) => p.id == initialState.modalPlantId) || null;
        if (current) {
            const query = initialState.query || "";
            const activeTags = initialState.activeTags || [];
            const sortOrder = initialState.sortOrder || SORT_KEYS.AZ;
            const visiblePlants = getMemoizedSortedAndFilteredPlants(plants, query, activeTags, sortOrder);
            const { prev, next } = getAdjacentPlants(current, visiblePlants);
            modalData = { current, prev, next };
        }
    }
    
    updateState({
        query: initialState.query || "",
        sortOrder: initialState.sortOrder || SORT_KEYS.AZ,
        activeTags: initialState.activeTags || [],
        isFaqOpen: initialState.isFaqOpen || false,
        modalPlant: modalData,
    });
}

// --- Acțiuni de Interfață ---

export function search(query) {
    updateState({ query });
}

export function changeSortOrder(order) {
    updateState({ sortOrder: order });
}

export function selectTag(tag) {
    if (tag === "") {
        updateState({ activeTags: [], modalPlant: null, isFaqOpen: false });
        return;
    }
    const { activeTags } = getState();
    const newTags = [...activeTags];
    const tagIndex = newTags.indexOf(tag);
    if (tagIndex > -1) {
        newTags.splice(tagIndex, 1);
    } else {
        newTags.push(tag);
    }
    updateState({ activeTags: newTags, modalPlant: null, isFaqOpen: false });
}

export function resetFilters() {
    updateState({ 
        query: "", 
        sortOrder: SORT_KEYS.AZ, 
        activeTags: [],
        modalPlant: null, 
        isFaqOpen: false,
        favoritesFilterActive: false // Resetează și filtrul de favorite
    });
}

export function selectRandomPlant() {
    const { plants } = getState();
    if (plants.length === 0) return;
    resetFilters();
    const randomIndex = Math.floor(Math.random() * plants.length);
    openPlantModal(plants[randomIndex].id);
}

// --- Acțiuni pentru Modale ---

export function openPlantModal(plantId) {
    const state = getState();
    const current = state.plants.find((p) => p.id == plantId);
    if (current) {
        const visiblePlants = getMemoizedSortedAndFilteredPlants(state.plants, state.query, state.activeTags, state.sortOrder);
        const { prev, next } = getAdjacentPlants(current, visiblePlants);
        updateState({ 
            modalPlant: { current, prev, next }, 
            isFaqOpen: false 
        });
    }
}

export function closeModal() {
    updateState({ modalPlant: null });
}

export function openFaqModal() {
    updateState({ isFaqOpen: true, modalPlant: null });
}

export function closeFaqModal() {
    updateState({ isFaqOpen: false });
}

export function navigateModal(direction) {
    const state = getState();
    if (!state.modalPlant || !state.modalPlant.current) return;
    const newCurrent = direction === NAVIGATION.NEXT ? state.modalPlant.next : state.modalPlant.prev;
    const visiblePlants = getMemoizedSortedAndFilteredPlants(state.plants, state.query, state.activeTags, state.sortOrder);
    const { prev, next } = getAdjacentPlants(newCurrent, visiblePlants);
    updateState({
        modalPlant: { current: newCurrent, prev, next }
    });
}

export async function sharePlantLink() {
    const plant = getState().modalPlant?.current;
    if (!plant) return;
    try {
        const baseUrl = window.location.origin + window.location.pathname;
        const hash = `${HASH_PREFIXES.PLANT}${plant.id}`;
        const cleanUrl = baseUrl + hash;
        await navigator.clipboard.writeText(cleanUrl);
        showNotification("Link-ul a fost copiat în clipboard!", { type: "success" });
    } catch (err) {
        console.error("Eroare la partajarea link-ului:", err);
        showNotification("Link-ul nu a putut fi copiat.", { type: "error" });
    }
}

export async function copyPlantDetails() {
    const plant = getState().modalPlant?.current;
    if (!plant) return;
    const textToCopy = `${plant.name} (${plant.latin})\nTaguri: ${(plant.tags || []).join(", ")}`;
    try {
        await navigator.clipboard.writeText(textToCopy);
        updateState({ copyStatus: COPY_STATUS.SUCCESS });
    } catch (err) {
        console.error("Eroare la copiere:", err);
        updateState({ copyStatus: COPY_STATUS.ERROR });
    } finally {
        setTimeout(() => {
            if (getState().copyStatus !== COPY_STATUS.IDLE) {
                updateState({ copyStatus: COPY_STATUS.IDLE });
            }
        }, TIMINGS.COPY_RESET_DELAY);
    }
}

// --- Acțiuni pentru Favorite ---

/**
 * Încarcă ID-urile favoritelor din localStorage și le adaugă în starea aplicației.
 */
export function loadFavorites() {
    const favoriteIds = favoriteService.getFavorites();
    updateState({ favoriteIds });
}

/**
 * Adaugă sau elimină o plantă din lista de favorite.
 * @param {number} plantId - ID-ul plantei de modificat.
 */
export function toggleFavorite(plantId) {
    const { favoriteIds } = getState();
    const isFavorite = favoriteIds.includes(plantId);
    
    const newFavorites = isFavorite 
        ? favoriteService.removeFavorite(plantId)
        : favoriteService.addFavorite(plantId);
    
    updateState({ favoriteIds: newFavorites });
}

/**
 * Activează sau dezactivează filtrul care afișează doar plantele favorite.
 */
export function toggleFavoritesFilter() {
    const { favoritesFilterActive } = getState();
    updateState({ favoritesFilterActive: !favoritesFilterActive });
}