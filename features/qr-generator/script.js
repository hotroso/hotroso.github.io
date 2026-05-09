// QR Generator feature script
(function() {
    const API_BASE = 'https://3093baeeb9.hotrogiaiphapso.info';
    const CLIENT_ID_KEY = 'qr_client_id';

    let qrCode = null;
    let saveEnabled = false;
    let currentPage = 1;

    const qrContentInput = document.getElementById('qr-content');
    const qrGenerationForm = document.getElementById('qr-generation-form');
    const countchars = document.getElementById('countchars');
    const saveCheckbox = document.getElementById('save-to-server');
    const privacyModal = document.getElementById('privacy-modal');
    const scanList = document.getElementById('qr-scan-list');

    // Restore saved preference
    saveEnabled = localStorage.getItem('qr_save_enabled') === '1';
    saveCheckbox.checked = saveEnabled;
    if (saveEnabled) loadScanList(1);

    function getOrCreateClientId() {
        let id = localStorage.getItem(CLIENT_ID_KEY);
        if (!id) {
            id = 'cid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(CLIENT_ID_KEY, id);
        }
        return id;
    }

    saveCheckbox.addEventListener('change', () => {
        if (saveCheckbox.checked) {
            privacyModal.style.display = 'flex';
        } else {
            saveEnabled = false;
            localStorage.setItem('qr_save_enabled', '0');
            scanList.style.display = 'none';
        }
    });

    document.getElementById('privacy-accept').addEventListener('click', () => {
        saveEnabled = true;
        localStorage.setItem('qr_save_enabled', '1');
        privacyModal.style.display = 'none';
        loadScanList(1);
    });

    document.getElementById('privacy-decline').addEventListener('click', () => {
        saveEnabled = false;
        saveCheckbox.checked = false;
        localStorage.setItem('qr_save_enabled', '0');
        privacyModal.style.display = 'none';
        scanList.style.display = 'none';
    });

    qrContentInput.addEventListener('input', () => {
        countchars.textContent = qrContentInput.value.length;
    });

    qrGenerationForm.addEventListener('submit', async (event) => {
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

        if (saveEnabled) {
            sendToServer(qrContent).then(() => loadScanList(1));
        }
    });

    async function sendToServer(qrContent) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            await fetch(API_BASE + '/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ctrl.signal,
                body: JSON.stringify({
                    client_id: getOrCreateClientId(),
                    qr_content: qrContent,
                    user_agent: navigator.userAgent,
                    referer: document.referrer,
                    language: navigator.language,
                    screen: screen.width + 'x' + screen.height,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });
            clearTimeout(timer);
        } catch (e) { console.warn('Save failed', e); }
    }

    async function loadScanList(page) {
        currentPage = page;
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            const res = await fetch(API_BASE + '/list.php?page=' + page, { signal: ctrl.signal });
            clearTimeout(timer);
            const json = await res.json();
            renderTable(json);
            scanList.style.display = 'block';
        } catch (e) {
            console.warn('Load list failed', e);
            document.getElementById('scan-table-wrap').innerHTML = '<p style="color:#e74c3c;font-size:13px">Không thể tải danh sách. Server có thể đang bận.</p>';
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
            <thead><tr><th>#</th><th>Nội dung QR</th><th>IP</th><th>Ngôn ngữ</th><th>Màn hình</th><th>Thời gian</th></tr></thead>
            <tbody>${json.data.map((r, i) => `<tr>
                <td>${(currentPage - 1) * json.per_page + i + 1}</td>
                <td class="qr-content-cell" title="${escHtml(r.qr_content)}">${escHtml(r.qr_content.length > 60 ? r.qr_content.slice(0, 60) + '…' : r.qr_content)}</td>
                <td>${escHtml(r.ip)}</td>
                <td>${escHtml(r.language)}</td>
                <td>${escHtml(r.screen)}</td>
                <td>${escHtml(r.created_at)}</td>
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

    function escHtml(str) {
        return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
