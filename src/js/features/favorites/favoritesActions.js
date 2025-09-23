// src/js/features/favorites/favoritesActions.js
import { actionTypes } from '../../store/actionTypes.js';
import * as favoriteService from '../../services/favoriteService.js';

export const loadFavorites = () => (dispatch) => {
    const favoriteIds = favoriteService.getFavorites();
    dispatch({ type: actionTypes.SET_FAVORITE_IDS, payload: favoriteIds });
};

export const toggleFavorite = (plantId) => (dispatch, getState) => {
    const currentFavorites = getState().favorites.ids;
    const newFavorites = currentFavorites.includes(plantId)
        ? favoriteService.removeFavorite(plantId)
        : favoriteService.addFavorite(plantId);
    
    dispatch({ type: actionTypes.SET_FAVORITE_IDS, payload: newFavorites });
};

export const toggleFavoritesFilter = () => ({ type: actionTypes.TOGGLE_FAVORITES_FILTER });