// Dynamic Feature Loading
let features = [];
let currentFeature = null;
let qrFilesInitialized = false;

const pageTitle = document.getElementById('page-title');
const sidebarMenu = document.getElementById('sidebar-menu');
const contentArea = document.getElementById('content');

const loadFeatures = async () => {
    const response = await fetch('features.json');
    const data = await response.json();
    features = data.features;
    
    // Preload shared escape utils for escape features
    if (data.sharedLibs?.escape) {
        await loadJS(data.sharedLibs.escape);
    }
    
    // Build menu: "Trang chủ" + các công cụ (dùng thẻ <a> để bàn phím/Tab hoạt động)
    const addMenuItem = (id, icon, name, href, onClick) => {
        const menuItem = document.createElement('a');
        menuItem.className = 'menu-item';
        menuItem.href = href;
        menuItem.dataset.feature = id;
        menuItem.dataset.name = name.toLowerCase();
        menuItem.innerHTML = `<span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-label">${name}</span>`;
        menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
            closeSidebar();
        });
        sidebarMenu.appendChild(menuItem);
    };
    addMenuItem('home', '🏠', 'Trang chủ', '#', showHome);
    features.forEach(feature => {
        addMenuItem(feature.id, feature.icon, feature.name, `#${feature.id}`, () => switchFeature(feature.id));
    });

    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'menu-empty';
    emptyMsg.hidden = true;
    emptyMsg.textContent = 'Không tìm thấy công cụ phù hợp';
    sidebarMenu.appendChild(emptyMsg);

    // Tìm nhanh công cụ trong sidebar
    const searchInput = document.getElementById('sidebar-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            let visible = 0;
            sidebarMenu.querySelectorAll('.menu-item').forEach(item => {
                const show = !q || item.dataset.name.includes(q) || item.dataset.feature.includes(q);
                item.hidden = !show;
                if (show) visible++;
            });
            emptyMsg.hidden = visible > 0;
        });
    }

    // Màn hình đầu tiên: công cụ theo hash, nếu không có thì hiện Trang chủ
    const hash = window.location.hash.slice(1);
    if (hash && features.find(f => f.id === hash)) switchFeature(hash);
    else showHome();
};

// ── Trang chủ: lưới tất cả công cụ ──────────────────────────────────────────
const homeHTML = contentArea.innerHTML;
let homeShown = false;
const HOME_TITLE = 'DevTools - Công Cụ Hỗ Trợ Lập Trình Viên Online Miễn Phí';

const showHome = () => {
    if (homeShown) return;
    homeShown = true;
    contentArea.innerHTML = homeHTML;

    const grid = contentArea.querySelector('.features-grid');
    if (grid) {
        grid.innerHTML = '';
        features.forEach(f => {
            const card = document.createElement('a');
            card.className = 'feature-card';
            card.href = `#${f.id}`;
            card.innerHTML = `<span class="icon" aria-hidden="true">${f.icon}</span>
                <h3>${f.name}</h3>
                <p>${seoDescriptions[f.id] || ''}</p>`;
            card.addEventListener('click', (e) => {
                e.preventDefault();
                switchFeature(f.id);
            });
            grid.appendChild(card);
        });
    }

    document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
    const homeItem = document.querySelector('[data-feature="home"]');
    homeItem?.classList.add('active');
    homeItem?.setAttribute('aria-current', 'page');

    pageTitle.textContent = 'Trang chủ';
    document.title = HOME_TITLE;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    currentFeature = null;
    contentArea.scrollTop = 0;
    window.trackPage?.(window.location.pathname, HOME_TITLE);
};

const closeSidebar = () => {
    document.querySelector('.sidebar')?.classList.remove('active');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
};

const loadedStyles = new Set();
const loadedScripts = new Set();

const loadCSS = (url) => {
    if (loadedStyles.has(url)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    loadedStyles.add(url);
};

const loadJS = (url) => {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(url)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            loadedScripts.add(url);
            resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

const switchFeature = async (featureId) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature || currentFeature === featureId) return;
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(mi => {
        mi.classList.remove('active');
        mi.removeAttribute('aria-current');
    });
    const activeItem = document.querySelector(`[data-feature="${featureId}"]`);
    activeItem?.classList.add('active');
    activeItem?.setAttribute('aria-current', 'page');
    
    // Load CSS if exists
    if (feature.css) loadCSS(feature.css);
    
    // Load libraries if exists
    if (feature.libs) {
        for (const lib of feature.libs) {
            await loadJS(lib);
        }
    }
    
    // Load shared escape utils for escape features
    if (featureId.startsWith('escape-') && !loadedScripts.has('js/escape-utils.js')) {
        await loadJS('js/escape-utils.js');
    }
    
    // Load HTML
    let html;
    try {
        const response = await fetch(feature.html);
        if (!response.ok) throw new Error(response.status);
        html = await response.text();
    } catch (err) {
        homeShown = false;
        currentFeature = null;
        contentArea.innerHTML = '<div class="card load-error">Không tải được công cụ này. Vui lòng kiểm tra kết nối mạng và thử lại.</div>';
        return;
    }
    contentArea.innerHTML = `<section id="${featureId}" class="feature-section active">${html}</section>`;
    
    pageTitle.textContent = feature.name;
    
    // Update SEO meta tags dynamically
    updateSEO(feature);
    
    homeShown = false;
    window.location.hash = featureId;
    currentFeature = featureId;
    contentArea.scrollTop = 0;
    window.trackPage?.(`${window.location.pathname}#${featureId}`, document.title);
    
    // Load and execute JS if exists
    if (feature.js) {
        await loadJS(feature.js);
    }
};

