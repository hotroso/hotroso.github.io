// Dùng chung cho 5 công cụ Escape (Java, HTML, XML, SQL, CSV). Cần js/escape-utils.js.
(function () {
    const configs = {
        'escape-java': {
            placeholder: 'Enter a Java/JavaScript string to escape or unescape…',
            escape: v => EscapeUtils.escapeJava(v),
            unescape: v => EscapeUtils.unescapeJava(v),
            example: 'Hello "World"\nPath: C:\\temp\\file.txt'
        },
        'escape-html': {
            placeholder: 'Enter HTML to escape or unescape…',
            escape: v => EscapeUtils.escapeHtml(v),
            unescape: v => EscapeUtils.unescapeHtml(v),
            example: '<a href="https://example.com?a=1&b=2">Tom & Jerry\'s</a>'
        },
        'escape-xml': {
            placeholder: 'Enter XML to escape or unescape…',
            escape: v => EscapeUtils.escapeXml(v),
            unescape: v => EscapeUtils.unescapeXml(v),
            example: '<note type="reminder">Buy milk & bread</note>'
        },
        'escape-sql': {
            placeholder: 'Enter a string for a SQL literal…',
            escape: v => EscapeUtils.escapeSql(v),
            unescape: v => EscapeUtils.unescapeSql(v),
            example: "O'Reilly's Book"
        },
        'escape-csv': {
            placeholder: 'Enter a value for a CSV field…',
            escape: v => EscapeUtils.escapeCsv(v),
            unescape: v => EscapeUtils.unescapeCsv(v),
            example: 'New York, USA "the big apple"'
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
