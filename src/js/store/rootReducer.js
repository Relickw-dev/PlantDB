// src/js/store/rootReducer.js
import { plantsReducer } from '../features/plants/plantsReducer.js';
import { favoritesReducer } from '../features/favorites/favoritesReducer.js';
import { faqReducer } from '../features/faq/faqReducer.js';

export function rootReducer(state = {}, action) {
    return {
        plants: plantsReducer(state.plants, action),
        favorites: favoritesReducer(state.favorites, action),
        faq: faqReducer(state.faq, action),
    };
}