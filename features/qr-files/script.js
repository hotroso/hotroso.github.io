// QR Files feature script
(function() {
const received = {};
let total = null;
let filename = "received_file.bin";
let qrScanner = null;
let isScanning = false;
let currentCameraIndex = 0;

const statusEl = document.getElementById("qr-files-status");
const logEl = document.getElementById("qr-files-log");
const receivedCountEl = document.getElementById("qr-files-received");
const totalCountEl = document.getElementById("qr-files-total");
const progressPercentEl = document.getElementById("qr-files-progress");
const progressFillEl = document.getElementById("qr-files-fill");
const switchCameraBtn = document.getElementById("qr-files-switch");
const downloadFileBtn = document.getElementById("qr-files-download");
const missingBlocksEl = document.getElementById("qr-files-missing");
const missingBlocksListEl = document.getElementById("qr-files-missing-list");

const log = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `qr-log-entry qr-log-${type}`;
    logEntry.innerHTML = `[${timestamp}] ${msg}`;
    logEl.appendChild(logEntry);
    logEl.scrollTop = logEl.scrollHeight;
    if (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
};

const getMissingBlocks = () => {
    if (!total) return [];
    const missing = [];
    for (let i = 0; i < total; i++) {
        if (!received[i]) missing.push(i + 1);
    }
    return missing;
};

const formatMissingBlocks = (missing) => {
    if (missing.length === 0) return "";
    if (missing.length <= 10) {
        return missing.map(n => `<span class="qr-block-range">${n}</span>`).join(' ');
    }
    const ranges = [];
    let start = missing[0], end = missing[0];
    for (let i = 1; i < missing.length; i++) {
        if (missing[i] === end + 1) {
            end = missing[i];
        } else {
            ranges.push(start === end ? `<span class="qr-block-range">${start}</span>` : `<span class="qr-block-range">${start}-${end}</span>`);
            start = end = missing[i];
        }
    }
    ranges.push(start === end ? `<span class="qr-block-range">${start}</span>` : `<span class="qr-block-range">${start}-${end}</span>`);
    return ranges.join(' ');
};

const processCompleteFile = async () => {
    try {
        log("🔄 Đang xử lý file...", 'info');
        statusEl.innerHTML = "🔄 Đang xử lý...";

        const base64data = Array.from({length: total}, (_, i) => received[i]).join('');
        const compressed = Uint8Array.from(atob(base64data), c => c.charCodeAt(0));
        const raw = pako.inflate(compressed);

        if (filename.toLowerCase().endsWith('.zip')) {
            const zip = new JSZip();
            await zip.loadAsync(raw);
            const blob = new Blob([raw], {type: "application/zip"});
            const url = URL.createObjectURL(blob);
            downloadFileBtn.href = url;
            downloadFileBtn.download = filename;
            downloadFileBtn.classList.remove('hidden');
            statusEl.innerHTML = "✅ File ZIP sẵn sàng!";
            log("🎉 Hoàn thành! File ZIP đã sẵn sàng.", 'success');
        } else {
            const blob = new Blob([raw], {type: "application/octet-stream"});
            const url = URL.createObjectURL(blob);
            downloadFileBtn.href = url;
            downloadFileBtn.download = filename;
            downloadFileBtn.classList.remove('hidden');
            statusEl.innerHTML = "✅ File sẵn sàng!";
            log("🎉 Hoàn thành! File đã sẵn sàng tải.", 'success');
        }

        // Upload lên server nếu đã login
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            uploadToServer(raw, filename);
        }
    } catch (error) {
        log(`❌ Lỗi: ${error.message}`, 'error');
        statusEl.innerHTML = `❌ Lỗi: ${error.message}`;
    }
};

const uploadToServer = async (raw, fname) => {
    try {
        log("☁️ Đang gửi lên server...", 'info');
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        const res   = await Auth.authFetch('/qr-files/upload', {
            method:  'POST',
            headers: { 'X-Filename': encodeURIComponent(fname), 'X-Filesize': raw.length, 'Content-Type': 'application/octet-stream' },
            signal:  ctrl.signal,
            body:    raw
        });
        clearTimeout(timer);
        if (res.ok) {
            log(`✅ Đã lưu lên server: ${fname}`, 'success');
            loadFileList(1);
        } else {
            log('⚠️ Gửi server thất bại', 'warning');
        }
    } catch (e) { log('⚠️ Không thể gửi lên server', 'warning'); }
};

const updateProgress = () => {
    const receivedCount = Object.keys(received).length;
    const progressPercent = total ? Math.round((receivedCount / total) * 100) : 0;
    receivedCountEl.textContent = receivedCount;
    totalCountEl.textContent = total || '?';
    progressPercentEl.textContent = progressPercent + '%';
    progressFillEl.style.width = progressPercent + '%';

    if (total && receivedCount < total) {
        const missing = getMissingBlocks();
        missingBlocksListEl.innerHTML = formatMissingBlocks(missing);
        missingBlocksEl.classList.remove('hidden');
    } else {
        missingBlocksEl.classList.add('hidden');
    }
};

function onScanSuccess(decodedText) {
    if (!decodedText.includes(":")) return;
    const parts = decodedText.split(":");
    if (parts.length < 3) return;

    let header, chunk, fname;
    if (parts.length === 4) {
        [header, fname, , chunk] = parts;
        if (fname && fname.trim() !== "") {
            filename = fname;
            downloadFileBtn.download = filename;
        }
    } else {
        [header, , chunk] = parts;
    }

    if (!header.includes("/")) return;
    const headerParts = header.split("/");
    if (headerParts.length !== 2) return;

    const index = parseInt(headerParts[0]);
    const t = parseInt(headerParts[1]);
    if (isNaN(index) || isNaN(t)) return;
    if (received[index]) return;

    received[index] = chunk;
    total = t;

    log(`📦 Block ${index + 1}/${total} ✓`, 'success');
    updateProgress();

    const receivedCount = Object.keys(received).length;
    const missing = getMissingBlocks();

    if (missing.length > 0) {
        statusEl.innerHTML = `📊 ${receivedCount}/${total} - Thiếu ${missing.length}`;
    } else {
        statusEl.innerHTML = `✅ Đủ ${total} blocks!`;
    }

    if (receivedCount === total) {
        processCompleteFile();
    }
}

const qrCodeScanner = new Html5Qrcode("qr-files-reader");
qrScanner = qrCodeScanner;

const startCamera = (useBackCamera = true) => {
    if (qrScanner && isScanning) {
        qrScanner.stop().then(() => initCamera(useBackCamera)).catch(() => initCamera(useBackCamera));
    } else {
        initCamera(useBackCamera);
    }
};

const initCamera = (useBackCamera) => {
    const config = {fps: 30, qrbox: {width: 250, height: 250}};
    const cameraConfig = {facingMode: useBackCamera ? "environment" : "user"};

    qrCodeScanner.start(cameraConfig, config, onScanSuccess, () => {})
        .then(() => {
            statusEl.innerHTML = "🔍 Sẵn sàng quét";
            log("✅ Camera sẵn sàng", 'success');
            isScanning = true;
            currentCameraIndex = useBackCamera ? 0 : 1;
        })
        .catch(err => {
            statusEl.innerHTML = "🚫 Lỗi camera";
            log(`❌ Lỗi: ${err}`, 'error');
            isScanning = false;
        });
};

switchCameraBtn.addEventListener('click', () => {
    if (isScanning) startCamera(currentCameraIndex === 1);
});

startCamera(true);

window.addEventListener('beforeunload', () => {
    if (qrScanner && isScanning) qrScanner.stop();
});

// ── Danh sách file đã upload ──────────────────────────────────────────────
let fileListPage = 1;

const fileListEl = document.getElementById('qr-files-list');

if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) loadFileList(1);
document.addEventListener('auth:login',  () => loadFileList(1));
document.addEventListener('auth:logout', () => { fileListEl.style.display = 'none'; });

