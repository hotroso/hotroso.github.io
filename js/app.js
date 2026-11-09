// Hub DevTools: menu theo nhóm, điều hướng bằng #hash, nạp công cụ theo yêu cầu.
// Mỗi công cụ đăng ký init(root, feature) qua Tools.register (xem js/ui.js).
(() => {
    const pageTitle = document.getElementById('page-title');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const contentArea = document.getElementById('content');
    const searchInput = document.getElementById('sidebar-search');
    const metaDesc = document.querySelector('meta[name="description"]');

    const HOME_TITLE = 'DevTools - Công Cụ Hỗ Trợ Lập Trình Viên Online Miễn Phí';
    const HOME_DESC = metaDesc ? metaDesc.content : '';
    const RECENT_KEY = 'recent_tools';
    const RECENT_MAX = 4;

    const homeHTML = contentArea.innerHTML;

    let features = [];
    let groups = [];
    const aliases = {};
    let currentFeature = null;   // id công cụ đang mở, 'home', hoặc null
    let cleanup = null;          // hàm dọn dẹp của công cụ đang mở
    let navToken = 0;            // chống chạy đua khi bấm chuyển công cụ liên tục

    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Bỏ dấu tiếng Việt để tìm "ma hoa" vẫn ra "Mã hóa"
    const normalize = (s) => String(s || '').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

    // ── Nạp tài nguyên ───────────────────────────────────────────────────
    const loadedStyles = new Set();
    const loadedScripts = new Map();

    const loadCSS = (url) => {
        if (loadedStyles.has(url)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        loadedStyles.add(url);
    };

    const loadJS = (url) => {
        if (loadedScripts.has(url)) return loadedScripts.get(url);
        const p = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => {
                loadedScripts.delete(url);
                script.remove();
                reject(new Error('Không tải được ' + url));
            };
            document.body.appendChild(script);
        });
        loadedScripts.set(url, p);
        return p;
    };

    // ── Công cụ dùng gần đây ─────────────────────────────────────────────
    const getRecent = () => {
        try {
            const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
            return Array.isArray(list) ? list.filter(id => features.some(f => f.id === id)) : [];
        } catch {
            return [];
        }
    };

    const addRecent = (id) => {
        const list = [id, ...getRecent().filter(x => x !== id)].slice(0, RECENT_MAX);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* bỏ qua */ }
        renderRecent();
    };

    // ── Menu ─────────────────────────────────────────────────────────────
    const menuItemHTML = (id, icon, name, href, search) =>
        `<a class="menu-item" href="${href}" data-feature="${esc(id)}" data-search="${esc(search)}">
            <span class="menu-icon" aria-hidden="true">${icon}</span>
            <span class="menu-label">${esc(name)}</span>
        </a>`;

    const featureItemHTML = (f) =>
        menuItemHTML(f.id, f.icon, f.name, `#${f.id}`, normalize(`${f.name} ${f.id} ${f.keywords || ''}`));

    const buildMenu = () => {
        let html = menuItemHTML('home', '🏠', 'Trang chủ', '#', normalize('trang chu home'));
        html += '<div class="menu-group" data-group="recent" hidden><div class="menu-group-title">Gần đây</div><div class="menu-group-items"></div></div>';
        groups.forEach(g => {
            const items = features.filter(f => f.group === g.id);
            if (!items.length) return;
            html += `<div class="menu-group" data-group="${esc(g.id)}">
                <div class="menu-group-title">${esc(g.name)}</div>
                <div class="menu-group-items">${items.map(featureItemHTML).join('')}</div>
            </div>`;
        });
        html += '<p class="menu-empty" hidden>Không tìm thấy công cụ phù hợp</p>';
        sidebarMenu.innerHTML = html;
        renderRecent();

        // Đóng sidebar trên mobile sau khi chọn (điều hướng do href="#..." đảm nhận)
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item')) closeSidebar();
        });
    };

    const renderRecent = () => {
        const group = sidebarMenu.querySelector('[data-group="recent"]');
        if (!group) return;
        const list = getRecent();
        group.querySelector('.menu-group-items').innerHTML = list
            .map(id => featureItemHTML(features.find(f => f.id === id)))
            .join('');
        group.hidden = list.length === 0 || !!(searchInput && searchInput.value.trim());
        setActiveMenu(currentFeature);
    };

    const setActiveMenu = (id) => {
        sidebarMenu.querySelectorAll('.menu-item').forEach(mi => {
            const active = mi.dataset.feature === id;
            mi.classList.toggle('active', active);
            if (active) mi.setAttribute('aria-current', 'page');
            else mi.removeAttribute('aria-current');
        });
    };

    const filterMenu = () => {
        const q = normalize(searchInput.value.trim());
        let visible = 0;
        sidebarMenu.querySelectorAll('.menu-group').forEach(group => {
            if (group.dataset.group === 'recent') {
                group.hidden = !!q || getRecent().length === 0;
                return;
            }
            let groupVisible = 0;
            group.querySelectorAll('.menu-item').forEach(item => {
                const show = !q || item.dataset.search.includes(q);
                item.hidden = !show;
                if (show) groupVisible++;
            });
            group.hidden = groupVisible === 0;
            visible += groupVisible;
        });
        const home = sidebarMenu.querySelector('.menu-item[data-feature="home"]');
        if (home) home.hidden = !!q;
        sidebarMenu.querySelector('.menu-empty').hidden = visible > 0;
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterMenu);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // Mở công cụ đầu tiên khớp kết quả tìm kiếm
                const first = [...sidebarMenu.querySelectorAll('.menu-group:not([data-group="recent"]) .menu-item')]
                    .find(item => !item.hidden && !item.closest('.menu-group').hidden);
                if (first) {
                    e.preventDefault();
                    location.hash = first.dataset.feature;
                    closeSidebar();
                }
            } else if (e.key === 'Escape') {
                searchInput.value = '';
                filterMenu();
            }
        });
    }

    // ── Sidebar trên mobile ──────────────────────────────────────────────
    const setSidebar = (open) => {
        document.querySelector('.sidebar')?.classList.toggle('active', open);
        document.getElementById('sidebar-overlay')?.classList.toggle('active', open);
        document.getElementById('menu-toggle')?.setAttribute('aria-expanded', String(open));
    };
    const closeSidebar = () => setSidebar(false);
    window.toggleSidebar = () => setSidebar(!document.querySelector('.sidebar')?.classList.contains('active'));

    // ── Điều hướng ───────────────────────────────────────────────────────
    const teardown = () => {
        if (cleanup) {
            try { cleanup(); } catch (e) { console.warn('Cleanup failed', e); }
        }
        cleanup = null;
    };

    const resolveId = (hash) => {
        if (!hash) return null;
        if (features.some(f => f.id === hash)) return hash;
        return aliases[hash] || null;
    };

    const route = () => {
        const hash = decodeURIComponent(location.hash.slice(1));
        const id = resolveId(hash);
        if (id && id !== hash) {
            // Link cũ (vd. #base64-encode) -> chuyển sang công cụ đã gộp
            history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
        }
        if (id) switchFeature(id);
        else showHome();
    };

    const showHome = () => {
        if (currentFeature === 'home') return;
        navToken++;
        teardown();
        contentArea.innerHTML = homeHTML;

        const grid = contentArea.querySelector('.features-grid');
        if (grid) {
            const wrap = document.createElement('div');
            wrap.className = 'home-groups';
            wrap.innerHTML = groups.map(g => {
                const items = features.filter(f => f.group === g.id);
                if (!items.length) return '';
                return `<section class="home-group">
                    <h2 class="home-group-title">${esc(g.name)}</h2>
                    <div class="features-grid">${items.map(f => `
                        <a class="feature-card" href="#${esc(f.id)}">
                            <span class="icon" aria-hidden="true">${f.icon}</span>
                            <h3>${esc(f.name)}</h3>
                            <p>${esc(f.desc)}</p>
                        </a>`).join('')}
                    </div>
                </section>`;
            }).join('');
            grid.replaceWith(wrap);
        }

        currentFeature = 'home';
        setActiveMenu('home');
        pageTitle.textContent = 'Trang chủ';
        document.title = HOME_TITLE;
        if (metaDesc) metaDesc.content = HOME_DESC;
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        contentArea.scrollTop = 0;
        window.trackPage?.(location.pathname, HOME_TITLE);
    };

    const showLoadError = (feature) => {
        contentArea.innerHTML = `<div class="card load-error" role="alert">
            <p>Không tải được công cụ <strong>${esc(feature.name)}</strong>. Vui lòng kiểm tra kết nối mạng.</p>
            <button type="button" class="btn" data-retry>Thử lại</button>
        </div>`;
        contentArea.querySelector('[data-retry]').addEventListener('click', () => switchFeature(feature.id));
    };

    const switchFeature = async (featureId) => {
        const feature = features.find(f => f.id === featureId);
        if (!feature || currentFeature === featureId) return;
        const token = ++navToken;
        setActiveMenu(featureId);
        pageTitle.textContent = feature.name;

        let html;
        try {
            if (feature.css) loadCSS(feature.css);
            for (const lib of feature.libs || []) await loadJS(lib);
            const res = await fetch(feature.html);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            html = await res.text();
            if (feature.js) await loadJS(feature.js);
        } catch (err) {
            if (token !== navToken) return;
            console.warn(err);
            teardown();
            currentFeature = null;
            showLoadError(feature);
            return;
        }
        if (token !== navToken) return; // người dùng đã chuyển sang công cụ khác

        teardown();
        contentArea.innerHTML = `<section class="feature-section" id="tool-${esc(feature.id)}">
            <p class="tool-desc">${esc(feature.desc)}</p>
            ${html}
        </section>`;
        currentFeature = featureId;

        const def = window.Tools && Tools.get(featureId);
        if (def && typeof def.init === 'function') {
            try {
                const result = def.init(contentArea.firstElementChild, feature);
                cleanup = typeof result === 'function' ? result : null;
            } catch (e) {
                console.error(e);
                UI.toast('Công cụ gặp lỗi khi khởi động', 'error');
            }
        }

        document.title = feature.title || `${feature.name} - DevTools`;
        if (metaDesc) metaDesc.content = feature.desc || HOME_DESC;
        contentArea.scrollTop = 0;
        addRecent(featureId);
        window.trackPage?.(`${location.pathname}#${featureId}`, document.title);
    };

    // ── Khởi động ────────────────────────────────────────────────────────
    const init = async () => {
        try {
            const res = await fetch('features.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            features = data.features || [];
            groups = data.groups || [];
        } catch (e) {
            console.error(e);
            contentArea.insertAdjacentHTML('afterbegin',
                '<div class="card load-error" role="alert">Không tải được danh sách công cụ. Vui lòng tải lại trang.</div>');
            return;
        }
        features.forEach(f => (f.aliases || []).forEach(a => { aliases[a] = f.id; }));
        buildMenu();
        window.addEventListener('hashchange', route);
        route();
    };

    init();
})();
