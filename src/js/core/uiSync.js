// src/js/core/uiSync.js

import { debounce } from '../utils/helpers.js';
import { updateURLFromState } from '../services/urlService.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { PET_KEYWORDS } from '../utils/constants.js';
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';
import { handleError } from './errorHandler.js';
import { applyTheme } from '../ui/ThemeToggle.js';

function getEmptyStateContent(state) {
    const { query } = state.plants;
    const { filterActive } = state.favorites;

    if (filterActive) {
        return { message: 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!', imgSrc: "assets/icons/empty.svg" };
    }
    if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        return { message: 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾', imgSrc: "assets/icons/empty.svg" };
    }
    return { message: 'Nu am găsit nicio plantă. Încearcă o altă căutare.', imgSrc: "assets/icons/empty.svg" };
}

function syncGrid(currentState, oldState, components) {
    const currentPlants = currentState.plants;
    const oldPlants = oldState.plants || {};
    const currentFavorites = currentState.favorites;
    const oldFavorites = oldState.favorites || {};

    const needsRender = 
        currentPlants.isLoading !== oldPlants.isLoading ||
        currentPlants.query !== oldPlants.query ||
        JSON.stringify(currentPlants.activeTags) !== JSON.stringify(oldPlants.activeTags) ||
        currentPlants.sortOrder !== oldPlants.sortOrder ||
        currentPlants.all.length !== (oldPlants.all || []).length ||
        currentFavorites.filterActive !== oldFavorites.filterActive ||
        JSON.stringify(currentFavorites.ids) !== JSON.stringify(oldFavorites.ids);

    if (!needsRender) return;

    const visiblePlants = getMemoizedSortedAndFilteredPlants(
        currentPlants.all, currentPlants.query, currentPlants.activeTags, currentPlants.sortOrder,
        currentFavorites.filterActive, currentFavorites.ids
    );
    
    components.plantGrid.render({
        plants: visiblePlants,
        isLoading: currentPlants.isLoading,
        favoriteIds: currentFavorites.ids,
        emptyStateContent: visiblePlants.length === 0 && !currentPlants.isLoading 
            ? getEmptyStateContent(currentState) 
            : null
    });
}

function syncControls(currentState, oldState, elements) {
    const { searchInput, sortSelect, showFavoritesBtn } = elements;
    const { plants: currentPlants, favorites: currentFavorites } = currentState;

    // --- CORECTURĂ: Asigurăm sincronizarea necondiționată a valorilor ---
    // Verificăm dacă valoarea din DOM este diferită de cea din state înainte de a o modifica,
    // pentru a evita manipulări DOM inutile, dar asigurăm că state-ul este sursa de adevăr.
    if (searchInput.value !== currentPlants.query) {
        searchInput.value = currentPlants.query;
    }
    if (sortSelect.value !== currentPlants.sortOrder) {
        sortSelect.value = currentPlants.sortOrder;
    }
    
    // Logica pentru butonul de favorite rămâne aceeași
    const isFilterActive = currentFavorites.filterActive;
    if (showFavoritesBtn.classList.contains('active') !== isFilterActive) {
        showFavoritesBtn.classList.toggle('active', isFilterActive);
    }
}

function syncTagFilter(currentState, oldState, components) {
    const current = currentState.plants;
    const old = oldState.plants || {};

    if (JSON.stringify(current.allUniqueTags) !== JSON.stringify(old.allUniqueTags) ||
        JSON.stringify(current.activeTags) !== JSON.stringify(old.activeTags)) {
        components.tagFilter.render({
            allTags: current.allUniqueTags,
            activeTags: current.activeTags,
        });
    }
}

function syncModals(currentState, oldState, components) {
    const currentPlants = currentState.plants;
    const oldPlants = oldState.plants || {};
    const currentFaq = currentState.faq;
    const oldFaq = oldState.faq || {};

    // Sincronizare Modal Plantă
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

    // Sincronizare Modal FAQ
    if (currentFaq.isOpen !== oldFaq.isOpen) {
        if (currentFaq.isOpen) {
            if (currentFaq.data) components.faqModal.populate(currentFaq.data);
            components.faqModal.open();
        } else {
            components.faqModal.close();
        }
    }
}

function syncTheme(currentState, oldState) {
    if (!currentState.theme) return;

    const currentTheme = currentState.theme.current;
    const oldTheme = oldState.theme?.current;

    if (currentTheme !== oldTheme) {
        applyTheme(currentTheme);
    }
}

export function syncStateToUI(elements, components, store) {
    const debouncedUpdateURL = debounce(updateURLFromState, 300);

    // O funcție centrală care actualizează toate părțile UI-ului
    const updateUI = (currentState, oldState) => {
        syncGrid(currentState, oldState, components);
        syncControls(currentState, oldState, elements);
        syncTagFilter(currentState, oldState, components);
        syncModals(currentState, oldState, components);
        syncTheme(currentState, oldState);
        debouncedUpdateURL(currentState);
    };

    // Abonează-te la schimbările viitoare
    store.subscribe(updateUI);

    // **CORECTAT**: Realizează o primă actualizare manuală a UI-ului
    // Folosim un obiect gol ca `oldState` pentru a forța o randare completă.
    updateUI(store.getState(), {});
}