import { FAB_ACTIONS } from '../utils/constants.js';
// <-- ELIMINAT: import { applyTheme } from './ThemeToggle.js';
// <-- ELIMINAT: import * as actions from '../core/actions.js';
import { dispatchEvent } from '../utils/helpers.js'; // <-- ADAUGAT

/**
 * O clasă pentru a gestiona meniul de tip "Floating Action Button" (FAB).
 * Încapsulează logica de deschidere/închidere și delegarea acțiunilor.
 */
export class FabMenu {
    #container;

    constructor(selector) {
        this.#container = document.querySelector(selector);
        if (!this.#container) {
            console.warn(`Containerul pentru FabMenu ('${selector}') nu a fost găsit.`);
            return;
        }
        this.#bindEvents();
    }

    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            const button = e.target.closest('.fab-button');
            if (!button) return;

            if (button.id === 'fab-main') {
                this.#toggleMenu();
                return;
            }

            const action = button.dataset.action;
            if (action) {
                // <-- MODIFICAT: Emitem un eveniment în loc să apelăm acțiuni
                dispatchEvent(this.#container, 'fab-action', { action });
                this.#closeMenu();
            }
        });
    }

    #toggleMenu() {
        this.#container.classList.toggle('open');
    }

    #closeMenu() {
        this.#container.classList.remove('open');
    }
}