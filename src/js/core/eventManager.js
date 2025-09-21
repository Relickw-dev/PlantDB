// src/js/core/eventManager.js

import { debounce } from '../utils/helpers.js';
import * as actions from './actions.js';
import { CUSTOM_EVENTS, TIMINGS, FAB_ACTIONS, THEME } from '../utils/constants.js';
import { applyTheme } from '../components/ThemeToggle.js';
import { getStateFromURL } from '../services/urlService.js';
import { getState } from './state.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';

// --- NOU: Logica pentru Tooltip ---
let currentTooltipTarget = null;

/**
 * Poziționează tooltip-ul relativ la elementul țintă.
 * @param {HTMLElement} target - Elementul care declanșează tooltip-ul.
 * @param {HTMLElement} tooltip - Elementul tooltip.
 */
function positionTooltip(target, tooltip) {
    if (!target || !tooltip) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 10;

    let top = targetRect.top - tooltipRect.height - margin;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    if (left < margin) left = margin;
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
    }
    if (top < margin) {
        top = targetRect.bottom + margin;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Afișează tooltip-ul.
 * @param {MouseEvent} e - Evenimentul de mouseover.
 * @param {HTMLElement} tooltipElement - Elementul DOM al tooltip-ului.
 */
function showTooltip(e, tooltipElement) {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    currentTooltipTarget = target;
    tooltipElement.textContent = currentTooltipTarget.getAttribute('data-tooltip');
    tooltipElement.classList.add('visible');
    tooltipElement.setAttribute('aria-hidden', 'false');
    positionTooltip(currentTooltipTarget, tooltipElement);
}

/**
 * Ascunde tooltip-ul.
 * @param {HTMLElement} tooltipElement - Elementul DOM al tooltip-ului.
 */
function hideTooltip(tooltipElement) {
    if (!currentTooltipTarget) return;
    currentTooltipTarget = null;
    tooltipElement.classList.remove('visible');
    tooltipElement.setAttribute('aria-hidden', 'true');
}


// --- Funcții Helper pentru gestionarea evenimentelor ---

/**
 * Gestionează click-ul pe butonul de favorit de pe un card.
 * @param {HTMLElement} target - Elementul pe care s-a dat click.
 */
function handleFavoriteClick(target) {
    const plantId = parseInt(target.dataset.plantId, 10);
    if (!isNaN(plantId)) {
        actions.toggleFavorite(plantId);
    }
}

/**
 * Gestionează click-ul pe un card de plantă pentru a deschide modalul.
 * @param {HTMLElement} target - Elementul pe care s-a dat click.
 */
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

/**
 * Handler centralizat pentru click-uri, folosind delegarea de evenimente pe body.
 * Identifică ținta și deleagă acțiunea către funcția corespunzătoare.
 * @param {MouseEvent} e - Obiectul evenimentului de click.
 */
function handleBodyClick(e) {
    const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
    if (favoriteBtn) {
        e.stopPropagation(); // Previne deschiderea modalului
        handleFavoriteClick(favoriteBtn);
        return;
    }

    const card = e.target.closest('.card[data-id]');
    if (card) {
        handleCardClick(card);
        return;
    }
}

/**
 * Gestionează acțiunile declanșate de Floating Action Button (FAB).
 * @param {CustomEvent} e - Evenimentul custom 'fab-action'.
 */
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

/**
 * Gestionează navigația prin taste (stânga, dreapta, escape).
 * @param {KeyboardEvent} e - Obiectul evenimentului de la tastatură.
 */
function handleKeyboardNavigation(e) {
    const state = getState();
    const isModalOpen = !!state.modalPlant;
    const isFaqOpen = state.isFaqOpen;

    if (!isModalOpen && !isFaqOpen) return;

    switch (e.key) {
        case 'ArrowRight':
            if (isModalOpen) actions.navigateModal('next');
            break;
        case 'ArrowLeft':
            if (isModalOpen) actions.navigateModal('prev');
            break;
        case 'Escape':
            if (isModalOpen) actions.closeModal();
            if (isFaqOpen) actions.closeFaqModal();
            break;
    }
}

/**
 * NOU: Handler pentru evenimentul 'popstate' (navigare back/forward în browser).
 */
const handlePopState = () => actions.initialize(getStateFromURL());


// --- Funcții principale de legare și dezlegare a evenimentelor ---

/**
 * Atașează toate event listener-ele necesare aplicației.
 * @param {Object} dom - Referințele către elementele DOM.
 */
export function bindEventListeners(dom) {
    // Evenimente pe controale specifice
    dom.searchInput.addEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    dom.sortSelect.addEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    dom.resetButton.addEventListener('click', actions.resetFilters);
    dom.showFavoritesBtn.addEventListener('click', actions.toggleFavoritesFilter);
    dom.randomBtn.addEventListener('click', () => {
        ensurePlantModalIsLoaded().then(() => actions.selectRandomPlant());
    });

    // Delegare la nivel de body
    document.body.addEventListener('click', handleBodyClick);

    // NOU: Evenimente pentru tooltip
    document.body.addEventListener('mouseover', (e) => showTooltip(e, dom.tooltip));
    document.body.addEventListener('mouseout', () => hideTooltip(dom.tooltip));
    window.addEventListener('scroll', () => hideTooltip(dom.tooltip), { capture: true });


    // Evenimente custom
    dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => actions.selectTag(e.detail.tag));
    dom.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, actions.closeFaqModal);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, actions.closeModal);
    dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, (e) => actions.navigateModal(e.detail.direction));
    dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, actions.copyPlantDetails);

    // Evenimente FAB
    dom.fabContainer.addEventListener('fab-action', handleFabAction);

    // Evenimente globale (window)
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * NOU: Detașează toți event listener-ii pentru a preveni memory leaks.
 * @param {Object} dom - Referințele către elementele DOM.
 */
export function unbindEventListeners(dom) {
    // Detașarea listener-ilor de pe controale
    dom.searchInput.removeEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    dom.sortSelect.removeEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    dom.resetButton.removeEventListener('click', actions.resetFilters);
    dom.showFavoritesBtn.removeEventListener('click', actions.toggleFavoritesFilter);
    dom.randomBtn.removeEventListener('click', () => {
        ensurePlantModalIsLoaded().then(() => actions.selectRandomPlant());
    });
    
    // Detașarea listener-ului de pe body
    document.body.removeEventListener('click', handleBodyClick);
    
    // NOU: Detașarea listener-ilor pentru tooltip
    document.body.removeEventListener('mouseover', (e) => showTooltip(e, dom.tooltip));
    document.body.removeEventListener('mouseout', () => hideTooltip(dom.tooltip));
    window.removeEventListener('scroll', () => hideTooltip(dom.tooltip), { capture: true });

    // Detașarea listener-ilor de evenimente custom (deși nu este strict necesar dacă elementele sunt distruse)
    dom.faqModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, actions.closeFaqModal);
    dom.plantModal.removeEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, actions.closeModal);
    
    // Detașarea listener-ului FAB
    dom.fabContainer.removeEventListener('fab-action', handleFabAction);

    // Detașarea listener-ilor globali
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('keydown', handleKeyboardNavigation);
}