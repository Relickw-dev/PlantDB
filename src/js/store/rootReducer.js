// src/js/store/rootReducer.js
import { plantsreducer } from '../features/plants/plantsreducer.js';
// vom adăuga aici și alți reduceri pe viitor (ex: favoritesreducer)

export function rootreducer(state = {}, action) {
    return {
        // fiecare reducer este responsabil pentru o "felie" (slice) din starea globală
        plants: plantsreducer(state.plants, action),
        // favorites: favoritesReducer(state.favorites, action),
    };
}