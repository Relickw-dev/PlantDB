// --- Importuri ---
import { subscribe } from './core/state.js';
import * as actions from './core/actions.js';
import { CUSTOM_EVENTS, TIMINGS, FAB_ACTIONS, THEME } from './utils/constants.js';
import { debounce } from './utils/helpers.js';
import { showNotification } from './components/NotificationService.js';
import { getStateFromURL, updateURLFromState } from './services/urlService.js';
import { loadFaqData } from './services/plantService.js';
import { getMemoizedSortedAndFilteredPlants } from './services/memoizedLogic.js';
import { PlantGrid } from './components/PlantGrid.js';
import { TagFilter } from './components/TagFilter.js';
import { FaqModal } from './components/FaqModal.js';
import { initializeTheme, applyTheme } from './components/ThemeToggle.js';
import { FabMenu } from './components/FabMenu.js';
import { TagToggle } from './components/TagToggle.js';
import { getState } from './core/state.js'; // <-- ADAUGAT: Import pentru a accesa starea

// --- Variabilă pentru instanța încărcată dinamic ---
let plantModalInstance = null;
let faqDataCache = null;

async function ensurePlantModalIsLoaded() {
    if (plantModalInstance) return; // Ieșim devreme dacă este deja încărcat
    try {
        const { PlantModal } = await import('./components/PlantModal.js');
        plantModalInstance = new PlantModal();
    } catch (err) {
        console.error("Eroare la încărcarea dinamică a PlantModal:", err);
        showNotification("Nu am putut încărca componenta de detalii.", { type: "error" });
        throw err; // Aruncăm eroarea pentru a fi prinsă de apelant
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
function bindEventListeners(elements) {
    const handleAsyncModalAction = async (actionCallback) => {
        try {
            await ensurePlantModalIsLoaded();
            actionCallback();
        } catch (err) {
            // Eroarea este acum gestionată aici, dar este deja logată și afișată
            // în funcția `ensurePlantModalIsLoaded`, deci nu mai trebuie să facem nimic.
        }
    };

    elements.searchInput.addEventListener('input', debounce((e) => actions.search(e.target.value), TIMINGS.SEARCH_DEBOUNCE));
    elements.sortSelect.addEventListener('change', (e) => actions.changeSortOrder(e.target.value));
    elements.resetButton.addEventListener('click', () => actions.resetFilters());
    elements.showFavoritesBtn.addEventListener('click', () => actions.toggleFavoritesFilter());
    elements.randomBtn.addEventListener('click', () => handleAsyncModalAction(actions.selectRandomPlant));

    elements.gridContainer.addEventListener('click', (e) => {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.stopPropagation();
            const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
            if (!isNaN(plantId)) actions.toggleFavorite(plantId);
            return;
        }

        const card = e.target.closest(".card[data-id]");
        if (card) {
            const plantId = parseInt(card.dataset.id, 10);
            handleAsyncModalAction(() => actions.openPlantModal(plantId));
        }
    });

    elements.tagFilterContainer.addEventListener(CUSTOM_EVENTS.TAG_SELECTED, (e) => actions.selectTag(e.detail.tag));
    elements.faqModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeFaqModal());
    elements.plantModal.addEventListener(CUSTOM_EVENTS.CLOSE_REQUEST, () => actions.closeModal());
    elements.plantModal.addEventListener(CUSTOM_EVENTS.NAVIGATE_REQUEST, (e) => actions.navigateModal(e.detail.direction));
    elements.plantModal.addEventListener(CUSTOM_EVENTS.COPY_REQUEST, () => actions.copyPlantDetails());

    elements.fabContainer.addEventListener('fab-action', (e) => {
        const { action } = e.detail;
        switch (action) {
            case FAB_ACTIONS.TOGGLE_THEME: {
                const isLight = document.documentElement.classList.contains(THEME.CSS_CLASS_LIGHT);
                const newTheme = isLight ? THEME.DARK : THEME.LIGHT;
                applyTheme(newTheme);
                break;
            }
            case FAB_ACTIONS.SHOW_FAQ:
                actions.openFaqModal();
                break;
        }
    });

    window.addEventListener('popstate', () => actions.initialize(getStateFromURL()));

    // --- ADAUGAT: Navigarea cu Tastatura ---
    window.addEventListener('keydown', (e) => {
        const state = getState();

        // Ieșim dacă niciun modal nu este deschis
        if (!state.modalPlant && !state.isFaqOpen) {
            return;
        }

        // Navigare și închidere pentru modalul de plantă
        if (state.modalPlant) {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault(); // Previne scroll-ul paginii
                    actions.navigateModal('next');
                    break;
                case 'ArrowLeft':
                    e.preventDefault(); // Previne scroll-ul paginii
                    actions.navigateModal('prev');
                    break;
                case 'Escape':
                    actions.closeModal();
                    break;
            }
        }

        // Închidere pentru modalul FAQ
        if (state.isFaqOpen && e.key === 'Escape') {
            actions.closeFaqModal();
        }
    });
}