async function loadFileList(page) {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) return;
    fileListPage = page;
    try {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res   = await Auth.authFetch('/qr-files/list?page=' + page, { signal: ctrl.signal });
        clearTimeout(timer);
        const json  = await res.json();
        renderFileList(json);
        fileListEl.style.display = 'block';
    } catch (e) {
        console.warn('Load file list failed', e);
    }
}

function renderFileList(json) {
    const wrap = document.getElementById('qr-files-list-wrap');
    const pg   = document.getElementById('qr-files-list-pg');
    if (!json.data || json.data.length === 0) {
        wrap.innerHTML = '<p style="color:#888;font-size:13px">Chưa có file nào.</p>';
        pg.innerHTML = ''; return;
    }
    wrap.innerHTML = `<table class="scan-table">
        <thead><tr><th>#</th><th>Tên file</th><th>Kích thước</th><th>Thời gian</th></tr></thead>
        <tbody>${json.data.map((r, i) => `<tr>
            <td>${(fileListPage - 1) * json.per_page + i + 1}</td>
            <td>${esc(r.filename)}</td>
            <td>${formatSize(r.filesize)}</td>
            <td>${esc(r.created_at)}</td>
        </tr>`).join('')}</tbody>
    </table>`;
    if (json.total_pages <= 1) { pg.innerHTML = ''; return; }
    let btns = '';
    for (let p = 1; p <= json.total_pages; p++) {
        btns += `<button class="pg-btn${p === fileListPage ? ' active' : ''}" data-page="${p}">${p}</button>`;
    }
    pg.innerHTML = btns;
    pg.querySelectorAll('.pg-btn').forEach(btn => {
        btn.addEventListener('click', () => loadFileList(+btn.dataset.page));
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
})();
