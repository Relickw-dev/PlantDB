// src/js/services/shareService.js
import { handleError } from '../../app/errorHandler.js';
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
            handleError(err, "partajarea detaliilor");
        }
    }
}