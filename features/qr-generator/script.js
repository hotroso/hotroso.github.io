// QR Generator
(function () {
    const CLIENT_KEY = 'qr_client_id';
    // Dung lượng thực tế phụ thuộc mức EC. Với M khoảng 1.2–1.5KB byte mode vẫn ổn.
    // Cảnh báo sớm để người dùng biết QR sẽ dày và khó quét.
    const MAX_RECOMMENDED = 900;

    function getClientId() {
        let id = localStorage.getItem(CLIENT_KEY);
        if (!id) {
            id = 'cid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(CLIENT_KEY, id);
        }
        return id;
    }

    function esc(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** Ước lượng byte giống thư viện qrcode.js (encodeURI + BOM nếu có multi-byte) */
    function estimateBytes(text) {
        // Giống logic s() trong qrcode.min.js
        const encoded = encodeURI(text).toString().replace(/%[0-9a-fA-F]{2}/g, 'a');
        return encoded.length + (encoded.length !== text.length ? 3 : 0);
    }

    /** Map mức EC sang hằng số của thư viện */
    function toCorrectLevel(level) {
        const map = {
            L: QRCode.CorrectLevel.L,
            M: QRCode.CorrectLevel.M,
            Q: QRCode.CorrectLevel.Q,
            H: QRCode.CorrectLevel.H
        };
        return map[level] ?? QRCode.CorrectLevel.M;
    }

    Tools.register('qr-generator', {
        init(root) {
            const input = root.querySelector('#qr-content');
            const form = root.querySelector('#qr-generation-form');
            const countEl = root.querySelector('#countchars');
            const byteEl = root.querySelector('#byte-estimate');
            const errorEl = root.querySelector('#qr-error');
            const qrBox = root.querySelector('#qr-code');
            const downloadBtn = root.querySelector('#qr-download');
            const ecSelect = root.querySelector('#qr-ec-level');
            const scanList = root.querySelector('#qr-scan-list');
            const tableWrap = root.querySelector('#scan-table-wrap');
            const pagination = root.querySelector('#scan-pagination');
            let currentPage = 1;
            let active = true;
            let lastQrInstance = null;

            const setError = (msg) => {
                errorEl.textContent = msg || '';
                errorEl.hidden = !msg;
                input.setAttribute('aria-invalid', msg ? 'true' : 'false');
            };

            const updateCount = () => {
                const text = input.value;
                countEl.textContent = text.length.toLocaleString('en-US');
                if (byteEl) {
                    const bytes = estimateBytes(text);
                    byteEl.textContent = '~' + bytes.toLocaleString('en-US') + ' byte';
                }
            };

            /**
             * Tạo QR với mức EC chỉ định.
             * Trả về true nếu thành công.
             * Ném lỗi nếu thư viện báo quá dài / overflow.
             */
            function tryRender(text, level) {
                // Xóa hoàn toàn nội dung cũ + instance cũ
                if (lastQrInstance && typeof lastQrInstance.clear === 'function') {
                    try { lastQrInstance.clear(); } catch (_) { /* ignore */ }
                }
                qrBox.innerHTML = '';
                lastQrInstance = null;

                lastQrInstance = new QRCode(qrBox, {
                    text,
                    width: 400,
                    height: 400,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: toCorrectLevel(level)
                });
                qrBox.hidden = false;
                downloadBtn.hidden = false;
                return true;
            }

            /**
             * Thử mức EC được chọn trước.
             * Nếu thất bại vì "quá dài", tự hạ dần mức EC (H→Q→M→L)
             * để vẫn tạo được QR thay vì báo lỗi ngay với text ngắn.
             */
            function renderWithFallback(text, preferredLevel) {
                const order = ['H', 'Q', 'M', 'L'];
                // Bắt đầu từ mức người dùng chọn, rồi hạ dần
                const startIdx = order.indexOf(preferredLevel);
                const tryOrder = startIdx >= 0
                    ? order.slice(startIdx)
                    : ['M', 'L'];

                let lastError = null;
                for (const level of tryOrder) {
                    try {
                        tryRender(text, level);
                        // Nếu phải hạ mức so với lựa chọn ban đầu → thông báo nhẹ
                        if (level !== preferredLevel) {
                            setError(`Content is a bit long for level ${preferredLevel}; switched to ${level} so the QR could be generated.`);
                        }
                        return level;
                    } catch (e) {
                        lastError = e;
                        // Chỉ retry nếu là lỗi dung lượng
                        const msg = (e && e.message) ? String(e.message) : '';
                        const isCapacity =
                            /too long data|code length overflow|data length/i.test(msg) ||
                            /quá dài|overflow/i.test(msg);
                        if (!isCapacity) {
                            // Lỗi khác (lib chưa load, DOM, …) → dừng ngay
                            throw e;
                        }
                        // tiếp tục thử mức thấp hơn
                    }
                }
                // Hết mức vẫn không được
                throw lastError || new Error('Too long data');
            }

            function generate() {
                setError('');
                const text = input.value.trim();
                if (!text) {
                    setError('Please enter some content.');
                    input.focus();
                    return;
                }

                if (typeof QRCode === 'undefined') {
                    setError('QR library is not ready yet. Please reload the page.');
                    return;
                }

                const preferred = (ecSelect && ecSelect.value) || 'M';
                const bytes = estimateBytes(text);

                // Cảnh báo sớm (không chặn hoàn toàn)
                if (text.length > MAX_RECOMMENDED || bytes > 1200) {
                    const ok = confirm(
                        `Content is quite long (~${bytes} bytes). The QR will be dense and may be hard to scan on some devices.\n\nContinue anyway?`
                    );
                    if (!ok) return;
                }

                try {
                    renderWithFallback(text, preferred);
                } catch (e) {
                    qrBox.hidden = true;
                    downloadBtn.hidden = true;
                    const msg = (e && e.message) ? String(e.message) : '';
                    if (/too long data|code length overflow/i.test(msg)) {
                        setError('Content is too long for a QR code (even at the lowest error level). Please shorten it and try again.');
                    } else {
                        console.warn('QR generate error:', e);
                        setError('Could not generate QR code. Try again or shorten the content.');
                    }
                    return;
                }

                if (Auth.isLoggedIn()) sendToServer(text).then(() => loadScanList(1));
            }

            function download() {
                const canvas = qrBox.querySelector('canvas');
                const img = qrBox.querySelector('img');
                const url = canvas ? canvas.toDataURL('image/png') : (img && img.src);
                if (!url) return;
                const a = document.createElement('a');
                a.href = url;
                a.download = 'qr-code.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }

            async function sendToServer(qrContent) {
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 5000);
                    await Auth.authFetch('/qr/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: ctrl.signal,
                        body: JSON.stringify({
                            client_id: getClientId(),
                            qr_content: qrContent,
                            user_agent: navigator.userAgent,
                            referer: document.referrer,
                            language: navigator.language,
                            screen: screen.width + 'x' + screen.height,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        })
                    });
                    clearTimeout(timer);
                } catch (e) {
                    console.warn('Save failed', e);
                }
            }

            async function loadScanList(page) {
                if (!active || !Auth.isLoggedIn()) return;
                currentPage = page;
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 5000);
                    const res = await Auth.authFetch('/qr/list?page=' + page, { signal: ctrl.signal });
                    clearTimeout(timer);
                    const json = await res.json();
                    if (!active) return;
                    renderTable(json);
                } catch (e) {
                    console.warn('Load list failed', e);
                    if (!active) return;
                    tableWrap.innerHTML = '<p class="text-danger">Could not load the list.</p>';
                    pagination.innerHTML = '';
                }
                scanList.hidden = false;
            }

            function renderTable(json) {
                if (!json.data || json.data.length === 0) {
                    tableWrap.innerHTML = '<p class="text-muted">No data yet.</p>';
                    pagination.innerHTML = '';
                    return;
                }
                tableWrap.innerHTML = `<div class="table-wrap"><table class="scan-table">
                    <thead><tr><th>#</th><th>QR content</th><th>Time</th></tr></thead>
                    <tbody>${json.data.map((r, i) => `<tr>
                        <td>${(currentPage - 1) * json.per_page + i + 1}</td>
                        <td class="qr-content-cell" title="${esc(r.qr_content)}">${esc(r.qr_content.length > 60 ? r.qr_content.slice(0, 60) + '…' : r.qr_content)}</td>
                        <td>${esc(r.created_at)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;

                if (json.total_pages <= 1) {
                    pagination.innerHTML = '';
                    return;
                }
                let btns = '';
                for (let p = 1; p <= json.total_pages; p++) {
                    btns += `<button type="button" class="pg-btn${p === currentPage ? ' active' : ''}" data-page="${p}"${p === currentPage ? ' aria-current="page"' : ''}>${p}</button>`;
                }
                pagination.innerHTML = btns;
            }

            // Sự kiện
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                generate();
            });
            input.addEventListener('input', () => {
                setError('');
                updateCount();
            });
            input.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    generate();
                }
            });
            if (ecSelect) {
                ecSelect.addEventListener('change', () => {
                    // Nếu đã có QR, tạo lại với mức mới
                    if (!qrBox.hidden && input.value.trim()) {
                        generate();
                    }
                });
            }
            downloadBtn.addEventListener('click', download);
            root.querySelector('#qr-example').addEventListener('click', () => {
                input.value = 'https://hotroso.github.io';
                updateCount();
                generate();
            });
            root.querySelector('#qr-clear').addEventListener('click', () => {
                input.value = '';
                updateCount();
                setError('');
                if (lastQrInstance && typeof lastQrInstance.clear === 'function') {
                    try { lastQrInstance.clear(); } catch (_) {}
                }
                lastQrInstance = null;
                qrBox.innerHTML = '';
                qrBox.hidden = true;
                downloadBtn.hidden = true;
                input.focus();
            });
            pagination.addEventListener('click', (e) => {
                const btn = e.target.closest('.pg-btn');
                if (btn) loadScanList(+btn.dataset.page);
            });

            const onLogin = () => loadScanList(1);
            const onLogout = () => { scanList.hidden = true; };
            document.addEventListener('auth:login', onLogin);
            document.addEventListener('auth:logout', onLogout);

            if (Auth.isLoggedIn()) loadScanList(1);
            updateCount();

            // Dọn dẹp khi rời công cụ
            return () => {
                active = false;
                document.removeEventListener('auth:login', onLogin);
                document.removeEventListener('auth:logout', onLogout);
                lastQrInstance = null;
            };
        }
    });
})();
