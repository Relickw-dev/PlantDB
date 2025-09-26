import { FAB_ACTIONS } from '../utils/constants.js';
import { dispatchEvent } from '../utils/helpers.js';
import { OperationalError, handleError } from '../../app/errorHandler.js';

export class FabMenu {
    #container;

    constructor(containerElement) {
        this.#container = containerElement;
        if (!this.#container) {
            handleError(new OperationalError('Containerul pentru FabMenu nu a fost găsit.'), 'FabMenu initialization');
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