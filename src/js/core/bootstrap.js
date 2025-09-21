// src/js/core/bootstrap.js

import { PlantGrid } from '../components/PlantGrid.js';
import { TagFilter } from '../components/TagFilter.js';
import { FaqModal } from '../components/FaqModal.js';
import { FabMenu } from '../components/FabMenu.js';
import { TagToggle } from '../components/TagToggle.js';
import { Tooltip } from '../components/Tooltip.js'; // <-- ADAUGĂ ACEST IMPORT

/**
 * Găsește și validează elementele esențiale din DOM.
 * @returns {Object} Un obiect cu referințe către elementele DOM.
 */
function queryDOMElements() {
    const selectors = {
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
        appContainer: ".container",
        intro: "#intro",
        tooltip: "#app-tooltip",
    };

    const elements = {};
    for (const key in selectors) {
        const el = document.querySelector(selectors[key]);
        if (!el) throw new Error(`Element esențial nu a fost găsit: '${selectors[key]}'`);
        elements[key] = el;
    }
    return elements;
}

/**
 * Inițializează toate componentele UI ale aplicației.
 * @param {Object} domElements - Obiectul cu elementele DOM.
 * @returns {Object} Un obiect cu instanțele componentelor.
 */
export function initComponents(domElements) {
    return {
        plantGrid: new PlantGrid(domElements.gridContainer),
        tagFilter: new TagFilter(domElements.tagFilterContainer),
        faqModal: new FaqModal(),
        fabMenu: new FabMenu('#fab-container'),
        tagToggle: new TagToggle('.tag-filter-header'),
        tooltip: new Tooltip(`#${domElements.tooltip.id}`),
    };
}

/**
 * Punctul de intrare pentru inițializarea aplicației.
 * @returns {{dom: Object, components: Object}}
 */
export function bootstrapApp() {
    const dom = queryDOMElements();
    const components = initComponents(dom);
    return { dom, components };
}