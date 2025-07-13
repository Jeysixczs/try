import { showAnimeInfoModal } from "../ui/modal.js";

export const ANIME_POPULAR = "mostPopularAnimes"; 

export function displayMostPopular(data) {
    const container = document.getElementById('PopularAnime');
    if (!container) return;
    container.innerHTML = ''; 

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p>No anime found.</p>';
        return;
    }

    data.forEach(anime => {
        const animeDiv = document.createElement('div');
        animeDiv.className = 'anime-item';
        animeDiv.innerHTML = `
            <img src="${anime.poster || anime.poster || 'https://via.placeholder.com/150'}" alt="${anime.title || anime.name || 'No Title'}" style="width:150px; height:auto;">
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