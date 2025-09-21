import { createElement } from '../utils/helpers.js';
import { DEFAULTS } from '../utils/constants.js';

/**
 * O clasă de tip "serviciu" care gestionează crearea și afișarea notificărilor.
 * Folosește un model Singleton pentru a asigura o singură instanță în toată aplicația.
 */
class NotificationService {
    #containers = {}; // Stochează referințe la containere DOM pentru fiecare poziție

    /**
     * Găsește sau creează containerul pentru o anumită poziție pe ecran.
     * @param {string} position - Poziția (ex: 'bottom-right').
     * @returns {HTMLElement} Containerul DOM.
     * @private
     */
    #ensureContainer(position) {
        if (this.#containers[position]) {
            return this.#containers[position];
        }

        const container = createElement('div', {
            className: `notification-container notification-container--${position}`,
            attrs: { 'aria-live': 'polite', 'aria-relevant': 'additions' } // Pentru accesibilitate
        });

        document.body.appendChild(container);
        this.#containers[position] = container;
        return container;
    }

    /**
     * Creează și afișează o notificare.
     * @param {string} message - Textul notificării.
     * @param {object} [options={}] - Opțiunile notificării.
     * @param {number} [options.duration=4000] - Durata în ms (0 = persistentă).
     * @param {string} [options.type='info'] - Tipul ('success', 'error', etc.).
     * @param {string} [options.position='bottom-right'] - Poziția pe ecran.
     * @param {boolean} [options.dismissible=true] - Dacă poate fi închisă manual.
     */
    show = (message, options = {}) => {
       const {
            duration = DEFAULTS.NOTIFICATION_DURATION,
            type = DEFAULTS.NOTIFICATION_TYPE,
            position = DEFAULTS.NOTIFICATION_POSITION,
            dismissible = true
        } = options;

        const container = this.#ensureContainer(position);
        
        const notifElement = createElement('div', {
            className: `notification notification--${type}`,
            children: [createElement('span', { text: message })]
        });

        if (dismissible) {
            const closeBtn = createElement('button', {
                className: 'notification__close-btn',
                html: '&times;',
                attrs: { 'aria-label': 'Închide notificarea' }
            });
            closeBtn.onclick = () => this.#remove(notifElement);
            notifElement.appendChild(closeBtn);
        }

        container.appendChild(notifElement);

        // <-- OPTIMIZARE: Folosim requestAnimationFrame în loc de setTimeout
        // pentru a asigura o animație mai fluidă și eficientă.
        requestAnimationFrame(() => {
            notifElement.classList.add('show');
        });

        if (duration > 0) {
            setTimeout(() => this.#remove(notifElement), duration);
        }
    }

    // src/js/components/NotificationService.js

    #remove(notifElement) {
        // Durata animației de ieșire din CSS este de 400ms.
        // Setăm un cronometru de siguranță care se va executa după 500ms.
        const fallbackTimeout = setTimeout(() => {
            notifElement.remove();
        }, 500);

        // Adăugăm event listener-ul pentru 'transitionend'.
        // Când animația se termină corect, acesta se va executa.
        notifElement.addEventListener('transitionend', () => {
            // Anulăm cronometrul de siguranță, deoarece nu mai este necesar.
            clearTimeout(fallbackTimeout);
            // Eliminăm elementul din DOM.
            notifElement.remove();
        }, { once: true }); // { once: true } asigură că listener-ul se auto-elimină după execuție.

        // Inițiem animația de ieșire prin eliminarea clasei 'show'.
        notifElement.classList.remove('show');
    }
}

const notificationService = new NotificationService();
export const showNotification = notificationService.show;