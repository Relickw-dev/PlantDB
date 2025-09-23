// src/js/core/eventManager.js

import store from '../store/index.js';
import { debounce } from '../utils/helpers.js';
import * as plantActions from '../features/plants/plantsActions.js';
import * as favoriteActions from '../features/favorites/favoritesActions.js';
import * as faqActions from '../features/faq/faqActions.js';
import { CUSTOM_EVENTS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import * as themeActions from '../features/theme/themeActions.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';

// Handler-ele sunt acum grupate logic pe module
const eventHandlers = {
    // Plants
    handleSearchInput: debounce((e) => plantActions.setQuery(e.target.value), 300),
    handleSortChange: (e) => plantActions.setSortOrder(e.target.value),
    handleRandomClick: () => store.dispatch(plantActions.selectRandomPlant()),
    handleTagSelected: (e) => plantActions.selectTag(e.detail.tag),
    
    // Plant Modal
    handleModalCloseRequest: plantActions.closeModal,
    handleModalNavigateRequest: (e) => store.dispatch(plantActions.navigateModal(e.detail.direction)),
    handleModalCopyRequest: () => store.dispatch(plantActions.copyPlantDetails()),
    handleModalShareRequest: () => plantActions.sharePlantDetails(),
    
    // Favorites
    handleShowFavoritesClick: favoriteActions.toggleFavoritesFilter,

    // FAQ
    handleFaqCloseRequest: faqActions.closeFaq,
};

/**
 * Gestionează click-urile globale pe `body`, delegând acțiunile corecte.
 */
function handleBodyClick(e) {
    // Cazul 1: Click pe butonul de favorit de pe un card
    const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
    if (favoriteBtn) {
        e.stopPropagation(); // Previne deschiderea modalului
        const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
        if (!isNaN(plantId)) {
            favoriteActions.toggleFavorite(plantId);
        }
        return;
    }

    // Cazul 2: Click pe un card de plantă
    const card = e.target.closest('.card[data-id]');
    if (card) {
        const plantId = parseInt(card.dataset.id, 10);
        if (isNaN(plantId)) return;
        ensurePlantModalIsLoaded().then(() => store.dispatch(plantActions.openPlantModal(plantId)));
        return;
    }
}

/**
 * Gestionează acțiunile din meniul FAB.
 */
function handleFabAction(e) {
    const { action } = e.detail;
    switch (action) {
        case FAB_ACTIONS.TOGGLE_THEME:
            themeActions.toggleTheme(); // MODIFICAT: Apelăm acțiunea
            break;
        case FAB_ACTIONS.SHOW_FAQ:
            store.dispatch(faqActions.openFaq());
            break;
        default:
            console.warn(`Acțiune FAB necunoscută: ${action}`);
    }
}

/**
 * Gestionează navigația cu tastele stânga/dreapta/escape în modale.
 */
function handleKeyboardNavigation(e) {
    const state = store.getState();
    if (!state.plants.modalPlant && !state.faq.isOpen) return;

    switch (e.key) {
        case 'ArrowRight':
            if (state.plants.modalPlant) store.dispatch(plantActions.navigateModal('next'));
            break;
        case 'ArrowLeft':
            if (state.plants.modalPlant) store.dispatch(plantActions.navigateModal('prev'));
            break;
        case 'Escape':
            if (state.plants.modalPlant) plantActions.closeModal();
            if (state.faq.isOpen) faqActions.closeFaq();
            break;
    }
}

/**
 * Atașează toți event listener-ii necesari aplicației.
 */
export function bindEventListeners(dom) {
    // Controale principale
    dom.searchInput.addEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.addEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.addEventListener('click', plantActions.resetFilters);
    dom.showFavoritesBtn.addEventListener('click', eventHandlers.handleShowFavoritesClick);
    dom.randomBtn.addEventListener('click', eventHandlers.handleRandomClick);
    
    // Evenimente globale
    document.body.addEventListener('click', handleBodyClick);
    window.addEventListener('keydown', handleKeyboardNavigation);

    // Evenimente custom de la componente
    dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, eventHandlers.handleTagSelected);
    dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleFaqCloseRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleModalCloseRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, eventHandlers.handleModalNavigateRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, eventHandlers.handleModalCopyRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.SHARE_REQUEST, eventHandlers.handleModalShareRequest);

    // Meniu FAB
    dom.fabContainer.addEventListener('fab-action', handleFabAction);
}

/**
 * Detașează toți event listener-ii pentru a preveni memory leaks.
 */
export function unbindEventListeners(dom) {
    dom.searchInput.removeEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.removeEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.removeEventListener('click', plantActions.resetFilters);
    dom.showFavoritesBtn.removeEventListener('click', eventHandlers.handleShowFavoritesClick);
    dom.randomBtn.removeEventListener('click', eventHandlers.handleRandomClick);
    
    document.body.removeEventListener('click', handleBodyClick);
    window.removeEventListener('keydown', handleKeyboardNavigation);

    dom.tagFilterContainer.removeEventListener(CUSTOM_EVENTS.TAG_SELECTED, eventHandlers.handleTagSelected);
    dom.faqModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleFaqCloseRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleModalCloseRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, eventHandlers.handleModalNavigateRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.COPY_REQUEST, eventHandlers.handleModalCopyRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.SHARE_REQUEST, eventHandlers.handleModalShareRequest);

    dom.fabContainer.removeEventListener('fab-action', handleFabAction);
}