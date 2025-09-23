// src/js/features/favorites/index.js
import { favoritesReducer } from './favoritesReducer.js';
import * as favoriteActions from './favoritesActions.js';

export default {
    name: 'favorites',
    reducer: favoritesReducer,
    bindEvents: (dom, store) => {
        // Butonul de filtrare a favoritelor din header
        dom.showFavoritesBtn.addEventListener('click', () => store.dispatch(favoriteActions.toggleFavoritesFilter()));

        // Delegare eveniment global pentru adăugarea/ștergerea unei favorite
        document.body.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.favorite-btn[data-plant-id]');
            if (favoriteBtn) {
                e.stopPropagation(); // Previne deschiderea modalului
                const plantId = parseInt(favoriteBtn.dataset.plantId, 10);
                if (!isNaN(plantId)) {
                    store.dispatch(favoriteActions.toggleFavorite(plantId));
                }
            }
        });
    }
};