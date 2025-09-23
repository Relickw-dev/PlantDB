// src/js/core/eventManager.js
import { debounce } from '../utils/helpers.js';
import * as plantActions from '../features/plants/plantsActions.js';
import { CUSTOM_EVENTS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import { applyTheme } from '../ui/ThemeToggle.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';

// TODO: Import actions from future modules
// import * as faqActions from '../features/faq/faqActions.js';
// import * as favoriteActions from '../features/favorites/favoriteActions.js';

const eventHandlers = {
    handleSearchInput: debounce((e) => plantActions.setQuery(e.target.value), 300),
    handleSortChange: (e) => plantActions.setSortOrder(e.target.value),
    handleRandomClick: () => plantActions.selectRandomPlant(),
    handleTagSelected: (e) => plantActions.selectTag(e.detail.tag),
    
    handleModalCloseRequest: plantActions.closeModal,
    handleModalNavigateRequest: (e) => plantActions.navigateModal(e.detail.direction),
    handleModalCopyRequest: () => plantActions.copyPlantDetails(),
    handleModalShareRequest: () => { /* TODO: Implement share action */ },
    
    // handleFaqCloseRequest: faqActions.closeFaq,
    // handleShowFavoritesClick: favoriteActions.toggleFilter,
};

function handleBodyClick(e) {
    const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
    if (favoriteBtn) {
        e.stopPropagation();
        const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
        if (!isNaN(plantId)) {
            // TODO: Call favorite action
            // favoriteActions.toggleFavorite(plantId);
        }
        return;
    }

    const card = e.target.closest('.card[data-id]');
    if (card) {
        const plantId = parseInt(card.dataset.id, 10);
        if (isNaN(plantId)) return;
        ensurePlantModalIsLoaded().then(() => plantActions.openPlantModal(plantId));
        return;
    }
}

function handleFabAction(e) {
    const { action } = e.detail;
    switch (action) {
        case FAB_ACTIONS.TOGGLE_THEME: {
            const isLight = document.documentElement.classList.contains(THEME.CSS_CLASS_LIGHT);
            applyTheme(isLight ? THEME.DARK : THEME.LIGHT);
            break;
        }
        case FAB_ACTIONS.SHOW_FAQ:
            // TODO: Call faq action
            // faqActions.openFaq();
            break;
        default:
            console.warn(`Acțiune FAB necunoscută: ${action}`);
    }
}

function handleKeyboardNavigation(e) {
    // const state = store.getState(); // Needs store to be imported
    // This logic can be moved into a more specific module if it becomes complex
}

const handlePopState = () => {
    // This needs to be re-evaluated. The AppController handles initialization from URL.
    // Subsequent popstate events might need a dedicated action.
};

export function bindEventListeners(dom) {
    dom.searchInput.addEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.addEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.addEventListener('click', plantActions.resetFilters);
    // dom.showFavoritesBtn.addEventListener('click', eventHandlers.handleShowFavoritesClick);
    dom.randomBtn.addEventListener('click', eventHandlers.handleRandomClick);
    
    document.body.addEventListener('click', handleBodyClick);

    dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, eventHandlers.handleTagSelected);
    // dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleFaqCloseRequest);
    
    dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleModalCloseRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, eventHandlers.handleModalNavigateRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, eventHandlers.handleModalCopyRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.SHARE_REQUEST, eventHandlers.handleModalShareRequest);

    dom.fabContainer.addEventListener('fab-action', handleFabAction);
    // window.addEventListener('popstate', handlePopState);
    // window.addEventListener('keydown', handleKeyboardNavigation);
}

export function unbindEventListeners(dom) {
    dom.searchInput.removeEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.removeEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.removeEventListener('click', plantActions.resetFilters);
    // ... and so on for all event listeners
}