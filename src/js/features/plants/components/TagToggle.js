import { BREAKPOINTS } from '../../../shared/utils/constants.js';
import { OperationalError, handleError } from '../../../app/errorHandler.js';
/**
 * O clasă care gestionează funcționalitatea de colapsare/expandare
 * pentru secțiunea de filtrare a tag-urilor.
 */
export class TagToggle {
    #header;
    #toggleBtn;
    #tagContainer;

    /**
     * @param {HTMLElement} headerElement - Elementul DOM pentru întregul header al secțiunii de tag-uri.
     */
    constructor(headerElement) {
        this.#header = headerElement;

        this.#toggleBtn = document.getElementById('toggle-tags-btn');
        this.#tagContainer = document.getElementById('tag-filter-buttons');

        if (!this.#header || !this.#toggleBtn || !this.#tagContainer) {
            handleError(new OperationalError('Elementele necesare pentru TagToggle nu au fost găsite în DOM.'), 'TagToggle initialization');
            return;
        }

        this.#bindEvents();
        this.#initializeState();
    }

    #bindEvents() {
        this.#header.addEventListener('click', () => this.#toggle());
    }

    #initializeState() {
        if (window.innerWidth < BREAKPOINTS.MOBILE) {
            this.#updateState(true);
        }
    }
    
    #toggle() {
        const shouldBeCollapsed = !this.#tagContainer.classList.contains('collapsed');
        this.#updateState(shouldBeCollapsed);
    }
    
    #updateState(isCollapsed) {
        this.#tagContainer.classList.toggle('collapsed', isCollapsed);
        this.#toggleBtn.classList.toggle('collapsed', isCollapsed);
        this.#toggleBtn.setAttribute('aria-expanded', !isCollapsed);
    }
}