import { subscribe } from './state.js';
import { debounce } from '../utils/helpers.js';
import { updateURLFromState } from '../services/urlService.js';
import { getMemoizedSortedAndFilteredPlants } from '../services/memoizedLogic.js';
import { TIMINGS, PET_KEYWORDS } from '../utils/constants.js'; // Am adăugat PET_KEYWORDS
import { ensurePlantModalIsLoaded } from '../utils/dynamicLoader.js';

/**
 * ADAUGAT: O funcție helper pentru a determina conținutul stării goale.
 * @param {object} state - Starea curentă a aplicației.
 * @returns {{message: string, imgSrc: string}}
 */
function getEmptyStateContent(state) {
    const { query, favoritesFilterActive } = state;
    let message = 'Nu am găsit nicio plantă. Încearcă o altă căutare sau resetează filtrele.';
    let imgSrc = "assets/icons/empty.svg";

    if (favoritesFilterActive) {
        message = 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!';
    } else if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        message = 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾';
    }

    return { message, imgSrc };
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
                    isLoading: currentState.isLoading,
                    favoriteIds: currentState.favoriteIds,
                    // Dacă nu sunt plante, generăm conținutul stării goale
                    emptyStateContent: visiblePlants.length === 0 && !currentState.isLoading
                        ? getEmptyStateContent(currentState) 
                        : null
                });
            };
            
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
        } 
        else if (!currentState.modalPlant && oldState.modalPlant) {
            ensurePlantModalIsLoaded().then(modal => {
                modal.close();
            }).catch(err => {
                console.error("Nu s-a putut obține instanța modalului pentru a-l închide.", err);
            });
        }

        // --- 5. Sincronizarea Modalului FAQ ---
        if (currentState.faqData && currentState.faqData !== oldState.faqData) {
            components.faqModal.populate(currentState.faqData);
        }
        if (currentState.isFaqOpen !== oldState.isFaqOpen) {
            currentState.isFaqOpen ? components.faqModal.open() : components.faqModal.close();
        }

        // --- 6. Sincronizarea URL-ului ---
        if (isInitialized) {
            debouncedUpdateURL(currentState);
        }
    });

    return (status) => {
        isInitialized = status;
    };
}