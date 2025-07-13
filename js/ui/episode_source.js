// ====================
// Episode Sources Modal & HLS Player Logic
// ====================

// Change this to your actual proxy endpoint
function getProxiedUrl(url, referer) {
    return `https://animenicarlo.vercel.app/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
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

function showAnimeEpisodeServersModal(data) {
    if (!data || (!Array.isArray(data.sub) && !Array.isArray(data.dub))) {
        alert("No server list found for this episode.");
        return;
    }

    const modal = document.createElement('div');
    modal.className = "anime-modal";
    modal.innerHTML = `
      <div class="anime-episode-servers-modal-content" tabindex="0">
        <h3>Select a Server</h3>
        <ul style="list-style:none;padding:0;">
          ${(data.sub || []).map(server => `
            <li>
              <button class="server-btn" data-server="${server.serverName}" data-category="sub" data-episodeid="${data.episodeId}" style="margin-bottom:8px;">
                SUB - ${server.serverName}
              </button>
            </li>
          `).join("")}
          ${(data.dub || []).map(server => `
            <li>
              <button class="server-btn" data-server="${server.serverName}" data-category="dub" data-episodeid="${data.episodeId}" style="margin-bottom:8px;">
                DUB - ${server.serverName}
              </button>
            </li>
          `).join("")}
        </ul>
      </div>
      <button class="anime-episode-servers-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-episode-servers-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);

    setTimeout(() => {
        const closeBtn = modal.querySelector('.anime-episode-servers-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);

    modal.querySelectorAll('.server-btn').forEach(btn => {
        btn.onclick = async function () {
            modal.remove();
            const server = btn.getAttribute('data-server');
            const category = btn.getAttribute('data-category');
            const episodeId = btn.getAttribute('data-episodeid');
            // Now fetch sources for this server
            try {
                // Example endpoint: update to your real API
                const sourcesRes = await fetch(`/api/episode-sources?episodeId=${encodeURIComponent(episodeId)}&server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`);
                if (!sourcesRes.ok) throw new Error("Failed to fetch sources for server");
                const sourcesJson = await sourcesRes.json();
                if (sourcesJson.data && sourcesJson.data.sources) {
                    showAnimeEpisodeSourcesModal(sourcesJson.data);
                } else {
                    alert("No sources found for the selected server.");
                }
            } catch (err) {
                alert("Error loading sources: " + err.message);
            }
        };
    });
}


// ===============
// Sources Modal
// ===============
export function showAnimeEpisodeSourcesModal(data) {
    if (!data || !data.sources || !Array.isArray(data.sources)) {
        alert("No sources found for this episode.");
        return;
    }

    const modal = buildEpisodeSourcesModal();
    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.anime-episode-sources-modal-content');
    modalContent.innerHTML = buildEpisodeSourcesHTML(data, modalContent);

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
    const { sources, tracks, headers, anilistID, malID } = data;

    let sourcesHTML = '';
    if (Array.isArray(sources) && sources.length) {
        sourcesHTML = `
            <div>
                <h3>Streaming Sources</h3>
                <ul style="list-style:none;padding:0;">
                    ${sources.map((src, i) => {
                        let hlsUrl = src.url;
                        let refererNeeded = !!headers?.Referer;
                        if (src.isM3U8 && refererNeeded) {
                            hlsUrl = getProxiedUrl(src.url, headers.Referer);
                        }
                        return `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${src.type?.toUpperCase() || "Default"}</span>
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

    let tracksHTML = '';
    if (Array.isArray(tracks) && tracks.length) {
        tracksHTML = `
            <div>
                <h3>Subtitles & Tracks</h3>
                <ul style="list-style:none;padding:0;">
                    ${tracks.map(track => `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${track.lang}:</span>
                            <a href="${track.url}" target="_blank" rel="noopener">Download</a>
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
            ${tracksHTML}
            ${headersHTML}
        </div>
    `;
}

// ===============
// HLS Player
// ===============
function showHlsPlayer(container, hlsUrl) {
    container.innerHTML = '<div class="modal-loader">Loading stream...</div>';
    ensureHlsJs((err) => {
        if (err) {
            container.innerHTML = `<div style="color:#e74c3c;">Failed to load HLS.js: ${err.message}</div>`;
            return;
        }
        // Validate manifest before playback
        fetch(hlsUrl)
            .then(res => {
                if (!res.ok) throw new Error("Stream manifest could not be loaded (check proxy and source)");
                return res.text();
            })
            .then(text => {
                if (!text.startsWith("#EXTM3U")) {
                    throw new Error("Invalid HLS manifest received (proxy or source issue)");
                }
                container.innerHTML = '';
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
            })
            .catch(err => {
                container.innerHTML = `<div style="color:#e74c3c;">${err.message}</div>`;
            });
    });
}