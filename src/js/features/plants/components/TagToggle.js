import { BREAKPOINTS } from '../../../shared/utils/constants.js';

/**
 * O clasă care gestionează funcționalitatea de colapsare/expandare
 * pentru secțiunea de filtrare a tag-urilor.
 */
export class TagToggle {
    // Proprietăți private pentru a stoca elementele DOM
    #header;
    #toggleBtn;
    #tagContainer;

    /**
     * @param {string} headerSelector - Selectorul CSS pentru întregul header al secțiunii de tag-uri.
     */
    constructor(headerSelector) {
        this.#header = document.querySelector(headerSelector);
        
        // Găsim celelalte elemente necesare pe baza unor ID-uri fixe
        this.#toggleBtn = document.getElementById('toggle-tags-btn');
        this.#tagContainer = document.getElementById('tag-filter-buttons');

        // Verificare robustă pentru a ne asigura că toate elementele există
        if (!this.#header || !this.#toggleBtn || !this.#tagContainer) {
            console.warn('Elementele necesare pentru TagToggle nu au fost găsite în DOM.');
            return;
        }

        this.#bindEvents();
        this.#initializeState();
    }

    /**
     * Atașează evenimentul de click pe header o singură dată.
     * @private
     */
    #bindEvents() {
        // Folosim o funcție arrow pentru a păstra contextul 'this' corect în #toggle
        this.#header.addEventListener('click', () => this.#toggle());
    }

    /**
     * Setează starea inițială a componentei la încărcarea paginii.
     * Pe mobil, pornește închis (collapsed).
     * @private
     */
    #initializeState() {
        if (window.innerWidth < BREAKPOINTS.MOBILE) {
            // Forțăm starea inițială ca fiind "collapsed"
            this.#updateState(true);
        }
    }
    
    /**
     * Logica principală pentru a schimba starea vizuală (collapsed/expanded).
     * @private
     */
    #toggle() {
        // Inversăm starea curentă
        const shouldBeCollapsed = !this.#tagContainer.classList.contains('collapsed');
        this.#updateState(shouldBeCollapsed);
    }
    
    /**
     * O metodă centralizată care aplică starea pe toate elementele relevante.
     * @param {boolean} isCollapsed - Starea care trebuie aplicată.
     * @private
     */
    #updateState(isCollapsed) {
        this.#tagContainer.classList.toggle('collapsed', isCollapsed);
        this.#toggleBtn.classList.toggle('collapsed', isCollapsed);
        this.#toggleBtn.setAttribute('aria-expanded', !isCollapsed);
    }
}