// src/js/features/plants/index.js
import { plantsReducer } from './plantsReducer.js';
import * as plantsActions from './plantsActions.js';
import { CUSTOM_EVENTS } from '../../utils/constants.js';
import { ensurePlantModalIsLoaded } from '../../utils/dynamicLoader.js';
import { debounce } from '../../utils/helpers.js'; // Am adăugat import pentru debounce

export default {
    name: 'plants',
    reducer: plantsReducer,
    bindEvents: (dom, store) => {
        // --- Controale principale ---
        // Folosim o funcție debounced pentru a nu supraîncărca store-ul la fiecare tastă apăsată
        const debouncedSearch = debounce((value) => store.dispatch(plantsActions.setQuery(value)), 300);
        
        dom.searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        dom.sortSelect.addEventListener('change', (e) => store.dispatch(plantsActions.setSortOrder(e.target.value)));
        
        // CORECTAT: Acum butonul de reset va funcționa corect
        dom.resetButton.addEventListener('click', () => store.dispatch(plantsActions.resetFilters()));
        
        dom.randomBtn.addEventListener('click', () => store.dispatch(plantsActions.selectRandomPlant()));
        
        // --- Filtre de tag-uri ---
        dom.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => store.dispatch(plantsActions.selectTag(e.detail.tag)));
        
        // --- Evenimente specifice modalului de plantă ---
        dom.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => store.dispatch(plantsActions.closeModal()));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, (e) => store.dispatch(plantsActions.navigateModal(e.detail.direction)));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, () => store.dispatch(plantsActions.copyPlantDetails()));
        dom.plantModal.addEventListener(CUSTOM_EVENTS.SHARE_REQUEST, () => store.dispatch(plantsActions.sharePlantDetails()));

        // --- Delegare eveniment global pentru deschiderea modalului ---
        document.body.addEventListener('click', (e) => {
            const card = e.target.closest('.card[data-id]');
            // Asigură-te că nu este un click pe butonul de favorit
            const isFavoriteButton = e.target.closest('.favorite-btn');
            
            if (card && !isFavoriteButton) {
                const plantId = parseInt(card.dataset.id, 10);
                if (isNaN(plantId)) return;
                ensurePlantModalIsLoaded().then(() => store.dispatch(plantsActions.openPlantModal(plantId)));
            }
        });
    }
};