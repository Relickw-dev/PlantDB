// --- Importuri ---
import { subscribe } from './core/state.js';
import * as actions from './core/actions.js';
import { CUSTOM_EVENTS, TIMINGS } from './utils/constants.js';
import { debounce } from './utils/helpers.js';
import { showNotification } from './components/NotificationService.js';
import { getStateFromURL, updateURLFromState } from './services/urlService.js';
import { loadFaqData } from './services/plantService.js';
import { getMemoizedSortedAndFilteredPlants } from './services/memoizedLogic.js';
import { PlantGrid } from './components/PlantGrid.js';
import { TagFilter } from './components/TagFilter.js';
import { FaqModal } from './components/FaqModal.js';
import { setupThemeToggle } from './components/ThemeToggle.js';
import { FabMenu } from './components/FabMenu.js';
import { TagToggle } from './components/TagToggle.js';

// --- Variabilă pentru instanța încărcată dinamic ---
let plantModalInstance = null;

/**
 * Asigură că componenta PlantModal este încărcată și instanțiată.
 * O încarcă dinamic la primul apel și apoi returnează instanța.
 */
async function ensurePlantModalIsLoaded() {
    if (!plantModalInstance) {
        try {
            const { PlantModal } = await import('./components/PlantModal.js');
            plantModalInstance = new PlantModal();

            // Atașăm evenimentele specifice modalului aici, o singură dată
            const modalElement = document.getElementById('modal');
            if (modalElement) {
                modalElement.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeModal());
                modalElement.addEventListener('navigate-request', (e) => actions.navigateModal(e.detail.direction));
                modalElement.addEventListener('copy-request', () => actions.copyPlantDetails());
                modalElement.addEventListener(CUSTOM_EVENTS.SHARE_REQUEST, () => actions.sharePlantLink());
            }
        } catch (err) {
            console.error("Eroare la încărcarea dinamică a PlantModal:", err);
            showNotification("Nu am putut încărca componenta de detalii.", { type: "error" });
            throw err; // Aruncăm eroarea pentru a opri fluxul care a apelat funcția
        }
    }
}

// --- Funcții de Setup UI ---
function runIntroAnimation() {
    return new Promise((resolve) => {
        const intro = document.getElementById("intro");
        const container = document.querySelector(".container");
        if (!intro || !container) {
            resolve();
            return;
        }
        setTimeout(() => {
            intro.classList.add("out");
            container.classList.add("loaded");
            intro.addEventListener('animationend', () => {
                intro.classList.add('hidden');
                intro.addEventListener('transitionend', () => {
                    intro.remove();
                    resolve();
                }, { once: true });
            }, { once: true });
        }, TIMINGS.INTRO_DELAY);
    });
}


// --- Gestionarea Evenimentelor ---
function bindEventListeners(elements, components) {
    elements.searchInput.addEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    elements.sortSelect.addEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    elements.resetButton.addEventListener('click', () => actions.resetFilters());
    
    // <-- MODIFICARE: Adăugăm event listener pentru butonul de filtru favorite
    elements.showFavoritesBtn.addEventListener('click', () => actions.toggleFavoritesFilter());

    elements.randomBtn.addEventListener('click', async () => {
        try {
            await ensurePlantModalIsLoaded();
            actions.selectRandomPlant();
        } catch (err) {
            // Dacă încărcarea eșuează, nu facem nimic
        }
    });
    
    // <-- MODIFICARE: Folosim event delegation pentru a gestiona click-urile pe card și pe butonul de favorit
    elements.gridContainer.addEventListener('click', async (e) => {

        console.log('S-a dat click pe grilă!');
        // Prima dată, verificăm dacă s-a dat click pe butonul de favorit
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            // CRUCIAL: Oprim propagarea evenimentului mai departe.
            // Fără această linie, click-ul ar ajunge și la card, deschizând modalul.
            e.stopPropagation(); 
            
            const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
            if (!isNaN(plantId)) {
                actions.toggleFavorite(plantId);
            }
            return; // Oprim execuția aici
        }

        // Dacă nu s-a dat click pe inimă, verificăm dacă s-a dat click pe card
        const card = e.target.closest(".card[data-id]");
        if (card) {
            try {
                await ensurePlantModalIsLoaded();
                const plantId = parseInt(card.dataset.id, 10);
                actions.openPlantModal(plantId);
            } catch (err) {
                // Eroarea este deja gestionată
            }
        }
    });
    
    elements.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => actions.selectTag(e.detail.tag));
    elements.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeFaqModal());

    window.addEventListener('popstate', () => actions.initialize(getStateFromURL()));
}


