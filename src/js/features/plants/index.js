// src/js/features/plants/index.js
import { plantsReducer } from './plantsReducer.js';
import * as plantsActions from './plantsActions.js';
import { CUSTOM_EVENTS, PET_KEYWORDS } from '../../shared/utils/constants.js';
import { ensurePlantModalIsLoaded } from '../../shared/utils/dynamicLoader.js';
import { debounce } from '../../shared/utils/helpers.js';
import { getMemoizedSortedAndFilteredPlants } from './services/memoizedLogic.js';
import { getFavoriteIds, isFavoritesFilterActive } from '../favorites/selectors.js';
// Importăm noii selectori
import { 
    isPlantsLoading, getQuery, getActiveTags, getSortOrder,
    getAllUniqueTags, getModalPlant, getCopyStatus, getAllPlants
} from './selectors.js';

function getEmptyStateContent(state) {
    const query = getQuery(state);
    const filterActive = isFavoritesFilterActive(state);
    if (filterActive) {
        return { message: 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!', imgSrc: "assets/icons/empty.svg" };
    }
    if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        return { message: 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾', imgSrc: "assets/icons/empty.svg" };
    }
    return { message: 'Nu am găsit nicio plantă. Încearcă o altă căutare.', imgSrc: "assets/icons/empty.svg" };
}

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
        
        window.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (!getModalPlant(state)) return;

            switch (e.key) {
                case 'ArrowRight':
                    store.dispatch(plantsActions.navigateModal('next'));
                    break;
                case 'ArrowLeft':
                    store.dispatch(plantsActions.navigateModal('prev'));
                    break;
                case 'Escape':
                    store.dispatch(plantsActions.closeModal());
                    break;
            }
        });
    },
    syncUI: ({ dom, components, state, oldState }) => {
        const currentPlants = state.plants;
        const oldPlants = oldState.plants || {};
        const needsGridRender =
            isPlantsLoading(state) !== isPlantsLoading(oldState) ||
            getQuery(state) !== getQuery(oldState) ||
            JSON.stringify(getActiveTags(state)) !== JSON.stringify(getActiveTags(oldState)) ||
            getSortOrder(state) !== getSortOrder(oldState) ||
            getAllPlants(state).length !== (getAllPlants(oldState) || []).length ||
            isFavoritesFilterActive(state) !== isFavoritesFilterActive(oldState) ||
            JSON.stringify(getFavoriteIds(state)) !== JSON.stringify(getFavoriteIds(oldState));

        if (needsGridRender) {
            const visiblePlants = getMemoizedSortedAndFilteredPlants(
                getAllPlants(state), getQuery(state), getActiveTags(state), getSortOrder(state),
                isFavoritesFilterActive(state), getFavoriteIds(state)
            );
            components.plantGrid.render({
                plants: visiblePlants,
                isLoading: isPlantsLoading(state),
                favoriteIds: getFavoriteIds(state),
                emptyStateContent: visiblePlants.length === 0 && !isPlantsLoading(state)
                    ? getEmptyStateContent(state)
                    : null
            });
        }

        if (dom.searchInput.value !== getQuery(state)) {
            dom.searchInput.value = getQuery(state);
        }
        if (dom.sortSelect.value !== getSortOrder(state)) {
            dom.sortSelect.value = getSortOrder(state);
        }

        if (JSON.stringify(getAllUniqueTags(state)) !== JSON.stringify((getAllUniqueTags(oldState))) ||
            JSON.stringify(getActiveTags(state)) !== JSON.stringify((getActiveTags(oldState)))) {
            components.tagFilter.render({
                allTags: getAllUniqueTags(state),
                activeTags: getActiveTags(state),
            });
        }
        
        const currentModalPlant = getModalPlant(state);
        const oldModalPlant = getModalPlant(oldState);
        const currentCopyStatus = getCopyStatus(state);
        const oldCopyStatus = getCopyStatus(oldState);

        if (currentModalPlant !== oldModalPlant || currentCopyStatus !== oldCopyStatus) {
            ensurePlantModalIsLoaded().then(modal => {
                if (currentModalPlant && currentModalPlant.current) {
                    modal.render({
                        plant: currentModalPlant.current,
                        adjacentPlants: { prev: currentModalPlant.prev, next: currentModalPlant.next },
                        copyStatus: currentCopyStatus
                    });
                } else {
                    modal.close();
                }
            });
        }
    }
};