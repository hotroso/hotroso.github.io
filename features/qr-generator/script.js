// QR Generator
(function () {
    const CLIENT_KEY = 'qr_client_id';
    const MAX_RECOMMENDED = 1024;

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

    Tools.register('qr-generator', {
        init(root) {
            const input = root.querySelector('#qr-content');
            const form = root.querySelector('#qr-generation-form');
            const countEl = root.querySelector('#countchars');
            const errorEl = root.querySelector('#qr-error');
            const qrBox = root.querySelector('#qr-code');
            const downloadBtn = root.querySelector('#qr-download');
            const scanList = root.querySelector('#qr-scan-list');
            const tableWrap = root.querySelector('#scan-table-wrap');
            const pagination = root.querySelector('#scan-pagination');
            let currentPage = 1;
            let active = true;

            const setError = (msg) => {
                errorEl.textContent = msg || '';
                errorEl.hidden = !msg;
                input.setAttribute('aria-invalid', msg ? 'true' : 'false');
            };
            const updateCount = () => {
                countEl.textContent = input.value.length.toLocaleString('vi-VN');
            };

            function render(text) {
                qrBox.innerHTML = '';
                new QRCode(qrBox, {
                    text, width: 400, height: 400,
                    colorDark: '#000000', colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
                qrBox.hidden = false;
                downloadBtn.hidden = false;
            }

            function generate() {
                setError('');
                const text = input.value.trim();
                if (!text) {
                    setError('Vui lòng nhập nội dung.');
                    input.focus();
                    return;
                }
                if (text.length > MAX_RECOMMENDED &&
                    !confirm(`Nội dung dài hơn ${MAX_RECOMMENDED} ký tự, mã QR có thể khó quét hoặc lỗi. Vẫn tiếp tục?`)) {
                    return;
                }
                try {
                    render(text);
                } catch (e) {
                    qrBox.hidden = true;
                    downloadBtn.hidden = true;
                    setError('Nội dung quá dài để tạo mã QR. Hãy rút ngắn và thử lại.');
                    return;
                }
                if (Auth.isLoggedIn()) sendToServer(text).then(() => loadScanList(1));
            }

            function download() {
                const canvas = qrBox.querySelector('canvas');
                const img = qrBox.querySelector('img');
                const url = canvas ? canvas.toDataURL('image/png') : img && img.src;
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
                    tableWrap.innerHTML = '<p class="text-danger">Không thể tải danh sách.</p>';
                    pagination.innerHTML = '';
                }
                scanList.hidden = false;
            }

            function renderTable(json) {
                if (!json.data || json.data.length === 0) {
                    tableWrap.innerHTML = '<p class="text-muted">Chưa có dữ liệu.</p>';
                    pagination.innerHTML = '';
                    return;
                }
                tableWrap.innerHTML = `<div class="table-wrap"><table class="scan-table">
                    <thead><tr><th>#</th><th>Nội dung QR</th><th>Thời gian</th></tr></thead>
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
            };
        }
    });
})();
