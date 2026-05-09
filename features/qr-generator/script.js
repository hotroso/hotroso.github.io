// QR Generator feature script
(function() {
    const API_BASE   = 'https://3093baeeb9.hotrogiaiphapso.info';
    const CLIENT_KEY = 'qr_client_id';

    let qrCode      = null;
    let currentPage = 1;

    const qrContentInput  = document.getElementById('qr-content');
    const qrGenerationForm = document.getElementById('qr-generation-form');
    const countchars      = document.getElementById('countchars');
    const scanList        = document.getElementById('qr-scan-list');

    function getClientId() {
        let id = localStorage.getItem(CLIENT_KEY);
        if (!id) {
            id = 'cid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(CLIENT_KEY, id);
        }
        return id;
    }

    // Load list nếu đã login
    if (Auth.isLoggedIn()) loadScanList(1);

    // Khi login/logout từ widget → cập nhật list
    document.addEventListener('auth:login',  () => loadScanList(1));
    document.addEventListener('auth:logout', () => { scanList.style.display = 'none'; });

    qrContentInput.addEventListener('input', () => {
        countchars.textContent = qrContentInput.value.length;
    });

    qrGenerationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const qrContent = qrContentInput.value.trim();

        if (!qrContent) { alert('Vui lòng nhập nội dung!'); return; }
        if (qrContent.length > 1024) {
            if (!confirm('Nội dung vượt quá 1024 ký tự, QR code có thể bị lỗi. Bạn có muốn tiếp tục?')) return;
        }

        if (qrCode == null) {
            qrCode = new QRCode('qr-code', {
                text: qrContent, width: 400, height: 400,
                colorDark: '#000000', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrCode.makeCode(qrContent);
        }

        if (Auth.isLoggedIn()) {
            sendToServer(qrContent).then(() => loadScanList(1));
        }
    });

    async function sendToServer(qrContent) {
        try {
            const ctrl  = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            await Auth.authFetch('/qr/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ctrl.signal,
                body: JSON.stringify({
                    client_id:  getClientId(),
                    qr_content: qrContent,
                    user_agent: navigator.userAgent,
                    referer:    document.referrer,
                    language:   navigator.language,
                    screen:     screen.width + 'x' + screen.height,
                    timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });
            clearTimeout(timer);
        } catch (e) { console.warn('Save failed', e); }
    }

    async function loadScanList(page) {
        if (!Auth.isLoggedIn()) return;
        currentPage = page;
        try {
            const ctrl  = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            const res   = await Auth.authFetch('/qr/list?page=' + page, { signal: ctrl.signal });
            clearTimeout(timer);
            const json  = await res.json();
            renderTable(json);
            scanList.style.display = 'block';
        } catch (e) {
            console.warn('Load list failed', e);
            document.getElementById('scan-table-wrap').innerHTML = '<p style="color:#e74c3c;font-size:13px">Không thể tải danh sách.</p>';
            scanList.style.display = 'block';
        }
    }

    function renderTable(json) {
        const wrap = document.getElementById('scan-table-wrap');
        if (!json.data || json.data.length === 0) {
            wrap.innerHTML = '<p style="color:#888">Chưa có dữ liệu.</p>';
            document.getElementById('scan-pagination').innerHTML = '';
            return;
        }
        wrap.innerHTML = `<table class="scan-table">
            <thead><tr><th>#</th><th>Nội dung QR</th><th>Thời gian</th></tr></thead>
            <tbody>${json.data.map((r, i) => `<tr>
                <td>${(currentPage - 1) * json.per_page + i + 1}</td>
                <td class="qr-content-cell" title="${esc(r.qr_content)}">${esc(r.qr_content.length > 60 ? r.qr_content.slice(0, 60) + '…' : r.qr_content)}</td>
                <td>${esc(r.created_at)}</td>
            </tr>`).join('')}</tbody>
        </table>`;

        const pg = document.getElementById('scan-pagination');
        if (json.total_pages <= 1) { pg.innerHTML = ''; return; }
        let btns = '';
        for (let p = 1; p <= json.total_pages; p++) {
            btns += `<button class="pg-btn${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`;
        }
        pg.innerHTML = btns;
        pg.querySelectorAll('.pg-btn').forEach(btn => {
            btn.addEventListener('click', () => loadScanList(+btn.dataset.page));
        });
    }

    function esc(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
