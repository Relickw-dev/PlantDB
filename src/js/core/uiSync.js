// src/js/core/uiSync.js

import { subscribe } from './state.js';
import { debounce } from '../utils/helpers.js';
import { updateURLFromState } from '../services/urlService.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { TIMINGS, PET_KEYWORDS } from '../utils/constants.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';
import { handleError } from './errorHandler.js';

// --- Funcții Helper de Sincronizare ---

function getEmptyStateContent(state) {
    const { query, favoritesFilterActive } = state;
    if (favoritesFilterActive) {
        return { message: 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!', imgSrc: "assets/icons/empty.svg" };
    }
    if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        return { message: 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾', imgSrc: "assets/icons/empty.svg" };
    }
    return { message: 'Nu am găsit nicio plantă. Încearcă o altă căutare sau resetează filtrele.', imgSrc: "assets/icons/empty.svg" };
}

function syncGrid(currentState, oldState, components, elements) {
    const needsRender = 
        currentState.isLoading !== oldState.isLoading ||
        currentState.query !== oldState.query ||
        JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags) ||
        currentState.sortOrder !== oldState.sortOrder ||
        currentState.favoritesFilterActive !== oldState.favoritesFilterActive ||
        JSON.stringify(currentState.favoriteIds) !== JSON.stringify(oldState.favoriteIds) ||
        currentState.plants.length !== oldState.plants.length;

    if (!needsRender) return;

    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        currentState.plants, currentState.query, currentState.activeTags,
        currentState.sortOrder, currentState.favoritesFilterActive, currentState.favoriteIds
    );
    
    components.plantGrid.render({
        plants: visiblePlants,
        isLoading: currentState.isLoading,
        favoriteIds: currentState.favoriteIds,
        emptyStateContent: visiblePlants.length === 0 && !currentState.isLoading 
            ? getEmptyStateContent(currentState) 
            : null
    });
}

function syncControls(currentState, oldState, elements) {
    if (currentState.query !== oldState.query && elements.searchInput.value !== currentState.query) {
        elements.searchInput.value = currentState.query;
    }
    if (currentState.sortOrder !== oldState.sortOrder) {
        elements.sortSelect.value = currentState.sortOrder;
    }
    if (currentState.favoritesFilterActive !== oldState.favoritesFilterActive) {
        elements.showFavoritesBtn.classList.toggle('active', currentState.favoritesFilterActive);
    }
}

function syncTagFilter(currentState, oldState, components) {
    if (currentState.allUniqueTags.length !== oldState.allUniqueTags.length ||
        JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags)) {
        components.tagFilter.render({
            allTags: currentState.allUniqueTags,
            activeTags: currentState.activeTags,
        });
    }
}

function syncModals(currentState, oldState, components) {
    // Sincronizare Modal Plantă
    if (currentState.modalPlant !== oldState.modalPlant) {
        ensurePlantModalIsLoaded().then(modal => {
            if (currentState.modalPlant && currentState.modalPlant.current) {
                modal.render({
                    plant: currentState.modalPlant.current,
                    adjacentPlants: { prev: currentState.modalPlant.prev, next: currentState.modalPlant.next },
                    copyStatus: currentState.copyStatus
                });
            } else {
                modal.close();
            }
        }).catch(err => handleError(err, 'sincronizarea modalului de plantă'));
    }

    // Sincronizare Modal FAQ
    if (currentState.isFaqOpen !== oldState.isFaqOpen) {
        if (currentState.isFaqOpen) {
            if (currentState.faqData) components.faqModal.populate(currentState.faqData);
            components.faqModal.open();
        } else {
            components.faqModal.close();
        }
    }
}

// --- Funcția Principală de Sincronizare ---

export function syncStateToUI(elements, components) {
    let isInitialized = false;
    const debouncedUpdateURL = debounce(updateURLFromState, TIMINGS.DEBOUNCE_DEFAULT);

    subscribe((currentState, oldState) => {
        syncGrid(currentState, oldState, components, elements);
        syncControls(currentState, oldState, elements);
        syncTagFilter(currentState, oldState, components);
        syncModals(currentState, oldState, components);

        if (isInitialized) {
            debouncedUpdateURL(currentState);
        }
    });

    return (status) => {
        isInitialized = status;
    };
}