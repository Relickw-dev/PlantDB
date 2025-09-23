// src/js/core/uiSync.js

import store from '../store/index.js';
import { debounce } from '../utils/helpers.js';
import { updateURLFromState } from '../services/urlService.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { PET_KEYWORDS } from '../utils/constants.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';
import { handleError } from './errorHandler.js';

function getEmptyStateContent(state) {
    const { query } = state.plants;
    // const { favoritesFilterActive } = state.favorites;

    // if (favoritesFilterActive) { ... }
    if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        return { message: 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾', imgSrc: "assets/icons/empty.svg" };
    }
    return { message: 'Nu am găsit nicio plantă. Încearcă o altă căutare.', imgSrc: "assets/icons/empty.svg" };
}

function syncGrid(currentState, oldState, components) {
    const current = currentState.plants;
    const old = oldState.plants || {};
    // const favorites = currentState.favorites || {};

    // Verificăm dacă o rerandare este necesară
    const needsRender = 
        current.isLoading !== old.isLoading ||
        current.query !== old.query ||
        JSON.stringify(current.activeTags) !== JSON.stringify(old.activeTags) ||
        current.sortOrder !== old.sortOrder ||
        current.all.length !== (old.all || []).length;
        // favorites.filterActive !== (old.favorites || {}).filterActive ||
        // JSON.stringify(favorites.ids) !== JSON.stringify((old.favorites || {}).ids);

    if (!needsRender) return;

    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        current.all, current.query, current.activeTags, current.sortOrder,
        // favorites.filterActive, favorites.ids
    );
    
    components.plantGrid.render({
        plants: visiblePlants,
        isLoading: current.isLoading,
        // favoriteIds: favorites.ids,
        emptyStateContent: visiblePlants.length === 0 && !current.isLoading 
            ? getEmptyStateContent(currentState) 
            : null
    });
}

function syncControls(currentState, oldState, elements) {
    const current = currentState.plants;
    const old = oldState.plants || {};

    if (current.query !== old.query && elements.searchInput.value !== current.query) {
        elements.searchInput.value = current.query;
    }
    if (current.sortOrder !== old.sortOrder) {
        elements.sortSelect.value = current.sortOrder;
    }
    // const favorites = currentState.favorites || {};
    // elements.showFavoritesBtn.classList.toggle('active', favorites.filterActive);
}

function syncTagFilter(currentState, oldState, components) {
    const current = currentState.plants;
    const old = oldState.plants || {};

    if (current.allUniqueTags.length !== (old.allUniqueTags || []).length ||
        JSON.stringify(current.activeTags) !== JSON.stringify(old.activeTags)) {
        components.tagFilter.render({
            allTags: current.allUniqueTags,
            activeTags: current.activeTags,
        });
    }
}

function syncModals(currentState, oldState, components) {
    const currentPlants = currentState.plants;
    const oldPlants = oldState.plants || {};

    if (currentPlants.modalPlant !== oldPlants.modalPlant) {
        ensurePlantModalIsLoaded().then(modal => {
            if (currentPlants.modalPlant && currentPlants.modalPlant.current) {
                modal.render({
                    plant: currentPlants.modalPlant.current,
                    adjacentPlants: { prev: currentPlants.modalPlant.prev, next: currentPlants.modalPlant.next },
                    copyStatus: currentPlants.copyStatus
                });
            } else {
                modal.close();
            }
        }).catch(err => handleError(err, 'sincronizarea modalului de plantă'));
    }

    // Aici va veni logica pentru modalul FAQ
}

export function syncStateToUI(elements, components) {
    const debouncedUpdateURL = debounce((state) => {
        // Adaptare necesară pentru noua structură a stării
        // updateURLFromState(state);
    }, 300);

    store.subscribe((currentState, oldState) => {
        syncGrid(currentState, oldState, components);
        syncControls(currentState, oldState, elements);
        syncTagFilter(currentState, oldState, components);
        syncModals(currentState, oldState, components);
        
        // debouncedUpdateURL(currentState);
    });
}