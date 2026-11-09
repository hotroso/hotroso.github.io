// Dùng chung cho 5 công cụ Escape (Java, HTML, XML, SQL, CSV). Cần js/escape-utils.js.
(function () {
    const configs = {
        'escape-java': {
            placeholder: 'Nhập chuỗi Java/JavaScript cần escape hoặc unescape...',
            escape: v => EscapeUtils.escapeJava(v),
            unescape: v => EscapeUtils.unescapeJava(v),
            example: 'Xin chào "Việt Nam"\nĐường dẫn: C:\\temp\\file.txt'
        },
        'escape-html': {
            placeholder: 'Nhập HTML cần escape hoặc unescape...',
            escape: v => EscapeUtils.escapeHtml(v),
            unescape: v => EscapeUtils.unescapeHtml(v),
            example: '<a href="https://example.com?a=1&b=2">Tom & Jerry\'s</a>'
        },
        'escape-xml': {
            placeholder: 'Nhập XML cần escape hoặc unescape...',
            escape: v => EscapeUtils.escapeXml(v),
            unescape: v => EscapeUtils.unescapeXml(v),
            example: '<note type="reminder">Mua sữa & bánh mì</note>'
        },
        'escape-sql': {
            placeholder: 'Nhập chuỗi cần đưa vào câu lệnh SQL...',
            escape: v => EscapeUtils.escapeSql(v),
            unescape: v => EscapeUtils.unescapeSql(v),
            example: "O'Reilly's Book"
        },
        'escape-csv': {
            placeholder: 'Nhập giá trị cần đưa vào một ô CSV...',
            escape: v => EscapeUtils.escapeCsv(v),
            unescape: v => EscapeUtils.unescapeCsv(v),
            example: 'Hà Nội, Việt Nam "thủ đô"'
        }
    };

    Tools.register(Object.keys(configs), {
        init(root, feature) {
            const cfg = configs[feature.id];
            root.querySelector('[data-role="input"]').placeholder = cfg.placeholder;
            UI.transformTool(root, {
                example: cfg.example,
                actions: { escape: cfg.escape, unescape: cfg.unescape }
            });
        }
    });
})();
