// JSON Formatter: format, minify, validate, escape, unescape
(function () {
    function parse(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid JSON: ' + e.message);
        }
    }

    Tools.register('json-formatter', {
        init(root) {
            UI.transformTool(root, {
                example: '{"name":"Ada Lovelace","year":1815,"skills":["Mathematics","Programming"],"active":true}',
                actions: {
                    format: v => JSON.stringify(parse(v), null, 2),
                    minify: v => JSON.stringify(parse(v)),
                    validate: v => {
                        parse(v);
                        return { message: 'Valid JSON' };
                    },
                    // Chuyển văn bản thành nội dung chuỗi JSON (không gồm dấu nháy bao ngoài)
                    escape: v => JSON.stringify(v).slice(1, -1),
                    unescape: v => {
                        try {
                            return JSON.parse('"' + v + '"');
                        } catch {
                            throw new Error('Cannot unescape: unescaped quote or invalid backslash sequence.');
                        }
                    }
                }
            });
        }
    });
})();
