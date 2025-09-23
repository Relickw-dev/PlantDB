// src/js/features/plants/plantsActions.js

import store from '../../store/index.js';
import { actionTypes } from '../../store/actionTypes.js';
import { fetchPlantDetails } from '../../services/plantService.js';
import { getMemoizedSortedAndFilteredPlants } from '../../services/memoizedLogic.js';
import { getAdjacentPlants } from '../../services/plantLogic.js';
import { handleError } from '../../core/errorHandler.js';
import { showNotification } from '../../components/NotificationService.js';
import { SORT_KEYS } from '../../utils/constants.js';

// --- Acțiuni Sincrone (Creatori de Acțiuni) ---

export const setQuery = (query) => {
    store.dispatch({ type: actionTypes.SET_QUERY, payload: query });
};

export const setSortOrder = (order) => {
    store.dispatch({ type: actionTypes.SET_SORT_ORDER, payload: order });
};

export const resetFilters = () => {
    store.dispatch({ type: actionTypes.RESET_FILTERS });
};

export const closeModal = () => {
    store.dispatch({ type: actionTypes.CLOSE_MODAL });
};

export const selectTag = (tag) => {
    const { activeTags } = store.getState().plants;
    let newTags;
    
    if (tag === "") {
        newTags = [];
    } else {
        newTags = [...activeTags];
        const tagIndex = newTags.indexOf(tag);
        tagIndex > -1 ? newTags.splice(tagIndex, 1) : newTags.push(tag);
    }
    store.dispatch({ type: actionTypes.SET_ACTIVE_TAGS, payload: newTags });
};

// --- Acțiuni Asincrone (Thunks) ---

export const openPlantModal = (plantId) => async (dispatch, getState) => {
    try {
        const { plants, query, activeTags, sortOrder, favoritesFilterActive, favoriteIds } = getState().plants;
        
        // Găsim planta în lista existentă pentru a avea datele de bază imediat
        const plantSummary = plants.all.find(p => p.id == plantId);
        if (!plantSummary) throw new Error(`Planta cu ID #${plantId} nu a fost găsită.`);
        
        const detailedData = await fetchPlantDetails(plantId);
        const current = { ...plantSummary, ...detailedData };

        const visiblePlants = getMemoizedSortedAndFilteredPlants(
            plants.all, query, activeTags, sortOrder, favoritesFilterActive, favoriteIds
        );
        const { prev, next } = getAdjacentPlants(current, visiblePlants);

        dispatch({ type: actionTypes.SET_MODAL_PLANT, payload: { current, prev, next } });

    } catch (error) {
        handleError(error, `deschiderea modalului pentru planta #${plantId}`);
    }
};

export const navigateModal = (direction) => (dispatch, getState) => {
    const state = getState().plants;
    if (!state.modalPlant?.current) return;

    const targetPlant = direction === 'next' ? state.modalPlant.next : state.modalPlant.prev;
    if (!targetPlant || targetPlant.id === state.modalPlant.current.id) return;

    // Relansăm acțiunea asincronă pentru a încărca detaliile noii plante
    dispatch(openPlantModal(targetPlant.id));
};

export const selectRandomPlant = () => (dispatch, getState) => {
    const state = getState().plants;
    const { favoritesFilterActive, favoriteIds } = getState().favorites || {}; // Adaptare pentru viitor

    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        state.all, state.query, state.activeTags, state.sortOrder, favoritesFilterActive, favoriteIds
    );

    if (visiblePlants.length === 0) {
        showNotification("Nu s-au găsit plante conform filtrelor tale.", { type: "info" });
        return;
    }
    
    const randomPlant = visiblePlants[Math.floor(Math.random() * visiblePlants.length)];
    dispatch(openPlantModal(randomPlant.id));
};

export const copyPlantDetails = () => async (dispatch, getState) => {
    const plant = getState().plants.modalPlant?.current;
    if (!plant) return;

    const textToCopy = [
        `${plant.name} (${plant.latin})`, `Taguri: ${(plant.tags || []).join(", ")}`,
        `Dificultate: ${plant.difficulty}`, `Toxicitate: 🐱 ${plant.toxicity?.cats}, 🐶 ${plant.toxicity?.dogs}`
    ].join('\n');

    try {
        await navigator.clipboard.writeText(textToCopy);
        dispatch({ type: actionTypes.SET_COPY_STATUS, payload: 'success' });
    } catch (err) {
        handleError(err, "copierea detaliilor");
        dispatch({ type: actionTypes.SET_COPY_STATUS, payload: 'error' });
    } finally {
        setTimeout(() => {
            if (getState().plants.copyStatus !== 'idle') {
                dispatch({ type: actionTypes.SET_COPY_STATUS, payload: 'idle' });
            }
        }, 3000);
    }
};