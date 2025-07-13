// Proxy endpoint
function getProxiedUrl(url, referer) {
    return `https://animenicarlo.vercel.app/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}

// Dynamically load hls.js if not present
function ensureHlsJs(callback) {
    if (window.Hls) return callback();
    var script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = function () { callback(); };
    script.onerror = function () { callback(new Error("Failed to load hls.js")); };
    document.head.appendChild(script);
}

// Server Selection Modal
function showAnimeEpisodeServersModal(data) {
    if (!data || (!Array.isArray(data.sub) && !Array.isArray(data.dub))) {
        alert("No server list found for this episode.");
        return;
    }

    var modal = document.createElement('div');
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
    modal.querySelector('.anime-episode-servers-modal-close').onclick = function () { modal.remove(); };
    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);

    setTimeout(function () {
        var closeBtn = modal.querySelector('.anime-episode-servers-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);

    var btns = modal.querySelectorAll('.server-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].onclick = async function () {
            modal.remove();
            var server = this.getAttribute('data-server');
            var category = this.getAttribute('data-category');
            var episodeId = this.getAttribute('data-episodeid');
            try {
                var sourcesRes = await fetch(`/api/episode-sources?episodeId=${encodeURIComponent(episodeId)}&server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`);
                if (!sourcesRes.ok) throw new Error("Failed to fetch sources for server");
                var sourcesJson = await sourcesRes.json();
                if (sourcesJson.data && sourcesJson.data.sources) {
                    showAnimeEpisodeSourcesModal(sourcesJson.data);
                } else {
                    alert("No sources found for the selected server.");
                }
            } catch (err) {
                alert("Error loading sources: " + err.message);
            }
        };
    }
}

// Sources Modal
function showAnimeEpisodeSourcesModal(data) {
    if (!data || !data.sources || !Array.isArray(data.sources)) {
        alert("No sources found for this episode.");
        return;
    }

    var modal = buildEpisodeSourcesModal();
    document.body.appendChild(modal);
    var modalContent = modal.querySelector('.anime-episode-sources-modal-content');
    modalContent.innerHTML = buildEpisodeSourcesHTML(data, modalContent);

    setTimeout(function () {
        var closeBtn = modal.querySelector('.anime-episode-sources-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 150);
}

function buildEpisodeSourcesModal() {
    var oldModal = document.getElementById('anime-episode-sources-modal');
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = "anime-episode-sources-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="anime-episode-sources-modal-content" tabindex="0"></div>
        <button class="anime-episode-sources-modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.anime-episode-sources-modal-close').onclick = function () { modal.remove(); };
    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });
    return modal;
}

function buildEpisodeSourcesHTML(data, modalContent) {
    var sources = data.sources, tracks = data.tracks, headers = data.headers, anilistID = data.anilistID, malID = data.malID;

    var sourcesHTML = '';
    if (Array.isArray(sources) && sources.length) {
        sourcesHTML = `
            <div>
                <h3>Streaming Sources</h3>
                <ul style="list-style:none;padding:0;">
                    ${sources.map(function (src, i) {
                        var hlsUrl = src.url;
                        var refererNeeded = !!(headers && headers.Referer);
                        if (src.isM3U8 && refererNeeded) {
                            hlsUrl = getProxiedUrl(src.url, headers.Referer);
                        }
                        return `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${src.type ? src.type.toUpperCase() : "Default"}</span>
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

    var tracksHTML = '';
    if (Array.isArray(tracks) && tracks.length) {
        tracksHTML = `
            <div>
                <h3>Subtitles & Tracks</h3>
                <ul style="list-style:none;padding:0;">
                    ${tracks.map(function (track) {
                        return `
                        <li style="margin-bottom:8px;">
                            <span style="font-weight:bold;">${track.lang}:</span>
                            <a href="${track.url}" target="_blank" rel="noopener">Download</a>
                        </li>
                    `;
                    }).join("")}
                </ul>
            </div>
        `;
    }

    var metaHTML = '';
    if (anilistID || malID) {
        metaHTML = `<div style="margin:10px 0;">
            ${anilistID ? `<span style="margin-right:16px;">Anilist: <a href="https://anilist.co/anime/${anilistID}" target="_blank" rel="noopener">${anilistID}</a></span>` : ""}
            ${malID ? `<span>MAL: <a href="https://myanimelist.net/anime/${malID}" target="_blank" rel="noopener">${malID}</a></span>` : ""}
        </div>`;
    }

    var headersHTML = '';
    if (headers && typeof headers === "object" && Object.keys(headers).length) {
        headersHTML = `<details style="margin-top:8px;">
            <summary>Request Headers Used</summary>
            <pre style="background:#f6f6f6;font-size:12px;padding:6px;border-radius:4px;">${JSON.stringify(headers, null, 2)}</pre>
        </details>`;
    }

    setTimeout(function () {
        var btns = modalContent.querySelectorAll('.hls-play-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function () {
                var hlsUrl = this.getAttribute('data-url');
                var container = modalContent.querySelector('#hls-player-container');
                if (!hlsUrl || !container) return;
                showHlsPlayer(container, hlsUrl);
            };
        }
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

// HLS Player
function showHlsPlayer(container, hlsUrl) {
    container.innerHTML = '<div class="modal-loader">Loading stream...</div>';
    ensureHlsJs(function (err) {
        if (err) {
            container.innerHTML = `<div style="color:#e74c3c;">Failed to load HLS.js: ${err.message}</div>`;
            return;
        }
        fetch(hlsUrl)
            .then(function (res) {
                if (!res.ok) throw new Error("Stream manifest could not be loaded (check proxy and source)");
                return res.text();
            })
            .then(function (text) {
                if (!text.startsWith("#EXTM3U")) {
                    throw new Error("Invalid HLS manifest received (proxy or source issue)");
                }
                container.innerHTML = '';
                var video = document.createElement('video');
                video.controls = true;
                video.autoplay = true;
                video.style = "width:100%;max-width:600px;background:#000;border-radius:6px;margin-top:10px;";
                container.appendChild(video);

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = hlsUrl;
                    video.play().catch(function (e) {
                        container.innerHTML += `<div style="color:#e74c3c;">Failed to start playback: ${e.message}</div>`;
                    });
                } else if (window.Hls) {
                    var hls = new window.Hls();
                    hls.loadSource(hlsUrl);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.ERROR, function(event, data) {
                        var msg = data.details || data.type || "Unknown error";
                        container.innerHTML += `<div style="color:#e74c3c;">${msg}</div>`;
                    });
                } else {
                    container.innerHTML += `<div style="color:#e74c3c;">HLS playback not supported. Please use Safari or install hls.js.</div>`;
                }
            })
            .catch(function (err) {
                container.innerHTML = `<div style="color:#e74c3c;">${err.message}</div>`;
            });
    });
}

// Attach functions to window for global access
window.showAnimeEpisodeServersModal = showAnimeEpisodeServersModal;
window.showAnimeEpisodeSourcesModal = showAnimeEpisodeSourcesModal;