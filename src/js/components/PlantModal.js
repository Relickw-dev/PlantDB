import { createElement, formatValue, dispatchEvent } from '../utils/helpers.js';
import { CUSTOM_EVENTS } from '../utils/constants.js';
import { BaseModal } from './BaseModal.js';

// --- Funcții Helper (Private în contextul modulului) ---

function createTagElement(tag) {
    return createElement("span", { className: "chip", text: `#${tag}` });
}

function createKeyValue(label, value) {
    return [
        createElement("div", { className: "muted", text: label }),
        createElement("div", { text: formatValue(value) }),
    ];
}

function createCareSection({ title, description, tip }) {
    const children = [
        createElement("h4", { text: title }),
        createElement("p", { text: description })
    ];
    if (tip) {
        children.push(createElement("ul", {
            children: [createElement("li", { text: tip })],
        }));
    }
    return createElement("div", {
        className: "care-section",
        children: children,
    });
}

function createClassificationTable(classification) {
    const table = createElement("table");
    const thead = createElement("thead", {
        children: [ createElement("tr", { children: [
            createElement("th", { text: "Nivel" }),
            createElement("th", { text: "Denumire" }),
        ]})]
    });
    const tbody = createElement("tbody");
    const mapping = {
        "Regn": classification.kingdom, "Subregn": classification.subkingdom,
        "Supraîmpărțire": classification.superdivision, "Împărțire": classification.division,
        "Clasă": classification.class, "Subclasă": classification.subclass,
        "Ordin": classification.order, "Familie": classification.family,
        "Gen": classification.genus, "Specie": classification.species,
    };
    Object.entries(mapping).forEach(([label, value]) => {
        const row = createElement("tr", {
            children: [
                createElement("td", { text: label }),
                createElement("td", { text: formatValue(value) }),
            ],
        });
        tbody.appendChild(row);
    });
    table.append(thead, tbody);
    return table;
}

// --- Clasa Principală a Componentei ---

export class PlantModal extends BaseModal {
    #elements = {};

    constructor() {
        super('modal');

        this.#elements = {
            heroImage: this._modalElement.querySelector(".modal-hero-image"),
            title: document.getElementById("modalTitle"),
            latinName: document.getElementById("modalLatin"),
            description: document.getElementById("modalDesc"),
            tags: document.getElementById("modalTags"),
            details: document.getElementById("general-details-kv"),
            careGuide: document.getElementById("care-guide-content"),
            classification: document.getElementById("classification-tab-content"),
            prevBtnName: document.getElementById("prevPlantName"),
            nextBtnName: document.getElementById("nextPlantName"),
            copyButton: this._modalElement.querySelector("#copyBtn"),
        };
        
        this.#bindAdditionalEvents();
    }
    
    /** Populează și afișează modalul cu datele unei plante. */
    render({ plant, adjacentPlants, copyStatus = 'idle' }) {
        if (!plant) return;
        
        this.#resetInternalState();
        this.#updateHeader(plant);
        this.#updateContent(plant);
        this.#updateNavigation(adjacentPlants);
        this.#updateCopyButton(copyStatus);

        this.open();
    }

    /** Atașează evenimentele specifice acestui modal. @private */
    #bindAdditionalEvents() {
        if (this._modalElement.dataset.additionalEventsAttached) return;

        this._modalElement.addEventListener('click', (e) => {
            if (e.target.closest('#closeBtn')) this.close();
            if (e.target.closest('#prevBtn')) dispatchEvent(this._modalElement, CUSTOM_EVENTS.NAVIGATE_REQUEST, { direction: 'prev' });
            if (e.target.closest('#nextBtn')) dispatchEvent(this._modalElement, CUSTOM_EVENTS.NAVIGATE_REQUEST, { direction: 'next' });
            if (e.target.closest('#copyBtn')) dispatchEvent(this._modalElement, CUSTOM_EVENTS.COPY_REQUEST);
        });

        this._modalElement.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') dispatchEvent(this._modalElement, CUSTOM_EVENTS.NAVIGATE_REQUEST, { direction: 'prev' });
            if (e.key === 'ArrowRight') dispatchEvent(this._modalElement, CUSTOM_EVENTS.NAVIGATE_REQUEST, { direction: 'next' });
        });

        const tabs = this._modalElement.querySelectorAll(".modal-tab-btn");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                this.#deactivateAllTabs();
                tab.classList.add("active");
                const contentId = tab.dataset.target;
                if (contentId) {
                    this._modalElement.querySelector(`#${contentId}`)?.classList.add("active");
                }
            });
        });

        this._modalElement.dataset.additionalEventsAttached = 'true';
    }
    
    #resetInternalState() {
        const tabs = this._modalElement.querySelectorAll(".modal-tab-btn");
        const contents = this._modalElement.querySelectorAll(".modal-tab-content");

        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        if (tabs[0]) {
            tabs[0].classList.add("active");
            const firstContentId = tabs[0].dataset.target;
            if (firstContentId) {
                this._modalElement.querySelector(`#${firstContentId}`)?.classList.add("active");
            }
        }
    }
    
    #deactivateAllTabs() {
        const tabs = this._modalElement.querySelectorAll(".modal-tab-btn");
        const contents = this._modalElement.querySelectorAll(".modal-tab-content");
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));
    }

    #updateHeader(plant) {
        this.#elements.heroImage.src = plant.image || '';
        this.#elements.heroImage.alt = plant.name || 'Imagine plantă';
        this.#elements.title.textContent = plant.name;
        this.#elements.latinName.textContent = plant.latin;
        this.#elements.description.textContent = plant.desc || '';
    }
    
    #updateContent(plant) {
        this.#elements.tags.replaceChildren(...(plant.tags || []).map(createTagElement));

        const kvItems = [
            ["Categorie", plant.category], ["Dificultate", plant.difficulty],
            ["Toxicitate", plant.toxicity ? `🐱 ${plant.toxicity.cats}, 🐶 ${plant.toxicity.dogs}` : "—"],
            ["Origine", plant.origin], ["Dimensiune", plant.size], ["Înmulțire", plant.propagation],
        ].flatMap(([label, value]) => createKeyValue(label, value));
        this.#elements.details.replaceChildren(...kvItems);

        if (plant.care_guide) {
            const careSections = Object.values(plant.care_guide).map(createCareSection);
            this.#elements.careGuide.replaceChildren(...careSections);
        } else {
            this.#elements.careGuide.replaceChildren();
        }

        if (plant.classification) {
            this.#elements.classification.replaceChildren(createClassificationTable(plant.classification));
        } else {
            this.#elements.classification.replaceChildren();
        }
    }

    #updateNavigation(adjacentPlants) {
        this.#elements.prevBtnName.textContent = adjacentPlants.prev?.name || '';
        this.#elements.nextBtnName.textContent = adjacentPlants.next?.name || '';
    }

    #updateCopyButton(copyStatus) {
        const copyButton = this.#elements.copyButton;
        if (copyButton) {
            copyButton.classList.remove("success", "error");
            switch (copyStatus) {
                case 'success':
                    copyButton.textContent = "✔ Copiat!";
                    copyButton.classList.add("success");
                    break;
                case 'error':
                    copyButton.textContent = "Eroare!";
                    copyButton.classList.add("error");
                    break;
                case 'idle':
                default:
                    copyButton.textContent = "Copiază detalii";
                    break;
            }
        }
    }
}