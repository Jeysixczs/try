// Usage: showM3U8PlayerModal(m3u8Url, refererRequired = false)
// Requires: hls.js (add via <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script> in your HTML)

export function showM3U8PlayerModal(m3u8Url, refererRequired = false) {
    // Remove old modal
    let oldModal = document.getElementById('m3u8-player-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = "m3u8-player-modal";
    modal.className = "anime-modal";
    modal.innerHTML = `
        <div class="m3u8-player-modal-content" tabindex="0" style="background:#222;border-radius:8px;padding:16px;">
            <h2 style="color:#fff;">HLS (.m3u8) Player</h2>
            <video id="m3u8-player-el" controls autoplay style="width:100%;max-width:600px;background:#000;border-radius:6px;"></video>
            <div id="m3u8-player-error" style="color:#e74c3c;margin-top:12px;"></div>
            <button class="m3u8-player-modal-close" aria-label="Close" style="margin-top:14px;">&times;</button>
        </div>
    `;
    modal.querySelector('.m3u8-player-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === "Escape") {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });

    document.body.appendChild(modal);

    // Error text element
    const errorEl = modal.querySelector('#m3u8-player-error');

    // If Referer is required, show warning
    if (refererRequired) {
        errorEl.textContent = "This stream requires a Referer header and cannot be played directly in browser. Use a proxy or open in VLC/MPV with Referer set.";
        return;
    }

    const video = modal.querySelector('#m3u8-player-el');
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = m3u8Url;
        video.play().catch(e => {
            errorEl.textContent = "Failed to start playback: " + e.message;
        });
    } else if (window.Hls) {
        // Use hls.js for Chrome/Firefox/Edge
        const hls = new Hls();
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function(event, data) {
            errorEl.textContent = "Playback error: " + (data.details || data.type || "Unknown error");
        });
    } else {
        errorEl.textContent = "HLS playback not supported. Please use Safari or install hls.js.";
    }
}