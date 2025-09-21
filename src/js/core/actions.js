import { getState, updateState } from './state.js';
import { loadAndProcessPlantsData, loadFaqData, fetchPlantDetails } from '../services/plantService.js';
import { showNotification } from '../components/NotificationService.js';
import { TIMINGS, NAVIGATION, COPY_STATUS, SORT_KEYS } from '../utils/constants.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import * as favoriteService from '../services/favoriteService.js';

let copyStatusTimeoutId = null;

/**
 * ADAUGAT: O funcție helper centralizată pentru a asigura că detaliile complete
 * ale unei plante sunt încărcate înainte de afișare.
 * @param {number} plantId - ID-ul plantei de verificat/încărcat.
 * @param {Array<object>} currentPlants - Array-ul curent de plante din state.
 * @returns {Promise<{plantData: object, updatedPlants: Array<object>}>} Obiectul cu planta completă și noul array de plante actualizat.
 */
async function ensureDetailedPlantData(plantId, currentPlants) {
    let plantData = currentPlants.find((p) => p.id == plantId);
    if (!plantData) {
        throw new Error(`Planta cu ID-ul ${plantId} nu a fost găsită.`);
    }

    // Verificăm dacă detaliile (ex: care_guide) sunt deja încărcate.
    if (plantData.care_guide) {
        return { plantData, updatedPlants: currentPlants }; // Returnează datele existente.
    }

    // Dacă nu, le preluăm de la server.
    const detailedData = await fetchPlantDetails(plantId);
    plantData = { ...plantData, ...detailedData };

    // Actualizăm array-ul de plante cu noile detalii (pentru cache).
    const updatedPlants = currentPlants.map(p => p.id === plantId ? plantData : p);
    return { plantData, updatedPlants };
}


function getAdjacentPlants(plant, plantList) {
    if (!plant || plantList.length < 2) return { prev: plant, next: plant };
    const currentIndex = plantList.findIndex(p => p.id == plant.id);
    if (currentIndex === -1) return { prev: plant, next: plant };

    const prev = plantList.at(currentIndex - 1);
    const next = plantList[(currentIndex + 1) % plantList.length];
    return { prev, next };
}

function getStateWithUpdatedNav(currentState, newFilterState) {
    if (!currentState.modalPlant) {
        return newFilterState;
    }

    const potentialNextState = { ...currentState, ...newFilterState };
    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        potentialNextState.plants, potentialNextState.query, potentialNextState.activeTags,
        potentialNextState.sortOrder, potentialNextState.favoritesFilterActive, potentialNextState.favoriteIds
    );
    const { prev, next } = getAdjacentPlants(potentialNextState.modalPlant.current, visiblePlants);

    return { ...newFilterState, modalPlant: { ...potentialNextState.modalPlant, prev, next } };
}

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

/**
 * MODIFICAT: Funcția initialize va folosi acum helper-ul pentru a încărca detaliile
 * complete dacă un ID de plantă este prezent în URL.
 */
export async function initialize(initialState = {}) {
    let { plants } = getState(); // Folosim let pentru a putea actualiza referința
    let modalData = null;
    let faqDataResult = null;

    if (initialState.modalPlantId && plants.length > 0) {
        try {
            // Asigurăm încărcarea datelor complete la pornire
            const { plantData: current, updatedPlants } = await ensureDetailedPlantData(initialState.modalPlantId, plants);
            plants = updatedPlants; // Actualizăm referința locală la lista de plante

            const visiblePlants = getMemoizedSortedAndFilteredPlants(
                plants, initialState.query || "", initialState.activeTags || [],
                initialState.sortOrder || SORT_KEYS.AZ, false, []
            );
            const { prev, next } = getAdjacentPlants(current, visiblePlants);
            modalData = { current, prev, next };
        } catch (error) {
            console.error("Eroare la inițializarea modalului din URL:", error);
            showNotification("Planta specificată în URL nu a putut fi încărcată.", { type: 'error' });
            modalData = null;
        }
    }

    if (initialState.isFaqOpen) {
        faqDataResult = await loadFaqData();
    }

    updateState({
        plants, // Salvăm lista de plante potențial actualizată
        query: initialState.query || "",
        sortOrder: initialState.sortOrder || SORT_KEYS.AZ,
        activeTags: initialState.activeTags || [],
        modalPlant: modalData,
        isFaqOpen: !!faqDataResult,
        faqData: faqDataResult,
        isFaqDataLoaded: !!faqDataResult,
    });
}

