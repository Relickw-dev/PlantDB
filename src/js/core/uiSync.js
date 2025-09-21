import { subscribe } from './state.js';
import { debounce } from '../utils/helpers.js';
import { updateURLFromState } from '../services/urlService.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { TIMINGS } from '../utils/constants.js';

// Stochează instanța modalului încărcată dinamic pentru a evita re-importarea.
let plantModalInstance = null;

/**
 * Încarcă dinamic componenta PlantModal la prima utilizare.
 * @returns {Promise<PlantModal>} Instanța componentei.
 */
async function ensurePlantModalIsLoaded() {
    if (plantModalInstance) return plantModalInstance;
    // Folosim dynamic import pentru a încărca fișierul doar la nevoie
    const { PlantModal } = await import('../components/PlantModal.js');
    plantModalInstance = new PlantModal();
    return plantModalInstance;
}

/**
 * Conectează starea la UI, asigurând că interfața reflectă întotdeauna starea curentă.
 * Aceasta este funcția "reactivă" principală a aplicației.
 * @param {Object} elements - Referințele către elementele DOM esențiale.
 * @param {Object} components - Referințele către instanțele componentelor UI.
 * @returns {Function} O funcție callback pentru a seta starea de "inițializat" a aplicației.
 */
export function syncStateToUI(elements, components) {
    let isInitialized = false;
    const debouncedUpdateURL = debounce(updateURLFromState, 300);

    // Ne abonăm la schimbările de stare.
    // Acest callback va fi executat de fiecare dată când `updateState` este apelat.
    subscribe((currentState, oldState) => {

        // --- 1. Sincronizarea Grilei de Plante ---
        const hasGridContentChanged =
            currentState.isLoading !== oldState.isLoading ||
            currentState.query !== oldState.query ||
            JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags) ||
            currentState.sortOrder !== oldState.sortOrder ||
            currentState.favoritesFilterActive !== oldState.favoritesFilterActive;

        const needsGridRender =
            hasGridContentChanged ||
            JSON.stringify(currentState.favoriteIds) !== JSON.stringify(oldState.favoriteIds) ||
            currentState.plants.length !== oldState.plants.length;

        if (needsGridRender) {
            const renderGridContent = () => {
                const visiblePlants = getMemoizedSortedAndFilteredPlants(
                    currentState.plants,
                    currentState.query,
                    currentState.activeTags,
                    currentState.sortOrder,
                    currentState.favoritesFilterActive,
                    currentState.favoriteIds
                );
                components.plantGrid.render({
                    plants: visiblePlants,
                    query: currentState.query,
                    isLoading: currentState.isLoading,
                    favoriteIds: currentState.favoriteIds,
                    favoritesFilterActive: currentState.favoritesFilterActive
                });
            };
            
            // Adaugă o animație de fade doar dacă se schimbă filtrele, nu și la încărcarea inițială.
            const isContentTransition = hasGridContentChanged && !currentState.isLoading && !oldState.isLoading;
            if (isContentTransition) {
                elements.gridContainer.classList.add('fade-out');
                setTimeout(() => {
                    renderGridContent();
                    elements.gridContainer.classList.remove('fade-out');
                }, TIMINGS.GRID_ANIMATION_DURATION);
            } else {
                renderGridContent();
            }
        }

        // --- 2. Sincronizarea Filtrului de Tag-uri ---
        const haveTagsChanged = currentState.allUniqueTags.length !== oldState.allUniqueTags.length ||
                                JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags);

        if (haveTagsChanged) {
            components.tagFilter.render({
                allTags: currentState.allUniqueTags,
                activeTags: currentState.activeTags,
            });
        }

        // --- 3. Sincronizarea Controalelor (Input, Select) ---
        if (currentState.query !== oldState.query && elements.searchInput.value !== currentState.query) {
            elements.searchInput.value = currentState.query;
        }
        if (currentState.sortOrder !== oldState.sortOrder) {
            elements.sortSelect.value = currentState.sortOrder;
        }
        if (currentState.favoritesFilterActive !== oldState.favoritesFilterActive) {
            elements.showFavoritesBtn.classList.toggle('active', currentState.favoritesFilterActive);
        }

        // --- 4. Sincronizarea Modalului de Plantă ---
        if (currentState.modalPlant && currentState.modalPlant.current) {
            ensurePlantModalIsLoaded().then(modal => {
                modal.render({
                    plant: currentState.modalPlant.current,
                    adjacentPlants: { prev: currentState.modalPlant.prev, next: currentState.modalPlant.next },
                    copyStatus: currentState.copyStatus
                });
            });
        } else if (plantModalInstance && oldState.modalPlant) {
            // Închide modalul doar dacă a existat anterior
            plantModalInstance.close();
        }

        // --- 5. Sincronizarea Modalului FAQ ---
        if (currentState.faqData && currentState.faqData !== oldState.faqData) {
            components.faqModal.populate(currentState.faqData);
        }
        if (currentState.isFaqOpen !== oldState.isFaqOpen) {
            currentState.isFaqOpen ? components.faqModal.open() : components.faqModal.close();
        }

        // --- 6. Sincronizarea URL-ului ---
        // Actualizează URL-ul doar după ce aplicația a fost complet inițializată.
        if (isInitialized) {
            debouncedUpdateURL(currentState);
        }
    });

    // Returnează o funcție care permite setarea flag-ului de inițializare
    return (status) => {
        isInitialized = status;
    };
}