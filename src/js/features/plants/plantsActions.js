// src/js/features/plants/plantsActions.js
import { actionTypes } from '../../shared/store/actionTypes.js';
import { fetchPlantDetails } from '../plants/services/plantService.js';
import { getMemoizedSortedAndFilteredPlants } from '../plants/services/memoizedLogic.js';
import { getAdjacentPlants } from '../plants/services/plantLogic.js';
import { handleError } from '../../app/errorHandler.js';
import { showNotification } from '../../shared/components/NotificationService.js';
import * as shareService from '../../shared/services/shareService.js';

export const setQuery = (query) => ({ type: actionTypes.SET_QUERY, payload: query });

export const setSortOrder = (order) => ({ type: actionTypes.SET_SORT_ORDER, payload: order });

export const resetFilters = () => ({ type: actionTypes.RESET_FILTERS });

export const closeModal = () => ({ type: actionTypes.CLOSE_MODAL });

export const selectTag = (tag) => (dispatch, getState) => {
    const { activeTags } = getState().plants;
    let newTags;
    if (tag === "") {
        newTags = [];
    } else {
        newTags = [...activeTags];
        const tagIndex = newTags.indexOf(tag);
        tagIndex > -1 ? newTags.splice(tagIndex, 1) : newTags.push(tag);
    }
    dispatch({ type: actionTypes.SET_ACTIVE_TAGS, payload: newTags });
};

export const openPlantModal = (plantId) => {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const { all, query, activeTags, sortOrder } = state.plants;
            const { filterActive, ids } = state.favorites;

            const plantSummary = all.find(p => p.id == plantId);
            if (!plantSummary) throw new Error(`Planta cu ID #${plantId} nu a fost găsită.`);
            
            const detailedData = await fetchPlantDetails(plantId);
            const current = { ...plantSummary, ...detailedData };

            const visiblePlants = getMemoizedSortedAndFilteredPlants(all, query, activeTags, sortOrder, filterActive, ids);
            const { prev, next } = getAdjacentPlants(current, visiblePlants);

            dispatch({ type: actionTypes.SET_MODAL_PLANT, payload: { current, prev, next } });
        } catch (error) {
            handleError(error, `deschiderea modalului pentru planta #${plantId}`);
        }
    };
};

export const navigateModal = (direction) => (dispatch, getState) => {
    const { modalPlant } = getState().plants;
    if (!modalPlant?.current) return;
    const targetPlant = direction === 'next' ? modalPlant.next : modalPlant.prev;
    if (!targetPlant || targetPlant.id === modalPlant.current.id) return;
    dispatch(openPlantModal(targetPlant.id));
};

export const selectRandomPlant = () => (dispatch, getState) => {
    const state = getState();
    const { all, query, activeTags, sortOrder } = state.plants;
    const { filterActive, ids } = state.favorites;
    const visiblePlants = getMemoizedSortedAndFilteredPlants(all, query, activeTags, sortOrder, filterActive, ids);
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
    const textToCopy = [`${plant.name} (${plant.latin})`, `Taguri: ${(plant.tags || []).join(", ")}`, `Dificultate: ${plant.difficulty}`, `Toxicitate: 🐱 ${plant.toxicity?.cats}, 🐶 ${plant.toxicity?.dogs}`].join('\n');
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

export const sharePlantDetails = () => (dispatch, getState) => {
    const plant = getState().plants.modalPlant?.current;
    if (!plant) return;
    shareService.sharePlant(plant);
};