export function search(query) {
    const newState = getStateWithUpdatedNav(getState(), { query });
    updateState(newState);
}

export function changeSortOrder(order) {
    const newState = getStateWithUpdatedNav(getState(), { sortOrder: order });
    updateState(newState);
}

export function selectTag(tag) {
    const { activeTags } = getState();
    let newTags = tag === "" ? [] : [...activeTags];
    if (tag !== "") {
        const tagIndex = newTags.indexOf(tag);
        tagIndex > -1 ? newTags.splice(tagIndex, 1) : newTags.push(tag);
    }
    const newState = getStateWithUpdatedNav(getState(), { activeTags: newTags });
    updateState(newState);
}

export function resetFilters() {
    updateState({
        query: "", sortOrder: SORT_KEYS.AZ, activeTags: [], favoritesFilterActive: false,
        ...getStateWithUpdatedNav(getState(), { query: "", sortOrder: SORT_KEYS.AZ, activeTags: [], favoritesFilterActive: false })
    });
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

/**
 * MODIFICAT: openPlantModal folosește acum helper-ul centralizat.
 */
export async function openPlantModal(plantId) {
    try {
        const state = getState();
        const { plantData, updatedPlants } = await ensureDetailedPlantData(plantId, state.plants);

        const visiblePlants = getMemoizedSortedAndFilteredPlants(
            updatedPlants, state.query, state.activeTags, state.sortOrder, state.favoritesFilterActive, state.favoriteIds
        );
        const { prev, next } = getAdjacentPlants(plantData, visiblePlants);

        updateState({
            plants: updatedPlants, // Actualizăm starea globală cu noile date
            modalPlant: { current: plantData, prev, next },
            isFaqOpen: false
        });
    } catch (error) {
        console.error("Eroare la deschiderea modalului:", error);
        showNotification("Detaliile plantei nu au putut fi încărcate.", { type: "error" });
    }
}

export function closeModal() {
    updateState({ modalPlant: null });
}

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
    const faqData = await loadFaqData();
    if (faqData) {
        updateState({ faqData, isFaqDataLoaded: true, isFaqOpen: true, modalPlant: null });
    } else {
        updateState({ isFaqLoadFailed: true });
        showNotification("Conținutul FAQ nu a putut fi încărcat.", { type: "error" });
    }
}

export function closeFaqModal() {
    updateState({ isFaqOpen: false });
}

/**
 * MODIFICAT: navigateModal a devenit async și folosește helper-ul pentru
 * a încărca datele pentru planta următoare/precedentă.
 */
export async function navigateModal(direction) {
    const state = getState();
    if (!state.modalPlant?.current) return;

    const targetPlant = direction === NAVIGATION.NEXT ? state.modalPlant.next : state.modalPlant.prev;
    if (!targetPlant) return;

    try {
        // Asigurăm încărcarea datelor complete pentru noua plantă
        const { plantData: newCurrent, updatedPlants } = await ensureDetailedPlantData(targetPlant.id, state.plants);

        const visiblePlants = getMemoizedSortedAndFilteredPlants(
            updatedPlants, state.query, state.activeTags, state.sortOrder, state.favoritesFilterActive, state.favoriteIds
        );
        const { prev, next } = getAdjacentPlants(newCurrent, visiblePlants);

        updateState({
            plants: updatedPlants, // Actualizăm cache-ul global
            modalPlant: { current: newCurrent, prev, next }
        });
    } catch (error) {
        console.error("Eroare la navigarea în modal:", error);
        showNotification("Următoarea plantă nu a putut fi încărcată.", { type: "error" });
    }
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
        console.error("Eroare la copiere:", err);
        updateState({ copyStatus: COPY_STATUS.ERROR });
    } finally {
        copyStatusTimeoutId = setTimeout(() => {
            if (['success', 'error'].includes(getState().copyStatus)) {
                updateState({ copyStatus: COPY_STATUS.IDLE });
            }
        }, TIMINGS.COPY_RESET_DELAY);
    }
}

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
    const newState = getStateWithUpdatedNav(getState(), { favoritesFilterActive: !favoritesFilterActive });
    updateState(newState);
}