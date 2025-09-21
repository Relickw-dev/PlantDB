// src/js/core/eventManager.js

import { debounce } from '../utils/helpers.js';
import * as actions from './actions.js';
import { CUSTOM_EVENTS, TIMINGS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import { applyTheme } from '../components/ThemeToggle.js';
import { getStateFromURL } from '../services/urlService.js';
import { getState } from './state.js';

// Variabilă pentru instanța modalului încărcat dinamic
let plantModalInstance = null;

async function ensurePlantModalIsLoaded() {
    if (plantModalInstance) return plantModalInstance;
    const { PlantModal } = await import('../components/PlantModal.js');
    plantModalInstance = new PlantModal();
    return plantModalInstance;
}

// O funcție helper pentru a gestiona acțiunile care necesită modalul
const handleAsyncModalAction = async (actionCallback) => {
    try {
        await ensurePlantModalIsLoaded();
        actionCallback();
    } catch (err) {
        console.error("Eroare la încărcarea sau execuția acțiunii pe modal:", err);
    }
};

/**
 * Atașează toate event listener-ele necesare aplicației.
 * @param {Object} elements - Referințele către elementele DOM.
 */
export function bindEventListeners(elements) {
    elements.searchInput.addEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    elements.sortSelect.addEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    elements.resetButton.addEventListener('click', () => actions.resetFilters());
    elements.showFavoritesBtn.addEventListener('click', () => actions.toggleFavoritesFilter());
    elements.randomBtn.addEventListener('click', () => handleAsyncModalAction(actions.selectRandomPlant));

    // Event Delegation pentru grilă
    elements.gridContainer.addEventListener('click', (e) => {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.stopPropagation();
            const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
            if (!isNaN(plantId)) actions.toggleFavorite(plantId);
            return;
        }

        const card = e.target.closest(".card[data-id]");
        if (card) {
            const plantId = parseInt(card.dataset.id, 10);
            handleAsyncModalAction(() => actions.openPlantModal(plantId));
        }
    });

    // Evenimente custom
    elements.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => actions.selectTag(e.detail.tag));
    elements.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeFaqModal());
    elements.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeModal());
    elements.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, (e) => actions.navigateModal(e.detail.direction));
    elements.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, () => actions.copyPlantDetails());

    // Evenimente FAB (Floating Action Button)
    elements.fabContainer.addEventListener('fab-action', (e) => {
        const { action } = e.detail;
        if (action === FAB_ACTIONS.TOGGLE_THEME) {
            const isLight = document.documentElement.classList.contains(THEME.CSS_CLASS_LIGHT);
            applyTheme(isLight ? THEME.DARK : THEME.LIGHT);
        } else if (action === FAB_ACTIONS.SHOW_FAQ) {
            actions.openFaqModal();
        }
    });

    // Evenimente globale (window)
    window.addEventListener('popstate', () => actions.initialize(getStateFromURL()));
    window.addEventListener('keydown', handleKeyboardNavigation);
}

function handleKeyboardNavigation(e) {
    const state = getState();
    if (!state.modalPlant && !state.isFaqOpen) return;

    if (state.modalPlant) {
        if (e.key === 'ArrowRight') actions.navigateModal('next');
        if (e.key === 'ArrowLeft') actions.navigateModal('prev');
    }
    if (e.key === 'Escape') {
        if (state.modalPlant) actions.closeModal();
        if (state.isFaqOpen) actions.closeFaqModal();
    }
}