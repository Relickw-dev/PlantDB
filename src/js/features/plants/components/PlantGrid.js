// src/js/components/PlantGrid.js

import { createPlantCard } from './PlantCard.js';
import { createElement } from '../../../shared/utils/helpers.js';

/**
 * Creează și afișează o stare de încărcare (schelet).
 * @private
 */
function createSkeletonState() {
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
    return fragment;
}

/**
 * Creează și afișează o stare goală, cu un mesaj specific.
 * @private
 */
function createEmptyState({ message, imgSrc }) {
    return createElement("div", {
        className: "empty-state",
        children: [
            createElement("img", { attrs: { src: imgSrc, alt: "Niciun rezultat" } }),
            createElement("p", { text: message }),
        ]
    });
}

export class PlantGrid {
    #container;
    #observer;

    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Containerul pentru PlantGrid nu a fost găsit în DOM.');
        }
        this.#container = containerElement;
        this.#observer = new IntersectionObserver(this.#handleIntersection, {
            rootMargin: '250px',
            threshold: 0.1
        });
    }

    #handleIntersection = (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const image = card.querySelector('.lazy-image');
                if (image?.dataset.src) {
                    image.src = image.dataset.src;
                    image.classList.remove('lazy-image');
                }
                card.classList.add("visible");
                observer.unobserve(card);
            }
        });
    };

    render({ plants, isLoading, favoriteIds = [], emptyStateContent = null }) {
        if (isLoading) {
            this.#container.replaceChildren(createSkeletonState());
            return;
        }

        if (plants.length === 0 && emptyStateContent) {
            this.#container.replaceChildren(createEmptyState(emptyStateContent));
            return;
        }

        const newGrid = this.#container.cloneNode(false);
        const fragment = document.createDocumentFragment();

        plants.forEach(plant => {
            const isFavorite = favoriteIds.includes(plant.id);
            const newCard = createPlantCard(plant, isFavorite);
            fragment.appendChild(newCard);
        });
        newGrid.appendChild(fragment);

        morphdom(this.#container, newGrid, {
            getNodeKey: node => node.dataset ? node.dataset.id : node.id,
            // Am eliminat complet logica specială pentru butonul de favorite.
            // Acum, morphdom va re-reda întreaga componentă PlantCard,
            // ceea ce este o abordare mai "pură" și mai simplă.
            onBeforeElUpdated: (fromEl, toEl) => {
                if (fromEl.tagName === 'IMG' && fromEl.hasAttribute('src')) {
                    return false;
                }
                return true;
            }
        });

        for (const card of this.#container.children) {
            if (!card.classList.contains('visible') && card.classList.contains('card')) {
                this.#observer.observe(card);
            }
        }
    }
}