const seoTitles = {
        'qr-generator': 'Tạo Mã QR Code Online Miễn Phí - QR Generator',
        'qr-files': 'Đọc QR Code Từ File - QR Scanner Online',
        'escape-java': 'Escape Java String Online - Java Escape Tool',
        'escape-html': 'Escape HTML Online - HTML Escape Tool',
        'escape-xml': 'Escape XML Online - XML Escape Tool',
        'escape-sql': 'Escape SQL Online - SQL Escape Tool',
        'escape-csv': 'Escape CSV Online - CSV Escape Tool',
        'text-formatter': 'Text Formatter Online - Định Dạng Văn Bản',
        'random-generator': 'Random Generator Online - Tạo Chuỗi Ngẫu Nhiên',
        'json-formatter': 'JSON Formatter Online - Format & Validate JSON',
        'base64-encode': 'Base64 Encode Online - Mã Hóa Base64',
        'base64-decode': 'Base64 Decode Online - Giải Mã Base64',
        'url-encode': 'URL Encode Online - Mã Hóa URL',
        'url-decode': 'URL Decode Online - Giải Mã URL',
        'js-minify': 'JS Minify Online - Nén JavaScript',
        'js-beautify': 'JS Beautify Online - Định Dạng JavaScript',
        'css-minify': 'CSS Minify Online - Nén CSS',
        'css-beautify': 'CSS Beautify Online - Định Dạng CSS'
    };
    
    const seoDescriptions = {
        'qr-generator': 'Tạo mã QR code miễn phí, tùy chỉnh màu sắc và kích thước. Hỗ trợ text, URL, vCard, WiFi. Tải xuống PNG chất lượng cao.',
        'qr-files': 'Đọc và giải mã QR code từ file ảnh. Xử lý hàng loạt, xuất kết quả nhanh chóng. 100% miễn phí.',
        'escape-java': 'Escape và unescape Java string online. Xử lý ký tự đặc biệt, unicode. Công cụ thiết yếu cho lập trình viên Java.',
        'escape-html': 'Escape và unescape HTML entities online. Chuyển đổi ký tự đặc biệt HTML an toàn.',
        'escape-xml': 'Escape và unescape XML online. Xử lý ký tự đặc biệt XML, CDATA. Miễn phí và nhanh chóng.',
        'escape-sql': 'Escape SQL string online. Bảo vệ khỏi SQL injection, xử lý single quote, double quote.',
        'escape-csv': 'Escape CSV online. Xử lý comma, quote trong CSV file. Công cụ miễn phí cho data processing.',
        'text-formatter': 'Định dạng văn bản online: Capitalize, swap case, word wrap, lấy chữ cái đầu. Công cụ miễn phí.',
        'random-generator': 'Tạo chuỗi ngẫu nhiên online: Alphanumeric, alphabetic, numeric, password, UUID. Công cụ miễn phí.',
        'json-formatter': 'Format, minify, validate và escape JSON online. Công cụ JSON miễn phí cho developer.',
        'base64-encode': 'Mã hóa text thành Base64 online. Hỗ trợ UTF-8, Unicode. Công cụ miễn phí.',
        'base64-decode': 'Giải mã Base64 thành text online. Hỗ trợ UTF-8, Unicode. Công cụ miễn phí.',
        'url-encode': 'Mã hóa URL/text thành URL encoded. Encode query string, parameters. Công cụ miễn phí.',
        'url-decode': 'Giải mã URL encoded thành text. Decode query string, parameters. Công cụ miễn phí.',
        'js-minify': 'Nén JavaScript online với Terser. Giảm kích thước file JS. Tối ưu performance website.',
        'js-beautify': 'Định dạng JavaScript code đẹp. Format JS code dễ đọc. Công cụ miễn phí.',
        'css-minify': 'Nén CSS online với CleanCSS. Giảm kích thước file CSS. Tối ưu performance.',
        'css-beautify': 'Định dạng CSS code đẹp. Format CSS dễ đọc. Công cụ miễn phí.'
    };
    
const updateSEO = (feature) => {
    document.title = seoTitles[feature.id] || `${feature.name} - DevTools`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = seoDescriptions[feature.id] || `${feature.name} - Công cụ online miễn phí`;
    }
};

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && features.find(f => f.id === hash)) {
        switchFeature(hash);
    } else if (!hash) {
        showHome();
    }
});

loadFeatures();

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}


