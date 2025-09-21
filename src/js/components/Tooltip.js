// src/js/components/Tooltip.js

import { createElement } from '../utils/helpers.js';

export class Tooltip {
    #tooltipElement;
    #currentTarget = null;

    /**
     * @param {string} selector - Selectorul CSS pentru elementul tooltip din HTML.
     */
    constructor(selector) {
        this.#tooltipElement = document.querySelector(selector);
        if (!this.#tooltipElement) {
            console.warn(`Elementul pentru Tooltip ('${selector}') nu a fost găsit.`);
            return;
        }
        
        // Legăm evenimentele direct în constructorul clasei.
        // Astfel, componenta este complet autonomă.
        document.body.addEventListener('mouseover', this.#show);
        document.body.addEventListener('mouseout', this.#hide);
        window.addEventListener('scroll', this.#hide, { capture: true });
    }

    /**
     * Poziționează tooltip-ul relativ la elementul țintă.
     * @private
     */
    #position = (target) => {
        if (!target || !this.#tooltipElement) return;

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this.#tooltipElement.getBoundingClientRect();
        const margin = 10;

        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Ajustări pentru a nu ieși din ecran
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }
        if (top < margin) {
            top = targetRect.bottom + margin;
        }

        this.#tooltipElement.style.top = `${top}px`;
        this.#tooltipElement.style.left = `${left}px`;
    }

    /**
     * Afișează tooltip-ul. Metoda este legată de 'mouseover'.
     * @private
     */
    #show = (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        this.#currentTarget = target;
        this.#tooltipElement.textContent = this.#currentTarget.getAttribute('data-tooltip');
        this.#tooltipElement.classList.add('visible');
        this.#tooltipElement.setAttribute('aria-hidden', 'false');
        this.#position(this.#currentTarget);
    }

    /**
     * Ascunde tooltip-ul. Metoda este legată de 'mouseout' și 'scroll'.
     * @private
     */
    #hide = () => {
        if (!this.#currentTarget) return;
        this.#currentTarget = null;
        this.#tooltipElement.classList.remove('visible');
        this.#tooltipElement.setAttribute('aria-hidden', 'true');
    }
}