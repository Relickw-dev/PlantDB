import { createElement } from '../utils/helpers.js';

// --- Subcomponente Reutilizabile ---
// Am grupat funcțiile de randare într-un obiect pentru a fi mai organizate și exportabile.
export const CardComponents = {
    /** Creează elementele DOM pentru tag-urile unei plante. */
    renderTags(tags = []) {
        return createElement("div", {
            className: "tags",
            children: tags.map((tag) => createElement("span", { className: "tag", text: tag })),
        });
    },

    /** Creează indicatorul vizual pentru nivelul de toxicitate. */
    renderToxicityIndicator(toxicityInfo) {
        if (!toxicityInfo) return null; // Sau un element default
        const { icon, text, class: cls } = toxicityInfo;
        return createElement("div", {
            className: `toxicity-indicator ${cls}`,
            text: `${icon} ${text}`,
        });
    },

    /** Creează bara vizuală pentru nivelul de dificultate. */
    renderDifficultyBar(plant) {
        const totalLevels = plant.maxDifficulty || 3;
        const levels = Array.from({ length: totalLevels }, (_, i) =>
            createElement("div", {
                className: `difficulty-level ${i < plant.difficultyValue ? `active ${plant.difficultyClass}` : ''}`
            })
        );
        return createElement("div", { className: "difficulty-bar", children: levels });
    },
};


// --- Componenta Principală a Cardului ---

/**
 * Creează un card de plantă complet, pregătit pentru lazy loading.
 * @param {object} plant - Obiectul cu datele plantei.
 * @param {boolean} [isFavorite=false] - Indică dacă planta este marcată ca favorită.
 * @returns {HTMLElement} Cardul DOM generat.
 */
export function createPlantCard(plant, isFavorite = false) {
    // 1. Creăm butonul de favorit, la fel ca înainte.
    const favoriteBtn = createElement("button", {
        className: `favorite-btn ${isFavorite ? 'active' : ''}`,
        attrs: {
            "aria-label": "Adaugă la favorite",
            "data-plant-id": plant.id
        },
        html: `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
    });

    // 2. Creăm un container NOU pentru titlu și buton, folosind Flexbox.
    const cardTitleHeader = createElement("div", {
        className: "card-title-header",
        children: [
            createElement("h4", { className: "name", text: plant.name || 'Nume indisponibil' }),
            favoriteBtn // Adăugăm butonul aici, lângă titlu
        ]
    });

    // 3. Construim cardul final cu noua structură.
    return createElement("div", {
        className: "card",
        attrs: { "data-id": plant.id },
        children: [
            createElement("div", {
                className: "thumb",
                children: [
                    createElement("img", {
                        attrs: { "data-src": plant.image || '', alt: plant.name || 'Imagine plantă' },
                        className: 'lazy-image'
                    })
                ],
            }),
            createElement("div", {
                className: "content",
                children: [
                    cardTitleHeader, // Folosim noul container aici
                    createElement("p", { className: "latin", text: plant.latin || '' }),
                    CardComponents.renderTags(plant.tags),
                    createElement("div", {
                        className: "card-info-container",
                        children: [
                            CardComponents.renderToxicityIndicator(plant.toxicityInfo),
                            CardComponents.renderDifficultyBar(plant),
                        ],
                    }),
                ],
            }),
            // Am eliminat complet butonul invizibil pentru a preveni orice conflict
        ],
    });
}