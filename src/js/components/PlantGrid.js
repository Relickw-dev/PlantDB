import { createPlantCard } from './PlantCard.js';
import { createElement } from '../utils/helpers.js';

/**
 * O clasă care gestionează randarea și interacțiunile pentru grila de plante.
 * Este optimizată pentru performanță prin lazy-loading și actualizări inteligente ale DOM-ului.
 */
export class PlantGrid {
    #container;
    #observer;

    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Containerul pentru PlantGrid nu a fost găsit în DOM.');
        }
        this.#container = containerElement;
        // Inițializăm IntersectionObserver pentru lazy-loading-ul imaginilor
        this.#observer = new IntersectionObserver(this.#handleIntersection, {
            rootMargin: '250px', // Începe să încarce imaginile înainte ca ele să fie vizibile
            threshold: 0.1
        });
    }

    /**
     * Callback pentru IntersectionObserver. Se execută când un card intră în viewport.
     * @private
     */
    #handleIntersection = (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const image = card.querySelector('.lazy-image');

                // Încarcă imaginea reală și elimină clasa 'lazy-image'
                if (image?.dataset.src) {
                    image.src = image.dataset.src;
                    image.classList.remove('lazy-image');
                }

                // Adaugă clasa pentru animația de apariție a cardului
                card.classList.add("visible");
                // Odată ce cardul este vizibil, nu mai trebuie să-l observăm
                observer.unobserve(card);
            }
        });
    };

    /**
     * MODIFICAT: Creează și afișează o stare goală.
     * Acum primește direct mesajul și imaginea, fără a mai conține logică.
     * @private
     */
    #createEmptyState({ message, imgSrc }) {
        const emptyStateElement = createElement("div", {
            className: "empty-state",
            children: [
                createElement("img", { attrs: { src: imgSrc, alt: "Niciun rezultat" } }),
                createElement("p", { text: message }),
            ]
        });
        this.#container.innerHTML = ""; // Curățăm containerul
        this.#container.appendChild(emptyStateElement);
    }

    /**
     * Creează și afișează o stare de încărcare (schelet) în timp ce datele sunt preluate.
     * @private
     */
    #createSkeletonState() {
        this.#container.innerHTML = "";
        const fragment = document.createDocumentFragment();

        Array.from({ length: 12 }).forEach(() => {
            const skeletonCard = createElement('div', {
                className: 'skeleton-card',
                children: [
                    createElement('div', { className: 'skeleton-image' }),
                    createElement('div', {
                        className: 'skeleton-content',
                        children: [
                            createElement('div', { className: 'skeleton-title' }),
                            createElement('div', { className: 'skeleton-text' })
                        ]
                    })
                ]
            });
            fragment.appendChild(skeletonCard);
        });

        this.#container.appendChild(fragment);
    }

    /**
     * MODIFICAT: Randează grila sau starea goală pe baza noilor props.
     */
    render({ plants, isLoading, favoriteIds = [], emptyStateContent = null }) {
        if (isLoading) {
            this.#createSkeletonState();
            return;
        }

        if (plants.length === 0 && emptyStateContent) {
            // Folosim direct obiectul `emptyStateContent` primit ca prop
            this.#createEmptyState(emptyStateContent);
            return;
        }

        // Creăm un nou container în memorie pentru a fi comparat cu cel existent
        const newGrid = this.#container.cloneNode(false);
        const fragment = document.createDocumentFragment();

        plants.forEach(plant => {
            const isFavorite = favoriteIds.includes(plant.id);
            const newCard = createPlantCard(plant, isFavorite);
            fragment.appendChild(newCard);
        });

        newGrid.appendChild(fragment);

        // Folosim morphdom pentru a actualiza eficient DOM-ul
        morphdom(this.#container, newGrid, {
            getNodeKey: node => node.dataset ? node.dataset.id : node.id,

            // --- PATCH APLICAT: Logica avansată pentru a preveni re-randarea inutilă ---
            onBeforeElUpdated: (fromEl, toEl) => {
                // REGULA 1: Protejează butonul de favorit.
                if (fromEl.dataset.id?.startsWith('fav-btn-')) {
                    if (fromEl.className !== toEl.className) {
                        fromEl.className = toEl.className;
                    }
                    return false; // Nu actualiza copiii acestui element
                }

                // REGULA 2: Protejează imaginile deja încărcate.
                if (fromEl.tagName === 'IMG' && fromEl.hasAttribute('src')) {
                    return false;
                }

                // Pentru toate celelalte elemente, permitem actualizarea normală.
                return true;
            }
        });

        // După actualizarea DOM-ului, atașăm observer-ul pe noile carduri (dacă există)
        for (const card of this.#container.children) {
            if (!card.classList.contains('visible') && card.classList.contains('card')) {
                this.#observer.observe(card);
            }
        }
    }
}