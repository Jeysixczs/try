import { showAnimeEpisodeServersModal } from "./episode_server.js";

// Renders anime episodes in a modal or section.
// Usage: showAnimeEpisodesModal(animeId)
// Example: showAnimeEpisodesModal('steinsgate-3')

import { PROXIES } from '../api/anime.js';

export function showAnimeEpisodesModal(animeId) {
    if (!animeId) return;
    const proxy = PROXIES[0];
    const modal = buildEpisodeModal();
    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.anime-episode-modal-content');
    modalContent.innerHTML = `<div class="modal-loader">Loading episodes...</div>`;

    const EP_URL = proxy.getApiUrl("https://animeapi-hazel-ten.vercel.app/api/v2/hianime/anime/" + animeId + "/episodes");

    fetch(EP_URL)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch episode list");
            return res.json();
        })
        .then(data => {
            modalContent.innerHTML = buildEpisodeListHTML(data);

            // Add event listeners for "Servers" buttons
            Array.from(modalContent.querySelectorAll('.show-servers-btn')).forEach(btn => {
                btn.onclick = function () {
                    const episodeId = btn.getAttribute('data-epid');
                    if (episodeId) showAnimeEpisodeServersModal(episodeId);
                };
            });
        })
        .catch(err => {
            modalContent.innerHTML = `<div class="modal-loader">Error loading episodes: ${err?.message || err}</div>`;
        });

    setTimeout(() => {
        const closeBtn = modal.querySelector('.anime-episode-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);
}

function buildEpisodeModal() {
    let oldModal = document.getElementById('anime-episode-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = "anime-episode-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="anime-episode-modal-content" tabindex="0"></div>
        <button class="anime-episode-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-episode-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });
    return modal;
}

function buildEpisodeListHTML(data) {
    if (!data || data.status !== 200 || !Array.isArray(data.data?.episodes)) {
        return `<div class="modal-loader">${data?.error || "No episode info found."}</div>`;
    }

    const episodes = data.data.episodes;
    const totalEpisodes = data.data.totalEpisodes;

    return `
        <div class="modal-episode-header">
            <h2 class="modal-episode-title">Episodes (${totalEpisodes})</h2>
        </div>
        <div class="modal-episode-list" style="max-height:400px;overflow-y:auto;">
            <ul style="list-style:none;padding:0;margin:0;">
                ${episodes.map(ep => `
                    <li style="margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:6px;">
                        <span style="font-weight:bold;">Episode ${ep.number}:</span>
                        <span>${ep.title}</span>
                        ${ep.isFiller ? `<span style="color:#e74c3c;font-size:12px;"> [Filler]</span>` : ""}
                        <button class="show-servers-btn" 
                            data-epid="${ep.episodeId}" 
                            style="margin-left:8px;padding:2px 8px;">Servers</button>
                    </li>
                `).join("")}
            </ul>
        </div>
    `;
}