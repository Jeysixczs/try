import { PROXIES } from "../api/anime.js";

// Your Vercel serverless proxy for Referer
function getProxiedUrl(url, referer) {
    // CHANGE THIS to your deployed Vercel endpoint (e.g. https://your-vercel-app.vercel.app/api/proxy)
    return `https://animeapi-hazel-ten.vercel.app/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}

// Dynamically load hls.js if not present
function ensureHlsJs(callback) {
    if (window.Hls) return callback();
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = () => callback();
    script.onerror = () => callback(new Error("Failed to load hls.js"));
    document.head.appendChild(script);
}

export function showAnimeEpisodeSourcesModal(animeEpisodeId, server = "hd-1", category = "sub") {
    if (!animeEpisodeId) return;
    const modal = buildEpisodeSourcesModal();
    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.anime-episode-sources-modal-content');
    modalContent.innerHTML = `<div class="modal-loader">Loading sources...</div>`;
    const proxy = PROXIES[0];
    const EpisodeSourcesUrl = proxy.getApiUrl(
        "https://animeapi-hazel-ten.vercel.app/api/v2/hianime/episode/sources?animeEpisodeId=" +
        encodeURIComponent(animeEpisodeId) +
        "&server=" + encodeURIComponent(server) +
        "&category=" + encodeURIComponent(category)
    );

    fetch(EpisodeSourcesUrl)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch episode sources");
            return res.json();
        })
        .then(data => {
            console.log("Sources API response:", data);
            modalContent.innerHTML = buildEpisodeSourcesHTML(data, modalContent);
        })
        .catch(err => {
            modalContent.innerHTML = `<div class="modal-loader">Error loading sources: ${err?.message || err}</div>`;
        });

    setTimeout(() => {
        const closeBtn = modal.querySelector('.anime-episode-sources-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);
}

function buildEpisodeSourcesModal() {
    let oldModal = document.getElementById('anime-episode-sources-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = "anime-episode-sources-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="anime-episode-sources-modal-content" tabindex="0"></div>
        <button class="anime-episode-sources-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-episode-sources-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });
    return modal;
}

function buildEpisodeSourcesHTML(data, modalContent) {
    if (!data || (typeof data.status !== "undefined" && data.status !== 200) || !data.data) {
        return `<div class="modal-loader">${data?.error || "No sources info found."}</div>`;
    }
    const { sources, subtitles, headers, anilistID, malID } = data.data;

    let sourcesHTML = '';
    if (Array.isArray(sources) && sources.length) {
        sourcesHTML = `
            <div>
                <h3>Streaming Sources</h3>
                <ul style="list-style:none;padding:0;">
                    ${sources.map((src, i) => {
                        // For Referer-protected sources, use the proxy
                        let hlsUrl = src.url;
                        let refererNeeded = !!headers?.Referer;
                        if (src.isM3U8 && refererNeeded) {
                            hlsUrl = getProxiedUrl(src.url, headers.Referer);
                        }
                        return `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${src.quality || "Default"}</span>
                            <span style="color:#888;font-size:12px;">${src.isM3U8 ? "HLS/M3U8" : ""}</span>
                            ${src.isM3U8
                                ? `<button class="hls-play-btn" data-url="${hlsUrl}" data-index="${i}" style="margin-left:8px;">Play</button>`
                                : `<a href="${src.url}" target="_blank" rel="noopener" style="margin-left:8px;">Play</a>`
                            }
                        </li>
                        `;
                    }).join("")}
                </ul>
                <div id="hls-player-container"></div>
            </div>
        `;
    } else {
        sourcesHTML = `<div>No streaming sources found.</div>`;
    }

    let subtitlesHTML = '';
    if (Array.isArray(subtitles) && subtitles.length) {
        subtitlesHTML = `
            <div>
                <h3>Subtitles</h3>
                <ul style="list-style:none;padding:0;">
                    ${subtitles.map(sub => `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${sub.lang}:</span>
                            <a href="${sub.url}" target="_blank" rel="noopener">Download</a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    }

    let metaHTML = '';
    if (anilistID || malID) {
        metaHTML = `<div style="margin:10px 0;">
            ${anilistID ? `<span style="margin-right:16px;">Anilist: <a href="https://anilist.co/anime/${anilistID}" target="_blank" rel="noopener">${anilistID}</a></span>` : ""}
            ${malID ? `<span>MAL: <a href="https://myanimelist.net/anime/${malID}" target="_blank" rel="noopener">${malID}</a></span>` : ""}
        </div>`;
    }

    let headersHTML = '';
    if (headers && typeof headers === "object" && Object.keys(headers).length) {
        headersHTML = `<details style="margin-top:8px;">
            <summary>Request Headers Used</summary>
            <pre style="background:#f6f6f6;font-size:12px;padding:6px;border-radius:4px;">${JSON.stringify(headers, null, 2)}</pre>
        </details>`;
    }

    // Attach HLS play logic after rendering
    setTimeout(() => {
        Array.from(modalContent.querySelectorAll('.hls-play-btn')).forEach(btn => {
            btn.onclick = function () {
                const hlsUrl = btn.getAttribute('data-url');
                const container = modalContent.querySelector('#hls-player-container');
                if (!hlsUrl || !container) return;
                showHlsPlayer(container, hlsUrl);
            };
        });
    }, 25);

    return `
        <div>
            ${metaHTML}
            ${sourcesHTML}
            ${subtitlesHTML}
            ${headersHTML}
        </div>
    `;
}

// Show HLS player using hls.js
function showHlsPlayer(container, hlsUrl) {
    container.innerHTML = '';
    ensureHlsJs((err) => {
        if (err) {
            container.innerHTML = `<div style="color:#e74c3c;">Failed to load HLS.js: ${err.message}</div>`;
            return;
        }
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.style = "width:100%;max-width:600px;background:#000;border-radius:6px;margin-top:10px;";
        container.appendChild(video);

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
            video.play().catch(e => {
                container.innerHTML += `<div style="color:#e74c3c;">Failed to start playback: ${e.message}</div>`;
            });
        } else if (window.Hls) {
            const hls = new window.Hls();
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function(event, data) {
                let msg = data.details || data.type || "Unknown error";
                container.innerHTML += `<div style="color:#e74c3c;">${msg}</div>`;
            });
        } else {
            container.innerHTML += `<div style="color:#e74c3c;">HLS playback not supported. Please use Safari or install hls.js.</div>`;
        }
    });
}