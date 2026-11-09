/*
 * Google Tag Manager cho hotroso.github.io.
 * GA4 và Search Console được cấu hình bên trong container GTM (không cần sửa code).
 *
 * Trang SPA (hash routing) đặt `window.GA_SPA = true` TRƯỚC khi nạp file này,
 * rồi gọi `window.trackPage(path, title)` mỗi lần đổi màn hình.
 * Mỗi lần gọi sẽ đẩy sự kiện `virtual_page_view` vào dataLayer.
 */
(function () {
    var GTM_ID = 'GTM-PFMDPDWD';

    window.dataLayer = window.dataLayer || [];
    window.trackPage = function () {};

    // Không đo khi chạy localhost hoặc mở file trực tiếp
    if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) return;

    // Đoạn nạp GTM chuẩn
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);

    window.trackPage = function (path, title) {
        if (!window.GA_SPA) return;
        window.dataLayer.push({
            event: 'virtual_page_view',
            page_path: path,
            page_title: title || document.title,
            page_location: location.origin + path
        });
    };

    // Đo thao tác: bấm nút công cụ và click link ra ngoài (không thu nội dung người dùng nhập)
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('button, a[href^="http"]');
        if (!el) return;
        if (el.tagName === 'A') {
            if (el.hostname && el.hostname !== location.hostname) {
                window.dataLayer.push({ event: 'outbound_click', link_url: el.href });
            }
            return;
        }
        var label = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40);
        if (label) {
            window.dataLayer.push({
                event: 'tool_action',
                action_label: label,
                tool: location.hash.slice(1) || 'home'
            });
        }
    });
})();
