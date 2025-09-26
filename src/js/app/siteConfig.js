// src/js/app/siteConfig.js

import { PlantGrid } from '../features/plants/components/PlantGrid.js';
import { TagFilter } from '../features/plants/components/TagFilter.js';
import { FaqModal } from '../features/faq/components/FaqModal.js';
import { FabMenu } from '../shared/ui/FabMenu.js';
import { TagToggle } from '../features/plants/components/TagToggle.js';
import { Tooltip } from '../shared/components/Tooltip.js';

export const siteConfig = {
    domSelectors: {
        gridContainer: "#grid",
        tagFilterContainer: "#tag-filter-buttons",
        // NOU: Am adăugat selectorul aici pentru consistență
        tagFilterHeader: ".tag-filter-header", 
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
    },
    components: [
        { name: 'plantGrid', class: PlantGrid, selector: 'gridContainer' },
        { name: 'tagFilter', class: TagFilter, selector: 'tagFilterContainer' },
        { name: 'faqModal', class: FaqModal, selector: null },
        { name: 'fabMenu', class: FabMenu, selector: 'fabContainer' },
        // MODIFICAT: Acum folosește cheia din domSelectors
        { name: 'tagToggle', class: TagToggle, selector: 'tagFilterHeader' }, 
        { name: 'tooltip', class: Tooltip, selector: 'tooltip' }
    ]
};