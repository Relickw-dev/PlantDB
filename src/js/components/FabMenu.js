import { FAB_ACTIONS } from '../utils/constants.js';
import { applyTheme } from './ThemeToggle.js';
import * as actions from '../core/actions.js';

/**
 * O clasă pentru a gestiona meniul de tip "Floating Action Button" (FAB).
 * Încapsulează logica de deschidere/închidere și gestionarea acțiunilor.
 */
export class FabMenu {
    #container; // Elementul DOM principal al meniului

    /**
     * @param {string} selector - Selectorul CSS pentru containerul meniului FAB (ex: '#fab-container').
     */
    constructor(selector) {
        this.#container = document.querySelector(selector);

        if (!this.#container) {
            console.warn(`Containerul pentru FabMenu ('${selector}') nu a fost găsit.`);
            return; // Oprește inițializarea dacă elementul nu există
        }

        // Atașează evenimentele interne o singură dată.
        this.#bindEvents();
    }

    /**
     * Metodă privată care gestionează logica de click.
     * Folosește event delegation pentru eficiență.
     * @private
     */
    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            const button = e.target.closest('.fab-button');
            if (!button) return;

            // Butonul principal doar deschide/închide meniul
            if (button.id === 'fab-main') {
                this.#toggleMenu();
                return;
            }

            // Butoanele de acțiune execută o logică și închid meniul
            const action = button.dataset.action;
            if (action) {
                this.#handleAction(action);
                this.#closeMenu(); // Închide meniul după orice acțiune
            }
        });
    }

    /**
     * Execută acțiunea corespunzătoare pe baza `data-action` a butonului.
     * @param {string} action - Numele acțiunii.
     * @private
     */
    #handleAction(action) {
        switch (action) {
            case FAB_ACTIONS.TOGGLE_THEME: { // Folosim acolade pentru a crea un scope local
                const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
                applyTheme(newTheme);
                break;
            }
            case FAB_ACTIONS.SHOW_FAQ:
                actions.openFaqModal();
                break;
            default:
                console.warn(`Acțiune FAB necunoscută: ${action}`);
        }
    }

    /**
     * Deschide sau închide meniul.
     * @private
     */
    #toggleMenu() {
        this.#container.classList.toggle('open');
    }

    /**
     * Forțează închiderea meniului.
     * @private
     */
    #closeMenu() {
        this.#container.classList.remove('open');
    }
}