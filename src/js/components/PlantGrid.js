import { createPlantCard } from './PlantCard.js';
import { createElement, dispatchEvent } from '../utils/helpers.js';
import { PET_KEYWORDS, CUSTOM_EVENTS } from '../utils/constants.js';

/**
 * O clasă care gestionează randarea și interacțiunile pentru grila de plante.
 * Gestionează stările de încărcare (skeleton), gol și conținut.
 */
export class PlantGrid {
    #container;
    #observer;

    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Containerul pentru PlantGrid nu a fost găsit.');
        }
        this.#container = containerElement;
        this.#observer = new IntersectionObserver(this.#handleIntersection, {
            rootMargin: '250px',
            threshold: 0.1
        });
        // Notă: Evenimentele de click (`#bindEvents`) au fost mutate în main.js
        // pentru o mai bună gestiune (event delegation), conform implementării anterioare.
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

    #createEmptyState(query, favoritesFilterActive = false) { // <-- MODIFICARE: Acceptă un parametru nou
        let message = 'Nu am găsit nicio plantă. Încearcă o altă căutare.';
        let imgSrc = "assets/icons/empty.svg";

        // <-- MODIFICARE: Mesaj personalizat pentru lista de favorite goală
        if (favoritesFilterActive) {
            message = 'Nu ai adăugat nicio plantă la favorite. Apasă pe inimă pentru a crea colecția ta!';
            // Ai putea folosi o altă imagine aici dacă dorești, ex: "assets/icons/favorite-empty.svg"
        } else if (PET_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
            message = 'Am găsit doar plante sigure pentru prietenii tăi blănoși! 🐾';
            imgSrc = "assets/icons/pet-friendly.svg";
        }
        
        this.#container.innerHTML = "";
        const emptyStateElement = createElement("div", {
            className: "empty-state",
            children: [
                createElement("img", { attrs: { src: imgSrc, alt: "Ilustrație" } }),
                createElement("p", { text: message }),
            ]
        });
        this.#container.appendChild(emptyStateElement);
    }
    
    #createSkeletonState() {
        this.#container.innerHTML = "";
        const skeletonGrid = createElement('div', { className: 'skeleton-grid' });
        const fragment = document.createDocumentFragment();

        Array.from({ length: 9 }).forEach(() => {
            const skeletonCard = createElement('div', {
                className: 'skeleton-card',
                children: [
                    createElement('div', { className: 'skeleton-image' }),
                    createElement('div', { className: 'skeleton-content', children: [
                        createElement('div', { className: 'skeleton-title' }),
                        createElement('div', { className: 'skeleton-text' }),
                    ]}),
                ]
            });
            fragment.appendChild(skeletonCard);
        });
        
        skeletonGrid.appendChild(fragment);
        this.#container.appendChild(skeletonGrid);
    }
    
    /**
     * Randează una dintre cele trei stări: încărcare, gol sau conținut.
     */
    render({ plants, query, isLoading, favoriteIds = [], favoritesFilterActive = false }) {
        if (isLoading) {
            this.#createSkeletonState();
            return;
        }

        // <-- ADAUGAT: Logica de filtrare pentru a determina ce plante afișăm
        const plantsToRender = favoritesFilterActive
            ? plants.filter(p => favoriteIds.includes(p.id))
            : plants;
        
        if (plantsToRender.length === 0) {
            // <-- CORECTAT: Trimitem starea filtrului pentru a afișa mesajul corect
            this.#createEmptyState(query, favoritesFilterActive);
            return;
        }

        const newGrid = this.#container.cloneNode(false);
        const fragment = document.createDocumentFragment();
        
        // <-- CORECTAT: Folosim `plantsToRender` în loc de `plants` pentru a itera peste lista corectă (filtrată)
        plantsToRender.forEach(plant => {
            const isFavorite = favoriteIds.includes(plant.id);
            // <-- CORECTAT: Trimitem `isFavorite` către funcția de creare a cardului
            const newCard = createPlantCard(plant, isFavorite);
            fragment.appendChild(newCard);
        });
        
        newGrid.appendChild(fragment);

        morphdom(this.#container, newGrid, {
            getNodeKey: node => {
                return node.dataset ? node.dataset.id : node.id;
            }
        });

        for (const card of this.#container.children) {
            if (!card.classList.contains('visible')) {
                this.#observer.observe(card);
            }
        }
    }
}