// --- Logica Reactivă (Sincronizarea Stare -> UI) ---
function createStateSubscribers(elements, components) {
    let isInitialized = false;
    const debouncedUpdateURL = debounce(updateURLFromState, 300);

    subscribe((currentState, oldState) => {
        // --- NOU: Logica pentru actualizarea directă a inimilor ---
        // Verificăm dacă doar lista de favorite s-a schimbat.
        if (JSON.stringify(currentState.favoriteIds) !== JSON.stringify(oldState.favoriteIds)) {
            // Iterăm prin toate cardurile vizibile în DOM.
            const allCards = elements.gridContainer.querySelectorAll('.card[data-id]');
            allCards.forEach(card => {
                const plantId = parseInt(card.dataset.id, 10);
                const favoriteBtn = card.querySelector('.favorite-btn');
                
                if (favoriteBtn) {
                    // Verificăm dacă starea de favorit a acestui card s-a schimbat.
                    const isNowFavorite = currentState.favoriteIds.includes(plantId);
                    // Aplicăm sau eliminăm clasa 'active' direct, fără a re-randa tot.
                    favoriteBtn.classList.toggle('active', isNowFavorite);
                }
            });
        }
        
        // --- MODIFICAT: Logica pentru re-randarea grilei ---
        // Am eliminat verificarea pentru 'favoriteIds' de aici.
        // Grila se va re-randa acum doar la căutare, sortare, sau filtrare de tag-uri.
        const haveDataOrFiltersChanged =
            currentState.isLoading !== oldState.isLoading ||
            currentState.plants.length !== oldState.plants.length ||
            currentState.query !== oldState.query ||
            JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags) ||
            currentState.sortOrder !== oldState.sortOrder ||
            currentState.favoritesFilterActive !== oldState.favoritesFilterActive;

        if (haveDataOrFiltersChanged) {
            const isContentTransition = !currentState.isLoading && !oldState.isLoading;

            const renderGridContent = () => {
                const currentPlants = getMemoizedSortedAndFilteredPlants(
                    currentState.plants,
                    currentState.query,
                    currentState.activeTags,
                    currentState.sortOrder
                );
                components.plantGrid.render({
                    plants: currentPlants,
                    query: currentState.query,
                    isLoading: currentState.isLoading,
                    favoriteIds: currentState.favoriteIds,
                    favoritesFilterActive: currentState.favoritesFilterActive
                });
            };

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

        // --- Restul funcției rămâne neschimbat ---
        const haveTagsChanged = currentState.allUniqueTags.length !== oldState.allUniqueTags.length || 
                                JSON.stringify(currentState.activeTags) !== JSON.stringify(oldState.activeTags);
        if (haveTagsChanged) {
            components.tagFilter.render({
                allTags: currentState.allUniqueTags,
                activeTags: currentState.activeTags,
            });
        }

        if (currentState.query !== oldState.query) {
            elements.searchInput.value = currentState.query;
        }
        if (currentState.sortOrder !== oldState.sortOrder) {
            elements.sortSelect.value = currentState.sortOrder;
        }
        
        if (currentState.favoritesFilterActive !== oldState.favoritesFilterActive) {
            elements.showFavoritesBtn.classList.toggle('active', currentState.favoritesFilterActive);
        }

        const hasModalStateChanged = currentState.modalPlant !== oldState.modalPlant || currentState.copyStatus !== oldState.copyStatus;
        if (hasModalStateChanged && plantModalInstance) {
            if (currentState.modalPlant && currentState.modalPlant.current) {
                plantModalInstance.render({
                    plant: currentState.modalPlant.current,
                    adjacentPlants: { prev: currentState.modalPlant.prev, next: currentState.modalPlant.next },
                    copyStatus: currentState.copyStatus
                });
            } else {
                plantModalInstance.close();
            }
        }

        if (currentState.isFaqOpen !== oldState.isFaqOpen) {
            currentState.isFaqOpen ? components.faqModal.open() : components.faqModal.close();
        }

        if (isInitialized) {
            debouncedUpdateURL(currentState);
        }
    });

    return (status) => { isInitialized = status; };
}


// --- Funcția Principală de Inițializare ---
async function initApp() {
    function queryAndVerify(selectors) {
        const elements = {};
        for (const key in selectors) {
            const el = document.querySelector(selectors[key]);
            if (!el) {
                throw new Error(`Element esențial nu a fost găsit: '${selectors[key]}'`);
            }
            elements[key] = el;
        }
        return elements;
    }

    try {
        const dom = queryAndVerify({
            gridContainer: "#grid",
            tagFilterContainer: "#tag-filter-buttons",
            searchInput: "#search",
            sortSelect: "#sort",
            resetButton: "#reset",
            randomBtn: "#randomBtn",
            faqModal: "#faq-modal",
            showFavoritesBtn: "#showFavoritesBtn", // <-- MODIFICARE: Adăugăm noul buton
        });

        const components = {
            plantGrid: new PlantGrid(dom.gridContainer),
            tagFilter: new TagFilter(dom.tagFilterContainer),
            faqModal: new FaqModal(),
        };

        const themeSwitchElement = document.getElementById("themeSwitch");
        setupThemeToggle(themeSwitchElement);
        new FabMenu('#fab-container');
        new TagToggle('.tag-filter-header');
        
        bindEventListeners(dom, components);
        const setInitialized = createStateSubscribers(dom, components);

        await runIntroAnimation();
        
        await actions.loadInitialData();
        actions.loadFavorites(); // <-- MODIFICARE: Încărcăm favoritele salvate la pornirea aplicației
        
        const faqData = await loadFaqData();
        components.faqModal.populate(faqData);
        
        const initialState = getStateFromURL();
        
        if (initialState.modalPlantId) {
            await ensurePlantModalIsLoaded();
        }
        
        actions.initialize(initialState);

        showNotification("Ghidul de plante este gata! 🪴", { type: "success" });
        setInitialized(true);

    } catch (err) {
        console.error("A apărut o eroare CRITICĂ la inițializarea aplicației:", err);
        showNotification(
            err.message || "Aplicația nu a putut porni. Te rugăm să reîncarci pagina.", 
            { type: "error", duration: 0, dismissible: true }
        );
        const intro = document.getElementById("intro");
        if (intro) intro.remove();
    }
}

// Pornirea aplicației
window.addEventListener("load", initApp);