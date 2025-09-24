// src/js/core/eventManager.js
import * as plantActions from '../features/plants/plantsActions.js';
import * as faqActions from '../features/faq/faqActions.js';

/**
 * Gestionează navigația cu tastele stânga/dreapta/escape în modale.
 */
function handleKeyboardNavigation(e, store) {
    const state = store.getState();
    if (!state.plants?.modalPlant && !state.faq?.isOpen) return;

    switch (e.key) {
        case 'ArrowRight':
            if (state.plants.modalPlant) store.dispatch(plantActions.navigateModal('next'));
            break;
        case 'ArrowLeft':
            if (state.plants.modalPlant) store.dispatch(plantActions.navigateModal('prev'));
            break;
        case 'Escape':
            if (state.plants.modalPlant) store.dispatch(plantActions.closeModal());
            if (state.faq.isOpen) store.dispatch(faqActions.closeFaq());
            break;
    }
}

/**
 * Atașează toți event listener-ii globali necesari aplicației.
 */
export function bindEventListeners(dom, store) {
    // Stocăm handler-ul pentru a-l putea elimina ulterior
    const keydownHandler = (e) => handleKeyboardNavigation(e, store);
    window.addEventListener('keydown', keydownHandler);
    
    // Stocăm o referință la handler pe window pentru a-l putea accesa la unbind
    window._keydownHandler = keydownHandler;
}


/**
 * Detașează toți event listener-ii pentru a preveni memory leaks.
 */
export function unbindEventListeners() {
    if (window._keydownHandler) {
        window.removeEventListener('keydown', window._keydownHandler);
        delete window._keydownHandler;
    }
}