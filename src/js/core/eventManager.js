// src/js/core/eventManager.js

import { debounce } from '../utils/helpers.js';
import * as actions from './actions.js';
import { CUSTOM_EVENTS, TIMINGS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import { applyTheme } from '../components/ThemeToggle.js';
import { getStateFromURL } from '../services/urlService.js';
import { getState } from './state.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';


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
 * MODIFICARE: Logica de click pentru carduri și butoane de favorit a fost mutată aici.
 * Acesta este noul handler centralizat pentru click-uri.
 */
function handleBodyClick(e) {
    const target = e.target;

    // Cazul 1: S-a dat click pe un buton de favorit de pe un card.
    const favoriteBtn = target.closest('.favorite-btn');
    if (favoriteBtn && favoriteBtn.dataset.plantId) {
        // Oprim propagarea pentru a nu declanșa și click-ul pe card.
        e.stopPropagation(); 
        const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
        if (!isNaN(plantId)) {
            actions.toggleFavorite(plantId);
        }
        return; // Am gestionat evenimentul, ieșim.
    }

    // Cazul 2: S-a dat click pe un card de plantă.
    const card = target.closest(".card[data-id]");
    if (card) {
        const plantId = parseInt(card.dataset.id, 10);
        if (!isNaN(plantId)) {
            handleAsyncModalAction(() => actions.openPlantModal(plantId));
        }
        return; // Am gestionat evenimentul, ieșim.
    }
}


/**
 * Atașează toate event listener-ele necesare aplicației.
 * @param {Object} elements - Referințele către elementele DOM.
 */
export function bindEventListeners(elements) {
    // --- Evenimente pe controale specifice (rămân neschimbate) ---
    elements.searchInput.addEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    elements.sortSelect.addEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    elements.resetButton.addEventListener('click', () => actions.resetFilters());
    elements.showFavoritesBtn.addEventListener('click', () => actions.toggleFavoritesFilter());
    elements.randomBtn.addEventListener('click', () => handleAsyncModalAction(actions.selectRandomPlant));

    // --- MODIFICARE: Folosim delegare la nivel de body pentru click-uri ---
    document.body.addEventListener('click', handleBodyClick);

    // --- MODIFICARE: Listener-ul direct pe gridContainer a fost ELIMINAT ---
    /*
    elements.gridContainer.addEventListener('click', (e) => {
        // ... vechea logică a fost mutată în handleBodyClick ...
    });
    */

    // --- Evenimente custom (rămân pe componentele lor pentru claritate) ---
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