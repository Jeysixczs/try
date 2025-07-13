export const ANIME_TOP10 = "top10Animes"; 

export function displayTop10Anime(data) {
    const container = document.getElementById('Top10Anime');
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
        container.appendChild(animeDiv);
    });
}