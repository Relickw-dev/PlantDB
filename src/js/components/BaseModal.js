// components/BaseModal.js

import { dispatchEvent } from '../utils/helpers.js';
import { CUSTOM_EVENTS } from '../utils/constants.js';

/**
 * O clasă de bază pentru toate modalele din aplicație.
 * Gestionează logica comună de deschidere, închidere și accesibilitate.
 */
export class BaseModal {
    _modalElement;
    _containerElement;

    /**
     * @param {string} modalId - ID-ul elementului <dialog> din HTML.
     */
    constructor(modalId) {
        this._modalElement = document.getElementById(modalId);
        this._containerElement = document.querySelector(".container");

        if (!this._modalElement) {
            throw new Error(`Elementul modal esențial #${modalId} nu a fost găsit.`);
        }

        this._bindBaseEvents();
    }

    /** Deschide fereastra modală și ascunde conținutul principal pentru cititoarele de ecran. */
    open() {
        if (!this._modalElement.open) {
            this._modalElement.showModal();
            this._containerElement?.setAttribute("aria-hidden", "true");
        }
    }

    /** Închide fereastra modală și face conținutul principal din nou vizibil. */
    close() {
        if (this._modalElement.open) {
            this._modalElement.close();
            this._containerElement?.removeAttribute("aria-hidden");
        }
    }

    /**
     * Atașează evenimentele de bază pe care orice modal ar trebui să le aibă.
     * @private
     */
    _bindBaseEvents() {
        if (this._modalElement.dataset.baseEventsAttached) return;

        // Gestionează închiderea la click pe fundal (comportament nativ <dialog>)
        // sau la apăsarea tastei 'Escape'.
        this._modalElement.addEventListener('close', () => {
             dispatchEvent(this._modalElement, CUSTOM_EVENTS.CLOSE_REQUEST);
             this.close(); // Asigură sincronizarea stării (ex: aria-hidden)
        });

        this._modalElement.dataset.baseEventsAttached = 'true';
    }
}