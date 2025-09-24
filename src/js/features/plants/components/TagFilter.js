import { createElement, dispatchEvent } from '../../../shared/utils/helpers.js';
import { CUSTOM_EVENTS } from '../../../shared/utils/constants.js';

/**
 * O clasă care gestionează randarea și interacțiunile pentru componenta de filtrare după tag-uri.
 * Această versiune suportă selecția multiplă de tag-uri.
 */
export class TagFilter {
    #container; // Containerul DOM principal al componentei
    #renderedTags = null; // Stochează un JSON al tag-urilor redate pentru a evita re-randarea inutilă

    /**
     * @param {HTMLElement} containerElement - Elementul DOM unde va fi redată componenta.
     */
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Containerul pentru TagFilter nu a fost găsit.');
        }
        this.#container = containerElement;
        this.#bindEvents();
    }

    /**
     * Atașează evenimentul de click pe container o singură dată.
     * @private
     */
    #bindEvents() {
        this.#container.addEventListener('click', (e) => {
            const button = e.target.closest(".tag-button[data-tag]");
            if (button) {
                const tag = button.dataset.tag;

                // MODIFICAT: Am eliminat condiția care bloca butonul "Toate".
                // Acum, toate butoanele, inclusiv cel cu data-tag="", vor emite un eveniment.

                dispatchEvent(this.#container, CUSTOM_EVENTS.TAG_SELECTED, { tag });
            }
        });
    }

    /**
     * MODIFICAT: Actualizează starea vizuală a butoanelor pe baza unui array de tag-uri active.
     * @param {string[]} activeTags - Tag-urile care ar trebui să fie marcate ca active.
     * @private
     */
    #updateActiveState(activeTags) {
        const buttons = this.#container.querySelectorAll(".tag-button");
        buttons.forEach((btn) => {
            const tag = btn.dataset.tag;
            
            // Butonul "Toate" este activ dacă nu există niciun tag selectat
            const isAllButtonActive = tag === "" && activeTags.length === 0;
            // Un alt buton este activ dacă tag-ul său se află în array-ul de tag-uri active
            const isTagButtonActive = tag !== "" && activeTags.includes(tag);

            const isActive = isAllButtonActive || isTagButtonActive;
            
            btn.classList.toggle("active", isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
    }

    /**
     * MODIFICAT: Randează componenta pe baza unui array `activeTags`.
     * @param {object} props - Proprietățile componentei.
     * @param {string[]} props.allTags - Toate tag-urile unice disponibile.
     * @param {string[]} props.activeTags - Tag-urile selectate în prezent.
     */
    render({ allTags, activeTags }) {
        const tagsJson = JSON.stringify(allTags);
        
        // Re-creează butoanele doar dacă lista de tag-uri s-a schimbat.
        if (this.#renderedTags !== tagsJson) {
            this.#container.innerHTML = "";

            if (allTags && allTags.length > 0) {
                const fragment = document.createDocumentFragment();
                
                const allButton = createElement("button", { 
                    className: "tag-button", 
                    attrs: { "data-tag": "" }, 
                    text: "Toate" 
                });
                fragment.appendChild(allButton);

                allTags.forEach(tag => {
                    fragment.appendChild(createElement("button", { 
                        className: "tag-button", 
                        attrs: { "data-tag": tag }, 
                        text: tag 
                    }));
                });
                
                this.#container.appendChild(fragment);
            }
            this.#renderedTags = tagsJson; // Salvează starea redată
        }

        // Actualizează starea vizuală a butoanelor active la fiecare randare.
        this.#updateActiveState(activeTags);
    }
}