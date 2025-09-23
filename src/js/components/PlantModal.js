// src/js/components/PlantModal.js

import { createElement, formatValue, dispatchEvent } from '../utils/helpers.js';
import { CUSTOM_EVENTS, COPY_STATUS, NAVIGATION } from '../utils/constants.js';
import { BaseModal } from './BaseModal.js';

// --- Subcomponente (Helpers de Randare) ---

function createTagElement(tag) {
    return createElement("span", { className: "chip", text: `#${tag}` });
}

function createKeyValue(label, value) {
    return [
        createElement("div", { className: "muted", text: label }),
        createElement("div", { text: formatValue(value) }),
    ];
}

function createTitledSection(title, content) {
    if (!title || !content || (Array.isArray(content) && content.length === 0)) return null;

    const children = [createElement("h4", { text: title })];

    if (typeof content === 'string') {
        children.push(createElement("p", { text: content }));
    } else if (Array.isArray(content)) {
        const listItems = content.map(item => createElement("li", { text: item }));
        children.push(createElement("ul", { className: "info-list", children: listItems }));
    } else if (typeof content === 'object' && content.description) {
        children.push(createElement("p", { text: content.description }));
        if (content.tip) {
            children.push(createElement("ul", {
                children: [createElement("li", { text: content.tip })],
            }));
        }
    } else {
        return null;
    }

    return createElement("div", {
        className: "care-section",
        children: children,
    });
}

function createClassificationTable(classification) {
    if (!classification) return null;
    const table = createElement("table");
    const tbody = createElement("tbody");
    const mapping = {
        "Regn": classification.kingdom, "Subregn": classification.subkingdom,
        "Supraîmpărțire": classification.superdivision, "Împărțire": classification.division,
        "Clasă": classification.class, "Subclasă": classification.subclass,
        "Ordin": classification.order, "Familie": classification.family,
        "Gen": classification.genus, "Specie": classification.species,
    };
    Object.entries(mapping).forEach(([label, value]) => {
        if (value) {
            tbody.appendChild(createElement("tr", {
                children: [
                    createElement("td", { text: label }),
                    createElement("td", { text: formatValue(value) }),
                ],
            }));
        }
    });
    if (tbody.children.length > 0) {
        const thead = createElement("thead", {
            children: [createElement("tr", {
                children: [
                    createElement("th", { text: "Nivel Taxonimic" }),
                    createElement("th", { text: "Denumire" }),
                ]
            })]
        });
        table.append(thead, tbody);
        return table;
    }
    return null;
}

export class PlantModal extends BaseModal {
    #elements = {};
    #currentPlant = null;

