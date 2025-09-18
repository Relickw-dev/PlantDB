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
        
        // Creăm elementul de notificare și îi adăugăm clasele CSS corespunzătoare
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

        // --- AICI ESTE MODIFICAREA FINALĂ ---
        // Folosim un setTimeout minim pentru a garanta că browserul randează elementul
        // înainte de a adăuga clasa `.show`, asigurând astfel că animația CSS pornește.
        setTimeout(() => {
            notifElement.classList.add('show');
        }, 10);

        if (duration > 0) {
            setTimeout(() => this.#remove(notifElement), duration);
        }
    }

    /**
     * Elimină o notificare de pe ecran cu o animație de ieșire.
     * @param {HTMLElement} notifElement - Elementul de notificare de eliminat.
     * @private
     */
    #remove(notifElement) {
        notifElement.classList.remove('show');
        notifElement.addEventListener('transitionend', () => notifElement.remove(), { once: true });
    }
}

// Exportăm o singură instanță a serviciului pentru a fi folosită în toată aplicația.
const notificationService = new NotificationService();
export const showNotification = notificationService.show.bind(notificationService);