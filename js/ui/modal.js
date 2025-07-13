// Modal rendering for HiAnime
import { PROXIES } from '../api/anime.js';

export function showAnimeInfoModal(animeId) {
    if (!animeId) return;
    const proxy = PROXIES[0]; // Use the first proxy by default
    const modal = buildModal();
    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.anime-modal-content');
    modalContent.innerHTML = `<div class="modal-loader">Loading info...</div>`;

    const INFO_URL = proxy.getApiUrl("https://animeapi-hazel-ten.vercel.app/api/v2/hianime/anime/" + animeId);

    fetch(INFO_URL)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch anime info");
            return res.json();
        })
        .then(data => {
            modalContent.innerHTML = buildAnimeInfoHTML(data);
        })
        .catch(err => {
            modalContent.innerHTML = `<div class="modal-loader">Error loading info: ${err?.message || err}</div>`;
        });

    setTimeout(() => {
        const closeBtn = modal.querySelector('.anime-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);
}

function buildModal() {
    let oldModal = document.getElementById('anime-info-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = "anime-info-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="anime-modal-content" tabindex="0"></div>
        <button class="anime-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });
    return modal;
}

function buildAnimeInfoHTML(data) {
    const proxy = PROXIES[0];

    // Defensive: Support both .data.anime.info and .data.info formats
    let anime, moreInfo;
    if (data?.data?.anime?.info) {
        anime = data.data.anime.info;
        moreInfo = data.data.anime.moreInfo || {};
    } else if (data?.data?.info) {
        anime = data.data.info;
        moreInfo = data.data.moreInfo || {};
    } else if (data?.data) {
        anime = data.data;
        moreInfo = {};
    } else {
        return `<div class="modal-loader">${data?.error || "No info found."}</div>`;
    }

    // Title and poster
    const title = anime.name || anime.title || moreInfo.japanese || "No Title";
    const imageUrl = proxy.getImageUrl(anime.poster || anime.coverImage || anime.image) || "https://via.placeholder.com/240x340?text=No+Image";
    const description = anime.description || moreInfo.synopsis || "No description found.";

    // Stats & meta
    const rating = anime.stats?.rating || moreInfo.status || "";
    const type = anime.stats?.type || moreInfo.type || "";
    const duration = anime.stats?.duration || moreInfo.duration || "";
    let episodes = "";
    if (anime.stats?.episodes && typeof anime.stats.episodes === "object") {
        const epArr = [];
        if (anime.stats.episodes.dub) epArr.push(`Dub: ${anime.stats.episodes.dub}`);
        if (anime.stats.episodes.sub) epArr.push(`Sub: ${anime.stats.episodes.sub}`);
        episodes = epArr.join(", ");
    } else if (anime.stats?.episodes) {
        episodes = `${anime.stats.episodes} eps`;
    }
    const genres = (moreInfo.genres && Array.isArray(moreInfo.genres)) ? moreInfo.genres.join(", ") : "";
    const studios = moreInfo.studios || (Array.isArray(moreInfo.studios) ? moreInfo.studios.join(", ") : "");
    const producers = moreInfo.producers && Array.isArray(moreInfo.producers) ? moreInfo.producers.join(", ") : "";
    const malscore = moreInfo.malscore || "";

    // Promotional videos
    let promoVideos = "";
    if (Array.isArray(anime.promotionalVideos) && anime.promotionalVideos.length) {
        promoVideos = `<div class="modal-info-promos"><b>Promotional Videos:</b>
            ${anime.promotionalVideos.map(v => `
                <div class="promo-video">
                    <a href="${v.source}" target="_blank" rel="noopener">
                        <img src="${v.thumbnail}" alt="${v.title}" style="width:120px;height:auto;border-radius:4px;margin-right:8px;" />
                        ${v.title}
                    </a>
                </div>
            `).join("")}
        </div>`;
    }

    // Characters & Voice Actors
    let charVoice = "";
    if (Array.isArray(anime.charactersVoiceActors) && anime.charactersVoiceActors.length) {
        charVoice = `
        <div class="modal-info-characters"><b>Characters & Voice Actors:</b>
            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
            ${anime.charactersVoiceActors.map(item => `
                <div style="background:#fafafa;padding:8px;border-radius:8px;min-width:120px;max-width:160px;text-align:center;">
                    <img src="${item.character.poster}" alt="${item.character.name}" style="width:50px;height:50px;border-radius:50%;" />
                    <div style="font-weight:bold;">${item.character.name}</div>
                    <div style="font-size:12px;color:#666;">${item.character.cast}</div>
                    <div style="margin-top:4px;">
                        <img src="${item.voiceActor.poster}" alt="${item.voiceActor.name}" style="width:32px;height:32px;border-radius:50%;" />
                        <div style="font-size:12px;">${item.voiceActor.name}</div>
                        <div style="font-size:11px;color:#888;">${item.voiceActor.cast}</div>
                    </div>
                </div>
            `).join("")}
            </div>
        </div>
        `;
    }

    // Seasons (if any)
    let seasons = "";
    if (Array.isArray(data.data.seasons) && data.data.seasons.length) {
        seasons = `
        <div class="modal-info-seasons"><b>Seasons:</b>
            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
            ${data.data.seasons.map(season => `
                <div style="background:#f0f0f0;padding:6px;border-radius:6px;min-width:90px;max-width:120px;text-align:center;${season.isCurrent ? "border:2px solid #0077ff;" : ""}">
                    <img src="${season.poster}" alt="${season.title}" style="width:60px;height:80px;border-radius:4px;" />
                    <div style="font-size:13px;font-weight:bold;">${season.title}</div>
                </div>
            `).join("")}
            </div>
        </div>
        `;
    }

    // Modal HTML
    return `
        <div class="modal-info-header">
            <img src="${imageUrl}" alt="${title}" class="modal-info-img"/>
            <div>
                <h2 class="modal-info-title">${title}</h2>
                <div class="modal-info-meta">
                    ${type ? `<span>${type}</span>` : ""}
                    ${rating ? `<span>${rating}</span>` : ""}
                    ${episodes ? `<span>${episodes}</span>` : ""}
                    ${duration ? `<span>${duration}</span>` : ""}
                    ${malscore ? `<span>MAL Score: ${malscore}</span>` : ""}
                </div>
            </div>
        </div>
        <div class="modal-info-desc" style="margin-top:1em;">${description}</div>
        ${genres ? `<div class="modal-info-genres"><b>Genres:</b> ${genres}</div>` : ""}
        ${studios ? `<div class="modal-info-studios"><b>Studios:</b> ${studios}</div>` : ""}
        ${producers ? `<div class="modal-info-producers"><b>Producers:</b> ${producers}</div>` : ""}
        ${promoVideos}
        ${seasons}
        ${charVoice}
    `;
}