// src/js/utils/dynamicLoader.js

// Variabilă pentru a stoca instanța modalului după ce a fost încărcată o dată.
let plantModalInstance = null;

/**
 * Încarcă dinamic componenta PlantModal la prima utilizare și o stochează în cache.
 * @returns {Promise<PlantModal>} Instanța componentei.
 */
export async function ensurePlantModalIsLoaded() {
    // Dacă instanța există deja în cache, o returnăm imediat.
    if (plantModalInstance) {
        return plantModalInstance;
    }

    // Folosim dynamic import pentru a încărca fișierul doar la nevoie.
    const { PlantModal } = await import('../components/PlantModal.js');
    
    // Creăm o nouă instanță și o salvăm în cache pentru apelurile viitoare.
    plantModalInstance = new PlantModal();
    
    return plantModalInstance;
}