import { createElement } from '../../../shared/utils/helpers.js';
import { BaseModal } from '../../../shared/components/BaseModal.js';

// --- Configurație ---
// Hartă pentru a traduce cheile din JSON în titluri vizibile.
const SECTION_TITLES = {
    faq_general: 'Întrebări Generale',
    faq_technical: 'Întrebări Tehnice',
};


// --- Generare Subcomponente (Helpers) ---

/**
 * Creează un singur element de tip acordeon (întrebare + răspuns).
 * @param {{question: string, answer: string}} item - Obiectul cu datele.
 * @returns {HTMLElement} Elementul <details> generat.
 * @private
 */
function createFaqItem({ question, answer }) {
    return createElement('details', {
        className: 'faq-item',
        children: [
            createElement('summary', {
                className: 'faq-question',
                text: question
            }),
            createElement('p', {
                className: 'faq-answer',
                text: answer
            })
        ]
    });
}


// --- Clasa Principală a Componentei ---

/**
 * O clasă care gestionează afișarea și interacțiunile pentru modalul FAQ.
 */
export class FaqModal extends BaseModal{
    #contentContainer;
    // <-- ELIMINAT: #closeButton nu mai este necesar aici

    constructor() {
        super('faq-modal'); // Păstrăm ID-ul pentru BaseModal
        // Căutăm containerul relativ la elementul principal al modalului
        this.#contentContainer = this._modalElement.querySelector('#faq-content');

        // <-- ELIMINAT: Evenimentul de click pe close este acum gestionat de BaseModal
        // și propagat ca un eveniment custom pe care main.js îl va asculta.
    }

    /**
     * Populează containerul modalului cu datele primite din JSON.
     * @param {object} faqData - Obiectul cu datele FAQ.
     */
    populate(faqData) {
        if (!this.#contentContainer) return;
        this.#contentContainer.innerHTML = "";

        if (!faqData) {
            this.#contentContainer.textContent = "Conținutul FAQ nu a putut fi încărcat.";
            return;
        }

        const sections = Object.entries(faqData).map(([key, items]) => {
            const title = SECTION_TITLES[key] || key;
            return createElement('div', {
                className: 'faq-section',
                children: [
                    createElement('h4', { text: title }),
                    ...(Array.isArray(items) ? items.map(createFaqItem) : [])
                ]
            });
        });

        this.#contentContainer.append(...sections);
    }
}
