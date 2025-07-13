import { showAnimeInfoModal } from '../ui/modal.js';

export const ANIME_LATESTEPISODE = "latestEpisodeAnimes"; 

export function displayLatestEpisode(data) {
    const container = document.getElementById('LatestEpisode');
    if (!container) return;
    container.innerHTML = ''; 

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p>No anime found.</p>';
        return;
    }

    data.forEach(anime => {
        const animeDiv = document.createElement('div');
        animeDiv.className = 'anime-item';
        animeDiv.style.cursor = 'pointer';

        animeDiv.innerHTML = `
            <img src="${anime.poster || anime.image || 'https://via.placeholder.com/150'}" alt="${anime.title || anime.name || 'No Title'}" style="width:150px; height:auto;">
            <h3>${anime.title || anime.name || 'No Title'}</h3>
            <p>${anime.description || anime.synopsis || ''}</p>
        `;

        animeDiv.addEventListener('click', () => {
            const animeId = anime.id || anime.animeId || anime._id;
            if (!animeId) {
                alert("Anime ID not found.");
                return;
            }
            showAnimeInfoModal(animeId);
        });

        container.appendChild(animeDiv);
    });
}