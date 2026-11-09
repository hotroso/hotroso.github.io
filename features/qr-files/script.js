// QR Files: nhận file được truyền qua chuỗi mã QR bằng camera
(function () {
    function esc(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    Tools.register('qr-files', {
        init(root) {
            const received = {};
            let total = null;
            let filename = 'received_file.bin';
            let isScanning = false;
            let currentCameraIndex = 0;
            let destroyed = false;
            let objectUrl = null;
            let fileListPage = 1;

            const $ = (sel) => root.querySelector(sel);
            const statusEl = $('#qr-files-status');
            const logEl = $('#qr-files-log');
            const receivedCountEl = $('#qr-files-received');
            const totalCountEl = $('#qr-files-total');
            const progressPercentEl = $('#qr-files-progress');
            const progressBarEl = $('.qr-progress-bar');
            const progressFillEl = $('#qr-files-fill');
            const switchCameraBtn = $('#qr-files-switch');
            const downloadFileBtn = $('#qr-files-download');
            const missingBlocksEl = $('#qr-files-missing');
            const missingBlocksListEl = $('#qr-files-missing-list');
            const fileListEl = $('#qr-files-list');
            const fileListWrap = $('#qr-files-list-wrap');
            const fileListPg = $('#qr-files-list-pg');

            const setStatus = (text) => { statusEl.textContent = text; };

            const log = (msg, type = 'info') => {
                const entry = document.createElement('div');
                entry.className = `qr-log-entry qr-log-${type}`;
                entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
                logEl.appendChild(entry);
                if (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
                logEl.scrollTop = logEl.scrollHeight;
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
                if (missing.length === 0) return '';
                const tag = (text) => `<span class="qr-block-range">${text}</span>`;
                if (missing.length <= 10) return missing.map(tag).join(' ');
                const ranges = [];
                let start = missing[0];
                let end = missing[0];
                for (let i = 1; i < missing.length; i++) {
                    if (missing[i] === end + 1) {
                        end = missing[i];
                    } else {
                        ranges.push(tag(start === end ? start : `${start}-${end}`));
                        start = end = missing[i];
                    }
                }
                ranges.push(tag(start === end ? start : `${start}-${end}`));
                return ranges.join(' ');
            };

            const setDownload = (blob) => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                objectUrl = URL.createObjectURL(blob);
                downloadFileBtn.href = objectUrl;
                downloadFileBtn.download = filename;
                downloadFileBtn.classList.remove('hidden');
            };

            const processCompleteFile = async () => {
                try {
                    log('🔄 Đang xử lý file...', 'info');
                    setStatus('🔄 Đang xử lý...');

                    const base64data = Array.from({ length: total }, (_, i) => received[i]).join('');
                    const compressed = Uint8Array.from(atob(base64data), c => c.charCodeAt(0));
                    const raw = pako.inflate(compressed);

                    if (filename.toLowerCase().endsWith('.zip')) {
                        await new JSZip().loadAsync(raw); // kiểm tra file ZIP hợp lệ
                        setDownload(new Blob([raw], { type: 'application/zip' }));
                        setStatus('✅ File ZIP sẵn sàng!');
                        log('🎉 Hoàn thành! File ZIP đã sẵn sàng.', 'success');
                    } else {
                        setDownload(new Blob([raw], { type: 'application/octet-stream' }));
                        setStatus('✅ File sẵn sàng!');
                        log('🎉 Hoàn thành! File đã sẵn sàng tải.', 'success');
                    }
                    UI.toast('Đã nhận đủ file');

                    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) uploadToServer(raw, filename);
                } catch (error) {
                    log(`❌ Lỗi: ${error.message}`, 'error');
                    setStatus(`❌ Lỗi: ${error.message}`);
                }
            };

            const uploadToServer = async (raw, fname) => {
                try {
                    log('☁️ Đang gửi lên server...', 'info');
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 30000);
                    const res = await Auth.authFetch('/qr-files/upload', {
                        method: 'POST',
                        headers: {
                            'X-Filename': encodeURIComponent(fname),
                            'X-Filesize': raw.length,
                            'Content-Type': 'application/octet-stream'
                        },
                        signal: ctrl.signal,
                        body: raw
                    });
                    clearTimeout(timer);
                    if (res.ok) {
                        log(`✅ Đã lưu lên server: ${fname}`, 'success');
                        loadFileList(1);
                    } else {
                        log('⚠️ Gửi server thất bại', 'warning');
                    }
                } catch (e) {
                    log('⚠️ Không thể gửi lên server', 'warning');
                }
            };

            const updateProgress = () => {
                const receivedCount = Object.keys(received).length;
                const percent = total ? Math.round((receivedCount / total) * 100) : 0;
                receivedCountEl.textContent = receivedCount;
                totalCountEl.textContent = total || '?';
                progressPercentEl.textContent = percent + '%';
                progressFillEl.style.width = percent + '%';
                progressBarEl.setAttribute('aria-valuenow', String(percent));

                if (total && receivedCount < total) {
                    missingBlocksListEl.innerHTML = formatMissingBlocks(getMissingBlocks());
                    missingBlocksEl.classList.remove('hidden');
                } else {
                    missingBlocksEl.classList.add('hidden');
                }
            };

            function onScanSuccess(decodedText) {
                if (!decodedText.includes(':')) return;
                const parts = decodedText.split(':');
                if (parts.length < 3) return;

                let header, chunk, fname;
                if (parts.length === 4) {
                    [header, fname, , chunk] = parts;
                    if (fname && fname.trim() !== '') {
                        filename = fname;
                        downloadFileBtn.download = filename;
                    }
                } else {
                    [header, , chunk] = parts;
                }

                if (!header.includes('/')) return;
                const headerParts = header.split('/');
                if (headerParts.length !== 2) return;

                const index = parseInt(headerParts[0], 10);
                const t = parseInt(headerParts[1], 10);
                if (isNaN(index) || isNaN(t)) return;
                if (received[index]) return;

                received[index] = chunk;
                total = t;

                log(`📦 Block ${index + 1}/${total} ✓`, 'success');
                updateProgress();

                const receivedCount = Object.keys(received).length;
                const missing = getMissingBlocks();
                setStatus(missing.length > 0
                    ? `📊 ${receivedCount}/${total} - Thiếu ${missing.length}`
                    : `✅ Đủ ${total} blocks!`);

                if (receivedCount === total) processCompleteFile();
            }

            // ── Camera ───────────────────────────────────────────────────
            const scanner = new Html5Qrcode('qr-files-reader');

            const stopScanner = () => {
                if (!isScanning) return Promise.resolve();
                isScanning = false;
                return scanner.stop().catch(() => {});
            };

            const initCamera = (useBackCamera) => {
                if (destroyed) return;
                const config = { fps: 30, qrbox: { width: 250, height: 250 } };
                const cameraConfig = { facingMode: useBackCamera ? 'environment' : 'user' };

                scanner.start(cameraConfig, config, onScanSuccess, () => {})
                    .then(() => {
                        isScanning = true;
                        currentCameraIndex = useBackCamera ? 0 : 1;
                        // Người dùng đã rời công cụ trong lúc camera đang bật -> tắt ngay
                        if (destroyed) {
                            stopScanner();
                            return;
                        }
                        setStatus('🔍 Sẵn sàng quét');
                        log('✅ Camera sẵn sàng', 'success');
                    })
                    .catch(err => {
                        if (destroyed) return;
                        setStatus('🚫 Không mở được camera. Hãy cho phép trình duyệt truy cập camera.');
                        log(`❌ Lỗi: ${err}`, 'error');
                        isScanning = false;
                    });
            };

            const startCamera = (useBackCamera = true) => {
                stopScanner().then(() => initCamera(useBackCamera));
            };

            switchCameraBtn.addEventListener('click', () => {
                if (isScanning) startCamera(currentCameraIndex === 1);
            });

            const onBeforeUnload = () => { stopScanner(); };
            window.addEventListener('beforeunload', onBeforeUnload);

            startCamera(true);

            // ── Danh sách file đã upload ─────────────────────────────────
            async function loadFileList(page) {
                if (destroyed || typeof Auth === 'undefined' || !Auth.isLoggedIn()) return;
                fileListPage = page;
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 5000);
                    const res = await Auth.authFetch('/qr-files/list?page=' + page, { signal: ctrl.signal });
                    clearTimeout(timer);
                    const json = await res.json();
                    if (destroyed) return;
                    renderFileList(json);
                    fileListEl.hidden = false;
                } catch (e) {
                    console.warn('Load file list failed', e);
                }
            }

            function renderFileList(json) {
                if (!json.data || json.data.length === 0) {
                    fileListWrap.innerHTML = '<p class="text-muted">Chưa có file nào.</p>';
                    fileListPg.innerHTML = '';
                    return;
                }
                fileListWrap.innerHTML = `<div class="table-wrap"><table class="scan-table">
                    <thead><tr><th>#</th><th>Tên file</th><th>Kích thước</th><th>Thời gian</th></tr></thead>
                    <tbody>${json.data.map((r, i) => `<tr>
                        <td>${(fileListPage - 1) * json.per_page + i + 1}</td>
                        <td>${esc(r.filename)}</td>
                        <td>${formatSize(r.filesize)}</td>
                        <td>${esc(r.created_at)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;
                if (json.total_pages <= 1) {
                    fileListPg.innerHTML = '';
                    return;
                }
                let btns = '';
                for (let p = 1; p <= json.total_pages; p++) {
                    btns += `<button type="button" class="pg-btn${p === fileListPage ? ' active' : ''}" data-page="${p}"${p === fileListPage ? ' aria-current="page"' : ''}>${p}</button>`;
                }
                fileListPg.innerHTML = btns;
            }

            fileListPg.addEventListener('click', (e) => {
                const btn = e.target.closest('.pg-btn');
                if (btn) loadFileList(+btn.dataset.page);
            });

            const onLogin = () => loadFileList(1);
            const onLogout = () => { fileListEl.hidden = true; };
            document.addEventListener('auth:login', onLogin);
            document.addEventListener('auth:logout', onLogout);
            if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) loadFileList(1);

            // Dọn dẹp khi rời công cụ: tắt camera, gỡ listener, giải phóng URL tạm
            return () => {
                destroyed = true;
                stopScanner();
                window.removeEventListener('beforeunload', onBeforeUnload);
                document.removeEventListener('auth:login', onLogin);
                document.removeEventListener('auth:logout', onLogout);
                if (objectUrl) {
                    // Đợi một chút để lượt tải đang diễn ra (nếu có) không bị hủy
                    const url = objectUrl;
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                }
            };
        }
    });
})();
