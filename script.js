import { fetchAnimeContent } from './js/api/anime.js';

document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeContent();
});

import { showAnimeEpisodeSourcesModal } from './ui/episode_source.js';

document.getElementById('some-button').addEventListener('click', async () => {
  // Fetch the episode sources (replace URL with your API endpoint)
  const res = await fetch('/api/episode-sources?animeEpisodeId=123');
  const json = await res.json();
  // Call the modal function with the fetched data
  showAnimeEpisodeSourcesModal(json.data);
});