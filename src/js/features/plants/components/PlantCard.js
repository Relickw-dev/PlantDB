import { createElement } from '../../../shared/utils/helpers.js';

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
        
        // --- MODIFICARE APLICATĂ AICI ---
        const tooltipText = `Toxicitate: ${text}`;
        
        return createElement("div", {
            className: `toxicity-indicator ${cls}`,
            text: `${icon} ${text}`,
            attrs: { "data-tooltip": tooltipText } // Adăugăm atributul pentru tooltip
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
        
        // --- MODIFICARE APLICATĂ AICI ---
        const tooltipText = `Dificultate: ${plant.difficulty} (${plant.difficultyValue}/${totalLevels})`;

        return createElement("div", {
            className: "difficulty-bar",
            children: levels,
            attrs: { "data-tooltip": tooltipText } // Adăugăm atributul pentru tooltip
        });
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
    const favoriteBtn = createElement("button", {
        className: `favorite-btn ${isFavorite ? 'active' : ''}`,
        attrs: {
            "aria-label": "Adaugă la favorite",
            "data-plant-id": plant.id,
            // <-- MODIFICARE: Am adăugat un ID unic pentru a identifica butonul
            "data-id": `fav-btn-${plant.id}` 
        },
        html: `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
    });

    return createElement("div", {
        className: "card",
        attrs: { "data-id": plant.id },
        children: [
            favoriteBtn,
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
                    createElement("h4", { className: "name", text: plant.name || 'Nume indisponibil' }),
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
        ],
    });
}