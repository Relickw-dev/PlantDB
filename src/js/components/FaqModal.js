import { createElement } from '../utils/helpers.js';
import { BaseModal } from './BaseModal.js';

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
    #closeButton;

    constructor() {
        super('faq-modal');
        this.#contentContainer = document.getElementById('faq-content');
        this.#closeButton = document.getElementById('faq-close-btn');

        this.#closeButton?.addEventListener('click', () => this.close());
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