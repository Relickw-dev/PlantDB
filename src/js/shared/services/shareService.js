// src/js/shared/services/shareService.js
import { handleError, OperationalError } from '../../app/errorHandler.js'; // Adaugă OperationalError
import { showNotification } from '../components/NotificationService.js';

export async function sharePlant(plant) {
    if (!plant) return;

    const shareData = {
        title: plant.name,
        text: `Uite ce plantă interesantă am găsit: ${plant.name}!`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showNotification("Link-ul a fost copiat în clipboard!", { type: 'success' });
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            // Folosim o eroare personalizată pentru a standardiza
            handleError(new OperationalError(err.message), "partajarea detaliilor");
        }
    }
}