    constructor() {
        super('modal');
        this.#elements = {
            heroImage: this._modalElement.querySelector(".modal-hero-image"),
            title: this._modalElement.querySelector("#modalTitle"),
            latinName: this._modalElement.querySelector("#modalLatin"),
            description: this._modalElement.querySelector("#modalDesc"),
            tags: this._modalElement.querySelector("#modalTags"),
            details: this._modalElement.querySelector("#general-details-kv"),
            careGuide: this._modalElement.querySelector("#care-guide-content"),
            classification: this._modalElement.querySelector("#classification-tab-content"),
            extraInfo: this._modalElement.querySelector("#extra-info-content"),
            prevBtn: this._modalElement.querySelector("#prevBtn"),
            nextBtn: this._modalElement.querySelector("#nextBtn"),
            prevBtnName: this._modalElement.querySelector("#prevPlantName"),
            nextBtnName: this._modalElement.querySelector("#nextPlantName"),
            copyButton: this._modalElement.querySelector("#copyBtn"),
            shareButton: this._modalElement.querySelector("#shareBtn"),
            tabs: this._modalElement.querySelectorAll(".modal-tab-btn"),
            tabContents: this._modalElement.querySelectorAll(".modal-tab-content"),
        };
        this.#bindComponentEvents();
    }

    render({ plant, adjacentPlants, copyStatus = COPY_STATUS.IDLE }) {
        if (!plant) return;
        this.#currentPlant = plant;
        this.#resetInternalState();
        this.#updateHeader(plant);
        this.#updateContent(plant);
        this.#updateNavigation(adjacentPlants, plant);
        this.#updateCopyButton(copyStatus);
        this.open();
    }
    
    #renderDetailsTab(plant) {
        const fragment = document.createDocumentFragment();
        const toxicityText = plant.toxicity ? `🐱 ${formatValue(plant.toxicity.cats)}, 🐶 ${formatValue(plant.toxicity.dogs)}` : undefined;
        const kvItems = [
            ["Categorie", plant.category], ["Dificultate", plant.difficulty],
            ["Rata de Creștere", plant.growth_rate], ["Înflorire", plant.blooming],
            ["Durata de viață", plant.lifespan], ["Toxicitate", toxicityText],
            ["Origine", plant.origin], ["Dimensiune", plant.size],
        ].flatMap(([label, value]) => createKeyValue(label, value));
        
        fragment.append(...kvItems);
        return fragment;
    }

    #renderCareGuideTab(plant) {
        const fragment = document.createDocumentFragment();
        if (plant.care_guide) {
            const careSections = Object.values(plant.care_guide)
                .map(guide => createTitledSection(guide.title, { description: guide.description, tip: guide.tip }))
                .filter(Boolean);
            fragment.append(...careSections);
        }
        return fragment;
    }

    #renderExtraInfoTab(plant) {
        const fragment = document.createDocumentFragment();
        const extraSections = [
            createTitledSection("☀️ Îngrijire Sezonieră (Creștere)", plant.seasonal_care?.growing_season),
            createTitledSection("❄️ Îngrijire Sezonieră (Repaus)", plant.seasonal_care?.dormant_season),
            createTitledSection("🐞 Dăunători Comuni", plant.common_pests),
            createTitledSection("💡 Curiozități", plant.quick_facts)
        ].filter(Boolean);

        if (extraSections.length > 0) {
            fragment.append(...extraSections);
        } else {
            fragment.appendChild(createElement("p", { text: "Nu există informații suplimentare pentru această plantă." }));
        }
        return fragment;
    }
    
    #renderClassificationTab(plant) {
        const classificationTable = createClassificationTable(plant.classification);
        if (classificationTable) {
            return classificationTable;
        }
        return createElement("p", { text: "Informațiile de clasificare nu sunt disponibile." });
    }
    
    #updateContent(plant) {
        const detailsContent = this.#renderDetailsTab(plant);
        const careGuideContent = this.#renderCareGuideTab(plant);
        const extraInfoContent = this.#renderExtraInfoTab(plant);
        const classificationContent = this.#renderClassificationTab(plant);

        this.#elements.tags.replaceChildren(...(plant.tags || []).map(createTagElement));
        this.#elements.details.replaceChildren(detailsContent);
        this.#elements.careGuide.replaceChildren(careGuideContent);
        this.#elements.extraInfo.replaceChildren(extraInfoContent);
        this.#elements.classification.replaceChildren(classificationContent);
    }

    #bindComponentEvents() {
        if (this._modalElement.dataset.componentEventsAttached) return;

        this._modalElement.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const action = target.id;
            const eventMap = {
                'closeBtn': CUSTOM_EVENTS.CLOSE_REQUEST,
                'prevBtn': CUSTOM_EVENTS.NAVIGATE_REQUEST,
                'nextBtn': CUSTOM_EVENTS.NAVIGATE_REQUEST,
                'copyBtn': CUSTOM_EVENTS.COPY_REQUEST,
                'shareBtn': CUSTOM_EVENTS.SHARE_REQUEST
            };

            const eventName = eventMap[action];
            if (!eventName) return;

            const detail = action.includes('Btn') && !['copyBtn', 'shareBtn'].includes(action) 
                ? { direction: action === 'prevBtn' ? NAVIGATION.PREV : NAVIGATION.NEXT } 
                : {};
            dispatchEvent(this._modalElement, eventName, detail);
        });

        this.#elements.tabs.forEach(tab => {
            tab.addEventListener("click", () => this.#handleTabClick(tab));
        });

        this._modalElement.dataset.componentEventsAttached = 'true';
    }

    #handleTabClick(clickedTab) {
        this.#elements.tabs.forEach(t => t.classList.remove("active"));
        this.#elements.tabContents.forEach(c => c.classList.remove("active"));
        clickedTab.classList.add("active");
        const contentId = clickedTab.dataset.target;
        this._modalElement.querySelector(`#${contentId}`)?.classList.add("active");
    }

    #resetInternalState() {
        this.#handleTabClick(this.#elements.tabs[0]);
        this._modalElement.scrollTop = 0;
    }

    #updateHeader(plant) {
        this.#elements.heroImage.src = plant.image || 'assets/images/placeholder.jpg';
        this.#elements.heroImage.alt = plant.name || 'Imagine plantă';
        this.#elements.title.textContent = plant.name || 'Nume indisponibil';
        this.#elements.latinName.textContent = plant.latin || '';
        this.#elements.description.textContent = plant.desc || '';
    }

    #updateNavigation(adjacentPlants, currentPlant) {
        const { prev, next } = adjacentPlants || {};
        this.#elements.prevBtnName.textContent = prev?.name || '';
        this.#elements.nextBtnName.textContent = next?.name || '';
        this.#elements.prevBtn.style.visibility = (prev && prev.id !== currentPlant.id) ? 'visible' : 'hidden';
        this.#elements.nextBtn.style.visibility = (next && next.id !== currentPlant.id) ? 'visible' : 'hidden';
    }

    #updateCopyButton(copyStatus) {
        const copyButton = this.#elements.copyButton;
        if (!copyButton) return;
        copyButton.classList.remove("success", "error");
        copyButton.disabled = false;
        switch (copyStatus) {
            case COPY_STATUS.SUCCESS:
                copyButton.textContent = "✔ Copiat!";
                copyButton.classList.add("success");
                copyButton.disabled = true;
                break;
            case COPY_STATUS.ERROR:
                copyButton.textContent = "Eroare!";
                copyButton.classList.add("error");
                break;
            default:
                copyButton.textContent = "Copiază detalii";
                break;
        }
    }
}