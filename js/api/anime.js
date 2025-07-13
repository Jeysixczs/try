import { displayspotlight , ANIME_SPOTlIGHTS} from '../anime_compilation/spotlight_anime.js';
import { displayLatestCompleteAnime, ANIME_LATESTCOMPLETE } from '../anime_compilation/latest_complete_anime.js';
import { displayLatestEpisode ,ANIME_LATESTEPISODE } from '../anime_compilation/latest_episode_anime.js';
import { displayTopAiringAnime, ANIME_TOPAIRING } from '../anime_compilation/top_airing_anime.js';
import { ANIME_TOP10 } from '../anime_compilation/top_ten_anime.js';
import { displayTopUpcomingAnime , ANIME_TOPUPCOMING} from '../anime_compilation/top_upcoming_anime.js';
import { displayTrendingAnime, ANIME_TRENDING } from '../anime_compilation/trending_anime.js';
import { displayMostFavoriteAnime, ANIME_FAVORITE } from '../anime_compilation/most_favorite_anime.js';
import { displayMostPopular, ANIME_POPULAR } from '../anime_compilation/most_popular_anime.js';



export async function fetchAnimeContent() {
    try {
        const url = "https://animeapi-hazel-ten.vercel.app/api/v2/hianime/home";
        const proxy = PROXIES[0];
        const apiUrl = proxy.getApiUrl(url);
        const resp = await fetch(apiUrl);
        const result = await resp.json();

        // DEBUG: log the whole response
        console.log("API Response:", result);

        // Check for expected data structure and display anime list
        if (
            result &&
            result.data &&
            Array.isArray(result.data[ANIME_LATESTCOMPLETE]) &&
            Array.isArray(result.data[ANIME_SPOTlIGHTS]) &&
            Array.isArray(result.data[ANIME_LATESTEPISODE]) &&
            Array.isArray(result.data[ANIME_TOPAIRING]) &&
            Array.isArray(result.data[ANIME_TOPUPCOMING]) &&
            Array.isArray(result.data[ANIME_TRENDING]) &&
            Array.isArray(result.data[ANIME_FAVORITE]) &&
            Array.isArray(result.data[ANIME_POPULAR]) 
        ) {
            displayLatestCompleteAnime(result.data[ANIME_LATESTCOMPLETE]);
            displayspotlight(result.data[ANIME_SPOTlIGHTS]);
            displayLatestEpisode(result.data[ANIME_LATESTEPISODE]);
            displayTopAiringAnime(result.data[ANIME_TOPAIRING]);
            displayTopUpcomingAnime(result.data[ANIME_TOPUPCOMING]);
            displayTrendingAnime(result.data[ANIME_TRENDING]);
            displayMostFavoriteAnime(result.data[ANIME_FAVORITE]);
            displayMostPopular(result.data[ANIME_POPULAR]);
        } else {
            animecontent.innerHTML = `<p>Unexpected data format:<br>${JSON.stringify(result)}</p>`;
        }
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
        animecontent.innerHTML = '<p>Failed to load anime content.</p>';
    }
}
export const PROXIES = [
    {
        name: 'api.codetabs.com',
        getApiUrl: (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
        getImageUrl: (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
        parse: (d) => d
    }
];