import { showAnimeEpisodeSourcesModal } from "./episode_source.js";
import { PROXIES } from "../api/anime.js";

export function showAnimeEpisodeServersModal(animeEpisodeId) {
    if (!animeEpisodeId) return;
    const modal = buildEpisodeServersModal();
    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.anime-episode-servers-modal-content');
    modalContent.innerHTML = `<div class="modal-loader">Loading servers...</div>`;

    const proxy = PROXIES[0]; // Use the first proxy by default
    const episodeUrl = proxy.getApiUrl("https://animeapi-hazel-ten.vercel.app/api/v2/hianime/episode/servers?animeEpisodeId=" + encodeURIComponent(animeEpisodeId));

    fetch(episodeUrl)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch episode servers");
            return res.json();
        })
        .then(data => {
            // For debugging: log the API response. Remove this in production.
            console.log("Server API response:", data);

            modalContent.innerHTML = buildEpisodeServersHTML(data);

            // Add event listeners for "Play" buttons
            Array.from(modalContent.querySelectorAll('.show-sources-btn')).forEach(btn => {
                btn.onclick = function () {
                    const episodeId = btn.getAttribute('data-epid');
                    const server = btn.getAttribute('data-server');
                    const category = btn.getAttribute('data-category');
                    if (episodeId && server && category) {
                        showAnimeEpisodeSourcesModal(episodeId, server, category);
                    }
                };
            });
        })
        .catch(err => {
            modalContent.innerHTML = `<div class="modal-loader">Error loading servers: ${err?.message || err}</div>`;
        });

    setTimeout(() => {
        const closeBtn = modal.querySelector('.anime-episode-servers-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);
}

function buildEpisodeServersModal() {
    let oldModal = document.getElementById('anime-episode-servers-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = "anime-episode-servers-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="anime-episode-servers-modal-content" tabindex="0"></div>
        <button class="anime-episode-servers-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-episode-servers-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });
    return modal;
}

function buildEpisodeServersHTML(data) {
    // Defensive: Check for valid data shape and at least one server array not empty
    if (!data || data.status !== 200 || !data.data) {
        return `<div class="modal-loader">${data?.error || "No server info found."}</div>`;
    }
    const ep = data.data;
    let sections = "";

    // If ep is missing expected properties, show error
    if (!ep.episodeId || typeof ep.episodeNo === "undefined") {
        return `<div class="modal-loader">Episode info incomplete. Please try another episode.</div>`;
    }

    let hasAnyServers = false;

    ["sub", "dub", "raw"].forEach(type => {
        if (Array.isArray(ep[type]) && ep[type].length > 0) {
            hasAnyServers = true;
            sections += `
                <div class="modal-server-section" style="margin-bottom:1em;">
                    <h3 style="margin:0 0 8px 0;text-transform:capitalize;">${type} servers</h3>
                    <ul style="list-style:none;padding:0;">
                        ${ep[type].map(server => `
                            <li style="margin-bottom:6px;">
                                <span style="font-weight:bold;">${server.serverName}</span>
                                <span style="color:#888;font-size:12px;">(ID: ${server.serverId})</span>
                                <button 
                                    class="show-sources-btn" 
                                    data-epid="${ep.episodeId}" 
                                    data-server="${server.serverName}" 
                                    data-category="${type}"
                                    style="margin-left:8px;padding:2px 8px;">Play</button>
                            </li>
                        `).join("")}
                    </ul>
                </div>
            `;
        }
    });

    if (!hasAnyServers) {
        sections = `<div style="color:#e74c3c;">No streaming servers available for this episode.<br>It may not have been released yet or is not available on the current API.</div>`;
    }

    return `
        <div>
            <h2 style="margin-bottom:10px;">Servers for Episode ${ep.episodeNo}</h2>
            ${sections}
        </div>
    `;
}