// --- Logica Reactivă (Sincronizarea Stare -> UI) ---
function syncStateToUI(elements, components) {
    let isInitialized = false;
    const debouncedUpdateURL = debounce(updateURLFromState, 300);

    subscribe((currentState, oldState) => {
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
                const currentPlants = getMemoizedSortedAndFilteredPlants(
                    currentState.plants,
                    currentState.query,
                    currentState.activeTags,
                    currentState.sortOrder,
                    currentState.favoritesFilterActive,
                    currentState.favoriteIds
                );
                components.plantGrid.render({
                    plants: currentPlants,
                    query: currentState.query,
                    isLoading: currentState.isLoading,
                    favoriteIds: currentState.favoriteIds,
                    favoritesFilterActive: currentState.favoritesFilterActive
                });
            };

            const isContentTransition = hasGridContentChanged && !currentState.isLoading && !oldState.isLoading;

            if (isContentTransition) {
                elements.gridContainer.classList.add('fade-out');
                setTimeout(() => {
                    renderGridContent();
                    elements.gridContainer.classList.remove('fade-out');
                    elements.gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, TIMINGS.GRID_ANIMATION_DURATION);
            } else {
                renderGridContent();
            }
        }

        if (currentState.faqData && currentState.faqData !== oldState.faqData) {
            components.faqModal.populate(currentState.faqData);
        }

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

        if (currentState.modalPlant && currentState.modalPlant.current) {
            ensurePlantModalIsLoaded().then(() => {
                if (plantModalInstance) {
                    plantModalInstance.render({
                        plant: currentState.modalPlant.current,
                        adjacentPlants: { prev: currentState.modalPlant.prev, next: currentState.modalPlant.next },
                        copyStatus: currentState.copyStatus
                    });
                }
            });
        } else if (plantModalInstance) {
            plantModalInstance.close();
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

function initializeSmartTooltips() {
    const tooltipElement = document.getElementById('app-tooltip');
    if (!tooltipElement) return;

    let currentTarget = null; // Stochează elementul peste care suntem cu cursorul

    const showTooltip = (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        currentTarget = target;
        const tooltipText = target.getAttribute('data-tooltip');
        tooltipElement.textContent = tooltipText;
        tooltipElement.classList.add('visible');
        tooltipElement.setAttribute('aria-hidden', 'false');
        
        positionTooltip();
    };

    const hideTooltip = () => {
        currentTarget = null;
        tooltipElement.classList.remove('visible');
        tooltipElement.setAttribute('aria-hidden', 'true');
    };

    const positionTooltip = () => {
        if (!currentTarget) return;

        const targetRect = currentTarget.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const margin = 10; // Spațiul față de marginea elementului

        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // --- AICI ESTE INTELIGENȚA ---
        // Verifică și corectează depășirea pe orizontală
        if (left < margin) {
            left = margin; // Aliniază la marginea stângă
        } else if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin; // Aliniază la dreapta
        }

        // Verifică și corectează depășirea pe verticală (dacă apare deasupra ecranului)
        if (top < margin) {
            top = targetRect.bottom + margin; // Mută tooltip-ul dedesubt
        }

        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.left = `${left}px`;
    };

    // Folosim event delegation pentru performanță
    document.body.addEventListener('mouseover', showTooltip);
    document.body.addEventListener('mouseout', hideTooltip);
    window.addEventListener('scroll', hideTooltip, true); // Ascunde la scroll
}


// --- Funcția Principală de Inițializare ---
async function initApp() {
    function queryAndVerify(selectors) {
        const elements = {};
        for (const key in selectors) {
            const el = document.querySelector(selectors[key]);
            if (!el) throw new Error(`Element esențial nu a fost găsit: '${selectors[key]}'`);
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
            plantModal: "#modal",
            showFavoritesBtn: "#showFavoritesBtn",
            fabContainer: "#fab-container",
        });

        const components = {
            plantGrid: new PlantGrid(dom.gridContainer),
            tagFilter: new TagFilter(dom.tagFilterContainer),
            faqModal: new FaqModal(),
            fabMenu: new FabMenu('#fab-container'),
            tagToggle: new TagToggle('.tag-filter-header'),
        };

        initializeTheme();
        initializeSmartTooltips();
        bindEventListeners(dom);
        const setInitialized = syncStateToUI(dom, components);

        await runIntroAnimation();

        await actions.loadInitialData();
        actions.loadFavorites();

        const initialState = getStateFromURL();
        await actions.initialize(initialState);

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