// src/js/features/plants/index.js
import { plantsReducer } from './plantsReducer.js';
import * as plantsActions from './plantsActions.js';
import { CUSTOM_EVENTS, PET_KEYWORDS } from '../../shared/utils/constants.js';
import { ensurePlantModalIsLoaded } from '../../shared/utils/dynamicLoader.js';
import { debounce } from '../../shared/utils/helpers.js';
import { getMemoizedSortedAndFilteredPlants } from './services/memoizedLogic.js';
import { handleError } from '../../app/errorHandler.js';
import { getFavoriteIds, isFavoritesFilterActive } from '../favorites/selectors.js'; // <-- IMPORT NOU

// --- Funcții ajutătoare pentru UI Sync ---

function getEmptyStateContent(state) {
    const { query } = state.plants;
    // MODIFICAT: Folosim selector
    const filterActive = isFavoritesFilterActive(state);

    if (filterActive) {
        return { message: 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!', imgSrc: "assets/icons/empty.svg" };
    }
    if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        return { message: 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾', imgSrc: "assets/icons/empty.svg" };
    }
    return { message: 'Nu am găsit nicio plantă. Încearcă o altă căutare.', imgSrc: "assets/icons/empty.svg" };
}

// --- Definiția Modulului ---

export default {
    name: 'plants',
    reducer: plantsReducer,
    bindEvents: (dom, store) => {
        const debouncedSearch = debounce((value) => store.dispatch(plantsActions.setQuery(value)), 300);
        dom.searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        dom.sortSelect.addEventListener('change', (e) => store.dispatch(plantsActions.setSortOrder(e.target.value)));
        dom.resetButton.addEventListener('click', () => store.dispatch(plantsActions.resetFilters()));
        dom.randomBtn.addEventListener('click', () => store.dispatch(plantsActions.selectRandomPlant()));
        dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => store.dispatch(plantsActions.selectTag(e.detail.tag)));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => store.dispatch(plantsActions.closeModal()));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, (e) => store.dispatch(plantsActions.navigateModal(e.detail.direction)));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, () => store.dispatch(plantsActions.copyPlantDetails()));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.SHARE_REQUEST, () => store.dispatch(plantsActions.sharePlantDetails()));
        document.body.addEventListener('click', (e) => {
            const card = e.target.closest('.card[data-id]');
            const isFavoriteButton = e.target.closest('.favorite-btn');
            if (card && !isFavoriteButton) {
                const plantId = parseInt(card.dataset.id, 10);
                if (isNaN(plantId)) return;
                ensurePlantModalIsLoaded().then(() => store.dispatch(plantsActions.openPlantModal(plantId)));
            }
        });
    },
    syncUI: ({ dom, components, state, oldState }) => {
        const currentPlants = state.plants;
        const oldPlants = oldState.plants || {};
        
        // MODIFICAT: Folosim selectori pentru a verifica dacă e necesară re-randarea
        const needsGridRender =
            currentPlants.isLoading !== oldPlants.isLoading ||
            currentPlants.query !== oldPlants.query ||
            JSON.stringify(currentPlants.activeTags) !== JSON.stringify(oldPlants.activeTags) ||
            currentPlants.sortOrder !== oldPlants.sortOrder ||
            currentPlants.all.length !== (oldPlants.all || []).length ||
            isFavoritesFilterActive(state) !== isFavoritesFilterActive(oldState) ||
            JSON.stringify(getFavoriteIds(state)) !== JSON.stringify(getFavoriteIds(oldState));

        if (needsGridRender) {
            const visiblePlants = getMemoizedSortedAndFilteredPlants(
                currentPlants.all, currentPlants.query, currentPlants.activeTags, currentPlants.sortOrder,
                isFavoritesFilterActive(state), getFavoriteIds(state)
            );
            components.plantGrid.render({
                plants: visiblePlants,
                isLoading: currentPlants.isLoading,
                favoriteIds: getFavoriteIds(state),
                emptyStateContent: visiblePlants.length === 0 && !currentPlants.isLoading
                    ? getEmptyStateContent(state)
                    : null
            });
        }

        // Sincronizare Controale (rămâne la fel)
        if (dom.searchInput.value !== currentPlants.query) {
            dom.searchInput.value = currentPlants.query;
        }
        if (dom.sortSelect.value !== currentPlants.sortOrder) {
            dom.sortSelect.value = currentPlants.sortOrder;
        }

        // Sincronizare Filtru Tag-uri (rămâne la fel)
        if (JSON.stringify(currentPlants.allUniqueTags) !== JSON.stringify((oldPlants).allUniqueTags) ||
            JSON.stringify(currentPlants.activeTags) !== JSON.stringify((oldPlants).activeTags)) {
            components.tagFilter.render({
                allTags: currentPlants.allUniqueTags,
                activeTags: currentPlants.activeTags,
            });
        }

        // Sincronizare Modal Plantă (rămâne la fel)
        if (currentPlants.modalPlant !== oldPlants.modalPlant || currentPlants.copyStatus !== oldPlants.copyStatus) {
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
    }
};