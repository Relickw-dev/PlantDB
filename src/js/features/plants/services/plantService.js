// src/js/services/plantService.js
import { fetchWithRetries } from '../../../shared/services/apiService.js';

let cachedPlants = null;

export async function fetchAllPlants() {
    if (cachedPlants) {
        return cachedPlants;
    }
    
    const rawPlantData = await fetchWithRetries('http://localhost:3000/api/plants');

    if (!Array.isArray(rawPlantData)) {
        throw new Error(`Datele primite de la API nu sunt un array valid.`);
    }

    cachedPlants = rawPlantData;
    return cachedPlants;
}

export async function fetchPlantDetails(plantId) {
    return await fetchWithRetries(`http://localhost:3000/api/plants/${plantId}`);
}