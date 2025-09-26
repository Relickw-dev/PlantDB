import { FAB_ACTIONS } from '../utils/constants.js';
import { dispatchEvent } from '../utils/helpers.js';

/**
 * O clasă pentru a gestiona meniul de tip "Floating Action Button" (FAB).
 * Încapsulează logica de deschidere/închidere și delegarea acțiunilor.
 */
export class FabMenu {
    #container;

    /**
     * @param {HTMLElement} containerElement - Elementul DOM care conține meniul FAB.
     */
    constructor(containerElement) {
        this.#container = containerElement; // MODIFICAT: Acum primește direct elementul
        if (!this.#container) {
            console.warn(`Containerul pentru FabMenu nu a fost găsit.`);
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