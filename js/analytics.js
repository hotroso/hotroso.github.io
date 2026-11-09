/*
 * Thống kê cho hotroso.github.io
 * - GA4 (G-M7150D92SJ) nạp trực tiếp bằng gtag.js -> KHÔNG tạo thêm tag GA4 trong GTM (sẽ bị đếm 2 lần).
 * - GTM (GTM-PFMDPDWD) vẫn được nạp để xác minh Search Console / dùng về sau.
 *
 * Trang là SPA (hash routing): đặt `window.GA_SPA = true` TRƯỚC khi nạp file này,
 * app.js gọi `window.trackPage(path, title)` mỗi lần đổi công cụ -> gửi page_view.
 */
(function () {
    var GA_ID = 'G-M7150D92SJ';
    var GTM_ID = 'GTM-PFMDPDWD';

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    window.trackPage = function () {};

    // Không đo khi chạy localhost hoặc mở file trực tiếp
    if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) return;

    function loadScript(src) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
    }

    // GA4
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    gtag('js', new Date());
    // SPA tự gửi page_view qua trackPage() để mỗi công cụ là một "trang" riêng
    gtag('config', GA_ID, { send_page_view: !window.GA_SPA });

    // GTM
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID);

    window.trackPage = function (path, title) {
        if (!window.GA_SPA) return;
        gtag('event', 'page_view', {
            page_location: location.origin + path,
            page_path: path,
            page_title: title || document.title
        });
    };

    // Đo nút bấm trong công cụ (chỉ nhãn nút, không thu nội dung người dùng nhập).
    // Click link ra ngoài đã được GA4 Enhanced Measurement tự đo.
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('button');
        if (!el) return;
        var label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
        if (label) {
            gtag('event', 'tool_action', {
                action_label: label,
                tool: location.hash.slice(1) || 'home'
            });
        }
    });
})();
