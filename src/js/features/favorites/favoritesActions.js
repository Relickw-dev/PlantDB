// src/js/features/favorites/favoritesActions.js
import store from '../../store/index.js';
import { actionTypes } from '../../store/actionTypes.js';
import * as favoriteService from '../../services/favoriteService.js';

export const loadFavorites = () => {
    const favoriteIds = favoriteService.getFavorites();
    store.dispatch({ type: actionTypes.SET_FAVORITE_IDS, payload: favoriteIds });
};

export const toggleFavorite = (plantId) => {
    const currentFavorites = store.getState().favorites.ids;
    const newFavorites = currentFavorites.includes(plantId)
        ? favoriteService.removeFavorite(plantId)
        : favoriteService.addFavorite(plantId);
    
    store.dispatch({ type: actionTypes.SET_FAVORITE_IDS, payload: newFavorites });
};

export const toggleFavoritesFilter = () => {
    store.dispatch({ type: actionTypes.TOGGLE_FAVORITES_FILTER });
};