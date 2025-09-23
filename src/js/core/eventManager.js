// src/js/core/eventManager.js

import { debounce } from '../utils/helpers.js';
import * as actions from './actions.js';
import { CUSTOM_EVENTS, TIMINGS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import { applyTheme } from '../components/ThemeToggle.js';
import { getStateFromURL } from '../services/urlService.js';
import { getState } from './state.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';


// --- NOU: Stocăm referințele la funcțiile handler pentru a le putea elimina corect ---
const eventHandlers = {
    // Folosim o funcție debounce stocată, nu una creată dinamic
    handleSearchInput: debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE),
    handleSortChange: (e) => actions.changeSortOrder(e.target.value),
    handleRandomClick: () => {
        ensurePlantModalIsLoaded().then(() => actions.selectRandomPlant());
    },
    handleTagSelected: (e) => actions.selectTag(e.detail.tag),
    handleFaqCloseRequest: actions.closeFaqModal,
    handleModalCloseRequest: actions.closeModal,
    handleModalNavigateRequest: (e) => actions.navigateModal(e.detail.direction),
    handleModalCopyRequest: actions.copyPlantDetails
};


// --- Funcții Helper pentru gestionarea evenimentelor (rămân neschimbate) ---

function handleFavoriteClick(target) {
    const plantId = parseInt(target.dataset.plantId, 10);
    if (!isNaN(plantId)) {
        actions.toggleFavorite(plantId);
    }
}

function handleCardClick(target) {
    const plantId = parseInt(target.dataset.id, 10);
    if (isNaN(plantId)) return;

    ensurePlantModalIsLoaded()
        .then(modal => {
            actions.openPlantModal(plantId);
        })
        .catch(err => {
            console.error("Eroare la încărcarea dinamică a modalului:", err);
        });
}

function handleBodyClick(e) {
    const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
    if (favoriteBtn) {
        e.stopPropagation();
        handleFavoriteClick(favoriteBtn);
        return;
    }

    const card = e.target.closest('.card[data-id]');
    if (card) {
        handleCardClick(card);
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
            actions.openFaqModal();
            break;
        default:
            console.warn(`Acțiune FAB necunoscută: ${action}`);
    }
}

function handleKeyboardNavigation(e) {
    const state = getState();
    if (!state.modalPlant && !state.isFaqOpen) return;

    switch (e.key) {
        case 'ArrowRight':
            if (state.modalPlant) actions.navigateModal('next');
            break;
        case 'ArrowLeft':
            if (state.modalPlant) actions.navigateModal('prev');
            break;
        case 'Escape':
            if (state.modalPlant) actions.closeModal();
            if (state.isFaqOpen) actions.closeFaqModal();
            break;
    }
}

const handlePopState = () => actions.initialize(getStateFromURL());


// --- Funcții principale de legare și dezlegare a evenimentelor ---

/**
 * MODIFICAT: Atașează toți event listener-ele folosind referințe stocate.
 */
export function bindEventListeners(dom) {
    dom.searchInput.addEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.addEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.addEventListener('click', actions.resetFilters);
    dom.showFavoritesBtn.addEventListener('click', actions.toggleFavoritesFilter);
    dom.randomBtn.addEventListener('click', eventHandlers.handleRandomClick);
    
    document.body.addEventListener('click', handleBodyClick);

    dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, eventHandlers.handleTagSelected);
    dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleFaqCloseRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleModalCloseRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, eventHandlers.handleModalNavigateRequest);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, eventHandlers.handleModalCopyRequest);

    dom.fabContainer.addEventListener('fab-action', handleFabAction);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * MODIFICAT: Detașează toți event listener-ii folosind aceleași referințe.
 */
export function unbindEventListeners(dom) {
    dom.searchInput.removeEventListener('input', eventHandlers.handleSearchInput);
    dom.sortSelect.removeEventListener('change', eventHandlers.handleSortChange);
    dom.resetButton.removeEventListener('click', actions.resetFilters);
    dom.showFavoritesBtn.removeEventListener('click', actions.toggleFavoritesFilter);
    dom.randomBtn.removeEventListener('click', eventHandlers.handleRandomClick);
    
    document.body.removeEventListener('click', handleBodyClick);
    
    // Asigurăm eliminarea corectă pentru TOATE evenimentele custom
    dom.tagFilterContainer.removeEventListener(CUSTOM_EVENTS.TAG_SELECTED, eventHandlers.handleTagSelected);
    dom.faqModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleFaqCloseRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, eventHandlers.handleModalCloseRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, eventHandlers.handleModalNavigateRequest);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.COPY_REQUEST, eventHandlers.handleModalCopyRequest);
    
    dom.fabContainer.removeEventListener('fab-action', handleFabAction);

    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('keydown', handleKeyboardNavigation);
}